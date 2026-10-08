// src/modules/challenge-ads/ChallengeAdsDashboard.jsx
//
// Coachscherm "Ads": wat de Meta-advertenties voor de 6 Weken Challenge
// opleveren, per hook (utm_content). Bron: challenge_events (gemeten op de
// pagina) en call_leads (aanmeldingen en geplande calls), via de
// database-functie get_challenge_ad_stats.
//
// CTR staat hier niet: die zit in Meta Ads Manager (klikken / vertoningen).
// Wat hier staat begint bij de klik: bezoeken, tijd, video, formulier,
// geschikt of niet, en calls gepland.

import { useEffect, useState } from 'react'
import { RefreshCw, Megaphone, Clock, Play, ClipboardList, CalendarCheck, UserX, Copy, Check } from 'lucide-react'

const GOLD = '#FFD700'

const PERIODES = [
  { id: '7', label: '7 dagen', dagen: 7 },
  { id: '14', label: '14 dagen', dagen: 14 },
  { id: '30', label: '30 dagen', dagen: 30 },
  { id: '90', label: '90 dagen', dagen: 90 },
]

const fmtTijd = (s) => {
  const n = Number(s) || 0
  if (n < 60) return `${n}s`
  return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`
}
const pct = (deel, heel) => (heel > 0 ? `${Math.round((deel / heel) * 100)}%` : '–')

const LINK_VOORBEELD = 'https://www.myarcfitness.com/challenge?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}'

export default function ChallengeAdsDashboard({ db, isMobile }) {
  const m = isMobile
  const [periode, setPeriode] = useState('14')
  const [rijen, setRijen] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)

  const laad = async () => {
    setLaden(true); setFout('')
    try {
      const dagen = PERIODES.find(p => p.id === periode)?.dagen || 14
      const tot = new Date(); tot.setHours(23, 59, 59, 999)
      const van = new Date(); van.setDate(van.getDate() - dagen + 1); van.setHours(0, 0, 0, 0)
      const { data, error } = await db.supabase.rpc('get_challenge_ad_stats', { p_van: van.toISOString(), p_tot: new Date(tot.getTime() + 1).toISOString() })
      if (error) throw error
      setRijen(data || [])
    } catch (e) {
      console.error('ads-stats laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally { setLaden(false) }
  }
  useEffect(() => { laad() }, [periode]) // eslint-disable-line react-hooks/exhaustive-deps

  const som = (k) => rijen.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  const totaal = {
    bezoeken: som('bezoeken'), sessies: som('sessies'),
    tijd: rijen.length ? Math.round(rijen.reduce((s, r) => s + (Number(r.tijd_gem) || 0) * (Number(r.sessies) || 0), 0) / Math.max(1, som('sessies'))) : 0,
    video_start: som('video_start'), video_half: som('video_half'), video_uit: som('video_uit'),
    knop: som('knop'), form_start: som('form_start'), form_klaar: som('form_klaar'),
    geschikt: som('geschikt'), ongeschikt: som('nog_niet') + som('ongeschikt'),
    leads: som('leads'), calls: som('calls_gepland'),
  }

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(LINK_VOORBEELD); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000) } catch { /* leeg */ }
  }

  const tegels = [
    { Icon: Megaphone, label: 'Bezoeken', waarde: totaal.bezoeken, sub: `${totaal.sessies} unieke` },
    { Icon: Clock, label: 'Tijd op pagina', waarde: fmtTijd(totaal.tijd), sub: 'gemiddeld per bezoeker' },
    { Icon: Play, label: 'Video gestart', waarde: totaal.video_start, sub: `${pct(totaal.video_start, totaal.sessies)} van bezoekers · ${pct(totaal.video_half, totaal.video_start)} haalt de helft` },
    { Icon: ClipboardList, label: 'Formulier af', waarde: totaal.form_klaar, sub: `${totaal.form_start} gestart · ${pct(totaal.form_klaar, totaal.form_start)} afgemaakt` },
    { Icon: CalendarCheck, label: 'Calls gepland', waarde: totaal.calls, sub: `${pct(totaal.calls, totaal.geschikt)} van geschikte leads`, kleur: '#10b981' },
    { Icon: UserX, label: 'Ongeschikt', waarde: totaal.ongeschikt, sub: `${pct(totaal.ongeschikt, totaal.form_klaar)} van ingevuld`, kleur: '#ef4444' },
  ]

  const kolommen = [
    { k: 'hook', label: 'Hook (utm_content)', links: true },
    { k: 'campagne', label: 'Campagne', links: true },
    { k: 'bezoeken', label: 'Bezoeken' },
    { k: 'tijd_gem', label: 'Tijd', f: fmtTijd },
    { k: 'video_start', label: 'Video' },
    { k: 'form_klaar', label: 'Form af' },
    { k: 'geschikt', label: 'Geschikt', kleur: '#10b981' },
    { k: 'ongeschikt_tot', label: 'Ongeschikt', kleur: '#ef4444', f: (v, r) => (Number(r.nog_niet) || 0) + (Number(r.ongeschikt) || 0) },
    { k: 'calls_gepland', label: 'Calls', kleur: GOLD },
  ]

  return (
    <div style={{ padding: m ? '1rem' : '1.5rem 2rem', color: '#fff', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Ads · 6 Weken Challenge</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Vanaf de klik op de advertentie. CTR en kosten staan in Meta Ads Manager.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {PERIODES.map(p => (
            <button key={p.id} onClick={() => setPeriode(p.id)} style={{
              padding: '0.45rem 0.8rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              background: periode === p.id ? '#fff' : 'rgba(255,255,255,0.06)', color: periode === p.id ? '#000' : 'rgba(255,255,255,0.75)',
              border: `1px solid ${periode === p.id ? '#fff' : 'rgba(255,255,255,0.12)'}`,
            }}>{p.label}</button>
          ))}
          <button onClick={laad} aria-label="Verversen" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ animation: laden ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {fout && <div style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>{fout}</div>}

      {/* Tegels */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: m ? 8 : 12, marginBottom: '1.25rem' }}>
        {tegels.map(t => (
          <div key={t.label} style={{ padding: m ? '0.8rem 0.9rem' : '1rem 1.1rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              <t.Icon size={14} color={t.kleur || GOLD} /> {t.label}
            </div>
            <div style={{ fontSize: m ? '1.6rem' : '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 4, color: t.kleur || '#fff', fontVariantNumeric: 'tabular-nums' }}>{t.waarde}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Per hook */}
      <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,215,0,0.04)' }}>
          Per hook
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: m ? '0.78rem' : '0.85rem', minWidth: 720 }}>
            <thead>
              <tr>
                {kolommen.map(c => (
                  <th key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.6rem 0.75rem', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!laden && rijen.length === 0 && (
                <tr><td colSpan={kolommen.length} style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Nog geen bezoeken in deze periode.</td></tr>
              )}
              {rijen.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {kolommen.map(c => {
                    const ruw = c.f ? c.f(r[c.k], r) : r[c.k]
                    return (
                      <td key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.6rem 0.75rem', fontWeight: c.links ? 800 : 700, color: c.kleur || (c.links ? '#fff' : 'rgba(255,255,255,0.85)'), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', maxWidth: c.links ? 220 : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ruw ?? '–'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link-conventie */}
      <div style={{ marginTop: '1.25rem', padding: '0.9rem 1rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Link voor in de advertentie</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <code style={{ flex: 1, fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{LINK_VOORBEELD}</code>
          <button onClick={kopieer} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.7rem', borderRadius: 10, background: gekopieerd ? 'rgba(16,185,129,0.15)' : '#fff', color: gekopieerd ? '#10b981' : '#000', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {gekopieerd ? <Check size={14} /> : <Copy size={14} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.45 }}>
          Meta vult {'{{campaign.name}}'} en {'{{ad.name}}'} zelf in. Geef elke hook een eigen advertentienaam, dan staat hij hier als aparte regel.
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
