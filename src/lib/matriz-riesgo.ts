export const MATRIX_SECTIONS = [
    {
        id: "conducta-admin", nombre: "Conducta y Administración", color: "blue",
        factores: [
            { id: "antiguedad", nombre: "Antigüedad de operación de la empresa", opciones: [
                { id: "a1", valor: "Más de 5 años", puntos: 4 },
                { id: "a2", valor: "2 a 5 años", puntos: 3 },
                { id: "a3", valor: "1 a 2 años", puntos: 2 },
                { id: "a4", valor: "Menos de 1 año", puntos: 1 },
            ]},
            { id: "tipo-admin", nombre: "Tipo de administración", opciones: [
                { id: "b1", valor: "Profesional con experiencia", puntos: 5 },
                { id: "b2", valor: "Familiar con experiencia", puntos: 4 },
                { id: "b3", valor: "Profesional sin experiencia", puntos: 3 },
                { id: "b4", valor: "Familiar sin experiencia", puntos: 2 },
            ]},
            { id: "quien-decide", nombre: "Quien administra y toma decisiones", opciones: [
                { id: "c1", valor: "Gobierno Corporativo", puntos: 4 },
                { id: "c2", valor: "Consejo de administración", puntos: 3 },
                { id: "c3", valor: "Administrador único con asesoría", puntos: 2 },
                { id: "c4", valor: "Centralizada en una sola persona", puntos: 1 },
                { id: "c5", valor: "No se identifica quien toma las decisiones", puntos: 0 },
            ]},
            { id: "exp-admin", nombre: "Experiencia de los administradores", opciones: [
                { id: "d1", valor: "Más de 5 años", puntos: 4 },
                { id: "d2", valor: "2 a 5 años", puntos: 2 },
                { id: "d3", valor: "1 a 2 años", puntos: 1 },
                { id: "d4", valor: "Menos de 1 año", puntos: 0 },
            ]},
            { id: "tenencia", nombre: "Tenencia Accionaria", opciones: [
                { id: "e1", valor: "Ningún Accionista tiene más del 50%", puntos: 4 },
                { id: "e2", valor: "Un Accionista tiene más del 50% con consejeros independientes", puntos: 2 },
                { id: "e3", valor: "Un Accionista tiene más del 50%", puntos: 0 },
            ]},
        ],
    },
    {
        id: "mercado", nombre: "Mercado", color: "violet",
        factores: [
            { id: "sector-eco", nombre: "Sector Económico", opciones: [
                { id: "f1", valor: "Industria", puntos: 3 },
                { id: "f2", valor: "Comercio", puntos: 2 },
                { id: "f3", valor: "Servicios", puntos: 1 },
            ]},
            { id: "posicionamiento", nombre: "Posicionamiento en el mercado", opciones: [
                { id: "g1", valor: "Cuenta con presencia en todo el país", puntos: 4 },
                { id: "g2", valor: "Cuenta con presencia regional", puntos: 3 },
                { id: "g3", valor: "Cuenta con presencia local", puntos: 2 },
                { id: "g4", valor: "Es un producto o servicio nuevo", puntos: 1 },
            ]},
            { id: "condiciones-mercado", nombre: "Condiciones de Mercado", opciones: [
                { id: "h1", valor: "Excelente demanda de sus productos", puntos: 4 },
                { id: "h2", valor: "Mercado dependiente de un Cliente o Proveedor", puntos: 3 },
                { id: "h3", valor: "Escasez de materias primas", puntos: 2 },
                { id: "h4", valor: "Poca demanda de sus productos", puntos: 2 },
                { id: "h5", valor: "Caída de los precios de venta en el mercado", puntos: 1 },
            ]},
        ],
    },
    {
        id: "conducta-crediticia", nombre: "Conducta Crediticia y Colateral", color: "amber",
        factores: [
            { id: "calidad-exp-acred", nombre: "Calidad de Experiencia Crediticia del Acreditado", opciones: [
                { id: "i1", valor: "Buen historial", puntos: 4 },
                { id: "i2", valor: "Con fallas", puntos: 1 },
                { id: "i3", valor: "Rechazo", puntos: 0 },
                { id: "i4", valor: "Sin historial", puntos: 2 },
            ]},
            { id: "score-acred", nombre: "Score de Experiencia Crediticia del Acreditado", opciones: [
                { id: "j1", valor: "700 o más puntos", puntos: 4 },
                { id: "j2", valor: "580 a 699 puntos", puntos: 3 },
                { id: "j3", valor: "500 a 579 puntos", puntos: 1 },
                { id: "j4", valor: "0 a 499 puntos", puntos: 0 },
            ]},
            { id: "calidad-exp-avales", nombre: "Calidad de Experiencia Crediticia de Avales y/o Deudores Solidarios", opciones: [
                { id: "k1", valor: "Buen historial", puntos: 4 },
                { id: "k2", valor: "Con fallas", puntos: 1 },
                { id: "k3", valor: "Rechazo", puntos: 0 },
                { id: "k4", valor: "Sin historial", puntos: 2 },
            ]},
            { id: "score-avales", nombre: "Score de Experiencia Crediticia de Avales y/o Deudores Solidarios", opciones: [
                { id: "l1", valor: "700 o más puntos", puntos: 4 },
                { id: "l2", valor: "580 a 699 puntos", puntos: 3 },
                { id: "l3", valor: "500 a 579 puntos", puntos: 1 },
                { id: "l4", valor: "0 a 499 puntos", puntos: 0 },
            ]},
            { id: "domicilios-buro", nombre: "Domicilios registrados en el Buró en 1 año", opciones: [
                { id: "m1", valor: "1 domicilio", puntos: 4 },
                { id: "m2", valor: "2 ó 3 domicilios", puntos: 3 },
                { id: "m3", valor: "4 o más domicilios", puntos: 1 },
            ]},
            { id: "exp-empresa", nombre: "Experiencia Crediticia con la empresa", opciones: [
                { id: "n1", valor: "Bueno", puntos: 5 },
                { id: "n2", valor: "Regular", puntos: 3 },
                { id: "n3", valor: "Sin historial previo", puntos: 2 },
                { id: "n4", valor: "Malo", puntos: 0 },
            ]},
            { id: "referencias", nombre: "Referencias", opciones: [
                { id: "o1", valor: "Buenas", puntos: 5 },
                { id: "o2", valor: "Regulares", puntos: 3 },
                { id: "o3", valor: "Sin Antecedentes", puntos: 2 },
                { id: "o4", valor: "Malas", puntos: 0 },
            ]},
        ],
    },
    {
        id: "estructura-credito", nombre: "Estructura del Crédito", color: "emerald",
        factores: [
            { id: "destino", nombre: "Destino del crédito", opciones: [
                { id: "p1", valor: "Capital de trabajo", puntos: 5 },
                { id: "p2", valor: "Activos Fijos", puntos: 4 },
                { id: "p3", valor: "Automotriz", puntos: 3 },
                { id: "p4", valor: "ABCD", puntos: 2 },
                { id: "p5", valor: "Personal", puntos: 1 },
            ]},
            { id: "plazo", nombre: "Plazo", opciones: [
                { id: "q1", valor: "Menos de 12 meses", puntos: 5 },
                { id: "q2", valor: "12 a 36 meses", puntos: 4 },
                { id: "q3", valor: "36 a 48 meses", puntos: 3 },
                { id: "q4", valor: "48 a 60 meses", puntos: 2 },
                { id: "q5", valor: "Más de 60 meses", puntos: 1 },
            ]},
            { id: "garantias", nombre: "Garantías", opciones: [
                { id: "r1", valor: "Fiduciaria", puntos: 5 },
                { id: "r2", valor: "Líquida", puntos: 4 },
                { id: "r3", valor: "Hipotecaria", puntos: 3 },
                { id: "r4", valor: "Prendaria", puntos: 3 },
                { id: "r5", valor: "Aval", puntos: 2 },
                { id: "r6", valor: "Sin garantía", puntos: 1 },
            ]},
            { id: "suficiencia-garantias", nombre: "Suficiencia de Garantías", opciones: [
                { id: "s1", valor: "Aceptable", puntos: 5 },
                { id: "s2", valor: "Regular", puntos: 3 },
                { id: "s3", valor: "Malo", puntos: 0 },
            ]},
            { id: "situacion-avales", nombre: "Situación de Avales", opciones: [
                { id: "t1", valor: "Excelente", puntos: 5 },
                { id: "t2", valor: "Buenas", puntos: 3 },
                { id: "t3", valor: "Mala", puntos: 0 },
            ]},
        ],
    },
    {
        id: "capacidad-pago", nombre: "Capacidad de Pago", color: "indigo",
        factores: [
            { id: "cubre-120", nombre: "Cubre el Crédito al 120% — (Ingresos − Egresos) / (Total Adeudos + Intereses)", opciones: [
                { id: "u1", valor: "Mayor a 200", puntos: 5 },
                { id: "u2", valor: "120 a 200", puntos: 4 },
                { id: "u3", valor: "Menor a 120", puntos: 1 },
            ]},
            { id: "endeud-sin", nombre: "Grado de endeudamiento sin préstamo (%)", opciones: [
                { id: "v1", valor: "0 a 25%", puntos: 5 },
                { id: "v2", valor: "26 a 50%", puntos: 3 },
                { id: "v3", valor: "51 a 75%", puntos: 2 },
                { id: "v4", valor: "76 a 100%", puntos: 1 },
                { id: "v5", valor: "Mayor a 100%", puntos: 0 },
            ]},
            { id: "endeud-con", nombre: "Grado de endeudamiento con préstamo (%)", opciones: [
                { id: "w1", valor: "0 a 25%", puntos: 5 },
                { id: "w2", valor: "26 a 50%", puntos: 4 },
                { id: "w3", valor: "51 a 75%", puntos: 3 },
                { id: "w4", valor: "76 a 100%", puntos: 1 },
                { id: "w5", valor: "Mayor a 100%", puntos: 0 },
            ]},
        ],
    },
    {
        id: "indicadores-fin", nombre: "Indicadores Financieros", color: "purple",
        factores: [
            { id: "razon-circ", nombre: "Razón Circulante (Pasivo Circ. / Activo Circ.)", opciones: [
                { id: "x1", valor: "Buena", puntos: 4 },
                { id: "x2", valor: "Débil", puntos: 2 },
                { id: "x3", valor: "Mala", puntos: 0 },
            ]},
            { id: "prueba-acido", nombre: "Prueba del Ácido (Activo Circ. − Invent. / Pasivo Circ.)", opciones: [
                { id: "y1", valor: "Buena", puntos: 4 },
                { id: "y2", valor: "Débil", puntos: 2 },
                { id: "y3", valor: "Mala", puntos: 0 },
            ]},
            { id: "cobertura-deuda", nombre: "Cobertura de deuda (EBITDA / Gastos Financieros)", opciones: [
                { id: "z1", valor: "Buena", puntos: 4 },
                { id: "z2", valor: "Débil", puntos: 2 },
                { id: "z3", valor: "Mala", puntos: 0 },
            ]},
            { id: "autosuficiencia", nombre: "Autosuficiencia Operativa", opciones: [
                { id: "aa1", valor: "Buena", puntos: 5 },
                { id: "aa2", valor: "Débil", puntos: 3 },
                { id: "aa3", valor: "Mala", puntos: 0 },
            ]},
            { id: "apalancamiento", nombre: "Apalancamiento (Pasivo Total / Capital Contable)", opciones: [
                { id: "ab1", valor: "Buena", puntos: 5 },
                { id: "ab2", valor: "Débil", puntos: 3 },
                { id: "ab3", valor: "Mala", puntos: 0 },
            ]},
            { id: "roa", nombre: "ROA", opciones: [
                { id: "ac1", valor: "Buena", puntos: 5 },
                { id: "ac2", valor: "Débil", puntos: 3 },
                { id: "ac3", valor: "Mala", puntos: 0 },
            ]},
            { id: "roe", nombre: "ROE", opciones: [
                { id: "ad1", valor: "Buena", puntos: 5 },
                { id: "ad2", valor: "Débil", puntos: 3 },
                { id: "ad3", valor: "Mala", puntos: 0 },
            ]},
        ],
    },
    {
        id: "infraestructura", nombre: "Infraestructura", color: "rose",
        factores: [
            { id: "estructura-org", nombre: "Estructura Organizacional", opciones: [
                { id: "ae1", valor: "Satisfactoria", puntos: 4 },
                { id: "ae2", valor: "Regular", puntos: 2 },
                { id: "ae3", valor: "Insuficiente o deficiente", puntos: 0 },
            ]},
            { id: "competencia-admin", nombre: "Competencia de la Administración", opciones: [
                { id: "af1", valor: "Buena", puntos: 4 },
                { id: "af2", valor: "Regular", puntos: 2 },
                { id: "af3", valor: "Mala", puntos: 0 },
            ]},
            { id: "manuales", nombre: "Manuales de Políticas y Procedimientos", opciones: [
                { id: "ag1", valor: "De todos sus procesos actualizados", puntos: 4 },
                { id: "ag2", valor: "De todos sus procesos desactualizados", puntos: 3 },
                { id: "ag3", valor: "De algunos procesos actualizados", puntos: 2 },
                { id: "ag4", valor: "De algunos procesos desactualizados", puntos: 1 },
                { id: "ag5", valor: "No existen", puntos: 0 },
            ]},
            { id: "tecnologia", nombre: "Infraestructura Tecnológica", opciones: [
                { id: "ah1", valor: "Suficiente con medidas de seguridad adecuadas", puntos: 4 },
                { id: "ah2", valor: "Suficiente con medidas de seguridad inadecuadas", puntos: 2 },
                { id: "ah3", valor: "Insuficiente con medidas de seguridad deficientes", puntos: 0 },
            ]},
        ],
    },
] as const;

export function computeMatrizScore(matrizRiesgoJson: string): { total: number; maxPuntos: number; resolucion: "Aprobado" | "Dudoso" | "Rechazado" } {
    let selecciones: Record<string, string> = {};
    try { selecciones = JSON.parse(matrizRiesgoJson || "{}"); } catch { /* ignore */ }

    let total = 0;
    let maxPuntos = 0;

    for (const section of MATRIX_SECTIONS) {
        for (const factor of section.factores) {
            const maxOp = Math.max(...(factor.opciones as readonly { id: string; valor: string; puntos: number }[]).map(o => o.puntos));
            maxPuntos += maxOp;
            const selectedId = selecciones[factor.id];
            if (selectedId) {
                const op = (factor.opciones as readonly { id: string; valor: string; puntos: number }[]).find(o => o.id === selectedId);
                if (op) total += op.puntos;
            }
        }
    }

    const resolucion = total >= 120 ? "Aprobado" : total >= 75 ? "Dudoso" : "Rechazado";
    return { total, maxPuntos, resolucion };
}
