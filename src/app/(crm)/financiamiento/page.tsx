"use client";

import React, { useState } from "react";
import { Building2, Filter, ChevronDown, Info, Star } from "lucide-react";
import { INSTITUCIONES, TIPO_COLORS, type Producto, type TipoInstitucion } from "@/lib/instituciones";

const EXP_LABEL: Record<string, string> = {
    "menor1": "< 1 año",
    "1año": "1 año",
    "2años": "2 años",
};

const TODOS_TIPOS: ("Todos" | TipoInstitucion)[] = ["Todos", "BANCO", "FINANCIERA", "FINTECH", "ARRENDADORA"];
const TODOS_PRODUCTOS: ("Todos" | Producto)[] = ["Todos", "Crédito Simple", "Crédito Revolvente", "Factoraje", "Arrendamiento"];

export default function FinanciamientoPage() {
    const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoInstitucion>("Todos");
    const [filtroProducto, setFiltroProducto] = useState<"Todos" | Producto>("Todos");
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtradas = INSTITUCIONES.filter(inst => {
        const matchTipo = filtroTipo === "Todos" || inst.tipo === filtroTipo;
        const matchProducto = filtroProducto === "Todos" || inst.productos.includes(filtroProducto as Producto);
        return matchTipo && matchProducto;
    });

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Portafolio de instituciones</h1>
                <p className="text-gray-500 mt-1">Partners ORO — instituciones financieras con convenio activo o en proceso</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {TODOS_TIPOS.map(t => (
                        <button key={t} onClick={() => setFiltroTipo(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filtroTipo === t ? "bg-blue-800 text-white border-blue-800" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="w-px h-5 bg-gray-200" />
                <div className="flex gap-1.5 flex-wrap">
                    {TODOS_PRODUCTOS.map(p => (
                        <button key={p} onClick={() => setFiltroProducto(p as "Todos" | Producto)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filtroProducto === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                            {p}
                        </button>
                    ))}
                </div>
                <span className="ml-auto text-xs text-gray-400">{filtradas.length} institución{filtradas.length !== 1 ? "es" : ""}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {filtradas.map(inst => {
                    const isExpanded = expanded === inst.id;
                    return (
                        <div key={inst.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Fila principal */}
                            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpanded(isExpanded ? null : inst.id)}>

                                {/* Ícono */}
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>

                                {/* Nombre + tipo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900">{inst.nombre}</span>
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${TIPO_COLORS[inst.tipo]}`}>{inst.tipo}</span>
                                        {inst.masRentable && (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <Star className="w-3 h-3" />Rentable
                                            </span>
                                        )}
                                        {inst.contrato && (
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Con contrato</span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                        {inst.productos.map(p => (
                                            <span key={p} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{p}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Cobertura + experiencia */}
                                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {inst.cobertura.map(c => (
                                            <span key={c} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">Exp. mín: {EXP_LABEL[inst.experienciaMin]}</span>
                                </div>

                                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>

                            {/* Detalle expandido */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sectores</p>
                                            <div className="flex flex-wrap gap-1">
                                                {inst.sectores.map(s => (
                                                    <span key={s} className="text-xs bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Buró aceptado</p>
                                            <div className="flex flex-wrap gap-1">
                                                {inst.buroAceptado.map(b => (
                                                    <span key={b} className="text-xs bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-blue-700">{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Garantías</p>
                                            <div className="flex flex-wrap gap-1">
                                                {inst.garantias.map(g => (
                                                    <span key={g} className="text-xs bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-purple-700">{g}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Solvencia aceptada</p>
                                            <div className="flex flex-wrap gap-1">
                                                {inst.solvenciaAceptada.map(s => (
                                                    <span key={s} className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${s === "Utilidad" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : s === "Pérdida" ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-red-50 border-red-100 text-red-700"}`}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 italic mt-4">Sujeto a validación por parte de la institución financiera.</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtradas.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 text-sm">
                        No hay instituciones con los filtros seleccionados.
                    </div>
                )}
            </div>
        </div>
    );
}
