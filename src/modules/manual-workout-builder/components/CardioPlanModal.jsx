// src/modules/manual-workout-builder/components/CardioPlanModal.jsx
//
// Cardio plannen voor een klant vanuit de Workout Builder. Boven: wat er al
// staat (elke week per sport, eenmalig los), tik op een regel = bewerken.
// Onder: het formulier, compact, met keuzemenu's (zelfde als op de
// voedingspagina) in plaats van rijen chips. Opslag via CardioService:
// client_agenda_blocks (type custom, label 'Cardio · <sport>') en bij
// 'elke week' ook client_cardio_plan. Herbouwd 9 okt 2026.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Heart, Check, Pencil } from 'lucide-react'
import CardioService from '../../workout/services/CardioService'
import { CARDIO_SOORTEN, DAGEN_WEEK } from '../../workout/cardioSoorten'
import { cardioFoto } from '../../workout/utils/workoutFoto'
import Keuze from '../../meal-plan/components/Keuze'

const DAG_KORT = Object.fromEntries(DAGEN_WEEK.map(d => [d.id.toLowerCase(), d.kort]))
const DAG_VOLGORDE = DAGEN_WEEK.map(d => d.id.toLowerCase())
const INTENSITEITEN = [
  { id: 'geen', label: 'Intensiteit: vrij' },
  { id: 'rustig', label: 'Rustig · zone 2' },
  { id: 'gemiddeld', label: 'Gemiddeld' },
  { id: 'pittig', label: 'Pittig · intervallen' },
  { id: 'vol_gas', label: 'Vol gas' },
]
const INTENS_LABEL = { rustig: 'Rustig', gemiddeld: 'Gemiddeld', pittig: 'Pittig', vol_gas: 'Vol gas' }

const leegForm = () => ({ soort: 'Hardlopen', eigen: '', dagen: [], tijd: '18:00', tijdPerDag: {}, duur: 30, afstand: '', intensiteit: 'geen', bereik: 'standaard', notitie: '', bewerkVan: null })

export default function CardioPlanModal({ client, db, isMobile, onClose }) {
  const m = isMobile
  const dezeWeek = CardioService.maandagIso()
  const [blokken, setBlokken] = useState([])
  const [plan, setPlan] = useState([])
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(leegForm())
  const zet = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const laad = async () => {
    setLaden(true)
    const [lijst, p] = await Promise.all([CardioService.getBlokken(client?.id, db, dezeWeek), CardioService.getPlan(client?.id, db)])
    setBlokken(lijst.sort((a, b) => DAG_VOLGORDE.indexOf(a.day) - DAG_VOLGORDE.indexOf(b.day) || String(a.tijd).localeCompare(String(b.tijd))))
    setPlan(p || [])
    setLaden(false)
  }
  useEffect(() => { laad() }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const vast = blokken.filter(b => !b.week_start)
  const eenmalig = blokken.filter(b => !!b.week_start)
  const perSoort = [...new Set(vast.map(b => b.soort))].map(s => ({ soort: s, blokken: vast.filter(b => b.soort === s) }))

  const sportOpties = useMemo(() => {
    const vastNamen = CARDIO_SOORTEN.map(s => s.id)
    const extra = [...new Set(blokken.map(b => b.soort))].filter(s => !vastNamen.includes(s))
    return [...vastNamen.map(s => ({ id: s, label: s })), ...extra.map(s => ({ id: s, label: s })), { id: '__eigen', label: 'Eigen sport…' }]
  }, [blokken])
  const gekozenSoort = f.soort === '__eigen' ? f.eigen.trim() : f.soort

  // Bestaande weekregel openen om te bewerken: alles vooringevuld.
  const bewerk = (g) => {
    const regel = plan.find(p => String(p.cardio_type || '').toLowerCase() === g.soort.toLowerCase())
    const tijden = g.blokken.map(b => b.tijd)
    const tijd = tijden.sort((a, b) => tijden.filter(t => t === b).length - tijden.filter(t => t === a).length)[0] || '18:00'
    const tijdPerDag = Object.fromEntries(g.blokken.filter(b => b.tijd !== tijd).map(b => [b.day, b.tijd]))
    const bekend = CARDIO_SOORTEN.some(s => s.id === g.soort) || sportOpties.some(o => o.id === g.soort)
    setF({
      soort: bekend ? g.soort : '__eigen', eigen: bekend ? '' : g.soort,
      dagen: g.blokken.map(b => DAGEN_WEEK.find(d => d.id.toLowerCase() === b.day)?.id).filter(Boolean),
      tijd, tijdPerDag, duur: g.blokken[0]?.duur || 30,
      afstand: regel?.distance_km ? String(regel.distance_km) : '', intensiteit: regel?.intensity || 'geen',
      bereik: 'standaard', notitie: regel?.notes || '', bewerkVan: g.soort,
    })
    setOpen(true)
  }

  const bewaar = async () => {
    if (!gekozenSoort || f.dagen.length === 0 || bezig) return
    setBezig(true)
    try {
      if (f.bewerkVan) await CardioService.verwijderVasteBlokken(client.id, f.bewerkVan, db)
      await CardioService.planBlokken({
        clientId: client.id, soort: gekozenSoort, duur: Number(f.duur) || 30, tijd: f.tijd, dagen: f.dagen, bereik: f.bereik, weekSleutel: dezeWeek,
        notitie: f.notitie.trim() || null, tijdPerDag: f.tijdPerDag, intensiteit: f.intensiteit === 'geen' ? null : f.intensiteit,
        afstandKm: f.afstand ? Number(String(f.afstand).replace(',', '.')) || null : null,
      }, db)
      setOpen(false); setF(leegForm())
      await laad()
    } catch (e) { alert('Opslaan mislukt: ' + (e?.message || 'onbekende fout')) }
    finally { setBezig(false) }
  }

  const weg = async (blok) => {
    setBlokken(prev => prev.filter(b => b.id !== blok.id))
    const ok = await CardioService.verwijderBlok(client.id, blok, db)
    if (!ok) await laad()
  }

  const fmtWeek = (iso) => { try { return new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return iso } }
  const dagToggle = (aan) => ({
    minHeight: 34, borderRadius: 8, border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
    background: aan ? '#fff' : 'rgba(255,255,255,0.04)', color: aan ? '#0a0a0a' : '#fff',
    fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const afwijkend = f.dagen.map(d => d.toLowerCase()).filter(d => f.tijdPerDag[d] && f.tijdPerDag[d] !== f.tijd)

  const Regel = ({ titel, sub, foto, kinderen, onWeg, onBewerk }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titel}</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        {kinderen && <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>{kinderen}</div>}
      </div>
      {onBewerk && (
        <button onClick={onBewerk} aria-label="Bewerken" style={{ width: 32, height: 32, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={13} /></button>
      )}
      {onWeg && (
        <button onClick={onWeg} aria-label="Verwijder" style={{ width: 32, height: 32, flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 9, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
      )}
    </div>
  )

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', width: '100%', maxWidth: 560, maxHeight: '92vh', borderRadius: m ? '16px 16px 0 0' : 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Heart size={16} color="#f87171" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Cardio</div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Klant'} · staat in zijn weekrooster</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} strokeWidth={2.5} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {laden ? <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div> : (<>
            {blokken.length === 0 && !open && (
              <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.76rem', fontWeight: 700 }}>Nog geen cardio ingepland.</div>
            )}
            {perSoort.length > 0 && <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elke week</div>}
            {perSoort.map(g => (
              <Regel key={g.soort} titel={g.soort} foto={cardioFoto(g.soort)}
                sub={[`${g.blokken.length}× per week · ${g.blokken[0]?.duur || '–'} min`, g.blokken.find(b => b.sublabel)?.sublabel].filter(Boolean).join(' · ')}
                onBewerk={() => bewerk(g)}
                kinderen={g.blokken.map(b => (
                  <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.64rem', fontWeight: 900, color: '#fff' }}>
                    {DAG_KORT[b.day] || b.day} {b.tijd}
                    <button onClick={() => weg(b)} aria-label={`${DAG_KORT[b.day]} weghalen`} style={{ padding: 0, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}><X size={11} strokeWidth={3} /></button>
                  </span>
                ))} />
            ))}
            {eenmalig.length > 0 && <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Eenmalig</div>}
            {eenmalig.map(b => (
              <Regel key={b.id} titel={b.soort} foto={cardioFoto(b.soort)}
                sub={[`${DAG_KORT[b.day] || b.day} ${b.tijd}${b.duur ? ` · ${b.duur} min` : ''} · week van ${fmtWeek(b.week_start)}`, b.sublabel].filter(Boolean).join(' · ')}
                onWeg={() => weg(b)} />
            ))}

            {open ? (
              <div style={{ marginTop: 4, padding: '0.6rem 0.75rem 0.75rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.bewerkVan ? `${f.bewerkVan} bewerken` : 'Nieuw'}</div>
                {/* Drie keuzes op één regel: sport, intensiteit, bereik. */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2 }}>
                  <Keuze waarde={f.soort} zet={(v) => zet('soort', v)} isMobile={m} opties={sportOpties} />
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <Keuze waarde={f.intensiteit} zet={(v) => zet('intensiteit', v)} isMobile={m} opties={INTENSITEITEN} />
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <Keuze waarde={f.bereik} zet={(v) => zet('bereik', v)} isMobile={m} uitlijning="rechts" opties={[{ id: 'standaard', label: 'Elke week' }, { id: 'eenmalig', label: 'Alleen deze week' }]} />
                </div>
                {f.soort === '__eigen' && <input autoFocus value={f.eigen} onChange={e => zet('eigen', e.target.value)} placeholder="Naam van de sport, bv. Boksen" style={veld} />}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {DAGEN_WEEK.map(d => {
                    const aan = f.dagen.includes(d.id)
                    return <button key={d.id} onClick={() => zet('dagen', aan ? f.dagen.filter(x => x !== d.id) : [...f.dagen, d.id])} style={dagToggle(aan)}>{d.kort}</button>
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <label style={lab}><span style={labTekst}>Tijd</span><input type="time" value={f.tijd} onChange={e => zet('tijd', e.target.value)} style={veld} /></label>
                  <label style={lab}><span style={labTekst}>Duur (min)</span><input type="number" inputMode="numeric" min={5} step={5} value={f.duur} onChange={e => zet('duur', e.target.value)} style={veld} /></label>
                  <label style={lab}><span style={labTekst}>Km (optie)</span><input type="text" inputMode="decimal" value={f.afstand} onChange={e => zet('afstand', e.target.value)} placeholder="bv. 5" style={veld} /></label>
                </div>

                {/* Tijd per dag alleen als er dagen gekozen zijn; standaard dicht. */}
                {f.dagen.length > 0 && (
                  <details open={afwijkend.length > 0} style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 800, listStyle: 'none' }}>Andere tijd per dag{afwijkend.length ? ` · ${afwijkend.map(d => DAG_KORT[d]).join(', ')}` : ''}</summary>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {DAGEN_WEEK.filter(d => f.dagen.includes(d.id)).map(d => (
                        <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.3rem 0.2rem 0.55rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', fontWeight: 900, color: '#fff' }}>
                          {d.kort}
                          <input type="time" value={f.tijdPerDag[d.id.toLowerCase()] || f.tijd} onChange={e => zet('tijdPerDag', { ...f.tijdPerDag, [d.id.toLowerCase()]: e.target.value })} style={{ ...veld, width: 92, padding: '0.25rem 0.35rem', fontSize: '0.76rem' }} />
                        </label>
                      ))}
                    </div>
                  </details>
                )}

                <input value={f.notitie} onChange={e => zet('notitie', e.target.value)} placeholder="Notitie voor de klant (optioneel)" style={veld} />
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setOpen(false); setF(leegForm()) }} style={{ ...knop, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>Annuleren</button>
                  <button onClick={bewaar} disabled={bezig || !gekozenSoort || f.dagen.length === 0} style={{ ...knop, opacity: (bezig || !gekozenSoort || f.dagen.length === 0) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={14} strokeWidth={3} /> {bezig ? 'Opslaan…' : f.bewerkVan ? 'Wijzigingen opslaan' : `Inplannen${f.dagen.length ? ` (${f.dagen.length}×)` : ''}`}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setF(leegForm()); setOpen(true) }} style={{ ...knop, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.65rem', marginTop: 4 }}>
                <Plus size={15} strokeWidth={2.8} /> Cardio inplannen
              </button>
            )}
          </>)}
        </div>
      </div>
    </div>,
    document.body
  )
}

const lab = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }
const labTekst = { fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }
const veld = {
  width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.65rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
}
const knop = {
  padding: '0.45rem 0.9rem', borderRadius: 8, border: 'none', background: '#fff', color: '#0a0a0a',
  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
