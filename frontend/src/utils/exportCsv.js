// src/utils/exportCsv.js
export function formatDateForFilename(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

/**
 * Xuất CSV thân thiện Excel (UTF-8 BOM), hỗ trợ:
 * - columns: [{ label: 'Tiêu đề', key?: 'field', value?: (row, idx) => any }]
 * - delimiter: mặc định ';' (phổ biến ở Excel VN). Có thể truyền ',' nếu muốn.
 * - summaryRow: mảng giá trị cùng số cột với header (ví dụ: ['', 'TỔNG', '', 100, 20, 80, ''])
 */
export function exportCsv(filename, data, {
  columns = [],
  delimiter = ';',
  bom = true,
  eol = '\r\n',
  summaryRow = null,
} = {}) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Cần truyền columns (mảng) với label và key/value mapper.');
  }
  if (!Array.isArray(data)) data = [];

  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    // Nếu có dấu phân cách, ngoặc kép, xuống dòng → bọc trong ngoặc kép
    return (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)) ? `"${s}"` : s;
  };

  // Header
  const header = columns.map(c => esc(c.label ?? '')).join(delimiter);

  // Rows
  const lines = data.map((row, idx) => {
    const cells = columns.map(col => {
      const val = typeof col.value === 'function'
        ? col.value(row, idx)
        : (col.key ? row[col.key] : '');
      return esc(val);
    });
    return cells.join(delimiter);
  });

  if (Array.isArray(summaryRow) && summaryRow.length === columns.length) {
    lines.push(summaryRow.map(esc).join(delimiter));
  }

  const content = [header, ...lines].join(eol);
  const blobParts = bom ? ['\uFEFF', content] : [content];
  const blob = new Blob(blobParts, { type: 'text/csv;charset=utf-8;' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Gợi ý tạo tên file: */
export function makeCsvFilename(prefix = 'bao-cao') {
  return `${prefix}_${formatDateForFilename(new Date())}.csv`;
}
