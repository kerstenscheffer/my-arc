// src/modules/business-os/CallBlad.jsx
//
// Gino's voorbereiding van een check-in call (skill Call-voorbereiding,
// checkin_ronde_items.suggesties.call), in de volgorde van de call. Gedeeld
// door de popup in het Klanten-paneel en het Logboek in Coach Inzicht.
// Alles als pijltjes-regels ("Label: waarde"), geen vakjes. Oudere rondes met
// losse zinnen blijven leesbaar.

import { useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Zap } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { BLOKKEN, heeft } from './callBladData'

// Afwerken (6 nov 2026): tik op een regel en hij verdwijnt naar "Afgewerkt"
// bovenaan. Daar tik je hem terug. Per call bewaard in localStorage (sleutel).
const OPSLAG = 'myarc.callblad.'
const leesAf = (sleutel) => { try { return new Set(JSON.parse(localStorage.getItem(OPSLAG + sleutel)) || []) } catch { return new Set() } }
const bewaarAf = (sleutel, set) => { try { localStorage.setItem(OPSLAG + sleutel, JSON.stringify([...set])) } catch { /* geen opslag */ } }

// Volgorde van de blokken: sleep een kop naar een andere plek. Geldt voor alle
// calls (Kerstens voorkeur), bewaard in localStorage.
const VOLGORDE_KEY = 'myarc.callblad.volgorde'
const STANDAARD_VOLGORDE = ['hoe', 'status', 'doel', 'gewicht', 'voeding', 'training', 'goed', 'sinds', 'struggles', 'open', 'randzaken', 'vragen', 'komende_week', 'afsluiten']
const leesVolgorde = () => { try { const v = JSON.parse(localStorage.getItem(VOLGORDE_KEY)); return Array.isArray(v) ? v : STANDAARD_VOLGORDE } catch { return STANDAARD_VOLGORDE } }

// Pre-call check: alleen wat je vóór de call leest. Gino zet die regels in
// call.precall; oudere voorbereidingen vallen terug op status + conclusies.
const KERN = /^(Conclusie|Suggestie|Oorzaak|Status|Zo help je):/i

const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 2 }
const REGEL = { fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.45 }
const KLEUR = { aandacht: colors.danger, vervolg: '#f59e0b', goed: colors.success }

// Eén regel in Gino's stijl: groen pijltje, "Label:" vet, daarna de tekst.
function Regel({ tekst, onKlik, gedimd = false }) {
  const m = String(tekst).match(/^([^:]{1,40}):\s+([\s\S]+)$/)
  return (
    <div onClick={onKlik} role={onKlik ? 'button' : undefined} style={{
      display: 'flex', gap: 8, marginTop: 4, ...REGEL, cursor: onKlik ? 'pointer' : 'default',
      opacity: gedimd ? 0.45 : 1, userSelect: 'none', WebkitTapHighlightColor: 'transparent',
    }}>
      <span style={{ color: colors.success, fontWeight: 900, flexShrink: 0 }}>→</span>
      <span>{m ? <><b style={{ fontWeight: 900 }}>{m[1]}:</b> {m[2]}</> : tekst}</span>
    </div>
  )
}

const regels = (v) => (Array.isArray(v) ? v : heeft(v) ? [v] : [])

// status: { groep, reden, actie } uit dezelfde ronde (optioneel).
// sleutel: per call uniek (klant + rondedatum); zonder sleutel geen afwerken.
// precall: van buiten bestuurd (Logboek zet de knop in zijn eigen kopregel);
// zonder prop toont het blad zelf een klein schakeltje.
export function PrecallKnop({ aan, onKlik }) {
  return (
    <button type="button" onClick={onKlik} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', padding: 0,
      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900,
      color: aan ? colors.success : colors.textPrimary,
    }}>
      <Zap size={13} strokeWidth={2.5} />Pre-call
    </button>
  )
}

export default function CallBlad({ call, status = null, sleutel = null, precall: precallProp }) {
  const c = call || {}
  const [af, setAf] = useState(() => (sleutel ? leesAf(sleutel) : new Set()))
  const [afOpen, setAfOpen] = useState(false)
  const [volgorde, setVolgorde] = useState(leesVolgorde)
  const [sleept, setSleept] = useState(null)
  const [precallEigen, setPrecall] = useState(false)
  const bestuurd = typeof precallProp === 'boolean'
  const precall = bestuurd ? precallProp : precallEigen
  const verplaats = (van, naar) => {
    if (!van || van === naar) return
    setVolgorde(oud => {
      const basis = [...oud, ...STANDAARD_VOLGORDE.filter(id => !oud.includes(id))].filter(id => id !== van)
      const i = basis.indexOf(naar)
      basis.splice(i < 0 ? basis.length : i, 0, van)
      try { localStorage.setItem(VOLGORDE_KEY, JSON.stringify(basis)) } catch { /* geen opslag */ }
      return basis
    })
  }
  const wissel = (id) => {
    if (!sleutel) return
    setAf(oud => {
      const n = new Set(oud)
      if (n.has(id)) n.delete(id); else n.add(id)
      bewaarAf(sleutel, n)
      return n
    })
  }
  const statusRegels = status ? [status.reden && `Status: ${status.reden}`, status.actie && `Zo help je: ${status.actie}`].filter(Boolean) : []
  const blokken = [
    { id: 'status', titel: 'Status', stip: KLEUR[status?.groep] || colors.textMuted, lijst: statusRegels },
    ...BLOKKEN.map(({ id, titel, vast = [] }) => ({
      id, titel,
      lijst: [...vast, ...regels(c[id]), ...(id === 'afsluiten'
        ? [heeft(c.volgende_call) ? `Volgende call: ${c.volgende_call}` : 'Volgende call: inplannen, gaat het goed over 2 weken, niet goed over 1 week']
        : [])],
    })),
  ].map(b => ({ ...b, regels: b.lijst.map((t, i) => ({ t, id: `${b.id}|${i}|${t}` })) }))
    .sort((a, b) => {
      const ia = volgorde.indexOf(a.id), ib = volgorde.indexOf(b.id)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
  const precallRegels = regels(c.precall).length ? regels(c.precall)
    : [...statusRegels, ...blokken.filter(b => b.id !== 'status').flatMap(b => b.lijst.filter(t => KERN.test(t))), ...regels(c.vragen).map(t => `Bespreken: ${t}`)]
  const afgewerkt = blokken.flatMap(b => b.regels.filter(r => af.has(r.id)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!bestuurd && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <PrecallKnop aan={precall} onKlik={() => setPrecall(p => !p)} />
        </div>
      )}
      {precall ? (
        <div>
          <div style={LABEL}>Lees dit vóór de call</div>
          {precallRegels.length ? precallRegels.map((t, i) => <Regel key={i} tekst={t} />)
            : <div style={{ ...REGEL, color: colors.textSecondary }}>Nog geen voorbereiding van Gino.</div>}
        </div>
      ) : <>
      {afgewerkt.length > 0 && (
        <div>
          <button type="button" onClick={() => setAfOpen(o => !o)} style={{
            ...LABEL, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none',
            padding: 0, cursor: 'pointer', fontFamily: 'inherit', color: colors.success,
          }}>
            {afOpen ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
            Afgewerkt · {afgewerkt.length}
          </button>
          {afOpen && afgewerkt.map(r => <Regel key={r.id} tekst={r.t} gedimd onKlik={() => wissel(r.id)} />)}
        </div>
      )}
      {blokken.map(b => {
        const open = b.regels.filter(r => !af.has(r.id))
        if (!open.length) return null
        return (
          <div key={b.id} onDragOver={(e) => { if (sleept) e.preventDefault() }}
            onDrop={(e) => { e.preventDefault(); verplaats(sleept, b.id); setSleept(null) }}
            style={{ opacity: sleept === b.id ? 0.4 : 1 }}>
            <div draggable onDragStart={(e) => { setSleept(b.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', b.id) } catch { /* oude browser */ } }}
              onDragEnd={() => setSleept(null)} title="Sleep om de volgorde te veranderen"
              style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6, cursor: 'grab' }}>
              <GripVertical size={11} style={{ marginLeft: -3, opacity: 0.6 }} />
              {b.stip && <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.stip }} />}{b.titel}
            </div>
            {open.map(r => <Regel key={r.id} tekst={r.t} onKlik={sleutel ? () => wissel(r.id) : undefined} />)}
          </div>
        )
      })}
      </>}
    </div>
  )
}
