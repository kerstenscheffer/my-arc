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
  default_pages, is_active, created_at, updated_at,
  thumb_url
`

// Eerste pagina van een PDF als afbeelding.
//
// Een klant zag alleen een rood icoontje en een bestandsnaam; deel je
// dezelfde gids via WhatsApp, dan staat er wél een voorbeeld bij. Dit maakt
// datzelfde voorbeeld: pagina 1 renderen naar een canvas en als PNG naast het
// bestand bewaren.
//
// pdf.js wordt pas geladen op het moment dat er echt iets te renderen valt.
// Het is ruim een megabyte; die hoort niet in de bundel van een klant die
// alleen zijn maaltijden bekijkt.
async function eerstePaginaAlsAfbeelding(bron, breedte = 600) {
  const pdfjs = await import('pdfjs-dist')
  // De worker uit hetzelfde pakket, via Vite's ?url zodat hij mee wordt
  // gebundeld in plaats van van een CDN te komen (die is geblokkeerd).
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = bron instanceof Blob ? await bron.arrayBuffer() : bron
  // De laadtaak apart houden: opruimen gaat via taak.destroy(). Het document
  // zelf heeft geen destroy — dat kostte me een stille mislukking, want de
  // TypeError viel in de catch en elk bestand bleef zonder voorbeeld achter.
  const taak = pdfjs.getDocument({ data })
  const pdf = await taak.promise
  const pagina = await pdf.getPage(1)

  const basis = pagina.getViewport({ scale: 1 })
  const viewport = pagina.getViewport({ scale: breedte / basis.width })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.72))
  // Opruimen: zonder dit blijft de worker draaien na het uploaden.
  await taak.destroy()
  return blob
}

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

    // Voorbeeld erbij. Mislukt dat — een PDF met een raar font, een bestand
    // dat geen PDF blijkt — dan gaat de upload gewoon door zonder. Een gids
    // zonder voorbeeldplaatje is te gebruiken; een upload die klapt op een
    // plaatje niet.
    let thumbUrl = null
    if (ext === 'pdf') {
      thumbUrl = await this._maakEnUploadVoorbeeld(file, storagePath)
    }

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
        thumb_url: thumbUrl,
      }])
      .select(FILE_SELECT)
      .single()
    if (error) throw error
    return data
  }

  // Voorbeeld maken en naast het bestand zetten. Geeft de URL terug, of null
  // als het niet lukte — de aanroeper mag daar gewoon mee doorgaan.
  async _maakEnUploadVoorbeeld(bron, storagePath) {
    try {
      const blob = await eerstePaginaAlsAfbeelding(bron)
      if (!blob) return null
      // Zelfde pad met .jpg erachter: zo hoort het voorbeeld zichtbaar bij het
      // bestand en ruimt deleteFile straks allebei op.
      const thumbPath = `${storagePath}.jpg`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(thumbPath, blob, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error
      return supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl
    } catch (e) {
      console.warn('Voorbeeld maken mislukt, bestand blijft zonder:', e?.message || e)
      return null
    }
  }

  // Voorbeeld alsnog maken voor een bestand dat er nog geen heeft. Voor de
  // bestanden die er al stonden voordat dit bestond.
  async maakVoorbeeldAchteraf(fileRow) {
    if (!fileRow?.id || !fileRow?.file_url || !fileRow?.storage_path) return null
    if (fileRow.thumb_url) return fileRow.thumb_url
    if ((fileRow.file_type || '').toLowerCase() !== 'pdf') return null
    try {
      const resp = await fetch(fileRow.file_url)
      if (!resp.ok) throw new Error(`ophalen mislukt (${resp.status})`)
      const blob = await resp.blob()
      const thumbUrl = await this._maakEnUploadVoorbeeld(blob, fileRow.storage_path)
      if (!thumbUrl) return null
      await this.updateFile(fileRow.id, { thumb_url: thumbUrl })
      return thumbUrl
    } catch (e) {
      console.warn('Voorbeeld achteraf mislukt:', e?.message || e)
      return null
    }
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
      // Het voorbeeld staat op hetzelfde pad met .jpg erachter; die hoort mee
      // weg, anders blijft er een wees in de bucket achter bij elk verwijderd
      // bestand.
      await supabase.storage.from(BUCKET).remove([row.storage_path, `${row.storage_path}.jpg`])
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
