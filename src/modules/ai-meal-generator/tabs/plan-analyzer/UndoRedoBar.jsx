// src/modules/ai-meal-generator/tabs/plan-analyzer/UndoRedoBar.jsx
// Undo/redo toolbar
// v1.1 — console logs added

import React from 'react'
import { Undo2, Redo2 } from 'lucide-react'

export default function UndoRedoBar({ canUndo, canRedo, lastAction, onUndo, onRedo, isMobile }) {
  const m = isMobile

  if (!canUndo && !canRedo) return null

  console.log('↩️ UndoRedoBar | render', { canUndo, canRedo, lastAction })

  const handleUndo = () => {
    console.log('↩️ UndoRedoBar | UNDO aangeroepen', { lastAction })
    onUndo()
  }

  const handleRedo = () => {
    console.log('↪️ UndoRedoBar | REDO aangeroepen')
    onRedo()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: m ? '0.3rem 0.75rem' : '0.35rem 1rem',
      background: 'rgba(139, 92, 246, 0.03)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
    }}>
      <div style={{
        fontSize: m ? '0.5rem' : '0.55rem', fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.25)',
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {lastAction || ''}
      </div>

      <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Ongedaan maken (Ctrl+Z)"
          style={{
            width: m ? '30px' : '32px', height: m ? '30px' : '32px',
            borderRadius: '6px',
            background: canUndo ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
            border: `1px solid ${canUndo ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)'}`,
            color: canUndo ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
            cursor: canUndo ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Undo2 size={14} />
        </button>

        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Opnieuw (Ctrl+Y)"
          style={{
            width: m ? '30px' : '32px', height: m ? '30px' : '32px',
            borderRadius: '6px',
            background: canRedo ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
            border: `1px solid ${canRedo ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)'}`,
            color: canRedo ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
            cursor: canRedo ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  )
}
