import { describe, expect, it } from "vitest";

import {
  callShortcutBehaviour,
  mapShortcut,
  SHORTCUTS,
  type ShortcutContext,
  type ShortcutKeyEvent,
} from "./today-shortcuts";

const key = (code: string, extra: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent => ({
  code,
  key: "",
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...extra,
});

const ready: ShortcutContext = {
  enabled: true,
  targetIsEditable: false,
  overlayOpen: false,
  canCall: true,
  canWhatsapp: true,
  canSkip: true,
  outcomeCount: 6,
  outcomesSuspended: false,
};

describe("mapShortcut", () => {
  it("maps the card keys by physical code", () => {
    expect(mapShortcut(key("KeyC"), ready)).toEqual({ kind: "call" });
    expect(mapShortcut(key("KeyW"), ready)).toEqual({ kind: "whatsapp" });
    expect(mapShortcut(key("KeyS"), ready)).toEqual({ kind: "skip" });
    expect(mapShortcut(key("Slash", { shiftKey: true }), ready)).toEqual({ kind: "help" });
  });

  // On an Arabic layout the C key types "ؤ"; the shortcut must still work.
  it("works on an Arabic keyboard layout", () => {
    expect(mapShortcut(key("KeyC", { key: "ؤ" }), ready)).toEqual({ kind: "call" });
  });

  it("maps digits and numpad digits to visible outcomes in order", () => {
    expect(mapShortcut(key("Digit1"), ready)).toEqual({ kind: "outcome", index: 0 });
    expect(mapShortcut(key("Numpad6"), ready)).toEqual({ kind: "outcome", index: 5 });
  });

  it("ignores digits beyond the visible outcome count", () => {
    expect(mapShortcut(key("Digit7"), ready)).toBeNull();
    expect(mapShortcut(key("Digit0"), ready)).toBeNull();
  });

  it("does nothing for a hidden or disabled action", () => {
    const autoPark = { ...ready, canCall: false, canWhatsapp: false };
    expect(mapShortcut(key("KeyC"), autoPark)).toBeNull();
    expect(mapShortcut(key("KeyW"), autoPark)).toBeNull();
  });

  it("ignores keys while typing, in an open dialog, or with a modifier", () => {
    expect(mapShortcut(key("KeyC"), { ...ready, targetIsEditable: true })).toBeNull();
    expect(mapShortcut(key("KeyC"), { ...ready, overlayOpen: true })).toBeNull();
    expect(mapShortcut(key("KeyC", { ctrlKey: true }), ready)).toBeNull();
    expect(mapShortcut(key("KeyC", { metaKey: true }), ready)).toBeNull();
    expect(mapShortcut(key("KeyC", { altKey: true }), ready)).toBeNull();
  });

  it("suspends digit keys while the time picker is open", () => {
    const picking = { ...ready, outcomesSuspended: true };
    expect(mapShortcut(key("Digit1"), picking)).toBeNull();
    expect(mapShortcut(key("KeyS"), picking)).toEqual({ kind: "skip" });
  });

  it("does nothing when shortcuts are switched off, except the help panel", () => {
    const off = { ...ready, enabled: false };
    expect(mapShortcut(key("KeyC"), off)).toBeNull();
    expect(mapShortcut(key("Slash", { shiftKey: true }), off)).toEqual({ kind: "help" });
  });

  it("does not treat a plain slash as help", () => {
    expect(mapShortcut(key("Slash"), ready)).toBeNull();
  });
});

describe("callShortcutBehaviour", () => {
  // tel: on a laptop usually opens an OS prompt, so C copies the number there.
  it("dials on a touch device and copies on a desktop", () => {
    expect(callShortcutBehaviour("coarse")).toBe("dial");
    expect(callShortcutBehaviour("fine")).toBe("copy");
  });
});

describe("SHORTCUTS", () => {
  it("lists every shortcut once for the help panel", () => {
    expect(SHORTCUTS.map((s) => s.id)).toEqual(["call", "whatsapp", "outcome", "skip", "help"]);
  });
});
