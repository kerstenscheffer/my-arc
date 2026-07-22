// src/modules/videos/PageVideoWidget.jsx
// 🎯 v3.1 - Netflix-style + fullscreen modal + shorts 9:16
// FIX: onWatched reload verwijderd (veroorzaakte infinite open/close loop)

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Play, X, Video, CheckCircle2, ChevronLeft, GraduationCap, Eye } from 'lucide-react'
import videoService from './VideoService'
import PageFilesBlock from './PageFilesBlock'

const GREEN = '#10b981'

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

const isYouTubeShort = (url) => {
  if (!url) return false
  return /youtube\.com\/shorts\//.test(url) || /m\.youtube\.com\/shorts\//.test(url)
}

export default function PageVideoWidget({ client, db, pageContext = 'home', open: openProp, onOpenChange, onCountChange }) {
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [videos, setVideos] = useState([])
  const [filesCount, setFilesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const isOpen = controlled ? openProp : isOpenInternal
  const setIsOpen = (val) => {
    const next = typeof val === 'function' ? val(isOpen) : val
    if (controlled) onOpenChange(next); else setIsOpenInternal(next)
  }
  const [playingItem, setPlayingItem] = useState(null)
  // Track locally which items are marked viewed (om UI bij te werken ZONDER reload)
  const [viewedIds, setViewedIds] = useState(new Set())
  // Cursus waar de client op inzoomt (null = overzicht met alles)
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (client?.id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id, pageContext])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pageVideos, pageFiles] = await Promise.all([
        videoService.getVideosForPage(client.id, pageContext, {}, db),
        // Files-count via dezelfde service — als'm faalt blijft de widget
        // gewoon werken met alleen videos.
        (async () => {
          try {
            const m = await import('./FileService')
            const files = await m.default.listForPage(pageContext)
            return files
          } catch { return [] }
        })(),
      ])
      setVideos(pageVideos || [])
      setFilesCount((pageFiles || []).length)
    } catch (e) {
      console.error('Error loading page videos:', e)
      setVideos([])
      setFilesCount(0)
    } finally {
      setLoading(false)
    }
  }

  // ── Cursussen vs losse video's splitsen ──
  // Video's die via een cursus zijn toegewezen (context_data.course_id) worden
  // gegroepeerd onder hun cursus; de rest is "los".
  const coursesMap = {} // course_id -> { id, title, items: [] }
  const looseVideos = []
  videos.forEach(item => {
    const cid = item?.context_data?.course_id
    if (cid) {
      if (!coursesMap[cid]) coursesMap[cid] = { id: cid, title: item.context_data.course_title || 'Cursus', items: [] }
      coursesMap[cid].items.push(item)
    } else {
      looseVideos.push(item)
    }
  })
  const courseList = Object.values(coursesMap)
  // Sorteer cursus-video's op de opgeslagen volgorde (course_order).
  courseList.forEach(c => c.items.sort((a, b) => (a.context_data?.course_order ?? 0) - (b.context_data?.course_order ?? 0)))

  const activeCourse = selectedCourseId ? coursesMap[selectedCourseId] : null
  // Welke items tonen we als categorie-rijen? Bij inzoomen: alleen de cursus.
  // Anders: alleen de losse video's (cursussen krijgen eigen tegels).
  const itemsForCategories = activeCourse ? activeCourse.items : looseVideos

  // Group videos by category. We rely on the embedded video_category from
  // the JOIN in getVideosForPage — no separate categories call needed (that
  // used to break when client.trainer_id was missing or didn't match).
  const grouped = {}
  const categoryMap = {} // id -> { id, name, color, order_index }
  const uncategorized = []

  itemsForCategories.forEach(item => {
    const cat = item?.video?.video_category
    if (cat?.id) {
      if (!categoryMap[cat.id]) categoryMap[cat.id] = cat
      if (!grouped[cat.id]) grouped[cat.id] = []
      grouped[cat.id].push(item)
    } else {
      uncategorized.push(item)
    }
  })

  const orderedCategories = Object.values(categoryMap)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const hasContent = videos.length > 0 || filesCount > 0

  const handleClose = () => {
    setIsOpen(false)
    setPlayingItem(null)
    setSelectedCourseId(null)
  }

  // Live count voor sidebar-badge — aantal nog niet bekeken videos
  useEffect(() => {
    if (typeof onCountChange === 'function') {
      const unseen = videos.filter(v => !viewedIds.has(v.id)).length
      onCountChange(unseen)
    }
  }, [videos, viewedIds, onCountChange])

  // FIX: alleen locally markeren als viewed (geen reload die loop veroorzaakt)
  const handleVideoWatched = (itemId) => {
    setViewedIds(prev => new Set([...prev, itemId]))
  }

  // Client heeft de video afgekeken (auto na afloop óf via de "Video bekeken"-knop):
  // markeer completed in de assignment én stuur de coach een notificatie.
  const handleVideoCompleted = async (item) => {
    if (!item) return
    // 1) Completed markeren — alleen bij toegewezen video's (default-video's hebben geen assignment_id)
    try {
      if (item.assignment_id) await videoService.markAsCompleted(item.assignment_id, null)
    } catch (e) { console.error('markAsCompleted failed:', e) }
    // 2) Lokaal als bekeken tonen (badge-count klopt)
    setViewedIds(prev => new Set([...prev, item.id]))
    // 3) Coach-notificatie via coach_notifications (zelfde vorm als check-in/intake)
    try {
      // RLS-policy "Clients can notify their coach" checkt op trainer_id, dus die
      // eerst — anders wordt de insert geweigerd als coach_id afwijkt.
      const coachId = client?.trainer_id || client?.coach_id
      if (coachId) {
        await db.supabase.from('coach_notifications').insert([{
          coach_id: coachId,
          client_id: client.id,
          type: 'video_watched',
          priority: 'normal',
          title: 'Video bekeken',
          message: `${client.first_name || client.name || 'Een client'} heeft "${item.video?.title || 'een video'}" bekeken`,
          read_status: false,
        }])
      }
    } catch (e) { console.error('coach-notificatie video mislukt:', e) }
  }

  if (loading || !hasContent) return null

  return (
    <>
      {/* FLOATING BADGE — alleen in uncontrolled mode (geen sidebar) */}
      {!controlled && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '160px',
            right: 0,
            zIndex: 997,
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            background: 'rgba(10, 10, 10, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: 'none',
            borderRadius: '10px 0 0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Video size={16} color="rgba(255, 255, 255, 0.5)" />
          <span style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            background: GREEN,
            color: '#000',
            fontSize: '0.55rem',
            fontWeight: '800',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {videos.length}
          </span>
        </button>
      )}

      {/* MOBILE BACKDROP — onder sidebar, boven alles anders */}
      {isMobile && isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 199
          }}
        />
      )}

      {/* SIDEBAR — boven header (header is z-index 100) */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? '0' : '-100%',
        width: isMobile ? '85%' : '380px',
        maxWidth: '380px',
        height: '100vh',
        background: '#0a0a0a',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transform: 'translateZ(0)'
      }}>
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <div style={{
              fontSize: '0.5rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.15rem'
            }}>
              Coach Video's
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              {videos.length} video{videos.length !== 1 ? "'s" : ''}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div
          className="pvw-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Ingezoomd op een cursus → terug-knop bovenaan */}
          {activeCourse && (
            <button
              onClick={() => setSelectedCourseId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
                padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.125rem',
                background: 'rgba(16,185,129,0.06)', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: GREEN, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                textAlign: 'left', touchAction: 'manipulation'
              }}
            >
              <ChevronLeft size={15} /> Terug naar alle video's
            </button>
          )}

          {/* Overzicht (niet ingezoomd) → cursus-tegels bovenaan */}
          {!activeCourse && courseList.length > 0 && (
            <div style={{ padding: isMobile ? '0.75rem 0' : '0.875rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ padding: isMobile ? '0 1rem 0.5rem' : '0 1.125rem 0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={13} color={GREEN} />
                <div style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cursussen</div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>· {courseList.length}</div>
              </div>
              <div className="pvw-row" style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0 1rem' : '0 1.125rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {courseList.map(course => {
                  const watched = course.items.filter(it => viewedIds.has(it.id) || it.status === 'completed' || it.viewed_at).length
                  const thumbItem = course.items[0]
                  const vid = thumbItem?.video
                  const ytId = vid ? extractYouTubeId(vid.video_url) : null
                  const thumb = vid?.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)
                  return (
                    <button key={course.id} onClick={() => setSelectedCourseId(course.id)} style={{
                      flexShrink: 0, width: isMobile ? '160px' : '180px', background: '#111',
                      border: `1px solid ${GREEN}33`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      padding: 0, textAlign: 'left', touchAction: 'manipulation'
                    }}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                        {thumb && <img src={thumb} alt={course.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />}
                        <div style={{ position: 'absolute', top: '0.3rem', left: '0.3rem', display: 'flex', alignItems: 'center', gap: 3, padding: '0.15rem 0.4rem', background: GREEN, borderRadius: 4, fontSize: '0.5rem', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <GraduationCap size={10} /> Cursus
                        </div>
                      </div>
                      <div style={{ padding: isMobile ? '0.4rem 0.5rem 0.5rem' : '0.5rem 0.6rem 0.625rem' }}>
                        <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.2rem', minHeight: '1.9rem' }}>{course.title}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{watched}/{course.items.length} bekeken</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <style>{`.pvw-row::-webkit-scrollbar { display: none; }`}</style>
            </div>
          )}

          {orderedCategories.map(cat => (
            <CategoryRow
              key={cat.id}
              title={cat.name}
              color={cat.color || GREEN}
              items={grouped[cat.id]}
              viewedIds={viewedIds}
              onSelect={setPlayingItem}
              isMobile={isMobile}
            />
          ))}

          {uncategorized.length > 0 && (
            <CategoryRow
              title={activeCourse ? activeCourse.title : "Overige video's"}
              color="rgba(255, 255, 255, 0.3)"
              items={uncategorized}
              viewedIds={viewedIds}
              onSelect={setPlayingItem}
              isMobile={isMobile}
              isUncategorized
            />
          )}

          {/* Files-blok onderaan — toont PDFs die de coach aan deze page
              heeft toegewezen (coach_files.default_pages). Verbergt zichzelf
              automatisch wanneer er niks is. Tijdens cursus-inzoom verbergen
              zodat je alleen de cursus-inhoud ziet. */}
          {!activeCourse && (
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.125rem' }}>
              <PageFilesBlock pageContext={pageContext} isMobile={isMobile} />
            </div>
          )}

          <div style={{ height: '1.5rem' }} />
        </div>
      </div>

      {/* FULLSCREEN PLAYER */}
      {playingItem && (
        <FullscreenPlayer
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          onWatched={handleVideoWatched}
          onCompleted={handleVideoCompleted}
        />
      )}

      <style>{`.pvw-body::-webkit-scrollbar { display: none; }`}</style>
    </>
  )
}

// ============================================
// CATEGORY ROW
// ============================================
function CategoryRow({ title, color, items, viewedIds, onSelect, isMobile, isUncategorized }) {
  return (
    <div style={{
      padding: isMobile ? '0.75rem 0' : '0.875rem 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      <div style={{
        padding: isMobile ? '0 1rem 0.5rem' : '0 1.125rem 0.625rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '3px',
          height: '12px',
          background: color,
          borderRadius: '2px',
          opacity: isUncategorized ? 0.5 : 1
        }} />
        <div style={{
          fontSize: isMobile ? '0.62rem' : '0.68rem',
          fontWeight: '800',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '0.55rem',
          color: 'rgba(255, 255, 255, 0.25)',
          fontWeight: '700'
        }}>
          · {items.length}
        </div>
      </div>

      <div
        className="pvw-row"
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: isMobile ? '0 1rem' : '0 1.125rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}
      >
        {items.map((item, idx) => (
          <VideoCard
            key={item.id || idx}
            item={item}
            isLocallyViewed={viewedIds.has(item.id)}
            onClick={() => onSelect(item)}
            isMobile={isMobile}
          />
        ))}
      </div>

      <style>{`.pvw-row::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

// ============================================
// VIDEO CARD
// ============================================
function VideoCard({ item, isLocallyViewed, onClick, isMobile }) {
  const video = item.video
  if (!video) return null

  const videoId = extractYouTubeId(video.video_url)
  const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
  const isWatched = isLocallyViewed || item.status === 'completed' || !!item.viewed_at
  const isShort = isYouTubeShort(video.video_url)

  const cardWidth = isMobile ? '160px' : '180px'

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: cardWidth,
        background: '#111',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transform: 'translateZ(0)'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#000',
        overflow: 'hidden'
      }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              if (videoId) {
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
              }
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.15)'
          }}>
            <Video size={22} />
          </div>
        )}

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {isWatched && (
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            right: '0.3rem',
            background: GREEN,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={11} color="#000" strokeWidth={3} />
          </div>
        )}

        {isShort && (
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            left: '0.3rem',
            padding: '0.15rem 0.35rem',
            background: 'rgba(0, 0, 0, 0.75)',
            borderRadius: '3px',
            fontSize: '0.5rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Short
          </div>
        )}
      </div>

      <div style={{
        padding: isMobile ? '0.4rem 0.5rem 0.5rem' : '0.5rem 0.6rem 0.625rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '0.2rem',
          minHeight: '1.8rem'
        }}>
          {video.title}
        </div>
        {video.description && (
          <div style={{
            fontSize: '0.6rem',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {video.description}
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================
// FULLSCREEN PLAYER
// FIX: onWatched callback fires maar triggert GEEN reload meer in parent
// ============================================
function FullscreenPlayer({ item, onClose, onWatched, onCompleted }) {
  const YT_PLAYER_ID = 'pvw-yt-player'
  const markedRef = useRef(false)
  const isMobile = window.innerWidth <= 768

  const video = item?.video
  const videoId = extractYouTubeId(video?.video_url)
  const isShort = isYouTubeShort(video?.video_url)

  // "Bekeken"-status. Al completed bij openen → knop meteen als bevestigd tonen
  // en geen dubbele melding sturen (ook niet als de video opnieuw eindigt).
  const alreadyDone = item?.status === 'completed' || item?.completed
  const [watched, setWatched] = useState(!!alreadyDone)
  const completedRef = useRef(!!alreadyDone)
  const markWatched = () => {
    if (completedRef.current) return
    completedRef.current = true
    setWatched(true)
    onCompleted?.(item)
  }

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  // Mark viewed once on open
  useEffect(() => {
    if (!item?.assignment_id || markedRef.current) return
    markedRef.current = true
    videoService.markAsViewed(item.assignment_id)
      .then((result) => {
        if (result?.success && onWatched) {
          // Alleen local state updaten — GEEN reload van alle videos
          onWatched(item.id)
        }
      })
      .catch(e => console.error('markAsViewed failed:', e))
  }, [item?.assignment_id, item?.id, onWatched])

  // Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // YouTube IFrame API: detecteer automatisch wanneer de video is afgelopen
  // (onStateChange data === 0 = ended). De iframe heeft enablejsapi=1 + een id,
  // zodat YT.Player 'm kan wrappen. Bij afloop → markWatched() (idempotent).
  useEffect(() => {
    if (!videoId) return
    let player = null
    let cancelled = false
    let poll = null
    const ensureYT = () => new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve(window.YT)
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      poll = setInterval(() => {
        if (window.YT && window.YT.Player) { clearInterval(poll); poll = null; resolve(window.YT) }
      }, 150)
    })
    ensureYT().then((YT) => {
      if (cancelled || !document.getElementById(YT_PLAYER_ID)) return
      try {
        player = new YT.Player(YT_PLAYER_ID, {
          events: { onStateChange: (e) => { if (e?.data === 0) markWatched() } },
        })
      } catch (err) { console.warn('YT player init failed:', err?.message) }
    })
    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
      try { player && player.destroy && player.destroy() } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  if (!video) return null

  const playerStyle = isShort
    ? {
        height: isMobile ? '85vh' : '85vh',
        aspectRatio: '9 / 16',
        maxWidth: '100%'
      }
    : {
        width: '100%',
        maxWidth: '1000px',
        aspectRatio: '16 / 9'
      }

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: isMobile ? '0.75rem' : '1.5rem',
          right: isMobile ? '0.75rem' : '1.5rem',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10002,
          transition: 'background 0.15s ease'
        }}
      >
        <X size={22} />
      </button>

      {!isMobile && !isShort && (
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          right: '5rem',
          zIndex: 10001
        }}>
          <div style={{
            fontSize: '0.45rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.25rem'
          }}>
            Nu bekijken
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em'
          }}>
            {video.title}
          </div>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...playerStyle,
          background: '#000',
          borderRadius: isMobile ? '8px' : '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {embedUrl ? (
          <iframe
            id={YT_PLAYER_ID}
            src={embedUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            Video niet beschikbaar
          </div>
        )}
      </div>

      {isMobile && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '500px',
            marginTop: '1rem',
            padding: '0 0.25rem'
          }}
        >
          <div style={{
            fontSize: '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '0.3rem'
          }}>
            {video.title}
          </div>
          {video.description && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5
            }}>
              {video.description}
            </div>
          )}
        </div>
      )}

      {!isMobile && isShort && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '400px',
            marginTop: '1rem',
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '1rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '0.3rem'
          }}>
            {video.title}
          </div>
          {video.description && (
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5
            }}>
              {video.description}
            </div>
          )}
        </div>
      )}

      {/* "Video bekeken"-knop — client bevestigt (of auto na afloop) dat'ie de
          video heeft gezien. markWatched() is idempotent, dus dubbel klikken of
          auto+klik stuurt maar één coach-melding. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 500 }}
      >
        <button
          onClick={markWatched}
          disabled={watched}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.2rem', borderRadius: 10,
            background: watched ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #FFD700, #e8a800)',
            border: watched ? '1px solid rgba(16,185,129,0.4)' : 'none',
            color: watched ? '#10b981' : '#000',
            fontSize: '0.82rem', fontWeight: 800,
            cursor: watched ? 'default' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {watched
            ? <><CheckCircle2 size={16} /> Bekeken — je coach is op de hoogte</>
            : <><Eye size={16} /> Video bekeken</>}
        </button>
      </div>
    </div>,
    document.body
  )
}
