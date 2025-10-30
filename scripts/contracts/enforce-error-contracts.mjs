// Annotation Enforcement: @throws
// Detects functions that throw errors but lack @throws annotations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if functions that throw errors have @throws annotations
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkErrorContracts(files, config = {}) {
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
    
    // Find all functions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Match function declarations
      const funcMatch = line.match(/(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
      const exportMatch = line.match(/export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      
      const functionName = funcMatch?.[1] || arrowMatch?.[1] || exportMatch?.[1];
      
      if (functionName) {
        // Find function body (scan forward until we hit the closing brace at same indent level)
        let funcBody = '';
        let braceCount = 0;
        let started = false;
        
        for (let j = i; j < Math.min(i + 200, lines.length); j++) {
          const bodyLine = lines[j];
          
          if (bodyLine.includes('{')) {
            braceCount += (bodyLine.match(/\{/g) || []).length;
            started = true;
          }
          if (bodyLine.includes('}')) {
            braceCount -= (bodyLine.match(/\}/g) || []).length;
          }
          
          funcBody += bodyLine + '\n';
          
          if (started && braceCount === 0) break;
        }
        
        // Check if function throws errors
        const throwMatches = funcBody.match(/throw\s+new\s+(\w+Error)/g);
        
        if (throwMatches && throwMatches.length > 0) {
          // Check if previous lines have @throws annotation
          let hasThrowsAnnotation = false;
          
          // Look back up to 10 lines for JSDoc comment
          for (let j = Math.max(0, i - 10); j < i; j++) {
            if (lines[j].includes('@throws')) {
              hasThrowsAnnotation = true;
              break;
            }
          }
          
          if (!hasThrowsAnnotation) {
            const errorTypes = [...new Set(throwMatches.map(m => m.match(/new\s+(\w+Error)/)[1]))];
            const severity = config.errorContractSeverity === 'error' ? 'error' : 'warning';
            
            issues.push({
              file,
              line: lineNum,
              function: functionName,
              type: 'missing-throws',
              severity,
              errorTypes,
              message: `Function '${functionName}' throws ${errorTypes.join(', ')} but missing @throws annotation`,
              suggestion: `Add: ${errorTypes.map(e => `// @throws {${e}}`).join('\n// ')}`
            });
          }
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
 * Generate a report of error contract issues
 * @param {object[]} issues - Array of issues
 * @returns {string} Formatted report
 */
export function generateErrorContractsReport(issues) {
  if (issues.length === 0) {
    return 'All functions that throw errors have @throws annotations';
  }
  
  const lines = [];
  lines.push(`Found ${issues.length} functions missing @throws annotations:\n`);
  
  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
    lines.push(`  ${file}:`);
    for (const issue of fileIssues.slice(0, 3)) {
      lines.push(`    Line ${issue.line}: ${issue.function}() throws ${issue.errorTypes.join(', ')}`);
      lines.push(`      ${issue.suggestion.replace('\n// ', ', ')}`);
    }
    if (fileIssues.length > 3) {
      lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
    }
  }
  
  if (Object.keys(byFile).length > 5) {
    lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-throws`);
  
  return lines.join('\n');
}

export default { checkErrorContracts, generateErrorContractsReport };

