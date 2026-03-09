"use client";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            style={{
                position: "fixed", bottom: "24px", right: "24px",
                background: "#1d4ed8", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "10px",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(29,78,216,0.4)",
            }}
            className="no-print"
        >
            Imprimir / Guardar PDF
        </button>
    );
}
