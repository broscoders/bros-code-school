// xlsx is loaded on demand (not in the main bundle) - it's a large
// library and most people visiting any given page will never click
// "Export to Excel" on it, so there's no reason to make everyone pay for
// it on every page load.
async function loadXLSX() {
  return import("xlsx");
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

// data: array of plain objects; columns: which keys to include, in order,
// with a human-readable header. Triggers a browser download directly -
// no server round-trip needed since the data is already loaded client-side.
export async function exportToExcel(filename: string, sheetName: string, columns: ExcelColumn[], data: Record<string, unknown>[]) {
  const XLSX = await loadXLSX();
  const rows = data.map((row) => {
    const out: Record<string, unknown> = {};
    columns.forEach((col) => {
      out[col.header] = row[col.key] ?? "";
    });
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns.map((c) => c.header) });
  worksheet["!cols"] = columns.map((c) => ({ wch: c.width || 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)); // Excel sheet-name limit
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// For a monthly attendance register: students as rows, each day of the
// month as its own column (P/A/L/-), matching the paper-register format
// schools already know, so it's usable printed out at month-end.
export async function exportAttendanceRegister(
  filename: string,
  sheetName: string,
  students: { name: string; admissionNumber: string }[],
  daysInMonth: number,
  // attendanceMap[studentIndex][day] = "P" | "A" | "L" | "" 
  attendanceMap: string[][]
) {
  const XLSX = await loadXLSX();
  const header = ["Admission #", "Name", ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))];
  const rows = students.map((s, i) => [
    s.admissionNumber,
    s.name,
    ...Array.from({ length: daysInMonth }, (_, d) => attendanceMap[i]?.[d] || ""),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet["!cols"] = [{ wch: 14 }, { wch: 22 }, ...Array.from({ length: daysInMonth }, () => ({ wch: 4 }))];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
