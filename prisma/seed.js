/**
 * Seed script — usa better-sqlite3 directamente
 * pontifex.db está en la raíz del proyecto (no en prisma/)
 */
const path = require("path");
const D = require("better-sqlite3");
const db = new D(path.resolve(__dirname, "..", "pontifex.db"));

const now = new Date().toISOString();
let counter = 1;
function uid() { return `seed${Date.now()}${counter++}`; }

const cases = [
    {
        id: uid(), cliente: "Constructora Noreste S.A. de C.V.", rfc: "CNO850312HT5",
        sector: "Construccion", email: "finanzas@constructoranoreste.mx",
        telefono: "662 210 4455", contacto: "Ing. Marco Salazar", ejecutivo: "Ana Valdes",
        tipoFinanciamiento: "Credito hipotecario empresarial", montoSolicitado: "$8,500,000",
        etapa: 3, etapaNombre: "Validacion", situacion: "En curso", completitud: 65,
        observaciones: "El cliente tiene 3 propiedades como garantia.",
        alertas: JSON.stringify(["El cliente tiene 3 propiedades como garantia."]),
    },
    {
        id: uid(), cliente: "Agroindustrias del Noroeste S.P.R.", rfc: "ANO920701SB2",
        sector: "Agroindustria", email: "direccion@agroindustrias.com.mx",
        telefono: "662 318 7700", contacto: "Lic. Patricia Fuentes", ejecutivo: "Carlos Ruiz",
        tipoFinanciamiento: "Credito simple", montoSolicitado: "$12,000,000",
        etapa: 4, etapaNombre: "Perfil financiero", situacion: "Listo para propuesta", completitud: 78,
        observaciones: "", alertas: "[]",
    },
    {
        id: uid(), cliente: "Logistica Rapida del Pacifico", rfc: "LRP010523AA1",
        sector: "Logistica", email: "contabilidad@lrplogistica.mx",
        telefono: "662 540 9001", contacto: "C.P. Eduardo Medina", ejecutivo: "Laura Mendez",
        tipoFinanciamiento: "Arrendamiento financiero", montoSolicitado: "$3,200,000",
        etapa: 2, etapaNombre: "Analisis documental", situacion: "Requiere revision", completitud: 40,
        observaciones: "Faltan 2 estados de cuenta. Solicitar al cliente.",
        alertas: JSON.stringify(["Faltan 2 estados de cuenta. Solicitar al cliente."]),
    },
    {
        id: uid(), cliente: "Salud Integral Sonora S.C.", rfc: "SIS150830JM9",
        sector: "Salud", email: "admin@saludintegralson.mx",
        telefono: "622 415 3300", contacto: "Dr. Alejandro Rios", ejecutivo: "Roberto Gil",
        tipoFinanciamiento: "Linea de credito revolvente", montoSolicitado: "$5,000,000",
        etapa: 5, etapaNombre: "Opciones de financiamiento", situacion: "En curso", completitud: 55,
        observaciones: "", alertas: "[]",
    },
    {
        id: uid(), cliente: "Energia Limpia Hermosillo S.A.", rfc: "ELH200115PR4",
        sector: "Energia", email: "proyectos@energialimpia.mx",
        telefono: "662 290 8800", contacto: "Ing. Gabriela Torres", ejecutivo: "Ana Valdes",
        tipoFinanciamiento: "Credito verde sostenible", montoSolicitado: "$20,000,000",
        etapa: 6, etapaNombre: "Propuesta", situacion: "Listo para propuesta", completitud: 85,
        observaciones: "", alertas: "[]",
    },
];

const sql = `INSERT OR IGNORE INTO Expediente
    (id,cliente,rfc,sector,email,telefono,contacto,ejecutivo,
     tipoFinanciamiento,montoSolicitado,etapa,etapaNombre,situacion,
     completitud,observaciones,alertas,fechaAlta,ultimaActualizacion)
    VALUES
    (@id,@cliente,@rfc,@sector,@email,@telefono,@contacto,@ejecutivo,
     @tipoFinanciamiento,@montoSolicitado,@etapa,@etapaNombre,@situacion,
     @completitud,@observaciones,@alertas,@fechaAlta,@ultimaActualizacion)`;

const stmt = db.prepare(sql);

console.log("Insertando datos...");
for (const c of cases) {
    stmt.run({ ...c, fechaAlta: now, ultimaActualizacion: now });
    console.log("  + " + c.cliente);
}
db.close();
console.log("Seed OK — 5 expedientes insertados en pontifex.db");
