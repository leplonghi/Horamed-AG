/**
 * a11y.ts — Keyboard accessibility utilities
 *
 * Provides helpers to make interactive non-button elements (divs, spans)
 * keyboard-accessible per WCAG 2.1 SC 2.1.1 (keyboard operable).
 *
 * Pattern:
 *   <div role="button" tabIndex={0} {...pressable(handler)}>...</div>
 *
 * Instead of:
 *   <div onClick={handler}>...</div>          ← inaccessible
 */

import type { KeyboardEvent } from "react";

/**
 * Returns onClick + onKeyDown props that trigger the handler on
 * Enter or Space — matching native button behaviour.
 *
 * Usage:
 *   <div role="button" tabIndex={0} {...pressable(myFn)}>Label</div>
 */
export function pressable(handler: () => void) {
  return {
    onClick: handler,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    },
  };
}

/**
 * Generates a stable, component-local ID from a prefix + optional suffix.
 * Useful for aria-labelledby / aria-describedby wiring within a component.
 *
 * Usage:
 *   const ids = makeId("dose-card", dose.id);
 *   <div id={ids("root")} aria-labelledby={ids("title")}>
 *     <h2 id={ids("title")}>{dose.name}</h2>
 *   </div>
 */
export function makeId(prefix: string, suffix?: string) {
  const base = suffix ? `${prefix}-${suffix}` : prefix;
  return (part: string) => `${base}-${part}`;
}
