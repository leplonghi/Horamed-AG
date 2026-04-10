# 🏥 HORAMED - CODING STANDARDS & SECURITY PROTOCOLS

> **LAST UPDATED:** 2026-04-10
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
Always use `@/lib/safeDateUtils` or specific Type Helpers:

```typescript
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

const date = safeDateParse(dose.dueAt); // Returns valid Date or fallback
const time = safeGetTime(dose.dueAt); // Returns timestamp safely
format(safeDateParse(value), 'HH:mm');
```

---

## 🛡️ 2. TYPE-SPECIFIC DATE HELPERS

For domain-specific objects, **use the dedicated type helpers** rather than parsing dates manually. This ensures that the type validation correctly infers `null` when a date is inherently invalid, avoiding unexpected fallback behaviors.

### Doses (`src/types/dose.ts`)
```typescript
import { safeParseDoseDate, parseDose } from "@/types";

// Returns Date | null
const dueTime = safeParseDoseDate(dose); 
if (!dueTime) {
    // Handle invalid dose date
}

// Converts generic Dose into ParsedDose containing .dueDate (with guaranteed Date object)
const parsedDose = parseDose(dose); 
```

### Profiles (`src/types/profile.ts`)
```typescript
import { safeParseProfileBirthDate, calculateAge } from "@/types/profile";

// Returns Date | null
const birthDate = safeParseProfileBirthDate(profile);

// Safely calculates the user's age
const age = calculateAge(profile);
```

---

## 🏷️ 3. GUIDE TO TYPES USAGE

**Always rely on centralized TypeScript types to maintain type safety.**
Central types are usually exported from `src/types`.

- **Dose Status Validation:** When filtering or modifying doses, use `DoseStatus` string literal type mapping (`'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed' | 'scheduled'`).
- **Profile Variants:** Be aware of `ProfileType` (`'self' | 'dependent' | 'caregiver'`), as different functionality or alerts applies depending on the user profile configuration.
- **Type Guards:** Whenever receiving unknown data flows (like API triggers or local persistence), use Type Guards before destructuring:
  ```typescript
  import { isDose } from "@/types";
  
  if (isDose(payload)) {
      // payload securely inferred as Dose
  }
  ```

---

## 🛡️ 4. UNDEFINED PROPERTY PROTECTION

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

## 🏗️ 5. COMPONENT STABILITY

1. **Always handle loading states**: Do not assume data is ready immediately.
2. **Use Try/Catch in Effects**: Any `useEffect` dealing with parsing/heavy logic must be wrapped.
3. **Prop Validation**: If a prop is required, ensure the parent passes it, or handle `undefined` gracefully inside.
4. **Calculations**: Use existing calculation helpers, e.g., `calculateDoseStats(doses)` to derive UI states instead of mapping status strings manually everywhere.

---

## 🔍 6. SELF-CORRECTION SCRIPT

Before pushing, verify your code doesn't violate rules. We have scripts in `.agent/scripts` (if available), but mental check is mandatory.

> **RULE:** If you see `new Date()` in a PR review, BLOCK IT immediately.
