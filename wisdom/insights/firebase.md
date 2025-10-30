# Firebase / Firestore Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Server Timestamps for Consistency

**Problem:** Using `new Date()` in Firestore creates timezone issues, client clock skew, and comparison problems.

**Solution:** Always use `FieldValue.serverTimestamp()` for timestamps.

**Why it works:**
- Server time is authoritative (no client clock drift)
- No timezone conversion issues
- Consistent ordering in queries
- Easier to reason about

**Source:** RavenOS  
**Usage:** All `created_at`, `last_modified`, etc. fields

**Example:**
```javascript
import { FieldValue } from 'firebase-admin/firestore';

await db.collection('messages').add({
  text: 'Hello',
  created_at: FieldValue.serverTimestamp() // NOT new Date()
});
```

**Gotcha:** On write, the field is `null` until server processes it. If you need immediate value, get it from the returned document.

---

## Firestore Field Naming Convention

**Problem:** CamelCase field names look natural in JS but cause silent query failures.

**Solution:** Use `snake_case` for ALL Firestore fields and collections.

**Why it works:**
- Firestore is case-sensitive (queries fail silently on mismatch)
- snake_case is more visible in Firestore console
- Reduces bugs from typos
- Consistent with database conventions

**Source:** RavenOS (learned the hard way)  
**Convention:** `user_id`, `created_at`, `last_modified`, `thread_id`

**Code pattern:**
```javascript
// When reading from Firestore, map to camelCase if needed
const threadData = doc.data();
return {
  threadId: threadData.thread_id,
  createdAt: threadData.created_at,
  // ... rest of mapping
};
```

