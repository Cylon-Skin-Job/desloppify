# Debugging Framework: Systematic Problem Solving

**Last Updated:** 2025-10-30  
**Purpose:** Step-by-step approach to solving hard technical problems

---

## 🎯 Core Philosophy

**"Don't fight the symptoms, fix the root cause."**

When a validator warns about missing annotations, we didn't add band-aids (`@extend` markers). We asked: **"Why is the validator failing to see what's clearly there?"** → Built a smarter parser.

**This framework helps you ask the right questions.**

---

## 🛠️ The 5-Step Process

### Step 1: Identify the Root Cause

**Don't treat symptoms. Ask WHY it's failing.**

#### Questions to Ask
1. **Is this a tool limitation or a code smell?**
   - Tool limitation = Fix the tool
   - Code smell = Refactor the code

2. **If we fix the symptom, will more symptoms appear?**
   - Yes = Root cause not addressed
   - No = Might be acceptable workaround

3. **What would make this problem impossible?**
   - Think structurally, not tactically

#### Example: Missing Annotation Warnings

**Symptom:** Validator warns "@returns annotation missing"  
**Band-aid:** Add `@extend` marker to tell validator to look further  
**Root cause:** Validator uses naive line-by-line search

**Questions:**
- Is this a tool limitation? **Yes** - Validator can't handle multi-line comments
- Will fixing symptoms create more? **Yes** - Every long JSDoc needs `@extend`
- What makes this impossible? **Smart parser that understands comment structure**

**Solution:** Build context-aware parser → Problem disappears

---

### Step 2: Consider Context

**Think beyond the immediate scope.**

#### Questions to Ask
1. **Is this a one-off problem or a pattern?**
   - One-off = Tactical fix might be OK
   - Pattern = Need systematic solution

2. **Will this solution scale?**
   - As codebase grows
   - As team grows
   - As requirements change

3. **What other code exhibits the same pattern?**
   - Look for similar issues
   - Solution should handle all cases

#### Example: Annotation Order Inconsistency

**Problem:** Annotation order differs across 3 validators  
**Context:**
- Pattern: Yes - Same order logic in multiple places
- Scale: No - Adding new annotations requires updating 3 files
- Similar: Yes - Priority/ordering appears in other systems too

**Solution:** Extract to `ANNOTATION_ORDER` array → All validators reference it

**Bonus:** This pattern applies to middleware order, build stages, feature flags, etc.

---

### Step 3: Design for Change

**Make it easy to modify.**

#### Principles
1. **Extract configuration into arrays/objects**
   - Not scattered if/else logic
   - Single source of truth

2. **Document WHY, not just WHAT**
   - Why this order?
   - Why this exemption?
   - Why this structure?

3. **Provide extension points**
   - Can new cases be added easily?
   - Can order be changed in one place?
   - Can rules be toggled without code changes?

#### Example: Exemption System

**Bad (Rigid):**
```javascript
// Hardcoded special cases
if (file.includes('morphdom')) return; // Why??
if (file.includes('winston')) return;  // Why??
```

**Good (Flexible):**
```javascript
const EXEMPTIONS = {
  'morphdom': { 
    reason: 'DOM diffing library controls own styles',
    source: 'CDN library',
    reference: 'https://github.com/patrick-steele-idem/morphdom',
    added: '2025-10-15'
  }
};

function isExempt(file, EXEMPTIONS) {
  return Object.keys(EXEMPTIONS).some(pattern => 
    file.includes(pattern)
  );
}
```

**Benefits:**
- ✅ Adding exemptions = edit config, not code
- ✅ Reasoning documented
- ✅ Can audit exemptions easily
- ✅ Future maintainers understand WHY

---

### Step 4: Validate Structure + Content

**Check WHAT and WHERE, not just IF.**

#### Validation Layers
1. **Existence (IF):** Does the code/pattern exist?
2. **Location (WHERE):** Is it in the right place?
3. **Format (HOW):** Is it structured correctly?

#### Example: Comment Block Validation

**Naive (IF only):**
```javascript
// ❌ Only checks IF annotation exists
if (code.includes('@returns')) {
  return { valid: true };
}
```

**Structured (IF + WHERE + HOW):**
```javascript
// ✅ Validates structure AND content
const parsed = findAndParseAnnotations(lines, functionLine);

// IF: Does annotation exist?
if (!parsed.annotations.hasReturns) {
  return { valid: false, reason: '@returns missing' };
}

// WHERE: Is comment adjacent to function?
const gap = functionLine - parsed.commentEndLine - 1;
if (gap > 0) {
  return {
    valid: false,
    reason: `${gap} blank line(s) between comment and function`
  };
}

// HOW: Is comment block continuous?
if (parsed.hasInternalGaps) {
  return {
    valid: false,
    reason: 'Blank lines within comment block'
  };
}

return { valid: true };
```

**Benefits:**
- ✅ Catches structural issues
- ✅ Provides actionable feedback
- ✅ Guides developers to correct patterns

---

### Step 5: Implement in Phases

**Progressive rollout. Ship incrementally.**

#### Phase Structure

**Phase 1: Critical Safety**
- **Must work** or breaks everything
- **Severity:** error
- **Coverage:** Core paths only
- **Timeline:** Week 1

**Phase 2: Enhanced Features**
- **Should work** for best UX
- **Severity:** warning
- **Coverage:** Common paths
- **Timeline:** Week 4

**Phase 3: Future Enhancements**
- **Could work** for polish
- **Severity:** info
- **Coverage:** Edge cases
- **Timeline:** TBD

#### Example: Annotation System Rollout

**Phase 1: Core Safety (Shipped Week 1)**
- `@returns` - What does it return?
- `@throws` - What can fail?
- `@param {type?}` - What can be null?
- `@async-boundary` - Where are async edges?

**Result:** 60% coverage, critical safety validated

**Phase 2: Advanced Context (Shipped Week 4)**
- `@requires-functions` - What does it call?
- `@side-effects` - What does it change?
- `@mutates-state` - What state does it touch?

**Result:** 86% coverage, context tracking working

**Phase 3: Future (TBD)**
- `@performance` - Time/space complexity
- `@security` - Trust boundaries
- `@cache` - Caching behavior

**Result:** Roadmap clear, not blocking current work

**Key:** Each phase validates independently and provides immediate value.

---

## 📋 Quick Reference Card

### When You See a Validation Error

1. **Don't band-aid it**
   - Ask why the validator failed
   - Is the validator looking in the right place?

2. **Check the context**
   - Is this a pattern or one-off?
   - Will this scale?

3. **Fix the root cause**
   - Make the validator smarter
   - Not the code more verbose

### When Building a Validator

1. **Be context-aware**
   - Find full context, then parse
   - No arbitrary limits

2. **Allow exemptions**
   - Framework/library code gets a pass
   - Document WHY

3. **Use config arrays**
   - Single source of truth for ordering/priority
   - Change once, update everywhere

4. **Validate structure**
   - Check WHERE things are, not just IF they exist
   - Provide actionable feedback

5. **Work in phases**
   - Critical safety first
   - Enhancements later
   - Ship incrementally

### When Designing an API

1. **Single source of truth**
   - One array/object to rule them all
   - No scattered logic

2. **Document reasoning**
   - Why this way? (not just what/how)
   - Future you will thank you

3. **Extension points**
   - Make it easy to add/change
   - Config > Code

4. **Clear boundaries**
   - What's in scope? What's not?
   - Phase it if needed

---

## 🧪 Real-World Application Flow

### Problem: Validator Flagging Valid Code

**Step 1: Root Cause**
- ❓ Why is it flagging valid code?
- ✅ Validator uses naive distance-based search
- ✅ Can't handle multi-line comments

**Step 2: Context**
- ✅ Pattern: Yes - Happens with all long JSDoc blocks
- ✅ Scale: No - Adding `@extend` markers everywhere doesn't scale
- ✅ Similar: Yes - Any context-based parsing has this issue

**Step 3: Design for Change**
- ✅ Extract comment parsing logic to reusable module
- ✅ Document three-layer architecture (detect → extract → parse)
- ✅ Provide extension points for new annotation types

**Step 4: Validate Structure**
- ✅ Check IF annotations exist (content)
- ✅ Check WHERE they are (structure - adjacent to function)
- ✅ Check HOW they're formatted (no gaps, proper order)

**Step 5: Phases**
- ✅ Phase 1: Core parser handles JSDoc + compact comments
- ✅ Phase 2: Add structure validation (gaps, ordering)
- ✅ Phase 3: Auto-formatting, ordering enforcement

**Result:** Smart parser built, validators updated, zero false positives.

---

## 💡 Golden Rules

1. **"If you're adding a special marker, you're treating a symptom."**
2. **"Configuration should be data, not code."**
3. **"Validation failures mean the validator is broken, not the code."**
4. **"Context first, parsing second."**
5. **"Structure AND content, not just content."**
6. **"Work in phases: Critical → Important → Future."**
7. **"Document WHY, not just WHAT."**
8. **"Exemptions for external code, strict rules for our code."**
9. **"If you can't easily change it, you designed it wrong."**
10. **"Make the impossible possible by fixing the system, not the code."**

---

## 🎯 When to Use This Framework

**Apply this framework when:**
- ✅ Validator produces false positives
- ✅ Logic is duplicated across files
- ✅ Code is hard to change/extend
- ✅ Problem seems impossible to solve
- ✅ Quick fix feels wrong
- ✅ Team keeps hitting same issue

**Skip this framework when:**
- ❌ True one-off issue
- ❌ Tactical fix is clearly correct
- ❌ Problem is well-understood
- ❌ Solution is obvious

---

## 📚 Related Resources

- **Problem-Solving Framework:** `insights/problem-solving-framework.md` - The 5 Genius Patterns
- **Smart Parser Pattern:** `patterns/smart-parser.md` - Full implementation example
- **System Thinking:** `insights/system-thinking.md` - Higher-level philosophy

---

**TL;DR:** Ask WHY, consider context, design for change, validate structure, ship in phases.

**This isn't just debugging—it's engineering.** 🔥

