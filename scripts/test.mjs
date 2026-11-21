#!/usr/bin/env node
// Self-test: validates JSON files, checks every link between harness files, and installs the
// harness into a temporary project to verify init, sync and the doctor. No dependencies.

import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const harness = join(root, 'harness');
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✔' : '✖'} ${msg}`);
  if (!cond) failures++;
};

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// 1 · JSON files parse
for (const f of walk(harness).filter((p) => p.endsWith('.json'))) {
  try {
    JSON.parse(readFileSync(f, 'utf8'));
    ok(true, `JSON ok: ${f.slice(root.length + 1)}`);
  } catch (e) {
    ok(false, `JSON invalid: ${f.slice(root.length + 1)}: ${e.message}`);
  }
}

// 2 · Every stage in the registry exists; every relative markdown link resolves
const registry = JSON.parse(readFileSync(join(harness, 'stages.json'), 'utf8'));
for (const c of registry.commands) ok(existsSync(join(harness, c.file)), `registry file exists: ${c.file}`);

for (const f of walk(harness).filter((p) => p.endsWith('.md'))) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\]\(([^)#\s]+\.(?:md|json|yml))(?:#[^)]*)?\)/g)) {
    const target = resolve(dirname(f), m[1]);
    ok(existsSync(target), `link ${f.slice(root.length + 1)} → ${m[1]}`);
  }
}

// 3 · Profiles and deploy guides have the sections stages rely on
const profileSections = ['## Read', '## Check before starting', '## When implementing', '## Review focus', '## QA', '## Release', '## Verify'];
for (const f of readdirSync(join(harness, 'profiles'))) {
  const t = readFileSync(join(harness, 'profiles', f), 'utf8');
  ok(profileSections.every((s) => t.includes(s)), `profile sections: ${f}`);
}
const deploySections = ['## Fits / Constraints', '## Options', '## Setup', '## Bootstrap', '## Deploy staging', '## Deploy production', '## Migrations', '## Logs', '## Rollback', '## Cost'];
const targets = JSON.parse(readFileSync(join(harness, 'deploy', 'targets.json'), 'utf8'));
for (const name of Object.keys(targets.targets).filter((t) => t !== 'none')) {
  const p = join(harness, 'deploy', `${name}.md`);
  ok(existsSync(p) && deploySections.every((s) => readFileSync(p, 'utf8').includes(s)), `deploy guide sections: ${name}`);
}
const schema = JSON.parse(readFileSync(join(harness, 'config.schema.json'), 'utf8'));
ok(
  JSON.stringify(schema.properties.deploy.properties.target.enum.slice().sort()) === JSON.stringify(Object.keys(targets.targets).sort()),
  'schema deploy targets match targets.json',
);

// 4 · init / sync / doctor in a temp project
const tmp = mkdtempSync(join(tmpdir(), 'harness-test-'));
const proj = join(tmp, 'demo');
const cli = join(root, 'scripts', 'cli.mjs');
let r = spawnSync(process.execPath, [cli, 'init', proj, '--agents', 'claude,antigravity'], { encoding: 'utf8' });
ok(r.status === 0, `init exits 0${r.status ? `: ${r.stderr}` : ''}`);
for (const f of [
  '.harness/HARNESS.md',
  '.harness/config.json',
  '.harness/bin/doctor.mjs',
  '.harness/local/README.md',
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/settings.json',
  '.claude/skills/harness-run/SKILL.md',
  '.claude/skills/harness-story-review/SKILL.md',
  '.agents/skills/harness-run/SKILL.md',
  '.agents/rules/harness.md',
  'docs/spec.md',
  '.gitignore',
]) ok(existsSync(join(proj, f)), `installed: ${f}`);

const review = readFileSync(join(proj, '.claude/skills/harness-story-review/SKILL.md'), 'utf8');
ok(review.startsWith('---\nname: harness-story-review\n') && review.includes('context: fork'), 'claude isolated skill has fork context');
const run = readFileSync(join(proj, '.claude/skills/harness-run/SKILL.md'), 'utf8');
ok(run.includes('disable-model-invocation: true'), 'claude harness-run is user-only');

// Re-running sync must be idempotent and keep config edits and local extensions
const configPath = join(proj, '.harness/config.json');
const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
cfg.mode = 'auto';
writeFileSync(configPath, JSON.stringify(cfg, null, 2));
writeFileSync(join(proj, '.harness/local/08-story-review.md'), 'local rule');
const agentsBefore = readFileSync(join(proj, 'AGENTS.md'), 'utf8');
r = spawnSync(process.execPath, [cli, 'sync', proj], { encoding: 'utf8' });
ok(r.status === 0, 'sync exits 0');
ok(JSON.parse(readFileSync(configPath, 'utf8')).mode === 'auto', 'sync keeps config');
ok(existsSync(join(proj, '.harness/local/08-story-review.md')), 'sync keeps local extensions');
ok(readFileSync(join(proj, 'AGENTS.md'), 'utf8') === agentsBefore, 'sync is idempotent on AGENTS.md');
ok((readFileSync(join(proj, '.gitignore'), 'utf8').match(/# harness:start/g) || []).length === 1, 'gitignore block not duplicated');
ok((readFileSync(join(proj, 'CLAUDE.md'), 'utf8').match(/@AGENTS\.md/g) || []).length === 1, 'CLAUDE.md import not duplicated');

// Doctor runs and writes preflight.json (it may fail on gh auth in CI; only the mechanics are tested)
r = spawnSync(process.execPath, ['.harness/bin/doctor.mjs', '--json'], { cwd: proj, encoding: 'utf8' });
let pre;
try {
  pre = JSON.parse(r.stdout);
} catch {}
ok(pre && Array.isArray(pre.results) && existsSync(join(proj, '.harness/state/preflight.json')), 'doctor produces preflight.json');
r = spawnSync(process.execPath, ['.harness/bin/doctor.mjs', '--hash'], { cwd: proj, encoding: 'utf8' });
ok(/^[0-9a-f]{16}$/.test(r.stdout.trim()) && r.stdout.trim() === pre?.configHash, 'doctor --hash matches preflight');

rmSync(tmp, { recursive: true, force: true });
console.log(failures ? `\n✖ ${failures} failure(s)` : '\n✔ All checks passed');
process.exit(failures ? 1 : 0);
