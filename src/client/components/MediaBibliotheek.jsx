// src/client/components/MediaBibliotheek.jsx
//
// Alles wat je coach heeft klaargezet, op één plek: de video's en de PDF's.
//
// Het venster hiervoor (PageVideoWidget) toonde alleen wat aan de pagina hing
// waar je op stond, en de bibliotheek daarnaast alleen wat persoonlijk aan jou
// was toegewezen. Gevolg: een video die op de workout-pagina stond was
// onvindbaar zodra je in je maaltijdplan zat, en video's zonder toewijzing
// zag je nergens. Hier staat alles, met de dingen van de pagina waar je
// vandaan komt bovenaan.
//
// Wél met een grens (sep 2026): je ziet de algemene video's — die aan een
// pagina hangen — plus wat persoonlijk aan jou is toegewezen. Een video die
// de coach voor één klant klaarzet, blijft bij die klant.
//
// Zoeken op titel, filteren op soort en categorie. Een video opent in de
// speler, een PDF in een nieuw tabblad.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Play, FileText, Video as VideoIcon, Layers, ArrowLeft, ChevronRight } from 'lucide-react'
import { useModalHost } from '../../coach/ModalHost'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail, formatDuration } from '../../modules/videos/utils/youtubeHelpers'

const LIJN = 'rgba(255,255,255,0.08)'
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'

const zonderAccenten = (t) => String(t || '').toLowerCase()

// Vier onderwerpen in plaats van één lange lijst. De indeling volgt de
// pagina's waaraan de coach zijn video's al hangt (default_pages), dus er valt
// niets extra's in te stellen. Wat nergens bij hoort komt onder "Overig"
// terecht — liever een restbak dan een video die nergens meer te vinden is.
// Stockfoto's van Unsplash, met een vaste foto per onderwerp. Geen foto's van
// de coach zelf: die horen bij zijn eigen berichten, niet als plaatje boven een
// categorie.
const FOTO = {
  app: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=450&fit=crop&q=80',
  workout: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=450&fit=crop&q=80',
  meal: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=450&fit=crop&q=80',
  tracking: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=450&fit=crop&q=80',
}

const ONDERWERPEN = [
  {
    id: 'app', label: 'App uitleg', foto: FOTO.app,
    paginas: ['home', 'profile', 'calls'],
    woorden: ['app', 'uitleg', 'start'],
  },
  {
    id: 'workout', label: 'Workout', foto: FOTO.workout,
    paginas: ['workout'],
    woorden: ['workout', 'training', 'oefening', 'loggen'],
  },
  {
    id: 'meal', label: 'Voeding', foto: FOTO.meal,
    paginas: ['meal', 'boodschappen'],
    woorden: ['meal', 'voeding', 'maaltijd', 'eten', 'boodschappen'],
  },
  {
    id: 'tracking', label: 'Tracking', foto: FOTO.tracking,
    paginas: ['tracking'],
    woorden: ['tracking', 'progressie', 'foto', 'gewicht', 'meting'],
  },
]

// Eerst kijken aan welke pagina's het hangt; staat dat leeg, dan naar de
// categorie van de video. Van de achttien video's hebben er elf geen pagina
// maar wel een categorie ("Meal Systeem", "Workouts Loggen"), en die zouden
// anders allemaal in de restbak belanden — precies de hoop waar dit venster
// vanaf moest.
const onderwerpVan = ({ default_pages, categorie }) => {
  const paginas = Array.isArray(default_pages) ? default_pages : []
  const opPagina = ONDERWERPEN.find(o => o.paginas.some(p => paginas.includes(p)))
  if (opPagina) return opPagina.id
  const naam = zonderAccenten(categorie)
  if (naam) {
    const opNaam = ONDERWERPEN.find(o => o.woorden.some(w => naam.includes(w)))
    if (opNaam) return opNaam.id
  }
  return 'overig'
}

export default function MediaBibliotheek({
  client, db, pageContext = 'home', open, onOpenChange, onCountChange, isMobile = false,
}) {
  const modalHost = useModalHost()
  const [videos, setVideos] = useState([])
  const [bestanden, setBestanden] = useState([])
  const [laden, setLaden] = useState(true)
  const [zoek, setZoek] = useState('')
  const [filter, setFilter] = useState('alles')   // 'alles' | 'video' | 'pdf'
  const [onderwerp, setOnderwerp] = useState(null) // null = het overzicht
  const [speler, setSpeler] = useState(null)

  const coachId = client?.coach_id || client?.trainer_id

  useEffect(() => {
    if (!coachId || !client?.id || !db?.supabase) return
    let weg = false
    setLaden(true)
    ;(async () => {
      try {
        // Welke video's zijn persoonlijk aan déze klant toegewezen?
        const { data: toewijzingen } = await db.supabase
          .from('video_assignments').select('video_id').eq('client_id', client.id)
        const eigenIds = [...new Set((toewijzingen || []).map(a => a.video_id).filter(Boolean))]

        const videoSelect = '*, video_category:video_categories(id, name, color)'
        const basis = () => db.supabase.from('coach_videos')
          .select(videoSelect).eq('coach_id', coachId).eq('is_active', true)

        const [algemeen, eigen, f] = await Promise.all([
          // Algemeen: alles wat aan een pagina hangt, dat is voor iedereen.
          basis().not('default_pages', 'is', null).not('default_pages', 'eq', '{}'),
          // Persoonlijk: alleen wat aan jou is toegewezen.
          eigenIds.length ? basis().in('id', eigenIds) : Promise.resolve({ data: [] }),
          db.supabase.from('coach_files')
            .select('*').eq('coach_id', coachId).eq('is_active', true)
            .order('created_at', { ascending: false }),
        ])
        if (weg) return

        // Samenvoegen zonder dubbelen; nieuwste bovenaan.
        const perId = new Map()
        for (const v of [...(algemeen.data || []), ...(eigen.data || [])]) perId.set(v.id, v)
        setVideos([...perId.values()].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ))
        setBestanden(f.data || [])
      } catch (e) {
        console.error('Bibliotheek laden mislukt:', e)
      } finally {
        if (!weg) setLaden(false)
      }
    })()
    return () => { weg = true }
  }, [db, coachId, client?.id])

  // De teller op de knop in de zijbalk: alles bij elkaar.
  useEffect(() => {
    onCountChange?.(videos.length + bestanden.length)
  }, [videos.length, bestanden.length, onCountChange])

  // Eén lijst van allebei de soorten, met wat bij deze pagina hoort vooraan.
  const items = useMemo(() => {
    const vanPagina = (lijst) => (lijst.default_pages || []).includes(pageContext)
    const alles = [
      ...videos.map(v => ({
        soort: 'video', id: `v-${v.id}`, titel: v.title, beschrijving: v.description,
        categorieNaam: v.video_category?.name || null,
        duur: v.duration_seconds || null,
        onderwerp: onderwerpVan({ default_pages: v.default_pages, categorie: v.video_category?.name || v.category }),
        pagina: vanPagina(v),
        thumb: (extractYouTubeId(v.video_url) ? getYouTubeThumbnail(extractYouTubeId(v.video_url), 'mqdefault') : null) || v.thumbnail_url || null,
        ruw: v,
      })),
      ...bestanden.map(f => ({
        soort: 'pdf', id: `f-${f.id}`, titel: f.title, beschrijving: f.description,
        categorieNaam: null, duur: null,
        onderwerp: onderwerpVan({ default_pages: f.default_pages }),
        pagina: vanPagina(f),
        thumb: f.thumb_url || null,
        ruw: f,
      })),
    ]
    const term = zonderAccenten(zoek).trim()
    return alles
      .filter(i => {
        if (filter === 'video' && i.soort !== 'video') return false
        if (filter === 'pdf' && i.soort !== 'pdf') return false
        // Zoeken gaat door alles heen; alleen zonder zoekterm blijf je binnen
        // het onderwerp dat je hebt gekozen.
        if (!term && onderwerp && i.onderwerp !== onderwerp) return false
        if (!term) return true
        return zonderAccenten(i.titel).includes(term) || zonderAccenten(i.beschrijving).includes(term)
      })
      // Wat bij deze pagina hoort eerst: je komt hier meestal met een vraag
      // over waar je net was.
      .sort((a, b) => (b.pagina === true) - (a.pagina === true))
  }, [videos, bestanden, zoek, filter, onderwerp, pageContext])

  // Aantallen voor de kaarten op het overzicht.
  const aantalPer = useMemo(() => {
    const telling = {}
    const alles = [
      ...videos.map(v => onderwerpVan({ default_pages: v.default_pages, categorie: v.video_category?.name || v.category })),
      ...bestanden.map(f => onderwerpVan({ default_pages: f.default_pages })),
    ]
    alles.forEach(o => { telling[o] = (telling[o] || 0) + 1 })
    return telling
  }, [videos, bestanden])

  const openItem = (i) => {
    if (i.soort === 'pdf') { window.open(i.ruw.file_url, '_blank', 'noopener'); return }
    setSpeler({ id: i.ruw.id, video_id: i.ruw.id, video: i.ruw })
  }

  if (!open) return null

  const gekozen = ONDERWERPEN.find(o => o.id === onderwerp) || (onderwerp === 'overig' ? { id: 'overig', label: 'Overig' } : null)
  const toonOverzicht = !onderwerp && !zoek.trim()

  const filters = [
    { id: 'alles', label: 'Alles', Icoon: Layers },
    { id: 'video', label: "Video's", Icoon: VideoIcon },
    ...(bestanden.length ? [{ id: 'pdf', label: "PDF's", Icoon: FileText }] : []),
  ]

  const venster = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483000,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {/* Kop */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        padding: isMobile ? '0.8rem 1rem' : '1rem 1.25rem',
        borderBottom: `1px solid ${LIJN_ZACHT}`,
      }}>
        {gekozen && (
          <button
            onClick={() => { setOnderwerp(null); setZoek(''); setFilter('alles') }}
            aria-label="Terug naar de onderwerpen"
            style={{
              width: 30, height: 30, padding: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ArrowLeft size={18} strokeWidth={3} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            {gekozen ? gekozen.label : 'Bibliotheek'}
          </div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {gekozen
              ? `${aantalPer[gekozen.id] || 0} item${(aantalPer[gekozen.id] || 0) === 1 ? '' : 's'}`
              : `${videos.length} video${videos.length === 1 ? '' : "'s"}${bestanden.length > 0 ? ` · ${bestanden.length} PDF${bestanden.length === 1 ? '' : "'s"}` : ''}`}
          </div>
        </div>
        <button
          onClick={() => onOpenChange?.(false)}
          aria-label="Sluiten"
          style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Zoeken */}
      <div style={{ flexShrink: 0, padding: isMobile ? '0.7rem 1rem 0' : '0.85rem 1.25rem 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: 38, padding: '0 0.7rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
        }}>
          <Search size={14} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek een video of PDF"
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
            }}
          />
          {zoek && (
            <button onClick={() => setZoek('')} aria-label="Zoekterm wissen" style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', padding: 2,
            }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filters — alleen binnen een onderwerp of bij een zoekterm; op het
          overzicht staan de kaarten al voor de indeling. */}
      {!toonOverzicht && (
      <div style={{
        flexShrink: 0, display: 'flex', gap: 6, overflowX: 'auto',
        padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.25rem',
        scrollbarWidth: 'none',
      }}>
        {filters.map(f => {
          const aan = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                minHeight: 30, padding: '0 0.75rem', borderRadius: 999,
                background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {f.Icoon && <f.Icoon size={12} strokeWidth={2.6} />}
              {f.label}
            </button>
          )
        })}
      </div>
      )}

      {/* Lijst */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: isMobile ? '0 1rem 1.5rem' : '0 1.25rem 2rem',
      }}>
        {laden && (
          <div style={{ padding: '2rem 0', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
            Laden…
          </div>
        )}

        {!laden && !toonOverzicht && items.length === 0 && (
          <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <VideoIcon size={20} />
            <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 700 }}>
              {zoek ? 'Niets gevonden' : 'Je coach heeft hier nog niets klaargezet'}
            </div>
          </div>
        )}

        {/* Overzicht: één fotokaart per onderwerp. Klik je erop, dan staan de
            video's en PDF's van dat onderwerp eronder. */}
        {toonOverzicht && !laden && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: isMobile ? 10 : 12,
          }}>
            {[...ONDERWERPEN, ...(aantalPer.overig ? [{ id: 'overig', label: 'Overig', foto: null }] : [])].map(o => {
              const aantal = aantalPer[o.id] || 0
              return (
                <button
                  key={o.id}
                  onClick={() => setOnderwerp(o.id)}
                  disabled={aantal === 0}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    aspectRatio: '4 / 3',
                    borderRadius: 14, border: `1px solid ${LIJN_ZACHT}`,
                    background: '#141414', padding: 0,
                    cursor: aantal === 0 ? 'default' : 'pointer',
                    opacity: aantal === 0 ? 0.45 : 1,
                    fontFamily: 'inherit', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {o.foto && (
                    <span style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${o.foto})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                  )}
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.9) 100%)',
                  }} />
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    padding: isMobile ? '0.7rem 0.75rem' : '0.85rem 0.9rem',
                    display: 'flex', alignItems: 'flex-end', gap: 6,
                  }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block',
                        fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.025em', lineHeight: 1.15,
                        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                      }}>
                        {o.label}
                      </span>
                      <span style={{
                        display: 'block', marginTop: 2,
                        fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                      }}>
                        {aantal === 0 ? 'nog niets' : `${aantal} item${aantal === 1 ? '' : 's'}`}
                      </span>
                    </span>
                    {aantal > 0 && <ChevronRight size={16} color="#fff" strokeWidth={3} style={{ flexShrink: 0, marginBottom: 2 }} />}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!toonOverzicht && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: isMobile ? 10 : 12,
        }}>
          {items.map(i => (
            <button
              key={i.id}
              onClick={() => openItem(i)}
              style={{
                display: 'flex', alignItems: 'stretch', gap: 0, textAlign: 'left',
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${LIJN_ZACHT}`,
                borderRadius: 12, overflow: 'hidden', padding: 0,
                cursor: 'pointer', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                position: 'relative', flexShrink: 0,
                width: 104, alignSelf: 'stretch', minHeight: 62,
                background: i.thumb ? `url(${i.thumb}) center/cover` : 'rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: i.thumb ? 'rgba(0,0,0,0.3)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i.soort === 'pdf'
                    ? <FileText size={16} color="#fff" strokeWidth={2.4} />
                    : <Play size={16} color="#fff" fill="#fff" strokeWidth={0} />}
                </div>
                {i.duur > 0 && (
                  <span style={{
                    position: 'absolute', right: 4, bottom: 4,
                    padding: '1px 5px', borderRadius: 5,
                    background: 'rgba(0,0,0,0.7)',
                    fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                  }}>
                    {formatDuration(i.duur)}
                  </span>
                )}
              </div>

              <div style={{
                flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 3, padding: isMobile ? '0.55rem 0.7rem' : '0.65rem 0.8rem',
              }}>
                <span style={{
                  fontSize: '0.84rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {i.titel || (i.soort === 'pdf' ? 'Document' : 'Video')}
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {i.soort === 'pdf' ? 'PDF' : 'Video'}
                  {i.categorieNaam && <>· {i.categorieNaam}</>}
                  {i.pagina && <>· op deze pagina</>}
                </span>
              </div>
            </button>
          ))}
        </div>
        )}
      </div>

      {speler && (
        <VideoPlayerModal item={speler} onClose={() => setSpeler(null)} />
      )}
    </div>
  )

  return createPortal(venster, modalHost)
}
