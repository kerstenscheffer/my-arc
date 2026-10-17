// src/modules/challenge-ads/PrequalAfgewezen.jsx
//
// Afgewezen leads uit de prekwalificatie (17 okt 2026). Ze staan op het bord
// in "Niet geschikt"; hier zie je per lead de reden en alle antwoorden, en
// zet je iemand met één klik alsnog in 🎯 Ad lead als hij toch past.

import { useEffect, useState } from 'react'
import { ChevronDown, Ban, ArrowUpRight, Check } from 'lucide-react'
import db from '../../services/DatabaseService'
import LeadManagementService from '../lead-management/LeadManagementService'

const AD_LEAD_SECTIE = 'a1d1ead0-0000-4000-8000-000000000001'

// "Hoe belangrijk ... → 3" wordt "Belang 3/10"; vaste teksten worden kort.
const korteReden = (r) => {
  const t = String(r || '')
  if (/borg/i.test(t)) return 'Borg: nee'
  if (/2x per week|trainen/i.test(t)) return 'Traint 0–1x per week'
  if (/belangrijk/i.test(t)) return `Belang ${t.split('→').pop().trim()}/10`
  if (/oud|leeftijd|18/i.test(t)) return 'Onder 18'
  return t.includes('→') ? t.split('→').pop().trim() : (t || 'Onbekend')
}

export default function PrequalAfgewezen({ venster }) {
  const [lijst, setLijst] = useState(null)
  const [open, setOpen] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [verplaatst, setVerplaatst] = useState({})

  useEffect(() => {
    if (!venster) return
    let weg = false
    db.supabase.rpc('get_prequal_afgewezen', { p_van: venster.van, p_tot: venster.tot })
      .then(r => { if (!weg) setLijst(r.data || []) }, () => { if (!weg) setLijst([]) })
    return () => { weg = true }
  }, [venster])

  const tochGeschikt = async (l) => {
    setBezig(l.lead_id)
    try {
      const { data } = await db.supabase.auth.getUser()
      const res = await new LeadManagementService().moveLeadToSection(l.lead_id, AD_LEAD_SECTIE, 0, data?.user?.id || null)
      if (!res?.success) throw res?.error || new Error('niet verplaatst')
      setVerplaatst(v => ({ ...v, [l.lead_id]: true }))
    } catch (e) {
      console.error('Verplaatsen mislukt:', e)
      alert('Verplaatsen naar Ad lead mislukt')
    } finally { setBezig(null) }
  }

  if (!lijst) return null
  const tellen = lijst.reduce((t, l) => { const k = korteReden(l.reden); t[k] = (t[k] || 0) + 1; return t }, {})

  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ban size={14} strokeWidth={2.6} /> Afgewezen ({lijst.length})
      </div>
      {lijst.length > 0 && (
        <div style={{ display: 'flex', gap: '4px 14px', flexWrap: 'wrap', margin: '6px 0 10px', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
          {Object.entries(tellen).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k}>{k}: <b style={{ color: '#fff' }}>{n}</b></span>)}
        </div>
      )}
      {lijst.length === 0 ? (
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>Niemand afgewezen in deze periode.</div>
      ) : lijst.map(l => {
        const isOpen = open === l.lead_id
        const weg = verplaatst[l.lead_id]
        return (
          <div key={l.lead_id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', opacity: weg ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
              <button onClick={() => setOpen(isOpen ? null : l.lead_id)} style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                padding: 0, color: '#fff', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <ChevronDown size={15} style={{ flexShrink: 0, opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900 }}>{l.voornaam || 'Onbekend'}</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#f59e0b' }}>{korteReden(l.reden)}</span> · {new Date(l.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · {l.hook}
                  </span>
                </span>
              </button>
              {weg ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}><Check size={14} strokeWidth={3} /> In Ad lead</span>
              ) : (
                <button onClick={() => tochGeschikt(l)} disabled={bezig === l.lead_id} style={{
                  display: 'flex', alignItems: 'center', gap: 5, minHeight: 32, padding: '0 11px', borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(16,185,129,0.5)', color: '#10b981',
                  fontSize: '0.75rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: bezig === l.lead_id ? 0.5 : 1,
                }}>
                  <ArrowUpRight size={14} strokeWidth={2.8} /> Toch geschikt
                </button>
              )}
            </div>
            {isOpen && (
              <div style={{ padding: '0 0 12px 23px' }}>
                {(l.email || l.telefoon) && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                    {[l.telefoon, l.email].filter(Boolean).join(' · ')}
                  </div>
                )}
                {(l.antwoorden || []).length === 0 ? (
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Geen antwoorden bewaard (ingevuld vóór de antwoordenlijst bestond).</div>
                ) : l.antwoorden.map((a, i) => (
                  <div key={i} style={{ padding: '5px 0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{a.vraag}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: 1 }}>{a.antwoord}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
