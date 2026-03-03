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
function TabResumen({ caso }: { caso: Case }) {
    return (
        <div className="space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h2 className="text-xl font-extrabold text-gray-900">{caso.cliente}</h2>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full font-mono">{caso.id}</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${SITUACION_COLORS[caso.situacion]}`}>{caso.situacion}</span>
                        </div>
                        <p className="text-sm text-gray-400">RFC: {caso.rfc} · Alta: {caso.fechaAlta} · Últ. actualización: {caso.ultimaActualizacion}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Monto solicitado</p>
                        <p className="text-2xl font-extrabold text-indigo-600">{caso.montoSolicitado}</p>
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

            {/* Info + Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Información del expediente</p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { l: "Ejecutivo", v: caso.ejecutivo },
                            { l: "Sector", v: caso.sector },
                            { l: "Correo", v: caso.email },
                            { l: "Teléfono", v: caso.telefono },
                            { l: "Etapa actual", v: caso.etapaNombre },
                        ].map(({ l, v }) => (
                            <div key={l}>
                                <p className="text-xs text-gray-400">{l}</p>
                                <p className="text-sm font-semibold text-gray-800">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {(() => {
                    // alertas may be a JSON string (from DB) or array (mock)
                    let alertasList: string[] = [];
                    try {
                        alertasList = Array.isArray(caso.alertas)
                            ? caso.alertas
                            : JSON.parse(caso.alertas || "[]");
                    } catch { alertasList = []; }

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
                    )
                })()}
            </div>
        </div>
    );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────
function TabDocumentos({ caso }: { caso: Case }) {
    const [showOCR, setShowOCR] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [result, setResult] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [año, setAño] = useState(2020);
    const [mes, setMes] = useState("Enero");
    const [excelStatus, setExcelStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [excelResult, setExcelResult] = useState<any>(null);
    const [excelError, setExcelError] = useState("");

    const docsCaso = MOCK_DOCUMENTOS.filter(d => d.casoId === caso.id);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.type !== "application/pdf") { setErrorMessage("Solo archivos PDF."); setStatus("error"); return; }
        setFile(f); setStatus("idle"); setResult(null); setExcelStatus("idle"); setExcelResult(null); setErrorMessage("");
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        const formData = new FormData();
        formData.append("pdf", file);
        try {
            const res = await fetch("/api/process-pdf", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al procesar");
            setResult(data); setStatus("success");
        } catch (err: any) { setStatus("error"); setErrorMessage(err.message || "Error"); }
    };

    const handleGenerateExcel = async () => {
        const sa = result?.data?.saldo_anterior;
        const sf = result?.data?.saldo_final;
        if (!sa || sa === "No detectado" || !sf || sf === "No detectado") {
            setExcelError("No se detectaron saldos en el PDF."); setExcelStatus("error"); return;
        }
        setExcelStatus("loading"); setExcelError("");
        try {
            const res = await fetch("/api/generate-excel", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: caso.id, año, mes, saldoAnterior: sa, saldoFinal: sf }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            setExcelResult(data); setExcelStatus("done");
        } catch (err: any) { setExcelError(err.message); setExcelStatus("error"); }
    };

    return (
        <div className="space-y-5">
            {/* Document list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Documentos del expediente</p>
                    <button onClick={() => setShowOCR(!showOCR)}
                        className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all">
                        <UploadCloud className="w-3.5 h-3.5" />Procesar nuevo PDF
                    </button>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Documento</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estatus</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {docsCaso.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No hay documentos registrados para este expediente.</td></tr>
                        )}
                        {docsCaso.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                        <span className="text-xs font-medium text-gray-700">{doc.nombre}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">{doc.tipo}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DOC_ESTATUS_COLORS[doc.estatus]}`}>{doc.estatus}</span>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-400">{doc.fecha ?? "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* OCR Panel */}
            {showOCR && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Procesamiento OCR — <span className="text-blue-600">{caso.id}</span></p>
                        <button onClick={() => setShowOCR(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all relative cursor-pointer">
                        <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <UploadCloud className="w-8 h-8 text-blue-400 mb-2" />
                        <p className="text-sm text-gray-600"><span className="font-semibold text-blue-600">Haz clic para subir</span> o arrastra el PDF</p>
                    </div>

                    {file && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMessage}
                        </div>
                    )}

                    <button onClick={handleUpload} disabled={!file || status === "uploading"}
                        className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all">
                        {status === "uploading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando…</> : "Procesar estado de cuenta"}
                    </button>

                    {status === "success" && result && (
                        <div className="space-y-4">
                            {/* Datos extraídos — light style */}
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-emerald-700">Extracción exitosa — {file?.name}</span>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {[
                                            { label: "Saldo Anterior", value: result.data.saldo_anterior, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                            { label: "Saldo Final", value: result.data.saldo_final, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                                            { label: "Ingresos Tot.", value: result.data.ingresos_totales, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                                            { label: "Egresos Tot.", value: result.data.egresos_totales, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                                        ].map(({ label, value, color, bg, border }) => (
                                            <div key={label} className={`${bg} border ${border} rounded-xl p-3`}>
                                                <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                                                <p className={`text-base font-extrabold ${color}`}>
                                                    {value !== "No detectado" ? `$${value}` : <span className="text-gray-400 font-normal text-sm">No detectado</span>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!result.txtContent) return;
                                            const blob = new Blob([result.txtContent], { type: "text/plain" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a"); a.href = url;
                                            a.download = result.txtFilename || `reporte_${caso.id}.txt`;
                                            document.body.appendChild(a); a.click();
                                            document.body.removeChild(a); URL.revokeObjectURL(url);
                                        }}
                                        className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-all"
                                    >
                                        <Download className="w-4 h-4" />Descargar TXT
                                    </button>
                                </div>
                            </div>

                            {/* Exportar a Excel */}
                            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Table2 className="w-4 h-4 text-green-600" />Exportar a Excel (CUENTAS.xlsx)
                                </p>
                                <p className="text-xs text-gray-400 mb-1">
                                    Selecciona el año y mes para escribir los datos en la fila correcta de la hoja.
                                </p>
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                                    ⚠ El template actual contiene el año <strong>2020</strong>. Selecciona el año y mes que correspondan a las filas del archivo CUENTAS.xlsx.
                                </p>
                                <div className="flex flex-wrap gap-3 items-end">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Año</label>
                                        <select value={año} onChange={e => setAño(Number(e.target.value))}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                                            {AÑOS.map(y => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mes</label>
                                        <select value={mes} onChange={e => setMes(e.target.value)}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                                            {MESES.map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleGenerateExcel} disabled={excelStatus === "loading"}
                                        className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all">
                                        {excelStatus === "loading"
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</>
                                            : <><Table2 className="w-3.5 h-3.5" />Generar Excel</>}
                                    </button>
                                </div>
                                {excelStatus === "error" && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-2 text-xs">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{excelError}
                                    </div>
                                )}
                                {excelStatus === "done" && excelResult && (
                                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                                            <CheckCircle2 className="w-4 h-4" />Excel generado correctamente
                                        </div>
                                        <div className="text-xs text-green-700 bg-green-100/70 rounded-lg px-3 py-2">
                                            Ingresos → celda <code className="bg-white px-1 rounded font-mono">{excelResult.cellD}</code>
                                            &nbsp;·&nbsp;
                                            Egresos → celda <code className="bg-white px-1 rounded font-mono">{excelResult.cellE}</code>
                                        </div>
                                        <button onClick={() => window.location.href = `/api/generate-excel?file=${encodeURIComponent(excelResult.filename)}`}
                                            className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all">
                                            <Download className="w-4 h-4" />Descargar Excel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ─── Tab: Análisis ────────────────────────────────────────────────────────────
function TabAnalisis({ caso }: { caso: Case }) {
    const [showTxt, setShowTxt] = useState(false);
    const [año, setAño] = useState(2025);
    const [mes, setMes] = useState("Enero");
    const [excelStatus, setExcelStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [excelResult, setExcelResult] = useState<any>(null);
    const [excelError, setExcelError] = useState("");

    const df = caso.datosFinancieros;

    const handleExcel = async () => {
        if (!df) return;
        setExcelStatus("loading"); setExcelError("");
        try {
            const res = await fetch("/api/generate-excel", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: caso.id, año, mes, saldoAnterior: df.ingresos, saldoFinal: df.egresos }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            setExcelResult(data); setExcelStatus("done");
        } catch (err: any) { setExcelError(err.message); setExcelStatus("error"); }
    };

    if (!df) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <BarChart2 className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">Sin datos de análisis disponibles</p>
                <p className="text-gray-400 text-sm mt-1">Za procesado el OCR para comenzar el análisis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Data cards — Ingresos y Egresos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: "Ingresos (Depósitos)", value: df.ingresos, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Egresos (Retiros)", value: df.egresos, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{label}</p>
                        <p className={`text-2xl font-extrabold ${color}`}>
                            {value && value !== "No detectado" ? `$${value}` : <span className="text-gray-400 font-normal text-base">No detectado</span>}
                        </p>
                    </div>
                ))}
            </div>

            {/* Meta info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Información del periodo analizado</p>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { l: "Período detectado", v: df.periodo },
                        { l: "Movimientos", v: `${df.movimientos} transacciones` },
                        { l: "Estatus de validación", v: caso.situacion },
                    ].map(({ l, v }) => (
                        <div key={l}>
                            <p className="text-xs text-gray-400">{l}</p>
                            <p className="text-sm font-semibold text-gray-800">{v}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Excel export */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-green-600" />Exportar a Excel (CUENTAS.xlsx)
                </p>
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Año</label>
                        <select value={año} onChange={e => setAño(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {AÑOS.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mes</label>
                        <select value={mes} onChange={e => setMes(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {MESES.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={handleExcel} disabled={excelStatus === "loading"}
                        className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all">
                        {excelStatus === "loading" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</> : <><Table2 className="w-3.5 h-3.5" />Generar Excel</>}
                    </button>
                </div>
                {excelStatus === "error" && (
                    <p className="mt-3 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{excelError}</p>
                )}
                {excelStatus === "done" && excelResult && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4" />Excel generado correctamente
                        </div>
                        <button onClick={() => window.location.href = `/api/generate-excel?file=${encodeURIComponent(excelResult.filename)}`}
                            className="flex items-center gap-2 py-1.5 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all">
                            <Download className="w-3.5 h-3.5" />Descargar
                        </button>
                    </div>
                )}
            </div>

            {/* Collapsible raw TXT */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setShowTxt(!showTxt)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <span className="flex items-center gap-2"><Info className="w-4 h-4" />Ver salida técnica (TXT crudo del OCR)</span>
                    {showTxt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTxt && (
                    <div className="px-5 pb-5">
                        <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 overflow-auto max-h-48 font-mono leading-relaxed">
                            {`--- Reporte OCR generado por Nexus Pontifex ---
Caso: ${caso.id}
Cliente: ${caso.cliente}
Período: ${df.periodo}

Saldo Anterior: $${df.saldoAnterior}
Saldo Final: $${df.saldoFinal}
Ingresos Totales: $${df.ingresos}
Egresos Totales: $${df.egresos}
Total movimientos: ${df.movimientos}

--- Fin del reporte ---`}
                        </pre>
                    </div>
                )}
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
        cliente: "", contacto: "", email: "", telefono: "",
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



