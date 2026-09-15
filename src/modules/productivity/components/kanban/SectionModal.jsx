// src/modules/productivity/components/kanban/SectionModal.jsx
// Kolom aanmaken of bewerken. Zelfde opbouw als de task-modal: naam groot
// bovenaan, kleur als swatches eronder, witte hoofdknop in de voet.

import { useState, useEffect } from 'react'
import { Trash2, Palette } from 'lucide-react'
import { Venster, VensterKop, VensterVoet, Kopje, Knop } from '../ui'

const PRESET_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export default function SectionModal({ isMobile, section, onClose, onSubmit, onDelete }) {
  const [formData, setFormData] = useState({ title: '', color: '#10b981' })
  const [fout, setFout] = useState(false)

  useEffect(() => {
    if (section) setFormData({ title: section.title || '', color: section.color || '#10b981' })
  }, [section])

  const isEdit = !!section

  const handleSubmit = () => {
    if (!formData.title.trim()) { setFout(true); return }
    onSubmit(formData)
  }

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={420} zIndex={1000}>
      <VensterKop isMobile={isMobile} titel={isEdit ? 'Kolom bewerken' : 'Nieuwe kolom'} onClose={onClose} />

      <div style={{ padding: isMobile ? '1rem' : '1.15rem', overflowY: 'auto' }}>
        {/* Naam is het onderwerp, dus groot en zonder kader. */}
        <input
          autoFocus
          type="text"
          value={formData.title}
          onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setFout(false) }}
          placeholder="Naam van de kolom"
          style={{
            width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900,
            letterSpacing: '-0.025em',
          }}
        />
        <div style={{
          height: 2, marginTop: 8, marginBottom: isMobile ? '1rem' : '1.25rem', borderRadius: 2,
          background: fout ? '#ef4444' : formData.color,
        }} />
        {fout && (
          <div style={{ marginTop: -10, marginBottom: 12, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>
            Geef de kolom een naam
          </div>
        )}

        <Kopje Icon={Palette} tekst="Kleur" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
          {PRESET_COLORS.map(c => {
            const aan = formData.color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, color: c })}
                title={c}
                style={{
                  width: 30, height: 30, padding: 0, background: c, borderRadius: 8,
                  border: aan ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              />
            )
          })}
          <label style={{
            width: 30, height: 30, borderRadius: 8, overflow: 'hidden',
            border: '1px dashed rgba(255,255,255,0.25)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.001 }}
            />
            <Palette size={13} color="rgba(255,255,255,0.45)" style={{ position: 'absolute', pointerEvents: 'none' }} />
          </label>
        </div>
      </div>

      <VensterVoet isMobile={isMobile}>
        {isEdit && onDelete && (
          <Knop soort="gevaar" breedte={44} titel="Kolom verwijderen" onClick={onDelete}>
            <Trash2 size={15} />
          </Knop>
        )}
        <Knop soort="stil" flex={1} onClick={onClose}>Annuleer</Knop>
        <Knop soort="primair" flex={2} onClick={handleSubmit}>
          {isEdit ? 'Opslaan' : 'Kolom aanmaken'}
        </Knop>
      </VensterVoet>
    </Venster>
  )
}
