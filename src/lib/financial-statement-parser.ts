// ── src/lib/financial-statement-parser.ts ────────────────────────────────────
// OCR parser para Balance General y Estado de Resultados.
// Extrae los campos clave y calcula los KPIs de Formulas KPIs.pdf.

const pdfParse = require("pdf-parse");

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BalanceGeneral {
    // Activo Circulante
    activoCirculante: number | null;
    inventarios: number | null;
    clientes: number | null;
    deudoresDiversos: number | null;
    // Activo Fijo
    activoFijo: number | null;
    terrenosEdificios: number | null;
    maquinariaEquipo: number | null;
    equipoTransporte: number | null;
    // Otros
    otrosActivos: number | null;
    intangibles: number | null;
    activoTotal: number | null;
    // Pasivo Circulante
    pasivoCirculante: number | null;
    proveedores: number | null;
    acreedoresDiversos: number | null;
    docsPagarCP: number | null;
    // Pasivo Largo Plazo
    pasivoLargoPlazo: number | null;
    docsPagarLP: number | null;
    otrosPasivos: number | null;
    pasivoTotal: number | null;
    // Capital
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
    liquidezCirculante: number | null;   // Activo circ / Pasivo circ
    pruebaAcido: number | null;          // (Activo circ - Inventarios) / Pasivo circ
    // Actividad
    rotacionCxC: number | null;          // Ventas / Clientes
    rotacionCxP: number | null;          // (Proveedores / Costo venta) * 365
    rotacionInventarios: number | null;  // (Inventarios / Costo venta) * 365
    // Apalancamiento
    deudaTotal: number | null;           // Pasivo total / Activo total
    deudaCapital: number | null;         // Pasivo total / Capital contable
    deudaLP: number | null;              // Pasivo LP / (Activo total - Pasivo total)
    // Rentabilidad
    margenUtilidad: number | null;       // Utilidad neta / Ventas
    roa: number | null;                  // Utilidad neta / Activo total
    roe: number | null;                  // Utilidad neta / Capital contable
}

export interface ParsedFinancialStatement {
    balanceGeneral: BalanceGeneral;
    estadoResultados: EstadoResultados;
    kpis: KPIs;
    periodos: string[];
    rawText: string;
}

// ─── Patrones de etiquetas (cubre todas las variantes del documento Conceptos) ─

const PATTERNS: Record<string, RegExp> = {
    // ── Activo ────────────────────────────────────────────────────────────────
    activoCirculante: /activo\s*(circulante|corriente|a\s*corto\s*plazo)|activos?\s*(circulantes?|corrientes?)/i,
    inventarios: /inventarios?|existencias|mercanc[íi]as?\s*(en\s*almac[eé]n)?|almac[eé]n|productos?\s*terminados?|inv\./i,
    clientes: /^clientes?$|cuentas?\s*por\s*cobrar(\s*clientes?)?|cartera\s*de\s*clientes?/i,
    deudoresDiversos: /deudores?\s*diversos?|deudores?\s*varios?|otros?\s*deudores?|cuentas?\s*por\s*cobrar\s*diversas?/i,
    activoFijo: /activo\s*(fijo|no\s*corriente)|activos?\s*(fijos?|no\s*corrientes?)|propiedad[,\s]*planta\s*y\s*equipo|ppe\b/i,
    terrenosEdificios: /terrenos?\s*y\s*edificios?|terrenos?\s*[,y]\s*edificios?|inmuebles?|bienes?\s*inmuebles?/i,
    maquinariaEquipo: /maquinaria\s*y\s*equipo|maquinaria\b(?!\s*de\s*transporte)|equipo\s*(industrial|de\s*producci[oó]n|operativo)/i,
    equipoTransporte: /equipo\s*de\s*transporte|veh[íi]culos?(\s*de\s*empresa)?|flotilla\b/i,
    otrosActivos: /otros?\s*activos?(?!\s*no\s*corrientes?\s*fijos?)|activos?\s*(varios?|diversos?)/i,
    intangibles: /intangibles?|activos?\s*intangibles?|registro\s*de\s*marca|patentes?|licencias?|software\b|goodwill/i,
    activoTotal: /activo\s*total|total\s*(de\s*)?activo|activos?\s*totales?|total\s*general\s*(de\s*)?activos?|suma\s*del\s*activo/i,

    // ── Pasivo ────────────────────────────────────────────────────────────────
    pasivoCirculante: /pasivo\s*(circulante|corriente|a\s*corto\s*plazo)|pasivos?\s*(corrientes?|circulantes?)/i,
    proveedores: /^proveedores?$|cuentas?\s*por\s*pagar\s*proveedores?|acreedores?\s*comerciales?/i,
    acreedoresDiversos: /acreedores?\s*div(ersos?\.?)?|otros?\s*acreedores?|acreedores?\s*varios?|cuentas?\s*por\s*pagar\s*diversas?/i,
    docsPagarCP: /docs?\.\s*x?\s*pagar\s*cp|documentos?\s*por\s*pagar\s*(a\s*)?corto\s*plazo|pagar[eé]s?\s*cp|cr[eé]ditos?\s*bancarios?\s*cp|financiamientos?\s*cp/i,
    pasivoLargoPlazo: /pasivo\s*(largo\s*plazo|a\s*largo\s*plazo|no\s*corriente)|pasivos?\s*(no\s*corrientes?|largo\s*plazo)|deuda\s*a\s*largo\s*plazo/i,
    docsPagarLP: /docs?\.\s*x?\s*pagar\s*lp|documentos?\s*por\s*pagar\s*(a\s*)?largo\s*plazo|cr[eé]ditos?\s*bancarios?\s*lp|hip[oó]teca\b|financiamiento\s*(a\s*)?largo\s*plazo/i,
    otrosPasivos: /otros?\s*pasivos?|pasivos?\s*(diversos?|acumulados?)/i,
    pasivoTotal: /pasivo\s*total|total\s*(de\s*)?pasivo|pasivos?\s*totales?|total\s*general\s*(de\s*)?pasivos?|suma\s*del\s*pasivo/i,

    // ── Capital ───────────────────────────────────────────────────────────────
    capitalSocial: /capital\s*social|capital\s*(suscrito|pagado|aportado|fijo|variable)|aportaciones?\s*de\s*socios?/i,
    utilidadesAnteriores: /ut(ilidades?)?\s*(de\s*)?ejercicios?\s*anteriores?|utilidades?\s*(acumuladas?|retenidas?)|resultados?\s*acumulados?|ganancias?\s*retenidas?/i,
    capitalContable: /capital\s*contable\b|patrimonio(\s*neto|\s*contable)?|capital\s*total|total\s*capital\s*contable/i,

    // ── Estado de Resultados ──────────────────────────────────────────────────
    ventas: /^ventas?(\s*netas?)?$|ingresos?\s*(netos?|totales?|por\s*ventas?)?(?!\s*financieros)/i,
    costoVenta: /costo\s*(de\s*)?(venta|ventas?|producci[oó]n)|costo\s*directo/i,
    utilidadBruta: /ut(ilidad)?\.?\s*bruta|utilidad\s*bruta|resultado\s*bruto/i,
    gastosOperacion: /gastos?\s*(de\s*)?(op(eraci[oó]n|erativos?)?\.?|administraci[oó]n|ventas?\s*y\s*administraci[oó]n)|gastos?\s*operativos?/i,
    utilidadOperacion: /ut(ilidad)?\.?\s*(de\s*)?op(eraci[oó]n)?\.?|utilidad\s*(de\s*)?operaci[oó]n|resultado\s*de\s*operaci[oó]n|ebit\b/i,
    gastosFinancieros: /gastos?\s*fin(ancieros?)?\.?|intereses?\s*(pagados?|a\s*cargo)|costo\s*financiero/i,
    otrosProductos: /otros?\s*productos?|ingresos?\s*(no\s*operativos?|diversos?|financieros?)/i,
    otrosGastos: /otros?\s*gastos?|gastos?\s*(no\s*operativos?|diversos?)/i,
    utilidadAntesImpuestos: /ut(ilidad)?\.?\s*antes?\s*(de\s*)?imp(uestos?)?\.?|utilidad\s*antes?\s*de\s*impuestos?|resultado\s*antes?\s*de\s*impuestos?/i,
    impuestos: /impuestos?\s*(a\s*la\s*utilidad|sobre\s*la\s*renta|del\s*ejercicio)?|isr\b/i,
    depreciacion: /depreciaci[oó]n(\s*y\s*amortizaci[oó]n)?|amortizaci[oó]n\b/i,
    utilidadNeta: /ut(ilidad)?\s*neta|utilidad\s*neta|resultado\s*neto|beneficio\s*neto/i,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae el primer número positivo o negativo de una cadena */
function extractNumber(str: string): number | null {
    // Busca patrones: (1,234,567.89) para negativo o 1,234,567.89
    const neg = str.match(/\(\s*([\d,]+\.?\d*)\s*\)/);
    if (neg) return -parseFloat(neg[1].replace(/,/g, ""));

    const pos = str.match(/[\d,]+\.?\d*/);
    if (pos) {
        const val = parseFloat(pos[0].replace(/,/g, ""));
        return isNaN(val) ? null : val;
    }
    return null;
}

/** Busca el campo en las líneas del texto. Toma el último número de la línea (columna más reciente). */
function findField(lines: string[], pattern: RegExp): number | null {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!pattern.test(line)) continue;

        // Busca todos los números en la línea
        const nums = [...line.matchAll(/\(?\s*[\d,]+\.?\d*\s*\)?/g)].map(m => m[0].trim());
        if (nums.length > 0) {
            // Toma el último número (columna más reciente en documentos multi-período)
            const val = extractNumber(nums[nums.length - 1]);
            if (val !== null && val > 0) return val;
        }

        // Si no hay número en la misma línea, busca en las siguientes 2 líneas
        for (let j = i + 1; j <= Math.min(i + 2, lines.length - 1); j++) {
            const nextLine = lines[j].trim();
            const val = extractNumber(nextLine);
            if (val !== null) return val;
        }
    }
    return null;
}

/** Detecta períodos en el texto (ej. "31/12/2020", "2020", "Dic 2020") */
function detectPeriodos(text: string): string[] {
    const fechas = new Set<string>();

    // Formato DD/MM/YYYY
    const fullDates = text.matchAll(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/g);
    for (const m of fullDates) fechas.add(m[0]);

    // Solo año (4 dígitos 20xx)
    const years = text.matchAll(/\b(20\d{2})\b/g);
    for (const m of years) fechas.add(m[1]);

    return [...fechas].slice(0, 4);
}

// ─── Parser Principal ─────────────────────────────────────────────────────────

export function parseFinancialStatement(text: string): ParsedFinancialStatement {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

    const bg: BalanceGeneral = {
        activoCirculante: findField(lines, PATTERNS.activoCirculante),
        inventarios: findField(lines, PATTERNS.inventarios),
        clientes: findField(lines, PATTERNS.clientes),
        deudoresDiversos: findField(lines, PATTERNS.deudoresDiversos),
        activoFijo: findField(lines, PATTERNS.activoFijo),
        terrenosEdificios: findField(lines, PATTERNS.terrenosEdificios),
        maquinariaEquipo: findField(lines, PATTERNS.maquinariaEquipo),
        equipoTransporte: findField(lines, PATTERNS.equipoTransporte),
        otrosActivos: findField(lines, PATTERNS.otrosActivos),
        intangibles: findField(lines, PATTERNS.intangibles),
        activoTotal: findField(lines, PATTERNS.activoTotal),
        pasivoCirculante: findField(lines, PATTERNS.pasivoCirculante),
        proveedores: findField(lines, PATTERNS.proveedores),
        acreedoresDiversos: findField(lines, PATTERNS.acreedoresDiversos),
        docsPagarCP: findField(lines, PATTERNS.docsPagarCP),
        pasivoLargoPlazo: findField(lines, PATTERNS.pasivoLargoPlazo),
        docsPagarLP: findField(lines, PATTERNS.docsPagarLP),
        otrosPasivos: findField(lines, PATTERNS.otrosPasivos),
        pasivoTotal: findField(lines, PATTERNS.pasivoTotal),
        capitalSocial: findField(lines, PATTERNS.capitalSocial),
        utilidadesAnteriores: findField(lines, PATTERNS.utilidadesAnteriores),
        capitalContable: findField(lines, PATTERNS.capitalContable),
    };

    const er: EstadoResultados = {
        ventas: findField(lines, PATTERNS.ventas),
        costoVenta: findField(lines, PATTERNS.costoVenta),
        utilidadBruta: findField(lines, PATTERNS.utilidadBruta),
        gastosOperacion: findField(lines, PATTERNS.gastosOperacion),
        utilidadOperacion: findField(lines, PATTERNS.utilidadOperacion),
        gastosFinancieros: findField(lines, PATTERNS.gastosFinancieros),
        otrosProductos: findField(lines, PATTERNS.otrosProductos),
        otrosGastos: findField(lines, PATTERNS.otrosGastos),
        utilidadAntesImpuestos: findField(lines, PATTERNS.utilidadAntesImpuestos),
        impuestos: findField(lines, PATTERNS.impuestos),
        depreciacion: findField(lines, PATTERNS.depreciacion),
        utilidadNeta: findField(lines, PATTERNS.utilidadNeta),
    };

    const kpis = calcularKPIs(bg, er);
    const periodos = detectPeriodos(text);

    return { balanceGeneral: bg, estadoResultados: er, kpis, periodos, rawText: text };
}

// ─── Cálculo de KPIs ──────────────────────────────────────────────────────────

function safe(n: number | null): number | null {
    return n !== null && n !== 0 ? n : null;
}

function ratio(a: number | null, b: number | null, decimals = 2): number | null {
    if (a === null || b === null || b === 0) return null;
    return parseFloat((a / b).toFixed(decimals));
}

export function calcularKPIs(bg: BalanceGeneral, er: EstadoResultados): KPIs {
    return {
        // Liquidez
        liquidezCirculante: ratio(bg.activoCirculante, bg.pasivoCirculante),
        pruebaAcido: bg.activoCirculante !== null && bg.inventarios !== null
            ? ratio(bg.activoCirculante - bg.inventarios, bg.pasivoCirculante)
            : null,

        // Actividad
        rotacionCxC: ratio(er.ventas, bg.clientes),
        rotacionCxP: bg.proveedores !== null && er.costoVenta !== null
            ? ratio(bg.proveedores * 365, er.costoVenta)
            : null,
        rotacionInventarios: bg.inventarios !== null && er.costoVenta !== null
            ? ratio(bg.inventarios * 365, er.costoVenta)
            : null,

        // Apalancamiento
        deudaTotal: ratio(bg.pasivoTotal, bg.activoTotal),
        deudaCapital: ratio(bg.pasivoTotal, bg.capitalContable),
        deudaLP: bg.pasivoLargoPlazo !== null && bg.activoTotal !== null && bg.pasivoTotal !== null
            ? ratio(bg.pasivoLargoPlazo, bg.activoTotal - (bg.pasivoTotal ?? 0))
            : null,

        // Rentabilidad
        margenUtilidad: ratio(er.utilidadNeta, er.ventas),
        roa: ratio(er.utilidadNeta, bg.activoTotal),
        roe: ratio(er.utilidadNeta, bg.capitalContable),
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
