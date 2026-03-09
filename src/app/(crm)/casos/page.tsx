"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, User, FileText, BarChart2, Building2,
    AlertTriangle, ChevronRight, Plus, X, Loader2,
    Download, CheckCircle2, AlertCircle, Table2, Info,
    UploadCloud, ChevronDown, ChevronUp, Clock, XCircle, Ban,
} from "lucide-react";
import {
    ETAPAS_PROCESO, SITUACION_COLORS, ETAPA_COLORS,
    MOCK_DOCUMENTOS, DOC_ESTATUS_COLORS,
} from "@/lib/mock-data";
import { matchearInstituciones, NIVEL_COLORS, TIPO_COLORS } from "@/lib/instituciones";
import { CATEGORIAS_DOCUMENTOS, TOTAL_DOCUMENTOS_REQUERIDOS } from "@/lib/documentos-requeridos";


// ── API type (matches Prisma Expediente) ─────────────────────────────────────
type ApiExpediente = {
    id: string;
    cliente: string;
    rfc: string;
    sector: string;
    email: string;
    telefono: string;
    contacto: string;
    ejecutivo: string;
    tipoFinanciamiento: string;
    montoSolicitado: string;
    etapa: number;
    etapaNombre: string;
    situacion: string;
    completitud: number;
    observaciones: string;
    alertas: string;        // JSON string "[...]"
    matrizRiesgo: string;   // JSON string "{factorId: opcionId}"
    fechaConstitucion: string;
    fechaAlta: string;
    ultimaActualizacion: string;
    folio: number;
    rechazoMotivo: string;
    rechazoResponsable: string;
    rechazoFecha: string;
    documentos?: any[];
    datosFinancieros?: any;
};

type Case = ApiExpediente;

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const AÑOS = Array.from({ length: 10 }, (_, i) => 2020 + i);
const COMPATIBILIDAD_ICONS: Record<string, string> = {
    "Alta": "🟢",
    "Compatible con condiciones": "🟡",
    "Requiere información adicional": "🔴",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CompletitudBar({ value }: { value: number }) {
    const color = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-400" : "bg-red-400";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
        </div>
    );
}

// Completitud accordion — shows per-category explainable breakdown
function CompletitudDesglose({ caso }: { caso: Case }) {
    const [open, setOpen] = useState(false);
    const [detalle, setDetalle] = useState<any>(null);

    const load = async () => {
        if (detalle) { setOpen(!open); return; }
        try {
            const res = await fetch(`/api/expedientes/${caso.id}`);
            const json = await res.json();
            if (json.completitudDetalle) {
                setDetalle(json.completitudDetalle);
                setOpen(true);
            }
        } catch { /* ignore */ }
    };

    return (
        <div className="mt-4 border-t border-gray-100 pt-4">
            <button onClick={load}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold w-full justify-between">
                <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />¿Cómo se calculó la completitud?</span>
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {open && detalle && (
                <div className="mt-3 space-y-2">
                    {detalle.categorias.map((cat: any) => (
                        <div key={cat.nombre} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-gray-700">{cat.nombre}</span>
                                <span className="text-xs font-mono text-gray-500">Peso {cat.peso}% → Aporte {cat.aportePct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                                <div className={`h-1 rounded-full ${cat.pct >= 80 ? 'bg-emerald-500' : cat.pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${cat.pct}%` }} />
                            </div>
                            {cat.camposFaltantes.length > 0 && (
                                <p className="text-xs text-red-600">Falta: {cat.camposFaltantes.join(', ')}</p>
                            )}
                            {cat.camposCompletos.length > 0 && (
                                <p className="text-xs text-emerald-600">{cat.camposCompletos.join(', ')}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1 italic">{cat.observacion}</p>
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 text-right pt-1">Total calculado: <strong className="text-gray-700">{detalle.totalPct}%</strong></p>
                </div>
            )}
        </div>
    );
}


// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return iso; }
}
function fmtMoney(v: string) {
    if (!v) return "—";
    if (v.startsWith("$")) return v;
    const n = parseFloat(v.replace(/,/g, ""));
    if (isNaN(n)) return v;
    return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 });
}

function TabResumen({ caso, onUpdate }: { caso: Case; onUpdate?: (updated: Case) => void }) {
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        rfc: caso.rfc ?? "",
        contacto: caso.contacto ?? "",
        email: caso.email ?? "",
        telefono: caso.telefono ?? "",
        montoSolicitado: caso.montoSolicitado ?? "",
        sector: caso.sector ?? "",
        fechaConstitucion: caso.fechaConstitucion ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const handleSave = async () => {
        setSaving(true); setSaveMsg("");
        try {
            const res = await fetch(`/api/expedientes/${caso.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Error al guardar");
            setSaveMsg("Guardado correctamente.");
            setEditing(false);
            onUpdate?.(json.data);
        } catch (err: any) {
            setSaveMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h2 className="text-xl font-extrabold text-gray-900">{caso.cliente}</h2>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${SITUACION_COLORS[caso.situacion]}`}>{caso.situacion}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            RFC: <span className={`font-mono font-semibold ${caso.rfc ? "text-gray-700" : "text-red-400 italic"}`}>{caso.rfc || "Sin RFC — edita los datos"}</span>
                            <span className="mx-2 text-gray-200">·</span>
                            Alta: {fmtDate(caso.fechaAlta)}
                            <span className="mx-2 text-gray-200">·</span>
                            Actualizado: {fmtDate(caso.ultimaActualizacion)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Monto solicitado</p>
                        <p className="text-2xl font-extrabold text-indigo-600">{fmtMoney(caso.montoSolicitado)}</p>
                        <p className="text-xs text-gray-400">{caso.tipoFinanciamiento}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Completitud del expediente</p>
                    <CompletitudBar value={caso.completitud} />
                    <CompletitudDesglose caso={caso} />
                </div>
            </div>

            {/* Datos editables */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />Datos del expediente
                    </p>
                    {!editing ? (
                        <button onClick={() => setEditing(true)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">
                            Editar
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditing(false)}
                                className="text-xs text-gray-500 font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancelar</button>
                            <button onClick={handleSave} disabled={saving}
                                className="text-xs text-white font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-all">
                                {saving ? <><Loader2 className="w-3 h-3 animate-spin" />Guardando</> : "Guardar cambios"}
                            </button>
                        </div>
                    )}
                </div>
                {saveMsg && (
                    <p className={`text-xs mb-3 px-3 py-2 rounded-lg ${saveMsg.includes("Error") ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>{saveMsg}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                        { key: "rfc",               label: "RFC",                    type: "text",  placeholder: "XAXX010101000",        view: caso.rfc,               warn: !caso.rfc },
                        { key: "contacto",          label: "Contacto",               type: "text",  placeholder: "Nombre director",       view: caso.contacto,          warn: false },
                        { key: "email",             label: "Correo",                 type: "email", placeholder: "contacto@empresa.mx",   view: caso.email,             warn: false },
                        { key: "telefono",          label: "Teléfono",               type: "text",  placeholder: "662 XXX XXXX",          view: caso.telefono,          warn: false },
                        { key: "montoSolicitado",   label: "Monto solicitado",       type: "text",  placeholder: "$0,000,000",            view: caso.montoSolicitado,   warn: false },
                        { key: "sector",            label: "Sector",                 type: "text",  placeholder: "Construcción",          view: caso.sector,            warn: false },
                        { key: "fechaConstitucion", label: "Fecha de constitución",  type: "date",  placeholder: "",                      view: caso.fechaConstitucion ? fmtDate(caso.fechaConstitucion) : "", warn: !caso.fechaConstitucion },
                    ] as Array<{ key: keyof typeof editForm; label: string; type: string; placeholder: string; view: string; warn: boolean }>).map(({ key, label, type, placeholder, view, warn }) => (
                        <div key={key}>
                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                            {editing ? (
                                <input
                                    type={type}
                                    value={editForm[key]}
                                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 pb-0.5"
                                />
                            ) : (
                                <p className={`text-sm font-semibold ${warn ? "text-red-400 italic" : "text-gray-800"}`}>
                                    {view || "—"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

// ─── DocUploadPanel — panel de subida para cada documento del checklist ────────
// Para el estado de cuenta bancario muestra preview OCR + descarga Excel.
// Para otros documentos, registra el archivo y marca como entregado.
interface UploadedDocInfo {
    nombre: string;
    estatus: string;
    url?: string;
    docDbId?: string;   // DB id del registro creado (para PATCH/DELETE)
    // Bank statement OCR
    ingresos?: string;
    egresos?: string;
    periodo?: string;
    movimientos?: string;
    txtContent?: string;
    txtFilename?: string;
    // Financial statement OCR
    financialData?: any;
}

type DbDoc = {
    id: string;
    tipo: string;
    nombre: string;
    estatus: string;
    fecha: string;
    url?: string;
    datosExtraidos?: string;
};

const FINANCIAL_STATEMENT_IDS = ["estados-financieros"];

function DocUploadPanel({
    docId, docNombre, casoId,
    onSuccess,
}: {
    docId: string; docNombre: string; casoId: string;
    onSuccess: (info: UploadedDocInfo) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const isBankStatement = docId === "estados-cuenta-banco";
    const isFinancialStatement = FINANCIAL_STATEMENT_IDS.includes(docId);

    const handleFile = async (f: File) => {
        if (!f || f.type !== "application/pdf") { setError("Solo archivos PDF."); return; }
        setUploading(true); setError("");
        try {
            // Un solo viaje de red — el servidor maneja OCR, Supabase y DB
            const formData = new FormData();
            formData.append("pdf", f);
            formData.append("docId", docId);
            formData.append("nombre", f.name);

            const res = await fetch(`/api/expedientes/${casoId}/documentos`, { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al registrar");

            const ocr = data.ocrData;
            if (isBankStatement && ocr) {
                onSuccess({
                    nombre: f.name, estatus: "Procesado",
                    url: data.data?.url,
                    ingresos: ocr.ingresos_totales,
                    egresos: ocr.egresos_totales,
                    periodo: ocr.periodo,
                    movimientos: ocr.movimientos,
                });
            } else if (isFinancialStatement && ocr) {
                onSuccess({
                    nombre: f.name, estatus: "Procesado",
                    url: data.data?.url,
                    docDbId: data.data?.id,
                    financialData: ocr,
                });
            } else {
                onSuccess({ nombre: f.name, estatus: "Entregado", url: data.data?.url });
            }
        } catch (err: any) { setError(err.message); }
        finally { setUploading(false); }
    };

    const uploadLabel = isBankStatement
        ? "Subir estado de cuenta (PDF)"
        : isFinancialStatement
            ? `Subir ${docNombre} (PDF)`
            : `Subir ${docNombre.split("/")[0].trim()} (PDF)`;

    const uploadHint = isBankStatement
        ? "Se extraerán los datos financieros automáticamente"
        : isFinancialStatement
            ? "Se extraerán Balance General, Estado de Resultados y KPIs"
            : null;

    const loadingLabel = (isBankStatement || isFinancialStatement) ? "Analizando con OCR…" : "Registrando documento…";

    return (
        <div className="mt-2 ml-8 mr-2">
            {uploading ? (
                <div className="flex items-center gap-2 py-3 px-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-600 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingLabel}
                </div>
            ) : (
                <label className="flex items-center gap-3 py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all">
                    <UploadCloud className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-blue-600">{uploadLabel}</p>
                        {uploadHint && <p className="text-xs text-gray-400">{uploadHint}</p>}
                    </div>
                    <input type="file" accept="application/pdf" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
            )}
            {error && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
            )}
        </div>
    );
}

// ─── BankStatementPreview — tabla de datos OCR + Excel download ───────────────
function BankStatementPreview({ info, casoId }: { info: UploadedDocInfo; casoId: string }) {
    const [año, setAño] = useState(2020);
    const [mes, setMes] = useState("Enero");
    const [excelStatus, setExcelStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [excelResult, setExcelResult] = useState<any>(null);
    const [excelError, setExcelError] = useState("");

    const hasData = info.ingresos && info.ingresos !== "No detectado";

    const handleExcel = async () => {
        setExcelStatus("loading"); setExcelError("");
        try {
            const res = await fetch("/api/generate-excel", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: casoId, año, mes, saldoAnterior: info.ingresos, saldoFinal: info.egresos }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            setExcelResult(data); setExcelStatus("done");
        } catch (err: any) { setExcelError(err.message); setExcelStatus("error"); }
    };

    const handleDownloadTxt = () => {
        if (!info.txtContent) return;
        const blob = new Blob([info.txtContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = info.txtFilename || "reporte.txt";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-4 space-y-4">
            {/* Preview table */}
            <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Vista previa — datos extraídos</span>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Ingresos (Depósitos)</p>
                            <p className="text-lg font-extrabold text-emerald-600">
                                {hasData ? `$${info.ingresos}` : <span className="text-gray-400 font-normal text-sm">No detectado</span>}
                            </p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Egresos (Retiros)</p>
                            <p className="text-lg font-extrabold text-red-600">
                                {info.egresos && info.egresos !== "No detectado" ? `$${info.egresos}` : <span className="text-gray-400 font-normal text-sm">No detectado</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                        {info.periodo && <span>📅 {info.periodo}</span>}
                        {info.movimientos && <span>↕ {info.movimientos} movimientos</span>}
                    </div>
                </div>
            </div>

            {/* Excel export + TXT download side by side */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Table2 className="w-4 h-4 text-green-600" />Exportar a Excel (CUENTAS.xlsx)
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <select value={año} onChange={e => setAño(Number(e.target.value))}
                            className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {AÑOS.map(y => <option key={y}>{y}</option>)}
                        </select>
                        <select value={mes} onChange={e => setMes(e.target.value)}
                            className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {MESES.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <button onClick={handleExcel} disabled={excelStatus === "loading" || !hasData}
                            className="flex items-center gap-1.5 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
                            {excelStatus === "loading" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</> : <><Download className="w-3.5 h-3.5" />Generar Excel</>}
                        </button>
                        {info.txtContent && (
                            <button onClick={handleDownloadTxt}
                                className="flex items-center gap-1.5 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-all">
                                <Download className="w-3.5 h-3.5" />TXT
                            </button>
                        )}
                    </div>
                    {excelStatus === "error" && <p className="text-xs text-red-600 mt-1">{excelError}</p>}
                </div>
                {excelStatus === "done" && excelResult && (
                    <button onClick={() => window.location.href = `/api/generate-excel?file=${encodeURIComponent(excelResult.filename)}`}
                        className="flex items-center gap-1.5 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg transition-all">
                        <Download className="w-3.5 h-3.5" />Descargar {excelResult.filename}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── FinancialStatementPreview ────────────────────────────────────────────────
const BG_EDITABLE_FIELDS = ["activoCirculante","inventarios","clientes","deudoresDiversos","activoFijo","terrenosEdificios","maquinariaEquipo","equipoTransporte","otrosActivos","activoTotal","pasivoCirculante","proveedores","acreedoresDiversos","docsPagarCP","pasivoLargoPlazo","docsPagarLP","otrosPasivos","pasivoTotal","capitalSocial","utilidadesAnteriores","capitalContable"];
const ER_EDITABLE_FIELDS = ["ventas","costoVenta","utilidadBruta","gastosOperacion","gastosFinancieros","utilidadAntesImpuestos","impuestos","utilidadNeta"];

function FinancialStatementPreview({
    info,
    editMode = false,
    onEditSave,
}: {
    info: UploadedDocInfo;
    editMode?: boolean;
    onEditSave?: (updated: any) => void;
}) {
    const d = info.financialData;
    if (!d) return null;

    const [activePeriod, setActivePeriod] = useState(0);
    const [showRaw, setShowRaw] = useState(false);
    const [saving, setSaving] = useState(false);

    const periodData: any[] = d.periodData ?? [];
    const periodos: string[] = d.periodos ?? [];
    const current = periodData[activePeriod] ?? { balanceGeneral: d.balanceGeneral, estadoResultados: d.estadoResultados };
    const bg = current.balanceGeneral ?? {};
    const er = current.estadoResultados ?? {};

    const buildEditVals = (bgObj: any, erObj: any) => {
        const vals: Record<string, string> = {};
        for (const f of BG_EDITABLE_FIELDS) vals[`bg.${f}`] = bgObj?.[f] != null ? String(Math.round(bgObj[f])) : "";
        for (const f of ER_EDITABLE_FIELDS) vals[`er.${f}`] = erObj?.[f] != null ? String(Math.round(erObj[f])) : "";
        return vals;
    };
    const [editVals, setEditVals] = useState<Record<string, string>>(() => buildEditVals(bg, er));
    useEffect(() => { if (editMode) setEditVals(buildEditVals(bg, er)); }, [activePeriod, editMode]);

    const ev = (key: string) => editVals[key] ?? "";
    const setev = (key: string, val: string) => setEditVals(prev => ({ ...prev, [key]: val }));
    const parseN = (v: string) => v.trim() === "" ? null : Number(v);
    const money = (v: number | null | undefined) =>
        v != null ? `$${Math.round(v).toLocaleString("es-MX")}` : null;

    const EditInput = ({ fk }: { fk: string }) => (
        <input type="number" value={ev(fk)} onChange={e => setev(fk, e.target.value)}
            className="w-28 px-2 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-right tabular-nums bg-blue-50"
            placeholder="0" />
    );

    // Section subtotal row (bold, left accent, always visible)
    const SRow = ({ label, fk, val }: { label: string; fk?: string; val: number | null | undefined }) => (
        <div className="flex items-center justify-between py-1.5 px-2 mt-1.5 bg-blue-50 border-l-2 border-blue-400 rounded-r-md">
            <span className="text-[11px] font-bold text-blue-900">{label}</span>
            <span className={`text-[11px] font-extrabold tabular-nums ${val == null ? "text-blue-200" : "text-blue-900"}`}>
                {editMode && fk ? <EditInput fk={fk} /> : (money(val) ?? "—")}
            </span>
        </div>
    );

    // Individual line item (indented, hidden when null in view mode)
    const LRow = ({ label, fk, val }: { label: string; fk?: string; val: number | null | undefined }) => {
        if (!editMode && val == null) return null;
        return (
            <div className="flex items-center justify-between py-0.5 px-2 pl-5">
                <span className="text-[11px] text-gray-500">{label}</span>
                <span className={`text-[11px] tabular-nums ${val == null ? "text-gray-300" : "text-gray-700 font-medium"}`}>
                    {editMode && fk ? <EditInput fk={fk} /> : (money(val) ?? "—")}
                </span>
            </div>
        );
    };

    // Grand total bar
    const GRow = ({ label, fk, val }: { label: string; fk?: string; val: number | null | undefined }) => (
        <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-blue-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">{label}</span>
            <span className={`text-sm font-black tabular-nums ${val == null ? "text-blue-400" : "text-white"}`}>
                {editMode && fk ? <EditInput fk={fk} /> : (money(val) ?? "—")}
            </span>
        </div>
    );

    const ColHead = ({ children }: { children: React.ReactNode }) => (
        <div className="mb-1.5 pb-1 border-b border-blue-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{children}</span>
        </div>
    );

    const handleSave = async () => {
        if (!onEditSave) return;
        setSaving(true);
        try {
            const updated = JSON.parse(JSON.stringify(d));
            const pd = updated.periodData?.[activePeriod];
            if (pd) {
                for (const f of BG_EDITABLE_FIELDS) pd.balanceGeneral[f] = parseN(ev(`bg.${f}`));
                for (const f of ER_EDITABLE_FIELDS) pd.estadoResultados[f] = parseN(ev(`er.${f}`));
                if (activePeriod === updated.periodData.length - 1) {
                    updated.balanceGeneral = pd.balanceGeneral;
                    updated.estadoResultados = pd.estadoResultados;
                }
            }
            onEditSave(updated);
        } finally { setSaving(false); }
    };

    return (
        <div className="mt-4 space-y-3">
            {/* Edit mode bar */}
            {editMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-xs text-blue-700 font-semibold flex-1">Modo edición — modifica los valores directamente</span>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Guardar cambios
                    </button>
                </div>
            )}

            {/* Period selector */}
            {periodos.length > 1 && (
                <div className="flex justify-center">
                    <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
                        {periodos.map((p, i) => (
                            <button key={p} onClick={() => setActivePeriod(i)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activePeriod === i ? "bg-white text-blue-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Balance General ────────────────────────────────────── */}
            <div className="bg-white border border-blue-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-blue-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Balance General</span>
                    {periodos[activePeriod] && (
                        <span className="text-xs font-semibold bg-white/15 text-blue-200 px-2 py-0.5 rounded-full">
                            al 31 de Diciembre de {periodos[activePeriod]}
                        </span>
                    )}
                </div>

                {/* Two-column layout matching PDF */}
                <div className="grid grid-cols-2 divide-x divide-blue-50">
                    {/* ACTIVO */}
                    <div className="p-3 space-y-0.5">
                        <ColHead>Activo</ColHead>
                        <SRow label="Activo Circulante" fk="bg.activoCirculante" val={bg.activoCirculante} />
                        <LRow label="Clientes" fk="bg.clientes" val={bg.clientes} />
                        <LRow label="Deudores Diversos" fk="bg.deudoresDiversos" val={bg.deudoresDiversos} />
                        <LRow label="Inventarios" fk="bg.inventarios" val={bg.inventarios} />
                        <SRow label="Activo Fijo" fk="bg.activoFijo" val={bg.activoFijo} />
                        <LRow label="Terreno y Edificación" fk="bg.terrenosEdificios" val={bg.terrenosEdificios} />
                        <LRow label="Maquinaria y Equipo" fk="bg.maquinariaEquipo" val={bg.maquinariaEquipo} />
                        <LRow label="Equipo de Transporte" fk="bg.equipoTransporte" val={bg.equipoTransporte} />
                        <SRow label="Activo Diferido" fk="bg.otrosActivos" val={bg.otrosActivos} />
                        <GRow label="Suma del Activo" fk="bg.activoTotal" val={bg.activoTotal} />
                    </div>

                    {/* PASIVO + CAPITAL */}
                    <div className="p-3 space-y-0.5">
                        <ColHead>Pasivo</ColHead>
                        <SRow label="Pasivo Circulante" fk="bg.pasivoCirculante" val={bg.pasivoCirculante} />
                        <LRow label="Proveedores" fk="bg.proveedores" val={bg.proveedores} />
                        <LRow label="Acreedores Diversos" fk="bg.acreedoresDiversos" val={bg.acreedoresDiversos} />
                        <LRow label="Docs. x Pagar CP" fk="bg.docsPagarCP" val={bg.docsPagarCP} />
                        <SRow label="Pasivo a Largo Plazo" fk="bg.pasivoLargoPlazo" val={bg.pasivoLargoPlazo} />
                        <LRow label="Docs. x Pagar LP" fk="bg.docsPagarLP" val={bg.docsPagarLP} />
                        <LRow label="Otros Pasivos" fk="bg.otrosPasivos" val={bg.otrosPasivos} />
                        <div className="mt-3 mb-0.5 pb-1 border-b border-blue-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Capital</span>
                        </div>
                        <SRow label="Capital Contable" fk="bg.capitalContable" val={bg.capitalContable} />
                        <LRow label="Capital Social" fk="bg.capitalSocial" val={bg.capitalSocial} />
                        <LRow label="Result. Ejercicios Ant." fk="bg.utilidadesAnteriores" val={bg.utilidadesAnteriores} />
                        <LRow label="Utilidad del Ejercicio" val={er.utilidadNeta} />
                        <GRow label="Suma Pasivo y Capital" val={bg.activoTotal} />
                    </div>
                </div>
            </div>

            {/* ── Estado de Resultados ───────────────────────────────── */}
            <div className="bg-white border border-blue-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-blue-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Estado de Resultados</span>
                    {periodos[activePeriod] && (
                        <span className="text-xs font-semibold bg-white/15 text-blue-200 px-2 py-0.5 rounded-full">
                            Enero — Diciembre {periodos[activePeriod]}
                        </span>
                    )}
                </div>
                <div className="p-3 space-y-0.5">
                    <SRow label="Total de Ingresos" fk="er.ventas" val={er.ventas} />
                    <LRow label="Costo Directo de Producción" fk="er.costoVenta" val={er.costoVenta} />
                    <SRow label="Utilidad de Operación" fk="er.utilidadBruta" val={er.utilidadBruta} />
                    <LRow label="Gastos de Administración" fk="er.gastosOperacion" val={er.gastosOperacion} />
                    <LRow label="Gastos Financieros" fk="er.gastosFinancieros" val={er.gastosFinancieros} />
                    <SRow label="Utilidad Antes de Impuestos" fk="er.utilidadAntesImpuestos" val={er.utilidadAntesImpuestos} />
                    <LRow label="Provisión ISR y PTU" fk="er.impuestos" val={er.impuestos} />
                    <GRow label="Utilidad Neta" fk="er.utilidadNeta" val={er.utilidadNeta} />
                </div>
            </div>

            {/* Raw text toggle (debug) */}
            {!editMode && (
                <div>
                    <button onClick={() => setShowRaw(r => !r)}
                        className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2">
                        {showRaw ? "▲ Ocultar texto extraído" : "▼ Ver texto crudo del PDF"}
                    </button>
                    {showRaw && (
                        <pre className="mt-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                            {d.rawText ?? "No disponible"}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────
function TabDocumentos({ caso, onUpdate }: { caso: Case; onUpdate?: (updated: Case) => void }) {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [uploaded, setUploaded] = useState<Record<string, UploadedDocInfo>>({});
    const [toast, setToast] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<{ dbDocId: string; mode: "replace" | "edit" } | null>(null);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [editSaving, setEditSaving] = useState(false);
    const [viewingFile, setViewingFile] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [localDocs, setLocalDocs] = useState<DbDoc[]>((caso.documentos ?? []) as DbDoc[]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const refreshDocs = useCallback(async () => {
        try {
            const res = await fetch(`/api/expedientes/${caso.id}/documentos`);
            const json = await res.json();
            if (json.success) setLocalDocs(json.data as DbDoc[]);
        } catch { /* ignore */ }
        // Also refresh the parent caso so TabAnalisis sees new datosExtraidos
        try {
            const res2 = await fetch(`/api/expedientes/${caso.id}`);
            const json2 = await res2.json();
            if (json2.success && onUpdate) onUpdate(json2.data);
        } catch { /* ignore */ }
    }, [caso.id, onUpdate]);

    const dbDocs = localDocs;

    const estaEntregado = (docId: string): boolean => {
        if (uploaded[docId]) return true;
        return dbDocs.some(d => d.tipo === docId);
    };

    const totalCubiertos = CATEGORIAS_DOCUMENTOS.flatMap(c => c.documentos).filter(d => estaEntregado(d.id)).length;
    const pct = Math.round((totalCubiertos / TOTAL_DOCUMENTOS_REQUERIDOS) * 100);

    return (
        <>
        <div className="space-y-3">


            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Checklist oficial de documentos</p>
                        <p className="text-xs text-gray-400 mt-0.5">{totalCubiertos} de {TOTAL_DOCUMENTOS_REQUERIDOS} documentos entregados</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-28 bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{pct}%</span>
                    </div>
                </div>

                {/* Categories + clickable docs */}
                <div className="divide-y divide-gray-50">
                    {CATEGORIAS_DOCUMENTOS.map(cat => {
                        const cubiertos = cat.documentos.filter(d => estaEntregado(d.id)).length;
                        return (
                            <div key={cat.id} className="px-6 py-4">
                                {/* Category header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${cubiertos === cat.documentos.length ? "bg-emerald-500" : cubiertos > 0 ? "bg-amber-400" : "bg-gray-300"}`} />
                                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat.nombre}</p>
                                        {cat.descripcion && <p className="text-xs text-gray-400 hidden md:block">— {cat.descripcion}</p>}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{cubiertos}/{cat.documentos.length}</span>
                                </div>

                                {/* Document items */}
                                <ul className="space-y-1.5">
                                    {cat.documentos.map(doc => {
                                        const entregado = estaEntregado(doc.id);
                                        const isSelected = selectedDocId === doc.id;
                                        const uploadedInfo = uploaded[doc.id];
                                        const isBankStatement = doc.id === "estados-cuenta-banco";
                                        const isFinancialStatement = FINANCIAL_STATEMENT_IDS.includes(doc.id);

                                        return (
                                            <li key={doc.id}>
                                                {/* Clickable doc row */}
                                                <button
                                                    onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected
                                                        ? "bg-blue-50 border border-blue-200"
                                                        : entregado
                                                            ? "bg-emerald-50/60 hover:bg-emerald-50"
                                                            : "hover:bg-gray-50 border border-transparent"
                                                        }`}
                                                >
                                                    {entregado
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                        : <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-blue-400" : "border-gray-300"}`} />
                                                    }
                                                    <span className={`text-sm flex-1 flex items-center gap-2 ${entregado ? "text-gray-700" : isSelected ? "text-blue-700 font-medium" : "text-gray-500"}`}>
                                                        {doc.nombre}
                                                        {isFinancialStatement && (
                                                            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">OCR</span>
                                                        )}
                                                        {isFinancialStatement && uploadedInfo?.financialData?.periodos?.length > 0 && (
                                                            <span className="text-xs text-blue-500 font-semibold">
                                                                {uploadedInfo.financialData.periodos.join(" · ")}
                                                            </span>
                                                        )}
                                                        {isBankStatement && !entregado && (
                                                            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">OCR</span>
                                                        )}
                                                    </span>
                                                    {isSelected
                                                        ? <span className="text-xs font-semibold flex-shrink-0 text-blue-500">▲ Cerrar</span>
                                                        : entregado
                                                            ? <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">Entregado</span>
                                                            : <span className="text-xs font-semibold flex-shrink-0 text-gray-400">Subir ›</span>
                                                    }
                                                </button>

                                                {/* Expanded panel */}
                                                {isSelected && (() => {
                                                    const sessionFile = uploadedInfo;
                                                    // Merge session upload (not yet in dbDocs) with DB records
                                                    const sessionDoc: DbDoc | null = sessionFile?.docDbId && !dbDocs.some(d => d.id === sessionFile.docDbId)
                                                        ? { id: sessionFile.docDbId, tipo: doc.id, nombre: sessionFile.nombre, estatus: sessionFile.estatus, fecha: new Date().toISOString(), url: sessionFile.url }
                                                        : null;
                                                    const allFiles: DbDoc[] = [
                                                        ...(sessionDoc ? [sessionDoc] : []),
                                                        ...dbDocs.filter(d => d.tipo === doc.id),
                                                    ];
                                                    return (
                                                        <div className="mt-1.5 ml-8 mr-2 space-y-2">
                                                            {/* ── Lista de archivos guardados ── */}
                                                            {allFiles.filter(f => !deletedIds.has(f.id)).length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Archivos guardados</p>
                                                                    {allFiles.filter(f => !deletedIds.has(f.id)).map((file, idx) => {
                                                                        const isEditing = editingFile?.dbDocId === file.id;
                                                                        const isViewing = viewingFile === file.id;
                                                                        const isConfirmingDelete = confirmDeleteId === file.id;
                                                                        const parsedData = (() => {
                                                                            if (sessionFile?.docDbId === file.id) return sessionFile.financialData;
                                                                            if (file.datosExtraidos) { try { return JSON.parse(file.datosExtraidos); } catch { return null; } }
                                                                            return null;
                                                                        })();
                                                                        return (
                                                                            <div key={file.id} className="rounded-xl border border-gray-100 overflow-hidden">
                                                                                {/* File row */}
                                                                                <div className="flex items-center gap-2 py-2 px-3 bg-gray-50">
                                                                                    <span className="text-xs text-gray-600 flex-1 truncate">
                                                                                        📄 {file.nombre}
                                                                                        {idx === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Más reciente</span>}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(file.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                                                                                    {file.url && (
                                                                                        <a href={file.url} target="_blank" rel="noopener noreferrer"
                                                                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold flex-shrink-0">
                                                                                            <Download className="w-3 h-3" /> Descargar
                                                                                        </a>
                                                                                    )}
                                                                                    {/* Action buttons */}
                                                                                    <div className="flex gap-1 flex-shrink-0">
                                                                                        {(isFinancialStatement || isBankStatement) && parsedData && (
                                                                                            <button
                                                                                                onClick={() => { setViewingFile(isViewing ? null : file.id); setEditingFile(null); setConfirmDeleteId(null); }}
                                                                                                className={`text-xs px-2 py-0.5 rounded-lg font-semibold transition-all ${isViewing ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-700"}`}>
                                                                                                {isViewing ? "Ocultar" : "Ver datos"}
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => { setEditingFile(isEditing && editingFile?.mode === "replace" ? null : { dbDocId: file.id, mode: "replace" }); setViewingFile(null); setConfirmDeleteId(null); }}
                                                                                            className={`text-xs px-2 py-0.5 rounded-lg font-semibold transition-all ${isEditing && editingFile?.mode === "replace" ? "bg-amber-100 text-amber-700" : "bg-gray-100 hover:bg-amber-50 text-gray-500 hover:text-amber-700"}`}>
                                                                                            Reemplazar
                                                                                        </button>
                                                                                        {(isFinancialStatement || isBankStatement) && parsedData && (
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    if (isEditing && editingFile?.mode === "edit") { setEditingFile(null); return; }
                                                                                                    const pd = parsedData?.periodData?.[0];
                                                                                                    if (pd) {
                                                                                                        const bg = pd.balanceGeneral; const er = pd.estadoResultados;
                                                                                                        setEditValues({ ventas: er.ventas ?? "", costoVenta: er.costoVenta ?? "", utilidadNeta: er.utilidadNeta ?? "", activoTotal: bg.activoTotal ?? "", pasivoTotal: bg.pasivoTotal ?? "", capitalContable: bg.capitalContable ?? "" });
                                                                                                    }
                                                                                                    setEditingFile({ dbDocId: file.id, mode: "edit" }); setViewingFile(null); setConfirmDeleteId(null);
                                                                                                }}
                                                                                                className={`text-xs px-2 py-0.5 rounded-lg font-semibold transition-all ${isEditing && editingFile?.mode === "edit" ? "bg-purple-100 text-purple-700" : "bg-gray-100 hover:bg-purple-50 text-gray-500 hover:text-purple-700"}`}>
                                                                                                Editar datos
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => { setConfirmDeleteId(isConfirmingDelete ? null : file.id); setEditingFile(null); setViewingFile(null); }}
                                                                                            className={`text-xs px-2 py-0.5 rounded-lg font-semibold transition-all ${isConfirmingDelete ? "bg-red-100 text-red-700" : "bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600"}`}>
                                                                                            Eliminar
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Confirm delete */}
                                                                                {isConfirmingDelete && (
                                                                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-t border-red-100">
                                                                                        <span className="text-xs text-red-700 flex-1">¿Eliminar este archivo permanentemente?</span>
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                const res = await fetch(`/api/expedientes/${caso.id}/documentos/${file.id}`, { method: "DELETE" });
                                                                                                if (res.ok) { setDeletedIds(prev => new Set([...prev, file.id])); setConfirmDeleteId(null); showToast("Archivo eliminado"); refreshDocs(); }
                                                                                                else showToast("Error al eliminar");
                                                                                            }}
                                                                                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
                                                                                            Sí, eliminar
                                                                                        </button>
                                                                                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-lg">
                                                                                            Cancelar
                                                                                        </button>
                                                                                    </div>
                                                                                )}

                                                                                {/* Replace upload zone */}
                                                                                {isEditing && editingFile?.mode === "replace" && (
                                                                                    <div className="p-2 border-t border-gray-100">
                                                                                        <DocUploadPanel
                                                                                            docId={doc.id} docNombre={doc.nombre} casoId={caso.id}
                                                                                            onSuccess={info => {
                                                                                                setUploaded(prev => ({ ...prev, [doc.id]: info }));
                                                                                                setEditingFile(null);
                                                                                                showToast("Archivo reemplazado");
                                                                                                refreshDocs();
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}

                                                                                {/* Edit data — editable preview with same design */}
                                                                                {isEditing && editingFile?.mode === "edit" && parsedData && (
                                                                                    <div className="border-t border-blue-100">
                                                                                        <FinancialStatementPreview
                                                                                            info={{ ...uploadedInfo ?? { nombre: file.nombre, estatus: file.estatus }, financialData: parsedData }}
                                                                                            editMode
                                                                                            onEditSave={async (updated) => {
                                                                                                setEditSaving(true);
                                                                                                try {
                                                                                                    const res = await fetch(`/api/expedientes/${caso.id}/documentos/${file.id}`, {
                                                                                                        method: "PATCH",
                                                                                                        headers: { "Content-Type": "application/json" },
                                                                                                        body: JSON.stringify({ datosExtraidos: updated }),
                                                                                                    });
                                                                                                    if (!res.ok) throw new Error("Error al guardar");
                                                                                                    setUploaded(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], financialData: updated, docDbId: file.id } }));
                                                                                                    setEditingFile(null);
                                                                                                    showToast("Datos actualizados");
                                                                                                } catch { showToast("Error al guardar datos"); }
                                                                                                finally { setEditSaving(false); }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}

                                                                                {/* Financial / bank preview — toggled by "Ver datos" */}
                                                                                {isViewing && isFinancialStatement && parsedData && (
                                                                                    <div className="border-t border-gray-100">
                                                                                        <FinancialStatementPreview info={{ ...uploadedInfo ?? { nombre: file.nombre, estatus: file.estatus }, financialData: parsedData }} />
                                                                                    </div>
                                                                                )}
                                                                                {isViewing && isBankStatement && (sessionFile ?? null) && (
                                                                                    <div className="border-t border-gray-100 p-2">
                                                                                        <BankStatementPreview info={sessionFile!} casoId={caso.id} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* ── Subir nuevo archivo ── */}
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <div className="flex-1 h-px bg-gray-100" />
                                                                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">Subir nuevo archivo</span>
                                                                    <div className="flex-1 h-px bg-gray-100" />
                                                                </div>
                                                                <DocUploadPanel
                                                                    docId={doc.id} docNombre={doc.nombre} casoId={caso.id}
                                                                    onSuccess={info => {
                                                                        setUploaded(prev => ({ ...prev, [doc.id]: info }));
                                                                        setEditingFile(null);
                                                                        showToast("Documento guardado");
                                                                        refreshDocs();
                                                                        if (!isBankStatement && !isFinancialStatement) setSelectedDocId(null);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Toast notification */}
        {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-blue-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {toast}
            </div>
        )}
        </>
    );
}
// ─── Datos Matriz de Riesgo (Evaluación de Crédito Pontifex) ─────────────────
const MATRIX_SECTIONS = [
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

type Selecciones = Record<string, string>;

// ─── Tab: Análisis ────────────────────────────────────────────────────────────
function TabAnalisis({ caso }: { caso: Case }) {
    const [selecciones, setSelecciones] = useState<Selecciones>(() => {
        try { return JSON.parse(caso.matrizRiesgo ?? "{}"); }
        catch { return {}; }
    });

    // KPIs — file selector for estados-financieros documents
    const allFinancialDocs = [...(caso.documentos ?? [])]
        .filter((d: any) => d.tipo === "estados-financieros" && d.datosExtraidos)
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const [selectedFinDocId, setSelectedFinDocId] = useState<string | null>(null);
    const selectedFinDoc = allFinancialDocs.find((d: any) => d.id === selectedFinDocId) ?? allFinancialDocs[0];
    const financialData = selectedFinDoc?.datosExtraidos
        ? (() => { try { return JSON.parse(selectedFinDoc.datosExtraidos); } catch { return null; } })()
        : null;
    const kpiPeriods: string[] = financialData?.periodos ?? [];
    const kpiPeriodData: any[] = financialData?.periodData ?? [];
    const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

    const handleSelect = (factorId: string, opcionId: string) => {
        const next: Selecciones = { ...selecciones };
        if (next[factorId] === opcionId) {
            delete next[factorId]; // deselect
        } else {
            next[factorId] = opcionId;
        }
        setSelecciones(next);
        setSaveStatus("saving");
        if (saveTimer) clearTimeout(saveTimer);
        const t = setTimeout(async () => {
            try {
                await fetch(`/api/expedientes/${caso.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ matrizRiesgo: JSON.stringify(next) }),
                });
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            } catch { setSaveStatus("idle"); }
        }, 800);
        setSaveTimer(t);
    };

    // Score calculation
    const sectionScores = MATRIX_SECTIONS.map(section => {
        const pts = section.factores.reduce((sum, factor) => {
            const selId = selecciones[factor.id];
            const op = selId ? (factor.opciones as readonly { id: string; valor: string; puntos: number }[]).find(o => o.id === selId) : undefined;
            return sum + (op?.puntos ?? 0);
        }, 0);
        const maxPts = section.factores.reduce((sum, factor) => {
            return sum + Math.max(...(factor.opciones as readonly { id: string; valor: string; puntos: number }[]).map(o => o.puntos));
        }, 0);
        return { id: section.id, pts, maxPts };
    });

    const totalPuntos = sectionScores.reduce((s, x) => s + x.pts, 0);
    const maxPuntos = sectionScores.reduce((s, x) => s + x.maxPts, 0);
    const totalFactores = MATRIX_SECTIONS.reduce((s, sec) => s + sec.factores.length, 0);
    const seleccionados = Object.keys(selecciones).length;
    const pctAvance = Math.round((seleccionados / totalFactores) * 100);
    const resolucion = totalPuntos >= 120 ? "Aprobado" : totalPuntos >= 75 ? "Dudoso" : "Rechazado";

    const sectionColors: Record<string, { header: string; badge: string; row: string; dot: string }> = {
        blue:    { header: "from-blue-900 to-blue-700",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-600" },
        violet:  { header: "from-blue-800 to-blue-600",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-500" },
        amber:   { header: "from-blue-700 to-blue-500",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-400" },
        emerald: { header: "from-blue-900 to-blue-700",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-600" },
        indigo:  { header: "from-blue-800 to-blue-600",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-500" },
        purple:  { header: "from-blue-700 to-blue-500",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-400" },
        rose:    { header: "from-blue-900 to-blue-700",   badge: "bg-white/20 text-white", row: "hover:bg-blue-50", dot: "bg-blue-600" },
    };

    type KpiColor = "green" | "yellow" | "red" | "gray";
    const kpiColor = (v: number | null, lo: number, hi: number, goodHigh: boolean): KpiColor => {
        if (v === null) return "gray";
        if (goodHigh) return v >= hi ? "green" : v >= lo ? "yellow" : "red";
        return v <= lo ? "green" : v <= hi ? "yellow" : "red";
    };
    const kpiTextCls: Record<KpiColor, string> = {
        green: "text-emerald-600", yellow: "text-amber-500", red: "text-red-500", gray: "text-gray-400",
    };
    const kpiBgCls: Record<KpiColor, string> = {
        green: "bg-emerald-50 border-emerald-200",
        yellow: "bg-amber-50 border-amber-200",
        red: "bg-red-50 border-red-200",
        gray: "bg-gray-50 border-gray-200",
    };
    const kpiBadgeCls: Record<KpiColor, string> = {
        green: "bg-emerald-100 text-emerald-700",
        yellow: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-600",
        gray: "bg-gray-100 text-gray-400",
    };
    const n = (v: number) => Math.round(v).toLocaleString("es-MX");

    type KpiDef = {
        key: string; label: string;
        formulaLabel: string;
        getVals: (bg: any, er: any) => string | null;
        calc?: (bg: any, er: any) => number | null;
        fmt: (v: number | null) => string;
        lo: number; hi: number; goodHigh: boolean;
        interpret: (v: number | null) => string;
    };
    const KPI_GROUPS: { group: string; textColor: string; cols: string; kpis: KpiDef[] }[] = [
        {
            group: "Liquidez", textColor: "text-blue-800", cols: "grid-cols-2",
            kpis: [
                {
                    key: "liquidezCirculante", label: "Razón corriente",
                    formulaLabel: "Activo Circulante / Pasivo Circulante",
                    getVals: (bg) => bg.activoCirculante != null && bg.pasivoCirculante != null
                        ? `${n(bg.activoCirculante)} / ${n(bg.pasivoCirculante)}` : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 1.0, hi: 2.0, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 2 ? "Liquidez alta" : v >= 1 ? "Liquidez adecuada" : "Liquidez baja",
                },
                {
                    key: "pruebaAcido", label: "Prueba ácida",
                    formulaLabel: "(AC − Inventarios) / Pasivo Circulante",
                    getVals: (bg) => bg.activoCirculante != null && bg.inventarios != null && bg.pasivoCirculante != null
                        ? `(${n(bg.activoCirculante)} − ${n(bg.inventarios)}) / ${n(bg.pasivoCirculante)}` : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 0.5, hi: 1.0, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 1 ? "Liquidez alta" : v >= 0.5 ? "Liquidez adecuada" : "Liquidez baja",
                },
            ],
        },
        {
            group: "Actividad / uso de activos", textColor: "text-blue-800", cols: "grid-cols-3",
            kpis: [
                {
                    key: "rotacionActivos", label: "Rotación de activos",
                    formulaLabel: "Ventas / Activos Totales",
                    getVals: (bg, er) => er.ventas != null && bg.activoTotal != null
                        ? `${n(er.ventas)} / ${n(bg.activoTotal)}` : null,
                    calc: (bg, er) => er.ventas != null && bg.activoTotal != null && bg.activoTotal !== 0
                        ? parseFloat((er.ventas / bg.activoTotal).toFixed(2)) : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 0.5, hi: 1.5, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 1.5 ? "Uso eficiente" : v >= 0.5 ? "Uso moderado" : "Uso bajo",
                },
                {
                    key: "rotacionCxC", label: "Rot. cuentas por cobrar",
                    formulaLabel: "Ventas / Clientes",
                    getVals: (bg, er) => er.ventas != null && bg.clientes != null
                        ? `${n(er.ventas)} / ${n(bg.clientes)}` : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 4, hi: 8, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 8 ? "Cobro ágil" : v >= 4 ? "Cobro normal" : "Cobro lento",
                },
                {
                    key: "rotacionInv", label: "Rotación inventarios",
                    formulaLabel: "Costo de Venta / Inventarios",
                    getVals: (bg, er) => er.costoVenta != null && bg.inventarios != null
                        ? `${n(er.costoVenta)} / ${n(bg.inventarios)}` : null,
                    calc: (bg, er) => er.costoVenta != null && bg.inventarios != null && bg.inventarios !== 0
                        ? parseFloat((er.costoVenta / bg.inventarios).toFixed(2)) : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 4, hi: 8, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 8 ? "Rotación alta" : v >= 4 ? "Rotación normal" : "Rotación baja",
                },
            ],
        },
        {
            group: "Apalancamiento financiero", textColor: "text-blue-800", cols: "grid-cols-3",
            kpis: [
                {
                    key: "deudaTotal", label: "Razón de endeudamiento",
                    formulaLabel: "Pasivo Total / Activos Totales",
                    getVals: (bg) => bg.pasivoTotal != null && bg.activoTotal != null
                        ? `${n(bg.pasivoTotal)} / ${n(bg.activoTotal)}` : null,
                    fmt: (v) => v != null ? `${(v * 100).toFixed(1)}%` : "—",
                    lo: 0.40, hi: 0.60, goodHigh: false,
                    interpret: (v) => v == null ? "Sin datos" : v <= 0.40 ? "Endeudamiento bajo" : v <= 0.60 ? "Endeudamiento moderado" : "Endeudamiento alto",
                },
                {
                    key: "deudaCapital", label: "Deuda / Capital",
                    formulaLabel: "Pasivo Total / Capital Contable",
                    getVals: (bg) => bg.pasivoTotal != null && bg.capitalContable != null
                        ? `${n(bg.pasivoTotal)} / ${n(bg.capitalContable)}` : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 0.50, hi: 1.0, goodHigh: false,
                    interpret: (v) => v == null ? "Sin datos" : v <= 0.50 ? "Apalancamiento bajo" : v <= 1.0 ? "Apalancamiento moderado" : "Apalancamiento alto",
                },
                {
                    key: "coberturaIntereses", label: "Cobertura de intereses",
                    formulaLabel: "Utilidad Operativa / Gastos Financieros",
                    getVals: (_, er) => er.utilidadOperacion != null && er.gastosFinancieros != null
                        ? `${n(er.utilidadOperacion)} / ${n(er.gastosFinancieros)}` : null,
                    calc: (_, er) => er.utilidadOperacion != null && er.gastosFinancieros != null && er.gastosFinancieros !== 0
                        ? parseFloat((er.utilidadOperacion / er.gastosFinancieros).toFixed(2)) : null,
                    fmt: (v) => v != null ? `${v.toFixed(2)}x` : "—",
                    lo: 1.5, hi: 3.0, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 3 ? "Cobertura alta" : v >= 1.5 ? "Cobertura adecuada" : "Cobertura baja",
                },
            ],
        },
        {
            group: "Rentabilidad", textColor: "text-blue-800", cols: "grid-cols-3",
            kpis: [
                {
                    key: "margenUtilidad", label: "Margen neto",
                    formulaLabel: "Utilidad Neta / Ventas",
                    getVals: (_, er) => er.utilidadNeta != null && er.ventas != null
                        ? `${n(er.utilidadNeta)} / ${n(er.ventas)}` : null,
                    fmt: (v) => v != null ? `${(v * 100).toFixed(2)}%` : "—",
                    lo: 0.05, hi: 0.10, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 0.10 ? "Margen alto" : v >= 0.05 ? "Margen moderado" : "Margen bajo",
                },
                {
                    key: "roa", label: "ROA",
                    formulaLabel: "Utilidad Neta / Activos Totales",
                    getVals: (bg, er) => er.utilidadNeta != null && bg.activoTotal != null
                        ? `${n(er.utilidadNeta)} / ${n(bg.activoTotal)}` : null,
                    fmt: (v) => v != null ? `${(v * 100).toFixed(2)}%` : "—",
                    lo: 0.02, hi: 0.05, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 0.05 ? "Rendimiento alto" : v >= 0.02 ? "Rendimiento moderado" : "Rendimiento bajo",
                },
                {
                    key: "roe", label: "ROE",
                    formulaLabel: "Utilidad Neta / Capital Contable",
                    getVals: (bg, er) => er.utilidadNeta != null && bg.capitalContable != null
                        ? `${n(er.utilidadNeta)} / ${n(bg.capitalContable)}` : null,
                    fmt: (v) => v != null ? `${(v * 100).toFixed(2)}%` : "—",
                    lo: 0.05, hi: 0.10, goodHigh: true,
                    interpret: (v) => v == null ? "Sin datos" : v >= 0.10 ? "Rendimiento alto" : v >= 0.05 ? "Rendimiento moderado" : "Rendimiento bajo",
                },
            ],
        },
    ];

    const resClr = resolucion === "Aprobado"
        ? { bg: "bg-emerald-500", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", desc: "text-emerald-600" }
        : resolucion === "Dudoso"
        ? { bg: "bg-amber-500",   light: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   desc: "text-amber-600" }
        : { bg: "bg-red-500",     light: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     desc: "text-red-600" };

    return (
        <div className="space-y-3" style={{ fontSize: "6px" }}>
            {/* ── Indicadores Financieros ─────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-800">
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Indicadores Financieros</span>
                </div>

                {/* Selector de archivo */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium flex-shrink-0">Archivo analizado</span>
                    {allFinancialDocs.length === 0 ? (
                        <span className="text-sm text-gray-400 italic">Sin estados financieros subidos</span>
                    ) : (
                        <select
                            value={selectedFinDocId ?? allFinancialDocs[0]?.id ?? ""}
                            onChange={e => setSelectedFinDocId(e.target.value)}
                            className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1 min-w-0">
                            {allFinancialDocs.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.nombre ?? `Doc ${doc.id.slice(0,6)}`}
                                </option>
                            ))}
                        </select>
                    )}
                    {kpiPeriods.length > 0 && (
                        <span className="text-sm text-blue-600 font-semibold flex-shrink-0">{kpiPeriods.join(" · ")}</span>
                    )}
                </div>

                {allFinancialDocs.length === 0 || kpiPeriodData.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">
                        Sube un estado financiero en la pestaña <strong>Documentos</strong> para calcular los indicadores.
                    </p>
                ) : (
                    <div className="p-4 space-y-5">
                        {(() => {
                            const lastPd = kpiPeriodData[kpiPeriodData.length - 1] ?? {};
                            const bgData = lastPd.balanceGeneral ?? {};
                            const erData = lastPd.estadoResultados ?? {};
                            const cardAccent: Record<KpiColor, string> = {
                                green: "border-t-emerald-400", yellow: "border-t-amber-400",
                                red: "border-t-red-400", gray: "border-t-gray-200",
                            };
                            const cardBg: Record<KpiColor, string> = {
                                green: "bg-emerald-50/60", yellow: "bg-amber-50/60",
                                red: "bg-red-50/60", gray: "bg-gray-50",
                            };
                            const statusCls: Record<KpiColor, string> = {
                                green: "text-emerald-600 bg-emerald-100",
                                yellow: "text-amber-600 bg-amber-100",
                                red: "text-red-500 bg-red-100",
                                gray: "text-gray-400 bg-gray-100",
                            };
                            return KPI_GROUPS.map(({ group, textColor, cols, kpis }) => (
                                <div key={group}>
                                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${textColor}`}>{group}</p>
                                    <div className={`grid ${cols} gap-2`}>
                                        {kpis.map((kpi) => {
                                            const vals = kpiPeriodData.map((pd: any) => {
                                                const stored = pd.kpis?.[kpi.key] ?? null;
                                                if (stored != null) return stored;
                                                return kpi.calc ? kpi.calc(pd.balanceGeneral ?? {}, pd.estadoResultados ?? {}) : null;
                                            });
                                            const lastVal = vals[vals.length - 1];
                                            const clr = kpiColor(lastVal, kpi.lo, kpi.hi, kpi.goodHigh);
                                            const formulaWithVals = kpi.getVals(bgData, erData);
                                            const interpretation = kpi.interpret(lastVal);
                                            return (
                                                <div key={kpi.key} className={`rounded-xl border-t-2 border border-gray-100 p-3 ${cardAccent[clr]} ${cardBg[clr]}`}>
                                                    <p className="text-sm font-semibold text-gray-600 leading-tight mb-1">{kpi.label}</p>
                                                    <p className="text-xs text-gray-400 font-mono leading-tight mb-2">{kpi.formulaLabel}</p>
                                                    <p className={`text-3xl font-black tabular-nums leading-none mb-1 ${kpiTextCls[clr]}`}>
                                                        {kpi.fmt(lastVal)}
                                                    </p>
                                                    {formulaWithVals && (
                                                        <p className="text-xs text-gray-400 font-mono leading-tight mb-2">{formulaWithVals}</p>
                                                    )}
                                                    {kpiPeriodData.length > 1 && (
                                                        <div className="flex gap-2 mb-1.5">
                                                            {vals.map((v: number | null, i: number) => (
                                                                <span key={i} className="text-xs text-gray-500">
                                                                    {kpiPeriods[i]}: <span className={`font-bold ${kpiTextCls[kpiColor(v, kpi.lo, kpi.hi, kpi.goodHigh)]}`}>{kpi.fmt(v)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCls[clr]}`}>
                                                        {interpretation}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>

            {/* ── Separador Matriz de Riesgo ───────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-800 rounded-full">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Matriz de Riesgo</span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
            </div>


            {/* ── Secciones de la matriz ───────────────────────────── */}
            {MATRIX_SECTIONS.map(section => {
                const clr = sectionColors[section.color as string];
                const secScore = sectionScores.find(s => s.id === section.id)!;
                const completados = section.factores.filter(f => selecciones[f.id]).length;
                return (
                    <div key={section.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className={`px-4 py-2.5 bg-gradient-to-r ${clr.header} flex items-center gap-2`}>
                            <span className="text-sm font-bold text-white flex-1">{section.nombre}</span>
                            <span className="text-xs text-white/70">{completados}/{section.factores.length}</span>
                            <span className="text-sm font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{secScore.pts} pts</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {section.factores.map(factor => {
                                const selectedId = selecciones[factor.id];
                                const selectedOp = selectedId
                                    ? (factor.opciones as readonly { id: string; valor: string; puntos: number }[]).find(o => o.id === selectedId)
                                    : undefined;
                                return (
                                    <div key={factor.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-700 leading-tight">{factor.nombre}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                                                selectedOp ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                                            }`}>
                                                {selectedOp ? `${selectedOp.puntos}p` : "—"}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(factor.opciones as readonly { id: string; valor: string; puntos: number }[]).map(op => {
                                                const isSelected = selectedId === op.id;
                                                return (
                                                    <button key={op.id} onClick={() => handleSelect(factor.id, op.id)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                                                            isSelected
                                                                ? "bg-blue-50 border-blue-300 text-blue-800 font-semibold"
                                                                : `bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:border-gray-200`
                                                        }`}>
                                                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                                            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                                                        }`}>{isSelected ? "✓" : ""}</span>
                                                        <span className="leading-tight">{op.valor}</span>
                                                        <span className={`text-xs font-bold ${isSelected ? "text-blue-500" : "text-gray-400"}`}>{op.puntos}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* ── Calificación final ──────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Resultado de la Evaluación</p>

                    {/* Barra total con zonas */}
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div className="absolute inset-y-0 bg-red-200/70"     style={{ left: 0,                        width: `${(75/maxPuntos)*100}%` }} />
                        <div className="absolute inset-y-0 bg-amber-200/70"   style={{ left: `${(75/maxPuntos)*100}%`, width: `${(45/maxPuntos)*100}%` }} />
                        <div className="absolute inset-y-0 bg-emerald-200/70" style={{ left: `${(120/maxPuntos)*100}%`, right: 0 }} />
                        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${resClr.bg}`}
                            style={{ width: `${Math.min((totalPuntos/maxPuntos)*100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-4">
                        <span className="text-red-400">Rechazado &lt;75</span>
                        <span className="text-amber-500">Dudoso 75–119</span>
                        <span className="text-emerald-500">Aprobado ≥120</span>
                    </div>

                    {/* Mini barras por sección */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {sectionScores.map((sc, i) => {
                            const sec = MATRIX_SECTIONS[i];
                            const pct = sc.maxPts > 0 ? (sc.pts / sc.maxPts) * 100 : 0;
                            const clr = sectionColors[sec.color as string];
                            return (
                                <div key={sc.id} className="bg-gray-50 rounded-lg px-2.5 py-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500 font-semibold truncate pr-1">{sec.nombre.split(" ").slice(0, 2).join(" ")}</span>
                                        <span className="text-xs font-bold text-gray-700 flex-shrink-0">{sc.pts}<span className="text-gray-400 font-normal">/{sc.maxPts}</span></span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-1.5 rounded-full ${clr.dot} transition-all`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Resolución */}
                <div className={`px-4 py-3 flex items-center gap-4 border-t ${resClr.light} ${resClr.border}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${resClr.text} bg-white/70 flex-shrink-0 border ${resClr.border}`}>
                        {resolucion === "Aprobado" ? "✓" : resolucion === "Dudoso" ? "⚠" : "✕"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black ${resClr.text}`}>{resolucion}</p>
                        <p className={`text-sm mt-0.5 ${resClr.desc}`}>
                            {resolucion === "Aprobado" && "Ponderación ≥120 pts — cumple criterios para aprobación."}
                            {resolucion === "Dudoso"   && "Ponderación 75–119 pts — requiere dictamen adicional."}
                            {resolucion === "Rechazado"&& "Ponderación <75 pts — no cumple los criterios mínimos."}
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className={`text-3xl font-black tabular-nums ${resClr.text}`}>{totalPuntos}</p>
                        <p className="text-sm text-gray-400">de {maxPuntos} pts</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/// ─── Tab: Financiamiento ──────────────────────────────────────────────────────
function TabFinanciamiento({ caso }: { caso: Case }) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filtroTipo, setFiltroTipo] = useState<string>("Todos");

    // Obtener solvencia desde el último estado financiero subido
    const lastFinDoc = [...(caso.documentos ?? [])]
        .filter((d: any) => d.tipo === "estados-financieros" && d.datosExtraidos)
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    const lastFinData = lastFinDoc?.datosExtraidos
        ? (() => { try { return JSON.parse(lastFinDoc.datosExtraidos); } catch { return null; } })()
        : null;
    const lastPd = lastFinData?.periodData?.[lastFinData.periodData.length - 1];
    const utilidadNeta = lastPd?.estadoResultados?.utilidadNeta ?? null;
    const solvencia: "Utilidad" | "Pérdida" | "Quiebra Técnica" | null =
        utilidadNeta === null ? null :
        utilidadNeta > 0 ? "Utilidad" : "Pérdida";

    const resultados = matchearInstituciones(
        { sector: caso.sector, tipoFinanciamiento: caso.tipoFinanciamiento, fechaConstitucion: caso.fechaConstitucion, fechaAlta: caso.fechaAlta },
        solvencia,
    );

    const tipos = ["Todos", ...Array.from(new Set(resultados.map(r => r.institucion.tipo)))];
    const filtrados = filtroTipo === "Todos" ? resultados : resultados.filter(r => r.institucion.tipo === filtroTipo);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const PILAR_LABEL = ["Producto", "Sector", "Experiencia", "Solvencia"];

    return (
        <div className="space-y-4">
            {/* Header con resumen del perfil */}
            <div className="bg-blue-800 rounded-2xl px-5 py-4">
                <p className="text-sm font-black text-white mb-3 uppercase tracking-wide">Perfil del Solicitante</p>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <p className="text-white/50 text-xs mb-0.5">Sector</p>
                        <p className="text-white font-semibold text-xs">{caso.sector || "—"}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-0.5">Financiamiento</p>
                        <p className="text-white font-semibold text-xs">{caso.tipoFinanciamiento || "—"}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs mb-0.5">Solvencia</p>
                        <p className={`font-semibold text-xs ${solvencia === "Utilidad" ? "text-emerald-300" : solvencia === "Pérdida" ? "text-red-300" : "text-white/40 italic"}`}>
                            {solvencia ?? "Sin estados financieros"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filtros + contador */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1.5 flex-wrap">
                    {tipos.map(t => (
                        <button key={t} onClick={() => setFiltroTipo(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filtroTipo === t ? "bg-blue-800 text-white border-blue-800" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                    {filtrados.length} opciones · {selectedIds.size} seleccionadas
                </span>
            </div>

            {/* Lista de instituciones */}
            <div className="space-y-2">
                {filtrados.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 text-center text-gray-400 text-sm">
                        Sin opciones compatibles con el perfil del expediente.
                    </div>
                )}
                {filtrados.map(({ institucion: inst, score, nivel, pilares }) => {
                    const isSelected = selectedIds.has(inst.id);
                    const isExpanded = expanded === inst.id;
                    const pilarValues = [pilares.producto, pilares.sector, pilares.experiencia, pilares.solvencia];
                    return (
                        <div key={inst.id} className={`bg-white rounded-xl border transition-all ${isSelected ? "border-blue-400 shadow-sm shadow-blue-100" : "border-gray-100"}`}>
                            {/* Fila principal */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                {/* Checkbox selección */}
                                <button onClick={() => toggleSelect(inst.id)}
                                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400"}`}>
                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </button>

                                {/* Nombre + tipo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900">{inst.nombre}</span>
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${TIPO_COLORS[inst.tipo]}`}>{inst.tipo}</span>
                                        {inst.masRentable && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Rentable</span>}
                                    </div>
                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                        {inst.productos.map(p => (
                                            <span key={p} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{p}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Pilares */}
                                <div className="hidden sm:flex gap-1 flex-shrink-0">
                                    {PILAR_LABEL.map((label, i) => {
                                        const val = pilarValues[i];
                                        return (
                                            <div key={label} title={label}
                                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${val === true ? "bg-emerald-100 text-emerald-600" : val === false ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                                                {val === true ? "✓" : val === false ? "✕" : "?"}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Score + nivel */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="text-right">
                                        <div className="text-lg font-black text-gray-900">{score}</div>
                                        <div className="text-xs text-gray-400">/ 100</div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${NIVEL_COLORS[nivel]}`}>{nivel}</span>
                                </div>

                                {/* Expandir */}
                                <button onClick={() => setExpanded(isExpanded ? null : inst.id)} className="flex-shrink-0">
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                            </div>

                            {/* Detalle expandido */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                        {PILAR_LABEL.map((label, i) => {
                                            const val = pilarValues[i];
                                            return (
                                                <div key={label} className={`rounded-lg px-3 py-2 border ${val === true ? "bg-emerald-50 border-emerald-200" : val === false ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                                                    <p className="text-xs text-gray-500 font-semibold mb-0.5">{label}</p>
                                                    <p className={`text-xs font-bold ${val === true ? "text-emerald-600" : val === false ? "text-red-500" : "text-gray-400"}`}>
                                                        {val === true ? "Cumple" : val === false ? "No cumple" : "Sin datos"}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <span className="text-xs text-gray-400 font-semibold">Sectores:</span>
                                        {inst.sectores.map(s => <span key={s} className="text-xs bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s}</span>)}
                                        <span className="text-xs text-gray-400 font-semibold ml-2">Buró:</span>
                                        {inst.buroAceptado.map(b => <span key={b} className="text-xs bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-blue-600">{b}</span>)}
                                        <span className="text-xs text-gray-400 font-semibold ml-2">Garantías:</span>
                                        {inst.garantias.map(g => <span key={g} className="text-xs bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-purple-600">{g}</span>)}
                                    </div>
                                    <p className="text-xs text-gray-400 italic mt-2">Sujeto a validación por parte de la institución financiera.</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Barra de acciones si hay seleccionadas */}
            {selectedIds.size > 0 && (
                <div className="sticky bottom-4 bg-blue-800 rounded-2xl px-5 py-3 flex items-center justify-between gap-3 shadow-lg">
                    <p className="text-sm font-semibold text-white">{selectedIds.size} institución{selectedIds.size > 1 ? "es" : ""} seleccionada{selectedIds.size > 1 ? "s" : ""}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedIds(new Set())} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold">
                            Limpiar
                        </button>
                        <button
                            onClick={() => window.open(`/propuesta/${caso.id}`, "_blank")}
                            className="text-xs px-3 py-1.5 bg-white text-blue-800 rounded-lg font-bold hover:bg-blue-50">
                            Generar propuesta →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Modal: Rechazar Caso ─────────────────────────────────────────────────────
const MOTIVOS_RECHAZO = [
    "Buró de crédito con historial negativo",
    "Documentación incompleta o inconsistente",
    "Capacidad de pago insuficiente",
    "Sector o perfil fuera de política",
    "Ratio de endeudamiento fuera de rango",
    "Sin garantías suficientes",
    "Evaluación de riesgo por debajo del mínimo",
    "Otro",
];

function RechazoModal({ caso, onClose, onRechazado }: { caso: Case; onClose: () => void; onRechazado: (updated: Case) => void }) {
    const [motivo, setMotivo] = useState("");
    const [motivoCustom, setMotivoCustom] = useState("");
    const [responsable, setResponsable] = useState(EJECUTIVOS[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const motivoFinal = motivo === "Otro" ? motivoCustom : motivo;

    const handleSubmit = async () => {
        if (!motivoFinal.trim()) { setError("Selecciona o escribe el motivo de rechazo."); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch(`/api/expedientes/${caso.id}/rechazar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ motivo: motivoFinal, responsable }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Error al rechazar el caso");
            onRechazado(json.data);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                            <Ban className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Rechazar caso</h2>
                            <p className="text-xs text-gray-400">{caso.cliente}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Motivo de rechazo *</label>
                        <div className="space-y-1.5">
                            {MOTIVOS_RECHAZO.map(m => (
                                <button key={m} onClick={() => setMotivo(m)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${motivo === m ? "bg-red-50 border-red-300 text-red-800 font-semibold" : "border-gray-200 text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                        {motivo === "Otro" && (
                            <textarea
                                value={motivoCustom}
                                onChange={e => setMotivoCustom(e.target.value)}
                                rows={2}
                                placeholder="Describe el motivo..."
                                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Responsable de la decisión</label>
                        <select value={responsable} onChange={e => setResponsable(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                            {EJECUTIVOS.map(j => <option key={j}>{j}</option>)}
                        </select>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                        </div>
                    )}
                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} disabled={saving}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando…</> : <><Ban className="w-3.5 h-3.5" />Confirmar rechazo</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Historial de Actividad ──────────────────────────────────────────────
const TIPO_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    "campo_actualizado": { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-600" },
    "rechazado": { icon: <Ban className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-600" },
    "propuesta": { icon: <FileText className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-600" },
    "creado": { icon: <Plus className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-600" },
    "documento": { icon: <UploadCloud className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-600" },
};

function TabHistorial({ caso }: { caso: Case }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/expedientes/${caso.id}/actividad`)
            .then(r => r.json())
            .then(j => { if (j.success) setLogs(j.data); })
            .finally(() => setLoading(false));
    }, [caso.id]);

    function fmtTs(iso: string) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                + " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        } catch { return iso; }
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-800">Historial de actividad</h3>
                    <span className="ml-auto text-xs text-gray-400">{logs.length} evento{logs.length !== 1 ? "s" : ""}</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />Cargando historial…
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-10 text-center">
                        <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Sin actividad registrada aún.</p>
                        <p className="text-xs text-gray-300 mt-1">Los cambios a partir de ahora quedarán registrados aquí.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                        <div className="space-y-3">
                            {logs.map((log, i) => {
                                const style = TIPO_ICONS[log.tipo] ?? { icon: <Clock className="w-3.5 h-3.5" />, color: "bg-gray-100 text-gray-500" };
                                return (
                                    <div key={log.id} className="flex gap-4 relative">
                                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.color}`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-gray-700 leading-snug">{log.descripcion}</p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{fmtTs(log.creadoEn)}</span>
                                            </div>
                                            {log.usuario && log.usuario !== "Sistema" && (
                                                <p className="text-xs text-gray-400 mt-1">Por: <span className="font-semibold text-gray-500">{log.usuario}</span></p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Rechazo info si aplica */}
            {caso.situacion === "Rechazado" && caso.rechazoMotivo && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Ban className="w-4 h-4 text-red-600" />
                        <h3 className="text-sm font-bold text-red-800">Caso Rechazado</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">Motivo</p>
                            <p className="text-sm text-red-800 font-medium">{caso.rechazoMotivo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">Responsable</p>
                            <p className="text-sm text-red-800 font-medium">{caso.rechazoResponsable}</p>
                        </div>
                        {caso.rechazoFecha && (
                            <div className="col-span-2">
                                <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">Fecha</p>
                                <p className="text-sm text-red-800 font-medium">{fmtDate(caso.rechazoFecha)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Case Detail (tabbed) ─────────────────────────────────────────────────────
const TABS = [
    { id: "resumen", label: "Resumen", icon: User },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "analisis", label: "Análisis", icon: BarChart2 },
    { id: "financiamiento", label: "Financiamiento", icon: Building2 },
    { id: "historial", label: "Historial", icon: Clock },
];

function CaseDetail({ caso, onBack, onUpdate }: { caso: Case; onBack: () => void; onUpdate?: (updated: Case) => void }) {
    const [activeTab, setActiveTab] = useState("resumen");
    const [showRechazo, setShowRechazo] = useState(false);

    return (
        <div>
            {showRechazo && (
                <RechazoModal
                    caso={caso}
                    onClose={() => setShowRechazo(false)}
                    onRechazado={updated => { onUpdate?.(updated); setShowRechazo(false); }}
                />
            )}

            {/* Breadcrumb + acciones */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />Casos
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-sm text-gray-700 font-medium">{caso.cliente}</span>
                    <span className="text-sm text-gray-400 font-mono">· {caso.folio}</span>
                </div>
                {caso.situacion !== "Rechazado" && caso.situacion !== "Cerrado" && (
                    <button
                        onClick={() => setShowRechazo(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5" />Rechazar caso
                    </button>
                )}
                {caso.situacion === "Rechazado" && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg">
                        <Ban className="w-3.5 h-3.5" />Caso rechazado
                    </span>
                )}
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === id
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Icon className="w-4 h-4" />{label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "resumen" && <TabResumen caso={caso} onUpdate={onUpdate} />}
            {activeTab === "documentos" && <TabDocumentos caso={caso} onUpdate={onUpdate} />}
            {activeTab === "analisis" && <TabAnalisis caso={caso} />}
            {activeTab === "financiamiento" && <TabFinanciamiento caso={caso} />}
            {activeTab === "historial" && <TabHistorial caso={caso} />}
        </div>
    );
}

// ─── Nuevo Expediente Modal ───────────────────────────────────────────────────
const EJECUTIVOS = ["Ana Valdés", "Carlos Ruiz", "Laura Méndez", "Roberto Gil"];
const TIPOS_FIN = ["Crédito simple", "Línea de crédito revolvente", "Arrendamiento financiero", "Factoraje financiero", "Crédito hipotecario empresarial", "Crédito verde / sostenible"];
const SECTORES = ["Industrial", "Inmobiliario", "Logística", "Manufactura", "Construcción", "Agroindustria", "Salud", "Distribución", "Energía", "Otro"];

// ── Field component at MODULE level (must NOT be inside a component)
// Defining it inside a component causes remount on every render → focus lost
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
            {children}
        </div>
    );
}

function NuevoExpedienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: any) => void }) {
    const [form, setForm] = useState({
        cliente: "", rfc: "", contacto: "", email: "", telefono: "",
        ejecutivo: EJECUTIVOS[0], tipoFinanciamiento: TIPOS_FIN[0],
        montoSolicitado: "", sector: SECTORES[0], observaciones: "",
        fechaConstitucion: "",
    });

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setSaveError("");
        try {
            const res = await fetch("/api/expedientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Error al crear expediente");
            onCreated(json.data);
            onClose();
        } catch (err: any) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Nuevo expediente</h2>
                        <p className="text-sm text-gray-400">Complete los datos iniciales del caso</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Razón social *">
                            <input required value={form.cliente} onChange={e => set("cliente", e.target.value)} placeholder="Empresa S.A. de C.V." className={inputCls} />
                        </Field>
                        <Field label="RFC">
                            <input value={form.rfc} onChange={e => set("rfc", e.target.value)} placeholder="XAXX010101000" className={inputCls} />
                        </Field>
                        <Field label="Nombre del contacto">
                            <input value={form.contacto} onChange={e => set("contacto", e.target.value)} placeholder="Director General" className={inputCls} />
                        </Field>
                        <Field label="Correo electrónico">
                            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contacto@empresa.mx" className={inputCls} />
                        </Field>
                        <Field label="Teléfono">
                            <input value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="662 XXX XXXX" className={inputCls} />
                        </Field>
                        <Field label="Ejecutivo asignado">
                            <select value={form.ejecutivo} onChange={e => set("ejecutivo", e.target.value)} className={inputCls}>
                                {EJECUTIVOS.map(j => <option key={j}>{j}</option>)}
                            </select>
                        </Field>
                        <Field label="Sector">
                            <select value={form.sector} onChange={e => set("sector", e.target.value)} className={inputCls}>
                                {SECTORES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Tipo de financiamiento solicitado">
                            <select value={form.tipoFinanciamiento} onChange={e => set("tipoFinanciamiento", e.target.value)} className={inputCls}>
                                {TIPOS_FIN.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Field label="Monto solicitado">
                            <input value={form.montoSolicitado} onChange={e => set("montoSolicitado", e.target.value)} placeholder="$0,000,000" className={inputCls} />
                        </Field>
                        <Field label="Fecha de constitución">
                            <input type="date" value={form.fechaConstitucion} onChange={e => set("fechaConstitucion", e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                    <Field label="Observaciones iniciales">
                        <textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)}
                            rows={3} placeholder="Contexto relevante del caso…"
                            className={`${inputCls} resize-none`} />
                    </Field>

                    {saveError && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveError}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando…</> : "Crear expediente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Cases List ───────────────────────────────────────────────────────────────
const SITUACION_OPTS = ["Todas", "En curso", "Requiere revisión", "Observado", "Listo para propuesta", "Cerrado", "Rechazado"];
const ETAPA_OPTS = ["Todas", ...ETAPAS_PROCESO];

export default function CasosPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [search, setSearch] = useState("");
    const [filterSituacion, setFilterSituacion] = useState("Todas");
    const [filterEtapa, setFilterEtapa] = useState("Todas");
    const [showNewForm, setShowNewForm] = useState(false);

    const loadCases = useCallback(async () => {
        setLoading(true); setLoadError("");
        try {
            const res = await fetch("/api/expedientes");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Error al cargar expedientes");
            setCases(json.data);
        } catch (err: any) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCases(); }, [loadCases]);

    const filtered = cases.filter(c => {
        const matchSearch = c.cliente.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
        const matchSituacion = filterSituacion === "Todas" || c.situacion === filterSituacion;
        const matchEtapa = filterEtapa === "Todas" || c.etapaNombre === filterEtapa;
        return matchSearch && matchSituacion && matchEtapa;
    });

    if (selectedCase) return <CaseDetail caso={selectedCase} onBack={() => setSelectedCase(null)} onUpdate={updated => setSelectedCase(updated)} />;

    return (
        <div>
            {showNewForm && (
                <NuevoExpedienteModal
                    onClose={() => setShowNewForm(false)}
                    onCreated={c => setCases(prev => [c, ...prev])}
                />
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Casos</h1>
                    <p className="text-gray-500 mt-1">{cases.length} expedientes en cartera</p>
                </div>
                <button onClick={() => setShowNewForm(true)}
                    className="flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
                    <Plus className="w-4 h-4" />Nuevo expediente
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
                <div className="flex flex-wrap gap-3 items-center">
                    <input type="text" placeholder="Buscar por razón social o ID…" value={search} onChange={e => setSearch(e.target.value)}
                        className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                    <select value={filterEtapa} onChange={e => setFilterEtapa(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ETAPA_OPTS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    {(filterSituacion !== "Todas" || filterEtapa !== "Todas" || search) && (
                        <button onClick={() => { setFilterSituacion("Todas"); setFilterEtapa("Todas"); setSearch(""); }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline">Limpiar</button>
                    )}
                    <span className="ml-auto text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
                </div>
                {/* Filtro por estado */}
                <div className="flex gap-1.5 flex-wrap">
                    {SITUACION_OPTS.map(o => (
                        <button key={o} onClick={() => setFilterSituacion(o)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterSituacion === o ? "bg-blue-800 text-white border-blue-800" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                            {o}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ fontSize: "16px" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Razón social</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ejecutivo</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo de financiamiento</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Etapa actual</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Situación</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Completitud</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alta</th>
                                <th className="px-3 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {/* Loading state */}
                            {loading && (
                                <tr>
                                    <td colSpan={9} className="py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />Cargando expedientes…
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {loadError && !loading && (
                                <tr>
                                    <td colSpan={9} className="py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                            <p className="text-sm text-red-600 font-medium">{loadError}</p>
                                            <button onClick={loadCases} className="text-xs text-blue-600 underline font-semibold">Reintentar</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && !loadError && filtered.map(caso => (
                                <tr key={caso.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedCase(caso)}>
                                    <td className="px-3 py-3 font-mono text-xs text-gray-500 font-semibold whitespace-nowrap">{caso.folio}</td>
                                    <td className="px-3 py-3">
                                        <div className="font-semibold text-gray-900 max-w-[180px] truncate">{caso.cliente}</div>
                                        <div className="text-xs text-gray-400">{caso.sector}</div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{caso.ejecutivo}</td>
                                    <td className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">
                                        <div className="truncate">{caso.tipoFinanciamiento}</div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ETAPA_COLORS[caso.etapaNombre]}`}>
                                            {caso.etapaNombre}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${SITUACION_COLORS[caso.situacion]}`}>
                                            {caso.situacion}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 min-w-[100px]"><CompletitudBar value={caso.completitud} /></td>
                                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{caso.fechaAlta}</td>
                                    <td className="px-3 py-3">
                                        <button onClick={e => { e.stopPropagation(); setSelectedCase(caso); }}
                                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap">
                                            Ver expediente
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No se encontraron expedientes con los filtros seleccionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}



