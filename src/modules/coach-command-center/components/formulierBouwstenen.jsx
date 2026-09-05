// src/modules/coach-command-center/components/formulierBouwstenen.jsx
//
// Bouwstenen die de check-in en de onboarding delen: genummerde kop, label,
// toevoeg- en wisknop, en een afvinkregel. Eén bron, zodat de twee
// formulieren er hetzelfde uitzien en dat ook blijven.

import React from 'react'
import { Plus, X, Check } from 'lucide-react'

export function Kop({ nummer, titel, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8,
      padding: '0.5rem 0', marginTop: '0.4rem',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{nummer}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{titel}</span>
      {sub && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{sub}</span>}
    </div>
  )
}

export function Label({ children }) {
  return (
    <div style={{
      fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
    }}>{children}</div>
  )
}

export function ToevoegKnop({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '0.35rem 0.6rem', marginTop: 4,
      background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)',
      borderRadius: 7, color: 'rgba(255,255,255,0.55)',
      fontSize: '0.7rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
    }}>
      <Plus size={11} /> {children}
    </button>
  )
}

export function WisKnop({ onClick }) {
  return (
    <button onClick={onClick} aria-label="verwijder" style={{
      width: 26, height: 26, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
    }}><X size={12} /></button>
  )
}

/** Eén regel die je afvinkt: hokje links, tekst ernaast, hele regel klikbaar. */
export function VinkRegel({ aan, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '0.45rem 0.55rem',
      background: aan ? 'rgba(255,255,255,0.05)' : 'transparent',
      border: `1px solid ${aan ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    }}>
      <span style={{
        width: 18, height: 18, flexShrink: 0, borderRadius: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: aan ? '#fff' : 'transparent',
        border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.25)'}`,
        color: '#0a0a0a',
      }}>{aan && <Check size={11} />}</span>
      <span style={{
        fontSize: '0.78rem', fontWeight: 700,
        color: aan ? '#fff' : 'rgba(255,255,255,0.6)',
      }}>{label}</span>
    </button>
  )
}
