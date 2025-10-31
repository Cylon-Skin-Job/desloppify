#!/usr/bin/env node

/**
 * Validates that all generator scripts are wired into package.json
 * 
 * Checks:
 * - Every generate-*-rule.mjs script is referenced in rules:generate
 * - Every script in rules:generate actually exists
 * - No orphaned generators
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Validating generator wiring...\n');

let hasErrors = false;

// Read package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const rulesGenerateScript = packageJson.scripts['rules:generate'];

if (!rulesGenerateScript) {
  console.error('❌ ERROR: No "rules:generate" script found in package.json');
  process.exit(1);
}

// Extract script names from the rules:generate command
// Format: "node scripts/generate-api-routes-rule.mjs && node scripts/generate-schema-rule.mjs && ..."
const scriptMatches = rulesGenerateScript.matchAll(/node\s+scripts\/(generate-[a-z-]+\.mjs)/g);
const wiredScripts = new Set([...scriptMatches].map(match => match[1]));

console.log(`📋 Found ${wiredScripts.size} generators in rules:generate:`);
wiredScripts.forEach(script => console.log(`   - ${script}`));
console.log();

// Find all generate-*-rule.mjs files in scripts/
const scriptsDir = path.join(projectRoot, 'scripts');
const allFiles = fs.readdirSync(scriptsDir);
const generatorFiles = allFiles.filter(file => file.startsWith('generate-') && file.endsWith('-rule.mjs'));

console.log(`📂 Found ${generatorFiles.length} generator files in scripts/:`);
generatorFiles.forEach(file => console.log(`   - ${file}`));
console.log();

// Check 1: Every generator file is wired into package.json
console.log('✅ Checking all generators are wired...');
const unwiredGenerators = generatorFiles.filter(file => !wiredScripts.has(file));
if (unwiredGenerators.length > 0) {
  console.error('❌ ERROR: Found generators NOT wired into rules:generate:');
  unwiredGenerators.forEach(file => console.error(`   - ${file}`));
  console.error('\n   Fix: Add these to the rules:generate script in package.json\n');
  hasErrors = true;
} else {
  console.log('   ✅ All generator files are wired\n');
}

// Check 2: Every wired script actually exists
console.log('✅ Checking all wired scripts exist...');
const missingScripts = [...wiredScripts].filter(script => !generatorFiles.includes(script));
if (missingScripts.length > 0) {
  console.error('❌ ERROR: Found wired scripts that DO NOT exist:');
  missingScripts.forEach(script => console.error(`   - ${script}`));
  console.error('\n   Fix: Remove these from rules:generate or create the missing files\n');
  hasErrors = true;
} else {
  console.log('   ✅ All wired scripts exist\n');
}

// Check 3: Verify each generator creates a .mdc file (check for output in script)
console.log('✅ Checking generators produce .cursor/rules/*.mdc...');
for (const generator of generatorFiles) {
  const content = fs.readFileSync(path.join(scriptsDir, generator), 'utf-8');
  // Check for output path - either .cursor/rules/ or desloppify-local/cursor-docs/
  const cursorRulesMatch = content.match(/\.cursor\/rules\/(\d+-[a-z-]+\.mdc)/);
  const desloppifyLocalMatch = content.match(/desloppify-local\/cursor-docs\/([a-z-]+\.mdc)/);
  
  if (!cursorRulesMatch && !desloppifyLocalMatch) {
    console.error(`   ⚠️  WARNING: ${generator} doesn't seem to write to .cursor/rules/*.mdc or desloppify-local/cursor-docs/*.mdc`);
    hasErrors = true;
  } else if (cursorRulesMatch) {
    const outputFile = cursorRulesMatch[1];
    console.log(`   ✅ ${generator} → ${outputFile}`);
  } else if (desloppifyLocalMatch) {
    const outputFile = desloppifyLocalMatch[1];
    console.log(`   ✅ ${generator} → desloppify-local/cursor-docs/${outputFile}`);
  }
}
console.log();

// Summary
if (hasErrors) {
  console.error('❌ Generator wiring validation FAILED\n');
  process.exit(1);
} else {
  console.log('✅ All generators properly wired!\n');
  process.exit(0);
}







