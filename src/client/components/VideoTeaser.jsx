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
    // mqdefault is 320x180, dus echt 16:9. hqdefault is 480x360 en heeft bij
    // een breedbeeldvideo zwarte balken boven en onder ingebakken; die werden
    // in een lage balk mee uitvergroot.
    : ((vId ? getYouTubeThumbnail(vId, 'mqdefault') : null) || huidig?.item?.video?.thumbnail_url || null)
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
          overflow: 'hidden',
          display: 'flex', alignItems: 'center',
          // Hoger dan een regel tekst nodig heeft: een 16:9-beeld in een lage
          // balk wordt anders tot een uitsnede van het midden.
          minHeight: 70,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 14px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* De thumbnail vult de linkerhelft en loopt naar rechts dood in het
            zwart van de balk; de tekst ligt er half overheen. Zelfde truc als
            de koppen elders in de app — het beeld hoort bij de tekst in plaats
            van ernaast te staan. */}
        {thumb && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '42%',
            backgroundImage: `url(${thumb})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.2) 14%, rgba(10,10,10,0.78) 36%, rgba(10,10,10,0.97) 52%, rgba(10,10,10,1) 100%)',
        }} />

        <button
          onClick={openHuidig}
          style={{
            position: 'relative', flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            paddingLeft: thumb ? '21%' : '0.8rem',
            paddingRight: '0.4rem', paddingTop: 8, paddingBottom: 8,
            background: 'transparent', border: 'none', textAlign: 'left',
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isBestand
              ? <FileText size={13} color="#fff" strokeWidth={2.6} />
              : <Play size={12} color="#fff" fill="#fff" strokeWidth={0} style={{ marginLeft: 1 }} />}
          </span>

          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'block',
              fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 2,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {isBestand ? 'Van je coach · PDF' : 'Van je coach'}
            </span>
            <span style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 1px 8px rgba(0,0,0,0.95)',
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
            position: 'relative',
            flexShrink: 0, width: 32, height: 32, padding: 0, marginRight: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
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
