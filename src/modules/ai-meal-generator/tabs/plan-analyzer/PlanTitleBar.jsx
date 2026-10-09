// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanTitleBar.jsx
//
// Kopbalk van de Plan Analyzer, dezelfde opzet als de Workout Builder:
// centraal de klant (tik = andere klant), daaronder de titel van het plan
// (tik = hernoemen) met wissel, plus (nieuw plan) en prullenbak (dit plan
// weg bij deze klant), en daaronder Leegmaken en Opslaan als template.
// De titel schrijft hard naar client_meal_plans.template_name van dít plan;
// de bibliotheek maakt een los sjabloon (PlanLibraryModal). Herbouwd 9 okt
// 2026 (was: linksboven een tekstblok met status).

import { useEffect, useRef, useState } from 'react'
import { Check, Loader, AlertTriangle, RefreshCw, Plus, Trash2, Users, ChevronDown, Search, X, Save, Eraser } from 'lucide-react'

const GREEN = '#22c55e'
const RED = '#ef4444'

function SaveState({ state }) {
  const cfg = {
    idle:   { color: 'rgba(255,255,255,0.4)', label: 'Wijzigingen gaan direct in dit klantplan', icon: <Check size={11} strokeWidth={3} /> },
    saving: { color: 'rgba(255,255,255,0.4)', label: 'Opslaan…', icon: <Loader size={11} style={{ animation: 'ptbSpin 1s linear infinite' }} /> },
    saved:  { color: GREEN, label: 'Opgeslagen', icon: <Check size={11} strokeWidth={3} /> },
    error:  { color: RED, label: 'Laatste wijziging niet opgeslagen', icon: <AlertTriangle size={11} /> },
  }[state] || null
  if (!cfg) return null
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.icon}{cfg.label}</span>
}

export default function PlanTitleBar({
  name, isActive, clientName = '', templateName = null,
  canEdit = true, onRename, weekSaveState = 'idle', isMobile,
  clients = [], selectedClient = null, onSelectClient = null,
  onSwitch = null, onNew = null, onDelete = null, onClear = null, onSaveTemplate = null,
  heeftPlan = true,
}) {
  const m = isMobile
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name || '')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [kiezer, setKiezer] = useState(false)
  const [zoek, setZoek] = useState('')
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
    try { await onRename(next); setStatus('saved'); setEditing(false) }
    catch (e) { setStatus('error'); setErrorMsg(e?.message || 'Opslaan mislukt') }
  }

  const volledigeNaam = selectedClient ? `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() : clientName
  const gefilterd = clients.filter(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(zoek.toLowerCase()))

  const knopRond = (extra = {}) => ({
    width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...extra,
  })
  const knopBreed = (vol) => ({
    minHeight: 36, padding: '0 0.9rem', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff', border: vol ? 'none' : '1px solid rgba(255,255,255,0.25)',
    fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', whiteSpace: 'nowrap', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: m ? '1.1rem 0.75rem 0.7rem' : '1.4rem 1rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
      {/* Klant: tik = andere klant kiezen. */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => onSelectClient && setKiezer(v => !v)} style={{ background: 'none', border: 'none', padding: '2px 6px', fontFamily: 'inherit', cursor: onSelectClient ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <Users size={12} /> {volledigeNaam || 'Kies een klant'} {onSelectClient && <ChevronDown size={12} strokeWidth={2.8} />}
        </button>
        {kiezer && (
          <>
            <div onClick={() => setKiezer(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', width: 280, maxHeight: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <div style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={12} color="rgba(255,255,255,0.4)" />
                <input autoFocus value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek klant…" style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, flex: 1, fontFamily: 'inherit' }} />
                {zoek && <button onClick={() => setZoek('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.4)' }}><X size={12} /></button>}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {gefilterd.length === 0 && <div style={{ padding: '0.6rem 0.85rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Geen klanten gevonden</div>}
                {gefilterd.map((c, i) => (
                  <button key={c.id} onClick={() => { setKiezer(false); setZoek(''); onSelectClient(c) }}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', borderBottom: i < gefilterd.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: '#fff', fontSize: '0.85rem', fontWeight: selectedClient?.id === c.id ? 900 : 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', touchAction: 'manipulation' }}>
                    {c.first_name} {c.last_name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Titel + wissel / nieuw / verwijder. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, maxWidth: '100%' }}>
        {editing ? (
          <input ref={inputRef} value={value} autoFocus onChange={e => { setValue(e.target.value); setErrorMsg('') }} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }} disabled={status === 'saving'}
            style={{ minWidth: 0, width: m ? 220 : 320, fontSize: m ? '1.25rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', background: 'rgba(255,255,255,0.06)', border: `1px solid ${errorMsg ? RED : 'rgba(255,255,255,0.25)'}`, borderRadius: 8, padding: '0.1rem 0.5rem', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
        ) : (
          <button onClick={start} disabled={!canEdit} title={canEdit ? 'Klik om de naam aan te passen' : 'Plan nog niet opgeslagen'}
            style={{ minWidth: 0, background: 'none', border: 'none', padding: '0.1rem 0.5rem', borderRadius: 8, fontFamily: 'inherit', cursor: canEdit ? 'text' : 'default', fontSize: m ? '1.25rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: heeftPlan ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {heeftPlan ? (name || 'Naamloos plan') : 'Nog geen plan'}
          </button>
        )}
        {onSwitch && <button onClick={onSwitch} title="Wissel van plan" aria-label="Wissel van plan" style={knopRond()}><RefreshCw size={15} strokeWidth={2.6} /></button>}
        {onNew && <button onClick={onNew} title="Nieuw leeg plan voor deze klant" aria-label="Nieuw plan" style={knopRond()}><Plus size={16} strokeWidth={2.8} /></button>}
        {onDelete && <button onClick={onDelete} disabled={!heeftPlan} title="Dit plan verwijderen bij deze klant" aria-label="Plan verwijderen" style={knopRond({ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: heeftPlan ? 'pointer' : 'not-allowed', opacity: heeftPlan ? 1 : 0.4 })}><Trash2 size={15} strokeWidth={2.6} /></button>}
      </div>

      {/* Leegmaken en opslaan als template. */}
      {(onClear || onSaveTemplate) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {onClear && <button onClick={onClear} disabled={!heeftPlan} style={{ ...knopBreed(false), color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: heeftPlan ? 1 : 0.45 }}><Eraser size={14} strokeWidth={2.6} /> Leegmaken</button>}
          {onSaveTemplate && <button onClick={onSaveTemplate} disabled={!heeftPlan} style={{ ...knopBreed(false), opacity: heeftPlan ? 1 : 0.45 }}><Save size={14} strokeWidth={2.6} /> Opslaan als template</button>}
        </div>
      )}

      {/* Status: actief/concept, uit sjabloon, opslag. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        {heeftPlan && (
          <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: isActive ? GREEN : 'rgba(255,255,255,0.45)' }}>
            {isActive ? 'Actief · klant ziet dit' : 'Concept · alleen jij ziet dit'}
          </span>
        )}
        {templateName && <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>uit sjabloon {templateName}</span>}
        {heeftPlan && <SaveState state={status === 'saved' ? 'saved' : weekSaveState} />}
        {errorMsg && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: RED }}>{errorMsg}</span>}
      </div>
      <style>{'@keyframes ptbSpin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
