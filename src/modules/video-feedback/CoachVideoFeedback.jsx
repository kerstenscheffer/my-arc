// src/modules/video-feedback/CoachVideoFeedback.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Video, Clock, Send, User, Dumbbell, ChevronRight, X, Play,
  Upload, Plus, RotateCcw
} from 'lucide-react'
import { oefeningInfo } from '../workout/utils/oefeningBatch'
import { extractYouTubeId, appSafeEmbedUrl } from '../videos/utils/youtubeHelpers'
import { SOORTEN, soortVan, tijdTekst, puntenVan, puntenAlsTekst } from './feedbackPunten'

export default function CoachVideoFeedback({ db }) {
  const isMobile = window.innerWidth <= 768
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  useEffect(() => { loadSubmissions() }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await db.getAllSubmissions()
      setSubmissions(data || [])
    } catch (e) { console.error('Error loading submissions:', e) }
    finally { setLoading(false) }
  }

  const filteredSubmissions = submissions.filter(s =>
    filter === 'all' ? true : s.status === filter
  )

  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Video size={20} color="#FFD700" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>Video Feedback</h1>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{pendingCount} wachtend op review</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'pending', label: 'Pending', color: '#FFD700' },
          { id: 'reviewed', label: 'Reviewed', color: '#3b82f6' },
          { id: 'approved', label: 'Approved', color: '#10b981' },
          { id: 'needs_work', label: 'Werk nodig', color: '#f59e0b' },
          { id: 'all', label: 'Alle', color: '#666' }
        ].map(({ id, label, color }) => {
          const count = id === 'all' ? submissions.length : submissions.filter(s => s.status === id).length
          const active = filter === id
          return (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '0.45rem 0.875rem', background: active ? `${color}18` : 'transparent', border: active ? `1px solid ${color}45` : '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: active ? color : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {label}
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Submissions */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Video size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', margin: 0 }}>Geen video's in deze categorie</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.875rem' }}>
          {filteredSubmissions.map(s => (
            <SubmissionCard key={s.id} submission={s} onClick={() => setSelectedSubmission(s)} />
          ))}
        </div>
      )}

      {selectedSubmission && (
        <FeedbackModal
          submission={selectedSubmission}
          db={db}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={() => { loadSubmissions(); setSelectedSubmission(null) }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SubmissionCard({ submission, onClick }) {
  const clientName = submission.clients
    ? `${submission.clients.first_name || ''} ${submission.clients.last_name || ''}`.trim()
    : 'Onbekend'

  const statusColor = { approved: '#10b981', needs_work: '#f59e0b', reviewed: '#3b82f6', pending: '#FFD700' }[submission.status] || '#FFD700'
  const statusLabel = { approved: 'Goedgekeurd', needs_work: 'Werk nodig', reviewed: 'Reviewed', pending: 'Pending' }[submission.status] || 'Pending'

  return (
    <div onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
      {/* Thumbnail */}
      <div style={{ aspectRatio: '16/9', background: '#111', position: 'relative', overflow: 'hidden' }}>
        <video src={submission.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,215,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={20} color="#000" fill="#000" style={{ marginLeft: '2px' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#fff' }}>{statusLabel}</span>
        </div>
        {submission.coach_video_url && (
          <div style={{ position: 'absolute', bottom: '0.625rem', right: '0.625rem', padding: '0.2rem 0.5rem', background: 'rgba(16,185,129,0.8)', borderRadius: '5px' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#fff' }}>Coach video ✓</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <User size={12} color="rgba(255,255,255,0.35)" />
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>{clientName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Dumbbell size={11} color="rgba(255,215,0,0.6)" />
            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,215,0,0.7)' }}>{submission.exercise_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(submission.created_at).toLocaleDateString('nl-NL')}</span>
            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </div>
        </div>
      </div>
    </div>
  )
}


// Vergelijk-scherm (28 okt 2026). Kersten deelt dit scherm in Zoom: links de
// video van de klant, rechts een voorbeeld (eigen coachvideo of de oefenvideo
// uit de app). Ernaast punten noteren; elk punt kan het moment in de
// klantvideo vasthouden. Punten worden direct opgeslagen, zodat de klant ze
// tijdens het gesprek al in de app ziet.
function FeedbackModal({ submission, db, onClose, onUpdate }) {
  const isMobile = window.innerWidth <= 768
  const [punten, setPunten] = useState(() => puntenVan(submission))
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
  const [bron, setBron] = useState(submission.coach_video_url ? 'coach' : 'oefening')
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
    coachVideo && { id: 'coach', label: 'Mijn video', url: coachVideo },
    info?.video_url && { id: 'oefening', label: 'Oefenvideo', url: info.video_url },
    info?.fallback_video_url && { id: 'uitleg', label: 'Uitleg', url: info.fallback_video_url },
  ].filter(Boolean)
  const gekozen = bronnen.find(b => b.id === bron) || bronnen[0] || null
  const ytId = gekozen ? extractYouTubeId(gekozen.url) : null

  // Punten direct bewaren (kort na de laatste wijziging).
  useEffect(() => {
    if (eerste.current) { eerste.current = false; return }
    clearTimeout(bewaarTimer.current)
    setOpslag('bezig')
    bewaarTimer.current = setTimeout(async () => {
      const { error } = await db.supabase.from('client_exercise_submissions')
        .update({ feedback_punten: punten, coach_feedback: puntenAlsTekst(punten) })
        .eq('id', submission.id)
        .then(r => r, e => ({ error: e }))
      setOpslag(error ? 'fout' : 'ok')
    }, 600)
  }, [punten])

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
              ) : ytId ? (
                <iframe
                  key={ytId}
                  src={appSafeEmbedUrl(`https://www.youtube.com/embed/${ytId}?rel=0&playsinline=1&modestbranding=1`)}
                  title="Voorbeeld" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
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
          </div>
          {ytId && (
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
              YouTube-voorbeeld speelt los; "Speel / pauzeer" en snelheid werken op je eigen video's.
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
              <Send size={16} strokeWidth={2.6} />{submitting ? 'Opslaan…' : submission.status === 'pending' ? 'Afronden en klant melden' : 'Afronden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
