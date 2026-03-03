import path from "path";
import fs from "fs/promises";

const XlsxPopulate = require("xlsx-populate");

const TEMPLATE_PATH = path.join(process.cwd(), "template", "CUENTAS.xlsx");
const EXPORTS_DIR = path.join(process.cwd(), "exports");

const MESES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export interface ExcelFillResult {
    outputPath: string;
    filename: string;
    rowFilled: number;
    cellD: string;
    cellE: string;
}

/**
 * Creates a copy of CUENTAS.xlsx, locates the row matching (año, mes),
 * writes saldoAnterior → D and saldoFinal → E, and saves the file.
 *
 * Handles merged cells by carrying forward the last non-null value seen
 * in columns B (year) and C (month) as we scan downward.
 */
export async function generateExcelFromTemplate(
    caseId: string,
    año: number,
    mes: string,
    saldoAnterior: number,
    saldoFinal: number
): Promise<ExcelFillResult> {
    // Verify template exists
    await fs.access(TEMPLATE_PATH);

    // Ensure exports dir exists
    await fs.mkdir(EXPORTS_DIR, { recursive: true });

    // Load the workbook from the template (preserves all styles/formats)
    const wb = await XlsxPopulate.fromFileAsync(TEMPLATE_PATH);

    // Normalize month string (trim + capitalize)
    const mesNorm = mes.trim().charAt(0).toUpperCase() + mes.trim().slice(1).toLowerCase();
    if (!MESES_ES.includes(mesNorm)) {
        throw new Error(`Mes no válido: "${mes}". Usa uno de: ${MESES_ES.join(", ")}`);
    }

    let targetRow: number | null = null;
    let targetSheet: any = null;

    for (let si = 0; si < wb.sheets().length; si++) {
        const sheet = wb.sheet(si);

        // Carry-forward: merged cells return undefined for sub-cells,
        // so we keep the last seen non-null value in each column.
        let lastAño: any = null;
        let lastMes: any = null;

        for (let r = 1; r <= 300; r++) {
            const rawB = sheet.cell("B" + r).value();
            const rawC = sheet.cell("C" + r).value();

            // Update carry-forward when we see real content
            if (rawB !== null && rawB !== undefined && rawB !== "") lastAño = rawB;
            if (rawC !== null && rawC !== undefined && rawC !== "") lastMes = rawC;

            // Match year — accept number or string representation
            const añoMatch =
                lastAño === año ||
                String(lastAño).trim() === String(año);

            // Match month — case-insensitive
            const mesMatch =
                typeof lastMes === "string" &&
                lastMes.trim().toLowerCase() === mesNorm.toLowerCase();

            if (añoMatch && mesMatch) {
                targetRow = r;
                targetSheet = sheet;
                break;
            }
        }

        if (targetRow) break;
    }

    if (!targetRow || !targetSheet) {
        throw new Error(
            `No se encontró la fila del año ${año} / mes "${mesNorm}" en la plantilla CUENTAS.xlsx. ` +
            `Verifica que el template tenga filas para ese año y mes.`
        );
    }

    // Write values
    targetSheet.cell("D" + targetRow).value(saldoAnterior);
    targetSheet.cell("E" + targetRow).value(saldoFinal);

    // Save as new file — never overwrite the template
    const datestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `CUENTAS_${caseId}_${datestamp}.xlsx`;
    const outputPath = path.join(EXPORTS_DIR, filename);

    await wb.toFileAsync(outputPath);

    return {
        outputPath,
        filename,
        rowFilled: targetRow,
        cellD: `D${targetRow}`,
        cellE: `E${targetRow}`,
    };
}
