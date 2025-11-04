#!/usr/bin/env node
// CommonJS fallback script for lint-styles when package.json uses "type": "module"
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detect if running from inside desloppify submodule (incorrect usage)
const isDesloppifyPath = __dirname.includes('/desloppify/scripts') || 
                         __dirname.includes('\\desloppify\\scripts') ||
                         __dirname.includes('/.desloppify/scripts') || 
                         __dirname.includes('\\.desloppify\\scripts');
if (isDesloppifyPath) {
  console.error('\n❌ ERROR: Cannot run validator directly from desloppify submodule\n');
  console.error('This validator must run via orchestrator to calculate paths correctly.\n');
  console.error('Instead of:  node desloppify/scripts/core/lint-styles.cjs');
  console.error('Use:         npm run docs:check\n');
  console.error('Or set up orchestrator:  bash desloppify/setup.sh\n');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..');

function runRipGrep() {
  try {
    const res = spawnSync('rg', ['--hidden', '--glob', '!node_modules', '--glob', '!scripts/**', 'style=\"'], { cwd: repoRoot });
    if (res.error) throw res.error;
    const out = res.stdout.toString().trim();
    return out;
  } catch (e) {
    return null;
  }
}

function nodeScan() {
  const walk = (dir, list = []) => {
    const names = fs.readdirSync(dir);
    for (const name of names) {
      if (name === 'node_modules' || name === '.git') continue;
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p, list);
      else list.push(p);
    }
    return list;
  };
  const files = walk(repoRoot).filter((f) => f.match(/\.(html|js|jsx|ts|tsx|md)$/i));
  const matches = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    if (txt.includes('style="')) matches.push(f + ':' + (txt.match(/style="/g)||[]).length + ' occurrence(s)');
  }
  return matches.join('\n');
}

const rgOut = runRipGrep();
let foundRaw = '';
if (rgOut === null) {
  foundRaw = nodeScan();
} else {
  foundRaw = rgOut;
}

// Filter out matches that are inside the scripts folder, node_modules, or markdown files (we don't lint our scripts/docs themselves)
let found = '';
if (foundRaw && foundRaw.length) {
  const lines = foundRaw.split('\n').map((l) => l.trim()).filter((l) => l.length);
  const filtered = lines.filter((l) => !(l.includes('/scripts/') || l.includes('\\scripts\\') || l.includes('/node_modules/') || l.includes('\\node_modules\\') || l.match(/\.md:/)));
  found = filtered.join('\n');
}

if (found && found.length) {
  console.error('\n❌ Inline style attributes detected in the repository:\n');
  console.error(found);
  console.error('\nPlease move inline styles to css/*.css.');
  process.exit(1);
} else {
  console.log('✔️  No inline styles found');
  process.exit(0);
}


