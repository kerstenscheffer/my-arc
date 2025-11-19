import { useState } from 'react'
import { Mail, Phone, Edit2, Trash2, FileText } from 'lucide-react'

export default function KanbanCard({ lead, sectionColor, isMobile, onDragStart, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    lead_source: lead.lead_source || '',
    notes: lead.notes || ''
  })

  if (isEditing) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${sectionColor}`, borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input type="text" placeholder="Voornaam" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }} />
        <input type="text" placeholder="Achternaam" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }} />
        <input type="text" placeholder="Bron" value={editData.lead_source} onChange={(e) => setEditData({ ...editData, lead_source: e.target.value })} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }} />
        <input type="email" placeholder="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }} />
        <input type="tel" placeholder="Telefoon" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }} />
        <textarea placeholder="Notities" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={async () => { await onEdit(editData); setIsEditing(false) }} style={{ flex: 1, padding: '0.5rem', background: sectionColor, border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Opslaan</button>
          <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Annuleer</button>
        </div>
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '1rem', cursor: 'grab' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0, marginBottom: '0.25rem' }}>
            {lead.first_name} {lead.last_name}
          </h4>
          {lead.lead_source && (
            <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: `${sectionColor}20`, border: `1px solid ${sectionColor}40`, borderRadius: '6px', color: sectionColor, fontSize: '0.75rem' }}>
              {lead.lead_source}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={() => setIsEditing(true)} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}>
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {lead.email && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          <Mail size={12} />
          <span>{lead.email}</span>
        </div>
      )}

      {lead.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          <Phone size={12} />
          <span>{lead.phone}</span>
        </div>
      )}

      {lead.notes && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', display: 'flex', gap: '0.5rem' }}>
          <FileText size={12} style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.1rem' }} />
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', lineHeight: '1.4' }}>{lead.notes}</p>
        </div>
      )}
    </div>
  )
}
