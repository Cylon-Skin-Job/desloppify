# TODO System Module

**Optional module for two-way TODO contract validation**

---

## What It Does

- **Two-Way Contract Enforcement:** Links code annotations to TODO.md entries
- **Dead Code Detection:** Separates "documented TODOs" from "undocumented dead code"
- **Drift Detection:** Catches broken links between code and documentation

---

## Scripts

| Script | Purpose |
|--------|---------|
| `validate-todo-contract.mjs` | Validates two-way linking integrity |
| `detect-todo-changes.mjs` | Detects uncommitted TODO changes |

---

## Configuration

Enable in `desloppify.config.js`:

```javascript
modules: {
  todoSystem: {
    enabled: true,
    todoFile: 'docs/TODO.md'
  }
}
```

---

## Usage

**Validate TODO contracts:**
```bash
node scripts/modules/todo-system/validate-todo-contract.mjs
```

**Detect TODO changes:**
```bash
node scripts/modules/todo-system/detect-todo-changes.mjs
```

---

## How It Works

### In Code (Function Annotations)
```javascript
/**
 * @todo: docs/TODO.md#feature-xyz
 */
function unusedButPlannedFunction() {
  // Implementation waiting for dependency
}
```

### In TODO.md (Tier Headers)
```markdown
### Feature XYZ {#feature-xyz}
**Function:** `unusedButPlannedFunction()`
**File:** `services/feature.js:42`
**Blocked by:** API Y
```

### Validation

**Checks both directions:**
1. Code → TODO.md: Does `@todo` annotation point to valid anchor?
2. TODO.md → Code: Does listed function exist at specified location?

**Catches issues:**
- Broken anchors
- Moved/renamed functions
- Deleted TODOs still referenced in code
- Code references missing from TODO.md

---

## Requirements

- `docs/TODO.md` file using three-tier system
- `@todo` annotations in code
- `{#anchor}` syntax in TODO.md headers

---

## When to Use

**Enable this module if:**
- You track intentionally incomplete code
- You want to separate "planned" from "forgotten" dead code
- You use TODO.md for technical debt tracking

**Skip this module if:**
- Using GitHub Issues for task tracking
- No incomplete code patterns
- Small codebase with minimal TODOs

