# Validator Design: Building Intelligence Into Tools

**Last Updated:** 2025-10-30  
**Purpose:** Patterns for creating context-aware, intelligent validators

---

## 🎯 Philosophy

**"The validator should be smarter than the code it validates."**

Bad validators:
- Check line-by-line with arbitrary limits
- Flag false positives constantly
- Require special markers (`@ignore`, `@extend`)
- Make developers fight the tool

Good validators:
- Understand code structure and context
- Only flag real issues
- Provide actionable feedback
- Make doing the right thing easy

---

## 🏗️ Architecture Layers

### Layer 1: Detection (Find Patterns)

**Goal:** Find relevant code patterns efficiently

**Naive Approach:**
```javascript
// ❌ Check every line
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function')) {
    validate(lines[i]);
  }
}
```

**Intelligent Approach:**
```javascript
// ✅ Use regex to find functions, capture metadata
const functionRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/gm;
let match;
while ((match = functionRegex.exec(code)) !== null) {
  const { name, lineNumber } = extractMetadata(match);
  validate(name, lineNumber, code);
}
```

**Principles:**
- Use regex/AST for pattern detection
- Capture metadata (line numbers, names, types)
- Skip irrelevant code (comments, strings)
- Process matches, not all lines

---

### Layer 2: Context Extraction (Get Full Picture)

**Goal:** Extract complete logical units, not fragments

**Naive Approach:**
```javascript
// ❌ Fixed lookback distance
const context = lines.slice(i - 10, i);
```

**Intelligent Approach:**
```javascript
// ✅ Trace boundaries dynamically
function extractContext(lines, targetLine) {
  let start = targetLine;
  let end = targetLine;
  
  // Walk backward until hitting context boundary
  while (start > 0 && isPartOfContext(lines[start - 1])) {
    start--;
  }
  
  // Walk forward until hitting context boundary
  while (end < lines.length && isPartOfContext(lines[end + 1])) {
    end++;
  }
  
  return {
    lines: lines.slice(start, end + 1),
    startLine: start,
    endLine: end
  };
}
```

**Principles:**
- No arbitrary limits (10 lines, 30 lines)
- Understand logical boundaries (blocks, comments, functions)
- Extract complete units (full function, full comment block)
- Preserve metadata (line numbers, indentation)

---

### Layer 3: Validation (Check Rules)

**Goal:** Validate content AND structure intelligently

**Naive Approach:**
```javascript
// ❌ Only check existence
if (!code.includes('@returns')) {
  errors.push('Missing @returns');
}
```

**Intelligent Approach:**
```javascript
// ✅ Validate existence, location, and structure
function validate(context) {
  const results = {
    content: validateContent(context),
    structure: validateStructure(context),
    location: validateLocation(context)
  };
  
  return results;
}

function validateContent(context) {
  // WHAT: Does required content exist?
  if (!context.hasAnnotation('@returns')) {
    return { valid: false, reason: '@returns annotation missing' };
  }
  return { valid: true };
}

function validateStructure(context) {
  // HOW: Is content structured correctly?
  const gap = context.functionLine - context.commentEndLine - 1;
  if (gap > 0) {
    return {
      valid: false,
      reason: `${gap} blank line(s) between comment and function`,
      fix: `Remove line ${context.commentEndLine + 1}`
    };
  }
  return { valid: true };
}

function validateLocation(context) {
  // WHERE: Is content in the right place?
  if (!isAdjacentToFunction(context)) {
    return {
      valid: false,
      reason: 'Comment not adjacent to function'
    };
  }
  return { valid: true };
}
```

**Principles:**
- Validate WHAT (content exists)
- Validate WHERE (location is correct)
- Validate HOW (structure is proper)
- Provide actionable feedback
- Suggest fixes when possible

---

## 🧠 The Exemption System

**Goal:** Smart filtering, not blind flagging

### When to Exempt

**Exempt these patterns:**
- Framework/library code (Express, React, Winston)
- Generated code (Prisma, GraphQL, Protobuf)
- Node.js built-ins (console, fs, path)
- Standard patterns (middleware, decorators)
- CDN scripts (morphdom, marked)

**Don't exempt:**
- Your application code
- Custom utilities
- Business logic
- Integration code

### Exemption Template

```javascript
const EXEMPTIONS = {
  // Pattern to match
  pattern: {
    // Why is this exempt?
    reason: 'Clear explanation of why this pattern is safe',
    
    // What category?
    source: 'library|framework|core|generated|cdn',
    
    // Where can I learn more?
    reference: 'https://github.com/org/repo or docs link',
    
    // When was this added?
    added: '2025-10-30',
    
    // Who added it?
    author: 'RC'
  }
};

function isExempt(code, file) {
  for (const [pattern, metadata] of Object.entries(EXEMPTIONS)) {
    if (matches(code, file, pattern)) {
      return {
        exempt: true,
        reason: metadata.reason,
        source: metadata.source
      };
    }
  }
  return { exempt: false };
}
```

### Example: Winston Logger

```javascript
const EXEMPTIONS = {
  'logger.log': {
    reason: 'Winston standard logging API - well-documented, industry standard',
    source: 'library',
    reference: 'https://github.com/winstonjs/winston',
    added: '2025-10-15',
    author: 'RC'
  },
  'logger.error': {
    reason: 'Winston standard logging API',
    source: 'library',
    reference: 'https://github.com/winstonjs/winston',
    added: '2025-10-15',
    author: 'RC'
  }
};
```

**Benefits:**
- ✅ Zero false positives from library code
- ✅ Reasoning is documented
- ✅ Easy to audit exemptions
- ✅ Team understands WHY
- ✅ Can review/remove old exemptions

---

## 📊 Whitelist System (Advanced)

**Goal:** Track drift in exemptions and validation skips

### Why Whitelisting?

Sometimes validation SHOULD fail, but we want to defer fixing it:
- Legacy code that works but doesn't meet standards
- Technical debt we're aware of
- Planned refactors
- Known issues we're monitoring

**Don't silently skip validation. Track it.**

### Whitelist Pattern

```javascript
// whitelist.json
{
  "validator-name": {
    "file-path": {
      "reason": "Why is this whitelisted?",
      "added": "2025-10-30",
      "issue": "https://github.com/org/repo/issues/123",
      "planned-fix": "Q2 2026"
    }
  }
}

// In validator
function validate(file) {
  const result = runValidation(file);
  
  if (!result.valid) {
    const whitelist = loadWhitelist('validator-name');
    
    if (whitelist[file]) {
      console.warn(`⚠️  ${file} is whitelisted: ${whitelist[file].reason}`);
      return { valid: true, whitelisted: true };
    }
    
    return result; // Fail validation
  }
  
  return result;
}
```

**Benefits:**
- ✅ Known issues are tracked
- ✅ Can measure technical debt
- ✅ Team sees warnings, not silent skips
- ✅ Can audit and clean up old whitelist entries
- ✅ Prevents new violations

---

## 🎯 Single Source of Truth Pattern

**Goal:** Configuration as data, not code

### The Problem

```javascript
// ❌ Hardcoded priorities in multiple places
// In validator A:
if (tag === '@returns') priority = 1;
else if (tag === '@throws') priority = 2;
else if (tag === '@param') priority = 3;

// In validator B:
const order = ['@returns', '@throws', '@param'];

// In docs:
"Annotation order: @returns, @throws, @param"
```

**Issues:**
- Three sources of truth
- Easy to get out of sync
- Hard to change order
- No single reference

### The Solution

```javascript
// config/annotation-order.js
export const ANNOTATION_ORDER = [
  '@returns',
  '@throws',
  '@param',
  '@async-boundary',
  '@requires-functions',
  '@side-effects'
];

// In validator A:
import { ANNOTATION_ORDER } from './config/annotation-order.js';
const priority = ANNOTATION_ORDER.indexOf(tag);

// In validator B:
import { ANNOTATION_ORDER } from './config/annotation-order.js';
ANNOTATION_ORDER.forEach(tag => validate(tag));

// In docs generator:
import { ANNOTATION_ORDER } from './config/annotation-order.js';
const list = ANNOTATION_ORDER.map(formatDoc).join('\n');
```

**Benefits:**
- ✅ One array to rule them all
- ✅ Change once, propagates everywhere
- ✅ Zero drift possible
- ✅ Self-documenting
- ✅ Easy to test

### When to Apply

Use single source arrays for:
- Validation order / priority
- Build pipeline stages
- Middleware execution order
- Feature flag priorities
- CSS property ordering
- Import statement ordering
- ANY repeated ordering logic

---

## 🚀 Progressive Validation (Phased Rollout)

**Goal:** Ship incrementally, provide immediate value

### Phase Structure

**Phase 1: Critical Safety**
- **Rules:** Must work or system breaks
- **Severity:** error (fails build)
- **Coverage:** Core paths only
- **Timeline:** Ship Week 1

**Phase 2: Enhanced Quality**
- **Rules:** Should work for best practices
- **Severity:** warning (logs but doesn't fail)
- **Coverage:** Common paths
- **Timeline:** Ship Week 4

**Phase 3: Polish**
- **Rules:** Could work for perfectionism
- **Severity:** info (logs if verbose mode)
- **Coverage:** Edge cases
- **Timeline:** Ship when ready

### Example: Annotation Validator Phases

```javascript
const VALIDATION_PHASES = {
  critical: {
    annotations: ['@returns', '@throws', '@param', '@async-boundary'],
    severity: 'error',
    description: 'Core safety annotations',
    deadline: 'Week 1'
  },
  enhanced: {
    annotations: ['@requires-functions', '@side-effects', '@mutates-state'],
    severity: 'warning',
    description: 'Context-aware annotations',
    deadline: 'Week 4'
  },
  future: {
    annotations: ['@performance', '@security', '@cache'],
    severity: 'info',
    description: 'Advanced metadata',
    deadline: 'TBD'
  }
};

function validate(code, phase = 'critical') {
  const config = VALIDATION_PHASES[phase];
  const results = runValidation(code, config.annotations);
  
  return {
    ...results,
    severity: config.severity
  };
}
```

**Benefits:**
- ✅ Ship critical features fast
- ✅ Don't block on polish
- ✅ Clear milestones
- ✅ Each phase validates independently
- ✅ Team sees progress

---

## 💡 Validator Design Checklist

### Before Building

- [ ] What pattern am I validating?
- [ ] Can I use existing tools (ESLint, Prettier)?
- [ ] Is this a one-off or reusable?
- [ ] What should be exempt?
- [ ] How will I test this?

### During Building

- [ ] Am I using context-aware parsing?
- [ ] Am I checking structure AND content?
- [ ] Do I have exemptions for libraries/frameworks?
- [ ] Am I using single source arrays?
- [ ] Can I provide actionable feedback?

### After Building

- [ ] Does it produce false positives?
- [ ] Is feedback actionable?
- [ ] Are exemptions documented?
- [ ] Can rules be toggled?
- [ ] Is it tested on real code?

---

## 📚 Real-World Examples

### Example 1: Return Type Validator

**Goal:** Ensure functions document return types

**Naive Implementation:**
```javascript
// ❌ Check line-by-line
if (line.includes('function') && !line.includes('@returns')) {
  errors.push('Missing @returns');
}
```

**Issues:**
- Flags functions even if `@returns` is in JSDoc above
- Can't handle multi-line annotations
- No structural validation

**Intelligent Implementation:**
```javascript
// ✅ Context-aware validation
const functionMatch = /function\s+(\w+)\s*\(/g;
let match;

while ((match = functionMatch.exec(code)) !== null) {
  const lineNumber = getLineNumber(code, match.index);
  const parsed = findAndParseAnnotations(lines, lineNumber);
  
  // Check content
  if (!parsed.annotations.hasReturns) {
    errors.push({
      line: lineNumber,
      function: match[1],
      issue: '@returns annotation missing'
    });
  }
  
  // Check structure
  if (parsed.hasStructuralIssues) {
    warnings.push({
      line: lineNumber,
      function: match[1],
      issue: parsed.structureReason,
      fix: parsed.suggestedFix
    });
  }
}
```

**Benefits:**
- ✅ Finds all functions accurately
- ✅ Understands comment structure
- ✅ Validates both content and structure
- ✅ Provides actionable feedback

### Example 2: Style Linter

**Goal:** No inline styles in HTML

**Naive Implementation:**
```javascript
// ❌ Flag everything
if (html.includes('style=')) {
  errors.push('Inline style found');
}
```

**Issues:**
- Flags library code (morphdom, marked)
- Flags examples in comments
- No actionable feedback

**Intelligent Implementation:**
```javascript
const EXEMPTIONS = {
  'morphdom': { reason: 'DOM diffing library', source: 'cdn' },
  'marked': { reason: 'Markdown renderer', source: 'cdn' }
};

function validateStyles(file, html) {
  // Skip exempt files
  if (Object.keys(EXEMPTIONS).some(lib => file.includes(lib))) {
    return { valid: true, exempt: true };
  }
  
  // Find inline styles
  const styleRegex = /style\s*=\s*["']([^"']+)["']/g;
  const matches = [...html.matchAll(styleRegex)];
  
  if (matches.length > 0) {
    return {
      valid: false,
      errors: matches.map(m => ({
        line: getLineNumber(html, m.index),
        style: m[1],
        suggestion: 'Move to CSS class'
      }))
    };
  }
  
  return { valid: true };
}
```

**Benefits:**
- ✅ Exempts library code
- ✅ Shows exact inline styles found
- ✅ Suggests fixes
- ✅ No false positives

---

## 🎯 Golden Rules

1. **"Context-aware, not line-by-line"**
2. **"Validate structure AND content"**
3. **"Exemptions with reasoning"**
4. **"Single source of truth for config"**
5. **"Ship in phases"**
6. **"Actionable feedback, not just errors"**
7. **"Track drift with whitelists"**
8. **"Make doing the right thing easy"**

---

## 📚 Related Resources

- **Problem-Solving Framework:** `insights/problem-solving-framework.md` - The 5 Genius Patterns
- **Smart Parser Pattern:** `patterns/smart-parser.md` - Full implementation
- **Debugging Framework:** `insights/debugging-framework.md` - When validators fail

---

**TL;DR:** Build validators that understand context, validate structure, allow exemptions, use config arrays, and provide actionable feedback.

**A great validator makes good code the path of least resistance.** 🔥

