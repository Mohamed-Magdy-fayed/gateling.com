const MAX_IMPORT_BYTES = 256 * 1024;

/** Cells Excel / Sheets would evaluate as a formula. */
const FORMULA_START = /^[=@\t\r]/;
const SIGN_START = /^[+-]/;
/** Numbers and phone numbers (`+201001234567`, `-3.5`) are left as typed. */
const NUMBER_OR_PHONE = /^[+-]?[\d\s().-]+$/;
/** The `'` guard `escapeCell` adds; stripped again on import. */
const GUARDED_CELL = /^'[=+\-@]/;

function guardFormula(s: string): string {
  if (FORMULA_START.test(s)) return `'${s}`;
  if (SIGN_START.test(s) && !NUMBER_OR_PHONE.test(s)) return `'${s}`;
  return s;
}

function escapeCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const s = guardFormula(raw);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function unguardCell(s: string): string {
  return GUARDED_CELL.test(s) ? s.slice(1) : s;
}

export function rowsToCsv(
  headers: string[],
  rows: Record<string, unknown>[],
): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function parseCsvToObjects(
  text: string,
): { headers: string[]; rows: Record<string, unknown>[] } | null {
  if (text.length > MAX_IMPORT_BYTES) return null;
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const first = lines[0];
  if (first === undefined) return null;
  const headers = parseCsvLine(first);
  const rows: Record<string, unknown>[] = [];
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (line === undefined) continue;
    const cells = parseCsvLine(line);
    const o: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      o[h] = unguardCell(cells[i] ?? "");
    });
    rows.push(o);
  }
  return { headers, rows };
}

export function parseCsvPreview(
  text: string,
  maxRows = 8,
): { headers: string[]; rows: string[][] } | null {
  if (text.length > MAX_IMPORT_BYTES) return null;
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const first = lines[0];
  if (first === undefined) return null;
  const headers = parseCsvLine(first);
  const rows = lines.slice(1, 1 + maxRows).map(parseCsvLine);
  return { headers, rows };
}
