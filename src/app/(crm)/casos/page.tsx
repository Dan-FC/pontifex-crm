"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, User, FileText, BarChart2, Building2,
    AlertTriangle, ChevronRight, Plus, X, Loader2,
    Download, CheckCircle2, AlertCircle, Table2, Info,
    UploadCloud, ChevronDown, ChevronUp,
} from "lucide-react";
import {
    ETAPAS_PROCESO, SITUACION_COLORS, ETAPA_COLORS,
    MOCK_DOCUMENTOS, DOC_ESTATUS_COLORS,
    MOCK_INSTITUCIONES, COMPATIBILIDAD_COLORS,
} from "@/lib/mock-data";
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
    fechaAlta: string;
    ultimaActualizacion: string;
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
                                <p className="text-xs text-red-600">❌ Falta: {cat.camposFaltantes.join(', ')}</p>
                            )}
                            {cat.camposCompletos.length > 0 && (
                                <p className="text-xs text-emerald-600">✓ {cat.camposCompletos.join(', ')}</p>
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

function Stepper({ etapaActual }: { etapaActual: number }) {
    return (
        <div className="flex items-start justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
            {ETAPAS_PROCESO.map((etapa, i) => {
                const step = i + 1;
                const isComplete = step < etapaActual;
                const isActive = step === etapaActual;
                return (
                    <div key={etapa} className="flex flex-col items-center gap-2 z-10 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isActive ? "border-blue-500 bg-white text-blue-600 shadow-md shadow-blue-100"
                            : isComplete ? "border-blue-500 bg-blue-500 text-white"
                                : "border-gray-300 bg-white text-gray-400"
                            }`}>{step}</div>
                        <span className={`text-xs font-semibold text-center leading-tight max-w-[70px] ${isActive ? "text-blue-600" : isComplete ? "text-blue-500" : "text-gray-400"
                            }`}>{etapa}</span>
                    </div>
                );
            })}
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

            {/* Stepper */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-6">Flujo del expediente</p>
                <Stepper etapaActual={caso.etapa} />
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
                            ✏️ Editar
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
                {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {([
                            { key: "rfc", label: "RFC", type: "text", placeholder: "XAXX010101000" },
                            { key: "contacto", label: "Contacto", type: "text", placeholder: "Nombre director" },
                            { key: "email", label: "Correo", type: "email", placeholder: "contacto@empresa.mx" },
                            { key: "telefono", label: "Teléfono", type: "text", placeholder: "662 XXX XXXX" },
                            { key: "montoSolicitado", label: "Monto solicitado", type: "text", placeholder: "$0,000,000" },
                            { key: "sector", label: "Sector", type: "text", placeholder: "Construcción" },
                        ] as Array<{ key: keyof typeof editForm; label: string; type: string; placeholder: string }>).map(({ key, label, type, placeholder }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                                <input type={type} value={editForm[key]}
                                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { l: "RFC", v: caso.rfc || "—", warn: !caso.rfc },
                            { l: "Contacto", v: caso.contacto || "—", warn: false },
                            { l: "Correo", v: caso.email || "—", warn: false },
                            { l: "Teléfono", v: caso.telefono || "—", warn: false },
                            { l: "Sector", v: caso.sector || "—", warn: false },
                            { l: "Ejecutivo", v: caso.ejecutivo || "—", warn: false },
                        ].map(({ l, v, warn }) => (
                            <div key={l}>
                                <p className="text-xs text-gray-400">{l}</p>
                                <p className={`text-sm font-semibold ${warn ? "text-red-500 italic" : "text-gray-800"}`}>{v}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Alertas */}
            {(() => {
                let alertasList: string[] = [];
                try { alertasList = Array.isArray(caso.alertas) ? caso.alertas : JSON.parse(caso.alertas || "[]"); }
                catch { alertasList = []; }
                return alertasList.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />Alertas ({alertasList.length})
                        </p>
                        <ul className="space-y-2">
                            {alertasList.map((a: string, i: number) => (
                                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>{a}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                        <p className="text-sm text-emerald-700 font-medium">Sin alertas ni inconsistencias detectadas.</p>
                    </div>
                );
            })()}
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
            const formData = new FormData();
            formData.append("pdf", f);
            formData.append("docId", docId);
            formData.append("nombre", f.name);

            if (isBankStatement) {
                const ocrForm = new FormData();
                ocrForm.append("pdf", f);
                const ocrRes = await fetch("/api/process-pdf", { method: "POST", body: ocrForm });
                const ocrData = await ocrRes.json();
                if (!ocrRes.ok) throw new Error(ocrData.error || "Error OCR");

                formData.append("estatus", "Procesado");
                const regRes = await fetch(`/api/expedientes/${casoId}/documentos`, { method: "POST", body: formData });
                const regData = await regRes.json();
                if (!regRes.ok) throw new Error(regData.error || "Error al registrar");

                onSuccess({
                    nombre: f.name, estatus: "Procesado",
                    url: regData.data?.url,
                    ingresos: ocrData.data.ingresos_totales,
                    egresos: ocrData.data.egresos_totales,
                    periodo: ocrData.data.periodo,
                    movimientos: ocrData.data.movimientos,
                    txtContent: ocrData.txtContent,
                    txtFilename: ocrData.txtFilename,
                });
            } else if (isFinancialStatement) {
                // 1. OCR del estado financiero
                const ocrForm = new FormData();
                ocrForm.append("pdf", f);
                const ocrRes = await fetch("/api/process-financial-statement", { method: "POST", body: ocrForm });
                const ocrData = await ocrRes.json();
                if (!ocrRes.ok) throw new Error(ocrData.error || "Error OCR");

                // 2. Registrar en DB y subir a Supabase (incluye datos extraídos)
                formData.append("estatus", "Procesado");
                formData.append("datosExtraidos", JSON.stringify(ocrData.data));
                const regRes = await fetch(`/api/expedientes/${casoId}/documentos`, { method: "POST", body: formData });
                const regData = await regRes.json();
                if (!regRes.ok) throw new Error(regData.error || "Error al registrar");

                onSuccess({
                    nombre: f.name, estatus: "Procesado",
                    url: regData.data?.url,
                    docDbId: regData.data?.id,
                    financialData: ocrData.data,
                });
            } else {
                formData.append("estatus", "Entregado");
                const res = await fetch(`/api/expedientes/${casoId}/documentos`, { method: "POST", body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al registrar");
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
function FinancialStatementPreview({ info }: { info: UploadedDocInfo }) {
    const d = info.financialData;
    if (!d) return null;

    const [activePeriod, setActivePeriod] = useState(0);
    const [showRaw, setShowRaw] = useState(false);

    const periodData: any[] = d.periodData ?? [];
    const periodos: string[] = d.periodos ?? [];

    // Active period data (fallback to top-level for older responses)
    const current = periodData[activePeriod] ?? { balanceGeneral: d.balanceGeneral, estadoResultados: d.estadoResultados, kpis: d.kpis };
    const bg = current.balanceGeneral;
    const er = current.estadoResultados;
    const kp = current.kpis;

    const fmt = (v: number | null) =>
        v !== null ? `$${Math.round(v).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : <span className="text-gray-300">—</span>;
    const fmtSub = (v: number | null): string | null =>
        v !== null ? `$${Math.round(v).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null;
    const fmtPct = (v: number | null) =>
        v !== null ? `${(v * 100).toFixed(1)}%` : <span className="text-gray-300">—</span>;
    const fmtX = (v: number | null) =>
        v !== null ? `${v.toFixed(2)}x` : <span className="text-gray-300">—</span>;
    const fmtDias = (v: number | null) =>
        v !== null ? `${Math.round(v)} días` : <span className="text-gray-300">—</span>;

    const Row = ({ label, value, indent }: { label: string; value: React.ReactNode; indent?: boolean }) => (
        <div className={`flex justify-between items-center py-1.5 hover:bg-gray-50/70 transition-colors rounded-md px-1 ${indent ? "pl-5" : ""}`}>
            <span className="text-xs text-gray-600">{label}</span>
            <span className="text-xs font-semibold text-gray-800">{value}</span>
        </div>
    );

    const SubTotal = ({ label, value, color }: { label: string; value: React.ReactNode; color: string }) => {
        const cls: Record<string, string> = {
            emerald: "bg-emerald-50 text-emerald-700 border-emerald-400",
            red: "bg-red-50 text-red-700 border-red-400",
            indigo: "bg-indigo-50 text-indigo-700 border-indigo-400",
            blue: "bg-blue-50 text-blue-700 border-blue-400",
            amber: "bg-amber-50 text-amber-700 border-amber-400",
            purple: "bg-purple-50 text-purple-700 border-purple-400",
        };
        return (
            <div className={`flex justify-between items-center py-1.5 mt-2 mb-0.5 rounded-lg px-3 border-l-2 ${cls[color]}`}>
                <span className="text-xs font-bold tracking-wide">{label}</span>
                {value != null && <span className="text-sm font-extrabold">{value}</span>}
            </div>
        );
    };

    const TotalBar = ({ label, value, color }: { label: string; value: React.ReactNode; color: string }) => {
        const cls: Record<string, string> = {
            emerald: "from-emerald-600 to-emerald-500",
            red: "from-red-600 to-red-500",
            indigo: "from-indigo-600 to-indigo-500",
            purple: "from-purple-600 to-purple-500",
        };
        return (
            <div className={`flex justify-between items-center py-2 mt-2 px-3 rounded-xl bg-gradient-to-r ${cls[color]} shadow-sm`}>
                <span className="text-xs font-black text-white uppercase tracking-wider">{label}</span>
                <span className="text-sm font-black text-white">{value}</span>
            </div>
        );
    };

    const SectionLabel = ({ children, color }: { children: React.ReactNode; color: "emerald" | "red" | "indigo" }) => {
        const bar = { emerald: "bg-emerald-400", red: "bg-red-400", indigo: "bg-indigo-400" }[color];
        const text = { emerald: "text-emerald-600", red: "text-red-600", indigo: "text-indigo-600" }[color];
        return (
            <div className="flex items-center gap-2 mt-4 mb-1">
                <div className={`w-1 h-3.5 rounded-full ${bar}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${text}`}>{children}</span>
            </div>
        );
    };

    return (
        <div className="mt-4 space-y-4">
            {/* Period selector — centered segmented control */}
            {periodos.length > 1 && (
                <div className="flex justify-center">
                    <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
                        {periodos.map((p, i) => (
                            <button
                                key={p}
                                onClick={() => setActivePeriod(i)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    activePeriod === i
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Balance General + Estado de Resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Balance General */}
                <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-500 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-bold text-white">Balance General</span>
                        {periodos[activePeriod] && (
                            <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{periodos[activePeriod]}</span>
                        )}
                    </div>
                    <div className="p-4">
                        <SectionLabel color="emerald">Activo</SectionLabel>
                        <SubTotal label="Activo Circulante" value={fmtSub(bg.activoCirculante)} color="emerald" />
                        <Row label="Inventarios" value={fmt(bg.inventarios)} indent />
                        <Row label="Clientes" value={fmt(bg.clientes)} indent />
                        <Row label="Deudores Diversos" value={fmt(bg.deudoresDiversos)} indent />
                        <SubTotal label="Activo Fijo" value={fmtSub(bg.activoFijo)} color="emerald" />
                        <Row label="Terrenos y Edificios" value={fmt(bg.terrenosEdificios)} indent />
                        <Row label="Maquinaria y Equipo" value={fmt(bg.maquinariaEquipo)} indent />
                        <Row label="Equipo de Transporte" value={fmt(bg.equipoTransporte)} indent />
                        <SubTotal label="Otros Activos" value={fmtSub(bg.otrosActivos)} color="emerald" />
                        <Row label="Intangibles" value={fmt(bg.intangibles)} indent />
                        <TotalBar label="Activo Total" value={fmt(bg.activoTotal)} color="emerald" />

                        <SectionLabel color="red">Pasivo</SectionLabel>
                        <SubTotal label="Pasivo Circulante" value={fmtSub(bg.pasivoCirculante)} color="red" />
                        <Row label="Proveedores" value={fmt(bg.proveedores)} indent />
                        <Row label="Acreedores Diversos" value={fmt(bg.acreedoresDiversos)} indent />
                        <Row label="Documentos por Pagar Corto Plazo" value={fmt(bg.docsPagarCP)} indent />
                        <SubTotal label="Pasivo Largo Plazo" value={fmtSub(bg.pasivoLargoPlazo)} color="red" />
                        <Row label="Documentos por Pagar Largo Plazo" value={fmt(bg.docsPagarLP)} indent />
                        <Row label="Otros Pasivos" value={fmt(bg.otrosPasivos)} indent />
                        <TotalBar label="Pasivo Total" value={fmt(bg.pasivoTotal)} color="red" />

                        <SectionLabel color="indigo">Capital</SectionLabel>
                        <Row label="Capital Social" value={fmt(bg.capitalSocial)} />
                        <Row label="Utilidad de Ejercicios Anteriores" value={fmt(bg.utilidadesAnteriores)} />
                        <TotalBar label="Capital Contable" value={fmt(bg.capitalContable)} color="indigo" />
                    </div>
                </div>

                {/* Estado de Resultados */}
                <div className="bg-white border border-purple-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gradient-to-r from-violet-700 to-purple-500 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-bold text-white">Estado de Resultados</span>
                        {periodos[activePeriod] && (
                            <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{periodos[activePeriod]}</span>
                        )}
                    </div>
                    <div className="p-4">
                        <SubTotal label="VENTAS" value={fmt(er.ventas)} color="purple" />
                        <Row label="Costos de Venta" value={fmt(er.costoVenta)} indent />
                        <SubTotal label="Utilidad Bruta" value={fmtSub(er.utilidadBruta)} color="emerald" />
                        <Row label="Gastos de Operación" value={fmt(er.gastosOperacion)} indent />
                        <SubTotal label="Utilidad de Operación" value={fmtSub(er.utilidadOperacion)} color="blue" />
                        <Row label="Gastos Financieros" value={fmt(er.gastosFinancieros)} indent />
                        <Row label="Otros Productos" value={fmt(er.otrosProductos)} indent />
                        <Row label="Otros Gastos" value={fmt(er.otrosGastos)} indent />
                        <SubTotal label="Utilidad Antes de Impuestos" value={fmtSub(er.utilidadAntesImpuestos)} color="amber" />
                        <Row label="Impuestos" value={fmt(er.impuestos)} indent />
                        <Row label="Depreciación" value={fmt(er.depreciacion)} indent />
                        <TotalBar label="Utilidad Neta" value={fmt(er.utilidadNeta)} color="purple" />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-500 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-bold text-white">Indicadores Financieros</span>
                    {periodos[activePeriod] && (
                        <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{periodos[activePeriod]}</span>
                    )}
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Liquidez Circulante", value: fmtX(kp.liquidezCirculante), color: "blue" },
                        { label: "Prueba del Ácido", value: fmtX(kp.pruebaAcido), color: "blue" },
                        { label: "Rotación Cuentas por Cobrar", value: fmtX(kp.rotacionCxC), color: "emerald" },
                        { label: "Rotación Cuentas por Pagar", value: fmtDias(kp.rotacionCxP), color: "emerald" },
                        { label: "Rotación Inventarios", value: fmtDias(kp.rotacionInventarios), color: "emerald" },
                        { label: "Deuda Total", value: fmtPct(kp.deudaTotal), color: "amber" },
                        { label: "Deuda / Capital", value: fmtX(kp.deudaCapital), color: "amber" },
                        { label: "Deuda Largo Plazo", value: fmtX(kp.deudaLP), color: "amber" },
                        { label: "Margen de Utilidad", value: fmtPct(kp.margenUtilidad), color: "purple" },
                        { label: "ROA", value: fmtPct(kp.roa), color: "purple" },
                        { label: "ROE", value: fmtPct(kp.roe), color: "purple" },
                    ].map(({ label, value, color }) => {
                        const colors: Record<string, string> = {
                            blue: "bg-blue-50 border-blue-100 text-blue-700",
                            emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
                            amber: "bg-amber-50 border-amber-100 text-amber-700",
                            purple: "bg-purple-50 border-purple-100 text-purple-700",
                        };
                        return (
                            <div key={label} className={`rounded-xl border p-3 ${colors[color]}`}>
                                <p className="text-xs opacity-70 mb-1">{label}</p>
                                <p className="text-base font-extrabold">{value}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Debug: texto crudo extraído del PDF */}
            <div className="mt-3">
                <button
                    onClick={() => setShowRaw(r => !r)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                >
                    {showRaw ? "▲ Ocultar texto extraído" : "▼ Ver texto crudo del PDF (debug)"}
                </button>
                {showRaw && (
                    <pre className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                        {d.rawText ?? "No disponible"}
                    </pre>
                )}
            </div>
        </div>
    );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────
function TabDocumentos({ caso }: { caso: Case }) {
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
    }, [caso.id]);

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
                                                            ? <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">✓ Entregado</span>
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

                                                                                {/* Edit data form */}
                                                                                {isEditing && editingFile?.mode === "edit" && (
                                                                                    <div className="p-3 border-t border-gray-100 space-y-2">
                                                                                        <p className="text-xs font-bold text-gray-500">Editar datos extraídos (principales)</p>
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            {[
                                                                                                { key: "ventas", label: "Ventas" },
                                                                                                { key: "costoVenta", label: "Costo de Venta" },
                                                                                                { key: "utilidadNeta", label: "Utilidad Neta" },
                                                                                                { key: "activoTotal", label: "Activo Total" },
                                                                                                { key: "pasivoTotal", label: "Pasivo Total" },
                                                                                                { key: "capitalContable", label: "Capital Contable" },
                                                                                            ].map(({ key, label }) => (
                                                                                                <div key={key}>
                                                                                                    <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={editValues[key] ?? ""}
                                                                                                        onChange={e => setEditValues(v => ({ ...v, [key]: e.target.value }))}
                                                                                                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                                                                                                        placeholder="0"
                                                                                                    />
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                        <button
                                                                                            disabled={editSaving}
                                                                                            onClick={async () => {
                                                                                                setEditSaving(true);
                                                                                                try {
                                                                                                    // Merge edited values into existing parsedData
                                                                                                    const updated = JSON.parse(JSON.stringify(parsedData));
                                                                                                    if (updated.periodData?.[0]) {
                                                                                                        const pd = updated.periodData[0];
                                                                                                        const n = (k: string) => editValues[k] !== "" ? Number(editValues[k]) : null;
                                                                                                        pd.estadoResultados.ventas = n("ventas");
                                                                                                        pd.estadoResultados.costoVenta = n("costoVenta");
                                                                                                        pd.estadoResultados.utilidadNeta = n("utilidadNeta");
                                                                                                        pd.balanceGeneral.activoTotal = n("activoTotal");
                                                                                                        pd.balanceGeneral.pasivoTotal = n("pasivoTotal");
                                                                                                        pd.balanceGeneral.capitalContable = n("capitalContable");
                                                                                                    }
                                                                                                    const res = await fetch(`/api/expedientes/${caso.id}/documentos/${file.id}`, {
                                                                                                        method: "PATCH",
                                                                                                        headers: { "Content-Type": "application/json" },
                                                                                                        body: JSON.stringify({ datosExtraidos: updated }),
                                                                                                    });
                                                                                                    if (!res.ok) throw new Error("Error al guardar");
                                                                                                    // Update session state too
                                                                                                    setUploaded(prev => ({
                                                                                                        ...prev,
                                                                                                        [doc.id]: { ...prev[doc.id], financialData: updated, docDbId: file.id },
                                                                                                    }));
                                                                                                    setEditingFile(null);
                                                                                                    showToast("Datos actualizados");
                                                                                                } catch { showToast("Error al guardar datos"); }
                                                                                                finally { setEditSaving(false); }
                                                                                            }}
                                                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                                                                                            {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                                                            Guardar cambios
                                                                                        </button>
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
            <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
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
        blue:    { header: "from-blue-700 to-blue-500",     badge: "bg-white/20 text-white", row: "hover:bg-blue-50",    dot: "bg-blue-500" },
        violet:  { header: "from-violet-700 to-violet-500", badge: "bg-white/20 text-white", row: "hover:bg-violet-50",  dot: "bg-violet-500" },
        amber:   { header: "from-amber-600 to-amber-400",   badge: "bg-white/20 text-white", row: "hover:bg-amber-50",   dot: "bg-amber-500" },
        emerald: { header: "from-emerald-700 to-emerald-500",badge: "bg-white/20 text-white", row: "hover:bg-emerald-50", dot: "bg-emerald-500" },
        indigo:  { header: "from-indigo-700 to-indigo-500", badge: "bg-white/20 text-white", row: "hover:bg-indigo-50",  dot: "bg-indigo-500" },
        purple:  { header: "from-purple-700 to-purple-500", badge: "bg-white/20 text-white", row: "hover:bg-purple-50",  dot: "bg-purple-500" },
        rose:    { header: "from-rose-700 to-rose-500",     badge: "bg-white/20 text-white", row: "hover:bg-rose-50",    dot: "bg-rose-500" },
    };

    return (
        <div className="space-y-4">
            {/* ── Encabezado con puntuación total ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Evaluación de Crédito — Personas Morales</p>
                        <h2 className="text-2xl font-extrabold text-gray-900">{totalPuntos} <span className="text-sm font-semibold text-gray-400">/ {maxPuntos} pts</span></h2>
                        <p className="text-xs text-gray-400 mt-1">{seleccionados} de {totalFactores} factores evaluados</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                            resolucion === "Aprobado" ? "bg-emerald-100 text-emerald-700" :
                            resolucion === "Dudoso"   ? "bg-amber-100 text-amber-700" :
                                                        "bg-red-100 text-red-700"
                        }`}>{resolucion === "Aprobado" ? "✓ " : resolucion === "Dudoso" ? "⚠ " : "✕ "}{resolucion}</span>
                        {saveStatus === "saving" && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Guardando…</span>}
                        {saveStatus === "saved"  && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Guardado</span>}
                    </div>
                </div>

                {/* Barra de puntuación total */}
                <div className="mt-4">
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        {/* Zone markers */}
                        <div className="absolute top-0 bottom-0 bg-red-200/60"    style={{ left: 0, width: `${(75/maxPuntos)*100}%` }} />
                        <div className="absolute top-0 bottom-0 bg-amber-200/60"  style={{ left: `${(75/maxPuntos)*100}%`, width: `${((120-75)/maxPuntos)*100}%` }} />
                        <div className="absolute top-0 bottom-0 bg-emerald-200/60" style={{ left: `${(120/maxPuntos)*100}%`, right: 0 }} />
                        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                            totalPuntos >= 120 ? "bg-emerald-500" : totalPuntos >= 75 ? "bg-amber-500" : "bg-red-500"
                        }`} style={{ width: `${Math.min((totalPuntos/maxPuntos)*100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>0</span>
                        <span className="text-red-400">Rechazado &lt;75</span>
                        <span className="text-amber-500">Dudoso 75–119</span>
                        <span className="text-emerald-500">Aprobado ≥120</span>
                        <span>{maxPuntos}</span>
                    </div>
                </div>

                {/* Resumen por sección */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sectionScores.map((sc, i) => {
                        const sec = MATRIX_SECTIONS[i];
                        const pct = sc.maxPts > 0 ? Math.round((sc.pts / sc.maxPts) * 100) : 0;
                        const clr = sectionColors[sec.color as string];
                        return (
                            <div key={sc.id} className="bg-gray-50 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${clr.dot}`} />
                                    <p className="text-xs text-gray-500 font-semibold truncate">{sec.nombre}</p>
                                </div>
                                <p className="text-sm font-extrabold text-gray-800">{sc.pts}<span className="text-xs font-normal text-gray-400">/{sc.maxPts}</span></p>
                                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-1 rounded-full ${clr.dot} opacity-80`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Secciones de la matriz ── */}
            {MATRIX_SECTIONS.map(section => {
                const clr = sectionColors[section.color as string];
                const secScore = sectionScores.find(s => s.id === section.id)!;
                const completados = section.factores.filter(f => selecciones[f.id]).length;
                return (
                    <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className={`px-5 py-3 bg-gradient-to-r ${clr.header} flex items-center gap-3`}>
                            <span className="text-sm font-bold text-white flex-1">{section.nombre}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${clr.badge}`}>{completados}/{section.factores.length} factores</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/25 text-white`}>{secScore.pts} pts</span>
                        </div>

                        {/* Factores */}
                        <div className="divide-y divide-gray-50">
                            {section.factores.map(factor => {
                                const selectedId = selecciones[factor.id];
                                const selectedOp = selectedId
                                    ? (factor.opciones as readonly { id: string; valor: string; puntos: number }[]).find(o => o.id === selectedId)
                                    : undefined;
                                return (
                                    <div key={factor.id} className="px-4 py-3">
                                        {/* Factor label + earned points */}
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-gray-700">{factor.nombre}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                                                selectedOp ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                                            }`}>
                                                {selectedOp ? `${selectedOp.puntos} pts` : "—"}
                                            </span>
                                        </div>
                                        {/* Options grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                            {(factor.opciones as readonly { id: string; valor: string; puntos: number }[]).map(op => {
                                                const isSelected = selectedId === op.id;
                                                return (
                                                    <button
                                                        key={op.id}
                                                        onClick={() => handleSelect(factor.id, op.id)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all border ${
                                                            isSelected
                                                                ? "bg-blue-50 border-blue-300 text-blue-800 font-semibold"
                                                                : `bg-gray-50 border-gray-100 text-gray-600 ${clr.row} hover:border-gray-200`
                                                        }`}
                                                    >
                                                        <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                                                            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 bg-white text-transparent"
                                                        }`}>✕</span>
                                                        <span className="flex-1 leading-tight">{op.valor}</span>
                                                        <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                                            isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-500"
                                                        }`}>{op.puntos}</span>
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

            {/* ── Resolución final ── */}
            <div className={`rounded-2xl border p-6 ${
                resolucion === "Aprobado" ? "bg-emerald-50 border-emerald-200" :
                resolucion === "Dudoso"   ? "bg-amber-50 border-amber-200" :
                                            "bg-red-50 border-red-200"
            }`}>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        resolucion === "Aprobado" ? "bg-emerald-100" :
                        resolucion === "Dudoso"   ? "bg-amber-100" : "bg-red-100"
                    }`}>
                        {resolucion === "Aprobado" ? "✓" : resolucion === "Dudoso" ? "⚠" : "✕"}
                    </div>
                    <div className="flex-1">
                        <p className={`text-lg font-extrabold ${
                            resolucion === "Aprobado" ? "text-emerald-800" :
                            resolucion === "Dudoso"   ? "text-amber-800" : "text-red-800"
                        }`}>Resolución: {resolucion}</p>
                        <p className={`text-sm mt-0.5 ${
                            resolucion === "Aprobado" ? "text-emerald-700" :
                            resolucion === "Dudoso"   ? "text-amber-700" : "text-red-700"
                        }`}>
                            {resolucion === "Aprobado" && "Ponderación igual o mayor a 120 puntos. El expediente cumple los criterios para aprobación."}
                            {resolucion === "Dudoso"   && "Ponderación entre 75 y 119 puntos. Requiere dictamen con razonamiento adicional para el Comité de Crédito."}
                            {resolucion === "Rechazado" && "Ponderación menor a 75 puntos. El expediente no cumple los criterios mínimos de aprobación."}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-black ${
                            resolucion === "Aprobado" ? "text-emerald-700" :
                            resolucion === "Dudoso"   ? "text-amber-700" : "text-red-700"
                        }`}>{totalPuntos}</p>
                        <p className="text-xs text-gray-500">de {maxPuntos} puntos posibles</p>
                        {seleccionados < totalFactores && (
                            <p className="text-xs text-gray-400 mt-1">({totalFactores - seleccionados} factores sin evaluar)</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Financiamiento ──────────────────────────────────────────────────────
function TabFinanciamiento({ caso }: { caso: Case }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    // Filter by sector and financing type relevant to this case
    const opciones = MOCK_INSTITUCIONES.filter(inst =>
        inst.sector.includes(caso.sector) || inst.tipo === caso.tipoFinanciamiento
    );

    return (
        <div className="space-y-5">
            {/* Disclaimer */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-700">
                    Las opciones mostradas son <strong>recomendaciones basadas en el perfil de {caso.cliente}</strong>. Nexus Pontifex actúa como intermediario. Los montos, plazos y tasas son estimados sujetos a validación.
                </p>
            </div>

            {/* Options table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">{opciones.length} opciones compatibles con el perfil del expediente</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Institución</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto hasta</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasa est.</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Compatibilidad</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {opciones.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">Sin opciones compatibles para el sector y tipo de este expediente.</td></tr>
                            )}
                            {opciones.map(inst => (
                                <React.Fragment key={inst.id}>
                                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}>
                                        <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">{inst.institucion}</td>
                                        <td className="px-5 py-4 text-gray-700">{inst.producto}</td>
                                        <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">{inst.montoMax}</td>
                                        <td className="px-5 py-4 font-semibold text-indigo-600 whitespace-nowrap">{inst.tasa}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${COMPATIBILIDAD_COLORS[inst.compatibilidad]}`}>
                                                <span>{COMPATIBILIDAD_ICONS[inst.compatibilidad]}</span>{inst.compatibilidad}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === inst.id ? "rotate-180" : ""}`} />
                                        </td>
                                    </tr>
                                    {expanded === inst.id && (
                                        <tr className="bg-indigo-50/40">
                                            <td colSpan={6} className="px-7 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Requisitos</p>
                                                        <p className="text-sm text-gray-700">{inst.requisitos}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Plazo estimado</p>
                                                        <p className="text-sm text-gray-700">{inst.plazo}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Observaciones</p>
                                                        <p className="text-sm text-gray-700">{inst.observaciones}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-indigo-500 italic mt-3">⚠ Sujeto a validación por parte de la institución financiera.</p>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Case Detail (tabbed) ─────────────────────────────────────────────────────
const TABS = [
    { id: "resumen", label: "Resumen", icon: User },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "analisis", label: "Análisis", icon: BarChart2 },
    { id: "financiamiento", label: "Financiamiento", icon: Building2 },
];

function CaseDetail({ caso, onBack }: { caso: Case; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState("resumen");

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
                <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" />Casos
                </button>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-sm text-gray-700 font-medium">{caso.cliente}</span>
                <span className="text-sm text-gray-400 font-mono">· {caso.id}</span>
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
            {activeTab === "resumen" && <TabResumen caso={caso} />}
            {activeTab === "documentos" && <TabDocumentos caso={caso} />}
            {activeTab === "analisis" && <TabAnalisis caso={caso} />}
            {activeTab === "financiamiento" && <TabFinanciamiento caso={caso} />}
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
const SITUACION_OPTS = ["Todas", "En curso", "Requiere revisión", "Observado", "Listo para propuesta", "Cerrado"];
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

    if (selectedCase) return <CaseDetail caso={selectedCase} onBack={() => setSelectedCase(null)} />;

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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
                <input type="text" placeholder="Buscar por razón social o ID…" value={search} onChange={e => setSearch(e.target.value)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                <select value={filterSituacion} onChange={e => setFilterSituacion(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {SITUACION_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
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

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Razón social</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ejecutivo</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo de financiamiento</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Etapa actual</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Situación</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Completitud</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alta</th>
                                <th className="px-5 py-3" />
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
                                    <td className="px-5 py-4 font-mono text-xs text-gray-500 font-semibold whitespace-nowrap">{caso.id}</td>
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900 max-w-[180px] truncate">{caso.cliente}</div>
                                        <div className="text-xs text-gray-400">{caso.sector}</div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{caso.ejecutivo}</td>
                                    <td className="px-5 py-4 text-xs text-gray-500 max-w-[130px]">
                                        <div className="truncate">{caso.tipoFinanciamiento}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ETAPA_COLORS[caso.etapaNombre]}`}>
                                            {caso.etapaNombre}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${SITUACION_COLORS[caso.situacion]}`}>
                                            {caso.situacion}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 min-w-[120px]"><CompletitudBar value={caso.completitud} /></td>
                                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{caso.fechaAlta}</td>
                                    <td className="px-5 py-4">
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



