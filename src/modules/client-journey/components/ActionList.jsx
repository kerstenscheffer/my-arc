// ============================================
// 📁 FILE: src/modules/client-journey/components/ActionList.jsx
// Action items with checkboxes, edit, delete
// ============================================
import React from 'react'
import { CheckCircle, Edit3, Trash2, Plus, ClipboardList } from 'lucide-react'
import { G, ACTION_TYPES } from '../journeyConfig'

export default function ActionList({ actions, isMobile, onToggle, onEdit, onDelete, onAdd }) {
  if (actions.length === 0) return null

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
        <ClipboardList size={11} color={G.gold} />
        <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '700', color: G.gold, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Acties ({actions.length})
        </span>
        {onAdd && (
          <button onClick={onAdd} style={{
            marginLeft: 'auto', padding: '0.15rem 0.4rem', borderRadius: '4px',
            background: `${G.gold}08`, border: `1px solid ${G.gold}20`,
            color: G.gold, fontSize: '0.6rem', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <Plus size={10} /> Actie
          </button>
        )}
      </div>

      {actions.map(action => {
        const tc = ACTION_TYPES[action.action_type] || ACTION_TYPES.task
        const Icon = tc.icon
        const isDone = action.status === 'completed'

        return (
          <div key={action.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.4rem' : '0.5rem 0.6rem',
            borderRadius: '8px', marginBottom: '0.25rem',
            background: isDone ? 'rgba(255,255,255,0.01)' : `${tc.color}05`,
            border: `1px solid ${isDone ? 'rgba(255,255,255,0.03)' : `${tc.color}12`}`,
            opacity: isDone ? 0.5 : 1, transition: 'all 0.2s ease'
          }}>
            <button onClick={() => onToggle(action.id, action.status)} style={{
              width: '20px', height: '20px', borderRadius: '50%',
              border: isDone ? `2px solid ${G.green}` : `2px solid ${tc.color}40`,
              background: isDone ? `${G.green}20` : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0, marginTop: '1px',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              {isDone && <CheckCircle size={12} color={G.green} />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Icon size={12} color={tc.color} />
                <span style={{
                  fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: '500',
                  color: isDone ? 'rgba(255,255,255,0.35)' : G.text,
                  textDecoration: isDone ? 'line-through' : 'none'
                }}>{action.title}</span>
              </div>
              {action.description && (
                <p style={{ fontSize: '0.65rem', color: G.textDim, margin: '0.2rem 0 0' }}>{action.description}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              <button onClick={() => onEdit(action)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Edit3 size={12} color={G.textDim} />
              </button>
              <button onClick={() => onDelete(action.id)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Trash2 size={12} color="rgba(255,255,255,0.1)" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
