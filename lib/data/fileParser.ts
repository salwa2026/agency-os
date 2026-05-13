export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
}

// Handles quoted fields, escaped quotes, CRLF and LF line endings
export function parseCSV(text: string): ParsedFile {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 1) return { headers: [], rows: [], rowCount: 0, columnCount: 0 };

  function parseRow(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    return headers.reduce(
      (obj, h, i) => {
        const raw = values[i] ?? '';
        // Coerce numeric strings
        const n = Number(raw);
        obj[h] = raw !== '' && !isNaN(n) ? n : raw;
        return obj;
      },
      {} as Record<string, unknown>,
    );
  });

  return { headers, rows, rowCount: rows.length, columnCount: headers.length };
}

export async function parseXLSX(buffer: ArrayBuffer): Promise<ParsedFile> {
  // Dynamic import so server bundle only loads when needed
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (raw.length < 1) return { headers: [], rows: [], rowCount: 0, columnCount: 0 };

  const headers = (raw[0] as unknown[]).map(String);
  const rows = (raw.slice(1) as unknown[][]).map((rowArr) =>
    headers.reduce(
      (obj, h, i) => {
        obj[h] = rowArr[i] ?? '';
        return obj;
      },
      {} as Record<string, unknown>,
    ),
  );

  return { headers, rows, rowCount: rows.length, columnCount: headers.length };
}

export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv') return 'text/csv';
  if (['xlsx', 'xls'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
}

export function isSupported(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['csv', 'xlsx', 'xls'].includes(ext);
}
