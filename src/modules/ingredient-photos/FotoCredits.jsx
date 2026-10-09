// src/modules/ingredient-photos/FotoCredits.jsx
//
// De lijst met fotografen van wie er foto's in de app staan.
//
// Waarom dit bestaat: de API-richtlijnen van Unsplash verplichten attributie
// bij de fotograaf en bij Unsplash zelf, met utm-parameters in de links. In de
// app staan die foto's als kleine thumbnails in lijsten met maaltijden — daar
// past geen naam onder zonder dat het onleesbaar wordt. Deze pagina is de
// plek waar die credits wél volledig staan, bereikbaar vanuit het profiel.
//
// De lijst komt uit de database, niet uit een handmatig bijgehouden bestand,
// zodat een nieuwe foto automatisch zijn credit meekrijgt.

import { useEffect, useState } from 'react'
import { X, Camera } from 'lucide-react'

const UNSPLASH = 'https://unsplash.com/?utm_source=my_arc&utm_medium=referral'

export default function FotoCredits({ db, onClose }) {
  const [fotografen, setFotografen] = useState(null)

  useEffect(() => {
    let weg = false
    ;(async () => {
      // Ingrediënten én maaltijden: beide tabellen hebben dezelfde kolommen.
      const lees = (tabel) => db.supabase
        .from(tabel)
        .select('image_author, image_author_url')
        .eq('image_source', 'unsplash')
        .not('image_author', 'is', null)
        .then(r => r, () => ({ data: [] }))
      const [ingr, meals] = await Promise.all([lees('ai_ingredients'), lees('ai_meals')])
      const data = [...(ingr?.data || []), ...(meals?.data || [])]

      if (weg) return
      // Eén regel per fotograaf, met hoeveel foto's van hem in de app staan.
      const perNaam = new Map()
      for (const r of data || []) {
        const naam = r.image_author
        if (!naam) continue
        const bestaand = perNaam.get(naam)
        if (bestaand) bestaand.aantal += 1
        else perNaam.set(naam, { naam, url: r.image_author_url, aantal: 1 })
      }
      setFotografen([...perNaam.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl')))
    })()
    return () => { weg = true }
  }, [db])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px 20px 0 0', padding: '1.25rem 1.1rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
          <Camera size={18} color="#fff" strokeWidth={2.6} />
          <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Fotocredits
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
              width: 34, height: 34, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        <p style={{
          fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.55,
          color: 'rgba(255,255,255,0.55)', margin: '0 0 1rem',
        }}>
          Een deel van de foto's bij de maaltijden en ingrediënten komt van{' '}
          <a href={UNSPLASH} target="_blank" rel="noreferrer noopener" style={{ color: '#fff', fontWeight: 800 }}>
            Unsplash
          </a>. Met dank aan deze fotografen:
        </p>

        {fotografen === null && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Laden…</div>
        )}

        {fotografen?.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Er staan nog geen Unsplash-foto's in de app.
          </div>
        )}

        {fotografen?.map((f, i) => (
          <a
            key={f.naam}
            href={f.url || UNSPLASH}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.75rem 0', minHeight: 44,
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
              color: '#fff', textDecoration: 'none',
            }}
          >
            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 800 }}>{f.naam}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
              {f.aantal} {f.aantal === 1 ? 'foto' : "foto's"}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
