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
import { Play, ChevronDown, FileText, Library, Video } from 'lucide-react'
import clientVideoService from '../../modules/videos/ClientVideoService'
import videoService from '../../modules/videos/VideoService'
import fileService from '../../modules/videos/FileService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail } from '../../modules/videos/utils/youtubeHelpers'
import { zetVideoBalkHoogte, VIDEO_BALK } from './videoBalkHoogte'

// De twee knoppen op de balk: kaal en wit, zoals overal.
const balkKnop = {
  position: 'relative', flexShrink: 0,
  width: 32, height: 32, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Hoe lang na binnenkomst de eerste verschijnt, hoe lang hij blijft staan, en
// hoe lang het daarna stil is voor de volgende.
const WACHT_EERSTE_MS = 6000
const ZICHTBAAR_MS = 16000
const PAUZE_MS = 3 * 60 * 1000

export default function VideoTeaser({
  client, isMobile = false, onderMarge = 70, vast = false, pagina = 'home',
  onBibliotheek = null,
}) {
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)      // schuift hij in beeld?
  const [speler, setSpeler] = useState(null)   // welke video speelt
  // Op home blijft hij staan; heb je hem daar naar beneden geduwd, dan blijft
  // hij weg tot de volgende keer dat je de app opent. Bewust niet bewaard:
  // een video die je wegklikt hoort niet voorgoed te verdwijnen.
  const [dicht, setDicht] = useState(false)
  // Heb je hem zelf teruggehaald, dan blijft hij staan tot je hem weer
  // wegduwt. Zonder dit zette het tijdslot van hieronder hem meteen weer dicht
  // en leek het knopje kapot.
  const [handmatig, setHandmatig] = useState(false)
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
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (dicht || speler || items.length === 0) { setOpen(false); return }
    // Op home, of nadat je hem zelf hebt opengeklikt: gewoon laten staan.
    if (vast || handmatig) { setOpen(true); return }

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
  }, [items.length, speler, vast, dicht, handmatig])

  // Het knopje staat er zodra de balk niet open is — ook als hij vanzelf is
  // ingezakt. Anders had je na twintig seconden geen enkele manier meer om de
  // video terug te halen.
  const knopZichtbaar = items.length > 0 && !open && !speler

  // Doorgeven wat we onderin innemen, zodat de zwevende knoppen meeschuiven.
  useEffect(() => {
    zetVideoBalkHoogte(
      items.length === 0 ? VIDEO_BALK.weg
        : open ? VIDEO_BALK.open
        : VIDEO_BALK.knop
    )
    return () => zetVideoBalkHoogte(VIDEO_BALK.weg)
  }, [items.length, open])

  if (items.length === 0) return null

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
          // Schuift van onder de balk vandaan omhoog, en zakt er weer achter.
          // Iets kleiner terwijl hij zakt: dat leest als wegschuiven ónder de
          // balk in plaats van er recht achter verdwijnen.
          transform: isMobile
            ? (open ? 'translateY(0) scale(1)' : 'translateY(115%) scale(0.96)')
            : `translateX(-50%) ${open ? 'translateY(0) scale(1)' : 'translateY(115%) scale(0.96)'}`,
          transformOrigin: 'bottom center',
          width: isMobile ? 'auto' : 'min(680px, calc(100vw - 32px))',
          opacity: open ? 1 : 0,
          transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.26s ease',
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

        {onBibliotheek && (
          <button
            onClick={onBibliotheek}
            title={`Bibliotheek — ${items.length} voor deze pagina`}
            aria-label={`Bibliotheek, ${items.length} voor deze pagina`}
            style={{ ...balkKnop, width: 38, height: 38 }}
          >
            <Library size={22} strokeWidth={2.4} />
            {/* Witte bol met hoeveel er voor deze pagina klaarstaat. */}
            {items.length > 0 && (
              <span style={{
                position: 'absolute', top: -1, right: -1,
                minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: '#fff', color: '#0a0a0a',
                fontSize: '0.56rem', fontWeight: 900, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
              }}>
                {items.length > 99 ? '99+' : items.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => { setHandmatig(false); setDicht(true); setOpen(false) }}
          title="Wegschuiven"
          aria-label="Wegschuiven"
          style={{ ...balkKnop, marginRight: 4 }}
        >
          <ChevronDown size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Is de balk weg — weggeklikt of vanzelf ingezakt — dan blijft dit
          knopje staan, rechts boven de onderbalk. Het komt
          omhoog zodra de balk eronder verdwijnt en zakt er weer in als je hem
          terughaalt — vandaar de vertraging op de ene en niet op de andere. */}
      <button
        onClick={() => { setDicht(false); setHandmatig(true); setOpen(true) }}
        title="Video van je coach"
        aria-label="Video van je coach"
        style={{
          position: 'fixed',
          bottom: onderMarge + 6,
          right: isMobile ? 14 : 'calc(50% - min(340px, 50vw - 16px) + 14px)',
          zIndex: 100,
          width: 40, height: 40, padding: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
          transform: knopZichtbaar ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.6)',
          opacity: knopZichtbaar ? 1 : 0,
          pointerEvents: knopZichtbaar ? 'auto' : 'none',
          transition: knopZichtbaar
            ? 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1) 0.16s, opacity 0.22s ease 0.16s'
            : 'transform 0.22s ease, opacity 0.16s ease',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Video size={18} strokeWidth={2.6} />
      </button>

      {speler && (
        <VideoPlayerModal
          item={speler}
          onClose={() => { setSpeler(null); if (!vast) setOpen(false) }}
        />
      )}
    </>
  )
}
