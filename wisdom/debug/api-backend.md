# API / Backend Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: 401 errors, CORS errors, 500 errors, timeouts

- [ ] **Missing `Authorization` header?**
  - Check: Network tab → Request headers
  - Fix: Add `Authorization: Bearer ${token}`
  - Why: Backend can't verify user without token

- [ ] **CORS issue?**
  - Check: Console shows CORS error
  - Fix: Add origin to backend CORS config
  - Why: Browser blocks cross-origin requests by default

- [ ] **Checked `response.ok` before parsing JSON?**
  - Check: Do you call `.json()` immediately?
  - Fix: `if (!response.ok) throw new Error(response.statusText)`
  - Why: Parsing error response as JSON crashes

- [ ] **Endpoint typo?**
  - Check: Network tab → Request URL
  - Fix: Compare with backend route definition
  - Tip: Check `.cursor/rules/06-api-routes.mdc` (if using RavenOS pattern)

- [ ] **Wrong HTTP method?**
  - Check: Sending GET but backend expects POST?
  - Fix: Match method in fetch call to backend route
  - Why: Express routes are method-specific

