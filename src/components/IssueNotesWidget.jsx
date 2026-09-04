// Floating side-tab in CoachHub for jotting down app issues. Writes to the
// `app_issues` Supabase table so the list is available across devices and
// can be queried by Claude from any session ("check probleem tabellen").

import { useState, useEffect, useRef } from 'react'
import { Bug, X, Check, Trash2, Plus, BookmarkPlus, Bookmark, Pencil, MessageSquare, Send, Undo2, ImagePlus } from 'lucide-react'

// Publieke bucket voor issue-screenshots. Zelfde patroon als de andere
// coach-uploads (MealGuideManager, CardGeneratorTab).
const SCREENSHOT_BUCKET = 'coach-photos'

// Filter-modi voor de widget:
//   open       = actieve klussen (excl. parked en done) — wat de auto-fixer pakt
//   parked     = bewust geparkeerd, "later zelf oppakken"
//   done       = afgewerkt
//   updates    = per-run samenvattingen van Claude (claude_run_summaries tabel)
//   deleted    = soft-deleted (deleted_at IS NOT NULL) — herstelbaar
const FILTERS = [
  { id: 'open',    label: 'Open' },
  { id: 'parked',  label: 'Geparkeerd' },
  { id: 'done',    label: 'Klaar' },
  { id: 'updates', label: 'Updates' },
  { id: 'deleted', label: 'Verwijderd' },
]

export default function IssueNotesWidget({ db, coachId, open: openProp, onOpenChange, onCountChange, onClaudePendingChange }) {
  // Controlled mode (sidebar bestuurt 'open') vs uncontrolled (eigen tab).
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [openInternal, setOpenInternal] = useState(false)
  const open = controlled ? openProp : openInternal
  const setOpen = (val) => {
    const next = typeof val === 'function' ? val(open) : val
    if (controlled) onOpenChange(next); else setOpenInternal(next)
  }
  const [issues, setIssues] = useState([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  // Inline edit-state: één id tegelijk, draft tekst los van issue.text
  // zodat Annuleer zonder gevolgen kan.
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  // Conversation thread per issue — één tegelijk uitgeklapt. `replyDraft`
  // houdt de nog-niet-verstuurde tekst per issue.
  const [threadExpandedId, setThreadExpandedId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  // Run-samenvattingen van Claude (claude_run_summaries tabel) — alleen
  // geladen wanneer de Updates-tab actief is.
  const [summaries, setSummaries] = useState([])
  // Diagnostic feedback voor add-pad — anders faalde insert silently bij
  // verlopen sessie of RLS-deny en zat je in de mist.
  const [addError, setAddError] = useState(null)
  const [addedFlash, setAddedFlash] = useState(false)
  // Screenshots die bij een nieuwe issue worden meegestuurd (URLs). Worden
  // meteen geüpload naar storage; bij Toevoegen gaan ze mee in `images`.
  const [pendingImages, setPendingImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  // Fullscreen-lightbox voor het bekijken van een screenshot.
  const [lightbox, setLightbox] = useState(null)

  const load = async () => {
    if (!db?.supabase || !coachId) return
    setLoading(true)
    // We laden ALLES (incl. deleted) zodat de Verwijderd-tab werkt en
    // optimistic updates lokaal blijven kloppen. Filtering gebeurt in
    // `visible`.
    const { data, error } = await db.supabase
      .from('app_issues')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
    if (error) console.error('load app_issues failed:', error)
    setIssues(data || [])
    setLoading(false)
  }

  const loadSummaries = async () => {
    if (!db?.supabase || !coachId) return
    const { data, error } = await db.supabase
      .from('claude_run_summaries')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error('load claude_run_summaries failed:', error)
    setSummaries(data || [])
  }

  // Laad bij openen, óf bij mount in controlled-mode zodat de sidebar
  // direct de juiste badge-count toont (anders blijft 't 0 tot de gebruiker
  // de paneel opent).
  useEffect(() => { if (open || controlled) load() }, [open, coachId, controlled])

  // Updates-tab triggert een aparte fetch.
  useEffect(() => { if (filter === 'updates' && open) loadSummaries() }, [filter, open, coachId])

  // Open = actief (status=open EN niet geparkeerd EN niet deleted). De badge
  // op de zij-tab én de "X open" tekst rekenen alleen die echt-open issues.
  const openCount = issues.filter(i => i.status === 'open' && !i.parked && !i.deleted_at).length
  // Issues waar Claude als laatste een bericht heeft achtergelaten — die
  // wachten op antwoord van de coach. Dit krijgt een gouden badge op de
  // zij-tab + counter naast "open".
  const claudePendingCount = issues.filter(i => {
    if (i.status !== 'open' || i.deleted_at) return false
    const msgs = Array.isArray(i.messages) ? i.messages : []
    if (msgs.length === 0) return false
    return msgs[msgs.length - 1]?.role === 'claude'
  }).length

  // Geef de live count door aan een externe sidebar zodat die zijn badge
  // kan updaten zonder zelf te queryen.
  useEffect(() => { if (typeof onCountChange === 'function') onCountChange(openCount) }, [openCount, onCountChange])
  useEffect(() => {
    if (typeof onClaudePendingChange === 'function') onClaudePendingChange(claudePendingCount)
  }, [claudePendingCount, onClaudePendingChange])
  const parkedCount = issues.filter(i => i.parked && i.status === 'open' && !i.deleted_at).length
  const deletedCount = issues.filter(i => !!i.deleted_at).length

  // In-app confirm voor delete — vervangt de te-makkelijk-weg-te-klikken
  // browser-prompt. Eén issue tegelijk in de queue.
  const [confirmDeleteIssue, setConfirmDeleteIssue] = useState(null)

  // Upload één of meer afbeeldingen naar storage en voeg de publieke URLs toe
  // aan pendingImages. Gebruikt door de bestand-kiezer én door plakken (paste).
  const uploadFiles = async (files) => {
    const imgs = Array.from(files || []).filter(f => f.type?.startsWith('image/'))
    if (imgs.length === 0) return
    if (!coachId) { setAddError('Niet ingelogd — log opnieuw in en probeer dan opnieuw'); return }
    setUploading(true)
    setAddError(null)
    try {
      const urls = []
      for (const file of imgs) {
        const ext = (file.name?.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
        const path = `app-issues/${coachId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
        const { error } = await db.supabase.storage.from(SCREENSHOT_BUCKET).upload(path, file, { upsert: true, contentType: file.type || 'image/png' })
        if (error) { console.error('screenshot upload failed:', error); setAddError(`Upload mislukt: ${error.message || 'onbekende fout'}`); continue }
        const { data: u } = db.supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(path)
        if (u?.publicUrl) urls.push(u.publicUrl)
      }
      if (urls.length) setPendingImages(prev => [...prev, ...urls])
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files = []
    for (const it of items) {
      if (it.type?.startsWith('image/')) { const f = it.getAsFile(); if (f) files.push(f) }
    }
    if (files.length) { e.preventDefault(); uploadFiles(files) }
  }

  const removePendingImage = (url) => setPendingImages(prev => prev.filter(u => u !== url))

  const handleAdd = async () => {
    setAddError(null)
    const t = text.trim()
    // Sta een screenshot-only issue toe zolang er tekst OF een beeld is.
    if (!t && pendingImages.length === 0) return
    if (!coachId) {
      setAddError('Niet ingelogd — log opnieuw in en probeer dan opnieuw')
      return
    }
    setAdding(true)
    const { data, error } = await db.supabase
      .from('app_issues')
      .insert({ coach_id: coachId, text: t, images: pendingImages })
      .select()
      .single()
    setAdding(false)
    if (error) {
      console.error('insert app_issue failed:', error)
      setAddError(`Opslaan mislukt: ${error.message || 'onbekende fout'}`)
      return
    }
    setIssues(prev => [data, ...prev])
    setText('')
    setPendingImages([])
    setAddedFlash(true)
    setTimeout(() => setAddedFlash(false), 1500)
  }

  const handleToggle = async (issue) => {
    const next = issue.status === 'open' ? 'done' : 'open'
    const optimistic = { ...issue, status: next, fixed_at: next === 'done' ? new Date().toISOString() : null }
    setIssues(prev => prev.map(i => i.id === issue.id ? optimistic : i))
    const { error } = await db.supabase
      .from('app_issues')
      .update({ status: next, fixed_at: optimistic.fixed_at })
      .eq('id', issue.id)
    if (error) { console.error('toggle app_issue failed:', error); load() }
  }

  // Vraag eerst bevestiging via de in-app modal. De daadwerkelijke
  // soft-delete gebeurt in confirmDelete().
  const handleDelete = (issue) => {
    setConfirmDeleteIssue(issue)
  }
  const confirmDelete = async () => {
    const issue = confirmDeleteIssue
    if (!issue) return
    const stamp = new Date().toISOString()
    // Optimistic update: zet deleted_at zodat'ie uit Open/Geparkeerd/Klaar
    // verdwijnt en in Verwijderd verschijnt.
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, deleted_at: stamp } : i))
    setConfirmDeleteIssue(null)
    const { error } = await db.supabase
      .from('app_issues')
      .update({ deleted_at: stamp })
      .eq('id', issue.id)
    if (error) { console.error('soft-delete app_issue failed:', error); load() }
  }
  const restoreIssue = async (issue) => {
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, deleted_at: null } : i))
    const { error } = await db.supabase
      .from('app_issues')
      .update({ deleted_at: null })
      .eq('id', issue.id)
    if (error) { console.error('restore app_issue failed:', error); load() }
  }
  const purgeIssue = async (issue) => {
    // Hard-delete vanuit Verwijderd-tab. Vraagt nog eens confirm omdat
    // dit ECHT onomkeerbaar is.
    if (!window.confirm('Permanent verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    setIssues(prev => prev.filter(i => i.id !== issue.id))
    const { error } = await db.supabase.from('app_issues').delete().eq('id', issue.id)
    if (error) { console.error('hard-delete app_issue failed:', error); load() }
  }

  const startEdit = (issue) => {
    setEditingId(issue.id)
    setEditDraft(issue.text || '')
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }
  const saveEdit = async (issue) => {
    const t = editDraft.trim()
    if (!t || t === issue.text) { cancelEdit(); return }
    setSavingEdit(true)
    const { error } = await db.supabase
      .from('app_issues')
      .update({ text: t })
      .eq('id', issue.id)
    setSavingEdit(false)
    if (error) { console.error('edit app_issue failed:', error); return }
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, text: t } : i))
    cancelEdit()
  }

  // ── Conversation-thread handlers ──
  const toggleThread = (issue) => {
    setReplyDraft('')
    setThreadExpandedId(id => id === issue.id ? null : issue.id)
  }
  const sendReply = async (issue) => {
    const t = replyDraft.trim()
    if (!t) return
    setSendingReply(true)
    const msg = { role: 'coach', text: t, created_at: new Date().toISOString() }
    const nextMessages = [...(issue.messages || []), msg]
    // Optimistisch update zodat het bericht direct verschijnt.
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, messages: nextMessages } : i))
    setReplyDraft('')
    const { error } = await db.supabase
      .from('app_issues')
      .update({ messages: nextMessages })
      .eq('id', issue.id)
    setSendingReply(false)
    if (error) {
      console.error('send reply failed:', error)
      // Rollback bij fout
      load()
    }
  }

  // Park / unpark — geparkeerde issues blijven in de tabel maar worden
  // door de auto-fixer overgeslagen. Handig voor klussen die prompting
  // nodig hebben.
  const handlePark = async (issue) => {
    const next = !issue.parked
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, parked: next } : i))
    const { error } = await db.supabase
      .from('app_issues')
      .update({ parked: next })
      .eq('id', issue.id)
    if (error) { console.error('park app_issue failed:', error); load() }
  }

  const visible = (() => {
    // Verwijderd-tab toont juist alleen de soft-deleted items.
    if (filter === 'deleted') return issues.filter(i => !!i.deleted_at)
    // Alle andere tabs sluiten deleted uit.
    const live = issues.filter(i => !i.deleted_at)
    if (filter === 'parked') return live.filter(i => i.parked && i.status === 'open')
    if (filter === 'done')   return live.filter(i => i.status === 'done')
    return live.filter(i => i.status === 'open' && !i.parked)
  })()

  return (
    <>
      {/* Side tab — alleen tonen in uncontrolled-mode (zonder sidebar). */}
      {!controlled && !open && (
        <button
          onClick={() => setOpen(true)}
          title="Issues"
          style={{
            position: 'fixed',
            right: 0,
            top: '40%',
            transform: 'translateY(-50%)',
            zIndex: 2147483500,
            width: 40, height: 64,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
            background: 'rgba(239,68,68,0.12)',
            borderTop: '1px solid rgba(239,68,68,0.3)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            borderLeft: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px 0 0 10px',
            color: '#fca5a5',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Bug size={16} />
          {openCount > 0 && (
            <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>{openCount}</span>
          )}
          {/* Gouden badge rechtsboven voor Claude-reacties die op coach
              wachten. Sluit aan op de chat-thread badges binnenin. */}
          {claudePendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6, left: -8,
              minWidth: 20, height: 20, borderRadius: 10,
              background: '#FFD700', color: '#0a0a0a',
              fontSize: '0.7rem', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 5px',
              lineHeight: 1,
              border: '2px solid #0a0a0a',
              boxShadow: '0 2px 6px rgba(255,215,0,0.4)',
            }}>
              {claudePendingCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-out panel met backdrop — tap buiten het paneel sluit 'em.
          Op mobiel is dat essentieel omdat de X-knop te dichtbij andere
          UI staat om te raken. */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 2147483545,
          }}
        />
      )}
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: 'min(380px, 100vw)',
            background: '#0a0a0a',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 2147483550,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.6)',
            // iPhone safe areas — voorkomt dat header onder Dynamic Island
            // valt en X-knop niet meer raakbaar is. Bottom-padding houdt
            // de input boven de home-indicator.
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bug size={16} color="#fca5a5" />
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
                App issues
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 600 }}>
                {openCount} open{parkedCount > 0 ? ` · ${parkedCount} geparkeerd` : ''}
                {claudePendingCount > 0 && (
                  <span style={{ color: '#FFD700', fontWeight: 800, marginLeft: 6 }}>
                    · {claudePendingCount} ↩
                  </span>
                )}
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={iconBtn('rgba(255,255,255,0.4)')}>
              <X size={14} />
            </button>
          </div>

          {/* Filter-tabs — Open / Geparkeerd / Klaar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 0.5rem',
          }}>
            {FILTERS.map(f => {
              const active = filter === f.id
              const count = f.id === 'open'    ? openCount
                          : f.id === 'parked'  ? parkedCount
                          : f.id === 'done'    ? issues.filter(i => i.status === 'done' && !i.deleted_at).length
                          : f.id === 'updates' ? summaries.length
                          : /* deleted */        deletedCount
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.4rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid #fca5a5' : '2px solid transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.7rem',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    marginBottom: -1,
                  }}
                >
                  {f.label}
                  {count > 0 && (
                    <span style={{
                      marginLeft: 6, fontSize: '0.55rem',
                      color: active ? '#fca5a5' : 'rgba(255,255,255,0.3)',
                      fontWeight: 700,
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Add new — verborgen in Updates + Verwijderd tabs. */}
          {filter !== 'updates' && filter !== 'deleted' && (
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleAdd() }
              }}
              placeholder="Wat ging er mis? (⌘+Enter om toe te voegen · plak of voeg een screenshot toe)"
              rows={3}
              style={{
                width: '100%', padding: '0.55rem 0.7rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff',
                fontSize: '0.8rem', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.4,
              }}
            />

            {/* Screenshot-knop + verborgen bestand-input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.72rem', fontWeight: 700,
                  cursor: uploading ? 'default' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <ImagePlus size={13} />
                {uploading ? 'Uploaden…' : 'Screenshot'}
              </button>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                of plak (⌘V) in het tekstveld
              </span>
            </div>

            {/* Preview-thumbnails van de mee te sturen screenshots */}
            {pendingImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {pendingImages.map((url) => (
                  <div key={url} style={{ position: 'relative', width: 56, height: 56 }}>
                    <img
                      src={url} alt="screenshot"
                      onClick={() => setLightbox(url)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                    />
                    <button
                      onClick={() => removePendingImage(url)}
                      title="Verwijderen"
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#ef4444', border: '2px solid #0a0a0a', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                      }}
                    >
                      <X size={9} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={adding || (!text.trim() && pendingImages.length === 0)}
              style={{
                padding: '0.55rem',
                background: addedFlash ? '#10b981' : ((text.trim() || pendingImages.length > 0) ? '#10b981' : 'rgba(255,255,255,0.04)'),
                border: 'none',
                borderRadius: 8,
                color: (text.trim() || pendingImages.length > 0 || addedFlash) ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem', fontWeight: 700,
                cursor: (text.trim() || pendingImages.length > 0) ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                opacity: adding ? 0.5 : 1,
              }}
            >
              {addedFlash ? <Check size={14} /> : <Plus size={14} />}
              {addedFlash ? 'Toegevoegd!' : adding ? 'Toevoegen…' : 'Toevoegen'}
            </button>
            {addError && (
              <div style={{
                padding: '0.5rem 0.7rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6,
                color: '#fca5a5',
                fontSize: '0.7rem', fontWeight: 600,
                lineHeight: 1.4,
              }}>
                {addError}
              </div>
            )}
          </div>
          )}

          {/* List — issues OF summaries afhankelijk van filter */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filter === 'updates' ? (
              summaries.length === 0 ? (
                <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.5 }}>
                  Nog geen run-samenvattingen.<br />
                  Elke keer dat Claude de cron-firing afmaakt, verschijnt hier een korte update.
                </div>
              ) : (
                summaries.map(s => (
                  <div key={s.id} style={{
                    padding: '0.75rem 0.85rem',
                    background: 'rgba(255,215,0,0.04)',
                    border: '1px solid rgba(255,215,0,0.2)',
                    borderRadius: 8,
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 800, color: '#FFD700',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      opacity: 0.85, marginBottom: '0.4rem',
                    }}>
                      {new Date(s.created_at).toLocaleString('nl-NL', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                      {Array.isArray(s.issues_processed) && s.issues_processed.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                          · {s.issues_processed.length} issue{s.issues_processed.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: '#fff',
                      fontWeight: 600,
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {s.summary}
                    </div>
                    {s.prompting_feedback && (
                      <div style={{
                        marginTop: '0.6rem',
                        paddingTop: '0.55rem',
                        borderTop: '1px solid rgba(255,215,0,0.15)',
                      }}>
                        <div style={{
                          fontSize: '0.58rem', fontWeight: 800, color: '#fca5a5',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          marginBottom: '0.3rem',
                        }}>
                          Tip voor je prompts
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'rgba(255,255,255,0.85)',
                          fontStyle: 'italic',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {s.prompting_feedback}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              <>
            {loading && issues.length === 0 && (
              <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                Laden…
              </div>
            )}
            {!loading && visible.length === 0 && (
              <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                {filter === 'open' && 'Geen open issues 🎉'}
                {filter === 'parked' && 'Geen geparkeerde issues.'}
                {filter === 'done' && 'Nog niks afgerond.'}
                {filter === 'deleted' && 'Prullenbak is leeg.'}
              </div>
            )}
            {visible.map(issue => {
              const done = issue.status === 'done'
              const parked = !!issue.parked && !done
              const bg = done   ? 'rgba(16,185,129,0.04)'
                       : parked ? 'rgba(245,158,11,0.06)'
                       :          'rgba(255,255,255,0.02)'
              const bd = done   ? 'rgba(16,185,129,0.12)'
                       : parked ? 'rgba(245,158,11,0.22)'
                       :          'rgba(255,255,255,0.05)'
              const messages = Array.isArray(issue.messages) ? issue.messages : []
              const threadOpen = threadExpandedId === issue.id
              return (
                <div key={issue.id} style={{
                  background: bg,
                  border: `1px solid ${bd}`,
                  borderRadius: 8,
                  marginBottom: '0.375rem',
                  overflow: 'hidden',
                }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                }}>
                  <button
                    onClick={() => handleToggle(issue)}
                    title={done ? 'Heropenen' : 'Markeer als done'}
                    style={{
                      width: 20, height: 20, padding: 0, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#10b981' : 'transparent',
                      border: `1.5px solid ${done ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 4,
                      cursor: 'pointer', marginTop: 1,
                      touchAction: 'manipulation',
                    }}
                  >
                    {done && <Check size={12} color="#000" strokeWidth={3} />}
                  </button>
                  {editingId === issue.id ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); saveEdit(issue) }
                        }}
                        rows={3} autoFocus
                        style={{
                          width: '100%', padding: '0.45rem 0.6rem',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 6, color: '#fff',
                          fontSize: '0.78rem', outline: 'none', resize: 'vertical',
                          fontFamily: 'inherit', lineHeight: 1.4,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          style={{
                            padding: '0.35rem 0.6rem', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                            color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700,
                            cursor: savingEdit ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Annuleer
                        </button>
                        <button
                          onClick={() => saveEdit(issue)}
                          disabled={savingEdit || !editDraft.trim()}
                          style={{
                            padding: '0.35rem 0.7rem',
                            background: editDraft.trim() ? '#10b981' : 'rgba(255,255,255,0.06)',
                            border: 'none', borderRadius: 6,
                            color: editDraft.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                            fontSize: '0.7rem', fontWeight: 800,
                            cursor: (savingEdit || !editDraft.trim()) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {savingEdit ? 'Opslaan…' : 'Opslaan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1,
                      fontSize: '0.78rem',
                      color: done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                      textDecoration: done ? 'line-through' : 'none',
                      lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {parked && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.55rem', fontWeight: 800,
                          color: '#f59e0b',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginRight: 6,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          verticalAlign: 'middle',
                        }}>
                          Geparkeerd
                        </span>
                      )}
                      {issue.text}
                      {/* Meegestuurde screenshots */}
                      {Array.isArray(issue.images) && issue.images.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                          {issue.images.map((url, ii) => (
                            <img
                              key={ii} src={url} alt="screenshot"
                              onClick={(e) => { e.stopPropagation(); setLightbox(url) }}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 4, fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                        {new Date(issue.created_at).toLocaleString('nl-NL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )}
                  {editingId !== issue.id && !done && !issue.deleted_at && (
                    <button
                      onClick={() => startEdit(issue)}
                      title="Bewerken"
                      style={{
                        width: 24, height: 24, padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  {editingId !== issue.id && !done && !issue.deleted_at && (
                    <button
                      onClick={() => handlePark(issue)}
                      title={parked ? 'Terug naar open' : 'Parkeren (later zelf)'}
                      style={{
                        width: 24, height: 24, padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none',
                        color: parked ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      {parked ? <Bookmark size={13} fill="#f59e0b" /> : <BookmarkPlus size={13} />}
                    </button>
                  )}
                  {editingId !== issue.id && !issue.deleted_at && (
                    <button
                      onClick={() => toggleThread(issue)}
                      title={threadOpen ? 'Gesprek sluiten' : 'Gesprek openen'}
                      style={{
                        width: 24, height: 24, padding: 0, flexShrink: 0,
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: threadOpen ? 'rgba(255,215,0,0.12)' : 'transparent',
                        border: 'none', borderRadius: 4,
                        color: messages.length > 0 ? '#FFD700' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageSquare size={13} />
                      {messages.length > 0 && (
                        <span style={{
                          position: 'absolute', top: -3, right: -3,
                          minWidth: 14, height: 14, borderRadius: 7,
                          background: '#FFD700', color: '#0a0a0a',
                          fontSize: '0.55rem', fontWeight: 900,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 3px',
                          lineHeight: 1,
                        }}>
                          {messages.length}
                        </span>
                      )}
                    </button>
                  )}
                  {editingId !== issue.id && !issue.deleted_at && (
                    <button
                      onClick={() => handleDelete(issue)}
                      title="Verwijderen"
                      style={{
                        width: 28, height: 28, padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 6,
                        color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {issue.deleted_at && (
                    <>
                      <button
                        onClick={() => restoreIssue(issue)}
                        title="Herstellen — terug naar Open"
                        style={{
                          padding: '4px 8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: 6,
                          color: '#10b981',
                          fontSize: '0.62rem', fontWeight: 800,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Undo2 size={12} /> Herstel
                      </button>
                      <button
                        onClick={() => purgeIssue(issue)}
                        title="Permanent verwijderen"
                        style={{
                          width: 28, height: 28, padding: 0, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 6,
                          color: 'rgba(239,68,68,0.6)', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>

                {/* ── Conversation-thread paneel (uitklapbaar). Bovenste deel
                    = chronologische berichten, onderste = reply-input. ── */}
                {threadOpen && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '0.55rem 0.75rem 0.65rem',
                    display: 'flex', flexDirection: 'column', gap: '0.4rem',
                  }}>
                    {messages.length === 0 && (
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.4)',
                        fontStyle: 'italic',
                        padding: '0.2rem 0 0.3rem',
                      }}>
                        Nog geen berichten. Vragen / verduidelijking aan Claude komen hier.
                      </div>
                    )}
                    {messages.map((m, i) => {
                      const isCoach = m.role === 'coach'
                      return (
                        <div key={i} style={{
                          alignSelf: isCoach ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          padding: '0.45rem 0.6rem',
                          background: isCoach
                            ? 'rgba(252,165,165,0.12)'
                            : 'rgba(255,215,0,0.1)',
                          border: `1px solid ${isCoach ? 'rgba(252,165,165,0.25)' : 'rgba(255,215,0,0.25)'}`,
                          borderRadius: 8,
                        }}>
                          <div style={{
                            fontSize: '0.55rem', fontWeight: 800,
                            color: isCoach ? '#fca5a5' : '#FFD700',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            marginBottom: 2,
                          }}>
                            {isCoach ? 'Jij' : 'Claude'}
                          </div>
                          <div style={{
                            fontSize: '0.78rem',
                            color: '#fff',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {m.text}
                          </div>
                          <div style={{
                            fontSize: '0.55rem',
                            color: 'rgba(255,255,255,0.3)',
                            marginTop: 3,
                          }}>
                            {new Date(m.created_at).toLocaleString('nl-NL', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 4 }}>
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault(); sendReply(issue)
                          }
                        }}
                        placeholder="Antwoord / extra info…"
                        rows={2}
                        style={{
                          flex: 1, padding: '0.4rem 0.55rem',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, color: '#fff',
                          fontSize: '0.78rem', outline: 'none', resize: 'vertical',
                          fontFamily: 'inherit', lineHeight: 1.4,
                        }}
                      />
                      <button
                        onClick={() => sendReply(issue)}
                        disabled={sendingReply || !replyDraft.trim()}
                        title="Versturen (⌘+Enter)"
                        style={{
                          width: 36, height: 36, padding: 0, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: replyDraft.trim() ? '#FFD700' : 'rgba(255,255,255,0.06)',
                          border: 'none', borderRadius: 6,
                          color: replyDraft.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                          cursor: (sendingReply || !replyDraft.trim()) ? 'not-allowed' : 'pointer',
                          opacity: sendingReply ? 0.5 : 1,
                        }}
                      >
                        <Send size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )
            })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox — screenshot fullscreen bekijken. */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 2147483610,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          }}
        >
          <img src={lightbox} alt="screenshot" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 12,
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* In-app bevestigings-modal voor delete — vervangt browser-confirm
          die op mobiel te makkelijk per ongeluk werd weggetikt. */}
      {confirmDeleteIssue && (
        <div
          onClick={() => setConfirmDeleteIssue(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2147483600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#171717',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 14,
              padding: '1.1rem 1.1rem 0.9rem',
              maxWidth: 340,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{
              fontSize: '0.95rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.01em', marginBottom: '0.4rem',
            }}>
              Issue verwijderen?
            </div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.4, marginBottom: '0.5rem',
            }}>
              "{(confirmDeleteIssue.text || '').slice(0, 80)}{(confirmDeleteIssue.text || '').length > 80 ? '…' : ''}"
            </div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.4, marginBottom: '1rem',
            }}>
              Komt in de <strong style={{ color: '#fca5a5' }}>Verwijderd</strong>-tab — daar kun je'm herstellen of pas echt-weg-poetsen.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setConfirmDeleteIssue(null)}
                style={{
                  flex: 1, minHeight: 44,
                  padding: '0.55rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.82rem', fontWeight: 800,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Annuleer
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, minHeight: 44,
                  padding: '0.55rem',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: '0.82rem', fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 6px 16px rgba(239,68,68,0.35)',
                }}
              >
                <Trash2 size={14} /> Verwijder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const iconBtn = (color) => ({
  // 40x40 zodat de tap-target ruim binnen Apple's 44pt-richtlijn ligt —
  // de oude 28x28 was niet betrouwbaar te raken op mobiel.
  width: 40, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color,
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
})
