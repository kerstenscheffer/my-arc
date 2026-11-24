// src/client/components/AccountOpSlot.jsx
//
// Wat een klant ziet als zijn account op slot staat (clients.account_locked_at,
// gezet door de coach als de coaching stopt). Niets is weg: plannen, gewicht,
// foto's en logs blijven bewaard en staan er weer als de coach hem ontgrendelt.
//
// 24 nov 2026 (Kersten):
//   - Staat er een verlenging open (ja gezegd, nog niet betaald), dan altijd de
//     betaallink + uitleg, ook als het slot een andere reden heeft.
//   - Geen openstaande betaling: zelf kiezen hoe verder. Borg naar de app (alleen
//     met een borg), verder met coaching, of contact. De keuze komt als melding
//     bij de coach (mijn_slot_keuze) en opent WhatsApp met een klaar bericht.

import { useEffect, useState } from 'react'
import { Lock, LogOut, CreditCard, Smartphone, Dumbbell, MessageCircle, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const WHATSAPP = '31631388756'
const euro = (n) => `€${Number(n || 0).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`
const datum = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : '')

const tekst = { fontSize: '0.92rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginTop: 12 }
const knopWit = {
  width: '100%', minHeight: 52, borderRadius: 14, background: '#fff', border: 'none', color: '#0a0a0a',
  fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const keuzeKnop = {
  width: '100%', padding: '0.85rem 0.95rem', borderRadius: 14, textAlign: 'left',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
  fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

export default function AccountOpSlot({ client, onLogout }) {
  const [betaling, setBetaling] = useState(null)
  const [borg, setBorg] = useState(null)
  const [geladen, setGeladen] = useState(false)
  const [gekozen, setGekozen] = useState(null)

  useEffect(() => {
    let leeft = true
    Promise.all([
      supabase.rpc('mijn_open_betaling').then(r => r, () => ({ data: null })),
      supabase.rpc('mijn_borg').then(r => r, () => ({ data: null })),
    ]).then(([b, g]) => {
      if (!leeft) return
      if (b?.data && typeof b.data === 'object') setBetaling(b.data)
      if (g?.data && typeof g.data === 'object') setBorg(g.data)
      setGeladen(true)
    })
    return () => { leeft = false }
  }, [])

  const voornaam = (client?.first_name || '').trim()
  const kies = (keuze, bericht) => {
    setGekozen(keuze)
    supabase.rpc('mijn_slot_keuze', { p_keuze: keuze }).then(() => null, () => null)
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(bericht)}`, '_blank', 'noopener')
  }

  const keuzes = [
    borg && {
      id: 'borg_app', Icon: Smartphone, titel: 'Borg omzetten naar de app',
      sub: `Je borg van ${euro(borg.bedrag)} gaat naar de app: je houdt je plannen, tracking en logs.`,
      bericht: `Hoi Kersten, ik wil mijn borg omzetten naar de app.${voornaam ? ` Groet, ${voornaam}` : ''}`,
    },
    {
      id: 'coaching', Icon: Dumbbell, titel: 'Verder met coaching',
      sub: 'Weer begeleiding van je coach, met plannen op maat en check-ins.',
      bericht: `Hoi Kersten, ik wil graag verder met coaching.${voornaam ? ` Groet, ${voornaam}` : ''}`,
    },
    {
      id: 'contact', Icon: MessageCircle, titel: 'Contact met je coach',
      sub: 'Vragen of twijfel? Stuur een berichtje.',
      bericht: `Hoi Kersten, mijn toegang is verlopen. Kunnen we even contact hebben?${voornaam ? ` Groet, ${voornaam}` : ''}`,
    },
  ].filter(Boolean)

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem',
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 1.25rem',
          background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={28} strokeWidth={2.4} />
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          {voornaam ? `Hé ${voornaam},` : 'Hé,'} je toegang is verlopen
        </div>

        {!geladen ? (
          <div style={{ ...tekst, marginTop: 20 }}>Even laden…</div>
        ) : betaling ? (
          <>
            <div style={tekst}>
              Je hebt ja gezegd op {betaling.aanbod || 'je vervolgtraject'}, maar de betaling staat nog open. Alles wat je hebt opgebouwd blijft bewaard.
            </div>

            {/* Wat staat er open, en hoe werkt het. */}
            <div style={{ marginTop: 20, padding: '0.95rem 1rem', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{betaling.aanbod || 'Vervolgtraject'}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  {euro(betaling.bedrag)}{betaling.per_maand ? <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}> /mnd</span> : null}
                </span>
              </div>
              {betaling.slot_op && (
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: betaling.te_laat ? '#f59e0b' : 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {betaling.te_laat ? 'Termijn verlopen' : `Uiterlijk ${datum(betaling.slot_op)}`}
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.8rem 0' }} />
              {[
                'Tik op Nu betalen, je komt op de betaalpagina.',
                'Betaal met iDEAL of je kaart.',
                'Zodra je coach de betaling ziet, gaat je account weer open. Je plannen staan er nog precies zo.',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.84rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginTop: i ? 8 : 0 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: '#fff', color: '#0a0a0a', fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>

            {betaling.betaal_link && (
              <button onClick={() => window.open(betaling.betaal_link, '_blank', 'noopener')} style={{ ...knopWit, marginTop: 18 }}>
                <CreditCard size={17} strokeWidth={2.6} /> Nu betalen
              </button>
            )}
            <button onClick={() => kies('contact', `Hoi Kersten, ik heb een vraag over mijn betaling.${voornaam ? ` Groet, ${voornaam}` : ''}`)} style={{
              marginTop: 10, width: '100%', minHeight: 44, borderRadius: 14, background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.86rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <MessageCircle size={15} strokeWidth={2.6} /> Vraag over je betaling? Stuur je coach een bericht
            </button>
          </>
        ) : (
          <>
            <div style={tekst}>
              Je coaching is gestopt. Alles wat je hebt opgebouwd blijft bewaard: je plannen, je gewicht, je foto's en je logs.
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.55, marginTop: 12 }}>
              Hoe wil je verder?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {keuzes.map(k => (
                <button key={k.id} onClick={() => kies(k.id, k.bericht)} style={{ ...keuzeKnop, ...(gekozen === k.id ? { borderColor: '#10b981' } : {}) }}>
                  <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: gekozen === k.id ? '#10b981' : '#fff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {gekozen === k.id ? <Check size={18} strokeWidth={3} /> : <k.Icon size={18} strokeWidth={2.5} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 900 }}>{k.titel}</span>
                    <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginTop: 2 }}>{k.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            {gekozen && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginTop: 12 }}>
                Je coach heeft je keuze gekregen en neemt contact met je op.
              </div>
            )}
          </>
        )}

        <button onClick={onLogout} style={{
          marginTop: 28, width: '100%', minHeight: 50, borderRadius: 14,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
          fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <LogOut size={16} strokeWidth={2.6} /> Uitloggen
        </button>
      </div>
    </div>
  )
}
