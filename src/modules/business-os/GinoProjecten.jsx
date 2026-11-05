// src/modules/business-os/GinoProjecten.jsx
//
// Projecten van Gino (31 okt 2026), in het paneel boven de bol. Gino maakt een
// project aan (pa-db project-nieuw), onderzoekt in een aparte Slim-ronde op de
// Mac (eigen data + web) en schrijft een plan: fases met stappen per dag en
// KPI's met nulmeting (business_os_projecten). Hier:
//   lijst  → kaarten met voortgangsring en volgende stap
//   detail → KPI's, fases als rijen onder elkaar met stappen als kaartjes (afvinken,
//     tekst aanpassen, verwijderen, toevoegen; opslaan via projectStappen.js) en, bij
//     een fase.test, live cijfers + oordeel (testMeting.js); teksten achter een
//     klik op de rij; onderzoek lezen. Een fase met bord: true is een test en krijgt
//     een horizontale kanban (TestBord.jsx); de rest blijft een rij.
//   "Presenteer" → Gino loopt het plan door met zijn stem (stem.leesVoor):
//     per deel licht dat stuk op, de rest dimt, ondertitel onderin, en
//     vanzelf door naar het volgende deel als hij uitgepraat is.
//   "Plan goedkeuren & inplannen" → content-stappen als content_items
//     (planned), de rest als productivity_tasks; status uitvoering.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Check, Sparkles, FileText, X, Play, Pause, Plus } from 'lucide-react'
import * as stem from './stem'
import { vandaagIso } from './testMeting'
import { hernoemFase, kopieVanPlan, nieuweStapId, schrijfPlan, verplaatsStap, verwijderFase, verwijderStap, voegStapToe, voegTestToe, wijzigStap, wijzigTest, zetFaseTerug, zetStapTerug } from './projectStappen'
import { Cijfer, NieuweStap, OordeelPil, StapInvoer, StapKaart } from './projectKaarten'
import { komma, kortDag } from './testBord.js'
import { useTestMeting } from './useTestMeting'
import TestBord from './TestBord.jsx' // met extensie: macOS ziet testBord.js en TestBord.jsx als dezelfde naam
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const STATUS = { onderzoek: 'Gino onderzoekt', plan: 'Plan klaar', uitvoering: 'Loopt', klaar: 'Klaar', gestopt: 'Gestopt' }
const TEST_TEKSTEN = [['waarom', 'Waarom'], ['hoe', 'Hoe'], ['hoeveel', 'Hoeveel'], ['verwachting', 'Verwachting'], ['meetdatum', 'Meetdatum']]
const stappenVan = (p) => (p?.plan?.fases || []).flatMap(f => f.stappen || [])
const spreekDag = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : '')
const getal = (n) => Number(n || 0).toLocaleString('nl-NL')

// De presentatie: per deel wat Gino zegt en wat er oplicht.
function maakDia(p) {
  const dia = []
  const fases = p.plan?.fases || []
  dia.push({ focus: 'samenvatting', tekst: `${p.titel}. ${p.plan?.samenvatting || ''}` })
  if ((p.kpis || []).length) {
    dia.push({ focus: 'kpis', tekst: `Dit gaan we meten. ${p.kpis.map(k => `${k.naam}: van ${getal(k.nu)} naar ${getal(k.doel)}${k.eenheid ? ` ${k.eenheid}` : ''}`).join('. ')}.` })
  }
  fases.forEach((f, i) => {
    const st = f.stappen || []
    dia.push({
      focus: `fase-${i}`, stappen: st.slice(0, 2).map(x => x.id),
      tekst: `Fase ${i + 1}: ${String(f.naam || '').replace(/^\d+\.\s*/, '')}${f.van && f.tot ? `, van ${spreekDag(f.van)} tot ${spreekDag(f.tot)}` : ''}. ${f.doel ? `${f.doel}. ` : ''}${st[0] ? `Eerst: ${st[0].titel}.` : ''}${st[1] ? ` Daarna: ${st[1].titel}.` : ''}`,
    })
  })
  dia.push({ focus: 'acties', tekst: p.status === 'plan'
    ? 'Klopt dit voor je? Klik dan op plan goedkeuren en inplannen, dan zet ik alles in je agenda en contentkalender. Wil je iets anders, zeg het en ik stuur bij.'
    : 'Dat is het plan. Wil je iets anders, zeg het en ik stuur bij.' })
  return dia
}

function Ring({ deel, grootte = 40, dikte = 3, kind }) {
  const r = grootte / 2 - dikte, omtrek = 2 * Math.PI * r, c = grootte / 2
  const vol = Math.max(0, Math.min(1, deel || 0))
  return (
    <div style={{ position: 'relative', width: grootte, height: grootte, flexShrink: 0 }}>
      <svg width={grootte} height={grootte} style={{ overflow: 'visible' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={dikte} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={G} strokeWidth={dikte} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
          strokeDasharray={omtrek} style={{ '--gp-tot': omtrek * (1 - vol), strokeDashoffset: omtrek * (1 - vol), animation: 'gp-ring 1s ease-out both', filter: vol > 0 ? `drop-shadow(0 0 4px ${G})` : 'none' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kind}</div>
    </div>
  )
}

// Onderzoek in markdown → eenvoudige opmaak (kopjes, pijltjes, vet).
function Onderzoek({ tekst }) {
  return (
    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
      {String(tekst || '').split('\n').map((r, i) => {
        const kop = r.match(/^#{1,4}\s*(.*)/)
        if (kop) return <div key={i} style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '14px 0 4px' }}>{kop[1]}</div>
        if (!r.trim()) return <div key={i} style={{ height: 6 }} />
        const delen = r.replace(/^\s*[-*]\s+/, '→ ').split(/\*\*(.+?)\*\*/g)
        return <div key={i}>{delen.map((d, j) => (j % 2 ? <b key={j} style={{ color: '#fff' }}>{d}</b> : d))}</div>
      })}
    </div>
  )
}

function TestCijfers({ m, isMobile }) {
  const fout = 'fout'
  const mannen = m.geslachtFout || m.leads == null ? fout : m.mannen == null ? 'niet bekend' : komma(m.mannen)
  return (
    <div style={{ ...(isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } : { display: 'flex', flexWrap: 'wrap' }), columnGap: 24, rowGap: 12, marginTop: 12 }}>
      {!m.metIds && m.per10 != null && <Cijfer waarde={komma(m.per10, 1)} label="mannen per 10 posts" />}
      {!m.metIds && m.nulmeting != null && <Cijfer waarde={komma(m.nulmeting, 1)} label="nulmeting" />}
      {m.metIds && m.comments1000 != null && <Cijfer waarde={komma(m.comments1000, 1)} label="comments per 1.000 views" />}
      <Cijfer waarde={m.posts == null ? fout : komma(m.posts)} label={m.postsOud == null ? 'posts' : `posts, ${komma(m.postsOud)} ≥ 7 dagen`} />
      <Cijfer waarde={m.leads == null ? fout : komma(m.leads)} label={m.metIds ? 'leads heel woord' : 'leads'} />
      <Cijfer waarde={mannen} label={m.metIds ? 'mannen heel woord' : 'mannen geschat'} />
      {m.nodig != null && <Cijfer waarde={komma(Math.ceil(m.nodig))} label="posts per week nodig" />}
    </div>
  )
}

// Onder de laatste test: vraagt alleen de naam.
function NieuweTest({ isMobile, onNieuw }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <div style={{ padding: '8px 0', maxWidth: 320 }}>
        <StapInvoer label="Naam van de test" isMobile={isMobile} fontGrootte={18} onKlaar={t => { setOpen(false); if (t) onNieuw(t) }} />
      </div>
    )
  }
  return (
    <button type="button" onClick={() => setOpen(true)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, padding: 0, border: 'none', background: 'none', color: '#fff', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 14, fontWeight: 900,
    }}><Plus size={16} strokeWidth={3} color={G} /> Nieuwe test</button>
  )
}

function FaseRij({ f, fi, doel, vandaag, isMobile, huidig, zetStap, zetStapTekst, nieuweStap, stapWeg, spotStijl, vakRef }) {
  const [open, setOpen] = useState(false)
  const test = f.test && typeof f.test === 'object' ? f.test : null
  const stand = useTestMeting(test, doel)
  const m = test ? stand?.uit || null : null
  const nu = f.van && f.tot && vandaag >= f.van && vandaag <= f.tot
  const datum = f.van && f.tot ? (f.van === f.tot ? kortDag(f.van) : `${kortDag(f.van)} – ${kortDag(f.tot)}`) : kortDag(f.van || f.tot)
  const woorden = Array.isArray(test?.woorden) ? test.woorden.join(', ') : ''
  const sub = [woorden, test?.van && `vanaf ${kortDag(test.van)}`, test?.tot && `tot ${kortDag(test.tot)}`, datum].filter(Boolean).join(' · ')
  const oordeel = !test ? null
    : !stand ? 'Meten…'
      : stand.fout ? 'Meting mislukt'
        : !m ? 'Nog geen data'
          : m.uitslag ? `Besluit · ${m.uitslag}` : m.niveau
  const kanOpen = !!(test || f.doel)
  const stappen = f.stappen || []
  return (
    // Spotlight op de buitenste laag, de intro-animatie binnenin
    // (een animatie met fill 'both' zou de gedimde opacity overschrijven).
    <div ref={vakRef} style={{ minWidth: 0, borderTop: fi ? `1px solid ${colors.borderSubtle}` : 'none', ...spotStijl }}>
      <div style={{ animation: `gp-in .4s ease-out ${fi * 90}ms both`, padding: '16px 0', paddingLeft: nu ? 12 : 0, borderLeft: nu ? `3px solid ${G}` : 'none' }}>
        <button type="button" disabled={!kanOpen} aria-expanded={kanOpen ? open : undefined} onClick={() => setOpen(o => !o)} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: 0, border: 'none', background: 'none', color: '#fff',
          fontFamily: 'inherit', cursor: kanOpen ? 'pointer' : 'default',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 28 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>{f.naam}</div>
              {sub && <div style={{ fontSize: 12, fontWeight: 700, color: nu ? G : 'rgba(255,255,255,0.7)', marginTop: 2 }}>{sub}</div>}
            </div>
            {oordeel && <OordeelPil tekst={oordeel} uitslag={m?.uitslag} />}
            {kanOpen && <ChevronDown size={18} strokeWidth={2.6} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
          </div>
          {m && !(m.posts === 0 && m.leads === 0) && <TestCijfers m={m} isMobile={isMobile} />}
        </button>

        {open && kanOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '120px minmax(0, 720px)', columnGap: 16, rowGap: isMobile ? 4 : 8, marginTop: 12, fontSize: 14, lineHeight: 1.45, animation: 'gp-in .2s ease-out both' }}>
            {f.doel && <Tekstregel label="Doel" tekst={f.doel} isMobile={isMobile} />}
            {test && TEST_TEKSTEN.map(([veld, label]) => <Tekstregel key={veld} label={label} tekst={veld === 'meetdatum' && /^\d{4}-\d{2}-\d{2}$/.test(String(test[veld] || '')) ? kortDag(test[veld]) : test[veld]} isMobile={isMobile} />)}
            {test && <Tekstregel label="Oordeel" tekst="Onder 20 posts test, 20 tot 49 indicatie. Besluit vanaf 50 posts van minstens 7 dagen oud, over minimaal 14 dagen." isMobile={isMobile} />}
            {m?.metIds && <Tekstregel label="Let op" tekst="Leads zijn per woord bekend, niet per post." isMobile={isMobile} />}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: 8, marginTop: 12 }}>
          {stappen.map((s, si) => (
            <StapKaart key={s.id || `plek-${si}`} s={s} vandaag={vandaag} isMobile={isMobile} oplichten={huidig?.stappen?.includes(s.id)}
              onKlaar={() => zetStap(s.id, !s.klaar)} onTekst={t => zetStapTekst(s.id, t)} onWeg={() => stapWeg(fi, si)} />
          ))}
          <NieuweStap isMobile={isMobile} onNieuw={t => nieuweStap(fi, t)} />
        </div>
      </div>
    </div>
  )
}

function Tekstregel({ label, tekst, isMobile }) {
  const waarde = typeof tekst === 'number' ? String(tekst) : typeof tekst === 'string' ? tekst.trim() : ''
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)', paddingTop: isMobile ? 4 : 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: waarde ? '#fff' : 'rgba(255,255,255,0.5)', whiteSpace: 'pre-wrap' }}>{waarde || 'open'}</div>
    </>
  )
}

export default function GinoProjecten({ projectId = null, onKies, onVraag, isMobile = false }) {
  const [lijst, setLijst] = useState(null)
  const [leest, setLeest] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)

  const laad = useCallback(async () => {
    const { data } = await supabase.from('business_os_projecten').select('*').order('updated_at', { ascending: false }).limit(30)
      .then(r => r, () => ({ data: null }))
    if (data) setLijst(data)
  }, [])
  useEffect(() => { laad() }, [laad])
  // Loopt er onderzoek, dan elke 15 s kijken of het plan er al is.
  const wacht = (lijst || []).some(p => p.status === 'onderzoek')
  useEffect(() => {
    if (!wacht) return
    const t = setInterval(laad, 15000)
    return () => clearInterval(t)
  }, [wacht, laad])

  const p = projectId ? (lijst || []).find(x => x.id === projectId) : null
  const vandaag = vandaagIso()

  // ── Presentatie ──
  const dia = useMemo(() => (p && p.status !== 'onderzoek' ? maakDia(p) : []), [p])
  const [dIdx, setDIdx] = useState(null)   // null = niet aan het presenteren
  const [pauze, setPauze] = useState(false)
  const stemStand = stem.useStem()
  const gestart = useRef(null)
  const vakken = useRef({})
  const huidig = dIdx != null ? dia[dIdx] : null
  // Alleen de eigen presentatie stoppen, nooit een lopend antwoord van Gino.
  const stopPresentatie = useCallback(() => {
    if (String(stemStandRef.current?.bron || '').startsWith('presentatie-')) stem.stop()
    gestart.current = null; setDIdx(null); setPauze(false)
  }, [])
  const stemStandRef = useRef(stemStand)
  stemStandRef.current = stemStand
  useEffect(() => () => { if (String(stemStandRef.current?.bron || '').startsWith('presentatie-')) stem.stop() }, [])
  useEffect(() => { stopPresentatie() }, [projectId, stopPresentatie])
  // Deel starten: uitspreken (of, zonder stem, een leestijd) en in beeld schuiven.
  useEffect(() => {
    if (!huidig || pauze) return
    vakken.current[huidig.focus]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const bron = `presentatie-${dIdx}`
    if (stem.beschikbaar()) {
      gestart.current = bron
      stem.leesVoor(huidig.tekst, bron)
      return
    }
    const t = setTimeout(() => setDIdx(i => (i != null && i < dia.length - 1 ? i + 1 : null)), Math.max(4000, huidig.tekst.length * 60))
    return () => clearTimeout(t)
  }, [dIdx, pauze]) // eslint-disable-line react-hooks/exhaustive-deps
  // Uitgepraat → volgend deel.
  useEffect(() => {
    if (dIdx == null || pauze || !gestart.current) return
    if (!stemStand.spreekt && stemStand.bron !== gestart.current) {
      gestart.current = null
      const t = setTimeout(() => setDIdx(i => (i != null && i < dia.length - 1 ? i + 1 : null)), 700)
      return () => clearTimeout(t)
    }
  }, [stemStand, dIdx, pauze, dia.length])
  const naarDia = (i) => { stem.stop(); gestart.current = null; setPauze(false); setDIdx(Math.max(0, Math.min(dia.length - 1, i))) }
  const wisselPauze = () => {
    if (pauze) { setPauze(false); return }
    stem.stop(); gestart.current = null; setPauze(true)
  }
  // Wat er tijdens de presentatie oplicht; de rest dimt.
  const spot = (sleutel) => {
    if (!huidig) return null
    const aan = huidig.focus === sleutel
    return { opacity: aan ? 1 : 0.16, transition: 'opacity .5s, box-shadow .5s', ...(aan ? { boxShadow: `0 0 0 1px ${G}, 0 0 30px ${G}44`, borderRadius: 14 } : {}) }
  }
  const zet = (sleutel) => (el) => { if (el) vakken.current[sleutel] = el }

  // ── Stappen bewerken ──
  // Op het scherm direct zichtbaar; op de achtergrond één voor één opslaan. Wat je
  // ziet = laatste stand uit de database + wat nog onderweg is, dus een mislukte
  // wijziging valt vanzelf terug zonder andere wijzigingen mee te nemen.
  const schrijfRij = useRef(Promise.resolve())
  const onderweg = useRef([])
  const bevestigd = useRef({})
  const [opslaanFout, setOpslaanFout] = useState(0)
  const [weg, setWeg] = useState([])   // zojuist verwijderd, voor Ongedaan maken

  const toonPlan = useCallback((pid) => {
    const plan = kopieVanPlan(bevestigd.current[pid])
    for (const o of onderweg.current) if (o.pid === pid) o.wijzig(plan)
    setLijst(l => l?.map(x => (x.id === pid ? { ...x, plan } : x)))
  }, [])

  const wijzigPlan = (wijzig) => {
    const pid = p.id
    if (!onderweg.current.some(o => o.pid === pid)) bevestigd.current[pid] = p.plan
    const o = { pid, wijzig }
    onderweg.current.push(o)
    toonPlan(pid)
    const klaar = schrijfRij.current.then(async () => {
      const uit = await schrijfPlan(supabase, pid, wijzig).then(r => r, () => ({ ok: false, plan: null }))
      if (uit.plan) bevestigd.current[pid] = uit.plan
      onderweg.current = onderweg.current.filter(x => x !== o)
      toonPlan(pid)
      if (!uit.ok) setOpslaanFout(Date.now())
      return uit.ok
    })
    schrijfRij.current = klaar
    return klaar
  }

  const zetStap = (stapId, klaar) => wijzigPlan(wijzigStap(stapId, { klaar }))
  const zetStapTekst = (stapId, titel) => wijzigPlan(wijzigStap(stapId, { titel }))
  const nieuweStap = (fi, titel, kolom) => wijzigPlan(voegStapToe(
    { fi, naam: p.plan.fases[fi].naam },
    { id: nieuweStapId(), titel, soort: 'taak', klaar: false, ...(kolom ? { kolom } : {}) },
  ))
  const plekVan = (fi) => ({ fi, naam: p.plan.fases[fi].naam })
  const verplaats = (stapId, kolom) => wijzigPlan(verplaatsStap(stapId, kolom))
  const zetTest = (fi, velden) => wijzigPlan(wijzigTest(plekVan(fi), velden))
  const hernoem = (fi, naam) => wijzigPlan(hernoemFase(plekVan(fi), naam))
  const nieuweTest = (naam) => wijzigPlan(voegTestToe(naam))
  const testWeg = async (fi) => {
    const fase = p.plan.fases[fi]
    const item = { pid: p.id, terug: zetFaseTerug({ fase, fi, naNaam: p.plan.fases[fi - 1]?.naam }) }
    setWeg(w => [...w, item])
    if (!await wijzigPlan(verwijderFase(plekVan(fi)))) setWeg(w => w.filter(x => x !== item))
  }
  const stapWeg = async (fi, si) => {
    const fase = p.plan.fases[fi]
    const stap = fase.stappen[si]
    const item = { pid: p.id, terug: zetStapTerug({ plek: { fi, naam: fase.naam }, stap, si, naId: fase.stappen[si - 1]?.id }) }
    setWeg(w => [...w, item])
    if (!await wijzigPlan(verwijderStap(stap.id))) setWeg(w => w.filter(x => x !== item))
  }
  const ongedaanMaken = () => {
    const item = weg.findLast(x => x.pid === p?.id)
    if (!item) return
    setWeg(w => w.filter(x => x !== item))
    wijzigPlan(item.terug)
  }
  useEffect(() => {
    if (!weg.length) return
    const t = setTimeout(() => setWeg([]), 5000)
    return () => clearTimeout(t)
  }, [weg])
  useEffect(() => {
    if (!opslaanFout) return
    const t = setTimeout(() => setOpslaanFout(0), 4000)
    return () => clearTimeout(t)
  }, [opslaanFout])

  const inplannen = async () => {
    if (!p) return
    setBezig(true)
    setMelding(null)
    const { data: { user } } = await supabase.auth.getUser()
    const plan = JSON.parse(JSON.stringify(p.plan || {}))
    let gepland = 0, mis = 0
    for (const f of plan.fases || []) {
      for (const s of f.stappen || []) {
        if (s.gepland_id || s.klaar || !/^\d{4}-\d{2}-\d{2}$/.test(s.dag || '')) continue
        const res = s.soort === 'content'
          ? await supabase.from('content_items').insert({
            coach_id: user.id, title: String(s.titel).slice(0, 200), hook: s.hook || null,
            type: ['reel', 'story', 'post', 'carousel', 'video'].includes(s.type) ? s.type : 'reel',
            status: 'planned', planned_date: s.dag, notes: `Project: ${p.titel}`,
          }).select('id').single().then(r => r, e => ({ error: e }))
          : await supabase.from('productivity_tasks').insert({
            coach_id: user.id, title: String(s.titel).slice(0, 200), description: s.uitleg || `Project: ${p.titel}`,
            scheduled_date: s.dag, category: 'project', status: 'active',
          }).select('id').single().then(r => r, e => ({ error: e }))
        if (res.error) { mis++; continue }
        s.gepland_id = res.data.id
        gepland++
      }
    }
    const { error } = await supabase.from('business_os_projecten')
      .update({ plan, status: 'uitvoering', updated_at: new Date().toISOString() }).eq('id', p.id).then(r => r, e => ({ error: e }))
    setBezig(false)
    setMelding(error ? 'Opslaan mislukt' : `${gepland} stappen ingepland${mis ? `, ${mis} mislukt` : ''}`)
    laad()
  }

  const animaties = (
    <style>{`
      @keyframes gp-ring { from { stroke-dashoffset: 200 } to { stroke-dashoffset: var(--gp-tot) } }
      @keyframes gp-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
      @keyframes gp-radar { to { transform: rotate(360deg) } }
      @keyframes gp-puls { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
      .gp-stap { border: 1px solid rgba(255,255,255,0.12); transition: background .4s, border-color .15s }
      .gp-stap:hover, .gp-stap:focus-within { border-color: rgba(255,255,255,0.28) }
      .gp-stapweg { opacity: 0; transition: opacity .15s }
      .gp-stap:hover .gp-stapweg, .gp-stapweg:focus-visible { opacity: .7 }
      .gp-stapweg:hover { opacity: 1 !important }
      @media (hover: none) { .gp-stapweg { opacity: .7 } }
      .gp-stap.gp-opbord { border-color: transparent }
      .gp-stap.gp-opbord:hover, .gp-stap.gp-opbord:focus-within { border-color: rgba(255,255,255,0.28) }
      .gp-bord { scrollbar-width: none }
      .gp-bord::-webkit-scrollbar { display: none }
      .gp-bordnieuw { color: rgba(255,255,255,0.7); transition: color .15s }
      .gp-bordnieuw:hover { color: #fff }
      .gp-nieuw { border: 1px dashed rgba(255,255,255,0.22); color: rgba(255,255,255,0.7); transition: color .15s, border-color .15s }
      .gp-nieuw:hover { border-color: ${G}; color: #fff }
      .gp-kaart { transition: box-shadow .2s, transform .2s }
      .gp-kaart:hover { box-shadow: 0 0 0 1px ${G}, 0 0 24px ${G}44; transform: translateY(-2px) }
    `}</style>
  )

  if (lijst === null) return null

  // ── Lijst ──
  if (!p) {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }} className="gk-scroll">
        {animaties}
        {!lijst.length && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)', padding: '24px 0' }}>
            Nog geen projecten. Vraag Gino bijvoorbeeld: "maak een contentstrategie om naar 10k te gaan".
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : 300}px, 1fr))`, gap: 16 }}>
          {lijst.map((x, i) => {
            const st = stappenVan(x)
            const klaar = st.filter(s => s.klaar).length
            const volgende = st.filter(s => !s.klaar && s.dag).sort((a, b) => a.dag.localeCompare(b.dag))[0]
            return (
              <button key={x.id} type="button" className="gp-kaart" onClick={() => onKies?.(x.id)} style={{
                textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', color: '#fff', padding: 16, borderRadius: 14,
                border: `1px solid ${G}33`, background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 14, alignItems: 'center',
                animation: `gp-in .35s ease-out ${i * 60}ms both`, opacity: x.status === 'gestopt' ? 0.5 : 1,
              }}>
                {x.status === 'onderzoek'
                  ? <span style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gp-radar 2.4s linear infinite', flexShrink: 0 }} />
                  : <Ring deel={st.length ? klaar / st.length : 0} kind={<span style={{ fontSize: 10.5, fontWeight: 900 }}>{st.length ? Math.round((klaar / st.length) * 100) : 0}%</span>} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>{x.titel}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: x.status === 'onderzoek' ? G : 'rgba(255,255,255,0.55)', marginTop: 3, animation: x.status === 'onderzoek' ? 'gp-puls 1.6s ease-in-out infinite' : 'none' }}>
                    {STATUS[x.status]}{volgende && x.status === 'uitvoering' ? ` · volgende: ${kortDag(volgende.dag)} ${volgende.titel}` : ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Detail ──
  const fases = p.plan?.fases || []
  const laatsteBord = fases.reduce((n, f, i) => (f.bord === true ? i : n), -1)
  const st = stappenVan(p)
  const klaar = st.filter(s => s.klaar).length
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {animaties}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingBottom: 12 }}>
        <button type="button" onClick={() => { setLeest(false); onKies?.(null) }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px 0 8px', borderRadius: 999,
          border: `1px solid ${G}66`, background: `${G}14`, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, flexShrink: 0,
        }}><ChevronLeft size={16} strokeWidth={2.6} /> Projecten</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{p.titel}</div>
          <div title={p.doel} style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.doel}</div>
        </div>
        {st.length > 0 && <Ring deel={klaar / st.length} grootte={44} kind={<span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{klaar}/{st.length}</span>} />}
      </div>

      {p.status === 'onderzoek' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${G}55` }} />
            <span style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: `1px dashed ${G}88`, animation: 'gp-radar 6s linear infinite reverse' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, ${G}55, transparent 25%)`, animation: 'gp-radar 2.4s linear infinite' }} />
            <span style={{ position: 'absolute', inset: 52, borderRadius: '50%', background: G, boxShadow: `0 0 18px ${G}` }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', animation: 'gp-puls 1.8s ease-in-out infinite' }}>Gino onderzoekt je data en het web en schrijft het plan…</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Meestal 5–15 minuten. Je mag dit sluiten.</div>
        </div>
      ) : (
        <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {p.plan?.samenvatting && (
            <div ref={zet('samenvatting')} style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 14, maxWidth: 900, padding: huidig ? 8 : 0, ...spot('samenvatting') }}>{p.plan.samenvatting}</div>
          )}
          {/* KPI's */}
          {(p.kpis || []).length > 0 && (
            <div ref={zet('kpis')} style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 16, padding: huidig ? 8 : 0, ...spot('kpis') }}>
              {p.kpis.map((k, i) => {
                const nu = Number(k.nu) || 0, doel = Number(k.doel) || 0
                return (
                  <div key={i} title={k.meet || undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `gp-in .35s ease-out ${i * 70}ms both` }}>
                    <Ring deel={doel ? nu / doel : 0} grootte={36} kind={null} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>{k.naam}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                        {nu.toLocaleString('nl-NL')} → <span style={{ color: G }}>{doel.toLocaleString('nl-NL')}</span> {k.eenheid || ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Fases als rijen onder elkaar */}
          <div>
            {fases.map((f, fi) => {
              const gedeeld = {
                f, fi, doel: p.kpis?.[0]?.doel, vandaag, isMobile, huidig, zetStap, zetStapTekst, nieuweStap, stapWeg,
                spotStijl: spot(`fase-${fi}`), vakRef: zet(`fase-${fi}`),
              }
              return (
                <Fragment key={f.bord === true ? `bord-${f.naam}` : fi}>
                  {f.bord === true
                    ? <TestBord {...gedeeld} verplaats={verplaats} zetTest={zetTest} hernoem={hernoem} verwijder={testWeg} />
                    : <FaseRij {...gedeeld} />}
                  {fi === laatsteBord && <NieuweTest isMobile={isMobile} onNieuw={nieuweTest} />}
                </Fragment>
              )
            })}
            {/* Laatste test verwijderd: blijf er een kunnen maken. */}
            {!fases.length && <NieuweTest isMobile={isMobile} onNieuw={nieuweTest} />}
          </div>
        </div>
      )}

      {/* Stap verwijderd of opslaan mislukt */}
      {(opslaanFout > 0 || weg.some(x => x.pid === p.id)) && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, zIndex: 20, display: 'flex', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
          {opslaanFout > 0 && (
            <span role="alert" style={{ ...balkStijl, border: `1.5px solid ${colors.danger}`, display: 'inline-flex', alignItems: 'center' }}>Opslaan mislukt</span>
          )}
          {weg.some(x => x.pid === p.id) && (
            <button type="button" onClick={ongedaanMaken} style={{ ...balkStijl, border: `1.5px solid ${G}`, cursor: 'pointer', fontFamily: 'inherit', pointerEvents: 'auto' }}>Ongedaan maken</button>
          )}
        </div>
      )}

      {/* Presentatie: ondertitel + bediening */}
      {huidig && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, flexShrink: 0, animation: 'gp-in .3s ease-out both' }}>
          <span style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px solid ${G}`, background: `radial-gradient(circle, ${G}66 0%, ${G}14 55%, rgba(0,0,0,.6) 72%)`, boxShadow: `0 0 10px ${G}88`, animation: stemStand.spreekt ? 'gp-puls .5s ease-in-out infinite' : 'none' }} />
            <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px dashed ${G}66`, animation: 'gp-radar 6s linear infinite' }} />
          </span>
          <div key={dIdx} style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.4, animation: 'gp-in .3s ease-out both', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{huidig.tekst}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {dia.map((_, i) => <span key={i} onClick={() => naarDia(i)} style={{ width: i === dIdx ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer', background: i === dIdx ? G : i < dIdx ? `${G}77` : 'rgba(255,255,255,0.2)', transition: 'width .3s' }} />)}
          </div>
          <button type="button" onClick={() => naarDia(dIdx - 1)} disabled={dIdx === 0} aria-label="Vorige" style={bedien}><ChevronLeft size={16} strokeWidth={2.6} /></button>
          <button type="button" onClick={wisselPauze} aria-label={pauze ? 'Verder' : 'Pauze'} style={{ ...bedien, background: `${G}22`, borderColor: G }}>{pauze ? <Play size={15} strokeWidth={2.6} /> : <Pause size={15} strokeWidth={2.6} />}</button>
          <button type="button" onClick={() => (dIdx < dia.length - 1 ? naarDia(dIdx + 1) : stopPresentatie())} aria-label="Volgende" style={bedien}><ChevronRight size={16} strokeWidth={2.6} /></button>
          <button type="button" onClick={stopPresentatie} aria-label="Stoppen" style={bedien}><X size={15} strokeWidth={2.6} /></button>
        </div>
      )}

      {/* Acties */}
      {p.status !== 'onderzoek' && !huidig && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { stem.ontgrendel(); naarDia(0) }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', borderRadius: 999,
            border: `1px solid ${G}`, background: 'transparent', color: G, fontFamily: 'inherit', fontSize: 13, fontWeight: 900, cursor: 'pointer',
          }}><Play size={14} strokeWidth={2.8} /> Presenteer</button>
          {p.status === 'plan' && (
            <button type="button" disabled={bezig} onClick={inplannen} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', borderRadius: 999, border: 'none',
              background: G, color: '#000', fontFamily: 'inherit', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 0 18px ${G}66`,
            }}><Check size={15} strokeWidth={3} /> {bezig ? 'Bezig…' : 'Plan goedkeuren & inplannen'}</button>
          )}
          {p.onderzoek && (
            <button type="button" className="gk-link" onClick={() => setLeest(true)} style={linkStijl}><FileText size={13} /> Onderzoek lezen</button>
          )}
          <button type="button" className="gk-link" style={{ ...linkStijl, color: G, opacity: 1 }}
            onClick={() => onVraag?.(`Laten we het project "${p.titel}" bijsturen. Kijk naar de voortgang en de KPI's en zeg wat je zou veranderen.`)}>
            <Sparkles size={13} /> Bijsturen met Gino
          </button>
          {melding && <span style={{ fontSize: 12.5, fontWeight: 800, color: G }}>{melding}</span>}
        </div>
      )}

      {/* Onderzoek lezen */}
      {leest && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.96)', border: `1px solid ${G}33`, borderRadius: 16,
          padding: isMobile ? 14 : 22, display: 'flex', flexDirection: 'column', animation: 'gp-in .25s ease-out both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#fff' }}>Onderzoek · {p.titel}</div>
            <button type="button" onClick={() => setLeest(false)} aria-label="Sluiten" style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </div>
          <div className="gk-scroll" style={{ flex: 1, overflowY: 'auto', maxWidth: 860 }}><Onderzoek tekst={p.onderzoek} /></div>
        </div>
      )}
    </div>
  )
}

const balkStijl = {
  height: 44, padding: '0 18px', borderRadius: 999, background: '#000', color: '#fff', fontSize: 13, fontWeight: 900, boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
}
const bedien = {
  width: 30, height: 30, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
}
const linkStijl = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 0', border: 'none', background: 'none',
  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'inherit', color: '#fff', opacity: 0.75,
}
