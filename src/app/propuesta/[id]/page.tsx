import { prisma } from "@/lib/prisma";
import { computeMatrizScore } from "@/lib/matriz-riesgo";
import { matchearInstituciones } from "@/lib/instituciones";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const metadata = { title: "Propuesta de Estructuración Financiera — Nexus Pontifex" };

function fmtDate(iso: string) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }); }
    catch { return iso; }
}
function fmtMoney(v: string) {
    if (!v) return "—";
    if (v.startsWith("$")) return v;
    const num = parseFloat(v.replace(/,/g, ""));
    if (isNaN(num)) return v;
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 });
}
function n(val: number | null | undefined) {
    if (val == null) return "—";
    return val.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(num: number | null | undefined, den: number | null | undefined) {
    if (num == null || den == null || den === 0) return "—";
    return ((num / den) * 100).toFixed(2) + "%";
}
function ratio(num: number | null | undefined, den: number | null | undefined, decimals = 2) {
    if (num == null || den == null || den === 0) return "—";
    return (num / den).toFixed(decimals) + "x";
}

const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 11pt; color: #1a1a2e; background: #e8e8e8; }
    .doc { max-width: 980px; margin: 24px auto; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.18); }

    @media print {
        body { background: white; font-size: 10pt; }
        .no-print { display: none !important; }
        .doc { margin: 0; box-shadow: none; max-width: 100%; }
        .page-break { page-break-before: always; }
    }

    /* ── COVER ── */
    .cover { background: #0a1628; min-height: 260px; padding: 0; position: relative; overflow: hidden; }
    .cover-stripe { position: absolute; top: 0; right: 0; width: 180px; height: 100%; background: #1a3a6e; clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%); }
    .cover-stripe2 { position: absolute; top: 0; right: 0; width: 90px; height: 100%; background: #c8a84b; clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%); }
    .cover-inner { position: relative; z-index: 2; padding: 40px 48px; }
    .cover-confidential { display: inline-block; border: 1.5px solid #c8a84b; color: #c8a84b; font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; padding: 3px 10px; margin-bottom: 28px; }
    .cover-title { font-family: Arial, sans-serif; font-size: 22pt; font-weight: 900; color: #ffffff; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 8px; }
    .cover-subtitle { font-family: Arial, sans-serif; font-size: 11pt; color: #8ba7d4; margin-bottom: 32px; font-weight: 400; }
    .cover-client { font-family: Arial, sans-serif; font-size: 14pt; font-weight: 700; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; margin-bottom: 4px; }
    .cover-meta { font-family: Arial, sans-serif; font-size: 9pt; color: #8ba7d4; }
    .cover-brand { position: absolute; bottom: 28px; right: 48px; z-index: 2; text-align: right; }
    .cover-brand-name { font-family: Arial, sans-serif; font-size: 13pt; font-weight: 900; color: #ffffff; letter-spacing: 2px; }
    .cover-brand-sub { font-family: Arial, sans-serif; font-size: 7.5pt; color: #c8a84b; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }

    /* ── SECTION HEADER ── */
    .sec-header { background: #0a1628; padding: 10px 48px; display: flex; align-items: center; gap: 14px; }
    .sec-num { font-family: Arial, sans-serif; font-size: 9pt; font-weight: 900; color: #c8a84b; min-width: 20px; }
    .sec-title { font-family: Arial, sans-serif; font-size: 10pt; font-weight: 800; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; }
    .sec-line { flex: 1; height: 1px; background: rgba(255,255,255,0.12); }

    /* ── CONTENT ── */
    .content { padding: 28px 48px; }

    /* ── TABLE LAYOUT ── */
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .data-table th { background: #f0f4f8; font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 0.8px; padding: 7px 12px; text-align: left; border: 1px solid #e2e8f0; }
    .data-table td { font-size: 10pt; padding: 8px 12px; border: 1px solid #e2e8f0; color: #1a1a2e; vertical-align: top; }
    .data-table tr:nth-child(even) td { background: #fafbfc; }
    .data-table .td-label { font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 700; color: #64748b; width: 38%; background: #f8fafc !important; }
    .data-table .td-val { font-size: 10.5pt; font-weight: 600; color: #0a1628; }

    /* ── KPI GRID ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .kpi-cell { background: #fff; padding: 14px 16px; }
    .kpi-cell-label { font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .kpi-cell-value { font-family: Arial, sans-serif; font-size: 17pt; font-weight: 900; color: #0a1628; line-height: 1; margin-bottom: 3px; }
    .kpi-cell-formula { font-family: 'Courier New', monospace; font-size: 7.5pt; color: #94a3b8; }
    .kpi-cell.good .kpi-cell-value { color: #15803d; }
    .kpi-cell.warn .kpi-cell-value { color: #b45309; }
    .kpi-cell.bad  .kpi-cell-value { color: #b91c1c; }

    /* ── SCORE ── */
    .score-wrap { border: 2px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .score-top { padding: 20px 28px; display: flex; align-items: center; gap: 28px; }
    .score-pts { font-family: Arial, sans-serif; font-size: 54pt; font-weight: 900; line-height: 1; }
    .score-verdict { font-family: Arial, sans-serif; font-size: 18pt; font-weight: 900; margin-bottom: 4px; }
    .score-desc-txt { font-size: 9.5pt; color: #64748b; font-family: Arial, sans-serif; line-height: 1.5; max-width: 400px; }
    .score-bar-wrap { padding: 0 28px 20px; }
    .score-bar-track { background: #e2e8f0; border-radius: 4px; height: 8px; position: relative; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .score-bar-labels { display: flex; justify-content: space-between; margin-top: 5px; font-family: Arial, sans-serif; font-size: 7.5pt; color: #94a3b8; }

    /* ── INSTITUTIONS TABLE ── */
    .inst-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .inst-table th { background: #0a1628; color: #c8a84b; font-family: Arial, sans-serif; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 10px; text-align: left; overflow: hidden; }
    .inst-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt; vertical-align: middle; overflow: hidden; word-break: break-word; }
    .inst-table tr:last-child td { border-bottom: none; }
    .inst-table tr:nth-child(even) td { background: #f9fafb; }
    .inst-table .col-num  { width: 28px; }
    .inst-table .col-inst { width: 26%; }
    .inst-table .col-tipo { width: 13%; }
    .inst-table .col-prod { width: 27%; }
    .inst-table .col-cob  { width: 24%; }
    .inst-table .col-comp { width: 7%; }
    .inst-tipo { display: inline-block; font-family: Arial, sans-serif; font-size: 7pt; font-weight: 800; padding: 2px 6px; border-radius: 3px; background: #dbeafe; color: #1e40af; word-break: break-word; }
    .inst-compat { display: inline-block; font-family: Arial, sans-serif; font-size: 11pt; color: #15803d; font-weight: 900; }

    /* ── FINANCIAL SUMMARY ROW ── */
    .fin-sum { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 16px; }
    .fin-sum-cell { padding: 14px 18px; border-right: 1px solid #e2e8f0; }
    .fin-sum-cell:last-child { border-right: none; }
    .fin-sum-label { font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .fin-sum-value { font-family: Arial, sans-serif; font-size: 14pt; font-weight: 900; color: #0a1628; }
    .fin-sum-sub { font-family: Arial, sans-serif; font-size: 8pt; color: #94a3b8; margin-top: 2px; }

    /* ── SIGNATURE ── */
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 8px; }
    .sig-box { border-top: 1.5px solid #0a1628; padding-top: 8px; }
    .sig-name { font-family: Arial, sans-serif; font-size: 9.5pt; font-weight: 700; color: #0a1628; }
    .sig-role { font-family: Arial, sans-serif; font-size: 8.5pt; color: #64748b; margin-top: 2px; }

    /* ── FOOTER ── */
    .doc-footer { background: #0a1628; padding: 14px 48px; display: flex; justify-content: space-between; align-items: center; }
    .doc-footer p { font-family: Arial, sans-serif; font-size: 8pt; color: #4a6080; }
    .doc-footer .gold { color: #c8a84b; }

    /* ── NOTE ── */
    .note { background: #f8fafc; border-left: 3px solid #c8a84b; padding: 10px 14px; font-size: 8.5pt; color: #64748b; font-family: Arial, sans-serif; line-height: 1.55; border-radius: 0 4px 4px 0; }

    /* ── DIVIDER ── */
    .divider { height: 1px; background: #e2e8f0; margin: 0 48px; }
`;

export default async function PropuestaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const expediente = await prisma.expediente.findUnique({
        where: { id },
        include: { documentos: { orderBy: { fecha: "desc" } } },
    });
    if (!expediente) notFound();

    const matrizScore = computeMatrizScore(expediente.matrizRiesgo);

    const lastFinDoc = [...(expediente.documentos as any[])]
        .filter((d: any) => d.tipo === "estados-financieros" && d.datosExtraidos)
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    const finData = lastFinDoc?.datosExtraidos
        ? (() => { try { return JSON.parse(lastFinDoc.datosExtraidos); } catch { return null; } })()
        : null;
    const lastPd = finData?.periodData?.[finData.periodData.length - 1];
    const bg = lastPd?.balanceGeneral ?? {};
    const er = lastPd?.estadoResultados ?? {};
    const solvencia: "Utilidad" | "Pérdida" | null =
        er.utilidadNeta == null ? null : er.utilidadNeta > 0 ? "Utilidad" : "Pérdida";

    const instituciones = matchearInstituciones(
        { sector: expediente.sector, tipoFinanciamiento: expediente.tipoFinanciamiento, fechaConstitucion: expediente.fechaConstitucion, fechaAlta: expediente.fechaAlta.toISOString() },
        solvencia,
    ).filter(r => r.nivel === "Alta").slice(0, 6);

    const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

    const scoreColor = matrizScore.resolucion === "Aprobado" ? "#15803d" : matrizScore.resolucion === "Dudoso" ? "#b45309" : "#b91c1c";
    const scoreBg   = matrizScore.resolucion === "Aprobado" ? "#f0fdf4" : matrizScore.resolucion === "Dudoso" ? "#fffbeb" : "#fef2f2";
    const scorePct  = Math.min((matrizScore.total / matrizScore.maxPuntos) * 100, 100);

    // Año de constitución → antigüedad
    let antiguedad = "—";
    if (expediente.fechaConstitucion) {
        const years = new Date().getFullYear() - new Date(expediente.fechaConstitucion).getFullYear();
        antiguedad = years > 0 ? `${years} año${years !== 1 ? "s" : ""}` : "Menos de 1 año";
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <div className="doc">

                {/* ══ PORTADA ══════════════════════════════════════════════════ */}
                <div className="cover">
                    <div className="cover-stripe" />
                    <div className="cover-stripe2" />
                    <div className="cover-inner">
                        <div className="cover-confidential">Confidencial</div>
                        <div className="cover-title">Propuesta de<br />Estructuración Financiera</div>
                        <div className="cover-subtitle">Análisis integral de viabilidad crediticia y opciones de financiamiento</div>
                        <div className="cover-client">{expediente.cliente}</div>
                        <div className="cover-meta">
                            RFC: {expediente.rfc || "—"} &nbsp;·&nbsp; {expediente.sector || "—"} &nbsp;·&nbsp; Folio #{expediente.folio}
                        </div>
                    </div>
                    <div className="cover-brand">
                        <div className="cover-brand-name">NEXUS PONTIFEX</div>
                        <div className="cover-brand-sub">Motor Inteligente de Estructuración Financiera</div>
                        <div style={{ fontFamily: "Arial", fontSize: "8pt", color: "#4a6080", marginTop: "6px" }}>{today}</div>
                    </div>
                </div>

                {/* ══ I. DATOS DEL SOLICITANTE ════════════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">I</span>
                    <span className="sec-title">Datos del Solicitante</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    <table className="data-table">
                        <tbody>
                            <tr>
                                <td className="td-label">Razón Social</td>
                                <td className="td-val">{expediente.cliente}</td>
                                <td className="td-label">RFC</td>
                                <td className="td-val" style={{ fontFamily: "monospace" }}>{expediente.rfc || "—"}</td>
                            </tr>
                            <tr>
                                <td className="td-label">Sector Económico</td>
                                <td className="td-val">{expediente.sector || "—"}</td>
                                <td className="td-label">Antigüedad</td>
                                <td className="td-val">{antiguedad}</td>
                            </tr>
                            <tr>
                                <td className="td-label">Contacto</td>
                                <td className="td-val">{expediente.contacto || "—"}</td>
                                <td className="td-label">Teléfono</td>
                                <td className="td-val">{expediente.telefono || "—"}</td>
                            </tr>
                            <tr>
                                <td className="td-label">Correo Electrónico</td>
                                <td className="td-val">{expediente.email || "—"}</td>
                                <td className="td-label">Fecha de Constitución</td>
                                <td className="td-val">{expediente.fechaConstitucion ? fmtDate(expediente.fechaConstitucion) : "—"}</td>
                            </tr>
                            <tr>
                                <td className="td-label">Ejecutivo Asignado</td>
                                <td className="td-val">{expediente.ejecutivo}</td>
                                <td className="td-label">Fecha del Análisis</td>
                                <td className="td-val">{today}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ══ II. SOLICITUD DE FINANCIAMIENTO ═════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">II</span>
                    <span className="sec-title">Solicitud de Financiamiento</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    <div className="fin-sum">
                        <div className="fin-sum-cell">
                            <div className="fin-sum-label">Monto Solicitado</div>
                            <div className="fin-sum-value">{fmtMoney(expediente.montoSolicitado)}</div>
                            <div className="fin-sum-sub">Pesos mexicanos</div>
                        </div>
                        <div className="fin-sum-cell">
                            <div className="fin-sum-label">Tipo de Financiamiento</div>
                            <div className="fin-sum-value" style={{ fontSize: "11pt" }}>{expediente.tipoFinanciamiento || "—"}</div>
                            <div className="fin-sum-sub">Producto solicitado</div>
                        </div>
                        <div className="fin-sum-cell">
                            <div className="fin-sum-label">Etapa Actual</div>
                            <div className="fin-sum-value" style={{ fontSize: "11pt" }}>{expediente.etapaNombre}</div>
                            <div className="fin-sum-sub">Completitud: {expediente.completitud}%</div>
                        </div>
                    </div>
                    {expediente.observaciones && (
                        <div className="note">
                            <strong>Observaciones del ejecutivo:</strong> {expediente.observaciones}
                        </div>
                    )}
                </div>

                {/* ══ III. ANÁLISIS FINANCIERO ════════════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">III</span>
                    <span className="sec-title">Análisis Financiero</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    {finData && lastPd ? (
                        <>
                            <div style={{ fontFamily: "Arial", fontSize: "8.5pt", color: "#64748b", marginBottom: "14px" }}>
                                Información financiera correspondiente al período: <strong>{(finData.periodos ?? []).join(" · ") || "—"}</strong>.
                                Fuente: {lastFinDoc?.nombre ?? "Estado financiero"}
                            </div>

                            {/* Balance General */}
                            <div style={{ fontFamily: "Arial", fontSize: "9pt", fontWeight: 800, color: "#0a1628", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Balance General</div>
                            <table className="data-table" style={{ marginBottom: "16px" }}>
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th style={{ textAlign: "right" }}>Importe (MXN)</th>
                                        <th>Concepto</th>
                                        <th style={{ textAlign: "right" }}>Importe (MXN)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="td-label">Activo Circulante</td>
                                        <td style={{ textAlign: "right" }}>${n(bg.activoCirculante)}</td>
                                        <td className="td-label">Pasivo Circulante</td>
                                        <td style={{ textAlign: "right" }}>${n(bg.pasivoCirculante)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Activo Fijo</td>
                                        <td style={{ textAlign: "right" }}>${n(bg.activoFijo)}</td>
                                        <td className="td-label">Pasivo a Largo Plazo</td>
                                        <td style={{ textAlign: "right" }}>${n(bg.pasivoLargoPlazo)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Inventarios</td>
                                        <td style={{ textAlign: "right" }}>${n(bg.inventarios)}</td>
                                        <td className="td-label">Pasivo Total</td>
                                        <td style={{ textAlign: "right", fontWeight: 700 }}>${n(bg.pasivoTotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Activo Total</td>
                                        <td style={{ textAlign: "right", fontWeight: 700 }}>${n(bg.activoTotal)}</td>
                                        <td className="td-label">Capital Contable</td>
                                        <td style={{ textAlign: "right", fontWeight: 700 }}>${n(bg.capitalContable)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Estado de Resultados */}
                            <div style={{ fontFamily: "Arial", fontSize: "9pt", fontWeight: 800, color: "#0a1628", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Estado de Resultados</div>
                            <table className="data-table" style={{ marginBottom: "16px" }}>
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th style={{ textAlign: "right" }}>Importe (MXN)</th>
                                        <th>Concepto</th>
                                        <th style={{ textAlign: "right" }}>Importe (MXN)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="td-label">Ventas Netas</td>
                                        <td style={{ textAlign: "right" }}>${n(er.ventas)}</td>
                                        <td className="td-label">Gastos de Operación</td>
                                        <td style={{ textAlign: "right" }}>${n(er.gastosOperacion)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Costo de Ventas</td>
                                        <td style={{ textAlign: "right" }}>${n(er.costoVenta)}</td>
                                        <td className="td-label">Gastos Financieros</td>
                                        <td style={{ textAlign: "right" }}>${n(er.gastosFinancieros)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Utilidad Bruta</td>
                                        <td style={{ textAlign: "right" }}>${n(er.utilidadBruta)}</td>
                                        <td className="td-label">Utilidad Operativa</td>
                                        <td style={{ textAlign: "right" }}>${n(er.utilidadOperacion)}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-label">Utilidad Neta</td>
                                        <td style={{ textAlign: "right", fontWeight: 700, color: (er.utilidadNeta ?? 0) >= 0 ? "#15803d" : "#b91c1c" }}>${n(er.utilidadNeta)}</td>
                                        <td className="td-label">Solvencia</td>
                                        <td style={{ textAlign: "right", fontWeight: 700, color: solvencia === "Utilidad" ? "#15803d" : "#b91c1c" }}>{solvencia ?? "Sin datos"}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Indicadores */}
                            <div style={{ fontFamily: "Arial", fontSize: "9pt", fontWeight: 800, color: "#0a1628", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Indicadores Clave de Desempeño</div>
                            <div className="kpi-grid">
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Razón Corriente</div>
                                    <div className="kpi-cell-value">{ratio(bg.activoCirculante, bg.pasivoCirculante)}</div>
                                    <div className="kpi-cell-formula">Act. Circ. / Pas. Circ.</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Prueba Ácida</div>
                                    <div className="kpi-cell-value">
                                        {bg.activoCirculante != null && bg.inventarios != null && bg.pasivoCirculante != null && bg.pasivoCirculante !== 0
                                            ? ((bg.activoCirculante - bg.inventarios) / bg.pasivoCirculante).toFixed(2) + "x" : "—"}
                                    </div>
                                    <div className="kpi-cell-formula">(Act. Circ. − Inv.) / Pas. Circ.</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Endeudamiento</div>
                                    <div className="kpi-cell-value">{pct(bg.pasivoTotal, bg.activoTotal)}</div>
                                    <div className="kpi-cell-formula">Pas. Total / Act. Total</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Deuda / Capital</div>
                                    <div className="kpi-cell-value">{ratio(bg.pasivoTotal, bg.capitalContable)}</div>
                                    <div className="kpi-cell-formula">Pas. Total / Cap. Contable</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Margen Neto</div>
                                    <div className="kpi-cell-value">{pct(er.utilidadNeta, er.ventas)}</div>
                                    <div className="kpi-cell-formula">Util. Neta / Ventas</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">ROA</div>
                                    <div className="kpi-cell-value">{pct(er.utilidadNeta, bg.activoTotal)}</div>
                                    <div className="kpi-cell-formula">Util. Neta / Act. Total</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">ROE</div>
                                    <div className="kpi-cell-value">{pct(er.utilidadNeta, bg.capitalContable)}</div>
                                    <div className="kpi-cell-formula">Util. Neta / Cap. Contable</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Rot. de Activos</div>
                                    <div className="kpi-cell-value">{ratio(er.ventas, bg.activoTotal)}</div>
                                    <div className="kpi-cell-formula">Ventas / Act. Total</div>
                                </div>
                                <div className="kpi-cell">
                                    <div className="kpi-cell-label">Cob. de Intereses</div>
                                    <div className="kpi-cell-value">{ratio(er.utilidadOperacion, er.gastosFinancieros)}</div>
                                    <div className="kpi-cell-formula">Util. Op. / Gs. Financieros</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="note">No se encontraron estados financieros procesados en el expediente. Se recomienda solicitar y cargar los estados financieros antes de presentar esta propuesta a las instituciones.</div>
                    )}
                </div>

                {/* ══ IV. EVALUACIÓN DE RIESGO ════════════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">IV</span>
                    <span className="sec-title">Evaluación Interna de Riesgo</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    <div style={{ fontFamily: "Arial", fontSize: "8.5pt", color: "#64748b", marginBottom: "14px" }}>
                        Evaluación basada en la Matriz de Riesgo Nexus Pontifex — 7 categorías, {matrizScore.maxPuntos} puntos posibles.
                        Umbral de aprobación: ≥ 120 pts. Rango dudoso: 75–119 pts.
                    </div>
                    <div className="score-wrap">
                        <div className="score-top" style={{ background: scoreBg }}>
                            <div className="score-pts" style={{ color: scoreColor }}>{matrizScore.total}</div>
                            <div>
                                <div className="score-verdict" style={{ color: scoreColor }}>{matrizScore.resolucion}</div>
                                <div className="score-desc-txt">
                                    {matrizScore.resolucion === "Aprobado" && "La empresa cumple los criterios mínimos establecidos por Nexus Pontifex para ser presentada ante instituciones financieras con una recomendación favorable."}
                                    {matrizScore.resolucion === "Dudoso" && "La empresa se encuentra en un rango de revisión. Se requiere dictamen adicional o condiciones especiales por parte de la institución financiera antes de proceder."}
                                    {matrizScore.resolucion === "Rechazado" && "La empresa no cumple los criterios mínimos establecidos. Se recomienda fortalecer las áreas deficientes antes de presentar la solicitud ante instituciones financieras."}
                                </div>
                            </div>
                        </div>
                        <div className="score-bar-wrap">
                            <div className="score-bar-track">
                                <div className="score-bar-fill" style={{ width: `${scorePct}%`, background: scoreColor }} />
                            </div>
                            <div className="score-bar-labels">
                                <span>0</span>
                                <span style={{ color: "#b91c1c" }}>Rechazado &lt;75</span>
                                <span style={{ color: "#b45309" }}>Dudoso 75–119</span>
                                <span style={{ color: "#15803d" }}>Aprobado ≥120</span>
                                <span>{matrizScore.maxPuntos}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ V. OPCIONES DE FINANCIAMIENTO ═══════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">V</span>
                    <span className="sec-title">Opciones de Financiamiento Recomendadas</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    {instituciones.length > 0 ? (
                        <>
                            <div style={{ fontFamily: "Arial", fontSize: "8.5pt", color: "#64748b", marginBottom: "12px" }}>
                                Las siguientes instituciones forman parte del portafolio ORO de Nexus Pontifex y presentan alta compatibilidad con el perfil del solicitante. La elegibilidad final está sujeta al análisis individual de cada institución.
                            </div>
                            <table className="inst-table">
                                <colgroup>
                                    <col className="col-num" />
                                    <col className="col-inst" />
                                    <col className="col-tipo" />
                                    <col className="col-prod" />
                                    <col className="col-cob" />
                                    <col className="col-comp" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Institución</th>
                                        <th>Tipo</th>
                                        <th>Productos</th>
                                        <th>Cobertura</th>
                                        <th style={{ textAlign: "center" }}>✓</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {instituciones.map((r, i) => (
                                        <tr key={r.institucion.id}>
                                            <td style={{ fontFamily: "Arial", fontSize: "8pt", color: "#94a3b8", fontWeight: 700 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 700, fontSize: "9pt" }}>{r.institucion.nombre}</td>
                                            <td><span className="inst-tipo">{r.institucion.tipo}</span></td>
                                            <td style={{ color: "#374151" }}>{r.institucion.productos.join(", ")}</td>
                                            <td style={{ color: "#374151" }}>{r.institucion.cobertura.join(", ")}</td>
                                            <td style={{ textAlign: "center" }}><span className="inst-compat">✓</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div className="note">No se identificaron instituciones con alta compatibilidad para el perfil actual. Se recomienda revisar el tipo de financiamiento solicitado y el sector de la empresa.</div>
                    )}
                </div>

                {/* ══ VI. DECLARACIÓN Y FIRMAS ════════════════════════════════ */}
                <div className="sec-header">
                    <span className="sec-num">VI</span>
                    <span className="sec-title">Declaración y Firmas</span>
                    <div className="sec-line" />
                </div>
                <div className="content">
                    <div className="note" style={{ marginBottom: "24px" }}>
                        El presente documento ha sido elaborado por <strong>Nexus Pontifex</strong> en su carácter de intermediario y estructurador financiero, con base en la información proporcionada por el solicitante. Nexus Pontifex no garantiza la aprobación del financiamiento, el cual queda sujeto al análisis y resolución exclusiva de cada institución financiera. La información contenida en este documento es de carácter confidencial y no deberá ser divulgada a terceros sin autorización expresa de las partes.
                    </div>
                    <div className="sig-grid">
                        <div>
                            <div style={{ height: "50px" }} />
                            <div className="sig-box">
                                <div className="sig-name">{expediente.ejecutivo}</div>
                                <div className="sig-role">Ejecutivo de Estructuración — Nexus Pontifex</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ height: "50px" }} />
                            <div className="sig-box">
                                <div className="sig-name">{expediente.contacto || expediente.cliente}</div>
                                <div className="sig-role">Representante Legal — {expediente.cliente}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ FOOTER ══════════════════════════════════════════════════ */}
                <div className="doc-footer">
                    <p><span className="gold">NEXUS PONTIFEX</span> · Motor Inteligente de Estructuración Financiera</p>
                    <p>Folio #{expediente.folio} · {today}</p>
                </div>
            </div>

            <PrintButton />
        </>
    );
}
