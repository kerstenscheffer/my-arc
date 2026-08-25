// src/pages/calorie-calculator/PlanBlok.jsx
// De uitkomst als één kladblok-vel: wit papier, zwarte tekst, geen kleurvlakken.
// Verving een rij losse gekleurde kaarten die samen te druk werden om in één
// oogopslag te lezen.
//
// De downloadknop staat BUITEN het vel (in de balk erboven), zodat html2canvas
// 'm niet meefotografeert. Downloaden geeft een PNG — makkelijker te bewaren op
// een telefoon dan een PDF, en direct te delen.
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Download, Loader2 } from 'lucide-react'
import { doelZin, kg } from './rekenen'

const PAPIER = '#faf9f5'
const INKT = '#111'
const LIJN = 'rgba(0,0,0,0.1)'

export default function PlanBlok({ r, isMobile }) {
  const vel = useRef(null)
  const [bezig, setBezig] = useState(false)

  const download = async () => {
    if (!vel.current || bezig) return
    setBezig(true)
    try {
      const canvas = await html2canvas(vel.current, {
        scale: 2,                 // scherp op retina-schermen
        backgroundColor: PAPIER,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'mijn-caloriedoel.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download mislukt:', e)
      alert('Downloaden lukte niet. Maak anders even een screenshot.')
    } finally {
      setBezig(false)
    }
  }

  const Regel = ({ label, waarde, groot, laatste }) => (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 12, padding: groot ? '0.55rem 0' : '0.45rem 0',
      borderBottom: laatste ? 'none' : `1px solid ${LIJN}`,
    }}>
      <span style={{
        fontSize: groot ? (isMobile ? '1rem' : '1.05rem') : '0.92rem',
        fontWeight: groot ? 800 : 600, color: INKT,
      }}>{label}</span>
      <span style={{
        fontSize: groot ? (isMobile ? '1.35rem' : '1.5rem') : '1rem',
        fontWeight: 900, color: INKT, whiteSpace: 'nowrap',
      }}>{waarde}</span>
    </div>
  )

  const Kop = ({ children }) => (
    <div style={{
      fontSize: '0.78rem', fontWeight: 800, color: 'rgba(0,0,0,0.45)',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      margin: '1.4rem 0 0.3rem',
    }}>{children}</div>
  )

  return (
    <div>
      {/* Balk met de downloadknop — valt buiten de foto. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
          Jouw plan
        </div>
        <button onClick={download} disabled={bezig}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '0.7rem 1.1rem' : '0.75rem 1.3rem',
            borderRadius: 12, border: 'none', background: '#fff', color: '#000',
            fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900,
            cursor: bezig ? 'wait' : 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          {bezig ? <Loader2 size={17} /> : <Download size={17} />}
          {bezig ? 'Bezig…' : 'Download'}
        </button>
      </div>

      {/* Het vel zelf. */}
      <div ref={vel} style={{
        background: PAPIER, color: INKT, borderRadius: 14,
        padding: isMobile ? '1.4rem 1.2rem' : '1.8rem 1.7rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ borderBottom: `2px solid ${INKT}`, paddingBottom: 12, marginBottom: 4 }}>
          <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Mijn caloriedoel
          </div>
          {/* Zonder deze zin is het maar een getal — nu weet je waaróm het dit is. */}
          <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 700, marginTop: 3, lineHeight: 1.3 }}>
            {doelZin(r)}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
            MY ARC — calorie calculator
          </div>
        </div>

        <Kop>Elke dag</Kop>
        <Regel label="Eten" waarde={`${r.doel.toLocaleString('nl-NL')} kcal`} groot />
        <Regel label="Eiwit" waarde={`${r.eiwit} g`} />
        <Regel label="Vet" waarde={`${r.vet} g`} />
        <Regel label="Koolhydraten" waarde={`${r.koolhydraten} g`} laatste />

        <Kop>Ter vergelijking</Kop>
        <Regel label="Jouw onderhoud calorieën" waarde={`${r.tdee.toLocaleString('nl-NL')} kcal`} />
        <Regel label="Tekort per dag" waarde={`−${r.echtTekort.toLocaleString('nl-NL')} kcal`} />
        <Regel label="Tekort per week" waarde={`−${r.tekortWeek.toLocaleString('nl-NL')} kcal`} laatste />

        <Kop>Wat dat oplevert</Kop>
        <Regel label="Per week" waarde={`−${kg(r.perWeek)} kg`} />
        <Regel label="In 16 weken" waarde={`−${kg(r.in16Weken)} kg`} laatste={r.streefgewicht == null} />

        {r.streefgewicht != null && (
          <>
            <Regel label="Streefgewicht" waarde={`${kg(r.streefgewicht)} kg`} />
            <Regel label={`Van ${r.vetNu}% naar ${r.vetDoel}% vet`} waarde={`${r.wekenNodig} weken`} laatste />
          </>
        )}

        <div style={{
          marginTop: '1.5rem', paddingTop: '0.9rem', borderTop: `1px solid ${LIJN}`,
          fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', lineHeight: 1.5, fontWeight: 500,
        }}>
          Berekend met de Mifflin-St Jeor-formule. Een schatting — wat de weegschaal
          de komende weken doet, bepaalt of je bijstuurt.
        </div>
      </div>
    </div>
  )
}
