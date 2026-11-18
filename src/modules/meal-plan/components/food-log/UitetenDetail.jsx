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

// Maten: een deel van de normale portie. Kiezen schaalt alle onderdelen mee.
const MATEN = [[0.7, 'Klein'], [1, 'Middel'], [1.3, 'Groot'], [1.7, 'Enorm']]

export default function UitetenDetail({ gerecht, standaard = null, start, startAantal = 1, startMaat = 1, alGekozen, onTerug, onKlaar, onVerwijder = null, db, isMobile, foto }) {
  const [delen, setDelen] = useState(() => (start || []).map(d => ({ ...d })))
  const [aantal, setAantal] = useState(startAantal)
  // Gekozen maat; null zodra je zelf een onderdeel aanpast (dan past geen van de vier meer precies).
  const [maat, setMaat] = useState(startMaat)
  const basis = standaard || start || []
  const kiesMaat = (f) => {
    setMaat(f); setZoek(null); setOpen(null)
    setDelen(basis.map(d => {
      // Stuks blijven hele of halve stuks; de rest op 5 gram.
      const g = d.st ? Math.max(d.st[1] / 2, Math.round(d.g * f / (d.st[1] / 2)) * (d.st[1] / 2)) : Math.max(5, Math.round(d.g * f / 5) * 5)
      return { ...d, g: f === 1 ? d.g : g }
    }))
  }
  const gramBasis = basis.reduce((n, d) => n + d.g, 0)
  const [zoek, setZoek] = useState(null) // null | 'nieuw' | index van het onderdeel dat vervangen wordt
  const [open, setOpen] = useState(null) // index van het onderdeel waarvan Vervang / Haal weg zichtbaar is
  const begin = useRef(JSON.stringify(standaard || start || []))
  const aangepast = JSON.stringify(delen) !== begin.current
  const per = somDelen(delen)
  const t = { kcal: per.kcal * aantal, eiwit: per.eiwit * aantal, koolh: per.koolh * aantal, vet: per.vet * aantal }
  const zij = isMobile ? '1rem' : '1.25rem'

  const wijzig = (i, g) => { setMaat(null); wijzigStil(i, g) }
  const wijzigStil = (i, g) => setDelen(prev => prev.map((d, k) => (k === i ? { ...d, g: Math.max(0, Math.round(g * 10) / 10) } : d)))
  const weg = (i) => { setMaat(null); setDelen(prev => prev.filter((_, k) => k !== i)); setOpen(null); setZoek(null) }
  const kies = (x) => {
    setMaat(null)
    if (zoek === 'nieuw') setDelen(prev => [...prev, alsOnderdeel(x)])
    else setDelen(prev => prev.map((d, k) => (k === zoek ? alsOnderdeel(x, d.g) : d)))
    setZoek(null); setOpen(null)
  }

  const vak = { width: 30, height: 30, padding: 0, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }
  const tekstKnop = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }
  const oordeel = gerecht.keuze === 'top' ? ['Slimme keuze', GROEN] : gerecht.keuze === 'zwaar' ? ['Hoog in kcal: slim om te delen of anders te kiezen', '#f59e0b'] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Zelfde opbouw als het logscherm van een maaltijd: foto, naam, aantal, macro's, samenstelling. */}
      <div style={{ position: 'relative', padding: `0.2rem ${zij} 0`, textAlign: 'center' }}>
        <button onClick={onTerug} aria-label="Terug" style={{ position: 'absolute', left: isMobile ? 6 : 10, top: 0, width: 40, height: 40, padding: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={24} strokeWidth={2.8} />
        </button>
        <img src={foto || resolveFoodImage({ name: gerecht.naam }, { size: 240 })} alt="" style={{ width: 84, height: 84, borderRadius: 999, objectFit: 'cover', background: '#1a1a1a', display: 'block', margin: '0.2rem auto 0.6rem' }} />
        <div style={{ fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{gerecht.naam}</div>
        {oordeel && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.76rem', fontWeight: 900, color: oordeel[1] }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: oordeel[1] }} />{oordeel[0]}
          </div>
        )}

        {/* Hoeveel porties: groot in het midden. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, margin: '0.7rem 0 0.1rem' }}>
          <button onClick={() => setAantal(a => Math.max(0.5, a - 0.5))} aria-label="Minder" style={{ ...vak, background: 'transparent', width: 40, height: 40 }}><Minus size={22} strokeWidth={3.2} /></button>
          <span style={{ fontSize: isMobile ? '2.3rem' : '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, minWidth: 56 }}>{String(aantal).replace('.', ',')}</span>
          <button onClick={() => setAantal(a => Math.min(12, a + 0.5))} aria-label="Meer" style={{ ...vak, background: 'transparent', width: 40, height: 40 }}><Plus size={22} strokeWidth={3.2} /></button>
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>{aantal === 1 ? 'portie' : 'porties'}</div>

        {/* Hoe groot was het bord? Zelfde schuifvorm als het moment in het logscherm. */}
        <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', margin: '0.9rem 0 0.4rem' }}>HOE GROOT</div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 3 }}>
          {MATEN.map(([f, label]) => {
            const aan = maat === f
            return (
              <button key={f} onClick={() => kiesMaat(f)} aria-pressed={aan} style={{
                flex: 1, minWidth: 0, minHeight: 44, padding: '0.2rem 0', borderRadius: 999, border: 'none', fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
                background: aan ? '#fff' : 'transparent', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
                transition: 'background 0.15s ease, color 0.15s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 900, lineHeight: 1.15 }}>{label}</span>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, opacity: 0.7, lineHeight: 1.1 }}>±{Math.round(gramBasis * f / 5) * 5} g</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Het totaal rekent live mee met wat je aanpast. */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 26 : 34, margin: `1rem ${zij} 0`, padding: '0.9rem 0 0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {[[t.kcal, 'KCAL', '#10b981', ''], [t.eiwit, 'EIWIT', '#3b82f6', 'g'], [t.koolh, 'KOOLH', '#ec4899', 'g'], [t.vet, 'VET', '#f59e0b', 'g']].map(([n, l, kleur, g]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{Math.round(n)}{g}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: kleur }} />{l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: `0.3rem ${zij} 1rem` }}>

        {delen.map((d, i) => {
          const stap = stapVan(d)
          const f = d.g / 100
          const isOpen = open === i
          return (
            <div key={`${d.n}-${i}`} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.035)', border: `1px solid ${isOpen ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)'}` }}>
                <img src={resolveFoodImage({ name: d.n }, { size: 160 })} alt="" loading="lazy" onClick={() => { setOpen(isOpen ? null : i); setZoek(null) }}
                  style={{ width: 54, minHeight: 40, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a', cursor: 'pointer' }} />
                <div onClick={() => { setOpen(isOpen ? null : i); setZoek(null) }} style={{ flex: 1, minWidth: 0, padding: '0.22rem 0.3rem 0.22rem 0.6rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.n}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fff', marginTop: 2, whiteSpace: 'nowrap' }}>
                    {Math.round(d.k * f)}<span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.5)', margin: '0 7px 0 2px' }}>KCAL</span>
                    {[[d.e, 'E'], [d.kh, 'K'], [d.v, 'V']].filter(([x]) => Math.round(x * f) > 0).map(([x, l]) => (
                      <span key={l}>{Math.round(x * f)}<span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.5)', margin: '0 7px 0 2px' }}>{l}</span></span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.15rem 0.3rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => (d.g - stap <= 0 ? weg(i) : wijzig(i, d.g - stap))} aria-label="Minder" style={vak}><Minus size={15} strokeWidth={3} /></button>
                    <span style={{ minWidth: 50, textAlign: 'center', fontSize: '0.95rem', fontWeight: 900, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 1 }}>
                      {Math.round(d.g)}<span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginLeft: 1 }}>g</span>
                    </span>
                    <button onClick={() => wijzig(i, d.g + stap)} aria-label="Meer" style={vak}><Plus size={15} strokeWidth={3} /></button>
                  </div>
                  {d.st && <div style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>~{hoeveelTekst(d)}</div>}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0.15rem 0.2rem 0.3rem' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <button onClick={() => setZoek(zoek === i ? null : i)} style={{ ...tekstKnop, color: zoek === i ? GROEN : '#fff' }}><Repeat size={13} strokeWidth={2.8} /> Vervang</button>
                    <button onClick={() => weg(i)} style={tekstKnop}><Trash2 size={13} strokeWidth={2.6} /> Haal weg</button>
                  </div>
                  {zoek === i && <Zoeker db={db} onKies={kies} onSluit={() => setZoek(null)} placeholder={`Vervang ${d.n.toLowerCase()} door…`} />}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
          {zoek !== 'nieuw' && <button onClick={() => { setZoek('nieuw'); setOpen(null) }} style={{ ...tekstKnop, fontSize: '0.86rem' }}><Plus size={16} strokeWidth={3} /> Iets toevoegen</button>}
          {aangepast && zoek !== 'nieuw' && (
            <button onClick={() => { setDelen(JSON.parse(begin.current)); setMaat(1); setZoek(null); setOpen(null) }} style={{ ...tekstKnop, color: 'rgba(255,255,255,0.65)' }}>Standaard terugzetten</button>
          )}
        </div>
        {zoek === 'nieuw' && <Zoeker db={db} onKies={kies} onSluit={() => setZoek(null)} placeholder="Wat zat er nog meer bij?" />}
      </div>

      <div style={{
        position: 'sticky', bottom: 0, padding: `0.6rem ${zij} calc(0.7rem + env(safe-area-inset-bottom, 0px))`,
        background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button onClick={() => onKlaar(delen, aangepast, aantal, maat)} disabled={!delen.length} style={{
          width: '100%', minHeight: 50, borderRadius: 14, background: '#fff', border: '1px solid #fff', color: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', opacity: delen.length ? 1 : 0.4,
        }}>
          <Check size={17} strokeWidth={3.2} /> {alGekozen ? 'Bijwerken' : 'Toevoegen aan etentje'}
        </button>
        <button onClick={onVerwijder || onTerug} style={{ display: 'block', margin: '0.5rem auto 0', padding: '0.2rem 0.6rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>
          {onVerwijder ? 'Haal uit mijn etentje' : 'Niet toevoegen'}
        </button>
      </div>
    </div>
  )
}
