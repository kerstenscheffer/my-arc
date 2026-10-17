// src/modules/lead-management/components/BronResultaat.jsx
//
// Waar komen leads en omzet vandaan (17 okt 2026). Bovenaan het stats-scherm:
// per soort (Ads, lead magnets, campagnes, geen bron) de omzet met leads,
// calls en sales, en daaronder de losse bronnen op volgorde van omzet.
// Bron: RPC get_bron_resultaat (RLS van de coach, dus het hele team).

import { useEffect, useState } from 'react'
import { Megaphone, Magnet, Send, HelpCircle } from 'lucide-react'

const SOORTEN = [
  { id: 'ads', label: 'Ads', Icon: Megaphone, kleur: '#f59e0b' },
  { id: 'magnet', label: 'Lead magnets', Icon: Magnet, kleur: '#a855f7' },
  { id: 'campagne', label: 'Campagnes', Icon: Send, kleur: '#3b82f6' },
  { id: 'geen', label: 'Geen bron', Icon: HelpCircle, kleur: 'rgba(255,255,255,0.45)' },
]
const SOORT = Object.fromEntries(SOORTEN.map(s => [s.id, s]))
const eur = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')

export default function BronResultaat({ supabase, van, tot, isMobile }) {
  const [rijen, setRijen] = useState(null)

  useEffect(() => {
    if (!supabase || !van || !tot) return
    let weg = false
    supabase.rpc('get_bron_resultaat', { p_van: van, p_tot: tot })
      .then(r => { if (!weg) setRijen(r.data || []) }, () => { if (!weg) setRijen([]) })
    return () => { weg = true }
  }, [supabase, van, tot])

  if (!rijen) return null
  const som = (lijst, k) => lijst.reduce((t, r) => t + (Number(r[k]) || 0), 0)
  const perSoort = SOORTEN.map(s => {
    const l = rijen.filter(r => r.soort === s.id)
    return { ...s, omzet: som(l, 'omzet'), leads: som(l, 'leads'), calls: som(l, 'calls'), sales: som(l, 'sales') }
  })
  const totaal = som(rijen, 'omzet')
  const top = rijen.filter(r => Number(r.omzet) > 0 || Number(r.calls) > 0 || Number(r.leads) >= 5).slice(0, 8)
  // Meeste euro per lead, alleen bij genoeg leads om iets te zeggen.
  const beste = rijen.filter(r => Number(r.leads) >= 10 && Number(r.omzet) > 0)
    .map(r => ({ ...r, perLead: Number(r.omzet) / Number(r.leads) }))
    .sort((a, b) => b.perLead - a.perLead)[0]

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>Waar komt het vandaan</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{eur(totaal)} orderwaarde</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, minmax(0, 1fr))`, gap: isMobile ? 14 : 24 }}>
        {perSoort.map(s => (
          <div key={s.id} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
              <s.Icon size={14} strokeWidth={2.6} color={s.kleur} /> {s.label}
            </div>
            <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 900, color: s.omzet > 0 ? '#fff' : 'rgba(255,255,255,0.35)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {eur(s.omzet)}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              {s.leads} leads · {s.calls} calls · {s.sales} sales
            </div>
          </div>
        ))}
      </div>

      {beste && (
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginTop: 14 }}>
          Meeste per lead: <span style={{ color: '#10b981' }}>{beste.naam}</span> · {eur(beste.perLead)} per lead ({beste.leads} leads, {beste.sales} sales)
        </div>
      )}

      {top.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {top.map((r, i) => {
            const s = SOORT[r.soort] || SOORT.geen
            return (
              <div key={`${r.soort}-${r.naam}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <s.Icon size={14} strokeWidth={2.6} color={s.kleur} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                  {r.leads} leads · {r.calls} calls · {r.sales} sales
                </span>
                <span style={{ minWidth: 64, textAlign: 'right', fontSize: '0.9rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: Number(r.omzet) > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {eur(r.omzet)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
