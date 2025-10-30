# Firebase / Firestore Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: Queries return nothing, silent failures, timestamp errors

- [ ] **Field name has uppercase letters?**
  - Check: Collection/field names in code vs Firestore console
  - Fix: Use `snake_case` everywhere (lowercase + underscores)
  - Why: Firestore queries are case-sensitive, fails silently
  - **GOTCHA:** This cost us 2 hours in RavenOS

- [ ] **Using `new Date()` instead of `FieldValue.serverTimestamp()`?**
  - Check: Search for `new Date()` in Firestore writes
  - Fix: Use `FieldValue.serverTimestamp()` for consistency
  - Why: Server time = no timezone issues

- [ ] **Forgot to `await` Firestore query?**
  - Check: Look for `.get()` without `await`
  - Fix: Add `await` or `.then()`
  - Why: Async operations return promises

- [ ] **Collection name typo?**
  - Check: Compare code vs Firestore console (exact match)
  - Fix: Use constants for collection names
  - Example: `const COLLECTIONS = { USERS: 'users', THREADS: 'threads' }`

- [ ] **Missing Firestore indexes?**
  - Check: Browser console for index errors
  - Fix: Click the link in error, creates index automatically
  - Why: Compound queries need indexes

