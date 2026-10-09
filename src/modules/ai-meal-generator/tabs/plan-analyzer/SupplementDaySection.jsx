// src/modules/ai-meal-generator/tabs/plan-analyzer/SupplementDaySection.jsx
//
// Supplementen in de dagweergave, als kaarten met dezelfde functies als een
// maaltijdkaart (9 okt 2026): één kaart per supplement, moment en tijd in het
// vlak links (tik = aanpassen), naam klikbaar, en een actierij met Wissel,
// Dosering, Dagen en Wis. Alles schrijft direct naar het actieve
// supplementenplan (supplement_plans.supplements), net als de maaltijden.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Shuffle, Pencil, CalendarDays, Trash2, X } from 'lucide-react'
import { useModalHost } from '../../../../coach/ModalHost'
import DatabaseService from '../../../supplements/SupplementPlanService'
import Keuze from '../../../meal-plan/components/Keuze'
import {
  doseringTekst, geldtOpDag, momentVanSupplement, minutenNaarKlok,
  DAG_SLEUTELS, DAG_KORT, dagenVanSupplement, MOMENT_LABEL,
} from '../../../supplements/utils/supplementSchedule'

const DIVIDER = 'rgba(255,255,255,0.06)'
const MAALTIJD_LABEL = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack', pre_workout: 'Pre workout', post_workout: 'Na training' }

export default function SupplementDaySection({ supplementen, maaltijdTijden, dagSleutel, isMobile, db = null, clientId = null, onChanged = null }) {
  const m = isMobile
  const modalHost = useModalHost()
  const [templates, setTemplates] = useState(null)
  const [fout, setFout] = useState(null)

  const lijst = Array.isArray(supplementen) ? supplementen : []
  const vandaag = lijst.map((s, index) => ({ s, index })).filter(({ s }) => geldtOpDag(s, dagSleutel))
    .sort((a, b) => (momentVanSupplement(a.s, maaltijdTijden) ?? 9999) - (momentVanSupplement(b.s, maaltijdTijden) ?? 9999))

  // Hele lijst bewaren in het actieve plan. Eerst lokaal (meteen zichtbaar),
  // dan de database; mislukt het, dan terug naar de oude stand.
  const bewaar = async (nieuw) => {
    if (!db?.supabase || !clientId) return
    const oud = lijst
    onChanged && onChanged(nieuw)
    setFout(null)
    const { data } = await db.supabase.from('supplement_plans').select('id').eq('client_id', clientId).eq('status', 'active')
      .order('updated_at', { ascending: false }).limit(1).then(r => r, () => ({ data: [] }))
    const id = data?.[0]?.id
    if (!id) { setFout('Geen actief supplementenplan'); onChanged && onChanged(oud); return }
    const { error } = await db.supabase.from('supplement_plans').update({ supplements: nieuw, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setFout('Opslaan mislukt'); onChanged && onChanged(oud) }
  }
  const pas = (index, wijziging) => bewaar(lijst.map((s, i) => i === index ? { ...s, ...wijziging } : s))

  const laadTemplates = async () => {
    if (templates) return templates
    const t = await DatabaseService.getSupplementTemplates().catch(() => [])
    setTemplates(t || [])
    return t || []
  }

  if (!vandaag.length) return null

  return (
    <>
      {fout && <div style={{ margin: m ? '0 0.5rem 0.4rem' : '0 0.75rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>}
      {vandaag.map(({ s, index }) => (
        <SupplementKaart key={`${s.name}-${index}`} s={s} index={index} m={m} maaltijdTijden={maaltijdTijden}
          modalHost={modalHost} pas={pas}
          wis={() => { if (window.confirm(`${s.name || 'Dit supplement'} uit het plan halen?`)) bewaar(lijst.filter((_, i) => i !== index)) }}
          wissel={async (pos) => ({ pos, templates: await laadTemplates() })}
          vervang={async (tpl) => {
            const verrijkt = await DatabaseService.enrichSupplementWithProducts(tpl).catch(() => tpl)
            // Moment en dagen van het oude supplement blijven, de rest komt van het nieuwe.
            bewaar(lijst.map((x, i) => i === index ? { ...verrijkt, timing: x.timing, days: x.days } : x))
          }}
        />
      ))}
    </>
  )
}

function SupplementKaart({ s, index, m, maaltijdTijden, modalHost, pas, wis, wissel, vervang }) {
  const [paneel, setPaneel] = useState(null)        // 'dosering' | 'dagen' | null
  const [naamEdit, setNaamEdit] = useState(null)
  const [moment, setMoment] = useState(null)        // positie voor het momentvenster
  const [wisselLijst, setWisselLijst] = useState(null)
  const fotoFormaat = m ? 60 : 66

  const min = momentVanSupplement(s, maaltijdTijden)
  const ref = s?.timing?.meal_reference
  const momentLabel = s?.timing?.specific_time ? 'Vaste tijd' : ref ? (MAALTIJD_LABEL[ref] || ref) : (MOMENT_LABEL[s?.timing?.time_of_day] || 'Flexibel')
  const dagen = dagenVanSupplement(s)

  const actie = (actief, danger) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: m ? '0.42rem 0.3rem' : '0.5rem 0.4rem', background: 'transparent', border: 'none',
    color: danger ? '#ef4444' : actief ? '#FFD700' : 'rgba(255,255,255,0.65)',
    fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  })
  const knopje = (vol) => ({ padding: '0.25rem 0.55rem', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: 900, cursor: 'pointer', background: vol ? '#fff' : 'rgba(255,255,255,0.06)', color: vol ? '#0a0a0a' : '#fff', border: '1px solid rgba(255,255,255,0.14)' })
  const veld = { boxSizing: 'border-box', height: 30, padding: '0 0.45rem', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }

  return (
    <div style={{
      margin: m ? '0 0.5rem 0.45rem' : '0 0.75rem 0.55rem',
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        {/* Vlak links: emoji, moment en tijd. Tik = moment aanpassen. */}
        <button onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMoment({ top: r.bottom + 6, left: r.left, boven: r.top }) }} title="Moment aanpassen" style={{
          width: fotoFormaat, height: fotoFormaat, flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer',
          background: 'rgba(34,197,94,0.10)', position: 'relative', fontFamily: 'inherit',
        }}>
          <span style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', fontSize: '1.3rem', lineHeight: 1 }}>{s.emoji || '💊'}</span>
          <div style={{ position: 'absolute', left: 5, right: 4, bottom: 4, lineHeight: 1.1, textAlign: 'left' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{momentLabel}</div>
            <div style={{ fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{min != null ? minutenNaarKlok(min) : '—'}</div>
          </div>
        </button>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: m ? '0.35rem 0.65rem' : '0.4rem 0.85rem' }}>
          {naamEdit !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input autoFocus value={naamEdit} onChange={e => setNaamEdit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && naamEdit.trim()) { pas(index, { name: naamEdit.trim() }); setNaamEdit(null) } if (e.key === 'Escape') setNaamEdit(null) }}
                style={{ ...veld, flex: 1, minWidth: 0, fontSize: m ? '0.88rem' : '0.95rem' }} />
              <button onClick={() => { if (naamEdit.trim()) pas(index, { name: naamEdit.trim() }); setNaamEdit(null) }} style={knopje(true)}>Opslaan</button>
            </div>
          ) : (
            <button onClick={() => setNaamEdit(s.name || '')} title="Naam aanpassen" style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'text', fontFamily: 'inherit', fontSize: m ? '0.9rem' : '0.98rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.name || 'Supplement'}
            </button>
          )}
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[doseringTekst(s), dagen.length === 7 ? 'elke dag' : dagen.map(d => DAG_KORT[d]).join(' ')].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderTop: `1px solid ${DIVIDER}` }}>
        <button onClick={async (e) => { const r = e.currentTarget.getBoundingClientRect(); const { templates } = await wissel(); setWisselLijst({ top: r.bottom + 6, left: r.left, boven: r.top, templates }) }} style={actie(false)}><Shuffle size={m ? 13 : 14} /> Wissel</button>
        <div style={{ width: 1, background: DIVIDER }} />
        <button onClick={() => setPaneel(p => p === 'dosering' ? null : 'dosering')} style={actie(paneel === 'dosering')}><Pencil size={m ? 13 : 14} /> Dosering</button>
        <div style={{ width: 1, background: DIVIDER }} />
        <button onClick={() => setPaneel(p => p === 'dagen' ? null : 'dagen')} style={actie(paneel === 'dagen')}><CalendarDays size={m ? 13 : 14} /> Dagen</button>
        <div style={{ width: 1, background: DIVIDER }} />
        <button onClick={wis} style={actie(false, true)}><Trash2 size={m ? 13 : 14} /> Wis</button>
      </div>

      {/* Dosering: hoeveelheid + eenheid, inline onder de kaart. */}
      {paneel === 'dosering' && (
        <DoseringPaneel s={s} veld={veld} knopje={knopje} onSave={(dosage) => { pas(index, { dosage: { ...(s.dosage || {}), ...dosage } }); setPaneel(null) }} />
      )}
      {/* Dagen: zeven schakelaars, meteen opgeslagen. */}
      {paneel === 'dagen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '0.5rem 0.75rem', borderTop: `1px solid ${DIVIDER}` }}>
          {DAG_SLEUTELS.map(d => {
            const aan = dagen.includes(d)
            return <button key={d} onClick={() => { const nieuw = aan ? dagen.filter(x => x !== d) : [...dagen, d]; pas(index, { days: DAG_SLEUTELS.filter(x => nieuw.includes(x)) }) }} style={{ minHeight: 30, borderRadius: 7, border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`, background: aan ? '#fff' : 'rgba(255,255,255,0.04)', color: aan ? '#0a0a0a' : '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>{DAG_KORT[d]}</button>
          })}
        </div>
      )}

      {moment && createPortal(
        <Popover pos={moment} onClose={() => setMoment(null)} titel="Moment aanpassen">
          <MomentInhoud s={s} veld={veld} knopje={knopje} onSave={(timing) => { pas(index, { timing }); setMoment(null) }} />
        </Popover>, modalHost)}

      {wisselLijst && createPortal(
        <Popover pos={wisselLijst} onClose={() => setWisselLijst(null)} titel="Wisselen voor">
          <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(wisselLijst.templates || []).filter(t => t.name !== s.name).map(t => (
              <button key={t.id || t.name} onClick={() => { setWisselLijst(null); vervang(t) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.45rem 0.5rem', background: 'transparent', border: 'none', borderRadius: 7, color: '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <span>{t.emoji || '💊'}</span>{t.name}
              </button>
            ))}
            {(wisselLijst.templates || []).length === 0 && <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', padding: '0.4rem' }}>Geen supplementen in de bibliotheek.</div>}
          </div>
        </Popover>, modalHost)}
    </div>
  )
}

function DoseringPaneel({ s, veld, knopje, onSave }) {
  const [amount, setAmount] = useState(s?.dosage?.amount != null ? String(s.dosage.amount) : '')
  const [unit, setUnit] = useState(s?.dosage?.unit || '')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', borderTop: `1px solid ${DIVIDER}` }}>
      <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="5" style={{ ...veld, width: 64 }} />
      <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="gram" style={{ ...veld, flex: 1, minWidth: 0 }} />
      <button onClick={() => onSave({ amount: amount === '' ? null : (Number(String(amount).replace(',', '.')) || amount), unit })} style={knopje(true)}>Opslaan</button>
    </div>
  )
}

function MomentInhoud({ s, veld, knopje, onSave }) {
  const t = s?.timing || {}
  const [soort, setSoort] = useState(t.specific_time ? 'tijd' : t.meal_reference ? `maaltijd:${t.meal_reference}` : 'tijd')
  const [tijd, setTijd] = useState(t.specific_time || '08:00')
  const opties = [{ id: 'tijd', label: 'Vaste tijd' }, ...Object.entries(MAALTIJD_LABEL).map(([k, v]) => ({ id: `maaltijd:${k}`, label: `Bij ${v.toLowerCase()}` }))]
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <Keuze waarde={soort} zet={setSoort} opties={opties} />
        </div>
        {soort === 'tijd' && <input type="time" value={tijd} onChange={e => setTijd(e.target.value)} style={{ ...veld, width: 92, height: 32 }} />}
      </div>
      <button onClick={() => onSave(soort === 'tijd' ? { ...t, specific_time: tijd, meal_reference: null } : { ...t, specific_time: null, meal_reference: soort.split(':')[1] })} style={{ ...knopje(true), width: '100%', minHeight: 32 }}>Opslaan</button>
    </>
  )
}

// Klein venster bij het aangetikte element, binnen het scherm gehouden.
function Popover({ pos, onClose, titel, children }) {
  const BREED = 280, HOOG = 300
  const vw = window.innerWidth, vh = window.innerHeight
  const left = Math.max(8, Math.min(pos.left, vw - BREED - 8))
  const top = pos.top + HOOG > vh - 8 ? Math.max(8, pos.boven - HOOG - 6) : pos.top
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10050 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top, left, width: BREED, maxWidth: 'calc(100vw - 16px)', background: '#141414', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '0.7rem', boxShadow: '0 18px 44px rgba(0,0,0,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>{titel}</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={13} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
