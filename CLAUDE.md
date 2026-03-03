# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint

# Prisma (Prisma 7 with SQLite)
npx prisma migrate dev --name <migration_name>   # Create and apply migration
npx prisma generate                              # Regenerate Prisma client after schema change
npx prisma studio                                # Open Prisma GUI
node prisma/seed.js                              # Seed the database
```

## Architecture

This is a **Next.js 16 App Router** CRM called "Nexus Pontifex" for managing financing applications (expedientes) at a Mexican financial brokerage firm. All UI text is in Spanish.

### Route Structure

The CRM lives under `src/app/(crm)/` with a shared `layout.tsx` that wraps all pages with `<Sidebar>` and `<Topbar>`. The root `src/app/page.tsx` serves as a login landing page. Key routes:

- `/panel` — Dashboard with KPI charts (static mock data from `lib/mock-data.ts`)
- `/casos` — Main case management: list, create, view, and process expedientes. This is the largest page and pulls live data from the API.
- `/financiamiento` — Read-only view of financing institution options (static mock data)
- `/documentos` and `/upload` — Both redirect to `/casos`

### API Routes (`src/app/api/`)

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/expedientes` | GET, POST | List/create expedientes (Prisma + SQLite) |
| `/api/expedientes/[id]` | GET, PATCH | Read/update a single expediente, recalculates completitud |
| `/api/process-pdf` | POST | Upload PDF → extract text → parse bank statement → save to `storage/` as `.txt` |
| `/api/generate-excel` | POST, GET | Fill `template/CUENTAS.xlsx` with saldo data → save to `exports/` for download |

### Database (Prisma 7 + better-sqlite3)

- DB file: `pontifex.db` (root of repo; also a copy at `prisma/pontifex.db`)
- **Prisma 7 requires** `prisma.config.ts` for the datasource URL (not in `schema.prisma`)
- The Prisma client uses the `@prisma/adapter-better-sqlite3` driver adapter; it must **not** be bundled by webpack — configured in `next.config.ts` via `serverExternalPackages`
- Singleton pattern in `src/lib/prisma.ts` prevents multiple client instances during hot reload

Three models: `Expediente` (the financing case), `Documento` (uploaded bank statements linked to an expediente), and `CompletitudLog` (audit log of completeness scores).

### Completitud (Completeness Scoring) — `src/lib/completitud.ts`

The core business logic. Every time an expediente is created or updated via the API, `calcularCompletitud()` runs and returns a weighted score (0–100%) across 6 categories:

1. Datos generales (20%) — cliente, RFC, sector
2. Contacto principal (10%) — contacto, email, telefono, ejecutivo
3. Solicitud financiera (20%) — tipoFinanciamiento, montoSolicitado
4. Documentación obligatoria (25%) — documents with `estatus === "Procesado"`
5. Análisis financiero (15%) — OCR-detected ingresos/egresos on linked documents
6. Validación fiscal/legal (10%) — RFC length ≥ 12, no active alertas

The result is persisted to `Expediente.completitud` and logged in `CompletitudLog`.

### PDF Processing Pipeline — `src/lib/pdf-parser.ts`

1. `extractTextFromPDF()` — uses `pdf-parse` to extract raw text from buffer
2. `parseBankStatementData()` — 3-layer extraction:
   - **Layer 1**: regex for explicit totals (e.g. "Total Depósitos: $X")
   - **Layer 2**: regex to find individual transactions (date + description + amount), classified via keyword lists as ingreso/egreso
   - **Layer 3**: fallback sum of detected movements
3. `generateTxtReport()` — formats a `.txt` summary saved to `storage/`

### Excel Template Population — `src/lib/excel-populate.ts`

Takes `template/CUENTAS.xlsx` (never overwritten), finds the row matching a given year and month in columns B and C (handles merged cells via carry-forward logic), writes `saldoAnterior → D` and `saldoFinal → E`, and saves the output to `exports/CUENTAS_{caseId}_{date}.xlsx`.

### Static Mock Data — `src/lib/mock-data.ts`

Contains `ETAPAS_PROCESO` (the 6-stage pipeline), `SITUACION_COLORS`, `ETAPA_COLORS`, `DOC_ESTATUS_COLORS`, `COMPATIBILIDAD_COLORS`, `MOCK_INSTITUCIONES` (7 financing institutions), and dashboard KPI/chart data. The `/panel` and `/financiamiento` pages are entirely static and use this file; `/casos` uses the live API but imports color maps and stage definitions from here.

### Key Dependencies

- **tesseract.js** — imported but not yet actively used; OCR fallback is intended for scanned PDFs
- **exceljs** — used in `lib/excel-export.ts` (Phase 2 placeholder, not wired into any active API route)
- **xlsx-populate** — used in `lib/excel-populate.ts` (active, for template-preserving Excel writes)
- **recharts** — charting library used on `/panel`
