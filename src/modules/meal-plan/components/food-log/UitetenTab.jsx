// src/modules/meal-plan/components/food-log/UitetenTab.jsx
//
// Tab "Uiteten" in het logvenster (18 nov 2026, Kersten): een etentje loggen
// zonder zoeken of wegen. Je kiest het soort etentje, tikt aan wat je at
// (voor, hoofd, erbij, dessert, drinken), past zo nodig de portie aan, en logt
// het geheel als één maaltijd.
//
// De gerechten zijn schattingen voor een normale restaurantportie: goed genoeg
// om te loggen, niet op de gram. Geen foto-schatting (wil Kersten niet); wel
// hulp bij het schatten van de portie.
//
// Data: uitetenGerechten.json (gemaakt door scripts/uiteten/gerechten.py) plus
// wat de coach zelf toevoegde in tabel uiteten_gerechten (bron 'coach').

import { useEffect, useMemo, useState } from 'react'
import {
  Pizza, Fish, Salad, CookingPot, Flame, Soup, Wheat, Hamburger, Drumstick, Beef, Grape, Popcorn, Sandwich, Croissant, Beer,
  Utensils, ChevronLeft, Minus, Plus, Check, Hand, Info,
} from 'lucide-react'
import MealCard from '../day-schedule/MealCard'
import VAST from './uitetenGerechten.json'

const GROEN = '#10b981'
const SOORT_ICOON = {
  Italiaans: [Pizza, '#f97316'], Sushi: [Fish, '#60a5fa'], Grieks: [Salad, '#10b981'], 'Chinees en wok': [CookingPot, '#fb7185'],
  Indiaas: [Flame, '#f59e0b'], Thais: [Soup, '#a78bfa'], Mexicaans: [Wheat, '#eab308'], Burger: [Hamburger, '#d97706'],
  'Shoarma en doner': [Drumstick, '#fb923c'], 'Steak en grill': [Beef, '#ef4444'], 'Tapas en delen': [Grape, '#c084fc'],
  Pokebowl: [Salad, '#34d399'], Snackbar: [Popcorn, '#facc15'], Lunchroom: [Sandwich, '#d97706'], 'Ontbijt en brunch': [Croissant, '#fbbf24'],
  Borrel: [Beer, '#f59e0b'],
}
const GANGEN = [['voor', 'Voorgerecht'], ['hoofd', 'Hoofdgerecht'], ['bij', 'Erbij'], ['na', 'Dessert'], ['drank', 'Drinken']]
// Hoeveel at je ervan? Geen grammen: een deel van het bord.
const DELEN = [[0.5, 'Half'], [0.75, 'Driekwart'], [1, 'Heel'], [1.3, 'Groot bord']]

const vasteLijst = VAST.flatMap(([soort, rijen]) => rijen.map(([gang, naam, portie, kcal, eiwit, koolh, vet, keuze], i) => (
  { id: `${soort}|${gang}|${naam}`, soort, gang, naam, portie, kcal, eiwit, koolh, vet, keuze, positie: i }
)))

export default function UitetenTab({ db, onLog, isMobile, defaultMealMoment }) {
  const [soort, setSoort] = useState(null)
  const [gekozen, setGekozen] = useState({}) // id -> { aantal, deel }
  const [hulp, setHulp] = useState(false)
  const [info, setInfo] = useState(null) // id van het gerecht waarvan de details open staan
  const [bezig, setBezig] = useState(false)
  const [eigen, setEigen] = useState([])

  // Wat de coach zelf toevoegde, bovenop de vaste lijst.
  useEffect(() => {
    if (!db?.supabase) return
    db.supabase.from('uiteten_gerechten').select('id, soort, gang, naam, portie, kcal, eiwit, koolh, vet, keuze, positie')
      .eq('actief', true).eq('bron', 'coach').order('positie')
      .then(r => setEigen(r?.data || []), () => null)
  }, [db])

  const alle = useMemo(() => [...vasteLijst, ...eigen.map(r => ({ ...r, kcal: Number(r.kcal) || 0, eiwit: Number(r.eiwit) || 0, koolh: Number(r.koolh) || 0, vet: Number(r.vet) || 0 }))], [eigen])
  const soorten = useMemo(() => [...new Set(alle.map(r => r.soort))].filter(s => s !== 'alle'), [alle])
  const opId = useMemo(() => new Map(alle.map(r => [r.id, r])), [alle])

  const regels = Object.entries(gekozen).map(([id, k]) => {
    const r = opId.get(id); if (!r) return null
    const f = k.aantal * k.deel
    return { r, k, kcal: r.kcal * f, eiwit: r.eiwit * f, koolh: r.koolh * f, vet: r.vet * f }
  }).filter(Boolean)
  const totaal = regels.reduce((t, x) => ({ kcal: t.kcal + x.kcal, eiwit: t.eiwit + x.eiwit, koolh: t.koolh + x.koolh, vet: t.vet + x.vet }), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 })

  const tik = (id) => setGekozen(prev => {
    const n = { ...prev }
    if (n[id]) delete n[id]; else n[id] = { aantal: 1, deel: 1 }
    return n
  })
  const zet = (id, velden) => setGekozen(prev => (prev[id] ? { ...prev, [id]: { ...prev[id], ...velden } } : prev))

  const log = async () => {
    if (!regels.length || bezig) return
    setBezig(true)
    try {
      const deelTekst = (d) => (d === 1 ? '' : d === 0.5 ? ' (half)' : d === 0.75 ? ' (driekwart)' : ' (groot)')
      await onLog({
        name: `Uit eten: ${soort}`,
        type: 'custom', source: 'uiteten', per100g: false, amount: 1, per_unit: 'portion',
        calories: Math.round(totaal.kcal), protein: Math.round(totaal.eiwit), carbs: Math.round(totaal.koolh), fat: Math.round(totaal.vet),
        meal_type: defaultMealMoment || 'dinner',
        notes: 'Geschat uit de lijst Uiteten',
        ingredients: regels.map(({ r, k, kcal, eiwit, koolh, vet }) => ({
          name: `${r.naam}${deelTekst(k.deel)}`, amount: k.aantal, unit: 'portie',
          calories: Math.round(kcal), protein: Math.round(eiwit * 10) / 10, carbs: Math.round(koolh * 10) / 10, fat: Math.round(vet * 10) / 10,
        })),
      })
      setGekozen({})
    } finally { setBezig(false) }
  }

  const zij = isMobile ? '1rem' : '1.25rem'
  const kopje = { fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }

  // ── Stap 1: wat voor etentje? ──
  if (!soort) {
    return (
      <div style={{ padding: `0.4rem ${zij} 1.5rem` }}>
        <div style={{ ...kopje, margin: '0.2rem 0 0.2rem' }}>Waar eet je?</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.9rem' }}>
          Kies het soort etentje en tik aan wat je at. Wegen hoeft niet.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 4 }}>
          {soorten.map(s => {
            const [Icoon, kleur] = SOORT_ICOON[s] || [Utensils, '#fff']
            return (
              <button key={s} onClick={() => { setSoort(s); setGekozen({}) }} style={{
                display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 0.4rem', background: 'transparent', border: 'none',
                color: '#fff', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <Icoon size={22} strokeWidth={2.5} color={kleur} style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>{s}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Stap 2: wat at je? ──
  const [SoortIcoon, soortKleur] = SOORT_ICOON[soort] || [Utensils, '#fff']
  const vanSoort = alle.filter(r => r.soort === soort || r.soort === 'alle')
  const kleinKnop = { width: 30, height: 30, padding: 0, borderRadius: 999, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: `0.2rem ${zij} 0`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setSoort(null)} aria-label="Ander etentje" style={{ ...kleinKnop, border: 'none', width: 32, height: 36, marginLeft: -8 }}>
          <ChevronLeft size={22} strokeWidth={2.8} />
        </button>
        <SoortIcoon size={22} strokeWidth={2.5} color={soortKleur} />
        <span style={{ ...kopje, flex: 1, minWidth: 0 }}>{soort}</span>
        <button onClick={() => setHulp(v => !v)} aria-expanded={hulp} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 0.3rem', background: 'transparent', border: 'none',
          color: hulp ? GROEN : '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <Hand size={15} strokeWidth={2.6} /> Portie schatten
        </button>
      </div>

      {/* Je hele etentje in één blik: bovenaan, blijft staan bij het scrollen. Eén knop logt alles. */}
      {regels.length > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12,
          padding: `0.55rem ${zij}`, marginTop: '0.3rem', background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{Math.round(totaal.kcal)}<span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>KCAL</span></span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{Math.round(totaal.eiwit)}<span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>G EIWIT</span></span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {regels.reduce((n, x) => n + x.k.aantal, 0)} gekozen · {Math.round(totaal.koolh)} g koolh · {Math.round(totaal.vet)} g vet
            </div>
          </div>
          <button onClick={log} disabled={bezig} style={{
            minHeight: 44, padding: '0 1.1rem', borderRadius: 12, background: '#fff', border: '1px solid #fff', color: '#0a0a0a',
            fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer', opacity: bezig ? 0.6 : 1, flexShrink: 0,
          }}>{bezig ? 'Bezig…' : 'Log alles'}</button>
        </div>
      )}

      {hulp && (
        <div style={{ padding: `0.5rem ${zij} 0.2rem`, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          <div>Je vuist = een portie rijst, pasta of aardappel (ongeveer 200 kcal). Een restaurantbord pasta is 2 tot 3 vuisten.</div>
          <div>Je handpalm = een stuk vlees of vis van 120 tot 150 g.</div>
          <div>Je duim = een eetlepel saus, olie, mayo of pindakaas (ongeveer 100 kcal).</div>
          <div>Een handje = noten of chips (ongeveer 200 kcal).</div>
          <div style={{ color: '#fff', fontWeight: 900, marginTop: 4 }}>Niet alles opgegeten? Kies Half of Driekwart. Royaal opgeschept of extra saus? Kies Groot bord.</div>
        </div>
      )}

      <div style={{ flex: 1, padding: `0 ${zij} 1rem` }}>
        {GANGEN.map(([gang, titel]) => {
          const lijst = vanSoort.filter(r => r.gang === gang)
          if (!lijst.length) return null
          return (
            <div key={gang}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '1.1rem 0 0.2rem' }}>{titel}</div>
              {lijst.map(r => {
                const k = gekozen[r.id]
                const f = k ? k.aantal * k.deel : 1
                const hoek = { width: 34, height: 30, padding: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
                return (
                  <div key={r.id} style={{ margin: `0 -${zij}` }}>
                    {/* Dezelfde kaart als overal in de app: foto, naam, macro's; rechts info en toevoegen. */}
                    <MealCard
                      meal={{ name: r.naam, calories: r.kcal * f, protein: r.eiwit * f, carbs: r.koolh * f, fat: r.vet * f }}
                      momentLabel=""
                      naNaam={r.portie}
                      label={r.keuze === 'top' ? <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.04em', color: GROEN }}>SLIMME KEUZE</span> : null}
                      compact isMobile={isMobile} geselecteerd={!!k}
                      onTik={() => tik(r.id)} onCheck={() => tik(r.id)}
                      rechts={
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginRight: -6 }}>
                          <button onClick={(e) => { e.stopPropagation(); setInfo(v => (v === r.id ? null : r.id)) }} aria-label="Info" style={{ ...hoek, opacity: info === r.id ? 1 : 0.6 }}>
                            <Info size={17} strokeWidth={2.6} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); tik(r.id) }} aria-label={k ? 'Weghalen' : 'Toevoegen'} style={hoek}>
                            <span style={{ width: 24, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: k ? GROEN : '#fff', color: k ? '#fff' : '#0a0a0a' }}>
                              {k ? <Check size={15} strokeWidth={3.5} /> : <Plus size={16} strokeWidth={3.2} />}
                            </span>
                          </button>
                        </div>
                      }
                      acties={[]}
                    />
                    {info === r.id && (
                      <div style={{ margin: `-0.1rem ${zij} 0.5rem`, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        <div><span style={{ color: '#fff', fontWeight: 900 }}>Portie:</span> {r.portie}</div>
                        <div>{Math.round(r.kcal)} kcal · {Math.round(r.eiwit)} g eiwit · {Math.round(r.koolh)} g koolhydraten · {Math.round(r.vet)} g vet</div>
                        <div style={{ color: r.keuze === 'top' ? GROEN : 'rgba(255,255,255,0.6)' }}>
                          {r.keuze === 'top' ? 'Slimme keuze: veel eiwit of weinig kcal voor wat je krijgt.' : r.keuze === 'zwaar' ? 'Zwaar: veel kcal. Prima af en toe; kies Half als je deelt of laat staan.' : 'Gewone keuze. Let op de portie.'}
                        </div>
                      </div>
                    )}
                    {k && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: `0 ${zij} 0.6rem` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => (k.aantal <= 1 ? tik(r.id) : zet(r.id, { aantal: k.aantal - 1 }))} aria-label="Minder" style={kleinKnop}><Minus size={15} strokeWidth={3} /></button>
                          <span style={{ minWidth: 18, textAlign: 'center', fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{k.aantal}</span>
                          <button onClick={() => zet(r.id, { aantal: Math.min(12, k.aantal + 1) })} aria-label="Meer" style={kleinKnop}><Plus size={15} strokeWidth={3} /></button>
                        </div>
                        {gang !== 'drank' && (
                          <div style={{ display: 'flex', gap: 14 }}>
                            {DELEN.map(([d, label]) => (
                              <button key={d} onClick={() => zet(r.id, { deel: d })} style={{
                                padding: '0.3rem 0', background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 900, color: k.deel === d ? GROEN : 'rgba(255,255,255,0.55)',
                                borderBottom: `2px solid ${k.deel === d ? GROEN : 'transparent'}`,
                              }}>{label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: '1rem 0 0' }}>
          Dit zijn schattingen voor een normale restaurantportie. Loggen is hier belangrijker dan op de gram kloppen.
        </div>
      </div>

    </div>
  )
}
