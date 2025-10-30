# Mobile Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## Dynamic Viewport Height (Prevents Keyboard Jank)

```css
/* Lock chat window to viewport on mobile portrait */
@media (max-width: 1024px) and (orientation: portrait) {
  #chat-window {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;   /* fallback */
    height: 100svh;  /* small viewport height */
    height: 100dvh;  /* dynamic viewport height */
    margin: 0;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }
  
  /* Message list scrolls independently */
  .messages-list {
    height: calc(100vh - 120px);  /* fallback */
    height: calc(100svh - 120px); /* small viewport */
    height: calc(100dvh - 120px); /* dynamic viewport */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
```

**Why this works:**
- **Fixed positioning** prevents layout shifts when keyboard appears
- **Triple height declaration** for browser compatibility
- **svh** = Small viewport (assumes browser UI always visible)
- **dvh** = Dynamic viewport (adapts to keyboard/address bar)
- Only message list scrolls, not entire layout

**Source:** Fusion Studio

---

## Prevent iOS Auto-Zoom on Input

```css
/* Portrait mobile only */
@media (max-width: 1024px) and (orientation: portrait) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

**Why this works:**
- iOS Safari auto-zooms when input font-size < 16px
- Force 16px prevents jarring zoom experience
- Only applies to mobile, desktop keeps its styles

**Source:** Fusion Studio

---

## Safe Area Insets (Notch/Home Indicator)

```css
/* Bottom safe area (home indicator) */
#chat-window {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);  /* older iOS */
}

/* Top safe area (notch) - PWA only */
@media (display-mode: standalone) and (orientation: portrait) and (max-width: 600px) {
  #header {
    top: env(safe-area-inset-top);
  }
  
  #content {
    padding-top: calc(env(safe-area-inset-top) + 56px);
  }
}
```

**HTML Meta Required:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**Why this works:**
- `env(safe-area-inset-*)` gives space needed for hardware
- `constant()` is fallback for older iOS
- `display-mode: standalone` only applies when installed as PWA
- `viewport-fit=cover` extends content edge-to-edge

**Gotchas:**
- Must use `viewport-fit=cover` in meta tag
- Top insets usually only needed in PWA mode
- Bottom insets needed everywhere (home indicator)

**Source:** Fusion Studio

---

## PWA Address Bar Hiding

```html
<!-- Viewport Configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#000000" />

<!-- iOS PWA Settings -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**Why this works:**
- `apple-mobile-web-app-capable` removes browser chrome when installed
- `black-translucent` status bar lets content render underneath
- `theme-color` matches browser chrome to app background
- Combined with fixed positioning, address bar auto-hides on scroll

**Source:** Fusion Studio

---

## Input Expansion with Smooth Transitions

```css
#message-input {
  height: 44px;
  min-height: 44px;
  max-height: 300px;
  overflow-y: auto;
  resize: none;
  transition: height 0.3s ease;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Expanded state (add via JS when needed) */
#message-input.expanded {
  height: calc(44px + 50px);
  min-height: calc(44px + 50px);
  padding-bottom: 40px;
}
```

**Usage:**
```javascript
messageInput.addEventListener('input', () => {
  if (messageInput.scrollHeight > 44) {
    messageInput.classList.add('expanded');
  } else {
    messageInput.classList.remove('expanded');
  }
});
```

**Why this works:**
- Max height prevents infinite growth
- Smooth transitions feel natural
- Becomes scrollable when max height reached
- Word wrapping prevents horizontal overflow

**Source:** Fusion Studio

---

## Swipe Gesture Detection

```javascript
// swipe-gestures.js
export function addSwipeListener(element, callbacks) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  
  const minSwipeDistance = 50; // pixels
  
  element.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  
  element.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Horizontal swipe (if more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > minSwipeDistance) {
        callbacks.onSwipeRight?.();
      } else if (deltaX < -minSwipeDistance) {
        callbacks.onSwipeLeft?.();
      }
    }
    // Vertical swipe
    else {
      if (deltaY > minSwipeDistance) {
        callbacks.onSwipeDown?.();
      } else if (deltaY < -minSwipeDistance) {
        callbacks.onSwipeUp?.();
      }
    }
  }
}
```

**Usage:**
```javascript
import { addSwipeListener } from './swipe-gestures.js';

addSwipeListener(document.body, {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => openDrawer()
});
```

**Gotchas:**
- Use `{ passive: true }` for performance
- Adjust `minSwipeDistance` for sensitivity
- Consider adding momentum calculation

**Source:** RavenOS

