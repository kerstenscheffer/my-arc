// src/modules/coach-command-center/components/OnboardingFlow.jsx
//
// Onboarding-gesprek: het plan, wat je laat zien, wat er in de weg zit, en
// wat hij zelf gaat doen.
//
// Zelfde opzet als de check-in: één formulier dat je van boven naar beneden
// doorloopt terwijl je belt, en dat als één logboek-item wordt opgeslagen met
// category 'onboarding' — de structuur in het data-veld, een leesbare
// samenvatting in note.
//
// Het verschil met de check-in zit in de vinkjes. Een onboarding is voor een
// deel een lijst die je afwerkt: heb ik het trainingsplan laten zien, heb ik
// uitgelegd hoe hij logt, heb ik gevraagd of het duidelijk is. Dat zijn geen
// notities maar handelingen, en die wil je kunnen aftikken.

import React, { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { FASES, DOORLOPEN, AFSPRAKEN, samenvatting } from './onboardingData'
import { veld } from './formulierStijl'
import { Kop, Label, ToevoegKnop, WisKnop, VinkRegel } from './formulierBouwstenen'

export default function OnboardingFlow({ waarde, onChange, onOpslaan, opslaan, clientNaam, conceptStand }) {
  const s = waarde
  const zet = (deel) => onChange({ ...s, ...deel })
  const [gekopieerd, setGekopieerd] = useState(false)

  const rij = (lijst, i, deel, sleutel) => {
    const nieuw = [...lijst]
    nieuw[i] = { ...nieuw[i], ...deel }
    zet({ [sleutel]: nieuw })
  }
  const wis = (lijst, i, sleutel) => zet({ [sleutel]: lijst.filter((_, j) => j !== i) })
  const tik = (groep, id) => zet({ [groep]: { ...s[groep], [id]: !s[groep]?.[id] } })

  const kopieer = async (tekst) => {
    try {
      await navigator.clipboard.writeText(tekst)
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 1600)
    } catch { /* klembord geweigerd; geen melding, de knop doet dan gewoon niets */ }
  }

  const afgevinkt = DOORLOPEN.filter(d => s.doorlopen?.[d.id]).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 01 Het plan ── */}
      <Kop nummer="01" titel="Het plan" sub="waar gaan we heen" />

      <div>
        <Label>Fase</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {FASES.map(f => {
            const aan = s.fase === f.id
            return (
              <button
                key={f.id}
                // Nog een keer klikken zet hem weer uit. Anders zit je vast
                // aan je eerste tik als je je verkiest.
                onClick={() => zet({ fase: aan ? '' : f.id })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                  padding: '0.5rem 0.6rem',
                  background: aan ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: aan ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {f.label}
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  {f.hint}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label>Wat is de bedoeling van de komende tijd</Label>
        <textarea
          value={s.doel || ''}
          onChange={e => zet({ doel: e.target.value })}
          placeholder="In zijn woorden — wat wil hij bereiken en waarom nu…"
          style={{ ...veld, minHeight: 52, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>Streefgewicht</Label>
          <input
            type="number" step="0.1" inputMode="decimal"
            value={s.streefgewicht || ''}
            onChange={e => zet({ streefgewicht: e.target.value })}
            placeholder="kg" style={veld}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Per week</Label>
          <input
            type="number" step="0.05" inputMode="decimal"
            value={s.perWeek || ''}
            onChange={e => zet({ perWeek: e.target.value })}
            placeholder="kg" style={veld}
          />
        </div>
      </div>

      {/* ── 02 Samen doorlopen ── */}
      <Kop nummer="02" titel="Samen doorlopen" sub={`${afgevinkt}/${DOORLOPEN.length}`} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {DOORLOPEN.map(d => (
          <VinkRegel key={d.id} aan={!!s.doorlopen?.[d.id]} label={d.label}
            onClick={() => tik('doorlopen', d.id)} />
        ))}
      </div>

      {/* ── 03 Waar hij tegenaan loopt ── */}
      <Kop nummer="03" titel="Wat in de weg zit" sub="en wat we doen" />

      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(s.struggles || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <textarea value={it.s} onChange={e => rij(s.struggles, i, { s: e.target.value }, 'struggles')}
                placeholder="Waar loopt hij tegenaan…" style={{ ...veld, minHeight: 40, resize: 'vertical' }} />
              <textarea value={it.o} onChange={e => rij(s.struggles, i, { o: e.target.value }, 'struggles')}
                placeholder="Wat we daarin meenemen…" style={{ ...veld, minHeight: 40, resize: 'vertical' }} />
              <WisKnop onClick={() => wis(s.struggles, i, 'struggles')} />
            </div>
          ))}
        </div>
        <ToevoegKnop onClick={() => zet({ struggles: [...(s.struggles || []), { s: '', o: '' }] })}>regel</ToevoegKnop>
      </div>

      {/* ── 04 Afspraken ── */}
      <Kop nummer="04" titel="Afspraken herhalen" sub="afsluiten" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {AFSPRAKEN.map(a => (
          <VinkRegel key={a.id} aan={!!s.afspraken?.[a.id]} label={a.label}
            onClick={() => tik('afspraken', a.id)} />
        ))}
      </div>

      <div>
        <Label>Volgende call</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input type="datetime-local" value={s.volgende?.wanneer || ''}
            onChange={e => zet({ volgende: { ...s.volgende, wanneer: e.target.value } })}
            style={{ ...veld, width: 'auto', flex: '0 0 auto' }} />
          <input value={s.volgende?.onderwerp || ''}
            onChange={e => zet({ volgende: { ...s.volgende, onderwerp: e.target.value } })}
            placeholder="Onderwerp" style={{ ...veld, flex: 1, minWidth: 120 }} />
        </div>
      </div>

      <div>
        <Label>Losse notities</Label>
        <textarea value={s.notities || ''} onChange={e => zet({ notities: e.target.value })}
          placeholder="Wat er verder besproken is…" style={{ ...veld, minHeight: 52, resize: 'vertical' }} />
      </div>

      <div>
        <Label>Bericht naar client</Label>
        <textarea value={s.bericht || ''} onChange={e => zet({ bericht: e.target.value })}
          placeholder="Korte samenvatting + afspraken…" style={{ ...veld, minHeight: 76, resize: 'vertical' }} />
        <button onClick={() => kopieer(s.bericht || '')} disabled={!s.bericht} style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0.4rem 0.7rem',
          background: s.bericht ? '#fff' : 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 7,
          color: s.bericht ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
          fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit',
          cursor: s.bericht ? 'pointer' : 'default',
        }}>
          {gekopieerd ? <Check size={12} /> : <Copy size={12} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer bericht'}
        </button>
      </div>

      {/* Laten zien dat het tussentijds bewaard is. Zonder dit teken durf je
          het venster niet te sluiten met een half ingevulde onboarding. */}
      {conceptStand && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginTop: 2,
          fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: conceptStand === 'bewaard' ? '#10b981' : 'rgba(255,255,255,0.3)',
          }} />
          {conceptStand === 'bewaard' ? 'Tussentijds bewaard' : 'Bewaren…'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button onClick={onOpslaan} disabled={opslaan} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0.6rem', background: '#fff', border: 'none', borderRadius: 8,
          color: '#0a0a0a', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
          cursor: opslaan ? 'default' : 'pointer',
        }}>
          {opslaan ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
          {opslaan ? 'Opslaan…' : 'Onboarding opslaan'}
        </button>
        <button onClick={() => kopieer(samenvatting(s, clientNaam))} style={{
          padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8,
          color: '#fff', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
        }}>Samenvatting</button>
      </div>
    </div>
  )
}
