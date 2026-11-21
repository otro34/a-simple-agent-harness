#!/usr/bin/env node
// a-simple-agent-harness CLI
//
//   harness init   <dir> [--agents claude,antigravity] [--spec <file>] [--name <project>] [--force]
//   harness sync   <dir> [--agents ...]     update .harness/ and adapters, keep config/state/local
//   harness doctor <dir>                    run the preflight doctor in <dir>
//
// No dependencies: Node 18+.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, upsertBlock, AGENTS } from './lib/adapters.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '..', 'harness');
const pkg = JSON.parse(readFileSync(resolve(here, '..', 'package.json'), 'utf8'));

function parse(argv) {
  const [command, ...rest] = argv;
  const opts = { _: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        opts[key] = next;
        i++;
      } else opts[key] = true;
    } else opts._.push(a);
  }
  return { command, opts };
}

function help() {
  console.log(`a-simple-agent-harness ${pkg.version}

Usage:
  harness init   <dir> [--agents ${AGENTS.join(',')}] [--spec <file>] [--name <project>] [--force]
  harness sync   <dir> [--agents <list>]
  harness doctor <dir>

init    Install the harness into <dir> (created if missing): .harness/, adapters for the chosen
        agents, AGENTS.md, .gitignore block, docs/spec.md and .harness/config.json.
sync    Update .harness/ and regenerate adapters. Keeps .harness/config.json, .harness/state/,
        .harness/local/ and docs/. Agents default to config.agents.
doctor  Run the preflight checks in <dir> (same as: node .harness/bin/doctor.mjs).

Then open <dir> with your agent and run /harness-setup (or ask it to follow
.harness/stages/01-setup.md), and afterwards /harness-run.`);
}

function parseAgents(value, fallback) {
  if (!value || value === true) return fallback;
  const list = String(value).split(',').map((s) => s.trim()).filter(Boolean);
  for (const a of list) if (!AGENTS.includes(a)) throw new Error(`Unknown agent "${a}". Known: ${AGENTS.join(', ')}`);
  return list;
}

function copyHarness(target) {
  const dest = join(target, '.harness');
  // Copy everything from harness/; config.json, state/ and local/ do not exist in the source,
  // so they are never overwritten.
  cpSync(source, dest, { recursive: true, force: true });
  mkdirSync(join(dest, 'local'), { recursive: true });
  const localReadme = join(dest, 'local', 'README.md');
  if (!existsSync(localReadme)) {
    writeFileSync(
      localReadme,
      `# Project extensions\n\nA file here named like a stage (for example \`08-story-review.md\`) is read by that stage and\napplied on top of it. Use it for rules that only apply to this project. \`harness sync\` never\ntouches this folder.\n`,
    );
  }
  writeFileSync(join(dest, 'VERSION'), `${pkg.version}\n`);
}

function gitignore(target) {
  upsertBlock(
    join(target, '.gitignore'),
    '# harness:start',
    '# harness:end',
    ['.harness/state/', '.env', '.env.*', '!.env.example', '.qa-*/'].join('\n'),
  );
}

function registry() {
  return JSON.parse(readFileSync(join(source, 'stages.json'), 'utf8'));
}

function init(dir, opts) {
  const target = resolve(dir);
  mkdirSync(target, { recursive: true });
  if (existsSync(join(target, '.harness')) && !opts.force) {
    throw new Error(`${target}/.harness already exists. Use "harness sync ${dir}" to update it, or --force.`);
  }
  const agents = parseAgents(opts.agents, ['claude', 'antigravity', 'generic']);
  copyHarness(target);

  const configPath = join(target, '.harness', 'config.json');
  if (!existsSync(configPath)) {
    const config = JSON.parse(readFileSync(join(source, 'config.example.json'), 'utf8'));
    config.project.name = typeof opts.name === 'string' ? opts.name : basename(target);
    config.agents = Array.from(new Set([...agents, 'generic']));
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  }

  const specPath = join(target, 'docs', 'spec.md');
  mkdirSync(join(target, 'docs'), { recursive: true });
  if (typeof opts.spec === 'string') {
    copyFileSync(resolve(opts.spec), specPath);
  } else if (!existsSync(specPath)) {
    copyFileSync(join(source, 'templates', 'spec.md'), specPath);
  }

  gitignore(target);
  const written = generate(target, agents, registry());
  if (!existsSync(join(target, '.git'))) {
    spawnSync('git', ['init', '-b', 'main'], { cwd: target, stdio: 'ignore' });
  }

  console.log(`✔ Harness ${pkg.version} installed in ${target}`);
  console.log(`  .harness/ (canonical stages, profiles, deploy guides, templates)`);
  for (const f of written) console.log(`  ${f}`);
  console.log(`
Next:
  1. Write your specification in docs/spec.md${typeof opts.spec === 'string' ? ' (copied from ' + opts.spec + ')' : ''}.
  2. Open ${target} with your agent and run /harness-setup
     (agents without skills: "follow .harness/stages/01-setup.md").
  3. After the launch gate: /harness-run  (or "follow .harness/orchestrator.md").`);
}

function sync(dir, opts) {
  const target = resolve(dir);
  const configPath = join(target, '.harness', 'config.json');
  if (!existsSync(configPath)) throw new Error(`${target} has no .harness/config.json. Use "harness init" first.`);
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const agents = parseAgents(opts.agents, config.agents?.length ? config.agents : ['generic']);
  copyHarness(target);
  gitignore(target);
  if (opts.agents) {
    config.agents = Array.from(new Set([...agents, 'generic']));
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  }
  const written = generate(target, agents, registry());
  console.log(`✔ Harness synced to ${pkg.version} in ${target}`);
  for (const f of written) console.log(`  ${f}`);
}

function doctor(dir) {
  const target = resolve(dir || '.');
  const r = spawnSync(process.execPath, [join(target, '.harness', 'bin', 'doctor.mjs'), ...process.argv.slice(4)], {
    cwd: target,
    stdio: 'inherit',
  });
  process.exit(r.status ?? 1);
}

try {
  const { command, opts } = parse(process.argv.slice(2));
  const dir = opts._[0];
  switch (command) {
    case 'init':
      if (!dir) throw new Error('Missing <dir>.');
      init(dir, opts);
      break;
    case 'sync':
      if (!dir) throw new Error('Missing <dir>.');
      sync(dir, opts);
      break;
    case 'doctor':
      doctor(dir);
      break;
    case '--version':
    case 'version':
      console.log(pkg.version);
      break;
    default:
      help();
      if (command && command !== 'help' && command !== '--help') process.exit(1);
  }
} catch (e) {
  console.error(`✖ ${e.message}`);
  process.exit(1);
}
