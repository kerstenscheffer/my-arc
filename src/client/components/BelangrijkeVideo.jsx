// src/client/components/BelangrijkeVideo.jsx
//
// Een video die de coach als belangrijk heeft gemarkeerd, ín de pagina waar
// hij over gaat. Niet de zwevende teaser: die komt langs en zakt weer weg, en
// een video die je moet zien mag je niet kunnen missen doordat je net aan het
// scrollen was.
//
// Hij staat er tot je hem gezien hebt. Dat kan op twee manieren: je speelt hem
// af (het sluiten van de speler telt als gezien) of je tikt "Ik heb 'm gezien"
// aan — soms heb je hem op je laptop al bekeken. Daarna is hij weg van deze
// pagina en staat hij nog gewoon in je bibliotheek.
//
// Zijn er meer, dan staan ze onder elkaar: elke belangrijke video is een
// losse boodschap, en samenvouwen tot "3 video's" maakt er een lijstje van dat
// je wegklikt.

import { useCallback, useEffect, useState } from 'react'
import { Play, Check, Loader2 } from 'lucide-react'
import videoService from '../../modules/videos/VideoService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { getThumbnailFromUrl } from '../../modules/videos/utils/youtubeHelpers'

export default function BelangrijkeVideo({ client, pagina, isMobile = false }) {
  const [items, setItems] = useState([])
  const [speler, setSpeler] = useState(null)
  const [bezig, setBezig] = useState(null)   // video_id dat wordt afgevinkt

  const laad = useCallback(async () => {
    if (!client?.id || !pagina) { setItems([]); return }
    const lijst = await videoService.getBelangrijkeVideosVoorPagina(client.id, pagina)
    setItems(lijst)
  }, [client?.id, pagina])

  useEffect(() => { laad() }, [laad])

  const afvinken = async (item, via) => {
    setBezig(item.video_id)
    await videoService.markeerVideoGezien(client.id, item.video_id, via, item.assignment_id)
    setItems(prev => prev.filter(i => i.video_id !== item.video_id))
    setBezig(null)
  }

  // De speler sluiten telt als gezien: je hebt hem opengezet en weer
  // dichtgedaan. Dat is niet hetzelfde als uitkijken, maar wél het moment
  // waarop er niets meer te halen valt met hem op de pagina houden.
  const sluitSpeler = async () => {
    const item = speler
    setSpeler(null)
    if (item) await afvinken(item, 'speler')
  }

  if (!items.length) return null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isMobile ? '0.6rem' : '0.75rem',
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      marginBottom: isMobile ? '1rem' : '1.25rem',
    }}>
      {items.map(item => {
        const v = item.video
        const thumb = v.thumbnail_url || getThumbnailFromUrl(v.video_url)
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
              {/* Zwarte fade zodat de titel op elke thumbnail leesbaar is. */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.6) 45%, rgba(10,10,10,0.15) 100%)',
              }} />

              <div style={{
                position: 'absolute', top: isMobile ? 10 : 12, left: isMobile ? 12 : 14,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.2rem 0.5rem', borderRadius: 999,
                background: '#fff', color: '#0a0a0a',
                fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Bekijk dit
              </div>

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

              <div style={{
                position: 'absolute', left: isMobile ? 12 : 14, right: isMobile ? 12 : 14,
                bottom: isMobile ? 10 : 12,
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
            </div>

            {/* Zelf afvinken. Klein en onderaan: afspelen is de bedoeling, dit
                is voor wie hem elders al gezien heeft. */}
            <button
              onClick={() => afvinken(item, 'knop')}
              disabled={bezig === item.video_id}
              style={{
                width: '100%', minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'transparent', border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 800,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {bezig === item.video_id
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Check size={13} strokeWidth={3} />}
              Ik heb 'm gezien
            </button>
          </div>
        )
      })}

      {/* De speler verwacht een toewijzing: hij schrijft de kijk-status en de
          beoordeling op `item.id`, en dat is een video_assignments-rij. Staat
          de video standaard op de pagina, dan is er geen toewijzing en blijft
          dat veld leeg — de speler slaat het bijwerken dan over, en het
          gezien-zetten doen wij hier. */}
      {speler && (
        <VideoPlayerModal
          item={{ id: speler.assignment_id, video: speler.video }}
          onClose={sluitSpeler}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
