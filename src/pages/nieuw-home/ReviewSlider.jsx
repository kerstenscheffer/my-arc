// src/pages/nieuw-home/ReviewSlider.jsx (20 nov 2026)
// Reviews op de homepage als slider. Bron: tabel trustpilot_reviews (SQL in
// trustpilot.sql), elke dag aangevuld door een cloud-routine uit de mails van
// Trustpilot. Lukt laden niet, dan staat de vaste lijst hieronder er.
// Per kaart: de kern (highlight) groot en vet, de volledige tekst achter
// 'Lees volledige review'. Schuift vanzelf door; stopt zodra iemand de slider
// aanraakt of een review openklapt.
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const maand = (iso) => { const [j, m] = String(iso).split('-'); return `${MAANDEN[Number(m) - 1]} ${j}` }
const DOOR_MS = 7000

// Trustpilot-sterren: groene vakjes, het laatste half gevuld bij een halve ster.
export function Sterren({ score = 5, groot = false }) {
  const maat = groot ? 22 : 18
  const afgerond = Math.round(score * 2) / 2
  return (
    <span className="nh-tp-sterren" aria-label={`${String(score).replace('.', ',')} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const vol = afgerond >= i ? 100 : afgerond >= i - 0.5 ? 50 : 0
        return (
          <span key={i} className="nh-tp-ster" style={{ width: maat, height: maat, background: `linear-gradient(90deg, #00b67a ${vol}%, #3a3a3a ${vol}%)` }}>
            <Star size={groot ? 14 : 11} fill="#fff" color="#fff" strokeWidth={0} />
          </span>
        )
      })}
    </span>
  )
}

export default function ReviewSlider({ reviews }) {
  const baan = useRef(null)
  const [actief, setActief] = useState(0)
  const [open, setOpen] = useState(null)
  const [vast, setVast] = useState(false) // aangeraakt of opengeklapt: niet meer vanzelf doorschuiven

  const naar = (i) => {
    const el = baan.current
    if (!el) return
    const n = reviews.length
    const doel = ((i % n) + n) % n
    const kaart = el.children[doel]
    if (kaart) el.scrollTo({ left: kaart.offsetLeft - el.offsetLeft - (el.clientWidth - kaart.clientWidth) / 2, behavior: 'smooth' })
  }

  // Welke kaart staat in het midden.
  useEffect(() => {
    const el = baan.current
    if (!el) return
    const kijk = () => {
      const midden = el.scrollLeft + el.clientWidth / 2
      let beste = 0, afstand = Infinity
      ;[...el.children].forEach((k, i) => {
        const d = Math.abs(k.offsetLeft - el.offsetLeft + k.clientWidth / 2 - midden)
        if (d < afstand) { afstand = d; beste = i }
      })
      setActief(beste)
    }
    el.addEventListener('scroll', kijk, { passive: true })
    return () => el.removeEventListener('scroll', kijk)
  }, [reviews])

  // Vanzelf doorschuiven, alleen als de slider in beeld is en niemand eraan zit.
  useEffect(() => {
    if (vast || reviews.length < 2) return
    const el = baan.current
    let zichtbaar = false
    const obs = new IntersectionObserver(([e]) => { zichtbaar = e.isIntersecting }, { threshold: 0.5 })
    if (el) obs.observe(el)
    const t = setInterval(() => { if (zichtbaar && !document.hidden) naar(actief + 1) }, DOOR_MS)
    return () => { clearInterval(t); obs.disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vast, actief, reviews])

  const stop = () => setVast(true)

  return (
    <div className="nh-slider" onPointerDown={stop} onWheel={stop}>
      <div className="nh-slider-baan" ref={baan}>
        {reviews.map((r, i) => {
          const isOpen = open === r.id
          const kern = r.highlight || null
          return (
            <article key={r.id} className={`nh-quote${isOpen ? ' is-open' : ''}`} aria-roledescription="review" aria-label={`Review ${i + 1} van ${reviews.length}`}>
              <Sterren score={r.sterren || 5} />
              {kern && <p className="nh-quote-kern">“{kern}”</p>}
              <p className={`nh-quote-tekst${isOpen ? '' : ' is-kort'}`}>{r.tekst}</p>
              <button type="button" className="nh-quote-meer" aria-expanded={isOpen} onClick={() => { stop(); setOpen(isOpen ? null : r.id) }}>
                {isOpen ? 'Minder tonen' : 'Lees volledige review'}
              </button>
              <div className="nh-quote-wie">{r.naam} · {maand(r.datum)}</div>
            </article>
          )
        })}
      </div>
      {reviews.length > 1 && (
        <div className="nh-slider-bediening">
          <button type="button" className="nh-slider-pijl" aria-label="Vorige review" onClick={() => { stop(); naar(actief - 1) }}><ChevronLeft size={22} strokeWidth={2.6} /></button>
          <div className="nh-slider-punten">
            {reviews.map((r, i) => (
              <button key={r.id} type="button" aria-label={`Naar review ${i + 1}`} aria-current={i === actief} className={i === actief ? 'is-actief' : ''} onClick={() => { stop(); naar(i) }} />
            ))}
          </div>
          <button type="button" className="nh-slider-pijl" aria-label="Volgende review" onClick={() => { stop(); naar(actief + 1) }}><ChevronRight size={22} strokeWidth={2.6} /></button>
        </div>
      )}
    </div>
  )
}
