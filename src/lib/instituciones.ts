// ─── Instituciones Financieras — Portafolio Pontifex ─────────────────────────
// Fuente: PORTAFOLIO+PROVEEDORES+Y+PRODUCTOS+ORO.xlsx (hoja "2026 partners")
// Solo partners ORO con criterios completos de matching.

export type Producto = "Crédito Simple" | "Crédito Revolvente" | "Factoraje" | "Arrendamiento";
export type TipoInstitucion = "BANCO" | "FINANCIERA" | "FINTECH" | "ARRENDADORA";
export type Tier = "ORO" | "PLATA" | "BRONCE";
export type Sector = "Comercio" | "Industria" | "Servicios" | "Primario";
export type Buro = "Excelente" | "Bueno" | "Regular" | "Mal";
export type Garantia = "Aval" | "Relación Patrimonial" | "Hipotecaria" | "Prendaria" | "Líquida" | "Contratos";
export type SolvenciaFinanciera = "Utilidad" | "Pérdida" | "Quiebra Técnica";
export type ExperienciaMin = "menor1" | "1año" | "2años";

export interface Institucion {
    id: string;
    nombre: string;
    tipo: TipoInstitucion;
    tier: Tier;
    cobertura: ("Local" | "Estatal" | "Regional" | "Nacional")[];
    productos: Producto[];
    experienciaMin: ExperienciaMin;
    sectores: Sector[];
    buroAceptado: Buro[];
    garantias: Garantia[];
    solvenciaAceptada: SolvenciaFinanciera[];
    contrato: boolean;
    masRentable: boolean;
}

export const INSTITUCIONES: Institucion[] = [
    {
        id: "COVALTO",
        nombre: "Covalto",
        tipo: "BANCO", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Crédito Simple", "Crédito Revolvente", "Factoraje", "Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Hipotecaria", "Prendaria", "Líquida"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "SANTANDER",
        nombre: "Santander PyME / Empresas",
        tipo: "BANCO", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente", "Factoraje", "Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Relación Patrimonial", "Hipotecaria", "Prendaria", "Líquida", "Contratos"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "FINAMO",
        nombre: "Finamo",
        tipo: "FINANCIERA", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Crédito Simple", "Crédito Revolvente", "Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Mal"],
        garantias: ["Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida", "Quiebra Técnica"],
    },
    {
        id: "ANTICIPA",
        nombre: "Anticipa / Finsus",
        tipo: "FINANCIERA", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Hipotecaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "GRUPO1120",
        nombre: "Grupo 1120",
        tipo: "FINANCIERA", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "1año",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Mal"],
        garantias: ["Hipotecaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida", "Quiebra Técnica"],
    },
    {
        id: "AUTOKAPITAL",
        nombre: "Autokapital",
        tipo: "FINANCIERA", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "1año",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Regular", "Mal"],
        garantias: ["Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "HEYBANCO",
        nombre: "Hey Banco",
        tipo: "BANCO", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Relación Patrimonial"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "TIP",
        nombre: "TIP",
        tipo: "ARRENDADORA", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Arrendamiento"],
        experienciaMin: "1año",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Prendaria"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "CVCREDIT",
        nombre: "CV Credit (Exitus Capital)",
        tipo: "FINANCIERA", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Factoraje"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Hipotecaria", "Contratos"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "HELIOS",
        nombre: "Helios",
        tipo: "FINANCIERA", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "1año",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno", "Regular"],
        garantias: ["Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "XEPELIN",
        nombre: "Xepelin",
        tipo: "FINTECH", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Factoraje"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "RFJECAPITAL",
        nombre: "RFJ Capital",
        tipo: "FINANCIERA", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Local"],
        productos: ["Crédito Simple"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Excelente", "Bueno", "Regular", "Mal"],
        garantias: ["Aval", "Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad", "Pérdida"],
    },
    {
        id: "COPPEL",
        nombre: "Banca Empresarial Coppel / Arrendadora",
        tipo: "BANCO", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente", "Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Excelente", "Bueno"],
        garantias: ["Aval", "Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "FINKARGO",
        nombre: "Finkargo",
        tipo: "FINANCIERA", tier: "ORO", contrato: true, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Crédito Simple", "Crédito Revolvente"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "INVERFIN",
        nombre: "Inverfin",
        tipo: "FINANCIERA", tier: "ORO", contrato: false, masRentable: true,
        cobertura: ["Nacional"],
        productos: ["Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Prendaria"],
        solvenciaAceptada: ["Utilidad"],
    },
    {
        id: "BANREGIO",
        nombre: "Banregio",
        tipo: "BANCO", tier: "ORO", contrato: false, masRentable: false,
        cobertura: ["Regional"],
        productos: ["Crédito Simple", "Crédito Revolvente", "Factoraje", "Arrendamiento"],
        experienciaMin: "2años",
        sectores: ["Comercio", "Industria", "Servicios", "Primario"],
        buroAceptado: ["Bueno"],
        garantias: ["Aval", "Relación Patrimonial", "Hipotecaria", "Prendaria"],
        solvenciaAceptada: ["Utilidad"],
    },
];

// ─── Mapping de sector del caso → categoría del portafolio ───────────────────
const SECTOR_MAP: Record<string, Sector> = {
    "Industrial": "Industria",
    "Manufactura": "Industria",
    "Construcción": "Industria",
    "Agroindustria": "Primario",
    "Agrícola": "Primario",
    "Primario": "Primario",
    "Comercio": "Comercio",
    "Distribución": "Comercio",
    "Retail": "Comercio",
    "Servicios": "Servicios",
    "Tecnología": "Servicios",
    "Telecomunicaciones": "Servicios",
    "Salud": "Servicios",
    "Logística": "Servicios",
    "Inmobiliario": "Servicios",
    "Energía": "Industria",
};

// ─── Mapping de tipoFinanciamiento del caso → Producto ───────────────────────
const PRODUCTO_MAP: Record<string, Producto> = {
    "Crédito simple": "Crédito Simple",
    "Crédito Simple": "Crédito Simple",
    "Línea de crédito revolvente": "Crédito Revolvente",
    "Crédito revolvente": "Crédito Revolvente",
    "Crédito Revolvente": "Crédito Revolvente",
    "Factoraje financiero": "Factoraje",
    "Factoraje": "Factoraje",
    "Arrendamiento financiero": "Arrendamiento",
    "Arrendamiento puro": "Arrendamiento",
    "Arrendamiento": "Arrendamiento",
    "Crédito hipotecario empresarial": "Crédito Simple",
    "Capital de trabajo": "Crédito Simple",
};

// ─── Motor de matching ────────────────────────────────────────────────────────
export interface ResultadoMatch {
    institucion: Institucion;
    score: number;                   // 0–100
    nivel: "Alta" | "Media" | "Condicional" | "No compatible";
    pilares: {
        producto: boolean;
        sector: boolean;
        experiencia: boolean;
        solvencia: boolean | null;   // null = sin datos financieros
    };
}

export function matchearInstituciones(
    caso: {
        sector: string;
        tipoFinanciamiento: string;
        fechaConstitucion?: string;
        fechaAlta: string;
    },
    solvencia?: "Utilidad" | "Pérdida" | "Quiebra Técnica" | null,
): ResultadoMatch[] {
    const sectorMapped: Sector | undefined = SECTOR_MAP[caso.sector];
    const productoMapped: Producto | undefined = PRODUCTO_MAP[caso.tipoFinanciamiento];

    // Antigüedad real de la empresa desde su fecha de constitución
    // Si no está capturada, se usa la fechaAlta como aproximación (menos preciso)
    const refDate = caso.fechaConstitucion && caso.fechaConstitucion.trim()
        ? new Date(caso.fechaConstitucion)
        : new Date(caso.fechaAlta);
    const mesesExperiencia = Math.floor(
        (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const experienciaCase: ExperienciaMin =
        mesesExperiencia >= 24 ? "2años" : mesesExperiencia >= 12 ? "1año" : "menor1";

    const results: ResultadoMatch[] = INSTITUCIONES.map(inst => {
        // Pilar 1 — Producto (30 pts)
        const matchProducto = productoMapped ? inst.productos.includes(productoMapped) : false;

        // Pilar 2 — Sector (25 pts)
        const matchSector = sectorMapped ? inst.sectores.includes(sectorMapped) : false;

        // Pilar 3 — Experiencia (20 pts)
        const expOrder: Record<ExperienciaMin, number> = { "menor1": 0, "1año": 1, "2años": 2 };
        const matchExperiencia = expOrder[experienciaCase] >= expOrder[inst.experienciaMin];

        // Pilar 4 — Solvencia financiera (15 pts, solo si hay datos)
        const matchSolvencia = solvencia
            ? inst.solvenciaAceptada.includes(solvencia)
            : null;

        // Bonus tier ORO (10 pts)
        const bonusTier = inst.tier === "ORO" ? 10 : inst.tier === "PLATA" ? 5 : 0;

        let score = 0;
        if (matchProducto) score += 30;
        if (matchSector) score += 25;
        if (matchExperiencia) score += 20;
        if (matchSolvencia === true) score += 15;
        else if (matchSolvencia === null) score += 8; // sin datos = score parcial
        score += bonusTier;

        const nivel: ResultadoMatch["nivel"] =
            score >= 75 ? "Alta" :
            score >= 50 ? "Media" :
            score >= 30 ? "Condicional" : "No compatible";

        return {
            institucion: inst,
            score,
            nivel,
            pilares: {
                producto: matchProducto,
                sector: matchSector,
                experiencia: matchExperiencia,
                solvencia: matchSolvencia,
            },
        };
    });

    // Ordenar: por score desc, luego por tier
    return results
        .filter(r => r.nivel !== "No compatible")
        .sort((a, b) => b.score - a.score);
}

export const NIVEL_COLORS: Record<ResultadoMatch["nivel"], string> = {
    "Alta": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Media": "bg-blue-100 text-blue-700 border-blue-200",
    "Condicional": "bg-amber-100 text-amber-700 border-amber-200",
    "No compatible": "bg-gray-100 text-gray-500 border-gray-200",
};

export const TIPO_COLORS: Record<TipoInstitucion, string> = {
    "BANCO": "bg-blue-50 text-blue-700",
    "FINANCIERA": "bg-purple-50 text-purple-700",
    "FINTECH": "bg-emerald-50 text-emerald-700",
    "ARRENDADORA": "bg-amber-50 text-amber-700",
};
