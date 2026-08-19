// src/modules/lead-management/components/StartCampaignModal.jsx
// Kies welke outreach-campagne je start. Daarna verschijnt op elke lead-card
// een campagne-DM-knop die het campagne-bericht kopieert + het profiel opent.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Megaphone, Send, Check, Plus, Pencil } from 'lucide-react'

export default function StartCampaignModal({ leadService, coachId, isMobile = false, onSelect, onClose }) {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', platform: 'instagram', messageText: '' })
  // Inline bewerken van een bestaande campagne (naam + bericht).
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', messageText: '' })
  const [editSaving, setEditSaving] = useState(false)

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ name: c.name || '', messageText: c.message_text || '' })
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

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, maxHeight: isMobile ? '90vh' : '82vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(168,85,247,0.28)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
      >
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
          <Megaphone size={17} color="#a855f7" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Start een campagne</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', marginTop: 1 }}>Kies welke je uitvoert — dan krijgt elke lead-card een DM-knop.</div>
          </div>
          <button onClick={onClose} title="Sluiten" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
          {/* Nieuwe campagne — inline maak-formulier */}
          {creating ? (
            <div style={{ padding: '0.85rem', borderRadius: 12, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.28)', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>Nieuwe campagne</div>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Naam (bv. Lidl gids)"
                style={{ width: '100%', padding: '0.55rem 0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
              <input
                value={form.platform}
                onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))}
                placeholder="Platform (bv. instagram)"
                style={{ width: '100%', padding: '0.55rem 0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
              <textarea
                value={form.messageText}
                onChange={(e) => setForm(f => ({ ...f, messageText: e.target.value }))}
                placeholder="Bericht… gebruik {{ name }} voor de naam"
                rows={4}
                style={{ width: '100%', padding: '0.55rem 0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCreating(false); setForm({ name: '', platform: 'instagram', messageText: '' }) }}
                  style={{ flex: 1, padding: '0.55rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Annuleer</button>
                <button onClick={handleCreate} disabled={!form.name.trim() || !form.messageText.trim() || saving}
                  style={{ flex: 1, padding: '0.55rem', borderRadius: 9, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#a855f7', fontSize: '0.75rem', fontWeight: 800, cursor: (!form.name.trim() || !form.messageText.trim() || saving) ? 'not-allowed' : 'pointer', opacity: (!form.name.trim() || !form.messageText.trim() || saving) ? 0.5 : 1 }}>
                  {saving ? 'Opslaan…' : 'Aanmaken & starten'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.6rem', marginBottom: '0.85rem', borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px dashed rgba(168,85,247,0.45)', color: '#a855f7', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
              <Plus size={15} /> Nieuwe campagne
            </button>
          )}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Nog geen campagnes. Maak er eerst een aan in de Analytics-tab (met een bericht-tekst).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaigns.map(c => {
                const noMsg = !c.message_text
                const isEditing = editingId === c.id

                // ─── BEWERK-MODUS ───
                if (isEditing) {
                  return (
                    <div key={c.id} style={{ padding: '0.75rem 0.85rem', borderRadius: 11, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a855f7' }}>Campagne bewerken</div>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Naam"
                        style={{ width: '100%', padding: '0.5rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                      />
                      <textarea
                        value={editForm.messageText}
                        onChange={(e) => setEditForm(f => ({ ...f, messageText: e.target.value }))}
                        placeholder="Bericht… gebruik {{ name }} voor de naam"
                        rows={5}
                        style={{ width: '100%', padding: '0.5rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingId(null)}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Annuleer</button>
                        <button onClick={handleUpdate} disabled={!editForm.name.trim() || !editForm.messageText.trim() || editSaving}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: 9, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#a855f7', fontSize: '0.75rem', fontWeight: 800, cursor: (!editForm.name.trim() || !editForm.messageText.trim() || editSaving) ? 'not-allowed' : 'pointer', opacity: (!editForm.name.trim() || !editForm.messageText.trim() || editSaving) ? 0.5 : 1 }}>
                          {editSaving ? 'Opslaan…' : 'Opslaan'}
                        </button>
                      </div>
                    </div>
                  )
                }

                // ─── NORMALE WEERGAVE ───
                return (
                  <div
                    key={c.id}
                    style={{
                      width: '100%', padding: '0.75rem 0.85rem', borderRadius: 11,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      opacity: noMsg ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: c.message_text ? '0.5rem' : 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name || 'Naamloze campagne'}{c.variant_tag ? ` · ${c.variant_tag}` : ''}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                          {c.platform || 'instagram'}{c.purpose ? ` · ${c.purpose}` : ''}
                        </div>
                      </div>
                      {/* Bewerk-knop */}
                      <button onClick={() => startEdit(c)} title="Bericht bewerken"
                        style={{ flexShrink: 0, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                        <Pencil size={13} />
                      </button>
                      {/* Start-knop */}
                      <button onClick={() => !noMsg && onSelect(c)} disabled={noMsg}
                        title={noMsg ? 'Deze campagne heeft geen bericht-tekst' : `Start ${c.name}`}
                        style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.32rem 0.65rem', borderRadius: 8, fontSize: '0.62rem', fontWeight: 800, background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7', cursor: noMsg ? 'not-allowed' : 'pointer', opacity: noMsg ? 0.5 : 1 }}>
                        <Send size={11} /> Start
                      </button>
                    </div>
                    {c.message_text && (
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.5rem 0.6rem' }}>
                        {c.message_text}
                      </div>
                    )}
                    {noMsg && <div style={{ fontSize: '0.62rem', color: 'rgba(239,68,68,0.7)', fontWeight: 700, marginTop: 4 }}>Geen bericht-tekst — klik op het potlood om er een toe te voegen.</div>}
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: '0.85rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Check size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            Gebruik <b style={{ color: 'rgba(255,255,255,0.55)' }}>{'{{ name }}'}</b> in je bericht — dat wordt automatisch de naam/handle van de lead. ([naam] en {'{first_name}'} werken ook.)
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
