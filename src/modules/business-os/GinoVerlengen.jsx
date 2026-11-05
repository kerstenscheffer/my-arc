// src/modules/business-os/GinoVerlengen.jsx
//
// Overzicht Verlengen op het Klanten-tabje, onder de Check-in ronde: per lopende
// klant waar het traject staat en wat er moet gebeuren. Alleen lezen, er wordt
// niets gewijzigd en er gaat niets naar klanten. Rekenwerk: verlengenData.js.

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { haalVerlengen, STATUS_LABEL, EINDCALL_NODIG } from './verlengenData'

const FILTERS = [
  { id: 'actie', label: 'Actie nodig', past: r => r.actie && r.actie !== 'Klaar' },
  { id: 'challenge', label: 'Challenge', past: r => r.soort === 'challenge' },
  { id: 'coaching', label: 'Coaching', past: r => r.soort === 'coaching' },
  { id: 'alles', label: 'Alles', past: () => true },
]

const SOORT = { challenge: 'Challenge', coaching: 'Coaching' }
const KOLOMMEN = ['Klant', 'Traject', 'Start', 'Einde', 'Dagen', 'Doorstap', 'Open', 'Volgende call', 'Actie']
const RASTER = 'minmax(140px, 1.5fr) 92px 66px 66px 72px 100px 56px 118px minmax(116px, 1fr)'

const datum = (iso) => {
  const d = new Date(`${iso}T12:00:00`)
  const eigenJaar = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', ...(eigenJaar ? {} : { year: '2-digit' }) })
}
const dagenTekst = (n) => (n === 0 ? 'vandaag' : n < 0 ? `${-n} d voorbij` : `${n} d`)
const callMoment = (iso) => {
  const d = new Date(iso)
  const dag = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
  const tijd = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
  return `${dag} ${tijd}`
}
const euro = (n) => `€${Math.round(n).toLocaleString('nl-NL')}`
const soortTekst = (r) => `${SOORT[r.soort]}${r.gepauzeerd ? ' · pauze' : ''}`
const statusTekst = (s) => STATUS_LABEL[s] || 'Geen status'
const actieKleur = (a) => (a === 'Verlopen' ? colors.danger : a === 'Klaar' ? colors.textSecondary : colors.success)

const SUB = { fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary }
const NAAM = { fontSize: '0.85rem', fontWeight: 800, color: colors.textPrimary }
const ACTIE = { fontSize: '0.8rem', fontWeight: 900 }
const NAAM_CHECKEN = {
  display: 'inline-block', padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap',
  border: '1px solid rgba(255,255,255,0.35)', color: colors.textPrimary, fontSize: '0.66rem', fontWeight: 800,
}

// Label in de rij: Eindcall nodig als gevuld groen vlak, de rest als kale tekst.
function ActieLabel({ actie }) {
  if (actie === EINDCALL_NODIG) {
    return (
      <span style={{
        ...ACTIE, display: 'inline-block', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap',
        background: colors.success, color: '#000',
      }}>{actie}</span>
    )
  }
  return <span style={{ ...ACTIE, color: actieKleur(actie) }}>{actie || ''}</span>
}

function VolgendeCall({ r, voorvoegsel = '' }) {
  if (!r.volgendeCall) return <span style={{ ...SUB, color: colors.textMuted }}>{voorvoegsel ? 'Geen call gepland' : '–'}</span>
  const moment = callMoment(r.volgendeCall.start)
  return (
    <span title={r.volgendeCall.titel || undefined} style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px' }}>
      <span style={{ ...SUB, color: r.naamChecken ? colors.textSecondary : colors.textPrimary, whiteSpace: 'nowrap' }}>{voorvoegsel}{moment}</span>
      {r.naamChecken && <span style={NAAM_CHECKEN}>Naam checken</span>}
    </span>
  )
}

function Regel({ r, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ padding: '10px 0', borderTop: `1px solid ${colors.borderSubtle}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ ...NAAM, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</span>
          {r.actie && <span style={{ flexShrink: 0 }}><ActieLabel actie={r.actie} /></span>}
        </div>
        <div style={{ ...SUB, marginTop: 4, lineHeight: 1.45 }}>
          {soortTekst(r)} · {datum(r.start)} → {datum(r.eind)} · {dagenTekst(r.dagen)}
        </div>
        <div style={{ ...SUB, marginTop: 2, lineHeight: 1.45 }}>
          {statusTekst(r.status)}
          {r.openBetaling > 0 && <span style={{ color: colors.textPrimary, fontWeight: 800 }}> · {euro(r.openBetaling)} open</span>}
        </div>
        <div style={{ marginTop: 3 }}><VolgendeCall r={r} voorvoegsel="Call: " /></div>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: RASTER, gap: 8, alignItems: 'center', minHeight: 40, borderTop: `1px solid ${colors.borderSubtle}` }}>
      <span style={{ ...NAAM, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</span>
      <span style={SUB}>{soortTekst(r)}</span>
      <span style={SUB}>{datum(r.start)}</span>
      <span style={{ ...SUB, color: colors.textPrimary }}>{datum(r.eind)}</span>
      <span style={SUB}>{dagenTekst(r.dagen)}</span>
      <span style={SUB}>{statusTekst(r.status)}</span>
      <span style={{ ...SUB, color: r.openBetaling > 0 ? colors.textPrimary : colors.textMuted, fontWeight: 800 }}>
        {r.openBetaling > 0 ? euro(r.openBetaling) : '–'}
      </span>
      <VolgendeCall r={r} />
      <span><ActieLabel actie={r.actie} /></span>
    </div>
  )
}

export default function GinoVerlengen({ isMobile = false }) {
  // Dicht bij het openen: hetzelfde staat al in de lijst bovenaan. Klik om uit te klappen.
  const [open, setOpen] = useState(false)
  const [rijen, setRijen] = useState(null)
  const [fout, setFout] = useState(null)
  const [filter, setFilter] = useState('actie')

  useEffect(() => {
    let weg = false
    haalVerlengen(supabase)
      .then(l => { if (!weg) { setRijen(l); setFout(null) } })
      .catch(e => { if (!weg) { setRijen([]); setFout(`Verlengen laden mislukt: ${e.message || 'onbekende fout'}`) } })
    return () => { weg = true }
  }, [])

  const actieve = FILTERS.find(f => f.id === filter) || FILTERS[0]
  const gefilterd = (rijen || []).filter(actieve.past)
  // Actie nodig: Eindcall nodig bovenaan, verder de volgorde op einddatum.
  const lijst = filter === 'actie'
    ? [...gefilterd.filter(r => r.actie === EINDCALL_NODIG), ...gefilterd.filter(r => r.actie !== EINDCALL_NODIG)]
    : gefilterd

  return (
    <div style={{ marginTop: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: 'inherit', color: colors.textPrimary, fontSize: '0.95rem', fontWeight: 900,
        }}>
          {open ? <ChevronDown size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
          Verlengen
        </button>
        {rijen && !fout && <span style={{ ...SUB, fontWeight: 800 }}>{lijst.length}</span>}
        <span style={{ flex: 1 }} />
        <select aria-label="Filter verlengen" value={filter} onChange={e => setFilter(e.target.value)} style={{
          minHeight: 32, padding: '0 8px', borderRadius: 8, background: colors.bg, color: colors.textPrimary,
          border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'inherit',
        }}>
          {FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {open && (
        <div style={{ overflowX: isMobile ? 'visible' : 'auto' }}>
          {fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.danger }}>{fout}</div>}
          {!rijen && <div style={SUB}>Laden…</div>}
          {rijen && !fout && lijst.length === 0 && <div style={SUB}>Niemand in deze lijst.</div>}
          {!isMobile && lijst.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: RASTER, gap: 8, paddingBottom: 6 }}>
              {KOLOMMEN.map(k => (
                <span key={k} style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textMuted }}>{k}</span>
              ))}
            </div>
          )}
          {lijst.map(r => <Regel key={r.id} r={r} isMobile={isMobile} />)}
        </div>
      )}
    </div>
  )
}
