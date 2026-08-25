// src/pages/CalorieCalculator.jsx
// Publieke calorie-calculator voor mannen — ondersteunt de 16-weken-video.
//
// Eén vraag per scherm, net als de MyArc-intake: minder scrollen, minder kans
// dat iemand halverwege afhaakt. De rekenkern staat in
// `calorie-calculator/rekenen.js`, het resultaat-vel in `PlanBlok.jsx`.
//
// Op het startscherm staat een écht doorgerekend voorbeeld in het klein, zodat
// duidelijk is wat je aan het eind krijgt voordat je begint met invullen.
import { useState } from 'react'
import BodyFatPicker from './calorie-calculator/BodyFatPicker'
import PlanBlok from './calorie-calculator/PlanBlok'
import { bereken, getal, ACTIVITEIT } from './calorie-calculator/rekenen'
import { bfWaarde } from './calorie-calculator/bodyFat'

const GOLD = '#FFD700'
const isMobileNow = () => typeof window !== 'undefined' && window.innerWidth <= 768

// De stappen ná het startscherm.
const STAPPEN = ['leeftijd', 'lengte', 'gewicht', 'activiteit', 'nu', 'doel']
const TOTAAL = STAPPEN.length

export default function CalorieCalculator() {
  const isMobile = isMobileNow()
  const [stap, setStap] = useState(-1)   // -1 = startscherm, TOTAAL = resultaat
  const [leeftijd, setLeeftijd] = useState('')
  const [lengte, setLengte] = useState('')
  const [gewicht, setGewicht] = useState('')
  const [activiteit, setActiviteit] = useState(null)
  const [bfNu, setBfNu] = useState(null)
  const [bfNu2, setBfNu2] = useState(null)
  const [bfDoel, setBfDoel] = useState(null)
  const [bfDoel2, setBfDoel2] = useState(null)

  const vetNu = bfWaarde(bfNu, bfNu2)
  const vetDoel = bfWaarde(bfDoel, bfDoel2)
  const r = bereken({ leeftijd, lengte, gewicht, activiteit: activiteit || 1.375, vetNu, vetDoel })

  const geldig = {
    leeftijd:   (() => { const n = getal(leeftijd); return n != null && n >= 15 && n <= 90 })(),
    lengte:     (() => { const n = getal(lengte);   return n != null && n >= 130 && n <= 230 })(),
    gewicht:    (() => { const n = getal(gewicht);  return n != null && n >= 40 && n <= 250 })(),
    activiteit: activiteit != null,
    nu:         vetNu != null,
    doel:       vetDoel != null && vetNu != null && vetDoel < vetNu,
  }
  const huidig = STAPPEN[stap]
  const magVerder = stap < 0 || geldig[huidig]

  const volgende = () => { if (magVerder) setStap(s => s + 1) }
  const terug = () => setStap(s => s - 1)

  const veld = {
    width: '100%', boxSizing: 'border-box', textAlign: 'center',
    padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.05)',
    border: `2px solid ${GOLD}44`, color: '#fff',
    fontSize: '2rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none',
    WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'textfield',
  }

  const wrap = {
    minHeight: '100vh', background: '#000', color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: isMobile ? '1.5rem 1rem 3rem' : '2.5rem 1rem 4rem',
  }

  const Logo = ({ vol }) => (
    <img src="/ma-logo-header.png" alt="MY ARC"
      style={{
        display: 'block', margin: '0 auto',
        width: vol ? (isMobile ? 104 : 132) : (isMobile ? 88 : 110),
        height: 'auto', opacity: vol ? 1 : 0.6,
      }} />
  )

  // ── Startscherm ──────────────────────────────────────────────────────────
  if (stap < 0) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Logo vol />
          {/* Titel en ondertitel samengevoegd tot één regel — korter leest beter
              op een telefoon dan een kop met een alinea eronder. */}
          <h1 style={{
            margin: isMobile ? '2rem 0 1.8rem' : '2.5rem 0 2rem', textAlign: 'center', color: '#fff',
            fontWeight: 900, fontSize: isMobile ? '2.1rem' : '2.6rem', lineHeight: 1.1, letterSpacing: '-0.03em',
          }}>
            Jouw caloriedoel<br />in {TOTAAL} vragen
          </h1>

          <Voorbeeld isMobile={isMobile} />

          {/* Startscherm is bewust zwart-wit: alleen het logo, de titel, het
              papieren voorbeeld en deze knop. Goud komt pas terug in de
              vraagschermen, waar het de voortgang en je keuzes markeert. */}
          <button onClick={() => setStap(0)} style={{
            width: '100%', marginTop: '1.5rem', padding: '1.1rem',
            borderRadius: 14, border: 'none', background: '#fff', color: '#000',
            fontSize: '1.05rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Start — {TOTAAL} vragen
          </button>
        </div>
      </div>
    )
  }

  // ── Resultaat ────────────────────────────────────────────────────────────
  if (stap >= TOTAAL) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <Logo />
          <div style={{ height: isMobile ? '1.5rem' : '2rem' }} />
          {r && <PlanBlok r={r} isMobile={isMobile} />}

          <div style={{ marginTop: '1.2rem' }}>
            {r?.afgetopt && (
              <Notitie>
                Een tekort van 800 kcal zou je onder de 1500 kcal brengen. We houden het daarom
                op 1500 — lager eten kost je spiermassa en energie, geen extra vet.
              </Notitie>
            )}
            {r?.bodemGehaald && (
              <Notitie>
                Bij jouw gewicht vragen je eiwitten en vetten al {r.doel.toLocaleString('nl-NL')} kcal.
                Je tekort komt daardoor uit op {r.echtTekort} kcal in plaats van 800 — nog steeds
                ruim genoeg, en je houdt je spiermassa vast.
              </Notitie>
            )}
            {r?.vetVerlaagd && (
              <Notitie>
                Je eiwit en vet vulden bijna je hele budget. We hebben het vet iets verlaagd zodat
                er ruimte overblijft voor koolhydraten rond je trainingen.
              </Notitie>
            )}
            {r?.hoogVet && r?.streefgewicht != null && (
              <Notitie>
                Boven 25% vet rekenen we je eiwit op je streefgewicht in plaats van je huidige
                gewicht. Het gaat om het behouden van je spiermassa, en die hangt aan je vetvrije
                massa — niet aan het vet eromheen.
              </Notitie>
            )}
          </div>

          <button onClick={() => setStap(TOTAAL - 1)} style={{
            width: '100%', marginTop: '1rem', padding: '0.9rem', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ← Antwoorden aanpassen
          </button>
        </div>
      </div>
    )
  }

  // ── Vraagschermen ────────────────────────────────────────────────────────
  const vragen = {
    leeftijd: {
      titel: 'Hoe oud ben je?',
      hint: 'Je leeftijd bepaalt mee hoeveel je lichaam in rust verbrandt.',
      body: <input type="number" inputMode="numeric" autoFocus value={leeftijd}
        onChange={e => setLeeftijd(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && volgende()}
        placeholder="35" style={veld} />,
    },
    lengte: {
      titel: 'Hoe lang ben je?',
      hint: 'In centimeters.',
      body: <input type="number" inputMode="numeric" autoFocus value={lengte}
        onChange={e => setLengte(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && volgende()}
        placeholder="180" style={veld} />,
    },
    gewicht: {
      titel: 'Wat weeg je nu?',
      hint: 'In kilo. Schat het gerust — je kunt het later bijstellen.',
      body: <input type="number" inputMode="decimal" autoFocus value={gewicht}
        onChange={e => setGewicht(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && volgende()}
        placeholder="90" style={veld} />,
    },
    activiteit: {
      titel: 'Hoe actief ben je?',
      hint: 'Tel je werk mee, niet alleen je trainingen.',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACTIVITEIT.map(a => {
            const aan = activiteit === a.key
            return (
              <button key={a.key} onClick={() => setActiviteit(a.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '0.9rem 1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: aan ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${aan ? GOLD + '66' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: 'inherit',
              }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${aan ? GOLD : 'rgba(255,255,255,0.25)'}`,
                  background: aan ? GOLD : 'transparent',
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{a.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      ),
    },
    nu: {
      titel: 'Waar sta je nu?',
      hint: 'Tik de foto die het dichtst in de buurt komt. Zit je ertussenin? Tik er twee naast elkaar.',
      body: <BodyFatPicker isMobile={isMobile} waarde={bfNu} waarde2={bfNu2}
        onChange={(a, b) => { setBfNu(a); setBfNu2(b) }} />,
    },
    doel: {
      titel: 'Waar wil je naartoe?',
      hint: 'Kies een foto links van je huidige keuze.',
      body: (
        <>
          <BodyFatPicker isMobile={isMobile} accent="#10b981" waarde={bfDoel} waarde2={bfDoel2}
            onChange={(a, b) => { setBfDoel(a); setBfDoel2(b) }} />
          {vetDoel != null && vetNu != null && vetDoel >= vetNu && (
            <div style={{ marginTop: 12, fontSize: '0.88rem', color: '#f59e0b', fontWeight: 600, textAlign: 'center' }}>
              Dat is gelijk aan of hoger dan waar je nu staat — kies er een links van.
            </div>
          )}
        </>
      ),
    },
  }

  const v = vragen[huidig]
  const nog = TOTAAL - stap - 1

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Logo />

        {/* Voortgang: balk + hoeveel er nog komen. */}
        <div style={{ margin: isMobile ? '1.5rem 0 0.5rem' : '2rem 0 0.5rem' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STAPPEN.map((naam, i) => (
              <div key={naam} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= stap ? GOLD : 'rgba(255,255,255,0.12)',
                transition: 'background 0.2s ease',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
              Vraag {stap + 1} van {TOTAAL}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
              {nog === 0 ? 'Laatste vraag' : `Nog ${nog} te gaan`}
            </span>
          </div>
        </div>

        {/* De vraag zelf — gecentreerd, met ruimte eromheen. */}
        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          <h2 style={{
            margin: 0, textAlign: 'center', color: '#fff', fontWeight: 900,
            fontSize: isMobile ? '1.7rem' : '2rem', lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            {v.titel}
          </h2>
          <p style={{
            margin: '0.7rem 0 1.6rem', textAlign: 'center', fontWeight: 500,
            fontSize: '0.92rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)',
          }}>
            {v.hint}
          </p>
          {v.body}
        </div>

        <button onClick={volgende} disabled={!magVerder} style={{
          width: '100%', marginTop: '1.8rem', padding: '1.1rem', borderRadius: 14, border: 'none',
          background: magVerder ? GOLD : 'rgba(255,255,255,0.07)',
          color: magVerder ? '#000' : 'rgba(255,255,255,0.3)',
          fontSize: '1.05rem', fontWeight: 900,
          cursor: magVerder ? 'pointer' : 'default', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {stap === TOTAAL - 1 ? 'Bekijk mijn plan' : 'Volgende'}
        </button>

        <button onClick={terug} style={{
          display: 'block', margin: '1rem auto 0', background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ← Terug
        </button>
      </div>
    </div>
  )
}

// Voorbeeld op het startscherm: een écht doorgerekend geval, zodat je ziet wat
// je krijgt voordat je begint. Klein en gedimd — het is een preview, geen
// resultaat.
function Voorbeeld({ isMobile }) {
  const v = bereken({ leeftijd: 35, lengte: 180, gewicht: 90, activiteit: 1.55, vetNu: 23, vetDoel: 14 })
  if (!v) return null
  const regel = (l, w) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
      <span style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>{l}</span>
      <span style={{ color: '#111', fontWeight: 800 }}>{w}</span>
    </div>
  )
  return (
    <div>
      <div style={{
        fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, color: '#fff',
        textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em',
      }}>
        Dit krijg je
      </div>
      <div style={{
        background: '#faf9f5', borderRadius: 12,
        padding: isMobile ? '0.9rem 1rem' : '1.1rem 1.2rem',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#111', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 6 }}>
          Mijn caloriedoel
        </div>
        {regel('Eten', `${v.doel.toLocaleString('nl-NL')} kcal`)}
        {regel('Eiwit / vet / koolh.', `${v.eiwit} / ${v.vet} / ${v.koolhydraten} g`)}
        {regel('Streefgewicht', `${Number(v.streefgewicht).toFixed(1).replace('.', ',')} kg`)}
        {regel('Klaar in', `${v.wekenNodig} weken`)}
        <div style={{ fontSize: '0.68rem', color: 'rgba(0,0,0,0.4)', marginTop: 8, fontWeight: 600 }}>
          Voorbeeld — 35 jaar, 180 cm, 90 kg
        </div>
      </div>
    </div>
  )
}

function Notitie({ children }) {
  return (
    <div style={{
      padding: '0.75rem 0.9rem', borderRadius: 12, marginBottom: '0.6rem',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontWeight: 500,
    }}>
      {children}
    </div>
  )
}
