import { createClient } from "@supabase/supabase-js";
import { getCategoriaDeDoc } from "./documentos-requeridos";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key (bypasses RLS)
// Only use on API routes — never expose to the browser.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});

// Bucket name for PDFs
export const STORAGE_BUCKET = "documentos";

/**
 * Upload a PDF buffer to Supabase Storage.
 * Path: {expedienteId}/{docId}/{uuid}_{filename}
 * Returns the public URL.
 */
export async function uploadPDF(
    buffer: Buffer,
    expedienteId: string,
    docId: string,
    filename: string
): Promise<{ url: string; path: string; size: number }> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const categoria = getCategoriaDeDoc(docId);
    // Incluir timestamp para que cada subida sea un archivo único en Storage
    const storagePath = `${expedienteId}/${categoria}/${docId}/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
            contentType: "application/pdf",
            upsert: false,
        });

    if (error) throw new Error(`Supabase Storage error: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path, size: buffer.length };
}

/**
 * Delete a file from Supabase Storage given its public URL.
 */
export async function deletePDF(publicUrl: string): Promise<void> {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return; // URL doesn't match expected format — skip
    const storagePath = decodeURIComponent(publicUrl.slice(idx + marker.length));
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    if (error) console.warn(`Supabase Storage delete warning: ${error.message}`);
}

/**
 * Upload a JSON string to Supabase Storage as a backup of OCR results.
 * Path: {expedienteId}/{docId}/ocr_{timestamp}.json
 */
export async function uploadJSON(
    content: string,
    expedienteId: string,
    docId: string,
): Promise<{ url: string; path: string }> {
    const categoria = getCategoriaDeDoc(docId);
    // Mismo folder que el PDF, archivo OCR resultado
    const storagePath = `${expedienteId}/${categoria}/${docId}/ocr_resultado.json`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from(content, "utf-8"), {
            contentType: "application/json",
            upsert: true,
        });

    if (error) throw new Error(`Supabase Storage (JSON) error: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
}
