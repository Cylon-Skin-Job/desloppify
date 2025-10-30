# Debug Clues Index

**Category:** Quick Debugging Checklist  
**Purpose:** Start here when something breaks

---

## 🎯 How to Use This

1. Something breaks
2. Identify symptoms
3. Scan relevant category
4. Check each item quickly
5. When fixed, add new clue if it took > 30 min

**Format per file:** Quick checklist → What to check → How to verify

---

## 📂 Categories

### [State Management](state-management.md)
Data not updating, stale values, undefined errors.

**Common issues:**
- Using `window.variable` instead of centralized state
- Forgetting to call setter after mutation
- Multiple sources of truth

---

### [Firebase / Firestore](firebase.md)
Queries return nothing, silent failures, timestamp errors.

**Common issues:**
- Field name case mismatch (use `snake_case`)
- Using `new Date()` instead of `FieldValue.serverTimestamp()`
- Missing await on queries
- Collection name typos
- Missing indexes

---

### [API / Backend](api-backend.md)
401 errors, CORS errors, 500 errors, timeouts.

**Common issues:**
- Missing Authorization header
- CORS configuration
- Not checking `response.ok` before parsing
- Endpoint typos
- Wrong HTTP method

---

### [Frontend / UI](frontend-ui.md)
Element not found, clicks don't work, styles not applying.

**Common issues:**
- Element doesn't exist yet when querySelector runs
- Event listener on element that gets recreated
- CSS selector typos
- Z-index conflicts
- Hidden elements

---

### [Typos & Mistakes](typos-mistakes.md)
Undefined errors, nothing happens, silent failures.

**Common issues:**
- snake_case vs camelCase mismatch
- Missing await on async functions
- Forgot to return in promise chain
- Comparing objects with ===

---

### [Mobile / PWA](mobile-pwa.md)
Touch events, keyboard jank, iOS zoom, layout issues, PWA problems.

**Common issues:**
- Using click instead of touch events
- Keyboard breaks layout (missing svh/dvh)
- iOS auto-zoom on input (font-size < 16px)
- Content hidden behind notch/home indicator
- Address bar won't hide
- Non-passive scroll listeners

**Includes:**
- Comprehensive mobile testing checklist
- Quick debug commands for viewport/safe areas

---

### [Authentication](authentication.md)
User logged out unexpectedly, token errors, 401 on valid user.

**Common issues:**
- Expired tokens (Firebase = 1 hour)
- Token not attached to requests
- Not verifying token on backend

---

## 💡 When All Else Fails

- [ ] **Read the actual error message** (not just the stack trace)
- [ ] **Console.log the data right before it breaks** (verify assumptions)
- [ ] **Restart dev server** (stale cache/modules)
- [ ] **Clear browser cache/storage** (old data lingering)
- [ ] **Check browser console AND terminal logs** (errors split between client/server)
- [ ] **Simplify:** Comment out code until it works, add back piece by piece
- [ ] **Google the EXACT error message** (someone solved it already)

---

## 🧠 Adding New Clues

**When you fix a bug that took > 30 minutes:**

1. Add to relevant category file
2. Format: `[ ] Question? → Check → Fix → Why`
3. Commit to this repo
4. All projects get the wisdom

**What makes a good clue:**
- ✅ Saved you significant time
- ✅ Not obvious from error message
- ✅ You'll probably hit again
- ✅ Quick to check (< 2 min)

**What NOT to add:**
- ❌ One-off bizarre edge cases
- ❌ Issues specific to one project
- ❌ Things the error message explains clearly

---

**[← Back to Main](../README.md)**

