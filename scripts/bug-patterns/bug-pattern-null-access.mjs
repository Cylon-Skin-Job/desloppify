#!/usr/bin/env node

/**
 * Bug Pattern #3: Null/Undefined Access Detection
 * 
 * Detects potential "Cannot read property of undefined" errors:
 * - Property access on potentially null/undefined variables
 * - Method calls on potentially null/undefined objects
 * - Array operations on potentially undefined arrays
 * 
 * Supports whitelist system with drift detection.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import whitelistManager from './whitelist-manager.mjs';
import { ScopeTracker } from './scope-tracker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================================================
// FRAMEWORK PATTERN DETECTION
// ============================================================================

/**
 * Express middleware patterns
 */
const EXPRESS_PATTERNS = {
  signatures: [
    ['req', 'res', 'next'],
    ['req', 'res'],
    ['request', 'response', 'next'],
    ['request', 'response'],
    ['err', 'req', 'res', 'next']  // Error handlers
  ],
  description: 'Express middleware pattern'
};

/**
 * Check if function matches Express middleware pattern
 */
function matchesExpressPattern(params) {
  if (!params) return false;
  
  const paramList = params.split(',').map(p => p.trim().split('=')[0].trim());
  
  for (const signature of EXPRESS_PATTERNS.signatures) {
    if (paramList.length === signature.length) {
      const match = paramList.every((param, i) => param === signature[i]);
      if (match) return true;
    }
  }
  
  return false;
}

/**
 * Check if this is an array method callback where params are guaranteed
 * Examples: .filter(x => ...), .map(item => ...), .forEach(el => ...)
 */
function isArrayMethodCallback(line, params) {
  // Array methods that take callbacks where the parameter is guaranteed to be defined
  const arrayMethods = [
    'filter', 'map', 'forEach', 'find', 'findIndex', 'some', 'every',
    'reduce', 'reduceRight', 'sort', 'flatMap'
  ];
  
  // Check if line contains .method(param => or .method((param) =>
  for (const method of arrayMethods) {
    // Pattern: .method(param =>  OR  .method((param) =>  OR  .method((param, index) =>
    const inlinePattern = new RegExp(`\\.${method}\\s*\\([^)]*=>`);
    if (inlinePattern.test(line)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if line is an event handler callback where browser guarantees event param
 * Patterns:
 * - addEventListener('event', (e) => {})
 * - addEventListener('event', function(e) {})
 * - element.onclick = (e) => {}
 * - setTimeout/setInterval callbacks
 */
function isEventHandlerCallback(line, params) {
  if (!params) return false;
  
  // Extract first param name
  const paramList = params.split(',').map(p => p.trim().split('=')[0].trim());
  const firstParam = paramList[0];
  
  // Skip if not a typical event param name
  const eventParamNames = ['e', 'event', 'evt', 'ev'];
  if (!eventParamNames.includes(firstParam)) {
    return false;
  }
  
  // Check if this line is an event listener registration
  const eventPatterns = [
    /\.addEventListener\s*\(/,
    /\.removeEventListener\s*\(/,
    /\.on\s*\(\s*['"`]\w+['"`]\s*,/,  // jQuery-style .on()
    /\.onclick\s*=/,
    /\.onchange\s*=/,
    /\.oninput\s*=/,
    /\.onsubmit\s*=/,
    /\.onkeydown\s*=/,
    /\.onkeyup\s*=/,
    /\.onkeypress\s*=/,
    /\.onmousedown\s*=/,
    /\.onmouseup\s*=/,
    /\.onmousemove\s*=/,
    /\.ontouchstart\s*=/,
    /\.ontouchend\s*=/,
    /\.ontouchmove\s*=/,
    /\.onload\s*=/,
    /\.onerror\s*=/,
    /\.onfocus\s*=/,
    /\.onblur\s*=/,
  ];
  
  for (const pattern of eventPatterns) {
    if (pattern.test(line)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect Express usage across all files
 */
function detectExpressUsage(files) {
  const matches = [];
  
  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file);
    
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match function declarations
      const funcMatch = line.match(/(?:export\s+)?function\s+(\w+)\s*\(([^)]+)\)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const params = funcMatch[2];
        
        if (matchesExpressPattern(params)) {
          matches.push({
            file: file,
            line: i + 1,
            function: funcName,
            params: params
          });
        }
      }
      
      // Match arrow functions (named)
      const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*\(([^)]+)\)\s*=>/);
      if (arrowMatch) {
        const funcName = arrowMatch[1];
        const params = arrowMatch[2];
        
        if (matchesExpressPattern(params)) {
          matches.push({
            file: file,
            line: i + 1,
            function: funcName,
            params: params
          });
        }
      }
      
      // Match inline Express route handlers (router.get, router.post, etc.)
      const routeMatch = line.match(/router\.(get|post|put|delete|patch)\s*\([^,]+,\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
      if (routeMatch) {
        const method = routeMatch[1];
        const params = routeMatch[2];
        
        if (matchesExpressPattern(params)) {
          matches.push({
            file: file,
            line: i + 1,
            function: `${method} handler`,
            params: params
          });
        }
      }
      
      // Match app.get, app.post, etc.
      const appMatch = line.match(/app\.(get|post|put|delete|patch)\s*\([^,]+,\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
      if (appMatch) {
        const method = appMatch[1];
        const params = appMatch[2];
        
        if (matchesExpressPattern(params)) {
          matches.push({
            file: file,
            line: i + 1,
            function: `${method} handler`,
            params: params
          });
        }
      }
    }
  }
  
  return matches;
}

/**
 * Get unique files affected by Express pattern
 */
function getAffectedFiles(matches) {
  const files = new Set();
  for (const match of matches) {
    files.add(match.file);
  }
  return Array.from(files);
}

// ============================================================================
// RISKY VARIABLE DETECTION
// ============================================================================

/**
 * Sources of potentially null/undefined variables
 */
const NULLABLE_PATTERNS = [
  // DOM queries (can return null)
  /document\.getElementById\s*\(/,
  /document\.querySelector\s*\(/,
  /\.querySelector\s*\(/,
  /\.getElementById\s*\(/,
  
  // Array methods that can return undefined
  /\.find\s*\(/,
  /\.shift\s*\(/,
  /\.pop\s*\(/,
  
  // Object property access (can be undefined)
  /\w+\.\w+/,
  /\w+\[['"`]\w+['"`]\]/,
];

/**
 * Sources that are GUARANTEED to return a value (never null/undefined)
 * These should NOT be marked as risky even if they match NULLABLE_PATTERNS
 */
const GUARANTEED_SAFE_PATTERNS = [
  // DOM creation - always returns an element/node
  /document\.createElement\s*\(/,
  /document\.createTextNode\s*\(/,
  /document\.createDocumentFragment\s*\(/,
  /document\.createComment\s*\(/,
  
  // DOM query methods that always return a collection (never null)
  /document\.querySelectorAll\s*\(/,
  /\.querySelectorAll\s*\(/,
  
  // DOM measurement APIs - always return objects
  /\.getBoundingClientRect\s*\(/,  // Returns DOMRect
  /\.getComputedStyle\s*\(/,        // Returns CSSStyleDeclaration
  /window\.getComputedStyle\s*\(/,
  
  // Stream API - .getReader() always returns a reader object
  /\.getReader\s*\(\s*\)/,
  
  // DOM property getters - always return defined values
  /\.offsetHeight/,
  /\.offsetWidth/,
  /\.clientHeight/,
  /\.clientWidth/,
  /\.scrollHeight/,
  /\.scrollWidth/,
  /\.offsetTop/,
  /\.offsetLeft/,
  /\.value(?!\()/,  // input.value, textarea.value (but not .value() method calls)
  
  // String operations - always return string (even if empty)
  /\.toString\s*\(/,
  /\.toLowerCase\s*\(/,
  /\.toUpperCase\s*\(/,
  /\.trim\s*\(/,
  /\.split\s*\(/,
  /\.replace\s*\(/,
  /\.substring\s*\(/,
  /\.substr\s*\(/,
  /\.slice\s*\(/,
  /String\s*\(/,
  
  // Array operations - always return array
  /\.filter\s*\(/,
  /\.map\s*\(/,
  /Array\.from\s*\(/,
  /Array\.of\s*\(/,
  /\[\s*\]/,  // Empty array literal
  
  // Number operations - always return number
  /Math\.\w+\s*\(/,
  /parseInt\s*\(/,
  /parseFloat\s*\(/,
  /Number\s*\(/,
  
  // Object creation - always returns object
  /Object\.create\s*\(/,
  /Object\.assign\s*\(/,
  /\{\s*\}/,  // Empty object literal
  
  // Constructor calls with 'new' - always return object
  /new Date\s*\(/,
  /new\s+[\w.]+\s*\(/,  // new SomeClass(), new window.Something()
  
  // JSON operations
  /JSON\.parse\s*\(/,
  /JSON\.stringify\s*\(/,
  
  // Firebase Firestore - .get() always returns a DocumentSnapshot/QuerySnapshot
  /\.get\s*\(\s*\)/,  // Firestore .get() never returns null
  
  // Winston logger - .createLogger() always returns a logger object
  /winston\.createLogger\s*\(/,
  /\.createLogger\s*\(/,
  
  // Express.js - Router always returns a router object
  /express\.Router\s*\(/,
  /Router\s*\(\s*\)/,
  
  // Event properties - guaranteed by browser when event param is an actual event
  // (We only whitelist 'event', 'evt', 'ev', 'e' as event params when used in addEventListener)
  /\b(?:event|evt|ev|e)\.target\b/,
  /\b(?:event|evt|ev|e)\.currentTarget\b/,
  /\b(?:event|evt|ev|e)\.type\b/,
  /\b(?:event|evt|ev|e)\.key\b/,
  /\b(?:event|evt|ev|e)\.code\b/,
  /\b(?:event|evt|ev|e)\.touches\b/,
  /\b(?:event|evt|ev|e)\.changedTouches\b/,
  /\b(?:event|evt|ev|e)\.preventDefault\b/,
  /\b(?:event|evt|ev|e)\.stopPropagation\b/,
];

/**
 * Extract function parameters with their default values
 * Returns Map: paramName -> hasDefault
 */
function extractFunctionParams(paramsString) {
  const params = new Map();
  
  if (!paramsString || paramsString.trim() === '') {
    return params;
  }
  
  const paramList = paramsString.split(',').map(p => p.trim());
  
  for (const param of paramList) {
    if (!param || param.includes('...')) {
      continue;
    }
    
    // Check if param has default value: options = {}
    const hasDefault = param.includes('=');
    const paramName = param.split('=')[0].trim();
    
    if (paramName) {
      params.set(paramName, hasDefault);
    }
  }
  
  return params;
}

/**
 * Find all variable declarations that could be null/undefined
 */
function findRiskyVariables(fileContent, filePath) {
  const riskyVars = new Map();  // Still use Map for compatibility, but track with scope
  const tracker = new ScopeTracker();
  const lines = fileContent.split('\n');
  
  // Check if Express is whitelisted
  const whitelist = whitelistManager.loadWhitelist();
  const expressWhitelisted = whitelistManager.isFrameworkWhitelisted(whitelist, 'express');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Update scope depth
    tracker.processLine(line, lineNum);

    // Skip comments and strings
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Pattern 1: Function parameters (always risky unless validated)
    const functionMatch = line.match(/function\s+(\w+)\s*\(([^)]+)\)/);
    if (functionMatch) {
      const funcName = functionMatch[1];
      const params = functionMatch[2];
      
      // Skip if Express middleware and Express is whitelisted
      if (expressWhitelisted && matchesExpressPattern(params)) {
        continue;
      }
      
      // Conservative heuristic: Detect event params by name (event/evt/ev) regardless of position
      const eventFunctionPatterns = [
        /^(on|handle)/i,           // onClick, handleClick, onKeyDown
        /click|press|touch|key|mouse|input|change|submit|focus|blur|load|error|close|open|cancel|start|stop|scroll|drag|drop/i,  // Contains event words
        /(handler|listener|callback|menu)$/i  // Ends with handler/listener/callback/menu
      ];
      
      // Extract params with default value info
      const paramMap = extractFunctionParams(params);
      
      for (const [paramName, hasDefault] of paramMap.entries()) {
        // Skip params with default values - they're guaranteed to be defined
        if (hasDefault) {
          continue;
        }
        
        // Skip clear event parameters: event/evt/ev (regardless of function name)
        const eventParamNames = ['event', 'evt', 'ev'];
        if (eventParamNames.includes(paramName)) {
          continue;
        }
        
        // Skip 'e' parameter IF function name suggests event handling
        if (paramName === 'e') {
          const funcNameSuggestsEvent = eventFunctionPatterns.some(pattern => pattern.test(funcName));
          if (funcNameSuggestsEvent) {
            continue;
          }
        }
        
        // Track as risky
        const key = `${paramName}:${tracker.getCurrentDepth()}`;
        riskyVars.set(key, {
          varName: paramName,
          depth: tracker.getCurrentDepth(),
          type: 'function-parameter',
          line: lineNum,
          reason: 'Function parameter (no guarantee it\'s passed)'
        });
      }
    }

    // Pattern 2: Arrow function parameters
    const arrowMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]+)\)\s*=>/);
    if (arrowMatch) {
      const funcName = arrowMatch[1];
      const params = arrowMatch[2];
      
      // Skip if Express middleware and Express is whitelisted
      if (expressWhitelisted && matchesExpressPattern(params)) {
        continue;
      }
      
      // Skip if event handler callback (browser guarantees event param)
      if (isEventHandlerCallback(line, params)) {
        continue;
      }
      
      // Skip if array method callback (JavaScript guarantees callback params)
      if (isArrayMethodCallback(line, params)) {
        continue;
      }
      
      // Conservative heuristic: Detect event params by name (event/evt/ev) regardless of position
      const eventFunctionPatterns = [
        /^(on|handle)/i,
        /click|press|touch|key|mouse|input|change|submit|focus|blur|load|error|close|open|cancel|start|stop|scroll|drag|drop/i,
        /(handler|listener|callback|menu)$/i
      ];
      
      // Extract params with default value info
      const paramMap = extractFunctionParams(params);
      
      for (const [paramName, hasDefault] of paramMap.entries()) {
        // Skip params with default values
        if (hasDefault) {
          continue;
        }
        
        // Skip clear event parameters: event/evt/ev (regardless of function name)
        const eventParamNames = ['event', 'evt', 'ev'];
        if (eventParamNames.includes(paramName)) {
          continue;
        }
        
        // Skip 'e' parameter IF function name suggests event handling
        if (paramName === 'e') {
          const funcNameSuggestsEvent = eventFunctionPatterns.some(pattern => pattern.test(funcName));
          if (funcNameSuggestsEvent) {
            continue;
          }
        }
        
        // Track as risky
        const key = `${paramName}:${tracker.getCurrentDepth()}`;
        riskyVars.set(key, {
          varName: paramName,
          depth: tracker.getCurrentDepth(),
          type: 'function-parameter',
          line: lineNum,
          reason: 'Function parameter (no guarantee it\'s passed)'
        });
      }
    }
    
    // Pattern 3: Inline Express route handlers (router.get, app.post, etc.)
    const routeMatch = line.match(/(?:router|app)\.(get|post|put|delete|patch)\s*\([^,]+,\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
    if (routeMatch) {
      const params = routeMatch[2];
      
      // Skip if Express middleware and Express is whitelisted
      if (expressWhitelisted && matchesExpressPattern(params)) {
        continue;
      }
      
      // Skip if event handler callback
      if (isEventHandlerCallback(line, params)) {
        continue;
      }
      
      // Extract params with default value info
      const paramMap = extractFunctionParams(params);
      
      for (const [paramName, hasDefault] of paramMap.entries()) {
        // Skip params with default values
        if (!hasDefault) {
          const key = `${paramName}:${tracker.getCurrentDepth()}`;
          riskyVars.set(key, {
            varName: paramName,
            depth: tracker.getCurrentDepth(),
            type: 'function-parameter',
            line: lineNum,
            reason: 'Function parameter (no guarantee it\'s passed)'
          });
        }
      }
    }

    // Pattern 4: Inline event handler callbacks - detect params that are event objects
    // Example: element.addEventListener('click', (e) => {})
    const inlineEventMatch = line.match(/\.(?:addEventListener|on)\s*\([^,]*,\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
    if (inlineEventMatch) {
      const params = inlineEventMatch[1];
      
      // If first param looks like an event, mark it as safe (skip adding to riskyVars)
      const paramList = params.split(',').map(p => p.trim().split('=')[0].trim());
      const firstParam = paramList[0];
      
      // For inline event handlers, we can be confident that ANY param name is an event
      // because it's directly in addEventListener/on() call
      // This is safer than the named function heuristic
      const eventParamNames = ['e', 'event', 'evt', 'ev'];
      
      // Don't add event params to riskyVars - they're guaranteed by the browser
      if (eventParamNames.includes(firstParam)) {
        continue;
      }
    }
    
    // Pattern 4b: Inline array method callbacks - params are guaranteed by JavaScript
    // Example: threads.filter(thread => ...), items.map(item => ...)
    const inlineArrayMethodMatch = line.match(/\.(filter|map|forEach|find|findIndex|some|every|reduce|reduceRight|sort|flatMap)\s*\((?:async\s+)?(?:\(([^)]+)\)|(\w+))\s*=>/);
    if (inlineArrayMethodMatch) {
      const params = inlineArrayMethodMatch[2] || inlineArrayMethodMatch[3]; // Could be (param) or just param
      
      // Don't add array callback params to riskyVars - they're guaranteed by JavaScript
      // The array method will never call the callback with null/undefined
      continue;
    }
    
    // Pattern 4c: For-of loop variables - guaranteed by JavaScript
    // Example: for (const thread of threads) { ... }
    const forOfMatch = line.match(/for\s*\(\s*(?:const|let)\s+(\w+)\s+of\s+/);
    if (forOfMatch) {
      const varName = forOfMatch[1];
      
      // Don't add for-of loop variables to riskyVars - they're guaranteed by JavaScript
      // The loop will never assign null/undefined to the variable
      continue;
    }
    
    // Pattern 5: Variables assigned from nullable sources
    const assignMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(.+)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const rhs = assignMatch[2];
      
      // First, check if RHS is from a GUARANTEED safe source
      let isGuaranteedSafe = false;
      for (const safePattern of GUARANTEED_SAFE_PATTERNS) {
        if (safePattern.test(rhs)) {
          isGuaranteedSafe = true;
          break;
        }
      }
      
      // If not guaranteed safe, check if it's a nullable pattern
      if (!isGuaranteedSafe) {
        // Special case: Array index access after length check
        // Example: if (array.length > 0) { const item = array[0]; }
        // Also handles: e.changedTouches[0], obj.items[0], etc.
        const arrayIndexMatch = rhs.match(/^([\w.]+)\[(\d+)\]/);
        if (arrayIndexMatch) {
          const arrayPath = arrayIndexMatch[1];  // e.g., "e.changedTouches" or "items"
          const index = parseInt(arrayIndexMatch[2]);
          
          // Look back up to 5 lines for a length check
          let hasLengthCheck = false;
          for (let j = Math.max(0, i - 5); j < i; j++) {
            const prevLine = lines[j];
            // Pattern: if (array && array.length > 0) or if (array.length > index)
            // Escape dots in arrayPath for regex
            const escapedArrayPath = arrayPath.replace(/\./g, '\\.');
            const lengthCheckPattern = new RegExp(`if\\s*\\([^)]*${escapedArrayPath}[^)]*\\.length\\s*>\\s*${index}`);
            if (lengthCheckPattern.test(prevLine)) {
              hasLengthCheck = true;
              break;
            }
          }
          
          // If length was checked, this assignment is safe - skip adding to riskyVars
          if (hasLengthCheck) {
            continue;
          }
        }
        
        for (const pattern of NULLABLE_PATTERNS) {
          if (pattern.test(rhs)) {
            // But skip if using optional chaining or default value
            if (!rhs.includes('?.') && !rhs.includes('??') && !rhs.includes('||')) {
              const key = `${varName}:${tracker.getCurrentDepth()}`;
              riskyVars.set(key, {
                varName: varName,
                depth: tracker.getCurrentDepth(),
                type: 'nullable-assignment',
                line: lineNum,
                reason: 'Assigned from potentially null/undefined source',
                source: rhs.trim()
              });
            }
            break;
          }
        }
      }
    }
  }

  return { riskyVars, tracker };
}

// ============================================================================
// SAFE PATTERN DETECTION
// ============================================================================

/**
 * Find where variables are checked/validated (safe zones)
 */
function findSafeZones(fileContent, varName) {
  const safeZones = [];
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Pattern 0: Early return guard - if (!varName) return; or if (!varName || ...) return;
    // This makes everything AFTER this line safe
    const earlyReturnPattern = new RegExp(`if\\s*\\([^)]*!${varName}[^)]*\\)\\s*return`, 'i');
    if (earlyReturnPattern.test(line)) {
      safeZones.push({
        type: 'early-return-guard',
        line: lineNum,
        scope: 'after-line'  // Everything after this is safe
      });
    }

    // Pattern 1: if (varName) or if (!varName)
    if (new RegExp(`if\\s*\\(\\s*!?${varName}\\s*\\)`).test(line)) {
      // Safe zone is inside the if block
      safeZones.push({
        type: 'if-check',
        line: lineNum,
        scope: 'inside-block'
      });
    }
    
    // Pattern 1b: if (something && varName) or if (varName && something)
    if (new RegExp(`if\\s*\\([^)]*\\b${varName}\\b[^)]*\\)`).test(line)) {
      // Check if it's part of an AND/OR condition
      const hasLogicalOp = new RegExp(`if\\s*\\([^)]*\\b${varName}\\b[^)]*[&|]{2}`).test(line) ||
                          new RegExp(`if\\s*\\([^)]*[&|]{2}[^)]*\\b${varName}\\b`).test(line);
      
      if (hasLogicalOp) {
        safeZones.push({
          type: 'logical-guard',
          line: lineNum,
          scope: 'inside-block'
        });
      }
    }
    
    // Pattern 1c: while (varName) loop - variable is guaranteed truthy inside loop
    if (new RegExp(`while\\s*\\(\\s*${varName}\\s*\\)`).test(line)) {
      safeZones.push({
        type: 'while-loop-guard',
        line: lineNum,
        scope: 'inside-block'
      });
    }
    
    // Pattern 1d: for loop with varName in condition
    if (new RegExp(`for\\s*\\([^;]*;[^;]*\\b${varName}\\b[^;]*;`).test(line)) {
      safeZones.push({
        type: 'for-loop-guard',
        line: lineNum,
        scope: 'inside-block'
      });
    }

    // Pattern 2: if (varName != null) or if (varName !== undefined)
    if (new RegExp(`if\\s*\\(\\s*${varName}\\s*(!==?|===?)\\s*(null|undefined)`).test(line)) {
      safeZones.push({
        type: 'explicit-null-check',
        line: lineNum,
        scope: 'inside-block'
      });
    }

    // Pattern 3: Early return if null (single line)
    if (new RegExp(`if\\s*\\(\\s*!${varName}\\s*\\)\\s*return`).test(line)) {
      safeZones.push({
        type: 'early-return',
        line: lineNum,
        scope: 'after-line'
      });
    }
    
    // Pattern 3b: Early return if null (multi-line) - detect the if statement
    if (new RegExp(`if\\s*\\(\\s*!${varName}\\s*\\)\\s*\\{?$`).test(line.trim())) {
      // Check if next few lines contain return statement
      const nextLines = lines.slice(i, Math.min(i + 5, lines.length));
      const hasReturn = nextLines.some(l => l.trim().startsWith('return') || l.trim() === 'return;');
      
      if (hasReturn) {
        safeZones.push({
          type: 'early-return-multiline',
          line: lineNum,
          scope: 'after-line'
        });
      }
    }
    
    // Pattern 3c: Early return with explicit null check
    if (new RegExp(`if\\s*\\(\\s*${varName}\\s*===?\\s*(null|undefined)`).test(line)) {
      const nextLines = lines.slice(i, Math.min(i + 5, lines.length));
      const hasReturn = nextLines.some(l => l.trim().startsWith('return') || l.trim() === 'return;');
      
      if (hasReturn) {
        safeZones.push({
          type: 'early-return-explicit',
          line: lineNum,
          scope: 'after-line'
        });
      }
    }

    // Pattern 4: Default value assignment
    if (new RegExp(`${varName}\\s*=\\s*${varName}\\s*(\\|\\||\\?\\?)`).test(line)) {
      safeZones.push({
        type: 'default-value',
        line: lineNum,
        scope: 'after-line'
      });
    }

    // Pattern 5: Optional chaining used
    if (new RegExp(`${varName}\\?\\.`).test(line)) {
      safeZones.push({
        type: 'optional-chaining',
        line: lineNum,
        scope: 'this-line'
      });
    }
  }

  return safeZones;
}

/**
 * Check if line is in a safe zone
 */
function isInSafeZone(lineNum, safeZones) {
  for (const zone of safeZones) {
    if (zone.scope === 'this-line' && zone.line === lineNum) {
      return true;
    }
    if (zone.scope === 'after-line' && lineNum > zone.line) {
      return true;
    }
    if (zone.scope === 'inside-block') {
      // Simple heuristic: assume block extends for next 150 lines
      // (A full AST parser would track braces properly)
      // Increased from 50 to 150 to handle large if-blocks with nested functions
      if (lineNum > zone.line && lineNum < zone.line + 150) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================================
// UNSAFE ACCESS DETECTION
// ============================================================================

/**
 * Check if variable has a fallback pattern (|| defaultValue)
 * This makes the variable safe on the SAME line
 */
function hasFallbackPattern(line, varName) {
  // Pattern: varName || defaultValue or varName?.property || defaultValue
  const fallbackPattern = new RegExp(`\\b${varName}(?:\\.\\w+|\\?\\.\\w+)?\\s*\\|\\|\\s*\\S+`);
  return fallbackPattern.test(line);
}

/**
 * Check if variable is inside a ternary guard
 * Pattern: varName ? varName.prop : default
 */
function isInTernaryGuard(line, varName) {
  // Basic check: varName appears before ? and after it
  // Supports both property access (varName.prop) and array access (varName[index])
  const ternaryPattern = new RegExp(`\\b${varName}\\s*\\?[^:]*\\b${varName}[.\\[]`);
  return ternaryPattern.test(line);
}

/**
 * Check if variable has same-line && guard
 * Pattern 1: varName && varName.method()
 * Pattern 2: varName.prop && varName.prop.method()
 * Pattern 3: if (varName && varName.property === ...) - inside if-condition
 */
function hasSameLineAndGuard(line, varName, accessPattern) {
  // Extract what's being accessed (e.g., "element.classList" from "element.classList.contains")
  const accessMatch = accessPattern.match(new RegExp(`\\b${varName}(\\.\\w+)+`));
  if (!accessMatch) return false;
  
  const fullAccess = accessMatch[0]; // e.g., "element.classList.contains"
  
  // Check if a prefix of this access appears before && on the same line
  // e.g., "element.classList && element.classList.contains"
  // OR "element && element.addEventListener"
  const parts = fullAccess.split('.');
  
  // First check the simplest pattern: varName && varName.property
  const simpleGuard = new RegExp(`\\b${varName}\\s*&&`);
  if (simpleGuard.test(line)) {
    return true;
  }
  
  // Check if inside an if-condition with a guard for this variable
  // Pattern: if (varName && ...) or if (...  && varName && ...)
  const ifConditionPattern = /if\s*\(([^)]+)\)/;
  const ifMatch = line.match(ifConditionPattern);
  if (ifMatch) {
    const condition = ifMatch[1];
    // Split by && and check if varName appears before the access
    const parts = condition.split('&&');
    let foundGuard = false;
    for (const part of parts) {
      // If we found the guard for varName, subsequent accesses are safe
      if (new RegExp(`\\b${varName}\\b`).test(part) && !new RegExp(`\\b${varName}\\.`).test(part)) {
        foundGuard = true;
      }
      // If this part contains the access we're checking, it's safe if we already found the guard
      if (foundGuard && part.includes(fullAccess)) {
        return true;
      }
    }
  }
  
  // Then check if any longer prefix (varName.prop) appears before &&
  for (let i = 2; i <= parts.length - 1; i++) {
    const prefix = parts.slice(0, i).join('.');
    const guardPattern = new RegExp(`\\b${prefix.replace(/\./g, '\\.')}\\s*&&`);
    if (guardPattern.test(line)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for same-line if-guard without braces
 * Pattern: if (varName) varName.property or if (!varName) ... else varName.property
 */
function hasSameLineIfGuard(line, varName) {
  // Pattern: if (varName) varName.something
  const simpleIfPattern = new RegExp(`if\\s*\\(\\s*${varName}\\s*\\)[^{]*\\b${varName}\\.`);
  if (simpleIfPattern.test(line)) {
    return true;
  }
  
  // Pattern: if (!something || varName) varName.something
  const conditionalIfPattern = new RegExp(`if\\s*\\([^)]*\\b${varName}\\b[^)]*\\)[^{]*\\b${varName}\\.`);
  if (conditionalIfPattern.test(line)) {
    // Make sure the varName in the condition is checked (not negated alone)
    const conditionMatch = line.match(/if\s*\(([^)]+)\)/);
    if (conditionMatch) {
      const condition = conditionMatch[1];
      // Simple heuristic: if varName appears without ! immediately before it
      if (new RegExp(`(?<!!)\\b${varName}\\b`).test(condition)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Find unsafe property/method access on risky variables
 */
function findUnsafeAccess(fileContent, riskyVars, originalTracker) {
  const issues = [];
  const lines = fileContent.split('\n');
  
  // Dedupe: Track reported issues by "line:variable:pattern"
  const reported = new Set();
  
  // Helper to find a variable in scope (walks up scope chain)
  const findInScope = (varName, currentDepth) => {
    // Try current depth first, then walk up
    for (let depth = currentDepth; depth >= 0; depth--) {
      const key = `${varName}:${depth}`;
      if (riskyVars.has(key)) {
        return riskyVars.get(key);
      }
    }
    return null;
  };

  // Get unique variable names (strip depth)
  const uniqueVars = new Set();
  for (const [key, varInfo] of riskyVars.entries()) {
    uniqueVars.add(varInfo.varName);
  }

  for (const varName of uniqueVars) {
    const safeZones = findSafeZones(fileContent, varName);
    
    // Create a new tracker for this pass to track scope depth
    const tracker = new ScopeTracker();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Update scope depth for this line
      tracker.processLine(line, lineNum);
      
      // Find if this variable is risky in the current scope
      const varInfo = findInScope(varName, tracker.getCurrentDepth());
      
      // If variable not in scope here, skip
      if (!varInfo) {
        continue;
      }

      // Skip the line where the variable is declared
      if (lineNum === varInfo.line) {
        continue;
      }
      
      // CRITICAL: Only flag if the risky variable was declared BEFORE this line
      // This prevents variables from later scopes polluting earlier ones
      if (varInfo.line > lineNum) {
        continue;
      }

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }
      
      // Skip if variable has fallback on this line: options.headers || {}
      if (hasFallbackPattern(line, varName)) {
        continue;
      }
      
      // Skip if variable is in ternary guard: inputEl ? inputEl.value : ""
      if (isInTernaryGuard(line, varName)) {
        continue;
      }
      
      // Skip if variable has same-line && guard: element.prop && element.prop.method()
      if (hasSameLineAndGuard(line, varName, line)) {
        continue;
      }
      
      // Skip if same-line if-guard: if (varName) varName.property
      if (hasSameLineIfGuard(line, varName)) {
        continue;
      }
      
      // Skip if using optional chaining on this line: varName?.property or varName?.method()
      const optionalChainingPattern = new RegExp(`\\b${varName}\\?\\.`);
      if (optionalChainingPattern.test(line)) {
        continue;
      }

      // Check for unsafe access patterns
      
      // Note: Check method calls BEFORE property access, since method calls include property access
      // This prevents double-reporting (e.g., element.addEventListener matches both patterns)
      let alreadyReported = false;

      // Pattern 1: Method call (varName.method())
      const methodCallMatch = new RegExp(`\\b${varName}\\.\\w+\\s*\\(`).exec(line);
      if (methodCallMatch) {
        const optionalChaining = new RegExp(`\\b${varName}\\?\\.\\w+\\s*\\(`).test(line);
        
        if (!optionalChaining && !isInSafeZone(lineNum, safeZones)) {
          // Dedupe: Only report once per line+variable+pattern
          const key = `${lineNum}:${varName}:method-call`;
          if (!reported.has(key)) {
            reported.add(key);
            issues.push({
              line: lineNum,
              variable: varName,
              pattern: 'method-call',
              code: line.trim(),
              varInfo: varInfo,
              severity: 'high'
            });
            alreadyReported = true;
          }
        }
      }

      // Pattern 2: Direct property access (varName.property)
      // Skip if already reported as method call
      if (!alreadyReported) {
        const propAccessMatch = new RegExp(`\\b${varName}\\.\\w+`).exec(line);
        if (propAccessMatch) {
          // Check if using optional chaining
          const optionalChaining = new RegExp(`\\b${varName}\\?\\.\\w+`).test(line);
          
          if (!optionalChaining && !isInSafeZone(lineNum, safeZones)) {
            // Dedupe: Only report once per line+variable+pattern
            const key = `${lineNum}:${varName}:property-access`;
            if (!reported.has(key)) {
              reported.add(key);
              issues.push({
                line: lineNum,
                variable: varName,
                pattern: 'property-access',
                code: line.trim(),
                varInfo: varInfo,
                severity: 'high'
              });
              alreadyReported = true;
            }
          }
        }
      }

      // Pattern 3: Bracket access (varName['property'])
      // Skip if already reported
      if (!alreadyReported) {
        const bracketAccessMatch = new RegExp(`\\b${varName}\\[`).exec(line);
        if (bracketAccessMatch) {
          const optionalChaining = new RegExp(`\\b${varName}\\?\\[`).test(line);
          
          if (!optionalChaining && !isInSafeZone(lineNum, safeZones)) {
            // Dedupe: Only report once per line+variable+pattern
            const key = `${lineNum}:${varName}:bracket-access`;
            if (!reported.has(key)) {
              reported.add(key);
              issues.push({
                line: lineNum,
                variable: varName,
                pattern: 'bracket-access',
                code: line.trim(),
                varInfo: varInfo,
                severity: 'medium'
              });
              alreadyReported = true;
            }
          }
        }
      }

      // Pattern 4: Used in conditionals without check (if (varName.prop))
      // Skip if already reported
      if (!alreadyReported) {
        const conditionalMatch = new RegExp(`if\\s*\\([^)]*\\b${varName}\\.\\w+`).exec(line);
        if (conditionalMatch) {
          const optionalChaining = new RegExp(`\\b${varName}\\?\\.`).test(line);
          
          if (!optionalChaining && !isInSafeZone(lineNum, safeZones)) {
            // Dedupe: Only report once per line+variable+pattern
            const key = `${lineNum}:${varName}:conditional-access`;
            if (!reported.has(key)) {
              reported.add(key);
              issues.push({
                line: lineNum,
                variable: varName,
                pattern: 'conditional-access',
                code: line.trim(),
                varInfo: varInfo,
                severity: 'medium'
              });
            }
          }
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// FALSE POSITIVE FILTERING
// ============================================================================

/**
 * Filter out known false positives
 */
function filterFalsePositives(issues, fileContent) {
  const filtered = [];

  for (const issue of issues) {
    // Skip if variable name is in common safe list
    const safeVars = ['console', 'window', 'document', 'process', 'module', 'exports'];
    if (safeVars.includes(issue.variable)) {
      continue;
    }

    // Skip if inside try/catch (error handling)
    if (isInsideTryCatch(fileContent, issue.line)) {
      continue;
    }

    // Skip if variable has underscore prefix (convention for "known nullable")
    if (issue.variable.startsWith('_')) {
      continue;
    }

    filtered.push(issue);
  }

  return filtered;
}

/**
 * Check if line is inside try/catch block
 */
function isInsideTryCatch(fileContent, lineNum) {
  const lines = fileContent.split('\n');
  let tryStart = -1;

  for (let i = lineNum - 2; i >= Math.max(0, lineNum - 100); i--) {
    if (/^\s*try\s*\{/.test(lines[i])) {
      tryStart = i;
      break;
    }
  }

  if (tryStart === -1) {
    return false;
  }

  // Simple check: if we found a try, assume we're inside it
  // (Full AST would track brace matching)
  return true;
}

// ============================================================================
// FILE SCANNING
// ============================================================================

/**
 * Scan single file for null-access issues
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find risky variables (now returns {riskyVars, tracker})
  const { riskyVars, tracker } = findRiskyVariables(content, filePath);
  
  // Find unsafe access (now scope-aware)
  let issues = findUnsafeAccess(content, riskyVars, tracker);
  
  // Filter false positives
  issues = filterFalsePositives(issues, content);

  return issues;
}

// ============================================================================
// WHITELIST INTEGRATION
// ============================================================================

/**
 * Check issue against whitelist
 */
function checkWhitelist(issue, filePath) {
  const whitelist = whitelistManager.loadWhitelist();
  const relPath = path.relative(ROOT_DIR, filePath);
  
  // Check if this line is whitelisted
  const entry = whitelistManager.getWhitelistEntryByLocation(whitelist, relPath, issue.line);
  
  if (!entry) {
    return { whitelisted: false };
  }

  // Validate whitelist entry
  const validation = whitelistManager.validateWhitelistEntry(entry);

  return {
    whitelisted: true,
    entry: entry,
    validation: validation
  };
}

/**
 * Categorize issues by whitelist status
 */
function categorizeIssues(issues, filePath) {
  const categorized = {
    new: [],
    whitelisted: [],
    drift: []
  };

  for (const issue of issues) {
    const whitelistCheck = checkWhitelist(issue, filePath);

    if (!whitelistCheck.whitelisted) {
      categorized.new.push(issue);
    } else if (!whitelistCheck.validation.valid) {
      categorized.drift.push({
        issue,
        entry: whitelistCheck.entry,
        validation: whitelistCheck.validation
      });
    } else {
      categorized.whitelisted.push({
        issue,
        entry: whitelistCheck.entry
      });
    }
  }

  return categorized;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Format issue for display
 */
function formatIssue(issue, filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  let output = '';

  output += `\n  ${relPath}:${issue.line}\n`;
  output += `    ${issue.code}\n`;
  output += `    ⚠️  '${issue.variable}' could be null/undefined (${issue.varInfo.reason})\n`;

  // Suggest fix based on pattern
  if (issue.pattern === 'property-access' || issue.pattern === 'method-call') {
    output += `    💡 Fix: Use optional chaining: ${issue.variable}?.property\n`;
    output += `         OR: Add null check: if (!${issue.variable}) return;\n`;
  } else if (issue.pattern === 'bracket-access') {
    output += `    💡 Fix: Use optional chaining: ${issue.variable}?.[key]\n`;
  }

  return output;
}

/**
 * Format whitelist drift for display
 */
function formatDrift(drift) {
  const { issue, entry, validation } = drift;
  let output = '';

  output += `\n  🟨 WHITELIST DRIFT: ${entry.id}\n`;
  output += `     ${entry.file}:${entry.line}\n`;
  output += whitelistManager.formatValidationErrors(entry, validation);
  output += `     💡 Run: npm run validation:update ${entry.id}\n`;

  return output;
}

/**
 * Generate full report
 */
function generateReport(results) {
  let output = '\n';
  output += '━'.repeat(80) + '\n';
  output += '🔍 Bug Pattern #3: Null/Undefined Access\n';
  output += '━'.repeat(80) + '\n';

  let totalNew = 0;
  let totalWhitelisted = 0;
  let totalDrift = 0;

  for (const [filePath, categorized] of Object.entries(results)) {
    const relPath = path.relative(ROOT_DIR, filePath);

    if (categorized.new.length === 0 && categorized.drift.length === 0) {
      continue;
    }

    output += `\n📄 ${relPath}\n`;

    // New issues
    if (categorized.new.length > 0) {
      output += '\n  ❌ NEW ISSUES:\n';
      for (const issue of categorized.new) {
        output += formatIssue(issue, filePath);
        totalNew++;
      }
    }

    // Drift issues
    if (categorized.drift.length > 0) {
      output += '\n  🟨 WHITELIST DRIFT:\n';
      for (const drift of categorized.drift) {
        output += formatDrift(drift);
        totalDrift++;
      }
    }

    // Note whitelisted (but don't show details)
    if (categorized.whitelisted.length > 0) {
      output += `\n  ✅ Whitelisted: ${categorized.whitelisted.length} issue(s)\n`;
      totalWhitelisted += categorized.whitelisted.length;
    }
  }

  // Summary
  output += '\n' + '━'.repeat(80) + '\n';
  output += '\n📊 Summary:\n\n';
  output += `  ❌ New issues: ${totalNew}\n`;
  output += `  🟨 Whitelist drift: ${totalDrift}\n`;
  output += `  ✅ Whitelisted: ${totalWhitelisted}\n`;

  if (totalNew + totalDrift === 0) {
    output += '\n  🎉 No null-access issues found!\n';
  } else {
    output += '\n  💡 To whitelist an issue, add above the code:\n';
    output += '     // @validation-ignore null-access\n';
    output += '     // @reason: <why this is safe>\n';
    output += '     // @dependency: <function> at line <N>\n';
    output += '     // @whitelist-id: null-access-XXX\n\n';
    output += '     Then run: npm run validation:sync-whitelist\n';
  }

  output += '\n' + '━'.repeat(80) + '\n';

  return {
    output,
    totals: {
      new: totalNew,
      drift: totalDrift,
      whitelisted: totalWhitelisted
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Run null-access detection on files
 */
function checkNullAccess(files) {
  const results = {};

  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const issues = scanFile(filePath);
      const categorized = categorizeIssues(issues, filePath);
      results[filePath] = categorized;
    } catch (error) {
      console.error(`Error scanning ${file}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Detect frameworks and check if prompting is needed
 */
function detectFrameworksNeedingPrompt(files) {
  const whitelist = whitelistManager.loadWhitelist();
  const expressWhitelisted = whitelistManager.isFrameworkWhitelisted(whitelist, 'express');
  
  // If Express already whitelisted, no prompt needed
  if (expressWhitelisted) {
    return null;
  }
  
  // Detect Express usage
  const expressMatches = detectExpressUsage(files);
  
  // Only prompt if we found 3+ Express middleware functions
  if (expressMatches.length >= 3) {
    return {
      framework: 'express',
      matches: expressMatches,
      description: EXPRESS_PATTERNS.description
    };
  }
  
  return null;
}

export { 
  checkNullAccess, 
  generateReport, 
  scanFile, 
  categorizeIssues,
  detectFrameworksNeedingPrompt,
  detectExpressUsage,
  getAffectedFiles
};

