// src/modules/business-os/schermen.jsx
//
// Bewaarde schermen (30 okt 2026): goede visuelen van Gino bewaren ('Bewaar'
// onder een visueel en rond de bol) en terughalen via puntjes-menu → Mijn
// schermen. Terughalen = 'Laat <naam> zien' naar Gino, zodat hij het opnieuw
// maakt met verse data; het bewaarde visueel staat intussen als 'vorige versie'.
// Tabel business_os_schermen via schermenData.js (RLS coach + team).

import { useEffect, useState } from 'react'
import { Bookmark, Check, Trash2 } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { bewaarScherm } from './schermenData'

// Kleine knop 'Bewaar' → invoer voor de naam (voorgesteld: titel van het visueel).
export function BewaarKnop({ visueel, vraag, onKlaar }) {
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [staat, setStaat] = useState(null) // 'bezig' | 'ok' | 'fout'
  useEffect(() => { setOpen(false); setStaat(null) }, [visueel])
  const openen = () => { setNaam(typeof visueel?.titel === 'string' ? visueel.titel.slice(0, 80) : ''); setStaat(null); setOpen(true) }
  const opslaan = async () => {
    if (!naam.trim() || staat === 'bezig') return
    setStaat('bezig')
    const ok = await bewaarScherm({ naam: naam.trim(), vraag, visueel })
    setStaat(ok ? 'ok' : 'fout')
    if (ok) { setOpen(false); onKlaar?.() }
  }
  const knop = {
    display: 'inline-flex', gap: 5, alignItems: 'center', background: 'transparent', border: 'none', padding: 0,
    color: staat === 'ok' ? colors.success : colors.textSecondary, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
  }
  if (!open) return (
    <button type="button" onClick={staat === 'ok' ? undefined : openen} title="Bewaar dit scherm" style={knop}>
      {staat === 'ok' ? <Check size={13} strokeWidth={2.6} /> : <Bookmark size={13} strokeWidth={2.4} />}
      {staat === 'ok' ? 'Bewaard' : 'Bewaar'}
    </button>
  )
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', maxWidth: '100%' }}>
      <input autoFocus value={naam} onChange={e => setNaam(e.target.value)} placeholder="Naam van dit scherm"
        onKeyDown={e => { if (e.key === 'Enter') opslaan(); if (e.key === 'Escape') setOpen(false) }}
        style={{
          minWidth: 0, width: 180, background: 'transparent', border: 'none', borderBottom: `1px solid ${colors.borderSubtle}`,
          color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, padding: '4px 0', outline: 'none',
        }} />
      <button type="button" onClick={opslaan} disabled={!naam.trim() || staat === 'bezig'} style={{ ...knop, color: colors.success }}>
        {staat === 'bezig' ? '…' : 'Opslaan'}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={knop}>Annuleer</button>
      {staat === 'fout' && <span style={{ color: colors.danger, fontSize: '0.75rem', fontWeight: 800 }}>Mislukt</span>}
    </span>
  )
}

// Inhoud van het blad 'Mijn schermen'.
export function SchermenLijst({ lijst, geladen, onKies, onVerwijder }) {
  if (!geladen) return <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Laden…</div>
  if (!lijst.length) return (
    <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.45 }}>
      Nog geen schermen. Tik op 'Bewaar' onder een visueel van Gino.
    </div>
  )
  return lijst.map(s => (
    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button type="button" onClick={() => onKies(s)} style={{
        flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer',
        fontFamily: 'inherit', color: colors.textPrimary,
      }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>{s.naam}</div>
        {s.omschrijving && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: colors.textSecondary, lineHeight: 1.35, marginTop: 2 }}>{s.omschrijving}</div>}
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted, marginTop: 4 }}>
          bewaard {new Date(s.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
        </div>
      </button>
      <button type="button" title="Verwijderen" onClick={() => { if (window.confirm(`'${s.naam}' verwijderen?`)) onVerwijder(s) }} style={{
        width: 36, height: 36, flexShrink: 0, background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}>
        <Trash2 size={15} />
      </button>
    </div>
  ))
}
