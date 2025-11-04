#!/usr/bin/env node
/**
 * Duplicate ID Scanner for RavenOS
 * 
 * Scans for duplicate IDs across:
 * - HTML files (id="..." attributes)
 * - JavaScript files (template literals, innerHTML, setAttribute)
 * - Checks for cross-file conflicts
 * 
 * @returns {Promise<void>}
 * @async-boundary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running from inside desloppify submodule (incorrect usage)
if (__dirname.includes('/desloppify/scripts') || __dirname.includes('\\desloppify\\scripts') ||
    __dirname.includes('/.desloppify/scripts') || __dirname.includes('\\.desloppify\\scripts')) {
  console.error('\n❌ ERROR: Cannot run validator directly from desloppify submodule\n');
  console.error('This validator must run via orchestrator to calculate paths correctly.\n');
  console.error('Instead of:  node desloppify/scripts/core/lint-duplicate-ids.mjs');
  console.error('Use:         npm run docs:check\n');
  console.error('Or set up orchestrator:  bash desloppify/setup.sh\n');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..');

// Patterns to match IDs in different contexts
const patterns = {
  // Matches id="some-id" or id='some-id' in HTML/template literals
  htmlAttribute: /id=["']([a-zA-Z0-9_-]+)["']/g,
  
  // Matches getElementById('some-id') or getElementById("some-id")
  getElementById: /getElementById\s*\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g,
  
  // Matches setAttribute('id', 'some-id') or setAttribute("id", "some-id")
  setAttribute: /setAttribute\s*\(\s*["']id["']\s*,\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g,
  
  // Matches CSS selectors #some-id
  cssSelector: /#([a-zA-Z0-9_-]+)\s*[{,\s]/g,
};

// Files/directories to ignore
const ignorePatterns = [
  'node_modules',
  '.git',
  'logs',
  'coverage',
  '.cursor',
  'dist',
  'build',
];

/**
 * Check if path should be ignored
 * 
 * @param {string} filePath - Path to check
 * @returns {boolean}
 * @pure false
 */
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Recursively walk directory and collect files
 * 
 * @param {string} dir - Directory to walk
 * @param {string[]} fileList - Accumulated file list
 * @returns {string[]}
 * @pure false
 * @side-effects
 * - File I/O: Reads directory structure
 */
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (shouldIgnore(filePath)) continue;
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      // Only scan relevant file types
      if (/\.(html|js|mjs|css)$/i.test(file)) {
        fileList.push(filePath);
      }
    }
  }
  
  return fileList;
}

/**
 * Extract IDs from file content
 * 
 * @param {string} content - File content
 * @param {string} filePath - Path to file (for context)
 * @returns {Array<{id: string, line: number, context: string, type: string}>}
 * @pure false
 */
function extractIds(content, filePath) {
  const ids = [];
  const lines = content.split('\n');
  const ext = path.extname(filePath);
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return;
    }
    
    // HTML/Template literal id attributes
    let match;
    const htmlAttrPattern = /id=["']([a-zA-Z0-9_-]+)["']/g;
    while ((match = htmlAttrPattern.exec(line)) !== null) {
      // Skip dynamic IDs (containing ${...})
      const beforeId = line.substring(0, match.index);
      if (beforeId.includes('${') || line.includes('${')) {
        continue; // Dynamic ID, skip
      }
      
      ids.push({
        id: match[1],
        line: lineNum,
        context: line.trim().substring(0, 80),
        type: ext === '.css' ? 'css-attribute' : 'html-attribute',
      });
    }
    
    // CSS selectors
    if (ext === '.css') {
      const cssSelectorPattern = /#([a-zA-Z0-9_-]+)\s*[{,\s]/g;
      while ((match = cssSelectorPattern.exec(line)) !== null) {
        ids.push({
          id: match[1],
          line: lineNum,
          context: line.trim().substring(0, 80),
          type: 'css-selector',
        });
      }
    }
    
    // JavaScript patterns
    if (ext === '.js' || ext === '.mjs') {
      // getElementById (indicates usage, not creation)
      const getByIdPattern = /getElementById\s*\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g;
      while ((match = getByIdPattern.exec(line)) !== null) {
        ids.push({
          id: match[1],
          line: lineNum,
          context: line.trim().substring(0, 80),
          type: 'getElementById-usage',
        });
      }
      
      // element.id = "some-id" (creates ID dynamically)
      const idAssignPattern = /\.id\s*=\s*["']([a-zA-Z0-9_-]+)["']/g;
      while ((match = idAssignPattern.exec(line)) !== null) {
        ids.push({
          id: match[1],
          line: lineNum,
          context: line.trim().substring(0, 80),
          type: 'id-assignment',
        });
      }
      
      // setAttribute('id', 'some-id') (creates ID dynamically)
      const setAttrPattern = /setAttribute\s*\(\s*["']id["']\s*,\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g;
      while ((match = setAttrPattern.exec(line)) !== null) {
        ids.push({
          id: match[1],
          line: lineNum,
          context: line.trim().substring(0, 80),
          type: 'setAttribute',
        });
      }
    }
  });
  
  return ids;
}

/**
 * Scan all files and collect ID definitions
 * 
 * @returns {Map<string, Array<{file: string, line: number, context: string, type: string}>>}
 * @async-boundary
 * @side-effects
 * - File I/O: Reads all HTML/JS/CSS files
 * - Console: Progress output
 */
function scanForIds() {
  console.log('🔍 Scanning for IDs across HTML, JavaScript, and CSS files...\n');
  
  const files = walkDir(repoRoot);
  const idMap = new Map();
  
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ids = extractIds(content, filePath);
    
    for (const idInfo of ids) {
      const { id, line, context, type } = idInfo;
      
      if (!idMap.has(id)) {
        idMap.set(id, []);
      }
      
      idMap.get(id).push({
        file: path.relative(repoRoot, filePath),
        line,
        context,
        type,
      });
    }
  }
  
  return idMap;
}

/**
 * Find duplicate ID definitions (not just usage)
 * 
 * @param {Map} idMap - Map of IDs to locations
 * @returns {Map<string, Array>}
 * @pure false
 */
function findDuplicateDefinitions(idMap) {
  const duplicates = new Map();
  
  for (const [id, locations] of idMap.entries()) {
    // Filter to only ID definitions (not just getElementById usage)
    const definitions = locations.filter(loc => 
      loc.type === 'html-attribute' || 
      loc.type === 'setAttribute' ||
      loc.type === 'id-assignment'
    );
    
    // If same ID is defined in multiple places, that's a duplicate
    if (definitions.length > 1) {
      duplicates.set(id, definitions);
    }
  }
  
  return duplicates;
}

/**
 * Find IDs used but never defined
 * 
 * @param {Map} idMap - Map of IDs to locations
 * @returns {Map<string, Array>}
 * @pure false
 */
function findOrphanedUsages(idMap) {
  const orphans = new Map();
  
  for (const [id, locations] of idMap.entries()) {
    const definitions = locations.filter(loc => 
      loc.type === 'html-attribute' || 
      loc.type === 'setAttribute' ||
      loc.type === 'id-assignment'
    );
    
    const usages = locations.filter(loc => 
      loc.type === 'getElementById-usage'
    );
    
    // If used but never defined
    if (definitions.length === 0 && usages.length > 0) {
      orphans.set(id, usages);
    }
  }
  
  return orphans;
}

/**
 * Generate report of issues
 * 
 * @param {Map} duplicates - Duplicate ID definitions
 * @param {Map} orphans - Orphaned ID usages
 * @returns {boolean} - True if issues found
 * @pure false
 * @side-effects
 * - Console: Outputs report
 */
function generateReport(duplicates, orphans) {
  let hasIssues = false;
  
  // Report duplicate definitions
  if (duplicates.size > 0) {
    hasIssues = true;
    console.log('❌ DUPLICATE IDs FOUND:\n');
    
    for (const [id, locations] of duplicates.entries()) {
      console.log(`  ID: "${id}" defined in ${locations.length} places:`);
      for (const loc of locations) {
        console.log(`    - ${loc.file}:${loc.line}`);
        console.log(`      ${loc.context}`);
      }
      console.log('');
    }
  }
  
  // Report orphaned usages
  if (orphans.size > 0) {
    hasIssues = true;
    console.log('⚠️  IDs USED BUT NEVER DEFINED:\n');
    
    for (const [id, locations] of orphans.entries()) {
      console.log(`  ID: "${id}" used but not defined:`);
      for (const loc of locations) {
        console.log(`    - ${loc.file}:${loc.line}`);
        console.log(`      ${loc.context}`);
      }
      console.log('');
    }
  }
  
  // Success message
  if (!hasIssues) {
    console.log('✅ No duplicate IDs found!\n');
  }
  
  return hasIssues;
}

/**
 * Main execution
 * 
 * @returns {Promise<void>}
 * @async-boundary
 */
async function main() {
  try {
    const idMap = scanForIds();
    const duplicates = findDuplicateDefinitions(idMap);
    const orphans = findOrphanedUsages(idMap);
    
    const hasIssues = generateReport(duplicates, orphans);
    
    if (hasIssues) {
      console.log('💡 Tip: IDs must be unique across the entire app.');
      console.log('   Consider adding prefixes (e.g., "drawer-close-btn" vs "modal-close-btn")\n');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during ID scan:', error.message);
    process.exit(1);
  }
}

main();

