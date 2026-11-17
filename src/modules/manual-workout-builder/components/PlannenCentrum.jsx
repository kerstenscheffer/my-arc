// src/modules/manual-workout-builder/components/PlannenCentrum.jsx
//
// Eén scherm voor alle trainingsplannen (17 nov 2026, Kersten): welke klant
// draait welk plan, welke templates worden gebruikt en wat er aan losse
// plannen rondzwerft. Volledig scherm, opent vanuit de builder.
//
//  • Klanten   — per klant het actieve plan, de andere plannen, laatste training.
//  • Templates — per template bij wie hij actief draait; kiezen voor een klant
//                en archiveren (is_archived, terug te zetten).
//  • Overig    — plannen zonder klant die ook geen template zijn.
//
// De lijst laadt bewust zonder week_structure; de dagen van één plan komen pas
// binnen als je het openklapt.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive, ArchiveRestore, BadgeCheck, Pencil, Check, ChevronDown, Dumbbell, ExternalLink, Search, X } from 'lucide-react'
import { PRIVE } from '../../coach-command-center/utils/privacyModus'
import { planFoto } from '../../workout/components/planFoto'

const PLAN_KOLOMMEN = 'id, name, days_per_week, is_template, is_public, is_archived, is_canoniek, client_id, client_name, original_schema_id, deload_van, user_id, created_at, updated_at'
const GROEN = '#10b981'
const tik = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }

const dagenGeleden = (iso) => {
  if (!iso) return null
  const d = new Date(String(iso).length <= 10 ? `${iso}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}
const geledenTekst = (n) => (n == null ? null : n === 0 ? 'vandaag' : n === 1 ? 'gisteren' : n < 14 ? `${n} dagen geleden` : n < 70 ? `${Math.round(n / 7)} weken geleden` : `${Math.round(n / 30)} maanden geleden`)
const dagLijst = (ws) => (!ws || typeof ws !== 'object' ? [] : Object.keys(ws).sort().map(k => {
  const d = ws[k] || {}
  const exs = Array.isArray(d.exercises) ? d.exercises : []
  return { key: k, naam: d.name || k, focus: d.focus || '', oefeningen: exs.map(e => e.name).filter(Boolean) }
}))

export default function PlannenCentrum({ db, isMobile = false, client = null, onClose, onOpenKlant = null, onGewijzigd = null, onBewerk = null }) {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [plannen, setPlannen] = useState([])
  const [klanten, setKlanten] = useState([])
  const [actiefIds, setActiefIds] = useState(null) // Set met actieve betalende klanten
  const [laatste, setLaatste] = useState({})        // client_id → datum laatste training
  const [tab, setTab] = useState('templates')
  const [zoek, setZoek] = useState('')
  const [alleKlanten, setAlleKlanten] = useState(false)
  const [metArchief, setMetArchief] = useState(false)
  const [openKlant, setOpenKlant] = useState(client?.id || null)
  const [openPlan, setOpenPlan] = useState(null)
  const [dagen, setDagen] = useState({})            // plan-id → dagen
  const [doel, setDoel] = useState(client || null)  // de klant voor wie je een template kiest
  const [bezig, setBezig] = useState(null)

  const laad = useCallback(async () => {
    setFout(null)
    try {
      const sb = db.supabase
      const sinds = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10)
      const veilig = (q) => q.then(r => r, (e) => ({ data: null, error: e }))
      const [p, k, a, s] = await Promise.all([
        veilig(sb.from('workout_schemas').select(PLAN_KOLOMMEN).order('name', { ascending: true }).limit(2000)),
        veilig(sb.from('clients').select('id, first_name, last_name, assigned_schema_id').order('first_name', { ascending: true }).limit(2000)),
        veilig(sb.rpc('actieve_betalende_klanten')),
        veilig(sb.from('workout_sessions').select('client_id, workout_date').gte('workout_date', sinds).order('workout_date', { ascending: false }).limit(5000)),
      ])
      if (p.error) throw p.error
      if (k.error) throw k.error
      setPlannen(p.data || [])
      setKlanten(k.data || [])
      setActiefIds(a.error || !a.data ? null : new Set(a.data.map(x => x.client_id)))
      const l = {}
      for (const r of (s.data || [])) if (r.client_id && !l[r.client_id]) l[r.client_id] = r.workout_date
      setLaatste(l)
    } catch (e) { console.error('Plannen laden:', e); setFout(e?.message || 'Laden mislukt') }
    finally { setLaden(false) }
  }, [db])
  useEffect(() => { laad() }, [laad])

  // Dagen van één plan pas ophalen als het opengaat.
  const klapPlan = (id) => {
    setOpenPlan(v => (v === id ? null : id))
    if (dagen[id]) return
    db.supabase.from('workout_schemas').select('id, week_structure').eq('id', id).single()
      .then(({ data }) => setDagen(d => ({ ...d, [id]: dagLijst(data?.week_structure) })), () => setDagen(d => ({ ...d, [id]: [] })))
  }

  const planVan = useMemo(() => Object.fromEntries(plannen.map(p => [p.id, p])), [plannen])
  const naam = (k) => `${k?.first_name || ''} ${k?.last_name || ''}`.trim() || 'Klant'
  const isActieveKlant = (k) => (actiefIds ? actiefIds.has(k.id) : true)

  // Per klant: het actieve plan en de rest van zijn plannen.
  const klantRijen = useMemo(() => {
    const perKlant = {}
    for (const p of plannen) if (p.client_id && !p.is_template) (perKlant[p.client_id] = perKlant[p.client_id] || []).push(p)
    return klanten.map(k => {
      const actief = k.assigned_schema_id ? planVan[k.assigned_schema_id] || null : null
      const eigen = (perKlant[k.id] || []).filter(p => p.id !== actief?.id)
      return { k, actief, andere: eigen.filter(p => !p.is_archived && !p.deload_van), archief: eigen.filter(p => p.is_archived || p.deload_van), laatst: dagenGeleden(laatste[k.id]) }
    })
  }, [klanten, plannen, planVan, laatste])

  // Van welke template komt een klantplan? Vastgelegd in original_schema_id;
  // bij oudere kopieën ontbreekt dat, dan telt een template met dezelfde naam.
  const bronVan = useMemo(() => {
    const kaal = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const opNaam = {}
    for (const p of plannen) if (p.is_template && !p.is_archived && kaal(p.name) && !opNaam[kaal(p.name)]) opNaam[kaal(p.name)] = p.id
    return (p) => (p?.original_schema_id && planVan[p.original_schema_id]?.is_template ? p.original_schema_id : opNaam[kaal(p?.name)] || null)
  }, [plannen, planVan])
  // Per template: bij welke actieve klanten een kopie ervan nu actief staat.
  const templateGebruik = useMemo(() => {
    const g = {}
    for (const r of klantRijen) {
      const bron = r.actief && (!actiefIds || actiefIds.has(r.k.id)) ? bronVan(r.actief) : null
      if (!bron) continue
      ;(g[bron] = g[bron] || []).push(r.k)
    }
    return g
  }, [klantRijen, bronVan, actiefIds])
  const kopieen = useMemo(() => {
    const n = {}
    for (const p of plannen) {
      const bron = p.client_id && !p.is_template ? bronVan(p) : null
      if (bron) n[bron] = (n[bron] || 0) + 1
    }
    return n
  }, [plannen, bronVan])

  const q = zoek.trim().toLowerCase()
  const zichtKlanten = klantRijen
    .filter(r => alleKlanten || isActieveKlant(r.k))
    .filter(r => !q || naam(r.k).toLowerCase().includes(q) || String(r.actief?.name || '').toLowerCase().includes(q))
  const templates = plannen.filter(p => p.is_template)
  const zichtTemplates = templates
    .filter(p => metArchief || !p.is_archived)
    .filter(p => !q || String(p.name || '').toLowerCase().includes(q))
  const overig = plannen.filter(p => !p.is_template && !p.client_id && !klanten.some(k => k.assigned_schema_id === p.id))
    .filter(p => !q || String(p.name || '').toLowerCase().includes(q))
  // Populairste bovenaan: eerst bij hoeveel klanten hij nu draait, dan hoe vaak hij ooit is gekozen.
  const opGebruik = [...zichtTemplates].sort((a, b) =>
    ((templateGebruik[b.id]?.length || 0) - (templateGebruik[a.id]?.length || 0)) || ((kopieen[b.id] || 0) - (kopieen[a.id] || 0))
    || ((b.days_per_week || 0) - (a.days_per_week || 0)) || String(a.name || '').localeCompare(String(b.name || '')))
  const groepen = [
    // Canoniek: de basisplannen die je met vertrouwen toewijst, op dagen per week.
    { id: 'canoniek', titel: 'Canoniek', lijst: opGebruik.filter(p => !p.is_archived && p.is_canoniek).sort((a, b) => (a.days_per_week || 0) - (b.days_per_week || 0)) },
    { id: 'gebruikt', titel: 'Meest gebruikt', lijst: opGebruik.filter(p => !p.is_archived && !p.is_canoniek && kopieen[p.id]) },
    { id: 'nooit', titel: 'Nooit gebruikt', lijst: opGebruik.filter(p => !p.is_archived && !p.is_canoniek && !kopieen[p.id]) },
    { id: 'archief', titel: 'Archief', lijst: opGebruik.filter(p => p.is_archived) },
  ].filter(g => g.lijst.length > 0)

  const actieveRijen = klantRijen.filter(r => isActieveKlant(r.k))
  const zonderPlan = actieveRijen.filter(r => !r.actief).length
  const stil = actieveRijen.filter(r => r.actief && (r.laatst == null || r.laatst > 10)).length
  const ongebruikt = templates.filter(p => !p.is_archived && !kopieen[p.id]).length

  const klaar = async () => { await laad(); onGewijzigd?.() }
  const activeer = async (k, p) => {
    if (bezig) return
    setBezig(p.id)
    try {
      const r = await db.setActiveWorkoutPlan(k.id, p.id)
      if (!r?.success) throw new Error(r?.error || 'Activeren mislukt')
      await klaar()
    } catch (e) { setFout(e?.message || 'Activeren mislukt') }
    finally { setBezig(null) }
  }
  const kiesTemplate = async (p) => {
    if (bezig || !doel) return
    setBezig(p.id)
    try {
      const r = await db.assignTemplateToClient(p.id, doel.id, true)
      if (!r?.success) throw new Error(r?.error || 'Kopiëren mislukt')
      setOpenKlant(doel.id); setTab('klanten')
      await klaar()
    } catch (e) { setFout(e?.message || 'Kon dit plan niet kiezen') }
    finally { setBezig(null) }
  }
  const archiveer = async (p, aan) => {
    if (bezig) return
    setBezig(p.id)
    try {
      const { error } = await db.supabase.from('workout_schemas').update({ is_archived: aan }).eq('id', p.id)
      if (error) throw error
      setPlannen(l => l.map(x => (x.id === p.id ? { ...x, is_archived: aan } : x)))
      onGewijzigd?.()
    } catch (e) { setFout(e?.message || 'Archiveren mislukt') }
    finally { setBezig(null) }
  }

  const zetCanoniek = async (p, aan) => {
    if (bezig) return
    setBezig(p.id)
    try {
      const { error } = await db.supabase.from('workout_schemas').update({ is_canoniek: aan }).eq('id', p.id)
      if (error) throw error
      setPlannen(l => l.map(x => (x.id === p.id ? { ...x, is_canoniek: aan } : x)))
    } catch (e) { setFout(e?.message || 'Opslaan mislukt') }
    finally { setBezig(null) }
  }

  const wit = { minHeight: 34, padding: '0 0.75rem', borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', ...tik }
  const kaal = { ...wit, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: 5 }
  const icoonKnop = { width: 34, height: 34, padding: 0, borderRadius: 9, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...tik }
  const grijs = { fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }
  const rij = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }
  const kopje = { fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '18px 0 2px' }

  const dagenBlok = (id) => openPlan === id && (
    <div style={{ padding: '0.5rem 0 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {!dagen[id] ? <div style={grijs}>Laden…</div> : dagen[id].length === 0 ? <div style={grijs}>Geen dagen in dit plan.</div> : dagen[id].map(d => (
        <div key={d.key}>
          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>{d.naam}{d.focus ? ` · ${d.focus}` : ''} <span style={{ color: 'rgba(255,255,255,0.4)' }}>({d.oefeningen.length})</span></div>
          {d.oefeningen.length > 0 && <div style={{ ...grijs, lineHeight: 1.4 }}>{d.oefeningen.join(' · ')}</div>}
        </div>
      ))}
    </div>
  )
  const pijl = (open) => <ChevronDown size={16} strokeWidth={2.6} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />

  const tabs = [
    { id: 'templates', label: 'Templates', n: templates.filter(p => !p.is_archived).length },
    { id: 'klanten', label: 'Klanten', n: actieveRijen.length },
    { id: 'overig', label: 'Overig', n: overig.length },
  ]

  return createPortal(
    <div role="dialog" aria-label="Trainingsplannen" style={{ position: 'fixed', inset: 0, zIndex: 12000, background: '#0a0a0a', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ flexShrink: 0, width: '100%', maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box', padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 1rem 0' : '1rem 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={18} color="#fff" />
          <div style={{ flex: 1, minWidth: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Trainingsplannen</div>
          <button onClick={onClose} aria-label="Sluiten" style={icoonKnop}><X size={18} /></button>
        </div>
        {!laden && (
          <div style={{ ...grijs, marginTop: 2 }}>
            {actieveRijen.length} actieve klanten
            {zonderPlan > 0 && <> · <span style={{ color: '#ef4444', fontWeight: 900 }}>{zonderPlan} zonder plan</span></>}
            {stil > 0 && <> · <span style={{ color: '#f59e0b', fontWeight: 900 }}>{stil} langer dan 10 dagen niet getraind</span></>}
            {ongebruikt > 0 && <> · {ongebruikt} templates nooit gebruikt</>}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20, marginTop: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0 0 9px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#fff' : 'transparent'}`, marginBottom: -1, color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', ...tik }}>
              {t.label} <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{t.n}</span>
            </button>
          ))}
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 9, minWidth: isMobile ? '100%' : 240 }}>
            <Search size={14} color="rgba(255,255,255,0.5)" />
            <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder={tab === 'klanten' ? 'Zoek klant of plan…' : 'Zoek plan…'} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700 }} />
          </label>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box', padding: isMobile ? '0.4rem 1rem calc(2rem + env(safe-area-inset-bottom))' : '0.4rem 1.5rem 2.5rem' }}>
          {fout && <div role="alert" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', padding: '0.6rem 0' }}>{fout}</div>}
          {laden && <div style={{ ...grijs, padding: '1.5rem 0' }}>Laden…</div>}

          {!laden && tab === 'klanten' && (<>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button onClick={() => setAlleKlanten(v => !v)} style={{ ...kaal, minHeight: 30, border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)' }}>
                {alleKlanten ? 'Alleen actieve klanten' : `Ook oud-klanten tonen (${klanten.length})`}
              </button>
            </div>
            {zichtKlanten.length === 0 && <div style={{ ...grijs, padding: '1rem 0' }}>Geen klant gevonden.</div>}
            {zichtKlanten.map(r => {
              const open = openKlant === r.k.id
              const bron = r.actief ? planVan[bronVan(r.actief)] || null : null
              const stilKlant = r.actief && (r.laatst == null || r.laatst > 10)
              return (
                <div key={r.k.id}>
                  <div style={{ ...rij, cursor: 'pointer', ...tik }} onClick={() => setOpenKlant(open ? null : r.k.id)}>
                    <div style={{ flex: isMobile ? 1 : '0 0 220px', minWidth: 0 }}>
                      <div className={PRIVE} style={{ fontSize: '0.9rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam(r.k)}</div>
                      {isMobile && <div style={{ fontSize: '0.74rem', fontWeight: 800, color: r.actief ? 'rgba(255,255,255,0.75)' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.actief ? `${r.actief.name || 'Plan'} · ${r.actief.days_per_week || '?'}×` : 'Geen actief plan'}</div>}
                    </div>
                    {!isMobile && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 900, color: r.actief ? '#fff' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.actief ? r.actief.name || 'Plan' : 'Geen actief plan'}
                          {r.actief && <span style={{ color: 'rgba(255,255,255,0.5)' }}> · {r.actief.days_per_week || '?'}× per week</span>}
                        </div>
                        {r.actief && <div style={grijs}>{bron ? `Van template ${bron.name}` : 'Eigen plan'} · aangepast {geledenTekst(dagenGeleden(r.actief.updated_at)) || 'onbekend'}{r.andere.length > 0 ? ` · ${r.andere.length} ander${r.andere.length === 1 ? '' : 'e'} plan${r.andere.length === 1 ? '' : 'nen'}` : ''}</div>}
                      </div>
                    )}
                    <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '0.72rem', fontWeight: 800, color: !r.actief ? 'rgba(255,255,255,0.35)' : stilKlant ? '#f59e0b' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                      {r.laatst == null ? 'niet getraind' : geledenTekst(r.laatst)}
                    </div>
                    <span style={{ ...icoonKnop, width: 24 }}>{pijl(open)}</span>
                  </div>
                  {open && (
                    <div style={{ padding: '0.3rem 0 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {[r.actief, ...r.andere, ...r.archief].filter(Boolean).map(p => (
                        <div key={p.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42 }}>
                            <div style={{ flex: 1, minWidth: 0, opacity: p.is_archived ? 0.5 : 1 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{p.name || 'Plan'}</span>
                              <span style={grijs}> · {p.days_per_week || '?'}×{p.deload_van ? ' · deload' : ''}{p.is_archived ? ' · archief' : ''}</span>
                            </div>
                            {p.id === r.actief?.id
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', fontWeight: 900, color: GROEN }}><Check size={13} strokeWidth={3} /> Actief</span>
                              : !p.deload_van && <button onClick={() => activeer(r.k, p)} disabled={!!bezig} style={{ ...kaal, opacity: bezig ? 0.5 : 1 }}>{bezig === p.id ? '…' : 'Activeer'}</button>}
                            <button onClick={() => klapPlan(p.id)} aria-label="Bekijk plan" style={icoonKnop}>{pijl(openPlan === p.id)}</button>
                          </div>
                          {dagenBlok(p.id)}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => { setDoel(r.k); setZoek(''); setTab('templates') }} style={wit}>Template kiezen</button>
                        {onOpenKlant && <button onClick={() => onOpenKlant(r.k)} style={kaal}><ExternalLink size={13} /> Open in builder</button>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>)}

          {!laden && tab === 'templates' && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 800, color: doel ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {doel ? <>Kiezen zet een kopie bij <span className={PRIVE}>{naam(doel)}</span> en maakt die actief.</> : 'Kies bij Klanten eerst voor wie je een template wilt kiezen.'}
              </div>
              <button onClick={() => setMetArchief(v => !v)} style={{ ...kaal, minHeight: 30, border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)' }}>
                {metArchief ? 'Archief verbergen' : `Archief tonen (${templates.filter(p => p.is_archived).length})`}
              </button>
            </div>
            {zichtTemplates.length === 0 && <div style={{ ...grijs, padding: '1rem 0' }}>Geen template gevonden.</div>}
            {groepen.map(g => (
              <div key={g.id}>
                <div style={{ ...kopje, margin: '20px 0 8px' }}>{g.titel} · {g.lijst.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
                  {g.lijst.map(p => {
                    const bij = templateGebruik[p.id] || []
                    const open = openPlan === p.id
                    const glas = { ...icoonKnop, width: 36, height: 36, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }
                    return (
                      <div key={p.id} style={{ borderRadius: 14, overflow: 'hidden', background: '#141414', opacity: p.is_archived ? 0.55 : 1 }}>
                        <div style={{ position: 'relative', height: 150 }}>
                          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${planFoto(p)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.94) 100%)' }} />
                          <span style={{ position: 'absolute', top: 10, left: 12, fontSize: '0.72rem', fontWeight: 900, color: bij.length > 0 ? GROEN : '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                            {p.is_archived ? 'Archief' : bij.length > 0 ? `Actief bij ${bij.length}` : kopieen[p.id] ? 'Nergens actief' : 'Nooit gebruikt'}
                          </span>
                          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 6 }}>
                            {onBewerk && !p.is_archived && <button onClick={() => onBewerk(p)} title="Template aanpassen" aria-label="Template aanpassen" style={glas}><Pencil size={15} /></button>}
                            {!p.is_archived && (
                              <button onClick={() => zetCanoniek(p, !p.is_canoniek)} disabled={!!bezig} title={p.is_canoniek ? 'Niet meer canoniek' : 'Maak canoniek'} aria-label={p.is_canoniek ? 'Niet meer canoniek' : 'Maak canoniek'} style={{ ...glas, ...(p.is_canoniek ? { background: GROEN, border: `1px solid ${GROEN}` } : {}) }}>
                                <BadgeCheck size={17} strokeWidth={2.4} />
                              </button>
                            )}
                            <button onClick={() => archiveer(p, !p.is_archived)} disabled={!!bezig} title={p.is_archived ? 'Terugzetten' : 'Archiveren'} aria-label={p.is_archived ? 'Terugzetten' : 'Archiveren'} style={glas}>
                              {p.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                            </button>
                            <button onClick={() => klapPlan(p.id)} title="Bekijk plan" aria-label="Bekijk plan" style={glas}>{pijl(open)}</button>
                          </div>
                          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                              <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name || 'Template'}</div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                                {p.days_per_week || '?'}× per week{kopieen[p.id] ? ` · ${kopieen[p.id]}× gebruikt` : ''}{p.is_public ? ' · klant ziet hem' : ''}
                              </div>
                            </div>
                            {doel && !p.is_archived && <button onClick={() => kiesTemplate(p)} disabled={!!bezig} style={{ ...wit, opacity: bezig ? 0.5 : 1 }}>{bezig === p.id ? '…' : 'Kies'}</button>}
                          </div>
                        </div>
                        {open && (
                          <div style={{ padding: '0.2rem 0.8rem 0.2rem' }}>
                            {bij.length > 0 && <div className={PRIVE} style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fff', paddingTop: 8 }}>{bij.map(k => naam(k)).join(', ')}</div>}
                            {dagenBlok(p.id)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>)}

          {!laden && tab === 'overig' && (<>
            <div style={{ ...grijs, paddingTop: 10 }}>Plannen zonder klant die ook geen template zijn. Niemand traint hiermee.</div>
            {overig.length === 0 && <div style={{ ...grijs, padding: '1rem 0' }}>Niets gevonden.</div>}
            {overig.map(p => (
              <div key={p.id}>
                <div style={rij}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Plan'}</div>
                    <div style={grijs}>{p.days_per_week || '?'}× per week{p.client_name ? <> · gemaakt voor <span className={PRIVE}>{p.client_name}</span></> : ''} · aangepast {geledenTekst(dagenGeleden(p.updated_at || p.created_at)) || 'onbekend'}</div>
                  </div>
                  <button onClick={() => klapPlan(p.id)} aria-label="Bekijk plan" style={icoonKnop}>{pijl(openPlan === p.id)}</button>
                </div>
                {dagenBlok(p.id)}
              </div>
            ))}
          </>)}
        </div>
      </div>
    </div>,
    document.body
  )
}
