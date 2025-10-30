# Problem-Solving Framework: The 5 Genius Patterns

**Last Updated:** 2025-10-30  
**Purpose:** Battle-tested patterns for solving hard problems

---

## 🎯 What This Is

These are the **"aha!"** patterns that emerged from solving complex validation, parsing, and architecture problems. Not quick fixes—these are the thinking patterns that turn impossible problems into solved ones.

**Format:** Problem → Solution → When to Apply → Real Examples

**Source Projects:** RavenOS, Desloppify

---

## Pattern #1: Context-Aware Over Naive

**Don't search line-by-line. Find context first, then parse.**

### The Problem
```javascript
// ❌ NAIVE: Check each line independently
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@returns')) found = true;
}
// Misses: Multi-line JSDoc, compact annotations, nested functions
```

### The Solution
```javascript
// ✅ GENIUS: Find context first (full function), parse within context
const functionBlock = extractFunctionBlock(code, startLine);
const annotations = parseAnnotationsInContext(functionBlock);
// Handles: Multi-line, compact, nested - all correctly
```

### When to Apply
- **Log parsing:** Find error → extract full stack trace → analyze
- **Code analysis:** Find function → extract full body → parse
- **DOM queries:** Find element → traverse tree → validate relationships
- **Config validation:** Find section → validate entire section
- **Any pattern matching where boundaries matter**

### Real Examples

**Example 1: Annotation Validator (RavenOS)**
- **Before:** Checked line-by-line, flagged valid compact annotations as missing
- **After:** Smart parser extracts full comment block first, then parses → zero false positives
- **Impact:** Eliminated need for `@extend` markers, handles any comment format

**Example 2: Log Analysis**
- **Before:** Grepped for "ERROR" strings, missed multi-line stack traces
- **After:** Find "ERROR" → extract entire stack trace → parse structured data
- **Impact:** Caught root causes instead of symptoms

**Example 3: HTML Validation**
- **Before:** Checked each element individually, missed structural issues
- **After:** Find element → traverse parent/child tree → validate semantic structure
- **Impact:** Caught accessibility and SEO issues

### Key Insight

> **"Context is king. Always extract the full logical unit before parsing."**

Arbitrary limits (10 lines, 100 characters) are code smells. If you're adding distance limits, you're solving the wrong problem.

---

## Pattern #2: Exemptions Over Strict Rules

**Framework/library code gets a pass. Our code stays strict.**

### The Problem
```javascript
// ❌ WRONG: Flag every violation blindly
if (hasInlineStyle(element)) {
  errors.push('Inline style found');
}
// Breaks: Third-party libraries, framework code, CDN scripts
```

### The Solution
```javascript
// ✅ GENIUS: Exemption policy with reasoning
const EXEMPTIONS = {
  'morphdom': { 
    reason: 'DOM diffing library controls own styles',
    source: 'CDN library',
    reference: 'https://github.com/patrick-steele-idem/morphdom'
  },
  'winston.log': {
    reason: 'Industry standard logging library',
    source: 'npm package',
    reference: 'https://github.com/winstonjs/winston'
  }
};

function validate(code, file) {
  if (isExempt(file, code)) return { valid: true, exemption: true };
  // Apply strict rules only to our code
}
```

### When to Apply
- **Linting:** Exempt generated code, minified libraries
- **Security scans:** Exempt known-safe patterns, framework conventions
- **Performance monitoring:** Exempt initialization/bootstrap code
- **Type checking:** Exempt dynamic/meta-programming patterns
- **ANY validation that could hit external code**

### Real Examples

**Example 1: CSS Validator (RavenOS)**
- **Before:** Flagged `morphdom` CDN library for inline styles
- **After:** Exemption system with reasoning → validates our code, skips libraries
- **Impact:** Zero false positives, validation is useful again

**Example 2: Security Scanner**
- **Before:** Flagged Express middleware for SQL-like strings
- **After:** Exemptions for framework patterns → only flags actual SQL injection
- **Impact:** Security team trusts the alerts now

**Example 3: Type Checker**
- **Before:** Flagged dynamic imports and eval() in build tools
- **After:** Exemptions for meta-programming in specific files
- **Impact:** Build tools work, app code stays strict

### Key Insight

> **"Exemptions aren't exceptions—they're intelligent filtering."**

**Template:**
```javascript
const EXEMPTIONS = {
  pattern: { 
    reason: 'Why this is safe',
    source: 'library|framework|core|generated',
    reference: 'Link to docs/source' 
  }
};
```

Document WHY something is exempt. Future you will thank you.

---

## Pattern #3: Single Source of Truth Arrays

**Configuration should be data (arrays), not code (if/else).**

### The Problem
```javascript
// ❌ WRONG: Hardcoded order scattered across files
// In validator A:
if (tag === '@returns') return 1;
if (tag === '@throws') return 2;

// In validator B:
if (tag === '@returns') checkFirst();
if (tag === '@throws') checkSecond();

// In docs:
"Order: @returns, @throws..."
```

### The Solution
```javascript
// ✅ GENIUS: One array, referenced everywhere
// config.js
export const ANNOTATION_ORDER = [
  '@returns',
  '@throws',
  '@param',
  '@async-boundary'
];

// validator.js
const order = ANNOTATION_ORDER.indexOf(tag);

// docs-generator.js
const list = ANNOTATION_ORDER.map(formatDoc);
```

### When to Apply
- **Validation rules:** Priority, execution order
- **Build pipelines:** Stage ordering
- **Feature flags:** Rollout priorities
- **Route middleware:** Execution sequence
- **CSS properties:** Preferred ordering
- **ANY repeated logic or prioritization**

### Real Examples

**Example 1: Annotation System (RavenOS)**
- **Before:** Annotation order hardcoded in 3 different files
- **After:** `ANNOTATION_ORDER` array exported once, referenced everywhere
- **Impact:** Change once, updates everywhere → zero drift

**Example 2: Build Pipeline**
- **Before:** Stage order in Makefile, Dockerfile, CI config (3 places)
- **After:** `PIPELINE_STAGES` array in config, all systems reference it
- **Impact:** Added new stage in 1 line, all systems updated automatically

**Example 3: Middleware Chain**
- **Before:** Express middleware order duplicated in 5 route files
- **After:** `MIDDLEWARE_STACK` array in config
- **Impact:** Reordered security checks once, applied to all routes

### Key Insight

> **"If you're copy-pasting ordering logic, you're doing it wrong."**

**Benefits:**
- **Single edit:** Change once, propagates everywhere
- **Zero drift:** Can't get out of sync
- **Self-documenting:** Array IS the documentation
- **Testable:** Easy to verify order

---

## Pattern #4: Structure AND Content Validation

**Check WHERE the code lives, not just WHAT it contains.**

### The Problem
```javascript
// ❌ WRONG: Only check content
if (code.includes('getElementById')) {
  warnings.push('DOM access found');
}
// Flags: Backend files that never run in browser (false positives)
```

### The Solution
```javascript
// ✅ GENIUS: Check structure (location) AND content
function validateDOMAccess(code, file) {
  // Check WHERE first
  if (!file.startsWith('js/') && !file.includes('index.js')) {
    return; // Backend file, skip DOM checks
  }
  
  // Then check WHAT
  if (code.includes('getElementById')) {
    // Now we know it's frontend, this matters
  }
}
```

### When to Apply
- **Environment-specific validation:** Frontend vs backend code
- **Security checks:** Client vs server trust boundaries
- **Performance rules:** Build-time vs runtime optimizations
- **Import validation:** Top-of-file vs inline imports
- **Test structure:** Describe/it block nesting
- **ANY validation where context matters**

### Real Examples

**Example 1: DOM Validator**
- **Before:** Flagged backend files for DOM access they never make
- **After:** Structure check (file path) before content check
- **Impact:** Only validates frontend files → zero false positives

**Example 2: Import Validator**
- **Before:** Flagged dynamic imports anywhere as errors
- **After:** Checks if file is a route handler (structure), then allows dynamic imports
- **Impact:** Route code splitting works, app code stays strict

**Example 3: Security Scanner**
- **Before:** Flagged innerHTML usage everywhere
- **After:** Checks if file is sanitizer utility (structure), exempts those
- **Impact:** Sanitization library works, app code flagged correctly

### Key Insight

> **"Location is metadata. Use it."**

**Validation should answer:**
1. **WHAT exists:** Content/pattern matching
2. **WHERE it is:** File path, directory structure
3. **HOW it's formatted:** Spacing, ordering, nesting

All three together = intelligent validation.

---

## Pattern #5: Progressive Complexity (Phases)

**Build in phases: Critical → Enhanced → Future. Ship each phase.**

### The Problem
```javascript
// ❌ WRONG: Build everything at once
// Week 1-4: Build 20 features
// Week 5: Test everything
// Week 6: Debug everything
// Week 7: Still debugging
// Result: Nothing ships
```

### The Solution
```javascript
// ✅ GENIUS: Phase it
// Phase 1 (Week 1): Critical safety
//   - Must work or breaks everything
//   - Severity: error
//   - Ship: Week 1

// Phase 2 (Week 4): Enhanced features
//   - Should work for best UX
//   - Severity: warning
//   - Ship: Week 4

// Phase 3 (TBD): Nice-to-haves
//   - Could work for polish
//   - Severity: info
//   - Ship: When ready
```

### When to Apply
- **New features:** MVP → Enhanced → Premium
- **Refactoring projects:** Critical paths → Common paths → Edge cases
- **Validation systems:** Safety → Quality → Style
- **Testing coverage:** Happy path → Error handling → Edge cases
- **Security hardening:** Auth → Validation → Rate limiting → Audit
- **ANY complex work**

### Real Examples

**Example 1: Annotation System (RavenOS)**
- **Phase 1:** 4 core annotations (@returns, @throws, @param, @async-boundary)
- **Phase 2:** 3 advanced (@requires-functions, @side-effects, @mutates-state)
- **Phase 3:** 3 polish (@performance, @security, @cache)
- **Impact:** Shipped incrementally, 86% coverage after Phase 2

**Example 2: Testing Strategy**
- **Phase 1:** Critical paths (auth, payment, data loss prevention)
- **Phase 2:** Happy paths (user flows, common actions)
- **Phase 3:** Edge cases (error handling, race conditions)
- **Impact:** Deployed with confidence after Phase 1, enhanced over time

**Example 3: Performance Optimization**
- **Phase 1:** Bottlenecks (database queries, API calls)
- **Phase 2:** Common paths (page loads, search results)
- **Phase 3:** Rare cases (admin tools, export functions)
- **Impact:** 80% improvement in Phase 1, diminishing returns after

### Key Insight

> **"Start with critical safety, layer in features, leave room for future."**

**Phase Checklist:**
- ✅ Validates independently
- ✅ Provides immediate value
- ✅ Has clear completion criteria
- ✅ Builds on previous phase

**Each phase should be shippable.** If you can't ship Phase 1, your phases are wrong.

---

## 🎯 Quick Pattern Matcher

**When stuck, ask:**

1. **Am I checking line-by-line?** → Pattern #1 (Context-Aware)
2. **Am I flagging library code?** → Pattern #2 (Exemptions)
3. **Is this hardcoded in multiple places?** → Pattern #3 (Single Source)
4. **Does location matter?** → Pattern #4 (Structure + Content)
5. **Is this too complex to ship?** → Pattern #5 (Phases)

---

## 🚀 The Golden Rule

**"If you're adding a special marker (`@ignore`, `@extend`), you're treating a symptom. Fix the tool, not the code."**

Don't add comments to work around validator limitations.  
Fix the validator to be smarter.

---

## 📚 Related Patterns

- **Smart Parser Pattern:** `patterns/smart-parser.md` - Full implementation of Pattern #1
- **Debugging Framework:** `insights/debugging-framework.md` - How to apply these when stuck
- **System Thinking:** `insights/system-thinking.md` - Higher-level philosophy

---

**TL;DR:** Context first, exemptions for external code, single source arrays, structure + content validation, ship in phases.

**When you encounter a hard problem, apply these patterns. They turn impossible into solved.** 🔥

