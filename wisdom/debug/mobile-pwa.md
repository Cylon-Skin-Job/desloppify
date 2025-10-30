# Mobile / PWA Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: Touch events don't work, gestures laggy, layout broken

- [ ] **Using `click` instead of `touchstart`/`touchend`?**
  - Check: Mobile has 300ms click delay
  - Fix: Use touch events or `pointer` events
  - Why: Better mobile responsiveness

- [ ] **Scroll event listener not passive?**
  - Check: Console warning about passive listeners
  - Fix: `{ passive: true }` as third arg to addEventListener
  - Why: Massive performance improvement on mobile

- [ ] **Safe area insets for iPhone notch?**
  - Check: Content hidden behind home indicator?
  - Fix: Use `env(safe-area-inset-bottom)` in CSS
  - Example: `padding-bottom: calc(1rem + env(safe-area-inset-bottom))`

---

## Symptoms: Keyboard appearance breaks layout, content shifts awkwardly

- [ ] **Using `100vh` without `svh`/`dvh` fallbacks?**
  - Check: Does layout resize when keyboard appears?
  - Fix: Add triple declaration: `height: 100vh; height: 100svh; height: 100dvh;`
  - Why: Different browsers handle viewport differently with keyboard

- [ ] **Parent container scrolling instead of child?**
  - Check: Does entire app scroll or just message list?
  - Fix: Parent = `overflow: hidden`, Child = `overflow-y: auto`
  - Why: Prevents double-scroll and layout shifts

- [ ] **Fixed positioning not applied?**
  - Check: Is container `position: fixed`?
  - Fix: Add `position: fixed; top: 0; left: 0; right: 0; bottom: 0;`
  - Why: Locks container to physical screen, prevents resize

- [ ] **Missing `overscroll-behavior: contain`?**
  - Check: Does scroll "chain" to parent?
  - Fix: Add `overscroll-behavior-y: contain` to scrollable child
  - Why: Prevents bounce effect from breaking layout

---

## Symptoms: iOS zooms entire page when tapping input

- [ ] **Input font-size below 16px?**
  - Check: Inspect input element → font-size
  - Fix: `input, textarea, select { font-size: 16px !important; }`
  - Why: iOS auto-zooms when font-size < 16px
  - **GOTCHA:** This is THE most common mobile web bug

---

## Symptoms: Content hidden behind notch or home indicator

- [ ] **Missing `viewport-fit=cover` meta tag?**
  - Check: `<meta name="viewport" content="...">`
  - Fix: Add `viewport-fit=cover` to viewport meta
  - Why: Allows content to extend into safe areas

- [ ] **Safe area insets not applied?**
  - Check: Is content visible below notch/above home indicator?
  - Fix: `padding-bottom: env(safe-area-inset-bottom);`
  - Why: Browser provides exact measurements for hardware

- [ ] **Using safe area insets in regular browser mode?**
  - Check: Are top insets applied outside PWA?
  - Fix: Wrap in `@media (display-mode: standalone)`
  - Why: Regular browsers handle their own chrome spacing

- [ ] **Missing iOS fallback for older devices?**
  - Check: Does it work on iOS 11?
  - Fix: Add `constant(safe-area-inset-bottom)` before `env()`
  - Why: Older iOS uses different syntax

---

## Symptoms: Address bar won't hide or takes up too much space

- [ ] **Missing PWA meta tags?**
  - Check: `<meta name="apple-mobile-web-app-capable">`
  - Fix: Add iOS PWA meta tags
  - Why: Tells browser to remove chrome when installed

- [ ] **Incorrect status bar style?**
  - Check: `<meta name="apple-mobile-web-app-status-bar-style">`
  - Fix: Use `"black-translucent"` for full-screen
  - Why: Allows content to render under status bar

- [ ] **Container not fixed positioned?**
  - Check: Does address bar hide when scrolling?
  - Fix: Use `position: fixed` on parent, scrollable child
  - Why: Browser auto-hides address bar on scroll

---

## Mobile Testing Checklist

**When making changes to mobile layout, test these:**

- [ ] **Keyboard Appearance:** Does input stay visible when keyboard opens?
- [ ] **Keyboard Dismissal:** Does layout smoothly restore when keyboard closes?
- [ ] **Input Focus:** Does tapping the input zoom the page? (Should NOT zoom)
- [ ] **Portrait Rotation:** Does layout adapt correctly when rotating device?
- [ ] **Notch Devices:** Is content visible below the notch/dynamic island?
- [ ] **Home Indicator:** Is content above the iOS home indicator area?
- [ ] **Address Bar:** Does address bar auto-hide when scrolling?
- [ ] **PWA Mode:** When installed as PWA, is browser chrome completely hidden?
- [ ] **Message List Scroll:** Can you scroll messages while keyboard is open?
- [ ] **Input Expansion:** Does input grow smoothly as you type long text?
- [ ] **Layout Stability:** Does content shift or compress awkwardly at any point?
- [ ] **Android vs iOS:** Test on both - iOS Safari is usually the difficult one
- [ ] **Safe Area Fallback:** Works on iOS 11 (constant vs env)?

---

## Quick Debug Commands

**Check viewport units support:**
```javascript
console.log('svh supported:', CSS.supports('height', '100svh'));
console.log('dvh supported:', CSS.supports('height', '100dvh'));
```

**Check safe area insets:**
```javascript
console.log('Top:', getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)'));
console.log('Bottom:', getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)'));
```

**Check if PWA mode:**
```javascript
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
```

