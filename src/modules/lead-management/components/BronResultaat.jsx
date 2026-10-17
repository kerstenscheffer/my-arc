// src/modules/lead-management/components/BronResultaat.jsx
//
// Waar komen leads en omzet vandaan (17 okt 2026). Bovenaan het stats-scherm:
// per soort (Ads, lead magnets, campagnes, geen bron) de omzet met leads,
// calls en sales, en daaronder de losse bronnen op volgorde van omzet.
// Bron: RPC get_bron_resultaat (RLS van de coach, dus het hele team).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Megaphone, Magnet, Send, HelpCircle, X } from 'lucide-react'

const SOORTEN = [
  { id: 'ads', label: 'Ads', Icon: Megaphone, kleur: '#f59e0b' },
  { id: 'magnet', label: 'Lead magnets', Icon: Magnet, kleur: '#a855f7' },
  { id: 'campagne', label: 'Campagnes', Icon: Send, kleur: '#3b82f6' },
  { id: 'geen', label: 'Geen bron', Icon: HelpCircle, kleur: 'rgba(255,255,255,0.45)' },
]
const SOORT = Object.fromEntries(SOORTEN.map(s => [s.id, s]))
const eur = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')

export default function BronResultaat({ supabase, van, tot, isMobile, periode }) {
  const [rijen, setRijen] = useState(null)
  const [uitleg, setUitleg] = useState(null) // { soort, naam, titel }

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
          <button key={s.id} onClick={() => setUitleg({ soort: s.id, naam: null, titel: s.label })} style={{
            minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, color: '#fff',
            fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
              <s.Icon size={14} strokeWidth={2.6} color={s.kleur} /> {s.label}
            </div>
            <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 900, color: s.omzet > 0 ? '#fff' : 'rgba(255,255,255,0.35)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {eur(s.omzet)}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              {s.leads} leads · {s.calls} calls · {s.sales} sales
            </div>
          </button>
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
              <button key={`${r.soort}-${r.naam}-${i}`} onClick={() => setUitleg({ soort: r.soort, naam: r.naam, titel: r.naam })} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', color: '#fff', textAlign: 'left',
                fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <s.Icon size={14} strokeWidth={2.6} color={s.kleur} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                  {r.leads} leads · {r.calls} calls · {r.sales} sales
                </span>
                <span style={{ minWidth: 64, textAlign: 'right', fontSize: '0.9rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: Number(r.omzet) > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {eur(r.omzet)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {uitleg && (
        <BronUitleg supabase={supabase} van={van} tot={tot} periode={periode} {...uitleg}
          totaal={uitleg.naam ? rijen.find(r => r.soort === uitleg.soort && r.naam === uitleg.naam) : perSoort.find(p => p.id === uitleg.soort)}
          onClose={() => setUitleg(null)} isMobile={isMobile} />
      )}
    </div>
  )
}

// Hoe zijn de getallen van één soort of bron tot stand gekomen: de regels, en
// de sales, calls en nieuwe leads die erachter zitten.
const REGEL = {
  ads: 'Leads uit het challenge-formulier van de Meta-advertenties (lead_source challenge_prequal), per hook (utm_content).',
  magnet: 'Leads die via een lead magnet binnenkwamen (gekoppelde lead magnet op de lead).',
  campagne: 'Leads die bij een outreach-campagne horen (gekoppelde campagne op de lead) en niet uit een magnet of advertentie komen.',
  geen: 'Leads zonder advertentie, lead magnet of campagne, meestal handmatig toegevoegde Instagram-leads.',
}

function BronUitleg({ supabase, van, tot, periode, soort, naam, titel, totaal, onClose, isMobile }) {
  const [rijen, setRijen] = useState(null)
  useEffect(() => {
    let weg = false
    supabase.rpc('get_bron_details', { p_van: van, p_tot: tot, p_soort: soort, p_naam: naam })
      .then(r => { if (!weg) setRijen(r.data || []) }, () => { if (!weg) setRijen([]) })
    return () => { weg = true }
  }, [supabase, van, tot, soort, naam])

  const s = SOORT[soort] || SOORT.geen
  const sales = (rijen || []).filter(r => r.type === 'sale')
  const calls = (rijen || []).filter(r => r.type === 'call')
  const leads = (rijen || []).filter(r => r.type === 'lead')
  const datum = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const nLeads = Number(totaal?.leads) || 0
  const kop = { fontSize: '0.85rem', fontWeight: 900, color: '#fff', margin: '1.1rem 0 0.3rem', display: 'flex', justifyContent: 'space-between' }
  const regel = (links, rechts, sub) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{links}</span>
        {sub && <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{sub}</span>}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 900, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{rechts}</span>
    </div>
  )

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 2147483500, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 620, maxHeight: isMobile ? '92vh' : '86vh', background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '18px 18px 0 0' : 18,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 1.1rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <s.Icon size={18} strokeWidth={2.6} color={s.kleur} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titel}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{periode}</div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={18} strokeWidth={2.8} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1.1rem calc(1.2rem + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            <b style={{ color: '#fff' }}>Welke leads:</b> {REGEL[soort]}<br />
            <b style={{ color: '#fff' }}>Leads</b> = nieuw binnengekomen in deze periode. <b style={{ color: '#fff' }}>Calls</b> = leads die in deze periode naar een call-sectie gingen (ingepland of sales call). <b style={{ color: '#fff' }}>Sales</b> = sales met een bedrag in deze periode, ook van leads die eerder binnenkwamen; terugbetaalde challenges tellen niet mee. <b style={{ color: '#fff' }}>Omzet</b> = optelsom van de orderwaarde van die sales.
          </div>

          {rijen === null ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Laden…</div>
          ) : (
            <>
              <div style={kop}><span>Sales ({sales.length})</span><span>{eur(sales.reduce((t, r) => t + Number(r.bedrag || 0), 0))}</span></div>
              {sales.length === 0 ? <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen sales in deze periode.</div>
                : sales.map((r, i) => <div key={`s${i}`}>{regel(r.lead_naam, eur(r.bedrag), [datum(r.datum), r.detail, naam ? null : r.bron].filter(Boolean).join(' · '))}</div>)}

              <div style={kop}><span>Calls ({calls.length})</span></div>
              {calls.length === 0 ? <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen calls in deze periode.</div>
                : calls.map((r, i) => <div key={`c${i}`}>{regel(r.lead_naam, datum(r.datum), [r.detail, naam ? null : r.bron].filter(Boolean).join(' · '))}</div>)}

              <div style={kop}><span>Nieuwe leads ({nLeads})</span>{nLeads > leads.length && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>laatste {leads.length}</span>}</div>
              {leads.length === 0 ? <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen nieuwe leads in deze periode.</div>
                : leads.map((r, i) => <div key={`l${i}`}>{regel(r.lead_naam, datum(r.datum), naam ? null : r.bron)}</div>)}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
