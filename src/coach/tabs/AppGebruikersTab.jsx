// src/coach/tabs/AppGebruikersTab.jsx
//
// CoachHub → Clients → App-gebruikers (24 nov 2026). Overzicht van iedereen die
// zich zelf in de app heeft aangemeld (clients.app_abonnee, geen coaching):
// aantallen, abonnementsstand, wie coaching wil, en wat ze aan Kersten AI vragen.
// Data: RPC get_app_overzicht (alleen de coach).

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const GOUD = '#FFD700'
const DOEL = { fat_loss: 'Vet kwijt', cut: 'Vet kwijt', muscle_gain: 'Meer spieren', bulk: 'Meer spieren', recomp: 'Strakker', maintain: 'Fit blijven' }
const STAND = { proef: 'Proefmaand', actief: 'Betalend', respijt: 'Betaalprobleem', geen: 'Geen abonnement' }
const datum = (iso) => iso ? new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '–'

export default function AppGebruikersTab({ isMobile = false }) {
  const [data, setData] = useState(null)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    supabase.rpc('get_app_overzicht').then(({ data: d, error }) => {
      if (error) setFout('Laden lukte niet.')
      else setData(d)
    }, () => setFout('Laden lukte niet.'))
  }, [])

  if (fout) return <div style={{ padding: 24, color: '#f87171', fontWeight: 900 }}>{fout}</div>
  if (!data) return <div style={{ padding: 24, color: '#fff', fontWeight: 900 }}>Even laden…</div>

  const tegels = [
    ['Totaal', data.totaal], ['Nieuw (7 dagen)', data.nieuw_7d], ['In proefmaand', data.proef],
    ['Betalend', data.betalend], ['Geen abonnement', data.geen], ['Wil coaching', data.wil_coaching],
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem', color: '#fff' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>App-gebruikers</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 4 }}>Mensen die zich zelf in de app hebben aangemeld, zonder coaching.</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 10, marginTop: 18 }}>
        {tegels.map(([l, w]) => (
          <div key={l} style={{ padding: '14px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: l === 'Betalend' || l === 'Wil coaching' ? GOUD : '#fff' }}>{w}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 20, marginTop: 24 }}>
        {/* Gebruikers */}
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 8 }}>Gebruikers</div>
          {data.gebruikers.length === 0 && <div style={{ fontWeight: 800 }}>Nog niemand.</div>}
          {data.gebruikers.map(g => (
            <div key={g.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>
                  {g.first_name || g.email}
                  {g.wil_coaching && <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 900, background: GOUD, color: '#000', borderRadius: 6, padding: '2px 6px' }}>Wil coaching</span>}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: g.stand === 'actief' ? GOUD : g.stand === 'geen' ? '#f87171' : '#fff' }}>
                  {STAND[g.stand] || g.stand}{g.verloopt_op && g.stand !== 'geen' ? ` · t/m ${datum(g.verloopt_op)}` : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 4, opacity: 0.85 }}>
                {g.email} · sinds {datum(g.created_at)} · {DOEL[g.primary_goal] || g.primary_goal || '–'} · {g.target_calories ?? '–'} kcal · {g.current_weight ?? '–'} → {g.goal_weight ?? '–'} kg · gewogen {datum(g.laatst_gewogen)} · {g.ai_vragen} AI-vragen
              </div>
            </div>
          ))}
        </div>

        {/* Vragen aan Kersten AI */}
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 8 }}>Laatste vragen aan Kersten AI</div>
          {data.vragen.length === 0 && <div style={{ fontWeight: 800 }}>Nog geen vragen.</div>}
          {data.vragen.map((v, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{v.tekst}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: GOUD, marginTop: 2 }}>{v.first_name || 'Iemand'} · {datum(v.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
