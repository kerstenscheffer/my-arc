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

