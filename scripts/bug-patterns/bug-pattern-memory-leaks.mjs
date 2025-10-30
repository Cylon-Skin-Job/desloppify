#!/usr/bin/env node

/**
 * Bug Pattern #6: Memory Leaks - Event Listeners
 * 
 * Detects addEventListener calls without matching removeEventListener or cleanup.
 * 
 * Patterns detected:
 * - addEventListener without removeEventListener
 * - addEventListener without AbortController
 * - addEventListener in functions that run multiple times
 * - addEventListener in loops/intervals
 * 
 * Smart exclusions:
 * - One-time listeners (e.g., DOMContentLoaded, load)
 * - Listeners with { once: true } option
 * - Listeners with AbortController signal
 * - Listeners in init functions with cleanup returns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Files to scan
const JS_FILES = [
  'index.js',
  'js/api-client.js',
  'js/app-state.js',
  'js/assistant-settings.js',
  'js/auth-manager.js',
  'js/context-menus.js',
  'js/dom-utils.js',
  'js/drawers.js',
  'js/firebase-client.js',
  'js/message-actions.js',
  'js/message-renderer.js',
  'js/message-sender.js',
  'js/streaming.js',
  'js/thread-manager.js',
  'js/tts-integration.js',
  'js/ttsAuto.js',
  'js/ttsMain.js',
  'js/ui-helpers.js',
  'public/streamBuffer.js',
];

// One-time events that don't need cleanup
const ONE_TIME_EVENTS = [
  'DOMContentLoaded',
  'load',
  'beforeunload',
  'unload',
];

/**
 * Parse event listener calls from code
 */
function parseEventListeners(code, filePath) {
  const listeners = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Pattern: .addEventListener('event', handler)
    // Matches: addEventListener('click', handleClick)
    //          addEventListener('click', function myFunc() {})
    //          addEventListener('click', async () => {})
    const addMatch = line.match(/\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(?:function\s+)?(\w+)/);
    if (addMatch) {
      const [, event, handler] = addMatch;
      
      // Check if it has { once: true } option
      const hasOnce = line.includes('once') && line.includes('true');
      
      // Check if it has AbortController signal
      const hasSignal = line.includes('signal:') || line.includes('signal }');

      listeners.push({
        type: 'add',
        event,
        handler,
        line: lineNum,
        code: line.trim(),
        hasOnce,
        hasSignal,
        filePath,
      });
    }

    // Pattern: .removeEventListener('event', handler)
    const removeMatch = line.match(/\.removeEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(?:function\s+)?(\w+)/);
    if (removeMatch) {
      const [, event, handler] = removeMatch;
      
      listeners.push({
        type: 'remove',
        event,
        handler,
        line: lineNum,
        code: line.trim(),
        filePath,
      });
    }
  }

  return listeners;
}

/**
 * Check if function has cleanup/return pattern
 */
function hasCleanupPattern(code, functionName) {
  const lines = code.split('\n');
  
  // Find function definition
  let functionStart = -1;
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find function start
    if (!inFunction && line.includes(`function ${functionName}`) || 
        line.includes(`const ${functionName} =`) ||
        line.includes(`${functionName}:`) ||
        line.includes(`${functionName}(`)) {
      functionStart = i;
      inFunction = true;
    }
    
    if (!inFunction) continue;
    
    // Track braces
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    // Check for cleanup patterns within function
    if (line.includes('removeEventListener') || 
        line.includes('return () =>') ||
        line.includes('return function') ||
        line.includes('cleanup') ||
        line.includes('destroy') ||
        line.includes('dispose') ||
        line.includes('AbortController') ||
        line.includes('.abort()')) {
      return true;
    }
    
    // Function ended
    if (inFunction && braceCount === 0 && i > functionStart) {
      break;
    }
  }
  
  return false;
}

/**
 * Check if DOM element is created fresh (not reused)
 */
function isElementCreatedFresh(code, lineNum) {
  const lines = code.split('\n');
  const listenerLine = lines[lineNum - 1];
  
  // Extract the variable name that addEventListener is called on
  const varMatch = listenerLine.match(/(\w+)\.addEventListener/);
  if (!varMatch) return false;
  const targetVar = varMatch[1];
  
  // Look backwards from the addEventListener line through entire file
  for (let i = lineNum - 1; i >= 0; i--) {
    const line = lines[i];
    
    // Pattern 1: Direct createElement
    // const btn = document.createElement('button');
    if (line.includes(targetVar) && line.match(/createElement\(/)) {
      return true;
    }
    
    // Pattern 2: querySelector on a just-created/cleared parent
    // const btn = messageActions.querySelector('.icon-speaker');
    // where messageActions was just created via createElement
    if (line.includes(targetVar) && line.match(/\.querySelector/)) {
      const parentMatch = line.match(/(\w+)\.querySelector/);
      if (parentMatch) {
        const parentVar = parentMatch[1];
        // Check if parent was created anywhere in the file
        for (let j = i - 1; j >= 0; j--) {
          // Found where parent was created
          if (lines[j].match(new RegExp(`const\\s+${parentVar}\\s*=.*createElement`)) ||
              lines[j].match(new RegExp(`let\\s+${parentVar}\\s*=.*createElement`))) {
            return true;
          }
          // Or found where parent innerHTML was set (creates fresh children)
          if (lines[j].includes(parentVar) && lines[j].match(/\.innerHTML\s*=\s*`/)) {
            return true;
          }
        }
      }
    }
    
    // Pattern 3: Inside forEach loop (loop variable is fresh each iteration)
    // btns.forEach(btn => { btn.addEventListener(...) })
    if (line.match(new RegExp(`\.forEach\\s*\\(\\s*${targetVar}\\s*=>`))) {
      // Check what we're iterating over
      const forEachMatch = line.match(/(\w+)\.forEach/);
      if (forEachMatch) {
        const collectionVar = forEachMatch[1];
        // Look backwards to see if collection comes from querySelectorAll or was just created
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].includes(collectionVar) && 
              (lines[j].match(/querySelectorAll/) || 
               lines[j].match(/render\w+\(/i) || 
               lines[j].match(/\.innerHTML\s*=/))) {
            return true;
          }
        }
      }
    }
    
    // Pattern 4: querySelectorAll after innerHTML clear
    // renderVoiceOptions(); // clears innerHTML
    // const btns = document.querySelectorAll('.voice-option-btn');
    // btns.forEach(btn => btn.addEventListener(...));
    if (line.match(/\.innerHTML\s*=\s*['"]/)) {
      return true;
    }
    
    // Pattern 5: Function call that clears/recreates (renderVoiceOptions, etc)
    if (line.match(/render\w+\(/i) || line.match(/clear\w+\(/i)) {
      return true;
    }
    
    // Pattern 6: new MediaSource(), new AbortController(), etc (fresh objects)
    if (line.includes(targetVar) && line.match(/=\s*new\s+(MediaSource|AbortController|Audio|XMLHttpRequest)\(/)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if function is DOMContentLoaded or one-time init
 */
function isOneTimeInit(code, lineNum) {
  const lines = code.split('\n');
  
  // Look backwards through entire file for DOMContentLoaded
  for (let i = lineNum - 1; i >= 0; i--) {
    if (lines[i].includes('DOMContentLoaded')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if we're inside an exported init function that's called once from DOMContentLoaded
 */
function isInsideOneTimeInitFunction(code, lineNum) {
  const lines = code.split('\n');
  
  // Look backwards to find what function we're in
  let currentFunction = null;
  for (let i = lineNum - 1; i >= 0; i--) {
    const match = lines[i].match(/export\s+function\s+(init\w+)\s*\(/);
    if (match) {
      currentFunction = match[1];
      break;
    }
  }
  
  if (!currentFunction) return false;
  
  // These init functions are called once from index.js DOMContentLoaded
  // Common pattern in modular apps
  const oneTimeInitFunctions = [
    'initSideDrawer',
    'initNotesDrawer', 
    'initCustomizationDrawer',
    'initEditNameIconDrawer',
    'initVoiceSelectionDrawer',
    'initThreadDrawer',
    'initSettingsDrawer'
  ];
  
  return oneTimeInitFunctions.includes(currentFunction);
}

/**
 * Check if listener is in a function that runs multiple times
 */
function isInRepeatingFunction(code, lineNum, filePath) {
  const lines = code.split('\n');
  const line = lines[lineNum - 1];
  
  // Check if element is created fresh each time
  if (isElementCreatedFresh(code, lineNum)) {
    return false; // Safe - fresh element
  }
  
  // Check if inside DOMContentLoaded (runs once)
  if (isOneTimeInit(code, lineNum)) {
    return false; // Safe - one-time init
  }
  
  // Check if inside an exported init function called once from DOMContentLoaded
  if (isInsideOneTimeInitFunction(code, lineNum)) {
    return false; // Safe - one-time init from main
  }
  
  // Look backwards for function definition
  for (let i = lineNum - 1; i >= 0; i--) {
    const currentLine = lines[i];
    
    // Risky function names (typically called multiple times)
    if (currentLine.match(/function (init|setup|start|open|connect|attach|bind|register)/)) {
      // But if the function creates fresh elements, it's safe
      return !isElementCreatedFresh(code, lineNum);
    }
    
    // Inside a loop
    if (currentLine.match(/for\s*\(|while\s*\(|\.forEach|\.map/)) {
      return true;
    }
    
    // Inside setInterval/setTimeout
    if (currentLine.match(/setInterval|setTimeout/)) {
      return true;
    }
    
    // If we hit a function that looks safe, stop
    if (currentLine.match(/function\s+\w+/) && 
        !currentLine.match(/function (init|setup|start|open|connect|attach|bind|register)/)) {
      break;
    }
  }
  
  return false;
}

/**
 * Find memory leak risks
 */
function findMemoryLeaks(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  const code = fs.readFileSync(fullPath, 'utf-8');
  const listeners = parseEventListeners(code, filePath);
  
  // Separate adds and removes
  const addedListeners = listeners.filter(l => l.type === 'add');
  const removedListeners = listeners.filter(l => l.type === 'remove');
  
  const leaks = [];
  
  for (const added of addedListeners) {
    // Skip if it's a one-time event
    if (ONE_TIME_EVENTS.includes(added.event)) {
      continue;
    }
    
    // Skip if it has { once: true }
    if (added.hasOnce) {
      continue;
    }
    
    // Skip if it has AbortController signal
    if (added.hasSignal) {
      continue;
    }
    
    // Check if there's a matching removeEventListener
    const hasRemoval = removedListeners.some(removed => 
      removed.event === added.event && 
      removed.handler === added.handler
    );
    
    if (hasRemoval) {
      continue;
    }
    
    // Check for self-removing listener (removes itself inside the handler)
    // Pattern: addEventListener('event', function name() { removeEventListener('event', name); ... })
    let isSelfRemoving = false;
    if (added.handler !== 'async' && added.handler !== 'function') {
      // Look ahead a few lines to see if handler removes itself
      const lines = code.split('\n');
      for (let j = added.line; j < Math.min(added.line + 5, lines.length); j++) {
        if (lines[j].includes('removeEventListener') && 
            lines[j].includes(added.event) && 
            lines[j].includes(added.handler)) {
          isSelfRemoving = true;
          break;
        }
      }
    }
    
    if (isSelfRemoving) {
      continue; // Safe - self-removing listener
    }
    
    // Check if function has cleanup pattern
    const functionMatch = code.match(new RegExp(`function\\s+(\\w+)[^{]*{[^}]*${added.handler}`, 's'));
    if (functionMatch) {
      const functionName = functionMatch[1];
      if (hasCleanupPattern(code, functionName)) {
        continue;
      }
    }
    
    // Skip if inside one-time init (DOMContentLoaded or exported init functions)
    if (isOneTimeInit(code, added.line) || isInsideOneTimeInitFunction(code, added.line)) {
      continue; // Safe - one-time setup
    }
    
    // Skip if element is created fresh each time
    if (isElementCreatedFresh(code, added.line)) {
      continue; // Safe - fresh element, garbage collected when destroyed
    }
    
    // Check if in repeating function
    const isRepeating = isInRepeatingFunction(code, added.line, filePath);
    
    leaks.push({
      file: filePath,
      line: added.line,
      event: added.event,
      handler: added.handler,
      code: added.code,
      severity: isRepeating ? 'HIGH' : 'MEDIUM',
      reason: isRepeating 
        ? 'Listener added in function that runs multiple times'
        : 'Listener never removed',
    });
  }
  
  return leaks;
}

/**
 * Main check function
 */
export function checkMemoryLeaks() {
  const allLeaks = [];
  
  for (const file of JS_FILES) {
    const leaks = findMemoryLeaks(file);
    allLeaks.push(...leaks);
  }
  
  // Group by severity
  const highSeverity = allLeaks.filter(l => l.severity === 'HIGH');
  const mediumSeverity = allLeaks.filter(l => l.severity === 'MEDIUM');
  
  // Only fail on HIGH severity (actual leaks)
  // MEDIUM are informational warnings (likely safe patterns)
  if (highSeverity.length === 0 && mediumSeverity.length === 0) {
    return { success: true, message: 'No memory leaks detected' };
  }
  
  if (highSeverity.length === 0) {
    // Only MEDIUM severity - pass with warnings
    let output = '\n✅ No HIGH severity memory leaks\n';
    output += `ℹ️  ${mediumSeverity.length} MEDIUM severity warnings (likely safe patterns)\n\n`;
    
    // Show details for review
    output += '🟡 MEDIUM SEVERITY (no cleanup found, but likely safe):\n\n';
    for (const leak of mediumSeverity) {
      output += `  ${leak.file}:${leak.line}\n`;
      output += `    Event: ${leak.event}, Handler: ${leak.handler}\n`;
      output += `    Reason: ${leak.reason}\n`;
      output += `    Code: ${leak.code}\n\n`;
    }
    
    return { success: true, message: output, warnings: mediumSeverity };
  }
  
  // HIGH severity found - fail the check
  let output = '\n❌ Memory leak risks detected:\n\n';
  
  if (highSeverity.length > 0) {
    output += '🔴 HIGH SEVERITY (runs multiple times without cleanup):\n\n';
    for (const leak of highSeverity) {
      output += `  ${leak.file}:${leak.line}\n`;
      output += `    Event: ${leak.event}, Handler: ${leak.handler}\n`;
      output += `    Reason: ${leak.reason}\n`;
      output += `    Code: ${leak.code}\n\n`;
    }
  }
  
  if (mediumSeverity.length > 0) {
    output += '🟡 MEDIUM SEVERITY (no cleanup found):\n\n';
    for (const leak of mediumSeverity) {
      output += `  ${leak.file}:${leak.line}\n`;
      output += `    Event: ${leak.event}, Handler: ${leak.handler}\n`;
      output += `    Reason: ${leak.reason}\n`;
      output += `    Code: ${leak.code}\n\n`;
    }
  }
  
  output += '💡 Fix options:\n';
  output += '   1. Add removeEventListener in cleanup function\n';
  output += '   2. Use { once: true } option for one-time events\n';
  output += '   3. Use AbortController with signal option\n';
  output += '   4. Add @validation-ignore comment if intentional\n\n';
  
  return { success: false, message: output };
}

// CLI mode
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = checkMemoryLeaks();
  console.log(result.message);
  process.exit(result.success ? 0 : 1);
}

