// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanTitleBar.jsx
// Titel van het plan dat NU in de analyzer staat, direct bewerkbaar. De titel
// schrijft hard naar client_meal_plans.template_name van dít plan — niet naar
// de bibliotheek (die maakt een los sjabloon; zie PlanLibraryModal).
//
// Rechts staat de opslag-status van de week-wijzigingen (swaps/edits), zodat
// zichtbaar is dát er opgeslagen is en niet alleen in de console.

import { useEffect, useRef, useState } from 'react'
import { Pencil, Check, X, Loader, AlertTriangle } from 'lucide-react'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'

// Statuslabel voor de week-wijzigingen (niet voor de titel zelf).
function SaveState({ state, isMobile }) {
  if (state === 'idle') return null
  const cfg = {
    saving: { color: 'rgba(255,255,255,0.45)', label: 'Opslaan…', icon: <Loader size={11} style={{ animation: 'ptbSpin 1s linear infinite' }} /> },
    saved:  { color: GREEN, label: 'Opgeslagen', icon: <Check size={11} strokeWidth={3} /> },
    error:  { color: RED, label: 'Niet opgeslagen', icon: <AlertTriangle size={11} /> },
  }[state]
  if (!cfg) return null
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0,
      fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 800,
      color: cfg.color, letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

export default function PlanTitleBar({
  name, isActive, canEdit = true, onRename, weekSaveState = 'idle', isMobile,
}) {
  const m = isMobile
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name || '')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  // Titel kan buiten dit component wijzigen (ander plan geladen, rename via de
  // plan-switcher). Alleen overnemen als we niet midden in een edit zitten.
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: m ? '0.4rem 0.7rem' : '0.5rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(255,215,0,0.03)',
      minHeight: m ? 36 : 40,
    }}>
      <span style={{
        flexShrink: 0,
        fontSize: m ? '0.5rem' : '0.55rem', fontWeight: 800,
        color: isActive ? GREEN : 'rgba(255,255,255,0.35)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {isActive ? '✓ Actief plan' : 'Concept'}
      </span>

      {editing ? (
        <>
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
              flex: 1, minWidth: 0,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${errorMsg ? RED : 'rgba(255,215,0,0.35)'}`,
              borderRadius: 5, padding: '0.25rem 0.45rem',
              color: '#fff', fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 700,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button
            onClick={commit}
            disabled={status === 'saving'}
            title="Titel opslaan"
            style={iconBtn(true)}
          >
            {status === 'saving'
              ? <Loader size={13} style={{ animation: 'ptbSpin 1s linear infinite' }} />
              : <Check size={13} strokeWidth={3} />}
          </button>
          <button onClick={cancel} title="Annuleren" style={iconBtn(false)}><X size={13} /></button>
        </>
      ) : (
        <>
          <button
            onClick={start}
            disabled={!canEdit}
            title={canEdit ? 'Klik om de titel van dit plan aan te passen' : 'Plan nog niet opgeslagen'}
            style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'transparent', border: 'none', padding: 0,
              cursor: canEdit ? 'pointer' : 'default', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: '#fff', fontSize: m ? '0.8rem' : '0.88rem', fontWeight: 800,
              letterSpacing: '-0.01em',
            }}>
              {name || 'Naamloos plan'}
            </span>
            {canEdit && <Pencil size={11} color="rgba(255,215,0,0.55)" style={{ flexShrink: 0 }} />}
          </button>
          {status === 'saved'
            ? <SaveState state="saved" isMobile={m} />
            : <SaveState state={weekSaveState} isMobile={m} />}
        </>
      )}

      {errorMsg && (
        <span style={{ flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: RED }}>
          {errorMsg}
        </span>
      )}

      <style>{`@keyframes ptbSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const iconBtn = (primary) => ({
  width: 26, height: 26, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: primary ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
  border: `1px solid ${primary ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 5,
  color: primary ? GOLD : 'rgba(255,255,255,0.6)',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
