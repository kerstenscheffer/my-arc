// src/modules/business-os/Notities.jsx
//
// Blad 'Notities' (puntjes-menu): lijst, nieuwste eerst. Klik opent de tekst met
// dezelfde opmaak als in de chat; daar aanpassen, kopiëren en verwijderen.
// Stand komt uit useNotities (notitiesData.js).

import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { OpmaakTekst } from './BusinessChat'
import { notitieDatum, notitieTitel } from './notitiesData'

const KNOP = {
  minHeight: 44, padding: '0 12px', background: 'none', border: 'none', fontFamily: 'inherit',
  color: colors.textPrimary, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
}
const VELD = {
  width: '100%', boxSizing: 'border-box', background: 'transparent', color: colors.textPrimary, fontFamily: 'inherit',
  border: `1px solid ${colors.borderSubtle}`, borderRadius: 12, padding: 12, fontSize: '1rem', outline: 'none',
}

function Bewerken({ notitie, onOpslaan, onAnnuleer }) {
  const [titel, setTitel] = useState(notitieTitel(notitie))
  const [tekst, setTekst] = useState(notitie.tekst)
  const [staat, setStaat] = useState(null) // 'bezig' | 'fout'
  const veld = useRef(null)
  useLayoutEffect(() => {
    const el = veld.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [tekst])
  const opslaan = async () => {
    setStaat('bezig')
    // Titel gelijk aan de eerste regel? Dan niet vastleggen, zodat hij met de tekst meeloopt.
    const eigen = titel.trim() && titel.trim() !== notitieTitel({ tekst }) ? titel.trim() : null
    const ok = await onOpslaan({ titel: eigen, tekst })
    if (!ok) setStaat('fout')
  }
  const kan = tekst.trim() && staat !== 'bezig'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={titel} onChange={e => setTitel(e.target.value)} placeholder="Titel" aria-label="Titel" maxLength={120}
        style={{ ...VELD, fontWeight: 800 }} />
      <textarea ref={veld} value={tekst} onChange={e => setTekst(e.target.value)} aria-label="Tekst" rows={8}
        style={{ ...VELD, resize: 'none', overflow: 'hidden', lineHeight: 1.5, fontWeight: 500 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={opslaan} disabled={!kan} style={{
          ...KNOP, background: colors.textPrimary, color: '#000', borderRadius: 12, padding: '0 16px', opacity: kan ? 1 : 0.4,
        }}>
          {staat === 'bezig' ? 'Bezig…' : 'Opslaan'}
        </button>
        <button type="button" onClick={onAnnuleer} style={KNOP}>Annuleer</button>
        {staat === 'fout' && <span style={{ color: colors.danger, fontSize: '0.85rem', fontWeight: 800 }}>Opslaan mislukt</span>}
      </div>
    </div>
  )
}

function Lezen({ notitie, onWijzig, onVerwijder, onTerug }) {
  const [bewerken, setBewerken] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [fout, setFout] = useState(null)
  const kopieer = () => navigator.clipboard?.writeText(notitie.tekst).then(() => {
    setGekopieerd(true); setFout(null); setTimeout(() => setGekopieerd(false), 1500)
  }, () => setFout('Kopiëren mislukt'))
  const verwijder = async () => {
    if (!window.confirm(`'${notitieTitel(notitie)}' verwijderen?`)) return
    if (!await onVerwijder(notitie)) setFout('Verwijderen mislukt')
  }
  return (
    <>
      <button type="button" onClick={onTerug} style={{ ...KNOP, display: 'inline-flex', gap: 8, alignItems: 'center', padding: 0, marginTop: -8 }}>
        <ArrowLeft size={16} strokeWidth={2.6} /> Notities
      </button>
      {bewerken ? (
        <Bewerken notitie={notitie} onAnnuleer={() => setBewerken(false)} onOpslaan={async (velden) => {
          const ok = await onWijzig(notitie, velden)
          if (ok) setBewerken(false)
          return ok
        }} />
      ) : (
        <>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: colors.textPrimary, marginTop: 8, wordBreak: 'break-word' }}>{notitieTitel(notitie)}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, margin: '4px 0 16px' }}>{notitieDatum(notitie.created_at)}</div>
          <OpmaakTekst tekst={notitie.tekst} sleutel={notitie.id} />
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: 16, marginLeft: -12 }}>
            <button type="button" onClick={() => { setFout(null); setBewerken(true) }} style={KNOP}>Aanpassen</button>
            <button type="button" onClick={kopieer} style={{ ...KNOP, color: gekopieerd ? colors.success : colors.textPrimary }}>{gekopieerd ? 'Gekopieerd' : 'Kopiëren'}</button>
            <button type="button" onClick={verwijder} style={{ ...KNOP, color: colors.danger, marginLeft: 'auto' }}>Verwijderen</button>
          </div>
          {fout && <div style={{ color: colors.danger, fontSize: '0.85rem', fontWeight: 800 }}>{fout}</div>}
        </>
      )}
    </>
  )
}

export default function Notities({ lijst, geladen, wijzig, verwijder }) {
  const [openId, setOpenId] = useState(null)
  const open = lijst.find(n => n.id === openId)
  if (open) return <Lezen key={open.id} notitie={open} onWijzig={wijzig} onVerwijder={verwijder} onTerug={() => setOpenId(null)} />
  if (!geladen) return <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Laden…</div>
  if (!lijst.length) return (
    <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.45 }}>
      Nog geen notities. Tik op Vastzetten onder een antwoord van Gino.
    </div>
  )
  return lijst.map(n => (
    <button key={n.id} type="button" onClick={() => setOpenId(n.id)} style={{
      display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer',
      borderBottom: `1px solid ${colors.borderSubtle}`, fontFamily: 'inherit',
    }}>
      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: colors.textPrimary, wordBreak: 'break-word' }}>{notitieTitel(n)}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, marginTop: 4 }}>{notitieDatum(n.created_at)}</div>
    </button>
  ))
}
