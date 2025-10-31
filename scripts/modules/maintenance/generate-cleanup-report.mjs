#!/usr/bin/env node

/**
 * @file Post-Session Cleanup Report Generator
 * @description Scans codebase for pruning suggestions after maintenance runs
 * 
 * Scans for 9 cleanup categories:
 * 1. Backup/temp files (*.bak, *.backup, test-*.html)
 * 2. Old logs (> 7 days)
 * 3. Files not modified in 90+ days
 * 4. TODO/FIXME comments (actionable only: TODO, FIXME, HACK, XXX)
 * 5. Large commented-out code blocks (excludes JSDoc)
 * 6. Potential secrets (API_KEY patterns) with whitelist + drift tracking
 * 7. Large files (> 1MB) in git
 * 8. Stale untracked files (> 7 days old)
 * 9. .gitignore pattern suggestions
 * 
 * Note: "Orphaned scripts" check removed - use function-call-validator instead
 * 
 * @requires-functions None (standalone)
 * @side-effects Reads filesystem, outputs to console, runs git commands
 * @async-boundary Top-level async
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { detectCommentType, extractCommentBlock } from '../../comment-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

// Configuration
const DAYS_OLD_LOGS = 7;
const DAYS_OLD_FILES = 90;
const DAYS_OLD_UNTRACKED = 7;
const LARGE_FILE_MB = 1;
const MIN_COMMENTED_LINES = 10;
const EXCLUDE_DIRS = ['node_modules', '.git', 'logs', '.cursor'];
const EXCLUDE_FILES = ['.DS_Store'];

// Known secrets whitelist with .gitignore drift tracking
const SECRET_WHITELIST = [
  {
    pattern: /raven-os-firebase-adminsdk-.*\.json$/,
    reason: 'Firebase Admin SDK service account (backend authentication)',
    gitignorePattern: '*-adminsdk-*.json',
    gitignoreReference: '.gitignore:9',
    whitelistedDate: '2025-10-19',
    comment: 'Contains private key - MUST be in .gitignore to prevent git commit'
  },
  {
    pattern: /firebase-client\.js/,
    reason: 'Firebase Web SDK API key (public, safe to commit)',
    gitignorePattern: null, // No .gitignore needed - intentionally public
    gitignoreReference: null,
    whitelistedDate: '2025-10-19',
    comment: 'Per Firebase docs: "API keys for Firebase services are ok to include in code"'
  }
];

/**
 * Checks if path should be excluded from scans
 * @param {string} filePath - Path to check
 * @returns {boolean} True if should exclude
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  return EXCLUDE_DIRS.some(dir => relativePath.startsWith(dir + path.sep) || relativePath === dir);
}

/**
 * Recursively walks directory tree
 * @param {string} dir - Starting directory
 * @returns {Promise<string[]>} Array of file paths
 * @async-boundary
 */
async function walkDirectory(dir) {
  let files = [];
  
  if (shouldExclude(dir)) {
    return files;
  }
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (EXCLUDE_FILES.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files = files.concat(await walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories we can't read
    console.error(`Warning: Could not read ${dir}: ${err.message}`);
  }
  
  return files;
}

/**
 * Category 1: Find backup/temp files
 * @param {string[]} files - All files to scan
 * @returns {string[]} Matching files
 */
function findBackupFiles(files) {
  const patterns = [/\.bak$/, /\.backup$/, /^test-.*\.html$/, /-old\./, /\.tmp$/];
  return files.filter(file => {
    const basename = path.basename(file);
    return patterns.some(pattern => pattern.test(basename));
  });
}

/**
 * Category 2: Find old log files (> 7 days)
 * @param {string[]} files - All files to scan
 * @returns {Promise<Array<{file: string, age: number}>>} Old log files
 * @async-boundary
 */
async function findOldLogs(files) {
  const logFiles = files.filter(file => 
    file.includes('/logs/') || /\.log$/.test(file)
  );
  
  const now = Date.now();
  const cutoff = DAYS_OLD_LOGS * 24 * 60 * 60 * 1000;
  const oldLogs = [];
  
  for (const file of logFiles) {
    try {
      const stats = await fs.stat(file);
      const age = now - stats.mtimeMs;
      if (age > cutoff) {
        oldLogs.push({
          file,
          age: Math.floor(age / (24 * 60 * 60 * 1000))
        });
      }
    } catch (err) {
      // Skip files we can't stat
    }
  }
  
  return oldLogs;
}

/**
 * Category 3: Find files not modified in 90+ days
 * @param {string[]} files - All files to scan
 * @returns {Promise<Array<{file: string, age: number}>>} Stale files
 * @async-boundary
 */
async function findStaleFiles(files) {
  const now = Date.now();
  const cutoff = DAYS_OLD_FILES * 24 * 60 * 60 * 1000;
  const staleFiles = [];
  
  for (const file of files) {
    if (shouldExclude(file)) continue;
    
    try {
      const stats = await fs.stat(file);
      const age = now - stats.mtimeMs;
      if (age > cutoff) {
        staleFiles.push({
          file: path.relative(PROJECT_ROOT, file),
          age: Math.floor(age / (24 * 60 * 60 * 1000))
        });
      }
    } catch (err) {
      // Skip files we can't stat
    }
  }
  
  return staleFiles;
}

/**
 * Category 4: Find TODO/FIXME comments
 * @param {string[]} files - All files to scan
 * @returns {Promise<Array<{file: string, line: number, text: string}>>} TODO comments
 * @async-boundary
 * 
 * Note: "Note:" is excluded - it's for documentation, not actionable items
 * Style guide mandates: Use TODO for actionable items, Note for explanations
 */
async function findTodoComments(files) {
  const codeFiles = files.filter(file => 
    /\.(js|mjs|cjs|html|css|json|md)$/.test(file)
  );
  
  const todos = [];
  // Only flag actionable keywords: TODO, FIXME, HACK, XXX
  // Skip "Note:" - that's for explanatory documentation
  const todoPattern = /\b(TODO|FIXME|HACK|XXX):\s*(.+)/gi;
  
  for (const file of codeFiles) {
    if (shouldExclude(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const match = todoPattern.exec(line);
        if (match) {
          todos.push({
            file: path.relative(PROJECT_ROOT, file),
            line: index + 1,
            text: match[0].trim()
          });
        }
      });
    } catch (err) {
      // Skip files we can't read
    }
  }
  
  return todos;
}

/**
 * Category 5: Orphaned Scripts - REMOVED
 * 
 * This check has been removed because it generated too many false positives.
 * The function-call-validator.mjs already tracks ES6 imports/exports comprehensively.
 * 
 * Previous naive check: Only looked if script name appeared in package.json
 * Problem: Flagged all utility modules imported by other scripts (18+ false positives)
 * 
 * Better solution: Use function-call-validator's unused exports check
 */
async function findOrphanedScripts(files) {
  // This check is disabled - function-call-validator handles this better
  return [];
}

/**
 * Check if comment content looks like actual code (not documentation)
 * @param {string} content - Comment content to analyze
 * @returns {boolean} True if likely commented-out code
 */
function looksLikeCode(content) {
  // Skip JSDoc annotations - these are required documentation
  if (/@param|@returns|@throws|@async-boundary|@side-effects|@mutates-state|@requires/.test(content)) {
    return false;
  }
  
  // Skip pure documentation phrases
  if (/^(Note:|TODO:|FIXME:|HACK:|XXX:)/i.test(content)) {
    return false;
  }
  
  // Code patterns to detect
  const codePatterns = [
    /console\.(log|error|warn|info)\(/,  // Console calls
    /\.(map|filter|reduce|forEach)\(/,   // Array methods
    /\bfunction\s+\w+\s*\(/,              // Function declarations
    /\bconst\s+\w+\s*=/,                  // Variable declarations
    /\blet\s+\w+\s*=/,
    /\bvar\s+\w+\s*=/,
    /\bif\s*\(/,                          // Control flow
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\breturn\s+/,
    /;\s*$/m,                             // Semicolons at end of lines
    /=>\s*{/,                             // Arrow functions
    /\bawait\s+\w+/,                      // Async/await
  ];
  
  // Count how many code patterns match
  let matches = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(content)) {
      matches++;
    }
  }
  
  // If 2+ code patterns found, likely actual code
  return matches >= 2;
}

/**
 * Category 6: Find large commented-out code blocks
 * @param {string[]} files - All files to scan
 * @returns {Promise<Array<{file: string, lines: number, startLine: number}>>} Files with large comment blocks
 * @async-boundary
 */
async function findCommentedCode(files) {
  const codeFiles = files.filter(file => 
    /\.(js|mjs|cjs)$/.test(file)
  );
  
  const commentedCodeBlocks = [];
  
  for (const file of codeFiles) {
    if (shouldExclude(file)) continue;
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      let currentLine = 0;
      const processedBlocks = new Set(); // Track which lines we've already processed
      
      while (currentLine < lines.length) {
        // Skip if we've already processed this line
        if (processedBlocks.has(currentLine)) {
          currentLine++;
          continue;
        }
        
        const commentType = detectCommentType(lines[currentLine]);
        
        if (commentType) {
          const block = extractCommentBlock(lines, currentLine);
          
          if (block && block.lines.length >= MIN_COMMENTED_LINES) {
            const blockContent = block.content;
            
            // Skip JSDoc blocks (/** ... */)
            if (blockContent.trim().startsWith('/**')) {
              // Mark these lines as processed
              for (let i = block.startLine; i <= block.endLine; i++) {
                processedBlocks.add(i);
              }
              currentLine = block.endLine + 1;
              continue;
            }
            
            // Check if this looks like actual code
            if (looksLikeCode(blockContent)) {
              commentedCodeBlocks.push({
                file: path.relative(PROJECT_ROOT, file),
                lines: block.lines.length,
                startLine: block.startLine + 1 // Convert to 1-based line numbers
              });
            }
            
            // Mark these lines as processed
            for (let i = block.startLine; i <= block.endLine; i++) {
              processedBlocks.add(i);
            }
            currentLine = block.endLine + 1;
          } else {
            currentLine++;
          }
        } else {
          currentLine++;
        }
      }
    } catch (err) {
      // Skip files we can't read
      console.error(`Warning: Could not process ${file}: ${err.message}`);
    }
  }
  
  return commentedCodeBlocks;
}

/**
 * Check if secret matches whitelist pattern
 * @param {string} file - File path (relative to PROJECT_ROOT)
 * @param {number} line - Line number
 * @returns {Object|null} Whitelist entry if matched, null otherwise
 */
function matchSecretWhitelist(file, line) {
  for (const entry of SECRET_WHITELIST) {
    // Test against: filename, full relative path, and path:line combo
    const tests = [
      path.basename(file),           // "firebase-client.js"
      file,                           // "js/firebase-client.js"
      `${file}:${line}`               // "js/firebase-client.js:35"
    ];
    
    if (tests.some(test => entry.pattern.test(test))) {
      return entry;
    }
  }
  
  return null;
}

/**
 * Check if .gitignore pattern exists (drift detection)
 * @param {string} pattern - Pattern to check for
 * @returns {boolean} True if pattern exists in .gitignore
 */
function checkGitignoreProtection(pattern) {
  if (!pattern) return true; // No protection needed
  
  try {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    const gitignoreContent = fsSync.readFileSync(gitignorePath, 'utf-8');
    return gitignoreContent.includes(pattern);
  } catch (err) {
    return false; // .gitignore doesn't exist
  }
}

/**
 * Category 6: Find potential secrets in code
 * @param {string[]} files - All files to scan
 * @returns {Promise<Object>} Secrets categorized by status (unprotected, whitelisted, drift)
 * @async-boundary
 */
async function findPotentialSecrets(files) {
  const codeFiles = files.filter(file => 
    /\.(js|mjs|cjs|json|env)$/.test(file) && 
    !file.includes('/node_modules/') &&
    !file.endsWith('package-lock.json') &&
    !file.endsWith('generate-cleanup-report.mjs') // Don't scan itself
  );
  
  const unprotectedSecrets = [];
  const whitelistedSecrets = [];
  const driftSecrets = [];
  
  // Updated patterns - "token" now requires assignment operator (not just variable names)
  const patterns = [
    { regex: /["']?[A-Z_]*API[_-]?KEY["']?\s*[:=]\s*["'][^"']+["']/gi, type: 'API Key' },
    { regex: /["']?[A-Z_]*SECRET[_-]?KEY["']?\s*[:=]\s*["'][^"']+["']/gi, type: 'Secret Key' },
    { regex: /"private_key":\s*"[^"]+"/gi, type: 'Private Key' },
    { regex: /password\s*[:=]\s*["'][^"']+["']/gi, type: 'Password' },
    // Token pattern now requires ASSIGNMENT (const token = "..."), not just variable names
    { regex: /\btoken\s*[:=]\s*["'][^"']+["']/gi, type: 'Token' }
  ];
  
  for (const file of codeFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        patterns.forEach(({ regex, type }) => {
          // Reset regex state
          regex.lastIndex = 0;
          const match = regex.exec(line);
          
          if (match) {
            // Don't flag if it's just a placeholder or empty
            if (/(PLACEHOLDER|YOUR_|EXAMPLE|test)/i.test(line) || 
                line.includes('""') || 
                line.includes("''")) {
              return;
            }
            
            // Skip if the match is inside a string literal
            const beforeMatch = line.substring(0, match.index);
            const singleQuotes = (beforeMatch.match(/'/g) || []).length;
            const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
            const backticks = (beforeMatch.match(/`/g) || []).length;
            
            // If odd number of quotes before match, we're inside a string literal
            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
              return;
            }
            
            const filePath = path.relative(PROJECT_ROOT, file);
            const lineNum = index + 1;
            
            // Check whitelist
            const whitelistEntry = matchSecretWhitelist(filePath, lineNum);
            
            if (whitelistEntry) {
              // Check if .gitignore protection exists (drift detection)
              const isProtected = checkGitignoreProtection(whitelistEntry.gitignorePattern);
              
              if (whitelistEntry.gitignorePattern && !isProtected) {
                // DRIFT DETECTED - whitelisted but protection removed!
                driftSecrets.push({
                  file: filePath,
                  line: lineNum,
                  type,
                  whitelistEntry
                });
              } else {
                // Whitelisted and protected (or intentionally public)
                whitelistedSecrets.push({
                  file: filePath,
                  line: lineNum,
                  type,
                  whitelistEntry
                });
              }
            } else {
              // Not whitelisted - potential security issue
              unprotectedSecrets.push({
                file: filePath,
                line: lineNum,
                type
              });
            }
          }
        });
      });
    } catch (err) {
      // Skip files we can't read
    }
  }
  
  return { unprotectedSecrets, whitelistedSecrets, driftSecrets };
}

/**
 * Category 7: Find large files (> 1MB)
 * @returns {Array<{file: string, sizeMB: number}>} Large files
 */
function findLargeFiles() {
  try {
    // Get tracked files with sizes in kilobytes for accuracy
    const output = execSync('git ls-files -z | xargs -0 du -k 2>/dev/null || true', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    const largeFiles = [];
    const lines = output.split('\n').filter(l => l.trim());
    const minSizeKB = LARGE_FILE_MB * 1024; // Convert MB to KB
    
    lines.forEach(line => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const sizeKB = parseInt(match[1], 10);
        const file = match[2];
        
        if (sizeKB >= minSizeKB) {
          const sizeMB = (sizeKB / 1024).toFixed(2);
          largeFiles.push({ file, sizeMB: parseFloat(sizeMB) });
        }
      }
    });
    
    return largeFiles;
  } catch (err) {
    return [];
  }
}

/**
 * Category 8: Find stale untracked files (> 7 days old)
 * @returns {Promise<Array<{file: string, daysOld: number}>>} Stale untracked files
 * @async-boundary
 */
async function findStaleUntrackedFiles() {
  try {
    // Get untracked files
    const output = execSync('git ls-files --others --exclude-standard', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    });
    
    const staleFiles = [];
    const now = Date.now();
    const cutoffTime = now - (DAYS_OLD_UNTRACKED * 24 * 60 * 60 * 1000);
    
    const files = output.split('\n').filter(f => f.trim());
    
    for (const file of files) {
      const fullPath = path.join(PROJECT_ROOT, file);
      
      try {
        const stats = await fs.stat(fullPath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          const daysOld = Math.floor((now - stats.mtime.getTime()) / (24 * 60 * 60 * 1000));
          staleFiles.push({ file, daysOld });
        }
      } catch (err) {
        // File doesn't exist or can't be read
      }
    }
    
    return staleFiles;
  } catch (err) {
    return [];
  }
}

/**
 * Category 9: Suggest .gitignore patterns
 * @param {Array} backupFiles - Backup files found
 * @param {Array} staleUntracked - Stale untracked files
 * @returns {Array<{pattern: string, reason: string}>} Suggested patterns
 */
function suggestGitignorePatterns(backupFiles, staleUntracked) {
  const suggestions = [];
  const existingPatterns = new Set();
  
  // Load existing .gitignore patterns
  try {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    const gitignoreContent = fsSync.readFileSync(gitignorePath, 'utf-8');
    gitignoreContent.split('\n').forEach(line => {
      const pattern = line.trim().split('#')[0].trim();
      if (pattern) existingPatterns.add(pattern);
    });
  } catch (err) {
    // .gitignore doesn't exist
  }
  
  // Check backup files for missing patterns
  const backupPatterns = {
    '*.bak': backupFiles.filter(f => f.endsWith('.bak')).length,
    '*.backup': backupFiles.filter(f => f.endsWith('.backup')).length,
    '*-old.*': backupFiles.filter(f => /-old\./.test(f)).length,
    'test-*.html': backupFiles.filter(f => /test-.*\.html/.test(f)).length,
    'test-*.css': backupFiles.filter(f => /test-.*\.css/.test(f)).length,
    'test-*.js': backupFiles.filter(f => /test-.*\.js/.test(f)).length
  };
  
  Object.entries(backupPatterns).forEach(([pattern, count]) => {
    if (count > 0 && !existingPatterns.has(pattern)) {
      suggestions.push({
        pattern,
        reason: `Found ${count} matching file(s)`,
        files: backupFiles.filter(f => {
          const regex = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');
          return new RegExp(regex).test(f);
        }).slice(0, 3)
      });
    }
  });
  
  // Check stale untracked for common patterns
  const untrackedExtensions = {};
  staleUntracked.forEach(({ file }) => {
    const ext = path.extname(file);
    if (ext) {
      untrackedExtensions[ext] = (untrackedExtensions[ext] || 0) + 1;
    }
  });
  
  Object.entries(untrackedExtensions).forEach(([ext, count]) => {
    const pattern = `*${ext}`;
    if (count >= 3 && !existingPatterns.has(pattern)) {
      suggestions.push({
        pattern,
        reason: `Found ${count} stale untracked file(s)`,
        files: staleUntracked
          .filter(({ file }) => file.endsWith(ext))
          .map(({ file }) => file)
          .slice(0, 3)
      });
    }
  });
  
  return suggestions;
}

/**
 * Generates and prints cleanup report
 * @returns {Promise<void>}
 * @async-boundary
 */
async function generateReport() {
  console.log('\n🧹 Post-Session Cleanup Report\n');
  console.log('Scanning codebase for pruning suggestions...\n');
  
  // Get all files
  const allFiles = await walkDirectory(PROJECT_ROOT);
  
  // Run all scans
  const [
    backupFiles,
    oldLogs,
    staleFiles,
    todoComments,
    orphanedScripts,
    commentedCode,
    secretsScan,
    staleUntracked
  ] = await Promise.all([
    findBackupFiles(allFiles),
    findOldLogs(allFiles),
    findStaleFiles(allFiles),
    findTodoComments(allFiles),
    findOrphanedScripts(allFiles),
    findCommentedCode(allFiles),
    findPotentialSecrets(allFiles),
    findStaleUntrackedFiles()
  ]);
  
  const { unprotectedSecrets, whitelistedSecrets, driftSecrets } = secretsScan;
  
  // Run synchronous checks
  const largeFiles = findLargeFiles();
  const gitignoreSuggestions = suggestGitignorePatterns(backupFiles, staleUntracked);
  
  // Generate report sections
  let issueCount = 0;
  
  // Category 1: Backup/Temp Files
  console.log('## 1. Backup/Temp Files\n');
  if (backupFiles.length > 0) {
    issueCount += backupFiles.length;
    backupFiles.forEach(file => {
      console.log(`- [ ] Delete: ${path.relative(PROJECT_ROOT, file)}`);
    });
  } else {
    console.log('✅ No backup/temp files found');
  }
  console.log('');
  
  // Category 2: Old Logs
  console.log(`## 2. Old Logs (> ${DAYS_OLD_LOGS} days)\n`);
  if (oldLogs.length > 0) {
    issueCount += oldLogs.length;
    oldLogs.forEach(({ file, age }) => {
      console.log(`- [ ] Delete: ${path.relative(PROJECT_ROOT, file)} (${age} days old)`);
    });
  } else {
    console.log('✅ No old logs found');
  }
  console.log('');
  
  // Category 3: Stale Files
  console.log(`## 3. Files Not Modified in ${DAYS_OLD_FILES}+ Days\n`);
  if (staleFiles.length > 0) {
    issueCount += staleFiles.length;
    console.log(`Found ${staleFiles.length} files (review for relevance):\n`);
    staleFiles.slice(0, 10).forEach(({ file, age }) => {
      console.log(`- [ ] Review: ${file} (${age} days old)`);
    });
    if (staleFiles.length > 10) {
      console.log(`\n... and ${staleFiles.length - 10} more`);
    }
  } else {
    console.log('✅ No stale files found');
  }
  console.log('');
  
  // Category 4: TODO Comments
  console.log('## 4. TODO/FIXME Comments\n');
  if (todoComments.length > 0) {
    issueCount += todoComments.length;
    console.log(`Found ${todoComments.length} TODO comments:\n`);
    todoComments.slice(0, 10).forEach(({ file, line, text }) => {
      console.log(`- [ ] ${file}:${line} - ${text}`);
    });
    if (todoComments.length > 10) {
      console.log(`\n... and ${todoComments.length - 10} more`);
    }
  } else {
    console.log('✅ No TODO comments found');
  }
  console.log('');
  
  // Category 5: Orphaned Scripts - REMOVED
  // This check has been removed (see findOrphanedScripts() for explanation)
  // Use `npm run docs:check` to catch truly unused exports via function-call-validator
  
  // Category 5: Large Commented Code (renumbered from 6)
  console.log(`## 5. Large Commented-Out Code Blocks (${MIN_COMMENTED_LINES}+ lines)\n`);
  if (commentedCode.length > 0) {
    issueCount += commentedCode.length;
    commentedCode.forEach(({ file, lines, startLine }) => {
      console.log(`- [ ] Review: ${file}:${startLine} (${lines} lines of commented code)`);
    });
    console.log('\nNote: JSDoc annotation blocks are excluded from this report.');
  } else {
    console.log('✅ No large commented code blocks found');
  }
  console.log('');
  
  // Category 6: Potential Secrets (renumbered from 7)
  console.log('## 6. 🚨 Potential Secrets (RED ALERT)\n');
  
  // DRIFT DETECTION - Whitelisted secrets with missing .gitignore protection
  if (driftSecrets.length > 0) {
    issueCount += driftSecrets.length;
    console.log('🚨🚨🚨 DRIFT DETECTED - Whitelist protection removed!\n');
    driftSecrets.forEach(({ file, line, type, whitelistEntry }) => {
      console.log(`- [ ] 🚨 DRIFT: ${type} at ${file}:${line}`);
      console.log(`      Reason: ${whitelistEntry.reason}`);
      console.log(`      Expected .gitignore: "${whitelistEntry.gitignorePattern}" at ${whitelistEntry.gitignoreReference}`);
      console.log(`      ⚠️  Protection MISSING - secret could be committed!`);
    });
    console.log('');
  }
  
  // Unprotected secrets - Real security issues
  if (unprotectedSecrets.length > 0) {
    issueCount += unprotectedSecrets.length;
    console.log('⚠️  CRITICAL: Unwhitelisted secrets detected!\n');
    unprotectedSecrets.forEach(({ file, line, type }) => {
      console.log(`- [ ] 🚨 ${type} at ${file}:${line}`);
    });
    console.log('');
  }
  
  // Whitelisted secrets - Info only
  if (whitelistedSecrets.length > 0) {
    console.log('ℹ️  Known secrets (whitelisted, protected):\n');
    whitelistedSecrets.forEach(({ file, line, type, whitelistEntry }) => {
      const protection = whitelistEntry.gitignorePattern 
        ? `protected by .gitignore: "${whitelistEntry.gitignorePattern}"`
        : 'intentionally public';
      console.log(`- [x] ${type} at ${file}:${line} (${protection})`);
    });
    console.log('');
  }
  
  // Summary
  if (driftSecrets.length === 0 && unprotectedSecrets.length === 0) {
    if (whitelistedSecrets.length > 0) {
      console.log('✅ All secrets are whitelisted and protected\n');
    } else {
      console.log('✅ No secrets detected\n');
    }
  }
  
  // Category 7: Large Files (> 1MB)
  console.log('## 7. 📦 Large Files (> 1MB)\n');
  if (largeFiles.length > 0) {
    issueCount += largeFiles.length;
    console.log(`Found ${largeFiles.length} large file(s) in git:\n`);
    largeFiles
      .sort((a, b) => b.sizeMB - a.sizeMB)
      .forEach(({ file, sizeMB }) => {
        console.log(`- [ ] ${file} (${sizeMB} MB)`);
      });
    console.log('\n⚠️  Large files slow down git operations and should be reviewed');
  } else {
    console.log('✅ No large files detected');
  }
  console.log('');
  
  // Category 8: Stale Untracked Files (> 7 days)
  console.log('## 8. 📁 Stale Untracked Files (> 7 days)\n');
  if (staleUntracked.length > 0) {
    issueCount += staleUntracked.length;
    console.log(`Found ${staleUntracked.length} stale untracked file(s):\n`);
    staleUntracked
      .sort((a, b) => b.daysOld - a.daysOld)
      .slice(0, 20)
      .forEach(({ file, daysOld }) => {
        console.log(`- [ ] ${file} (${daysOld} days old)`);
      });
    if (staleUntracked.length > 20) {
      console.log(`... and ${staleUntracked.length - 20} more`);
    }
    console.log('\n⚠️  Consider committing, deleting, or adding to .gitignore');
  } else {
    console.log('✅ No stale untracked files');
  }
  console.log('');
  
  // Category 9: .gitignore Suggestions
  console.log('## 9. 🚫 .gitignore Suggestions\n');
  if (gitignoreSuggestions.length > 0) {
    console.log('Suggested patterns to add to .gitignore:\n');
    gitignoreSuggestions.forEach(({ pattern, reason, files }) => {
      console.log(`- [ ] \`${pattern}\` - ${reason}`);
      if (files && files.length > 0) {
        console.log(`      Examples: ${files.join(', ')}`);
      }
    });
    console.log('\n💡 These patterns would prevent similar files from being tracked');
  } else {
    console.log('✅ No new .gitignore patterns suggested');
  }
  console.log('');
  
  // Summary
  console.log('---\n');
  console.log('## Summary\n');
  if (issueCount === 0) {
    console.log('✅ No cleanup items found - codebase is clean!\n');
  } else {
    console.log(`Found ${issueCount} items to review\n`);
    if (driftSecrets.length > 0) {
      console.log('🚨🚨🚨 **DRIFT ALERT:** Whitelisted secrets lost .gitignore protection!\n');
    }
    if (unprotectedSecrets.length > 0) {
      console.log('🚨 **CRITICAL:** Unwhitelisted secrets detected - review IMMEDIATELY\n');
    }
  }
  
  console.log('Run `/maintenance` regularly to keep cruft under control.\n');
}

// Run the report
generateReport().catch(err => {
  console.error('Error generating cleanup report:', err);
  process.exit(1);
});

