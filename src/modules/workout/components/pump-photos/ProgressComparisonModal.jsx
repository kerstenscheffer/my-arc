// src/modules/workout/components/pump-photos/ProgressComparisonModal.jsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Calendar } from 'lucide-react'

export default function ProgressComparisonModal({ client, currentPhoto, db, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [photos, setPhotos] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sliderValue, setSliderValue] = useState(50)

  useEffect(() => {
    loadProgressPhotos()
  }, [client?.id])

  const loadProgressPhotos = async () => {
    try {
      const { data } = await db.getProgressPhotos(client.id, 20)
      setPhotos(data || [])
      
      // Find current photo index
      const currentIndex = data?.findIndex(p => p.id === currentPhoto.id) || 0
      setSelectedIndex(Math.max(0, currentIndex))
    } catch (error) {
      console.error('Load progress photos error:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentDisplayPhoto = photos[selectedIndex]
  const olderPhoto = photos[selectedIndex + 1] // Next in array = older

  const weightDiff = olderPhoto && currentDisplayPhoto
    ? db.calculateWeightDifference(olderPhoto, currentDisplayPhoto)
    : null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const daysBetween = olderPhoto && currentDisplayPhoto
    ? Math.floor((new Date(currentDisplayPhoto.created_at) - new Date(olderPhoto.created_at)) / (1000 * 60 * 60 * 24))
    : 0

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderRadius: '0',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '800',
            color: '#f97316',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            📊 Progress Comparison
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="#ef4444" />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(249, 115, 22, 0.2)',
              borderTopColor: '#f97316',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : photos.length < 2 ? (
          <div style={{
            padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginBottom: '0.5rem'
            }}>
              Upload meer foto's om progressie te vergelijken
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.8rem' : '0.85rem'
            }}>
              Je hebt minimaal 2 foto's nodig
            </p>
          </div>
        ) : (
          <>
            {/* Image Comparison Slider */}
            <div style={{
              position: 'relative',
              aspectRatio: '1',
              background: '#000',
              overflow: 'hidden'
            }}>
              {/* Older Photo (Background) */}
              {olderPhoto && (
                <img
                  src={olderPhoto.photo_url}
                  alt="Before"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}

              {/* Current Photo (Sliding overlay) */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${sliderValue}%`,
                height: '100%',
                overflow: 'hidden'
              }}>
                <img
                  src={currentDisplayPhoto?.photo_url}
                  alt="After"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${100 / (sliderValue / 100)}%`,
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Slider line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: `${sliderValue}%`,
                width: '3px',
                height: '100%',
                background: '#f97316',
                boxShadow: '0 0 20px rgba(249, 115, 22, 0.8)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none'
              }}>
                {/* Slider handle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f97316',
                  border: '3px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.5)'
                }}>
                  <ChevronLeft size={12} color="#fff" style={{ marginRight: '-4px' }} />
                  <ChevronRight size={12} color="#fff" style={{ marginLeft: '-4px' }} />
                </div>
              </div>

              {/* Labels */}
              {olderPhoto && (
                <>
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Before
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    background: 'rgba(249, 115, 22, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0',
                    border: '1px solid rgba(249, 115, 22, 0.5)'
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      After
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Slider Control */}
            <div style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(23, 23, 23, 0.6)',
              borderTop: '1px solid rgba(249, 115, 22, 0.1)'
            }}>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '0',
                  background: `linear-gradient(90deg, #f97316 0%, #f97316 ${sliderValue}%, rgba(255,255,255,0.1) ${sliderValue}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Stats */}
            {weightDiff && olderPhoto && (
              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(23, 23, 23, 0.6)',
                borderTop: '1px solid rgba(249, 115, 22, 0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {/* Weight Change */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0',
                  padding: isMobile ? '0.75rem' : '1rem',
                  textAlign: 'center',
                  border: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  {weightDiff.direction === 'loss' ? (
                    <TrendingDown size={isMobile ? 18 : 20} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                  ) : (
                    <TrendingUp size={isMobile ? 18 : 20} color="#f97316" style={{ marginBottom: '0.25rem' }} />
                  )}
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '800',
                    color: weightDiff.direction === 'loss' ? '#10b981' : '#f97316',
                    marginBottom: '0.1rem'
                  }}>
                    {weightDiff.direction === 'loss' ? '-' : '+'}{weightDiff.difference}kg
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Gewicht
                  </div>
                </div>

                {/* Days Between */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0',
                  padding: isMobile ? '0.75rem' : '1rem',
                  textAlign: 'center',
                  border: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  <Calendar size={isMobile ? 18 : 20} color="#f97316" style={{ marginBottom: '0.25rem' }} />
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.1rem'
                  }}>
                    {daysBetween}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Dagen
                  </div>
                </div>

                {/* Percentage */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0',
                  padding: isMobile ? '0.75rem' : '1rem',
                  textAlign: 'center',
                  border: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '800',
                    color: weightDiff.direction === 'loss' ? '#10b981' : '#f97316',
                    marginBottom: '0.1rem',
                    marginTop: '1.25rem'
                  }}>
                    {weightDiff.percentage}%
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Verandering
                  </div>
                </div>
              </div>
            )}

            {/* Photo Navigation */}
            {photos.length > 2 && (
              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(23, 23, 23, 0.6)',
                borderTop: '1px solid rgba(249, 115, 22, 0.1)',
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setSelectedIndex(Math.min(photos.length - 2, selectedIndex + 1))}
                  disabled={selectedIndex >= photos.length - 2}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '0',
                    color: '#f97316',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: selectedIndex >= photos.length - 2 ? 'not-allowed' : 'pointer',
                    opacity: selectedIndex >= photos.length - 2 ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <ChevronLeft size={16} />
                  Older
                </button>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600'
                }}>
                  {selectedIndex + 1} / {photos.length - 1}
                </span>
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex <= 0}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '0',
                    color: '#f97316',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: selectedIndex <= 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedIndex <= 0 ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  Newer
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 10px rgba(249, 115, 22, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 10px rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </div>,
    document.body
  )
}
