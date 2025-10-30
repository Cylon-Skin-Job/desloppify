# Frontend / UI Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: Element not found, clicks don't work, styles not applying

- [ ] **Element exists before `querySelector`?**
  - Check: Is script running before DOM loads?
  - Fix: Use `DOMContentLoaded` or `defer` on script tag
  - Verify: `console.log(element)` → should not be `null`

- [ ] **Event listener added but element doesn't respond?**
  - Check: Is element created dynamically after listener added?
  - Fix: Use event delegation or add listener after creation
  - Example: Listen on parent, check `event.target`

- [ ] **CSS selector typo?**
  - Check: Class/ID spelling in HTML vs JS
  - Fix: Use browser inspector to verify selector
  - Tip: `document.querySelector('your-selector')` in console

- [ ] **Z-index conflicts?**
  - Check: Inspect element → Computed styles → z-index
  - Fix: Ensure modals/popups have higher z-index than other elements
  - Typical values: Content: 1, Drawer: 100, Modal: 1000

- [ ] **Element hidden by CSS?**
  - Check: `display: none` or `visibility: hidden`?
  - Fix: Toggle via class instead of inline styles
  - Why: Easier to debug and maintain

