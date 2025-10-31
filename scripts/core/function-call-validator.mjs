/**
 * Function Call Validator
 * Validates all function calls in the codebase - catches typos, missing imports, deleted functions
 * Universal validator from desloppify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScopeTracker } from '../scope-tracker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// ============================================================================
// CONFIGURATION
// ============================================================================

const THIRD_PARTY_WHITELIST = [
  // Browser APIs
  'console',
  'document',
  'window',
  'navigator',
  'localStorage',
  'sessionStorage',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'fetch',
  'XMLHttpRequest',
  'FormData',
  'URLSearchParams',
  'URL',
  'Blob',
  'File',
  'FileReader',
  'Image',
  'Audio',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'IntersectionObserver',
  'ResizeObserver',
  'WebSocket',
  'Worker',
  
  // JavaScript built-ins
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Math',
  'Date',
  'RegExp',
  'Error',
  'Promise',
  'Set',
  'Map',
  'WeakSet',
  'WeakMap',
  'Symbol',
  'Proxy',
  'Reflect',
  'JSON',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'escape',
  'unescape',
  'eval',
  
  // Third-party libraries (RavenOS-specific)
  'morphdom',
  'marked',
  'firebase',
  'initializeApp',
  'getAuth',
  'getFirestore',
  'getStorage',
  'onAuthStateChanged',
  'signInWithPopup',
  'signOut',
  'GoogleAuthProvider',
  'collection',
  'doc',
  'getDoc',
  'getDocs',
  'setDoc',
  'updateDoc',
  'deleteDoc',
  'query',
  'where',
  'orderBy',
  'limit',
  'onSnapshot',
  'Timestamp',
  'FieldValue',
  'arrayUnion',
  'arrayRemove',
  'increment',
  'serverTimestamp',
  
  // Common DOM methods (we'll match these as method calls)
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'querySelector',
  'querySelectorAll',
  'createElement',
  'createTextNode',
  'appendChild',
  'removeChild',
  'insertBefore',
  'replaceChild',
  'addEventListener',
  'removeEventListener',
  'dispatchEvent',
  'preventDefault',
  'stopPropagation',
  'setAttribute',
  'getAttribute',
  'removeAttribute',
  'classList',
  'add',
  'remove',
  'toggle',
  'contains',
  'focus',
  'blur',
  'click',
  'submit',
  'reset',
  'scrollIntoView',
  'scrollTo',
  'scrollBy',
  'getComputedStyle',
  'getContext',
  'getBoundingClientRect',
  'matches',
  'closest',
  'innerHTML',
  'innerText',
  'textContent',
  'value',
  'checked',
  'disabled',
  'hidden',
  'style',
  'className',
  'id',
  'src',
  'href',
  'alt',
  'title',
  'data',
  'type',
  'name',
  'placeholder',
  'required',
  'readOnly',
  'maxLength',
  'minLength',
  'max',
  'min',
  'step',
  'pattern',
  'autocomplete',
  'autofocus',
  'multiple',
  'size',
  'rows',
  'cols',
  'wrap',
  'accept',
  'capture',
  'loading',
  'decoding',
  'crossOrigin',
  'integrity',
  'referrerPolicy',
  'rel',
  'target',
  'download',
  'ping',
  'hreflang',
  'media',
  'method',
  'action',
  'enctype',
  'novalidate',
  'formaction',
  'formenctype',
  'formmethod',
  'formnovalidate',
  'formtarget',
  
  // Array/String methods (common ones)
  'map',
  'filter',
  'reduce',
  'forEach',
  'find',
  'findIndex',
  'some',
  'every',
  'includes',
  'indexOf',
  'lastIndexOf',
  'slice',
  'splice',
  'push',
  'pop',
  'shift',
  'unshift',
  'concat',
  'join',
  'reverse',
  'sort',
  'flat',
  'flatMap',
  'fill',
  'copyWithin',
  'entries',
  'keys',
  'values',
  'length',
  'charAt',
  'charCodeAt',
  'codePointAt',
  'substring',
  'substr',
  'split',
  'trim',
  'trimStart',
  'trimEnd',
  'padStart',
  'padEnd',
  'repeat',
  'replace',
  'replaceAll',
  'match',
  'matchAll',
  'search',
  'toLowerCase',
  'toUpperCase',
  'toLocaleLowerCase',
  'toLocaleUpperCase',
  'normalize',
  'startsWith',
  'endsWith',
  'localeCompare',
  'toString',
  'valueOf',
  'toFixed',
  'toExponential',
  'toPrecision',
  'toLocaleString',
  'toJSON',
  'toISOString',
  'toDateString',
  'toTimeString',
  'toUTCString',
  'getTime',
  'getFullYear',
  'getMonth',
  'getDate',
  'getDay',
  'getHours',
  'getMinutes',
  'getSeconds',
  'getMilliseconds',
  'setTime',
  'setFullYear',
  'setMonth',
  'setDate',
  'setHours',
  'setMinutes',
  'setSeconds',
  'setMilliseconds',
  'test',
  'exec',
  'then',
  'catch',
  'finally',
  'resolve',
  'reject',
  'all',
  'allSettled',
  'race',
  'any',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'constructor',
  'prototype',
  'call',
  'apply',
  'bind',
];

const FILES_TO_SKIP = [
  'node_modules',
  '.git',
  'firebase-debug.log',
  'combined.log',
  'error.log',
  'debug.txt',
  'restart_debug.log',
  'roadmap.txt',
  'server_output.log',
  '.backup',
  '.bak',
  '.old',
  'scripts/',     // Skip all scripts - they're one-off tools, not production code
  'docs/',        // Skip all docs - no executable code to validate
];

const JS_FILE_PATTERNS = [
  '**/*.js',
  '**/*.mjs',
];

// ============================================================================
// MILESTONE 1: BUILD FUNCTION REGISTRY
// ============================================================================

/**
 * Recursively get all JS files in a directory
 */
function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip files/dirs we don't care about
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

/**
 * Extract all function definitions from a file
 * Returns: { functionName: { file, type, line } }
 */
function extractFunctionDefinitions(filePath, content) {
  const functions = {};
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Pattern 1: function myFunction() { } or async function myFunction() { }
    const funcDeclarationMatch = trimmed.match(/^(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (funcDeclarationMatch) {
      const funcName = funcDeclarationMatch[2]; // Group 2 because group 1 is async (optional)
      functions[funcName] = {
        file: filePath,
        type: 'declaration',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 2: const myFunction = () => { } or const myFunction = function() { }
    const constFuncMatch = trimmed.match(/^(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/);
    if (constFuncMatch) {
      const funcName = constFuncMatch[1];
      functions[funcName] = {
        file: filePath,
        type: 'const',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 3: export function myFunction() { } or export async function myFunction() { }
    const exportFuncMatch = trimmed.match(/^export\s+(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (exportFuncMatch) {
      const funcName = exportFuncMatch[2]; // Group 2 because group 1 is async (optional)
      functions[funcName] = {
        file: filePath,
        type: 'export',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 4: export const myFunction = () => { }
    const exportConstMatch = trimmed.match(/^export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/);
    if (exportConstMatch) {
      const funcName = exportConstMatch[1];
      functions[funcName] = {
        file: filePath,
        type: 'export',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 5: window.myFunction = function() { }
    const windowFuncMatch = trimmed.match(/^window\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/);
    if (windowFuncMatch) {
      const funcName = windowFuncMatch[1];
      functions[funcName] = {
        file: filePath,
        type: 'window',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 6: myClass.prototype.method = function() { }
    const prototypeMatch = trimmed.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\.prototype\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/);
    if (prototypeMatch) {
      const funcName = prototypeMatch[1];
      functions[funcName] = {
        file: filePath,
        type: 'prototype',
        line: lineNum,
      };
      return;
    }
    
    // Pattern 7: Object method shorthand: myMethod() { }
    const methodShorthandMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/);
    // But exclude things like if, for, while, etc.
    if (methodShorthandMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodShorthandMatch[1])) {
      const funcName = methodShorthandMatch[1];
      // Only count if it looks like it's in an object literal context
      // This is a simplification - we're being conservative here
      if (line.includes(':') || lines[index - 1]?.trim().endsWith(',') || lines[index - 1]?.trim().endsWith('{')) {
        functions[funcName] = {
          file: filePath,
          type: 'method',
          line: lineNum,
        };
      }
      return;
    }
  });
  
  return functions;
}

/**
 * Build the complete function registry for the entire codebase
 */
function buildFunctionRegistry(quiet = false) {
  if (!quiet) {
    console.log('🔍 Building function registry...\n');
  }
  
  const allFunctions = {};
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  if (!quiet) {
    console.log(`📁 Found ${jsFiles.length} JavaScript files\n`);
  }
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const functions = extractFunctionDefinitions(relativePath, content);
    
    // Merge into global registry
    Object.entries(functions).forEach(([funcName, info]) => {
      if (!allFunctions[funcName]) {
        allFunctions[funcName] = [];
      }
      // Ensure allFunctions[funcName] is an array
      if (Array.isArray(allFunctions[funcName])) {
        allFunctions[funcName].push(info);
      }
    });
  });
  
  // Summary stats
  const totalFunctions = Object.keys(allFunctions).length;
  const multipleDefs = Object.entries(allFunctions).filter(([_, defs]) => defs.length > 1).length;
  
  if (!quiet) {
    console.log(`✅ Registry built:`);
    console.log(`   📦 ${totalFunctions} unique function names`);
    console.log(`   🔄 ${multipleDefs} functions with multiple definitions`);
    console.log('');
  }
  
  return allFunctions;
}

/**
 * Check if a function name is in the third-party whitelist
 */
function isThirdParty(funcName) {
  return THIRD_PARTY_WHITELIST.includes(funcName);
}

// ============================================================================
// MILESTONE 2: DETECT FUNCTION CALLS
// ============================================================================

/**
 * Extract all function calls from a file
 * Returns: [{ call, line, type, fullMatch }]
 */
function extractFunctionCalls(filePath, content) {
  const calls = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Skip strings (simple heuristic - if the line is mostly within quotes, skip it)
    const stringContentLength = (line.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || []).join('').length;
    if (stringContentLength > line.length * 0.5) {
      return; // More than half the line is string content
    }
    
    // Strip inline comments to avoid false positives from comment text
    // Remove // comments and /* */ comments (simple approach)
    let lineWithoutComments = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    
    // Strip string literals to avoid false positives from string content (e.g., CSS in strings)
    // Replace strings with empty strings to avoid detecting function calls within them
    lineWithoutComments = lineWithoutComments.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');
    
    // Skip function definitions (don't treat them as function calls!)
    // Match: function myFunc(), async function myFunc(), export function myFunc(), export default function myFunc()
    if (/^(export\s+(default\s+)?)?(async\s+)?function\s+[a-zA-Z_$]/.test(trimmed)) {
      return;
    }
    // Match: const myFunc = function(), const myFunc = () =>, export const myFunc = , export default myFunc
    if (/^(export\s+(default\s+)?)?(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(function|async|\([^)]*\)\s*=>)/.test(trimmed)) {
      return;
    }
    // Match: myMethod() { or async myMethod() { (object method shorthand)
    if (/^(async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/.test(trimmed)) {
      return;
    }
    
    // Pattern 1: Simple function call - myFunction()
    // Use negative lookbehind to exclude method calls (obj.method)
    const simpleCalls = lineWithoutComments.matchAll(/(?<![.\?])\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
    for (const match of simpleCalls) {
      const funcName = match[1];
      
      // Skip control flow keywords and JavaScript reserved words
      const reservedKeywords = [
        // Control flow
        'if', 'for', 'while', 'switch', 'catch', 'function', 'async',
        // Module system
        'import', 'export', 'require',  // require is Node.js/CommonJS
        // Operators/keywords that can appear with parentheses
        'typeof', 'void', 'delete', 'yield', 'await',
        // Class/constructor
        'super', 'new', 'this',
        // Other
        'return', 'throw', 'break', 'continue'
      ];
      if (reservedKeywords.includes(funcName)) {
        continue;
      }
      
      calls.push({
        call: funcName,
        line: lineNum,
        type: 'simple',
        fullMatch: match[0],
      });
    }
    
    // Pattern 2: Window call - window.myFunction()
    const windowCalls = lineWithoutComments.matchAll(/window\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
    for (const match of windowCalls) {
      const funcName = match[1];
      calls.push({
        call: funcName,
        line: lineNum,
        type: 'window',
        fullMatch: match[0],
      });
    }
    
    // Pattern 3: Method call - obj.method()
    // We'll capture the method name but be lenient about validation
    const methodCalls = lineWithoutComments.matchAll(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
    for (const match of methodCalls) {
      const methodName = match[1];
      
      // Skip common built-in methods that we already whitelist
      // We'll validate these against the whitelist later
      calls.push({
        call: methodName,
        line: lineNum,
        type: 'method',
        fullMatch: match[0],
      });
    }
    
    // Pattern 4: Optional chaining - obj?.method()
    const optionalCalls = lineWithoutComments.matchAll(/\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
    for (const match of optionalCalls) {
      const funcName = match[1];
      calls.push({
        call: funcName,
        line: lineNum,
        type: 'optional',
        fullMatch: match[0],
      });
    }
    
    // Pattern 5: Event listener callbacks - addEventListener('event', handlerFunc)
    // Specifically look for addEventListener and removeEventListener patterns
    const eventListenerPattern = /(?:add|remove)EventListener\s*\(\s*['"][^'"]*['"]\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[,\)]/g;
    const eventListenerMatches = lineWithoutComments.matchAll(eventListenerPattern);
    for (const match of eventListenerMatches) {
      const funcName = match[1];
      
      calls.push({
        call: funcName,
        line: lineNum,
        type: 'event-listener-callback',
        fullMatch: match[0],
      });
    }
    
    // Pattern 6: Common callback patterns - setTimeout, setInterval, requestAnimationFrame, Promise.then, array methods
    // Match specific callback-taking functions to avoid false positives
    const callbackFunctionPattern = /(?:setTimeout|setInterval|requestAnimationFrame|then|catch|finally|filter|map|forEach|reduce|find|some|every|findIndex)\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[,\)]/g;
    const callbackFunctionMatches = lineWithoutComments.matchAll(callbackFunctionPattern);
    for (const match of callbackFunctionMatches) {
      const funcName = match[1];
      
      // Skip keywords and common variable names
      if (['true', 'false', 'null', 'undefined', 'this', 'function', 'async'].includes(funcName)) {
        continue;
      }
      
      calls.push({
        call: funcName,
        line: lineNum,
        type: 'callback',
        fullMatch: match[0],
      });
    }
  });
  
  return calls;
}

/**
 * Build a map of all function calls in the codebase
 * Returns: { filePath: [calls] }
 */
function buildFunctionCallsMap(quiet = false) {
  if (!quiet) {
    console.log('🔍 Detecting function calls...\n');
  }
  
  const allCalls = {};
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const calls = extractFunctionCalls(relativePath, content);
    
    if (calls.length > 0) {
      allCalls[relativePath] = calls;
    }
  });
  
  // Summary stats
  const totalFiles = Object.keys(allCalls).length;
  const totalCalls = Object.values(allCalls).reduce((sum, calls) => sum + calls.length, 0);
  const uniqueCalls = new Set(Object.values(allCalls).flat().map(call => call.call)).size;
  
  if (!quiet) {
    console.log(`✅ Function calls detected:`);
    console.log(`   📁 ${totalFiles} files with function calls`);
    console.log(`   📞 ${totalCalls} total function calls`);
    console.log(`   🔤 ${uniqueCalls} unique function names called`);
    console.log('');
  }
  
  return allCalls;
}

// ============================================================================
// MILESTONE 3: VALIDATE IMPORTS VS EXPORTS
// ============================================================================

/**
 * Extract ES6 imports from a file
 * Returns: { importName: { from, line, exists } }
 */
function extractImports(filePath, content) {
  const imports = {};
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Pattern 1: import { a, b, c } from './module.js'
    const namedImportMatch = trimmed.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
    if (namedImportMatch) {
      const importNames = namedImportMatch[1].split(',').map(name => {
        // Handle rename: { a as b }
        const parts = name.trim().split(/\s+as\s+/);
        return parts[0].trim();
      });
      const modulePath = namedImportMatch[2];
      
      importNames.forEach(importName => {
        imports[importName] = {
          from: modulePath,
          line: lineNum,
          exists: null, // Will be validated later
        };
      });
      return;
    }
    
    // Pattern 2: import defaultExport from './module.js'
    const defaultImportMatch = trimmed.match(/^import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]/);
    if (defaultImportMatch) {
      const importName = defaultImportMatch[1];
      const modulePath = defaultImportMatch[2];
      
      imports[importName] = {
        from: modulePath,
        line: lineNum,
        exists: null,
        isDefault: true,
      };
      return;
    }
    
    // Pattern 3: import * as namespace from './module.js'
    const namespaceImportMatch = trimmed.match(/^import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]/);
    if (namespaceImportMatch) {
      const importName = namespaceImportMatch[1];
      const modulePath = namespaceImportMatch[2];
      
      imports[importName] = {
        from: modulePath,
        line: lineNum,
        exists: true, // Namespace imports always "exist"
        isNamespace: true,
      };
      return;
    }
  });
  
  return imports;
}

/**
 * Extract ES6 exports from a file
 * Returns: Set of exported names
 */
function extractExports(filePath, content) {
  const exports = new Set();
  const lines = content.split('\n');
  
  // First, handle multi-line export { } statements
  // Match export { ... } across multiple lines
  const multiLineExportMatch = content.match(/export\s*\{([^}]+)\}/s);
  if (multiLineExportMatch) {
    const exportBody = multiLineExportMatch[1];
    // Split by comma or newline, extract identifiers
    const exportNames = exportBody
      .split(/[,\n]/)
      .map(part => part.trim())
      .filter(part => part && !part.startsWith('//')) // Remove empty lines and comments
      .map(part => {
        // Handle rename: { a as b } - we want the original name
        // Also remove trailing comments
        const cleanPart = part.replace(/\/\/.*$/, '').trim();
        const parts = cleanPart.split(/\s+as\s+/);
        return parts[0].trim();
      })
      .filter(name => name && /^[a-zA-Z_$]/.test(name)); // Valid identifier
    
    exportNames.forEach(name => exports.add(name));
  }
  
  // Then, handle single-line patterns
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Pattern 1: export function myFunc() { } or export async function myFunc() { }
    const exportFuncMatch = trimmed.match(/^export\s+(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (exportFuncMatch) {
      exports.add(exportFuncMatch[2]); // Group 2 because group 1 is async (optional)
      return;
    }
    
    // Pattern 2: export const myFunc = ...
    const exportConstMatch = trimmed.match(/^export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (exportConstMatch) {
      exports.add(exportConstMatch[1]);
      return;
    }
    
    // Pattern 3: export let/var myFunc = ...
    const exportVarMatch = trimmed.match(/^export\s+(?:let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (exportVarMatch) {
      exports.add(exportVarMatch[1]);
      return;
    }
    
    // Pattern 4: export default ...
    if (trimmed.match(/^export\s+default/)) {
      exports.add('default');
      return;
    }
  });
  
  return exports;
}

/**
 * Resolve a module path relative to the importing file
 */
function resolveModulePath(importerPath, modulePath) {
  // If it's a relative import (starts with ./ or ../)
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    const importerDir = path.dirname(importerPath);
    const resolved = path.resolve(PROJECT_ROOT, importerDir, modulePath);
    return path.relative(PROJECT_ROOT, resolved);
  }
  
  // If it's an absolute path from project root
  if (modulePath.startsWith('/')) {
    return modulePath.substring(1);
  }
  
  // Otherwise, it's a node_modules import (skip validation)
  return null;
}

/**
 * Validate all imports in the codebase
 * Returns: { errors: [], warnings: [] }
 */
function validateImports(quiet = false) {
  if (!quiet) {
    console.log('🔍 Validating imports...\n');
  }
  
  const errors = [];
  const warnings = [];
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  // First pass: Build export map for all modules
  const exportMap = {};
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports = extractExports(relativePath, content);
    exportMap[relativePath] = exports;
  });
  
  // Second pass: Validate imports
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = extractImports(relativePath, content);
    
    Object.entries(imports).forEach(([importName, importInfo]) => {
      // Skip namespace imports (always valid)
      if (importInfo.isNamespace) {
        return;
      }
      
      // Resolve the module path
      const resolvedPath = resolveModulePath(relativePath, importInfo.from);
      
      // Skip node_modules imports
      if (!resolvedPath) {
        return;
      }
      
      // Check if the module file exists
      if (!exportMap[resolvedPath]) {
        // Try with .js extension if not present
        const withJs = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
        if (!exportMap[withJs]) {
          errors.push({
            file: relativePath,
            line: importInfo.line,
            message: `Module not found: "${importInfo.from}"`,
            import: importName,
            resolvedPath: resolvedPath,
          });
          return;
        }
        // Use the .js version
        importInfo.from = withJs;
      }
      
      // Check if the import exists in the module
      const moduleExports = exportMap[resolvedPath] || exportMap[`${resolvedPath}.js`] || new Set();
      
      if (importInfo.isDefault) {
        // Check for default export
        if (!moduleExports.has('default')) {
          warnings.push({
            file: relativePath,
            line: importInfo.line,
            message: `Module "${importInfo.from}" does not have a default export`,
            import: importName,
          });
        }
      } else {
        // Check for named export
        if (!moduleExports.has(importName)) {
          const available = Array.from(moduleExports).filter(name => name !== 'default');
          errors.push({
            file: relativePath,
            line: importInfo.line,
            message: `Module "${importInfo.from}" does not export "${importName}"`,
            import: importName,
            available: available.length > 0 ? available : ['(no exports)'],
          });
        }
      }
    });
  });
  
  // Summary
  if (!quiet) {
    console.log(`✅ Import validation complete:`);
    console.log(`   ❌ ${errors.length} import errors`);
    console.log(`   ⚠️  ${warnings.length} import warnings`);
    console.log('');
  }
  
  return { errors, warnings };
}

// ============================================================================
// MILESTONE 4: VALIDATE FUNCTION CALLS
// ============================================================================

/**
 * Analyze file for local function references (callbacks, named function expressions)
 * using brace-depth tracking: if a name appears 2+ times inside functions, it's local
 */
function detectLocalReferences(content) {
  const lines = content.split('\n');
  const nameOccurrences = new Map(); // name -> [lineNumbers]
  let braceDepth = 0;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Strip strings and comments to avoid false matches
    let cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    cleanLine = cleanLine.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');
    
    // Track brace depth
    braceDepth += (cleanLine.match(/\{/g) || []).length;
    braceDepth -= (cleanLine.match(/\}/g) || []).length;
    
    // Keep depth non-negative (in case of partial code)
    if (braceDepth < 0) braceDepth = 0;
    
    // If depth > 0, we're inside a function
    if (braceDepth > 0) {
      // Pattern 1: Find all function calls (anything followed by parentheses)
      const callMatches = cleanLine.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
      for (const match of callMatches) {
        const name = match[1];
        // Skip keywords
        if (['if', 'for', 'while', 'switch', 'catch', 'function', 'async', 'return'].includes(name)) {
          continue;
        }
        
        if (!nameOccurrences.has(name)) {
          nameOccurrences.set(name, []);
        }
        nameOccurrences.get(name).push(lineNum);
      }
      
      // Pattern 2: Find function references in callback contexts (passed as parameters)
      // Look for: addEventListener('event', functionName) or removeEventListener('event', functionName)
      const refMatches = cleanLine.matchAll(/(?:addEventListener|removeEventListener|setTimeout|setInterval|requestAnimationFrame|then|catch|finally|filter|map|forEach|reduce|find|some|every)\s*\([^)]*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[,)]/g);
      for (const match of refMatches) {
        const name = match[1];
        if (!nameOccurrences.has(name)) {
          nameOccurrences.set(name, []);
        }
        nameOccurrences.get(name).push(lineNum);
      }
      
      // Pattern 3: Arrow function parameters - (param1, param2) =>
      const arrowParamMatches = cleanLine.matchAll(/\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\s*,\s*[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*\)\s*=>/g);
      for (const match of arrowParamMatches) {
        const paramsStr = match[1];
        // Split by comma and extract each parameter name
        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        params.forEach(param => {
          if (!nameOccurrences.has(param)) {
            nameOccurrences.set(param, []);
          }
          nameOccurrences.get(param).push(lineNum);
        });
      }
      
      // Pattern 4: Variable declarations - const/let/var functionName =
      // Track variables that might hold functions
      const varDeclMatches = cleanLine.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g);
      for (const match of varDeclMatches) {
        const name = match[1];
        if (!nameOccurrences.has(name)) {
          nameOccurrences.set(name, []);
        }
        nameOccurrences.get(name).push(lineNum);
      }
    }
  });
  
  // Return names that appeared 2+ times inside functions (likely local callbacks/parameters)
  const localReferences = new Set();
  for (const [name, lines] of nameOccurrences.entries()) {
    if (lines.length >= 2) {
      localReferences.add(name);
    }
  }
  
  return localReferences;
}

/**
 * Build a map of what's available in each file's scope
 * Returns: { filePath: { localFunctions: Set, imports: Set, windowFunctions: Set, localReferences: Set } }
 */
function buildScopeMap() {
  const scopeMap = {};
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  // Global window functions (from index.js and standalone scripts)
  const windowFunctions = new Set();
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Local functions defined in this file
    const localFunctions = new Set();
    const functions = extractFunctionDefinitions(relativePath, content);
    Object.keys(functions).forEach(funcName => localFunctions.add(funcName));
    
    // Functions attached to window
    Object.entries(functions).forEach(([funcName, info]) => {
      if (info.type === 'window') {
        windowFunctions.add(funcName);
      }
    });
    
    // Imported functions
    const imports = new Set();
    const importMap = extractImports(relativePath, content);
    Object.keys(importMap).forEach(importName => imports.add(importName));
    
    // Local references (callbacks, named function expressions that reference themselves)
    const localReferences = detectLocalReferences(content);
    
    scopeMap[relativePath] = {
      localFunctions,
      imports,
      windowFunctions, // Will be the same for all files (global)
      localReferences,
    };
  });
  
  // Now set the global windowFunctions for all files
  Object.values(scopeMap).forEach(scope => {
    scope.windowFunctions = windowFunctions;
  });
  
  return scopeMap;
}

/**
 * Check if a function call is valid in a given scope
 * Returns: { valid: boolean, reason: string }
 */
function validateCall(call, file, scopeMap) {
  const scope = scopeMap[file];
  
  if (!scope) {
    return { valid: true, reason: 'no scope info' }; // Can't validate, skip
  }
  
  const funcName = call.call;
  
  // 1. Is it a third-party function?
  if (isThirdParty(funcName)) {
    return { valid: true, reason: 'third-party' };
  }
  
  // 2. Is it defined locally in this file?
  if (scope.localFunctions.has(funcName)) {
    return { valid: true, reason: 'local' };
  }
  
  // 3. Is it imported?
  if (scope.imports.has(funcName)) {
    return { valid: true, reason: 'imported' };
  }
  
  // 4. Is it on window (from index.js)?
  if (scope.windowFunctions.has(funcName)) {
    return { valid: true, reason: 'window' };
  }
  
  // 5. Is it a local reference (callback parameter, named function expression)?
  if (scope.localReferences && scope.localReferences.has(funcName)) {
    return { valid: true, reason: 'local reference (callback/named function)' };
  }
  
  // 6. Special case: method calls (e.g., obj.method())
  // We're more lenient with these since we can't validate the object type
  if (call.type === 'method' || call.type === 'optional') {
    return { valid: true, reason: 'method (unvalidated)' };
  }
  
  // 7. Special case: callback arguments
  // These might be variables, not function names
  if (call.type === 'callback') {
    return { valid: true, reason: 'callback (unvalidated)' };
  }
  
  // 8. If we got here, it's potentially an error
  return { valid: false, reason: 'undefined' };
}

/**
 * Find similar function names (for suggestions)
 */
function findSimilarNames(funcName, availableNames) {
  const similar = [];
  
  availableNames.forEach(availableName => {
    // Case-insensitive match
    if (availableName.toLowerCase() === funcName.toLowerCase()) {
      similar.push(availableName);
      return;
    }
    
    // Levenshtein distance of 1-2 (simple approximation)
    const lenDiff = Math.abs(availableName.length - funcName.length);
    if (lenDiff <= 2) {
      // Count character differences
      let diffs = 0;
      for (let i = 0; i < Math.min(availableName.length, funcName.length); i++) {
        if (availableName[i].toLowerCase() !== funcName[i].toLowerCase()) {
          diffs++;
        }
      }
      
      if (diffs + lenDiff <= 2) {
        similar.push(availableName);
      }
    }
  });
  
  return similar;
}

/**
 * Validate all function calls in the codebase
 */
function validateAllFunctionCalls(functionCalls, functionRegistry, quiet = false) {
  if (!quiet) {
    console.log('🔍 Validating function calls...\n');
  }
  
  const scopeMap = buildScopeMap();
  const errors = [];
  
  Object.entries(functionCalls).forEach(([file, calls]) => {
    calls.forEach(call => {
      const validation = validateCall(call, file, scopeMap);
      
      if (!validation.valid) {
        // Get all available function names for suggestions
        const scope = scopeMap[file];
        const availableNames = new Set([
          ...scope.localFunctions,
          ...scope.imports,
          ...scope.windowFunctions,
          ...Object.keys(functionRegistry),
        ]);
        
        const suggestions = findSimilarNames(call.call, availableNames);
        
        errors.push({
          file,
          line: call.line,
          call: call.call,
          type: call.type,
          suggestions,
        });
      }
    });
  });
  
  // Summary
  if (!quiet) {
    console.log(`✅ Function call validation complete:`);
    console.log(`   ❌ ${errors.length} undefined function calls`);
    console.log('');
  }
  
  return { errors };
}

// ============================================================================
// BUG PATTERN #1: MISSING ERROR HANDLERS (CRITICAL)
// ============================================================================

/**
 * Check for async functions without try/catch blocks
 * Returns: [{ file, line, funcName, issue }]
 */
function detectMissingErrorHandlers(filePath, content) {
  const errors = [];
  const lines = content.split('\n');
  
  // Track async functions and whether they have try/catch
  const asyncFunctions = [];
  let currentFunction = null;
  let braceDepth = 0;
  let hasTryCatch = false;
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
      hasTryCatch = false;
      functionComments = []; // Reset comments
    } else if (!currentFunction && trimmed !== '') {
      // Reset comments if we hit non-comment, non-function code
      functionComments = [];
    }
    
    // Track brace depth when inside a function
    if (currentFunction) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      
      // Check for try/catch
      if (trimmed.includes('try') && trimmed.includes('{')) {
        hasTryCatch = true;
      }
      
      // Function ended (braces balanced and we've seen at least one opening brace)
      if (braceDepth <= 0 && line.includes('}')) {
        asyncFunctions.push({
          ...currentFunction,
          endLine: lineNum,
          hasTryCatch,
        });
        currentFunction = null;
      }
    }
  });
  
  // Check each async function for try/catch
  asyncFunctions.forEach(func => {
    if (!func.hasTryCatch) {
      // EXEMPTION 1: Check for intentional async comments
      const commentsText = func.comments ? func.comments.join(' ').toLowerCase() : '';
      const hasIntentComment = 
        commentsText.includes('keep async') || 
        commentsText.includes('intentionally async') ||
        commentsText.includes('intentional async') ||
        commentsText.includes('must be async') ||
        commentsText.includes('no try/catch needed') ||
        commentsText.includes('errors handled by caller');
      
      // EXEMPTION 2: Check for JSDoc Promise return type
      const hasPromiseReturnType = 
        commentsText.includes('@returns {promise') ||
        commentsText.includes('@return {promise');
      
      // EXEMPTION 3: Check for Express handler pattern (req, res, next?)
      const isExpressHandler = func.params && (
        /req\s*,\s*res/.test(func.params) ||
        /request\s*,\s*response/.test(func.params)
      );
      
      // Only flag if it doesn't match any exemption
      if (!hasIntentComment && !hasPromiseReturnType && !isExpressHandler) {
        errors.push({
          file: filePath,
          line: func.startLine,
          funcName: func.name,
          issue: 'async function without try/catch',
          severity: 'critical',
        });
      }
    }
  });
  
  // Check for .then() without .catch() using depth tracking
  let promiseChains = []; // Track active promise chains
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Strip inline comments and strings to avoid false matches
    let cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    cleanLine = cleanLine.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');
    
    // Look for .then( to start tracking a chain
    if (cleanLine.includes('.then(')) {
      // Start new promise chain tracking
      promiseChains.push({
        startLine: lineNum,
        depth: 0,
        hasCatch: false,
        hasTwoArgThen: false, // Track if .then() has 2 arguments (success, error)
        started: false,
        checkingForComma: false, // Are we looking for the comma separator?
      });
    }
    
    // Update all active promise chains
    promiseChains = promiseChains.filter(chain => {
      // If we haven't started depth tracking yet, look for the opening paren after .then
      if (!chain.started) {
        const thenIndex = cleanLine.indexOf('.then(');
        if (thenIndex !== -1) {
          chain.started = true;
          chain.checkingForComma = true; // Now we'll look for comma at depth 1
          // Count parens/braces from the .then( onward
          const afterThen = cleanLine.substring(thenIndex + 6); // Skip '.then('
          
          // Process character by character to detect comma at right depth
          let tempDepth = 1; // Start at 1 because we're inside .then(
          for (let i = 0; i < afterThen.length; i++) {
            const char = afterThen[i];
            if (char === '(' || char === '{') {
              tempDepth++;
            } else if (char === ')' || char === '}') {
              tempDepth--;
            } else if (char === ',' && tempDepth === 1) {
              // Found comma at depth 1 - this is .then(success, error) pattern!
              chain.hasTwoArgThen = true;
              chain.checkingForComma = false;
            }
          }
          
          chain.depth += (afterThen.match(/[\(\{]/g) || []).length;
          chain.depth -= (afterThen.match(/[\)\}]/g) || []).length;
          chain.depth += 1; // The opening paren of .then( itself
        }
      } else {
        // If still checking for comma, process char-by-char to detect it
        if (chain.checkingForComma) {
          let tempDepth = chain.depth;
          for (let i = 0; i < cleanLine.length; i++) {
            const char = cleanLine[i];
            if (char === '(' || char === '{') {
              tempDepth++;
            } else if (char === ')' || char === '}') {
              tempDepth--;
            } else if (char === ',' && tempDepth === 1) {
              // Found comma at depth 1 - this is .then(success, error) pattern!
              chain.hasTwoArgThen = true;
              chain.checkingForComma = false;
              break;
            }
          }
        }
        
        // Update depth for this line
        chain.depth += (cleanLine.match(/[\(\{]/g) || []).length;
        chain.depth -= (cleanLine.match(/[\)\}]/g) || []).length;
      }
      
      // Check if this line has .catch(
      if (cleanLine.includes('.catch(')) {
        chain.hasCatch = true;
      }
      
      // If depth is back to 0 or negative, chain is potentially ending
      if (chain.depth <= 0 && chain.started) {
        // Check if line ends with semicolon or has a new statement starting
        const hasEnding = 
          cleanLine.trim().endsWith(';') ||
          cleanLine.trim().endsWith(';)') ||
          cleanLine.trim().match(/^(const|let|var|if|for|while|return|function|export)/);
        
        if (hasEnding || chain.depth < 0) {
          // Chain has ended - check if it had .catch() OR 2-arg .then()
          if (!chain.hasCatch && !chain.hasTwoArgThen) {
            errors.push({
              file: filePath,
              line: chain.startLine,
              funcName: null,
              issue: '.then() without .catch()',
              severity: 'critical',
            });
          }
          return false; // Remove this chain from tracking
        }
      }
      
      // Keep tracking this chain
      return true;
    });
  });
  
  return errors;
}

/**
 * Validate error handling across the codebase
 */
function validateErrorHandling(quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for missing error handlers...\n');
  }
  
  const errors = [];
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileErrors = detectMissingErrorHandlers(relativePath, content);
    errors.push(...fileErrors);
  });
  
  if (!quiet) {
    console.log(`✅ Error handling validation complete:`);
    console.log(`   ⚠️  ${errors.length} missing error handlers\n`);
  }
  
  return { errors };
}

// ============================================================================
// BUG PATTERN #2: MISSING AWAIT ON PROMISES (CRITICAL)
// ============================================================================

/**
 * Check for missing await on Promise-returning functions
 * Returns: [{ file, line, funcName, issue }]
 */
function detectMissingAwait(filePath, content) {
  const errors = [];
  const lines = content.split('\n');
  
  // Build list of known async functions in this file
  const asyncFunctions = new Set();
  const functionDefinitions = extractFunctionDefinitions(filePath, content);
  
  // Track which lines are inside async functions (for return exemption)
  const asyncFunctionRanges = [];
  let currentAsyncFunc = null;
  let braceDepth = 0;
  
  // Scan for async function declarations and track their ranges
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    const asyncMatch = trimmed.match(/^(export\s+)?(async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*async)/);
    if (asyncMatch && !currentAsyncFunc) {
      const funcName = asyncMatch[3] || asyncMatch[4];
      if (funcName) {
        asyncFunctions.add(funcName);
        currentAsyncFunc = {
          name: funcName,
          startLine: lineNum,
        };
        braceDepth = 0;
      }
    }
    
    // Track brace depth when inside async function
    if (currentAsyncFunc) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      
      // Function ended
      if (braceDepth <= 0 && line.includes('}')) {
        asyncFunctionRanges.push({
          ...currentAsyncFunc,
          endLine: lineNum,
        });
        currentAsyncFunc = null;
      }
    }
  });
  
  /**
   * Check if a line is inside an async function
   */
  function isInsideAsyncFunction(lineNum) {
    return asyncFunctionRanges.some(range => 
      lineNum >= range.startLine && lineNum <= range.endLine
    );
  }
  
  // Known Promise-returning functions (common APIs)
  const promiseReturningFunctions = new Set([
    // Fetch API
    'fetch',
    
    // Firebase
    'getDoc',
    'getDocs',
    'setDoc',
    'updateDoc',
    'deleteDoc',
    'addDoc',
    'onSnapshot',
    'signInWithPopup',
    'signOut',
    'createUserWithEmailAndPassword',
    'signInWithEmailAndPassword',
    'sendPasswordResetEmail',
    'updatePassword',
    'updateProfile',
    'deleteUser',
    'getIdToken',
    'uploadBytes',
    'uploadString',
    'getDownloadURL',
    'deleteObject',
    'listAll',
    
    // Custom RavenOS async functions (common ones)
    'sendMessage',
    'sendMessageToBackend',
    'loadThreadMessages',
    'loadThread',
    'deleteThread',
    'pinThread',
    'unpinThread',
    'loadUserThreads',
    'initializeAuth',
    'handleSignIn',
    'handleSignOut',
    'checkSubscriptionStatus',
    'initTTS',
    'playTTS',
  ]);
  
  // Combine with detected async functions
  asyncFunctions.forEach(func => promiseReturningFunctions.add(func));
  
  // Now scan for assignments without await
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Strip inline comments and strings
    let cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    cleanLine = cleanLine.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');
    
    // Pattern: const/let/var variable = promiseFunction()
    // Match: const data = fetch(...) or let result = getDoc(...)
    const assignmentMatch = cleanLine.match(/^\s*(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (assignmentMatch) {
      const funcName = assignmentMatch[3];
      
      // Check if it's a Promise-returning function
      if (promiseReturningFunctions.has(funcName)) {
        // Check if await is present before the function call
        const hasAwait = /await\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(cleanLine);
        
        if (!hasAwait) {
          errors.push({
            file: filePath,
            line: lineNum,
            funcName: funcName,
            issue: `Missing await on ${funcName}() - result will be a Promise, not resolved data`,
            severity: 'critical',
          });
        }
      }
    }
    
    // Pattern: variable = promiseFunction() (reassignment)
    const reassignmentMatch = cleanLine.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (reassignmentMatch) {
      const funcName = reassignmentMatch[2];
      
      // Check if it's a Promise-returning function
      if (promiseReturningFunctions.has(funcName)) {
        // Check if await is present
        const hasAwait = /await\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(cleanLine);
        
        if (!hasAwait) {
          errors.push({
            file: filePath,
            line: lineNum,
            funcName: funcName,
            issue: `Missing await on ${funcName}() - result will be a Promise, not resolved data`,
            severity: 'critical',
          });
        }
      }
    }
    
    // Pattern: return promiseFunction() without await
    const returnMatch = cleanLine.match(/^\s*return\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (returnMatch) {
      const funcName = returnMatch[1];
      
      // Check if it's a Promise-returning function
      if (promiseReturningFunctions.has(funcName)) {
        // Check if await is present
        const hasAwait = /return\s+await\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(cleanLine);
        
        if (!hasAwait) {
          // EXEMPTION 1: If we're inside an async function, returning a Promise directly is valid
          // The async function automatically wraps it, and "return await" would be redundant
          if (isInsideAsyncFunction(lineNum)) {
            return; // Skip - this is a valid pattern
          }
          
          // EXEMPTION 2: Check if the line or nearby lines have a comment about intentional Promise return
          const prevLine = index > 0 ? lines[index - 1].trim().toLowerCase() : '';
          const hasIntentComment = 
            prevLine.includes('intentional') ||
            prevLine.includes('returns promise') ||
            prevLine.includes('return promise');
          
          // EXEMPTION 3: Check if this looks like a wrapper function
          // Pattern: function that just adds params and returns another function's Promise
          // Look at function body - if it's just 1-3 lines of setup + return, it's likely a wrapper
          const functionBodyLines = [];
          let foundFunctionStart = false;
          for (let i = Math.max(0, index - 10); i <= index; i++) {
            const checkLine = lines[i].trim();
            if (checkLine.includes('function') || checkLine.includes('=>')) {
              foundFunctionStart = true;
              functionBodyLines.length = 0; // Reset
            }
            if (foundFunctionStart && checkLine && !checkLine.startsWith('//')) {
              functionBodyLines.push(checkLine);
            }
          }
          
          // If function body is very short (< 5 non-comment lines), it's likely a wrapper
          const isLikelyWrapper = functionBodyLines.length <= 5;
          
          if (!hasIntentComment && !isLikelyWrapper) {
            errors.push({
              file: filePath,
              line: lineNum,
              funcName: funcName,
              issue: `Possible missing await on ${funcName}() in return statement`,
              severity: 'warning',
            });
          }
        }
      }
    }
    
    // Pattern: if (promiseFunction()) - using Promise in conditional
    const conditionalMatch = cleanLine.match(/if\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (conditionalMatch) {
      const funcName = conditionalMatch[1];
      
      if (promiseReturningFunctions.has(funcName)) {
        const hasAwait = /if\s*\(\s*await\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(cleanLine);
        
        if (!hasAwait) {
          errors.push({
            file: filePath,
            line: lineNum,
            funcName: funcName,
            issue: `Missing await on ${funcName}() in conditional - will always be truthy (Promise object)`,
            severity: 'critical',
          });
        }
      }
    }
    
    // Pattern: accessing properties on promise result
    // e.g., const items = getData().items (should be: const items = (await getData()).items)
    const propertyAccessMatch = cleanLine.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\.\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (propertyAccessMatch) {
      const funcName = propertyAccessMatch[1];
      const property = propertyAccessMatch[2];
      
      // Skip .then(), .catch(), .finally() - these are valid Promise methods
      if (['then', 'catch', 'finally'].includes(property)) {
        return;
      }
      
      if (promiseReturningFunctions.has(funcName)) {
        const hasAwait = new RegExp(`await\\s+${funcName}\\s*\\(`).test(cleanLine);
        
        if (!hasAwait) {
          errors.push({
            file: filePath,
            line: lineNum,
            funcName: funcName,
            issue: `Missing await on ${funcName}() before accessing .${property} - accessing property of Promise, not resolved data`,
            severity: 'critical',
          });
        }
      }
    }
  });
  
  return errors;
}

/**
 * Validate missing await across the codebase
 */
function validateMissingAwait(quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for missing await on Promises...\n');
  }
  
  const errors = [];
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileErrors = detectMissingAwait(relativePath, content);
    errors.push(...fileErrors);
  });
  
  if (!quiet) {
    console.log(`✅ Missing await validation complete:`);
    console.log(`   ⚠️  ${errors.length} missing await statements\n`);
  }
  
  return { errors };
}

// ============================================================================
// MILESTONE 5: DEAD CODE DETECTION - UNUSED FUNCTIONS
// ============================================================================

/**
 * Check if a function has a @todo: annotation
 */
function hasTodoAnnotation(file, funcLine) {
  try {
    const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    // Check the 10 lines before the function definition for @todo:
    const start = Math.max(0, funcLine - 10);
    const end = Math.min(lines.length, funcLine + 2);
    
    for (let i = start; i < end; i++) {
      if (lines[i].includes('@todo:')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Find functions that are defined but never called (dead code)
 * Returns: { documentedTodos: [], undocumentedDeadCode: [] }
 */
function findUnusedFunctions(functionRegistry, functionCalls, scopeMap, dynamicCallData = null) {
  const documentedTodos = [];
  const undocumentedDeadCode = [];
  
  // Build a Set of all called function names across the entire codebase
  const allCalledFunctions = new Set();
  Object.values(functionCalls).forEach(calls => {
    calls.forEach(call => {
      allCalledFunctions.add(call.call);
    });
  });
  
  // Build export map for all files
  const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  const exportMap = {};
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports = extractExports(relativePath, content);
    exportMap[relativePath] = exports;
  });
  
  // Check each function in the registry
  Object.entries(functionRegistry).forEach(([funcName, definitions]) => {
    // Is this function ever called?
    const isCalled = allCalledFunctions.has(funcName);
    
    if (!isCalled) {
      // Check exemptions for each definition
      definitions.forEach(def => {
        // EXEMPTION 1: Exported functions (public API)
        // Check both inline exports (type === 'export') and export blocks
        if (def.type === 'export' || (exportMap[def.file] && exportMap[def.file].has(funcName))) {
          return; // Skip - exported functions might be used externally
        }
        
        // EXEMPTION 2: Functions attached to window (global API)
        if (def.type === 'window') {
          return; // Skip - window functions are public API
        }
        
        // EXEMPTION 3: init* pattern functions (called by orchestrator)
        if (funcName.startsWith('init')) {
          return; // Skip - init functions are called by name at startup
        }
        
        // EXEMPTION 4: Lifecycle/handler patterns
        const lifecyclePatterns = [
          /^on[A-Z]/, // onClick, onLoad, etc.
          /^handle[A-Z]/, // handleClick, handleSubmit, etc.
          /Handler$/, // clickHandler, submitHandler, etc.
          /Listener$/, // messageListener, eventListener, etc.
        ];
        if (lifecyclePatterns.some(pattern => pattern.test(funcName))) {
          return; // Skip - likely event handlers attached by reference
        }
        
        // EXEMPTION 5: Public API lifecycle methods
        // Common method names in returned objects/classes that form public APIs
        const publicAPIMethodNames = [
          'setup', 'teardown', 'cleanup', 'destroy', 'dispose', 'close',
          'subscribe', 'unsubscribe', 'connect', 'disconnect',
          'mount', 'unmount', 'attach', 'detach',
          'start', 'stop', 'pause', 'resume',
          'open', 'close', 'show', 'hide',
          'enable', 'disable', 'activate', 'deactivate'
        ];
        if (publicAPIMethodNames.includes(funcName)) {
          return; // Skip - common public API methods
        }
        
        // EXEMPTION 6: Check for JSDoc @public or @api tags
        // We'd need to read the file content around the function definition
        // For now, we'll skip this and add it in a future iteration
        
        // EXEMPTION 7: Functions in standalone scripts (ttsMain.js, ttsAuto.js, streamBuffer.js)
        const standaloneScripts = ['ttsMain.js', 'ttsAuto.js', 'streamBuffer.js'];
        if (standaloneScripts.some(script => def.file.includes(script))) {
          return; // Skip - standalone scripts attach functions to window
        }
        
        // EXEMPTION 8: Functions potentially called dynamically (eval, bracket notation, etc.)
        if (dynamicCallData && isPotentiallyDynamicCall(funcName, dynamicCallData)) {
          return; // Skip - might be called dynamically
        }
        
        // EXEMPTION 9: Placeholder/stub functions for future implementation
        // Check if function name contains stub/placeholder indicators
        const placeholderPatterns = [
          /stub/i,        // myFunctionStub, stubFunction
          /placeholder/i, // placeholderFunction
          /todo/i,        // todoImplement
          /temp/i,        // tempFunction
          /wip/i,         // wipFeature
        ];
        if (placeholderPatterns.some(pattern => pattern.test(funcName))) {
          return; // Skip - placeholder/stub function
        }
        
        // Note: We could also check function body content for "Placeholder" or "TODO"
        // but that would require reading file contents, which we skip for performance
        
        // Check if this function has a @todo: annotation
        const hasTodo = hasTodoAnnotation(def.file, def.line);
        
        const functionInfo = {
          funcName,
          file: def.file,
          line: def.line,
          type: def.type,
          reason: 'Defined but never called in codebase',
        };
        
        if (hasTodo) {
          // Function is documented as intentionally unused (TODO)
          documentedTodos.push(functionInfo);
        } else {
          // Function is truly dead code (not documented)
          undocumentedDeadCode.push(functionInfo);
        }
      });
    }
  });
  
  return { documentedTodos, undocumentedDeadCode };
}

/**
 * Validate and report unused functions
 */
function validateUnusedFunctions(functionRegistry, functionCalls, scopeMap, dynamicCallData = null, quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for unused functions (dead code)...\n');
  }
  
  const { documentedTodos, undocumentedDeadCode } = findUnusedFunctions(functionRegistry, functionCalls, scopeMap, dynamicCallData);
  const totalUnused = documentedTodos.length + undocumentedDeadCode.length;
  
  if (!quiet) {
    console.log(`✅ Unused function check complete:`);
    console.log(`   📝 ${documentedTodos.length} documented TODOs`);
    console.log(`   ⚠️  ${undocumentedDeadCode.length} undocumented dead code\n`);
  }
  
  return { documentedTodos, undocumentedDeadCode, totalUnused };
}

// ============================================================================
// MILESTONE 5.5: SCOPE-AWARE DETECTION - UNUSED HELPER FUNCTIONS
// ============================================================================

/**
 * Detect nested functions (helper functions defined inside other functions)
 * Returns: [{ funcName, parentFunc, file, line, parentStartLine, parentEndLine }]
 */
function detectNestedFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const nestedFunctions = [];
  
  const tracker = new ScopeTracker();
  const functionStack = []; // Track parent functions
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Track function definitions before updating scope
    // Match: function name() {} or const name = function() {} or const name = () => {}
    const funcMatch = line.match(/(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|async\s+function|\([^)]*\)\s*=>))/);
    
    if (funcMatch) {
      const funcName = funcMatch[1] || funcMatch[2];
      const currentDepth = tracker.braceDepth;
      
      // If we're inside another function (depth > 0), this is a nested function
      if (currentDepth > 0 && functionStack.length > 0) {
        const parentFunc = functionStack[functionStack.length - 1];
        
        nestedFunctions.push({
          funcName,
          parentFunc: parentFunc.name,
          file: filePath,
          line: lineNum,
          parentStartLine: parentFunc.startLine,
          parentEndLine: null, // Will be filled when parent closes
          depth: currentDepth,
        });
      }
      
      // Push this function onto the stack
      functionStack.push({
        name: funcName,
        startLine: lineNum,
        depth: currentDepth,
      });
    }
    
    // Update scope tracker
    const prevDepth = tracker.braceDepth;
    tracker.processLine(line, lineNum);
    const newDepth = tracker.braceDepth;
    
    // If depth decreased, pop functions from stack
    if (newDepth < prevDepth) {
      const depthDiff = prevDepth - newDepth;
      for (let i = 0; i < depthDiff; i++) {
        if (functionStack.length > 0) {
          const closedFunc = functionStack.pop();
          
          // Update parentEndLine for nested functions
          nestedFunctions.forEach(nested => {
            if (nested.parentFunc === closedFunc.name && nested.parentEndLine === null) {
              nested.parentEndLine = lineNum;
            }
          });
        }
      }
    }
  });
  
  return nestedFunctions;
}

/**
 * Check if a nested function is called within its parent scope
 */
function isCalledInParentScope(funcName, parentStartLine, parentEndLine, filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract parent function body
  const parentLines = lines.slice(parentStartLine - 1, parentEndLine);
  const parentBody = parentLines.join('\n');
  
  // Remove comments to avoid false positives
  const bodyWithoutComments = parentBody
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Block comments
    .replace(/\/\/.*/g, '');            // Line comments
  
  // Look for function calls: funcName( or funcName (
  const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
  const calls = bodyWithoutComments.match(callPattern);
  
  return calls && calls.length > 0;
}

/**
 * Find all unused helper functions (nested functions never called in parent scope)
 */
function findUnusedHelpers() {
  const unusedHelpers = [];
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  jsFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const nestedFunctions = detectNestedFunctions(filePath);
    
    nestedFunctions.forEach(nested => {
      // Skip if parentEndLine wasn't detected (unclosed function)
      if (!nested.parentEndLine) return;
      
      const isCalled = isCalledInParentScope(
        nested.funcName,
        nested.parentStartLine,
        nested.parentEndLine,
        filePath
      );
      
      if (!isCalled) {
        unusedHelpers.push({
          funcName: nested.funcName,
          parentFunc: nested.parentFunc,
          file: relativePath,
          line: nested.line,
          reason: `Defined in ${nested.parentFunc}() but never called`,
        });
      }
    });
  });
  
  return unusedHelpers;
}

/**
 * Validate and report unused helper functions
 */
function validateUnusedHelpers(quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for unused helper functions (scope-aware)...\n');
  }
  
  const unusedHelpers = findUnusedHelpers();
  
  if (!quiet) {
    console.log(`✅ Unused helper check complete:`);
    console.log(`   ⚠️  ${unusedHelpers.length} unused helper functions\n`);
  }
  
  return { unusedHelpers };
}

// ============================================================================
// PHASE 2, MILESTONE 2.1: COMMENTED CODE ANALYSIS - ZOMBIE FUNCTIONS
// ============================================================================

/**
 * Separate code from comments
 * Returns: { code: string, comments: string }
 */
function parseCodeAndComments(fileContent) {
  let code = fileContent;
  let comments = '';
  
  // Extract block comments /* ... */
  const blockComments = [];
  code = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    blockComments.push(match);
    return ' '.repeat(match.length); // Replace with spaces to preserve line numbers
  });
  
  // Extract line comments // ...
  const lineComments = [];
  const lines = code.split('\n');
  const cleanLines = lines.map(line => {
    const commentMatch = line.match(/\/\/(.*)/);
    if (commentMatch) {
      lineComments.push(commentMatch[1]);
      return line.substring(0, line.indexOf('//'));
    }
    return line;
  });
  
  code = cleanLines.join('\n');
  comments = [...blockComments, ...lineComments].join('\n');
  
  return { code, comments };
}

/**
 * Find function calls in text (code or comments)
 * Returns: Set of function names
 */
function extractFunctionCallsFromText(text) {
  const calls = new Set();
  
  // Match function calls: functionName( or functionName (
  const callPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let match;
  
  while ((match = callPattern.exec(text)) !== null) {
    const funcName = match[1];
    
    // Skip common keywords that look like calls
    const keywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'void'];
    if (keywords.includes(funcName)) continue;
    
    calls.add(funcName);
  }
  
  return calls;
}

/**
 * Find zombie functions (only called in commented code)
 */
function findZombieFunctions(functionRegistry) {
  const zombieFunctions = [];
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  
  // Build a global map of all function calls in live code vs comments
  const liveCallsGlobal = new Set();
  const commentCallsGlobal = new Set();
  
  jsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { code, comments } = parseCodeAndComments(content);
    
    // Extract calls from live code
    const liveCalls = extractFunctionCallsFromText(code);
    liveCalls.forEach(call => liveCallsGlobal.add(call));
    
    // Extract calls from comments
    const commentCalls = extractFunctionCallsFromText(comments);
    commentCalls.forEach(call => commentCallsGlobal.add(call));
  });
  
  // Check each function in registry
  Object.entries(functionRegistry).forEach(([funcName, definitions]) => {
    const calledInLiveCode = liveCallsGlobal.has(funcName);
    const calledInComments = commentCallsGlobal.has(funcName);
    
    // Zombie = called in comments but NOT in live code
    if (calledInComments && !calledInLiveCode) {
      definitions.forEach(def => {
        // Skip if it's already documented as a TODO
        const hasTodo = hasTodoAnnotation(def.file, def.line);
        if (hasTodo) return;
        
        // Skip if it's exported (might be used elsewhere)
        if (def.type === 'export') return;
        
        zombieFunctions.push({
          funcName,
          file: def.file,
          line: def.line,
          type: def.type,
          reason: 'Only called in commented-out code (zombie function)',
        });
      });
    }
  });
  
  return zombieFunctions;
}

/**
 * Validate and report zombie functions
 */
function validateZombieFunctions(functionRegistry, quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for zombie functions (only called in comments)...\n');
  }
  
  const zombieFunctions = findZombieFunctions(functionRegistry);
  
  if (!quiet) {
    console.log(`✅ Zombie function check complete:`);
    console.log(`   ⚠️  ${zombieFunctions.length} zombie functions\n`);
  }
  
  return { zombieFunctions };
}

// ============================================================================
// PHASE 2, MILESTONE 2.2: DYNAMIC CALL DETECTION
// ============================================================================

/**
 * Extract potential function names from string literals
 * Used to detect dynamic calls like eval('funcName()') or obj['funcName']
 */
function extractFunctionNamesFromStrings(code) {
  const potentialFunctions = new Set();
  
  // Match string literals (single and double quotes)
  const stringLiteralPattern = /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g;
  let match;
  
  while ((match = stringLiteralPattern.exec(code)) !== null) {
    const stringContent = match[2];
    
    // Look for function call patterns in strings: funcName() or funcName(
    const callPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let callMatch;
    
    while ((callMatch = callPattern.exec(stringContent)) !== null) {
      potentialFunctions.add(callMatch[1]);
    }
    
    // Look for bare function names in bracket notation strings: obj['funcName']
    const bareNamePattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (bareNamePattern.test(stringContent)) {
      potentialFunctions.add(stringContent);
    }
  }
  
  return potentialFunctions;
}

/**
 * Detect dynamic call patterns in code
 * Returns: { hasDynamicCalls: boolean, patterns: string[], potentialFunctions: Set }
 */
function detectDynamicCalls(code) {
  const patterns = [];
  const potentialFunctions = new Set();
  
  // Pattern 1: eval() usage
  if (/\beval\s*\(/.test(code)) {
    patterns.push('eval()');
    // Extract potential function names from eval strings
    const evalPattern = /eval\s*\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g;
    let match;
    while ((match = evalPattern.exec(code)) !== null) {
      const evalContent = match[2];
      const funcs = extractFunctionNamesFromStrings(`"${evalContent}"`);
      funcs.forEach(f => potentialFunctions.add(f));
    }
  }
  
  // Pattern 2: Function constructor
  if (/\bnew\s+Function\s*\(/.test(code)) {
    patterns.push('Function constructor');
    // Extract from Function constructor strings
    const functionPattern = /new\s+Function\s*\([^)]*\)/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const funcs = extractFunctionNamesFromStrings(match[0]);
      funcs.forEach(f => potentialFunctions.add(f));
    }
  }
  
  // Pattern 3: Bracket notation with variables: obj[varName]()
  if (/\[[a-zA-Z_$][a-zA-Z0-9_$]*\]\s*\(/.test(code)) {
    patterns.push('bracket notation with variables');
  }
  
  // Pattern 4: Bracket notation with strings: obj['funcName']()
  const bracketStringPattern = /\[(['"`])([a-zA-Z_$][a-zA-Z0-9_$]*)\1\]\s*\(/g;
  let match;
  while ((match = bracketStringPattern.exec(code)) !== null) {
    patterns.push('bracket notation with strings');
    potentialFunctions.add(match[2]);
  }
  
  // Pattern 5: window[stringVar] or this[stringVar]
  if (/\b(?:window|this|self|globalThis)\s*\[[^\]]+\]/.test(code)) {
    patterns.push('global object bracket access');
  }
  
  // Pattern 6: setTimeout/setInterval with strings
  const timerStringPattern = /(?:setTimeout|setInterval)\s*\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g;
  while ((match = timerStringPattern.exec(code)) !== null) {
    patterns.push('timer with string code');
    const timerContent = match[2];
    const funcs = extractFunctionNamesFromStrings(`"${timerContent}"`);
    funcs.forEach(f => potentialFunctions.add(f));
  }
  
  return {
    hasDynamicCalls: patterns.length > 0,
    patterns: [...new Set(patterns)], // Dedupe
    potentialFunctions,
  };
}

/**
 * Scan all files for dynamic call patterns
 */
function findDynamicCallPatterns() {
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  const filePatterns = new Map(); // file -> { patterns, potentialFunctions }
  const globalPotentialFunctions = new Set();
  
  jsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = detectDynamicCalls(content);
    
    if (result.hasDynamicCalls) {
      filePatterns.set(filePath, result);
      result.potentialFunctions.forEach(f => globalPotentialFunctions.add(f));
    }
  });
  
  return {
    filePatterns,
    globalPotentialFunctions,
    totalFiles: filePatterns.size,
  };
}

/**
 * Check if a function might be called dynamically
 */
function isPotentiallyDynamicCall(funcName, dynamicCallData) {
  return dynamicCallData.globalPotentialFunctions.has(funcName);
}

/**
 * Validate and report dynamic call patterns
 */
function validateDynamicCalls(quiet = false) {
  if (!quiet) {
    console.log('🔍 Scanning for dynamic call patterns...\n');
  }
  
  const dynamicCallData = findDynamicCallPatterns();
  
  if (!quiet) {
    console.log(`✅ Dynamic call scan complete:`);
    console.log(`   📁 ${dynamicCallData.totalFiles} files with dynamic patterns`);
    console.log(`   ⚠️  ${dynamicCallData.globalPotentialFunctions.size} functions potentially called dynamically\n`);
    
    if (dynamicCallData.totalFiles > 0 && dynamicCallData.totalFiles <= 10) {
      console.log('Files with dynamic call patterns:\n');
      dynamicCallData.filePatterns.forEach((data, filePath) => {
        console.log(`   ${path.relative(PROJECT_ROOT, filePath)}`);
        console.log(`      Patterns: ${data.patterns.join(', ')}`);
        if (data.potentialFunctions.size > 0) {
          console.log(`      Functions: ${[...data.potentialFunctions].join(', ')}`);
        }
        console.log('');
      });
    }
  }
  
  return dynamicCallData;
}

// ============================================================================
// PHASE 2, MILESTONE 2.3: UNUSED IMPORT DETECTION
// ============================================================================

/**
 * Parse all import statements from a file
 * Returns: { imports: [{ type, names, source, line }], sideEffects: [...] }
 */
function parseImportStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const imports = [];
  const sideEffects = [];
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Side-effect imports: import './module.js'
    const sideEffectMatch = line.match(/^\s*import\s+['"]([^'"]+)['"]/);
    if (sideEffectMatch) {
      sideEffects.push({
        source: sideEffectMatch[1],
        line: lineNum,
      });
      return;
    }
    
    // Default import: import foo from './module.js'
    const defaultMatch = line.match(/^\s*import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/);
    if (defaultMatch) {
      imports.push({
        type: 'default',
        names: [defaultMatch[1]],
        source: defaultMatch[2],
        line: lineNum,
      });
      return;
    }
    
    // Named imports: import { foo, bar } from './module.js'
    const namedMatch = line.match(/^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
    if (namedMatch) {
      const namesStr = namedMatch[1];
      const source = namedMatch[2];
      
      // Parse names, handling "as" aliases: { foo, bar as baz }
      const names = namesStr.split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }).filter(n => n.length > 0);
      
      imports.push({
        type: 'named',
        names,
        source,
        line: lineNum,
      });
      return;
    }
    
    // Namespace import: import * as foo from './module.js'
    const namespaceMatch = line.match(/^\s*import\s+\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/);
    if (namespaceMatch) {
      imports.push({
        type: 'namespace',
        names: [namespaceMatch[1]],
        source: namespaceMatch[2],
        line: lineNum,
      });
      return;
    }
    
    // Mixed import: import foo, { bar, baz } from './module.js'
    const mixedMatch = line.match(/^\s*import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
    if (mixedMatch) {
      const defaultName = mixedMatch[1];
      const namesStr = mixedMatch[2];
      const source = mixedMatch[3];
      
      const namedNames = namesStr.split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }).filter(n => n.length > 0);
      
      imports.push({
        type: 'mixed',
        names: [defaultName, ...namedNames],
        source,
        line: lineNum,
      });
    }
  });
  
  return { imports, sideEffects };
}

/**
 * Find all references to a symbol in code
 * Returns: number of times symbol is referenced
 */
function countSymbolUsage(symbol, content, importLine) {
  const lines = content.split('\n');
  let count = 0;
  
  // Skip the import line itself
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (lineNum === importLine) return;
    
    // Match symbol as a whole word (not part of another identifier)
    const symbolPattern = new RegExp(`\\b${symbol}\\b`, 'g');
    const matches = line.match(symbolPattern);
    
    if (matches) {
      count += matches.length;
    }
  });
  
  return count;
}

/**
 * Find unused imports across all JS files
 */
function findUnusedImports() {
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  const unusedImports = [];
  
  jsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { imports } = parseImportStatements(filePath);
    
    imports.forEach(imp => {
      imp.names.forEach(name => {
        const usageCount = countSymbolUsage(name, content, imp.line);
        
        if (usageCount === 0) {
          unusedImports.push({
            file: filePath,
            line: imp.line,
            symbol: name,
            source: imp.source,
            type: imp.type,
            reason: `Imported but never used (${imp.type} import)`,
          });
        }
      });
    });
  });
  
  return unusedImports;
}

/**
 * Validate and report unused imports
 */
function validateUnusedImports(quiet = false) {
  if (!quiet) {
    console.log('🔍 Checking for unused imports...\n');
  }
  
  const unusedImports = findUnusedImports();
  
  if (!quiet) {
    console.log(`✅ Unused import check complete:`);
    console.log(`   ⚠️  ${unusedImports.length} unused imports\n`);
  }
  
  return { unusedImports };
}

// ============================================================================
// MILESTONE 6: ORPHANED INTERACTIVE ELEMENTS
// ============================================================================

/**
 * Extract interactive elements with IDs from HTML
 * Returns: { id: { tag, line } }
 */
function extractInteractiveElements(htmlContent) {
  const elements = {};
  const lines = htmlContent.split('\n');
  
  const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Simple regex to find elements with IDs
    // Matches: <button id="my-id" ...> or <input id="my-id" ... />
    const elementMatches = line.matchAll(/<(button|input|select|textarea|a)[^>]*\bid=["']([^"']+)["'][^>]*>/gi);
    
    for (const match of elementMatches) {
      const tag = match[1].toLowerCase();
      const id = match[2];
      
      elements[id] = {
        tag,
        line: lineNum,
        htmlSnippet: match[0].substring(0, 60) + '...',
      };
    }
  });
  
  return elements;
}

/**
 * Extract event listener attachments from JS code
 * Returns: Set of element IDs that have listeners
 */
function extractEventListeners(jsContent) {
  const listenedIds = new Set();
  const lines = jsContent.split('\n');
  
  lines.forEach(line => {
    // Pattern 1: getElementById('id').addEventListener
    const getByIdMatches = line.matchAll(/getElementById\(['"]([^'"]+)['"]\)\s*\.\s*addEventListener/g);
    for (const match of getByIdMatches) {
      listenedIds.add(match[1]);
    }
    
    // Pattern 2: getElementById('id').onclick =
    const onclickMatches = line.matchAll(/getElementById\(['"]([^'"]+)['"]\)\s*\.\s*on\w+\s*=/g);
    for (const match of onclickMatches) {
      listenedIds.add(match[1]);
    }
    
    // Pattern 3: querySelector('#id').addEventListener
    const querySelectorMatches = line.matchAll(/querySelector\(['"]#([^'"]+)['"]\)\s*\.\s*addEventListener/g);
    for (const match of querySelectorMatches) {
      listenedIds.add(match[1]);
    }
    
    // Pattern 4: querySelector('#id').onclick =
    const querySelectorOnMatches = line.matchAll(/querySelector\(['"]#([^'"]+)['"]\)\s*\.\s*on\w+\s*=/g);
    for (const match of querySelectorOnMatches) {
      listenedIds.add(match[1]);
    }
    
    // Pattern 5: Direct reference like myBtn.addEventListener (harder to detect ID)
    // We'll skip this for now as it requires more complex analysis
  });
  
  return listenedIds;
}

/**
 * Find orphaned interactive elements (elements with IDs but no listeners)
 */
function findOrphanedElements(htmlFilePath) {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const interactiveElements = extractInteractiveElements(htmlContent);
  
  // Collect all event listeners from all JS files
  const jsFiles = getAllJSFiles(PROJECT_ROOT);
  const allListenedIds = new Set();
  
  jsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const listenedIds = extractEventListeners(content);
    listenedIds.forEach(id => allListenedIds.add(id));
  });
  
  // Find orphans
  const orphans = [];
  
  // Exclusion patterns (IDs that don't need listeners)
  const exclusionPatterns = [
    /.*-input$/,
    /.*-field$/,
    /.*-display$/,
    /.*-label$/,
    /.*-container$/,
    /.*-wrapper$/,
    /^user-icon$/,
    /^thread-/,
    /^msg-/,
  ];
  
  Object.entries(interactiveElements).forEach(([id, info]) => {
    // Skip if it has a listener
    if (allListenedIds.has(id)) {
      return;
    }
    
    // Skip if it matches an exclusion pattern
    if (exclusionPatterns.some(pattern => pattern.test(id))) {
      return;
    }
    
    // Skip submit buttons in forms (they're handled by form.onsubmit)
    if (info.tag === 'button' && info.htmlSnippet.includes('type="submit"')) {
      return;
    }
    
    // Otherwise, it's an orphan
    orphans.push({
      id,
      tag: info.tag,
      line: info.line,
      htmlSnippet: info.htmlSnippet,
    });
  });
  
  return orphans;
}

/**
 * Validate interactive elements
 */
function validateOrphanedElements(config = {}) {
  const quiet = config.quiet || false;
  const htmlFile = config.htmlFile || path.join(PROJECT_ROOT, 'index.html');
  
  if (!quiet) {
    console.log('🔍 Checking for orphaned interactive elements...\n');
  }
  
  if (!fs.existsSync(htmlFile)) {
    if (!quiet) {
      console.log(`⚠️  No HTML file found at ${htmlFile}, skipping orphaned elements check\n`);
    }
    return { orphans: [] };
  }
  
  const orphans = findOrphanedElements(htmlFile);
  
  if (!quiet) {
    const fileName = path.basename(htmlFile);
    if (orphans.length > 0) {
      console.log(`⚠️  Found ${orphans.length} potentially orphaned interactive elements:`);
      console.log('   (Elements with IDs but no event listeners)\n');
      
      orphans.slice(0, 10).forEach(orphan => {
        console.log(`   ${fileName}:${orphan.line} - <${orphan.tag} id="${orphan.id}">`);
      });
      
      if (orphans.length > 10) {
        console.log(`\n   ... and ${orphans.length - 10} more orphans\n`);
      }
    } else {
      console.log('✅ No orphaned interactive elements found\n');
    }
  }
  
  return { orphans };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

export function validateFunctionCalls(options = {}) {
  const quiet = options.quiet || false;
  const htmlFile = options.htmlFile;
  
  if (!quiet) {
    console.log('🚀 Function Call Validator\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 1: Build function registry
  const functionRegistry = buildFunctionRegistry(quiet);
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 1 complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 2: Detect function calls
  const functionCalls = buildFunctionCallsMap(quiet);
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 2 complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 3: Validate imports
  const importValidation = validateImports(quiet);
  
  // Show import errors if any
  if (!quiet && importValidation.errors.length > 0) {
    console.log('❌ Import Errors:\n');
    importValidation.errors.slice(0, 10).forEach(error => {
      console.log(`   ${error.file}:${error.line}`);
      console.log(`      ${error.message}`);
      if (error.available) {
        console.log(`      Available exports: ${error.available.join(', ')}`);
      }
      console.log('');
    });
    
    if (importValidation.errors.length > 10) {
      console.log(`   ... and ${importValidation.errors.length - 10} more errors\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 3 complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 4: Validate function calls
  const callValidation = validateAllFunctionCalls(functionCalls, functionRegistry, quiet);
  
  // Show function call errors if any
  if (!quiet && callValidation.errors.length > 0) {
    console.log('❌ Function Call Errors:\n');
    callValidation.errors.slice(0, 15).forEach(error => {
      console.log(`   ${error.file}:${error.line}`);
      console.log(`      ${error.call}() is not defined`);
      if (error.suggestions.length > 0) {
        console.log(`      Did you mean: ${error.suggestions.join(', ')}?`);
      }
      console.log('');
    });
    
    if (callValidation.errors.length > 15) {
      console.log(`   ... and ${callValidation.errors.length - 15} more errors\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 4 complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // PHASE 2, MILESTONE 2.2: Dynamic call detection (RUNS FIRST to inform dead code detection)
  const dynamicValidation = validateDynamicCalls(quiet);
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Phase 2, Milestone 2.2 (Dynamic Calls) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 5: Dead code detection - Unused functions
  const scopeMap = buildScopeMap();
  const unusedValidation = validateUnusedFunctions(functionRegistry, functionCalls, scopeMap, dynamicValidation, quiet);
  
  // Show documented TODOs if any
  if (!quiet && unusedValidation.documentedTodos.length > 0) {
    console.log('📝 Documented TODOs (Unused but tracked):\n');
    unusedValidation.documentedTodos.slice(0, 10).forEach(unused => {
      console.log(`   ${unused.file}:${unused.line} - ${unused.funcName}()`);
      console.log(`      Has @todo: annotation in code`);
      console.log('');
    });
    
    if (unusedValidation.documentedTodos.length > 10) {
      console.log(`   ... and ${unusedValidation.documentedTodos.length - 10} more documented TODOs\n`);
    }
  }
  
  // Show undocumented dead code if any
  if (!quiet && unusedValidation.undocumentedDeadCode.length > 0) {
    console.log('⚠️  Undocumented Dead Code (No @todo: annotation):\n');
    unusedValidation.undocumentedDeadCode.slice(0, 10).forEach(unused => {
      console.log(`   ${unused.file}:${unused.line} - ${unused.funcName}()`);
      console.log(`      Type: ${unused.type} | ${unused.reason}`);
      console.log('');
    });
    
    if (unusedValidation.undocumentedDeadCode.length > 10) {
      console.log(`   ... and ${unusedValidation.undocumentedDeadCode.length - 10} more undocumented functions\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 5 (Dead Code Detection) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 5.5: Scope-aware detection - Unused helper functions
  const helperValidation = validateUnusedHelpers(quiet);
  
  // Show unused helpers if any
  if (!quiet && helperValidation.unusedHelpers.length > 0) {
    console.log('⚠️  Unused Helper Functions (scope-aware):\n');
    helperValidation.unusedHelpers.slice(0, 10).forEach(helper => {
      console.log(`   ${helper.file}:${helper.line} - ${helper.funcName}()`);
      console.log(`      ${helper.reason}`);
      console.log('');
    });
    
    if (helperValidation.unusedHelpers.length > 10) {
      console.log(`   ... and ${helperValidation.unusedHelpers.length - 10} more unused helpers\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 5.5 (Scope-Aware Detection) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // PHASE 2, MILESTONE 2.1: Zombie function detection (commented code analysis)
  const zombieValidation = validateZombieFunctions(functionRegistry, quiet);
  
  // Show zombie functions if any
  if (!quiet && zombieValidation.zombieFunctions.length > 0) {
    console.log('🧟 Zombie Functions (only called in comments):\n');
    zombieValidation.zombieFunctions.slice(0, 10).forEach(zombie => {
      console.log(`   ${zombie.file}:${zombie.line} - ${zombie.funcName}()`);
      console.log(`      ${zombie.reason}`);
      console.log('');
    });
    
    if (zombieValidation.zombieFunctions.length > 10) {
      console.log(`   ... and ${zombieValidation.zombieFunctions.length - 10} more zombie functions\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Phase 2, Milestone 2.1 (Zombie Detection) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // PHASE 2, MILESTONE 2.3: Unused import detection
  const importValidationResult = validateUnusedImports(quiet);
  
  // Show unused imports if any
  if (!quiet && importValidationResult.unusedImports.length > 0) {
    console.log('📦 Unused Imports:\n');
    importValidationResult.unusedImports.slice(0, 15).forEach(imp => {
      console.log(`   ${imp.file}:${imp.line} - ${imp.symbol}`);
      console.log(`      From: ${imp.source} (${imp.type} import)`);
      console.log('');
    });
    
    if (importValidationResult.unusedImports.length > 15) {
      console.log(`   ... and ${importValidationResult.unusedImports.length - 15} more unused imports\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Phase 2, Milestone 2.3 (Unused Imports) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // MILESTONE 6: Orphaned interactive elements
  const orphanedValidation = validateOrphanedElements({ quiet, htmlFile });
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Milestone 6 complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // BUG PATTERN #1: Missing error handlers
  const errorHandlingValidation = validateErrorHandling(quiet);
  
  // Show error handling issues if any
  if (!quiet && errorHandlingValidation.errors.length > 0) {
    console.log('⚠️  Missing Error Handlers:\n');
    errorHandlingValidation.errors.slice(0, 15).forEach(error => {
      console.log(`   ${error.file}:${error.line}`);
      if (error.funcName) {
        console.log(`      async function ${error.funcName}() without try/catch`);
      } else {
        console.log(`      ${error.issue}`);
      }
      console.log('');
    });
    
    if (errorHandlingValidation.errors.length > 15) {
      console.log(`   ... and ${errorHandlingValidation.errors.length - 15} more issues\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Bug Pattern #1 (Error Handling) complete!\n');
    console.log('=' .repeat(60));
    console.log('');
  }
  
  // BUG PATTERN #2: Missing await on Promises
  const missingAwaitValidation = validateMissingAwait(quiet);
  
  // Show missing await issues if any
  if (!quiet && missingAwaitValidation.errors.length > 0) {
    console.log('⚠️  Missing Await on Promises:\n');
    missingAwaitValidation.errors.slice(0, 15).forEach(error => {
      console.log(`   ${error.file}:${error.line}`);
      console.log(`      ${error.issue}`);
      console.log('');
    });
    
    if (missingAwaitValidation.errors.length > 15) {
      console.log(`   ... and ${missingAwaitValidation.errors.length - 15} more issues\n`);
    }
  }
  
  if (!quiet) {
    console.log('=' .repeat(60));
    console.log('\n✅ Bug Pattern #2 (Missing Await) complete!\n');
  }
  
  const totalErrors = importValidation.errors.length + callValidation.errors.length;
  const totalOrphans = orphanedValidation.orphans.length;
  const totalBugPatterns = errorHandlingValidation.errors.length + missingAwaitValidation.errors.length;
  const totalDocumentedTodos = unusedValidation.documentedTodos.length;
  const totalUndocumentedDeadCode = unusedValidation.undocumentedDeadCode.length;
  const totalUnusedFunctions = unusedValidation.totalUnused;
  const totalUnusedHelpers = helperValidation.unusedHelpers.length;
  const totalZombieFunctions = zombieValidation.zombieFunctions.length;
  const totalDynamicCallFiles = dynamicValidation.totalFiles;
  const totalDynamicFunctions = dynamicValidation.globalPotentialFunctions.size;
  const totalUnusedImports = importValidationResult.unusedImports.length;
  
  return {
    success: totalErrors === 0 && totalOrphans === 0,
    functionRegistry,
    functionCalls,
    importValidation,
    callValidation,
    dynamicValidation,
    unusedValidation,
    helperValidation,
    zombieValidation,
    importValidationResult,
    orphanedValidation,
    errorHandlingValidation,
    missingAwaitValidation,
    totalErrors,
    totalOrphans,
    totalBugPatterns,
    totalDocumentedTodos,
    totalUndocumentedDeadCode,
    totalUnusedFunctions,
    totalUnusedHelpers,
    totalZombieFunctions,
    totalDynamicCallFiles,
    totalDynamicFunctions,
    totalUnusedImports,
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateFunctionCalls();
}

