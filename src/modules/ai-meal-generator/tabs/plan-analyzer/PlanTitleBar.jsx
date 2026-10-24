// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanTitleBar.jsx
//
// Kopbalk van de Plan Analyzer: één regel. Links de klant (tik = andere
// klant), de titel van het plan (tik = hernoemen) en de status; in het
// midden wat de Analyzer meegeeft (de week-keuze); rechts ongedaan maken,
// Activeer (bij een concept) en een ⋯-menu met de acties die je zelden
// nodig hebt: wissel, nieuw, leegmaken, als template, PDF, verwijderen.
// De titel schrijft hard naar client_meal_plans.template_name van dít plan.
// Was tot 24 okt 2026 vier gecentreerde regels (~190 px hoog).

import { useEffect, useRef, useState } from 'react'
import { Check, Loader, AlertTriangle, RefreshCw, Plus, Trash2, Users, ChevronDown, Search, X, Save, Eraser, MoreHorizontal, RotateCcw, RotateCw, Download } from 'lucide-react'

const GREEN = '#22c55e'
const RED = '#ef4444'

function SaveState({ state, kort = false }) {
  const cfg = {
    idle:   { color: 'rgba(255,255,255,0.4)', label: 'Wijzigingen gaan direct in dit klantplan', icon: <Check size={11} strokeWidth={3} /> },
    saving: { color: 'rgba(255,255,255,0.4)', label: 'Opslaan…', icon: <Loader size={11} style={{ animation: 'ptbSpin 1s linear infinite' }} /> },
    saved:  { color: GREEN, label: 'Opgeslagen', icon: <Check size={11} strokeWidth={3} /> },
    error:  { color: RED, label: 'Laatste wijziging niet opgeslagen', icon: <AlertTriangle size={11} /> },
  }[state] || null
  if (!cfg) return null
  if (kort) return <span title={cfg.label} style={{ display: 'inline-flex', alignItems: 'center', color: cfg.color, flexShrink: 0 }}>{cfg.icon}{state === 'error' && <span style={{ marginLeft: 4, fontSize: '0.7rem', fontWeight: 800 }}>niet opgeslagen</span>}</span>
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.icon}{cfg.label}</span>
}

export default function PlanTitleBar({
  name, isActive, clientName = '', templateName = null,
  canEdit = true, onRename, weekSaveState = 'idle', isMobile,
  clients = [], selectedClient = null, onSelectClient = null,
  onSwitch = null, onNew = null, onDelete = null, onClear = null, onSaveTemplate = null,
  heeftPlan = true,
  // Eén-regel-kop: midden (week-keuze), ongedaan maken, PDF, activeren.
  midden = null,
  onUndo = null, onRedo = null, canUndo = false, canRedo = false,
  onPdf = null, pdfBezig = false,
  onActivate = null, activating = false,
}) {
  const m = isMobile
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name || '')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [kiezer, setKiezer] = useState(false)
  const [menu, setMenu] = useState(false)
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

  const gefilterd = clients.filter(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(zoek.toLowerCase()))

  const ikoon = (uit) => ({
    width: 32, height: 32, flexShrink: 0, borderRadius: 9, background: 'transparent', border: 'none',
    color: uit ? 'rgba(255,255,255,0.22)' : '#fff', cursor: uit ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const menuRij = (kleur) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '0 0.75rem',
    background: 'transparent', border: 'none', borderRadius: 8, color: kleur || '#fff', fontSize: '0.85rem', fontWeight: 800,
    fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
  })
  const menuItems = [
    onSwitch && { t: 'Ander plan openen', i: <RefreshCw size={15} />, f: onSwitch },
    onNew && { t: 'Nieuw leeg plan', i: <Plus size={15} />, f: onNew },
    onSaveTemplate && heeftPlan && { t: 'Opslaan als template', i: <Save size={15} />, f: onSaveTemplate },
    onPdf && heeftPlan && { t: pdfBezig ? 'PDF maken…' : 'PDF downloaden', i: pdfBezig ? <Loader size={15} style={{ animation: 'ptbSpin 1s linear infinite' }} /> : <Download size={15} />, f: onPdf },
    onClear && heeftPlan && { t: 'Week leegmaken', i: <Eraser size={15} />, f: onClear, kleur: RED },
    onDelete && heeftPlan && { t: 'Plan verwijderen', i: <Trash2 size={15} />, f: onDelete, kleur: RED },
  ].filter(Boolean)

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a' }}>
     <div style={{
      maxWidth: 1200, margin: '0 auto', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: m ? 6 : 10, flexWrap: m ? 'wrap' : 'nowrap',
      padding: m ? '0.5rem 0.6rem' : '0.55rem 1rem', minHeight: 56,
     }}>
      {/* Klant: tik = andere klant kiezen. */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => onSelectClient && setKiezer(v => !v)} style={{ background: 'none', border: 'none', padding: '4px 6px', borderRadius: 8, fontFamily: 'inherit', cursor: onSelectClient ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap' }}>
          <Users size={14} /> {(selectedClient?.first_name || clientName || 'Kies een klant')} {onSelectClient && <ChevronDown size={13} strokeWidth={2.8} />}
        </button>
        {kiezer && (
          <>
            <div onClick={() => setKiezer(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', width: 280, maxHeight: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
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

      {/* Titel (tik = hernoemen) + status. */}
      <div style={{ flex: m ? '1 1 0' : '0 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {editing ? (
          <input ref={inputRef} value={value} autoFocus onChange={e => { setValue(e.target.value); setErrorMsg('') }} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }} disabled={status === 'saving'}
            style={{ minWidth: 0, width: m ? '100%' : 340, fontSize: '1.02rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', background: 'rgba(255,255,255,0.06)', border: `1px solid ${errorMsg ? RED : 'rgba(255,255,255,0.25)'}`, borderRadius: 8, padding: '0.2rem 0.5rem', outline: 'none', fontFamily: 'inherit' }} />
        ) : (
          <button onClick={start} disabled={!canEdit} title={canEdit ? `${name || ''} · klik om de naam aan te passen` : 'Plan nog niet opgeslagen'}
            style={{ minWidth: 0, background: 'none', border: 'none', padding: '0.15rem 0.2rem', borderRadius: 8, fontFamily: 'inherit', cursor: canEdit ? 'text' : 'default', fontSize: '1.02rem', fontWeight: 900, letterSpacing: '-0.02em', color: heeftPlan ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {heeftPlan ? (name || 'Naamloos plan') : 'Nog geen plan'}
          </button>
        )}
        {heeftPlan && (
          <span title={isActive ? 'Actief: de klant ziet dit plan' : 'Concept: alleen jij ziet dit'} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 900, color: isActive ? GREEN : 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? GREEN : 'rgba(255,255,255,0.35)' }} />
            {isActive ? 'Actief' : 'Concept'}
          </span>
        )}
        {heeftPlan && <SaveState kort state={status === 'saved' ? 'saved' : weekSaveState} />}
        {errorMsg && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: RED, whiteSpace: 'nowrap' }}>{errorMsg}</span>}
      </div>

      {!m && <span style={{ flex: 1 }} />}
      {midden && <div style={{ flexShrink: 1, minWidth: 0, order: m ? 10 : 0, width: m ? '100%' : 'auto' }}>{midden}</div>}

      {/* Rechts: ongedaan maken, activeren, menu. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {onUndo && <button onClick={onUndo} disabled={!canUndo} title="Ongedaan maken" aria-label="Ongedaan maken" style={ikoon(!canUndo)}><RotateCcw size={16} strokeWidth={2.4} /></button>}
        {onRedo && <button onClick={onRedo} disabled={!canRedo} title="Opnieuw" aria-label="Opnieuw" style={ikoon(!canRedo)}><RotateCw size={16} strokeWidth={2.4} /></button>}
        {onActivate && heeftPlan && !isActive && (
          <button onClick={onActivate} disabled={activating} style={{ height: 34, padding: '0 0.85rem', marginLeft: 4, borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: activating ? 0.6 : 1 }}>
            {activating ? <Loader size={14} style={{ animation: 'ptbSpin 1s linear infinite' }} /> : <Check size={14} strokeWidth={3} />} Activeer
          </button>
        )}
        {menuItems.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(v => !v)} title="Meer" aria-label="Meer" aria-expanded={menu} style={{ ...ikoon(false), background: menu ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
              <MoreHorizontal size={18} strokeWidth={2.6} />
            </button>
            {menu && (
              <>
                <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, width: 230, background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 4, boxShadow: '0 12px 36px rgba(0,0,0,0.6)' }}>
                  {menuItems.map(it => (
                    <button key={it.t} onClick={() => { setMenu(false); it.f() }} style={menuRij(it.kleur)}>
                      {it.i} {it.t}
                    </button>
                  ))}
                  {templateName && (
                    <div style={{ padding: '0.45rem 0.75rem 0.3rem', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4 }}>uit sjabloon {templateName}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
     </div>
      <style>{'@keyframes ptbSpin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
