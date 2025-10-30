# State Management Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: Data not updating, stale values, undefined errors

- [ ] **Using `window.variable` instead of centralized state?**
  - Check: Search for `window.` in your JS files
  - Fix: Use `app-state.js` or equivalent
  - Verify: `npm run validate:state` (if using RavenOS pattern)

- [ ] **Forgot to call setter after updating object?**
  - Check: Are you mutating object directly? `obj.prop = value`
  - Fix: Use immutable updates or explicit setState
  - Why: JS doesn't detect mutations inside objects

- [ ] **Multiple sources of truth?**
  - Check: Is data stored in DOM + JS + localStorage?
  - Fix: Pick ONE source of truth
  - Why: Sync issues are debugging nightmares

