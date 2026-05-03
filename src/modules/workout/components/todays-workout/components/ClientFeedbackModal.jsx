// src/modules/workout/components/todays-workout/components/ClientFeedbackModal.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, CheckCircle, Clock, MessageSquare, Camera, Upload, AlertTriangle, ThumbsUp, Scissors } from 'lucide-react'

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

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadSubmission()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const loadSubmission = async () => {
    if (!client?.id || !exercise?.name || !db) { setLoading(false); return }
    setLoading(true)
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
      setUploadSuccess(true)
      setSelectedFile(null)
      await loadSubmission()
      setTimeout(() => { setUploadSuccess(false); setUploadProgress(0) }, 3000)
    } catch (e) {
      console.error('Upload error:', e)
      // Fallback naar originele methode als XHR faalt
      try {
        await db.submitExerciseVideo(client.id, exercise.name, file)
        setUploadSuccess(true)
        setSelectedFile(null)
        await loadSubmission()
        setTimeout(() => setUploadSuccess(false), 3000)
      } catch (e2) {
        alert('Upload mislukt. Probeer opnieuw.')
      }
    } finally { setUploading(false) }
  }

  const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1)

  const getStatusColor = (s) => ({ approved: '#10b981', needs_work: '#f59e0b', reviewed: '#3b82f6' }[s] || '#FFD700')
  const getStatusLabel = (s) => ({ approved: 'Goedgekeurd', needs_work: 'Werk aan', reviewed: 'Beoordeeld' }[s] || 'Wacht op feedback')
  const getStatusIcon = (s) => ({ approved: ThumbsUp, needs_work: AlertTriangle, reviewed: MessageSquare }[s] || Clock)

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>

      <div style={{ width: '100%', maxWidth: '500px', maxHeight: isMobile ? '90vh' : '85vh', background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '16px' : '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <Send size={13} color="rgba(255,215,0,0.6)" />
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,215,0,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Video Feedback</span>
            </div>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{exercise.name}</h2>
          </div>
          <button onClick={handleClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '1.25rem', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Bestaande submissions */}
              {submissions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {submissions.map((sub, i) => {
                    const StatusIcon = getStatusIcon(sub.status)
                    return (
                      <div key={sub.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Status header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', background: `${getStatusColor(sub.status)}10`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <StatusIcon size={14} color={getStatusColor(sub.status)} strokeWidth={2} />
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: getStatusColor(sub.status) }}>{getStatusLabel(sub.status)}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                            {new Date(sub.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                          {submissions.length > 1 && (
                            <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', padding: '0.1rem 0.375rem', borderRadius: '3px', fontWeight: '700' }}>
                              #{submissions.length - i}
                            </span>
                          )}
                        </div>

                        {/* Video */}
                        <div style={{ aspectRatio: '9/16', maxHeight: '260px', background: '#111' }}>
                          <video src={sub.video_url} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        {/* Coach feedback */}
                        {sub.coach_feedback && (
                          <div style={{ padding: '0.75rem 0.875rem', background: 'rgba(255,215,0,0.04)', borderTop: '1px solid rgba(255,215,0,0.1)' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Feedback van coach</div>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{sub.coach_feedback}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Upload sectie — altijd zichtbaar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem', padding: submissions.length > 0 ? '0.875rem' : '1.5rem 0.5rem', background: submissions.length > 0 ? 'rgba(255,255,255,0.02)' : 'transparent', border: submissions.length > 0 ? '1px dashed rgba(255,255,255,0.08)' : 'none', borderRadius: '10px' }}>

                {submissions.length === 0 && (
                  <>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={32} color="rgba(255,215,0,0.7)" strokeWidth={1.5} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Stuur je video in</h3>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                        Film jezelf tijdens {exercise.name} en krijg persoonlijke techniek-feedback van je coach
                      </p>
                    </div>
                  </>
                )}

                {/* Bestandsgrootte feedback */}
                {selectedFile && !sizeWarning && (
                  <div style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={13} color="#10b981" strokeWidth={2.5} />
                    <span style={{ fontSize: '0.72rem', color: 'rgba(16,185,129,0.8)', fontWeight: '600' }}>{selectedFile.name} · {formatMB(selectedFile.size)} MB</span>
                  </div>
                )}

                {/* Size warning */}
                {sizeWarning && selectedFile && (
                  <div style={{ width: '100%', padding: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <AlertTriangle size={14} color="rgba(239,68,68,0.7)" strokeWidth={2} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.7)', fontWeight: '700' }}>Video te groot ({formatMB(selectedFile.size)} MB)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                      Knip onnodige stukken eraf via de <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Foto's app</strong> → bewerk → trim → sla op.
                    </p>
                  </div>
                )}

                {/* Progressbalk */}
                {uploading && (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Uploaden...</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FFD700' }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, rgba(255,215,0,0.6), #FFD700)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}

                {/* Upload knop */}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ width: '100%', padding: '0.8rem 1.25rem', background: uploading ? 'rgba(255,215,0,0.06)' : 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '10px', color: '#FFD700', fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
                  {uploading ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Uploaden...</>
                  ) : uploadSuccess ? (
                    <><CheckCircle size={16} strokeWidth={2.5} />Verstuurd!</>
                  ) : sizeWarning ? (
                    <><Upload size={16} strokeWidth={2.5} />Andere video kiezen</>
                  ) : submissions.length > 0 ? (
                    <><Upload size={16} strokeWidth={2.5} />Nog een video insturen</>
                  ) : (
                    <><Send size={16} strokeWidth={2.5} />Video Insturen</>
                  )}
                </button>

                {!sizeWarning && !uploading && (
                  <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.65rem', margin: 0, textAlign: 'center' }}>
                    Max 500MB · MP4, MOV · max 60 seconden
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}
