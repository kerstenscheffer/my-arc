// src/modules/ai-meal-generator/tabs/plan-analyzer/VoedingPlannenCentrum.jsx
//
// Eén scherm voor alle voedingsplannen (17 nov 2026, Kersten), dezelfde opzet
// als het trainingsplannenscherm in de Workout Builder (PlannenCentrum.jsx):
//
//  • Templates — de opgeslagen weekplannen (meal_plan_templates, plan_type
//                'full_week') als fotokaarten: canoniek, man/vrouw, archief,
//                bij wie hij draait, laden in het open plan en als concept bij
//                een andere klant zetten. Bovenaan: het open plan opslaan als
//                template.
//  • Klanten   — per actieve klant het actieve voedingsplan.
//
// Vervangt PlanLibraryModal in de Plan Analyzer. De lijst laadt zonder
// week_structure (samen ruim 700 kB); die komt pas binnen bij openklappen,
// laden of toewijzen.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive, ArchiveRestore, BadgeCheck, Bookmark, Check, ChevronDown, Download, ExternalLink, Mars, Pencil, Search, UserPlus, UtensilsCrossed, Venus, X } from 'lucide-react'
import { PRIVE } from '../../../coach-command-center/utils/privacyModus'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { supplementenVoorSjabloon } from './sjabloonExtras'

const GROEN = '#10b981'
const BLAUW = '#3b82f6'
const GROEP = { man: { label: 'Man', kleur: BLAUW, Icoon: Mars }, vrouw: { label: 'Vrouw', kleur: '#ec4899', Icoon: Venus } }
const VOLGENDE_GROEP = { '': 'man', man: 'vrouw', vrouw: null }
const tik = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
// De foto op de kaart: het diner (anders de lunch) van maandag, rechtstreeks uit de jsonb.
const TEMPLATE_KOLOMMEN = 'id, name, template_name, description, daily_calories, daily_protein, daily_carbs, daily_fat, meals_per_day, created_at, updated_at, is_canoniek, is_archived, doelgroep, foto:week_structure->monday->dinner->>image_url, foto2:week_structure->monday->lunch->>image_url, gerecht:week_structure->monday->dinner->>name'
const DAGEN = [['monday', 'Ma'], ['tuesday', 'Di'], ['wednesday', 'Wo'], ['thursday', 'Do'], ['friday', 'Vr'], ['saturday', 'Za'], ['sunday', 'Zo']]
const SLOT_VOLGORDE = ['breakfast', 'snack1', 'lunch', 'snack2', 'pre_workout', 'dinner', 'snack3']
const kaalNaam = (n) => String(n || '').trim().toLowerCase()
const veilig = (q) => q.then(r => r, (e) => ({ data: null, error: e }))
const dagenGeleden = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000)) }
const geleden = (n) => (n == null ? 'onbekend' : n === 0 ? 'vandaag' : n === 1 ? 'gisteren' : n < 14 ? `${n} dagen geleden` : n < 70 ? `${Math.round(n / 7)} weken geleden` : `${Math.round(n / 30)} maanden geleden`)

export default function VoedingPlannenCentrum({
  db, coachId, isMobile = false, onClose,
  // Het plan dat nu open staat in de Plan Analyzer: op te slaan als template.
  weekData = null, planMeta = null, clientName = '', preWorkoutMeal = null, supplementen = [], trainingDayKeys = [],
  doelKcal = 0, doelEiwit = 0,
  client = null,          // de klant die open staat (voor "Laden")
  onLoad = null,          // (week_structure, naam, { pre_workout_meal, supplements, template_id }) → in het open plan zetten
  onOpenKlant = null,     // (klant) → die klant openen in de Plan Analyzer
  onBewerk = null,        // (template) → de template zelf openen in de Plan Analyzer
}) {
  const sb = db.supabase
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [templates, setTemplates] = useState([])
  const [plannen, setPlannen] = useState([])   // client_meal_plans, zonder week_structure
  const [klanten, setKlanten] = useState([])
  const [actiefIds, setActiefIds] = useState(null)
  const [tab, setTab] = useState('templates')
  const [zoek, setZoek] = useState('')
  const [metArchief, setMetArchief] = useState(false)
  const [groepFilter, setGroepFilter] = useState('alle')
  const [openId, setOpenId] = useState(null)
  const [weken, setWeken] = useState({})        // template-id → week_structure
  const [toewijs, setToewijs] = useState(null)
  const [toewijsZoek, setToewijsZoek] = useState('')
  const [toegewezen, setToegewezen] = useState({})
  const [bezig, setBezig] = useState(null)
  const [naamNieuw, setNaamNieuw] = useState(() => planMeta?.name || (clientName ? `Plan ${clientName}` : ''))
  const [opgeslagen, setOpgeslagen] = useState(false)
  // Variatieniveau per template (RPC template_variatie, 18 nov 2026).
  const [variatie, setVariatie] = useState({})
  // Vast = elke dag hetzelfde; anders op gerechten per eetmoment.
  const variatieLabel = (t) => {
    const x = variatie[t.id]
    if (!x || !x.gerechten) return null
    if (x.dagmenus <= 1) return 'Vast'
    const perMoment = x.gerechten / Math.max(1, Number(t.meals_per_day) || 4)
    return perMoment < 2.5 ? 'Afwisselen' : 'Veel variatie'
  }

  const laad = useCallback(async () => {
    setFout(null)
    try {
      let tq = sb.from('meal_plan_templates').select(TEMPLATE_KOLOMMEN).eq('plan_type', 'full_week').order('created_at', { ascending: false })
      // Ook de plannen zonder coach: een deel is opgeslagen via een pad dat coach_id nooit invulde.
      if (coachId) tq = tq.or(`coach_id.eq.${coachId},coach_id.is.null`)
      const [t, p, k, a, v] = await Promise.all([
        veilig(tq),
        veilig(sb.from('client_meal_plans').select('id, client_id, template_name, template_id, is_active, daily_calories, daily_protein, created_at, updated_at').order('created_at', { ascending: false }).limit(3000)),
        veilig(sb.from('clients').select('id, first_name, last_name').order('first_name', { ascending: true }).limit(2000)),
        veilig(sb.rpc('actieve_betalende_klanten')),
        veilig(sb.rpc('template_variatie')),
      ])
      if (t.error) throw t.error
      setTemplates(t.data || [])
      setPlannen(p.data || [])
      setKlanten(k.data || [])
      setVariatie(Object.fromEntries((v.error ? [] : v.data || []).map(x => [x.id, x])))
      setActiefIds(a.error || !a.data ? null : new Set(a.data.map(x => x.client_id)))
    } catch (e) { console.error('Voedingsplannen laden:', e); setFout(e?.message || 'Laden mislukt') }
    finally { setLaden(false) }
  }, [sb, coachId])
  useEffect(() => { laad() }, [laad])

  const naam = (k) => `${k?.first_name || ''} ${k?.last_name || ''}`.trim() || 'Klant'
  const tNaam = (t) => t?.name || t?.template_name || 'Plan'
  const isActieveKlant = (k) => (actiefIds ? actiefIds.has(k.id) : true)

  // De week van één template pas ophalen als hij nodig is.
  const haalWeek = async (t) => {
    if (weken[t.id]) return weken[t.id]
    const { data, error } = await veilig(sb.from('meal_plan_templates').select('week_structure, pre_workout_meal, supplements').eq('id', t.id).single())
    if (error || !data) throw (error || new Error('Plan niet gevonden'))
    setWeken(w => ({ ...w, [t.id]: data }))
    return data
  }
  const klap = (t) => { setOpenId(v => (v === t.id ? null : t.id)); haalWeek(t).catch(e => setFout(e?.message || 'Laden mislukt')) }

  // Van welke template komt een klantplan: de koppeling, anders dezelfde naam.
  const bronVan = useMemo(() => {
    const opNaam = {}
    for (const t of templates) if (!opNaam[kaalNaam(tNaam(t))]) opNaam[kaalNaam(tNaam(t))] = t.id
    const ids = new Set(templates.map(t => t.id))
    return (p) => (p.template_id && ids.has(p.template_id) ? p.template_id : opNaam[kaalNaam(p.template_name)] || null)
  }, [templates])
  const { actiefBij, gebruikt } = useMemo(() => {
    const klantVan = Object.fromEntries(klanten.map(k => [k.id, k]))
    const a = {}, g = {}
    for (const p of plannen) {
      const bron = bronVan(p)
      if (!bron) continue
      g[bron] = (g[bron] || 0) + 1
      const k = klantVan[p.client_id]
      if (p.is_active && k && (!actiefIds || actiefIds.has(k.id))) (a[bron] = a[bron] || []).push(k)
    }
    return { actiefBij: a, gebruikt: g }
  }, [plannen, klanten, bronVan, actiefIds])

  const klantRijen = useMemo(() => {
    const per = {}
    for (const p of plannen) (per[p.client_id] = per[p.client_id] || []).push(p)
    return klanten.map(k => {
      const eigen = per[k.id] || []
      return { k, actief: eigen.find(p => p.is_active) || null, andere: eigen.filter(p => !p.is_active).length }
    })
  }, [klanten, plannen])

  const q = zoek.trim().toLowerCase()
  const afstand = (t) => Math.abs((Number(t.daily_calories) || 0) - doelKcal) + (doelEiwit > 0 ? Math.abs((Number(t.daily_protein) || 0) - doelEiwit) * 4 : 0)
  const zicht = templates
    .filter(t => metArchief || !t.is_archived)
    .filter(t => groepFilter === 'alle' || !t.doelgroep || t.doelgroep === groepFilter)
    .filter(t => !q || tNaam(t).toLowerCase().includes(q) || String(t.daily_calories || '').includes(q))
    // Met een klant open: wat het dichtst bij zijn doel zit eerst. Anders: meest gebruikt.
    .sort((a, b) => (doelKcal > 0 ? afstand(a) - afstand(b) : ((actiefBij[b.id]?.length || 0) - (actiefBij[a.id]?.length || 0)) || ((gebruikt[b.id] || 0) - (gebruikt[a.id] || 0))) || (Number(a.daily_calories) || 0) - (Number(b.daily_calories) || 0))
  const groepen = [
    { id: 'canoniek', titel: 'Canoniek', lijst: zicht.filter(t => !t.is_archived && t.is_canoniek) },
    { id: 'overig', titel: doelKcal > 0 ? 'Overige, dichtst bij het doel eerst' : 'Overige, meest gebruikt eerst', lijst: zicht.filter(t => !t.is_archived && !t.is_canoniek) },
    { id: 'archief', titel: 'Archief', lijst: zicht.filter(t => t.is_archived) },
  ].filter(g => g.lijst.length > 0)
  const actieveRijen = klantRijen.filter(r => isActieveKlant(r.k))
  const zichtKlanten = actieveRijen.filter(r => !q || naam(r.k).toLowerCase().includes(q) || String(r.actief?.template_name || '').toLowerCase().includes(q))

  const zet = async (t, velden) => {
    if (bezig) return
    setBezig(t.id)
    try {
      const { error } = await sb.from('meal_plan_templates').update(velden).eq('id', t.id)
      if (error) throw error
      setTemplates(l => l.map(x => (x.id === t.id ? { ...x, ...velden } : x)))
    } catch (e) { setFout(e?.message || 'Opslaan mislukt') }
    finally { setBezig(null) }
  }
  const laadIn = async (t) => {
    if (bezig || !onLoad) return
    setBezig(t.id); setFout(null)
    try {
      const w = await haalWeek(t)
      await onLoad(w.week_structure, tNaam(t), { pre_workout_meal: w.pre_workout_meal || null, supplements: w.supplements || [], template_id: t.id })
    } catch (e) { setFout(e?.message || 'Laden mislukt') }
    finally { setBezig(null) }
  }
  // Als concept bij een klant zetten: een kopie die niet actief is. Activeren
  // en de supplementen uit het sjabloon doe je in de Plan Analyzer, met de
  // targets van die klant ernaast.
  const wijsToe = async (t, k) => {
    if (bezig) return
    const sleutel = `${t.id}|${k.id}`
    setBezig(sleutel); setFout(null)
    try {
      const w = await haalWeek(t)
      const { error } = await sb.from('client_meal_plans').insert([{
        client_id: k.id, template_name: tNaam(t), week_structure: w.week_structure, created_via: 'template_copy', is_active: false,
        pre_workout_meal: w.pre_workout_meal || null, template_id: t.id,
        daily_calories: t.daily_calories || null, daily_protein: t.daily_protein || null, daily_carbs: t.daily_carbs || null, daily_fat: t.daily_fat || null,
      }])
      if (error) throw error
      setToegewezen(x => ({ ...x, [sleutel]: true }))
      await laad()
    } catch (e) { setFout(e?.message || 'Toewijzen mislukt') }
    finally { setBezig(null) }
  }
  // Het open plan als template bewaren (zelfde vorm als voorheen in PlanLibraryModal).
  const bewaar = async () => {
    const titel = naamNieuw.trim()
    if (!titel) { setFout('Geef het plan een naam'); return }
    if (!weekData?.length) { setFout('Er is geen plan om op te slaan'); return }
    if (bezig) return
    setBezig('opslaan'); setFout(null)
    try {
      const ws = {}
      weekData.forEach(d => { ws[d.dayId] = { ...d.meals, totals: d.totals, is_training_day: d.is_training_day } })
      const tot = weekData.map(d => d.totals).filter(t => t && (t.kcal || t.calories || t.protein))
      const gem = (key, alt) => (tot.length ? Math.round(tot.reduce((s, t) => s + (t[key] ?? (alt ? t[alt] : 0) ?? 0), 0) / tot.length) : 0)
      const cal = gem('kcal', 'calories'), prot = gem('protein'), carb = gem('carbs'), fat = gem('fat')
      const nu = new Date().toISOString()
      const { error } = await sb.from('meal_plan_templates').insert([{
        coach_id: coachId || null, name: titel, template_name: titel, plan_type: 'full_week', week_structure: ws,
        daily_calories: cal, daily_protein: prot, daily_carbs: carb, daily_fat: fat,
        base_macros: { calories: cal, protein: prot, carbs: carb, fat },
        meals_per_day: Math.max(1, ...weekData.map(d => Object.values(d.meals || {}).filter(Boolean).length)),
        pre_workout_meal: preWorkoutMeal || null,
        supplements: supplementenVoorSjabloon(supplementen, trainingDayKeys),
        emoji: '📅', created_at: nu, updated_at: nu,
      }])
      if (error) throw error
      setOpgeslagen(true); setTimeout(() => setOpgeslagen(false), 2500)
      await laad()
    } catch (e) { setFout(e?.message || 'Opslaan mislukt') }
    finally { setBezig(null) }
  }

  const wit = { minHeight: 34, padding: '0 0.75rem', borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5, ...tik }
  const kaal = { ...wit, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
  const icoonKnop = { width: 36, height: 34, padding: 0, borderRadius: 9, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...tik }
  const UIT = 'rgba(255,255,255,0.4)'
  const grijs = { fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }
  const kopje = { fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '20px 0 8px' }
  const pijl = (open) => <ChevronDown size={16} strokeWidth={2.6} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
  const verschil = (t) => {
    if (!(doelKcal > 0) || !t.daily_calories) return null
    const d = Math.round(t.daily_calories - doelKcal)
    return `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} t.o.v. doel`
  }
  const tabs = [
    { id: 'templates', label: 'Templates', n: templates.filter(t => !t.is_archived).length },
    { id: 'klanten', label: 'Klanten', n: actieveRijen.length },
  ]

  const weekBlok = (t) => {
    const w = weken[t.id]?.week_structure
    if (!w) return <div style={{ ...grijs, padding: '0.6rem 0' }}>Laden…</div>
    return (
      <div style={{ padding: '0.5rem 0 0.7rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DAGEN.map(([id, kort]) => {
          const dag = w[id]
          if (!dag) return null
          const maaltijden = Object.entries(dag).filter(([slot, m]) => slot !== 'totals' && m && typeof m === 'object' && m.name)
            .sort((a, b) => (SLOT_VOLGORDE.indexOf(a[0]) + 99) % 99 - (SLOT_VOLGORDE.indexOf(b[0]) + 99) % 99)
          const kcal = Math.round(dag.totals?.kcal ?? dag.totals?.calories ?? 0)
          return (
            <div key={id}>
              <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#fff' }}>{kort}{kcal > 0 && <span style={{ color: 'rgba(255,255,255,0.5)' }}> · {kcal} kcal</span>}</div>
              <div style={{ ...grijs, lineHeight: 1.4 }}>{maaltijden.map(([, m]) => m.name).join(' · ') || 'Geen maaltijden'}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return createPortal(
    <div role="dialog" aria-label="Voedingsplannen" style={{ position: 'fixed', inset: 0, zIndex: 12000, background: '#0a0a0a', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ flexShrink: 0, width: '100%', maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box', padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 1rem 0' : '1rem 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UtensilsCrossed size={18} color="#fff" />
          <div style={{ flex: 1, minWidth: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Voedingsplannen</div>
          <button onClick={onClose} aria-label="Sluiten" style={icoonKnop}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20, marginTop: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0 0 9px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#fff' : 'transparent'}`, marginBottom: -1, color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', ...tik }}>
              {t.label} <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{t.n}</span>
            </button>
          ))}
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 9, minWidth: isMobile ? '100%' : 240 }}>
            <Search size={14} color="rgba(255,255,255,0.5)" />
            <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder={tab === 'klanten' ? 'Zoek klant of plan…' : 'Zoek plan of kcal…'} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700 }} />
          </label>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box', padding: isMobile ? '0.4rem 1rem calc(2rem + env(safe-area-inset-bottom))' : '0.4rem 1.5rem 2.5rem' }}>
          {fout && <div role="alert" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', padding: '0.6rem 0' }}>{fout}</div>}
          {laden && <div style={{ ...grijs, padding: '1.5rem 0' }}>Laden…</div>}

          {!laden && tab === 'templates' && (<>
            {weekData?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, flexWrap: 'wrap' }}>
                <Bookmark size={15} color="#fff" style={{ flexShrink: 0 }} />
                <input value={naamNieuw} onChange={e => setNaamNieuw(e.target.value)} placeholder="Naam voor dit plan als template" style={{ flex: 1, minWidth: 180, minHeight: 36, boxSizing: 'border-box', padding: '0 0.7rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700 }} />
                <button onClick={bewaar} disabled={!!bezig} style={{ ...kaal, opacity: bezig ? 0.5 : 1 }}>
                  {opgeslagen ? <><Check size={13} strokeWidth={3} /> Opgeslagen</> : bezig === 'opslaan' ? 'Opslaan…' : <>Open plan opslaan als template</>}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 800, color: client ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {client && onLoad ? <>Laden zet het template in het plan van <span className={PRIVE}>{naam(client)}</span>{doelKcal > 0 ? ` (doel ${doelKcal} kcal)` : ''}.</> : 'Toewijzen zet een kopie als concept bij een klant.'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['alle', 'Alle', null], ['man', 'Man', GROEP.man], ['vrouw', 'Vrouw', GROEP.vrouw]].map(([id, label, g]) => (
                  <button key={id} onClick={() => setGroepFilter(id)} aria-pressed={groepFilter === id} style={{ ...kaal, minHeight: 30, padding: '0 0.6rem', ...(groepFilter === id ? { border: `1px solid ${g?.kleur || '#fff'}`, color: g?.kleur || '#fff' } : { color: 'rgba(255,255,255,0.6)' }) }}>
                    {g && <g.Icoon size={13} strokeWidth={2.6} color={g.kleur} />}{label}
                  </button>
                ))}
              </div>
              <button onClick={() => setMetArchief(v => !v)} style={{ ...kaal, minHeight: 30, border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)' }}>
                {metArchief ? 'Archief verbergen' : `Archief tonen (${templates.filter(t => t.is_archived).length})`}
              </button>
            </div>
            {zicht.length === 0 && <div style={{ ...grijs, padding: '1rem 0' }}>Geen template gevonden.</div>}
            {groepen.map(g => (
              <div key={g.id}>
                <div style={kopje}>{g.titel} · {g.lijst.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
                  {g.lijst.map(t => {
                    const bij = actiefBij[t.id] || []
                    const open = openId === t.id
                    const gr = GROEP[t.doelgroep]
                    const GroepIcoon = gr?.Icoon || Mars
                    const foto = t.foto || t.foto2 || foodImageFallback(t.gerecht || tNaam(t), 'dinner', 600)
                    const dv = verschil(t)
                    return (
                      <div key={t.id} style={{ borderRadius: 14, overflow: 'hidden', background: '#141414', opacity: t.is_archived ? 0.55 : 1 }}>
                        <div style={{ position: 'relative', height: 104 }}>
                          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${String(foto).replace(/"/g, '%22')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.94) 100%)' }} />
                          <span style={{ position: 'absolute', top: 8, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 900, color: bij.length > 0 ? GROEN : '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            {gr && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: gr.kleur }}><gr.Icoon size={13} strokeWidth={3} />{gr.label}</span>}
                            {t.is_archived ? 'Archief' : bij.length > 0 ? `Actief bij ${bij.length}` : gebruikt[t.id] ? 'Nergens actief' : 'Nooit gebruikt'}
                            {variatieLabel(t) && <span title={`${variatie[t.id].gerechten} verschillende gerechten in de week`} style={{ color: '#fff', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.5)', textShadow: 'none' }}>{variatieLabel(t)}</span>}
                            {dv && <span style={{ marginLeft: 'auto', color: '#fff' }}>{dv}</span>}
                          </span>
                          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 8, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tNaam(t)}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.daily_calories || '?'} kcal · {t.daily_protein || '?'}E {t.daily_carbs || '?'}K {t.daily_fat || '?'}V{t.meals_per_day ? ` · ${t.meals_per_day} maaltijden` : ''}{gebruikt[t.id] ? ` · ${gebruikt[t.id]}× gebruikt` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 34, padding: '0 6px', background: '#000' }}>
                          {!t.is_archived && client && onLoad && (
                            <button onClick={() => laadIn(t)} disabled={!!bezig} title={`In het plan van ${naam(client)} zetten`} style={{ ...icoonKnop, width: 'auto', padding: '0 8px', gap: 5, color: '#fff', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, opacity: bezig ? 0.5 : 1 }}>
                              <Download size={15} /> {bezig === t.id ? 'Laden…' : 'Laden'}
                            </button>
                          )}
                          {!t.is_archived && (
                            <button onClick={() => { setToewijs(toewijs === t.id ? null : t.id); setToewijsZoek('') }} aria-pressed={toewijs === t.id} title="Als concept bij een klant zetten" style={{ ...icoonKnop, width: 'auto', padding: '0 8px', gap: 5, color: '#fff', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900 }}>
                              <UserPlus size={16} /> Toewijzen
                            </button>
                          )}
                          <span style={{ flex: 1 }} />
                          {!t.is_archived && (
                            <button onClick={() => zet(t, { doelgroep: VOLGENDE_GROEP[t.doelgroep || ''] })} disabled={!!bezig} title={gr ? `Voor: ${gr.label} (tik om te wisselen)` : 'Voor man en vrouw (tik om te kiezen)'} aria-label="Voor man of vrouw" style={{ ...icoonKnop, color: gr ? gr.kleur : UIT }}>
                              <GroepIcoon size={17} strokeWidth={2.6} />
                            </button>
                          )}
                          {!t.is_archived && (
                            <button onClick={() => zet(t, { is_canoniek: !t.is_canoniek })} disabled={!!bezig} title={t.is_canoniek ? 'Niet meer canoniek' : 'Maak canoniek'} aria-label={t.is_canoniek ? 'Niet meer canoniek' : 'Maak canoniek'} style={{ ...icoonKnop, color: t.is_canoniek ? BLAUW : UIT }}>
                              <BadgeCheck size={18} strokeWidth={2.4} />
                            </button>
                          )}
                          {onBewerk && !t.is_archived && <button onClick={() => onBewerk(t)} title="Template aanpassen" aria-label="Template aanpassen" style={icoonKnop}><Pencil size={16} /></button>}
                          <button onClick={() => zet(t, { is_archived: !t.is_archived })} disabled={!!bezig} title={t.is_archived ? 'Terugzetten' : 'Archiveren'} aria-label={t.is_archived ? 'Terugzetten' : 'Archiveren'} style={icoonKnop}>
                            {t.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                          </button>
                          <button onClick={() => klap(t)} title="Bekijk de week" aria-label="Bekijk de week" style={icoonKnop}>{pijl(open)}</button>
                        </div>
                        {toewijs === t.id && (() => {
                          const tz = toewijsZoek.trim().toLowerCase()
                          const lijst = klantRijen.filter(x => (tz ? naam(x.k).toLowerCase().includes(tz) : isActieveKlant(x.k))).slice(0, tz ? 12 : 60)
                          return (
                            <div style={{ padding: '0.6rem 0.8rem 0.7rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                              <input autoFocus value={toewijsZoek} onChange={e => setToewijsZoek(e.target.value)} placeholder="Zoek klant…" style={{ width: '100%', boxSizing: 'border-box', minHeight: 36, padding: '0 0.7rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700 }} />
                              <div style={{ maxHeight: 230, overflowY: 'auto', marginTop: 6 }}>
                                {lijst.length === 0 && <div style={{ ...grijs, padding: '0.5rem 0' }}>Geen klant gevonden.</div>}
                                {lijst.map(x => {
                                  const sleutel = `${t.id}|${x.k.id}`
                                  return (
                                    <div key={x.k.id} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 40 }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={PRIVE} style={{ fontSize: '0.8rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam(x.k)}</div>
                                        <div style={{ ...grijs, fontSize: '0.66rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.actief ? `nu: ${x.actief.template_name || 'plan'}${x.actief.daily_calories ? ` · ${x.actief.daily_calories} kcal` : ''}` : 'geen actief plan'}</div>
                                      </div>
                                      {toegewezen[sleutel]
                                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 900, color: GROEN }}><Check size={13} strokeWidth={3} /> Concept gezet</span>
                                        : <button onClick={() => wijsToe(t, x.k)} disabled={!!bezig} style={{ ...wit, minHeight: 30, padding: '0 0.55rem', fontSize: '0.7rem', opacity: bezig ? 0.5 : 1 }}>{bezig === sleutel ? '…' : 'Als concept'}</button>}
                                      {toegewezen[sleutel] && onOpenKlant && <button onClick={() => onOpenKlant(x.k)} title="Openen in de Plan Analyzer" aria-label="Openen" style={icoonKnop}><ExternalLink size={14} /></button>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}
                        {open && (
                          <div style={{ padding: '0.2rem 0.8rem 0.2rem' }}>
                            {bij.length > 0 && <div className={PRIVE} style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fff', paddingTop: 8 }}>{bij.map(k => naam(k)).join(', ')}</div>}
                            {t.description && <div style={{ ...grijs, paddingTop: 6, lineHeight: 1.4 }}>{t.description}</div>}
                            {weekBlok(t)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>)}

          {!laden && tab === 'klanten' && (<>
            {zichtKlanten.length === 0 && <div style={{ ...grijs, padding: '1rem 0' }}>Geen klant gevonden.</div>}
            {zichtKlanten.map(r => {
              const bron = r.actief ? templates.find(t => t.id === bronVan(r.actief)) : null
              return (
                <div key={r.k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ flex: isMobile ? 1 : '0 0 220px', minWidth: 0 }}>
                    <div className={PRIVE} style={{ fontSize: '0.9rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam(r.k)}</div>
                    {isMobile && <div style={{ fontSize: '0.74rem', fontWeight: 800, color: r.actief ? 'rgba(255,255,255,0.75)' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.actief ? `${r.actief.template_name || 'Plan'}${r.actief.daily_calories ? ` · ${r.actief.daily_calories} kcal` : ''}` : 'Geen actief plan'}</div>}
                  </div>
                  {!isMobile && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 900, color: r.actief ? '#fff' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.actief ? r.actief.template_name || 'Plan' : 'Geen actief plan'}
                        {r.actief?.daily_calories ? <span style={{ color: 'rgba(255,255,255,0.5)' }}> · {r.actief.daily_calories} kcal{r.actief.daily_protein ? ` · ${r.actief.daily_protein} g eiwit` : ''}</span> : null}
                      </div>
                      <div style={grijs}>
                        {r.actief ? `${bron ? `Van template ${tNaam(bron)}` : 'Eigen plan'} · aangepast ${geleden(dagenGeleden(r.actief.updated_at || r.actief.created_at))}` : ''}
                        {r.andere > 0 ? `${r.actief ? ' · ' : ''}${r.andere} ander${r.andere === 1 ? '' : 'e'} plan${r.andere === 1 ? '' : 'nen'}` : ''}
                      </div>
                    </div>
                  )}
                  {onOpenKlant && <button onClick={() => onOpenKlant(r.k)} style={kaal}><ExternalLink size={13} /> Open</button>}
                </div>
              )
            })}
          </>)}
        </div>
      </div>
    </div>,
    document.body
  )
}
