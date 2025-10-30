# UI Component Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## Promise-Based Confirmation Popup

```javascript
// confirmation-popup.js
export function showConfirmation({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return new Promise((resolve) => {
    // Create popup elements
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'confirmation-popup';
    popup.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="popup-buttons">
        <button class="cancel-btn">${cancelText}</button>
        <button class="confirm-btn">${confirmText}</button>
      </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Handle user choice
    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    
    popup.querySelector('.confirm-btn').addEventListener('click', () => cleanup(true));
    popup.querySelector('.cancel-btn').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false); // Click outside = cancel
    });
  });
}
```

**Usage:**
```javascript
import { showConfirmation } from './confirmation-popup.js';

const confirmed = await showConfirmation({
  title: 'Delete thread?',
  message: 'This cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Keep'
});

if (confirmed) {
  deleteThread();
}
```

**CSS needed:**
```css
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-popup {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.popup-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
```

**Gotchas:**
- z-index must be higher than drawer/nav
- Remember to remove from DOM after use
- Add keyboard support (Escape = cancel, Enter = confirm)

**Source:** RavenOS

