// ── src/lib/completitud.ts ────────────────────────────────────────────────────
// Completitud de expediente basada en los 17 documentos requeridos.
// Regla: 100% = los 17 documentos subidos y válidos.
// Documentos OCR (estados de cuenta / estados financieros): requieren además
// estatus "Procesado" y resultado OCR guardado (datosExtraidos no nulo).

import {
    CATEGORIAS_DOCUMENTOS,
    TODOS_LOS_DOCUMENTOS,
    TOTAL_DOCUMENTOS_REQUERIDOS,
} from "./documentos-requeridos";

const DOC_IDS_OCR = new Set(["estados-financieros", "estados-cuenta-banco"]);

export interface CategoriaCompletitud {
    nombre: string;
    peso: number;
    pct: number;
    aportePct: number;
    camposCompletos: string[];
    camposFaltantes: string[];
    observacion: string;
}

export interface ResultadoCompletitud {
    totalPct: number;
    categorias: CategoriaCompletitud[];
}

export interface ExpedienteParaCalculo {
    cliente: string;
    rfc?: string;
    sector?: string;
    email?: string;
    telefono?: string;
    contacto?: string;
    ejecutivo: string;
    tipoFinanciamiento: string;
    montoSolicitado?: string;
    observaciones?: string;
    alertas?: string;
    documentos?: Array<{
        tipo?: string | null;
        nombre?: string | null;
        estatus?: string;
        ingresos?: string | null;
        egresos?: string | null;
        datosExtraidos?: string | null;
    }>;
}

// ── Verifica si un documento subido cubre un docId requerido ─────────────────
type DocInput = NonNullable<ExpedienteParaCalculo["documentos"]>[number];

function docCubreId(
    doc: DocInput,
    docId: string
): boolean {
    const tipo = (doc.tipo ?? "").toLowerCase();
    const nombre = (doc.nombre ?? "").toLowerCase();
    const idLower = docId.toLowerCase();

    const matchTipo = tipo === idLower || tipo.includes(idLower);
    const matchNombre = idLower.split("-").some(kw => kw.length > 3 && nombre.includes(kw));

    if (!matchTipo && !matchNombre) return false;

    // Documentos OCR: además requieren procesado + resultado guardado
    if (DOC_IDS_OCR.has(docId)) {
        return doc.estatus === "Procesado" &&
            !!doc.datosExtraidos &&
            doc.datosExtraidos !== "null";
    }

    return true;
}

// ── Función principal ─────────────────────────────────────────────────────────
export function calcularCompletitud(exp: ExpedienteParaCalculo): ResultadoCompletitud {
    const docs = exp.documentos ?? [];

    // Para cada categoría calcular cuáles docs están cubiertos
    const categorias: CategoriaCompletitud[] = CATEGORIAS_DOCUMENTOS.map(cat => {
        const cubiertos: string[] = [];
        const faltantes: string[] = [];

        for (const docReq of cat.documentos) {
            const cubierto = docs.some(d => docCubreId(d, docReq.id));
            if (cubierto) cubiertos.push(docReq.nombre);
            else faltantes.push(docReq.nombre);
        }

        const pct = cat.documentos.length > 0
            ? Math.round((cubiertos.length / cat.documentos.length) * 100)
            : 100;

        // Peso proporcional al número de docs en la categoría
        const peso = Math.round((cat.documentos.length / TOTAL_DOCUMENTOS_REQUERIDOS) * 100);
        const aportePct = Math.round((cubiertos.length / TOTAL_DOCUMENTOS_REQUERIDOS) * 100);

        return {
            nombre: cat.nombre,
            peso,
            pct,
            aportePct,
            camposCompletos: cubiertos,
            camposFaltantes: faltantes,
            observacion: faltantes.length === 0
                ? `${cat.nombre} completo.`
                : `Faltan: ${faltantes.join(", ")}.`,
        };
    });

    // Total: docs cubiertos / 17 * 100
    const totalCubiertos = categorias.reduce((sum, c) => sum + c.camposCompletos.length, 0);
    const totalPct = Math.min(Math.round((totalCubiertos / TOTAL_DOCUMENTOS_REQUERIDOS) * 100), 100);

    return { totalPct, categorias };
}
