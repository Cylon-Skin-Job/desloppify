// Annotation Enforcement: @returns
// Detects functions missing return type annotations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findAndParseAnnotations } from './comment-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if functions have @returns annotations
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkReturnTypes(files, config = {}) {
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
      
      // Match function declarations (function name(...) and async function name(...))
      const funcMatch = line.match(/(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      // Match arrow functions assigned to variables (const name = (...) =>)
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
      // Match export function declarations
      const exportMatch = line.match(/export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      
      const functionName = funcMatch?.[1] || arrowMatch?.[1] || exportMatch?.[1];
      
      if (functionName) {
        // Use smart comment parser to find and validate annotations
        const parsed = findAndParseAnnotations(lines, i);
        const hasReturnsAnnotation = parsed.annotations.hasReturns;
        
        // Check if function actually returns something
        const funcBody = content.slice(
          content.indexOf(line),
          content.indexOf('\n}', content.indexOf(line))
        );
        const hasReturnStatement = /return[\s;]/.test(funcBody);
        
        // Skip functions that don't return anything (void functions)
        const isVoidFunction = !hasReturnStatement && !line.includes('async');
        
        if (!hasReturnsAnnotation && !isVoidFunction) {
          const isAsync = line.includes('async');
          const severity = config.returnTypeSeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-returns',
            severity,
            message: `Function '${functionName}' missing @returns annotation`,
            suggestion: isAsync 
              ? `Add: // @returns {Promise<...>}` 
              : `Add: // @returns {...}`
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
 * Generate a report of return type issues
 * @param {object[]} issues - Array of issues
 * @returns {string} Formatted report
 */
export function generateReturnTypesReport(issues) {
  if (issues.length === 0) {
    return 'All functions have @returns annotations';
  }
  
  const lines = [];
  lines.push(`Found ${issues.length} functions missing @returns annotations:\n`);
  
  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
    lines.push(`  ${file}:`);
    for (const issue of fileIssues.slice(0, 3)) {
      lines.push(`    Line ${issue.line}: ${issue.function}() - ${issue.suggestion}`);
    }
    if (fileIssues.length > 3) {
      lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
    }
  }
  
  if (Object.keys(byFile).length > 5) {
    lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-returns`);
  
  return lines.join('\n');
}

export default { checkReturnTypes, generateReturnTypesReport };

