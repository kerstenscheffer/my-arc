// src/pages/CalorieCalculator.jsx
// Publieke calorie-calculator voor mannen — ondersteunt de 16-weken-video.
//
// Rekenwijze:
//   BMR  : Mifflin-St Jeor (mannen) = 10·kg + 6,25·cm − 5·leeftijd + 5
//   TDEE : BMR × activiteitsfactor
//   Doel : TDEE − 800 kcal
// Macro's volgens Kerstens regel voor 15-25% vet:
//   eiwit 2 g/kg, vet 1 g/kg, koolhydraten vullen de rest aan.
//
// Drie grenzen bewust ingebouwd, elk met een uitleg-regel in de UI:
//   1. Nooit onder 1500 kcal adviseren — bij lichtere of inactieve mannen zou
//      een tekort van 800 daar zo onder duiken.
//   2. Eiwit (2 g/kg) + vet-bodem (0,6 g/kg) vormen samen een calorie-bodem.
//      Ligt TDEE − 800 daaronder, dan wordt het doel opgetrokken; anders zouden
//      de macro's optellen tot méér dan het doel dat erboven staat. Het tekort
//      valt dan lager uit en dat zeggen we er expliciet bij.
//   3. Koolhydraten zakken bij zware mannen richting nul. Vet schaalt dan terug
//      tot de bodem zodat er ruimte blijft voor koolhydraten rond de training.
import { useState, useMemo } from 'react'

const GOLD = '#FFD700'
const isMobileNow = () => typeof window !== 'undefined' && window.innerWidth <= 768

const ACTIVITEIT = [
  { key: 1.2,   label: 'Zittend werk',   sub: 'Weinig tot geen training' },
  { key: 1.375, label: 'Licht actief',   sub: '1-3× per week trainen' },
  { key: 1.55,  label: 'Matig actief',   sub: '3-5× per week trainen' },
  { key: 1.725, label: 'Zeer actief',    sub: '6-7× per week trainen' },
  { key: 1.9,   label: 'Zwaar werk',     sub: 'Fysiek werk én training' },
]

const VETPERCENTAGE = [
  { key: 'onder', label: 'Onder 15%',  sub: 'Zichtbare buikspieren' },
  { key: 'binnen', label: '15 - 25%',  sub: 'Beetje buik, rest strak' },
  { key: 'boven', label: 'Boven 25%',  sub: 'Duidelijke buik' },
]

const KCAL_ONDERGRENS = 1500
const TEKORT = 800

export default function CalorieCalculator() {
  const isMobile = isMobileNow()
  const [leeftijd, setLeeftijd] = useState('')
  const [lengte, setLengte] = useState('')
  const [gewicht, setGewicht] = useState('')
  const [activiteit, setActiviteit] = useState(1.375)
  const [vet, setVet] = useState('binnen')

  const nummer = (v) => {
    const n = parseFloat(String(v).replace(',', '.'))
    return isNaN(n) ? null : n
  }

  const resultaat = useMemo(() => {
    const a = nummer(leeftijd), h = nummer(lengte), w = nummer(gewicht)
    if (!a || !h || !w || a < 15 || a > 90 || h < 130 || h > 230 || w < 40 || w > 250) return null

    const bmr = 10 * w + 6.25 * h - 5 * a + 5
    const tdee = Math.round(bmr * activiteit)

    // Eiwit ligt vast (2 g/kg). Vet mag zakken tot 0,6 g/kg — daaronder gaat het
    // ten koste van je hormoonhuishouding. Samen vormen die de bodem waar het
    // caloriedoel nooit onder kan komen; anders zouden de macro's optellen tot
    // méér dan het doel dat erboven staat.
    const eiwit = Math.round(w * 2)
    const vetBodem = Math.round(w * 0.6)
    const macroBodem = eiwit * 4 + vetBodem * 9

    const ruw = tdee - TEKORT
    const doel = Math.max(KCAL_ONDERGRENS, macroBodem, ruw)
    const afgetopt = ruw < KCAL_ONDERGRENS
    // Past het tekort van 800 niet omdat eiwit + vet al meer vragen?
    const bodemGehaald = ruw < macroBodem && macroBodem >= KCAL_ONDERGRENS
    const echtTekort = tdee - doel

    // Vet standaard 1 g/kg; terugschalen zodra er te weinig voor koolhydraten
    // overblijft, maar nooit onder de bodem.
    let vetGram = Math.round(w * 1)
    let koolhydraten = Math.round((doel - eiwit * 4 - vetGram * 9) / 4)
    let vetVerlaagd = false
    if (koolhydraten < 50) {
      const ruimte = doel - eiwit * 4 - 50 * 4
      const nieuwVet = Math.max(vetBodem, Math.floor(ruimte / 9))
      if (nieuwVet < vetGram) { vetGram = nieuwVet; vetVerlaagd = true }
      koolhydraten = Math.max(0, Math.round((doel - eiwit * 4 - vetGram * 9) / 4))
    }

    // Verwacht vetverlies: 1 kg vet ≈ 7700 kcal.
    const perWeek = (echtTekort * 7) / 7700
    const in16Weken = perWeek * 16

    return {
      tdee, doel, echtTekort, afgetopt, bodemGehaald,
      eiwit, vet: vetGram, koolhydraten, vetVerlaagd,
      perWeek, in16Weken,
      buitenBereik: vet !== 'binnen',
    }
  }, [leeftijd, lengte, gewicht, activiteit, vet])

  const veld = {
    width: '100%', boxSizing: 'border-box',
    padding: isMobile ? '0.85rem 0.9rem' : '0.9rem 1rem',
    borderRadius: 12, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
    fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
  }
  const label = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: 7,
    letterSpacing: '0.02em',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: isMobile ? '2rem 1rem 3rem' : '3rem 1rem 4rem',
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* ── Logo ── */}
        <img src="/ma-logo-header.png" alt="MY ARC"
          style={{
            display: 'block', margin: '0 auto',
            width: isMobile ? 104 : 132, height: 'auto',
            opacity: 0.6, marginBottom: isMobile ? '2rem' : '2.5rem',
          }} />

        {/* ── Titel ── */}
        <h1 style={{
          margin: 0, textAlign: 'center', color: '#fff', fontWeight: 900,
          fontSize: isMobile ? '2rem' : '2.6rem', lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          Calorie calculator<br />voor mannen
        </h1>
        <p style={{
          margin: '0.9rem 0 2.2rem', textAlign: 'center',
          fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: 1.55,
          color: 'rgba(255,255,255,0.55)', fontWeight: 500,
        }}>
          Vul je gegevens in en zie precies hoeveel je moet eten om vet te verliezen —
          inclusief je eiwitten, vetten en koolhydraten.
        </p>

        {/* ── Invoer ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: '1.4rem' }}>
          <div>
            <label style={label}>Leeftijd</label>
            <input type="number" inputMode="numeric" value={leeftijd}
              onChange={e => setLeeftijd(e.target.value)} placeholder="35" style={veld} />
          </div>
          <div>
            <label style={label}>Lengte</label>
            <input type="number" inputMode="numeric" value={lengte}
              onChange={e => setLengte(e.target.value)} placeholder="180" style={veld} />
          </div>
          <div>
            <label style={label}>Gewicht</label>
            <input type="number" inputMode="decimal" value={gewicht}
              onChange={e => setGewicht(e.target.value)} placeholder="90" style={veld} />
          </div>
        </div>

        <label style={label}>Hoe actief ben je?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: '1.4rem' }}>
          {ACTIVITEIT.map(a => {
            const aan = activiteit === a.key
            return (
              <button key={a.key} onClick={() => setActiviteit(a.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '0.75rem 0.9rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: aan ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${aan ? GOLD + '66' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: 'inherit',
              }}>
                <span style={{
                  flexShrink: 0, width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${aan ? GOLD : 'rgba(255,255,255,0.25)'}`,
                  background: aan ? GOLD : 'transparent',
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: aan ? '#fff' : 'rgba(255,255,255,0.75)' }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{a.sub}</span>
                </span>
              </button>
            )
          })}
        </div>

        <label style={label}>Schatting vetpercentage</label>
        <div style={{ display: 'flex', gap: 7, marginBottom: '1.8rem' }}>
          {VETPERCENTAGE.map(v => {
            const aan = vet === v.key
            return (
              <button key={v.key} onClick={() => setVet(v.key)} style={{
                flex: 1, padding: '0.7rem 0.4rem', borderRadius: 12, cursor: 'pointer',
                background: aan ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${aan ? GOLD + '66' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: 'inherit', textAlign: 'center',
              }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: aan ? GOLD : 'rgba(255,255,255,0.7)' }}>{v.label}</span>
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{v.sub}</span>
              </button>
            )
          })}
        </div>

        {/* ── Uitkomst ── */}
        {!resultaat ? (
          <div style={{
            padding: '2rem 1rem', textAlign: 'center', borderRadius: 16,
            background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', fontWeight: 600,
          }}>
            Vul je leeftijd, lengte en gewicht in
          </div>
        ) : (
          <>
            {/* Hoofdgetal */}
            <div style={{
              padding: isMobile ? '1.5rem 1rem' : '1.8rem 1.5rem', borderRadius: 18,
              background: 'linear-gradient(160deg, rgba(255,215,0,0.12), rgba(255,215,0,0.03))',
              border: `1px solid ${GOLD}44`, textAlign: 'center', marginBottom: '0.75rem',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
                Jouw dagelijkse doel
              </div>
              <div style={{ fontSize: isMobile ? '3rem' : '3.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {resultaat.doel.toLocaleString('nl-NL')}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>kcal per dag</div>
            </div>

            {/* Onderhoud + tekort */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '0.75rem' }}>
              <Vak titel="Onderhoud" waarde={`${resultaat.tdee.toLocaleString('nl-NL')}`} sub="kcal — hierop blijf je gelijk" />
              <Vak titel="Tekort" waarde={`−${resultaat.echtTekort.toLocaleString('nl-NL')}`} sub="kcal per dag" accent />
            </div>

            {/* Macro's */}
            <div style={{
              padding: isMobile ? '1.1rem 1rem' : '1.25rem', borderRadius: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '0.75rem',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                Je macro's
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <Macro naam="Eiwit" gram={resultaat.eiwit} kleur="#3b82f6" />
                <Macro naam="Vet" gram={resultaat.vet} kleur="#f59e0b" />
                <Macro naam="Koolhydraten" gram={resultaat.koolhydraten} kleur="#10b981" />
              </div>
            </div>

            {/* Verwachting — eerlijke rekensom, geen belofte. */}
            <div style={{
              padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
                Bij dit tekort verlies je ongeveer{' '}
                <strong style={{ color: '#fff' }}>{resultaat.perWeek.toFixed(1).replace('.', ',')} kg per week</strong>
                {' '}— dat is zo'n{' '}
                <strong style={{ color: GOLD }}>{resultaat.in16Weken.toFixed(1).replace('.', ',')} kg in 16 weken</strong>.
              </div>
            </div>

            {/* Waarschuwingen — alleen als ze echt gelden. */}
            {resultaat.afgetopt && (
              <Notitie>
                Een tekort van 800 kcal zou je onder de {KCAL_ONDERGRENS} kcal brengen. We houden het
                daarom op {KCAL_ONDERGRENS} — lager eten kost je spiermassa en energie, niet extra vet.
              </Notitie>
            )}
            {resultaat.bodemGehaald && (
              <Notitie>
                Bij jouw gewicht vragen je eiwitten en vetten al {resultaat.doel.toLocaleString('nl-NL')} kcal.
                Je tekort komt daardoor uit op {resultaat.echtTekort} kcal in plaats van {TEKORT} — nog steeds
                ruim genoeg om vet te verliezen, en je houdt je spiermassa vast.
              </Notitie>
            )}
            {resultaat.vetVerlaagd && (
              <Notitie>
                Je eiwit en vet vulden je hele budget. We hebben het vet iets verlaagd zodat er
                ruimte overblijft voor koolhydraten rond je trainingen.
              </Notitie>
            )}
            {resultaat.buitenBereik && (
              <Notitie>
                Deze macro-verdeling is afgestemd op 15-25% lichaamsvet. Zit je daarbuiten, gebruik
                dit dan als startpunt — in een traject stemmen we het af op jouw situatie.
              </Notitie>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Berekend met de Mifflin-St Jeor-formule. Een schatting — je eigen resultaten
              bepalen uiteindelijk of we bijsturen.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Vak({ titel, waarde, sub, accent }) {
  return (
    <div style={{
      padding: '0.9rem', borderRadius: 14, textAlign: 'center',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{titel}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: accent ? GOLD : '#fff', margin: '3px 0 2px' }}>{waarde}</div>
      <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
    </div>
  )
}

function Macro({ naam, gram, kleur }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: kleur, lineHeight: 1.1 }}>{gram}<span style={{ fontSize: '0.85rem' }}>g</span></div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{naam}</div>
    </div>
  )
}

function Notitie({ children }) {
  return (
    <div style={{
      padding: '0.75rem 0.9rem', borderRadius: 12, marginBottom: '0.6rem',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}
