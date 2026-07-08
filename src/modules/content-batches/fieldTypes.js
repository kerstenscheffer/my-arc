// src/modules/content-batches/fieldTypes.js
// Veldtypes voor zelf-gedefinieerde batch-formats + kleine helpers.

export const FIELD_TYPES = [
  { id: 'text',      label: 'Korte regel',   hint: 'Eén regel tekst (bv. titel, hoek)' },
  { id: 'textarea',  label: 'Lang tekstvak', hint: 'Meerdere regels (bv. script)' },
  { id: 'select',    label: 'Keuzelijst',    hint: 'Kies uit vaste opties' },
  { id: 'date',      label: 'Datum',         hint: 'Een datum kiezen' },
  { id: 'checklist', label: 'Checklist',     hint: 'Vinkjes uit vaste opties' },
]

export function fieldTypeLabel(id) {
  return FIELD_TYPES.find(t => t.id === id)?.label || id
}

// Maak een stabiele, unieke key voor een veld op basis van de labelnaam.
// De index garandeert uniciteit ook bij dubbele labels.
export function slugifyFieldKey(label, index) {
  const base = (label || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // accenten weg
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base ? `${base}_${index}` : `veld_${index}`
}

// Standaard-kleurenpalet voor formats (agenda-accent).
export const FORMAT_COLORS = [
  '#FFD700', '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]
