/**
 * Quick checker: Find async functions that don't use await
 * 
 * Supports whitelist system with drift detection.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import whitelistManager from '../whitelist-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running from inside desloppify submodule (incorrect usage)
if (__dirname.includes('/desloppify/scripts') || __dirname.includes('\\desloppify\\scripts') ||
    __dirname.includes('/.desloppify/scripts') || __dirname.includes('\\.desloppify\\scripts')) {
  console.error('\n❌ ERROR: Cannot run validator directly from desloppify submodule\n');
  console.error('This validator must run via orchestrator to calculate paths correctly.\n');
  console.error('Instead of:  node desloppify/scripts/core/check-async-without-await.mjs');
  console.error('Use:         npm run docs:check\n');
  console.error('Or set up orchestrator:  bash desloppify/setup.sh\n');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');

const FILES_TO_SKIP = [
  'node_modules',
  '.git',
  '.backup',
  '.bak',
  '.old',
  'scripts/',     // Skip all scripts - they're one-off tools, not production code
  'docs/',        // Skip all docs - no executable code to validate
];

function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (FILES_TO_SKIP.some(skip => filePath.includes(skip))) {
      return;
    }
    
    if (stat.isDirectory()) {
      getAllJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkAsyncFunctions(filePath, content) {
  const lines = content.split('\n');
  const violations = [];
  
  let currentFunction = null;
  let braceDepth = 0;
  let functionBody = [];
  let functionComments = []; // Track comments before function
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Track comments (for JSDoc and intent checking)
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
      if (!currentFunction) {
        functionComments.push(trimmed);
      }
      return;
    }
    
    // Detect async function start
    const asyncFuncMatch = trimmed.match(/^(export\s+)?(async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*async)/);
    if (asyncFuncMatch && !currentFunction) {
      const funcName = asyncFuncMatch[3] || asyncFuncMatch[4] || 'anonymous';
      
      // Extract function parameters to check for Express handler pattern
      const fullLine = line;
      const paramsMatch = fullLine.match(/\(([^)]*)\)/);
      const params = paramsMatch ? paramsMatch[1].trim() : '';
      
      currentFunction = {
        name: funcName,
        startLine: lineNum,
        file: filePath,
        comments: [...functionComments],
        params: params,
      };
      braceDepth = 0;
      functionBody = [];
      functionComments = []; // Reset comments
    } else if (!currentFunction && trimmed !== '') {
      // Reset comments if we hit non-comment, non-function code
      functionComments = [];
    }
    
    // Track function body
    if (currentFunction) {
      functionBody.push(line);
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      
      // Function ended
      if (braceDepth <= 0 && line.includes('}') && functionBody.length > 1) {
        // Check if function body contains 'await' OR '.then('
        const bodyText = functionBody.join('\n');
        const hasAwait = bodyText.includes('await');
        const hasThen = bodyText.includes('.then(');
        
        // EXEMPTION 1: Check for intentional async comments
        const commentsText = currentFunction.comments.join(' ').toLowerCase();
        const hasIntentComment = 
          commentsText.includes('keep async') || 
          commentsText.includes('intentionally async') ||
          commentsText.includes('intentional async') ||
          commentsText.includes('must be async');
        
        // EXEMPTION 2: Check for JSDoc Promise return type
        const hasPromiseReturnType = 
          commentsText.includes('@returns {promise') ||
          commentsText.includes('@return {promise');
        
        // EXEMPTION 3: Check for Express handler pattern (req, res, next?)
        const isExpressHandler = 
          /req\s*,\s*res/.test(currentFunction.params) ||
          /request\s*,\s*response/.test(currentFunction.params);
        
        // Only flag if:
        // - Has neither await nor .then()
        // - AND doesn't match any exemption
        if (!hasAwait && !hasThen && !hasIntentComment && !hasPromiseReturnType && !isExpressHandler) {
          violations.push({
            file: filePath,
            line: currentFunction.startLine,
            funcName: currentFunction.name,
          });
        }
        
        currentFunction = null;
        functionBody = [];
      }
    }
  });
  
  return violations;
}

/**
 * Check violations against whitelist
 */
function categorizeViolations(violations) {
  const whitelist = whitelistManager.loadWhitelist();
  const categorized = {
    new: [],
    whitelisted: [],
    drift: []
  };

  for (const violation of violations) {
    const entry = whitelistManager.getWhitelistEntryByLocation(
      whitelist,
      violation.file,
      violation.line
    );

    if (!entry) {
      categorized.new.push(violation);
    } else {
      // Validate whitelist entry
      const validation = whitelistManager.validateWhitelistEntry(entry);
      
      if (!validation.valid) {
        categorized.drift.push({
          violation,
          entry,
          validation
        });
      } else {
        categorized.whitelisted.push({
          violation,
          entry
        });
      }
    }
  }

  return categorized;
}

/**
 * Format drift issues
 */
function formatDrift(drift) {
  const { violation, entry, validation } = drift;
  let output = '';

  output += `\n  🟨 WHITELIST DRIFT: ${entry.id}\n`;
  output += `     ${entry.file}:${entry.line}\n`;
  output += whitelistManager.formatValidationErrors(entry, validation);
  output += `     💡 Run: npm run validation:update ${entry.id}\n`;

  return output;
}

// Main execution
const jsFiles = getAllJSFiles(PROJECT_ROOT);
let totalAsync = 0;
let totalViolations = 0;
const violations = [];

jsFiles.forEach(filePath => {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileViolations = checkAsyncFunctions(relativePath, content);
  
  if (fileViolations.length > 0) {
    violations.push(...fileViolations);
    totalViolations += fileViolations.length;
  }
});

// Categorize by whitelist status
const categorized = categorizeViolations(violations);

console.log('\n🔍 Bug Pattern #2: Missing Await on Async Functions\n');
console.log('=' .repeat(80));

// Show new violations
if (categorized.new.length > 0) {
  console.log(`\n❌ NEW VIOLATIONS (${categorized.new.length}):\n`);
  
  categorized.new.slice(0, 20).forEach(v => {
    console.log(`   ${v.file}:${v.line}`);
    console.log(`      async function ${v.funcName}() has no await calls`);
    console.log('');
  });

  if (categorized.new.length > 20) {
    console.log(`   ... and ${categorized.new.length - 20} more\n`);
  }
}

// Show drift violations
if (categorized.drift.length > 0) {
  console.log(`\n🟨 WHITELIST DRIFT (${categorized.drift.length}):\n`);
  
  categorized.drift.forEach(drift => {
    console.log(formatDrift(drift));
  });
}

// Note whitelisted
if (categorized.whitelisted.length > 0) {
  console.log(`\n✅ Whitelisted: ${categorized.whitelisted.length} issue(s)\n`);
}

// Summary
console.log('=' .repeat(80));
console.log(`\n📊 Summary:\n`);
console.log(`   ❌ New violations: ${categorized.new.length}`);
console.log(`   🟨 Whitelist drift: ${categorized.drift.length}`);
console.log(`   ✅ Whitelisted: ${categorized.whitelisted.length}`);

if (categorized.new.length + categorized.drift.length === 0) {
  console.log(`\n   🎉 No missing-await issues found!`);
} else {
  console.log(`\n   💡 To whitelist an issue, add above the function:`);
  console.log(`      // @validation-ignore missing-await`);
  console.log(`      // @reason: <why async without await is intentional>`);
  console.log(`      // @whitelist-id: missing-await-XXX\n`);
  console.log(`      Then run: npm run validation:sync-whitelist`);
}

console.log('\n' + '=' .repeat(80) + '\n');

