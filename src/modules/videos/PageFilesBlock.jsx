// src/modules/videos/PageFilesBlock.jsx
//
// Client-side: toont alle coach-files (PDFs) die deze pagina als
// default_pages-target hebben. Bedoeld om onderaan PageVideoWidget te
// embeden. Tap op een file = in-app preview (iframe); externe link =
// download via long-press of via expliciete download-knop.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Download, X } from 'lucide-react'
import fileService from './FileService'

const formatBytes = (b) => {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function PageFilesBlock({ pageContext, isMobile = false }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!pageContext) return
    let cancelled = false
    setLoading(true)
    fileService.listForPage(pageContext)
      .then(data => { if (!cancelled) setFiles(data) })
      .catch(e => console.error('listForPage failed:', e))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [pageContext])

  if (loading) return null
  if (!files || files.length === 0) return null

  return (
    <>
      <div style={{
        marginTop: isMobile ? '0.85rem' : '1rem',
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem',
        background: '#171717',
        border: '1px solid rgba(255,215,0,0.18)',
        borderRadius: 14,
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: 800, color: '#FFD700',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '0.7rem',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <FileText size={isMobile ? 13 : 14} strokeWidth={2.4} />
          Bestanden
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isMobile ? '0.55rem 0.7rem' : '0.65rem 0.85rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
            }}>
              <FileText size={isMobile ? 18 : 20} color="#fca5a5" style={{ flexShrink: 0 }} />
              <div
                onClick={() => setViewing(f)}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
              >
                <div style={{
                  fontSize: isMobile ? '0.82rem' : '0.88rem',
                  fontWeight: 700, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {f.title}
                </div>
                {f.file_size && (
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.45)', marginTop: 2,
                  }}>
                    {formatBytes(f.file_size)}
                  </div>
                )}
              </div>
              <a
                href={f.file_url}
                download
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Download"
                style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 9,
                  color: '#FFD700',
                  textDecoration: 'none',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Download size={15} strokeWidth={2.4} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* In-app viewer — iframe full-screen */}
      {viewing && createPortal(
        <div style={{
          position: 'fixed', inset: 0, height: '100dvh',
          background: '#0a0a0a',
          zIndex: 2147483600,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem',
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '0.85rem' : '1rem'})`,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, flexShrink: 0,
          }}>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {viewing.title}
            </div>
            <a
              href={viewing.file_url}
              download
              target="_blank" rel="noopener noreferrer"
              aria-label="Download"
              style={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,215,0,0.12)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 12,
                color: '#FFD700',
                textDecoration: 'none',
                flexShrink: 0,
                touchAction: 'manipulation',
              }}
            >
              <Download size={18} strokeWidth={2.4} />
            </a>
            <button
              onClick={() => setViewing(null)}
              aria-label="Sluit"
              style={{
                width: 44, height: 44,
                background: 'rgba(10,10,10,0.85)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 12,
                color: '#FFD700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>
          <iframe
            src={viewing.file_url}
            title={viewing.title}
            style={{
              flex: 1, width: '100%', border: 'none',
              background: '#fff',
            }}
          />
        </div>,
        document.body
      )}
    </>
  )
}
