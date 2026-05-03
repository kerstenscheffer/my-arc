// src/modules/coach-command-center/components/insight/ClientDocumentsSection.jsx
// v1.0 — Coach kan PDF uploaden, client kan bekijken

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Upload, FileText, Trash2, ExternalLink, Loader, X } from 'lucide-react'

export default function ClientDocumentsSection({ db, clientId, coachId, isMobile, isClientView = false }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [viewingDoc, setViewingDoc] = useState(null)
  const fileInputRef = useRef(null)
  const m = isMobile

  useEffect(() => {
    if (clientId && db?.supabase) loadDocuments()
  }, [clientId])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (!error) setDocuments(data || [])
    } catch (e) { console.warn('Documents load failed:', e) }
    setLoading(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Alleen PDF bestanden toegestaan'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Bestand mag max 10MB zijn'); return }

    setUploading(true)
    try {
      const fileName = `${clientId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadError } = await db.supabase.storage
        .from('coach-content')
        .upload(`documents/${fileName}`, file, { contentType: 'application/pdf', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = db.supabase.storage
        .from('coach-content')
        .getPublicUrl(`documents/${fileName}`)

      const { error: dbError } = await db.supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          coach_id: coachId,
          name: file.name.replace('.pdf', ''),
          file_url: publicUrl,
          file_type: 'pdf'
        })

      if (dbError) throw dbError
      await loadDocuments()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload mislukt: ' + err.message)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (doc) => {
    if (!confirm(`"${doc.name}" verwijderen?`)) return
    setDeleting(doc.id)
    try {
      await db.supabase.from('client_documents').delete().eq('id', doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) { alert('Verwijderen mislukt') }
    setDeleting(null)
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  // ── PDF Viewer Modal ──
  const pdfViewer = viewingDoc && createPortal(
    <div onClick={() => setViewingDoc(null)} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
      zIndex: 20000, display: 'flex', flexDirection: 'column'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1rem', background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={14} color="#10b981" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{viewingDoc.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href={viewingDoc.file_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: '0.2rem',
            padding: '0.3rem 0.6rem', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)', borderRadius: '5px',
            color: '#10b981', fontSize: '0.55rem', fontWeight: 700, textDecoration: 'none'
          }}>
            <ExternalLink size={11} /> Openen
          </a>
          <button onClick={() => setViewingDoc(null)} style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={14} /></button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          src={`${viewingDoc.file_url}#toolbar=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={viewingDoc.name}
        />
      </div>
    </div>,
    document.body
  )

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <FileText size={12} color="#10b981" />
          <span style={{ fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Documenten
          </span>
          {documents.length > 0 && (
            <span style={{ fontSize: '0.38rem', fontWeight: 800, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>
              {documents.length}
            </span>
          )}
        </div>

        {/* Upload knop — alleen voor coach */}
        {!isClientView && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.2rem 0.5rem',
                background: uploading ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${uploading ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.25)'}`,
                borderRadius: '4px', color: uploading ? 'rgba(255,255,255,0.2)' : '#10b981',
                fontSize: '0.48rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '24px'
              }}
            >
              {uploading
                ? <><Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> Uploaden...</>
                : <><Upload size={10} /> PDF uploaden</>
              }
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </>
        )}
      </div>

      {/* Document lijst */}
      {loading ? (
        <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
      ) : documents.length === 0 ? (
        <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)' }}>
          {isClientView ? 'Geen documenten beschikbaar' : 'Nog geen documenten geüpload'}
        </div>
      ) : (
        <div>
          {documents.map(doc => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: m ? '0.4rem 0.75rem' : '0.45rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <FileText size={13} color="rgba(16,185,129,0.5)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: m ? '0.62rem' : '0.68rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', marginTop: '1px' }}>
                  {formatDate(doc.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button
                  onClick={() => doc.file_type === 'coaching_guide'
                    ? window.open(doc.file_url, '_blank')
                    : setViewingDoc(doc)
                  }
                  style={{
                    padding: '0.2rem 0.4rem', background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px',
                    color: '#10b981', fontSize: '0.45rem', fontWeight: 700, cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '24px'
                  }}
                >
                  {doc.file_type === 'coaching_guide' ? 'Openen' : 'Bekijken'}
                </button>
                {!isClientView && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    style={{
                      width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '4px', color: deleting === doc.id ? 'rgba(255,255,255,0.1)' : '#ef4444',
                      cursor: deleting === doc.id ? 'not-allowed' : 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {deleting === doc.id ? <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={10} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pdfViewer}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
