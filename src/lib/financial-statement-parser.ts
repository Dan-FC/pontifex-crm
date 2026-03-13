// ── src/lib/financial-statement-parser.ts ────────────────────────────────────
// OCR parser para Balance General y Estado de Resultados.
// Extrae los campos clave para TODOS los períodos del documento.

const pdfParse = require("pdf-parse");

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BalanceGeneral {
    activoCirculante: number | null;
    inventarios: number | null;
    clientes: number | null;
    deudoresDiversos: number | null;
    activoFijo: number | null;
    terrenosEdificios: number | null;
    maquinariaEquipo: number | null;
    equipoTransporte: number | null;
    otrosActivos: number | null;
    intangibles: number | null;
    activoTotal: number | null;
    pasivoCirculante: number | null;
    proveedores: number | null;
    acreedoresDiversos: number | null;
    docsPagarCP: number | null;
    pasivoLargoPlazo: number | null;
    docsPagarLP: number | null;
    otrosPasivos: number | null;
    pasivoTotal: number | null;
    capitalSocial: number | null;
    utilidadesAnteriores: number | null;
    capitalContable: number | null;
}

export interface EstadoResultados {
    ventas: number | null;
    costoVenta: number | null;
    utilidadBruta: number | null;
    gastosOperacion: number | null;
    utilidadOperacion: number | null;
    gastosFinancieros: number | null;
    otrosProductos: number | null;
    otrosGastos: number | null;
    utilidadAntesImpuestos: number | null;
    impuestos: number | null;
    depreciacion: number | null;
    utilidadNeta: number | null;
}

export interface KPIs {
    // Liquidez
    liquidezCirculante: number | null;
    capitalTrabajo: number | null;
    pruebaAcido: number | null;
    // Actividad
    rotacionCxC: number | null;
    rotacionCxP: number | null;
    rotacionInventarios: number | null;
    // Rentabilidad
    margenOperativo: number | null;
    margenUtilidad: number | null;
    roa: number | null;
    roe: number | null;
    // Endeudamiento
    deudaTotal: number | null;
    deudaCapital: number | null;
    deudaLP: number | null;
}

export interface FinancialPeriod {
    periodo: string;
    balanceGeneral: BalanceGeneral;
    estadoResultados: EstadoResultados;
    kpis: KPIs;
}

export interface ParsedFinancialStatement {
    periodos: string[];
    periodData: FinancialPeriod[];
    rawText: string;
    // Backward-compat: most recent period
    balanceGeneral: BalanceGeneral;
    estadoResultados: EstadoResultados;
    kpis: KPIs;
}

// ─── Patrones de etiquetas ────────────────────────────────────────────────────
// Basados en "Conceptos Edo Resultados _ BG.pdf" — cubre todas las variantes
// que distintas empresas/contadores pueden usar en sus estados financieros.

const PATTERNS: Record<string, RegExp> = {
    // ── Activo ─────────────────────────────────────────────────────────────────
    activoCirculante:
        /\bactivo\s*(?:circulante|corriente|a\s*corto\s*plazo|disponible|realizable)\b|activos?\s*(?:circulantes?|corrientes?|realizables?)/i,

    inventarios:
        /\binventarios?\b|\bexistencias\b|mercanc[íi]as?(?:\s*en\s*almac[eé]n)?|\balmac[eé]n\b|productos?\s*terminados?|inventario\s*(?:de\s*mercanc[íi]a|final|de\s*productos?)/i,

    clientes:
        /\bclientes?\b(?!\s*potenciales?|\s*morosos?)|cuentas?\s*por\s*cobrar(?!\s*diversas?)(?:\s*clientes?)?|cartera\s*de\s*clientes?|clientes?\s*(?:nacionales?|extranjeros?|comerciales?)|documentos?\s*por\s*cobrar(?!\s*(?:largo|corto))/i,

    deudoresDiversos:
        /deudores?\s*diversos?|deudores?\s*varios?|otros?\s*deudores?|cuentas?\s*por\s*cobrar\s*diversas?|anticipos?\s*a\s*empleados?|pr[eé]stamos?\s*a\s*empleados?/i,

    activoFijo:
        /\bactivo\s*(?:fijo|no\s*corriente|de\s*largo\s*plazo)\b|activos?\s*(?:fijos?|no\s*corrientes?|de\s*largo\s*plazo)|propiedad[\s,]*planta\s*y\s*equipo|\bppe\b/i,

    // ── Cuidado: terrenos solos sin "y edificios" para evitar confusión con "Terrenos y Edificios"
    terrenosEdificios:
        /terrenos?\s*y\s*(?:edificios?|edificaci[oó]n)|terrenos?\s*[,y]\s*(?:edificios?|edificaci[oó]n)|\binmuebles?\b|bienes?\s*inmuebles?|\bpropiedades?\b/i,

    maquinariaEquipo:
        /maquinaria\s*y\s*equipo|\bmaquinaria\b(?!\s*de\s*transporte)|equipo\s*(?:industrial|de\s*producci[oó]n|operativo)/i,

    equipoTransporte:
        /equipo\s*de\s*transporte|veh[íi]culos?(?:\s*de\s*empresa)?|\bflotilla\b/i,

    otrosActivos:
        /\botros?\s*activos?\b(?!\s*no\s*corrientes?|\s*fijos?|\s*de\s*largo)|activos?\s*(?:varios?|diversos?)|activo\s*diferido\b/i,

    intangibles:
        /\bintangibles?\b|activos?\s*intangibles?|registro\s*de\s*marca|\bpatentes?\b|\blicencias?\b|\bgoodwill\b|\bmarcas?\b|\bsoftware\b/i,

    activoTotal:
        /\bactivo\s*total\b|total\s*(?:de\s*)?activo\b|activos?\s*totales?|suma\s*del\s*activo|activo\s*(?:consolidado\s*total|total\s*neto|total\s*consolidado|total\s*al\s*cierre)|total\s*general\s*(?:de\s*)?activos?|total\s*activo\s*consolidado/i,

    // ── Pasivo ─────────────────────────────────────────────────────────────────
    pasivoCirculante:
        /\bpasivo\s*(?:circulante|corriente|a\s*corto\s*plazo)\b|pasivos?\s*(?:corrientes?|circulantes?)/i,

    proveedores:
        /\bproveedores?\b|cuentas?\s*por\s*pagar(?!\s*diversas?)(?:\s*proveedores?)?|proveedores?\s*nacionales?|acreedores?\s*comerciales?/i,

    acreedoresDiversos:
        /acreedores?\s*div(?:ersos?)?|otros?\s*acreedores?|acreedores?\s*varios?|cuentas?\s*por\s*pagar\s*diversas?|filiales?\s*acreedores?|impuestos?\s*por\s*pagar\b/i,

    docsPagarCP:
        /docs?\.?\s*(?:x|por)\s*pagar\s*c\.?p\.?\b|docs?\.?\s*(?:x|por)\s*pagar\s*corto\s*plazo|documentos?\s*por\s*pagar\s*(?:a\s*)?corto\s*plazo|documentos?\s*comerciales?\s*por\s*pagar|pagar[eé]s?\b|cr[eé]ditos?\s*bancarios?\s*c\.?p\.?\b/i,

    pasivoLargoPlazo:
        /\bpasivo\s*(?:largo\s*plazo|a\s*largo\s*plazo|no\s*corriente|l\.?\s*p\.?)\b|pasivos?\s*(?:no\s*corrientes?|largo\s*plazo|l\.?\s*p\.?)|deuda\s*a\s*largo\s*plazo|obligaciones?\s*a\s*largo\s*plazo|\bpasivo\s+lp\b/i,

    docsPagarLP:
        /docs?\.?\s*(?:x|por)\s*pagar\s*l\.?p\.?\b|docs?\.?\s*(?:x|por)\s*pagar\s*largo\s*plazo|documentos?\s*por\s*pagar\s*(?:a\s*)?(?:largo\s*plazo|l\.?\/?p\.?)\b|cr[eé]ditos?\s*bancarios?\s*l\.?p\.?\b|pr[eé]stamos?\s*bancarios?\s*l\.?p\.?\b|financiamiento\s*a\s*largo\s*plazo|\bhip[oó]teca\b/i,

    otrosPasivos:
        /\botros?\s*pasivos?\b(?!\s*corrientes?|\s*no\s*corrientes?)|pasivos?\s*(?:diversos?|acumulados?)/i,

    pasivoTotal:
        /\bpasivo\s*total\b|total\s*(?:de\s*)?pasivo\b|pasivos?\s*totales?|suma\s*del\s*pasivo|total\s*general\s*(?:del?\s*)?pasivos?|total\s*pasivo\s*consolidado/i,

    // ── Capital ────────────────────────────────────────────────────────────────
    capitalSocial:
        /capital\s*(?:social|suscrito(?:\s*y\s*pagado)?|pagado|aportado|fijo|variable|de\s*los?\s*socios?)|aportaciones?\s*de\s*socios?/i,

    utilidadesAnteriores:
        /ut(?:ilidades?)?\s*(?:de\s*)?ejercicios?\s*(?:anteriores?|anterioes?)|utilidades?\s*(?:acumuladas?|retenidas?|no\s*distribuidas?)|resultados?\s*(?:acumulados?(?:\s*de\s*a[ñn]os?\s*anteriores?)?|de\s*ejercicios?\s*anteriores?|ejercicios?\s*ant(?:eriores?)?\b)|ganancias?\s*retenidas?|beneficios?\s*acumulados?/i,

    // Nota: no incluye "capital social" para no chocar con el campo capitalSocial
    capitalContable:
        /\bcapital\s*contable\b(?!\s*[+y])|total\s*capital(?:\s*contable)?\b|capital\s*total\b|total\s*patrimonio\b|\bpatrimonio(?:\s*neto|\s*contable|\s*de\s*(?:los?\s*)?accionistas?)?\b|capital\s*y\s*reservas\b/i,

    // ── Estado de Resultados ───────────────────────────────────────────────────
    ventas:
        /\bventas?\s*netas?\b|\bventas?\s*totales?\b|\bventas?\b(?!\s*(?:de|del)\s*(?:mercanc|producci|costo|administr))|total\s*de\s*ingresos?\b|\bingresos?\s*(?:netos?|totales?|por\s*ventas?|operativos?|de\s*operaci[oó]n|de\s*operaciones?)?(?!\s*(?:financieros?|no\s*operativos?|diversos?|extraordinarios?))(?!\s*otros?)|\bfacturaci[oó]n\b/i,

    costoVenta:
        /costos?\s*(?:de\s*)?(?:venta|ventas?|producci[oó]n|mercanc[íi]a\s*vendida|bienes?\s*vendidos?|productos?\s*vendidos?)|costo\s*directo(?:\s*de\s*(?:venta|ventas?|producci[oó]n|fabricaci[oó]n))?|costo\s*de\s*fabricaci[oó]n/i,

    utilidadBruta:
        /ut\.?\s*(?:ilidad)?\s*bruta\b|resultado\s*bruto\b|ganancia\s*bruta\b|margen\s*bruto\b|beneficio\s*bruto\b/i,

    gastosOperacion:
        /gastos?\s*(?:de\s*)?(?:op(?:eraci[oó]n(?:al|es)?|erativos?)?|administraci[oó]n(?:\s*y\s*ventas?)?|ventas?\s*y\s*administraci[oó]n|ventas?\b|generales?\b)|gastos?\s*operativos?\b|gastos?\s*operacionales?\b/i,

    utilidadOperacion:
        /ut\.?\s*(?:ilidad)?\s*(?:de\s*)?op(?:eraci[oó]n(?:al|es)?)?\b|utilidad\s*operativa\b|resultado\s*operativo\b|ganancia\s*operativa\b|beneficio\s*operativo\b|\bebit\b/i,

    gastosFinancieros:
        /gastos?\s*fin\.?(?:ancieros?)?\b|intereses?\s*(?:pagados?|a\s*cargo)|gastos?\s*por\s*intereses?\b|cargos?\s*financieros?\b|costo\s*financiero\b/i,

    otrosProductos:
        /otros?\s*productos?\b|otros?\s*ingresos?\b(?!\s*de\s*operaci)|ingresos?\s*(?:no\s*operativos?|diversos?|extraordinarios?)/i,

    otrosGastos:
        /otros?\s*gastos?\b(?!\s*de\s*operaci)|gastos?\s*(?:no\s*operativos?|diversos?|extraordinarios?)|otros?\s*egresos?\b/i,

    utilidadAntesImpuestos:
        /ut\.?\s*(?:ilidad)?\s*antes?\s*(?:de\s*)?(?:imp(?:uestos?)?|isr)\b|resultado\s*antes?\s*de\s*impuestos?(?:\s*(?:sobre\s*la\s*renta|a\s*la\s*utilidad))?\b|ganancia\s*antes?\s*de\s*impuestos?\b/i,

    impuestos:
        /\bimpuestos?\s*(?:a\s*la\s*utilidad|sobre\s*la\s*renta|del\s*ejercicio)?\b|\bisr\b|\bcarga\s*fiscal\b/i,

    depreciacion:
        /depreciaci[oó]\s*n(?:\s*y\s*amortizaci[oó]\s*n)?(?:\s*(?:del?\s*ejercicio|del?\s*periodo?|de\s*activos?|acumulada))?|\bamortizaci[oó]\s*n\b/i,

    utilidadNeta:
        /ut\.?\s*(?:ilidad)?\s*neta\b|resultado\s*(?:neto\b|del\s*ejercicio\b)|ganancia\s*neta\b|beneficio\s*neto\b|utilidad\s*del\s*periodo?\b/i,
};

// ─── Pre-procesador ───────────────────────────────────────────────────────────

/**
 * Normaliza líneas del PDF para facilitar el matching de patrones:
 *   1. Separa amounts de porcentajes: "800,00016.00%" → "800,000 16.00% "
 *   2. Añade espacio entre letra y dígito: "Inventarios800,000" → "Inventarios 800,000"
 */
function preprocessText(text: string): string {
    let result = text.replace(/(\d{1,3}(?:,\d{3})*)(\d{1,3}(?:\.\d{1,2})?%)/g, "$1 $2 ");
    // Add space between letter→digit AND digit→letter so word boundaries work
    // when labels and amounts are concatenated without spaces (e.g. "5,000.00Proveedores$155,000")
    result = result.replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])(\d)/g, "$1 $2");
    result = result.replace(/(\d)([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, "$1 $2");
    return result;
}

/**
 * Detecta PDFs con formato "bloque-etiquetas / bloque-valores" (columnas separadas).
 * pdftotext extrae primero todas las etiquetas del bloque y luego los valores,
 * separados por líneas en blanco. Este pre-procesador los empareja posicionalmente:
 *
 *   Activo Circulante          →   Activo Circulante $334,002,705.00
 *   Clientes                   →   Clientes $170,601,800.00
 *   [blank]
 *   $334,002,705.00
 *   $170,601,800.00
 *
 * Solo actúa cuando un párrafo de puras etiquetas va seguido de un párrafo de puros montos.
 */
function pairLabelsWithValues(text: string): string {
    const valueLine = /^-?\$?\s*[\d,]+(?:\.\d+)?$/;

    const paragraphs = text.split(/\n[ \t]*\n/).map(p => p.trim()).filter(p => p);

    function isValueParagraph(para: string): boolean {
        const lines = para.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        return lines.length > 0 && lines.every(l => valueLine.test(l));
    }

    function splitLines(para: string): string[] {
        return para.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    }

    // Some PDFs place single-line "section total" labels (e.g. "Suma del activo")
    // BETWEEN a multi-line label block and its value block.  We collect them as
    // "deferred" labels and pair them with the value paragraphs that follow the
    // main value block.
    const consumed = new Set<number>();
    const result: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
        if (consumed.has(i)) continue;
        if (isValueParagraph(paragraphs[i])) continue; // orphan value — skip

        const labelLines = splitLines(paragraphs[i]);

        // Collect interstitial single-line non-value paragraphs that appear
        // immediately before a value block (they are deferred labels).
        const deferred: { idx: number; line: string }[] = [];
        let j = i + 1;
        while (
            j < paragraphs.length &&
            !consumed.has(j) &&
            !isValueParagraph(paragraphs[j])
        ) {
            const jLines = splitLines(paragraphs[j]);
            // Only treat as deferred if it is a single line AND the very next
            // paragraph is a value block (so pairing is unambiguous).
            if (
                jLines.length === 1 &&
                j + 1 < paragraphs.length &&
                !consumed.has(j + 1) &&
                isValueParagraph(paragraphs[j + 1])
            ) {
                deferred.push({ idx: j, line: jLines[0] });
                j++;
            } else {
                break;
            }
        }

        if (j < paragraphs.length && !consumed.has(j) && isValueParagraph(paragraphs[j])) {
            // Pair main label block with value block at j
            const valueLines = splitLines(paragraphs[j]);
            consumed.add(j);
            for (const d of deferred) consumed.add(d.idx);

            for (let k = 0; k < Math.max(labelLines.length, valueLines.length); k++) {
                result.push(`${labelLines[k] ?? ""} ${valueLines[k] ?? ""}`.trim());
            }

            // Pair each deferred label with the next available value paragraph
            let vIdx = j + 1;
            for (const d of deferred) {
                while (vIdx < paragraphs.length && consumed.has(vIdx)) vIdx++;
                if (vIdx < paragraphs.length && !consumed.has(vIdx) && isValueParagraph(paragraphs[vIdx])) {
                    const vLines = splitLines(paragraphs[vIdx]);
                    consumed.add(vIdx);
                    for (let k = 0; k < Math.max(1, vLines.length); k++) {
                        result.push(`${d.line} ${vLines[k] ?? ""}`.trim());
                    }
                    vIdx++;
                } else {
                    result.push(d.line);
                }
            }
        } else {
            result.push(...labelLines);
        }
    }

    return result.join("\n");
}

// ─── Extractor de amounts ─────────────────────────────────────────────────────

// Detiene la extracción al encontrar la siguiente etiqueta (≥6 letras seguidas).
const LABEL_STOP_RE = /(?<![,\d])[A-Za-záéíóúÁÉÍÓÚüÜñÑ]{6,}/;

/**
 * Extrae valores financieros del texto hasta el próximo label-word.
 * Devuelve los amounts en orden de aparición.
 */
function extractAmounts(text: string): number[] {
    const stop = LABEL_STOP_RE.exec(text);
    const region = stop ? text.slice(0, stop.index) : text;

    const found: Array<{ index: number; value: number }> = [];
    let m: RegExpExecArray | null;

    // Negativos en paréntesis: (1,234,567)
    const negParenRe = /\(\s*(\d{1,3}(?:,\d{3})+|\d{4,})\s*\)/g;
    while ((m = negParenRe.exec(region)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(val) && val >= 100) found.push({ index: m.index, value: -val });
    }

    // Negativos con signo: -$1,234,567 o -1,234,567
    const negSignRe = /-\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{4,})/g;
    while ((m = negSignRe.exec(region)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(val) && val >= 100) found.push({ index: m.index, value: -val });
    }

    // Positivos: número con comas (miles) o 4+ dígitos, no precedido de - ni (, no seguido de % ni )
    const posRe = /(?<![-\(])\b(\d{1,3}(?:,\d{3})+|\d{4,})\b(?!\s*%|\.\d+%|\s*\))/g;
    while ((m = posRe.exec(region)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(val) && val >= 100 && !(val >= 1900 && val <= 2100)) {
            found.push({ index: m.index, value: val });
        }
    }

    return found.sort((a, b) => a.index - b.index).map(f => f.value);
}

// ─── findFieldAll ─────────────────────────────────────────────────────────────

/**
 * Busca un campo usando ventana deslizante y devuelve los valores de TODOS los períodos.
 * El PDF tiene N columnas de valores por fila (una por período).
 *
 * @param precedingExclude  Si el texto ANTES del match (en la ventana o en las 2 líneas
 *                          anteriores) coincide con este patrón, se descarta el match.
 *                          Útil para evitar falsos positivos ("impuestos" dentro de
 *                          "UT. Antes de impuestos").
 */
function findFieldAll(
    rawLines: string[],
    pattern: RegExp,
    numPeriods: number,
    precedingExclude?: RegExp,
): (number | null)[] {
    const lines = rawLines.map(preprocessText);
    const empty: (number | null)[] = Array(numPeriods).fill(null);

    for (let i = 0; i < lines.length; i++) {
        for (let w = 1; w <= 4 && i + w <= lines.length; w++) {
            const window = lines.slice(i, i + w).join(" ");
            const match = pattern.exec(window);
            if (!match) continue;

            // Si el contexto anterior contiene una cadena que invalida este match, saltar
            if (precedingExclude) {
                const beforeMatch = window.slice(0, match.index);
                const prevLines  = lines.slice(Math.max(0, i - 2), i).join(" ");
                if (precedingExclude.test(beforeMatch) || precedingExclude.test(prevLines)) {
                    break; // descartar esta posición i, probar la siguiente
                }
            }

            const afterLabel = window.slice(match.index + match[0].length);
            let amounts = extractAmounts(afterLabel);

            if (amounts.length === 0 && i + w < lines.length) {
                const nextText = lines.slice(i + w, i + w + 8).join(" ");
                amounts = extractAmounts(nextText);
            }

            if (amounts.length > 0) {
                return Array.from({ length: numPeriods }, (_, p) =>
                    p < amounts.length ? amounts[p] : null
                );
            }

            if (w > 1) break;
        }
    }
    return empty;
}

// ─── Detectar períodos ────────────────────────────────────────────────────────

function detectPeriodos(text: string): string[] {
    const seen = new Set<string>();
    const yearsInFullDates = new Set<string>();
    for (const m of text.matchAll(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/g)) {
        seen.add(m[0]);
        yearsInFullDates.add(m[0].slice(-4));
    }
    // Only add bare years if not already covered by a full date
    for (const m of text.matchAll(/\b(20\d{2})\b/g)) {
        if (!yearsInFullDates.has(m[1])) seen.add(m[1]);
    }
    return [...seen].slice(0, 4);
}

// ─── Parser Principal ─────────────────────────────────────────────────────────

export function parseFinancialStatement(text: string): ParsedFinancialStatement {
    // Pre-procesado: emparejar bloques de etiquetas con bloques de valores separados
    const paired = pairLabelsWithValues(text);
    const lines = paired.split(/\r?\n/).filter(l => l.trim().length > 0);
    const periodos = detectPeriodos(text);
    const numPeriods = Math.max(1, periodos.length);

    // Extract all field arrays (one value per period per field)
    const all: Record<string, (number | null)[]> = {};
    for (const [key, pattern] of Object.entries(PATTERNS)) {
        // "impuestos" aparece también dentro de "UT. Antes de impuestos" → excluir ese contexto
        const precedingExclude = key === "impuestos" ? /antes\s*de\s*$/i : undefined;
        all[key] = findFieldAll(lines, pattern, numPeriods, precedingExclude);
    }

    // Build per-period objects
    const periodData: FinancialPeriod[] = periodos.map((periodo, p) => {
        const bg: BalanceGeneral = {
            // Totales de sección: usar valor OCR si encontrado, deriveFields completa si null
            activoCirculante:    all.activoCirculante[p],
            activoFijo:          all.activoFijo[p],
            pasivoCirculante:    all.pasivoCirculante[p],
            pasivoLargoPlazo:    all.pasivoLargoPlazo[p],
            capitalContable:     null,  // siempre derivado (activo - pasivo)
            // Partidas individuales: del OCR
            inventarios:         all.inventarios[p],
            clientes:            all.clientes[p],
            deudoresDiversos:    all.deudoresDiversos[p],
            terrenosEdificios:   all.terrenosEdificios[p],
            maquinariaEquipo:    all.maquinariaEquipo[p],
            equipoTransporte:    all.equipoTransporte[p],
            otrosActivos:        all.otrosActivos[p],
            intangibles:         all.intangibles[p],
            activoTotal:         all.activoTotal[p],
            proveedores:         all.proveedores[p],
            acreedoresDiversos:  all.acreedoresDiversos[p],
            docsPagarCP:         all.docsPagarCP[p],
            docsPagarLP:         all.docsPagarLP[p],
            otrosPasivos:        all.otrosPasivos[p],
            pasivoTotal:         all.pasivoTotal[p],
            capitalSocial:       all.capitalSocial[p],
            utilidadesAnteriores:all.utilidadesAnteriores[p],
        };

        const er: EstadoResultados = {
            ventas:                 all.ventas[p],
            costoVenta:             all.costoVenta[p],
            utilidadBruta:          all.utilidadBruta[p],
            gastosOperacion:        all.gastosOperacion[p],
            utilidadOperacion:      all.utilidadOperacion[p],
            gastosFinancieros:      all.gastosFinancieros[p],
            otrosProductos:         all.otrosProductos[p],
            otrosGastos:            all.otrosGastos[p],
            utilidadAntesImpuestos: all.utilidadAntesImpuestos[p],
            impuestos:              all.impuestos[p],
            depreciacion:           all.depreciacion[p],
            utilidadNeta:           all.utilidadNeta[p],
        };

        deriveFields(bg, er);
        const kpis = calcularKPIs(bg, er);
        return { periodo, balanceGeneral: bg, estadoResultados: er, kpis };
    });

    // Backward-compat: expose most recent period at top level
    const last = periodData[periodData.length - 1];
    return {
        periodos,
        periodData,
        rawText: text,
        balanceGeneral: last?.balanceGeneral ?? emptyBG(),
        estadoResultados: last?.estadoResultados ?? emptyER(),
        kpis: last?.kpis ?? emptyKPIs(),
    };
}

// ─── Derivación por fórmulas contables ───────────────────────────────────────

function sumKnown(...vals: (number | null)[]): number {
    return vals.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function deriveFields(bg: BalanceGeneral, er: EstadoResultados): void {
    // ── Estado de Resultados ───────────────────────────────────────────────────
    if (er.utilidadBruta === null && er.ventas !== null && er.costoVenta !== null)
        er.utilidadBruta = er.ventas - er.costoVenta;
    if (er.costoVenta === null && er.ventas !== null && er.utilidadBruta !== null)
        er.costoVenta = er.ventas - er.utilidadBruta;
    if (er.utilidadOperacion === null && er.utilidadBruta !== null && er.gastosOperacion !== null)
        er.utilidadOperacion = er.utilidadBruta - er.gastosOperacion;
    if (er.gastosOperacion === null && er.utilidadBruta !== null && er.utilidadOperacion !== null)
        er.gastosOperacion = er.utilidadBruta - er.utilidadOperacion;
    if (er.utilidadAntesImpuestos === null && er.utilidadOperacion !== null)
        er.utilidadAntesImpuestos = er.utilidadOperacion
            - (er.gastosFinancieros ?? 0)
            + (er.otrosProductos ?? 0)
            - (er.otrosGastos ?? 0);
    if (er.utilidadNeta === null && er.utilidadAntesImpuestos !== null && er.impuestos !== null)
        er.utilidadNeta = er.utilidadAntesImpuestos - er.impuestos;

    // ── Balance General — Subtítulos: usar OCR si disponible, derivar solo como fallback ──
    // Activo Circulante = Inventarios + Clientes + Deudores Diversos
    if (bg.activoCirculante === null) {
        const parts = [bg.inventarios, bg.clientes, bg.deudoresDiversos];
        if (parts.some(v => v !== null))
            bg.activoCirculante = sumKnown(...parts);
    }
    // Activo Fijo = Terrenos + Maquinaria + Equipo Transporte
    if (bg.activoFijo === null) {
        const parts = [bg.terrenosEdificios, bg.maquinariaEquipo, bg.equipoTransporte];
        if (parts.some(v => v !== null))
            bg.activoFijo = sumKnown(...parts);
    }
    // Activo Total: si no está en el PDF, derivar
    if (bg.activoTotal === null) {
        const parts = [bg.activoCirculante, bg.activoFijo, bg.otrosActivos, bg.intangibles];
        if (parts.some(v => v !== null))
            bg.activoTotal = sumKnown(...parts);
    }
    // Pasivo Circulante = Proveedores + Acreedores + Docs CP
    if (bg.pasivoCirculante === null) {
        const parts = [bg.proveedores, bg.acreedoresDiversos, bg.docsPagarCP];
        if (parts.some(v => v !== null))
            bg.pasivoCirculante = sumKnown(...parts);
    }
    // Pasivo Largo Plazo = Docs LP + Otros Pasivos
    if (bg.pasivoLargoPlazo === null) {
        const parts = [bg.docsPagarLP, bg.otrosPasivos];
        if (parts.some(v => v !== null))
            bg.pasivoLargoPlazo = sumKnown(...parts);
    }
    // Pasivo Total: si no está en el PDF, derivar
    if (bg.pasivoTotal === null) {
        const parts = [bg.pasivoCirculante, bg.pasivoLargoPlazo];
        if (parts.some(v => v !== null))
            bg.pasivoTotal = sumKnown(...parts);
    }
    // Capital Contable: siempre por fórmula (el PDF tiene 2 ocurrencias, la primera es incorrecta)
    if (bg.activoTotal !== null && bg.pasivoTotal !== null)
        bg.capitalContable = bg.activoTotal - bg.pasivoTotal;
}

// ─── Cálculo de KPIs ──────────────────────────────────────────────────────────

function ratio(a: number | null, b: number | null, decimals = 2): number | null {
    if (a === null || b === null || b === 0) return null;
    return parseFloat((a / b).toFixed(decimals));
}

export function calcularKPIs(bg: BalanceGeneral, er: EstadoResultados): KPIs {
    return {
        // Liquidez
        liquidezCirculante: ratio(bg.activoCirculante, bg.pasivoCirculante),
        capitalTrabajo: bg.activoCirculante !== null && bg.pasivoCirculante !== null
            ? bg.activoCirculante - bg.pasivoCirculante : null,
        // Si no hay inventarios (empresa de servicios), se trata como 0 → prueba ácido = razón circulante
        pruebaAcido: bg.activoCirculante !== null
            ? ratio(bg.activoCirculante - (bg.inventarios ?? 0), bg.pasivoCirculante)
            : null,
        // Actividad
        rotacionCxC: ratio(er.ventas, bg.clientes),
        rotacionCxP: bg.proveedores !== null && er.costoVenta !== null
            ? ratio(bg.proveedores * 365, er.costoVenta)
            : null,
        rotacionInventarios: bg.inventarios !== null && er.costoVenta !== null
            ? ratio(bg.inventarios * 365, er.costoVenta)
            : null,
        // Rentabilidad
        margenOperativo: ratio(er.utilidadBruta, er.ventas),
        margenUtilidad: ratio(er.utilidadNeta, er.ventas),
        roa: ratio(er.utilidadNeta, bg.activoTotal),
        roe: ratio(er.utilidadNeta, bg.capitalContable),
        // Endeudamiento
        deudaTotal: ratio(bg.pasivoTotal, bg.activoTotal),
        deudaCapital: ratio(bg.pasivoTotal, bg.capitalContable),
        deudaLP: bg.pasivoLargoPlazo !== null && bg.activoTotal !== null && bg.pasivoTotal !== null
            ? ratio(bg.pasivoLargoPlazo, bg.activoTotal - bg.pasivoTotal)
            : null,
    };
}

// ─── Helpers para período vacío ───────────────────────────────────────────────

function emptyBG(): BalanceGeneral {
    return {
        activoCirculante: null, inventarios: null, clientes: null, deudoresDiversos: null,
        activoFijo: null, terrenosEdificios: null, maquinariaEquipo: null, equipoTransporte: null,
        otrosActivos: null, intangibles: null, activoTotal: null,
        pasivoCirculante: null, proveedores: null, acreedoresDiversos: null, docsPagarCP: null,
        pasivoLargoPlazo: null, docsPagarLP: null, otrosPasivos: null, pasivoTotal: null,
        capitalSocial: null, utilidadesAnteriores: null, capitalContable: null,
    };
}
function emptyER(): EstadoResultados {
    return {
        ventas: null, costoVenta: null, utilidadBruta: null, gastosOperacion: null,
        utilidadOperacion: null, gastosFinancieros: null, otrosProductos: null, otrosGastos: null,
        utilidadAntesImpuestos: null, impuestos: null, depreciacion: null, utilidadNeta: null,
    };
}
function emptyKPIs(): KPIs {
    return {
        liquidezCirculante: null, capitalTrabajo: null, pruebaAcido: null,
        rotacionCxC: null, rotacionCxP: null, rotacionInventarios: null,
        margenOperativo: null, margenUtilidad: null, roa: null, roe: null,
        deudaTotal: null, deudaCapital: null, deudaLP: null,
    };
}

// ─── Extracción de texto del PDF ──────────────────────────────────────────────

export async function extractTextFromFinancialPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        return data.text || "NO_TEXT_FOUND";
    } catch (error: any) {
        throw new Error(`No se pudo leer el PDF: ${error.message}`);
    }
}
