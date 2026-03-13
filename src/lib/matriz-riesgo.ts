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
                { id: "i1", valor: "Buen historial", puntos: 3 },
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
                { id: "q1", valor: "< 12 meses", puntos: 5 },
                { id: "q2", valor: "12 – 36 meses", puntos: 4 },
                { id: "q3", valor: "36 – 48 meses", puntos: 3 },
                { id: "q4", valor: "48 – 60 meses", puntos: 2 },
                { id: "q5", valor: "> 60 meses", puntos: 1 },
            ]},
        ],
    },
    {
        id: "capacidad-pago", nombre: "Capacidad de Pago", color: "indigo",
        factores: [
            { id: "endeud-sin", nombre: "Grado de endeudamiento sin préstamo", opciones: [
                { id: "v1", valor: "0 a 25", puntos: 6 },
                { id: "v2", valor: "26 a 50", puntos: 3 },
                { id: "v3", valor: "51 a 75", puntos: 2 },
                { id: "v4", valor: "76 a 100", puntos: 1 },
                { id: "v5", valor: "> 100", puntos: 0 },
            ]},
            { id: "endeud-con", nombre: "Grado de endeudamiento con préstamo", opciones: [
                { id: "w1", valor: "0 a 25", puntos: 6 },
                { id: "w2", valor: "26 a 50", puntos: 4 },
                { id: "w3", valor: "51 a 75", puntos: 3 },
                { id: "w4", valor: "76 a 100", puntos: 1 },
                { id: "w5", valor: "> 100", puntos: 0 },
            ]},
        ],
    },
    {
        id: "indicadores-fin", nombre: "Indicadores Financieros", color: "purple",
        factores: [
            { id: "razon-circ", nombre: "Razón Circulante (Pasivo Circ. / Activo Circ.)", opciones: [
                { id: "x1", valor: "Buena", puntos: 6 },
                { id: "x2", valor: "Débil", puntos: 3 },
                { id: "x3", valor: "Mala", puntos: 0 },
            ]},
            { id: "rotacion-activos", nombre: "Rotación de activos", opciones: [
                { id: "ra1", valor: "Buena", puntos: 4 },
                { id: "ra2", valor: "Débil", puntos: 2 },
                { id: "ra3", valor: "Mala", puntos: 0 },
            ]},
            { id: "rotacion-cxc", nombre: "Rotación de cuentas por cobrar", opciones: [
                { id: "rc1", valor: "Buena", puntos: 5 },
                { id: "rc2", valor: "Débil", puntos: 3 },
                { id: "rc3", valor: "Mala", puntos: 0 },
            ]},
            { id: "cobertura-deuda", nombre: "Cobertura de deuda (Utilidad de Operación / Gastos Financieros)", opciones: [
                { id: "z1", valor: "Buena", puntos: 6 },
                { id: "z2", valor: "Débil", puntos: 3 },
                { id: "z3", valor: "Mala", puntos: 0 },
            ]},
            { id: "razon-endeudamiento", nombre: "Razón de endeudamiento", opciones: [
                { id: "re1", valor: "Buena", puntos: 6 },
                { id: "re2", valor: "Débil", puntos: 3 },
                { id: "re3", valor: "Mala", puntos: 0 },
            ]},
            { id: "apalancamiento", nombre: "Deuda / Capital (Apalancamiento)", opciones: [
                { id: "ab1", valor: "Buena", puntos: 6 },
                { id: "ab2", valor: "Débil", puntos: 3 },
                { id: "ab3", valor: "Mala", puntos: 0 },
            ]},
            { id: "cobertura-intereses", nombre: "Cobertura de intereses", opciones: [
                { id: "ci1", valor: "Buena", puntos: 6 },
                { id: "ci2", valor: "Débil", puntos: 3 },
                { id: "ci3", valor: "Mala", puntos: 0 },
            ]},
            { id: "margen-neto", nombre: "Margen Neto", opciones: [
                { id: "mn1", valor: "Buena", puntos: 6 },
                { id: "mn2", valor: "Débil", puntos: 3 },
                { id: "mn3", valor: "Mala", puntos: 0 },
            ]},
            { id: "roa", nombre: "ROA", opciones: [
                { id: "ac1", valor: "Buena", puntos: 5 },
                { id: "ac2", valor: "Débil", puntos: 3 },
                { id: "ac3", valor: "Mala", puntos: 0 },
            ]},
            { id: "roe", nombre: "ROE", opciones: [
                { id: "ad1", valor: "Buena", puntos: 6 },
                { id: "ad2", valor: "Débil", puntos: 3 },
                { id: "ad3", valor: "Mala", puntos: 0 },
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

    const resolucion = total >= 80 ? "Aprobado" : total >= 60 ? "Dudoso" : "Rechazado";
    return { total, maxPuntos, resolucion };
}
