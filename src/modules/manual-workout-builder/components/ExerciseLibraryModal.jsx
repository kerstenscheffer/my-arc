// src/modules/manual-workout-builder/components/ExerciseLibraryModal.jsx
// Coach-side library browser: lists every exercise in the `exercises`
// table with thumbnail + video-status, lets the coach filter on
// "has video / missing video", search by name, and tap any row to open
// the existing ExerciseVideoEditor for that exercise.
//
// Solves the workflow gap where a video could only be attached from
// inside a workout schedule — now you can manage the full library in one
// place without first dropping the exercise into a day.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { X, Search, Video, ListFilter, Loader2 } from 'lucide-react'
import ExerciseVideoEditor from './ExerciseVideoEditor'

const GOLD = '#FFD700'

export default function ExerciseLibraryModal({
  isOpen, onClose, db, isMobile = false,
}) {
  const modalHost = useModalHost()
  const [loading, setLoading] = useState(false)
  const [exercises, setExercises] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'with' | 'without'
  const [editing, setEditing] = useState(null)

  const load = async () => {
    if (!db?.supabase) return
    setLoading(true)
    try {
      // Beide bronnen laden — `exercises` is de gedeelde bibliotheek,
      // `custom_exercises` zijn per-client custom rijen die anders
      // onvindbaar zijn in de library (zoals "Seated high to low flies").
      const [{ data: shared, error: e1 }, { data: customs, error: e2 }] = await Promise.all([
        db.supabase
          .from('exercises')
          .select('id, name, primair_spieren, equipment, image_url, video_url, thumbnail_url')
          .order('name', { ascending: true }),
        db.supabase
          .from('custom_exercises')
          .select('id, name, muscle_group, equipment, image_url, video_url, thumbnail_url, primair_spieren')
          .order('name', { ascending: true }),
      ])
      if (e1) throw e1
      if (e2) console.warn('load custom_exercises failed:', e2)
      const normalizedCustoms = (customs || []).map(c => ({
        id: c.id,
        name: c.name,
        primair_spieren: c.primair_spieren || c.muscle_group || null,
        equipment: c.equipment || null,
        image_url: c.image_url || null,
        video_url: c.video_url || null,
        thumbnail_url: c.thumbnail_url || null,
        _source: 'custom_exercises',
      }))
      // Dedup op naam (case-insensitive) zodat een custom-versie die ook in
      // de shared library staat niet dubbel verschijnt. Shared wint.
      const sharedNames = new Set((shared || []).map(s => (s.name || '').toLowerCase()))
      const merged = [
        ...(shared || []).map(s => ({ ...s, _source: 'exercises' })),
        ...normalizedCustoms.filter(c => !sharedNames.has((c.name || '').toLowerCase())),
      ].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setExercises(merged)
    } catch (e) {
      console.error('load exercises failed:', e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (isOpen) load() /* eslint-disable-next-line */ }, [isOpen, db])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exercises.filter(ex => {
      if (filter === 'with' && !ex.video_url) return false
      if (filter === 'without' && ex.video_url) return false
      if (!q) return true
      return (ex.name || '').toLowerCase().includes(q)
          || (ex.primair_spieren || '').toLowerCase().includes(q)
          || (ex.equipment || '').toLowerCase().includes(q)
    })
  }, [exercises, search, filter])

  const totalWith    = exercises.filter(e => e.video_url).length
  const totalWithout = exercises.length - totalWith

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483540,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'calc(100vw - 48px)',
          maxWidth: isMobile ? '100%' : 880,
          height: isMobile ? '92vh' : 'calc(100vh - 48px)',
          background: '#0a0a0a',
          border: `1px solid ${GOLD}33`,
          borderRadius: isMobile ? '14px 14px 0 0' : 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 14px 50px rgba(0,0,0,0.7), 0 0 24px ${GOLD}22`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.55rem',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `${GOLD}10`,
          flexShrink: 0,
        }}>
          <Video size={17} color={GOLD} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 800,
              color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Oefeningen-bibliotheek
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
              Video's & thumbnails beheren
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', touchAction: 'manipulation',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Controls */}
        <div style={{
          padding: '0.7rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
          flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="rgba(255,255,255,0.35)" style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam, spier of materiaal…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 0.7rem 0.55rem 2rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                color: '#fff', fontSize: '0.85rem', outline: 'none',
              }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'all',     label: `Alles (${exercises.length})`,         color: '#fff' },
              { id: 'with',    label: `✓ Met video (${totalWith})`,           color: '#10b981' },
              { id: 'without', label: `⚠ Zonder video (${totalWithout})`,    color: '#f59e0b' },
            ].map(f => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flex: 1, padding: '0.35rem',
                    background: active ? `${f.color}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? f.color : 'rgba(255,255,255,0.06)'}55`,
                    borderRadius: 6,
                    color: active ? f.color : 'rgba(255,255,255,0.5)',
                    fontSize: '0.65rem', fontWeight: 800,
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
            }}>
              <Loader2 size={14} className="spin" /> Bibliotheek laden…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '2rem',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
            }}>
              Geen oefeningen gevonden.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(ex => {
              const hasVideo = !!ex.video_url
              const thumb = ex.thumbnail_url || ex.image_url
              return (
                <button
                  key={ex.id}
                  onClick={() => setEditing(ex)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 7,
                    cursor: 'pointer', touchAction: 'manipulation',
                    textAlign: 'left',
                  }}
                >
                  {/* Thumb */}
                  <div style={{
                    width: 52, height: 52, flexShrink: 0,
                    borderRadius: 5, background: '#000',
                    backgroundImage: thumb ? `url(${thumb})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative',
                  }}>
                    {hasVideo && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.35)',
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'rgba(239,68,68,0.95)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{
                            width: 0, height: 0,
                            borderLeft: '6px solid #fff',
                            borderTop: '4px solid transparent',
                            borderBottom: '4px solid transparent',
                            marginLeft: 2,
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</span>
                      {ex._source === 'custom_exercises' && (
                        <span style={{
                          flexShrink: 0,
                          padding: '1px 5px',
                          background: 'rgba(139,92,246,0.18)',
                          border: '1px solid rgba(139,92,246,0.4)',
                          borderRadius: 3,
                          fontSize: '0.5rem', fontWeight: 800,
                          color: '#c4b5fd',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          Custom
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)',
                      marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {[ex.primair_spieren, ex.equipment].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  {/* Status pill */}
                  <span style={{
                    padding: '2px 7px',
                    background: hasVideo ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                    border: `1px solid ${hasVideo ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
                    borderRadius: 999,
                    color: hasVideo ? '#10b981' : '#f59e0b',
                    fontSize: '0.55rem', fontWeight: 800,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {hasVideo ? 'Video' : 'Geen'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Editor — opens on top, writes back, reloads list on close */}
      <ExerciseVideoEditor
        isOpen={!!editing}
        exercise={editing}
        isMobile={isMobile}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setExercises(prev => prev.map(e => e.id === updated.id ? {
            ...e,
            video_url: updated.video_url,
            thumbnail_url: updated.thumbnail_url,
          } : e))
        }}
      />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>,
    document.body,
  )
}
