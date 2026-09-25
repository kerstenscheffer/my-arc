// src/modules/meal-plan/components/VoedingsplanFaq.jsx
//
// De algemene vragen over het voedingsplan, onderaan de maaltijdpagina.
// Niet per recept maar over het geheel: mag ik ruilen, wat als ik een dag
// oversla, moet ik wegen.
//
// Dicht beginnen. Wie de vraag niet heeft, hoort er geen lap tekst voor te
// krijgen; wie hem wel heeft, vindt hem waar hij hem zoekt.

import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'

const LIJN = 'rgba(255,255,255,0.08)'

export default function VoedingsplanFaq({ db, isMobile }) {
  const [vragen, setVragen] = useState([])
  const [open, setOpen] = useState(null)
  const [uitgeklapt, setUitgeklapt] = useState(false)

  useEffect(() => {
    let leeft = true
    if (!db?.supabase) return undefined
    db.supabase
      .from('nutrition_faq')
      .select('id, vraag, antwoord')
      .order('volgorde', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.warn('Vragen laden mislukt:', error.message); return }
        if (leeft) setVragen(data || [])
      })
    return () => { leeft = false }
  }, [db])

  if (!vragen.length) return null

  return (
    <div style={{
      margin: isMobile ? '1.5rem 1rem calc(2rem + env(safe-area-inset-bottom, 0px))' : '2rem 1.5rem 2.5rem',
      borderTop: `1px solid ${LIJN}`,
    }}>
      <button
        onClick={() => setUitgeklapt(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '1rem 0', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <HelpCircle size={18} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff' }}>
          Vragen over je plan
        </span>
        <span style={{ flexShrink: 0, fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
          {uitgeklapt ? '−' : '+'}
        </span>
      </button>

      {uitgeklapt && vragen.map((v, i) => {
        const aan = open === v.id
        return (
          <div key={v.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${LIJN}` }}>
            <button
              onClick={() => setOpen(aan ? null : v.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.85rem 0', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                {v.vraag}
              </span>
              <span style={{ flexShrink: 0, fontSize: '1.05rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                {aan ? '−' : '+'}
              </span>
            </button>
            {aan && (
              <p style={{
                margin: '0 0 0.9rem', paddingRight: '1.5rem',
                fontSize: isMobile ? '0.86rem' : '0.9rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.55,
              }}>
                {v.antwoord}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
