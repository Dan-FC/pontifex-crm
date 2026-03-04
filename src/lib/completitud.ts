// ── src/lib/completitud.ts ────────────────────────────────────────────────────
// Módulo de completitud explicable para expedientes Nexus Pontifex.
// La categoría "Documentación obligatoria" usa el checklist oficial de
// documentos-requeridos.ts como fuente de verdad.

import {
    CATEGORIAS_DOCUMENTOS,
    TOTAL_DOCUMENTOS_REQUERIDOS,
} from "./documentos-requeridos";

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
    }>;
}

// ── Función principal ─────────────────────────────────────────────────────────
export function calcularCompletitud(exp: ExpedienteParaCalculo): ResultadoCompletitud {

    const categorias: CategoriaCompletitud[] = [

        // 1. Datos generales (15%)
        ((): CategoriaCompletitud => {
            const checks = [
                { campo: "Razón social", ok: !!exp.cliente?.trim() },
                { campo: "RFC", ok: !!exp.rfc?.trim() && exp.rfc !== "—" },
                { campo: "Sector / Industria", ok: !!exp.sector?.trim() },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 15;
            return {
                nombre: "Datos generales",
                peso, pct,
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
                peso, pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: faltantes.length === 0
                    ? "Información de contacto completa."
                    : `Datos de contacto incompletos: ${faltantes.join(", ")}.`,
            };
        })(),

        // 3. Solicitud financiera (15%)
        ((): CategoriaCompletitud => {
            const checks = [
                { campo: "Tipo de financiamiento", ok: !!exp.tipoFinanciamiento?.trim() },
                { campo: "Monto solicitado", ok: !!exp.montoSolicitado?.trim() && exp.montoSolicitado !== "$0,000,000" },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 15;
            return {
                nombre: "Solicitud financiera",
                peso, pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: faltantes.length === 0
                    ? "La solicitud financiera está completa."
                    : `Completar: ${faltantes.join(", ")}.`,
            };
        })(),

        // 4. Documentación obligatoria (40%)
        // Usa el checklist oficial de 22 documentos en 5 categorías.
        ((): CategoriaCompletitud => {
            const docs = exp.documentos ?? [];
            // Construir un set de tipos/nombres de docs subidos
            const subidos = docs
                .map(d => `${d.tipo ?? ""} ${d.nombre ?? ""}`.toLowerCase().trim())
                .filter(Boolean);

            // Contar cuántos ítems del checklist oficial tienen cobertura
            // Un doc se considera cubierto si su id o primeras palabras del nombre
            // aparecen en alguno de los documentos subidos
            const todosLosDocOficiales = CATEGORIAS_DOCUMENTOS.flatMap(c => c.documentos);
            const cubiertos: string[] = [];
            const faltoltes: string[] = [];

            for (const docReq of todosLosDocOficiales) {
                const idLower = docReq.id.toLowerCase();
                const nombreLower = docReq.nombre.toLowerCase();
                const cobertura = subidos.some(s =>
                    s.includes(idLower) ||
                    idLower.split("-").some(kw => s.includes(kw)) ||
                    nombreLower.split(" ").slice(0, 3).some(kw => kw.length > 4 && s.includes(kw.toLowerCase()))
                );
                if (cobertura) cubiertos.push(docReq.nombre);
                else faltoltes.push(docReq.nombre);
            }

            // Puntaje parcial por categoría (para dar crédito parcial si faltan algunos)
            const docsProcesados = docs.filter(d => d.estatus === "Procesado").length;
            // Si hay documentos procesados por OCR (estado de cuenta bancario), acreditamos
            // la subcategoría "estados de cuenta bancarios"
            if (docsProcesados > 0 && faltoltes.includes("Estados de cuenta bancarios (últimos 12 meses)")) {
                const idx = faltoltes.indexOf("Estados de cuenta bancarios (últimos 12 meses)");
                faltoltes.splice(idx, 1);
                cubiertos.push("Estados de cuenta bancarios (últimos 12 meses) [OCR]");
            }

            const totalReq = TOTAL_DOCUMENTOS_REQUERIDOS;
            const pct = Math.min(Math.round((cubiertos.length / totalReq) * 100), 100);
            const peso = 40;

            return {
                nombre: "Documentación obligatoria",
                peso, pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: cubiertos,
                camposFaltantes: faltoltes,
                observacion: cubiertos.length === 0
                    ? `Ningún documento del checklist oficial (${totalReq} requeridos) ha sido registrado.`
                    : cubiertos.length === totalReq
                        ? "Checklist de documentos completado al 100%."
                        : `${cubiertos.length} de ${totalReq} documentos registrados. Faltan ${faltoltes.length}.`,
            };
        })(),

        // 5. Análisis financiero OCR (10%)
        ((): CategoriaCompletitud => {
            const docs = exp.documentos ?? [];
            const tieneIngresos = docs.some(d => d.ingresos && d.ingresos !== "No detectado");
            const tieneEgresos = docs.some(d => d.egresos && d.egresos !== "No detectado");
            const checks = [
                { campo: "Ingresos (depósitos) detectados por OCR", ok: tieneIngresos },
                { campo: "Egresos (retiros) detectados por OCR", ok: tieneEgresos },
            ];
            const completos = checks.filter(c => c.ok).map(c => c.campo);
            const faltantes = checks.filter(c => !c.ok).map(c => c.campo);
            const pct = Math.round((completos.length / checks.length) * 100);
            const peso = 10;
            return {
                nombre: "Análisis financiero OCR",
                peso, pct,
                aportePct: Math.round(peso * pct / 100),
                camposCompletos: completos,
                camposFaltantes: faltantes,
                observacion: pct === 100
                    ? "El OCR detectó ingresos y egresos correctamente."
                    : "Sube un estado de cuenta bancario para que el OCR detecte los datos financieros.",
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
                peso, pct,
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
