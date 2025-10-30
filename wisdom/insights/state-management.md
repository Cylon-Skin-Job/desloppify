# State Management Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Centralized State with Validation

**Problem:** State scattered across `window` variables, DOM data attributes, and module scope. Impossible to debug, validation is manual.

**Solution:** Single `app-state.js` module with:
- Private state object (not on `window`)
- Getter/setter functions
- Validation script (`validate:state`) that scans codebase

**Why it works:**
- One source of truth = easier debugging
- Automated validation catches violations
- No global pollution
- Easy to add logging/tracking later

**Source:** RavenOS  
**Code:** `js/app-state.js`  
**Validation:** `npm run validate:state`

**Example:**
```javascript
// app-state.js
let state = {
  currentUser: null,
  currentThread: null
};

export function getCurrentUser() {
  return state.currentUser;
}

export function setCurrentUser(user) {
  state.currentUser = user;
  // Could add change listeners here
}
```

**Gotcha:** ZERO TOLERANCE - if you cheat and use `window.currentUser` even once, validation fails and you lose the benefit. Discipline is key.

