// src/modules/lead-management/components/WeekStatsModal.jsx
// Week-level stats overlay. Same metrics as the daily bar but aggregated
// over Mon–Sun, with arrow buttons to step backward/forward through
// previous weeks. Mounts via portal so it sits above the kanban board.

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import {
  X, ChevronLeft, ChevronRight, ChevronDown, Calendar, Zap, TrendingUp, Info,
  MessageCircle, Users, Phone, Trophy, Activity, BarChart3, PhoneCall,
  Send, FileText, Percent, UserX, Eye, Download, LineChart as LineChartIcon,
  RotateCcw, Target, Save, UserPlus, CalendarCheck, Euro, Wallet, PhoneOff, XCircle, Check, Ban, Trash2,
  Table as TableIcon, Filter, Gift,
} from 'lucide-react'
import { exportStatsPDF } from '../utils/exportStatsPDF'
import CallProposalsModal from './CallProposalsModal'
import { Venster, VensterKop, VensterVoet, Knop } from '../../../components/arc-ui'
import GrowthChart from './GrowthChart'
import ChallengePaneel from './ChallengePaneel'
import { KPI_STATS, kpiTargetFor, kpiColor, fmtTarget } from '../kpiConfig'

const GOLD = '#FFD700'
const GOLD_DARK = '#D4AF37'

// Monday-anchored start of the week containing `date`.
const mondayOf = (date) => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// yyyy-mm-dd op lokale datumdelen. Niet via toISOString(): die geeft de
// UTC-datum en levert hier 's avonds de dag ervoor op.
const isoDatum = (d) => {
  const x = new Date(d)
  const mm = String(x.getMonth() + 1).padStart(2, '0')
  const dd = String(x.getDate()).padStart(2, '0')
  return `${x.getFullYear()}-${mm}-${dd}`
}

// Keuzes in de periode-dropdown. 'custom' staat achteraan: de vaste periodes
// gebruik je dagelijks, een eigen bereik is het uitzonderingsgeval.
const PERIODE_OPTIES = [
  { id: 'day', label: 'Dag' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Maand' },
  { id: 'quarter', label: 'Kwartaal' },
  { id: 'year', label: 'Jaar' },
  { id: 'custom', label: 'Handmatig' },
]

// Eerste dag van het kwartaal waar deze datum in valt.
const kwartaalStart = (d) => {
  const x = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
  x.setHours(0, 0, 0, 0)
  return x
}
const kwartaalNr = (d) => Math.floor(d.getMonth() / 3) + 1

// Het venster van i periodes terug. Voor maanden, kwartalen en jaren kan dat
// niet met een vaste lengte: augustus heeft 31 dagen en februari 28, dus
// steeds hetzelfde aantal dagen aftrekken laat de kolommen wegdrijven.
const vensterTerug = (mode, start, end, i) => {
  const kopie = (d) => new Date(d.getTime())
  if (mode === 'month' || mode === 'quarter' || mode === 'year') {
    const stap = mode === 'month' ? 1 : mode === 'quarter' ? 3 : 12
    const s2 = kopie(start); s2.setMonth(s2.getMonth() - stap * i)
    const e2 = kopie(start); e2.setMonth(e2.getMonth() - stap * (i - 1))
    return { start: s2, end: e2 }
  }
  // Dag, week en eigen periode hebben wél een vaste lengte.
  const lengte = end - start
  return { start: new Date(start.getTime() - lengte * i), end: new Date(start.getTime() - lengte * (i - 1)) }
}

const sundayOf = (mondayDate) => {
  const d = new Date(mondayDate)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Percentage tonen, of "—" als er geen noemer is. Bewust op module-niveau:
// SourceRow staat buiten de hoofdcomponent en kan niet bij de pct1 daarbinnen.
const toonPct = (v) => (v == null ? '—' : `${v}%`)

const fmtDay = (date) => date.toLocaleDateString('nl-NL', {
  weekday: 'long', day: 'numeric', month: 'short',
})
// Whole-number percentage with safe divide-by-zero. Returns null when the
// denominator is 0 so the UI can show "—" instead of 0% (which would suggest
// a real 0% conversion rather than "no data yet").
const pct = (num, den) => {
  if (!den || den <= 0) return null
  return Math.round((num / den) * 100)
}

export default function WeekStatsModal({ isOpen, onClose, leadService, coachId, isMobile: propMobile, onTargetsSaved }) {
  const modalHost = useModalHost()
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  // periodMode bepaalt het venster rond anchorDate: dag, week (ma→zo), maand,
  // kwartaal, jaar, of een zelfgekozen periode ('custom', dan tellen de twee
  // datumvelden en doet anchorDate niet mee).
  const [periodMode, setPeriodMode] = useState('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  // Handmatige periode. Start op deze maand, zodat er meteen iets staat als je
  // 'm kiest in plaats van een leeg scherm.
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(1)
    return isoDatum(d)
  })
  const [customEnd, setCustomEnd] = useState(() => isoDatum(new Date()))
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [sourceBreakdown, setSourceBreakdown] = useState(null)
  // All-time campagne-breakdown (los van de periode) — campagnes op bestaande
  // volgers vallen buiten de nieuwe-leads-bron-breakdown, dus apart geladen.
  const [campaignBreakdown, setCampaignBreakdown] = useState(null)
  const [reactionStats, setReactionStats] = useState(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [callProposals, setCallProposals] = useState([])
  const [avgBeforeCall, setAvgBeforeCall] = useState(null)
  // Wat er in deze periode aan geld binnenkwam, naast de verkochte
  // orderwaarde. Zie getRangeCashCollected voor het verschil.
  const [cash, setCash] = useState(null)
  // 'tegels' = de bestaande rijen met iconen, 'tabel' = alles onder elkaar met
  // de vorige periode ernaast (zelfde idee als de historie in de oefening-log).
  const [weergave, setWeergave] = useState('tegels')
  // Opgeslagen stat-selecties. Gedeeld met het team, dus Marcel ziet dezelfde
  // presets. keuze = null betekent alles tonen.
  const [presets, setPresets] = useState([])
  const [presetId, setPresetId] = useState(null)
  const [keuze, setKeuze] = useState(null)
  const [kiezerOpen, setKiezerOpen] = useState(false)
  const [presetNaam, setPresetNaam] = useState('')
  const [presetBezig, setPresetBezig] = useState(false)
  // Cijfers van eerdere, even lange periodes (index 1 = de vorige, 2 =
  // daarvoor, enz.). Alleen geladen in tabelweergave.
  const [historie, setHistorie] = useState({})
  const [historieBezig, setHistorieBezig] = useState(false)
  const [aantalTerug, setAantalTerug] = useState(6)
  // Bump om de stats opnieuw te laden na het terugdraaien van een verplaatsing.
  const [reloadKey, setReloadKey] = useState(0)
  // Welke rij staat op het punt teruggedraaid of verwijderd te worden.
  // Shape: { item, statLabel }
  const [bevestig, setBevestig] = useState(null)
  const [revertingId, setRevertingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  // PDF-preview: { url, filename } zodra de export klaar is; null = geen preview.
  const [pdfPreview, setPdfPreview] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  // KPI-doelen: paneel open/dicht, geladen map + bewerkbaar concept + saving-flag.
  const [showKpi, setShowKpi] = useState(false)
  const [kpiTargets, setKpiTargets] = useState({})
  const [kpiDraft, setKpiDraft] = useState({})
  const [kpiSaving, setKpiSaving] = useState(false)
  // Revenue/cashflow-paneel.
  // Iedereen (owner + teamleden) ziet omzet. De payout-tab is wél kijker-
  // afhankelijk: de owner ziet "Marcel ontvangt / jij houdt" + Betaald-knoppen,
  // een teamlid (Marcel) ziet "jij ontvangt" + alleen-lezen status.
  const [isOwner, setIsOwner] = useState(true)
  const [showRevenue, setShowRevenue] = useState(false)
  const [revTab, setRevTab] = useState('omzet') // 'omzet' | 'payout'
  const [revenue, setRevenue] = useState(null)
  const [revLoading, setRevLoading] = useState(false)
  // Partner-uitbetaling (bv. Marcel): per maand wat er open staat + betaald-knop.
  const [payouts, setPayouts] = useState(null)
  const [payoutBusy, setPayoutBusy] = useState(null) // period-key die nu update
  // Staat de lijst met losse ontvangsten van deze maand open?
  const [ontvangstenOpen, setOntvangstenOpen] = useState(false)
  const partnerName = (() => {
    try { return localStorage.getItem('lead_partner_name') || 'Marcel' } catch { return 'Marcel' }
  })()
  // Vaste lasten die eerst van de omzet af gaan vóór de verdeling (instelbaar).
  const fixedCosts = (() => {
    try { const v = Number(localStorage.getItem('lead_fixed_costs')); return Number.isFinite(v) && v > 0 ? v : 250 } catch { return 250 }
  })()
  // Call-voorstellen rapport (verstuurde berichten + welke geslaagd zijn).
  const [showCallProposals, setShowCallProposals] = useState(false)
  // Man/vrouw-verdeling over alle leads (niet periode-gebonden).
  const [gender, setGender] = useState(null)
  useEffect(() => {
    if (!isOpen || !coachId || !leadService?.getGenderBreakdown) return
    let alive = true
    leadService.getGenderBreakdown(coachId).then(g => { if (alive) setGender(g) })
    return () => { alive = false }
  }, [isOpen, coachId, leadService])
  // Welke funnel-stap staat open in de drill-down (voor terugdraaien/verwijderen).
  const [drillStage, setDrillStage] = useState(null)
  // Welke onderste secties (grafiek/calls/campagnes/bron/verplaatsingen) open
  // staan — bediend via de vierkante tab-vakjes op één rij.
  const [openTabs, setOpenTabs] = useState({})
  const toggleTab = (k) => setOpenTabs(p => ({ ...p, [k]: !p[k] }))

  // Preview-blob-URL opruimen wanneer 'ie sluit of de modal ontmount.
  useEffect(() => () => { if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url) }, [pdfPreview])

  // KPI-doelen laden zodra de modal opent.
  useEffect(() => {
    if (!isOpen || !coachId || !leadService?.getKpiTargets) return
    let alive = true
    leadService.getKpiTargets(coachId).then(m => { if (alive) setKpiTargets(m || {}) })
    return () => { alive = false }
  }, [isOpen, coachId, leadService])

  // Team-rol laden: bepaalt of de payout-tab de owner-weergave toont.
  useEffect(() => {
    if (!isOpen || !leadService?.getMyTeamRole) return
    let alive = true
    leadService.getMyTeamRole().then(role => { if (alive) setIsOwner(role !== 'member') })
    return () => { alive = false }
  }, [isOpen, leadService])

  const openKpiPanel = () => {
    const draft = {}
    KPI_STATS.forEach(st => {
      const t = kpiTargets[st.key] || {}
      draft[st.key] = {
        day: t.day != null ? String(t.day) : '',
        week: t.week != null ? String(t.week) : '',
      }
    })
    setKpiDraft(draft)
    setShowKpi(true)
  }

  const setKpiField = (key, period, value) => {
    // Alleen cijfers toestaan (leeg = doel wissen).
    const clean = value.replace(/[^0-9]/g, '')
    setKpiDraft(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [period]: clean } }))
  }

  const loadPayouts = async () => {
    try {
      if (!leadService?.getPartnerPayouts) return
      const p = await leadService.getPartnerPayouts(coachId, 5, 6, fixedCosts)
      setPayouts(p)
    } catch (e) {
      console.error('Partner-uitbetaling laden mislukt:', e)
      setPayouts(null)
    }
  }

  const openRevenuePanel = async () => {
    setShowRevenue(true)
    setRevTab('omzet')
    setRevLoading(true)
    try {
      const [r] = await Promise.all([
        leadService.getRevenueProjection(coachId, 12),
        loadPayouts(),
      ])
      setRevenue(r)
    } catch (e) {
      console.error('Revenue laden mislukt:', e)
      setRevenue(null)
    } finally {
      setRevLoading(false)
    }
  }

  const settleMonth = async (m) => {
    if (!m || payoutBusy) return
    setPayoutBusy(m.key)
    try {
      if (m.settled) await leadService.unsettlePartnerMonth(coachId, m.key)
      else await leadService.settlePartnerMonth(coachId, m.key, m.owed)
      await loadPayouts()
    } catch (e) {
      console.error('Uitbetaling bijwerken mislukt:', e)
    } finally {
      setPayoutBusy(null)
    }
  }

  const saveKpiPanel = async () => {
    if (kpiSaving) return
    setKpiSaving(true)
    const rows = KPI_STATS.map(st => ({
      stat_key: st.key,
      day_target: kpiDraft[st.key]?.day ?? '',
      week_target: kpiDraft[st.key]?.week ?? '',
    }))
    try {
      const { error } = await leadService.saveKpiTargets(coachId, rows)
      if (error) throw error
      const fresh = await leadService.getKpiTargets(coachId)
      setKpiTargets(fresh || {})
      setShowKpi(false)
      if (onTargetsSaved) onTargetsSaved()
    } catch (e) {
      console.error('KPI opslaan mislukt:', e)
    } finally {
      setKpiSaving(false)
    }
  }

  // Draai één funnel-verplaatsing terug (soft): verdwijnt uit de stats, lead
  // blijft op het bord staan. Daarna herladen we de cijfers.
  const handleRevertMovement = async (movementId) => {
    if (!movementId || !leadService?.revertMovement) return
    setRevertingId(movementId)
    try {
      const res = await leadService.revertMovement(movementId, true)
      if (res?.success) setReloadKey(k => k + 1)
    } catch (e) {
      console.error('Terugdraaien mislukt:', e)
    } finally {
      setRevertingId(null)
    }
  }

  const handleDeleteMovement = async (movementId) => {
    if (!movementId || !leadService?.deleteMovement) return
    setDeletingId(movementId)
    try {
      const res = await leadService.deleteMovement(movementId)
      if (res?.success) setReloadKey(k => k + 1)
    } catch (e) {
      console.error('Verwijderen mislukt:', e)
    } finally {
      setDeletingId(null)
    }
  }

  // Resolve the [start, end) window once per render based on the mode.
  const { start, end } = (() => {
    if (periodMode === 'day') {
      const s = new Date(anchorDate); s.setHours(0, 0, 0, 0)
      const e = new Date(s); e.setDate(e.getDate() + 1)
      return { start: s, end: e }
    }
    if (periodMode === 'month') {
      const s = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
      s.setHours(0, 0, 0, 0)
      const e = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1)
      e.setHours(0, 0, 0, 0)
      return { start: s, end: e }
    }
    if (periodMode === 'quarter') {
      const s = kwartaalStart(anchorDate)
      const e = new Date(s); e.setMonth(e.getMonth() + 3)
      return { start: s, end: e }
    }
    if (periodMode === 'year') {
      const s = new Date(anchorDate.getFullYear(), 0, 1); s.setHours(0, 0, 0, 0)
      const e = new Date(anchorDate.getFullYear() + 1, 0, 1); e.setHours(0, 0, 0, 0)
      return { start: s, end: e }
    }
    if (periodMode === 'custom') {
      const s = new Date(`${customStart}T00:00:00`)
      // De einddatum telt mee: kies je 1 t/m 30 sep, dan hoort 30 sep erbij.
      // Het venster is [start, end), dus een dag erbij.
      const e = new Date(`${customEnd}T00:00:00`); e.setDate(e.getDate() + 1)
      // Datums omgedraaid ingevuld? Draai ze om in plaats van een leeg scherm
      // te tonen.
      if (isNaN(s) || isNaN(e)) return { start: mondayOf(anchorDate), end: new Date(mondayOf(anchorDate).getTime() + 7 * 864e5) }
      return s <= e ? { start: s, end: e } : { start: e, end: s }
    }
    const s = mondayOf(anchorDate)
    const e = new Date(s); e.setDate(e.getDate() + 7)
    return { start: s, end: e }
  })()

  useEffect(() => {
    if (!isOpen) return
    if (!leadService || !coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        // Growth chart always shows a wider context window so the coach
        // can spot trends. We take max(period, 30 days) ending at the
        // period's end, so Day view still gets a meaningful trend line.
        const chartEnd = new Date(end)
        const chartStart = new Date(end)
        chartStart.setDate(chartStart.getDate() - Math.max(30, Math.ceil((end - start) / 86400000)))

        const [a, f, srcs, rxn, ts, props, avgB] = await Promise.all([
          leadService.getRangeActivity(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeFunnelStats(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeLeadSources
            ? leadService.getRangeLeadSources(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
          leadService.getRangeReactionStats
            ? leadService.getRangeReactionStats(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
          leadService.getDailyTimeSeries
            ? leadService.getDailyTimeSeries(coachId, chartStart.toISOString(), chartEnd.toISOString())
            : Promise.resolve([]),
          leadService.getRangeCallProposals
            ? leadService.getRangeCallProposals(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve([]),
          leadService.getRangeAvgFollowupsBeforeCall
            ? leadService.getRangeAvgFollowupsBeforeCall(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
        ])
        const geld = leadService.getRangeCashCollected
          ? await leadService.getRangeCashCollected(coachId, start.toISOString(), end.toISOString())
          : null
        if (!cancelled) {
          setActivity(a); setFunnel(f); setSourceBreakdown(srcs); setReactionStats(rxn)
          setTimeSeries(ts || [])
          setCallProposals(props || [])
          setAvgBeforeCall(avgB)
          setCash(geld)
        }
      } catch (e) {
        console.error('WeekStatsModal load failed:', e)
        if (!cancelled) {
          setActivity(null); setFunnel(null); setSourceBreakdown(null); setReactionStats(null)
          setCash(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leadService, coachId, periodMode, +start, +end, reloadKey])

  // Presets laden zodra de tabel voor het eerst opengaat, en de laatst
  // gekozen preset terugzetten (die keuze is wel persoonlijk).
  useEffect(() => {
    if (!isOpen || weergave !== 'tabel' || !leadService?.getStatPresets) return
    let cancelled = false
    leadService.getStatPresets().then(lijst => {
      if (cancelled) return
      setPresets(lijst)
      let laatste = null
      try { laatste = localStorage.getItem('myarc_stat_preset') } catch { /* geen opslag */ }
      const gevonden = lijst.find(p2 => p2.id === laatste)
      if (gevonden) { setPresetId(gevonden.id); setKeuze(gevonden.keys); setPresetNaam(gevonden.naam) }
    })
    return () => { cancelled = true }
  }, [isOpen, weergave, leadService])

  const kiesPreset = (p2) => {
    setPresetId(p2?.id || null)
    setKeuze(p2 ? p2.keys : null)
    setPresetNaam(p2?.naam || '')
    try {
      if (p2?.id) localStorage.setItem('myarc_stat_preset', p2.id)
      else localStorage.removeItem('myarc_stat_preset')
    } catch { /* geen opslag */ }
  }

  const bewaarPreset = async (alsNieuw = false) => {
    if (!leadService?.saveStatPreset) return
    setPresetBezig(true)
    const res = await leadService.saveStatPreset({
      id: alsNieuw ? null : presetId,
      naam: presetNaam,
      keys: keuze || kerncijfers({}).map(r => r.key),
    })
    if (res?.ok) {
      const lijst = await leadService.getStatPresets()
      setPresets(lijst)
      const bewaard = lijst.find(p2 => p2.id === res.id)
      if (bewaard) kiesPreset(bewaard)
    }
    setPresetBezig(false)
  }

  const wisPreset = async () => {
    if (!presetId || !leadService?.deleteStatPreset) return
    setPresetBezig(true)
    await leadService.deleteStatPreset(presetId)
    const lijst = await leadService.getStatPresets()
    setPresets(lijst)
    kiesPreset(null)
    setPresetBezig(false)
  }

  // Eerdere periodes: even lange vensters, steeds een stap verder terug.
  //
  // Eén periode tegelijk, niet alles tegelijk: bij maanden en kwartalen zijn
  // het zware queries en dan stond je naar een lege tabel te kijken tot alles
  // binnen was — of liep het hele blok stuk op één fout en kwam er nooit meer
  // een kolom bij. Nu verschijnt elke kolom zodra die klaar is, en een fout
  // stopt alleen de rest van de rij.
  const historieRef = useRef({ sleutel: null, data: {} })
  const bezigRef = useRef(false)
  const periodeSleutel = `${periodMode}|${+start}|${+end}|${reloadKey}`

  useEffect(() => {
    if (!isOpen || weergave !== 'tabel') return
    if (!leadService || !coachId) return
    let gestopt = false

    const laad = async () => {
      if (bezigRef.current) return
      // Andere periode in beeld? Begin met een schone lei.
      if (historieRef.current.sleutel !== periodeSleutel) {
        historieRef.current = { sleutel: periodeSleutel, data: {} }
        setHistorie({})
      }
      bezigRef.current = true
      setHistorieBezig(true)
      for (let i = 1; i <= aantalTerug; i++) {
        if (gestopt) break
        if (historieRef.current.data[i]) continue
        try {
          const { start: vStart, end: vEnd } = vensterTerug(periodMode, start, end, i)
          const [a2, f2, rxn2, geld2] = await Promise.all([
            leadService.getRangeActivity(coachId, vStart.toISOString(), vEnd.toISOString()),
            leadService.getRangeFunnelStats(coachId, vStart.toISOString(), vEnd.toISOString()),
            leadService.getRangeReactionStats
              ? leadService.getRangeReactionStats(coachId, vStart.toISOString(), vEnd.toISOString())
              : Promise.resolve(null),
            leadService.getRangeCashCollected
              ? leadService.getRangeCashCollected(coachId, vStart.toISOString(), vEnd.toISOString())
              : Promise.resolve(null),
          ])
          if (gestopt || historieRef.current.sleutel !== periodeSleutel) break
          historieRef.current.data = {
            ...historieRef.current.data,
            [i]: { activity: a2, funnel: f2, reactionStats: rxn2, cash: geld2, start: vStart, end: vEnd },
          }
          setHistorie(historieRef.current.data)
        } catch (e) {
          console.warn('Periode laden mislukt:', i, e?.message)
          break
        }
      }
      bezigRef.current = false
      if (!gestopt) setHistorieBezig(false)
    }

    laad()
    return () => { gestopt = true; bezigRef.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, weergave, leadService, coachId, periodeSleutel, aantalTerug])

  // Van periode wisselen? Dan begint het tellen weer bij zes terug.
  useEffect(() => {
    setAantalTerug(6)
  }, [periodeSleutel])

  // Campagne-breakdown is all-time → alleen laden bij openen / reload, niet bij
  // periode-navigatie (scheelt onnodige queries).
  useEffect(() => {
    if (!isOpen || !leadService || !coachId) return
    if (!leadService.getCampaignBreakdown) return
    let cancelled = false
    leadService.getCampaignBreakdown(coachId)
      .then(cb => { if (!cancelled) setCampaignBreakdown(cb) })
      .catch(() => { if (!cancelled) setCampaignBreakdown(null) })
    return () => { cancelled = true }
  }, [isOpen, leadService, coachId, reloadKey])

  if (!isOpen) return null

  // Eén stap vooruit of achteruit. Bij een handmatige periode heeft "vorige"
  // geen betekenis — dan staan de pijlen uit.
  const isCustom = periodMode === 'custom'
  const schuifPeriode = (richting) => {
    if (isCustom) return
    const next = new Date(anchorDate)
    if (periodMode === 'month') next.setMonth(next.getMonth() + richting)
    else if (periodMode === 'quarter') next.setMonth(next.getMonth() + 3 * richting)
    else if (periodMode === 'year') next.setFullYear(next.getFullYear() + richting)
    else next.setDate(anchorDate.getDate() + (periodMode === 'day' ? 1 : 7) * richting)
    setAnchorDate(next)
  }
  const goPrev = () => schuifPeriode(-1)
  const goNext = () => schuifPeriode(1)
  const goToday = () => setAnchorDate(new Date())

  const nu = new Date()
  // Valt vandaag binnen het getoonde venster? Dat werkt voor elke periode —
  // ook voor kwartaal, jaar en een handmatig bereik — en scheelt een ternary
  // per periodesoort.
  const isCurrentPeriod = nu >= start && nu < end
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0)
  // De volgende-pijl uit zodra het venster al voorbij vandaag loopt. Bij een
  // handmatige periode is er geen volgende, dus daar staat hij sowieso uit.
  const isFuturePeriod = isCustom || start.getTime() > todayMidnight.getTime()

  // Wat er in de kop staat. Stond als drie geneste ternary's op vier plekken;
  // met zes periodesoorten wordt dat onleesbaar, dus één keer hier.
  const periodeWoord = { day: 'dag', week: 'week', month: 'maand', quarter: 'kwartaal', year: 'jaar', custom: 'periode' }[periodMode]
  const periodeMeervoud = { day: 'dagen', week: 'weken', month: 'maanden', quarter: 'kwartalen', year: 'jaren', custom: 'periodes' }[periodMode]
  const dagKort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const laatsteDag = new Date(end.getTime() - 864e5)   // end is exclusief
  const periodeTitel = (() => {
    if (isCustom) return 'Eigen periode'
    if (periodMode === 'day') return isCurrentPeriod ? 'Vandaag' : fmtDay(anchorDate).split(' ').slice(0, -2).join(' ')
    if (periodMode === 'month') return `${anchorDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}${isCurrentPeriod ? ' · Deze maand' : ''}`
    if (periodMode === 'quarter') return `Q${kwartaalNr(anchorDate)} ${anchorDate.getFullYear()}${isCurrentPeriod ? ' · Dit kwartaal' : ''}`
    if (periodMode === 'year') return `${anchorDate.getFullYear()}${isCurrentPeriod ? ' · Dit jaar' : ''}`
    return `Week ${isoWeek(mondayOf(anchorDate))}${isCurrentPeriod ? ' · Deze week' : ''}`
  })()
  const periodeBereik = periodMode === 'day'
    ? fmtDay(anchorDate)
    : `${dagKort(start)} – ${dagKort(laatsteDag)}${periodMode === 'year' || periodMode === 'custom' ? ` ${laatsteDag.getFullYear()}` : ''}`

  const totalReplies = funnel?.replied?.count || 0
  const totalConvs = funnel?.conversation?.count || 0
  const totalCallProposed = funnel?.callProposed?.count || 0
  const totalCalls = funnel?.callScheduled?.count || 0
  const totalSales = funnel?.sale?.count || 0
  const totalNoShows = funnel?.noShow?.count || 0
  // No-show wordt berekend over AFGEHANDELDE calls (gevoerd + no-show), niet
  // over ingeplande — een no-show hoort vaak bij een call die in een vorige
  // maand werd ingepland, wat anders >100% of negatieve rates gaf.
  const callsHeld = funnel?.callHeld?.count || 0
  const handledCalls = callsHeld + totalNoShows

  // Reactie-stats — uses the lead-card counters as the source of truth:
  //   reply_count   > 0  → lead reacted (Reactie-knop)
  //   followup_count > 0 → coach had to chase (= no reply yet)
  // newLeads here is "leads created in the window" (per call_leads.created_at),
  // which differs from activity.newOutreach (movement-based).
  const newLeadsInPeriod   = reactionStats?.newLeads        ?? 0
  const reactedLeads       = reactionStats?.reactedLeads    ?? 0
  const notReactedLeads    = reactionStats?.notReactedYet   ?? 0
  const followedLeads      = reactionStats?.followedLeads   ?? 0
  const followupsInWindow  = reactionStats?.followupsInWindow ?? 0

  const responseRate = pct(reactedLeads, newLeadsInPeriod)
  // What share of leads needed a chase to get any reply at all.
  const chaseShare   = pct(followedLeads, newLeadsInPeriod)

  // Huidige waarde per KPI-stat (voor de doelen-preview in het paneel). Zelfde
  // bronnen als de stats-bar, zodat de getallen 1-op-1 overeenkomen.
  const kpiValues = {
    nieuw:       newLeadsInPeriod,
    reacties:    reactionStats?.reactionEventsInWindow ?? reactionStats?.reactionsInWindow ?? reactedLeads ?? 0,
    voorgesteld: totalCallProposed,
    ingepland:   totalCalls,
    sales:       totalSales,
    omzet:       Math.round(funnel?.sale?.omzet || 0),
  }

  // Twee strakke stat-rijen (aantallen + percentages), in de stijl van de
  // stats-bar — geen vakjes meer.
  // Close rate = sales / gevoerde calls (Sale + Sale verloren), niet ingeplande.
  const proposedToScheduled = totalCallProposed > 0 ? Math.round((totalCalls / totalCallProposed) * 100) : null

  // De trechter als keten: reactie → voorstel → ingepland → show-up → close.
  // Elke stap deelt door de stap ervoor, zodat je ziet wáár je leads weglekken.
  //
  // Reactie→voorstel deelt door dezelfde Reacties-teller die in de rij
  // hierboven staat, zodat de som op het scherm klopt: 3 van 102.
  //
  // Eerst stond hier funnel.replied — dat telt leads die je naar een
  // "gereageerd"-kolom versleept, en die kolom gebruik je niet. Uitkomst was
  // "3 van 0" en een streepje. Let op de keerzijde: de Reacties-teller telt
  // reactie-momenten, dus twee reacties van dezelfde lead tellen dubbel. Dit
  // percentage leest daarom als "reacties die tot een voorstel leidden", niet
  // als "leads die reageerden".
  const reactiesInPeriode = reactionStats?.reactionEventsInWindow
    ?? reactionStats?.reactionsInWindow ?? reactedLeads ?? 0
  const repliedToProposed = reactiesInPeriode > 0
    ? Math.round((totalCallProposed / reactiesInPeriode) * 100)
    : null

  // Ingepland→show-up deelt door de calls die in deze periode STONDEN
  // (callBooked, op call-datum), niet door wat je in deze periode inplande:
  // een call die je vandaag boekt voor volgende maand kan nu nog niemand
  // opdagen. Beide kanten op call-datum, dus dit kan nooit boven 100 komen.
  const callsBooked = funnel?.callBooked?.count || 0
  const scheduledToShow = callsBooked > 0
    ? Math.round((callsHeld / callsBooked) * 100)
    : null
  const noShowRate = handledCalls > 0 ? Math.round((totalNoShows / handledCalls) * 100) : null
  const closeRate = callsHeld > 0 ? Math.round((totalSales / callsHeld) * 100) : null
  const pct1 = (v) => (v == null ? '—' : `${v}%`)
  const STAGE_ACCENT = { callProposed: '#a855f7', callScheduled: '#06b6d4', callBooked: '#6366f1', callHeld: '#10b981', sale: '#10b981', noShow: '#f97316', callRejected: '#f97316', saleLost: '#ef4444', notSuitable: '#64748b' }
  const frac = (a, b) => `${a} van ${b}`
  const countItems = [
    { label: 'Nieuwe leads', value: newLeadsInPeriod,          Icon: UserPlus,      color: '#3b82f6', info: 'Nieuwe leads die in deze periode zijn binnengekomen (op aanmaakdatum).' },
    { label: 'Follow-ups',   value: activity?.followUps ?? 0,  Icon: Send,          color: '#f59e0b', info: 'Aantal opvolg-berichten dat je hebt gestuurd in deze periode.' },
    { label: 'Reacties',     value: kpiValues.reacties,        Icon: MessageCircle, color: '#10b981', info: 'Aantal keer dat een lead reageerde (elke reactie-klik telt).' },
    { label: 'Voorgesteld',  value: totalCallProposed,         Icon: PhoneCall,     color: '#a855f7', stage: 'callProposed', info: 'Leads die je een call hebt voorgesteld (naar de "Call voorgesteld"-kolom verplaatst). Klik voor de lijst.' },
    { label: 'Ingepland',    value: totalCalls,                Icon: CalendarCheck, color: '#06b6d4', stage: 'callScheduled', info: 'Leads die je IN deze periode naar "Sales Call" verplaatste — geteld op de dag dat je inplande, dus de call zelf kan later vallen. Klik voor de lijst.' },
    { label: 'Calls gepland', value: funnel?.callBooked?.count ?? 0, Icon: Calendar, color: '#6366f1', stage: 'callBooked', info: 'Het totaal aantal calls dat VOOR deze periode staat: elke call waarvan de call-datum erin valt, of die nu gevoerd is, no-show of nog open. Dit is je week-agenda. Klik voor de lijst.' },
    { label: 'Call gevoerd', value: funnel?.callHeld?.count ?? 0, Icon: Phone,      color: '#10b981', stage: 'callHeld', info: 'Ingeplande calls die je écht hebt gevoerd (afgehandeld als sale of sale verloren), geteld op de call-datum. Klik voor de lijst.' },
    { label: 'Sales',        value: totalSales,                Icon: Trophy,        color: '#FFD700', stage: 'sale', info: 'Gewonnen deals (naar een "Sale"-kolom verplaatst). Klik voor de lijst.' },
    { label: 'Orderwaarde',  value: '€' + Math.round(funnel?.sale?.omzet || 0).toLocaleString('nl-NL'), Icon: Euro, color: '#FFD700', info: 'Wat je deze periode hebt verkocht: de volledige orderwaarde van elke sale, geteld op de dag van de sale. Bij termijnen of een reservering staat hier de hele deal, ook al komt het geld later.' },
    { label: 'Binnengekomen', value: cash ? '€' + Math.round(cash.bedrag).toLocaleString('nl-NL') : '—', Icon: Wallet, color: '#22c55e', info: 'Wat er deze periode aan geld binnenkwam: aanbetalingen, restbetalingen en maandtermijnen waarvan de betaaldatum is verstreken. Let op — dit is het betaalschema, niet een bevestigde incasso. Er is geen koppeling met de bank, dus het zegt dat de afgesproken datum geweest is.' + (cash?.verwacht ? ` Er staat nog €${Math.round(cash.verwacht).toLocaleString('nl-NL')} open in deze periode.` : '') },
    { label: 'No-shows',     value: totalNoShows,              Icon: UserX,         color: '#ef4444', stage: 'noShow', info: 'Ingeplande calls waarbij de lead niet kwam opdagen, geteld op de call-datum. Klik voor de lijst.' },
    { label: 'Afgewezen',    value: funnel?.callRejected?.count ?? 0, Icon: PhoneOff, color: '#f97316', stage: 'callRejected', info: 'Leads die het call-voorstel afwezen (naar "Call afgewezen"). Klik voor de reden-verdeling.' },
    { label: 'Sale verloren', value: funnel?.saleLost?.count ?? 0, Icon: XCircle, color: '#ef4444', stage: 'saleLost', info: 'Gevoerde calls die niet in een sale eindigden. Klik voor de objectie-verdeling.' },
    { label: 'Niet geschikt', value: funnel?.notSuitable?.count ?? 0, Icon: Ban, color: '#64748b', stage: 'notSuitable', info: 'Leads die je als geen goede fit hebt gemarkeerd (naar "Niet geschikt"). Klik voor de lijst.' },
  ]
  // Eerst de trechter op volgorde — reactie → voorstel → ingepland → show-up →
  // close — daarna de losse stats. Zo lees je van links naar rechts waar je
  // leads weglekken, in plaats van vier percentages door elkaar.
  const pctItems = [
    { label: 'Reactie→voorstel', value: pct1(repliedToProposed), Icon: MessageCircle, color: '#10b981', sub: frac(totalCallProposed, reactiesInPeriode), info: 'Van de reacties deze periode, hoeveel % er een call-voorstel uit kwam. Deelt door dezelfde Reacties-teller als hierboven; die telt reactie-momenten, dus twee reacties van dezelfde lead tellen als twee.' },
    { label: 'Voorstel→call', value: pct1(proposedToScheduled), Icon: PhoneCall,     color: '#a855f7', sub: frac(totalCalls, totalCallProposed),    info: 'Van de leads aan wie je een call voorstelde, hoeveel % ook echt een call inplande.' },
    { label: 'Call→show-up',  value: pct1(scheduledToShow),     Icon: CalendarCheck, color: '#06b6d4', sub: frac(callsHeld, callsBooked),           info: 'Van de calls die in deze periode stonden, hoeveel % er ook echt kwam opdagen. Beide kanten op de call-datum, dus een call die je nu boekt voor volgende maand telt hier nog niet mee.' },
    { label: 'Show→close',    value: pct1(closeRate),           Icon: Trophy,        color: '#22c55e', sub: frac(totalSales, callsHeld),            info: 'Van de gevoerde calls, hoeveel % je sloot als sale.' },
    { label: 'Response',      value: pct1(responseRate),        Icon: MessageCircle, color: '#3b82f6', sub: frac(reactedLeads, newLeadsInPeriod),   info: 'Van de nieuwe leads deze periode, hoeveel % er reageerde.' },
    { label: 'Opvolg',        value: pct1(chaseShare),          Icon: Send,          color: '#f59e0b', sub: frac(followedLeads, newLeadsInPeriod),   info: 'Van de nieuwe leads, hoeveel % je moest opvolgen (follow-up nodig had).' },
    { label: 'No-show',       value: pct1(noShowRate),          Icon: UserX,         color: '#ef4444', sub: frac(totalNoShows, handledCalls),       info: 'Van de afgehandelde calls (gevoerd + no-show), hoeveel % niet kwam opdagen.' },
  ]

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483450,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'calc(100vw - 32px)',
          maxWidth: isMobile ? '100%' : 1400,
          height: isMobile ? '92vh' : 'calc(100vh - 48px)',
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.18)',
          borderRadius: isMobile ? '16px 16px 0 0' : 14,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header — titel, Dag/Week/Maand én de actie-knoppen op één regel */}
        <div style={{
          flexShrink: 0,
          padding: isMobile ? 'calc(0.6rem + env(safe-area-inset-top)) 0.75rem 0.6rem' : '0.7rem 1rem',
          display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.5)',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          <BarChart3 size={16} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ flexShrink: 0, color: '#fff', fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Stats
          </div>
          {/* Periode-keuze. Was een segment-rij met drie knoppen; met zes
              periodes past dat niet meer op een telefoon, en een dropdown
              houdt de kop rustig. */}
          <select
            value={periodMode}
            onChange={(e) => setPeriodMode(e.target.value)}
            style={{
              flexShrink: 0, marginLeft: 4, minHeight: 32,
              padding: isMobile ? '0 1.6rem 0 0.6rem' : '0 1.8rem 0 0.8rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: '#fff', fontSize: isMobile ? '0.74rem' : '0.78rem', fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none',
              // Eigen pijltje: zonder appearance:none tekent Safari een grijze
              // knop die niet bij de rest past.
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path d=\'M1 1l4 4 4-4\' stroke=\'rgba(255,255,255,0.5)\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `right ${isMobile ? '0.5rem' : '0.6rem'} center`,
            }}
          >
            {PERIODE_OPTIES.map(o => (
              <option key={o.id} value={o.id} style={{ background: '#0a0a0a', color: '#fff' }}>{o.label}</option>
            ))}
          </select>

          {/* Datumvelden, alleen bij een handmatige periode. Beide datums
              tellen mee — kies je 1 t/m 30 sep, dan hoort 30 sep erbij. */}
          {periodMode === 'custom' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {[[customStart, setCustomStart], [customEnd, setCustomEnd]].map(([waarde, zet], i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {i === 1 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>–</span>}
                  <input
                    type="date" value={waarde} max={isoDatum(new Date())}
                    onChange={(e) => zet(e.target.value)}
                    style={{
                      minHeight: 32, padding: '0 0.5rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#fff', fontSize: isMobile ? '0.7rem' : '0.74rem', fontWeight: 700,
                      fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
                    }}
                  />
                </span>
              ))}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 8 }} />
          <button
            onClick={openRevenuePanel}
            title="Terugkerende omzet & cashflow"
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: '#22c55e', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <TrendingUp size={16} />
          </button>
          <button
            onClick={openKpiPanel}
            disabled={loading}
            title="KPI-doelen instellen (dag/week)"
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: GOLD, opacity: loading ? 0.4 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Target size={16} />
          </button>
          <button
            onClick={async () => {
              if (pdfBusy || loading) return
              setPdfBusy(true)
              try {
                // Zelfde kop als in de modal, zodat de PDF laat zien over
                // welke periode je kijkt — ook bij kwartaal, jaar of handmatig.
                const periodLabel = periodMode === 'day'
                  ? fmtDay(anchorDate)
                  : `${periodeTitel} · ${periodeBereik}`
                // De PDF gebruikt EXACT dezelfde item-arrays als de modal, zodat
                // getallen 1-op-1 kloppen en de simpele inline-stijl matcht.
                const res = await exportStatsPDF({
                  periodLabel,
                  generatedAt: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }),
                  countItems: countItems.map(i => ({ label: i.label, value: i.value, color: i.color })),
                  pctItems: pctItems.map(i => ({ label: i.label, value: i.value, color: i.color, sub: i.sub })),
                  gender,
                  campaignBreakdown,
                })
                if (res?.url) setPdfPreview({ url: res.url, filename: res.filename })
              } catch (e) {
                console.error('PDF-export mislukt:', e)
              } finally {
                setPdfBusy(false)
              }
            }}
            disabled={loading || pdfBusy}
            title={pdfBusy ? 'Bezig…' : 'Download als PDF'}
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: 'rgba(255,255,255,0.7)',
              opacity: (loading || pdfBusy) ? 0.4 : 1,
              cursor: (loading || pdfBusy) ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Download size={16} />
          </button>
          <button onClick={onClose} title="Sluiten" style={{
            width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Period navigator */}
        <div style={{
          flexShrink: 0, padding: '0.55rem 0.85rem 0.7rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button onClick={goPrev} disabled={isCustom} title={`Vorige ${periodeWoord}`} style={{ ...navBtn, opacity: isCustom ? 0.3 : 1, cursor: isCustom ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {periodeTitel}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>
              {periodeBereik}
            </div>
          </div>
          <button onClick={goNext} title={`Volgende ${periodeWoord}`} disabled={isFuturePeriod} style={{ ...navBtn, opacity: isFuturePeriod ? 0.3 : 1, cursor: isFuturePeriod ? 'not-allowed' : 'pointer' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '0.85rem',
        }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Laden…
            </div>
          )}

          {!loading && activity && (
            <>
              {/* Schakelaar tussen de tegels en een tabel met de vorige
                  periode ernaast. */}
              <div style={{
                position: 'relative', display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 999, padding: 3, marginBottom: '0.7rem',
              }}>
                <div style={{
                  position: 'absolute', top: 3, bottom: 3,
                  left: weergave === 'tabel' ? 'calc(50% + 1.5px)' : 3,
                  width: 'calc(50% - 4.5px)',
                  background: '#fff', borderRadius: 999,
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                {[
                  { id: 'tegels', label: 'Tegels', Icon: BarChart3 },
                  { id: 'tabel', label: 'Tabel', Icon: TableIcon },
                ].map(k => {
                  const aan = weergave === k.id
                  return (
                    <button
                      key={k.id}
                      onClick={() => setWeergave(k.id)}
                      style={{
                        position: 'relative', zIndex: 1, flex: 1, minHeight: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'transparent', border: 'none', borderRadius: 999,
                        color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.72rem', fontWeight: aan ? 900 : 800,
                        fontFamily: 'inherit', cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <k.Icon size={13} strokeWidth={2.6} />
                      {k.label}
                    </button>
                  )
                })}
              </div>

              {weergave === 'tabel' ? (
                <>
                  <SectionTitle icon={<TableIcon size={13} color={GOLD} />} title={`Alles op een rij · elke ${periodeWoord} vergeleken met nu`} />

                  {/* Presets: klik er een aan om alleen die stats te zien. De
                      lijst is gedeeld, dus Marcel ziet dezelfde. */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '0.6rem', alignItems: 'center' }}>
                    {[{ id: null, naam: 'Alles' }, ...presets].map(p2 => {
                      const aan = (p2.id || null) === presetId
                      return (
                        <button
                          key={p2.id || 'alles'}
                          onClick={() => kiesPreset(p2.id ? p2 : null)}
                          style={{
                            fontSize: '0.66rem', fontWeight: 800,
                            padding: '4px 10px', borderRadius: 999,
                            background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                            color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {p2.naam}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setKiezerOpen(v => !v)}
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '0.66rem', fontWeight: 800,
                        padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.75)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Filter size={11} strokeWidth={2.6} />
                      Stats kiezen
                      <ChevronDown size={11} strokeWidth={2.8} style={{ transform: kiezerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>
                  </div>

                  {kiezerOpen && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '0.6rem 0.7rem', marginBottom: '0.7rem',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '2px 10px' }}>
                        {kerncijfers({}).map(r => {
                          const aan = !keuze || keuze.includes(r.key)
                          return (
                            <button
                              key={r.key}
                              onClick={() => {
                                const basis = keuze || kerncijfers({}).map(x => x.key)
                                const nieuweKeuze = aan ? basis.filter(k => k !== r.key) : [...basis, r.key]
                                setKeuze(nieuweKeuze)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '5px 2px', background: 'transparent', border: 'none',
                                color: aan ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '0.7rem', fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', fontFamily: 'inherit',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              }}
                            >
                              <span style={{
                                width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                                background: aan ? '#fff' : 'transparent',
                                border: `1.5px solid ${aan ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {aan && <Check size={10} strokeWidth={3.5} color="#0a0a0a" />}
                              </span>
                              {r.label}
                            </button>
                          )
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => setKeuze(null)}
                          style={{ fontSize: '0.63rem', fontWeight: 800, padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Alles aan
                        </button>
                        <button
                          onClick={() => setKeuze([])}
                          style={{ fontSize: '0.63rem', fontWeight: 800, padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Alles uit
                        </button>
                        <input
                          value={presetNaam}
                          onChange={(e) => setPresetNaam(e.target.value)}
                          placeholder="Naam van de preset"
                          style={{
                            flex: 1, minWidth: 120, padding: '5px 9px', borderRadius: 7,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff', fontSize: '0.66rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
                          }}
                        />
                        {presetId && (
                          <button
                            onClick={() => bewaarPreset(false)}
                            disabled={presetBezig}
                            style={{ fontSize: '0.63rem', fontWeight: 900, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: presetBezig ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                          >
                            Bijwerken
                          </button>
                        )}
                        <button
                          onClick={() => bewaarPreset(true)}
                          disabled={presetBezig || !presetNaam.trim()}
                          style={{ fontSize: '0.63rem', fontWeight: 900, padding: '5px 10px', borderRadius: 7, background: presetNaam.trim() ? '#fff' : 'rgba(255,255,255,0.15)', border: 'none', color: presetNaam.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.4)', cursor: presetBezig ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                        >
                          Opslaan als nieuw
                        </button>
                        {presetId && (
                          <button
                            onClick={wisPreset}
                            disabled={presetBezig}
                            style={{ fontSize: '0.63rem', fontWeight: 800, padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', cursor: presetBezig ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                          >
                            Verwijderen
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <StatTabel
                    rijen={kerncijfers({ activity, funnel, reactionStats, cash }).filter(r => !keuze || keuze.includes(r.key))}
                    kolommen={Object.keys(historie)
                      .map(Number)
                      .sort((a2, b2) => a2 - b2)
                      .map(i => ({
                        id: i,
                        ...periodeKop(historie[i].start, historie[i].end, periodMode),
                        map: Object.fromEntries(kerncijfers(historie[i]).map(r => [r.key, r.waarde])),
                      }))}
                    bezig={historieBezig}
                    nuKop={periodeKop(start, end, periodMode)}
                  />

                  {/* Verder terug kijken: zes periodes per klik erbij. */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 0.9rem' }}>
                    <button
                      onClick={() => setAantalTerug(n => n + 6)}
                      style={{
                        fontSize: '0.66rem', fontWeight: 800,
                        padding: '5px 12px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.65)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Verder terug
                    </button>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                      {Object.keys(historie).length} {periodeMeervoud}
                      {historieBezig ? ' · laden…' : ''}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Aantallen — strakke rij zoals de stats-bar (klik funnel-stap
                      voor de drill-down met terugdraaien/verwijderen). */}
                  <SectionTitle icon={<BarChart3 size={13} color={GOLD} />} title="Aantallen" />
                  <StatFlow items={countItems} activeStage={drillStage} onToggle={(st) => setDrillStage(prev => prev === st ? null : st)} />
                  {drillStage && (
                    <DrillPanel
                      leads={funnel?.[drillStage]?.leads}
                      accent={STAGE_ACCENT[drillStage]}
                      reasons={drillStage === 'callRejected' ? funnel?.callRejected?.reasons : drillStage === 'saleLost' ? funnel?.saleLost?.reasons : null}
                      onVraag={setBevestig} revertingId={revertingId} deletingId={deletingId}
                      statLabel={countItems.find(it => it.stage === drillStage)?.label || ''}
                    />
                  )}

                  {/* Percentages — tweede strakke rij. */}
                  <SectionTitle icon={<Percent size={13} color={GOLD} />} title="Percentages" />
                  <StatFlow items={pctItems} activeStage={null} onToggle={() => {}} />
                </>
              )}

              {/* Man/vrouw-verdeling — ring over alle leads (niet periode-gebonden). */}
              {gender && gender.known > 0 && (
                <>
                  <SectionTitle icon={<Users size={13} color="#ec4899" />} title="Man / Vrouw (alle leads)" />
                  <GenderRing gender={gender} />
                </>
              )}

              {/* Call-voorstellen — laad alle verstuurde berichten + welke geslaagd. */}
              <button
                onClick={() => setShowCallProposals(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  margin: '0.9rem 0 0.2rem', padding: '0.7rem 0.85rem', borderRadius: 11,
                  background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.4)',
                  color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <PhoneCall size={16} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>Call-voorstel berichten</div>
                  <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                    Bekijk verstuurde berichten, welke geslaagd zijn & hergebruik ze
                  </div>
                </div>
                <ChevronRight size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
              </button>

              {/* ─── Vierkante tab-vakjes op één rij — klik opent de sectie eronder ─── */}
              {(() => {
                const tabs = [
                  { key: 'grafiek',        label: 'Grafiek',     Icon: LineChartIcon, show: timeSeries && timeSeries.length > 0 },
                  { key: 'calls',          label: 'Calls',       Icon: PhoneCall,     show: callProposals && callProposals.length > 0 },
                  { key: 'campagnes',      label: 'Campagnes',   Icon: Send,          show: campaignBreakdown && campaignBreakdown.campaigns.length > 0 },
                  { key: 'bron',           label: 'Bron',        Icon: FileText,      show: sourceBreakdown && (sourceBreakdown.campaigns.length > 0 || sourceBreakdown.magnets.length > 0 || sourceBreakdown.noSource.total > 0) },
                  { key: 'verplaatsingen', label: 'Verplaats.',  Icon: Calendar,      show: activity.movementsList && activity.movementsList.length > 0 },
                ].filter(t => t.show)
                if (!tabs.length) return null
                return (
                  <div style={{ display: 'flex', gap: isMobile ? 6 : 8, margin: '0.9rem 0 0.5rem' }}>
                    {tabs.map(t => {
                      const on = !!openTabs[t.key]
                      return (
                        <button key={t.key} onClick={() => toggleTab(t.key)}
                          style={{
                            flex: '1 1 0', minWidth: 0, aspectRatio: '1 / 1', maxWidth: isMobile ? 'none' : 108,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: on ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${on ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}>
                          <t.Icon size={isMobile ? 18 : 21} color={on ? GOLD : 'rgba(255,255,255,0.55)'} strokeWidth={2.2} />
                          <span style={{ fontSize: isMobile ? '0.5rem' : '0.58rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, color: on ? GOLD : 'rgba(255,255,255,0.6)' }}>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Grafiek */}
              {openTabs.grafiek && timeSeries && timeSeries.length > 0 && (
                <>
                  <SectionTitle icon={<LineChartIcon size={13} color={GOLD} />} title={`Groei (${timeSeries.length}-daagse trend)`} />
                  <div style={{
                    padding: '0.75rem 0.85rem 0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    marginBottom: '0.85rem',
                  }}>
                    <GrowthChart data={timeSeries} isMobile={isMobile} />
                  </div>
                </>
              )}

              {/* Call-voorstellen — exact wat ik gestuurd heb + uitkomst */}
              {openTabs.calls && callProposals && callProposals.length > 0 && (
                <>
                  <SectionTitle icon={<PhoneCall size={13} color={GOLD} />} title={`Call-voorstellen (${callProposals.length})`} />
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 5,
                    marginBottom: '0.85rem',
                  }}>
                    {callProposals.map(p => (
                      <div key={p.id} style={{
                        padding: '0.55rem 0.7rem',
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: `3px solid ${p.outcome.color}`,
                        borderRadius: 7,
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          marginBottom: 4,
                        }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, color: '#fff',
                          }}>
                            {p.lead_name}
                          </span>
                          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>
                            · {new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{
                            marginLeft: 'auto',
                            padding: '1px 6px',
                            background: `${p.outcome.color}1a`,
                            border: `1px solid ${p.outcome.color}55`,
                            borderRadius: 999,
                            color: p.outcome.color,
                            fontSize: '0.55rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {p.outcome.label}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)',
                          lineHeight: 1.4, whiteSpace: 'pre-wrap',
                          display: '-webkit-box', WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {p.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Campagnes — all-time, ongeacht de periode. Per campagne de
                  Aantallen + Percentages in de top-modal-stijl (StatFlow). */}
              {openTabs.campagnes && campaignBreakdown && campaignBreakdown.campaigns.length > 0 && (
                <>
                  <SectionTitle icon={<Send size={13} color="#a855f7" />} title={`Campagnes · ${campaignBreakdown.totalLeads} getagd (alle tijd)`} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    {campaignBreakdown.campaigns.map(c => (
                      <CampaignStatCard
                        key={c.id}
                        campaign={c}
                        isMobile={isMobile}
                        onVraag={setBevestig} revertingId={revertingId} deletingId={deletingId}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Source breakdown — which campaigns / magnets brought leads in */}
              {openTabs.bron && sourceBreakdown && (sourceBreakdown.campaigns.length > 0 || sourceBreakdown.magnets.length > 0 || sourceBreakdown.noSource.total > 0) && (
                <>
                  <SectionTitle icon={<Send size={13} color={GOLD} />} title={`Bron-breakdown · ${sourceBreakdown.totalLeads} nieuwe leads`} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {sourceBreakdown.campaigns.map(c => (
                      <SourceRow key={c.id} icon={<Send size={12} color={GOLD} />} label={c.name} total={c.total} reached={c.reached} stages={c.stages} followupCount={c.followupCount} repliedLeads={c.repliedLeads} followedLeads={c.followedLeads} messageText={c.messageText} platform={c.platform} purpose={c.purpose} />
                    ))}
                    {sourceBreakdown.magnets.map(m => (
                      <SourceRow key={m.id} icon={<FileText size={12} color="#3b82f6" />} label={m.name} total={m.total} reached={m.reached} stages={m.stages} followupCount={m.followupCount} repliedLeads={m.repliedLeads} followedLeads={m.followedLeads} description={m.description} accent="#3b82f6" />
                    ))}
                    {sourceBreakdown.noSource.total > 0 && (
                      <SourceRow icon={<X size={12} color="rgba(255,255,255,0.4)" />} label="Geen bron toegewezen" total={sourceBreakdown.noSource.total} reached={sourceBreakdown.noSource.reached} stages={sourceBreakdown.noSource.stages} followupCount={sourceBreakdown.noSource.followupCount} repliedLeads={sourceBreakdown.noSource.repliedLeads} followedLeads={sourceBreakdown.noSource.followedLeads} accent="rgba(255,255,255,0.4)" muted />
                    )}
                  </div>
                </>
              )}

              {/* Recent movements list */}
              {openTabs.verplaatsingen && activity.movementsList && activity.movementsList.length > 0 && (
                <>
                  <SectionTitle icon={<Calendar size={13} color={GOLD} />} title={`Verplaatsingen (${activity.movementsList.length})`} />
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {activity.movementsList.slice(0, 30).map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        borderBottom: i === Math.min(29, activity.movementsList.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.75rem',
                      }}>
                        <span style={{ flex: 1, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.leadName}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>
                          {m.from} → <span style={{ color: GOLD }}>{m.to}</span>
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', minWidth: 70, textAlign: 'right' }}>
                          {m.time}
                        </span>
                      </div>
                    ))}
                    {activity.movementsList.length > 30 && (
                      <div style={{
                        padding: '0.5rem 0.65rem', textAlign: 'center',
                        color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem',
                      }}>
                        +{activity.movementsList.length - 30} meer…
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isCurrentPeriod && (
                <div style={{ marginTop: '0.85rem' }}>
                  <button onClick={goToday} style={{
                    width: '100%', minHeight: 42, padding: '0 0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: 'rgba(255,215,0,0.1)',
                    border: `1px solid rgba(255,215,0,0.3)`,
                    borderRadius: 8, color: GOLD,
                    fontWeight: 700, fontSize: '0.78rem',
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}>
                    <Calendar size={14} /> Terug naar {periodMode === 'day' ? 'vandaag' : `deze ${periodeWoord}`}
                  </button>
                </div>
              )}

              {activity.totalTouches === 0 && activity.totalMovements === 0 && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.85rem',
                }}>
                  Geen activiteit in deze {periodeWoord}.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      {modal}
      {showKpi && (
        <div
          onClick={() => setShowKpi(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 2147483560, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, maxHeight: isMobile ? '92vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,215,0,0.25)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
              <Target size={17} color={GOLD} />
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>KPI-doelen</div>
              <button onClick={() => setShowKpi(false)} title="Sluiten" style={iconBtn}><X size={16} /></button>
            </div>
            {/* Uitleg + kleurlegenda */}
            <div style={{ flexShrink: 0, padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Stel per stat een <b style={{ color: '#fff' }}>dag</b>- en <b style={{ color: '#fff' }}>week</b>-doel in. Op de bar: <span style={{ color: '#22c55e', fontWeight: 700 }}>groen</span> = gehaald, <span style={{ color: '#f59e0b', fontWeight: 700 }}>geel</span> = onderweg, <span style={{ color: '#ef4444', fontWeight: 700 }}>rood</span> = achter. Leeg = geen doel.
            </div>
            {/* Rijen */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 1rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0 0.3rem', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                <div style={{ flex: 1 }} />
                <div style={{ width: 72, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Dag</div>
                <div style={{ width: 72, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Week</div>
              </div>
              {KPI_STATS.map(st => {
                const val = kpiValues[st.key] || 0
                const tgt = kpiTargetFor(kpiTargets, st.key, periodMode)
                const col = tgt != null ? kpiColor(val, tgt) : null
                const draft = kpiDraft[st.key] || { day: '', week: '' }
                const shown = st.key === 'omzet' ? '€' + Math.round(val).toLocaleString('nl-NL') : val
                return (
                  <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{st.label}</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: col || 'rgba(255,255,255,0.4)' }}>
                        {periodMode === 'month'
                          ? `${shown} nu · doel alleen dag/week`
                          : (tgt != null ? `${shown} / ${fmtTarget(st.key, tgt)}` : `${shown} · geen doel`)}
                      </div>
                    </div>
                    <input inputMode="numeric" value={draft.day} onChange={e => setKpiField(st.key, 'day', e.target.value)} placeholder="—"
                      style={{ width: 72, minHeight: 38, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                    <input inputMode="numeric" value={draft.week} onChange={e => setKpiField(st.key, 'week', e.target.value)} placeholder="—"
                      style={{ width: 72, minHeight: 38, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                )
              })}
            </div>
            {/* Footer */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: isMobile ? '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))' : '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowKpi(false)} style={{ flex: 1, minHeight: 42, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Annuleren</button>
              <button onClick={saveKpiPanel} disabled={kpiSaving} style={{ flex: 2, minHeight: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#000', fontWeight: 900, cursor: kpiSaving ? 'wait' : 'pointer', opacity: kpiSaving ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, touchAction: 'manipulation' }}>
                <Save size={15} /> {kpiSaving ? 'Opslaan…' : 'Doelen opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Geld-hub: schermvullend. Dit is geen pop-up waar je even iets
          bevestigt maar een scherm waar je in werkt — drie tabbladen, tabellen
          en maandrijen passen niet in een venster van 560 breed. */}
      {showRevenue && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483560,
            background: '#0a0a0a', color: '#fff',
            display: 'flex', flexDirection: 'column',
            animation: 'geldHubIn 0.18s ease',
          }}
        >
          <style>{`@keyframes geldHubIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: none; } }`}</style>
          <div
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1100, margin: '0 auto' }}
          >
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
              padding: isMobile ? 'calc(0.9rem + env(safe-area-inset-top, 0px)) 1rem 0.8rem' : '1.1rem 1.5rem 0.9rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
              <TrendingUp size={20} color={GOLD} strokeWidth={2.6} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? '1.05rem' : '1.25rem', letterSpacing: '-0.02em' }}>
                  Omzet & uitbetalen
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                  Wat er binnen is, wat er nog moet komen, en wat eruit gaat
                </div>
              </div>
              <button onClick={() => setShowRevenue(false)} title="Sluiten" aria-label="Sluiten" style={{
                width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}><X size={19} strokeWidth={2.8} /></button>
            </div>
            {/* Tab-schakelaar: Omzet ↔ Uitbetalen */}
            <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'omzet', label: 'Omzet', Icon: TrendingUp },
                { id: 'payout', label: 'Uitbetalen', Icon: Users },
                // Challenge-geld staat hier naast de omzet en niet erin: het is
                // nog niet van ons.
                { id: 'challenge', label: 'Challenges', Icon: Gift },
              ].map(t => {
                const active = revTab === t.id
                return (
                  <button key={t.id} onClick={() => setRevTab(t.id)}
                    style={{
                      flex: 1, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${active ? '#fff' : 'transparent'}`,
                      color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 900, fontFamily: 'inherit',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                    <t.Icon size={16} strokeWidth={2.8} /> {t.label}
                  </button>
                )
              })}
            </div>
            <div style={{
              flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              padding: isMobile ? '1rem 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px))' : '1.5rem',
            }}>
              {revLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
              ) : revTab === 'challenge' ? (
                <ChallengePaneel
                  leadService={leadService}
                  coachId={coachId}
                  onGewijzigd={openRevenuePanel}
                />
              ) : revTab === 'omzet' ? (
                // Ook openen als er alleen nog toegezegde sales zijn: juist dan
                // wil je zien wat er nog binnen moet komen.
                (!revenue || (revenue.saleCount === 0 && !(revenue.toegezegdAantal > 0))) ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Nog geen sales met een bedrag vastgelegd. Sleep een lead naar een sale-sectie en vul de order-waarde + betaalwijze in.
                  </div>
                ) : (() => {
                const eur = (n) => '€' + Math.round(n || 0).toLocaleString('nl-NL')
                const maxAmount = Math.max(1, ...revenue.months.map(m => m.amount))
                const toegezegd = revenue.toegezegdTotaal || 0
                const cards = [
                  { label: 'MRR deze maand', value: eur(revenue.mrr), color: '#fff', hint: `${revenue.activeMonthly} lopend maandplan${revenue.activeMonthly === 1 ? '' : 'nen'}` },
                  { label: 'Actieve plannen', value: revenue.activeMonthly, color: '#fff' },
                  { label: 'Geboekt totaal', value: eur(revenue.totalBooked), color: '#fff', hint: `${revenue.saleCount} betaalde sale${revenue.saleCount === 1 ? '' : 's'}` },
                  // Vierde kaart alleen als er iets openstaat: anders staat er
                  // een nul te pronken waar niets aan de hand is.
                  ...(toegezegd > 0 ? [{
                    label: 'Toegezegd, niet binnen', value: eur(toegezegd), color: GOLD,
                    hint: `${revenue.toegezegdAantal} ja${revenue.toegezegdAantal === 1 ? '' : "'s"} zonder betaling`,
                  }] : []),
                ]
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${cards.length}, 1fr)`, gap: 10, marginBottom: '1.5rem' }}>
                      {cards.map(c => (
                        <div key={c.label} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${c.color === GOLD ? 'rgba(255,215,0,0.28)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 14, padding: isMobile ? '0.85rem 0.7rem' : '1rem 0.9rem',
                        }}>
                          <div style={{ fontSize: isMobile ? '1.35rem' : '1.7rem', fontWeight: 900, color: c.color, lineHeight: 1.05, letterSpacing: '-0.03em' }}>{c.value}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{c.label}</div>
                          {c.hint && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{c.hint}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Wie ja zei maar nog niet betaalde. Staat bewust bóven de
                        grafiek: dit is geld dat je nog moet ophalen, en het zit
                        in geen enkel bedrag hieronder. */}
                    {toegezegd > 0 && (
                      <div style={{ marginBottom: '1.5rem', border: '1px solid rgba(255,215,0,0.22)', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '0.7rem 0.9rem', background: 'rgba(255,215,0,0.06)',
                          borderBottom: '1px solid rgba(255,215,0,0.16)',
                        }}>
                          <Info size={14} color={GOLD} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                            Toegezegd, nog niet binnen
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: GOLD }}>{eur(toegezegd)}</div>
                        </div>
                        {(revenue.toegezegd || []).slice(0, 8).map((t, i) => {
                          const dagen = Math.max(0, Math.floor((Date.now() - new Date(t.datum).getTime()) / 86400000))
                          return (
                            <div key={`${t.naam}-${i}`} style={{
                              display: 'flex', alignItems: 'baseline', gap: 10,
                              padding: '0.6rem 0.9rem',
                              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                              <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.naam}
                              </span>
                              <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                                {dagen === 0 ? 'vandaag' : `${dagen} dag${dagen === 1 ? '' : 'en'}`}
                              </span>
                              <span style={{ flexShrink: 0, fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>{eur(t.bedrag)}</span>
                            </div>
                          )
                        })}
                        <div style={{ padding: '0.6rem 0.9rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                          Telt nergens hierboven mee — ook niet in wat {partnerName} krijgt.
                          Voer de betaling in via het calls-venster, tabblad Betaling.
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Omzet per maand</div>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>← scroll voor meer →</div>
                    </div>
                    {/* Horizontaal scrollbare balk-chart: afgelopen (vol) + komende
                        (lichter, projectie) maanden. Start links = afgelopen maanden. */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}>
                      {revenue.months.map(m => {
                        const h = Math.max(3, Math.round((m.amount / maxAmount) * 72))
                        const barColor = (m.isPast || m.isCurrent) ? '#22c55e' : 'rgba(34,197,94,0.4)'
                        return (
                          <div key={m.key} style={{ flexShrink: 0, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: m.amount > 0 ? '#fff' : 'rgba(255,255,255,0.22)', whiteSpace: 'nowrap' }}>{m.amount > 0 ? eur(m.amount) : '—'}</div>
                            <div style={{ height: 76, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                              <div style={{ width: 20, height: h, background: barColor, borderRadius: 4, transition: 'height 0.3s ease' }} />
                            </div>
                            <div style={{ fontSize: '0.55rem', fontWeight: m.isCurrent ? 900 : 600, color: m.isCurrent ? '#FFD700' : 'rgba(255,255,255,0.5)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{m.label.replace(/ 20/, " '")}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: '0.8rem', fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                      Vol groen = gerealiseerd (afgelopen + deze maand) · lichter = projectie. Vooruitbetaald telt in de sale-maand; maandelijks = totaal ÷ looptijd, gespreid.
                      Alleen sales waarvan het geld binnen is; een ja zonder betaling staat erboven apart.
                    </div>
                  </>
                )
              })()
              ) : (() => {
                // ── UITBETALEN-tab ──────────────────────────────────────────
                const eur = (n) => '€' + Math.round(n || 0).toLocaleString('nl-NL')
                const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
                const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' } }
                const pos = payouts?.months || []
                const settleable = pos.filter(m => m.isPast || m.isCurrent).slice().reverse()
                // De eerstvolgende twee maanden — verwachting, want dat geld moet
                // nog binnenkomen. Wel met knop: soms betaal je vooruit.
                const upcoming = pos.filter(m => !m.isPast && !m.isCurrent && m.owed > 0).slice(0, 2)
                const totalOut = payouts?.totalOutstanding || 0
                const fixedCosts = payouts?.fixedCosts || 0
                // Sales die ná een afgeronde uitbetaling binnenkwamen en dus in
                // de volgende maand meelopen. Zonder deze regel lijkt zo'n maand
                // onverklaarbaar hoog.
                const verschoven = payouts?.verschoven || []
                // "Jij houdt" = (omzet − vaste lasten) − partner-aandeel. We gebruiken
                // de netto-omzet die per maand al is uitgerekend in de service.
                const cur = pos.find(m => m.isCurrent)
                const curRev = cur ? (cur.revenue || 0) : 0        // ontvangen deze maand
                const curOrders = cur ? (cur.orderRevenue || 0) : 0 // verkocht deze maand
                const curNet = cur ? (cur.netRevenue || 0) : 0
                // VERDIEND deze maand, niet "uit te betalen deze maand". Bij een
                // sale ná een afgeronde uitbetaling schuift de uitbetaling door
                // naar volgende maand; zou "Jij houdt" op dat lagere bedrag
                // rekenen, dan telde het doorgeschoven deel als jouw winst.
                const partnerNow = cur ? (cur.earned ?? cur.owed) : 0
                const youKeepNow = Math.max(0, curNet - partnerNow)
                const verschovenRegel = verschoven.length > 0 ? (
                  <div style={{
                    display: 'flex', gap: 7, alignItems: 'flex-start',
                    padding: '0.55rem 0.7rem', borderRadius: 8, marginBottom: '0.6rem',
                    background: 'rgba(255,215,0,0.07)', border: `1px solid ${GOLD}33`,
                  }}>
                    <Info size={13} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
                      {verschoven.map((v, i) => (
                        <div key={i}>
                          <strong style={{ color: '#fff' }}>{eur(v.bedrag)}</strong>
                          {v.naam ? ` (${v.naam})` : ''} kwam binnen ná de uitbetaling van {v.van} —
                          telt mee in {v.naar}.
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null

                // Kale typografie: geen vakken, geen accentkleuren. Hiërarchie
                // via formaat en dikte, scheiding via haarlijnen.
                const rij = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '0.6rem 0' }
                const lijn = { borderTop: '1px solid rgba(255,255,255,0.1)' }
                const kopje = { fontSize: '0.95rem', fontWeight: 900, color: '#fff', margin: '1.5rem 0 0.2rem' }
                const knop = (leeg) => ({
                  flexShrink: 0, padding: '0.5rem 0.9rem', borderRadius: 9,
                  border: leeg ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  background: leeg ? 'transparent' : '#fff', color: leeg ? '#fff' : '#000',
                  fontWeight: 900, fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer',
                })

                const MaandRij = ({ m, verwacht }) => {
                  const busy = payoutBusy === m.key
                  const youKeepM = Math.max(0, (m.netRevenue || 0) - (m.earned ?? m.owed ?? 0))
                  return (
                    <div style={{ ...rij, ...lijn, alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>
                          {cap(m.label)}
                          {m.isCurrent && <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}> · deze maand</span>}
                          {verwacht && <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}> · verwacht</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                          {isOwner ? `${partnerName} ${eur(m.owed)} · jij ${eur(youKeepM)}` : `Jouw aandeel ${eur(m.owed)}`}
                          {m.settled && ` · betaald${m.paidAt ? ' ' + fmtDate(m.paidAt) : ''}`}
                        </div>
                      </div>
                      {!isOwner ? (
                        <div style={{ flexShrink: 0, fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                          {m.settled ? 'Ontvangen' : eur(m.outstanding)}
                        </div>
                      ) : (
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                          {!m.settled && <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>{eur(m.outstanding)}</span>}
                          <button onClick={() => settleMonth(m)} disabled={busy} style={{ ...knop(m.settled || verwacht), opacity: busy ? 0.5 : 1 }}>
                            {busy ? '…' : m.settled ? 'Betaald ✓' : 'Betaald'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <>
                    {verschovenRegel}

                    {isOwner && (
                      <>
                        {/* Periode loopt van de 26e t/m de 25e — zonder dit label
                            lijkt "deze maand" een kalendermaand. */}
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>
                          Periode 26e t/m 25e
                        </div>
                        <div style={rij}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Verkocht deze periode</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{eur(curOrders)}</span>
                        </div>

                        <button onClick={() => setOntvangstenOpen(o => !o)}
                          style={{ ...rij, ...lijn, width: '100%', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                            <ChevronDown size={14} style={{ transform: ontvangstenOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            Ontvangen deze maand
                          </span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>{eur(curRev)}</span>
                        </button>

                        {ontvangstenOpen && (
                          <div style={{ padding: '0 0 0.5rem 1.2rem' }}>
                            {(cur?.ontvangsten || []).length === 0 ? (
                              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0' }}>Niets binnengekomen deze maand.</div>
                            ) : cur.ontvangsten.map((o, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0.3rem 0' }}>
                                <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {o.naam}{o.soort && <span style={{ color: 'rgba(255,255,255,0.45)' }}> · {o.soort}</span>}
                                </span>
                                <b style={{ flexShrink: 0, fontSize: '0.9rem', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{eur(o.bedrag)}</b>
                              </div>
                            ))}
                          </div>
                        )}

                        {fixedCosts > 0 && (
                          <div style={{ ...rij, ...lijn }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>Min vaste lasten {eur(fixedCosts)}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{eur(curNet)}</span>
                          </div>
                        )}

                        <div style={kopje}>Deze periode</div>
                        <div style={{ ...rij, ...lijn }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{partnerName} verdient</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{eur(partnerNow)}</span>
                        </div>
                        <div style={{ ...rij, ...lijn }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Jij houdt</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{eur(youKeepNow)}</span>
                        </div>
                        <div style={{ ...rij, ...lijn }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Nog over te maken</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{eur(totalOut)}</span>
                        </div>
                      </>
                    )}

                    {!isOwner && (
                      <>
                        <div style={rij}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Jij verdient deze maand</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{eur(partnerNow)}</span>
                        </div>
                        <div style={{ ...rij, ...lijn }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Nog te ontvangen</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{eur(totalOut)}</span>
                        </div>
                      </>
                    )}

                    <div style={kopje}>Per maand</div>
                    {settleable.length === 0 && upcoming.length === 0 ? (
                      <div style={{ ...rij, ...lijn, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Nog niets te verdelen.</div>
                    ) : (
                      <>
                        {settleable.map(m => <MaandRij key={m.key} m={m} />)}
                        {upcoming.map(m => <MaandRij key={m.key} m={m} verwacht />)}
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Bevestiging met de gevolgen erbij: welke stat verdwijnt en waar de
          lead naartoe gaat. Anders druk je op 'Ongedaan' zonder te weten wat
          er op het bord gebeurt. */}
      {bevestig && (
        <Venster isMobile={isMobile} onClose={() => setBevestig(null)} maxWidth={440} zIndex={2147483560}>
          <VensterKop
            isMobile={isMobile}
            titel="Wat wil je doen?"
            sub={bevestig.item?.name}
            onClose={() => setBevestig(null)}
          />

          <div style={{ padding: isMobile ? '1rem' : '1.15rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={async () => {
                const id = bevestig.item.id
                setBevestig(null)
                await handleRevertMovement(id)
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
                padding: '0.75rem 0.85rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={16} color="#fff" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>Terugdraaien</span>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, marginTop: 3 }}>
                  {bevestig.statLabel
                    ? `${bevestig.item?.name} verdwijnt uit "${bevestig.statLabel}"`
                    : `${bevestig.item?.name} verdwijnt uit deze stat`}
                  {bevestig.item?.from ? ` en gaat terug naar "${bevestig.item.from}".` : '.'}
                  {' '}De rij blijft bewaard, dus je kunt 'm later terugzien.
                </span>
              </span>
            </button>

            <button
              onClick={async () => {
                const id = bevestig.item.id
                setBevestig(null)
                await handleDeleteMovement(id)
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
                padding: '0.75rem 0.85rem', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Trash2 size={16} color="#fca5a5" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: '#fca5a5' }}>Definitief verwijderen</span>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, marginTop: 3 }}>
                  De rij gaat uit de database. {bevestig.statLabel ? `"${bevestig.statLabel}" telt ${bevestig.item?.name} niet meer mee` : 'De stat telt niet meer mee'}, en de lead blijft staan waar hij nu staat. Dit kun je niet ongedaan maken.
                </span>
              </span>
            </button>
          </div>

          <VensterVoet isMobile={isMobile}>
            <Knop soort="stil" flex={1} onClick={() => setBevestig(null)}>Annuleer</Knop>
          </VensterVoet>
        </Venster>
      )}

      {showCallProposals && (
        <CallProposalsModal
          leadService={leadService}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowCallProposals(false)}
        />
      )}
      {pdfPreview && (
        <div
          onClick={() => setPdfPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483550,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', padding: isMobile ? 0 : '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              maxWidth: 900, width: '100%', margin: '0 auto',
              background: '#111', borderRadius: isMobile ? 0 : 14, overflow: 'hidden',
              border: '1px solid rgba(255,215,0,0.25)',
            }}
          >
            {/* Header met download-knop */}
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
              padding: isMobile ? 'calc(0.6rem + env(safe-area-inset-top)) 0.85rem 0.6rem' : '0.7rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)',
            }}>
              <Eye size={16} color={GOLD} />
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>PDF-voorbeeld</div>
              <a
                href={pdfPreview.url} download={pdfPreview.filename}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                  padding: '0 0.75rem', height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#000',
                  fontWeight: 900, fontSize: '0.72rem',
                }}
              >
                <Download size={13} /> Download
              </a>
              <button onClick={() => setPdfPreview(null)} title="Sluiten" style={iconBtn}><X size={16} /></button>
            </div>
            {/* Het voorbeeld zelf */}
            <iframe
              title="PDF-voorbeeld" src={pdfPreview.url}
              style={{ flex: 1, width: '100%', border: 'none', background: '#525659' }}
            />
            {/* Fallback voor mobiel waar een iframe geen PDF toont */}
            <div style={{ flexShrink: 0, textAlign: 'center', padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a href={pdfPreview.url} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>
                Voorbeeld niet zichtbaar? Open in nieuw tabblad →
              </a>
            </div>
          </div>
        </div>
      )}
    </>,
    modalHost
  )
}

const iconBtn = {
  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: 'none',
  borderRadius: 8, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}
const navBtn = {
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      margin: '0.85rem 0 0.45rem',
      color: 'rgba(255,255,255,0.55)',
      fontSize: '0.7rem', fontWeight: 800,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {icon} {title}
    </div>
  )
}

// Inklapbare sectie — kop is een knop, inhoud verschijnt pas na klik.
// Default dicht zodat de stats-modal rustig oogt en de coach zelf kiest
// wat 'ie openklapt (grafiek, campagnes, bron-breakdown, verplaatsingen…).
function CollapsibleSection({ icon, title, accent = 'rgba(255,255,255,0.55)', defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.45rem',
          margin: '0.6rem 0 0.35rem', padding: '0.65rem 0.75rem',
          background: open ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9,
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', color: open ? '#fff' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <ChevronDown size={15} color={accent} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && children}
    </>
  )
}

function Grid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '0.4rem',
    }}>
      {children}
    </div>
  )
}

function SourceRow({ icon, label, total, reached, stages, followupCount = 0, repliedLeads = 0, followedLeads = 0, messageText = null, description = null, platform = null, purpose = null, accent = '#FFD700', muted = false }) {
  const [expanded, setExpanded] = useState(false)
  const reachedPct = total > 0 ? Math.round((reached / total) * 100) : 0
  const s = stages || { replied: 0, callProposed: 0, callScheduled: 0, sale: 0 }
  // Avg followups per lead — gives a sense of how nurture-heavy a source
  // is, without the noise of raw totals (a big campaign always wins).
  const avgFollow = total > 0 ? (followupCount / total).toFixed(1) : '0'

  // Per-source ratios — same kerncijfers als de top-level sectie, gescoped
  // op deze ene source z'n lead-cohort.
  const scheduledCalls = s.callScheduled || 0
  const responseRate = pct(repliedLeads,    total)
  const chaseShare   = pct(followedLeads,   total)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.45rem',
      padding: '0.55rem 0.65rem',
      background: muted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 7,
    }}>
      {/* Row 1: icon + label + big total — clickable to expand */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: muted ? 'rgba(255,255,255,0.5)' : '#fff',
            fontSize: '0.8rem', fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
          <div style={{
            marginTop: 3,
            height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${reachedPct}%`, height: '100%',
              background: accent, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '1.05rem', fontWeight: 900,
            color: muted ? 'rgba(255,255,255,0.5)' : accent,
            fontFamily: 'monospace', lineHeight: 1,
          }}>
            {total}
          </div>
          <div style={{
            fontSize: '0.5rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2,
          }}>
            leads
          </div>
        </div>
        <ChevronDown
          size={13}
          color="rgba(255,255,255,0.4)"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s', flexShrink: 0,
          }}
        />
      </div>

      {/* Row 2: dezelfde stat-stijl als de rij bovenaan de modal (StatFlow),
          zodat je niet hoeft om te schakelen tussen twee manieren van lezen.
          Icoon + kleur per stap komen 1-op-1 overeen met `countItems` daar. */}
      <StatFlow
        items={[
          { label: 'Reacties',    value: s.replied || 0,       Icon: MessageCircle, color: '#10b981' },
          { label: 'Voorgesteld', value: s.callProposed || 0,  Icon: PhoneCall,     color: '#a855f7' },
          { label: 'Ingepland',   value: s.callScheduled || 0, Icon: CalendarCheck, color: '#06b6d4' },
          { label: 'Sales',       value: s.sale || 0,          Icon: Trophy,        color: '#FFD700' },
          { label: 'Follow-ups',  value: followupCount,        Icon: Send,          color: '#f59e0b', sub: `ø${avgFollow} per lead` },
        ]}
        activeStage={null}
        onToggle={() => {}}
      />

      {/* Expanded: per-source % metrics + the actual outreach message that
          this source used. Same definitions as the top Conversie ratio's
          section, but scoped to this single source. */}
      {expanded && (
        <div style={{
          marginTop: 4,
          paddingTop: '0.45rem',
          borderTop: '1px dashed rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {/* Ook de percentages in dezelfde stijl als de "Percentages"-rij
              bovenaan — zelfde iconen, zelfde breuk eronder. */}
          <StatFlow
            items={[
              { label: 'Response',  value: toonPct(responseRate), Icon: MessageCircle, color: '#10b981', sub: `${repliedLeads} van ${total}` },
              { label: 'Opvolg',    value: toonPct(chaseShare),   Icon: Send,          color: '#f59e0b', sub: `${followedLeads} van ${total}` },
              { label: 'Voorstel→call', value: toonPct(pct(scheduledCalls, s.callProposed || 0)), Icon: PhoneCall, color: '#a855f7', sub: `${scheduledCalls} van ${s.callProposed || 0}` },
              { label: 'Close rate',    value: toonPct(pct(s.sale || 0, scheduledCalls)),        Icon: Trophy,    color: '#22c55e', sub: `${s.sale || 0} van ${scheduledCalls}` },
            ]}
            activeStage={null}
            onToggle={() => {}}
          />

          {/* Outreach-message preview (campaigns) of magnet-description.
              Pure read-only inside the metrics modal — handy for the "wat
              heb ik ook alweer naar deze cohort gestuurd?" vraag. */}
          {(messageText || description) && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${accent}33`,
              borderRadius: 6,
              padding: '0.55rem 0.7rem',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4,
                fontSize: '0.55rem', fontWeight: 800,
                color: accent, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <MessageCircle size={10} />
                {messageText ? 'Outreach bericht' : 'Lead magnet beschrijving'}
                {platform && (
                  <span style={{
                    marginLeft: 6, padding: '1px 5px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.5rem', borderRadius: 3,
                    letterSpacing: '0.02em',
                  }}>{platform}</span>
                )}
                {purpose && (
                  <span style={{
                    padding: '1px 5px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.5rem', borderRadius: 3,
                  }}>{purpose}</span>
                )}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}>
                {messageText || description}
              </div>
            </div>
          )}
          {!messageText && !description && (
            <div style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
              fontStyle: 'italic', textAlign: 'center', padding: '0.3rem',
            }}>
              Geen bericht / beschrijving opgeslagen voor deze bron.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GenderRing({ gender }) {
  const { male, female, malePct, femalePct, unknown } = gender
  const known = male + female
  const R = 34, C = 2 * Math.PI * R
  const maleFrac = known ? male / known : 0
  const maleLen = C * maleFrac
  const MALE = '#3b82f6', FEMALE = '#ec4899'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '2px 0 10px' }}>
      <svg width="86" height="86" viewBox="0 0 86 86" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="43" cy="43" r={R} fill="none" stroke={FEMALE} strokeWidth="11" />
        <circle cx="43" cy="43" r={R} fill="none" stroke={MALE} strokeWidth="11"
          strokeDasharray={`${maleLen} ${C - maleLen}`} strokeLinecap="butt" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: MALE, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>Man</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: MALE, fontVariantNumeric: 'tabular-nums' }}>{malePct}%</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>({male})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: FEMALE, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>Vrouw</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: FEMALE, fontVariantNumeric: 'tabular-nums' }}>{femalePct}%</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>({female})</span>
        </div>
        {unknown > 0 && (
          <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
            {unknown} nog niet ingevuld
          </div>
        )}
      </div>
    </div>
  )
}

// Per-campagne stat-kaart: naam + total, met daaronder de Aantallen- en
// Percentages-rijen in exact dezelfde StatFlow-stijl als bovenin de modal.
// Alle cijfers zijn "ná campagne-bericht" (uit getCampaignBreakdown).
function CampaignStatCard({ campaign: c, isMobile, onVraag, revertingId, deletingId }) {
  const [showMsg, setShowMsg] = useState(false)
  // Welke stap er per campagne is opengeklapt om de namen te zien.
  const [stap, setStap] = useState(null)
  const s = c.stages || { replied: 0, callProposed: 0, callScheduled: 0, sale: 0 }
  const namen = c.leads || {}
  const p = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
  const frac = (a, b) => `${a} van ${b}`
  // stage = de sleutel in c.leads; alleen invullen als er ook namen zijn,
  // anders is het pijltje een dode klik.
  const metNamen = (sleutel) => (namen[sleutel]?.length ? sleutel : undefined)
  const countItems = [
    { label: 'Getagd',      value: c.total,          Icon: UserPlus,      color: '#a855f7', stage: metNamen('getagd'),
      sub: c.afgeslotenLeads ? `${c.afgeslotenLeads} verder in andere campagne` : undefined,
      info: c.afgeslotenLeads ? 'Deze cijfers staan vast voor de periode dat de lead aan deze campagne hing. Ging de lead daarna naar een andere campagne, dan tellen nieuwe reacties en stappen daar mee, niet meer hier.' : undefined },
    { label: 'Reacties',    value: s.replied,        Icon: MessageCircle, color: '#10b981', stage: metNamen('replied') },
    { label: 'Voorgesteld', value: s.callProposed,   Icon: PhoneCall,     color: '#a855f7', stage: metNamen('callProposed') },
    { label: 'Ingepland',   value: s.callScheduled,  Icon: CalendarCheck, color: '#06b6d4', stage: metNamen('callScheduled') },
    { label: 'Sale',        value: s.sale,           Icon: Trophy,        color: '#FFD700', stage: metNamen('sale') },
    { label: 'Opvolg',      value: c.followupCount,  Icon: Send,          color: '#f59e0b' },
  ]
  const STAP_KLEUR = { getagd: '#a855f7', replied: '#10b981', callProposed: '#a855f7', callScheduled: '#06b6d4', sale: '#FFD700' }
  const STAP_LABEL = { getagd: 'Getagd', replied: 'Reacties', callProposed: 'Voorgesteld', callScheduled: 'Ingepland', sale: 'Sale' }
  const pctItems = [
    { label: 'Reactie',       value: p(s.replied, c.total),          Icon: MessageCircle, color: '#10b981', sub: frac(s.replied, c.total) },
    { label: 'Voorstel',      value: p(s.callProposed, c.total),     Icon: PhoneCall,     color: '#a855f7', sub: frac(s.callProposed, c.total) },
    { label: 'Voorstel→call', value: p(s.callScheduled, s.callProposed), Icon: CalendarCheck, color: '#06b6d4', sub: frac(s.callScheduled, s.callProposed) },
    { label: 'Close rate',    value: p(s.sale, s.callScheduled),     Icon: Trophy,        color: '#22c55e', sub: frac(s.sale, s.callScheduled) },
  ]
  return (
    <div style={{ padding: '0.7rem 0.75rem', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.22)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Send size={13} color="#a855f7" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
        {c.messageText && (
          <button onClick={() => setShowMsg(v => !v)}
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation' }}>
            <MessageCircle size={10} /> Bericht
          </button>
        )}
      </div>
      <div style={{ fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '4px 0 2px' }}>Aantallen</div>
      <StatFlow items={countItems} activeStage={stap} onToggle={(st) => setStap(p2 => p2 === st ? null : st)} />
      {stap && (
        <DrillPanel
          leads={namen[stap]}
          accent={STAP_KLEUR[stap] || '#a855f7'}
          onVraag={onVraag} revertingId={revertingId} deletingId={deletingId}
          statLabel={STAP_LABEL[stap] || ''}
        />
      )}
      <div style={{ fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '2px 0' }}>Percentages</div>
      <StatFlow items={pctItems} activeStage={null} onToggle={() => {}} />
      {showMsg && c.messageText && (
        <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 6, padding: '0.55rem 0.7rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
          {c.messageText}
        </div>
      )}
    </div>
  )
}

function StatFlow({ items, activeStage, onToggle }) {
  // Welke stat z'n uitleg-box getoond wordt (klik op het ⓘ-icoon).
  const [openInfo, setOpenInfo] = useState(null)
  const active = openInfo != null ? items.find(x => x.label === openInfo) : null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '2px 0 8px' }}>
        {items.map(it => {
          const clickable = !!it.stage
          const on = clickable && activeStage === it.stage
          const infoOn = openInfo === it.label
          return (
            <div key={it.label} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
              <div onClick={clickable ? () => onToggle(it.stage) : undefined} title={it.label}
                style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: clickable ? 'pointer' : 'default' }}>
                <it.Icon size={16} color={it.color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{it.value}</span>
                {clickable && <ChevronDown size={12} color={on ? '#FFD700' : 'rgba(255,255,255,0.35)'} style={{ transform: on ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />}
              </div>
              {/* Titel + ⓘ-uitlegknop. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: on ? '#FFD700' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{it.label}</span>
                {it.info && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenInfo(p => p === it.label ? null : it.label) }}
                    title="Wat betekent dit?"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, width: 13, height: 13, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: infoOn ? '#FFD700' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                  >
                    <Info size={11} />
                  </button>
                )}
              </div>
              {/* Echte breuk onder een percentage (bv. "45 van 310"). */}
              {it.sub && <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{it.sub}</span>}
            </div>
          )
        })}
      </div>
      {/* Uitleg-box — verschijnt onder de rij bij klik op ⓘ. */}
      {active && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, margin: '0 0 0.7rem', padding: '0.5rem 0.65rem', background: `${active.color}12`, border: `1px solid ${active.color}33`, borderRadius: 8 }}>
          <Info size={13} color={active.color} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#fff', marginBottom: 1 }}>{active.label}{active.sub ? ` · ${active.sub}` : ''}</div>
            <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{active.info}</div>
          </div>
          <button onClick={() => setOpenInfo(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, flexShrink: 0 }}><X size={12} /></button>
        </div>
      )}
    </div>
  )
}

// Drill-down lijst onder de aantallen-rij: leads van een funnel-stap, met
// terugdraaien/verwijderen (zelfde acties als voorheen in de StatCard).
// Call-datum is een kale date-kolom, dus geen tijd tonen.
const callDatum = (v) => {
  if (!v) return ''
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Kop per periode-kolom: bovenaan wat het is (weeknummer, maand, kwartaal),
// eronder van wanneer tot wanneer.
function periodeKop(start, end, mode) {
  if (!start) return { label: '', sub: '' }
  const laatste = new Date(end.getTime() - 864e5)   // end is exclusief
  const dag = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const bereik = `${dag(start)} – ${dag(laatste)}`
  if (mode === 'day')     return { label: start.toLocaleDateString('nl-NL', { weekday: 'short' }), sub: dag(start) }
  if (mode === 'month')   return { label: start.toLocaleDateString('nl-NL', { month: 'short' }), sub: String(start.getFullYear()) }
  if (mode === 'year')    return { label: String(start.getFullYear()), sub: '' }
  if (mode === 'quarter') return { label: `Q${kwartaalNr(start)} ${start.getFullYear()}`, sub: bereik }
  if (mode === 'week')    return { label: `wk ${isoWeek(start)}`, sub: bereik }
  return { label: bereik, sub: '' }
}

// Alle cijfers van één periode als platte lijst — zo kun je twee periodes
// naast elkaar zetten zonder de tegel-berekening te dupliceren.
// `soort`: 'aantal' | 'euro' | 'procent'. `omgekeerd` = lager is beter.
function kerncijfers({ activity, funnel, reactionStats, cash } = {}) {
  const n = (v) => Number(v) || 0
  const nieuw = n(reactionStats?.newLeads)
  const reacties = n(reactionStats?.reactionEventsInWindow ?? reactionStats?.reactionsInWindow ?? reactionStats?.reactedLeads)
  const voorgesteld = n(funnel?.callProposed?.count)
  const ingepland = n(funnel?.callScheduled?.count)
  const gepland = n(funnel?.callBooked?.count)
  const gevoerd = n(funnel?.callHeld?.count)
  const sales = n(funnel?.sale?.count)
  const noShows = n(funnel?.noShow?.count)
  const afgehandeld = gevoerd + noShows
  const deel = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null)

  return [
    { key: 'nieuw',        label: 'Nieuwe leads',  waarde: nieuw,                          soort: 'aantal' },
    { key: 'followups',    label: 'Follow-ups',    waarde: n(activity?.followUps),         soort: 'aantal' },
    { key: 'reacties',     label: 'Reacties',      waarde: reacties,                       soort: 'aantal' },
    { key: 'voorgesteld',  label: 'Voorgesteld',   waarde: voorgesteld,                    soort: 'aantal' },
    { key: 'ingepland',    label: 'Ingepland',     waarde: ingepland,                      soort: 'aantal' },
    { key: 'gepland',      label: 'Calls gepland', waarde: gepland,                        soort: 'aantal' },
    { key: 'gevoerd',      label: 'Call gevoerd',  waarde: gevoerd,                        soort: 'aantal' },
    { key: 'sales',        label: 'Sales',         waarde: sales,                          soort: 'aantal' },
    { key: 'omzet',        label: 'Orderwaarde',   waarde: Math.round(n(funnel?.sale?.omzet)), soort: 'euro' },
    { key: 'binnen',       label: 'Binnengekomen', waarde: Math.round(n(cash?.bedrag)),    soort: 'euro' },
    { key: 'noshows',      label: 'No-shows',      waarde: noShows,                        soort: 'aantal', omgekeerd: true },
    { key: 'afgewezen',    label: 'Afgewezen',     waarde: n(funnel?.callRejected?.count), soort: 'aantal', omgekeerd: true },
    { key: 'saleverloren', label: 'Sale verloren', waarde: n(funnel?.saleLost?.count),     soort: 'aantal', omgekeerd: true },
    { key: 'nietgeschikt', label: 'Niet geschikt', waarde: n(funnel?.notSuitable?.count),  soort: 'aantal', omgekeerd: true },
    { key: 'reactiepct',   label: 'Reactie %',        waarde: deel(n(reactionStats?.reactedLeads), nieuw), soort: 'procent' },
    { key: 'naarvoorstel', label: 'Reactie→voorstel', waarde: deel(voorgesteld, reacties),   soort: 'procent' },
    { key: 'naaringepland',label: 'Voorstel→ingepland', waarde: deel(ingepland, voorgesteld), soort: 'procent' },
    { key: 'naarshow',     label: 'Ingepland→show-up',  waarde: deel(gevoerd, gepland),      soort: 'procent' },
    { key: 'close',        label: 'Show→close',       waarde: deel(sales, gevoerd),          soort: 'procent' },
    { key: 'noshowpct',    label: 'No-show %',        waarde: deel(noShows, afgehandeld),    soort: 'procent', omgekeerd: true },
  ]
}

// Tabelweergave: elke stat op een regel, met een kolom per periode. De eerste
// kolom (de stat-naam) en de kolom "Nu" blijven staan; de geschiedenis scrolt
// horizontaal weg. Elke oudere kolom wordt vergeleken met NU: groen als het nu
// beter is dan toen, rood als het slechter is.
function StatTabel({ rijen, kolommen, bezig, nuKop }) {
  const toon = (r, v) => {
    if (v == null) return '—'
    if (r.soort === 'euro') return '€' + Number(v).toLocaleString('nl-NL')
    if (r.soort === 'procent') return `${v}%`
    return String(v)
  }
  const kop = {
    fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '0 0 7px', whiteSpace: 'nowrap',
  }
  const cel = {
    fontSize: '0.72rem', fontWeight: 800, textAlign: 'right',
    padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.05)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  }
  // Vaste kolommen links: stat-naam + Nu. Die plakken bij het scrollen.
  const plak = (links) => ({
    position: 'sticky', left: links, zIndex: 1, background: '#0a0a0a',
  })
  const NAAM_B = 132
  const NU_B = 74

  if (!rijen.length) {
    return <div style={{ padding: '0.6rem 0 1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Geen stats geselecteerd.</div>
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 0 0.8rem', paddingBottom: 4 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: NAAM_B + NU_B + kolommen.length * 64 }}>
        <thead>
          <tr>
            <th style={{ ...kop, ...plak(0), width: NAAM_B, minWidth: NAAM_B, textAlign: 'left' }}>Stat</th>
            <th style={{ ...kop, ...plak(NAAM_B), width: NU_B, minWidth: NU_B, textAlign: 'right', color: '#fff' }}>
              <div>{nuKop?.label || 'Nu'}</div>
              {nuKop?.sub && (
                <div style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0, textTransform: 'none', marginTop: 2 }}>
                  {nuKop.sub}
                </div>
              )}
            </th>
            {kolommen.map(k => (
              <th key={k.id} style={{ ...kop, textAlign: 'right', minWidth: 74, paddingLeft: 12 }}>
                <div>{k.label}</div>
                {k.sub && (
                  <div style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: 0, textTransform: 'none', marginTop: 2 }}>
                    {k.sub}
                  </div>
                )}
              </th>
            ))}
            {bezig && <th style={{ ...kop, textAlign: 'right', paddingLeft: 12 }}>…</th>}
          </tr>
        </thead>
        <tbody>
          {rijen.map(r => (
            <tr key={r.key}>
              <td style={{ ...cel, ...plak(0), textAlign: 'left', color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>
                {r.label}
              </td>
              <td style={{ ...cel, ...plak(NAAM_B), color: '#fff' }}>{toon(r, r.waarde)}</td>
              {kolommen.map(k => {
                const v = k.map[r.key] ?? null
                const beide = r.waarde != null && v != null
                const delta = beide ? r.waarde - v : null
                const beter = delta == null || delta === 0 ? null : (r.omgekeerd ? delta < 0 : delta > 0)
                const kleur = beter == null ? 'rgba(255,255,255,0.45)' : (beter ? '#10b981' : '#ef4444')
                return (
                  <td key={k.id} style={{ ...cel, paddingLeft: 12, color: kleur }}>
                    {toon(r, v)}
                  </td>
                )
              })}
              {bezig && <td style={{ ...cel, paddingLeft: 12, color: 'rgba(255,255,255,0.25)' }}>…</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DrillPanel({ leads, accent = '#FFD700', reasons = null, onVraag = null, revertingId, deletingId, statLabel = '' }) {
  const items = Array.isArray(leads) ? leads : []
  const reasonEntries = reasons ? Object.entries(reasons).sort((a, b) => b[1] - a[1]) : []
  if (!items.length) {
    return <div style={{ padding: '0.4rem 0.2rem 0.8rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Geen items in deze periode.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, margin: '0 0 0.7rem' }}>
      {reasonEntries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingBottom: 6, marginBottom: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {reasonEntries.map(([r, n]) => (
            <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', fontWeight: 800, color: accent, background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 6, padding: '2px 7px' }}>
              {r} <span style={{ color: '#fff' }}>{n}</span>
            </span>
          ))}
        </div>
      )}
      {items.map((d, i) => {
        const busy = (revertingId && revertingId === d.id) || (deletingId && deletingId === d.id)
        const canAct = !!onVraag && !!d.id
        return (
          <div key={d.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingBottom: 5, borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{d.name}</div>
              {/* Call-lijsten (gepland / gevoerd) zijn geen verplaatsingen: die
                  hebben geen van/naar en geen wie, alleen een call-datum. */}
              {(d.from || d.to) && (
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{d.from} <span style={{ color: accent }}>→</span> {d.to}</div>
              )}
              {d.reason && <div style={{ fontSize: '0.58rem', fontWeight: 700, color: accent }}>Reden: {d.reason}</div>}
              {(d.time || d.at || d.by) && (
                <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                  {d.time || callDatum(d.at)}
                  {d.time && <> · door <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.by || 'Onbekend'}</span></>}
                </div>
              )}
            </div>
            {canAct && (
              <button
                onClick={() => onVraag({ item: d, statLabel })}
                disabled={busy}
                title="Terugdraaien of verwijderen"
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 7px', cursor: busy ? 'wait' : 'pointer' }}
              >
                <RotateCcw size={10} /> {busy ? '…' : 'Aanpassen'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ icon, label, value, accent = 'rgba(255,255,255,0.7)', highlight = false, subtext = null, details = null, onRevert = null, revertingId = null, onDelete = null, deletingId = null }) {
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const items = Array.isArray(details) ? details : []
  const hasDetails = items.length > 0
  return (
    <div
      onClick={hasDetails ? () => setOpen(o => !o) : undefined}
      style={{
        padding: '0.6rem 0.7rem',
        background: highlight ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${open ? 'rgba(255,215,0,0.3)' : highlight ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8,
        display: 'flex', flexDirection: 'column', gap: 2,
        cursor: hasDetails ? 'pointer' : 'default',
        gridColumn: open ? '1 / -1' : 'auto',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
        {icon}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
        {hasDetails && (
          <ChevronDown
            size={12}
            style={{
              marginLeft: 'auto', color: 'rgba(255,255,255,0.4)',
              transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease',
            }}
          />
        )}
      </div>
      <div style={{
        fontSize: '1.4rem', fontWeight: 900,
        color: highlight ? '#10b981' : '#fff',
        fontFamily: 'monospace',
        lineHeight: 1,
      }}>
        {value ?? 0}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
          {subtext}
        </div>
      )}
      {open && hasDetails && (
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {items.map((d, i) => {
            const busyRevert = revertingId && revertingId === d.id
            const busyDelete = deletingId && deletingId === d.id
            const busy = busyRevert || busyDelete
            const confirming = confirmId === d.id
            const canAct = (onRevert || onDelete) && d.id
            return (
              <div key={d.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                paddingBottom: 5,
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{d.name}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                    {d.from} <span style={{ color: accent }}>→</span> {d.to}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                    {d.time} · door <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.by || 'Onbekend'}</span>
                  </div>
                </div>
                {canAct && (
                  confirming ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      {onRevert && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(null); onRevert(d.id) }}
                          disabled={busy}
                          title="Verplaatsing ongedaan maken (rij blijft bewaard)"
                          style={{
                            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                            background: 'rgba(212,175,55,0.7)', border: 'none', borderRadius: 5,
                            padding: '3px 7px', cursor: busy ? 'wait' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                          }}
                        ><RotateCcw size={8} />{busyRevert ? '...' : 'Ongedaan'}</button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(null); onDelete(d.id) }}
                          disabled={busy}
                          title="Stat permanent verwijderen"
                          style={{
                            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                            background: 'rgba(239,68,68,0.75)', border: 'none', borderRadius: 5,
                            padding: '3px 7px', cursor: busy ? 'wait' : 'pointer',
                          }}
                        >{busyDelete ? '...' : 'Verwijder'}</button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmId(null) }}
                        style={{
                          fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5,
                          padding: '3px 7px', cursor: 'pointer',
                        }}
                      >Nee</button>
                    </div>
                  ) : (
                    <button
                      title="Bewerken — ongedaan maken of verwijderen"
                      onClick={(e) => { e.stopPropagation(); setConfirmId(d.id) }}
                      style={{
                        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={10} /> Aanpassen
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// % card with a thin progress bar — same footprint as StatCard but uses
// pct() value (0–100 or null when denominator is 0).
function RatioCard({ icon, label, value, accent = '#FFD700', subtext = null }) {
  const hasValue = value !== null && value !== undefined
  const pctVal = hasValue ? Math.min(100, value) : 0
  return (
    <div style={{
      padding: '0.6rem 0.7rem',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
        {icon}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '1.35rem', fontWeight: 900,
        color: hasValue ? accent : 'rgba(255,255,255,0.25)',
        fontFamily: 'monospace', lineHeight: 1,
      }}>
        {hasValue ? `${value}%` : '—'}
      </div>
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
        marginTop: 2,
      }}>
        <div style={{
          width: `${pctVal}%`, height: '100%',
          background: accent, transition: 'width 0.3s ease',
        }} />
      </div>
      {subtext && (
        <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
          {subtext}
        </div>
      )}
    </div>
  )
}
