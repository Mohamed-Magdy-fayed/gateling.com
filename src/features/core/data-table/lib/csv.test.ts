import { describe, expect, it } from "vitest";

import { parseCsvToObjects, rowsToCsv } from "./csv";

/**
 * Exports are opened in Excel / Sheets, which evaluate any cell starting with
 * `=`, `+`, `-` or `@` as a formula. The guard prefixes `'` to those cells,
 * except numbers and phone numbers, which sales exports are full of.
 */
function exportCell(value: unknown): string {
  const csv = rowsToCsv(["v"], [{ v: value }]);
  return csv.split("\r\n")[1] ?? "";
}

describe("rowsToCsv formula guard", () => {
  it.each([
    ["=HYPERLINK(\"http://x\",\"y\")", "\"'=HYPERLINK(\"\"http://x\"\",\"\"y\"\")\""],
    ["@SUM(A1)", "'@SUM(A1)"],
    ["+cmd|' /C calc'!A0", "'+cmd|' /C calc'!A0"],
    ["-2+3+cmd", "'-2+3+cmd"],
    ["\tTAB", "'\tTAB"],
    ["\rCR", "\"'\rCR\""],
  ])("prefixes %j", (value, expected) => {
    expect(exportCell(value)).toBe(expected);
  });

  it.each([
    "+201001234567",
    "+20 100 123 4567",
    "+1 (555) 010-9999",
    "-42",
    "-3.5",
    "01001234567",
    "Maadi",
    "",
  ])("leaves %j unchanged", (value) => {
    expect(exportCell(value)).toBe(value);
  });

  it("leaves non-string numbers unchanged", () => {
    expect(exportCell(-7)).toBe("-7");
  });

  it("renders null and undefined as empty cells", () => {
    expect(exportCell(null)).toBe("");
    expect(exportCell(undefined)).toBe("");
  });
});

describe("export → import round trip", () => {
  it("restores the original values", () => {
    const rows = [
      { name: "=HYPERLINK(\"http://x\")", phone: "+201001234567", note: "@home" },
      { name: "-2+3", phone: "-42", note: "'quoted already" },
      { name: "Acme, Inc.", phone: "+20 100 123 4567", note: "+plus" },
    ];
    const csv = rowsToCsv(["name", "phone", "note"], rows);
    expect(parseCsvToObjects(csv)?.rows).toEqual(rows);
  });

  it("keeps a leading quote that does not guard a formula character", () => {
    const csv = "note\r\n'quoted\r\n'=still guarded";
    expect(parseCsvToObjects(csv)?.rows).toEqual([
      { note: "'quoted" },
      { note: "=still guarded" },
    ]);
  });
});
