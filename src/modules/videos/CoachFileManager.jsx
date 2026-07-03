// src/modules/videos/CoachFileManager.jsx
//
// Coach-side: PDF (en andere file) uploads beheren + per-pagina toewijzen.
// Bewust een aparte component zodat de bestaande CoachVideoTab niet aangepast
// hoeft te worden — embed dit waar passend.

import { useEffect, useState } from 'react'
import { FileText, Upload, Trash2, Plus, Check, X } from 'lucide-react'
import fileService from './FileService'

const ALL_PAGES = [
  { id: 'home',     label: 'Home' },
  { id: 'workout',  label: 'Workout' },
  { id: 'meal',     label: 'Meal' },
  { id: 'shopping', label: 'Shop' },
  { id: 'progress', label: 'Tracking' },
  { id: 'calls',    label: 'Calls' },
  { id: 'profile',  label: 'Profile' },
]

const formatBytes = (b) => {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function CoachFileManager({ coachId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadDraft, setUploadDraft] = useState({ file: null, title: '', pages: [] })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coachId) return
    load()
  }, [coachId])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fileService.listForCoach(coachId)
      setFiles(data)
    } catch (e) {
      console.error('Load files failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadDraft.file || !uploadDraft.title.trim()) {
      setError('Selecteer een bestand én geef een titel.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await fileService.uploadFile(coachId, uploadDraft.file, {
        title: uploadDraft.title.trim(),
        default_pages: uploadDraft.pages,
      })
      setShowUpload(false)
      setUploadDraft({ file: null, title: '', pages: [] })
      await load()
    } catch (e) {
      console.error('Upload failed:', e)
      setError(`Upload mislukt: ${e.message || e}`)
    } finally {
      setUploading(false)
    }
  }

  const togglePage = (fileId, pageId) => {
    const f = files.find(x => x.id === fileId)
    if (!f) return
    const next = (f.default_pages || []).includes(pageId)
      ? (f.default_pages || []).filter(p => p !== pageId)
      : [...(f.default_pages || []), pageId]
    setFiles(prev => prev.map(x => x.id === fileId ? { ...x, default_pages: next } : x))
    fileService.updateFile(fileId, { default_pages: next }).catch(e => {
      console.error('Update pages failed:', e)
      load()
    })
  }

  const handleDelete = async (fileId) => {
    if (!window.confirm('Bestand verwijderen?')) return
    setFiles(prev => prev.filter(f => f.id !== fileId))
    try {
      await fileService.deleteFile(fileId)
    } catch (e) {
      console.error('Delete failed:', e)
      load()
    }
  }

  return (
    <div style={{
      background: '#171717',
      border: '1px solid rgba(255,215,0,0.18)',
      borderRadius: 14,
      padding: '1rem 1.1rem',
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="#FFD700" />
          <span style={{
            fontSize: '0.95rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            Bestanden (PDFs)
          </span>
          {files.length > 0 && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              marginLeft: 4,
            }}>
              {files.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 0.85rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none', borderRadius: 10,
            color: '#0a0a0a',
            fontSize: '0.78rem', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            cursor: 'pointer',
            minHeight: 38,
            boxShadow: '0 4px 12px rgba(255,215,0,0.28)',
          }}
        >
          <Plus size={16} strokeWidth={2.4} /> Upload PDF
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center' }}>
          Laden…
        </div>
      ) : files.length === 0 ? (
        <div style={{ padding: '1rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          Nog geen bestanden geüpload. Klik "Upload PDF" om te beginnen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(f => (
            <div key={f.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '0.65rem 0.75rem',
              display: 'flex', flexDirection: 'column', gap: '0.55rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <FileText size={18} color="#fca5a5" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <a
                      href={f.file_url} target="_blank" rel="noopener noreferrer"
                      style={{
                        fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                        textDecoration: 'none',
                        display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {f.title}
                    </a>
                    <div style={{
                      fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)',
                      fontWeight: 600, marginTop: 2,
                    }}>
                      {formatBytes(f.file_size)} · {new Date(f.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  style={{
                    width: 32, height: 32, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    color: 'rgba(239,68,68,0.6)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Page checkboxes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ALL_PAGES.map(p => {
                  const active = (f.default_pages || []).includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePage(f.id, p.id)}
                      style={{
                        padding: '0.3rem 0.55rem',
                        background: active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        color: active ? '#FFD700' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.68rem', fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {active && <Check size={11} strokeWidth={3} />}
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div
          onClick={() => !uploading && setShowUpload(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 2147483600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#171717',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 16,
              padding: '1.2rem',
              maxWidth: 460, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontSize: '1.05rem', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.015em',
              }}>
                PDF uploaden
              </div>
              <button onClick={() => !uploading && setShowUpload(false)} style={{
                width: 36, height: 36, padding: 0,
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8,
                color: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{
                fontSize: '0.7rem', fontWeight: 800, color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: 6,
              }}>
                Titel
              </label>
              <input
                type="text"
                value={uploadDraft.title}
                onChange={(e) => setUploadDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Bv. Stretching Guide"
                style={{
                  width: '100%', padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, color: '#fff',
                  fontSize: '0.88rem', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{
                fontSize: '0.7rem', fontWeight: 800, color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: 6,
              }}>
                Bestand (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setUploadDraft(d => ({ ...d, file: e.target.files?.[0] || null }))}
                style={{
                  width: '100%', padding: '0.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, color: '#fff',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            <div>
              <label style={{
                fontSize: '0.7rem', fontWeight: 800, color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: 6,
              }}>
                Zichtbaar op pagina's
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ALL_PAGES.map(p => {
                  const active = uploadDraft.pages.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => setUploadDraft(d => ({
                        ...d,
                        pages: active ? d.pages.filter(x => x !== p.id) : [...d.pages, p.id],
                      }))}
                      style={{
                        padding: '0.4rem 0.65rem',
                        background: active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 7,
                        color: active ? '#FFD700' : 'rgba(255,255,255,0.7)',
                        fontSize: '0.72rem', fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {active && <Check size={11} strokeWidth={3} />}
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                color: '#fca5a5',
                fontSize: '0.78rem', fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !uploadDraft.file || !uploadDraft.title.trim()}
              style={{
                minHeight: 50,
                padding: '0.7rem',
                background: uploading ? 'rgba(255,215,0,0.25)' : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                border: 'none', borderRadius: 12,
                color: '#0a0a0a',
                fontSize: '0.88rem', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: uploading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!uploadDraft.file || !uploadDraft.title.trim()) ? 0.5 : 1,
                boxShadow: '0 8px 22px rgba(255,215,0,0.3)',
              }}
            >
              <Upload size={16} strokeWidth={2.5} />
              {uploading ? 'Uploaden…' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
