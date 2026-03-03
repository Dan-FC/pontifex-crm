"use client";

export default function Topbar() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 flex-shrink-0">
            <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">demo@pontifex.com</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Ejecutivo</div>
            </div>
        </header>
    );
}
