// Annotation Enforcement: Nullability Contracts
// Detects function parameters that can be null/undefined but lack nullability markers

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findAndParseAnnotations } from './comment-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if function parameters have nullability annotations
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkNullability(files, config = {}) {
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
    
    // Find all functions with parameters
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Match function declarations with parameters
      const funcMatch = line.match(/(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]+)\)/);
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
      const exportMatch = line.match(/export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]+)\)/);
      
      let functionName, params;
      
      if (funcMatch) {
        functionName = funcMatch[1];
        params = funcMatch[2];
      } else if (arrowMatch) {
        functionName = arrowMatch[1];
        params = arrowMatch[2];
      } else if (exportMatch) {
        functionName = exportMatch[1];
        params = exportMatch[2];
      }
      
      if (functionName && params) {
        // Parse parameters
        const paramList = params.split(',').map(p => {
          // Extract parameter name (before = for default values)
          let name = p.trim().split('=')[0].trim();
          // Strip destructuring braces and whitespace
          name = name.replace(/[{}]/g, '').trim();
          // Check if it has a default value
          const hasDefault = p.includes('=');
          return { name, hasDefault };
        });
        
        // Find function body to check for null checks
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
        
        // Check each parameter
        for (const param of paramList) {
          // Check if there's a null/undefined check for this param
          const hasNullCheck = 
            funcBody.includes(`if (!${param.name})`) ||
            funcBody.includes(`if (${param.name} === null`) ||
            funcBody.includes(`if (${param.name} === undefined`) ||
            funcBody.includes(`if (${param.name} == null`) ||
            funcBody.includes(`${param.name} || `) ||
            funcBody.includes(`${param.name} ?? `);
          
          const isOptional = param.hasDefault || hasNullCheck;
          
          // Use smart comment parser to check for nullability annotation
          const parsed = findAndParseAnnotations(lines, i);
          const fullContent = parsed.annotations.fullContent;
          
          let hasNullabilityAnnotation = false;
          
          // Check if there's a @param annotation for this parameter with nullability markers
          if (fullContent.includes(`@param`) && fullContent.includes(param.name)) {
            // Look for nullability markers in the param annotation
            const paramRegex = new RegExp(`@param[^\\n]*${param.name}[^\\n]*`, 'g');
            const paramMatches = fullContent.match(paramRegex) || [];
            
            for (const paramLine of paramMatches) {
              if (
                paramLine.includes('?}') ||
                paramLine.includes('OPTIONAL') ||
                paramLine.includes('REQUIRED') ||
                paramLine.includes('nullable') ||
                paramLine.includes('can be null')
              ) {
                hasNullabilityAnnotation = true;
                break;
              }
            }
          }
          
          if (!hasNullabilityAnnotation && isOptional) {
            const severity = config.nullabilitySeverity === 'error' ? 'error' : 'warning';
            
            issues.push({
              file,
              line: lineNum,
              function: functionName,
              parameter: param.name,
              type: 'missing-nullability',
              severity,
              message: `Parameter '${param.name}' in '${functionName}' appears optional but lacks nullability annotation`,
              suggestion: `Add: // @param {type?} ${param.name} - OPTIONAL, can be null/undefined`
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
 * Generate a report of nullability issues
 * @param {object[]} issues - Array of issues
 * @returns {string} Formatted report
 */
export function generateNullabilityReport(issues) {
  if (issues.length === 0) {
    return 'All optional parameters have nullability annotations';
  }
  
  const lines = [];
  lines.push(`Found ${issues.length} parameters missing nullability annotations:\n`);
  
  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
    lines.push(`  ${file}:`);
    for (const issue of fileIssues.slice(0, 3)) {
      lines.push(`    Line ${issue.line}: ${issue.function}(${issue.parameter})`);
      lines.push(`      ${issue.suggestion}`);
    }
    if (fileIssues.length > 3) {
      lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
    }
  }
  
  if (Object.keys(byFile).length > 5) {
    lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-nullability`);
  
  return lines.join('\n');
}

export default { checkNullability, generateNullabilityReport };

