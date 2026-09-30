// src/modules/steps/StappenInzichtModal.jsx
//
// Stappen over een langere periode: 30 of 90 dagen.
//
// De strook in de cardio-sectie laat de lopende week zien — goed om bij te
// sturen, waardeloos om een lijn in te ontdekken. Hier gaat het om het
// tegenovergestelde: is het over maanden gezakt of gestegen?
//
// Bij 90 dagen worden de dagen per week opgeteld. Negentig staafjes naast
// elkaar zijn op een telefoon niet te lezen, en de vraag is daar toch een
// andere: niet "hoe liep dinsdag", maar "welke weken zakten weg".

import { useEffect, useMemo, useState } from 'react'
import { Flame } from 'lucide-react'
import Modal from '../../ui/Modal'
import { colors, radius, space } from '../../ui/tokens'
import StappenService, { STANDAARD_DOEL } from './StappenService'
import { kcalVanStappen } from './stappenEnergie'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

const PERIODES = [
  { dagen: 30, label: '30 dagen' },
  { dagen: 90, label: '90 dagen' },
]

// Dagen bundelen tot weken, oudste eerst. De laatste bundel is de lopende
// week en mag korter zijn dan zeven dagen.
const perWeek = (dagen) => {
  const uit = []
  for (let i = 0; i < dagen.length; i += 7) {
    const blok = dagen.slice(i, i + 7)
    uit.push({
      key: blok[0].iso,
      steps: blok.reduce((s, d) => s + (d.steps || 0), 0),
      label: new Date(`${blok[0].iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      dagen: blok.length,
    })
  }
  return uit
}

// Eén kerncijfer. Buiten de component gehouden: binnenin zou React hem bij
// elke render als nieuw componenttype zien en de inhoud opnieuw opbouwen.
function Blok({ waarde, label, accent, m }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: m ? '1.15rem' : '1.35rem', fontWeight: 900,
        color: accent || colors.textPrimary, lineHeight: 1.1, letterSpacing: '-0.02em',
      }}>
        {waarde}
      </div>
      <div style={{ fontSize: m ? '0.78rem' : '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

export default function StappenInzichtModal({ isOpen, onClose, client, db, isMobile, gewichtKg, doel = STANDAARD_DOEL }) {
  const m = isMobile
  const [periode, setPeriode] = useState(30)
  const [dagen, setDagen] = useState([])
  const [laden, setLaden] = useState(false)

  useEffect(() => {
    if (!isOpen || !client?.id || !db?.supabase) return
    let afgebroken = false
    setLaden(true)
    StappenService.haalDagen(db, client.id, periode)
      .then((rijen) => { if (!afgebroken) setDagen(rijen || []) })
      .finally(() => { if (!afgebroken) setLaden(false) })
    return () => { afgebroken = true }
  }, [isOpen, client?.id, db, periode])

  const cijfers = useMemo(() => {
    const metStappen = dagen.filter(d => (d.steps || 0) > 0)
    const totaal = dagen.reduce((s, d) => s + (d.steps || 0), 0)
    return {
      totaal,
      gemiddeld: metStappen.length ? Math.round(totaal / metStappen.length) : 0,
      dagenGehaald: dagen.filter(d => (d.steps || 0) >= doel).length,
      dagenGelopen: metStappen.length,
      kcal: kcalVanStappen(totaal, gewichtKg),
    }
  }, [dagen, doel, gewichtKg])

  const staven = periode >= 90 ? perWeek(dagen) : dagen.map(d => ({
    key: d.iso, steps: d.steps, label: d.iso.slice(8, 10), dagen: 1,
  }))
  const maxStaaf = Math.max(1, ...staven.map(s => s.steps))
  // Een staaf is "gehaald" als het doel voor elke dag erin gehaald is. Bij een
  // aangebroken week telt hij dus naar rato mee, anders zou de lopende week
  // altijd rood lijken.
  const doelVoor = (staaf) => doel * staaf.dagen
  const drempelLijn = periode >= 90 ? doel * 7 : doel
  const hoogte = m ? 90 : 120

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Je stappen" isMobile={isMobile} maxWidth={680}>
      {/* Periodekeuze */}
      <div style={{ display: 'flex', gap: space[2], marginBottom: space[4] }}>
        {PERIODES.map(p => {
          const actief = p.dagen === periode
          return (
            <button
              key={p.dagen}
              onClick={() => setPeriode(p.dagen)}
              style={{
                flex: 1, padding: m ? '9px 12px' : '10px 14px',
                borderRadius: radius.btn, cursor: 'pointer',
                background: actief ? colors.textPrimary : 'transparent',
                border: `1px solid ${actief ? colors.textPrimary : 'rgba(255,255,255,0.18)'}`,
                color: actief ? colors.bg : 'rgba(255,255,255,0.7)',
                fontSize: m ? '0.88rem' : '0.92rem', fontWeight: 800,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {laden && dagen.length === 0 ? (
        <div style={{ padding: space[8], textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
          Laden…
        </div>
      ) : (
        <>
          {/* Kerncijfers */}
          <div style={{ display: 'flex', gap: space[3], marginBottom: space[6] }}>
            <Blok m={m} waarde={nl(cijfers.gemiddeld)} label="gemiddeld per dag" />
            <Blok m={m} waarde={nl(cijfers.totaal)} label="totaal" />
            <Blok m={m} waarde={`${cijfers.dagenGehaald}×`} label="doel gehaald" accent={cijfers.dagenGehaald > 0 ? colors.success : undefined} />
          </div>

          {/* Grafiek */}
          <div style={{ position: 'relative', display: 'flex', gap: periode >= 90 ? 5 : 2, alignItems: 'flex-end', height: hoogte, marginBottom: space[2] }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, zIndex: 1, pointerEvents: 'none',
              bottom: Math.round((Math.min(drempelLijn, maxStaaf) / maxStaaf) * hoogte),
              borderTop: `1px dashed ${colors.borderSubtle}`,
            }} />
            {staven.map(s => {
              const vul = s.steps > 0 ? Math.max(3, Math.round((s.steps / maxStaaf) * hoogte)) : 0
              const gehaald = s.steps >= doelVoor(s)
              return (
                <div
                  key={s.key}
                  title={`${s.label}: ${nl(s.steps)} stappen`}
                  style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'flex-end' }}
                >
                  <div style={{
                    width: '100%', height: vul || 2, borderRadius: 4,
                    background: vul === 0
                      ? 'rgba(255,255,255,0.06)'
                      : gehaald ? colors.success : 'rgba(255,255,255,0.5)',
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: m ? '0.76rem' : '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
            <span>{staven[0]?.label}</span>
            <span>{periode >= 90 ? 'per week' : 'per dag'}</span>
            <span>{staven[staven.length - 1]?.label}</span>
          </div>

          {/* Energie over de periode */}
          {cijfers.kcal !== null && (
            <div style={{
              marginTop: space[6], paddingTop: space[4],
              borderTop: `1px solid ${colors.borderSubtle}`,
              display: 'flex', alignItems: 'center', gap: space[3],
            }}>
              <Flame size={m ? 20 : 22} color="rgba(255,255,255,0.75)" strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900, color: colors.textPrimary, lineHeight: 1.15 }}>
                  ± {nl(cijfers.kcal)} kcal
                </div>
                <div style={{ fontSize: m ? '0.78rem' : '0.82rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 4 }}>
                  extra verbrand in {periode} dagen · ongeveer {nl(Math.round(cijfers.kcal / (periode / 7)))} per week
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
