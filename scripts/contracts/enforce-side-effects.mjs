// Annotation Enforcement: @side-effects and @pure
// Detects functions with side effects that lack documentation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if functions document their side effects
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkSideEffects(files, config = {}) {
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
        
        // Detect side effects
        const sideEffects = detectSideEffects(funcBody);
        
        // Check if function has @side-effects or @pure annotation
        let hasSideEffectsAnnotation = false;
        let hasPureAnnotation = false;
        
        for (let j = Math.max(0, i - 15); j < i; j++) {
          if (lines[j].includes('@side-effects')) hasSideEffectsAnnotation = true;
          if (lines[j].includes('@pure')) hasPureAnnotation = true;
        }
        
        // Rule: Functions with 2+ side effects should document them
        if (sideEffects.length >= 2 && !hasSideEffectsAnnotation && !hasPureAnnotation) {
          const severity = config.sideEffectsSeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-side-effects',
            severity,
            message: `Function '${functionName}' has ${sideEffects.length} side effects but lacks @side-effects annotation`,
            detectedSideEffects: sideEffects,
            suggestion: generateSideEffectsSuggestion(sideEffects)
          });
        }
        
        // Rule: Pure functions should be marked @pure
        if (sideEffects.length === 0 && funcBody.length > 100 && !hasPureAnnotation && !hasSideEffectsAnnotation) {
          // Only flag functions > 100 chars as potentially pure (avoid false positives on trivial functions)
          const severity = 'info';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'potentially-pure',
            severity,
            message: `Function '${functionName}' appears pure but lacks @pure annotation`,
            suggestion: '// @pure\n// @side-effects none'
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
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      missingSideEffects: issues.filter(i => i.type === 'missing-side-effects').length,
      potentiallyPure: issues.filter(i => i.type === 'potentially-pure').length
    }
  };
}

/**
 * Detect side effects in code
 */
function detectSideEffects(code) {
  const effects = [];
  
  // Network I/O
  if (/\bfetch\(/.test(code)) effects.push('Network: fetch() call');
  if (/\.post\(|\.get\(|\.put\(|\.delete\(/.test(code)) effects.push('Network: HTTP request');
  
  // File/Storage I/O
  if (/localStorage\.setItem/.test(code)) effects.push('Storage: localStorage write');
  if (/sessionStorage\.setItem/.test(code)) effects.push('Storage: sessionStorage write');
  
  // Database I/O
  if (/addDoc\(/.test(code)) effects.push('Database: Firestore addDoc()');
  if (/setDoc\(/.test(code)) effects.push('Database: Firestore setDoc()');
  if (/updateDoc\(/.test(code)) effects.push('Database: Firestore updateDoc()');
  if (/deleteDoc\(/.test(code)) effects.push('Database: Firestore deleteDoc()');
  
  // DOM Manipulation
  if (/\.innerHTML\s*=/.test(code)) effects.push('DOM: Modifies innerHTML');
  if (/\.appendChild\(/.test(code)) effects.push('DOM: Appends elements');
  if (/\.removeChild\(/.test(code)) effects.push('DOM: Removes elements');
  if (/\.remove\(\)/.test(code)) effects.push('DOM: Removes elements');
  if (/\.classList\.(add|remove|toggle)/.test(code)) effects.push('DOM: Modifies classes');
  if (/document\.createElement/.test(code)) effects.push('DOM: Creates elements');
  
  // Timers
  if (/setTimeout\(/.test(code)) effects.push('Timer: setTimeout()');
  if (/setInterval\(/.test(code)) effects.push('Timer: setInterval()');
  
  // Console/Logging
  if (/console\.(log|warn|error|info)/.test(code)) effects.push('Console: Logging');
  
  // Event Listeners
  if (/\.addEventListener\(/.test(code)) effects.push('Events: Adds event listener');
  if (/\.removeEventListener\(/.test(code)) effects.push('Events: Removes event listener');
  
  // Global state mutations (window, document properties)
  if (/window\.\w+\s*=/.test(code)) effects.push('Global: Mutates window property');
  if (/document\.\w+\s*=/.test(code)) effects.push('Global: Mutates document property');
  
  // Audio/Media
  if (/new Audio\(/.test(code)) effects.push('Media: Creates Audio element');
  if (/\.play\(\)/.test(code)) effects.push('Media: Plays audio/video');
  if (/\.pause\(\)/.test(code)) effects.push('Media: Pauses audio/video');
  
  return effects;
}

/**
 * Generate @side-effects suggestion
 */
function generateSideEffectsSuggestion(effects) {
  const lines = [];
  lines.push('// @side-effects');
  
  // Group by category
  const byCategory = {};
  effects.forEach(effect => {
    const category = effect.split(':')[0];
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(effect);
  });
  
  // Output grouped
  Object.entries(byCategory).forEach(([category, items]) => {
    items.slice(0, 5).forEach(item => {
      lines.push(`// - ${item}`);
    });
    if (items.length > 5) {
      lines.push(`// ... and ${items.length - 5} more ${category} effects`);
    }
  });
  
  lines.push('// @pure false');
  
  return lines.join('\n');
}

/**
 * Generate a detailed report
 */
export function generateSideEffectsReport(issues) {
  if (issues.length === 0) {
    return 'All functions document their side effects';
  }
  
  const lines = [];
  
  const missingSideEffects = issues.filter(i => i.type === 'missing-side-effects');
  const potentiallyPure = issues.filter(i => i.type === 'potentially-pure');
  
  if (missingSideEffects.length > 0) {
    lines.push(`Found ${missingSideEffects.length} functions with undocumented side effects:\n`);
    
    // Group by file
    const byFile = {};
    for (const issue of missingSideEffects) {
      if (!byFile[issue.file]) byFile[issue.file] = [];
      byFile[issue.file].push(issue);
    }
    
    for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
      lines.push(`  ${file}:`);
      for (const issue of fileIssues.slice(0, 3)) {
        lines.push(`    Line ${issue.line}: ${issue.function}()`);
        lines.push(`      Has ${issue.detectedSideEffects.length} side effects:`);
        issue.detectedSideEffects.slice(0, 5).forEach(effect => {
          lines.push(`        - ${effect}`);
        });
        if (issue.detectedSideEffects.length > 5) {
          lines.push(`        ... and ${issue.detectedSideEffects.length - 5} more`);
        }
        lines.push(`      Add:\n${issue.suggestion.split('\n').map(l => '        ' + l).join('\n')}`);
      }
      if (fileIssues.length > 3) {
        lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
      }
    }
    
    if (Object.keys(byFile).length > 5) {
      lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
    }
  }
  
  if (potentiallyPure.length > 0) {
    lines.push(`\n  ℹ️  ${potentiallyPure.length} functions appear to be pure (consider marking with @pure)`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-side-effects`);
  
  return lines.join('\n');
}

export default { checkSideEffects, generateSideEffectsReport };

