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
// Zoeken op titel, filteren op soort en categorie. Een video opent in de
// speler, een PDF in een nieuw tabblad.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Play, FileText, Video as VideoIcon, Layers } from 'lucide-react'
import { useModalHost } from '../../coach/ModalHost'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail, formatDuration } from '../../modules/videos/utils/youtubeHelpers'

const LIJN = 'rgba(255,255,255,0.08)'
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'

const zonderAccenten = (t) => String(t || '').toLowerCase()

export default function MediaBibliotheek({
  client, db, pageContext = 'home', open, onOpenChange, onCountChange, isMobile = false,
}) {
  const modalHost = useModalHost()
  const [videos, setVideos] = useState([])
  const [bestanden, setBestanden] = useState([])
  const [categorieen, setCategorieen] = useState([])
  const [laden, setLaden] = useState(true)
  const [zoek, setZoek] = useState('')
  const [filter, setFilter] = useState('alles')   // 'alles' | 'video' | 'pdf' | categorie-id
  const [speler, setSpeler] = useState(null)

  const coachId = client?.coach_id || client?.trainer_id

  useEffect(() => {
    if (!coachId || !db?.supabase) return
    let weg = false
    setLaden(true)
    ;(async () => {
      try {
        const [v, f, c] = await Promise.all([
          db.supabase.from('coach_videos')
            .select('*, video_category:video_categories(id, name, color)')
            .eq('coach_id', coachId).eq('is_active', true)
            .order('created_at', { ascending: false }),
          db.supabase.from('coach_files')
            .select('*').eq('coach_id', coachId).eq('is_active', true)
            .order('created_at', { ascending: false }),
          db.supabase.from('video_categories')
            .select('id, name, color, order_index').eq('coach_id', coachId)
            .order('order_index', { ascending: true }),
        ])
        if (weg) return
        setVideos(v.data || [])
        setBestanden(f.data || [])
        setCategorieen(c.data || [])
      } catch (e) {
        console.error('Bibliotheek laden mislukt:', e)
      } finally {
        if (!weg) setLaden(false)
      }
    })()
    return () => { weg = true }
  }, [db, coachId])

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
        categorieId: v.category_id || null,
        categorieNaam: v.video_category?.name || null,
        duur: v.duration_seconds || null,
        pagina: vanPagina(v),
        thumb: (extractYouTubeId(v.video_url) ? getYouTubeThumbnail(extractYouTubeId(v.video_url), 'mqdefault') : null) || v.thumbnail_url || null,
        ruw: v,
      })),
      ...bestanden.map(f => ({
        soort: 'pdf', id: `f-${f.id}`, titel: f.title, beschrijving: f.description,
        categorieId: null, categorieNaam: null, duur: null,
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
        if (filter !== 'alles' && filter !== 'video' && filter !== 'pdf' && i.categorieId !== filter) return false
        if (!term) return true
        return zonderAccenten(i.titel).includes(term) || zonderAccenten(i.beschrijving).includes(term)
      })
      // Wat bij deze pagina hoort eerst: je komt hier meestal met een vraag
      // over waar je net was.
      .sort((a, b) => (b.pagina === true) - (a.pagina === true))
  }, [videos, bestanden, zoek, filter, pageContext])

  const openItem = (i) => {
    if (i.soort === 'pdf') { window.open(i.ruw.file_url, '_blank', 'noopener'); return }
    setSpeler({ id: i.ruw.id, video_id: i.ruw.id, video: i.ruw })
  }

  if (!open) return null

  const filters = [
    { id: 'alles', label: 'Alles', Icoon: Layers },
    { id: 'video', label: "Video's", Icoon: VideoIcon },
    ...(bestanden.length ? [{ id: 'pdf', label: "PDF's", Icoon: FileText }] : []),
    ...categorieen.map(c => ({ id: c.id, label: c.name })),
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            Bibliotheek
          </div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {videos.length} video{videos.length === 1 ? '' : "'s"}
            {bestanden.length > 0 && ` · ${bestanden.length} PDF${bestanden.length === 1 ? '' : "'s"}`}
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

      {/* Filters */}
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

        {!laden && items.length === 0 && (
          <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <VideoIcon size={20} />
            <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 700 }}>
              {zoek ? 'Niets gevonden' : 'Je coach heeft hier nog niets klaargezet'}
            </div>
          </div>
        )}

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
      </div>

      {speler && (
        <VideoPlayerModal item={speler} onClose={() => setSpeler(null)} />
      )}
    </div>
  )

  return createPortal(venster, modalHost)
}
