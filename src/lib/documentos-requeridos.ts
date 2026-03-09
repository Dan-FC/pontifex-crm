// ── src/lib/documentos-requeridos.ts ─────────────────────────────────────────
// Listado oficial de documentos requeridos por Nexus Pontifex para cada expediente.
// Esta es la ÚNICA fuente de verdad. Cualquier UI o cálculo de completitud debe
// importar desde aquí.

export interface DocumentoRequerido {
    id: string;           // slug único, usado como clave
    nombre: string;       // Nombre legible para UI
    categoria: string;    // Categoría padre
    obligatorio: boolean; // Siempre true por ahora (todos son obligatorios)
}

export interface CategoriaDocumentos {
    id: string;
    nombre: string;
    descripcion?: string;
    documentos: DocumentoRequerido[];
}

// ── Listado oficial (imagen checklist Pontifex) ───────────────────────────────
export const CATEGORIAS_DOCUMENTOS: CategoriaDocumentos[] = [
    {
        id: "proyecto-inversion",
        nombre: "Proyecto de Inversión",
        documentos: [
            { id: "presentacion-empresa", nombre: "Presentación / Curriculum de la empresa", categoria: "Proyecto de Inversión", obligatorio: true },
            { id: "resumen-ejecutivo", nombre: "Resumen ejecutivo", categoria: "Proyecto de Inversión", obligatorio: true },
            { id: "proyecciones-fin", nombre: "Proyecciones financieras", categoria: "Proyecto de Inversión", obligatorio: true },
            { id: "estructura-directiva", nombre: "Cuadro descriptivo de la estructura directiva", categoria: "Proyecto de Inversión", obligatorio: true },
            { id: "cv-directivos", nombre: "CV de los principales directivos y socios", categoria: "Proyecto de Inversión", obligatorio: true },
        ],
    },
    {
        id: "legal",
        nombre: "Legal",
        documentos: [
            { id: "acta-constitutiva", nombre: "Acta Constitutiva", categoria: "Legal", obligatorio: true },
            { id: "poderes-asambleas", nombre: "Poderes y Asambleas", categoria: "Legal", obligatorio: true },
        ],
    },
    {
        id: "financiera",
        nombre: "Financiera",
        descripcion: "Estados Financieros (Estado de Resultados, Balance General, Relaciones Analíticas)",
        documentos: [
            { id: "estados-financieros", nombre: "Estados Financieros", categoria: "Financiera", obligatorio: true },
            { id: "estados-cuenta-banco", nombre: "Estados de cuenta bancarios (últimos 12 meses)", categoria: "Financiera", obligatorio: true },
            { id: "proyecciones-proyecto", nombre: "Proyecciones Financieras del proyecto", categoria: "Financiera", obligatorio: true },
        ],
    },
    {
        id: "fiscal",
        nombre: "Fiscal",
        documentos: [
            { id: "constancia-fiscal", nombre: "Constancia de Situación Fiscal", categoria: "Fiscal", obligatorio: true },
            { id: "declaracion-2019", nombre: "Declaración Anual 2019", categoria: "Fiscal", obligatorio: true },
            { id: "declaracion-2020", nombre: "Declaración Anual 2020", categoria: "Fiscal", obligatorio: true },
            { id: "declaraciones-prov", nombre: "Últimas 3 declaraciones provisionales", categoria: "Fiscal", obligatorio: true },
            { id: "comprobante-domicilio", nombre: "Comprobante de domicilio Fiscal", categoria: "Fiscal", obligatorio: true },
        ],
    },
    {
        id: "buro-credito",
        nombre: "Buró de Crédito",
        documentos: [
            { id: "buro-pm", nombre: "Reporte de buró de crédito Especial PM", categoria: "Buró de Crédito", obligatorio: true },
            { id: "buro-socios", nombre: "Reporte buró de crédito Especial Socios accionistas y/o RL", categoria: "Buró de Crédito", obligatorio: true },
        ],
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lista plana de todos los documentos requeridos */
export const TODOS_LOS_DOCUMENTOS: DocumentoRequerido[] =
    CATEGORIAS_DOCUMENTOS.flatMap(c => c.documentos);

/** Total de documentos obligatorios */
export const TOTAL_DOCUMENTOS_REQUERIDOS = TODOS_LOS_DOCUMENTOS.length;

/** Devuelve el id de categoría al que pertenece un docId */
export function getCategoriaDeDoc(docId: string): string {
    for (const cat of CATEGORIAS_DOCUMENTOS) {
        if (cat.documentos.some(d => d.id === docId)) return cat.id;
    }
    return "otros";
}

/**
 * Dado un array de tipos/nombres de documentos ya entregados (strings),
 * devuelve cuáles IDs del checklist oficial están cubiertos.
 * Hace matching case-insensitive por id o por nombre parcial.
 */
export function calcularCoberturaDocumentos(
    tiposEntregados: string[]
): { cubiertos: DocumentoRequerido[]; faltantes: DocumentoRequerido[] } {
    const entregadosLower = tiposEntregados.map(t => t.toLowerCase());

    const cubiertos: DocumentoRequerido[] = [];
    const faltantes: DocumentoRequerido[] = [];

    for (const doc of TODOS_LOS_DOCUMENTOS) {
        const match = entregadosLower.some(t =>
            t.includes(doc.id.toLowerCase()) ||
            t.includes(doc.nombre.toLowerCase().slice(0, 12)) ||
            doc.id.toLowerCase().includes(t.slice(0, 12))
        );
        if (match) cubiertos.push(doc);
        else faltantes.push(doc);
    }

    return { cubiertos, faltantes };
}
