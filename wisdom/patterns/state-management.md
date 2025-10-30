# State Management Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## Centralized State Module

```javascript
// app-state.js
let state = {
  currentUser: null,
  currentThread: null,
  isLoading: false
};

// Getters
export function getCurrentUser() {
  return state.currentUser;
}

export function getCurrentThread() {
  return state.currentThread;
}

export function getIsLoading() {
  return state.isLoading;
}

// Setters
export function setCurrentUser(user) {
  state.currentUser = user;
}

export function setCurrentThread(thread) {
  state.currentThread = thread;
}

export function setIsLoading(loading) {
  state.isLoading = loading;
}

// Bulk operations
export function clearState() {
  state.currentUser = null;
  state.currentThread = null;
  state.isLoading = false;
}
```

**Usage:**
```javascript
import { getCurrentUser, setCurrentUser } from './app-state.js';

// Read state
const user = getCurrentUser();

// Update state
setCurrentUser({ id: '123', name: 'RC' });
```

**Why this works:**
- No global pollution
- Easy to validate (scan for `window.` usage)
- Can add logging/change listeners later
- Clear API surface

**Source:** RavenOS

