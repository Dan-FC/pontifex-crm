// ─── Mock data — Nexus Pontifex ──────────────────────────────────────────────

// ── Catálogos ───────────────────────────────────────────────────────────────
export const ETAPAS_PROCESO = [
    "Documentación",
    "Análisis documental",
    "Validación",
    "Perfil financiero",
    "Opciones de financiamiento",
    "Propuesta",
];

export const SITUACION_COLORS: Record<string, string> = {
    "En curso": "bg-emerald-100 text-emerald-700",
    "Requiere revisión": "bg-amber-100 text-amber-700",
    "Observado": "bg-orange-100 text-orange-700",
    "Listo para propuesta": "bg-blue-100 text-blue-700",
    "Cerrado": "bg-gray-100 text-gray-600",
    "Rechazado": "bg-red-100 text-red-700",
};

export const ETAPA_COLORS: Record<string, string> = {
    "Documentación": "bg-slate-100 text-slate-700",
    "Análisis documental": "bg-purple-100 text-purple-700",
    "Validación": "bg-yellow-100 text-yellow-700",
    "Perfil financiero": "bg-blue-100 text-blue-700",
    "Opciones de financiamiento": "bg-indigo-100 text-indigo-700",
    "Propuesta": "bg-green-100 text-green-700",
};

// ── Casos ────────────────────────────────────────────────────────────────────
export const MOCK_CASES = [
    {
        id: "CASO-001", cliente: "AceroMex S.A. de C.V.", rfc: "AME120304XYZ",
        sector: "Industrial", email: "contacto@aceromex.mx", telefono: "662 210 4400",
        ejecutivo: "Ana Valdés", tipoFinanciamiento: "Crédito simple",
        montoSolicitado: "$8,500,000", etapa: 1, etapaNombre: "Documentación",
        situacion: "En curso", completitud: 35,
        fechaAlta: "2026-02-19", ultimaActualizacion: "2026-02-26",
        alertas: ["Falta estado de cuenta diciembre 2024", "RFC no verificado"],
        datosFinancieros: { saldoAnterior: "1,245,300.00", saldoFinal: "987,650.00", ingresos: "3,800,000.00", egresos: "2,560,000.00", movimientos: 148, periodo: "Nov 2024" },
    },
    {
        id: "CASO-002", cliente: "Inmobiliaria Cima S.A.", rfc: "ICM980512ABC",
        sector: "Inmobiliario", email: "finanzas@cima.mx", telefono: "667 310 8800",
        ejecutivo: "Carlos Ruiz", tipoFinanciamiento: "Crédito hipotecario empresarial",
        montoSolicitado: "$12,000,000", etapa: 2, etapaNombre: "Análisis documental",
        situacion: "Requiere revisión", completitud: 65,
        fechaAlta: "2026-02-21", ultimaActualizacion: "2026-02-27",
        alertas: [],
        datosFinancieros: { saldoAnterior: "3,100,000.00", saldoFinal: "2,870,000.00", ingresos: "5,200,000.00", egresos: "3,700,000.00", movimientos: 213, periodo: "Dic 2024" },
    },
    {
        id: "CASO-003", cliente: "Grupo Logística Nacional", rfc: "GLN030710DEF",
        sector: "Logística", email: "info@logisticanac.mx", telefono: "644 180 3300",
        ejecutivo: "Laura Méndez", tipoFinanciamiento: "Factoraje financiero",
        montoSolicitado: "$5,200,000", etapa: 3, etapaNombre: "Validación",
        situacion: "Observado", completitud: 78,
        fechaAlta: "2026-02-15", ultimaActualizacion: "2026-02-25",
        alertas: ["Saldo detectado no coincide con declaración anual"],
        datosFinancieros: { saldoAnterior: "780,000.00", saldoFinal: "950,000.00", ingresos: "2,100,000.00", egresos: "1,680,000.00", movimientos: 87, periodo: "Nov 2024" },
    },
    {
        id: "CASO-004", cliente: "TechnoPlast de México", rfc: "TPM110815GHI",
        sector: "Manufactura", email: "operaciones@technoplast.mx", telefono: "662 390 2200",
        ejecutivo: "Ana Valdés", tipoFinanciamiento: "Arrendamiento financiero",
        montoSolicitado: "$3,750,000", etapa: 4, etapaNombre: "Perfil financiero",
        situacion: "En curso", completitud: 88,
        fechaAlta: "2026-02-10", ultimaActualizacion: "2026-02-24",
        alertas: [],
        datosFinancieros: { saldoAnterior: "620,000.00", saldoFinal: "710,000.00", ingresos: "1,500,000.00", egresos: "990,000.00", movimientos: 64, periodo: "Dic 2024" },
    },
    {
        id: "CASO-005", cliente: "Constructora Norteña", rfc: "CNO050320JKL",
        sector: "Construcción", email: "dir@constructoranortena.mx", telefono: "662 555 7700",
        ejecutivo: "Roberto Gil", tipoFinanciamiento: "Crédito hipotecario empresarial",
        montoSolicitado: "$22,000,000", etapa: 5, etapaNombre: "Opciones de financiamiento",
        situacion: "Listo para propuesta", completitud: 95,
        fechaAlta: "2026-02-08", ultimaActualizacion: "2026-02-27",
        alertas: [],
        datosFinancieros: { saldoAnterior: "8,700,000.00", saldoFinal: "9,200,000.00", ingresos: "14,000,000.00", egresos: "9,500,000.00", movimientos: 341, periodo: "Ene 2026" },
    },
    {
        id: "CASO-006", cliente: "Agroexportadora del Bajío", rfc: "AEB150720MNO",
        sector: "Agroindustria", email: "export@bajio.mx", telefono: "412 110 5500",
        ejecutivo: "Carlos Ruiz", tipoFinanciamiento: "Crédito simple",
        montoSolicitado: "$4,100,000", etapa: 1, etapaNombre: "Documentación",
        situacion: "En curso", completitud: 20,
        fechaAlta: "2026-02-25", ultimaActualizacion: "2026-02-25",
        alertas: ["Expediente incompleto — pendiente de documentos iniciales"],
        datosFinancieros: null,
    },
    {
        id: "CASO-007", cliente: "Farmacéutica Salud MX", rfc: "FSM200901PQR",
        sector: "Salud", email: "finanzas@saludmx.com", telefono: "662 400 9900",
        ejecutivo: "Laura Méndez", tipoFinanciamiento: "Línea de crédito revolvente",
        montoSolicitado: "$9,800,000", etapa: 2, etapaNombre: "Análisis documental",
        situacion: "Requiere revisión", completitud: 60,
        fechaAlta: "2026-02-22", ultimaActualizacion: "2026-02-26",
        alertas: [],
        datosFinancieros: { saldoAnterior: "2,300,000.00", saldoFinal: "2,100,000.00", ingresos: "4,800,000.00", egresos: "3,200,000.00", movimientos: 192, periodo: "Dic 2024" },
    },
    {
        id: "CASO-008", cliente: "Distribuidora Central S.A.", rfc: "DCS870630STU",
        sector: "Distribución", email: "admin@distcentral.mx", telefono: "662 230 4400",
        ejecutivo: "Roberto Gil", tipoFinanciamiento: "Factoraje financiero",
        montoSolicitado: "$6,300,000", etapa: 3, etapaNombre: "Validación",
        situacion: "En curso", completitud: 72,
        fechaAlta: "2026-02-18", ultimaActualizacion: "2026-02-24",
        alertas: ["Discrepancia en facturación mensual reportada"],
        datosFinancieros: { saldoAnterior: "1,100,000.00", saldoFinal: "1,250,000.00", ingresos: "3,100,000.00", egresos: "2,200,000.00", movimientos: 108, periodo: "Nov 2024" },
    },
    {
        id: "CASO-009", cliente: "Energías Renovables GDL", rfc: "ERG190101VWX",
        sector: "Energía", email: "sostenible@ergdl.mx", telefono: "33 4400 8800",
        ejecutivo: "Ana Valdés", tipoFinanciamiento: "Crédito verde / sostenible",
        montoSolicitado: "$18,500,000", etapa: 6, etapaNombre: "Propuesta",
        situacion: "Listo para propuesta", completitud: 100,
        fechaAlta: "2026-02-12", ultimaActualizacion: "2026-02-27",
        alertas: [],
        datosFinancieros: { saldoAnterior: "6,400,000.00", saldoFinal: "7,200,000.00", ingresos: "12,000,000.00", egresos: "7,800,000.00", movimientos: 276, periodo: "Ene 2026" },
    },
    {
        id: "CASO-010", cliente: "Textiles del Norte S. de R.L.", rfc: "TDN960415YZ1",
        sector: "Manufactura", email: "ventas@textilesnorte.mx", telefono: "662 120 3300",
        ejecutivo: "Carlos Ruiz", tipoFinanciamiento: "Crédito simple",
        montoSolicitado: "$2,950,000", etapa: 1, etapaNombre: "Documentación",
        situacion: "En curso", completitud: 15,
        fechaAlta: "2026-02-26", ultimaActualizacion: "2026-02-26",
        alertas: ["Expediente recién iniciado"],
        datosFinancieros: null,
    },
];

// ── Documentos por caso ──────────────────────────────────────────────────────
export const MOCK_DOCUMENTOS = [
    { id: "DOC-001", casoId: "CASO-001", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Nov2024_AceroMex.pdf", estatus: "Procesado", fecha: "2026-02-19", saldoAnterior: "1,245,300.00", saldoFinal: "987,650.00" },
    { id: "DOC-002", casoId: "CASO-001", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Oct2024_AceroMex.pdf", estatus: "Requiere revisión", fecha: "2026-02-20", saldoAnterior: null, saldoFinal: null },
    { id: "DOC-003", casoId: "CASO-001", tipo: "Declaración anual", nombre: "DecAnual2024_AceroMex.pdf", estatus: "Pendiente", fecha: null, saldoAnterior: null, saldoFinal: null },
    { id: "DOC-004", casoId: "CASO-002", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Dic2024_Cima.pdf", estatus: "Procesado", fecha: "2026-02-21", saldoAnterior: "3,100,000.00", saldoFinal: "2,870,000.00" },
    { id: "DOC-005", casoId: "CASO-003", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Nov2024_GLN.pdf", estatus: "Con errores", fecha: "2026-02-22", saldoAnterior: null, saldoFinal: null },
    { id: "DOC-006", casoId: "CASO-004", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Dic2024_TechnoPlast.pdf", estatus: "Procesado", fecha: "2026-02-23", saldoAnterior: "620,000.00", saldoFinal: "710,000.00" },
    { id: "DOC-007", casoId: "CASO-005", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Ene2025_CNortena.pdf", estatus: "Procesado", fecha: "2026-02-24", saldoAnterior: "8,700,000.00", saldoFinal: "9,200,000.00" },
    { id: "DOC-008", casoId: "CASO-007", tipo: "Estado de cuenta bancario", nombre: "EdoCta_Dic2024_SaludMX.pdf", estatus: "Pendiente", fecha: null, saldoAnterior: null, saldoFinal: null },
];

export const DOC_ESTATUS_COLORS: Record<string, string> = {
    "Procesado": "bg-green-100 text-green-700",
    "Pendiente": "bg-gray-100 text-gray-500",
    "Con errores": "bg-red-100 text-red-700",
    "Requiere revisión": "bg-amber-100 text-amber-700",
};

// ── Instituciones financieras ─────────────────────────────────────────────────
export const MOCK_INSTITUCIONES = [
    {
        id: "INST-001", institucion: "BBVA México", producto: "Crédito PyME Impuls",
        tipo: "Crédito simple", montoMin: "$1,000,000", montoMax: "$20,000,000",
        plazo: "12 – 60 meses", tasa: "12% – 16% anual",
        requisitos: "Antigüedad mín. 2 años, facturación mín. $500K/mes",
        compatibilidad: "Alta", sector: ["Industrial", "Manufactura", "Distribución"],
        observaciones: "Producto ideal para capital de trabajo o expansión.",
    },
    {
        id: "INST-002", institucion: "Banorte", producto: "Crédito Empresarial Flex",
        tipo: "Línea de crédito revolvente", montoMin: "$500,000", montoMax: "$15,000,000",
        plazo: "Revolvente 12 meses renovable", tasa: "13% – 18% anual",
        requisitos: "Sin garantía hipotecaria hasta $3M, historial crediticio limpio",
        compatibilidad: "Alta", sector: ["Salud", "Distribución", "Logística"],
        observaciones: "Flexible para ciclos de flujo variables.",
    },
    {
        id: "INST-003", institucion: "Santander México", producto: "Arrendamiento Puro Empresarial",
        tipo: "Arrendamiento financiero", montoMin: "$800,000", montoMax: "$10,000,000",
        plazo: "24 – 48 meses", tasa: "10% – 14% anual equivalente",
        requisitos: "Activo a arrendar como garantía, estados financieros auditados",
        compatibilidad: "Compatible con condiciones", sector: ["Manufactura", "Energía"],
        observaciones: "Sujeto a validación del activo a financiar.",
    },
    {
        id: "INST-004", institucion: "NAFIN", producto: "Factoraje Cadenas Productivas",
        tipo: "Factoraje financiero", montoMin: "$200,000", montoMax: "$5,000,000",
        plazo: "30 – 180 días por factura", tasa: "8% – 11% anual",
        requisitos: "Facturas vigentes con grandes compradores, sin garantía real",
        compatibilidad: "Alta", sector: ["Logística", "Distribución", "Agroindustria"],
        observaciones: "Excelente para liberar liquidez inmediata.",
    },
    {
        id: "INST-005", institucion: "HSBC México", producto: "Crédito Verde Sustentable",
        tipo: "Crédito verde / sostenible", montoMin: "$2,000,000", montoMax: "$30,000,000",
        plazo: "36 – 84 meses", tasa: "9% – 13% anual",
        requisitos: "Proyecto con impacto ambiental demostrable, certificaciones ESG preferentes",
        compatibilidad: "Alta", sector: ["Energía", "Agroindustria", "Construcción"],
        observaciones: "Tasas preferenciales para proyectos con métricas ESG verificadas.",
    },
    {
        id: "INST-006", institucion: "Scotiabank México", producto: "Crédito Hipotecario Comercial",
        tipo: "Crédito hipotecario empresarial", montoMin: "$5,000,000", montoMax: "$50,000,000",
        plazo: "60 – 180 meses", tasa: "10% – 14.5% anual",
        requisitos: "Inmueble como garantía con valor mínimo 1.4x el crédito, escrituras en regla",
        compatibilidad: "Compatible con condiciones", sector: ["Inmobiliario", "Construcción"],
        observaciones: "Requiere valuación formal del inmueble por perito certificado.",
    },
    {
        id: "INST-007", institucion: "Banbajío", producto: "PyME Agro Bajío",
        tipo: "Crédito simple", montoMin: "$500,000", montoMax: "$8,000,000",
        plazo: "12 – 48 meses", tasa: "11% – 15% anual",
        requisitos: "Empresa agroindustrial con domicilio en región Bajío o noreste",
        compatibilidad: "Requiere información adicional", sector: ["Agroindustria"],
        observaciones: "Especializado en empresas del sector agro de la región.",
    },
];

export const COMPATIBILIDAD_COLORS: Record<string, string> = {
    "Alta": "bg-emerald-100 text-emerald-700",
    "Compatible con condiciones": "bg-amber-100 text-amber-700",
    "Requiere información adicional": "bg-slate-100 text-slate-600",
};

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export const DASHBOARD_KPI = {
    totalActivos: 7,
    requierenRevision: 2,
    observados: 1,
    listosPropuesta: 2,
    cerrados: 0,
    tiempoPromedio: 18,
    montoGestionado: "$92.8M MXN",
};

export const CARGA_EJECUTIVOS = [
    { ejecutivo: "Ana Valdés", casos: 3 },
    { ejecutivo: "Carlos Ruiz", casos: 3 },
    { ejecutivo: "Laura Méndez", casos: 2 },
    { ejecutivo: "Roberto Gil", casos: 2 },
];

export const EMBUDO_DATA = [
    { etapa: "Documentación", casos: 4 },
    { etapa: "Análisis documental", casos: 2 },
    { etapa: "Validación", casos: 2 },
    { etapa: "Perfil financiero", casos: 1 },
    { etapa: "Opciones de financiamiento", casos: 1 },
    { etapa: "Propuesta", casos: 2 },
];

export const FLUJO_MENSUAL = [
    { mes: "Nov 2025", casos: 12 },
    { mes: "Dic 2025", casos: 18 },
    { mes: "Ene 2026", casos: 22 },
    { mes: "Feb 2026", casos: 27 },
];

