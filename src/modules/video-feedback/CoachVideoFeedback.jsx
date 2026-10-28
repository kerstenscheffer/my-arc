// src/modules/video-feedback/CoachVideoFeedback.jsx
import { useState, useEffect, useRef } from 'react'
import { Video, Clock, Send, X, Play, Upload, Plus, RotateCcw, ChevronRight, Link2 } from 'lucide-react'
import { oefeningInfo } from '../workout/utils/oefeningBatch'
import { SOORTEN, soortVan, tijdTekst, puntenVan, puntenAlsTekst } from './feedbackPunten'
import { embedVan, schoneUrl } from './voorbeeldEmbed'

const STATUS_KLEUR = { approved: '#10b981', needs_work: '#f59e0b', reviewed: '#3b82f6', pending: '#fff' }
const naamVan = (s) => s?.clients ? `${s.clients.first_name || ''} ${s.clients.last_name || ''}`.trim() : 'Onbekend'

// Overzicht per klant (28 okt 2026; was een raster van grote kaarten met
// gele knoppen). Per klant één regel met kleine staande thumbnails; tik er
// één aan en je loopt die klant z'n video's na in het vergelijkscherm.
export default function CoachVideoFeedback({ db }) {
  const isMobile = window.innerWidth <= 768
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [open, setOpen] = useState(null) // { lijst, index }

  useEffect(() => { loadSubmissions() }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await db.getAllSubmissions()
      setSubmissions(data || [])
    } catch (e) { console.error('Error loading submissions:', e) }
    finally { setLoading(false) }
  }

  const gefilterd = submissions.filter(s =>
    filter === 'all' ? true : filter === 'open' ? s.status === 'pending' : s.status !== 'pending'
  )
  const perKlant = []
  const index = new Map()
  gefilterd.forEach(s => {
    if (!index.has(s.client_id)) { index.set(s.client_id, perKlant.length); perKlant.push({ id: s.client_id, naam: naamVan(s), lijst: [] }) }
    perKlant[index.get(s.client_id)].lijst.push(s)
  })
  // Oudste video eerst binnen een klant: daar wacht iemand het langst op.
  perKlant.forEach(k => k.lijst.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))

  const openAantal = submissions.filter(s => s.status === 'pending').length
  const pil = (actief) => ({
    padding: '0.45rem 0.95rem', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
    background: actief ? '#fff' : 'rgba(255,255,255,0.06)', color: actief ? '#000' : 'rgba(255,255,255,0.7)',
    fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit', touchAction: 'manipulation',
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Video feedback</h1>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
          {openAantal === 0 ? 'Alles bekeken' : `${openAantal} open`}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[['open', 'Open'], ['klaar', 'Afgerond'], ['all', 'Alle']].map(([id, l]) => (
            <button key={id} onClick={() => setFilter(id)} style={pil(filter === id)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : perKlant.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', fontWeight: 600 }}>
          {filter === 'open' ? 'Geen open video’s. Alles heeft feedback.' : 'Geen video’s.'}
        </div>
      ) : perKlant.map(k => (
        <div key={k.id} style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setOpen({ lijst: k.lijst, index: 0 })} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fff' }}>{k.naam}</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{k.lijst.length} video{k.lijst.length === 1 ? '' : '’s'}</span>
            <ChevronRight size={15} color="rgba(255,255,255,0.4)" />
          </button>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {k.lijst.map((s, i) => (
              <button key={s.id} onClick={() => setOpen({ lijst: k.lijst, index: i })} style={{ flexShrink: 0, width: isMobile ? 104 : 120, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden', background: '#111', position: 'relative' }}>
                  <video src={`${s.video_url}#t=0.5`} preload="metadata" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  <span style={{ position: 'absolute', top: 7, left: 7, width: 8, height: 8, borderRadius: '50%', background: STATUS_KLEUR[s.status] || '#fff', boxShadow: '0 0 0 2px rgba(0,0,0,0.6)' }} />
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff', marginTop: 6, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.exercise_name}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {new Date(s.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {open && (
        <KlantVideos db={db} lijst={open.lijst} start={open.index}
          onClose={(gewijzigd) => { setOpen(null); if (gewijzigd) loadSubmissions() }} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Loop de video's van één klant na: afronden gaat door naar de volgende.
// Ook gebruikt vanaf de klantkaart in het Command Center.
export function KlantVideos({ db, lijst, start = 0, onClose }) {
  const [index, setIndex] = useState(start)
  const gewijzigd = useRef(false)
  const sub = lijst[index]
  if (!sub) return null
  return (
    <FeedbackModal
      key={sub.id}
      submission={sub}
      db={db}
      positie={lijst.length > 1 ? { nr: index + 1, van: lijst.length, vorige: index > 0 ? () => setIndex(index - 1) : null, volgende: index < lijst.length - 1 ? () => setIndex(index + 1) : null } : null}
      onClose={() => onClose(gewijzigd.current)}
      onUpdate={() => {
        gewijzigd.current = true
        if (index < lijst.length - 1) setIndex(index + 1)
        else onClose(true)
      }}
    />
  )
}

// Vergelijk-scherm (28 okt 2026). Kersten deelt dit scherm in Zoom: links de
// video van de klant, rechts een voorbeeld (eigen coachvideo of de oefenvideo
// uit de app). Ernaast punten noteren; elk punt kan het moment in de
// klantvideo vasthouden. Punten worden direct opgeslagen, zodat de klant ze
// tijdens het gesprek al in de app ziet.
function FeedbackModal({ submission, db, onClose, onUpdate, positie }) {
  const isMobile = window.innerWidth <= 768
  const [punten, setPunten] = useState(() => puntenVan(submission))
  // Link naar de video die de coach bij deze feedback maakte (Zoom-opname,
  // Loom...). Staat bij de punten in de app van de klant.
  const [link, setLink] = useState(submission.feedback_link || '')
  const [tekst, setTekst] = useState('')
  const [soort, setSoort] = useState('beter')
  const [metTijd, setMetTijd] = useState(true)
  const [status, setStatus] = useState(submission.status === 'pending' ? 'needs_work' : submission.status)
  const [opslag, setOpslag] = useState('') // '', 'bezig', 'ok', 'fout'
  const [submitting, setSubmitting] = useState(false)
  const [snelheid, setSnelheid] = useState(1)
  const [info, setInfo] = useState(null)
  const [coachVideo, setCoachVideo] = useState(submission.coach_video_url || null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [bron, setBron] = useState(submission.voorbeeld_url ? 'link' : submission.coach_video_url ? 'coach' : 'oefening')
  // Voorbeeld van een externe creator: geplakte link (YouTube, Instagram,
  // TikTok, mp4). Wordt op de inzending bewaard; de klant ziet hem ook.
  const [voorbeeldLink, setVoorbeeldLink] = useState(submission.voorbeeld_url || null)
  const [linkInvoer, setLinkInvoer] = useState(null) // null = dicht, string = open
  const bewaarVoorbeeldLink = async (tekst) => {
    const url = schoneUrl(tekst)
    const { error } = await db.supabase.from('client_exercise_submissions')
      .update({ voorbeeld_url: url }).eq('id', submission.id)
      .then(r => r, e => ({ error: e }))
    if (error) { alert('Kon de link niet opslaan'); return }
    setVoorbeeldLink(url)
    setLinkInvoer(null)
    if (url) setBron('link')
  }
  const klantRef = useRef(null)
  const voorbeeldRef = useRef(null)
  const videoInputRef = useRef(null)
  const bewaarTimer = useRef(null)
  const eerste = useRef(true)

  const clientName = submission.clients
    ? `${submission.clients.first_name || ''} ${submission.clients.last_name || ''}`.trim()
    : 'Onbekend'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    oefeningInfo(db, submission.exercise_name).then(setInfo, () => {})
    return () => { document.body.style.overflow = 'auto'; clearTimeout(bewaarTimer.current) }
  }, [])

  // Voorbeeldbronnen: eigen coachvideo, de oefenvideo, de uitlegvideo.
  const bronnen = [
    voorbeeldLink && { id: 'link', label: 'Link', url: voorbeeldLink },
    coachVideo && { id: 'coach', label: 'Mijn video', url: coachVideo },
    info?.video_url && { id: 'oefening', label: 'Oefenvideo', url: info.video_url },
    info?.fallback_video_url && { id: 'uitleg', label: 'Uitleg', url: info.fallback_video_url },
  ].filter(Boolean)
  const gekozen = bronnen.find(b => b.id === bron) || bronnen[0] || null
  const embed = gekozen ? embedVan(gekozen.url) : null

  // Punten en link direct bewaren (kort na de laatste wijziging).
  const schoneLink = () => {
    const l = link.trim()
    if (!l) return null
    return /^https?:\/\//i.test(l) ? l : `https://${l}`
  }
  useEffect(() => {
    if (eerste.current) { eerste.current = false; return }
    clearTimeout(bewaarTimer.current)
    setOpslag('bezig')
    bewaarTimer.current = setTimeout(async () => {
      const { error } = await db.supabase.from('client_exercise_submissions')
        .update({ feedback_punten: punten, coach_feedback: puntenAlsTekst(punten), feedback_link: schoneLink() })
        .eq('id', submission.id)
        .then(r => r, e => ({ error: e }))
      setOpslag(error ? 'fout' : 'ok')
    }, 600)
  }, [punten, link])

  useEffect(() => {
    if (klantRef.current) klantRef.current.playbackRate = snelheid
    if (voorbeeldRef.current) voorbeeldRef.current.playbackRate = snelheid
  }, [snelheid, gekozen?.url])

  const voegToe = () => {
    const t = tekst.trim()
    if (!t) return
    const tijd = metTijd && klantRef.current ? Math.round(klantRef.current.currentTime * 10) / 10 : null
    setPunten(p => [...p, { id: `${Date.now()}`, tekst: t, soort, tijd }])
    setTekst('')
  }

  const naarTijd = (tijd) => {
    const v = klantRef.current
    if (!v || tijd == null) return
    v.pause()
    v.currentTime = tijd
  }

  const speelBeide = () => {
    const vids = [klantRef.current, voorbeeldRef.current].filter(Boolean)
    const loopt = vids.some(v => !v.paused)
    vids.forEach(v => { if (loopt) v.pause(); else v.play().catch(() => {}) })
  }

  const naarBegin = () => {
    ;[klantRef.current, voorbeeldRef.current].filter(Boolean).forEach(v => { v.pause(); v.currentTime = 0 })
  }

  const handleCoachVideoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { alert('Selecteer een video bestand'); return }
    if (file.size > 500 * 1024 * 1024) { alert('Video te groot (max 500MB)'); return }
    setUploadingVideo(true)
    try {
      const fileName = `coach-feedback/${submission.id}/${Date.now()}.mp4`
      const { error } = await db.supabase.storage.from('videos').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = db.supabase.storage.from('videos').getPublicUrl(fileName)
      const { error: e2 } = await db.supabase.from('client_exercise_submissions')
        .update({ coach_video_url: urlData.publicUrl }).eq('id', submission.id)
      if (e2) throw e2
      setCoachVideo(urlData.publicUrl)
      setBron('coach')
    } catch (err) {
      console.error('Coach video upload error:', err)
      alert('Kon je video niet uploaden')
    } finally { setUploadingVideo(false) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      clearTimeout(bewaarTimer.current)
      const { error } = await db.supabase.from('client_exercise_submissions')
        .update({
          feedback_punten: punten,
          coach_feedback: puntenAlsTekst(punten),
          feedback_link: schoneLink(),
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id)
      if (error) throw error
      // Eerste keer beoordeeld: de klant krijgt een melding (en push).
      if (submission.status === 'pending' && submission.client_id) {
        db.supabase.from('notifications').insert({
          client_id: submission.client_id, type: 'workout', source: 'auto', page_context: 'workout',
          priority: 'normal',
          title: 'Feedback op je techniekvideo',
          // Tik op de melding (of de push) opent meteen deze feedback.
          trigger_data: { actie: 'video_feedback', submission_id: submission.id, oefening: submission.exercise_name },
          message: `${submission.exercise_name}: je coach heeft ${punten.length || ''} punt${punten.length === 1 ? '' : 'en'} voor je klaargezet.`.replace('  ', ' '),
        }).then(r => { if (r?.error) console.warn('Klantmelding feedback mislukt:', r.error.message) }, () => {})
      }
      onUpdate()
    } catch (e) {
      console.error('Submit feedback error:', e)
      alert('Kon feedback niet opslaan')
    } finally { setSubmitting(false) }
  }

  const kopje = { fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }
  const pil = (actief) => ({
    padding: '0.4rem 0.8rem', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
    background: actief ? '#fff' : 'rgba(255,255,255,0.06)', color: actief ? '#000' : 'rgba(255,255,255,0.7)',
    fontSize: '0.74rem', fontWeight: 800, fontFamily: 'inherit', touchAction: 'manipulation',
  })
  const paneel = { flex: 1, minWidth: 0, background: '#000', borderRadius: 14, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const label = { position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: 'rgba(0,0,0,0.7)', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, color: '#fff', zIndex: 1 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* Kop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{clientName}</div>
          <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{submission.exercise_name}</div>
        </div>
        {positie && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={positie.vorige || undefined} disabled={!positie.vorige} aria-label="Vorige video" style={{ width: 34, height: 34, background: 'none', border: 'none', color: '#fff', opacity: positie.vorige ? 1 : 0.25, cursor: positie.vorige ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={20} strokeWidth={2.6} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{positie.nr}/{positie.van}</span>
            <button onClick={positie.volgende || undefined} disabled={!positie.volgende} aria-label="Volgende video" style={{ width: 34, height: 34, background: 'none', border: 'none', color: '#fff', opacity: positie.volgende ? 1 : 0.25, cursor: positie.volgende ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={20} strokeWidth={2.6} />
            </button>
          </div>
        )}
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: opslag === 'fout' ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
          {opslag === 'bezig' ? 'Opslaan…' : opslag === 'ok' ? 'Opgeslagen · klant ziet het' : opslag === 'fout' ? 'Niet opgeslagen' : ''}
        </span>
        <button onClick={onClose} aria-label="Sluiten" style={{ width: 40, height: 40, background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={24} strokeWidth={2.4} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: isMobile ? 'auto' : 'hidden' }}>
        {/* Video's naast elkaar */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: isMobile ? '0.75rem' : '1.25rem', gap: 12 }}>
          <div style={{ flex: 1, minHeight: isMobile ? '55vh' : 0, display: 'flex', gap: 10 }}>
            <div style={paneel}>
              <span style={label}>{clientName.split(' ')[0] || 'Klant'}</span>
              <video ref={klantRef} src={submission.video_url} controls loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={paneel}>
              <span style={label}>{gekozen ? gekozen.label : 'Voorbeeld'}</span>
              {!gekozen ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', padding: '1rem' }}>
                  Geen voorbeeldvideo bij deze oefening.<br />Upload hieronder je eigen video.
                </div>
              ) : embed?.soort === 'iframe' ? (
                <iframe
                  key={embed.src}
                  src={embed.src}
                  title="Voorbeeld" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
                />
              ) : embed?.soort === 'link' ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 10 }}>Deze site laat zich niet insluiten.</div>
                  <a href={embed.src} target="_blank" rel="noopener noreferrer" style={{ ...pil(true), textDecoration: 'none', display: 'inline-block' }}>Open de video</a>
                </div>
              ) : (
                <video ref={voorbeeldRef} key={gekozen.url} src={gekozen.url} controls loop playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>

          {/* Bediening */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={speelBeide} style={pil(true)}><Play size={13} strokeWidth={3} style={{ verticalAlign: '-2px', marginRight: 4 }} />Speel / pauzeer</button>
            <button onClick={naarBegin} style={pil(false)}><RotateCcw size={13} strokeWidth={2.6} style={{ verticalAlign: '-2px', marginRight: 4 }} />Begin</button>
            {[1, 0.5, 0.25].map(s => (
              <button key={s} onClick={() => setSnelheid(s)} style={pil(snelheid === s)}>{s}×</button>
            ))}
            <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            {bronnen.map(b => (
              <button key={b.id} onClick={() => setBron(b.id)} style={pil(gekozen?.id === b.id)}>{b.label}</button>
            ))}
            <button onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo} style={pil(false)}>
              <Upload size={13} strokeWidth={2.6} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {uploadingVideo ? 'Uploaden…' : coachVideo ? 'Andere eigen video' : 'Eigen video'}
            </button>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleCoachVideoSelect} style={{ display: 'none' }} />
            <button onClick={() => setLinkInvoer(linkInvoer == null ? (voorbeeldLink || '') : null)} style={pil(linkInvoer != null)}>
              <Link2 size={13} strokeWidth={2.6} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {voorbeeldLink ? 'Andere link' : 'Video-link'}
            </button>
          </div>
          {linkInvoer != null && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={linkInvoer}
                onChange={(e) => setLinkInvoer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') bewaarVoorbeeldLink(linkInvoer); if (e.key === 'Escape') setLinkInvoer(null) }}
                placeholder="Plak een YouTube-, Instagram-, TikTok- of mp4-link"
                inputMode="url"
                style={{ flex: 1, minWidth: 0, padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => bewaarVoorbeeldLink(linkInvoer)} disabled={!linkInvoer.trim()} style={{ ...pil(true), opacity: linkInvoer.trim() ? 1 : 0.4 }}>Toon</button>
              {voorbeeldLink && <button onClick={() => bewaarVoorbeeldLink('')} style={pil(false)}>Weghalen</button>}
            </div>
          )}
          {embed?.soort === 'iframe' && (
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
              Deze video speelt los; "Speel / pauzeer" en snelheid werken op je eigen video's.
            </div>
          )}
        </div>

        {/* Punten */}
        <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)', minHeight: 0 }}>
          <div style={{ padding: isMobile ? '0.75rem 1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={kopje}>Punt toevoegen</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {Object.entries(SOORTEN).map(([id, s]) => (
                <button key={id} onClick={() => setSoort(id)} style={{ ...pil(soort === id), display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.kleur, boxShadow: soort === id && id === 'tip' ? 'inset 0 0 0 1px #000' : 'none' }} />{s.label}
                </button>
              ))}
            </div>
            <textarea
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); voegToe() } }}
              placeholder="Bijv. ellebogen dichter bij je lichaam"
              rows={2}
              style={{ width: '100%', padding: '0.7rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <button onClick={() => setMetTijd(v => !v)} style={{ background: 'none', border: 'none', color: metTijd ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit' }}>
                <Clock size={14} strokeWidth={2.4} />{metTijd ? 'Met moment uit de video' : 'Zonder moment'}
              </button>
              <button onClick={voegToe} disabled={!tekst.trim()} style={{ ...pil(true), opacity: tekst.trim() ? 1 : 0.4 }}>
                <Plus size={13} strokeWidth={3} style={{ verticalAlign: '-2px', marginRight: 3 }} />Toevoegen
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem' }}>
            <div style={kopje}>Video bij je feedback</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 16 }}>
              <Link2 size={15} strokeWidth={2.4} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Plak je Zoom- of Loom-link"
                inputMode="url"
                style={{ flex: 1, minWidth: 0, padding: '0.65rem 0', background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}
              />
              {link && (
                <button onClick={() => setLink('')} aria-label="Link weghalen" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <X size={14} strokeWidth={2.4} />
                </button>
              )}
            </div>
            <div style={kopje}>Punten voor {clientName.split(' ')[0] || 'de klant'} ({punten.length})</div>
            {punten.length === 0 && (
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Pauzeer de video op het juiste moment en typ wat je ziet. Elk punt staat meteen in de app van de klant.
              </div>
            )}
            {punten.map(p => {
              const s = soortVan(p.soort)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.kleur, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 600, color: '#fff', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{p.tekst}</div>
                  {p.tijd != null && (
                    <button onClick={() => naarTijd(p.tijd)} style={{ ...pil(false), padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>{tijdTekst(p.tijd)}</button>
                  )}
                  <button onClick={() => setPunten(l => l.filter(x => x.id !== p.id))} aria-label="Verwijder punt" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 2 }}>
                    <X size={15} strokeWidth={2.4} />
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ padding: isMobile ? '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px))' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { value: 'approved', label: 'Goed', kleur: '#10b981' },
                { value: 'needs_work', label: 'Werk aan', kleur: '#f59e0b' },
                { value: 'reviewed', label: 'Beoordeeld', kleur: '#3b82f6' },
              ].map(({ value, label: l, kleur }) => (
                <button key={value} onClick={() => setStatus(value)} style={{ ...pil(status === value), flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: kleur }} />{l}
                </button>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', minHeight: 48, borderRadius: 12, border: 'none', background: '#fff', color: '#000', fontSize: '0.92rem', fontWeight: 900, fontFamily: 'inherit', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Send size={16} strokeWidth={2.6} />{submitting ? 'Opslaan…' : `${submission.status === 'pending' ? 'Afronden en klant melden' : 'Afronden'}${positie?.volgende ? ' · volgende' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
