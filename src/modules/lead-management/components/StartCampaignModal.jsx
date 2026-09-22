// src/modules/lead-management/components/StartCampaignModal.jsx
// Kies welke outreach-campagne je start. Daarna verschijnt op elke lead-card
// een campagne-DM-knop die het campagne-bericht kopieert + het profiel opent.
//
// De hele regel is de startknop: starten is wat je hier in negen van de tien
// gevallen komt doen, dus dat mag geen klein knopje naast drie andere zijn.
// Bewerken zit achter het potlood, verwijderen binnen het bewerk-venster —
// een rij van vier icoontjes per campagne leest als een dashboard, niet als
// een keuze.
//
// De cijfers staan achter één schakelaar bovenin in plaats van een knop per
// campagne: getCampaignBreakdown haalt ze tóch in één keer voor alle
// campagnes op. Eén klik toont ze dus overal, en zolang je ze niet opvraagt
// blijft het openen van dit scherm licht.
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { X, Megaphone, Send, Plus, Pencil, Search, BarChart2 } from 'lucide-react'

const LIJN = 'rgba(255,255,255,0.09)'
const LIJN_ZACHT = 'rgba(255,255,255,0.06)'

// Vanaf dit aantal campagnes verschijnt het zoekveld; daaronder scroll je
// sneller dan je typt.
const ZOEK_VANAF = 6

const PLATFORMS = ['instagram', 'linkedin', 'facebook', 'tiktok', 'whatsapp', 'e-mail', 'anders']

const veld = {
  width: '100%', boxSizing: 'border-box', minHeight: 42,
  padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${LIJN}`, borderRadius: 10, color: '#fff',
  fontSize: '0.88rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
}

const knopWit = (uit) => ({
  flex: 2, minHeight: 42, borderRadius: 10, border: 'none',
  background: uit ? 'rgba(255,255,255,0.25)' : '#fff', color: '#000',
  fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit',
  cursor: uit ? 'not-allowed' : 'pointer', opacity: uit ? 0.55 : 1,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

const knopKaal = {
  flex: 1, minHeight: 42, borderRadius: 10,
  background: 'transparent', border: `1px solid ${LIJN}`,
  color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 800,
  fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation',
}

export default function StartCampaignModal({ leadService, coachId, isMobile = false, onSelect, onClose }) {
  const modalHost = useModalHost()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', platform: 'instagram', messageText: '' })
  const [zoek, setZoek] = useState('')
  // Inline bewerken van een bestaande campagne (naam + bericht).
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', messageText: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ name: c.name || '', messageText: c.message_text || '' })
  }

  // Cijfers. getCampaignBreakdown haalt álle campagne-leads op met hun reacties
  // en funnel-stappen — te zwaar om te doen bij het openen van dit scherm,
  // terwijl je meestal gewoon een campagne wilt starten. Daarom pas op verzoek,
  // en dan in één keer voor alle campagnes.
  const [cijfersAan, setCijfersAan] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsLaden, setStatsLaden] = useState(false)

  const wisselCijfers = async () => {
    const aan = !cijfersAan
    setCijfersAan(aan)
    if (!aan || stats || statsLaden) return
    setStatsLaden(true)
    try {
      const { campaigns: rijen } = await leadService.getCampaignBreakdown(coachId)
      setStats(new Map((rijen || []).map(r => [r.id, r])))
    } catch (e) {
      console.error('Campagne-cijfers laden mislukt:', e)
      setStats(new Map())
    }
    setStatsLaden(false)
  }

  const handleDelete = async (c) => {
    if (deletingId) return
    // Leads met deze campagne-tag: hun tag valt weg (ON DELETE SET NULL), de
    // leads zelf blijven. Metrics/sends van de campagne worden mee verwijderd.
    let leadCount = 0
    try {
      const { count } = await leadService.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .eq('outreach_campaign_id', c.id)
        .is('deleted_at', null)
      leadCount = count || 0
    } catch (e) {
      // Alleen de waarschuwingstekst wordt minder precies; het verwijderen
      // zelf gaat gewoon door.
      console.warn('Aantal gekoppelde leads ophalen mislukt:', e)
    }
    const msg = leadCount > 0
      ? `Campagne "${c.name}" verwijderen?\n\n${leadCount} lead(s) verliezen hun campagne-tag (de leads zelf blijven bestaan). Dit kan niet ongedaan worden.`
      : `Campagne "${c.name}" verwijderen? Dit kan niet ongedaan worden.`
    if (!confirm(msg)) return
    setDeletingId(c.id)
    try {
      const { error } = await leadService.db.supabase
        .from('outreach_campaigns')
        .delete()
        .eq('id', c.id)
      if (error) throw error
      setEditingId(null)
      await load()
    } catch (e) { console.error('Campagne verwijderen mislukt:', e); alert('Verwijderen mislukt.') }
    finally { setDeletingId(null) }
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim() || !editForm.messageText.trim() || editSaving) return
    setEditSaving(true)
    try {
      const { error } = await leadService.db.supabase
        .from('outreach_campaigns')
        .update({ name: editForm.name.trim(), message_text: editForm.messageText.trim() })
        .eq('id', editingId)
      if (error) throw error
      setEditingId(null)
      await load()
    } catch (e) { console.error('Campagne bijwerken mislukt:', e); alert('Bijwerken mislukt.') }
    finally { setEditSaving(false) }
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await leadService.getCampaigns(coachId)
      setCampaigns((data || []).filter(c => c.status !== 'archived'))
    } catch (e) { console.error('Campagnes laden mislukt:', e); setCampaigns([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { let alive = true; if (alive) load(); return () => { alive = false } }, [leadService, coachId])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.messageText.trim() || saving) return
    setSaving(true)
    try {
      const { data, error } = await leadService.db.supabase
        .from('outreach_campaigns')
        .insert({
          coach_id: coachId, name: form.name.trim(), platform: form.platform,
          message_text: form.messageText.trim(), status: 'active',
        })
        .select().single()
      if (error) throw error
      setCreating(false)
      setForm({ name: '', platform: 'instagram', messageText: '' })
      await load()
      if (data) onSelect(data) // meteen starten met de nieuwe campagne
    } catch (e) { console.error('Campagne aanmaken mislukt:', e); alert('Aanmaken mislukt.') }
    finally { setSaving(false) }
  }

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    if (!q) return campaigns
    return campaigns.filter(c => `${c.name || ''} ${c.platform || ''} ${c.message_text || ''}`.toLowerCase().includes(q))
  }, [campaigns, zoek])

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, maxHeight: isMobile ? '90vh' : '82vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: isMobile ? '18px 18px 0 0' : 18, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.8)' }}
      >
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? 'calc(0.9rem + env(safe-area-inset-top)) 1rem 0.8rem' : '1rem', borderBottom: `1px solid ${LIJN}` }}>
          <Megaphone size={17} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>Campagnes</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 700, marginTop: 1 }}>
              Tik een campagne aan om te starten
            </div>
          </div>
          <button
            onClick={wisselCijfers}
            title="Cijfers van alle campagnes tonen"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              minHeight: 32, padding: '0 0.6rem', borderRadius: 9,
              background: cijfersAan ? '#fff' : 'transparent',
              border: `1px solid ${cijfersAan ? '#fff' : LIJN}`,
              color: cijfersAan ? '#000' : 'rgba(255,255,255,0.65)',
              fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            <BarChart2 size={13} strokeWidth={2.8} /> Cijfers
          </button>
          <button onClick={onClose} title="Sluiten" aria-label="Sluiten" style={{ width: 32, height: 32, borderRadius: 9, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={17} strokeWidth={3} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Nieuwe campagne — inline maak-formulier */}
          {creating ? (
            <div style={{ padding: '0.9rem 1rem', borderBottom: `1px solid ${LIJN}`, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>Nieuwe campagne</div>
              <input
                value={form.name} autoFocus
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Naam (bv. Lidl gids)"
                style={veld}
              />
              <select
                value={form.platform}
                onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))}
                style={{ ...veld, cursor: 'pointer' }}
              >
                {PLATFORMS.map(p => <option key={p} value={p} style={{ background: '#111' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <textarea
                value={form.messageText}
                onChange={(e) => setForm(f => ({ ...f, messageText: e.target.value }))}
                placeholder="Bericht… gebruik {{ name }} voor de naam"
                rows={4}
                style={{ ...veld, fontWeight: 600, resize: 'vertical', lineHeight: 1.45 }}
              />
              <NaamHint />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCreating(false); setForm({ name: '', platform: 'instagram', messageText: '' }) }} style={knopKaal}>Annuleer</button>
                <button onClick={handleCreate} disabled={!form.name.trim() || !form.messageText.trim() || saving}
                  style={knopWit(!form.name.trim() || !form.messageText.trim() || saving)}>
                  {saving ? 'Opslaan…' : 'Aanmaken & starten'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.8rem 1rem', borderBottom: `1px solid ${LIJN}`,
                background: 'transparent', border: 'none', borderRadius: 0,
                color: '#fff', fontSize: '0.86rem', fontWeight: 800, fontFamily: 'inherit',
                cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
              }}>
              <Plus size={16} strokeWidth={3} /> Nieuwe campagne
            </button>
          )}

          {!loading && campaigns.length >= ZOEK_VANAF && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: `1px solid ${LIJN}` }}>
              <Search size={14} color="rgba(255,255,255,0.35)" strokeWidth={2.8} style={{ flexShrink: 0 }} />
              <input
                value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek campagne…"
                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.86rem', fontWeight: 700, fontFamily: 'inherit' }}
              />
              {zoek && <button onClick={() => setZoek('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={14} /></button>}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 700 }}>Laden…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.6 }}>
              Nog geen campagnes.<br />Maak er hierboven een aan.
            </div>
          ) : zichtbaar.length === 0 ? (
            <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 700 }}>
              Geen campagne gevonden voor “{zoek}”.
            </div>
          ) : (
            zichtbaar.map(c => (
              editingId === c.id ? (
                <div key={c.id} style={{ padding: '0.9rem 1rem', borderBottom: `1px solid ${LIJN_ZACHT}`, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>Campagne bewerken</div>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Naam"
                    style={veld}
                  />
                  <textarea
                    value={editForm.messageText}
                    onChange={(e) => setEditForm(f => ({ ...f, messageText: e.target.value }))}
                    placeholder="Bericht… gebruik {{ name }} voor de naam"
                    rows={5}
                    style={{ ...veld, fontWeight: 600, resize: 'vertical', lineHeight: 1.45 }}
                  />
                  <NaamHint />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditingId(null)} style={knopKaal}>Annuleer</button>
                    <button onClick={handleUpdate} disabled={!editForm.name.trim() || !editForm.messageText.trim() || editSaving}
                      style={knopWit(!editForm.name.trim() || !editForm.messageText.trim() || editSaving)}>
                      {editSaving ? 'Opslaan…' : 'Opslaan'}
                    </button>
                  </div>
                  {/* Verwijderen hoort bij bewerken, niet bij kiezen: in de lijst
                      stond het naast de startknop en dat is te dicht op elkaar. */}
                  <button onClick={() => handleDelete(c)} disabled={deletingId === c.id}
                    style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: '0.3rem 0', color: '#ef4444', fontSize: '0.76rem', fontWeight: 800, fontFamily: 'inherit', cursor: deletingId === c.id ? 'wait' : 'pointer', opacity: deletingId === c.id ? 0.5 : 1 }}>
                    {deletingId === c.id ? 'Verwijderen…' : 'Campagne verwijderen'}
                  </button>
                </div>
              ) : (
                <CampagneRegel
                  key={c.id}
                  c={c}
                  cijfersAan={cijfersAan}
                  statsLaden={statsLaden}
                  rij={stats?.get(c.id)}
                  onStart={() => onSelect(c)}
                  onEdit={() => startEdit(c)}
                />
              )
            ))
          )}
        </div>
      </div>
    </div>,
    modalHost
  )
}

function NaamHint() {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
      <b style={{ color: 'rgba(255,255,255,0.7)' }}>{'{{ name }}'}</b> wordt de naam van de lead. ([naam] en {'{first_name}'} werken ook.)
    </div>
  )
}

// Eén campagne. De regel zelf start hem; het potlood opent het bewerk-venster.
function CampagneRegel({ c, cijfersAan, statsLaden, rij, onStart, onEdit }) {
  const geenBericht = !c.message_text

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${LIJN_ZACHT}` }}>
      <button
        onClick={() => !geenBericht && onStart()}
        disabled={geenBericht}
        title={geenBericht ? 'Deze campagne heeft geen bericht-tekst' : `Start ${c.name}`}
        style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.8rem 0.5rem 0.8rem 1rem', background: 'transparent', border: 'none',
          textAlign: 'left', fontFamily: 'inherit',
          cursor: geenBericht ? 'not-allowed' : 'pointer', opacity: geenBericht ? 0.55 : 1,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.name || 'Naamloze campagne'}{c.variant_tag ? ` · ${c.variant_tag}` : ''}
            </span>
            <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              {c.platform || 'instagram'}{c.purpose ? ` · ${c.purpose}` : ''}
            </span>
          </div>

          {geenBericht ? (
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f87171', marginTop: 3 }}>
              Geen bericht — open het potlood om er een toe te voegen.
            </div>
          ) : (
            <div style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45,
              marginTop: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', wordBreak: 'break-word',
            }}>
              {c.message_text}
            </div>
          )}

          {cijfersAan && <CampagneCijfers laden={statsLaden} rij={rij} leadsFallback={c.auto_leads ?? 0} />}
        </div>
        <Send size={15} strokeWidth={2.8} color="rgba(255,255,255,0.75)" style={{ flexShrink: 0 }} />
      </button>
      <button onClick={onEdit} title="Campagne bewerken" aria-label="Campagne bewerken"
        style={{ flexShrink: 0, width: 46, background: 'transparent', border: 'none', borderLeft: `1px solid ${LIJN_ZACHT}`, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
        <Pencil size={14} strokeWidth={2.6} />
      </button>
    </div>
  )
}

// Cijfers van één campagne. Alles gemeten ná het moment dat het
// campagne-bericht de deur uitging (campaign_message_sent_at), zodat een
// reactie van vóór de campagne het cijfer niet opblaast.
function CampagneCijfers({ laden, rij, leadsFallback }) {
  const stil = { fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 6 }
  if (laden && !rij) return <div style={stil}>Cijfers ophalen…</div>

  const totaal = rij?.total ?? leadsFallback
  if (!totaal) return <div style={stil}>Nog geen leads gekoppeld.</div>

  const pct = (n) => (totaal > 0 ? `${Math.round((n / totaal) * 1000) / 10}%` : '—')
  const st = rij?.stages || { replied: 0, callProposed: 0, callScheduled: 0, sale: 0 }
  const vakken = [
    { label: 'Leads',       waarde: totaal,                 titel: 'Leads met deze campagne als bron.' },
    { label: 'Reacties',    waarde: st.replied,       sub: pct(st.replied),       titel: 'Leads die reageerden nádat het campagne-bericht verstuurd was.' },
    { label: 'Voorgesteld', waarde: st.callProposed,  sub: pct(st.callProposed),  titel: 'Leads aan wie je daarna een call voorstelde.' },
    { label: 'Ingepland',   waarde: st.callScheduled, sub: pct(st.callScheduled), titel: 'Leads die daarna een call inplanden.' },
    { label: 'Sales',       waarde: st.sale,          sub: pct(st.sale),          titel: 'Leads die daarna klant werden.' },
    { label: 'Follow-ups',  waarde: rij?.followupCount ?? 0,                      titel: 'Opvolg-berichten die je naar leads van deze campagne stuurde.' },
  ]

  const laatst = rij?.lastSentAt ? new Date(rij.lastSentAt) : null
  const uren = laatst ? (Date.now() - laatst.getTime()) / 3600000 : null

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${LIJN_ZACHT}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
        {vakken.map(v => (
          <div key={v.label} title={v.titel} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{v.waarde}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              {v.label}{v.sub ? ` · ${v.sub}` : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Wanneer het bericht de deur uitging. Zonder deze regel leest "1 reactie
          op 96 leads" als een kapotte teller, terwijl het klopt zodra je ziet
          dat je de campagne een uur geleden verstuurde. Alles hierboven meet
          vanaf dat moment — een reactie van vóór de campagne telt niet mee. */}
      {laatst && (
        <div style={{ marginTop: 5, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.45 }}>
          {rij.sentCount} verstuurd · laatste{' '}
          {uren < 24 ? `${Math.max(1, Math.round(uren))} uur geleden` : laatst.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          . Alles hierboven telt vanaf dat bericht.
        </div>
      )}
    </div>
  )
}
