// Annotation Enforcement: @mutates-state
// Detects functions that mutate state but lack documentation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

// Known state setters from app-state.js
const STATE_SETTERS = [
  'setVoiceIndex',
  'setUserId',
  'setCurrentUser',
  'setCurrentIdToken',
  'setThreadId',
  'setCurrentThreadId',
  'setCurrentAppSlug',
  'setIsSending',
  'setCurrentAudio',
  'setLastVisibleTime',
  'setPinnedSectionExpanded',
  'setDevMode',
  'setAutoPlayEnabled',
  'setLastTtsButton',
  'setCurrentAssistantIcon',
  'setCurrentAssistantName'
];

/**
 * Check if functions document state mutations
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkStateMutations(files, config = {}) {
  const issues = [];
  
  for (const file of files) {
    const filePath = path.join(repoRoot, file);
    let content;
    
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      continue;
    }
    
    const lines = content.split('\n');
    
    // Find all function declarations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Match function declarations
      const funcMatch = line.match(/(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
      const exportMatch = line.match(/export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      
      const functionName = funcMatch?.[1] || arrowMatch?.[1] || exportMatch?.[1];
      
      if (functionName) {
        // Skip setter functions themselves (they're the implementation)
        if (STATE_SETTERS.includes(functionName)) {
          continue;
        }
        
        // Extract function body (approximate)
        let funcBody = '';
        let braceCount = 0;
        let started = false;
        
        for (let j = i; j < Math.min(i + 200, lines.length); j++) {
          const bodyLine = lines[j];
          if (bodyLine.includes('{')) {
            started = true;
            braceCount += (bodyLine.match(/\{/g) || []).length;
          }
          if (started) {
            funcBody += bodyLine + '\n';
            braceCount -= (bodyLine.match(/\}/g) || []).length;
            if (braceCount === 0 && started) break;
          }
        }
        
        // Detect state mutations
        const mutations = detectStateMutations(funcBody);
        
        // Detect DOM mutations
        const domMutations = detectDOMMutations(funcBody);
        
        // Detect database writes
        const dbWrites = detectDatabaseWrites(funcBody);
        
        const allMutations = [...mutations, ...domMutations, ...dbWrites];
        
        // Check if function has @mutates-state annotation
        let hasMutatesState = false;
        for (let j = Math.max(0, i - 15); j < i; j++) {
          if (lines[j].includes('@mutates-state')) {
            hasMutatesState = true;
            break;
          }
        }
        
        // Rule: Functions with 2+ mutations should document them
        if (allMutations.length >= 2 && !hasMutatesState) {
          const severity = config.mutationSeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-mutates-state',
            severity,
            message: `Function '${functionName}' mutates ${allMutations.length} things but lacks @mutates-state annotation`,
            detectedMutations: {
              state: mutations,
              dom: domMutations,
              database: dbWrites
            },
            suggestion: generateMutatesStateSuggestion(mutations, domMutations, dbWrites)
          });
        }
      }
    }
  }
  
  return {
    issues,
    stats: {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length
    }
  };
}

/**
 * Detect state setter calls
 */
function detectStateMutations(code) {
  const mutations = [];
  
  STATE_SETTERS.forEach(setter => {
    const pattern = new RegExp(`\\b${setter}\\s*\\(`, 'g');
    if (pattern.test(code)) {
      // Map setter to state variable
      const stateVar = setter.replace('set', '').replace(/^./, c => c.toLowerCase());
      mutations.push(`app.${stateVar} (via ${setter})`);
    }
  });
  
  return mutations;
}

/**
 * Detect DOM mutations
 */
function detectDOMMutations(code) {
  const mutations = [];
  
  // innerHTML, textContent, value assignments
  if (/\.innerHTML\s*=/.test(code)) mutations.push('DOM: element.innerHTML');
  if (/\.textContent\s*=/.test(code)) mutations.push('DOM: element.textContent');
  if (/\.value\s*=/.test(code)) mutations.push('DOM: input.value');
  
  // classList operations
  if (/\.classList\.(add|remove|toggle)/.test(code)) mutations.push('DOM: element.classList');
  
  // appendChild, removeChild
  if (/\.appendChild\(/.test(code)) mutations.push('DOM: appendChild');
  if (/\.removeChild\(/.test(code)) mutations.push('DOM: removeChild');
  if (/\.remove\(\)/.test(code)) mutations.push('DOM: element.remove()');
  
  // createElement
  if (/document\.createElement/.test(code)) mutations.push('DOM: createElement');
  
  return mutations;
}

/**
 * Detect database writes
 */
function detectDatabaseWrites(code) {
  const writes = [];
  
  // Firestore operations
  if (/addDoc\(/.test(code)) writes.push('Firestore: addDoc()');
  if (/setDoc\(/.test(code)) writes.push('Firestore: setDoc()');
  if (/updateDoc\(/.test(code)) writes.push('Firestore: updateDoc()');
  if (/deleteDoc\(/.test(code)) writes.push('Firestore: deleteDoc()');
  
  // localStorage
  if (/localStorage\.setItem/.test(code)) writes.push('localStorage.setItem');
  if (/sessionStorage\.setItem/.test(code)) writes.push('sessionStorage.setItem');
  
  return writes;
}

/**
 * Generate @mutates-state suggestion
 */
function generateMutatesStateSuggestion(stateMutations, domMutations, dbWrites) {
  const lines = [];
  lines.push('// @mutates-state');
  
  if (stateMutations.length > 0) {
    stateMutations.forEach(m => lines.push(`// - ${m}`));
  }
  
  if (domMutations.length > 0) {
    domMutations.slice(0, 5).forEach(m => lines.push(`// - ${m}`));
  }
  
  if (dbWrites.length > 0) {
    dbWrites.forEach(w => lines.push(`// - ${w}`));
  }
  
  return lines.join('\n');
}

/**
 * Generate a detailed report
 */
export function generateStateMutationsReport(issues) {
  if (issues.length === 0) {
    return 'All functions document their state mutations';
  }
  
  const lines = [];
  lines.push(`Found ${issues.length} functions with undocumented state mutations:\n`);
  
  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
    lines.push(`  ${file}:`);
    for (const issue of fileIssues.slice(0, 3)) {
      lines.push(`    Line ${issue.line}: ${issue.function}()`);
      
      const { state, dom, database } = issue.detectedMutations;
      const total = state.length + dom.length + database.length;
      
      lines.push(`      Mutates ${total} things:`);
      if (state.length > 0) lines.push(`        State: ${state.slice(0, 3).join(', ')}${state.length > 3 ? '...' : ''}`);
      if (dom.length > 0) lines.push(`        DOM: ${dom.slice(0, 3).join(', ')}${dom.length > 3 ? '...' : ''}`);
      if (database.length > 0) lines.push(`        Database: ${database.join(', ')}`);
      
      lines.push(`      Add:\n${issue.suggestion.split('\n').map(l => '        ' + l).join('\n')}`);
    }
    if (fileIssues.length > 3) {
      lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
    }
  }
  
  if (Object.keys(byFile).length > 5) {
    lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-mutations`);
  
  return lines.join('\n');
}

export default { checkStateMutations, generateStateMutationsReport };

