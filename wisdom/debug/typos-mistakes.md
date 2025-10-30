# Common Typos & Mistakes

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: Undefined errors, nothing happens, silent failures

- [ ] **`snake_case` vs `camelCase` mismatch?**
  - Check: Backend uses `snake_case`, frontend uses `camelCase`?
  - Fix: Pick one convention per layer (Firestore = snake_case)
  - Why: Field names must match exactly

- [ ] **Missing `await` on async function?**
  - Check: Search for `async` functions called without `await`
  - Fix: Add `await` or handle `.then()`
  - Why: You're getting a Promise, not the actual value

- [ ] **Forgot to return in promise chain?**
  - Check: `.then(() => { someFunc() })` without return
  - Fix: `.then(() => { return someFunc() })` or `.then(someFunc)`
  - Why: Next `.then()` gets `undefined`

- [ ] **Comparing objects with `===`?**
  - Check: `obj1 === obj2` always false (different references)
  - Fix: Compare properties or use `JSON.stringify()`
  - Why: Objects are compared by reference, not value

