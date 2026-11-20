// src/pages/nieuw-home/ReviewSlider.jsx (20 nov 2026)
// Reviews op de homepage als doorlopende band. Bron: tabel trustpilot_reviews
// (SQL in trustpilot.sql), elke dag aangevuld door een cloud-routine uit de
// mails van Trustpilot.
// Schuift langzaam en constant (geen sprongen, Kersten 20 nov); stopt zolang je
// erop staat, eraan zit of een review openklapt. De lijst staat er twee keer in,
// zodat de band naadloos rondloopt. Per kaart: sterren + score + naam + datum op
// één regel, de kern groot en vet, de volledige tekst achter 'Lees volledige review'.
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const maand = (iso) => { const [j, m] = String(iso).split('-'); return `${MAANDEN[Number(m) - 1]} ${j}` }
const SNELHEID = 32 // px per seconde
const NA_AANRAKEN_MS = 2500

// Trustpilot-sterren: groene vakjes, het laatste half gevuld bij een halve ster.
export function Sterren({ score = 5, groot = false }) {
  const maat = groot ? 22 : 16
  const afgerond = Math.round(score * 2) / 2
  return (
    <span className="nh-tp-sterren" aria-label={`${String(score).replace('.', ',')} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const vol = afgerond >= i ? 100 : afgerond >= i - 0.5 ? 50 : 0
        return (
          <span key={i} className="nh-tp-ster" style={{ width: maat, height: maat, background: `linear-gradient(90deg, #00b67a ${vol}%, #3a3a3a ${vol}%)` }}>
            <Star size={groot ? 14 : 10} fill="#fff" color="#fff" strokeWidth={0} />
          </span>
        )
      })}
    </span>
  )
}

function Kaart({ r, isOpen, onWissel, kopie }) {
  return (
    <article className="nh-quote" aria-hidden={kopie || undefined}>
      <div className="nh-quote-kop">
        <Sterren score={r.sterren || 5} />
        <span className="nh-quote-wie"><b>{r.sterren || 5}/5</b> · {r.naam} · {maand(r.datum)}</span>
      </div>
      {r.highlight && <p className="nh-quote-kern">“{r.highlight}”</p>}
      <p className={`nh-quote-tekst${isOpen ? '' : ' is-kort'}`}>{r.tekst}</p>
      <button type="button" className="nh-quote-meer" tabIndex={kopie ? -1 : undefined} aria-expanded={isOpen} onClick={onWissel}>
        {isOpen ? 'Minder tonen' : 'Lees volledige review'}
      </button>
    </article>
  )
}

export default function ReviewSlider({ reviews }) {
  const baan = useRef(null)
  const [open, setOpen] = useState(null)
  const pauze = useRef({ hover: false, tot: 0 })
  const openRef = useRef(null)
  openRef.current = open

  useEffect(() => {
    const el = baan.current
    if (!el || reviews.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let zichtbaar = true
    const obs = new IntersectionObserver(([e]) => { zichtbaar = e.isIntersecting }, { threshold: 0.2 })
    obs.observe(el)
    let pos = el.scrollLeft
    let vorige = performance.now()
    let id
    const stap = (nu) => {
      const dt = Math.min(64, nu - vorige)
      vorige = nu
      const helft = el.scrollWidth / 2
      // Iemand scrollde zelf (vegen, pijl): daar verder gaan.
      if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft
      const stil = pauze.current.hover || nu < pauze.current.tot || openRef.current || !zichtbaar || document.hidden
      if (!stil) {
        pos += (SNELHEID * dt) / 1000
        if (pos >= helft) pos -= helft
        el.scrollLeft = pos
      } else if (el.scrollLeft >= helft) {
        pos = el.scrollLeft - helft
        el.scrollLeft = pos
      }
      id = requestAnimationFrame(stap)
    }
    id = requestAnimationFrame(stap)
    return () => { cancelAnimationFrame(id); obs.disconnect() }
  }, [reviews])

  const even = () => { pauze.current.tot = performance.now() + NA_AANRAKEN_MS }
  const schuif = (richting) => {
    const el = baan.current
    const kaart = el?.firstElementChild
    if (!el || !kaart) return
    even()
    pauze.current.tot = performance.now() + NA_AANRAKEN_MS + 600
    el.scrollBy({ left: richting * (kaart.clientWidth + 12), behavior: 'smooth' })
  }

  return (
    <div className="nh-slider">
      <div className={`nh-slider-baan${open ? ' is-open' : ''}`} ref={baan}
        onMouseEnter={() => { pauze.current.hover = true }} onMouseLeave={() => { pauze.current.hover = false }}
        onPointerDown={even} onPointerUp={even} onTouchMove={even} onWheel={even}>
        {reviews.map((r) => (
          <Kaart key={r.id} r={r} isOpen={open === r.id} onWissel={() => setOpen(open === r.id ? null : r.id)} />
        ))}
        {reviews.length > 1 && reviews.map((r) => (
          <Kaart key={`${r.id}-2`} r={r} kopie isOpen={open === r.id} onWissel={() => setOpen(open === r.id ? null : r.id)} />
        ))}
      </div>
      {reviews.length > 1 && (
        <div className="nh-slider-bediening">
          <button type="button" className="nh-slider-pijl" aria-label="Vorige review" onClick={() => schuif(-1)}><ChevronLeft size={22} strokeWidth={2.6} /></button>
          <button type="button" className="nh-slider-pijl" aria-label="Volgende review" onClick={() => schuif(1)}><ChevronRight size={22} strokeWidth={2.6} /></button>
        </div>
      )}
    </div>
  )
}
