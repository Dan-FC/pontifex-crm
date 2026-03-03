// ── src/lib/completitud.ts ────────────────────────────────────────────────────
// Módulo de completitud explicable para expedientes Nexus Pontifex.
// Calcula el % de completitud por categoría y genera un desglose auditable.

export interface CategoriaCompletitud {
    nombre: string;
    peso: number;           // Peso de esta categoría sobre el 100%
    pct: number;            // % completado dentro de la categoría (0–100)
    aportePct: number;      // Aporte real al total (peso * pct / 100)
    camposCompletos: string[];
    camposFaltantes: string[];
    observacion: string;
}

export interface ResultadoCompletitud {
    totalPct: number;       // Suma de aportePct de todas las categorías
    categorias: CategoriaCompletitud[];
}

// ── Tipo mínimo que necesitamos del expediente ────────────────────────────────
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
    alertas?: string;         // JSON "[...]"
    documentos?: Array<{
        estatus: string;
        ingresos?: string | null;
        egresos?: string | null;
    }>;
}

// ── Función principal ─────────────────────────────────────────────────────────
export function calcularCompletitud(exp: ExpedienteParaCalculo): ResultadoCompletitud {
    const categorias: CategoriaCompletitud[] = [

        // 1. Datos generales (20%)
        ((): CategoriaCompletitud => {
            const checks = [
                { campo: "Razón social", ok: !!exp.cliente?.trim() },
                { campo: "RFC", ok: !!exp.rfc?.trim() && exp.rfc !== "—" },
                { campo: "Sector", ok: !!exp.sector?.trim() },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 20;
            return {
                nombre: "Datos generales",
                peso,
                pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: faltantes.length === 0
                    ? "Todos los datos básicos están completos."
                    : `Faltan: ${faltantes.join(", ")}.`,
            };
        })(),

        // 2. Contacto principal (10%)
        ((): CategoriaCompletitud => {
            const checks = [
                { campo: "Nombre del contacto", ok: !!exp.contacto?.trim() },
                { campo: "Correo electrónico", ok: !!exp.email?.trim() },
                { campo: "Teléfono", ok: !!exp.telefono?.trim() },
                { campo: "Ejecutivo asignado", ok: !!exp.ejecutivo?.trim() },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 10;
            return {
                nombre: "Contacto principal",
                peso,
                pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: faltantes.length === 0
                    ? "Información de contacto completa."
                    : `Datos de contacto incompletos: ${faltantes.join(", ")}.`,
            };
        })(),

        // 3. Solicitud financiera (20%)
        ((): CategoriaCompletitud => {
            const checks = [
                { campo: "Tipo de financiamiento", ok: !!exp.tipoFinanciamiento?.trim() },
                { campo: "Monto solicitado", ok: !!exp.montoSolicitado?.trim() && exp.montoSolicitado !== "$0,000,000" },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 20;
            return {
                nombre: "Solicitud financiera",
                peso,
                pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: faltantes.length === 0
                    ? "La solicitud financiera está completa."
                    : `Completar: ${faltantes.join(", ")}.`,
            };
        })(),

        // 4. Documentación obligatoria (25%)
        ((): CategoriaCompletitud => {
            const docs = exp.documentos ?? [];
            const tieneDocProcesado = docs.some(d => d.estatus === "Procesado");
            const totalDocs = docs.length;
            const procesados = docs.filter(d => d.estatus === "Procesado").length;
            const pct = totalDocs === 0 ? 0 : Math.round((procesados / Math.max(totalDocs, 3)) * 100);
            const peso = 25;
            const completos = tieneDocProcesado ? [`${procesados} documento(s) procesado(s)`] : [];
            const faltantes = totalDocs === 0
                ? ["Al menos un estado de cuenta procesado por OCR"]
                : procesados === 0
                    ? ["Ningún documento ha sido procesado exitosamente"]
                    : [];
            return {
                nombre: "Documentación obligatoria",
                peso,
                pct: Math.min(pct, 100),
                aportePct: Math.round(peso * Math.min(pct, 100) / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: totalDocs === 0
                    ? "No se han cargado documentos. Suba estados de cuenta bancarios."
                    : tieneDocProcesado
                        ? `${procesados} de ${totalDocs} documentos procesados correctamente.`
                        : "Documentos pendientes de procesamiento OCR.",
            };
        })(),

        // 5. Análisis financiero (15%)
        ((): CategoriaCompletitud => {
            const docs = exp.documentos ?? [];
            const conAnalisis = docs.filter(d => d.ingresos && d.ingresos !== "No detectado");
            const tieneIngresos = conAnalisis.length > 0;
            const conEgresos = docs.filter(d => d.egresos && d.egresos !== "No detectado");
            const tieneEgresos = conEgresos.length > 0;
            const checks = [
                { campo: "Ingresos (depósitos) detectados", ok: tieneIngresos },
                { campo: "Egresos (retiros) detectados", ok: tieneEgresos },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 15;
            return {
                nombre: "Análisis financiero",
                peso,
                pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: pct === 100
                    ? "El OCR detectó ingresos y egresos correctamente."
                    : "El OCR no detectó todos los datos financieros. Verifique el PDF.",
            };
        })(),

        // 6. Validación fiscal/legal (10%)
        ((): CategoriaCompletitud => {
            let alertasArr: string[] = [];
            try { alertasArr = JSON.parse(exp.alertas || "[]"); } catch { alertasArr = []; }
            const rfcValido = !!exp.rfc?.trim() && exp.rfc !== "—" && exp.rfc.length >= 12;
            const sinAlertas = alertasArr.length === 0;
            const checks = [
                { campo: "RFC con formato válido", ok: rfcValido },
                { campo: "Sin alertas activas", ok: sinAlertas },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 10;
            return {
                nombre: "Validación fiscal/legal",
                peso,
                pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: pct === 100
                    ? "Sin alertas activas y RFC verificado."
                    : `Pendiente: ${faltantes.join(", ")}.`,
            };
        })(),

    ];

    const totalPct = categorias.reduce((acc, c) => acc + c.aportePct, 0);

    return { totalPct: Math.min(totalPct, 100), categorias };
}

