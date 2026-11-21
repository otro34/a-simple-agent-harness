#!/usr/bin/env node
// Preflight doctor for a-simple-agent-harness.
// Run from the project root: node .harness/bin/doctor.mjs [--json] [--hash] [--no-write]
// Reads .harness/config.json and .harness/deploy/targets.json, runs the checks,
// prints a table and writes .harness/state/preflight.json. Exit code 1 if any check fails.
// No dependencies: Node 18+ only.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const args = new Set(process.argv.slice(2));
const root = process.cwd();
const harnessDir = join(root, '.harness');
const configPath = join(harnessDir, 'config.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function configHash(config) {
  // `setup` changes when the launch is approved; it must not invalidate the preflight.
  const { setup, ...rest } = config;
  return createHash('sha256').update(stableStringify(rest)).digest('hex').slice(0, 16);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function fill(template, config) {
  return template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, path) => {
    const v = get(config, path);
    return v == null || v === '' ? match : String(v);
  });
}

function run(cmd) {
  const r = spawnSync('sh', ['-c', cmd], { cwd: root, encoding: 'utf8', timeout: 30000 });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

// ---------- config ----------
if (!existsSync(configPath)) {
  console.error('✖ .harness/config.json not found. Run the setup stage (harness-setup) first.');
  process.exit(1);
}
let config;
try {
  config = readJson(configPath);
} catch (e) {
  console.error(`✖ .harness/config.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (args.has('--hash')) {
  console.log(configHash(config));
  process.exit(0);
}

const results = [];
const add = (id, label, level, ok, hint = '', detail = '') =>
  results.push({ id, label, status: ok ? 'pass' : level, hint: ok ? '' : hint, detail });

// Static config checks (a light subset of config.schema.json, without dependencies).
const enums = {
  mode: ['supervised', 'auto'],
  'git.integration': ['pr', 'trunk'],
  'deploy.target': ['none', 'vercel', 'fly', 'railway', 'render', 'docker-vps', 'aws', 'gcp-cloud-run'],
  'deploy.strategy': ['end', 'per-milestone', 'per-story', undefined],
  'isolation.runner': ['native', 'command', undefined],
};
for (const [path, allowed] of Object.entries(enums)) {
  const v = get(config, path);
  add(`config:${path}`, `config ${path} = ${v ?? '(unset)'}`, 'fail', allowed.includes(v),
    `Set ${path} to one of: ${allowed.filter(Boolean).join(', ')}`);
}
for (const path of ['project.name', 'project.spec', 'project.storyPrefix', 'git.defaultBranch']) {
  const v = get(config, path);
  add(`config:${path}`, `config ${path}`, 'fail', typeof v === 'string' && v.length > 0, `Set ${path}`);
}
const spec = get(config, 'project.spec');
if (spec) add('spec', `Specification exists (${spec})`, 'fail', existsSync(join(root, spec)), `Write ${spec}`);
if (spec && existsSync(join(root, spec))) {
  add('spec-filled', 'Specification is not the empty template', 'warn',
    !readFileSync(join(root, spec), 'utf8').includes('# <Product name>'), `Write your specification in ${spec}`);
}

const profiles = config.profiles || [];
add('profiles', `Profiles: ${profiles.join(', ') || '(none)'}`, 'warn', profiles.length > 0,
  'Intake/setup should set profiles');
for (const p of profiles) {
  add(`profile:${p}`, `Profile file for ${p}`, 'fail', existsSync(join(harnessDir, 'profiles', `${p}.md`)),
    `Missing .harness/profiles/${p}.md`);
}

const verify = get(config, 'commands.verify');
add('commands.verify', 'commands.verify defined', 'warn', !!verify, 'Expected before bootstrap; required after it');
if (config.deploy?.target && config.deploy.target !== 'none') {
  add('commands.smoke', 'commands.smoke defined', 'warn', !!get(config, 'commands.smoke'),
    'Bootstrap must define commands.smoke for release verification');
}
if (config.mode === 'auto' && config.deploy?.target !== 'none') {
  const prodGate = config.gates?.production ?? 'auto';
  add('auto-production', `Production gate in auto mode: ${prodGate}`, 'warn', true);
}
if (config.limits?.allowPaidResources && !(config.limits?.monthlyBudgetUsd > 0)) {
  add('budget', 'Budget set when paid resources are allowed', 'fail', false,
    'Set limits.monthlyBudgetUsd > 0 or allowPaidResources false');
}

// ---------- command checks ----------
let targets = { common: [], targets: {} };
const targetsPath = join(harnessDir, 'deploy', 'targets.json');
if (existsSync(targetsPath)) targets = readJson(targetsPath);
else add('targets.json', '.harness/deploy/targets.json present', 'fail', false, 'Run harness sync');

const checks = [...(targets.common || []), ...((targets.targets || {})[config.deploy?.target] || [])];
for (const c of checks) {
  if (c.when) {
    const v = get(config, c.when);
    if (v == null || v === '') {
      add(c.id, `${c.label} (skipped: ${c.when} not set)`, 'warn', false, `Set ${c.when} in config`);
      continue;
    }
  }
  const cmd = fill(c.run, config);
  const r = run(cmd);
  const ok = c.expect === 'nonEmpty' ? r.code === 0 && r.out.length > 0 : r.code === 0;
  add(c.id, c.label, c.level || 'fail', ok, fill(c.hint || '', config));
}

// Isolation runner
if (config.isolation?.runner === 'command') {
  const cmd = config.isolation.command || '';
  const bin = cmd.trim().split(/\s+/)[0];
  const r = bin ? run(`command -v ${JSON.stringify(bin)}`) : { code: 1 };
  const meta = targets.isolation?.command || {};
  add('isolation-runner', `Isolation runner "${bin || '(empty)'}" available`, 'fail', r.code === 0,
    meta.hint || 'Install the agent CLI or use isolation.runner native');
  add('isolation-placeholder', 'isolation.command contains {prompt}', 'fail', cmd.includes('{prompt}'),
    'Add {prompt} where the prompt goes');
}

// Secrets: names only, presence in local env when declared as local-env
for (const s of config.secrets || []) {
  if ((s.where || []).includes('local-env')) {
    const inEnv = !!process.env[s.name];
    const inDotEnv = existsSync(join(root, '.env')) &&
      new RegExp(`^\\s*${s.name}\\s*=`, 'm').test(readFileSync(join(root, '.env'), 'utf8'));
    add(`secret:${s.name}`, `Secret ${s.name} available locally`, 'fail', inEnv || inDotEnv,
      `Set ${s.name} in .env or the environment (the value is never printed)`);
  }
}

// .gitignore protects state and env files
const gi = existsSync(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : '';
add('gitignore-state', '.gitignore ignores .harness/state/', 'fail', gi.includes('.harness/state'),
  'Run harness sync, or add .harness/state/ to .gitignore');
add('gitignore-env', '.gitignore ignores .env', 'fail', /^\.env/m.test(gi), 'Add .env and .env.* to .gitignore');

// ---------- output ----------
const failed = results.filter((r) => r.status === 'fail');
const warned = results.filter((r) => r.status === 'warn');
const summary = {
  ok: failed.length === 0,
  at: new Date().toISOString(),
  configHash: configHash(config),
  mode: config.mode,
  target: config.deploy?.target,
  counts: { pass: results.length - failed.length - warned.length, warn: warned.length, fail: failed.length },
  results,
};

if (!args.has('--no-write')) {
  mkdirSync(join(harnessDir, 'state'), { recursive: true });
  writeFileSync(join(harnessDir, 'state', 'preflight.json'), JSON.stringify(summary, null, 2) + '\n');
}

if (args.has('--json')) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  const icon = { pass: '✔', warn: '!', fail: '✖' };
  for (const r of results) {
    console.log(`${icon[r.status]} ${r.label}${r.hint ? `\n    → ${r.hint}` : ''}`);
  }
  console.log(
    `\n${summary.ok ? '✔ Preflight OK' : '✖ Preflight FAILED'} — ${summary.counts.pass} pass, ${summary.counts.warn} warn, ${summary.counts.fail} fail (config ${summary.configHash})`,
  );
}
process.exit(summary.ok ? 0 : 1);
