// src/modules/results/components/WinsTab.jsx
import React, { useState, useEffect } from 'react'

const isMobile = window.innerWidth <= 768

export default function WinsTab({ client, service }) {
  const [wins, setWins]     = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText]     = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (client) load() }, [client?.id])

  async function load() {
    setLoading(true)
    const data = await service.getWins(client.id)
    setWins(data)
    setLoading(false)
  }

  async function save() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const win = await service.saveWin(client.id, text)
      setWins(prev => [win, ...prev])
      setText('')
    } catch (e) { alert('Opslaan mislukt') }
    setSaving(false)
  }

  async function del(id) {
    await service.deleteWin(id)
    setWins(prev => prev.filter(w => w.id !== id))
  }

  if (!client) return <Empty text="Selecteer een client" />

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Win of quote van ${client.first_name}...`}
          rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) save() }}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', padding: '8px 10px', borderRadius: '6px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          style={{ background: '#FFD700', color: '#000', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800, padding: '8px 14px', cursor: 'pointer', flexShrink: 0, opacity: saving || !text.trim() ? 0.4 : 1, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          {saving ? '...' : 'Opslaan'}
        </button>
      </div>

      {/* List */}
      {loading && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', padding: '12px 0' }}>Laden...</div>}
      {!loading && wins.length === 0 && <Empty text={`Nog geen wins voor ${client.first_name}. Voeg een quote of win toe.`} />}

      {wins.map(w => <WinRow key={w.id} win={w} onDelete={() => del(w.id)} />)}
    </div>
  )
}

function WinRow({ win, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const date = new Date(win.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '14px', flexShrink: 0 }}>💬</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#fff', lineHeight: 1.5 }}>"{win.title}"</div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{date}</div>
      </div>
      <button
        onClick={() => confirm ? onDelete() : setConfirm(true)}
        onBlur={() => setConfirm(false)}
        style={{ background: 'none', border: 'none', color: confirm ? '#ef4444' : 'rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        {confirm ? 'Zeker?' : '×'}
      </button>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ padding: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center' }}>{text}</div>
}
