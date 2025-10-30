// Annotation Enforcement: @requires-functions and @requires-globals
// Detects functions with dependencies that lack documentation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if functions document their dependencies
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkDependencies(files, config = {}) {
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
        
        // Detect function calls
        const functionCalls = detectFunctionCalls(funcBody);
        
        // Detect global usage
        const globalUsage = detectGlobalUsage(funcBody);
        
        // Check if function has @requires-functions or @requires-globals annotations
        let hasRequiresFunctions = false;
        let hasRequiresGlobals = false;
        
        for (let j = Math.max(0, i - 15); j < i; j++) {
          if (lines[j].includes('@requires-functions')) hasRequiresFunctions = true;
          if (lines[j].includes('@requires-globals')) hasRequiresGlobals = true;
        }
        
        // Rule: Functions calling 5+ other functions should document them
        if (functionCalls.length >= 5 && !hasRequiresFunctions) {
          const severity = config.dependencySeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-requires-functions',
            severity,
            message: `Function '${functionName}' calls ${functionCalls.length} functions but lacks @requires-functions annotation`,
            detectedCalls: functionCalls.slice(0, 10), // Top 10
            suggestion: generateRequiresFunctionsSuggestion(functionCalls, content)
          });
        }
        
        // Rule: Functions using 3+ globals should document them
        if (globalUsage.length >= 3 && !hasRequiresGlobals) {
          const severity = config.dependencySeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-requires-globals',
            severity,
            message: `Function '${functionName}' uses ${globalUsage.length} globals but lacks @requires-globals annotation`,
            detectedGlobals: globalUsage.slice(0, 10),
            suggestion: generateRequiresGlobalsSuggestion(globalUsage)
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
      missingRequiresFunctions: issues.filter(i => i.type === 'missing-requires-functions').length,
      missingRequiresGlobals: issues.filter(i => i.type === 'missing-requires-globals').length
    }
  };
}

/**
 * Detect function calls in code
 */
function detectFunctionCalls(code) {
  const calls = [];
  // Match function calls: functionName() or object.method()
  const callPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let match;
  
  const seen = new Set();
  while ((match = callPattern.exec(code)) !== null) {
    const funcName = match[1];
    // Skip common keywords and built-ins
    if (!['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new'].includes(funcName)) {
      if (!seen.has(funcName)) {
        seen.add(funcName);
        calls.push(funcName);
      }
    }
  }
  
  return calls;
}

/**
 * Detect global object usage
 */
function detectGlobalUsage(code) {
  const globals = new Set();
  
  // Common globals
  const patterns = [
    /\bwindow\./g,
    /\bdocument\./g,
    /\blocalStorage\./g,
    /\bsessionStorage\./g,
    /\bconsole\./g,
    /\bnavigator\./g,
    /\bsetTimeout\(/g,
    /\bsetInterval\(/g,
    /\bfetch\(/g
  ];
  
  patterns.forEach(pattern => {
    if (pattern.test(code)) {
      const globalName = pattern.source.replace(/\\b|\\/g, '').replace(/\(/g, '').replace(/\./g, '');
      globals.add(globalName);
    }
  });
  
  return Array.from(globals);
}

/**
 * Generate @requires-functions suggestion
 */
function generateRequiresFunctionsSuggestion(calls, fileContent) {
  const lines = [];
  lines.push('// @requires-functions');
  
  // Try to detect import sources for top calls
  calls.slice(0, 10).forEach(call => {
    // Look for import statement
    const importMatch = fileContent.match(new RegExp(`import.*${call}.*from\\s+['"]([^'"]+)['"]`));
    if (importMatch) {
      lines.push(`// - ${call}() from '${importMatch[1]}'`);
    } else {
      lines.push(`// - ${call}()`);
    }
  });
  
  if (calls.length > 10) {
    lines.push(`// ... and ${calls.length - 10} more`);
  }
  
  return lines.join('\n');
}

/**
 * Generate @requires-globals suggestion
 */
function generateRequiresGlobalsSuggestion(globals) {
  const lines = [];
  lines.push('// @requires-globals');
  
  globals.forEach(global => {
    lines.push(`// - ${global}`);
  });
  
  return lines.join('\n');
}

/**
 * Generate a detailed report
 */
export function generateDependenciesReport(issues) {
  if (issues.length === 0) {
    return 'All functions document their dependencies';
  }
  
  const lines = [];
  lines.push(`Found ${issues.length} functions with undocumented dependencies:\n`);
  
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
      
      if (issue.type === 'missing-requires-functions') {
        lines.push(`      Calls ${issue.detectedCalls.length} functions: ${issue.detectedCalls.slice(0, 5).join(', ')}${issue.detectedCalls.length > 5 ? '...' : ''}`);
        lines.push(`      Add:\n${issue.suggestion.split('\n').map(l => '        ' + l).join('\n')}`);
      } else {
        lines.push(`      Uses globals: ${issue.detectedGlobals.join(', ')}`);
        lines.push(`      Add:\n${issue.suggestion.split('\n').map(l => '        ' + l).join('\n')}`);
      }
    }
    if (fileIssues.length > 3) {
      lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
    }
  }
  
  if (Object.keys(byFile).length > 5) {
    lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-dependencies`);
  
  return lines.join('\n');
}

export default { checkDependencies, generateDependenciesReport };

