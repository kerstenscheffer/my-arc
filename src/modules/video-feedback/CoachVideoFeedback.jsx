// src/modules/video-feedback/CoachVideoFeedback.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Video, MessageSquare, CheckCircle, Clock,
  Send, User, Dumbbell, ChevronRight, X, Play,
  ThumbsUp, AlertTriangle, Upload, Camera
} from 'lucide-react'

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

function FeedbackModal({ submission, db, onClose, onUpdate }) {
  const isMobile = window.innerWidth <= 768
  const [feedback, setFeedback] = useState(submission.coach_feedback || '')
  const [status, setStatus] = useState(submission.status)
  const [submitting, setSubmitting] = useState(false)
  const [coachVideoFile, setCoachVideoFile] = useState(null)
  const [coachVideoPreview, setCoachVideoPreview] = useState(submission.coach_video_url || null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const videoInputRef = useRef(null)

  const clientName = submission.clients
    ? `${submission.clients.first_name || ''} ${submission.clients.last_name || ''}`.trim()
    : 'Onbekend'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const handleCoachVideoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { alert('Selecteer een video bestand'); return }
    if (file.size > 500 * 1024 * 1024) { alert('Video te groot (max 500MB)'); return }
    setCoachVideoFile(file)
    setCoachVideoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let coachVideoUrl = submission.coach_video_url || null

      // Upload coach video als er een nieuwe is
      if (coachVideoFile) {
        setUploadingVideo(true)
        const fileName = `coach-feedback/${submission.id}/${Date.now()}.mp4`
        const { data, error } = await db.supabase.storage
          .from('videos')
          .upload(fileName, coachVideoFile, { upsert: true })
        if (error) throw error
        const { data: urlData } = db.supabase.storage.from('videos').getPublicUrl(fileName)
        coachVideoUrl = urlData.publicUrl
        setUploadingVideo(false)
      }

      // Sla feedback + status + coach video op
      const { error } = await db.supabase
        .from('client_exercise_submissions')
        .update({
          coach_feedback: feedback || null,
          status,
          coach_video_url: coachVideoUrl,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id)

      if (error) throw error
      onUpdate()
    } catch (e) {
      console.error('Submit feedback error:', e)
      alert('Kon feedback niet opslaan')
    } finally { setSubmitting(false); setUploadingVideo(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '2rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '960px', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '92vh', background: '#0a0a0a', borderRadius: isMobile ? '0' : '16px', border: isMobile ? 'none' : '1px solid rgba(255,215,0,0.15)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

        {/* CLIENT VIDEO */}
        <div style={{ flex: isMobile ? 'none' : '1', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: isMobile ? '40vh' : 'auto' }}>
          <video src={submission.video_url} controls autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          {isMobile && (
            <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '36px', height: '36px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
          <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', padding: '0.25rem 0.625rem', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
            Client video
          </div>
        </div>

        {/* FEEDBACK PANEEL */}
        <div style={{ width: isMobile ? '100%' : '380px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

          {/* Header */}
          <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginBottom: '0.2rem' }}>{clientName}</div>
              <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#FFD700', margin: 0 }}>{submission.exercise_name}</h3>
            </div>
            {!isMobile && (
              <button onClick={onClose} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Status */}
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                {[
                  { value: 'approved', label: 'Goed', color: '#10b981', icon: ThumbsUp },
                  { value: 'needs_work', label: 'Werk aan', color: '#f59e0b', icon: AlertTriangle },
                  { value: 'reviewed', label: 'Reviewed', color: '#3b82f6', icon: MessageSquare }
                ].map(({ value, label, color, icon: Icon }) => {
                  const active = status === value
                  return (
                    <button key={value} onClick={() => setStatus(value)} style={{ padding: '0.5rem', background: active ? `${color}18` : 'transparent', border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', color: active ? color : 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', transition: 'all 0.15s ease' }}>
                      <Icon size={15} strokeWidth={2} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tekst feedback */}
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Feedback tekst</div>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Schrijf je feedback hier..." style={{ width: '100%', minHeight: '100px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Coach video upload */}
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Coach video (optioneel)</div>

              {coachVideoPreview ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <video src={coachVideoPreview} controls playsInline style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', background: '#000', borderRadius: '8px' }} />
                  <button onClick={() => { setCoachVideoFile(null); setCoachVideoPreview(submission.coach_video_url || null) }} style={{ position: 'absolute', top: '0.375rem', right: '0.375rem', width: '26px', height: '26px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={() => videoInputRef.current?.click()} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <Camera size={14} strokeWidth={2} />Video toevoegen
                </button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleCoachVideoSelect} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '0.875rem', background: submitting ? 'rgba(255,215,0,0.08)' : 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', color: '#FFD700', fontSize: '0.875rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {submitting ? (
                <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />{uploadingVideo ? 'Video uploaden...' : 'Opslaan...'}</>
              ) : (
                <><Send size={16} strokeWidth={2.5} />Feedback Versturen</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
