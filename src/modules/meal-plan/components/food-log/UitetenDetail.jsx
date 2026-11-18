// src/modules/meal-plan/components/food-log/UitetenDetail.jsx
//
// Detailscherm van één gerecht in de tab Uiteten (18 nov 2026, Kersten): laat
// zien waar de schatting uit bestaat (brood, vlees, saus, kaas, met gewicht en
// kcal per onderdeel) en laat je het aanpassen vóór je het toevoegt: drie
// sneetjes in plaats van twee, truffelmayo in plaats van pesto, de friet eraf.
//
// Een onderdeel: { n: naam, g: gram, k/e/kh/v: per 100 gram, st?: [eenheid, gram] }.
// Vervangen en toevoegen zoekt in de productenlijst (zoek_ingredienten).

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Minus, Plus, Trash2, Repeat, Search, X, Check } from 'lucide-react'
import { resolveFoodImage } from '../../foodImageFallback'

const GROEN = '#10b981'

// eslint-disable-next-line react-refresh/only-export-components
export const somDelen = (delen) => (delen || []).reduce((t, d) => ({
  kcal: t.kcal + d.k * d.g / 100, eiwit: t.eiwit + d.e * d.g / 100, koolh: t.koolh + d.kh * d.g / 100, vet: t.vet + d.v * d.g / 100,
}), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 })

// Stapgrootte: per stuk als het onderdeel een eenheid heeft, anders per 5, 10 of 25 gram.
const stapVan = (d) => (d.st ? d.st[1] : d.g < 50 ? 5 : d.g < 150 ? 10 : 25)
const meervoud = (woord, n) => {
  if (n === 1) return woord
  const vast = { sneetje: 'sneetjes', stuk: 'stuks', plak: 'plakken', plakje: 'plakjes', ei: 'eieren', glas: 'glazen', bol: 'bollen', eetlepel: 'eetlepels', theelepel: 'theelepels', spies: 'spiesen', kop: 'koppen', schep: 'scheppen' }
  return vast[woord] || woord
}
const hoeveelTekst = (d) => {
  if (!d.st) return `${Math.round(d.g)} g`
  const n = Math.round(d.g / d.st[1] * 2) / 2
  return `${String(n).replace('.', ',')} ${meervoud(d.st[0], n)}`
}

function Zoeker({ db, onKies, onSluit, placeholder }) {
  const [q, setQ] = useState('')
  const [rijen, setRijen] = useState([])
  const [bezig, setBezig] = useState(false)
  const laatste = useRef(0)
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2 || !db?.supabase) { setRijen([]); return undefined }
    const mijn = ++laatste.current
    setBezig(true)
    const t = setTimeout(() => {
      db.supabase.rpc('zoek_ingredienten', { p_q: term, p_client: null, p_limit: 8 })
        .then(r => { if (mijn === laatste.current) { setRijen((r?.data || []).filter(x => Number(x.calories_per_100g) >= 0)); setBezig(false) } }, () => { if (mijn === laatste.current) setBezig(false) })
    }, 220)
    return () => clearTimeout(t)
  }, [q, db])
  return (
    <div style={{ margin: '0.4rem 0 0.2rem' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} strokeWidth={2.6} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', boxSizing: 'border-box', height: 40, padding: '0 2.4rem 0 2.2rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={onSluit} aria-label="Sluit zoeken" style={{ position: 'absolute', right: 3, top: 3, width: 34, height: 34, padding: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={17} strokeWidth={2.8} />
        </button>
      </div>
      {bezig && !rijen.length && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', padding: '0.5rem 0.2rem' }}>Zoeken…</div>}
      {rijen.map(x => (
        <button key={x.id} onClick={() => onKies(x)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.5rem 0.2rem', background: 'transparent', border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
        }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {x.name}{x.brand ? <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}> · {x.brand}</span> : null}
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{Math.round(x.calories_per_100g)} kcal / 100 g</span>
        </button>
      ))}
    </div>
  )
}

// Een product uit de zoeklijst als onderdeel, met de hoeveelheid van wat het vervangt (of een gewone portie).
const alsOnderdeel = (x, gram) => {
  const stuk = Number(x.gram_per_eenheid) > 0 && /stuk|snee|plak|schep|lepel|glas/.test(String(x.eenheid || '')) ? [String(x.eenheid).replace(/^snee$/, 'sneetje'), Number(x.gram_per_eenheid)] : null
  const g = gram || Number(x.default_portion_gram) || (stuk ? stuk[1] : 50)
  return {
    n: x.name, g: stuk ? Math.max(stuk[1], Math.round(g / stuk[1]) * stuk[1]) : g,
    k: Number(x.calories_per_100g) || 0, e: Number(x.protein_per_100g) || 0, kh: Number(x.carbs_per_100g) || 0, v: Number(x.fat_per_100g) || 0,
    ...(stuk ? { st: stuk } : {}),
  }
}

export default function UitetenDetail({ gerecht, start, alGekozen, onTerug, onKlaar, db, isMobile, foto }) {
  const [delen, setDelen] = useState(() => (start || []).map(d => ({ ...d })))
  const [zoek, setZoek] = useState(null) // null | 'nieuw' | index van het onderdeel dat vervangen wordt
  const begin = useRef(JSON.stringify(start || []))
  const aangepast = JSON.stringify(delen) !== begin.current
  const t = somDelen(delen)
  const zij = isMobile ? '1rem' : '1.25rem'

  const wijzig = (i, g) => setDelen(prev => prev.map((d, k) => (k === i ? { ...d, g: Math.max(0, Math.round(g * 10) / 10) } : d)))
  const weg = (i) => setDelen(prev => prev.filter((_, k) => k !== i))
  const kies = (x) => {
    if (zoek === 'nieuw') setDelen(prev => [...prev, alsOnderdeel(x)])
    else setDelen(prev => prev.map((d, k) => (k === zoek ? alsOnderdeel(x, d.g) : d)))
    setZoek(null)
  }

  const rond = { width: 32, height: 32, padding: 0, borderRadius: 999, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }
  const tekstKnop = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.25rem 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.76rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }
  const getal = { fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }
  const eenheid = { fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginTop: 3 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: `0.2rem ${zij} 0.5rem`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onTerug} aria-label="Terug" style={{ ...rond, border: 'none', width: 32, height: 36, marginLeft: -8 }}><ChevronLeft size={22} strokeWidth={2.8} /></button>
        <img src={foto || resolveFoodImage({ name: gerecht.naam }, { size: 160 })} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{gerecht.naam}</div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{gerecht.portie}</div>
        </div>
      </div>

      {/* Het totaal rekent live mee met wat je aanpast. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0.5rem ${zij} 0.7rem`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[[t.kcal, 'KCAL'], [t.eiwit, 'G EIWIT'], [t.koolh, 'G KOOLH'], [t.vet, 'G VET']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center', flex: 1 }}>
            <div style={getal}>{Math.round(n)}</div>
            <div style={eenheid}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: `0.2rem ${zij} 1rem` }}>
        <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0.8rem 0 0.1rem' }}>Zo is het opgebouwd</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
          Een schatting van een normale restaurantportie. Was het bij jou anders? Pas het aan voor je het toevoegt.
        </div>

        {delen.map((d, i) => {
          const stap = stapVan(d)
          const kcal = d.k * d.g / 100
          return (
            <div key={`${d.n}-${i}`} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.6rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>{d.n}</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                    {Math.round(kcal)} kcal · {Math.round(d.e * d.g / 100)} g eiwit · {Math.round(d.kh * d.g / 100)} g koolh · {Math.round(d.v * d.g / 100)} g vet
                    {d.st ? ` · ${Math.round(d.g)} g` : ''}
                  </div>
                </div>
                <button onClick={() => (d.g - stap <= 0 ? weg(i) : wijzig(i, d.g - stap))} aria-label="Minder" style={rond}><Minus size={15} strokeWidth={3} /></button>
                <span style={{ minWidth: 74, textAlign: 'center', fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{hoeveelTekst(d)}</span>
                <button onClick={() => wijzig(i, d.g + stap)} aria-label="Meer" style={rond}><Plus size={15} strokeWidth={3} /></button>
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
                <button onClick={() => setZoek(zoek === i ? null : i)} style={{ ...tekstKnop, color: zoek === i ? GROEN : '#fff' }}><Repeat size={13} strokeWidth={2.8} /> Vervang</button>
                <button onClick={() => weg(i)} style={tekstKnop}><Trash2 size={13} strokeWidth={2.6} /> Haal weg</button>
              </div>
              {zoek === i && <Zoeker db={db} onKies={kies} onSluit={() => setZoek(null)} placeholder={`Vervang ${d.n.toLowerCase()} door…`} />}
            </div>
          )
        })}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.6rem' }}>
          {zoek === 'nieuw'
            ? <Zoeker db={db} onKies={kies} onSluit={() => setZoek(null)} placeholder="Wat zat er nog meer bij?" />
            : <button onClick={() => setZoek('nieuw')} style={{ ...tekstKnop, fontSize: '0.88rem' }}><Plus size={16} strokeWidth={3} /> Iets toevoegen</button>}
        </div>

        {aangepast && (
          <button onClick={() => { setDelen(JSON.parse(begin.current)); setZoek(null) }} style={{ ...tekstKnop, marginTop: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Terug naar de standaard</button>
        )}
      </div>

      <div style={{
        position: 'sticky', bottom: 0, padding: `0.6rem ${zij} calc(0.7rem + env(safe-area-inset-bottom, 0px))`,
        background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button onClick={() => onKlaar(delen, aangepast)} disabled={!delen.length} style={{
          width: '100%', minHeight: 48, borderRadius: 12, background: '#fff', border: '1px solid #fff', color: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', opacity: delen.length ? 1 : 0.4,
        }}>
          <Check size={17} strokeWidth={3.2} /> {alGekozen ? 'Bijwerken' : 'Toevoegen aan etentje'} · {Math.round(t.kcal)} kcal
        </button>
      </div>
    </div>
  )
}
