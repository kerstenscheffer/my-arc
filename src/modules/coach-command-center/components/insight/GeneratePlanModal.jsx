// src/modules/coach-command-center/components/insight/GeneratePlanModal.jsx
// Wrapper modal voor GuidedPlanFlow
// v2.0 — gebruikt GuidedPlanFlow stap-voor-stap configurator

import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import GuidedPlanFlow from './GuidedPlanFlow'

export default function GeneratePlanModal({ client, db, coachId, onClose, onSuccess, isMobile }) {
  const m = isMobile

  const modal = (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 20000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a',
        borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: '520px',
        height: m ? '90vh' : '80vh',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.75rem' : '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
            Plan configureren — {client?.first_name}
          </span>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={14} /></button>
        </div>

        {/* Flow */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GuidedPlanFlow
            client={client}
            db={db}
            coachId={coachId}
            isMobile={m}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
