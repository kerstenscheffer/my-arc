// src/modules/coach-command-center/components/insight/ClientActionsManager.jsx
// Coach-invoer voor de "Acties" die de client op z'n home-pagina ziet
// (tabel client_action_items, getoond door ClientHome → ActionItems).
// Hier kan de coach acties toevoegen, afvinken en verwijderen. Issue 2439051f.
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'

const GOLD = '#FFD700'
const GREEN = '#10b981'

const SOURCE_LABEL = { coach: 'Coach', call: 'Call', whatsapp: 'WhatsApp', checkin: 'Check-in' }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : null

export default function ClientActionsManager({ client, db, isMobile }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  const load = async () => {
    if (!client?.id || !db?.supabase) return
    setLoading(true)
    try {
      const { data } = await db.supabase
        .from('client_action_items')
        .select('*')
        .eq('client_id', client.id)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
      setItems(data || [])
    } catch (e) { console.error('Acties laden mislukt:', e); setItems([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [client?.id])

  const add = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      const { data: auth } = await db.supabase.auth.getUser()
      const { error } = await db.supabase.from('client_action_items').insert({
        client_id: client.id,
        coach_id: auth?.user?.id,
        text: text.trim(),
        status: 'open',
        source: 'coach',
        due_date: due || null,
      })
      if (error) throw error
      setText(''); setDue('')
      await load()
    } catch (e) { alert('Actie opslaan mislukt: ' + (e?.message || JSON.stringify(e))) }
    finally { setSaving(false) }
  }

  const toggle = async (item) => {
    const next = item.status === 'done' ? 'open' : 'done'
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i))
    try {
      await db.supabase.from('client_action_items')
        .update({ status: next, completed_at: next === 'done' ? new Date().toISOString() : null })
        .eq('id', item.id)
    } catch (e) { console.error('Toggle mislukt:', e); load() }
  }

  const remove = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    try { await db.supabase.from('client_action_items').delete().eq('id', id) }
    catch (e) { console.error('Verwijderen mislukt:', e); load() }
  }

  const inputStyle = { padding: isMobile ? '0.55rem 0.6rem' : '0.6rem 0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: isMobile ? '0.85rem' : '0.88rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div style={{ padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem' }}>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 0.7rem', fontWeight: 500, lineHeight: 1.4 }}>
        Acties die {client.first_name} op de home-pagina ziet. Voeg toe wat je afspreekt; de client kan ze afvinken.
      </p>

      {/* Toevoeg-form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input
          style={inputStyle}
          placeholder="Nieuwe actie (bv. Stuur dinsdag een foto van je lunch)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="date" style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} value={due} onChange={e => setDue(e.target.value)} />
          <button onClick={add} disabled={saving || !text.trim()} style={{
            flexShrink: 0, padding: isMobile ? '0.55rem 0.9rem' : '0.6rem 1.1rem', borderRadius: 8, border: 'none',
            background: (saving || !text.trim()) ? 'rgba(255,215,0,0.35)' : 'linear-gradient(135deg,#FFD700,#D4AF37)',
            color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}><Plus size={14} /> {saving ? '…' : 'Toevoegen'}</button>
        </div>
      </div>

      {/* Lijst */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Laden…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Nog geen acties voor deze client.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {items.map(item => {
            const done = item.status === 'done'
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, opacity: done ? 0.55 : 1 }}>
                <button onClick={() => toggle(item)} aria-label="Afvinken" style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 6, cursor: 'pointer',
                  background: done ? GREEN : 'transparent', border: `1.5px solid ${done ? GREEN : 'rgba(255,255,255,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}>{done && <Check size={13} color="#0a0a0a" strokeWidth={3} />}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none' }}>{item.text}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 2 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)' }}>{SOURCE_LABEL[item.source] || item.source}</span>
                    {item.due_date && <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>· deadline {fmtDate(item.due_date)}</span>}
                  </div>
                </div>
                <button onClick={() => remove(item.id)} aria-label="Verwijderen" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
