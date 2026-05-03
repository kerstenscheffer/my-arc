import useIsMobile from '../../hooks/useIsMobile'
// src/modules/videos/ClientVideoWidget.jsx
// v2.0 - Category tabs + gallery scroll
// FIXED: YouTube shorts URL support, removed broken getTodaysVideo call
import React, { useState, useEffect, useRef } from 'react'
import {
  Play, X, Zap, Target, Heart, Brain, Activity,
  Volume2, VolumeX, CheckCircle2
} from 'lucide-react'
import videoService from './VideoService'

// Singleton pattern to prevent double-load across re-mounts
let globalVideoLoadState = {}

// Page color schemes
const PAGE_THEMES = {
  home: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ef4444',
    label: 'Workout Video'
  },
  meals: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#10b981',
    label: 'Nutrition Tip'
  },
  workout: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#f59e0b',
    label: 'Training Focus'
  },
  progress: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#8b5cf6',
    label: 'Mindset Boost'
  }
}

const CATEGORY_META = {
  education:  { label: 'Uitleg',     icon: Brain },
  technique:  { label: 'Techniek',   icon: Target },
  nutrition:  { label: 'Voeding',    icon: Heart },
  motivation: { label: 'Motivatie',  icon: Zap },
  mindset:    { label: 'Mindset',    icon: Brain },
  recovery:   { label: 'Herstel',    icon: Activity },
  challenge:  { label: 'Challenge',  icon: Zap }
}

// FIXED: YouTube ID extractor — now supports shorts + mobile URLs
const extractYouTubeId = (url) => {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
    /m\.youtube\.com\/shorts\/([^&\n?#]+)/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m && m[1]) return m[1]
  }
  return null
}

const getCategoryMeta = (category) => {
  return CATEGORY_META[category] || { label: category || 'Video', icon: Zap }
}

export default function ClientVideoWidget({ client, db, pageContext = 'home' }) {
  const [allVideos, setAllVideos] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const playerRef = useRef(null)
  const loadedRef = useRef(false)
  const mountedRef = useRef(true)
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))

  const isMobile = useIsMobile()
  const theme = PAGE_THEMES[pageContext] || PAGE_THEMES.home

  // Derived: available categories from loaded videos
  const availableCategories = [...new Set(
    allVideos.map(v => v?.video?.category).filter(Boolean)
  )]

  // Derived: filtered list
  const filteredVideos = selectedCategory === 'all'
    ? allVideos
    : allVideos.filter(v => v?.video?.category === selectedCategory)

  const featured = filteredVideos[selectedIndex]

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (client?.id && globalVideoLoadState[client.id] === instanceId.current) {
        delete globalVideoLoadState[client.id]
      }
    }
  }, [])

  useEffect(() => {
    if (!client?.id || !db) {
      setLoading(false)
      return
    }

    // Check cache
    if (window.__videoWidgetData && window.__videoWidgetData[client.id + '_' + pageContext]) {
      const cached = window.__videoWidgetData[client.id + '_' + pageContext]
      const age = Date.now() - cached.loadedAt
      if (age < 30000) {
        setAllVideos(cached.videos)
        setLoading(false)
        return
      }
    }

    if (globalVideoLoadState[client.id] && globalVideoLoadState[client.id] !== instanceId.current) {
      setLoading(false)
      return
    }

    if (loadedRef.current) return

    globalVideoLoadState[client.id] = instanceId.current
    loadedRef.current = true
    loadVideos()

    return () => {
      loadedRef.current = false
    }
  }, [client?.id, db, pageContext])

  const loadVideos = async () => {
    if (!mountedRef.current || !db) return

    setLoading(true)
    try {
      const videos = await videoService.getVideosForPage(client.id, pageContext, {}, db)

      if (!mountedRef.current) return

      setAllVideos(videos || [])
      setSelectedIndex(0)

      // Cache
      if (!window.__videoWidgetData) window.__videoWidgetData = {}
      window.__videoWidgetData[client.id + '_' + pageContext] = {
        videos: videos || [],
        loadedAt: Date.now()
      }
    } catch (error) {
      console.error('❌ Error loading videos:', error)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const handleSelectCategory = (catKey) => {
    setSelectedCategory(catKey)
    setSelectedIndex(0)
    setIsPlaying(false)
  }

  const handleSelectVideo = (idxInFiltered) => {
    setSelectedIndex(idxInFiltered)
    setIsPlaying(false)
  }

  const handlePlay = async () => {
    if (!featured) return
    setIsPlaying(true)
    if (featured.assignment_id) {
      try {
        await videoService.markAsViewed(featured.assignment_id)
      } catch (e) {
        console.error('❌ markAsViewed failed:', e)
      }
    }
  }

  // LOADING
  if (loading) {
    return (
      <div style={{
        background: theme.gradient,
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        minHeight: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8
      }}>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
          Videos laden...
        </div>
      </div>
    )
  }

  // EMPTY
  if (!allVideos.length) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${theme.color}20 0%, ${theme.color}10 100%)`,
        borderRadius: '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: `2px solid ${theme.color}30`,
        textAlign: 'center'
      }}>
        <Play size={48} style={{ color: theme.color, opacity: 0.3, margin: '0 auto 1rem' }} />
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Nog geen videos beschikbaar
        </h3>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Je coach zal binnenkort videos met je delen!
        </p>
      </div>
    )
  }

  const featuredVideo = featured?.video
  const videoId = featuredVideo ? extractYouTubeId(featuredVideo.video_url) : null
  const featuredCatMeta = getCategoryMeta(featuredVideo?.category)
  const FeaturedCatIcon = featuredCatMeta.icon

  return (
    <div style={{
      background: theme.gradient,
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      position: 'relative'
    }}>
      {/* ── HEADER ── */}
      <div style={{
        padding: isMobile ? '0.875rem 1rem 0' : '1.125rem 1.25rem 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.625rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={15} color="rgba(255,255,255,0.9)" />
            <span style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.95)',
              fontWeight: '700',
              letterSpacing: '-0.01em'
            }}>
              {theme.label}
            </span>
          </div>
          <div style={{
            padding: '0.25rem 0.5rem',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '0.02em'
          }}>
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── CATEGORY TABS ── Only if >1 category */}
      {availableCategories.length > 1 && (
        <div
          className="cvw-cat-row"
          style={{
            display: 'flex',
            gap: '0.375rem',
            padding: isMobile ? '0 1rem 0.75rem' : '0 1.25rem 0.875rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}
        >
          {/* Alles tab */}
          <button
            onClick={() => handleSelectCategory('all')}
            style={{
              padding: '0.35rem 0.7rem',
              background: selectedCategory === 'all' ? '#fff' : 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '20px',
              color: selectedCategory === 'all' ? theme.color : '#fff',
              fontSize: '0.68rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
              minHeight: '30px',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            Alles
          </button>

          {availableCategories.map(catKey => {
            const meta = getCategoryMeta(catKey)
            const Icon = meta.icon
            const isActive = selectedCategory === catKey
            return (
              <button
                key={catKey}
                onClick={() => handleSelectCategory(catKey)}
                style={{
                  padding: '0.35rem 0.7rem',
                  background: isActive ? '#fff' : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '20px',
                  color: isActive ? theme.color : '#fff',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  minHeight: '30px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                <Icon size={11} />
                {meta.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── FEATURED VIDEO TITLE ── */}
      {featuredVideo && (
        <div style={{
          padding: isMobile ? '0 1rem 0.75rem' : '0 1.25rem 0.875rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.35rem'
          }}>
            <div style={{
              padding: '0.2rem 0.45rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontSize: '0.6rem',
              fontWeight: '700',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              letterSpacing: '0.02em'
            }}>
              <FeaturedCatIcon size={10} />
              {featuredCatMeta.label}
            </div>
            {featured?.viewed_at && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: '600'
              }}>
                <CheckCircle2 size={10} />
                Bekeken
              </div>
            )}
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: '-0.01em'
          }}>
            {featuredVideo.title}
          </h3>
          {featuredVideo.description && (
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.4,
              margin: '0.4rem 0 0 0'
            }}>
              {featuredVideo.description}
            </p>
          )}
        </div>
      )}

      {/* ── PLAYER ── */}
      {featuredVideo && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: isPlaying ? '0' : '56.25%',
            background: '#000',
            cursor: isPlaying ? 'default' : 'pointer'
          }}
          onClick={() => !isPlaying && handlePlay()}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {!isPlaying && videoId ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={featuredVideo.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s ease'
                }}>
                  <Play size={28} color="#000" style={{ marginLeft: '5px' }} />
                </div>
              </div>
            </>
          ) : isPlaying && videoId ? (
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%'
            }}>
              <iframe
                ref={playerRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {showControls && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1rem',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted) }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(false) }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <X size={20} color="#fff" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              Video URL niet geldig
            </div>
          )}
        </div>
      )}

      {/* ── GALLERY STRIP ── Only if >1 video in current filter */}
      {filteredVideos.length > 1 && !isPlaying && (
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
          background: 'rgba(0,0,0,0.22)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.75)',
            marginBottom: '0.5rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Meer in {selectedCategory === 'all' ? 'bibliotheek' : getCategoryMeta(selectedCategory).label} →
          </div>
          <div
            className="cvw-gallery"
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none'
            }}
          >
            {filteredVideos.map((item, idx) => {
              const vid = extractYouTubeId(item?.video?.video_url)
              const isSelected = idx === selectedIndex
              const isWatched = !!item?.viewed_at
              return (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelectVideo(idx)}
                  style={{
                    minWidth: isMobile ? '120px' : '140px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '16/9',
                    background: '#000',
                    border: isSelected ? '2px solid #fff' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    flexShrink: 0
                  }}
                >
                  {vid ? (
                    <img
                      src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                      alt={item.video.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.3)'
                    }}>
                      <Play size={18} />
                    </div>
                  )}

                  {/* Watched check */}
                  {isWatched && (
                    <div style={{
                      position: 'absolute',
                      top: '0.3rem',
                      right: '0.3rem',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={10} color="#000" strokeWidth={3} />
                    </div>
                  )}

                  {/* Title gradient bottom */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '0.3rem 0.5rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    fontSize: '0.65rem',
                    color: '#fff',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.video?.title}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .cvw-cat-row::-webkit-scrollbar,
        .cvw-gallery::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
