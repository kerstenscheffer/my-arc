// src/modules/videos/PageFilesBlock.jsx
//
// Client-side: toont alle coach-files (PDFs) die deze pagina als
// default_pages-target hebben. Bedoeld om onderaan PageVideoWidget te
// embeden. Tap op een file = in-app preview (iframe); externe link =
// download via long-press of via expliciete download-knop.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import { FileText, Download, X } from 'lucide-react'
import fileService from './FileService'

const formatBytes = (b) => {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function PageFilesBlock({ pageContext, isMobile = false }) {
  const modalHost = useModalHost()
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
      {/* Geen kader om het blok: de voorbeelden zweven op de achtergrond van
          het paneel. Een doos om een doos om een afbeelding gaf drie randen
          over elkaar.

          De scheidingslijn erboven doet het werk dat het kader deed: hij zegt
          waar de video's ophouden en de gidsen beginnen. Ruim bemeten marge
          eromheen, want zonder kader is witruimte het enige wat de twee
          blokken uit elkaar houdt. */}
      <div style={{ marginTop: isMobile ? '1.4rem' : '1.7rem' }}>
        <div style={{
          height: 1, background: 'rgba(255,255,255,0.1)',
          marginBottom: isMobile ? '1rem' : '1.15rem',
        }} />
        {/* Zelfde kop als de video-rijen erboven: gekleurd streepje, wit vet
            en in kapitalen. Stond in goud met een icoontje en las daardoor als
            een ander soort blok, terwijl het hetzelfde soort blok is. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: isMobile ? '0.8rem' : '0.9rem',
        }}>
          <div style={{ width: 3, height: isMobile ? 17 : 19, background: '#FFD700', borderRadius: 2 }} />
          <div style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: 800, color: '#fff', letterSpacing: '-0.015em',
          }}>
            Gidsen
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            · {files.length}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 16 }}>
          {files.map(f => (
            /* Brede voorbeeldstrook met de titel eronder, zoals een gedeelde
               link in WhatsApp eruitziet. Geen kader of achtergrond om het
               bestand heen: de afbeelding is al een blok op zichzelf, en een
               doos daaromheen maakt er een rij van in plaats van iets waar je
               naar kijkt. */
            <div key={f.id}>
              {f.thumb_url ? (
                <div
                  onClick={() => setViewing(f)}
                  style={{
                    position: 'relative',
                    width: '100%', height: isMobile ? 104 : 128,
                    borderRadius: 10, overflow: 'hidden',
                    background: '#0a0a0a', cursor: 'pointer',
                  }}
                >
                  <img
                    src={f.thumb_url} alt=""
                    /* Vanaf de bovenkant bijsnijden: de titel van een gids
                       staat op de eerste pagina bovenin, en die wil je juist
                       in de strook houden. */
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                  {/* Downloadknop op de afbeelding. Onder de titel zou hij een
                      tweede regel kosten; hier ligt hij waar je 'm zoekt. */}
                  <a
                    href={f.file_url} download target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Download"
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,215,0,0.35)',
                      borderRadius: 8, color: '#FFD700', textDecoration: 'none',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Download size={14} strokeWidth={2.4} />
                  </a>
                </div>
              ) : (
                /* Zonder voorbeeld een strook met alleen het icoon, zodat de
                   lijst niet half uit banners en half uit regels bestaat. */
                <div
                  onClick={() => setViewing(f)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: isMobile ? 104 : 128,
                    borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={26} color="#fca5a5" />
                </div>
              )}

              <div onClick={() => setViewing(f)} style={{ cursor: 'pointer', marginTop: 7 }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: 800, color: '#fff', letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {f.title}
                </div>
                {f.file_size && (
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)', marginTop: 2,
                  }}>
                    {formatBytes(f.file_size)}
                  </div>
                )}
              </div>
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
        modalHost
      )}
    </>
  )
}
