# Mobile Optimization Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## The Keyboard Jank Problem

**Problem:** Mobile browsers resize the viewport when the keyboard appears, causing the entire layout to shift, compress, or create double-scroll situations. Different browsers handle this differently, making it unpredictable.

**Solution:** Fixed positioning + Dynamic viewport units (svh/dvh) + Independent scroll contexts.

**Why it works:**

### The Root Cause
Mobile browsers have three different viewport behaviors:
1. **Large Viewport (lvh)** - Assumes browser UI is hidden
2. **Small Viewport (svh)** - Assumes browser UI is visible
3. **Dynamic Viewport (dvh)** - Adapts in real-time

When the keyboard appears, browsers using traditional `100vh` try to resize everything, causing jank.

### The Solution Stack
1. **Fixed positioning** locks the container to the physical screen
2. **Triple height declaration** (`vh` → `svh` → `dvh`) ensures compatibility
3. **Only inner content scrolls** - parent container stays fixed
4. **Separate scroll context** prevents scroll chaining

**Result:** Layout remains stable. Keyboard slides over content. Only the message list adjusts its scroll area. No compression or shifting.

**Key Insight:** Don't fight the browser's viewport resize. Instead, lock your container and let only specific child elements handle scrolling.

**Source:** Fusion Studio  
**Pattern:** See `patterns/mobile.md` for implementation

---

## iOS Auto-Zoom Prevention

**Problem:** iOS Safari automatically zooms the entire page when an input with `font-size < 16px` is focused. This creates a jarring, disorienting experience.

**Solution:** Force all inputs to `font-size: 16px` or larger.

**Why it works:**

### The Browser Behavior
iOS Safari implemented auto-zoom as an "accessibility feature" to make small text readable. But this was designed for desktop-style forms, not modern single-page apps. The threshold is exactly 16px.

### Why 16px Specifically
Apple decided 16px is the minimum "readable" size. Below that, Safari assumes you need help and zooms the entire viewport (not just the input).

### The Trade-off
You might want smaller input text for design reasons, but the zoom behavior is so disruptive that 16px is worth it. Users don't notice the size difference, but they DEFINITELY notice the zoom.

**Key Insight:** This is one of those "just do it" rules. Every mobile web app eventually learns this the hard way. Save yourself the debugging time.

**Source:** Fusion Studio  
**Pattern:** See `patterns/mobile.md` for implementation

---

## Safe Area Insets for Modern Devices

**Problem:** iPhone home indicator covers content, notch cuts off header. Different devices have different safe zones.

**Solution:** Use CSS `env()` variables:
```css
.chat-input {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.header {
  padding-top: env(safe-area-inset-top);
}
```

**Why it works:**
- Adapts to any device (iPhone, Android, future devices)
- No JavaScript needed
- Graceful fallback on devices without notches
- Browser provides exact measurements for hardware

**Must also add to viewport meta:**
```html
<meta name="viewport" content="viewport-fit=cover">
```

**Key Insight:** The `display-mode: standalone` media query is critical. Only apply top insets in PWA mode, because regular browsers already handle their own chrome spacing.

**Source:** Fusion Studio, RavenOS  
**Pattern:** See `patterns/mobile.md` for implementation

---

## The Address Bar Problem

**Problem:** Mobile browser address bars take up 10-15% of vertical space. Users want maximum screen real estate for your app.

**Solution:** Combine viewport-fit + PWA meta tags + scroll-based auto-hide.

**Why it works:**

### Three Levels of Address Bar Hiding

**Level 1: Auto-hide on scroll**
- Fixed positioning on parent, scrollable child
- When user scrolls, browser auto-hides address bar
- Gains ~60px of space

**Level 2: PWA minimal UI**
- Meta tags tell browser this is an "app"
- When installed, browser chrome is minimized
- Status bar remains (time, battery, signal)

**Level 3: Standalone mode**
- `apple-mobile-web-app-capable` removes ALL browser UI
- Full-screen app experience
- Must handle safe areas yourself

**The Strategy:** Support all three levels. Regular users get auto-hide. Power users who install get full-screen.

**Key Insight:** Don't force users to install to get a good experience. Progressive enhancement means each level adds value without breaking the previous one.

**Source:** Fusion Studio  
**Pattern:** See `patterns/mobile.md` for implementation

---

## Preventing Layout Scrunch

**Problem:** When keyboard appears, some browsers try to fit all content into the remaining space, causing everything to compress awkwardly.

**Solution:** Separate scroll contexts + overflow control.

**Why it works:**

### The Browser's Dilemma
Browser sees keyboard and thinks: "User needs to see input AND existing content. Better shrink everything to fit!"

But shrinking a chat interface makes messages unreadable and creates a terrible UX.

### The Fix: Separate Concerns
1. **Parent:** `overflow: hidden` - doesn't scroll, doesn't resize
2. **Child (messages):** `overflow-y: auto` - handles all scrolling
3. **Input:** `position: absolute` - fixed distance from bottom

When keyboard appears:
- Parent stays same size (fixed positioning)
- Message list adjusts its scroll area
- Input remains visible
- No compression

**Key Insight:** `overscroll-behavior: contain` is crucial. It prevents "scroll chaining" where reaching the end of one scroll area starts scrolling the parent. This stops the bounce effect from propagating and causing layout shifts.

**Source:** Fusion Studio  
**Pattern:** See `patterns/mobile.md` for implementation

---

## Browser-Specific Quirks

**iOS Safari:**
- Requires `-webkit-overflow-scrolling: touch` for momentum
- `constant(safe-area-inset-*)` fallback for iOS 11
- Status bar style needs special meta tag
- More aggressive with layout resizing

**Android Chrome:**
- Better dvh/svh support than iOS
- More predictable keyboard behavior  
- Less aggressive with auto-zoom
- Handles safe areas on newer devices with punch holes

**Key Insight:** Always test on both platforms. iOS Safari is usually the difficult one - if it works on iOS, it'll work on Android. The reverse is not always true.

**Source:** Fusion Studio

