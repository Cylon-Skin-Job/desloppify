# State Management Module

**Optional module for centralized state management validation**

---

## What It Does

- **ZERO TOLERANCE Enforcement:** Validates that ALL state lives in centralized module
- **Anti-Pattern Detection:** Catches direct `window.variable` assignments
- **Whitelist System:** Allows exceptions for specific cases

---

## Scripts

| Script | Purpose |
|--------|---------|
| `validate-state-management.mjs` | Enforces centralized state pattern |

---

## Configuration

Enable in `desloppify.config.js`:

```javascript
modules: {
  stateManagement: {
    enabled: true,
    stateFile: 'js/app-state.js'
  }
}
```

---

## Usage

**Validate state management:**
```bash
node scripts/modules/state-management/validate-state-management.mjs
```

---

## What It Checks

**Catches violations like:**
```javascript
// ❌ WRONG - Direct window access
window.userId = "abc123";
window.currentThread = thread;

// ✅ CORRECT - Use centralized state
import { setUserId, setCurrentThread } from './app-state.js';
setUserId("abc123");
setCurrentThread(thread);
```

**Whitelist exceptions:**
- Third-party libraries
- Service workers
- Specific documented cases

---

## Requirements

- Centralized state module (e.g., `app-state.js`)
- Getter/setter pattern for state access

---

## When to Use

**Enable this module if:**
- You use centralized state management
- You want to prevent scattered global state
- You want strict state access patterns

**Skip this module if:**
- Small project with minimal state
- Using framework with built-in state (React Context, Vuex, etc.)
- State management not a priority

