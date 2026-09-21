// src/modules/coach-command-center/components/insight/MacroRingen.jsx
//
// Wat er nu op het bord van de klant staat: de macro's die hij volgt, als
// ringen. Zelfde vorm als op zijn eigen maaltijdpagina, zodat jullie naar
// hetzelfde plaatje kijken als je hem aan de telefoon hebt.
//
// De ring vult zich met het aandeel in de totale calorieën, niet met een
// voortgang: eiwit 170 g is 680 kcal en dus 21% van 3165. Zo zie je in één
// oogopslag of de verdeling klopt — een bulk met 12% eiwit springt eruit zonder
// dat je hoeft te rekenen.
//
// Elk getal is aan te passen: tikken, typen, enter. Dat schrijft alleen dat ene
// veld. Bewust geen herberekening van de rest — verander je de kcal, dan blijven
// de grammen staan tot je ze zelf bijwerkt of het paneel hieronder laat
// doorrekenen. Automatisch meerekenen zet drie getallen op het bord van de klant
// terwijl je er één aanraakte.

import { useState } from 'react'
import { Flame, Egg, Wheat, Droplet, Check, X } from 'lucide-react'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'

const RINGEN = [
  {
    veld: 'target_calories', label: 'Kcal', kleur: '#fff', kcalPerGram: 0,
    eenheid: 'kcal', icoon: <Flame size={10} color="#fff" strokeWidth={2.8} />,
  },
  {
    veld: 'target_protein', label: 'Eiwit', kleur: '#ef4444', kcalPerGram: 4,
    eenheid: 'gram', icoon: <Egg size={10} color="#ef4444" strokeWidth={2.8} />,
  },
  {
    veld: 'target_carbs', label: 'Koolh', kleur: '#f59e0b', kcalPerGram: 4,
    eenheid: 'gram', icoon: <Wheat size={10} color="#f59e0b" strokeWidth={2.8} />,
  },
  {
    veld: 'target_fat', label: 'Vet', kleur: '#3b82f6', kcalPerGram: 9,
    eenheid: 'gram', icoon: <Droplet size={10} color="#3b82f6" strokeWidth={2.8} />,
  },
]

function Ring({ label, kleur, waarde, eenheid, aandeel, icoon, isMobile, onBewaar }) {
  const [bewerken, setBewerken] = useState(false)
  const [tekst, setTekst] = useState(String(waarde ?? ''))

  const maat = isMobile ? 54 : 60
  const dikte = 5
  const r = (maat - dikte) / 2
  const omtrek = 2 * Math.PI * r
  const vol = omtrek - (Math.min(100, aandeel ?? 100) / 100) * omtrek

  const klaar = () => {
    const n = Math.round(Number(String(tekst).replace(',', '.')))
    setBewerken(false)
    if (Number.isFinite(n) && n >= 0 && n !== Number(waarde)) onBewaar(n)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: maat, height: maat }}>
        <svg width={maat} height={maat} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={maat / 2} cy={maat / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={dikte} fill="none" />
          <circle
            cx={maat / 2} cy={maat / 2} r={r} stroke={kleur} strokeWidth={dikte} fill="none"
            strokeDasharray={omtrek} strokeDashoffset={vol} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {bewerken ? (
            <input
              autoFocus
              value={tekst}
              onChange={(e) => setTekst(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={klaar}
              onKeyDown={(e) => {
                if (e.key === 'Enter') klaar()
                if (e.key === 'Escape') { setTekst(String(waarde ?? '')); setBewerken(false) }
              }}
              style={{
                width: maat - 14, textAlign: 'center',
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit',
              }}
            />
          ) : (
            <button
              onClick={() => { setTekst(String(waarde ?? '')); setBewerken(true) }}
              title="Aanpassen"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {Math.round(waarde || 0)}
              </span>
              <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                {eenheid}
              </span>
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {icoon}
        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff' }}>{label}</span>
        {aandeel != null && (
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{aandeel}%</span>
        )}
      </div>
    </div>
  )
}

export default function MacroRingen({ client, db, onClientUpdate, isMobile }) {
  const [fout, setFout] = useState(null)
  const [zojuist, setZojuist] = useState(null)

  const kcal = Math.round(Number(client?.target_calories) || 0)
  const waarden = Object.fromEntries(RINGEN.map(r => [r.veld, Math.round(Number(client?.[r.veld]) || 0)]))
  const somKcal = RINGEN
    .filter(r => r.kcalPerGram > 0)
    .reduce((s, r) => s + waarden[r.veld] * r.kcalPerGram, 0)
  const verschil = kcal - somKcal
  // Het aandeel rekenen we over de som van de macro's, niet over het kcal-doel:
  // die twee lopen vaak een paar procent uiteen door afronden, en dan telt de
  // verdeling niet op tot honderd.
  const basis = somKcal > 0 ? somKcal : (kcal || 1)

  const bewaar = async (veld, nieuw) => {
    if (!db?.supabase || !client?.id) return
    setFout(null)
    try {
      const before = pickTrackedFields(client)
      const { error } = await db.supabase.from('clients').update({ [veld]: nieuw }).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.({ [veld]: nieuw })
      await logClientChanges({ db, clientId: client.id, before, after: { [veld]: nieuw }, source: 'macro_ringen' })
      setZojuist(veld)
      setTimeout(() => setZojuist(null), 1400)
    } catch (e) {
      console.error('Macro opslaan mislukt:', e)
      setFout('Opslaan mislukt')
    }
  }

  if (!kcal && !somKcal) return null

  return (
    <div style={{
      padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Wat hij nu volgt
        </span>
        <span style={{ flex: 1 }} />
        {zojuist && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, color: '#10b981' }}>
            <Check size={11} strokeWidth={3.4} /> bewaard
          </span>
        )}
        {fout && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, color: '#ef4444' }}>
            <X size={11} strokeWidth={3.4} /> {fout}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
        {RINGEN.map(r => (
          <Ring
            key={r.veld}
            label={r.label} kleur={r.kleur} icoon={r.icoon} eenheid={r.eenheid}
            waarde={waarden[r.veld]}
            aandeel={r.kcalPerGram > 0 ? Math.round((waarden[r.veld] * r.kcalPerGram / basis) * 100) : null}
            isMobile={isMobile}
            onBewaar={(n) => bewaar(r.veld, n)}
          />
        ))}
      </div>

      {/* Tellen de macro's niet op tot het kcal-doel, dan klopt er iets niet —
          meestal een getal dat met de hand is aangepast zonder de rest door te
          rekenen. Geen foutmelding: het mag, je moet het alleen weten. */}
      {Math.abs(verschil) > 50 && (
        <div style={{ marginTop: 8, fontSize: '0.66rem', fontWeight: 800, color: '#f59e0b' }}>
          De macro's tellen op tot {somKcal.toLocaleString('nl-NL')} kcal — {Math.abs(verschil)} {verschil > 0 ? 'minder' : 'meer'} dan het doel van {kcal.toLocaleString('nl-NL')}.
        </div>
      )}
    </div>
  )
}
