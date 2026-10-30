// src/modules/business-os/BusinessChat.jsx
//
// Chatbalk onder de reactor in Business OS: taken uitbesteden aan Claude
// (scripts, hooks, DM-teksten, meedenken over de cijfers). Praat met de edge
// function business-os-chat; het gesprek blijft per apparaat bewaard.

import { useState, useEffect, useRef } from 'react'
import { ArrowUp, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const KEY = 'business_os_chat'

const leesGesprek = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
const bewaarGesprek = (g) => {
  try { localStorage.setItem(KEY, JSON.stringify(g.slice(-40))) } catch { /* privé-venster */ }
}

function Kopieer({ tekst }) {
  const [klaar, setKlaar] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(tekst).then(() => { setKlaar(true); setTimeout(() => setKlaar(false), 1500) }, () => {})}
      title="Kopieer"
      style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
    >
      {klaar ? <Check size={14} color={colors.success} /> : <Copy size={14} />}
    </button>
  )
}

export default function BusinessChat({ context }) {
  const [gesprek, setGesprek] = useState(leesGesprek)
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const lijst = useRef(null)

  useEffect(() => {
    bewaarGesprek(gesprek)
    if (lijst.current) lijst.current.scrollTop = lijst.current.scrollHeight
  }, [gesprek, bezig])

  const stuur = async () => {
    const vraag = invoer.trim()
    if (!vraag || bezig) return
    const nieuw = [...gesprek, { role: 'user', content: vraag }]
    setGesprek(nieuw)
    setInvoer('')
    setBezig(true)
    setFout(null)
    const { data, error } = await supabase.functions.invoke('business-os-chat', {
      body: { berichten: nieuw, context },
    })
    setBezig(false)
    if (error || data?.error || !data?.tekst) {
      setFout(data?.error || 'AI gaf geen antwoord, probeer opnieuw.')
      return
    }
    setGesprek(g => [...g, { role: 'assistant', content: data.tekst }])
  }

  return (
    <div style={{ textAlign: 'left', marginTop: 24 }}>
      {gesprek.length > 0 && (
        <div ref={lijst} style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          {gesprek.map((b, i) => b.role === 'user' ? (
            <div key={i} style={{
              alignSelf: 'flex-end', maxWidth: '85%', background: colors.surface, borderRadius: 16,
              padding: '8px 12px', fontSize: '0.9rem', fontWeight: 700, color: colors.textPrimary, whiteSpace: 'pre-wrap',
            }}>
              {b.content}
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.55, color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                {b.content}
              </div>
              <Kopieer tekst={b.content} />
            </div>
          ))}
          {bezig && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textSecondary }}>Bezig…</div>}
        </div>
      )}
      {fout && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8, background: colors.surface,
        borderRadius: 24, padding: '4px 4px 4px 16px',
      }}>
        <textarea
          value={invoer}
          onChange={e => setInvoer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stuur() } }}
          placeholder="Geef een taak, bv. maak 3 reel-scripts over buikvet na je 30e"
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            color: colors.textPrimary, fontSize: '0.95rem', fontWeight: 600, padding: '10px 0',
            minHeight: 44, maxHeight: 140, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={stuur}
          disabled={bezig || !invoer.trim()}
          title="Verstuur"
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
            background: invoer.trim() && !bezig ? colors.textPrimary : 'rgba(255,255,255,0.15)',
            color: colors.onAccent, cursor: invoer.trim() && !bezig ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowUp size={18} strokeWidth={3} />
        </button>
      </div>
      {gesprek.length > 0 && (
        <button
          onClick={() => { setGesprek([]); setFout(null) }}
          style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '8px 4px', minHeight: 32 }}
        >
          Nieuw gesprek
        </button>
      )}
    </div>
  )
}
