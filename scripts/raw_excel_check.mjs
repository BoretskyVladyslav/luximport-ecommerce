import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Read the first row directly to see if headers are actually there but skipped by sheet_to_json
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log("Sheet range:", worksheet['!ref']);

    for (let R = range.s.r; R <= Math.min(range.e.r, 5); R++) {
        let row = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            let cell_address = { c: C, r: R };
            let cell_ref = XLSX.utils.encode_cell(cell_address);
            row.push(worksheet[cell_ref] ? worksheet[cell_ref].v : null);
        }
        console.log(`Row ${R}:`, JSON.stringify(row));
    }
} catch (err) {
    console.error('Error:', err.message);
}
