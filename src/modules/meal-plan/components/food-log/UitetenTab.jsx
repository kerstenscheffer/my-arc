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
  Utensils, ChevronLeft, Minus, Plus, Check, Hand, Info, Search, X,
} from 'lucide-react'
import MealCard from '../day-schedule/MealCard'
import { resolveFoodImage } from '../../foodImageFallback'
import VAST from './uitetenGerechten.json'
// Vaste Unsplash-foto per gerecht (naam -> foto). Ontbreekt er een, dan kiest de app zelf een foto bij de naam.
import FOTOS from './uitetenFotos.json'

const fotoVan = (naam) => (FOTOS[naam] ? `${FOTOS[naam]}?w=300&h=300&fit=crop&q=70` : null)

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
const DELEN = [[0.7, 'Klein'], [1, 'Middel'], [1.3, 'Groot'], [1.7, 'Enorm']]

// Ongeveer hoeveel gram een normale portie weegt, zodat je bij Klein / Middel /
// Groot / Enorm een gewicht ziet. Staat het gewicht in de portie ("200 g"),
// dan dat; anders geschat uit de kcal en hoe compact dit soort eten is
// (kcal per gram). Het is een richtgetal, afgerond op 25 gram.
const DICHTHEID = [
  [/soep|minestrone|tom yum|tom kha|miso/, 0.5], [/salade|wakame|edamame|groente|fruit/, 1.0],
  [/pizza|naan|brood|broodje|tosti|croissant|bagel|bruschetta|sandwich|wrap|durum|pita/, 2.5],
  [/friet|patat|chips|nacho|kroepoek|uienringen|bitterbal|kroket|frikandel|souffle|loempia|samosa|nugget|kaasstengel|schijf|tempura|calamares/, 2.8],
  [/burger|kapsalon|shoarma|doner|gyros/, 2.2], [/pasta|spaghetti|lasagne|risotto|pad thai|bami|nasi|rijst|biryani|noodle/, 1.6],
  [/sushi|maki|nigiri|roll|sashimi|poke/, 1.5], [/curry|masala|butter chicken|rogan|dal|paneer|tjap tjoy|chili|moussaka|foe yong/, 1.3],
  [/biefstuk|ossenhaas|entrecote|ribeye|steak|kip|zalm|vis|dorade|souvlaki|sate|saté|spareribs|schnitzel|gamba|carpaccio|ham|eend/, 1.9],
  [/kaas|noot|chorizo|olijven|boter|saus|mayo|aioli|baklava/, 3.6], [/taart|cheesecake|tiramisu|brownie|mousse|panna|brulee|ijs|blanche|pancake/, 2.6],
  [/ei|omelet|uitsmijter|ontbijt|yoghurt|acai/, 1.5],
]
const gramVan = (r) => {
  const uit = /(\d{2,4})\s?g\b/.exec(String(r.portie || ''))
  if (uit) return Number(uit[1])
  const naam = String(r.naam || '').toLowerCase()
  const d = (DICHTHEID.find(([re]) => re.test(naam)) || [null, 1.8])[1]
  return Math.max(25, Math.round(r.kcal / d / 25) * 25)
}

const vasteLijst = VAST.flatMap(([soort, rijen]) => rijen.map(([gang, naam, portie, kcal, eiwit, koolh, vet, keuze], i) => (
  { id: `${soort}|${gang}|${naam}`, soort, gang, naam, portie, kcal, eiwit, koolh, vet, keuze, positie: i }
)))

export default function UitetenTab({ db, onLog, isMobile, defaultMealMoment }) {
  const [soort, setSoort] = useState(null)
  const [gekozen, setGekozen] = useState({}) // id -> { aantal, deel }
  const [hulp, setHulp] = useState(false)
  const [zoek, setZoek] = useState('')
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
      const deelTekst = (d) => (d === 1 ? '' : d < 1 ? ' (klein)' : d > 1.5 ? ' (enorm)' : ' (groot)')
      await onLog({
        name: soort ? `Uit eten: ${soort}` : 'Uit eten',
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

  const kleinKnop = { width: 30, height: 30, padding: 0, borderRadius: 999, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }
  // Eén gerecht als kaart, met eronder aantal en maat als hij gekozen is. `gang` bepaalt of de maat getoond wordt.
  const kaart = (r, gang = r.gang) => {
    const k = gekozen[r.id]
    const f = k ? k.aantal * k.deel : 1
    const hoek = { width: 34, height: 30, padding: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
    return (
      <div key={r.id} style={{ margin: `0 -${zij}` }}>
        {/* Dezelfde kaart als overal in de app: foto, naam, macro's; rechts info en toevoegen. */}
        <MealCard
          meal={{ name: r.naam, image_url: r.image_url || fotoVan(r.naam), calories: r.kcal * f, protein: r.eiwit * f, carbs: r.koolh * f, fat: r.vet * f }}
          momentLabel=""
          naNaam={zoekActief && r.soort !== 'alle' ? `${r.soort} · ${r.portie}` : r.portie}
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
              {r.keuze === 'top' ? 'Slimme keuze: veel eiwit of weinig kcal voor wat je krijgt.' : r.keuze === 'zwaar' ? 'Zwaar: veel kcal. Prima af en toe; kies Klein als je deelt of laat staan.' : 'Gewone keuze. Let op de portie.'}
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
              <div style={{ display: 'flex', gap: 16 }}>
                {DELEN.map(([d, label]) => (
                  <button key={d} onClick={() => zet(r.id, { deel: d })} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    padding: '0.15rem 0 0.25rem', background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer',
                    color: k.deel === d ? GROEN : 'rgba(255,255,255,0.55)',
                    borderBottom: `2px solid ${k.deel === d ? GROEN : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.85 }}>±{Math.round(gramVan(r) * d / 5) * 5} g</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  // Je hele etentje in één blik; staat op elk scherm van de tab zodra je iets koos.
  const totaalBalk = regels.length > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12,
          padding: `0.55rem ${zij}`, marginTop: '0.3rem', background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Wat je koos als stapeltje foto's: laatste bovenop. Tik op het stapeltje om naar boven te scrollen is niet nodig; weghalen doe je op de kaart. */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: 4 }}>
            {regels.slice(-4).map(({ r }, i, lijst) => (
              <span key={r.id} title={r.naam} style={{
                width: 40, height: 40, borderRadius: 12, marginLeft: i === 0 ? 0 : -18, flexShrink: 0, overflow: 'hidden',
                border: '2px solid #0a0a0a', background: '#1a1a1a', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                transform: `rotate(${(i - (lijst.length - 1) / 2) * 5}deg)`, zIndex: i,
              }}>
                <img src={r.image_url || fotoVan(r.naam) || resolveFoodImage({ name: r.naam }, { size: 120 })} alt="" loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </span>
            ))}
            {regels.length > 4 && (
              <span style={{ marginLeft: 6, fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>+{regels.length - 4}</span>
            )}
          </div>
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
  )

  // Zoeken gaat door alle soorten heen: "friet", "wijn", "carbonara".
  const plat = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const zoekWoorden = plat(zoek).split(/\s+/).filter(w => w.length >= 2)
  const zoekActief = zoekWoorden.length > 0
  const zoekBalk = (
    <div style={{ position: 'relative', margin: `0.2rem ${zij} 0.5rem` }}>
      <Search size={15} strokeWidth={2.6} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
      <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een gerecht of drankje" inputMode="search" enterKeyHint="search"
        style={{ width: '100%', boxSizing: 'border-box', height: 42, padding: '0 2.4rem 0 2.2rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
      {zoek && (
        <button onClick={() => setZoek('')} aria-label="Wis zoeken" style={{ position: 'absolute', right: 4, top: 4, width: 34, height: 34, padding: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={17} strokeWidth={2.8} />
        </button>
      )}
    </div>
  )

  // ── Stap 1: wat voor etentje? ──
  if (!soort && !zoekActief) {
    return (
      <div>
      {zoekBalk}
      {totaalBalk}
      {/* Wat je al koos blijft staan, ook als je terug bent bij de soorten: zo stapel je uit meerdere keukens. */}
      {regels.length > 0 && (
        <div style={{ padding: `0.6rem ${zij} 0.2rem` }}>
          <div style={{ ...kopje, marginBottom: '0.45rem' }}>Jouw etentje</div>
          {regels.map(x => kaart(x.r))}
        </div>
      )}
      <div style={{ padding: `0.2rem ${zij} 1.5rem` }}>
        <div style={{ ...kopje, margin: '0.2rem 0 0.2rem' }}>{regels.length > 0 ? 'Nog iets erbij?' : 'Waar eet je?'}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.9rem' }}>
          Kies het soort etentje en tik aan wat je at. Wegen hoeft niet.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 4 }}>
          {soorten.map(s => {
            const [Icoon, kleur] = SOORT_ICOON[s] || [Utensils, '#fff']
            return (
              <button key={s} onClick={() => setSoort(s)} style={{
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
      </div>
    )
  }

  // ── Stap 2: wat at je? ──
  const [SoortIcoon, soortKleur] = SOORT_ICOON[soort] || [Utensils, '#fff']
  // Zoekend: alle treffers, elk gerecht één keer (Friet staat bij vier soorten).
  const gezien = new Set()
  const vanSoort = zoekActief
    ? alle.filter(r => {
        const t = plat(`${r.naam} ${r.soort}`)
        if (!zoekWoorden.every(w => t.includes(w))) return false
        const sleutel = `${plat(r.naam)}|${r.kcal}`
        if (gezien.has(sleutel)) return false
        gezien.add(sleutel); return true
      })
    : alle.filter(r => r.soort === soort || r.soort === 'alle')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {zoekBalk}
      <div style={{ padding: `0 ${zij} 0`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { setSoort(null); setZoek('') }} aria-label="Ander etentje" style={{ ...kleinKnop, border: 'none', width: 32, height: 36, marginLeft: -8 }}>
          <ChevronLeft size={22} strokeWidth={2.8} />
        </button>
        {!zoekActief && <SoortIcoon size={22} strokeWidth={2.5} color={soortKleur} />}
        <span style={{ ...kopje, flex: 1, minWidth: 0 }}>{zoekActief ? `${vanSoort.length} gevonden` : soort}</span>
        <button onClick={() => setHulp(v => !v)} aria-expanded={hulp} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 0.3rem', background: 'transparent', border: 'none',
          color: hulp ? GROEN : '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <Hand size={15} strokeWidth={2.6} /> Portie schatten
        </button>
      </div>

      {/* Je hele etentje in één blik: bovenaan, blijft staan bij het scrollen. Eén knop logt alles. */}
      {totaalBalk}


      {hulp && (
        <div style={{ padding: `0.5rem ${zij} 0.2rem`, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          <div>Je vuist = een portie rijst, pasta of aardappel (ongeveer 200 kcal). Een restaurantbord pasta is 2 tot 3 vuisten.</div>
          <div>Je handpalm = een stuk vlees of vis van 120 tot 150 g.</div>
          <div>Je duim = een eetlepel saus, olie, mayo of pindakaas (ongeveer 100 kcal).</div>
          <div>Een handje = noten of chips (ongeveer 200 kcal).</div>
          <div style={{ color: '#fff', fontWeight: 900, marginTop: 4 }}>Middel is een normale restaurantportie. Niet alles opgegeten? Kies Klein. Royaal bord of extra saus? Kies Groot of Enorm.</div>
        </div>
      )}

      <div style={{ flex: 1, padding: `0 ${zij} 1rem` }}>
        {GANGEN.map(([gang, titel]) => {
          const lijst = vanSoort.filter(r => r.gang === gang)
          if (!lijst.length) return null
          return (
            <div key={gang}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '1.1rem 0 0.2rem' }}>{titel}</div>
              {lijst.map(r => kaart(r, gang))}
            </div>
          )
        })}
        <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '1.4rem 0 0.4rem' }}>
          Dit zijn schattingen voor een normale restaurantportie. Loggen is hier belangrijker dan op de gram kloppen.
        </div>
      </div>

    </div>
  )
}
