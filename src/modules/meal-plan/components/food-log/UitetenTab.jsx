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
  Pizza, Fish, Salad, CookingPot, Flame, Soup, Wheat, Hamburger, Drumstick, Beef, Grape, Popcorn, Sandwich, Croissant, Beer, Wine,
  Utensils, ChevronLeft, ChevronDown, BadgeCheck, Minus, Plus, Check, Hand, Info, Search, X,
} from 'lucide-react'
import MealCard from '../day-schedule/MealCard'
import { resolveFoodImage } from '../../foodImageFallback'
import VAST from './uitetenGerechten.json'
// Vaste Unsplash-foto per gerecht (naam -> foto). Ontbreekt er een, dan kiest de app zelf een foto bij de naam.
import FOTOS from './uitetenFotos.json'
// Waar elk gerecht uit bestaat (brood, vlees, saus…), voor het detailscherm. Sleutel = soort|gang|naam.
import OPBOUW from './uitetenDelen.json'
import UitetenDetail, { somDelen } from './UitetenDetail'
import useZoekLog from './useZoekLog'

const plat = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Welke maat koos je de vorige keer bij dit gerecht? Per toestel onthouden; lukt het niet, dan zonder.
const VORIGE_SLEUTEL = 'myarc_uiteten_maat'
const leesVorige = () => { try { return JSON.parse(localStorage.getItem(VORIGE_SLEUTEL) || '{}') || {} } catch { return {} } }
const bewaarVorige = (id, deel) => { try { localStorage.setItem(VORIGE_SLEUTEL, JSON.stringify({ ...leesVorige(), [id]: deel })) } catch { /* privévenster of vol: dan geen suggestie */ } }

const fotoVan = (naam) => (FOTOS[naam] ? `${FOTOS[naam]}?w=300&h=300&fit=crop&q=70` : null)

const GROEN = '#10b981'
const SOORT_ICOON = {
  Italiaans: [Pizza, '#f97316'], Sushi: [Fish, '#60a5fa'], Grieks: [Salad, '#10b981'], 'Chinees en wok': [CookingPot, '#fb7185'],
  Indiaas: [Flame, '#f59e0b'], Thais: [Soup, '#a78bfa'], Mexicaans: [Wheat, '#eab308'], Burger: [Hamburger, '#d97706'],
  'Shoarma en doner': [Drumstick, '#fb923c'], 'Steak en grill': [Beef, '#ef4444'], 'Tapas en delen': [Grape, '#c084fc'],
  Pokebowl: [Salad, '#34d399'], Snackbar: [Popcorn, '#facc15'], Lunchroom: [Sandwich, '#d97706'], 'Ontbijt en brunch': [Croissant, '#fbbf24'],
  Borrel: [Beer, '#f59e0b'], Drinken: [Wine, '#f472b6'],
}
// De tegel Drinken toont alle drankjes, in deze groepen.
const DRINKEN = 'Drinken'
const DRANK_GROEPEN = ['Bier', 'Wijn', 'Cocktails', 'Sterk en mix', 'Fris en water', 'Koffie en thee', 'Sap en shakes']
// Foto op de tegel van elke soort: het gerecht dat die keuken het best laat zien.
const SOORT_FOTO = {
  Italiaans: 'Pizza margherita', Sushi: 'California roll', Grieks: 'Griekse salade', 'Chinees en wok': 'Bami goreng',
  Indiaas: 'Chicken tikka masala', Thais: 'Pad thai kip', Mexicaans: "Taco's", Burger: 'Hamburger',
  'Shoarma en doner': 'Broodje shoarma', 'Steak en grill': 'Ribeye', 'Tapas en delen': "Gamba's in knoflookolie",
  Pokebowl: 'Pokebowl zalm', Snackbar: 'Friet', Lunchroom: 'Clubsandwich', 'Ontbijt en brunch': 'American pancakes', Borrel: 'Bitterballen',
}
const tegelFoto = (soort) => (soort === DRINKEN && FOTOS.Drinken ? `${FOTOS.Drinken}?w=500&h=320&fit=crop&q=70` : FOTOS[SOORT_FOTO[soort]] ? `${FOTOS[SOORT_FOTO[soort]]}?w=500&h=320&fit=crop&q=70` : null)
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

const vasteLijst = VAST.flatMap(([soort, rijen]) => rijen.map(([gang, naam, portie, kcal, eiwit, koolh, vet, keuze, zoek = '', groep = null, kort = 1], i) => {
  const id = `${soort}|${gang}|${naam}`
  const delen = Array.isArray(OPBOUW[id]) && OPBOUW[id].length ? OPBOUW[id] : null
  // Met een opbouw is de som van de onderdelen het getal: dan klopt de kaart met het detailscherm.
  const t = delen ? somDelen(delen) : { kcal, eiwit, koolh, vet }
  return { id, soort, gang, naam, portie, kcal: Math.round(t.kcal), eiwit: Math.round(t.eiwit), koolh: Math.round(t.koolh), vet: Math.round(t.vet), keuze, positie: i, delen, zoek, groep, kort: !!kort }
}))

export default function UitetenTab({ db, client = null, onLog, isMobile, defaultMealMoment }) {
  const [soort, setSoort] = useState(null)
  const [gekozen, setGekozen] = useState({}) // id -> { aantal, deel }
  const [hulp, setHulp] = useState(false)
  const [zoek, setZoek] = useState('')
  const [maatOpen, setMaatOpen] = useState(null) // id van het net toegevoegde gerecht: daaronder staat kort de maatkeuze
  const [uitgeklapt, setUitgeklapt] = useState(false) // het stapeltje bovenaan open: je keuzes als kaarten
  const [detail, setDetail] = useState(null) // id van het gerecht waarvan het detailscherm open staat
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
  // Wat klanten het vaakst doen staat bovenaan (Kersten, 18 nov 2026); de rest in de volgorde van de lijst.
  const soorten = useMemo(() => {
    const eerst = ['Borrel', 'Steak en grill', 'Shoarma en doner', 'Burger', 'Snackbar']
    const lijst = [...new Set(alle.map(r => r.soort))].filter(s => s !== 'alle')
    // Drinken is een eigen tegel met alle drankjes, direct na de vijf bovenaan.
    return [...eerst.filter(s => lijst.includes(s)), DRINKEN, ...lijst.filter(s => !eerst.includes(s))]
  }, [alle])
  const opId = useMemo(() => new Map(alle.map(r => [r.id, r])), [alle])

  // Zoeken gaat door alle soorten heen: "friet", "wijn", "carbonara". Elk gerecht één keer (Friet staat bij vier soorten).
  const zoekWoorden = useMemo(() => plat(zoek).split(/\s+/).filter(w => w.length >= 2), [zoek])
  const zoekActief = zoekWoorden.length > 0
  const zoekTreffers = useMemo(() => {
    if (!zoekWoorden.length) return []
    const gezien = new Set()
    return alle.filter(r => {
      const t = plat(`${r.naam} ${r.soort} ${r.portie} ${r.zoek || ''} ${r.groep || ''}`)
      if (!zoekWoorden.every(w => t.includes(w))) return false
      const sleutel = `${plat(r.naam)}|${r.kcal}`
      if (gezien.has(sleutel)) return false
      gezien.add(sleutel); return true
    })
  }, [zoekWoorden, alle])
  // Elke zoekpoging gaat naar zoek_log (modus 'uiteten'): wat klanten zoeken en
  // niet vinden is wat er nog in de lijst moet (18 nov 2026: "weizen" gaf niets).
  const zoekLog = useZoekLog({ db, client, modus: 'uiteten', context: 'uiteten' })
  useEffect(() => {
    if (zoek.trim().length >= 2) zoekLog.noteer(zoek, zoekTreffers.map(r => ({ name: r.naam })))
  }, [zoek, zoekTreffers]) // eslint-disable-line react-hooks/exhaustive-deps

  const regels = Object.entries(gekozen).map(([id, k]) => {
    const r = opId.get(id); if (!r) return null
    // Zelf aangepast in het detailscherm: dan tellen die onderdelen, zonder maat erbovenop.
    const basis = k.delen ? somDelen(k.delen) : r
    const f = k.aantal * (k.delen ? 1 : k.deel)
    return { r, k, kcal: basis.kcal * f, eiwit: basis.eiwit * f, koolh: basis.koolh * f, vet: basis.vet * f }
  }).filter(Boolean)
  const totaal = regels.reduce((t, x) => ({ kcal: t.kcal + x.kcal, eiwit: t.eiwit + x.eiwit, koolh: t.koolh + x.koolh, vet: t.vet + x.vet }), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 })

  const tik = (id) => {
    if (zoekActief && !gekozen[id]) { const r = opId.get(id); zoekLog.gekozen({ name: r?.naam, id, source: 'uiteten' }, zoekTreffers.findIndex(x => x.id === id)) }
    tikStil(id)
  }
  const tikStil = (id) => setGekozen(prev => {
    const n = { ...prev }
    if (n[id]) delete n[id]; else n[id] = { aantal: 1, deel: 1 }
    return n
  })
  const zet = (id, velden) => setGekozen(prev => (prev[id] ? { ...prev, [id]: { ...prev[id], ...velden } } : prev))

  const log = async () => {
    if (!regels.length || bezig) return
    setBezig(true)
    try {
      const deelTekst = (d, k) => (k?.zelf ? ' (aangepast)' : d === 1 ? '' : d < 1 ? ' (klein)' : d > 1.5 ? ' (enorm)' : ' (groot)')
      await onLog({
        name: soort === DRINKEN ? 'Drankjes' : soort ? `Uit eten: ${soort}` : 'Uit eten',
        type: 'custom', source: 'uiteten', per100g: false, amount: 1, per_unit: 'portion',
        calories: Math.round(totaal.kcal), protein: Math.round(totaal.eiwit), carbs: Math.round(totaal.koolh), fat: Math.round(totaal.vet),
        meal_type: defaultMealMoment || 'dinner',
        notes: 'Geschat uit de lijst Uiteten',
        ingredients: regels.map(({ r, k, kcal, eiwit, koolh, vet }) => ({
          name: `${r.naam}${deelTekst(k.deel, k)}`, amount: k.aantal, unit: 'portie',
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
    const basis = k?.delen ? somDelen(k.delen) : r
    const f = k ? k.aantal * (k.delen ? 1 : k.deel) : 1
    return (
      <div key={r.id} style={{ margin: `0 -${zij}` }}>
        {/* Dezelfde kaart als overal in de app: foto, naam, macro's; rechts info en toevoegen. */}
        <MealCard
          meal={{ name: r.naam, image_url: r.image_url || fotoVan(r.naam), calories: basis.kcal * f, protein: basis.eiwit * f, carbs: basis.koolh * f, fat: basis.vet * f }}
          momentLabel=""
          naNaam={zoekActief && r.soort !== 'alle' ? `${r.soort} · ${r.portie}` : r.portie}
          label={r.keuze === 'top' ? <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.04em', color: GROEN }}>SLIMME KEUZE</span> : null}
          compact lageActies isMobile={isMobile} geselecteerd={!!k}
          // Tik op de kaart: eerst kijken wat erin zit, daar kies je of je hem toevoegt. De plus rechts voegt direct toe.
          onTik={() => setDetail(r.id)} onCheck={() => setDetail(r.id)}
          // Onderaan de kaart dezelfde knoppenrij als op een planmaaltijd: links direct toevoegen, rechts naar de info.
          acties={[
            k
              ? { icon: <Check size={13} strokeWidth={3.2} />, label: 'Toegevoegd, tik om weg te halen', onClick: () => { tik(r.id); setMaatOpen(null) }, kleur: GROEN }
// Plus = de maatkeuze klapt onder de kaart uit; pas na je keuze zit het gerecht in je etentje. Een drankje gaat er direct in.
              : { icon: <Plus size={13} strokeWidth={3} />, label: 'Toevoegen', onClick: () => (gang === 'drank' ? tik(r.id) : setMaatOpen(v => (v === r.id ? null : r.id))) },
            { icon: <Info size={13} strokeWidth={2.8} />, label: 'Info en aanpassen', onClick: () => setDetail(r.id) },
          ]}
        />
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
          <button onClick={() => setUitgeklapt(v => !v)} aria-expanded={uitgeklapt} aria-label="Bekijk en wijzig wat je koos" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 0 0 4px', background: 'transparent', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
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
            <ChevronDown size={16} strokeWidth={3} color="#fff" style={{ marginLeft: 5, transition: 'transform 0.15s ease', transform: uitgeklapt ? 'rotate(180deg)' : 'none' }} />
          </button>
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

  // Uitgeklapt: wat je koos als kaarten, om aantal en maat te wijzigen of iets weg te halen.
  const gekozenLijst = uitgeklapt && regels.length > 0 && (
    <div style={{ padding: `0.5rem ${zij} 0.3rem`, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      {regels.map(x => kaart(x.r))}
    </div>
  )

  // Na de plus: een klein venster dat over de pagina zweeft met de maatkeuze.
  // Pas na je keuze zit het gerecht in je etentje; ernaast tikken sluit het zonder toe te voegen.
  const maatGerecht = maatOpen ? opId.get(maatOpen) : null
  const maatVenster = maatGerecht && !gekozen[maatGerecht.id] && (
    <div onClick={() => setMaatOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, animation: 'uitetenIn 0.15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(460px, 100%)', padding: '1rem 0 0', borderRadius: 18, background: '#161616', boxShadow: '0 24px 60px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 1rem 0.8rem' }}>
          <img src={maatGerecht.image_url || fotoVan(maatGerecht.naam) || resolveFoodImage({ name: maatGerecht.naam }, { size: 120 })} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{maatGerecht.naam}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>Hoe groot was het?</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.06)' }}>
          {DELEN.map(([d, label]) => {
            const gram = (maatGerecht.delen ? maatGerecht.delen.reduce((n, x) => n + x.g, 0) : gramVan(maatGerecht)) * d
            // Suggestie: wat jij hier de vorige keer koos; anders Middel, de gewone restaurantportie.
            const vorige = leesVorige()[maatGerecht.id]
            const tip = vorige === d ? 'jouw vorige' : (vorige == null && d === 1 ? 'meestal' : null)
            return (
              <button key={d} onClick={() => { tik(maatGerecht.id); zet(maatGerecht.id, { deel: d }); bewaarVorige(maatGerecht.id, d); setMaatOpen(null) }} style={{
                position: 'relative', flex: 1, minWidth: 0, minHeight: 88, padding: '0.7rem 0 0.6rem', borderRadius: 0, border: 'none', fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: tip ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1.15 }}>{label}</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 900, lineHeight: 1.25, marginTop: 3, whiteSpace: 'nowrap' }}>{Math.round(maatGerecht.kcal * d)} kcal</span>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, opacity: 0.6, lineHeight: 1.25, whiteSpace: 'nowrap' }}>±{Math.round(gram / 5) * 5} g</span>
                {/* De suggestie: blauw vinkje linksboven, half over de rand van de balk. */}
                {tip && (
                  <span title={tip === 'meestal' ? 'Meestal gekozen' : 'Jouw vorige keuze'} style={{ position: 'absolute', top: -10, left: 8, display: 'flex', borderRadius: 999, background: '#161616' }}>
                    <BadgeCheck size={20} strokeWidth={2.6} color="#3b82f6" fill="#161616" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <style>{'@keyframes uitetenIn { from { opacity: 0 } to { opacity: 1 } }'}</style>
      </div>
    </div>
  )

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

  // ── Detailscherm: wat zit erin, en aanpassen voor je toevoegt ──
  if (detail && opId.get(detail)) {
    const r = opId.get(detail)
    const k = gekozen[r.id]
    // Geen opbouw bekend (eigen gerecht van de coach): dan het gerecht zelf als één onderdeel.
    const g = gramVan(r)
    const standaard = r.delen || [{ n: r.naam, g, k: Math.round(r.kcal / g * 100), e: Math.round(r.eiwit / g * 1000) / 10, kh: Math.round(r.koolh / g * 1000) / 10, v: Math.round(r.vet / g * 1000) / 10 }]
    return (
      <UitetenDetail key={r.id} gerecht={r} standaard={standaard} start={k?.delen || standaard} startAantal={k?.aantal || 1} startMaat={k?.delen ? (k.zelf ? null : k.deel) : 1} alGekozen={!!k} db={db} isMobile={isMobile}
        foto={r.image_url || fotoVan(r.naam)}
        onTerug={() => setDetail(null)}
        onVerwijder={k ? () => { tikStil(r.id); setDetail(null) } : null}
        onKlaar={(delen, aangepast, aantal, maat) => {
          // maat = Klein/Middel/Groot/Enorm als factor; null = zelf onderdelen aangepast.
          setGekozen(prev => {
            const nieuw = { aantal: aantal || 1, deel: maat || 1 }
            if (aangepast) { nieuw.delen = delen; nieuw.zelf = maat == null }
            return { ...prev, [r.id]: nieuw }
          })
          setDetail(null)
        }} />
    )
  }

  // ── Stap 1: wat voor etentje? ──
  if (!soort && !zoekActief) {
    return (
      <div>
      {zoekBalk}
      {totaalBalk}
      {gekozenLijst}
      {maatVenster}
      <div style={{ padding: `0.2rem ${zij} 1.5rem` }}>
        <div style={{ ...kopje, margin: '0.2rem 0 0.2rem' }}>{regels.length > 0 ? 'Nog iets erbij?' : 'Waar eet je?'}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.9rem' }}>
          Kies het soort etentje en tik aan wat je at. Wegen hoeft niet.
        </div>
        {/* Fototegels: de foto iets donkerder, de naam dik wit in het midden. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {soorten.map(s => {
            const [Icoon, kleur] = SOORT_ICOON[s] || [Utensils, '#fff']
            const foto = tegelFoto(s)
            return (
              <button key={s} onClick={() => setSoort(s)} style={{
                position: 'relative', aspectRatio: '16 / 10', padding: 0, borderRadius: 14, overflow: 'hidden', border: 'none', background: '#161616',
                cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {foto && <img src={foto} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                <span style={{ position: 'absolute', inset: 0, background: foto ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.6) 100%)' : 'transparent' }} />
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 0.5rem',
                  color: '#fff', fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, textAlign: 'center',
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                }}>
                  {!foto && <Icoon size={24} strokeWidth={2.5} color={kleur} />}
                  {s}
                </span>
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
  const isDrinken = soort === DRINKEN
  const vanSoort = zoekActief
    ? zoekTreffers
    : isDrinken
      // Alle drankjes, ook die bij één keuken horen (mango lassi, margarita); elk één keer.
      ? alle.filter(r => r.gang === 'drank').filter((r, i, l) => l.findIndex(x => x.naam === r.naam) === i)
      // Bij een etentje alleen de gewone drankjes; de rest staat onder de tegel Drinken.
      : alle.filter(r => r.soort === soort || (r.soort === 'alle' && (r.gang !== 'drank' || r.kort)))
  const groepen = isDrinken && !zoekActief
    ? [...DRANK_GROEPEN, 'Overig'].map(g => [g, g, (r) => (r.groep || 'Overig') === g])
    : GANGEN.map(([gang, titel]) => [gang, titel, (r) => r.gang === gang])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {zoekBalk}
      <div style={{ padding: `0 ${zij} 0`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { setSoort(null); setZoek('') }} aria-label="Ander etentje" style={{ ...kleinKnop, border: 'none', width: 32, height: 36, marginLeft: -8 }}>
          <ChevronLeft size={22} strokeWidth={2.8} />
        </button>
        {!zoekActief && (tegelFoto(soort)
          ? <img src={tegelFoto(soort)} alt="" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a' }} />
          : <SoortIcoon size={22} strokeWidth={2.5} color={soortKleur} />)}
        <span style={{ ...kopje, flex: 1, minWidth: 0 }}>{zoekActief ? `${vanSoort.length} gevonden` : soort}</span>
        <span style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setHulp(v => !v)} aria-expanded={hulp} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 0.3rem', background: 'transparent', border: 'none',
          color: hulp ? GROEN : '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <Hand size={15} strokeWidth={2.6} /> Portie schatten
          </button>
          {/* Klein venster onder de knop, over de lijst heen: vier handmaten en de maten. */}
          {hulp && (<>
            <div onClick={() => setHulp(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 21, width: 'min(300px, calc(100vw - 32px))',
              padding: '0.8rem 0.9rem', borderRadius: 14, background: '#161616', boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['Vuist', 'rijst, pasta of aardappel · ±200 kcal'],
                  ['Bord pasta', '2 tot 3 vuisten'],
                  ['Handpalm', 'vlees of vis · 120 tot 150 g'],
                  ['Duim', 'saus, olie of mayo · ±100 kcal'],
                  ['Handje', 'noten of chips · ±200 kcal'],
                ].map(([wat, uitleg]) => (
                  <li key={wat} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: GROEN, flexShrink: 0, transform: 'translateY(-2px)' }} />
                    <span style={{ fontSize: '0.84rem', lineHeight: 1.3 }}>
                      <span style={{ fontWeight: 900, color: '#fff' }}>{wat}</span>
                      <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}> {uitleg}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', marginTop: 11, lineHeight: 1.35 }}>
                Middel = normale portie. Niet alles op: Klein. Royaal bord: Groot of Enorm.
              </div>
            </div>
          </>)}
        </span>
      </div>

      {/* Je hele etentje in één blik: bovenaan, blijft staan bij het scrollen. Eén knop logt alles. */}
      {totaalBalk}
      {gekozenLijst}
      {maatVenster}



      <div style={{ flex: 1, padding: `0 ${zij} 1rem` }}>
        {zoekActief && vanSoort.length === 0 && (
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', margin: '1rem 0 0', lineHeight: 1.45 }}>
            "{zoek.trim()}" staat nog niet in de lijst. We hebben je zoekopdracht bewaard en vullen de lijst ermee aan.
            <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Kies voor nu iets wat erop lijkt, of log het via Producten.</div>
          </div>
        )}
        {groepen.map(([sleutel, titel, hoort]) => {
          const lijst = vanSoort.filter(hoort)
          if (!lijst.length) return null
          return (
            <div key={sleutel}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '1.1rem 0 0.2rem' }}>{titel}</div>
              {lijst.map(r => kaart(r, r.gang))}
              {/* Bij een etentje staan alleen de gewone drankjes; de volledige kaart zit achter deze knop. */}
              {sleutel === 'drank' && !isDrinken && !zoekActief && (
                <button onClick={() => setSoort(DRINKEN)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.35rem 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <Wine size={16} strokeWidth={2.6} color="#f472b6" /> Alle drankjes
                </button>
              )}
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
