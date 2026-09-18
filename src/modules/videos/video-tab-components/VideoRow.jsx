// src/modules/videos/video-tab-components/VideoRow.jsx
//
// Eén video = één regel. Geen kaart met vier knoppen, maar een omslagje, de
// titel, en in gewone taal voor wie de video zichtbaar is. Eén primaire actie
// (toewijzen); bewerken, zichtbaarheid en verwijderen zitten onder het menu.
import { useEffect, useRef, useState } from 'react'
import { Play, MoreHorizontal, Users, Pencil, Trash2 } from 'lucide-react'
import videoService from '../VideoService'

const PAGINA_NAAM = {
  home: 'Home', workout: 'Workout', meal: 'Meal',
  boodschappen: 'Boodschappen', tracking: 'Tracking',
  calls: 'Calls', profile: 'Profiel',
}

// In gewone taal: wie krijgt deze video te zien?
function zichtbaarheidTekst(video, aantalKlanten) {
  const paginas = video?.default_pages || []
  if (paginas.length > 0) {
    return `Iedereen · ${paginas.map(p => PAGINA_NAAM[p] || p).join(', ')}`
  }
  if (aantalKlanten > 0) {
    return aantalKlanten === 1 ? '1 klant' : `${aantalKlanten} klanten`
  }
  return 'Nog niet gedeeld'
}

export default function VideoRow({
  video,
  categorieNaam,
  aantalKlanten = 0,
  onAssign,
  onManage,
  onEdit,
  onDelete,
  isMobile,
  ingesprongen = false,
  // 'regel' = omslagje links, titel ernaast, knoppen rechts (smal scherm).
  // 'kaart' = omslag boven, tekst en knoppen eronder (in een raster).
  vorm = 'regel',
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const sluit = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', sluit)
    return () => document.removeEventListener('mousedown', sluit)
  }, [menuOpen])

  const thumb = videoService.getThumbnailUrl(video)
  const gedeeld = (video.default_pages || []).length > 0 || aantalKlanten > 0
  const breedte = isMobile ? 76 : 96

  const menuItem = {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    width: '100%', padding: '0.6rem 0.8rem',
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 700,
    cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
  }

  // ── Kaart: omslag boven, tekst eronder, knoppen onderaan ──────────────
  // Over de volle breedte stond de titel links en de knoppen een halve meter
  // verderop; in een raster hoort alles van één video bij elkaar.
  if (vorm === 'kaart') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div
          onClick={() => video.video_url && window.open(video.video_url, '_blank')}
          title="Bekijk de video"
          style={{
            position: 'relative', width: '100%', aspectRatio: '16 / 9',
            background: '#000', cursor: video.video_url ? 'pointer' : 'default',
          }}
        >
          {thumb && (
            <img
              src={thumb} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              onError={(e) => {
                const id = videoService.extractYouTubeId(video.video_url)
                if (id && !e.target.src.includes('hqdefault')) {
                  e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
                } else {
                  e.currentTarget.style.display = 'none'
                }
              }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={20} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
          </div>
        </div>

        <div style={{ padding: '0.7rem 0.8rem 0.5rem', flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
            lineHeight: 1.25,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {video.title}
          </div>
          <div style={{
            marginTop: 4,
            fontSize: '0.68rem', fontWeight: 700,
            color: gedeeld ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.32)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {zichtbaarheidTekst(video, aantalKlanten)}
            {categorieNaam && ` · ${categorieNaam}`}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 0.8rem 0.7rem',
        }}>
          <button
            onClick={onAssign}
            style={{
              flex: 1, minHeight: 32, padding: '0 0.7rem',
              background: '#fff', border: 'none', borderRadius: 8,
              color: '#000', fontSize: '0.72rem', fontWeight: 900,
              cursor: 'pointer', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Delen
          </button>
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              title="Meer"
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, bottom: 'calc(100% + 6px)', zIndex: 30,
                minWidth: 200, padding: '0.25rem 0',
                background: 'rgba(10,10,10,0.96)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
              }}>
                <button style={menuItem} onClick={() => { setMenuOpen(false); onManage() }}>
                  <Users size={14} /> Klanten beheren
                </button>
                <button style={menuItem} onClick={() => { setMenuOpen(false); onEdit() }}>
                  <Pencil size={14} /> Bewerken
                </button>
                <button
                  style={{ ...menuItem, color: '#ef4444' }}
                  onClick={() => { setMenuOpen(false); onDelete() }}
                >
                  <Trash2 size={14} /> Verwijderen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.6rem' : '0.85rem',
      padding: isMobile ? '0.55rem 0.25rem' : '0.6rem 0.5rem',
      paddingLeft: ingesprongen ? (isMobile ? '1.1rem' : '1.75rem') : undefined,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Omslag — klik opent de video */}
      <div
        onClick={() => video.video_url && window.open(video.video_url, '_blank')}
        title="Bekijk de video"
        style={{
          position: 'relative', flexShrink: 0,
          width: breedte, aspectRatio: '16 / 9',
          borderRadius: 6, overflow: 'hidden', background: '#000',
          cursor: video.video_url ? 'pointer' : 'default',
        }}
      >
        {thumb && (
          <img
            src={thumb} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
            onError={(e) => {
              const id = videoService.extractYouTubeId(video.video_url)
              if (id && !e.target.src.includes('hqdefault')) {
                e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
              } else {
                e.currentTarget.style.display = 'none'
              }
            }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={13} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }} />
        </div>
      </div>

      {/* Titel + wie het ziet */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {video.title}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          marginTop: '0.2rem',
          fontSize: '0.72rem', fontWeight: 600,
          color: gedeeld ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.38)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span>{zichtbaarheidTekst(video, aantalKlanten)}</span>
          {categorieNaam && !isMobile && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ opacity: 0.8 }}>{categorieNaam}</span>
            </>
          )}
        </div>
      </div>

      {/* Eén primaire actie, de rest in het menu */}
      <button
        onClick={onAssign}
        style={{
          flexShrink: 0,
          minHeight: 34, padding: isMobile ? '0 0.7rem' : '0 0.9rem',
          background: '#fff', border: 'none', borderRadius: 8,
          color: '#000', fontSize: '0.74rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Delen
      </button>

      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          title="Meer"
          style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 30,
            minWidth: 200, padding: '0.25rem 0',
            background: 'rgba(10,10,10,0.96)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
          }}>
            <button style={menuItem} onClick={() => { setMenuOpen(false); onManage() }}>
              <Users size={14} /> Klanten beheren
            </button>
            <button style={menuItem} onClick={() => { setMenuOpen(false); onEdit() }}>
              <Pencil size={14} /> Bewerken
            </button>
            <button
              style={{ ...menuItem, color: '#ef4444' }}
              onClick={() => { setMenuOpen(false); onDelete() }}
            >
              <Trash2 size={14} /> Verwijderen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
