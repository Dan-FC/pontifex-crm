-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente" TEXT NOT NULL,
    "rfc" TEXT NOT NULL DEFAULT '',
    "sector" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "contacto" TEXT NOT NULL DEFAULT '',
    "ejecutivo" TEXT NOT NULL,
    "tipoFinanciamiento" TEXT NOT NULL,
    "montoSolicitado" TEXT NOT NULL DEFAULT '',
    "etapa" INTEGER NOT NULL DEFAULT 1,
    "etapaNombre" TEXT NOT NULL DEFAULT 'Documentación',
    "situacion" TEXT NOT NULL DEFAULT 'En curso',
    "completitud" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT NOT NULL DEFAULT '',
    "alertas" TEXT NOT NULL DEFAULT '[]',
    "fechaAlta" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expedienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Estado de cuenta bancario',
    "estatus" TEXT NOT NULL DEFAULT 'Pendiente',
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingresos" TEXT,
    "egresos" TEXT,
    "movimientos" INTEGER NOT NULL DEFAULT 0,
    "rawTxt" TEXT,
    "archivoPath" TEXT,
    CONSTRAINT "Documento_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompletitudLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expedienteId" TEXT NOT NULL,
    "totalPct" INTEGER NOT NULL,
    "categorias" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompletitudLog_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
