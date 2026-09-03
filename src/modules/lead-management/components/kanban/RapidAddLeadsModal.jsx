// src/modules/lead-management/components/kanban/RapidAddLeadsModal.jsx
// Snelle "leads toevoegen"-flow voor op tempo invoeren. Kies eerst de bron:
//   • Campagne  → nieuwe volgers (outreach) → komen in de Gesprek-insta sectie
//   • Lead magnet → reacties → komen in de Lead-magnets sectie
// Magnet-flow: kies (klik of cijfer 1-9 als de balk leeg is) één magnet die
// geselecteerd BLIJFT, typ dan naam → Enter = lead toegevoegd → balk leeg,
// magnet blijft staan (handig voor een batch van dezelfde magnet).
// Campagne-flow: typ naam → Enter. Plus een "Laatste terughalen"-knop die de
// laatst toegevoegde lead verwijdert en de naam terugzet om te corrigeren.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Send, FileText, Zap, RotateCcw, ArrowRight, CornerDownLeft, Check, ChevronDown, Plus } from 'lucide-react'

const GOLD = '#FFD700'

export default function RapidAddLeadsModal({
  isOpen, onClose, isMobile,
  leadService, db, coachId,
  campaigns = [],
  instaSectionId, magnetsSectionId,
  existingNames,
  onAdded, onRemoved,
}) {
  const modalHost = useModalHost()
  const normName = (v) => (v || '').toString().trim().toLowerCase().replace(/^@+/, '')
  const [mode, setMode] = useState(null)          // 'campaign' | 'magnet' | null
  const [magnets, setMagnets] = useState([])      // gerangschikt: meest gebruikt eerst
  const [loadingMagnets, setLoadingMagnets] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedMagnetId, setSelectedMagnetId] = useState('')
  const [name, setName] = useState('')
  const [stage, setStage] = useState('name')      // magnet-mode: 'name' → 'pickMagnet'
  const [lastAdded, setLastAdded] = useState(null) // { id, name, sectionId }
  const [addedCount, setAddedCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [showAllMagnets, setShowAllMagnets] = useState(false)
  const [newMagnetMode, setNewMagnetMode] = useState(false)
  const [newMagnetName, setNewMagnetName] = useState('')
  const [creatingMagnet, setCreatingMagnet] = useState(false)
  const inputRef = useRef(null)
  const pendingRef = useRef(new Set()) // namen die nu nog aan het opslaan zijn

  const selectedMagnet = magnets.find(m => m.id === selectedMagnetId) || null
  const isDuplicate = !!normName(name) && existingNames instanceof Set && existingNames.has(normName(name))

  // Reset bij openen.
  useEffect(() => {
    if (isOpen) {
      setMode(null); setName(''); setStage('name'); setLastAdded(null); setAddedCount(0); setSelectedMagnetId('')
      setShowAllMagnets(false); setNewMagnetMode(false); setNewMagnetName('')
      pendingRef.current = new Set()
      const active = campaigns.find(c => c.status === 'active') || campaigns[0]
      setSelectedCampaignId(active?.id || '')
    }
  }, [isOpen])

  // Lead magnets ophalen + rangschikken op hoe vaak ze al gebruikt zijn
  // (meest gebruikt bovenaan), tie-break op positie en datum.
  useEffect(() => {
    if (!isOpen || !coachId || !db?.supabase) return
    let cancelled = false
    setLoadingMagnets(true)
    Promise.all([
      db.supabase.from('lead_magnets').select('id, name, position, created_at').eq('coach_id', coachId),
      db.supabase.from('call_leads').select('source_lead_magnet_id').eq('coach_id', coachId).not('source_lead_magnet_id', 'is', null).is('deleted_at', null),
    ]).then(([{ data: mags, error }, { data: usage }]) => {
      if (cancelled) return
      if (error) { console.error('magnets laden mislukt:', error); setMagnets([]); setLoadingMagnets(false); return }
      const useCount = {}
      ;(usage || []).forEach(u => { if (u.source_lead_magnet_id) useCount[u.source_lead_magnet_id] = (useCount[u.source_lead_magnet_id] || 0) + 1 })
      const ranked = (mags || []).slice().sort((a, b) => {
        const dc = (useCount[b.id] || 0) - (useCount[a.id] || 0)
        if (dc !== 0) return dc
        const dp = (a.position ?? 0) - (b.position ?? 0)
        if (dp !== 0) return dp
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }).map(m => ({ ...m, _useCount: useCount[m.id] || 0 }))
      setMagnets(ranked)
      // Bewust GEEN default-selectie: de eerste Enter (naam-stap) mag niet
      // meteen opslaan — eerst kies je een magnet in de pickMagnet-stap.
      setLoadingMagnets(false)
    })
    return () => { cancelled = true }
  }, [isOpen, coachId, db])

  // Focus de naam-balk in de naam-stap (in de pickMagnet-stap is 'ie disabled
  // zodat cijfers niet in de naam terechtkomen).
  useEffect(() => {
    if (isOpen && mode && stage === 'name') {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [isOpen, mode, stage])

  // pickMagnet-stap (magnet-mode): 1–9 selecteert, Enter slaat op, Esc terug.
  useEffect(() => {
    if (!isOpen || mode !== 'magnet' || stage !== 'pickMagnet') return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setStage('name'); return }
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1
        if (idx < magnets.length) { e.preventDefault(); setSelectedMagnetId(magnets[idx].id); if (idx >= 5) setShowAllMagnets(true) }
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const m = magnets.find(x => x.id === selectedMagnetId)
        if (m) addLead(m)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, mode, stage, magnets, selectedMagnetId, name, busy, existingNames])

  const addLead = (magnetOverride) => {
    const nm = name.trim()
    if (!nm) return
    const key = normName(nm)
    // Dubbel? Check zowel de bestaande namen als de leads die NU nog aan het
    // opslaan zijn (pendingRef) — zo voorkom je ook snel-achter-elkaar dubbels.
    if ((existingNames instanceof Set && existingNames.has(key)) || pendingRef.current.has(key)) return
    const isMagnet = mode === 'magnet'
    const magnet = isMagnet ? (magnetOverride || selectedMagnet) : null
    if (isMagnet && !magnet) return // geen magnet gekozen → niets doen
    const sectionId = isMagnet ? magnetsSectionId : instaSectionId
    if (!sectionId) { alert('Geen doelsectie gevonden om de lead in te plaatsen.'); return }

    // —— UI METEEN resetten zodat je direct kunt doortypen ——
    pendingRef.current.add(key)
    setName('')
    setStage('name')
    setSelectedMagnetId('')
    setTimeout(() => inputRef.current?.focus(), 0)

    // —— opslaan op de achtergrond (blokkeert het typen niet) ——
    ;(async () => {
      try {
        const clean = nm.replace(/^@+/, '')
        const leadData = {
          firstName: clean,
          source: 'Instagram',
          notes: nm.startsWith('@') ? `Instagram: @${clean}` : null,
          outreachCampaignId: isMagnet ? null : (selectedCampaignId || null),
          sourceLeadMagnetId: isMagnet ? magnet.id : null,
          leadMagnetsShared: isMagnet ? [magnet.name] : null,
        }
        const newLead = await leadService.createLeadWithSection(leadData, sectionId, coachId)
        const enriched = { ...newLead }
        if (isMagnet) {
          enriched.source_lead_magnet = { id: magnet.id, name: magnet.name }
          enriched.lead_magnets_shared = [magnet.name]
        } else if (selectedCampaignId) {
          const c = campaigns.find(x => x.id === selectedCampaignId)
          if (c) enriched.outreach_campaign = { id: c.id, name: c.name, variant_tag: c.variant_tag }
        }
        onAdded?.(enriched, sectionId)
        setLastAdded({ id: newLead.id, name: nm, sectionId })
        setAddedCount(c => c + 1)
      } catch (e) {
        console.error('rapid add mislukt:', e)
        alert('Toevoegen mislukt — ' + (e?.message || e))
      } finally {
        pendingRef.current.delete(key)
      }
    })()
  }

  const undoLast = async () => {
    if (!lastAdded || busy) return
    setBusy(true)
    try {
      await leadService.deleteLead(lastAdded.id, true)
      onRemoved?.(lastAdded.id)
      setName(lastAdded.name)
      setLastAdded(null)
      setTimeout(() => inputRef.current?.focus(), 30)
    } catch (e) {
      console.error('terughalen mislukt:', e)
      alert('Terughalen mislukt — ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const createMagnet = async () => {
    const nm = newMagnetName.trim()
    if (!nm || creatingMagnet || !db?.supabase) return
    setCreatingMagnet(true)
    try {
      const { data, error } = await db.supabase
        .from('lead_magnets')
        .insert({ coach_id: coachId, name: nm, position: magnets.length })
        .select().single()
      if (error) throw error
      setMagnets(prev => [...prev, { ...data, _useCount: 0 }])
      setSelectedMagnetId(data.id)
      setShowAllMagnets(true)
      setNewMagnetMode(false)
      setNewMagnetName('')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      alert('Magnet aanmaken mislukt — ' + (e?.message || e))
    } finally {
      setCreatingMagnet(false)
    }
  }

  const onNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!name.trim() || isDuplicate) return  // dubbele naam → Enter doet niets
      if (mode === 'magnet') {
        if (magnets.length === 0) return
        setStage('pickMagnet')   // door naar magnet kiezen — slaat nog NIET op
      } else {
        addLead()                // campagne: direct opslaan
      }
    }
  }

  if (!isOpen) return null

  const canAdd = !!name.trim() && !isDuplicate && (mode === 'campaign' || (mode === 'magnet' && !!selectedMagnet))

  const sheet = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(6px)', zIndex: 2147483400,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.25rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480, background: '#0a0a0a',
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: isMobile ? '16px 16px 0 0' : 14,
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? '92vh' : '85vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, padding: '0.85rem 1rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.55rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color={GOLD} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 800 }}>Leads toevoegen</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: 1 }}>
              {addedCount > 0 ? `${addedCount} toegevoegd deze sessie` : 'Snel op tempo invoeren'}
            </div>
          </div>
          <button onClick={onClose} style={iconBtn} title="Sluiten"><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem' }}>
          {!mode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, marginBottom: 2 }}>
                Wat voor leads voeg je toe?
              </div>
              <ChoiceBtn icon={<Send size={15} color={GOLD} />} title="Nieuwe volgers" sub="Via een outreach-campagne" onClick={() => setMode('campaign')} />
              <ChoiceBtn icon={<FileText size={15} color="#a855f7" />} title="Lead-magnet reacties" sub="Toegekend aan een lead magnet" onClick={() => setMode('magnet')} />
            </div>
          ) : (
            <>
              {/* Mode-balk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.7rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800,
                  background: mode === 'magnet' ? 'rgba(168,85,247,0.16)' : 'rgba(255,215,0,0.16)',
                  border: `1px solid ${mode === 'magnet' ? 'rgba(168,85,247,0.4)' : 'rgba(255,215,0,0.4)'}`,
                  color: mode === 'magnet' ? '#c4b5fd' : GOLD,
                }}>
                  {mode === 'magnet' ? <FileText size={11} /> : <Send size={11} />}
                  {mode === 'magnet' ? 'Lead magnet' : 'Campagne'}
                </span>
                <button onClick={() => setMode(null)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                  wissel bron
                </button>
              </div>

              {/* Campagne-keuze */}
              {mode === 'campaign' && (
                campaigns.length === 0 ? (
                  <div style={{ padding: '0.6rem', marginBottom: '0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600 }}>
                    Nog geen campagnes — leads worden zonder campagne-attributie toegevoegd.
                  </div>
                ) : (
                  <select value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)} style={selectStyle}>
                    <option value="">— geen campagne —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.variant_tag ? ` · ${c.variant_tag}` : ''}{c.status !== 'active' ? ` (${c.status})` : ''}</option>
                    ))}
                  </select>
                )
              )}

              {/* Magnet-keuze (handmatig aanvinken; meest gebruikt bovenaan) */}
              {mode === 'magnet' && (
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {stage === 'pickMagnet'
                      ? <span style={{ color: '#c4b5fd' }}>Kies een magnet — cijfer 1–9 of klik, dan Enter = opslaan</span>
                      : 'Typ een naam en druk Enter om de magnet te kiezen'}
                  </div>
                  {loadingMagnets ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', padding: '0.5rem' }}>Magnets laden…</div>
                  ) : magnets.length === 0 ? (
                    <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                      Nog geen lead magnets. Maak er eerst één aan (via een lead-kaart → Magnets).
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {(showAllMagnets ? magnets : magnets.slice(0, 5)).map((m, i) => {
                        const active = selectedMagnetId === m.id
                        return (
                          <button key={m.id} onClick={() => { setSelectedMagnetId(m.id); if (name.trim()) addLead(m); else inputRef.current?.focus() }} disabled={busy}
                            title={name.trim() ? `Toevoegen met ${m.name}` : `Selecteer ${m.name}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.5rem 0.7rem', minHeight: 40,
                              background: active ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.04)',
                              border: active ? '1px solid rgba(168,85,247,0.6)' : '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8, color: '#fff', fontSize: '0.84rem', fontWeight: active ? 800 : 600,
                              textAlign: 'left', cursor: busy ? 'not-allowed' : 'pointer', touchAction: 'manipulation',
                            }}>
                            <span style={{
                              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: active ? '#a855f7' : 'rgba(255,255,255,0.08)',
                              color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 900,
                            }}>{i < 9 ? i + 1 : '•'}</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                            {(m._useCount || 0) > 0 && (
                              <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: active ? 'rgba(255,255,255,0.18)' : 'rgba(168,85,247,0.18)', color: active ? '#fff' : '#c4b5fd' }}>
                                {m._useCount}×
                              </span>
                            )}
                            {active && <Check size={14} color="#c4b5fd" strokeWidth={3} />}
                          </button>
                        )
                      })}

                      {/* Toon meer / minder */}
                      {magnets.length > 5 && (
                        <button type="button" onClick={() => setShowAllMagnets(v => !v)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.4rem', minHeight: 32, background: 'transparent',
                            border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 6,
                            color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700,
                            cursor: 'pointer', touchAction: 'manipulation',
                          }}>
                          <ChevronDown size={12} style={{ transform: showAllMagnets ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                          {showAllMagnets ? 'Toon minder' : `Toon ${magnets.length - 5} meer`}
                        </button>
                      )}

                      {/* Magnet toevoegen (inline) */}
                      {newMagnetMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.5rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 7 }}>
                          <input
                            autoFocus value={newMagnetName}
                            onChange={(e) => setNewMagnetName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createMagnet() } if (e.key === 'Escape') { setNewMagnetMode(false); setNewMagnetName('') } }}
                            placeholder="Naam van nieuwe magnet…"
                            style={{ flex: 1, minWidth: 0, minHeight: 32, padding: '0.35rem 0.55rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
                          />
                          <button type="button" onClick={createMagnet} disabled={!newMagnetName.trim() || creatingMagnet}
                            style={{ minHeight: 32, padding: '0 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: newMagnetName.trim() && !creatingMagnet ? GOLD : 'rgba(255,255,255,0.06)', color: newMagnetName.trim() && !creatingMagnet ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 5, fontSize: '0.72rem', fontWeight: 800, cursor: newMagnetName.trim() && !creatingMagnet ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}>
                            <Plus size={11} strokeWidth={3} /> {creatingMagnet ? 'Bezig…' : 'Maak aan'}
                          </button>
                          <button type="button" onClick={() => { setNewMagnetMode(false); setNewMagnetName('') }}
                            style={{ minHeight: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', touchAction: 'manipulation' }}>
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setNewMagnetMode(true); setNewMagnetName('') }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.7rem', minHeight: 36, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 7, color: GOLD, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
                          <Plus size={13} strokeWidth={2.6} /> Magnet toevoegen
                        </button>
                      )}
                    </div>
                  )}
                  {/* Lege-staat: ook hier een toevoeg-optie */}
                  {!loadingMagnets && magnets.length === 0 && (
                    newMagnetMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', padding: '0.4rem 0.5rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 7 }}>
                        <input autoFocus value={newMagnetName} onChange={(e) => setNewMagnetName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createMagnet() } if (e.key === 'Escape') { setNewMagnetMode(false); setNewMagnetName('') } }}
                          placeholder="Naam van nieuwe magnet…"
                          style={{ flex: 1, minWidth: 0, minHeight: 32, padding: '0.35rem 0.55rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
                        />
                        <button type="button" onClick={createMagnet} disabled={!newMagnetName.trim() || creatingMagnet}
                          style={{ minHeight: 32, padding: '0 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: newMagnetName.trim() && !creatingMagnet ? GOLD : 'rgba(255,255,255,0.06)', color: newMagnetName.trim() && !creatingMagnet ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 5, fontSize: '0.72rem', fontWeight: 800, cursor: newMagnetName.trim() && !creatingMagnet ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}>
                          <Plus size={11} strokeWidth={3} /> {creatingMagnet ? 'Bezig…' : 'Maak aan'}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setNewMagnetMode(true); setNewMagnetName('') }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', width: '100%', marginTop: '0.4rem', padding: '0.45rem 0.7rem', minHeight: 36, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 7, color: GOLD, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
                        <Plus size={13} strokeWidth={2.6} /> Magnet toevoegen
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Naam-balk + terughalen */}
              <div style={{ display: 'flex', gap: 6, marginTop: '0.2rem' }}>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={onNameKeyDown}
                  disabled={mode === 'magnet' && stage === 'pickMagnet'}
                  placeholder={mode === 'magnet' && stage === 'pickMagnet' ? 'Kies een magnet (1–9 of klik) → Enter' : (mode === 'magnet' ? 'Naam of @handle… (Enter = magnet kiezen)' : 'Naam of @handle… (Enter = toevoegen)')}
                  style={{
                    flex: 1, minWidth: 0, minHeight: 44, padding: '0.5rem 0.7rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${isDuplicate ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 600, outline: 'none',
                    opacity: (mode === 'magnet' && stage === 'pickMagnet') ? 0.5 : 1,
                  }}
                />
                <button
                  onClick={undoLast}
                  disabled={!lastAdded || busy}
                  title={lastAdded ? `Laatste terughalen: ${lastAdded.name}` : 'Niets om terug te halen'}
                  style={{
                    flexShrink: 0, minHeight: 44, padding: '0 0.7rem',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: lastAdded ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${lastAdded ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, color: lastAdded ? '#fca5a5' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.72rem', fontWeight: 700,
                    cursor: lastAdded && !busy ? 'pointer' : 'not-allowed', touchAction: 'manipulation',
                  }}
                >
                  <RotateCcw size={13} /> {!isMobile && 'Terughalen'}
                </button>
              </div>

              {/* Duplicaat-waarschuwing — Enter/toevoegen is geblokkeerd */}
              {isDuplicate && (
                <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: 5, color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700 }}>
                  <X size={12} /> "{name.trim()}" bestaat al — wijzig de naam om door te gaan.
                </div>
              )}

              {/* Toevoeg-knop (alternatief voor Enter) */}
              <button onClick={() => addLead()} disabled={!canAdd || busy}
                style={{
                  width: '100%', marginTop: '0.6rem', minHeight: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: canAdd ? GOLD : 'rgba(255,255,255,0.06)',
                  color: canAdd ? '#000' : 'rgba(255,255,255,0.3)',
                  border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem',
                  cursor: canAdd && !busy ? 'pointer' : 'not-allowed', touchAction: 'manipulation',
                }}>
                Toevoegen{mode === 'magnet' && selectedMagnet ? ` met "${selectedMagnet.name}"` : ''} <CornerDownLeft size={14} strokeWidth={2.6} />
              </button>

              {lastAdded && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                  Laatst toegevoegd: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{lastAdded.name}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, modalHost)
}

function ChoiceBtn({ icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
      padding: '0.8rem 0.85rem', borderRadius: 10, textAlign: 'left',
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer', touchAction: 'manipulation',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 700 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: 1 }}>{sub}</div>
      </div>
      <ArrowRight size={15} color="rgba(255,255,255,0.3)" />
    </button>
  )
}

const iconBtn = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}
const selectStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', minHeight: 42,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#fff', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
}
