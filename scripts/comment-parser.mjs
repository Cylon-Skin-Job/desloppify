// Comment Block Parser Utility
// Intelligently extracts and validates comment blocks above functions

/**
 * Canonical order for annotations (top to bottom)
 * Edit this array to reorder annotations project-wide
 */
export const ANNOTATION_ORDER = [
  // JSDoc block (if present)
  '/**',
  '@param',
  '@returns',
  '@throws',
  '@async-boundary',
  '@requires await',
  '*/',
  
  // Compact annotations (Phase 2)
  '@requires-data',
  '@expects',
  '@auto-generated',
  '@requires-functions',
  '@requires-globals',
  '@side-effects',
  '@mutates-state',
  '@pure',
];

/**
 * Detect comment type for a line
 * @param {string} line - Line to check
 * @returns {'compact'|'jsdoc'|null}
 */
export function detectCommentType(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return 'compact';
  if (trimmed.startsWith('/**') || trimmed.startsWith('*')) return 'jsdoc';
  return null;
}

/**
 * Extract complete comment block from a starting line
 * @param {string[]} lines - All lines in file
 * @param {number} foundLine - Line where annotation was found
 * @returns {Object} Comment block info
 */
export function extractCommentBlock(lines, foundLine) {
  const type = detectCommentType(lines[foundLine]);
  
  if (type === 'compact') {
    // Trace upward: find first line that's part of comment
    let start = foundLine;
    while (start > 0) {
      const prevLine = lines[start - 1].trim();
      if (prevLine.startsWith('//')) {
        start--;
      } else if (prevLine === '') {
        // Check if there's another comment above the gap
        // For now, stop at gaps
        break;
      } else {
        break;
      }
    }
    
    // Trace downward: find last line that's part of comment
    let end = foundLine;
    while (end < lines.length - 1) {
      const nextLine = lines[end + 1].trim();
      if (nextLine.startsWith('//')) {
        end++;
      } else {
        break;
      }
    }
    
    return {
      type: 'compact',
      startLine: start,
      endLine: end,
      lines: lines.slice(start, end + 1),
      content: lines.slice(start, end + 1).join('\n')
    };
  }
  
  if (type === 'jsdoc') {
    // Trace upward: find /**
    let start = foundLine;
    while (start > 0 && !lines[start].trim().startsWith('/**')) {
      start--;
    }
    
    // Trace downward: find */
    let end = foundLine;
    while (end < lines.length - 1 && !lines[end].includes('*/')) {
      end++;
    }
    
    return {
      type: 'jsdoc',
      startLine: start,
      endLine: end,
      lines: lines.slice(start, end + 1),
      content: lines.slice(start, end + 1).join('\n')
    };
  }
  
  return null;
}

/**
 * Find all comment blocks above a function
 * Handles mixed JSDoc + compact format
 * @param {string[]} lines - All lines in file
 * @param {number} functionLine - Line where function declaration starts
 * @returns {Array} Array of comment blocks
 */
export function findCommentBlocksAboveFunction(lines, functionLine) {
  const blocks = [];
  let currentLine = functionLine - 1;
  
  // Walk backward from function, collecting comment blocks
  while (currentLine >= 0) {
    const line = lines[currentLine].trim();
    
    // Skip blank lines (but track them)
    if (line === '') {
      currentLine--;
      continue;
    }
    
    // Check if this is a comment line
    const commentType = detectCommentType(lines[currentLine]);
    if (commentType) {
      // Extract the full block
      const block = extractCommentBlock(lines, currentLine);
      blocks.unshift(block); // Add to front (maintain order)
      currentLine = block.startLine - 1; // Jump above this block
    } else {
      // Hit non-comment, non-blank line - stop
      break;
    }
  }
  
  return blocks;
}

/**
 * Validate comment block structure
 * @param {Array} blocks - Comment blocks
 * @param {number} functionLine - Function line number
 * @returns {Object} Validation result
 */
export function validateCommentStructure(blocks, functionLine) {
  if (blocks.length === 0) {
    return {
      valid: false,
      reason: 'No comment blocks found above function'
    };
  }
  
  // Check: Last block must end exactly 1 line before function
  const lastBlock = blocks[blocks.length - 1];
  const gapLines = functionLine - lastBlock.endLine - 1;
  
  if (gapLines > 0) {
    return {
      valid: false,
      reason: `${gapLines} blank line(s) between comment and function`,
      gapLines,
      commentEndLine: lastBlock.endLine,
      functionLine
    };
  }
  
  // Check: No internal gaps within blocks
  for (const block of blocks) {
    const hasInternalGap = block.lines.some(line => line.trim() === '');
    if (hasInternalGap) {
      return {
        valid: false,
        reason: `Blank line within comment block (lines ${block.startLine}-${block.endLine})`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Parse annotations from comment blocks
 * @param {Array} blocks - Comment blocks
 * @returns {Object} Parsed annotations
 */
export function parseAnnotations(blocks) {
  // Combine all blocks into one content string
  const content = blocks.map(b => b.content).join('\n');
  
  return {
    // Core annotations
    hasReturns: /@returns/.test(content),
    returnsMatch: content.match(/@returns\s+\{([^}]+)\}/),
    
    hasThrows: /@throws/.test(content),
    
    hasAsyncBoundary: /@async-boundary/.test(content) || /@requires-await/.test(content) || /@requires await/.test(content),
    
    // Param annotations
    paramAnnotations: content.match(/@param[^\n]*/g) || [],
    nullableParams: content.match(/@param\s+\{[^}]*\?[^}]*\}[^\n]*/g) || [],
    
    // Phase 2 annotations
    hasRequiresFunctions: /@requires-functions/.test(content),
    hasRequiresGlobals: /@requires-globals/.test(content),
    hasSideEffects: /@side-effects/.test(content),
    hasMutatesState: /@mutates-state/.test(content),
    hasPure: /@pure/.test(content),
    
    // Full content for detailed parsing
    fullContent: content,
    blocks
  };
}

/**
 * Main utility: Find and parse all annotations for a function
 * @param {string[]} lines - All lines in file
 * @param {number} functionLine - Function declaration line
 * @returns {Object} Parsed result with validation
 */
export function findAndParseAnnotations(lines, functionLine) {
  const blocks = findCommentBlocksAboveFunction(lines, functionLine);
  const structureValidation = validateCommentStructure(blocks, functionLine);
  const annotations = parseAnnotations(blocks);
  
  return {
    blocks,
    structureValidation,
    annotations,
    hasAnnotations: blocks.length > 0
  };
}

