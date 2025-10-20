// src/modules/workout/components/ExerciseVideoModal.jsx
import { useState, useEffect } from 'react'
import { X, Play, AlertCircle, ExternalLink } from 'lucide-react'

export default function ExerciseVideoModal({ exercise, onClose, isMobile }) {
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    // Simulate loading video URL
    // In production, fetch from database
    const timer = setTimeout(() => {
      // Mock video URLs based on exercise name
      const mockVideos = {
        'Bench Press': 'https://www.youtube.com/embed/rT7DgCr-3pg',
        'Squat': 'https://www.youtube.com/embed/ultWZbUMPL8',
        'Deadlift': 'https://www.youtube.com/embed/op9kVnSso6Q',
        'Pull-ups': 'https://www.youtube.com/embed/eGo4IYlbE5g',
        'Overhead Press': 'https://www.youtube.com/embed/2yjwXTZQDDI'
      }
      
      const video = mockVideos[exercise.name]
      if (video) {
        setVideoUrl(video)
      } else {
        setError('Video nog niet beschikbaar')
      }
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [exercise])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Play size={20} color="#f97316" />
          {exercise.name}
        </h3>
        
        <button
          onClick={onClose}
          style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} color="rgba(255, 255, 255, 0.7)" />
        </button>
      </div>
      
      {/* Video Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        {loading && (
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(249, 115, 22, 0.2)',
              borderTopColor: '#f97316',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.9rem'
            }}>
              Video laden...
            </p>
          </div>
        )}
        
        {error && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.1)'
          }}>
            <AlertCircle size={48} color="rgba(239, 68, 68, 0.5)" style={{ marginBottom: '1rem' }} />
            <h4 style={{
              fontSize: '1.1rem',
              color: '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {error}
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.9rem'
            }}>
              Deze video wordt binnenkort toegevoegd
            </p>
          </div>
        )}
        
        {videoUrl && !loading && (
          <div style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '900px',
            aspectRatio: '16/9',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <iframe
              src={videoUrl}
              title={exercise.name}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
      
      {/* Footer with tips */}
      {videoUrl && !loading && (
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(17, 17, 17, 0.98)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h5 style={{
                fontSize: '0.85rem',
                color: '#f97316',
                fontWeight: '600',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Quick Tips
              </h5>
              <p style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0
              }}>
                Focus op vorm • Controlled movement • Full range of motion
              </p>
            </div>
            
            <button
              onClick={() => window.open(`https://www.youtube.com/results?search_query=${exercise.name}+technique`, '_blank')}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '8px',
                color: '#f97316',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease'
              }}
            >
              <ExternalLink size={14} />
              Meer videos
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
