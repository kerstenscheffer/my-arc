// src/modules/coach-command-center/components/CheckinFlow.jsx
//
// Check-in rond een call: voor, tijdens en na.
//
// Eén formulier dat je van boven naar beneden doorloopt terwijl je belt. Het
// slaat op als één logboek-item met category 'checkin': de structuur in het
// data-veld, een leesbare samenvatting in note. Die samenvatting is er zodat
// de tijdlijn er zonder extra code iets van kan tonen, en zodat je hem in één
// klik naar de klant kunt kopieren.
//
// Bewust geen automatisch opslaan in de browser zoals het ontwerp deed. Dit
// zit in een modal die je sluit; wat je hier invult hoort in de database bij
// de klant te staan, niet in de localStorage van dit ene apparaat.

import React, { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { CHECKS, RONDE, CHECK_LABEL, CHECK_KLEUR, VASTE_VRAGEN, samenvatting } from './checkinData'
import { veld } from './formulierStijl'
import { Kop, Label, ToevoegKnop, WisKnop } from './formulierBouwstenen'

// ── Het formulier ──────────────────────────────────────────────────────────

export default function CheckinFlow({ waarde, onChange, onOpslaan, opslaan, clientNaam, conceptStand }) {
  const s = waarde
  const zet = (deel) => onChange({ ...s, ...deel })
  const [gekopieerd, setGekopieerd] = useState(false)

  const rij = (lijst, i, deel, sleutel) => {
    const nieuw = [...lijst]
    nieuw[i] = { ...nieuw[i], ...deel }
    zet({ [sleutel]: nieuw })
  }
  const wis = (lijst, i, sleutel) => zet({ [sleutel]: lijst.filter((_, j) => j !== i) })

  const kopieer = async (tekst) => {
    try {
      await navigator.clipboard.writeText(tekst)
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 1600)
    } catch { /* klembord geweigerd; geen melding, de knop doet dan gewoon niets */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 01 Voor de call ── */}
      <Kop nummer="01" titel="Voor de call" sub="5 min" />

      <div>
        <Label>Snelle check</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {CHECKS.map(c => {
            const stand = s.checks?.[c.id] || ''
            return (
              <button
                key={c.id}
                onClick={() => zet({ checks: { ...s.checks, [c.id]: RONDE[(RONDE.indexOf(stand) + 1) % RONDE.length] } })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                  padding: '0.5rem 0.6rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${stand ? CHECK_KLEUR[stand] + '66' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  {c.label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 900, color: CHECK_KLEUR[stand] }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHECK_KLEUR[stand] }} />
                  {CHECK_LABEL[stand]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label>WhatsApp &amp; check-ins</Label>
        <textarea
          value={s.voor || ''}
          onChange={e => zet({ voor: e.target.value })}
          placeholder="Wat viel op vooraf…"
          style={{ ...veld, minHeight: 52, resize: 'vertical' }}
        />
      </div>

      {/* ── 02 Tijdens de call ── */}
      <Kop nummer="02" titel="Tijdens de call" sub="live" />

      {/* De drie vragen die elke call langskomen. Als vaste velden en niet
          als losse vraag-regels: dan staan ze er al, en dan sla je ze niet
          over op de call waar het juist nodig is. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VASTE_VRAGEN.map(q => (
          <div key={q.id}>
            <Label>{q.label}</Label>
            <textarea
              value={s.vast?.[q.id] || ''}
              onChange={e => zet({ vast: { ...s.vast, [q.id]: e.target.value } })}
              placeholder={q.hint}
              style={{ ...veld, minHeight: 46, resize: 'vertical' }}
            />
          </div>
        ))}
      </div>

      <div>
        <Label>Wat valt op → oplossing</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(s.waarnemingen || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <textarea value={it.o} onChange={e => rij(s.waarnemingen, i, { o: e.target.value }, 'waarnemingen')}
                placeholder="Wat valt op…" style={{ ...veld, minHeight: 40, resize: 'vertical' }} />
              <textarea value={it.s} onChange={e => rij(s.waarnemingen, i, { s: e.target.value }, 'waarnemingen')}
                placeholder="Oplossing…" style={{ ...veld, minHeight: 40, resize: 'vertical' }} />
              <WisKnop onClick={() => wis(s.waarnemingen, i, 'waarnemingen')} />
            </div>
          ))}
        </div>
        <ToevoegKnop onClick={() => zet({ waarnemingen: [...(s.waarnemingen || []), { o: '', s: '' }] })}>regel</ToevoegKnop>
      </div>

      {/* Wat de klant gaat doen. Bewust zonder afvinkhokje, anders dan bij
          je eigen to-do's: een opgeslagen check-in is een logboek-item dat
          je niet meer bijwerkt, dus dat vinkje zou nooit aangaan. */}
      <div>
        <Label>Actiepunten klant</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(s.acties || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{
                width: 20, flexShrink: 0, textAlign: 'center',
                fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)',
              }}>{i + 1}</span>
              <input value={it.t} onChange={e => rij(s.acties, i, { t: e.target.value }, 'acties')}
                placeholder="Wat gaat hij doen…" style={{ ...veld, flex: 1 }} />
              <input type="date" value={it.deadline || ''}
                onChange={e => rij(s.acties, i, { deadline: e.target.value }, 'acties')}
                style={{ ...veld, width: 'auto', flex: '0 0 auto', fontSize: '0.7rem' }} />
              <WisKnop onClick={() => wis(s.acties, i, 'acties')} />
            </div>
          ))}
        </div>
        <ToevoegKnop onClick={() => zet({ acties: [...(s.acties || []), { t: '', deadline: '' }] })}>actiepunt</ToevoegKnop>
      </div>

      <div>
        <Label>Losse notities</Label>
        <textarea value={s.notities || ''} onChange={e => zet({ notities: e.target.value })}
          placeholder="Wat er verder besproken is…" style={{ ...veld, minHeight: 52, resize: 'vertical' }} />
      </div>

      {/* ── 03 Na de call ── */}
      <Kop nummer="03" titel="Na de call" sub="afronden" />

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
        <Label>Mijn to-do&apos;s</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(s.todos || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => rij(s.todos, i, { klaar: !it.klaar }, 'todos')}
                aria-label="afvinken"
                style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: it.klaar ? '#fff' : 'transparent',
                  border: `1px solid ${it.klaar ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                  color: '#0a0a0a', cursor: 'pointer',
                }}>{it.klaar && <Check size={12} />}</button>
              <input value={it.t} onChange={e => rij(s.todos, i, { t: e.target.value }, 'todos')}
                placeholder="To-do…"
                style={{ ...veld, flex: 1, textDecoration: it.klaar ? 'line-through' : 'none',
                  color: it.klaar ? 'rgba(255,255,255,0.4)' : '#fff' }} />
              <input type="date" value={it.deadline || ''}
                onChange={e => rij(s.todos, i, { deadline: e.target.value }, 'todos')}
                style={{ ...veld, width: 'auto', flex: '0 0 auto', fontSize: '0.7rem' }} />
              <WisKnop onClick={() => wis(s.todos, i, 'todos')} />
            </div>
          ))}
        </div>
        <ToevoegKnop onClick={() => zet({ todos: [...(s.todos || []), { t: '', klaar: false, deadline: '' }] })}>to-do</ToevoegKnop>
      </div>

      {/* Laten zien dat het tussentijds bewaard is. Zonder dit teken durf je
          het venster niet te sluiten met een half ingevulde check-in. */}
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

      {/* Opslaan en kopiëren van het geheel */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button onClick={onOpslaan} disabled={opslaan} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0.6rem', background: '#fff', border: 'none', borderRadius: 8,
          color: '#0a0a0a', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
          cursor: opslaan ? 'default' : 'pointer',
        }}>
          {opslaan ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
          {opslaan ? 'Opslaan…' : 'Check-in opslaan'}
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
