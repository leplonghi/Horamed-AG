# 🏥 HORAMED - CODING STANDARDS & SECURITY PROTOCOLS

> **LAST UPDATED:** 2026-02-01
> **STATUS:** MANDATORY

This document defines the absolute rules for writing code in the HoraMed codebase. Violating these rules will cause crashes and production incidents.

---

## 🚫 1. THE "NEW DATE" BAN (ABSOLUTE RULE)

**NEVER use `new Date()` directly on external data.**
This is the #1 cause of crashes in this project ("Invalid time value").

### ❌ FORBIDDEN:
```typescript
const date = new Date(dose.dueAt); // CRASH RISK!
const time = new Date(userProp).getTime(); // CRASH RISK!
format(new Date(value), 'HH:mm'); // CRASH RISK!
```

### ✅ MANDATORY:
Always use `@/lib/safeDateUtils`:

```typescript
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

const date = safeDateParse(dose.dueAt); // Returns valid Date or fallback
const time = safeGetTime(dose.dueAt); // Returns timestamp safely
format(safeDateParse(value), 'HH:mm');
```

---

## 🛡️ 2. UNDEFINED PROPERTY PROTECTION

**NEVER access nested properties without optional chaining or validation.**

### ❌ FORBIDDEN:
```typescript
// If dose.items is null, this crashes the app!
return <div>{dose.items.name}</div>
```

### ✅ MANDATORY:
```typescript
// Safe with fallback
return <div>{dose.items?.name || "Medicamento"}</div>
```

---

## 🏗️ 3. COMPONENT STABILITY

1. **Always handle loading states**: Do not assume data is ready immediately.
2. **Use Try/Catch in Effects**: Any `useEffect` dealing with parsing/heavy logic must be wrapped.
3. **Prop Validation**: If a prop is required, ensure the parent passes it, or handle `undefined` gracefully inside.

---

## 🔍 4. SELF-CORRECTION SCRIPT

Before pushing, verify your code doesn't violate rules. We have scripts in `.agent/scripts` (if available), but mental check is mandatory.

> **RULE:** If you see `new Date()` in a PR review, BLOCK IT immediately.

---
