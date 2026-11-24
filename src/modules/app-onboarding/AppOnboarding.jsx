// src/modules/app-onboarding/AppOnboarding.jsx
//
// Onboarding voor nieuwe app-gebruikers zonder coaching (24 nov 2026).
//
// Stijl (Kersten, 24 nov 2026, naar voorbeeld van Yazio): simpel en speels.
//   - Effen donkere achtergrond, geen fotoslider.
//   - Kersten (mascotte) helemaal in beeld, per stap een andere houding.
//   - Hij "praat": grote witte tekst die getypt wordt. Geen kaders eromheen.
//   - Speelse 3D-knoppen die je indrukt; zo min mogelijk containers.
//   - Geen kleine of grijze letters. Korte zinnen (groep-3-taal).
//
// Route: /aanmelden. Met ?voorbeeld=1 wordt er niets aangemaakt (om te bekijken).
//
// Na de vragen:
//   1. app_macro_voorbeeld rekent calorieën en macro's (zonder account).
//   2. Account maken (e-mail + wachtwoord).
//   3. start_app_account maakt de klantrij, voorkeuren en macro's.
//   4. workout-bouwer → maak_intake_voedingsconcept → intake-maaltijden
//      bouwen de plannen; activeer_app_plannen zet ze direct actief (geen coach).
//   5. Naar de app; daar volgt de betaalmuur (gratis proefmaand).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { LaadLogo } from '../../components/LaadScherm'
import { supabase } from '../../lib/supabase'
import { THEMAS } from './onboardingThemas'

const VOORBEELD_URL = (() => { try { return new URLSearchParams(window.location.search).has('voorbeeld') } catch { return false } })()
const OPSLAG = 'myarc_app_onboarding'

// ── Stijlen ───────────────────────────────────────────────────────────────────
// Kersten (24 nov 2026): op /test meerdere stijlen naast elkaar om te kiezen.
// 'speels' = de Yazio-achtige versie; de rest is stoerder maar even simpel.
const ThemaCtx = createContext(THEMAS.arc)
const useT = () => useContext(ThemaCtx)
const VoorbeeldCtx = createContext(VOORBEELD_URL)

// ── De vragen ─────────────────────────────────────────────────────────────────
// soort: keuze (tikken = door), meer (meerdere, met Verder), getal, tekst.
const VRAGEN = [
  { k: 'voornaam', soort: 'tekst', vraag: 'Hoe heet je?', placeholder: 'Je naam' },
  { k: 'doel', soort: 'keuze', vraag: 'Wat wil je?', opties: [
    ['fat_loss', 'Vet kwijt'], ['muscle_gain', 'Meer spieren'], ['recomp', 'Strakker worden'], ['maintain', 'Fit blijven'],
  ] },
  { k: 'geslacht', soort: 'keuze', vraag: 'Ben je een man of een vrouw?', opties: [['male', 'Man'], ['female', 'Vrouw']] },
  { k: 'leeftijd', soort: 'getal', vraag: 'Hoe oud ben je?', eenheid: 'jaar', min: 16, max: 90, placeholder: '30' },
  { k: 'lengte', soort: 'getal', vraag: 'Hoe lang ben je?', eenheid: 'cm', min: 130, max: 230, placeholder: '180' },
  { k: 'gewicht', soort: 'getal', vraag: 'Hoe zwaar ben je nu?', eenheid: 'kg', min: 35, max: 250, decimaal: true, placeholder: '85' },
  { k: 'streefgewicht', soort: 'getal', vraag: 'Wat wil je wegen?', eenheid: 'kg', min: 35, max: 250, decimaal: true, placeholder: '78',
    tonen: a => a.doel !== 'maintain' },
  { k: 'activiteit', soort: 'keuze', vraag: 'Hoeveel beweeg je op een dag?', opties: [
    ['sedentary', 'Ik zit veel'], ['lightly_active', 'Ik loop soms'], ['moderately_active', 'Ik loop veel'], ['very_active', 'Ik werk met mijn lijf'],
  ] },
  { k: 'trainingen', soort: 'keuze', vraag: 'Hoe vaak wil je trainen?', opties: [['2', '2 keer per week'], ['3', '3 keer per week'], ['4', '4 keer per week'], ['5', '5 keer per week']] },
  { k: 'ervaring', soort: 'keuze', vraag: 'Hoe lang train je al?', opties: [
    ['beginner', 'Net begonnen'], ['intermediate', '1 tot 3 jaar'], ['advanced', 'Langer dan 3 jaar'],
  ] },
  { k: 'minuten', soort: 'keuze', vraag: 'Hoe lang mag een training duren?', opties: [['45', '45 minuten'], ['60', '1 uur'], ['75', '1 uur en 15 minuten'], ['90', '1,5 uur']] },
  { k: 'locatie', soort: 'keuze', vraag: 'Waar train je?', opties: [['gym', 'In de gym'], ['home', 'Thuis'], ['both', 'Allebei']] },
  { k: 'focus', soort: 'meer', vraag: 'Welke spieren wil je extra trainen?', sub: 'Kies er max 3.', max: 3, opties: [
    ['chest', 'Borst'], ['shoulders', 'Schouders'], ['arms', 'Armen'], ['back', 'Rug'], ['abs', 'Buik'],
    ['glutes', 'Billen'], ['quads', 'Benen voor'], ['hamstrings', 'Benen achter'], ['calves', 'Kuiten'],
  ] },
  { k: 'maaltijden', soort: 'keuze', vraag: 'Hoe vaak eet je per dag?', opties: [['3', '3 keer'], ['4', '4 keer'], ['5', '5 keer']] },
  { k: 'allergieen', soort: 'meer', vraag: 'Wat eet je niet?', sub: 'Eet je alles? Tik dan op Verder.', opties: [
    ['lactose', 'Lactose'], ['gluten', 'Gluten'], ['noten', 'Noten'], ['vis', 'Vis'], ['varkensvlees', 'Varkensvlees'],
    ['vegetarisch', 'Geen vlees'], ['vegan', 'Vegan'],
  ] },
]

// ── Stijl ─────────────────────────────────────────────────────────────────────
const kopVan = (T) => ({ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2, ...T.kop })
const subTekst = { fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0', lineHeight: 1.35 }
const foutStijl = { fontSize: '1.05rem', fontWeight: 900, color: '#f87171', textAlign: 'center' }

// Indrukeffect voor alle knoppen: bij tikken zakt de knop in zijn rand.
const knopCss = (T) => `
  .knop3d { transition: transform .08s ease, box-shadow .08s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .knop3d:not(:disabled):active { transform: ${T.druk}; box-shadow: none !important; }
  @keyframes draai { to { transform: rotate(360deg) } }
  @keyframes cursorKnipper { 50% { opacity: 0 } }
  @keyframes zweef { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
`

function WitteKnop({ children, disabled, style, ...props }) {
  const T = useT()
  return (
    <button className="knop3d" disabled={disabled} style={{
      width: '100%', minHeight: 58, padding: '0 1rem', border: 'none', borderRadius: T.radius,
      background: disabled ? '#4a4f52' : T.primair, boxShadow: disabled ? 'none' : T.schaduw(T.primairRand),
      color: disabled ? '#fff' : T.primairTekst, fontSize: '1.15rem', fontWeight: 900, fontFamily: 'inherit',
      textTransform: T.kop.textTransform || 'none',
      cursor: disabled ? 'not-allowed' : 'pointer', marginBottom: 5,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }} {...props}>{children}</button>
  )
}

// Startknop: rond met tekstwolkje (speels/vuur) of een brede knop (strak).
function RondeKnop({ label, onClick }) {
  const T = useT()
  if (!T.rond) {
    return <WitteKnop onClick={onClick}>{label} <ArrowRight size={22} strokeWidth={3} /></WitteKnop>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && (
        <div style={{ position: 'relative', marginBottom: 14, animation: 'zweef 2.4s ease-in-out infinite' }}>
          <div style={{ padding: '0.55rem 1.1rem', borderRadius: 16, border: `3px solid ${T.vakLijn}`, fontSize: '1.25rem', fontWeight: 900, color: T.accent, textTransform: T.kop.textTransform || 'none' }}>{label}</div>
          <span style={{
            position: 'absolute', left: '50%', bottom: -9, width: 14, height: 14, marginLeft: -7,
            background: T.bg, borderRight: `3px solid ${T.vakLijn}`, borderBottom: `3px solid ${T.vakLijn}`, transform: 'rotate(45deg)',
          }} />
        </div>
      )}
      <button className="knop3d" onClick={onClick} aria-label={label || 'Verder'} style={{
        width: 92, height: 92, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: T.primair, boxShadow: T.schaduw(T.primairRand).replace('5px', '7px'), color: T.primairTekst, marginBottom: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><ArrowRight size={38} strokeWidth={3} /></button>
    </div>
  )
}

function Veld({ style, ...props }) {
  const T = useT()
  return (
    <input {...props} style={{
      width: '100%', minHeight: 60, padding: '0 1.1rem',
      background: T.vak, border: `3px solid ${T.vakLijn}`, borderRadius: T.radius,
      color: '#fff', fontSize: '1.2rem', fontWeight: 900, outline: 'none', boxSizing: 'border-box',
      fontFamily: 'inherit', WebkitAppearance: 'none', ...style,
    }}
      onFocus={e => { e.target.style.borderColor = T.accent }}
      onBlur={e => { e.target.style.borderColor = T.vakLijn }}
    />
  )
}

function Optie({ actief, titel, onClick, vinkje }) {
  const T = useT()
  return (
    <button className="knop3d" onClick={onClick} style={{
      width: '100%', minHeight: 58, textAlign: vinkje ? 'left' : 'center', padding: '0 1.1rem', borderRadius: T.radius, cursor: 'pointer',
      background: actief ? (T.actief || T.primair) : T.vak, border: T.rand || 'none',
      boxShadow: T.schaduw(actief ? (T.actiefRand || T.primairRand) : T.vakRand),
      color: actief ? (T.actiefTekst || T.primairTekst) : '#fff', fontFamily: 'inherit', fontSize: '1.15rem', fontWeight: 900, marginBottom: 5,
      textTransform: T.kop.textTransform || 'none',
      display: 'flex', alignItems: 'center', justifyContent: vinkje ? 'space-between' : 'center', gap: 10,
    }}>
      {titel}
      {vinkje && actief && <Check size={20} strokeWidth={3.4} />}
    </button>
  )
}

// ── Kersten (mascotte) ────────────────────────────────────────────────────────
// Houdingen (door Kersten gemaakt, 24 nov 2026): per stap een andere pose.
const POSES = ['wijzen', 'denken', 'duim', 'juichen', 'spierballen']
const poseUrl = (pose) => `/mascottes/kersten-${POSES.includes(pose) ? pose : 'spierballen'}.webp`

// Helemaal in beeld met een schaduw onder zijn voeten. Ademt rustig; bij elke
// nieuwe stap (sleutel) springt hij in beeld; 'blij' = juichen.
function Kersten({ sleutel, hoogte, pose, blij }) {
  return (
    <div aria-hidden style={{ position: 'relative', height: hoogte, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <style>{`
        @keyframes gidsAdem { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-3px) scale(1.012) } }
        @keyframes gidsHop { 0% { transform: translateY(16px) scale(.94); opacity: 0 } 50% { transform: translateY(-10px) scale(1.02); opacity: 1 } 75% { transform: translateY(2px) } 100% { transform: none } }
        @keyframes gidsJuich { 0%,100% { transform: translateY(0) } 25% { transform: translateY(-16px) } 50% { transform: translateY(0) } 75% { transform: translateY(-10px) } }
      `}</style>
      {/* schaduw */}
      <div style={{ position: 'absolute', bottom: 0, width: hoogte * 0.42, height: hoogte * 0.06, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', filter: 'blur(2px)' }} />
      <div key={sleutel} style={{ height: '100%', animation: 'gidsHop 0.55s cubic-bezier(.3,1.4,.5,1) both', transformOrigin: '50% 100%' }}>
        <div style={{ height: '100%', animation: `${blij ? 'gidsJuich 1.2s ease-in-out 0.55s 2,' : ''} gidsAdem 3.6s ease-in-out infinite`, transformOrigin: '50% 100%' }}>
          <img src={poseUrl(pose)} alt="" draggable={false} style={{ display: 'block', height: '100%', width: 'auto' }} />
        </div>
      </div>
    </div>
  )
}

// Bovenlijf linksboven op de knoppen, alsof Kersten eroverheen kijkt
// (24 nov 2026). Het kader knipt hem af net onder de bovenrand van de eerste
// knop; die knop ligt erover, zodat de onderkant nooit zichtbaar is.
const KIJK = 118   // zichtbaar stuk boven de knoppen
const ONDER = 18   // stuk dat achter de eerste knop valt
const KIJK_FIGUUR = 250
function KerstenKijkt({ sleutel, pose }) {
  return (
    <div aria-hidden style={{ position: 'relative', zIndex: 0, height: KIJK + ONDER, width: Math.round(KIJK_FIGUUR * 2 / 3), overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ height: KIJK_FIGUUR }}>
        <Kersten sleutel={sleutel} hoogte={KIJK_FIGUUR} pose={pose} />
      </div>
    </div>
  )
}

// Typt een tekst letter voor letter. Begint opnieuw als de tekst verandert.
function useTypen(tekst, snelheid = 24) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!tekst) return
    let i = 0
    const t = setInterval(() => { i += 1; setN(i); if (i >= tekst.length) clearInterval(t) }, snelheid)
    return () => clearInterval(t)
  }, [tekst, snelheid])
  return { getypt: tekst.slice(0, n), klaar: n >= tekst.length }
}

// Wat Kersten zegt: groot, wit, gecentreerd, getypt. Vaste hoogte (onzichtbare
// volledige tekst eronder), zodat er niets verspringt tijdens het typen.
function Praat({ titel, zin, links = false, klein = false }) {
  const kop = { ...kopVan(useT()), ...(klein ? { fontSize: '1.4rem' } : {}) }
  const heel = zin ? `${titel}\n${zin}` : titel
  const { getypt, klaar } = useTypen(heel)
  const [t1, t2 = ''] = getypt.split('\n')
  const opRegel2 = getypt.includes('\n')
  const cursor = !klaar && <span style={{ display: 'inline-block', width: 3, height: '0.95em', background: '#fff', marginLeft: 3, verticalAlign: '-0.1em', animation: 'cursorKnipper 0.8s steps(1) infinite' }} />
  const blok = (a, b, zichtbaar) => (
    <div style={{ gridArea: '1 / 1', visibility: zichtbaar ? 'visible' : 'hidden' }}>
      <div style={kop}>{a}{zichtbaar && !opRegel2 ? cursor : null}</div>
      {zin && <div style={subTekst}>{b}{zichtbaar && opRegel2 ? cursor : null}</div>}
    </div>
  )
  return (
    <div style={{ display: 'grid', textAlign: links ? 'left' : 'center' }}>
      {blok(titel, zin, false)}
      {blok(t1, t2, true)}
    </div>
  )
}

// ── De pagina ─────────────────────────────────────────────────────────────────
export default function AppOnboarding({ thema = 'arc', voorbeeld = false }) {
  const T = THEMAS[thema] || THEMAS.arc
  return (
    <ThemaCtx.Provider value={T}>
      <VoorbeeldCtx.Provider value={voorbeeld || VOORBEELD_URL}>
        <Onboarding />
      </VoorbeeldCtx.Provider>
    </ThemaCtx.Provider>
  )
}

function Onboarding() {
  const T = useT()
  const VOORBEELD = useContext(VoorbeeldCtx)
  const [antw, setAntw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(OPSLAG) || '{}') || {} } catch { return {} }
  })
  // stap: 'intro' | index in de zichtbare vragen | 'rekenen' | 'resultaat' | 'account' | 'bouwen'
  const [stap, setStap] = useState('intro')
  const [macros, setMacros] = useState(null)
  const [fout, setFout] = useState(null)

  useEffect(() => { try { localStorage.setItem(OPSLAG, JSON.stringify(antw)) } catch { /* privé-venster */ } }, [antw])
  useEffect(() => { POSES.forEach(p => { const i = new Image(); i.src = poseUrl(p) }) }, [])

  const zichtbaar = useMemo(() => VRAGEN.filter(v => !v.tonen || v.tonen(antw)), [antw])
  const totaal = zichtbaar.length + 2 // + resultaat + account
  const positie = stap === 'intro' ? 0 : typeof stap === 'number' ? stap + 1 : stap === 'rekenen' || stap === 'resultaat' ? zichtbaar.length + 1 : totaal

  const zet = (k, w) => setAntw(a => ({ ...a, [k]: w }))
  const volgende = () => {
    if (typeof stap !== 'number') return
    if (stap + 1 < zichtbaar.length) setStap(stap + 1)
    else rekenen()
  }
  const terug = () => {
    setFout(null)
    if (stap === 'account') setStap('resultaat')
    else if (stap === 'resultaat') setStap(zichtbaar.length - 1)
    else if (stap === 0) setStap('intro')
    else if (typeof stap === 'number') setStap(stap - 1)
  }

  const rekenen = async () => {
    setStap('rekenen'); setFout(null)
    const [r] = await Promise.all([
      supabase.rpc('app_macro_voorbeeld', { p: antw }).then(x => x, e => ({ error: e })),
      new Promise(res => setTimeout(res, 2000)), // even het rekenmoment laten zien
    ])
    if (r?.error || !r?.data || r.data.fout) { setFout('Dat lukte niet. Check je internet.'); setStap(zichtbaar.length - 1); return }
    setMacros(r.data); setStap('resultaat')
  }

  const vraag = typeof stap === 'number' ? zichtbaar[stap] : null
  const Naam = antw.voornaam || ''
  const zegt = stap === 'intro' ? { titel: 'Hoi! Ik ben Kersten.', zin: 'Ik maak jouw plan. Het duurt 2 minuten.' }
    : vraag ? { titel: vraag.vraag, zin: vraag.sub }
    : stap === 'rekenen' ? { titel: 'Even rekenen…', zin: Naam ? `${Naam}, ik maak jouw plan.` : 'Ik maak jouw plan.' }
    : stap === 'resultaat' ? { titel: Naam ? `${Naam}, dit is jouw plan!` : 'Dit is jouw plan!' }
    : stap === 'account' ? { titel: 'Maak je account', zin: 'Zo bewaar je jouw plan.' }
    : { titel: Naam ? `Even wachten, ${Naam}` : 'Even wachten', zin: 'Ik zet alles voor je klaar.' }
  const pose = stap === 'intro' ? 'spierballen'
    : vraag ? (vraag.soort === 'getal' ? 'denken' : 'wijzen')
    : stap === 'rekenen' ? 'denken'
    : stap === 'resultaat' ? 'juichen'
    : 'duim'
  const groot = stap === 'intro' || stap === 'rekenen' || stap === 'bouwen'
  // Bij vragen en account kijkt Kersten linksboven over de knoppen.
  const kijkt = !!vraag || stap === 'account'

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.glow ? `${T.glow}, ${T.bg}` : T.bg, color: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <style>{knopCss(T)}</style>
      {T.font && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${T.font}&display=swap`} />}
      <div style={{
        minHeight: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top, 0px) + 0.75rem) 1.5rem calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
      }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column' }}>

          {/* Kop: logo + inloggen, of terug + voortgang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 48 }}>
            {stap === 'intro' ? (
              <>
                <div style={{ flex: 1 }} />
                <button onClick={() => { window.location.href = '/client-login' }} style={{
                  background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: '1.1rem', fontWeight: 900, padding: '0.5rem 0',
                }}>Inloggen</button>
              </>
            ) : (
              <>
                {stap !== 'rekenen' && stap !== 'bouwen' && (
                  <button onClick={terug} aria-label="Terug" style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex',
                  }}><ArrowLeft size={28} strokeWidth={3} /></button>
                )}
                <div style={{ flex: 1, height: 14, borderRadius: Math.min(7, T.radius), background: T.vak, border: T.rand ? '2px solid #fff' : 'none', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(6, Math.round((positie / totaal) * 100))}%`, height: '100%', background: T.accent, borderRadius: Math.min(7, T.radius), transition: 'width 0.35s ease' }} />
                </div>
              </>
            )}
          </div>

          {stap === 'intro' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}><LaadLogo boog={false} /></div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: groot ? 'center' : 'flex-start', paddingTop: groot ? 0 : '1rem' }}>
            {kijkt ? (
              <>
                {/* Kersten links, zijn tekst rechts; samen staan ze op de knoppen. */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: '0.5rem', marginBottom: -ONDER }}>
                  <KerstenKijkt sleutel={String(stap)} pose={pose} />
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: ONDER + 12 }}>
                    <Praat key={String(stap)} titel={zegt.titel} zin={zegt.zin} links klein />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Kersten sleutel={String(stap)} hoogte={groot ? 300 : 190} pose={pose} blij={stap === 'resultaat'} />
                <div style={{ marginTop: '1.4rem' }}>
                  <Praat key={String(stap)} titel={zegt.titel} zin={zegt.zin} />
                </div>
              </>
            )}

            <div style={{ marginTop: kijkt ? 0 : '1.75rem', position: 'relative', zIndex: 1 }}>
              {stap === 'intro' && (
                <>
                  <RondeKnop label="Start!" onClick={() => setStap(0)} />
                  {VOORBEELD && <div style={{ marginTop: '1rem', fontSize: '1.05rem', fontWeight: 900, color: T.accent, textAlign: 'center' }}>Voorbeeld: er wordt niets opgeslagen</div>}
                </>
              )}
              {vraag && <Vraag key={vraag.k} v={vraag} waarde={antw[vraag.k]} onZet={zet} onVolgende={volgende} fout={fout} />}
              {stap === 'rekenen' && <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 size={34} strokeWidth={3} style={{ animation: 'draai 1s linear infinite' }} /></div>}
              {stap === 'resultaat' && macros && <Resultaat macros={macros} antw={antw} onVerder={() => setStap('account')} />}
              {stap === 'account' && <Account antw={antw} onKlaar={() => setStap('bouwen')} />}
              {stap === 'bouwen' && <Bouwen antw={antw} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Vraag({ v, waarde, onZet, onVolgende, fout }) {
  const [tekst, setTekst] = useState(waarde != null ? String(waarde) : '')
  const getal = Number(String(tekst).replace(',', '.'))
  const getalOk = v.soort === 'getal' && tekst !== '' && getal >= v.min && getal <= v.max
  const tekstOk = v.soort === 'tekst' && tekst.trim().length >= 1

  const bevestig = () => {
    if (v.soort === 'getal' && getalOk) { onZet(v.k, v.decimaal ? Math.round(getal * 10) / 10 : Math.round(getal)); onVolgende() }
    if (v.soort === 'tekst' && tekstOk) { onZet(v.k, tekst.trim()); onVolgende() }
  }
  const kies = (w) => { onZet(v.k, w); setTimeout(onVolgende, 200) }
  const lijst = Array.isArray(waarde) ? waarde : []
  const wissel = (w) => {
    const nieuw = lijst.includes(w) ? lijst.filter(x => x !== w) : (v.max && lijst.length >= v.max ? lijst : [...lijst, w])
    onZet(v.k, nieuw)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fout && <div style={{ ...foutStijl, marginBottom: 6 }}>{fout}</div>}

      {v.soort === 'keuze' && v.opties.map(([w, t]) => (
        <Optie key={w} titel={t} actief={String(waarde) === w} onClick={() => kies(w)} />
      ))}

      {v.soort === 'meer' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {v.opties.map(([w, t]) => <Optie key={w} titel={t} vinkje actief={lijst.includes(w)} onClick={() => wissel(w)} />)}
          </div>
          <WitteKnop onClick={onVolgende} style={{ marginTop: 10 }}>Verder</WitteKnop>
        </>
      )}

      {(v.soort === 'getal' || v.soort === 'tekst') && (
        <form onSubmit={e => { e.preventDefault(); bevestig() }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Veld
              autoFocus value={tekst} onChange={e => setTekst(e.target.value)} placeholder={v.placeholder}
              inputMode={v.soort === 'getal' ? (v.decimaal ? 'decimal' : 'numeric') : 'text'}
              autoCapitalize={v.soort === 'tekst' ? 'words' : 'off'} autoComplete={v.k === 'voornaam' ? 'given-name' : 'off'}
              style={v.soort === 'getal' ? { fontSize: '2rem', minHeight: 76, textAlign: 'center', padding: '0 4.5rem' } : { textAlign: 'center' }}
            />
            {v.eenheid && <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{v.eenheid}</span>}
          </div>
          {v.soort === 'getal' && tekst !== '' && !getalOk && (
            <div style={{ ...foutStijl, color: '#fbbf24' }}>Kies een getal van {v.min} tot {v.max}.</div>
          )}
          <WitteKnop type="submit" disabled={!(getalOk || tekstOk)}>Verder</WitteKnop>
        </form>
      )}
    </div>
  )
}

function Resultaat({ macros, antw, onVerder }) {
  const T = useT()
  const [kcal, setKcal] = useState(0)
  useEffect(() => {
    const doelKcal = Number(macros.target_calories) || 0
    const start = performance.now()
    let id
    const tik = (t) => {
      const f = Math.min(1, (t - start) / 900)
      setKcal(Math.round(doelKcal * (1 - Math.pow(1 - f, 3))))
      if (f < 1) id = requestAnimationFrame(tik)
    }
    id = requestAnimationFrame(tik)
    return () => cancelAnimationFrame(id)
  }, [macros])

  const tempo = antw.streefgewicht && antw.gewicht && macros.doel === 'cut'
    ? Math.max(1, Math.round((antw.gewicht - antw.streefgewicht) / (antw.gewicht * 0.006)))
    : null

  const getal = (label, waarde) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{waarde}g</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.6rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: T.accent, ...(T.kop.fontFamily ? { fontFamily: T.kop.fontFamily, fontWeight: T.kop.fontWeight } : {}) }}>{kcal.toLocaleString('nl-NL')}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: 6 }}>calorieën per dag</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
        {getal('eiwit', macros.target_protein)}
        {getal('koolhydraten', macros.target_carbs)}
        {getal('vet', macros.target_fat)}
      </div>
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {[
          `Training: ${antw.trainingen || 3} keer per week`,
          `Eten: ${antw.maaltijden || 3} keer per dag`,
          tempo ? `Je doel in ongeveer ${tempo} weken` : null,
        ].filter(Boolean).map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.15rem', fontWeight: 900 }}>
            <Check size={22} strokeWidth={3.4} color={T.accent} />{t}
          </div>
        ))}
      </div>
      <WitteKnop onClick={onVerder} style={{ marginTop: '1.75rem' }}>Maak mijn plan</WitteKnop>
    </div>
  )
}

function Account({ antw, onKlaar }) {
  const VOORBEELD = useContext(VoorbeeldCtx)
  const kop = kopVan(useT())
  const [email, setEmail] = useState('')
  const [ww, setWw] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [bevestigen, setBevestigen] = useState(false)

  const maak = async (e) => {
    e?.preventDefault()
    setFout(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) { setFout('Check je e-mailadres.'); return }
    if (ww.length < 8) { setFout('Je wachtwoord moet 8 tekens of meer zijn.'); return }
    if (VOORBEELD) { onKlaar(); return }
    setBezig(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password: ww,
      options: { data: { first_name: antw.voornaam || null, bron: 'app_onboarding' } },
    })
    setBezig(false)
    if (error) {
      setFout(/registered|already/i.test(error.message) ? 'Dit e-mailadres heeft al een account. Log in.' : 'Dat lukte niet. Probeer het nog eens.')
      return
    }
    if (!data?.session) { setBevestigen(true); return } // e-mailbevestiging staat aan
    onKlaar()
  }

  if (bevestigen) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={kop}>Kijk in je mail</div>
        <div style={subTekst}>Tik op de link in de mail. Log daarna in.</div>
        <WitteKnop onClick={() => { window.location.href = '/client-login' }} style={{ marginTop: '1.5rem' }}>Naar inloggen</WitteKnop>
      </div>
    )
  }

  return (
    <div>
      {fout && <div style={{ ...foutStijl, marginBottom: 14 }}>{fout}</div>}
      <form onSubmit={maak} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Veld type="email" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
        <Veld type="password" placeholder="Wachtwoord" value={ww} onChange={e => setWw(e.target.value)} autoComplete="new-password" />
        <WitteKnop type="submit" disabled={bezig} style={{ marginTop: 6 }}>{bezig ? 'Even wachten…' : 'Account maken'}</WitteKnop>
      </form>
      <div style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: '1.1rem', textAlign: 'center' }}>
        <a href="/privacy" style={{ color: '#fff' }}>Zo gaan wij met je gegevens om</a>
      </div>
    </div>
  )
}

const STAPPEN = ['Account maken', 'Training maken', 'Eten maken', 'Alles klaarzetten']

function Bouwen({ antw }) {
  const T = useT()
  const VOORBEELD = useContext(VoorbeeldCtx)
  const [klaar, setKlaar] = useState(0)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let leeft = true
    const stap = (n) => { if (leeft) setKlaar(n) }
    const wacht = (ms) => new Promise(r => setTimeout(r, ms))
    ;(async () => {
      if (VOORBEELD) {
        for (let i = 1; i <= STAPPEN.length; i++) { await wacht(900); stap(i) }
        return
      }
      const p = {
        ...antw,
        allergieen: { selected_allergens: (antw.allergieen || []).filter(a => a !== 'vegetarisch' && a !== 'vegan'),
                      diet_preference: (antw.allergieen || []).includes('vegan') ? 'vegan' : (antw.allergieen || []).includes('vegetarisch') ? 'vegetarisch' : null },
      }
      const r = await supabase.rpc('start_app_account', { p }).then(x => x, e => ({ error: e }))
      const clientId = r?.data?.client_id
      if (r?.error || !clientId) { if (leeft) setFout('Dat lukte niet. Probeer het nog eens.'); return }
      if (r.data.bestond_al && !r.data.app_abonnee) { window.location.href = '/'; return } // bestaande coachingklant
      stap(1)
      await supabase.functions.invoke('workout-bouwer', { body: { client_id: clientId } }).then(x => x, () => null)
      stap(2)
      await supabase.rpc('maak_intake_voedingsconcept', { p_client: clientId }).then(x => x, () => null)
      await supabase.functions.invoke('intake-maaltijden', { body: { client_id: clientId } }).then(x => x, () => null)
      stap(3)
      await supabase.rpc('activeer_app_plannen').then(x => x, () => null)
      stap(4)
      try { localStorage.removeItem(OPSLAG) } catch { /* niets */ }
      await wacht(700)
      if (leeft) window.location.href = '/'
    })()
    return () => { leeft = false }
  }, [antw, VOORBEELD])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      {STAPPEN.map((t, i) => {
        const af = klaar > i, bezig = klaar === i && !fout
        return (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.2rem', fontWeight: 900, opacity: af || bezig ? 1 : 0.45, minWidth: 230 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: af ? T.accent : T.vak,
            }}>
              {af ? <Check size={18} strokeWidth={3.4} color="#0a0a0a" /> : bezig ? <Loader2 size={16} strokeWidth={3} style={{ animation: 'draai 1s linear infinite' }} /> : null}
            </span>
            {t}
          </div>
        )
      })}
      {fout && <div style={{ ...foutStijl, marginTop: 8 }}>{fout}</div>}
      {VOORBEELD && klaar >= STAPPEN.length && (
        <div style={{ marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 900, color: T.accent }}>Klaar. Nu ga je naar de app.</div>
      )}
    </div>
  )
}
