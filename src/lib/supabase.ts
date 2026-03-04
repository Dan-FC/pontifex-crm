import { createClient } from "@supabase/supabase-js";

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
    const storagePath = `${expedienteId}/${docId}/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
            contentType: "application/pdf",
            upsert: true,
        });

    if (error) throw new Error(`Supabase Storage error: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path, size: buffer.length };
}
