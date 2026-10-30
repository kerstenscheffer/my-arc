// src/modules/workout/components/OefeningThumb.jsx
//
// Eén thumbnail voor oefeningen en video's, die nooit een kapot plaatje laat
// zien. 44 oefeningen hadden hun foto op i.ibb.co staan; dat laadt op mobiel
// en achter adblockers vaak niet, en dan stond er een leeg of gebroken vlak.
//
// Volgorde: de opgegeven bronnen (meestal thumbnail_url), dan de YouTube-
// thumbnail uit video_url, en lukt geen enkele: een rustig vlak met de naam.
// Bij een laadfout schuift hij door naar de volgende bron.
import { useEffect, useMemo, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { youtubeThumbs } from '../utils/oefeningFoto'

export default function OefeningThumb({
  bronnen = [],      // url of lijst url's, in volgorde van voorkeur
  videoUrl,          // YouTube-link; levert een reserve-thumbnail
  naam = '',         // label op de placeholder
  alt = '',
  imgStyle,          // extra stijl op de <img> (bijv. opacity)
  compact = false,   // klein vlak: alleen het icoon, geen tekst
  style,
  children,          // overlays (nummer, play-knop) over de foto heen
}) {
  const lijst = useMemo(() => {
    const ruw = [...(Array.isArray(bronnen) ? bronnen : [bronnen]), ...youtubeThumbs(videoUrl)]
    return [...new Set(ruw.filter(Boolean))]
  }, [JSON.stringify(bronnen), videoUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const [stap, setStap] = useState(0)
  useEffect(() => { setStap(0) }, [lijst])

  const vlak = { position: 'absolute', inset: 0, width: '100%', height: '100%' }
  const huidig = lijst[stap]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#0d0d0d', ...style }}>
      {huidig ? (
        <img
          key={huidig}
          src={huidig}
          alt={alt}
          loading="lazy"
          onError={() => setStap(s => s + 1)}
          style={{ ...vlak, objectFit: 'cover', display: 'block', ...imgStyle }}
        />
      ) : (
        <div style={{
          ...vlak,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: 6, boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          color: 'rgba(255,255,255,0.45)', textAlign: 'center',
        }}>
          <Dumbbell size={compact ? 16 : 20} strokeWidth={1.8} />
          {!compact && naam && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, lineHeight: 1.2,
              color: 'rgba(255,255,255,0.6)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {naam}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
