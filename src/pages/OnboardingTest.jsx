// src/pages/OnboardingTest.jsx — keuzepagina /test (21 nov 2026), niet gelinkt in menu's.
//
// Vier concepten voor de gamified onboarding van app-gebruikers zonder coaching.
// Alle vier dezelfde vragen; de uitkomst komt echt uit de database
// (app_macro_voorbeeld = dezelfde som als de coach-intake). Er wordt niets opgeslagen.
// Mascottes: Kerstens eigen reel-mascottes (public/mascottes).

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { colors, radius, space } from '../ui/tokens'

const M = (naam) => `/mascottes/${naam}.png`

const VRAGEN = [
  { k: 'doel', mascotte: 'spierarm', vraag: 'Wat wil je bereiken?',
    opties: [['fat_loss', 'Vet verliezen'], ['muscle_gain', 'Spieren opbouwen'], ['recomp', 'Strakker worden'], ['maintain', 'Fit blijven']],
    reactie: { fat_loss: 'Lekker. Vet eraf zonder honger, dat gaan we slim doen.', muscle_gain: 'Bouwen! Dan wordt eten net zo belangrijk als trainen.', recomp: 'Strakker worden: vet eraf, spier erbij. Mijn favoriet.', maintain: 'Fit blijven is ook een doel. Respect.' } },
  { k: 'geslacht', mascotte: 'kettlebell', vraag: 'Ben je een man of een vrouw?',
    opties: [['male', 'Man'], ['female', 'Vrouw']],
    reactie: { male: 'Check. Dat telt mee in je verbranding.', female: 'Check. Dat telt mee in je verbranding.' } },
  { k: 'leeftijd', mascotte: 'stopwatch', vraag: 'Hoe oud ben je?', getal: { min: 16, max: 80, start: 30, stap: 1, eenheid: 'jaar' },
    reactie: () => 'Leeftijd is maar een getal. Wel een getal dat ik nodig heb.' },
  { k: 'lengte', mascotte: 'notitieboek', vraag: 'Hoe lang ben je?', getal: { min: 140, max: 215, start: 178, stap: 1, eenheid: 'cm' },
    reactie: (v) => (v >= 190 ? 'Lang! Kijk uit voor deurposten.' : 'Genoteerd.') },
  { k: 'gewicht', mascotte: 'weegschaal', vraag: 'Wat weeg je nu?', getal: { min: 40, max: 180, start: 85, stap: 0.5, eenheid: 'kg' },
    reactie: (v) => `${String(v).replace('.', ',')} kg. Geen oordeel, gewoon je startpunt.` },
  { k: 'trainingen', mascotte: 'eiwitshaker', vraag: 'Hoe vaak per week kun je trainen?',
    opties: [['2', '2 keer'], ['3', '3 keer'], ['4', '4 keer'], ['5', '5 keer of meer']],
    reactie: { 2: 'Twee keer, goed te doen. Daar bouwen we op.', 3: 'Drie keer is de sweet spot.', 4: 'Vier keer, serieus bezig!', 5: 'Beest. We houden je herstel in de gaten.' } },
]

const reactieVan = (v, waarde) => (typeof v.reactie === 'function' ? v.reactie(waarde) : v.reactie?.[waarde]) || 'Top.'
const tekstVan = (v, waarde) => v.opties?.find(o => o[0] === String(waarde))?.[1] || `${String(waarde).replace('.', ',')} ${v.getal?.eenheid || ''}`

// ── Gedeeld ─────────────────────────────────────────────────────────────────

function useTypen(tekst, snelheid = 22) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!tekst) return undefined
    const t = setInterval(() => setN(x => { if (x >= tekst.length) { clearInterval(t); return x } return x + 1 }), snelheid)
    return () => clearInterval(t)
  }, [tekst, snelheid])
  return tekst ? tekst.slice(0, n) : ''
}

async function rekenUit(a) {
  const { data, error } = await supabase.rpc('app_macro_voorbeeld', {
    p: { ...a, activiteit: 'lightly_active', ervaring: 'beginner' },
  }).then(r => r, e => ({ error: e }))
  return error || !data || data.fout ? null : data
}

function Knop({ children, onClick, vol = true, style }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', minHeight: 52, borderRadius: radius.btn, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 16, fontWeight: 800, border: vol ? 'none' : `1px solid ${colors.borderSubtle}`,
      background: vol ? '#fff' : colors.surface, color: vol ? '#000' : '#fff',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...style,
    }}>{children}</button>
  )
}

function Opties({ v, kies }) {
  return (
    <div style={{ display: 'grid', gap: space[2] }}>
      {v.opties.map(([waarde, label]) => <Knop key={waarde} vol={false} onClick={() => kies(waarde)}>{label}</Knop>)}
    </div>
  )
}

function Getal({ v, kies }) {
  const g = v.getal
  const [w, setW] = useState(g.start)
  const zet = (x) => setW(Math.min(g.max, Math.max(g.min, Math.round(x / g.stap) * g.stap)))
  return (
    <div style={{ display: 'grid', gap: space[4] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space[4] }}>
        <button onClick={() => zet(w - g.stap)} style={rond}>−</button>
        <div style={{ minWidth: 150, textAlign: 'center' }}>
          <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em' }}>{String(w).replace('.', ',')}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.textSecondary, marginLeft: 6 }}>{g.eenheid}</span>
        </div>
        <button onClick={() => zet(w + g.stap)} style={rond}>+</button>
      </div>
      <input type="range" min={g.min} max={g.max} step={g.stap} value={w} onChange={(e) => zet(Number(e.target.value))}
        style={{ width: '100%', accentColor: colors.accent }} />
      <Knop onClick={() => kies(w)}>Volgende</Knop>
    </div>
  )
}
const rond = {
  width: 52, height: 52, borderRadius: '50%', border: `1px solid ${colors.borderSubtle}`, background: colors.surface,
  color: '#fff', fontSize: 26, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
}

function Invoer({ v, kies }) {
  return v.getal ? <Getal key={v.k} v={v} kies={kies} /> : <Opties v={v} kies={kies} />
}

function Resultaat({ uit, opnieuw, compact = false }) {
  const kcal = useOptellen(uit?.target_calories || 0)
  if (!uit) return <div style={{ color: colors.textSecondary, textAlign: 'center' }}>Rekenen lukte niet. Check je verbinding.</div>
  const rij = [['Eiwit', uit.target_protein], ['Koolhydraten', uit.target_carbs], ['Vet', uit.target_fat]]
  return (
    <div style={{ display: 'grid', gap: space[4], textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: compact ? 48 : 64, fontWeight: 900, letterSpacing: '-0.04em' }}>{kcal}</div>
        <div style={{ fontSize: 15, color: colors.textSecondary, fontWeight: 700 }}>kcal per dag</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: space[2] }}>
        {rij.map(([l, g]) => (
          <div key={l} style={{ background: colors.surface, borderRadius: radius.card, padding: space[3], border: `1px solid ${colors.borderSubtle}` }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{g} g</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      <Knop onClick={opnieuw} vol={false}>Opnieuw proberen</Knop>
    </div>
  )
}

function useOptellen(doel, ms = 1100) {
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!doel) return undefined
    const start = performance.now()
    let raf
    const stap = (t) => { const p = Math.min(1, (t - start) / ms); setW(Math.round(doel * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(stap) }
    raf = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(raf)
  }, [doel, ms])
  return w
}

// Eén flow, vier gezichten: elk concept krijgt de stand en tekent hem anders.
function useFlow() {
  const [i, setI] = useState(0)
  const [antw, setAntw] = useState({})
  const [reactie, setReactie] = useState(null)
  const [uit, setUit] = useState(undefined)
  const kies = (waarde) => {
    const v = VRAGEN[i]
    const nieuw = { ...antw, [v.k]: waarde }
    setAntw(nieuw)
    setReactie({ tekst: reactieVan(v, waarde), id: Date.now() })
    setTimeout(async () => {
      setReactie(null)
      if (i + 1 < VRAGEN.length) setI(i + 1)
      else { setI(VRAGEN.length); setUit(await rekenUit(nieuw)) }
    }, 1500)
  }
  const opnieuw = () => { setI(0); setAntw({}); setReactie(null); setUit(undefined) }
  return { i, v: VRAGEN[i], antw, reactie, uit, kies, opnieuw, klaar: i >= VRAGEN.length }
}

// ── A. Vast maatje: de kettlebell ───────────────────────────────────────────

function ConceptMaatje() {
  const f = useFlow()
  const zin = f.klaar ? (f.uit === undefined ? 'Even rekenen… ik tel alles op.' : 'Dit is jouw startpunt. Daar gaan we mee knallen!') : (f.reactie?.tekst || f.v.vraag)
  const getypt = useTypen(zin)
  return (
    <Scherm>
      <Balk p={f.i / VRAGEN.length} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space[3], marginTop: space[4] }}>
        <img key={f.reactie?.id || f.i} src={M('kettlebell')} alt="" style={{
          width: 150, height: 150, objectFit: 'contain',
          animation: f.reactie ? 'ob-spring 0.7s ease' : 'ob-zweef 3s ease-in-out infinite',
        }} />
        <Wolk>{getypt}<Cursor /></Wolk>
      </div>
      <div style={{ marginTop: space[6] }}>
        {f.klaar ? (f.uit !== undefined && <Resultaat uit={f.uit} opnieuw={f.opnieuw} />)
          : !f.reactie && <Invoer v={f.v} kies={f.kies} />}
      </div>
    </Scherm>
  )
}

// ── B. Het team: elke vraag een eigen mascotte, en je verzamelt ze ──────────

function ConceptTeam() {
  const f = useFlow()
  const naam = f.klaar ? 'notitieboek' : f.v.mascotte
  const getypt = useTypen(f.klaar ? (f.uit === undefined ? 'Het hele team rekent mee…' : 'Team compleet. Dit is jouw plan!') : (f.reactie?.tekst || f.v.vraag))
  return (
    <Scherm>
      <div style={{ display: 'flex', justifyContent: 'center', gap: space[2], marginTop: space[2] }}>
        {VRAGEN.map((v, j) => (
          <div key={v.k} style={{
            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: j < f.i ? colors.surfaceHover : colors.surface, border: `1px solid ${j === f.i ? colors.accent : colors.borderSubtle}`,
          }}>
            <img src={M(v.mascotte)} alt="" style={{ width: 30, height: 30, objectFit: 'contain', filter: j < f.i ? 'none' : 'grayscale(1) brightness(0.35)', transition: 'filter .4s' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space[3], marginTop: space[6] }}>
        <img key={naam} src={M(naam)} alt="" style={{ width: 170, height: 170, objectFit: 'contain', animation: 'ob-inglij 0.55s cubic-bezier(.2,1.4,.4,1)' }} />
        <Wolk>{getypt}<Cursor /></Wolk>
      </div>
      <div style={{ marginTop: space[6] }}>
        {f.klaar ? (f.uit !== undefined && <Resultaat uit={f.uit} opnieuw={f.opnieuw} />)
          : !f.reactie && <Invoer v={f.v} kies={f.kies} />}
      </div>
    </Scherm>
  )
}

// ── C. Arc: een eigen figuurtje, de boog vult zich met je voortgang ─────────

function ArcFiguur({ p, blij, praat }) {
  const R = 62, omtrek = 2 * Math.PI * R
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ animation: blij ? 'ob-spring 0.7s ease' : 'ob-zweef 3.2s ease-in-out infinite' }}>
      <circle cx="90" cy="90" r={R} fill={colors.surface} stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      <circle cx="90" cy="90" r={R} fill="none" stroke={colors.accent} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - p)} transform="rotate(-90 90 90)"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.3,1.3,.5,1)', filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.45))' }} />
      <g style={{ transformOrigin: '90px 82px', animation: 'ob-knipper 4s infinite' }}>
        <ellipse cx="72" cy="82" rx="7" ry={blij ? 4 : 9} fill="#fff" />
        <ellipse cx="108" cy="82" rx="7" ry={blij ? 4 : 9} fill="#fff" />
      </g>
      {praat
        ? <ellipse cx="90" cy="110" rx="9" ry="6" fill="#fff" style={{ animation: 'ob-praat 0.25s infinite alternate' }} />
        : <path d={blij ? 'M74 104 Q90 122 106 104' : 'M78 108 Q90 116 102 108'} stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

function ConceptArc() {
  const f = useFlow()
  const zin = f.klaar ? (f.uit === undefined ? 'Ik reken je boog uit…' : 'Je boog is rond. Dit is je startpunt.') : (f.reactie?.tekst || f.v.vraag)
  const getypt = useTypen(zin)
  return (
    <Scherm>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space[3], marginTop: space[4] }}>
        <ArcFiguur p={f.klaar ? 1 : f.i / VRAGEN.length} blij={!!f.reactie || (f.klaar && f.uit)} praat={getypt.length < zin.length} />
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', minHeight: 64, maxWidth: 320 }}>{getypt}</div>
      </div>
      <div style={{ marginTop: space[4] }}>
        {f.klaar ? (f.uit !== undefined && <Resultaat uit={f.uit} opnieuw={f.opnieuw} />)
          : !f.reactie && <Invoer v={f.v} kies={f.kies} />}
      </div>
    </Scherm>
  )
}

// ── D. Chat met XP: gesprek met de kettlebell, punten en level-up ───────────

function ConceptChat({ avatar = 'kettlebell' }) {
  const f = useFlow()
  const [xp, setXp] = useState(0)
  const [plus, setPlus] = useState(null)
  const [typt, setTypt] = useState(false)
  const onder = useRef(null)
  const berichten = useMemo(() => {
    const b = []
    VRAGEN.slice(0, Math.min(f.i + 1, VRAGEN.length)).forEach((v) => {
      b.push({ van: 'm', tekst: v.vraag })
      if (f.antw[v.k] !== undefined) {
        b.push({ van: 'ik', tekst: tekstVan(v, f.antw[v.k]) })
        b.push({ van: 'm', tekst: reactieVan(v, f.antw[v.k]) })
      }
    })
    return b
  }, [f.i, f.antw])
  useEffect(() => { onder.current?.scrollIntoView({ behavior: 'smooth' }) }, [berichten.length, f.reactie, f.uit])
  useEffect(() => { setTypt(true); const t = setTimeout(() => setTypt(false), 700); return () => clearTimeout(t) }, [berichten.length])
  const kies = (w) => { setXp(x => x + 25); setPlus({ id: Date.now() }); f.kies(w) }
  const level = 1 + Math.floor(xp / 75)
  const zichtbaar = typt ? berichten.slice(0, -1) : berichten
  return (
    <Scherm>
      <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: colors.accent, minWidth: 64 }}>Level {level}</div>
        <div style={{ flex: 1, height: 10, borderRadius: radius.pill, background: colors.surface, overflow: 'hidden' }}>
          <div style={{ width: `${((xp % 75) / 75) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#ffd700,#ffa500)', transition: 'width .5s' }} />
        </div>
        <div style={{ position: 'relative', fontSize: 13, fontWeight: 900, minWidth: 54, textAlign: 'right' }}>
          {xp} XP
          {plus && <span key={plus.id} style={{ position: 'absolute', right: 0, top: -4, color: colors.accent, animation: 'ob-plus 1s ease forwards' }}>+25</span>}
        </div>
      </div>
      <div style={{ display: 'grid', gap: space[2], marginTop: space[4] }}>
        {zichtbaar.map((b, j) => (
          <div key={j} style={{ display: 'flex', justifyContent: b.van === 'ik' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: space[2], animation: 'ob-bericht .3s ease' }}>
            {b.van === 'm' && <Avatar naam={avatar} />}
            <div style={{
              maxWidth: '78%', padding: `${space[2]}px ${space[3]}px`, borderRadius: 18, fontSize: 15, fontWeight: 600, lineHeight: 1.4,
              background: b.van === 'ik' ? '#fff' : colors.surface, color: b.van === 'ik' ? '#000' : '#fff',
              border: b.van === 'ik' ? 'none' : `1px solid ${colors.borderSubtle}`,
            }}>{b.tekst}</div>
          </div>
        ))}
        {typt && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: space[2] }}>
            <Avatar naam={avatar} />
            <div style={{ padding: '12px 14px', borderRadius: 18, background: colors.surface, display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(d => <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: colors.textSecondary, animation: `ob-stip 1s ${d * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={onder} />
      </div>
      <div style={{ marginTop: space[4] }}>
        {f.klaar ? (f.uit === undefined ? null : <><Confetti /><Resultaat uit={f.uit} opnieuw={() => { setXp(0); f.opnieuw() }} compact /></>)
          : !f.reactie && !typt && <Invoer v={f.v} kies={kies} />}
      </div>
    </Scherm>
  )
}

function Confetti() {
  const stukjes = useMemo(() => Array.from({ length: 40 }, (_, j) => ({
    left: Math.random() * 100, vertraging: Math.random() * 0.6, kleur: ['#ffd700', '#fff', '#ffa500', '#22c55e'][j % 4], draai: Math.random() * 360,
  })), [])
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {stukjes.map((s, j) => (
        <span key={j} style={{ position: 'absolute', top: -20, left: `${s.left}%`, width: 8, height: 14, background: s.kleur, borderRadius: 2,
          transform: `rotate(${s.draai}deg)`, animation: `ob-val 1.8s ${s.vertraging}s ease-in forwards` }} />
      ))}
    </div>
  )
}

// ── E. Coach: jouw eigen 3D-figuur als gids ────────────────────────────────

const COACH = '/mascottes/coach.png'

function ConceptCoach() {
  const f = useFlow()
  const zin = f.klaar ? (f.uit === undefined ? 'Even rekenen… ik zet je cijfers klaar.' : 'Dit is jouw startpunt. Samen gaan we dit halen!') : (f.reactie?.tekst || f.v.vraag)
  const getypt = useTypen(zin)
  return (
    <Scherm>
      <Balk p={f.klaar ? 1 : f.i / VRAGEN.length} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: space[3] }}>
        <div key={f.reactie?.id || f.i} style={{
          width: 170, height: 255, transformOrigin: '50% 100%',
          animation: f.reactie ? 'ob-spring 0.7s ease' : 'ob-adem 3.2s ease-in-out infinite',
        }}>
          <img src={COACH} alt="" style={{
            width: '100%', height: '100%', objectFit: 'contain',
            filter: 'drop-shadow(0 10px 24px rgba(255,140,60,0.25))',
          }} />
        </div>
        <div style={{ marginTop: -space[2] }}><Wolk>{getypt}<Cursor /></Wolk></div>
      </div>
      <div style={{ marginTop: space[6] }}>
        {f.klaar ? (f.uit !== undefined && <><Confetti /><Resultaat uit={f.uit} opnieuw={f.opnieuw} /></>)
          : !f.reactie && <Invoer v={f.v} kies={f.kies} />}
      </div>
    </Scherm>
  )
}

function Avatar({ naam }) {
  if (naam === 'coach') return (
    <img src={COACH} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 4%', border: `1px solid ${colors.borderSubtle}`, flexShrink: 0 }} />
  )
  return <img src={M(naam)} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
}

// ── Lijst ───────────────────────────────────────────────────────────────────

function Scherm({ children }) {
  return <div style={{ maxWidth: 420, margin: '0 auto', padding: `${space[4]}px ${space[4]}px ${space[8]}px` }}>{children}</div>
}
function Balk({ p }) {
  return (
    <div style={{ height: 8, borderRadius: radius.pill, background: colors.surface, overflow: 'hidden' }}>
      <div style={{ width: `${p * 100}%`, height: '100%', background: 'linear-gradient(90deg,#ffd700,#ffa500)', transition: 'width .6s cubic-bezier(.3,1.3,.5,1)' }} />
    </div>
  )
}
function Wolk({ children }) {
  return (
    <div style={{ position: 'relative', background: colors.surface, border: `1px solid ${colors.borderSubtle}`, borderRadius: 18,
      padding: `${space[3]}px ${space[4]}px`, fontSize: 20, fontWeight: 800, textAlign: 'center', minHeight: 56, maxWidth: 340, lineHeight: 1.35 }}>
      {children}
    </div>
  )
}
const Cursor = () => <span style={{ display: 'inline-block', width: 2, height: '1em', background: colors.accent, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'ob-stip 1s infinite' }} />

const CONCEPTEN = [
  { k: 'E', naam: 'Coach', uitleg: 'Jouw 3D-figuur is de gids: hij ademt, springt bij elk antwoord en viert je resultaat.', C: ConceptCoach },
  { k: 'F', naam: 'Coach-chat + XP', uitleg: 'Chat met jouw 3D-figuur, punten per antwoord, level-up en confetti.', C: () => <ConceptChat avatar="coach" /> },
  { k: 'A', naam: 'Maatje', uitleg: 'Eén vaste mascotte (de kettlebell) praat met je, springt bij elk antwoord.', C: ConceptMaatje },
  { k: 'B', naam: 'Team', uitleg: 'Elke vraag een eigen mascotte; je verzamelt het hele team bovenin.', C: ConceptTeam },
  { k: 'C', naam: 'Arc', uitleg: 'Eigen strak figuurtje: de gouden boog vult zich met je voortgang.', C: ConceptArc },
  { k: 'D', naam: 'Chat + XP', uitleg: 'Gesprek met de kettlebell, punten per antwoord, level-up en confetti.', C: ConceptChat },
]

export default function OnboardingTest() {
  const [k, setK] = useState('E')
  const gekozen = CONCEPTEN.find(c => c.k === k)
  return (
    <div style={{ minHeight: '100dvh', background: colors.bg, color: '#fff', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes ob-adem { 0%,100% { transform: scale(1,1) } 50% { transform: scale(1.015,1.03) translateY(-3px) } }
        @keyframes ob-zweef { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes ob-spring { 0% { transform: scale(1,1) } 25% { transform: scale(1.12,0.86) translateY(6px) } 55% { transform: scale(0.94,1.1) translateY(-22px) } 80% { transform: scale(1.04,0.96) } 100% { transform: scale(1,1) } }
        @keyframes ob-inglij { 0% { transform: translateX(120px) rotate(14deg) scale(.6); opacity: 0 } 100% { transform: none; opacity: 1 } }
        @keyframes ob-knipper { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(0.1) } }
        @keyframes ob-praat { from { transform: scaleY(0.4) } to { transform: scaleY(1.1) } }
        @keyframes ob-stip { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        @keyframes ob-bericht { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ob-plus { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-26px); opacity: 0 } }
        @keyframes ob-val { to { transform: translateY(110vh) rotate(720deg) } }
      `}</style>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: `${space[4]}px ${space[4]}px 0` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.accent }}>Onboarding-concepten</div>
        <select value={k} onChange={(e) => setK(e.target.value)} style={{
          marginTop: space[2], width: '100%', minHeight: 48, borderRadius: radius.btn, background: colors.surface, color: '#fff',
          border: `1px solid ${colors.borderSubtle}`, padding: `0 ${space[3]}px`, fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
        }}>
          {CONCEPTEN.map(c => <option key={c.k} value={c.k}>{c.k}. {c.naam}</option>)}
        </select>
        <div style={{ marginTop: space[2], fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 }}>{gekozen.uitleg}</div>
      </div>
      <gekozen.C key={k} />
    </div>
  )
}
