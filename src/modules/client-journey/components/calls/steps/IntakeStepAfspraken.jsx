// src/modules/client-journey/components/calls/steps/IntakeStepAfspraken.jsx
import React from 'react'
import { ChevronRight } from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981',
  text: '#ffffff', text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)', text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)',
}

const VERWACHTINGEN = [
  '"Het hoeft niet perfect — 80% is genoeg"',
  '"De eerste 2 weken zijn gewenning, stres je niet"',
  '"Gewicht fluctueert dagelijks — kijk naar weekgemiddelden"',
  '"Ik ben er voor je als het even niet lukt"',
  '"Ziek of vakantie? We pauzeren en pakken weer op"',
]

function SectionLabel({ label }) {
  return (
    <div style={{
      fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.2)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '8px 14px 4px', borderTop: `1px solid rgba(255,255,255,0.04)`,
    }}>{label}</div>
  )
}

function InputRow({ label, placeholder, value, onChange }) {
  return (
    <div style={{ padding: '6px 14px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
        {label}
      </div>
      <input
        type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '3px 0', background: 'transparent',
          border: 'none', borderBottom: `1px solid ${value ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          color: value ? C.text : 'rgba(255,255,255,0.25)',
          fontSize: '12px', fontWeight: value ? 700 : 500,
          outline: 'none', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

export default function IntakeStepAfspraken({ notes, updateNotes, onComplete, onBack, isMobile }) {
  const n = notes.afspraken || {}
  const update = (key, val) => updateNotes('afspraken', { [key]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stap 5 · Afspraken</span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Verwachtingen */}
        <SectionLabel label="Benoem deze verwachtingen" />
        <div style={{ padding: '4px 14px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {VERWACHTINGEN.map((s, i) => (
            <div key={i} style={{
              fontSize: '11px', color: C.text25, padding: '4px 0',
              borderBottom: i < VERWACHTINGEN.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
              lineHeight: 1.5,
            }}>{s}</div>
          ))}
        </div>

        {/* Gezondheid */}
        <SectionLabel label="Gezondheid" />
        <div style={{ padding: '6px 14px 8px' }}>
          <textarea value={n.gezondheid || ''} onChange={e => update('gezondheid', e.target.value)}
            placeholder="Medische aandoeningen, medicijnen, bijzonderheden..."
            rows={2} style={{
              width: '100%', padding: '4px 0', background: 'transparent',
              border: 'none', borderBottom: `1px solid rgba(255,255,255,0.04)`,
              color: C.text50, fontSize: '11px', fontFamily: 'inherit',
              outline: 'none', resize: 'none', lineHeight: 1.5,
            }} />
        </div>

        {/* Afspraken */}
        <SectionLabel label="Afspraken vastleggen" />
        <InputRow
          label="Startdatum"
          placeholder="bijv. maandag 14 april"
          value={n.startdatum}
          onChange={v => update('startdatum', v)}
        />
        <InputRow
          label="Call frequentie"
          placeholder="bijv. elke 2 weken op dinsdag 19:00"
          value={n.call_freq}
          onChange={v => update('call_freq', v)}
        />
        <InputRow
          label="WhatsApp afspraken"
          placeholder="bijv. ik reageer binnen 24 uur op werkdagen"
          value={n.whatsapp}
          onChange={v => update('whatsapp', v)}
        />

        {/* Notities */}
        <SectionLabel label="Extra notities" />
        <div style={{ padding: '6px 14px 12px' }}>
          <textarea value={n.notitie || ''} onChange={e => update('notitie', e.target.value)}
            placeholder="Overige aandachtspunten voor dit traject..."
            rows={3} style={{
              width: '100%', padding: '4px 0', background: 'transparent',
              border: 'none', borderBottom: `1px solid rgba(255,255,255,0.04)`,
              color: C.text50, fontSize: '11px', fontFamily: 'inherit',
              outline: 'none', resize: 'none', lineHeight: 1.5,
            }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderTop: `1px solid ${C.borderSub}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: '34px', height: '34px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text25, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>←</button>
        <button onClick={onComplete} style={{ flex: 1, height: '34px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: C.green, fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          Naar output <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}
