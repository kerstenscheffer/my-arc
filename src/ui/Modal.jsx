// src/ui/Modal.jsx
// Eén pop-up-component voor het hele project.
//  - Donkere overlay; klik op de overlay of Escape sluit.
//  - Inhoud in een surface-kaart met sluitknop rechtsboven (≥44×44px).
//  - Mobiel: bottom sheet (van onderen). Desktop: gecentreerd.
//  - Portal naar document.body zodat geen enkele ouder 'm kan vangen.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { colors, radius, space, overlay } from './tokens'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 560,
  isMobile,
}) {
  // Escape sluit de modal.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null
  const mobile = isMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483500,
        background: overlay.color, backdropFilter: overlay.blur, WebkitBackdropFilter: overlay.blur,
        display: 'flex',
        alignItems: mobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: mobile ? 0 : space[6],
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: mobile ? '100%' : '100%',
          maxWidth: mobile ? '100%' : maxWidth,
          maxHeight: mobile ? '92vh' : '88vh',
          background: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: mobile ? `${radius.card}px ${radius.card}px 0 0` : radius.card,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxSizing: 'border-box',
          paddingBottom: mobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: space[3], padding: space[4],
          borderBottom: `1px solid ${colors.borderSubtle}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: radius.btn,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1px solid ${colors.borderSubtle}`,
              color: colors.textSecondary, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: space[4] }}>
          {children}
        </div>

        {/* Footer (optioneel) */}
        {footer && (
          <div style={{ padding: space[4], borderTop: `1px solid ${colors.borderSubtle}`, display: 'flex', gap: space[3] }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
