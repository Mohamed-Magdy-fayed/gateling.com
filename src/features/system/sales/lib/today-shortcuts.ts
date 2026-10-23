/**
 * Keyboard shortcuts for the Up next card, as a pure key → action mapper.
 *
 * Keys are matched by `event.code` (the physical key), not `event.key`, so
 * they work the same on an Arabic layout. The caller passes what the card can
 * do right now; a key for a hidden or disabled action does nothing.
 */

export type ShortcutKeyEvent = {
  code: string;
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type ShortcutContext = {
  /** The viewer's on/off preference. The help panel stays reachable when off. */
  enabled: boolean;
  /** Focus is in an input, textarea, select or contenteditable. */
  targetIsEditable: boolean;
  /** A dialog or popover is open. */
  overlayOpen: boolean;
  canCall: boolean;
  canWhatsapp: boolean;
  canSkip: boolean;
  /** Number of outcome buttons visible, in display order. */
  outcomeCount: number;
  /** The time picker is open: digit keys must not log a second outcome. */
  outcomesSuspended: boolean;
};

export type ShortcutAction =
  | { kind: "call" }
  | { kind: "whatsapp" }
  | { kind: "skip" }
  | { kind: "help" }
  | { kind: "outcome"; index: number };

/** For the `?` panel and docs: one row per shortcut, in display order. */
export const SHORTCUTS = [
  { id: "call", keys: ["C"] },
  { id: "whatsapp", keys: ["W"] },
  { id: "outcome", keys: ["1", "…", "9"] },
  { id: "skip", keys: ["S"] },
  { id: "help", keys: ["?"] },
] as const;

const DIGIT = /^(?:Digit|Numpad)([1-9])$/;

export function mapShortcut(
  event: ShortcutKeyEvent,
  context: ShortcutContext,
): ShortcutAction | null {
  if (event.ctrlKey || event.altKey || event.metaKey) return null;
  if (context.targetIsEditable || context.overlayOpen) return null;

  if (event.code === "Slash" && event.shiftKey) return { kind: "help" };
  if (!context.enabled || event.shiftKey) return null;

  switch (event.code) {
    case "KeyC":
      return context.canCall ? { kind: "call" } : null;
    case "KeyW":
      return context.canWhatsapp ? { kind: "whatsapp" } : null;
    case "KeyS":
      return context.canSkip ? { kind: "skip" } : null;
  }

  const digit = DIGIT.exec(event.code);
  if (digit && !context.outcomesSuspended) {
    const index = Number(digit[1]) - 1;
    return index < context.outcomeCount ? { kind: "outcome", index } : null;
  }
  return null;
}

/**
 * `C` means "start the call". A `tel:` link on a laptop usually opens an OS
 * prompt instead of a phone, so with a fine pointer it copies the number.
 */
export function callShortcutBehaviour(pointer: "coarse" | "fine"): "dial" | "copy" {
  return pointer === "coarse" ? "dial" : "copy";
}
