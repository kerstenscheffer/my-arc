// src/modules/meal-plan/MealGuideManager.jsx
// Coach-beheer voor de Gelegenheden-hub (meal guide deel 1, issue 19ee0bf7).
// Per gelegenheid (verjaardag, McDonalds, ...) voegt de coach goede vs minder
// goede keuzes toe: foto (URL), titel, kcal, en goed/slecht. De client ziet
// deze in de Voedingsgids → tab Gelegenheden.
import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { OCCASIONS } from './mealGuideOccasions'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'

export default function MealGuideManager({ db, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  const [occasion, setOccasion] = useState(OCCASIONS[0].id)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', image_url: '', kcal: '', verdict: 'good', note: '' })

  // Foto uploaden vanaf het toestel → coach-photos bucket (meal-guide/ prefix).
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data: auth } = await db.supabase.auth.getUser()
      const coachId = auth?.user?.id || 'anon'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `meal-guide/${coachId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
      const { error } = await db.supabase.storage.from('coach-photos').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: u } = db.supabase.storage.from('coach-photos').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: u.publicUrl }))
    } catch (err) {
      alert('Upload mislukt: ' + (err?.message || JSON.stringify(err)))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await db.supabase
        .from('meal_guide_items')
        .select('*')
        .eq('occasion', occasion)
        .order('verdict', { ascending: true })
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      setItems(data || [])
    } catch (e) { console.error('Meal guide laden mislukt:', e); setItems([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [occasion])

  const addItem = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const { data: auth } = await db.supabase.auth.getUser()
      const { error } = await db.supabase.from('meal_guide_items').insert([{
        coach_id: auth?.user?.id,
        occasion,
        title: form.title.trim(),
        image_url: form.image_url.trim() || null,
        kcal: form.kcal ? parseInt(form.kcal, 10) : null,
        verdict: form.verdict,
        note: form.note.trim() || null,
        position: items.length,
      }])
      if (error) throw error
      setForm({ title: '', image_url: '', kcal: '', verdict: 'good', note: '' })
      await load()
    } catch (e) { alert('Opslaan mislukt: ' + (e?.message || JSON.stringify(e))) }
    finally { setSaving(false) }
  }

  const removeItem = async (id) => {
    try {
      await db.supabase.from('meal_guide_items').delete().eq('id', id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { console.error('Verwijderen mislukt:', e) }
  }

  const good = items.filter(i => i.verdict === 'good')
  const bad = items.filter(i => i.verdict === 'bad')

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100%', background: '#0a0a0a', color: '#fff', padding: isMobile ? '1rem' : '1.5rem', maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, margin: '0 0 0.25rem' }}>Voedingsgids — Gelegenheden</h2>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 1rem', fontWeight: 500 }}>
        Voeg per gelegenheid goede en minder goede keuzes toe. Je client ziet ze in de Voedingsgids.
      </p>

      {/* Gelegenheid-tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        {OCCASIONS.map(o => {
          const active = occasion === o.id
          return (
            <button key={o.id} onClick={() => setOccasion(o.id)} style={{
              flexShrink: 0, padding: '0.45rem 0.8rem', borderRadius: 999,
              background: active ? GOLD : 'rgba(255,255,255,0.04)',
              border: active ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{o.emoji} {o.label}</button>
          )
        })}
      </div>

      {/* Toevoeg-form */}
      <div style={{ background: '#111', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 14, padding: isMobile ? '0.85rem' : '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <input style={inputStyle} placeholder="Titel (bv. Handje noten)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input style={inputStyle} placeholder="Kcal" inputMode="numeric" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: e.target.value.replace(/\D/g, '') }))} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
          {/* Preview */}
          <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.1rem' }}>🍽️</span>}
          </div>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Foto-URL of upload →" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          {/* Upload-knop */}
          <label style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: isMobile ? '0.55rem 0.7rem' : '0.6rem 0.85rem', borderRadius: 8, background: 'rgba(255,215,0,0.1)', border: `1px solid ${GOLD}44`, color: GOLD, fontSize: '0.78rem', fontWeight: 800, cursor: uploading ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
            <Upload size={14} /> {uploading ? '…' : 'Upload'}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>
        <input style={{ ...inputStyle, marginBottom: '0.6rem' }} placeholder="Korte tip (optioneel)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flex: 1 }}>
            {[{ v: 'good', label: 'Goede keuze', c: GREEN }, { v: 'bad', label: 'Minder goed', c: RED }].map(opt => {
              const active = form.verdict === opt.v
              return (
                <button key={opt.v} onClick={() => setForm(f => ({ ...f, verdict: opt.v }))} style={{
                  flex: 1, padding: '0.6rem', borderRadius: 10, cursor: 'pointer',
                  background: active ? `${opt.c}22` : 'rgba(255,255,255,0.03)',
                  border: active ? `1.5px solid ${opt.c}` : '1px solid rgba(255,255,255,0.1)',
                  color: active ? opt.c : 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 800,
                }}>{opt.label}</button>
              )
            })}
          </div>
          <button onClick={addItem} disabled={saving || !form.title.trim()} style={{
            padding: '0.6rem 1.1rem', borderRadius: 10, border: 'none', cursor: saving ? 'default' : 'pointer',
            background: (saving || !form.title.trim()) ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg,#FFD700,#D4AF37)',
            color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}><Plus size={15} /> {saving ? '…' : 'Toevoegen'}</button>
        </div>
      </div>

      {/* Lijsten */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Laden…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
          <GuideColumn title="Goede keuzes" color={GREEN} items={good} onRemove={removeItem} />
          <GuideColumn title="Minder goed" color={RED} items={bad} onRemove={removeItem} />
        </div>
      )}
    </div>
  )
}

function GuideColumn({ title, color, items, onRemove }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{title}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)', padding: '0.5rem 0' }}>Nog niks toegevoegd.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {items.map(i => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#111', border: `1px solid ${color}33`, borderRadius: 10, padding: '0.5rem 0.6rem' }}>
              <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i.image_url ? <img src={i.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>🍽️</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.title}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{i.kcal ? `${i.kcal} kcal` : '—'}{i.note ? ` · ${i.note}` : ''}</div>
              </div>
              <button onClick={() => onRemove(i.id)} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
