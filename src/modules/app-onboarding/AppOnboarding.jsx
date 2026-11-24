// src/modules/app-onboarding/AppOnboarding.jsx
//
// Onboarding voor nieuwe app-gebruikers zonder coaching (24 nov 2026).
// Clean, in de stijl van het inlogscherm: zelfde achtergrond, logo, velden en
// witte knop. Eén vraag per scherm, met een dunne voortgangsbalk.
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

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { LaadLogo } from '../../components/LaadScherm'
import { supabase } from '../../lib/supabase'

const VOORBEELD = (() => { try { return new URLSearchParams(window.location.search).has('voorbeeld') } catch { return false } })()
const OPSLAG = 'myarc_app_onboarding'

const SLIDES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
]

// ── De vragen ─────────────────────────────────────────────────────────────────
// soort: keuze (tikken = door), meer (meerdere, met Verder), getal, tekst.
const VRAGEN = [
  { k: 'voornaam', soort: 'tekst', vraag: 'Hoe heet je?', sub: 'Dan weten we hoe we je aanspreken.', placeholder: 'Voornaam' },
  { k: 'doel', soort: 'keuze', vraag: 'Wat is je doel?', opties: [
    ['fat_loss', 'Vet verliezen', 'Strakker en lichter worden'],
    ['muscle_gain', 'Spieren opbouwen', 'Sterker en groter worden'],
    ['recomp', 'Strakker worden', 'Vet eraf, spieren erbij'],
    ['maintain', 'Fit blijven', 'Je gewicht houden'],
  ] },
  { k: 'geslacht', soort: 'keuze', vraag: 'Ben je een man of een vrouw?', sub: 'Dat telt mee in je verbruik.', opties: [['male', 'Man'], ['female', 'Vrouw']] },
  { k: 'leeftijd', soort: 'getal', vraag: 'Hoe oud ben je?', eenheid: 'jaar', min: 16, max: 90, placeholder: '30' },
  { k: 'lengte', soort: 'getal', vraag: 'Hoe lang ben je?', eenheid: 'cm', min: 130, max: 230, placeholder: '180' },
  { k: 'gewicht', soort: 'getal', vraag: 'Wat weeg je nu?', eenheid: 'kg', min: 35, max: 250, decimaal: true, placeholder: '85' },
  { k: 'streefgewicht', soort: 'getal', vraag: 'Wat is je streefgewicht?', eenheid: 'kg', min: 35, max: 250, decimaal: true, placeholder: '78',
    tonen: a => a.doel !== 'maintain' },
  { k: 'activiteit', soort: 'keuze', vraag: 'Hoe actief ben je overdag?', sub: 'Buiten je trainingen om.', opties: [
    ['sedentary', 'Vooral zittend', 'Kantoor, auto, weinig lopen'],
    ['lightly_active', 'Licht actief', 'Af en toe lopen of fietsen'],
    ['moderately_active', 'Actief', 'Veel op de been'],
    ['very_active', 'Heel actief', 'Lichamelijk werk'],
  ] },
  { k: 'trainingen', soort: 'keuze', vraag: 'Hoe vaak per week kun je trainen?', opties: [['2', '2 keer'], ['3', '3 keer'], ['4', '4 keer'], ['5', '5 keer of meer']] },
  { k: 'ervaring', soort: 'keuze', vraag: 'Hoeveel ervaring heb je met krachttraining?', opties: [
    ['beginner', 'Beginner', 'Minder dan een jaar'],
    ['intermediate', 'Gemiddeld', '1 tot 3 jaar'],
    ['advanced', 'Gevorderd', 'Langer dan 3 jaar'],
  ] },
  { k: 'minuten', soort: 'keuze', vraag: 'Hoeveel tijd heb je per training?', opties: [['45', '45 minuten'], ['60', '1 uur'], ['75', '1 uur en een kwartier'], ['90', '1,5 uur']] },
  { k: 'locatie', soort: 'keuze', vraag: 'Waar train je?', opties: [['gym', 'In de sportschool'], ['home', 'Thuis'], ['both', 'Allebei']] },
  { k: 'focus', soort: 'meer', vraag: 'Welke spieren wil je extra aandacht geven?', sub: 'Kies er maximaal drie, of sla over.', max: 3, opties: [
    ['chest', 'Borst'], ['shoulders', 'Schouders'], ['arms', 'Armen'], ['back', 'Rug'], ['abs', 'Buik'],
    ['glutes', 'Billen'], ['quads', 'Bovenbenen'], ['hamstrings', 'Achterkant benen'], ['calves', 'Kuiten'],
  ] },
  { k: 'maaltijden', soort: 'keuze', vraag: 'Hoeveel keer per dag eet je het liefst?', opties: [['3', '3 keer'], ['4', '4 keer'], ['5', '5 keer']] },
  { k: 'allergieen', soort: 'meer', vraag: 'Is er iets dat je niet eet?', sub: 'Laat leeg als je alles eet.', opties: [
    ['lactose', 'Lactose'], ['gluten', 'Gluten'], ['noten', 'Noten'], ['vis', 'Vis'], ['varkensvlees', 'Varkensvlees'],
    ['vegetarisch', 'Vegetarisch'], ['vegan', 'Vegan'],
  ] },
]

// ── Kleine bouwstenen in de stijl van het inlogscherm ────────────────────────
const kop = { fontSize: '1.55rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }
const subTekst = { fontSize: '0.92rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0.55rem 0 0', lineHeight: 1.45 }

function WitteKnop({ children, disabled, style, ...props }) {
  return (
    <button disabled={disabled} style={{
      width: '100%', minHeight: 50, padding: '0 1rem',
      background: disabled ? 'rgba(255,255,255,0.3)' : '#fff', border: 'none', borderRadius: 12,
      color: '#0a0a0a', fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.01em', fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }} {...props}>{children}</button>
  )
}

function Veld({ style, ...props }) {
  return (
    <input {...props} style={{
      width: '100%', minHeight: 52, padding: '0 1rem',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
      color: '#fff', fontSize: '1.05rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box',
      fontFamily: 'inherit', WebkitAppearance: 'none', ...style,
    }}
      onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
    />
  )
}

function Optie({ actief, titel, sub, onClick, vinkje }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: sub ? '0.85rem 1rem' : '1rem', borderRadius: 12, cursor: 'pointer',
      background: actief ? '#fff' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${actief ? '#fff' : 'rgba(255,255,255,0.12)'}`,
      color: actief ? '#0a0a0a' : '#fff', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 12, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '1rem', fontWeight: 900 }}>{titel}</span>
        {sub && <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, opacity: 0.7, marginTop: 2 }}>{sub}</span>}
      </span>
      {vinkje && (
        <span style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0,
          border: `2px solid ${actief ? '#0a0a0a' : 'rgba(255,255,255,0.35)'}`,
          background: actief ? '#0a0a0a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{actief && <Check size={13} strokeWidth={3.4} color="#fff" />}</span>
      )}
    </button>
  )
}

function Achtergrond({ children }) {
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', color: '#fff' }}>
      {SLIDES.map((src, i) => (
        <div key={src} style={{
          position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === slide ? 0.2 : 0, transition: 'opacity 1.8s ease', transform: 'scale(1.04)',
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.96) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          minHeight: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 1rem) 1.5rem calc(env(safe-area-inset-bottom, 0px) + 2rem)',
        }}>
          <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}


// ── De gids: Kersten-figuur, bovenlijf, licht geanimeerd ─────────────────────
// Ademt rustig; bij elke nieuwe stap (sleutel) een sprongetje met een knik.
// 'blij' = juichen bij het resultaat. Onderkant loopt weg in het zwart.
function CoachGids({ sleutel, hoogte = 150, blij = false }) {
  const breed = Math.round(hoogte * 1.35)
  return (
    <div aria-hidden style={{ position: 'relative', height: hoogte, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <style>{`
        @keyframes gidsAdem { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-3px) scale(1.012) } }
        @keyframes gidsHop { 0% { transform: translateY(14px) rotate(-4deg); opacity: 0 } 45% { transform: translateY(-8px) rotate(3deg); opacity: 1 } 70% { transform: translateY(2px) rotate(-1.5deg) } 100% { transform: translateY(0) rotate(0) } }
        @keyframes gidsJuich { 0%,100% { transform: translateY(0) rotate(0) } 20% { transform: translateY(-12px) rotate(-3deg) } 40% { transform: translateY(0) rotate(0) } 60% { transform: translateY(-8px) rotate(3deg) } 80% { transform: translateY(0) } }
        @keyframes gidsGloed { 0%,100% { opacity: .55 } 50% { opacity: .85 } }
      `}</style>
      <div style={{ position: 'absolute', bottom: 0, width: breed * 0.9, height: hoogte * 0.9, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 60%, rgba(255,140,60,0.28) 0%, transparent 65%)', animation: 'gidsGloed 3.6s ease-in-out infinite' }} />
      <div key={sleutel} style={{ position: 'relative', width: breed, height: hoogte, overflow: 'hidden', animation: 'gidsHop 0.6s cubic-bezier(.3,1.4,.5,1) both', transformOrigin: '50% 100%' }}>
        <div style={{ animation: `${blij ? 'gidsJuich 1.4s ease-in-out 0.6s 2,' : ''} gidsAdem 3.6s ease-in-out infinite`, transformOrigin: '50% 100%' }}>
          <img src="/mascottes/coach.png" alt="" draggable={false} style={{
            display: 'block', width: breed, height: 'auto', marginTop: 6,
            WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 96%)',
            maskImage: 'linear-gradient(to bottom, #000 62%, transparent 96%)',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── De pagina ─────────────────────────────────────────────────────────────────
export default function AppOnboarding() {
  const [antw, setAntw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(OPSLAG) || '{}') || {} } catch { return {} }
  })
  // stap: 'intro' | index in de zichtbare vragen | 'rekenen' | 'resultaat' | 'account' | 'bouwen'
  const [stap, setStap] = useState('intro')
  const [macros, setMacros] = useState(null)
  const [fout, setFout] = useState(null)

  useEffect(() => { try { localStorage.setItem(OPSLAG, JSON.stringify(antw)) } catch { /* privé-venster */ } }, [antw])

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
    const p = { ...antw, trainingen: antw.trainingen, geslacht: antw.geslacht }
    const [r] = await Promise.all([
      supabase.rpc('app_macro_voorbeeld', { p }).then(x => x, e => ({ error: e })),
      new Promise(res => setTimeout(res, 1800)), // even het rekenmoment laten zien
    ])
    if (r?.error || !r?.data || r.data.fout) { setFout('Rekenen lukte niet. Controleer je gegevens of je internet.'); setStap(zichtbaar.length - 1); return }
    setMacros(r.data); setStap('resultaat')
  }

  return (
    <Achtergrond>
      {/* De gids boven de voortgang */}
      {stap !== 'intro' && (
        <div style={{ marginBottom: 4 }}>
          <CoachGids sleutel={String(stap)} hoogte={stap === 'rekenen' || stap === 'bouwen' ? 190 : 140} blij={stap === 'resultaat'} />
        </div>
      )}

      {/* Bovenbalk: terug + voortgang */}
      {stap !== 'intro' && stap !== 'bouwen' && stap !== 'rekenen' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.75rem' }}>
          <button onClick={terug} aria-label="Terug" style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLeft size={18} strokeWidth={2.6} /></button>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((positie / totaal) * 100)}%`, height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.35s ease' }} />
          </div>
        </div>
      )}

      {stap === 'intro' && <Intro onStart={() => setStap(0)} />}
      {typeof stap === 'number' && zichtbaar[stap] && (
        <Vraag key={zichtbaar[stap].k} v={zichtbaar[stap]} waarde={antw[zichtbaar[stap].k]} onZet={zet} onVolgende={volgende} fout={fout} />
      )}
      {stap === 'rekenen' && <Rekenen voornaam={antw.voornaam} />}
      {stap === 'resultaat' && macros && <Resultaat macros={macros} antw={antw} onVerder={() => setStap('account')} />}
      {stap === 'account' && <Account antw={antw} onKlaar={() => setStap('bouwen')} />}
      {stap === 'bouwen' && <Bouwen antw={antw} />}
    </Achtergrond>
  )
}

function Intro({ onStart }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', opacity: 0.9, transform: 'scale(0.8)' }}><LaadLogo boog={false} /></div>
      <CoachGids sleutel="intro" hoogte={230} />
      {/* Naamkaartje onder de figuur: wie je helpt */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -6 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
          fontSize: '0.82rem', fontWeight: 800, color: '#fff',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          Kersten · je coach
        </span>
      </div>
      <h1 style={{ ...kop, fontSize: '1.8rem', marginTop: '1.1rem' }}>Hoi! Ik help je op weg</h1>
      <p style={{ ...subTekst, marginTop: '0.75rem' }}>
        Ik stel je een paar korte vragen. Daarna reken ik je calorieën uit en zet ik je trainingsschema en voedingsplan voor je klaar. Duurt 2 minuten.
      </p>
      <WitteKnop onClick={onStart} style={{ marginTop: '1.6rem' }}>Laten we beginnen</WitteKnop>
      <button onClick={() => { window.location.href = '/client-login' }} style={{
        marginTop: '0.9rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)',
        fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', padding: '0.5rem',
      }}>Ik heb al een account</button>
      {VOORBEELD && <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>Voorbeeldmodus: er wordt niets aangemaakt</div>}
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
  const kies = (w) => { onZet(v.k, w); setTimeout(onVolgende, 180) }
  const lijst = Array.isArray(waarde) ? waarde : []
  const wissel = (w) => {
    const nieuw = lijst.includes(w) ? lijst.filter(x => x !== w) : (v.max && lijst.length >= v.max ? lijst : [...lijst, w])
    onZet(v.k, nieuw)
  }

  return (
    <div>
      <h1 style={kop}>{v.vraag}</h1>
      {v.sub && <p style={subTekst}>{v.sub}</p>}
      {fout && <div style={{ marginTop: 14, padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.85rem', fontWeight: 800 }}>{fout}</div>}

      <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {v.soort === 'keuze' && v.opties.map(([w, t, s]) => (
          <Optie key={w} titel={t} sub={s} actief={String(waarde) === w} onClick={() => kies(w)} />
        ))}

        {v.soort === 'meer' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {v.opties.map(([w, t]) => <Optie key={w} titel={t} vinkje actief={lijst.includes(w)} onClick={() => wissel(w)} />)}
            </div>
            <WitteKnop onClick={onVolgende} style={{ marginTop: 8 }}>{lijst.length ? 'Verder' : 'Overslaan'}</WitteKnop>
          </>
        )}

        {(v.soort === 'getal' || v.soort === 'tekst') && (
          <form onSubmit={e => { e.preventDefault(); bevestig() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Veld
                autoFocus value={tekst} onChange={e => setTekst(e.target.value)} placeholder={v.placeholder}
                inputMode={v.soort === 'getal' ? (v.decimaal ? 'decimal' : 'numeric') : 'text'}
                autoCapitalize={v.soort === 'tekst' ? 'words' : 'off'} autoComplete={v.k === 'voornaam' ? 'given-name' : 'off'}
                style={v.soort === 'getal' ? { fontSize: '1.6rem', fontWeight: 900, minHeight: 64, paddingRight: '4rem' } : null}
              />
              {v.eenheid && <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{v.eenheid}</span>}
            </div>
            {v.soort === 'getal' && tekst !== '' && !getalOk && (
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>Vul een getal in tussen {v.min} en {v.max}.</div>
            )}
            <WitteKnop type="submit" disabled={!(getalOk || tekstOk)}>Verder</WitteKnop>
          </form>
        )}
      </div>
    </div>
  )
}

function Rekenen({ voornaam }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingBottom: '4rem' }}>
      <Loader2 size={36} strokeWidth={2.4} style={{ animation: 'draai 1s linear infinite' }} />
      <style>{'@keyframes draai { to { transform: rotate(360deg) } }'}</style>
      <h1 style={{ ...kop, marginTop: '1.25rem' }}>{voornaam ? `${voornaam}, we rekenen het uit` : 'We rekenen het uit'}</h1>
      <p style={subTekst}>Je verbruik, je doel en wat je per dag nodig hebt.</p>
    </div>
  )
}

function Resultaat({ macros, antw, onVerder }) {
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

  const blok = (label, waarde) => (
    <div style={{ flex: 1, padding: '0.85rem 0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{waarde} g</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <div>
      <h1 style={kop}>{antw.voornaam ? `${antw.voornaam}, dit is je plan` : 'Dit is je plan'}</h1>
      <p style={subTekst}>Op een trainingsdag eet je:</p>
      <div style={{ marginTop: '1.4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.4rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{kcal.toLocaleString('nl-NL')}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>calorieën per dag</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: '1.4rem' }}>
        {blok('eiwit', macros.target_protein)}
        {blok('koolhydraten', macros.target_carbs)}
        {blok('vet', macros.target_fat)}
      </div>
      <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          `Trainingsschema van ${antw.trainingen || 3} dagen per week`,
          `Voedingsplan met ${antw.maaltijden || 3} maaltijden per dag`,
          tempo ? `Je streefgewicht in ongeveer ${tempo} weken` : null,
        ].filter(Boolean).map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 700 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: '#10b981', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={14} strokeWidth={3.2} />
            </span>{t}
          </div>
        ))}
      </div>
      <WitteKnop onClick={onVerder} style={{ marginTop: '1.6rem' }}>Zet mijn plan klaar</WitteKnop>
    </div>
  )
}

function Account({ antw, onKlaar }) {
  const [email, setEmail] = useState('')
  const [ww, setWw] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [bevestigen, setBevestigen] = useState(false)

  const maak = async (e) => {
    e?.preventDefault()
    setFout(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) { setFout('Vul een geldig e-mailadres in.'); return }
    if (ww.length < 8) { setFout('Kies een wachtwoord van minstens 8 tekens.'); return }
    if (VOORBEELD) { onKlaar(); return }
    setBezig(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password: ww,
      options: { data: { first_name: antw.voornaam || null, bron: 'app_onboarding' } },
    })
    setBezig(false)
    if (error) {
      setFout(/registered|already/i.test(error.message) ? 'Dit e-mailadres heeft al een account. Log in via "Ik heb al een account".' : 'Account maken lukte niet. Probeer het opnieuw.')
      return
    }
    if (!data?.session) { setBevestigen(true); return } // e-mailbevestiging staat aan
    onKlaar()
  }

  if (bevestigen) {
    return (
      <div>
        <h1 style={kop}>Bevestig je e-mailadres</h1>
        <p style={subTekst}>We hebben een mail gestuurd naar {email}. Tik op de link in die mail en log daarna in; je plan wordt dan klaargezet.</p>
        <WitteKnop onClick={() => { window.location.href = '/client-login' }} style={{ marginTop: '1.5rem' }}>Naar inloggen</WitteKnop>
      </div>
    )
  }

  return (
    <div>
      <h1 style={kop}>Maak je account</h1>
      <p style={subTekst}>Daarmee bewaren we je plan en je voortgang.</p>
      {fout && <div style={{ marginTop: 14, padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.85rem', fontWeight: 800 }}>{fout}</div>}
      <form onSubmit={maak} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: '1.4rem' }}>
        <Veld type="email" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
        <Veld type="password" placeholder="Wachtwoord (minstens 8 tekens)" value={ww} onChange={e => setWw(e.target.value)} autoComplete="new-password" />
        <WitteKnop type="submit" disabled={bezig} style={{ marginTop: 6 }}>{bezig ? 'Even geduld…' : 'Account maken'}</WitteKnop>
      </form>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: '1rem', textAlign: 'center' }}>
        Door verder te gaan ga je akkoord met onze <a href="/privacy" style={{ color: '#fff' }}>privacyverklaring</a>.
      </p>
    </div>
  )
}

const STAPPEN = ['Account aanmaken', 'Trainingsschema bouwen', 'Voedingsplan samenstellen', 'Alles klaarzetten']

function Bouwen({ antw }) {
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
      if (r?.error || !clientId) { if (leeft) setFout('Je account kon niet worden afgemaakt. Probeer het opnieuw.'); return }
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
  }, [antw])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '4rem' }}>
      <h1 style={kop}>{antw.voornaam ? `Even geduld, ${antw.voornaam}` : 'Even geduld'}</h1>
      <p style={subTekst}>We zetten alles voor je klaar.</p>
      <div style={{ marginTop: '1.6rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STAPPEN.map((t, i) => {
          const af = klaar > i, bezig = klaar === i && !fout
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1rem', fontWeight: 800, color: af || bezig ? '#fff' : 'rgba(255,255,255,0.45)' }}>
              <span style={{
                width: 26, height: 26, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: af ? '#10b981' : 'transparent', border: af ? 'none' : '2px solid rgba(255,255,255,0.25)',
              }}>
                {af ? <Check size={15} strokeWidth={3.2} color="#0a0a0a" /> : bezig ? <Loader2 size={14} strokeWidth={3} style={{ animation: 'draai 1s linear infinite' }} /> : null}
              </span>
              {t}
            </div>
          )
        })}
      </div>
      <style>{'@keyframes draai { to { transform: rotate(360deg) } }'}</style>
      {fout && <div style={{ marginTop: 18, padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.85rem', fontWeight: 800 }}>{fout}</div>}
      {VOORBEELD && klaar >= STAPPEN.length && (
        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>Voorbeeld klaar. In het echt ga je nu naar de app en zie je de proefmaand.</div>
      )}
    </div>
  )
}
