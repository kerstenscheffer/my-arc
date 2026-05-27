// src/modules/output-planning/components/OutputHub.jsx
// Single-page content hub. Three stacked sections — no tabs:
//   1. Inbox       — loose ideas in `content_items` (status='idea')
//   2. Batches     — `content_batches` + `batch_items` (real batches)
//   3. Klaar       — `content_items` with status='ready' (no planned_date)
//
// Top action row has two primary buttons: "+ Idee" (quick) and "+ Batch".
// Every idea row has a Teleprompter button so you go from input → recording
// in one screen.

import { useEffect, useState } from 'react'
import {
  Plus, Inbox, Package, CheckCircle, Video, Edit3, Trash2,
  ChevronDown, ChevronRight,
} from 'lucide-react'

import BatchService from '../../content-batches/BatchService'
import BatchModal from '../../content-batches/components/BatchModal'
import EditBatchItemModal from '../../content-batches/components/EditBatchItemModal'

import BatchesListView from './content-library/BatchesListView'
import QuickIdeaModal from './QuickIdeaModal'
import TeleprompterModal from './TeleprompterModal'

const GOLD = '#FFD700'

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// One-line preview of a long script: first ~110 chars, single line.
const snippet = (txt, max = 110) => {
  if (!txt) return ''
  const s = txt.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function OutputHub({ db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const [batchService] = useState(() => new BatchService(db.supabase))

  // Data
  const [ideas, setIdeas] = useState([])
  const [readyItems, setReadyItems] = useState([])
  const [batches, setBatches] = useState([])
  // User-defined inbox sections from `content_sections`. Ideas are grouped
  // under these via content_items.section_id. Items without a section land
  // under a virtual "Geen sectie" group.
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  // Top-level group toggles. Inbox starts collapsed per request — coach
  // expands the sections he cares about. Batches + Klaar stay open.
  const [openInbox, setOpenInbox] = useState(false)
  const [openBatches, setOpenBatches] = useState(true)
  const [openReady, setOpenReady] = useState(true)

  // Per-section expanded state (keyed by section id; '__none__' for the
  // unsectioned virtual group). All collapsed by default.
  const [openSectionIds, setOpenSectionIds] = useState({})
  const toggleSection = (id) =>
    setOpenSectionIds(prev => ({ ...prev, [id]: !prev[id] }))

  // Modals
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [ideaToEdit, setIdeaToEdit] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [teleScript, setTeleScript] = useState(null) // { script, title }
  const [showEditBatchItem, setShowEditBatchItem] = useState(false)
  const [batchItemToEdit, setBatchItemToEdit] = useState(null)

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      // Pull the full set of editable fields so re-opening an idea in the
      // QuickIdeaModal shows everything (type, hook, b_roll_list, notes) and
      // not just title + script.
      const idea_cols = 'id, title, type, hook, script, notes, b_roll_list, section_id, status, created_at, updated_at'
      const [{ data: ideasData }, { data: readyData }, batchData, { data: sectionsData }] = await Promise.all([
        db.supabase.from('content_items')
          .select(idea_cols)
          .eq('coach_id', user.id).eq('status', 'idea')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        db.supabase.from('content_items')
          .select(idea_cols)
          .eq('coach_id', user.id).eq('status', 'ready').is('planned_date', null)
          .order('updated_at', { ascending: false, nullsFirst: false }),
        batchService.getBatchesWithItems(user.id),
        db.supabase.from('content_sections')
          .select('id, title, position, created_at')
          .eq('coach_id', user.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
      ])
      setIdeas(ideasData || [])
      setReadyItems(readyData || [])
      setBatches(batchData || [])
      setSections(sectionsData || [])
    } catch (e) {
      console.error('OutputHub load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh after the create-batch modal closes (it might have saved a new
  // batch). The BatchModal does its own save via `onSave`, but to keep this
  // hub simple we just refetch.
  useEffect(() => {
    if (!showBatchModal) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBatchModal])

  // ── Inbox-section actions ────────────────────────────────────────────────
  const createSection = async () => {
    const title = window.prompt('Naam voor nieuwe sectie?')?.trim()
    if (!title) return
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const { data, error } = await db.supabase.from('content_sections')
        .insert({ coach_id: user.id, title, position: sections.length })
        .select().single()
      if (error) throw error
      setSections(prev => [...prev, data])
      setOpenSectionIds(prev => ({ ...prev, [data.id]: true }))
    } catch (e) {
      alert(`Sectie maken mislukt — ${e?.message || e}`)
    }
  }

  const renameSection = async (section) => {
    const title = window.prompt('Nieuwe naam?', section.title)?.trim()
    if (!title || title === section.title) return
    try {
      const { error } = await db.supabase.from('content_sections')
        .update({ title, updated_at: new Date().toISOString() }).eq('id', section.id)
      if (error) throw error
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, title } : s))
    } catch (e) {
      alert(`Hernoemen mislukt — ${e?.message || e}`)
    }
  }

  const deleteSection = async (section) => {
    if (!window.confirm(`Sectie "${section.title}" verwijderen? Ideeën blijven, ze komen terug onder "Geen sectie".`)) return
    try {
      // FK has ON DELETE SET NULL, so items keep their data.
      const { error } = await db.supabase.from('content_sections').delete().eq('id', section.id)
      if (error) throw error
      setSections(prev => prev.filter(s => s.id !== section.id))
      setIdeas(prev => prev.map(i => i.section_id === section.id ? { ...i, section_id: null } : i))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  // ── Idea actions ─────────────────────────────────────────────────────────
  const openNewIdea = () => { setIdeaToEdit(null); setShowIdeaModal(true) }
  const openEditIdea = (idea) => { setIdeaToEdit(idea); setShowIdeaModal(true) }
  const handleIdeaSaved = () => loadAll()
  const handleIdeaSaveAndRecord = (item) => {
    loadAll()
    setTeleScript({ script: item.script || '', title: item.title || 'Idee' })
  }

  const deleteIdea = async (idea) => {
    if (!window.confirm(`Idee "${idea.title}" verwijderen?`)) return
    try {
      await db.supabase.from('content_items').delete().eq('id', idea.id)
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      setReadyItems(prev => prev.filter(i => i.id !== idea.id))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  const markIdeaReady = async (idea) => {
    try {
      await db.supabase.from('content_items')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', idea.id)
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      setReadyItems(prev => [{ ...idea, status: 'ready' }, ...prev])
    } catch (e) {
      alert(`Verplaatsen mislukt — ${e?.message || e}`)
    }
  }

  const markReadyBackToIdea = async (item) => {
    try {
      await db.supabase.from('content_items')
        .update({ status: 'idea', updated_at: new Date().toISOString() })
        .eq('id', item.id)
      setReadyItems(prev => prev.filter(i => i.id !== item.id))
      setIdeas(prev => [{ ...item, status: 'idea' }, ...prev])
    } catch (e) {
      alert(`Terugzetten mislukt — ${e?.message || e}`)
    }
  }

  // ── Batch actions ────────────────────────────────────────────────────────
  const handleEditBatchItem = (item) => {
    setBatchItemToEdit(item); setShowEditBatchItem(true)
  }
  const handleSaveBatchItemEdit = async (itemId, updates) => {
    try {
      await batchService.updateBatchItem(itemId, updates)
      await loadAll()
    } catch (e) {
      console.error('Update batch item failed:', e)
    } finally {
      setShowEditBatchItem(false); setBatchItemToEdit(null)
    }
  }
  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Batch "${batch.batch_name || 'Naamloos'}" + alle items verwijderen?`)) return
    try {
      await batchService.deleteBatch(batch.id)
      setBatches(prev => prev.filter(b => b.id !== batch.id))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const sectionHeader = (icon, label, count, open, setOpen, trailing = null) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
      padding: isMobile ? '0.6rem 0.25rem' : '0.7rem 0.25rem',
      marginBottom: '0.3rem',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.55rem',
          background: 'transparent', border: 'none',
          color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
          textAlign: 'left', padding: 0,
        }}
      >
        {open ? <ChevronDown size={18} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={18} color="rgba(255,255,255,0.5)" />}
        {icon}
        <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800 }}>{label}</span>
        <span style={{
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
          padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700,
        }}>
          {count}
        </span>
      </button>
      {trailing}
    </div>
  )

  const ideaCard = (idea, inReady = false) => (
    <div
      key={idea.id}
      style={{
        display: 'flex', gap: '0.55rem', alignItems: 'flex-start',
        padding: isMobile ? '0.65rem 0.7rem' : '0.75rem 0.85rem',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '10px',
      }}
    >
      <div
        onClick={() => openEditIdea(idea)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{
          fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 700, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 3,
        }}>
          {idea.title || '(geen titel)'}
        </div>
        {idea.script && (
          <div style={{
            fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {snippet(idea.script)}
          </div>
        )}
        <div style={{
          marginTop: 6, display: 'flex', gap: '0.5rem',
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)',
        }}>
          {idea.created_at && <span>{formatDate(idea.created_at)}</span>}
          {!idea.script && (
            <span style={{ color: 'rgba(245,158,11,0.85)', fontWeight: 700 }}>geen script</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => setTeleScript({ script: idea.script || '', title: idea.title || 'Idee' })}
          disabled={!idea.script?.trim()}
          style={{
            padding: 8, minHeight: 40, minWidth: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: idea.script?.trim() ? GOLD : 'rgba(255,255,255,0.05)',
            color: idea.script?.trim() ? '#000' : 'rgba(255,255,255,0.3)',
            border: 'none', borderRadius: 6,
            cursor: idea.script?.trim() ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
          }}
          title={idea.script?.trim() ? 'Teleprompter' : 'Voeg eerst een script toe'}
        >
          <Video size={14} />
        </button>
        <button
          onClick={() => openEditIdea(idea)}
          style={{
            padding: 8, minHeight: 40, minWidth: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Bewerken"
        >
          <Edit3 size={13} />
        </button>
        {inReady ? (
          <button
            onClick={() => markReadyBackToIdea(idea)}
            style={{
              padding: 8, minHeight: 40, minWidth: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              touchAction: 'manipulation',
            }}
            title="Terug naar Inbox"
          >
            <Inbox size={13} />
          </button>
        ) : (
          <button
            onClick={() => markIdeaReady(idea)}
            disabled={!idea.script?.trim()}
            style={{
              padding: 8, minHeight: 40, minWidth: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: idea.script?.trim() ? '#10b981' : 'rgba(255,255,255,0.2)',
              cursor: idea.script?.trim() ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
            }}
            title="Markeer als klaar"
          >
            <CheckCircle size={13} />
          </button>
        )}
        <button
          onClick={() => deleteIdea(idea)}
          style={{
            padding: 8, minHeight: 40, minWidth: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Verwijderen"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      padding: isMobile ? '0.75rem' : '1.25rem',
      maxWidth: 1000, margin: '0 auto', width: '100%',
    }}>
      {/* Top action bar */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        marginBottom: isMobile ? '0.85rem' : '1.1rem',
      }}>
        <button
          onClick={openNewIdea}
          style={{
            flex: '1 1 0', minHeight: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: GOLD, color: '#000', border: 'none', borderRadius: 10,
            fontWeight: 800, fontSize: isMobile ? '0.9rem' : '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Plus size={18} strokeWidth={3} /> Idee
        </button>
        <button
          onClick={() => setShowBatchModal(true)}
          style={{
            flex: '1 1 0', minHeight: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            fontWeight: 700, fontSize: isMobile ? '0.9rem' : '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Package size={18} /> Nieuwe batch
        </button>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Laden…
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* ── INBOX ─────────────────────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <Inbox size={isMobile ? 16 : 18} color={GOLD} />,
              'Inbox',
              ideas.length,
              openInbox, setOpenInbox,
              <button
                onClick={(e) => { e.stopPropagation(); createSection() }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.35rem 0.65rem', minHeight: 34,
                  background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 6, color: GOLD,
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
                title="Nieuwe sectie"
              >
                <Plus size={13} /> Sectie
              </button>,
            )}
            {openInbox && (() => {
              // Build groups: user sections (in order) + virtual "Geen sectie".
              const groupOf = (sec) => ideas.filter(i => (i.section_id || null) === (sec?.id || null))
              const unassigned = groupOf(null)
              const groups = [
                ...sections.map(sec => ({ key: sec.id, section: sec, items: groupOf(sec) })),
                ...(unassigned.length > 0 || sections.length === 0
                  ? [{ key: '__none__', section: null, items: unassigned }]
                  : []),
              ]

              if (ideas.length === 0 && sections.length === 0) {
                return (
                  <div style={{
                    padding: isMobile ? '1rem' : '1.5rem', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                  }}>
                    Klik op <strong>+ Idee</strong> om je eerste idee toe te voegen,
                    of maak een <strong>sectie</strong> om te groeperen.
                  </div>
                )
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {groups.map(g => {
                    const isOpenSection = !!openSectionIds[g.key]
                    const isVirtual = g.section === null
                    return (
                      <div
                        key={g.key}
                        style={{
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: isMobile ? '0.5rem 0.65rem' : '0.6rem 0.8rem',
                        }}>
                          <button
                            onClick={() => toggleSection(g.key)}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem',
                              background: 'transparent', border: 'none', color: '#fff',
                              cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
                              padding: 0,
                            }}
                          >
                            {isOpenSection
                              ? <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
                              : <ChevronRight size={16} color="rgba(255,255,255,0.5)" />}
                            <span style={{
                              fontSize: isMobile ? '0.88rem' : '0.95rem',
                              fontWeight: 700,
                              color: isVirtual ? 'rgba(255,255,255,0.55)' : '#fff',
                              fontStyle: isVirtual ? 'italic' : 'normal',
                            }}>
                              {isVirtual ? 'Geen sectie' : g.section.title}
                            </span>
                            <span style={{
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                              padding: '1px 7px', borderRadius: 12, fontSize: '0.65rem', fontWeight: 700,
                            }}>
                              {g.items.length}
                            </span>
                          </button>
                          {!isVirtual && (
                            <>
                              <button
                                onClick={() => renameSection(g.section)}
                                title="Hernoem sectie"
                                style={{
                                  width: 32, height: 32, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 6, color: 'rgba(255,255,255,0.55)',
                                  cursor: 'pointer', touchAction: 'manipulation',
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => deleteSection(g.section)}
                                title="Verwijder sectie"
                                style={{
                                  width: 32, height: 32, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 6, color: 'rgba(255,255,255,0.45)',
                                  cursor: 'pointer', touchAction: 'manipulation',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>

                        {isOpenSection && (
                          <div style={{
                            padding: isMobile ? '0 0.5rem 0.55rem' : '0 0.6rem 0.6rem',
                            display: 'flex', flexDirection: 'column', gap: '0.4rem',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                          }}>
                            {g.items.length === 0 ? (
                              <div style={{
                                padding: '0.6rem', textAlign: 'center',
                                color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
                              }}>
                                Nog geen ideeën in deze sectie.
                              </div>
                            ) : (
                              g.items.map(idea => ideaCard(idea, false))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </section>

          {/* ── BATCHES ───────────────────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <Package size={isMobile ? 16 : 18} color={GOLD} />,
              'Batches',
              batches.length,
              openBatches, setOpenBatches,
            )}
            {openBatches && (
              <BatchesListView
                batches={batches}
                loading={false}
                onCreateBatch={null}   /* button lives in the top bar */
                onEditItem={handleEditBatchItem}
                onDeleteBatch={handleDeleteBatch}
                isMobile={isMobile}
              />
            )}
          </section>

          {/* ── KLAAR OM TE PLANNEN ───────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <CheckCircle size={isMobile ? 16 : 18} color="#10b981" />,
              'Klaar om te plannen',
              readyItems.length,
              openReady, setOpenReady,
            )}
            {openReady && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {readyItems.length === 0 ? (
                  <div style={{
                    padding: isMobile ? '1rem' : '1.5rem', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                  }}>
                    Markeer een idee als ✓ klaar om 'm hier te krijgen.
                  </div>
                ) : (
                  readyItems.map(item => ideaCard(item, true))
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modals */}
      <QuickIdeaModal
        isOpen={showIdeaModal}
        onClose={() => setShowIdeaModal(false)}
        onSaved={handleIdeaSaved}
        onSaveAndRecord={handleIdeaSaveAndRecord}
        initial={ideaToEdit}
        sections={sections}
        db={db}
      />

      <BatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSave={() => setShowBatchModal(false)}
        db={db}
        isMobile={isMobile}
      />

      <EditBatchItemModal
        isOpen={showEditBatchItem}
        onClose={() => { setShowEditBatchItem(false); setBatchItemToEdit(null) }}
        onSave={handleSaveBatchItemEdit}
        batchItem={batchItemToEdit}
        isMobile={isMobile}
      />

      <TeleprompterModal
        isOpen={!!teleScript}
        onClose={() => setTeleScript(null)}
        script={teleScript?.script}
        title={teleScript?.title}
      />
    </div>
  )
}
