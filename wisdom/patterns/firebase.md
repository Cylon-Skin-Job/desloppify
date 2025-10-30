# Firebase / Firestore Patterns

**Category:** Patterns  
**Last updated:** 2025-10-29

---

## Safe Firestore Write with Timestamp

```javascript
import { FieldValue } from 'firebase-admin/firestore';

async function createDocument(db, collectionPath, data) {
  try {
    const docRef = await db.collection(collectionPath).add({
      ...data,
      created_at: FieldValue.serverTimestamp(),
      last_modified: FieldValue.serverTimestamp()
    });
    
    // Get the document with resolved timestamp
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() };
  } catch (error) {
    console.error('Firestore write failed:', error);
    throw error;
  }
}
```

**Usage:**
```javascript
const message = await createDocument(db, 'users/123/messages', {
  text: 'Hello world',
  user: 'assistant'
});
```

**Why this pattern:**
- Server timestamp ensures consistency
- Returns complete document with ID
- Error handling included
- Works on both backend and frontend

**Source:** RavenOS

---

## Firestore Query with Error Handling

```javascript
async function queryCollection(db, collectionPath, constraints = []) {
  try {
    let query = db.collection(collectionPath);
    
    // Apply constraints (orderBy, limit, where, etc.)
    constraints.forEach(constraint => {
      query = constraint(query);
    });
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Query failed for ${collectionPath}:`, error);
    throw error;
  }
}
```

**Usage:**
```javascript
// Simple query
const threads = await queryCollection(db, 'users/123/threads');

// With constraints
const recentThreads = await queryCollection(db, 'users/123/threads', [
  q => q.orderBy('last_modified', 'desc'),
  q => q.limit(10)
]);
```

**Source:** RavenOS

