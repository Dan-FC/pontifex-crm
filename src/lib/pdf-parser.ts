const pdfParse = require("pdf-parse");

// ─── Interface ────────────────────────────────────────────────────────────────
// saldo_anterior / saldo_final eliminados intencionalmente.
// El análisis ahora se centra en depósitos (ingresos) y retiros (egresos).
export interface ParsedBankStatement {
    ingresos_totales: string;  // Suma de depósitos / abonos
    egresos_totales: string;   // Suma de retiros / cargos
    movimientos: Array<{
        fecha: string;
        descripcion: string;
        monto: string;
        tipo: "ingreso" | "egreso";
    }>;
    rawText: string;
}

// ─── Extracción de texto del PDF ──────────────────────────────────────────────
/**
 * Extrae el texto del buffer PDF usando pdf-parse.
 * Si el resultado es insuficiente (<100 chars) retorna lo que haya.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        if (data.text && data.text.trim().length > 100) {
            return data.text;
        }
        console.log("Poco texto extraído por pdf-parse. Retornando texto disponible.");
        return data.text || "NO_TEXT_FOUND";
    } catch (error: any) {
        console.error("Error leyendo PDF:", error);
        throw new Error(`No se pudo leer el PDF. Detalle: ${error.message || error}`);
    }
}

// ─── Parsing de movimientos y totales ────────────────────────────────────────
/**
 * Analiza el texto crudo del estado de cuenta en 3 capas:
 *
 * Capa 1 — Frase explícita (ej. "Total Depósitos: $1,200.00")
 *   Busca etiquetas estándar de los bancos mexicanos.
 *
 * Capa 2 — Suma de movimientos clasificados
 *   Detecta líneas individuales con fecha + descripción + monto.
 *   Clasifica como ingreso si la descripción contiene palabras clave de abono,
 *   como egreso si contiene palabras de cargo.
 *
 * Capa 3 — Fallback
 *   Si ninguna capa detecta valores, retorna "0.00".
 */
export function parseBankStatementData(text: string): ParsedBankStatement {
    const result: ParsedBankStatement = {
        ingresos_totales: "No detectado",
        egresos_totales: "No detectado",
        movimientos: [],
        rawText: text,
    };

    // ── Capa 1: totales explícitos en el documento ───────────────────────────
    // Patrones que usan los principales bancos mexicanos para resúmenes de depósitos:
    // "Total Abonos", "Total Depósitos", "Depósitos", "Abonos", "Total Créditos"
    const ingresosExplicit = text.match(
        /(?:total\s+(?:abonos|dep[oó]sitos|cr[eé]ditos)|dep[oó]sitos\s+totales|total\s+ingresos|abonos)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i
    );
    if (ingresosExplicit) result.ingresos_totales = ingresosExplicit[1];

    // Patrones para retiros / cargos:
    // "Total Cargos", "Total Retiros", "Retiros Totales", "Total Débitos"
    const egresosExplicit = text.match(
        /(?:total\s+(?:cargos|retiros|d[eé]bitos)|retiros\s+totales|total\s+egresos|cargos)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i
    );
    if (egresosExplicit) result.egresos_totales = egresosExplicit[1];

    // ── Capa 2: extracción de movimientos individuales ───────────────────────
    // Formato esperado: DD/MM/YYYY  Descripción  $1,234.56
    // También acepta: DD-MM-YYYY y montos sin signo $
    const movRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\s+(.{5,80}?)\s+\$?([\d,]+\.\d{2})/g;
    let m: RegExpExecArray | null;

    // Palabras clave que indican que un movimiento es un EGRESO (cargo/retiro)
    const egresoKeywords = [
        "pago", "retiro", "cargo", "comisi[oó]n", "enviado", "spei env",
        "traspaso sal", "d[eé]bito", "compra", "disposici[oó]n",
        "transferencia env", "impuesto", "iva", "isr",
    ];
    // Palabras clave que indican INGRESO (depósito/abono)
    const ingresoKeywords = [
        "dep[oó]sito", "abono", "recibido", "spei rec", "cr[eé]dito",
        "transferencia rec", "n[oó]mina", "ingreso",
    ];

    const egresoRe = new RegExp(egresoKeywords.join("|"), "i");
    const ingresoRe = new RegExp(ingresoKeywords.join("|"), "i");

    while ((m = movRegex.exec(text)) !== null) {
        const desc = m[2].trim();
        let tipo: "ingreso" | "egreso" = "egreso"; // default conservador

        if (ingresoRe.test(desc)) tipo = "ingreso";
        else if (egresoRe.test(desc)) tipo = "egreso";
        // Si no coincide con ninguna keyword, se deja como egreso (conservador)

        result.movimientos.push({
            fecha: m[1],
            descripcion: desc,
            monto: m[3],
            tipo,
        });
    }

    // ── Capa 3: fallback — suma de movimientos si no se detectó explícito ────
    if (result.ingresos_totales === "No detectado" && result.movimientos.length > 0) {
        const sum = result.movimientos
            .filter(mv => mv.tipo === "ingreso")
            .reduce((acc, mv) => acc + parseFloat(mv.monto.replace(/,/g, "")), 0);
        result.ingresos_totales = sum > 0 ? sum.toFixed(2) : "0.00";
    }

    if (result.egresos_totales === "No detectado" && result.movimientos.length > 0) {
        const sum = result.movimientos
            .filter(mv => mv.tipo === "egreso")
            .reduce((acc, mv) => acc + parseFloat(mv.monto.replace(/,/g, "")), 0);
        result.egresos_totales = sum > 0 ? sum.toFixed(2) : "0.00";
    }

    return result;
}

// ─── Generación del reporte TXT ───────────────────────────────────────────────
export function generateTxtReport(
    fileName: string,
    data: ParsedBankStatement,
    caseId: string
): string {
    const dateStr = new Date().toISOString().split("T")[0];
    const movTotal = data.movimientos.length;
    const movIngresos = data.movimientos.filter(m => m.tipo === "ingreso").length;
    const movEgresos = data.movimientos.filter(m => m.tipo === "egreso").length;

    let txt = `=======================================\n`;
    txt += `REPORTE DE ESTADO DE CUENTA — PONTIFEX\n`;
    txt += `=======================================\n`;
    txt += `Archivo:        ${fileName}\n`;
    txt += `Fecha proceso:  ${dateStr}\n`;
    txt += `ID caso:        ${caseId}\n\n`;

    txt += `--- RESUMEN FINANCIERO ---\n`;
    txt += `Ingresos (Depósitos):  $${data.ingresos_totales}\n`;
    txt += `Egresos  (Retiros):    $${data.egresos_totales}\n`;
    txt += `Movimientos detectados: ${movTotal} total (${movIngresos} ingresos / ${movEgresos} egresos)\n\n`;

    txt += `--- MOVIMIENTOS INDIVIDUALES ---\n`;
    if (data.movimientos.length === 0) {
        txt += `(No se detectaron movimientos con el formato esperado)\n`;
    } else {
        data.movimientos.forEach(mv => {
            const tipo = mv.tipo === "ingreso" ? "INGRESO" : "EGRESO ";
            txt += `${mv.fecha} | ${tipo} | $${mv.monto.padStart(12)} | ${mv.descripcion}\n`;
        });
    }

    txt += `\n=======================================\n`;
    txt += `Generado por Nexus Pontifex\n`;
    txt += `=======================================\n`;

    return txt;
}

