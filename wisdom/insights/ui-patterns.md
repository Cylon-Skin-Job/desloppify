# UI Pattern Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Promise-Based Modals

**Problem:** Blocking `alert()` and `confirm()` are ugly, blocking, and can't be styled. Callback-based modals lead to callback hell.

**Solution:** Promise-based popup system:
```javascript
const confirmed = await showConfirmation({
  title: 'Delete thread?',
  message: 'This cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel'
});

if (confirmed) {
  // Do the thing
}
```

**Why it works:**
- Clean async/await syntax
- Non-blocking (doesn't freeze UI)
- Fully stylable
- Chainable for multi-step flows
- Easy to test

**Source:** RavenOS  
**Code:** `js/confirmation-popup.js`

**Implementation notes:**
- Return a Promise that resolves on button click
- Use `position: fixed` with high z-index
- Add backdrop click-to-cancel
- Remember: z-index must be higher than drawer/nav

