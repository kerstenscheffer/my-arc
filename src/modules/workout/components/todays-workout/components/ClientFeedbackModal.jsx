// src/modules/workout/components/todays-workout/components/ClientFeedbackModal.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from '../../../../../client/paginaPortal'
import { X, Send, CheckCircle, Video, Upload, AlertTriangle, PlayCircle, ChevronRight } from 'lucide-react'
import { puntenVan, soortVan, tijdTekst } from '../../../../video-feedback/feedbackPunten'

export default function ClientFeedbackModal({ exercise, client, db, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [sizeWarning, setSizeWarning] = useState(false)
  const fileInputRef = useRef(null)
  const videoRefs = useRef({})

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadSubmission()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const loadSubmission = async (stil = false) => {
    if (!client?.id || !exercise?.name || !db) { setLoading(false); return }
    if (!stil) setLoading(true)
    try {
      if (db.getExerciseSubmissions) {
        const subs = await db.getExerciseSubmissions(client.id, exercise.name)
        setSubmissions(subs || [])
        setSubmission(subs?.[0] || null)
      } else if (db.getExerciseSubmission) {
        const sub = await db.getExerciseSubmission(client.id, exercise.name)
        setSubmission(sub)
        setSubmissions(sub ? [sub] : [])
      }
    } catch (e) { console.error('Error loading submission:', e) }
    finally { setLoading(false) }
  }

  // Melding (en via de trigger een push) voor de coach. Mag mislukken zonder
  // dat de upload faalt. Eerst stond er niets: de coach zag een video pas als
  // hij zelf in het feedback-scherm keek (27 okt 2026).
  const meldCoach = () => {
    const coachId = client?.trainer_id || client?.coach_id
    if (!coachId) return
    const naam = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Een klant'
    db.supabase.from('coach_notifications').insert({
      coach_id: coachId, client_id: client.id, type: 'video_feedback', priority: 'normal',
      title: `${naam} stuurde een techniekvideo`,
      message: `${exercise.name}: wacht op je feedback.`,
      read_status: false,
    }).then(r => { if (r?.error) console.warn('Coach-melding video mislukt:', r.error.message) }, () => {})
  }

  // Live tijdens een Zoom-call: de coach zet punten één voor één klaar, de
  // klant ziet ze binnen een paar seconden verschijnen zolang dit open staat.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadSubmission(true) }, 6000)
    return () => clearInterval(t)
  }, [])

  const naarMoment = (id, tijd) => {
    const v = videoRefs.current[id]
    if (!v) return
    v.pause()
    v.currentTime = tijd
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !client?.id || !db) return

    if (!file.type.startsWith('video/')) {
      alert('Selecteer een video bestand')
      return
    }

    setSelectedFile(file)
    setSizeWarning(false)

    if (file.size > 500 * 1024 * 1024) {
      setSizeWarning(true)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      // Upload via XHR voor progress tracking
      const fileName = `exercise-submissions/${client.id}/${Date.now()}_${exercise.name.replace(/\s+/g, '_')}.mp4`
      const supabaseUrl = db.supabase.storageUrl || `${db.supabase.supabaseUrl}/storage/v1`
      const anonKey = db.supabase.supabaseKey

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${supabaseUrl}/object/videos/${fileName}`)
        xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`)
        xhr.setRequestHeader('x-upsert', 'false')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 85))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Upload network error'))
        const formData = new FormData()
        formData.append('', file)
        xhr.send(formData)
      })

      setUploadProgress(90)

      // Sla op in database via bestaande service
      const { data: urlData } = db.supabase.storage.from('videos').getPublicUrl(fileName)
      const { error } = await db.supabase.from('client_exercise_submissions').insert({
        client_id: client.id, exercise_name: exercise.name,
        video_url: urlData.publicUrl, status: 'pending'
      })
      if (error) throw error

      setUploadProgress(100)
      meldCoach()
      setUploadSuccess(true)
      setSelectedFile(null)
      await loadSubmission()
      setTimeout(() => { setUploadSuccess(false); setUploadProgress(0) }, 3000)
    } catch (e) {
      console.error('Upload error:', e)
      // Fallback naar originele methode als XHR faalt
      try {
        await db.submitExerciseVideo(client.id, exercise.name, file)
        meldCoach()
        setUploadSuccess(true)
        setSelectedFile(null)
        await loadSubmission()
        setTimeout(() => setUploadSuccess(false), 3000)
      } catch (e2) {
        alert('Upload mislukt. Probeer opnieuw.')
      }
    } finally { setUploading(false) }
  }

  const videoLabel = { position: 'absolute', top: 8, left: 8, zIndex: 1, padding: '3px 9px', borderRadius: 999, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.66rem', fontWeight: 800 }

  const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1)

  // Status als stipje met tekst, zoals de macro's: geen gekleurde vakken.
  const STATUS = {
    approved: { kleur: '#10b981', label: 'Goedgekeurd' },
    needs_work: { kleur: '#f59e0b', label: 'Werk aan' },
    reviewed: { kleur: '#3b82f6', label: 'Beoordeeld' },
  }
  const statusVan = (s) => STATUS[s] || { kleur: 'rgba(255,255,255,0.45)', label: 'Wacht op feedback' }

  const knopTekst = uploading ? 'Uploaden…'
    : uploadSuccess ? 'Verstuurd'
    : sizeWarning ? 'Andere video kiezen'
    : submissions.length > 0 ? 'Nog een video insturen'
    : 'Video insturen'

  // Bottom sheet over de wazige pagina, zwart-wit zoals de wisselvensters
  // (27 okt 2026; was een goud omrand vak midden in beeld).
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease',
      }}
    >
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, maxHeight: '92dvh',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '22px 22px 0 0' : 22,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {isMobile && <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0', flexShrink: 0 }} />}
        <button onClick={handleClose} aria-label="Sluiten" style={{
          position: 'absolute', top: 12, right: 12, width: 36, height: 36, padding: 0, zIndex: 1,
          background: 'none', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}><X size={22} strokeWidth={2.4} /></button>

        <div style={{
          flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '1rem 1rem calc(1.2rem + env(safe-area-inset-bottom, 0px))' : '1.4rem',
        }}>
          {/* Kop: icoon in een cirkel, oefening, één zin. */}
          <div style={{ textAlign: 'center', padding: '0.4rem 2rem 1.1rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto',
              border: '1.5px dashed rgba(255,255,255,0.35)', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <Video size={26} strokeWidth={2} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', marginTop: '0.75rem', letterSpacing: '-0.02em' }}>
              {exercise.name}
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.45 }}>
              {submissions.length > 0 ? 'Je ingestuurde video’s en de feedback van je coach.' : 'Film een set en je coach kijkt mee naar je techniek.'}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fbSpin 0.9s linear infinite' }} />
            </div>
          ) : (<>
            {/* Eerdere video's: status, video (naast die van de coach) en de punten. */}
            {submissions.map((sub, i) => {
              const st = statusVan(sub.status)
              return (
                <div key={sub.id} style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.kleur, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{st.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                      {submissions.length > 1 && `#${submissions.length - i} · `}
                      {new Date(sub.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, aspectRatio: '9/16', maxHeight: 300, borderRadius: 14, overflow: 'hidden', background: '#141414', margin: '0 auto', position: 'relative' }}>
                      {sub.coach_video_url && <span style={videoLabel}>Jij</span>}
                      <video ref={el => { videoRefs.current[sub.id] = el }} src={sub.video_url} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {sub.coach_video_url && (
                      <div style={{ flex: 1, minWidth: 0, aspectRatio: '9/16', maxHeight: 300, borderRadius: 14, overflow: 'hidden', background: '#141414', position: 'relative' }}>
                        <span style={videoLabel}>Coach</span>
                        <video src={sub.coach_video_url} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  {/* De video die de coach bij deze feedback maakte (Zoom, Loom). */}
                  {sub.feedback_link && (
                    <a href={sub.feedback_link} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
                      padding: '0.75rem 0.85rem', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <PlayCircle size={22} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900 }}>Bekijk de feedbackvideo</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>Je coach legt de punten hieronder uit</span>
                      </span>
                      <ChevronRight size={17} strokeWidth={2.6} color="rgba(255,255,255,0.5)" />
                    </a>
                  )}
                  {puntenVan(sub).length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        Feedback van je coach
                      </div>
                      {/* Punten met een moment: tik en de video springt erheen. */}
                      {puntenVan(sub).map(p => {
                        const s = soortVan(p.soort)
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.kleur, marginTop: 6, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 600, color: '#fff', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{p.tekst}</div>
                            {p.tijd != null && (
                              <button onClick={() => naarMoment(sub.id, p.tijd)} style={{
                                flexShrink: 0, padding: '0.2rem 0.6rem', borderRadius: 999, border: 'none',
                                background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              }}>{tijdTekst(p.tijd)}</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Gekozen bestand of te groot. */}
            {selectedFile && !sizeWarning && !uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                <CheckCircle size={15} strokeWidth={2.6} color="#10b981" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name} · {formatMB(selectedFile.size)} MB</span>
              </div>
            )}
            {sizeWarning && selectedFile && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.84rem', fontWeight: 900, color: '#ef4444' }}>
                  <AlertTriangle size={15} strokeWidth={2.6} /> Video te groot ({formatMB(selectedFile.size)} MB)
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.45 }}>
                  Knip hem korter in je Foto's-app (bewerk → inkorten) en kies hem opnieuw.
                </div>
              </div>
            )}

            {/* Voortgang tijdens het uploaden. */}
            {uploading && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                  <span>Uploaden</span><span style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{uploadProgress}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#fff', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', minHeight: 50, borderRadius: 12, border: 'none',
                background: uploadSuccess ? '#10b981' : '#fff', color: uploadSuccess ? '#fff' : '#0a0a0a',
                fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit',
                cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {uploadSuccess ? <CheckCircle size={17} strokeWidth={2.8} /> : submissions.length > 0 || sizeWarning ? <Upload size={17} strokeWidth={2.8} /> : <Send size={17} strokeWidth={2.8} />}
              {knopTekst}
            </button>
            {uploadSuccess && (
              <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                Je coach krijgt een melding.
              </div>
            )}
            {!sizeWarning && !uploading && !uploadSuccess && (
              <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                Max 60 seconden · max 500 MB
              </div>
            )}
          </>)}
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      <style>{'@keyframes fbSpin { to { transform: rotate(360deg); } }'}</style>
    </div>,
    document.body
  )
}
