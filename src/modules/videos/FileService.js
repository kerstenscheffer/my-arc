// src/modules/videos/FileService.js
//
// Coach-files (PDFs) service. Mirror van VideoService maar dan voor file-assets
// die per pagina toegewezen worden via `default_pages`. Geen per-client
// assignment-tabel — eerste versie houdt het simpel: een file is óf zichtbaar
// op een pagina voor alle clients (via default_pages), óf niet zichtbaar.
//
// Storage: bucket `coach-files` (public read). Upload → public URL → opslag
// in coach_files.file_url.

import DatabaseService from '../../services/DatabaseService'

const { supabase } = DatabaseService

const BUCKET = 'coach-files'

const FILE_SELECT = `
  id, coach_id, title, description,
  file_url, file_type, file_size, storage_path,
  default_pages, is_active, created_at, updated_at
`

class FileService {
  // ── CRUD ──────────────────────────────────────────────────────────────

  async uploadFile(coachId, file, meta = {}) {
    if (!coachId) throw new Error('coachId is required')
    if (!file) throw new Error('file is required')

    const ext = (file.name?.split('.').pop() || 'pdf').toLowerCase()
    const safeName = (meta.title || file.name || 'file')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const storagePath = `${coachId}/${Date.now()}-${safeName}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      })
    if (upErr) throw upErr

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const fileUrl = urlData.publicUrl

    const { data, error } = await supabase
      .from('coach_files')
      .insert([{
        coach_id: coachId,
        title: meta.title || file.name || 'Bestand',
        description: meta.description || null,
        file_url: fileUrl,
        file_type: ext === 'pdf' ? 'pdf' : ext,
        file_size: file.size || null,
        storage_path: storagePath,
        default_pages: meta.default_pages || [],
        is_active: true,
      }])
      .select(FILE_SELECT)
      .single()
    if (error) throw error
    return data
  }

  async updateFile(fileId, updates) {
    const next = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('coach_files')
      .update(next)
      .eq('id', fileId)
      .select(FILE_SELECT)
      .single()
    if (error) throw error
    return data
  }

  async deleteFile(fileId) {
    // Storage-object opruimen vóór de DB-rij verdwijnt zodat we het pad nog
    // hebben.
    const { data: row } = await supabase
      .from('coach_files')
      .select('storage_path')
      .eq('id', fileId)
      .single()
    if (row?.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path])
    }
    const { error } = await supabase.from('coach_files').delete().eq('id', fileId)
    if (error) throw error
    return true
  }

  // ── Listing ──────────────────────────────────────────────────────────

  async listForCoach(coachId) {
    const { data, error } = await supabase
      .from('coach_files')
      .select(FILE_SELECT)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async listForPage(pageContext) {
    // Alle actieve files die deze page in hun default_pages-array hebben.
    // Voor het MVP: alle coaches; later kunnen we per-client filtering toevoegen.
    const { data, error } = await supabase
      .from('coach_files')
      .select(FILE_SELECT)
      .contains('default_pages', [pageContext])
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
}

const fileService = new FileService()
export default fileService
