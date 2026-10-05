// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanTitleBar.jsx
// Titel van het plan dat NU in de analyzer staat, direct bewerkbaar. De titel
// schrijft hard naar client_meal_plans.template_name van dít plan — niet naar
// de bibliotheek (die maakt een los sjabloon; zie PlanLibraryModal).
//
// Rechts staat de opslag-status van de week-wijzigingen (swaps/edits), zodat
// zichtbaar is dát er opgeslagen is en niet alleen in de console.

import { useEffect, useRef, useState } from 'react'
import { Pencil, Check, X, Loader, AlertTriangle } from 'lucide-react'

const GREEN = '#22c55e'
const RED = '#ef4444'

// Statuslabel voor de week-wijzigingen (niet voor de titel zelf).
// Zegt niet alleen dát er is opgeslagen, maar ook waar: in dit klantplan.
function SaveState({ state }) {
  const cfg = {
    idle:   { color: 'rgba(255,255,255,0.45)', label: 'Wijzigingen gaan direct in dit klantplan', icon: <Check size={12} strokeWidth={3} /> },
    saving: { color: 'rgba(255,255,255,0.45)', label: 'Opslaan in dit klantplan…', icon: <Loader size={12} style={{ animation: 'ptbSpin 1s linear infinite' }} /> },
    saved:  { color: GREEN, label: 'Opgeslagen in dit klantplan', icon: <Check size={12} strokeWidth={3} /> },
    error:  { color: RED, label: 'Laatste wijziging niet opgeslagen', icon: <AlertTriangle size={12} /> },
  }[state] || null
  if (!cfg) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      fontSize: '0.72rem', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

export default function PlanTitleBar({
  name, isActive, clientName = '', templateName = null,
  canEdit = true, onRename, weekSaveState = 'idle', isMobile,
}) {
  const m = isMobile
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name || '')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (!editing) setValue(name || '') }, [name, editing])

  useEffect(() => {
    if (status !== 'saved') return
    const t = setTimeout(() => setStatus('idle'), 2000)
    return () => clearTimeout(t)
  }, [status])

  const start = () => {
    if (!canEdit) return
    setValue(name || ''); setErrorMsg(''); setStatus('idle'); setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const cancel = () => { setEditing(false); setValue(name || ''); setErrorMsg('') }

  const commit = async () => {
    const next = value.trim()
    if (!next) { setErrorMsg('Geef het plan een naam'); return }
    if (next === (name || '')) { setEditing(false); return }
    setStatus('saving'); setErrorMsg('')
    try {
      await onRename(next)
      setStatus('saved'); setEditing(false)
    } catch (e) {
      setStatus('error'); setErrorMsg(e?.message || 'Opslaan mislukt')
    }
  }

  // Regel 1 zegt wat dit plan ís: van wie, of de klant het ziet, en waar het
  // vandaan komt. Regel 2 is de volledige titel, zonder knoppen ernaast die
  // hem afkappen.
  const delen = [
    isActive ? 'Actief · klant ziet dit' : 'Concept · alleen jij ziet dit',
    clientName ? `voor ${clientName}` : null,
    templateName ? `uit sjabloon ${templateName}` : null,
  ].filter(Boolean)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: m ? '0.6rem 0.75rem' : '0.7rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: isActive ? GREEN : 'rgba(255,255,255,0.5)',
        }}>
          {delen[0]}
        </span>
        {delen.slice(1).map((d, i) => (
          <span key={i} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            · {d}
          </span>
        ))}
      </div>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            ref={inputRef}
            value={value}
            autoFocus
            onChange={e => { setValue(e.target.value); setErrorMsg('') }}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            disabled={status === 'saving'}
            style={{
              flex: 1, minWidth: 0, minHeight: 40, padding: '0 0.7rem',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${errorMsg ? RED : 'rgba(255,255,255,0.25)'}`,
              borderRadius: 10, color: '#fff', fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 800,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button onClick={commit} disabled={status === 'saving'} title="Titel opslaan" style={knop(true)}>
            {status === 'saving'
              ? <Loader size={14} style={{ animation: 'ptbSpin 1s linear infinite' }} />
              : <Check size={14} strokeWidth={3} />}
          </button>
          <button onClick={cancel} title="Annuleren" style={knop(false)}><X size={15} /></button>
        </div>
      ) : (
        <button
          onClick={start}
          disabled={!canEdit}
          title={canEdit ? 'Tik om de titel van dit plan aan te passen' : 'Plan nog niet opgeslagen'}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: 'transparent', border: 'none', padding: 0,
            cursor: canEdit ? 'pointer' : 'default', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            flex: 1, minWidth: 0,
            color: '#fff', fontSize: m ? '1rem' : '1.1rem', fontWeight: 900,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {name || 'Naamloos plan'}
          </span>
          {canEdit && <Pencil size={13} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0, marginTop: 3 }} />}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <SaveState state={status === 'saved' ? 'saved' : weekSaveState} />
        {errorMsg && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: RED }}>{errorMsg}</span>
        )}
      </div>

      <style>{`@keyframes ptbSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const knop = (primary) => ({
  width: 40, height: 40, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: primary ? '#fff' : 'transparent',
  border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  color: primary ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
