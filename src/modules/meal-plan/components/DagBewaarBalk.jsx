// src/modules/meal-plan/components/DagBewaarBalk.jsx
//
// Eén regel boven de maaltijden die zegt welke dag je voor je hebt.
//
// Komt de dag uit een bewaarde dag — van je coach of van jezelf — dan staat
// daar zijn naam. Wissel je één maaltijd, dan klopt dat niet meer en verschijnt
// de knop om deze dag te bewaren. Dat is geen vlaggetje in de database maar een
// vergelijking van de inhoud: welke maaltijd staat op welk slot. Zo kan er geen
// naam blijven staan bij een dag die allang iets anders is.

import { useState, useEffect, useCallback } from 'react'
import { Bookmark, Check, CalendarDays, X } from 'lucide-react'
import {
  getKlantDagTemplates, getEigenDagen, bewaarEigenDag, vindDag, BRON_KLANT,
} from '../DayTemplateService'

const LIJN = 'rgba(255,255,255,0.1)'

export default function DagBewaarBalk({ db, client, maaltijden, isMobile, onBewaard, verversSleutel = 0 }) {
  const [dagen, setDagen] = useState([])
  const [invoer, setInvoer] = useState(false)
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [net, setNet] = useState(false)

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id) return
    const [coach, eigen] = await Promise.all([
      getKlantDagTemplates(db.supabase, client.id),
      getEigenDagen(db.supabase, client.id),
    ])
    setDagen([...eigen, ...coach])
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad, verversSleutel])

  if (!maaltijden?.length) return null

  const herkend = vindDag(maaltijden, dagen)

  const bewaar = async () => {
    if (bezig) return
    setBezig(true)
    const res = await bewaarEigenDag(db.supabase, {
      clientId: client.id,
      naam: naam.trim() || 'Mijn dag',
      maaltijden,
    })
    setBezig(false)
    if (res?.error) { alert(res.error); return }
    setInvoer(false)
    setNaam('')
    setNet(true)
    setTimeout(() => setNet(false), 2200)
    await laad()
    onBewaard?.()
  }

  const rij = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.25rem',
    borderBottom: `1px solid ${LIJN}`,
  }

  // Deze dag heeft een naam: laten zien welke, en waar hij vandaan komt.
  if (herkend && !invoer) {
    const vanMij = herkend.bron === BRON_KLANT
    return (
      <div style={rij}>
        <CalendarDays size={16} color="rgba(255,255,255,0.5)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{
          flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800,
          color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {herkend.name || herkend.template_name}
        </span>
        <span style={{
          flexShrink: 0, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6,
          color: vanMij ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
          background: vanMij ? '#fff' : 'transparent',
          border: vanMij ? 'none' : `1px solid ${LIJN}`,
        }}>
          {vanMij ? 'Jouw dag' : 'Van je coach'}
        </span>
      </div>
    )
  }

  if (net) {
    return (
      <div style={{ ...rij, color: '#10b981' }}>
        <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800 }}>
          Dag bewaard — je vindt hem terug onder DAGEN
        </span>
      </div>
    )
  }

  // Naam typen.
  if (invoer) {
    return (
      <div style={{ ...rij, flexWrap: 'wrap' }}>
        <input
          value={naam}
          autoFocus
          onChange={e => setNaam(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') bewaar(); if (e.key === 'Escape') setInvoer(false) }}
          placeholder="Naam voor deze dag"
          style={{
            flex: 1, minWidth: 140, minHeight: 40, padding: '0 0.75rem',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
            borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={bewaar}
          disabled={bezig}
          style={{
            flexShrink: 0, minHeight: 40, padding: '0 1rem', borderRadius: 10, border: 'none',
            background: '#fff', color: '#0a0a0a', fontSize: '0.88rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {bezig ? 'Opslaan…' : 'Bewaren'}
        </button>
        <button
          onClick={() => { setInvoer(false); setNaam('') }}
          aria-label="Annuleren"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            background: 'transparent', border: `1px solid ${LIJN}`, color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={17} strokeWidth={2.8} />
        </button>
      </div>
    )
  }

  // Niets herkend: deze dag is nieuw, dus je kunt hem bewaren.
  return (
    <div style={rij}>
      <Bookmark size={16} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
        Deze dag staat nog niet bij je dagen
      </span>
      <button
        onClick={() => setInvoer(true)}
        style={{
          flexShrink: 0, minHeight: 36, padding: '0 0.85rem', borderRadius: 10,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        Dag bewaren
      </button>
    </div>
  )
}
