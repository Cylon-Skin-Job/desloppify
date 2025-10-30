# Insights Index

**Category:** Problem-Solving Patterns & Architecture  
**Purpose:** The "why" behind solutions that work

---

## 🎯 What's Here

Higher-level patterns and architecture decisions discovered after solving hard problems. Not quick fixes - these are the principles that save time later.

**Format per file:** Problem → Solution → Why it works → Source

---

## 📂 Categories

### [State Management](state-management.md)
Centralized state with validation, avoiding global pollution.

**Includes:**
- Centralized State with Validation

---

### [UI Patterns](ui-patterns.md)
Modern UI patterns that improve UX.

**Includes:**
- Promise-Based Modals

---

### [Documentation](documentation.md)
Keeping docs accurate without manual maintenance.

**Includes:**
- Self-Updating Documentation

---

### [Firebase / Firestore](firebase.md)
Firestore best practices learned the hard way.

**Includes:**
- Server Timestamps for Consistency
- Firestore Field Naming Convention (snake_case)

---

### [API Design](api-design.md)
Backend architecture patterns that scale.

**Includes:**
- Middleware Stack with Clear Responsibilities

---

### [Testing / Validation](testing.md)
Automated enforcement of conventions.

**Includes:**
- Automated Convention Enforcement

---

### [Deployment](deployment.md)
Pre-deploy validation and safety gates.

**Includes:**
- Pre-Deploy Validation Gate

---

### [Mobile Optimization](mobile.md)
Deep insights on mobile browser behavior and optimization strategies.

**Includes:**
- The Keyboard Jank Problem (viewport units explained)
- iOS Auto-Zoom Prevention (why 16px matters)
- Safe Area Insets for Modern Devices
- The Address Bar Problem (3 levels of hiding)
- Preventing Layout Scrunch (separate scroll contexts)
- Browser-Specific Quirks (iOS vs Android)

---

### [Meta-Patterns](meta-patterns.md)
Patterns about building patterns.

**Includes:**
- Learn → Document → Automate

---

## 💡 How to Use

1. Scan categories for your problem domain
2. Read the "Problem" - does it match yours?
3. Understand the "Why it works" - don't just copy
4. Adapt the solution to your context

---

## 🧠 Adding New Insights

**When you solve a hard problem:**

1. Ask: "Would this help me in another project?"
2. If yes, add to relevant category file
3. Format: Problem → Solution → Why → Source
4. Add code examples if helpful
5. Note gotchas you discovered

**What makes a good insight:**
- ✅ Solves a class of problems (not just one instance)
- ✅ Has a "why" that's not obvious
- ✅ You'd want to remember 6 months from now
- ✅ Could apply to other projects

**What NOT to add:**
- ❌ One-off bizarre edge cases
- ❌ Issues specific to one project
- ❌ Things the error message explains clearly

---

**[← Back to Main](../README.md)**

