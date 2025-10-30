#!/usr/bin/env node
// Lint-styles: detect inline style=" attributes across the repo (excluding node_modules)
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.join(path.dirname(__filename), '..');

function runRipGrep() {
  try {
    const res = spawnSync('rg', ['--hidden', '--glob', '!node_modules', 'style=\"'], { cwd: repoRoot });
    if (res.error) throw res.error;
    const out = res.stdout.toString().trim();
    return out;
  } catch (e) {
    return null;
  }
}

function nodeScan() {
  // Fallback: scan files for style=" pattern
  const fs = require('fs');
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
    if (txt.includes('style="')) matches.push(f);
  }
  return matches.join('\n');
}

const rgOut = runRipGrep();
let found = '';
if (rgOut === null) {
  // ripgrep not available — fallback
  found = nodeScan();
} else {
  found = rgOut;
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


