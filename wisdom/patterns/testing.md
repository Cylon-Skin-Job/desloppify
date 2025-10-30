# Testing Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## Mock Firebase for Testing

```javascript
// test-utils/mock-firebase.js
export function createMockFirestore() {
  const data = new Map();
  
  return {
    collection: (path) => ({
      doc: (id) => ({
        get: async () => ({
          exists: data.has(`${path}/${id}`),
          data: () => data.get(`${path}/${id}`)
        }),
        set: async (docData) => {
          data.set(`${path}/${id}`, docData);
        },
        delete: async () => {
          data.delete(`${path}/${id}`);
        }
      }),
      add: async (docData) => {
        const id = Math.random().toString(36).substr(2, 9);
        data.set(`${path}/${id}`, docData);
        return { id };
      },
      get: async () => ({
        empty: data.size === 0,
        docs: Array.from(data.entries()).map(([key, value]) => ({
          id: key.split('/').pop(),
          data: () => value
        }))
      })
    })
  };
}
```

**Usage:**
```javascript
import { createMockFirestore } from './test-utils/mock-firebase.js';

const db = createMockFirestore();
await db.collection('users').doc('123').set({ name: 'RC' });
const doc = await db.collection('users').doc('123').get();
console.log(doc.data()); // { name: 'RC' }
```

**Source:** RavenOS

