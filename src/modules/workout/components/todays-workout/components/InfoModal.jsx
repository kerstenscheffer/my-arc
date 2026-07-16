// src/modules/workout/components/todays-workout/components/InfoModal.jsx
import { X, Play, Info, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ExerciseService from '../../../../../services/ExerciseService'

export default function InfoModal({ exercise, onClose, db, client, defaultTab }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab || 'video')
  const [videoUrl, setVideoUrl] = useState(null)
  // True wanneer de geladen URL een fallback van een externe creator is —
  // tonen we als een label "Externe creator" zodat de gebruiker weet dat
  // het niet door de coach zelf is opgenomen.
  const [isFallback, setIsFallback] = useState(false)
  // YouTube-search URLs (results?search_query=...) zijn NIET embeddable.
  // In dat geval rendert de modal een knop naar YouTube i.p.v. iframe.
  const [externalOnly, setExternalOnly] = useState(false)
  const [externalUrl, setExternalUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadVideo()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  // Als defaultTab verandert na mount (bijv. play button klik), sync
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab)
  }, [defaultTab])

  const loadVideo = async () => {
    setLoading(true)
    try {
      // Fetch BOTH coach video and fallback so we can label them differently.
      const details = await ExerciseService.getExerciseDetails(exercise.name)
      const coachUrl = details?.video_url || null
      const fbUrl = details?.fallback_video_url || null
      const chosen = coachUrl || fbUrl
      setIsFallback(!coachUrl && !!fbUrl)
      if (!chosen) return
      // Search-URLs zijn niet embeddable — render een externe knop i.p.v.
      // iframe. Watch/embed-URLs gaan door de embed-conversie heen.
      const isSearch = /youtube\.com\/results\?/.test(chosen)
      if (isSearch) {
        setExternalOnly(true)
        setExternalUrl(chosen)
      } else {
        const embedUrl = getYouTubeEmbedUrl(chosen)
        setVideoUrl(embedUrl || chosen)
      }
    } catch (error) {
      console.error('❌ Failed to load video:', error)
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    if (url.includes('youtube.com/embed/')) return url
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
    return url
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* HEADER */}
      <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(10,10,10,0.98)' }}>
        <h2 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
          {exercise.name}
        </h2>
        <button onClick={handleClose} style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* TAB CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* VIDEO TAB */}
          {activeTab === 'video' && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>Video laden...</p>
                </div>
              ) : externalOnly ? (
                <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '380px' }}>
                  <div style={{ width: isMobile ? '52px' : '60px', height: isMobile ? '52px' : '60px', borderRadius: '50%', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Play size={isMobile ? 22 : 26} color="#FFD700" />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', marginBottom: '0.375rem', fontWeight: '700' }}>Video van externe creator</h4>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0 0 1.25rem' }}>Coach heeft nog geen eigen opname — bekijk een uitleg van een andere creator op YouTube.</p>
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.1rem', background: '#FFD700', border: 'none', borderRadius: '8px', color: '#000', fontSize: '0.82rem', fontWeight: '800', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Play size={14} />Open op YouTube
                  </a>
                </div>
              ) : videoUrl ? (
                <div style={{ width: '100%', height: '100%', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {isFallback && (
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 12, padding: '4px 8px', background: 'rgba(255,215,0,0.18)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 4, color: '#FFD700', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Externe creator
                    </div>
                  )}
                  <div style={{ width: isMobile ? '100%' : 'min(400px, 56.25vh)', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={`${videoUrl}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1&playsinline=1&autoplay=${videoPlaying ? 1 : 0}&mute=0`}
                      title={exercise.name}
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: videoUrl.includes('shorts') ? '100%' : '177.78%', height: '100%', border: 'none', pointerEvents: 'auto' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />

                    {/* Play overlay */}
                    {!videoPlaying && (
                      <div onClick={() => setVideoPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                        <div style={{ width: isMobile ? '72px' : '88px', height: isMobile ? '72px' : '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(255,215,0,0.4), 0 0 0 8px rgba(255,215,0,0.1)', animation: 'pulse 2s ease-in-out infinite' }}>
                          <Play size={isMobile ? 36 : 44} color="#000" fill="#000" strokeWidth={0} style={{ marginLeft: '4px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '380px' }}>
                  <div style={{ width: isMobile ? '52px' : '60px', height: isMobile ? '52px' : '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Play size={isMobile ? 22 : 26} color="rgba(255,255,255,0.3)" />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.375rem', fontWeight: '700' }}>Geen video beschikbaar</h4>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>Wordt binnenkort toegevoegd</p>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' technique')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: '700', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Play size={14} />Zoek op YouTube
                  </a>
                </div>
              )}
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div style={{ padding: isMobile ? '1.25rem 1rem' : '1.75rem 1.5rem' }}>
              {(exercise.type === 'cardio' ? [
                exercise.duration && { label: 'Duur', value: exercise.duration },
                exercise.distance && { label: 'Afstand', value: exercise.distance },
                exercise.intensity && { label: 'Intensiteit', value: exercise.intensity },
                exercise.notes && { label: 'Notitie', value: exercise.notes },
              ] : [
                { label: 'Sets', value: exercise.sets },
                { label: 'Reps', value: exercise.reps },
                { label: 'Rust', value: exercise.rust },
                exercise.primairSpieren && { label: 'Spiergroep', value: exercise.primairSpieren },
                exercise.equipment && { label: 'Equipment', value: exercise.equipment },
                exercise.rpe && { label: 'RIR', value: exercise.rpe },
              ]).filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ padding: isMobile ? '0.875rem 0' : '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: isMobile ? '0.78rem' : '0.83rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#FFD700', fontWeight: '800', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* TIPS TAB */}
          {activeTab === 'tips' && (
            <div style={{ padding: isMobile ? '1.25rem 1rem' : '1.75rem 1.5rem' }}>
              {[
                { title: 'Vorm & Techniek', tips: ['Focus op gecontroleerde beweging', 'Volledige range of motion', 'Houd core stabiel'] },
                { title: 'Veiligheid', tips: ['Warm-up voor zware sets', 'Stop bij pijn of ongemak', 'Gebruik correct gewicht'] }
              ].map(({ title, tips }) => (
                <div key={title} style={{ marginBottom: '1.25rem', padding: isMobile ? '1rem' : '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,215,0,0.7)', fontWeight: '700', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.625rem' }}>{title}</h4>
                  {tips.map((tip, idx) => (
                    <div key={idx} style={{ padding: '0.4rem 0', color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', marginTop: '0.15rem', flexShrink: 0 }}>—</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABS — floating onderaan */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent)', zIndex: 10 }}>
          {[
            { key: 'video', icon: Play, label: 'Video' },
            { key: 'details', icon: Info, label: 'Details' },
            { key: 'tips', icon: Zap, label: 'Tips' }
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: isMobile ? '0.75rem 0.5rem' : '0.875rem 0.5rem', background: activeTab === key ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', borderTop: activeTab === key ? '2px solid rgba(255,215,0,0.6)' : '2px solid transparent', color: activeTab === key ? '#FFD700' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.15s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Icon size={isMobile ? 17 : 19} strokeWidth={2.5} />
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.67rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(255,215,0,0.4), 0 0 0 8px rgba(255,215,0,0.1); }
          50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(255,215,0,0.6), 0 0 0 12px rgba(255,215,0,0.2); }
        }
      `}</style>
    </div>,
    document.body
  )
}
