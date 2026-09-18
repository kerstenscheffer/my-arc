// src/client/components/VideoTeaser.jsx
//
// Een video die af en toe boven de onderbalk omhoog komt, even blijft staan en
// weer inzakt. Zoals een reclameblokje in een app, maar dan van je eigen coach.
//
// Waarom niet gewoon de slider op home: die zag je alleen op één pagina, en
// alleen als je ver genoeg scrolde. Dit haalt de video naar je toe terwijl je
// in je maaltijdplan of je training zit — precies waar zijn uitleg over gaat.
// Prijs daarvan is dat hij zich opdringt, dus: hij komt niet meteen, blijft
// kort, en met het kruisje ben je er voor deze sessie vanaf.
//
// De tijden staan bewust als losse constanten; dit is het soort ding waar je
// pas na een week gebruik iets zinnigs over kunt zeggen.

import { useEffect, useRef, useState } from 'react'
import { Play, X, ChevronDown, FileText } from 'lucide-react'
import clientVideoService from '../../modules/videos/ClientVideoService'
import videoService from '../../modules/videos/VideoService'
import fileService from '../../modules/videos/FileService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail } from '../../modules/videos/utils/youtubeHelpers'

// Hoe lang na binnenkomst de eerste verschijnt, hoe lang hij blijft staan, en
// hoe lang het daarna stil is voor de volgende.
const WACHT_EERSTE_MS = 6000
const ZICHTBAAR_MS = 16000
const PAUZE_MS = 3 * 60 * 1000

export default function VideoTeaser({ client, isMobile = false, onderMarge = 86, vast = false, pagina = 'home' }) {
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)      // schuift hij in beeld?
  const [speler, setSpeler] = useState(null)   // welke video speelt
  const [weg, setWeg] = useState(false)        // weggeklikt voor deze sessie
  // Op home blijft hij staan; heb je hem daar naar beneden geduwd, dan blijft
  // hij weg tot de volgende keer dat je de app opent. Bewust niet bewaard:
  // een video die je wegklikt hoort niet voorgoed te verdwijnen.
  const [dicht, setDicht] = useState(false)
  const timers = useRef([])

  // Wat er langskomt hangt af van waar je bent. Op home de video's die de
  // coach in de slider heeft gezet — algemene dingen. Op een pagina met een
  // onderwerp (maaltijden, training) wat áán die pagina hangt: de video's die
  // erop staan én de PDF's, want die horen bij dezelfde uitleg.
  useEffect(() => {
    if (!client?.id) return
    let gestopt = false
    setIndex(0)
    ;(async () => {
      try {
        if (vast) {
          const coachId = client.coach_id || client.trainer_id
          const vids = await clientVideoService.getSliderVideos(coachId)
          if (!gestopt) setItems((vids || []).map(v => ({ soort: 'video', sleutel: v.id, item: v, titel: v.video?.title })))
          return
        }
        const [vids, files] = await Promise.all([
          videoService.getVideosForPage(client.id, pagina),
          fileService.listForPage(pagina).catch(() => []),
        ])
        if (gestopt) return
        setItems([
          ...(vids || []).map(v => ({ soort: 'video', sleutel: v.id, item: v, titel: v.video?.title })),
          ...(files || []).map(f => ({ soort: 'bestand', sleutel: `f-${f.id}`, item: f, titel: f.title })),
        ])
      } catch (e) {
        console.error('Video-teaser laden mislukt:', e)
        if (!gestopt) setItems([])
      }
    })()
    return () => { gestopt = true }
  }, [client?.id, client?.coach_id, client?.trainer_id, pagina, vast])

  // Twee gedragingen. Op home staat hij gewoon open: daar ben je aan het
  // rondkijken, dus een video die blijft staan is een aanbod en geen
  // onderbreking. Op de andere pagina's ben je ergens mee bezig; daar komt hij
  // even langs en gaat weer weg.
  useEffect(() => {
    if (weg || speler || items.length === 0) return
    if (vast) {
      timers.current.forEach(clearTimeout)
      timers.current = []
      setOpen(!dicht)
      return
    }
    setOpen(false)
    const plan = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }

    const toon = () => {
      setOpen(true)
      plan(() => {
        setOpen(false)
        plan(() => {
          setIndex(i => (i + 1) % items.length)
          toon()
        }, PAUZE_MS)
      }, ZICHTBAAR_MS)
    }

    plan(toon, WACHT_EERSTE_MS)
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [items.length, weg, speler, vast, dicht])

  if (weg || items.length === 0) return null

  const huidig = items[index] || items[0]
  const isBestand = huidig?.soort === 'bestand'
  const vId = isBestand ? null : extractYouTubeId(huidig?.item?.video?.video_url)
  const thumb = isBestand
    ? (huidig?.item?.preview_url || null)
    : ((vId ? getYouTubeThumbnail(vId, 'hqdefault') : null) || huidig?.item?.video?.thumbnail_url || null)
  const openHuidig = () => {
    if (isBestand) {
      window.open(huidig.item.file_url, '_blank', 'noopener')
      return
    }
    setSpeler(huidig.item)
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: onderMarge,
          left: isMobile ? 10 : '50%',
          right: isMobile ? 10 : 'auto',
          transform: isMobile
            ? (open ? 'translateY(0)' : 'translateY(140%)')
            : `translateX(-50%) ${open ? 'translateY(0)' : 'translateY(140%)'}`,
          width: isMobile ? 'auto' : 'min(680px, calc(100vw - 32px))',
          opacity: open ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 6,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 14px 40px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={openHuidig}
          style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            position: 'relative', flexShrink: 0,
            width: 74, height: 44, borderRadius: 10, overflow: 'hidden',
            background: thumb ? `url(${thumb}) center/cover` : 'rgba(255,255,255,0.06)',
            display: 'block',
          }}>
            <span style={{
              position: 'absolute', inset: 0, background: thumb ? 'rgba(0,0,0,0.35)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isBestand
                ? <FileText size={16} color="#fff" strokeWidth={2.4} />
                : <Play size={16} color="#fff" fill="#fff" strokeWidth={0} />}
            </span>
          </span>

          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'block',
              fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 2,
            }}>
              {isBestand ? 'Van je coach · PDF' : 'Van je coach'}
            </span>
            <span style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {huidig?.titel || (isBestand ? 'Document' : 'Nieuwe video')}
            </span>
          </span>
        </button>

        <button
          onClick={() => {
            setOpen(false)
            if (vast) setDicht(true); else setWeg(true)
          }}
          title={vast ? 'Wegschuiven' : 'Niet meer tonen'}
          aria-label={vast ? 'Wegschuiven' : 'Niet meer tonen'}
          style={{
            flexShrink: 0, width: 28, height: 28, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {vast ? <ChevronDown size={17} strokeWidth={3} /> : <X size={15} strokeWidth={2.8} />}
        </button>
      </div>

      {speler && (
        <VideoPlayerModal
          item={speler}
          onClose={() => { setSpeler(null); if (!vast) setOpen(false) }}
        />
      )}
    </>
  )
}
