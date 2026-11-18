// src/pages/LaadTest.jsx
// Keuzepagina voor het laadscherm (/test, 18 nov 2026). Niet gelinkt in menu's.
//
// Waarom het huidige rondje hapert: het laadscherm wordt bij het opstarten een
// paar keer achter elkaar opnieuw neergezet (index.html, dan het lazy stuk, dan
// het inloggen). Elke keer begint de draai weer op 0 graden, en dat zie je als
// een sprong. De varianten hieronder lopen op de klok: waar de animatie staat
// hangt af van de tijd, niet van het moment van neerzetten. Opnieuw neerzetten
// gaat dus verder waar hij was.
import { useEffect, useRef, useState } from 'react'
import LaadScherm from '../components/LaadScherm'

const LOGO = '/ma-logo-header.png'
const B = 132 // logobreedte; het bestand is 2:1

// Negatieve vertraging = de animatie staat al op de plek die bij de klok hoort.
function useKlok(duurMs) {
  const [start] = useState(() => Date.now())
  return `-${start % duurMs}ms`
}

const Logo = ({ style }) => <img src={LOGO} alt="MY ARC" style={{ width: B, display: 'block', ...style }} />

function Nu() {
  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#fff', borderRadius: '50%', animation: 'lt-draai 0.9s linear infinite' }} />
      <img src={LOGO} alt="" style={{ position: 'absolute', top: '50%', left: '50%', width: 84, transform: 'translate(-50%, -50%)' }} />
    </div>
  )
}

function Ademen() {
  const d = useKlok(2600)
  return <Logo style={{ animation: 'lt-adem 2.6s ease-in-out infinite', animationDelay: d }} />
}

function Glans() {
  const d = useKlok(2400)
  const masker = { WebkitMaskImage: `url(${LOGO})`, maskImage: `url(${LOGO})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }
  return (
    <div style={{
      width: B, height: B / 2, ...masker,
      background: 'linear-gradient(105deg, rgba(255,255,255,0.45) 42%, #fff 50%, rgba(255,255,255,0.45) 58%)',
      backgroundSize: '300% 100%', animation: 'lt-glans 2.4s linear infinite', animationDelay: d,
    }} />
  )
}

function Lijn() {
  const d = useKlok(1800)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <Logo />
      <div style={{ width: 96, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ width: '40%', height: '100%', borderRadius: 2, background: '#fff', animation: 'lt-lijn 1.8s ease-in-out infinite', animationDelay: d }} />
      </div>
    </div>
  )
}

function LijnAdem() {
  const d = useKlok(2200)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <Logo />
      <div style={{ width: 96, height: 2, borderRadius: 2, background: '#fff', transformOrigin: 'center', animation: 'lt-lijnadem 2.2s ease-in-out infinite', animationDelay: d }} />
    </div>
  )
}

function Puntjes() {
  const d = useKlok(1500)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <Logo />
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'lt-punt 1.5s ease-in-out infinite', animationDelay: `calc(${d} + ${i * 200}ms)` }} />
        ))}
      </div>
    </div>
  )
}

function Golf() {
  const d = useKlok(2800)
  return (
    <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1].map(i => (
        <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #fff', opacity: 0, animation: 'lt-golf 2.8s ease-out infinite', animationDelay: `calc(${d} + ${i * 1400}ms)` }} />
      ))}
      <Logo style={{ width: 104 }} />
    </div>
  )
}

function Boog() {
  const d = useKlok(1600)
  const gat = 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))'
  return (
    <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 150deg, #fff 360deg)',
        WebkitMaskImage: gat, maskImage: gat,
        animation: 'lt-draai 1.6s linear infinite', animationDelay: d,
      }} />
      <Logo style={{ width: 104 }} />
    </div>
  )
}

function Stil() {
  return <Logo style={{ animation: 'lt-in 0.5s ease-out both' }} />
}

// Het echte laadscherm, ingeklemd in het vak.
function Gekozen() {
  return <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center' }}><LaadScherm inline /></div>
}

const VARIANTEN = [
  { id: 'gekozen', naam: 'Gekozen · Glans + boog', uitleg: 'Zo staat hij nu in het echte laadscherm.', C: Gekozen },
  { id: 'nu', naam: 'Nu', uitleg: 'Het huidige rondje. Begint bij elke herlaad opnieuw.', C: Nu },
  { id: 'ademen', naam: '1 · Ademen', uitleg: 'Logo wordt rustig iets lichter en donkerder.', C: Ademen },
  { id: 'glans', naam: '2 · Glans', uitleg: 'Een lichtstreep schuift over het logo.', C: Glans },
  { id: 'lijn', naam: '3 · Lijn', uitleg: 'Logo staat stil, dun streepje schuift eronder.', C: Lijn },
  { id: 'lijnadem', naam: '4 · Ademende lijn', uitleg: 'Streepje groeit vanuit het midden en krimpt weer.', C: LijnAdem },
  { id: 'puntjes', naam: '5 · Puntjes', uitleg: 'Logo staat stil, drie puntjes lichten om de beurt op.', C: Puntjes },
  { id: 'golf', naam: '6 · Golf', uitleg: 'Dunne ringen lopen vanuit het logo naar buiten.', C: Golf },
  { id: 'boog', naam: '7 · Boog', uitleg: 'Wel een cirkel, maar dun, met staart en op de klok.', C: Boog },
  { id: 'stil', naam: '8 · Stil', uitleg: 'Alleen het logo. Niets beweegt, dus niets kan haperen.', C: Stil },
]

const KEYFRAMES = `
@keyframes lt-draai { to { transform: rotate(360deg); } }
@keyframes lt-adem { 0%, 100% { opacity: 0.45; transform: scale(0.975); } 50% { opacity: 1; transform: scale(1); } }
@keyframes lt-glans { from { background-position: 100% 0; } to { background-position: 0% 0; } }
@keyframes lt-lijn { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
@keyframes lt-lijnadem { 0%, 100% { transform: scaleX(0.15); opacity: 0.35; } 50% { transform: scaleX(1); opacity: 1; } }
@keyframes lt-punt { 0%, 60%, 100% { opacity: 0.2; } 30% { opacity: 1; } }
@keyframes lt-golf { 0% { transform: scale(0.55); opacity: 0; } 25% { opacity: 0.5; } 100% { transform: scale(1); opacity: 0; } }
@keyframes lt-in { from { opacity: 0; } to { opacity: 1; } }
`

export default function LaadTest() {
  const [sleutel, setSleutel] = useState(0)
  const [groot, setGroot] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Zo gaat het bij het opstarten: een paar keer kort achter elkaar opnieuw.
  const herlaad = () => {
    timers.current.forEach(clearTimeout)
    timers.current = [0, 350, 800, 1500].map(ms => setTimeout(() => setSleutel(s => s + 1), ms))
  }

  const knop = { minHeight: 44, padding: '0 1.2rem', borderRadius: 12, border: 'none', background: '#fff', color: '#0a0a0a', fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }
  const grootV = VARIANTEN.find(v => v.id === groot)

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', padding: '24px 16px 110px', fontFamily: 'inherit' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Laadscherm kiezen</div>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, maxWidth: 560 }}>
          Tik op een vak om het schermvullend te zien. De knop onderaan zet alles vier keer kort achter elkaar opnieuw neer, zoals bij het opstarten.
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {VARIANTEN.map(v => (
            <button key={v.id} onClick={() => setGroot(v.id)} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 0, cursor: 'pointer', color: '#fff', fontFamily: 'inherit', textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <v.C key={sleutel} />
              </div>
              <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{v.naam}</div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{v.uitleg}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {grootV && (
        <div onClick={() => setGroot(null)} style={{ position: 'fixed', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <grootV.C key={sleutel} />
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            {grootV.naam} · tik om terug te gaan
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 11, padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)', display: 'flex', justifyContent: 'center', background: 'linear-gradient(to top, #0a0a0a 60%, rgba(10,10,10,0))', pointerEvents: 'none' }}>
        <button onClick={(e) => { e.stopPropagation(); herlaad() }} style={{ ...knop, pointerEvents: 'auto' }}>Doe herladen na</button>
      </div>
    </div>
  )
}
