// src/client/components/BelangrijkeVideo.jsx
//
// Een video die de coach als belangrijk heeft gemarkeerd, ín de pagina waar
// hij over gaat. Niet de zwevende teaser: die komt langs en zakt weer weg, en
// een video die je moet zien mag je niet kunnen missen doordat je net aan het
// scrollen was.
//
// Hij staat er tot je bevestigt dat je hem gekeken hebt. Afspelen alleen is
// niet genoeg: je kunt een video openzetten, tien seconden kijken en weer
// sluiten, en dan is de boodschap niet aangekomen. Alleen "Ik heb 'm gezien"
// streept weg, en dat vraagt eerst nog een bevestiging midden in beeld.
// Daarna is hij weg van deze pagina en staat hij nog gewoon in je bibliotheek.
//
// Zelfde regel als in de overkoepelende herinnering (VideoReminderPopup); zou
// het hier losser zijn, dan is dat meteen de route eromheen.
//
// Zijn er meer, dan schuiven ze als slider: één video tegelijk, met stipjes en
// een teller. Onder elkaar werd het een muur van thumbnails die de rest van de
// pagina wegduwt, en dan scrol je er juist langs.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import videoService from '../../modules/videos/VideoService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { getThumbnailFromUrl } from '../../modules/videos/utils/youtubeHelpers'

// `compact`: een smalle regel in plaats van een kaart met grote thumbnail.
// Voor plekken waar de video tussen bestaande blokken in staat — op de
// maaltijdpagina tussen de dag en de macro's — en waar 190 pixels kaart de
// ringen van het scherm zou duwen.
export default function BelangrijkeVideo({ client, pagina, isMobile = false, compact = false }) {
  const [items, setItems] = useState([])
  const [speler, setSpeler] = useState(null)
  const [bezig, setBezig] = useState(null)   // video_id dat wordt afgevinkt
  const [idx, setIdx] = useState(0)          // welke video staat er voor
  const [bevestig, setBevestig] = useState(null)  // item waarvoor "echt gekeken?" openstaat
  const veeg = useRef(null)                  // begin-x van een veeg

  // Leegmaken vóór het ophalen, niet erna. Anders blijft de video van de vorige
  // pagina staan zolang de nieuwe query onderweg is — je switcht naar Workout,
  // ziet de maaltijd-video nog een tel staan en dan klapt hij weg. `weg` vangt
  // het omgekeerde af: twee snelle wissels waarbij het oude antwoord als
  // laatste binnenkomt en de verkeerde pagina zou vullen.
  useEffect(() => {
    let weg = false
    setItems([]); setIdx(0)
    if (!client?.id || !pagina) return undefined
    videoService.getBelangrijkeVideosVoorPagina(client.id, pagina)
      .then(lijst => { if (!weg) setItems(lijst || []) })
      .catch(e => { console.error('Belangrijke video laden mislukt:', e); if (!weg) setItems([]) })
    return () => { weg = true }
  }, [client?.id, pagina])

  const afvinken = async (item, via) => {
    setBevestig(null)
    setBezig(item.video_id)
    await videoService.markeerVideoGezien(client.id, item.video_id, via, item.assignment_id)
    setItems(prev => {
      const over = prev.filter(i => i.video_id !== item.video_id)
      // De volgende schuift door naar dezelfde plek; alleen bij de laatste
      // moeten we een stap terug, anders wijst de index naar niets.
      setIdx(i => Math.min(i, Math.max(0, over.length - 1)))
      return over
    })
    setBezig(null)
  }

  // Vegen op de thumbnail. Onder de 40 pixels is het een tik die net iets
  // schoof, niet een veeg — anders springt de slider bij elke aanraking.
  const veegStart = (e) => { veeg.current = e.touches?.[0]?.clientX ?? null }
  const veegEind = (e, totaal) => {
    const start = veeg.current
    veeg.current = null
    if (start == null || totaal < 2) return
    const eind = e.changedTouches?.[0]?.clientX
    if (eind == null) return
    const verschil = eind - start
    if (Math.abs(verschil) < 40) return
    setIdx(i => (verschil < 0 ? (i + 1) % totaal : (i - 1 + totaal) % totaal))
  }

  // De speler sluiten doet bewust niets. Wie hem heeft afgespeeld bevestigt
  // zelf via het vinkje dat hij hem ook echt heeft uitgekeken.
  const sluitSpeler = () => setSpeler(null)

  if (!items.length) return null

  const totaal = items.length
  const huidig = items[Math.min(idx, totaal - 1)]

  // Stipjes onder de kaart. Alleen zichtbaar bij meer dan één video — bij één
  // is een stipje alleen maar ruis.
  const stippen = totaal < 2 ? null : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8 }}>
      {items.map((it, i) => (
        <button
          key={it.video_id}
          onClick={() => setIdx(i)}
          aria-label={`Video ${i + 1} van ${totaal}`}
          style={{
            width: i === idx ? 18 : 6, height: 6, padding: 0, borderRadius: 999,
            background: i === idx ? '#fff' : 'rgba(255,255,255,0.25)',
            border: 'none', cursor: 'pointer', transition: 'width 0.2s ease, background 0.2s ease',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        />
      ))}
    </div>
  )

  const speler_ = speler && (
    <VideoPlayerModal
      item={{ id: speler.assignment_id, video: speler.video }}
      onClose={sluitSpeler}
    />
  )

  // Midden in beeld, boven alles heen. Twee volwaardige knoppen en geen klein
  // kruisje: "nee, later" is een echt antwoord, geen ontsnapping.
  const bevestiging = bevestig && createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483300,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.25rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 18, padding: isMobile ? '1.25rem 1.1rem' : '1.5rem 1.35rem',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em', lineHeight: 1.25, marginBottom: 6,
        }}>
          Heb je deze video echt gekeken?
        </div>
        <div style={{
          fontSize: isMobile ? '0.76rem' : '0.8rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, marginBottom: '1.1rem',
        }}>
          {bevestig.video?.title}
        </div>

        <button
          onClick={() => afvinken(bevestig, 'knop')}
          style={{
            width: '100%', minHeight: 48, marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#fff', border: 'none', borderRadius: 12,
            color: '#0a0a0a', fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={16} strokeWidth={3} />
          Ja, helemaal gekeken
        </button>

        <button
          onClick={() => setBevestig(null)}
          style={{
            width: '100%', minHeight: 48,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, color: 'rgba(255,255,255,0.65)',
            fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Nee, ik kijk hem later helemaal
        </button>
      </div>
    </div>,
    document.body
  )

  if (compact) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: isMobile ? '0.5rem 1rem 0' : '0.6rem 1.5rem 0',
      }}>
        {(() => {
          const item = huidig
          const v = item.video
          const thumb = v.thumbnail_url || getThumbnailFromUrl(v.video_url)
          return (
            <div key={item.video_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div
                onClick={() => setSpeler(item)}
                onTouchStart={veegStart}
                onTouchEnd={(e) => veegEind(e, totaal)}
                style={{
                  position: 'relative', flexShrink: 0,
                  width: isMobile ? 132 : 150, height: isMobile ? 76 : 86,
                  borderRadius: 10, overflow: 'hidden',
                  backgroundImage: thumb ? `url(${thumb})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  backgroundColor: '#1a1a1a', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: 34, height: 34, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                }}>
                  <Play size={16} fill="#0a0a0a" strokeWidth={0} style={{ marginLeft: 2 }} />
                </div>
              </div>

              <div onClick={() => setSpeler(item)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 3,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  Bekijk deze video!
                  {totaal > 1 && (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {idx + 1}/{totaal}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)', lineHeight: 1.25,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {v.title}
                </div>
              </div>

              {/* Doorbladeren zonder te vegen — op desktop is vegen geen optie. */}
              {totaal > 1 && (
                <button
                  onClick={() => setIdx(i => (i + 1) % totaal)}
                  title="Volgende video"
                  aria-label="Volgende video"
                  style={{
                    flexShrink: 0, width: 34, height: 34, padding: 0, borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              )}

              <button
                onClick={() => setBevestig(item)}
                disabled={bezig === item.video_id}
                title="Ik heb 'm gezien"
                aria-label="Ik heb 'm gezien"
                style={{
                  flexShrink: 0, width: 34, height: 34, padding: 0, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {bezig === item.video_id
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Check size={15} strokeWidth={3} />}
              </button>
            </div>
          )
        })()}
        {speler_}
        {bevestiging}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isMobile ? '0.6rem' : '0.75rem',
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      marginBottom: isMobile ? '1rem' : '1.25rem',
    }}>
      {(() => {
        const item = huidig
        const v = item.video
        const thumb = v.thumbnail_url || getThumbnailFromUrl(v.video_url)
        // Ruimte vrijhouden rechtsboven voor de teller, anders schuift een
        // lange titel eronderdoor.
        const titelRechts = totaal > 1 ? (isMobile ? 58 : 62) : (isMobile ? 12 : 14)
        return (
          <div
            key={item.video_id}
            style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              background: '#111',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div
              onClick={() => setSpeler(item)}
              onTouchStart={veegStart}
              onTouchEnd={(e) => veegEind(e, totaal)}
              style={{
                position: 'relative',
                height: isMobile ? 150 : 180,
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                backgroundImage: thumb ? `url(${thumb})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                backgroundColor: '#1a1a1a',
              }}
            >
              {/* Fade vanaf de bovenkant, want daar staat de titel nu. */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, #0a0a0a 0%, rgba(10,10,10,0.55) 40%, rgba(10,10,10,0.1) 100%)',
              }} />

              {/* Titel bovenaan in de video. */}
              <div style={{
                position: 'absolute', top: isMobile ? 10 : 12,
                left: isMobile ? 12 : 14, right: titelRechts,
              }}>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {v.title}
                </div>
                {v.description && (
                  <div style={{
                    fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.6)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                  }}>
                    {v.description}
                  </div>
                )}
              </div>

              {/* Teller rechtsboven, zodat meteen duidelijk is dat er meer is. */}
              {totaal > 1 && (
                <div style={{
                  position: 'absolute', top: isMobile ? 10 : 12, right: isMobile ? 12 : 14,
                  padding: '0.2rem 0.5rem', borderRadius: 999,
                  background: 'rgba(10,10,10,0.7)', color: '#fff',
                  fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                  backdropFilter: 'blur(4px)',
                }}>
                  {idx + 1}/{totaal}
                </div>
              )}

              {/* Speelknop midden op de thumbnail. */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: isMobile ? 46 : 52, height: isMobile ? 46 : 52, borderRadius: '50%',
                background: '#fff', color: '#0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 22px rgba(0,0,0,0.55)',
              }}>
                <Play size={isMobile ? 20 : 23} fill="#0a0a0a" strokeWidth={0} style={{ marginLeft: 2 }} />
              </div>

              {/* Pijlen langs de randen. Ze stoppen de tik naar de speler, want
                  doorbladeren en afspelen zitten op dezelfde thumbnail. */}
              {totaal > 1 && [
                { kant: 'left', Icon: ChevronLeft, stap: -1 },
                { kant: 'right', Icon: ChevronRight, stap: 1 },
              ].map((pijl) => {
                // Als losse variabele en niet als parameter: de linter hier
                // kent geen JSX-gebruik van gedestructureerde argumenten en
                // zou `Icon` anders als ongebruikt aanmerken.
                const { kant, stap } = pijl
                const Icon = pijl.Icon
                return (
                <button
                  key={kant}
                  onClick={(e) => { e.stopPropagation(); setIdx(i => (i + stap + totaal) % totaal) }}
                  aria-label={stap < 0 ? 'Vorige video' : 'Volgende video'}
                  style={{
                    position: 'absolute', top: '50%', [kant]: 6, transform: 'translateY(-50%)',
                    width: 30, height: 44, padding: 0, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,10,10,0.45)', border: 'none',
                    color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Icon size={18} strokeWidth={3} />
                </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {stippen}

      {/* De speler verwacht een toewijzing: hij schrijft de kijk-status en de
          beoordeling op `item.id`, en dat is een video_assignments-rij. Staat
          de video standaard op de pagina, dan is er geen toewijzing en blijft
          dat veld leeg — de speler slaat het bijwerken dan over, en het
          gezien-zetten doen wij hier. */}
      {speler_}
      {bevestiging}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
