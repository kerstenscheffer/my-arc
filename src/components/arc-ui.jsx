// src/components/arc-ui.jsx
//
// Gedeelde bouwstenen voor de MY ARC modal-stijl: zwart, witte accenten,
// alles naast elkaar in plaats van onder elkaar, kleine labels boven een dikke
// waarde. De volledige beschrijving staat in docs/stijl-myarc-modal.md en in
// de tabel style_prompts (slug myarc-modal).
//
// Stond eerst in modules/productivity; nu app-breed, want ook schermen buiten
// de kanban en agenda gebruiken deze stijl.

import { createPortal } from 'react-dom'
import { ChevronDown, X } from 'lucide-react'
import { LIJN, LIJN_ZACHT, ZWART, KNOP_STIJL } from './arc-tokens'

// ── Venster ────────────────────────────────────────────────────────────────
// Op telefoon plakt hij aan de onderkant, op desktop staat hij midden in beeld.
// `vol` maakt hem schermvullend: geen rand, geen radius, geen marge. Voor een
// venster waar je langer in werkt (een taak met stappen, notitie en logboek)
// is een kaartje van 480 breed te krap; dan wil je het hele scherm.
export function Venster({ isMobile, onClose, maxWidth = 480, children, zIndex = 2147483600, vol = false }) {
  return createPortal(
    <div
      onClick={(e) => { if (!vol && e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: vol ? ZWART : 'rgba(0,0,0,0.82)',
        ...(vol ? {} : { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }),
        display: 'flex', alignItems: isMobile && !vol ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile || vol ? 0 : '1.5rem',
      }}
    >
      <div style={{
        background: ZWART,
        border: vol ? 'none' : `1px solid ${LIJN}`,
        borderRadius: vol ? 0 : (isMobile ? '16px 16px 0 0' : 16),
        // Ook schermvullend houden we een bovengrens aan de breedte: op een
        // breed scherm wordt een formulier van 2000 pixels onleesbaar. De kop,
        // het formulier en de voet houden zo dezelfde breedte.
        width: '100%', maxWidth: isMobile ? '100%' : maxWidth,
        height: vol ? '100%' : undefined,
        maxHeight: vol ? '100%' : (isMobile ? '92vh' : '85vh'),
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>,
    document.body
  )
}

// Kop van een venster: titel links, sluitknop rechts, optioneel iets ertussen.
export function VensterKop({ titel, sub, onClose, rechts = null, isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      padding: isMobile ? '0.85rem 1rem' : '0.95rem 1.15rem',
      borderBottom: `1px solid ${LIJN_ZACHT}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {titel}
        </div>
        {sub && (
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {rechts}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            width: 30, height: 30, flexShrink: 0, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
            borderRadius: 9, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
    </div>
  )
}

// ── Keuzevak: icoon, klein label, dikke waarde, chevron ────────────────────
export function Keuzevak({ label, isMobile, children, ...rest }) {
  // Als losse variabele en niet uit de props gedestructureerd, zodat de linter
  // 'm als component herkent in plaats van als ongebruikt argument.
  const Icon = rest.Icon
  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10,
      padding: isMobile ? '0.5rem 0.6rem' : '0.55rem 0.7rem',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${LIJN}`,
    }}>
      {Icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.75)',
        }}>
          <Icon size={14} strokeWidth={2.4} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2,
        }}>
          {label}
        </div>
        {children}
      </div>
      <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
    </div>
  )
}

// Klein kopje boven een blokje.
export function Kopje({ tekst, ...rest }) {
  const Icon = rest.Icon
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7,
      fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.09em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
    }}>
      {Icon && <Icon size={10} strokeWidth={2.6} />}
      {tekst}
    </div>
  )
}

// Samenvattingsregel: dik getal, klein woord erachter.
export function Stat({ waarde, eenheid }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{waarde}</span>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{eenheid}</span>
    </span>
  )
}

export const Punt = () => <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>·</span>

// ── Pil: schakelaar of paneel-opener ───────────────────────────────────────
export function Pil({ label, aan, stip, stipKleur, onClick, ...rest }) {
  const Icon = rest.Icon
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        minHeight: 30, padding: '0 0.75rem', borderRadius: 999,
        background: aan ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
        color: aan ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
        fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
      {stip && <span style={{ width: 6, height: 6, borderRadius: '50%', background: stipKleur || '#10b981' }} />}
    </button>
  )
}

// ── Chip: keuze uit een rijtje (duur, presets) ─────────────────────────────
export function Chip({ actief, onClick, children, breedte = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 30, padding: '0 0.7rem', borderRadius: 999,
        width: breedte || 'auto',
        background: actief ? '#fff' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${actief ? '#fff' : 'rgba(255,255,255,0.1)'}`,
        color: actief ? ZWART : 'rgba(255,255,255,0.6)',
        fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
        fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

// ── Knoppen ────────────────────────────────────────────────────────────────
export function Knop({ soort = 'primair', onClick, children, flex = null, breedte = null, disabled = false, titel = null, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={titel || undefined}
      style={{
        ...KNOP_STIJL[soort],
        flex: flex ?? undefined,
        width: breedte || undefined,
        minHeight: 44, padding: breedte ? 0 : '0 0.9rem', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: '0.8rem', fontWeight: 900, letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

// Voet van een venster: knoppen op een rij, met een lijn erboven.
export function VensterVoet({ isMobile, children }) {
  return (
    <div style={{
      display: 'flex', gap: 8, flexShrink: 0,
      padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.15rem',
      borderTop: `1px solid ${LIJN_ZACHT}`,
    }}>
      {children}
    </div>
  )
}
