// src/client/components/AccountOpSlot.jsx
//
// Wat een klant ziet als zijn account op slot staat (clients.account_locked_at,
// gezet door de coach als de coaching stopt). Niets is weg: plannen, gewicht,
// foto's en logs blijven bewaard en staan er weer als de coach hem ontgrendelt.

import { Lock, LogOut } from 'lucide-react'

export default function AccountOpSlot({ client, onLogout }) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 1.25rem',
          background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={28} strokeWidth={2.4} />
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          {client?.first_name ? `Hé ${client.first_name.trim()},` : 'Hé,'} je account staat op pauze
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginTop: 12 }}>
          Je coaching is gestopt. Alles wat je hebt opgebouwd blijft bewaard: je plannen, je gewicht, je foto's en je logs.
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.55, marginTop: 12 }}>
          Wil je weer verder? Stuur je coach een berichtje, dan staat alles zo weer voor je klaar.
        </div>
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
