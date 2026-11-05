// src/modules/business-os/GinoKeten.jsx
//
// De hele keten per week in één tabel: van content tot geld (5 nov 2026). Zo zie je
// waar het lekt: minder gepost, minder views, minder calls of minder close.
//
// De lead- en salescijfers komen uit STAT_REEKS, dus dezelfde services en rekenregels
// als het stats-scherm in Leads. De content komt uit content_ig_media.
//
// Kleur: elke week tegen het eigen gemiddelde van die rij. Op of boven het gemiddelde groen,
// daaronder via geel en oranje naar rood bij 60% slechter. De lopende week krijgt geen kleur: die is nog niet af, dus altijd lager.
//
// Een getal aanklikken toont wat erachter zit: de posts, of de leads uit de stats-service.
// Nieuwe leads, reacties, follow-ups en binnengekomen geven alleen aantallen terug.

import { useEffect, useMemo, useState } from 'react'
import {
  Film, Sparkles, Eye, BarChart3, MessageSquare, UserPlus, Send, MessageCircle, PhoneCall, CalendarCheck, Calendar,
  Phone, Trophy, Euro, Wallet, UserX, PhoneOff, XCircle, Percent, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LeadManagementService from '../lead-management/LeadManagementService'
import { STAT_REEKS } from '../lead-management/components/statWeekReeks'

const GROEN = '#10b981'
const ROOD = '#ef4444'
const WEKEN = 8
const ROOD_BIJ = 0.6 // zoveel onder het gemiddelde is helemaal rood
const GROEN_TINT = 142

// content = uit content_ig_media, stat = label uit STAT_REEKS, deel = percentage van twee rijen.
// stap = telt mee als schakel in de zin bovenaan.
const RIJEN = [
  { key: 'posts', label: 'Posts', Icon: Film, kleur: '#fff', content: c => c.posts, lijst: { sorteer: 'tijd' } },
  { key: 'magnets', label: 'Magnets', Icon: Sparkles, kleur: '#fff', content: c => c.magnets, lijst: { sorteer: 'tijd', filter: p => p.soort === 'magnet' } },
  { key: 'viewsMagnet', label: 'Views per magnet', Icon: Eye, kleur: '#fff', content: c => c.viewsMagnet, stap: true, lijst: { sorteer: 'views', filter: p => p.soort === 'magnet' } },
  { key: 'views', label: 'Totaal views', Icon: BarChart3, kleur: '#fff', content: c => c.views, stap: true, lijst: { sorteer: 'views', filter: p => p.views != null } },
  { key: 'comments', label: 'Comments', Icon: MessageSquare, kleur: '#fff', content: c => c.comments, stap: true, lijst: { sorteer: 'comments', filter: p => p.comments != null } },
  { key: 'nieuw', label: 'Nieuwe leads', Icon: UserPlus, kleur: '#3b82f6', stat: 'Nieuwe leads' },
  { key: 'follow', label: 'Follow-ups', Icon: Send, kleur: '#f59e0b', stat: 'Follow-ups' },
  { key: 'reacties', label: 'Reacties', Icon: MessageCircle, kleur: GROEN, stat: 'Reacties', stap: true },
  { key: 'voorgesteld', label: 'Voorgesteld', Icon: PhoneCall, kleur: '#a855f7', stat: 'Voorgesteld', stage: 'callProposed', stap: true },
  { key: 'ingepland', label: 'Ingepland', Icon: CalendarCheck, kleur: '#06b6d4', stat: 'Ingepland', stage: 'callScheduled', stap: true },
  { key: 'gepland', label: 'Calls gepland', Icon: Calendar, kleur: '#6366f1', stat: 'Calls gepland', stage: 'callBooked' },
  { key: 'gevoerd', label: 'Call gevoerd', Icon: Phone, kleur: GROEN, stat: 'Call gevoerd', stage: 'callHeld', stap: true },
  { key: 'sales', label: 'Sales', Icon: Trophy, kleur: '#FFD700', stat: 'Sales', stage: 'sale' },
  { key: 'order', label: 'Orderwaarde', Icon: Euro, kleur: '#FFD700', stat: 'Orderwaarde', stage: 'sale', euro: true },
  { key: 'binnen', label: 'Binnengekomen', Icon: Wallet, kleur: '#22c55e', stat: 'Binnengekomen', euro: true },
  { key: 'noshow', label: 'No-shows', Icon: UserX, kleur: ROOD, stat: 'No-shows', stage: 'noShow', omgekeerd: true },
  { key: 'afgewezen', label: 'Afgewezen', Icon: PhoneOff, kleur: '#f97316', stat: 'Afgewezen', stage: 'callRejected', omgekeerd: true },
  { key: 'verloren', label: 'Sale verloren', Icon: XCircle, kleur: ROOD, stat: 'Sale verloren', stage: 'saleLost', omgekeerd: true },
  { key: 'naarCall', label: 'Voorstel → ingepland', Icon: Percent, kleur: '#fff', deel: ['ingepland', 'voorgesteld'], stap: true },
  { key: 'showUp', label: 'Gepland → gevoerd', Icon: Percent, kleur: '#fff', deel: ['gevoerd', 'gepland'], stap: true },
  { key: 'close', label: 'Gevoerd → sale', Icon: Percent, kleur: '#fff', deel: ['sales', 'gevoerd'], stap: true },
]

const isoLokaal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const maandagVan = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const weekNr = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7)
}
const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')

// Volle weken veranderen niet meer; de lopende week halen we elke keer vers op.
const cache = new Map()

async function haalWeek(svc, coachId, van) {
  const sleutel = `${coachId}|${isoLokaal(van)}`
  if (cache.has(sleutel)) return cache.get(sleutel)
  const tot = new Date(van); tot.setDate(tot.getDate() + 7)
  const s = van.toISOString(), e = tot.toISOString()
  const [act, fun, rx, cash, media] = await Promise.all([
    svc.getRangeActivity(coachId, s, e),
    svc.getRangeFunnelStats(coachId, s, e),
    svc.getRangeReactionStats(coachId, s, e),
    svc.getRangeCashCollected(coachId, s, e),
    supabase.from('content_ig_media').select('id, tijd, soort, woord, views, comments, tekst').gte('dag', isoLokaal(van)).lt('dag', isoLokaal(tot)).limit(1000).then(r => r, () => ({ data: null })),
  ])
  const waarden = {}
  const ctx = { act, fun, rx, cash }
  const m = media?.data
  const magnets = m?.filter(p => p.soort === 'magnet') || []
  const som = (l, k) => l.reduce((t, p) => t + (Number(p[k]) || 0), 0)
  const inhoud = m && { posts: m.length, magnets: magnets.length, views: som(m, 'views'), comments: som(m, 'comments'), viewsMagnet: magnets.length ? Math.round(som(magnets, 'views') / magnets.length) : null }
  for (const r of RIJEN) {
    if (r.content) waarden[r.key] = inhoud ? r.content(inhoud) : null
    else if (r.stat) waarden[r.key] = STAT_REEKS[r.stat][1](ctx)
  }
  for (const r of RIJEN) {
    if (r.deel) waarden[r.key] = waarden[r.deel[1]] > 0 ? Math.round((waarden[r.deel[0]] / waarden[r.deel[1]]) * 100) : null
  }
  const week = { waarden, posts: m || [], fun }
  if (tot <= new Date()) cache.set(sleutel, week)
  return week
}

const postTijd = (t) => new Date(t).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Detail({ open, onSluit, isMobile }) {
  const { rij, kolom, week } = open
  const metaStijl = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }
  const regel = { padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }
  const posts = rij.lijst
    ? week.posts.filter(rij.lijst.filter || (() => true)).sort((a, b) => (
      rij.lijst.sorteer === 'tijd' ? new Date(b.tijd) - new Date(a.tijd) : (b[rij.lijst.sorteer] || 0) - (a[rij.lijst.sorteer] || 0)))
    : null
  const leads = rij.stage ? (week.fun?.[rij.stage]?.leads || []) : null
  const aantal = posts ? posts.length : leads.length
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 'min(430px, 100%)', zIndex: 5,
      display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 14, padding: '12px 14px', animation: 'gk-blad .2s ease-out both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 900, color: '#fff' }}>
          {rij.label} · {kolom.label} <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>({aantal})</span>
        </div>
        <button type="button" onClick={onSluit} aria-label="Sluiten" style={{
          width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff',
        }}><X size={15} strokeWidth={2.6} /></button>
      </div>
      <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {aantal === 0 && <div style={{ ...metaStijl, padding: '8px 0' }}>Niets in deze week.</div>}
        {posts?.map(p => (
          <div key={p.id} style={regel}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(p.tekst || '').trim() || (p.soort === 'story' ? 'Story' : 'Geen tekst')}
            </div>
            <div style={metaStijl}>
              {postTijd(p.tijd)} · {p.woord || p.soort}
              {p.views != null && ` · ${Number(p.views).toLocaleString('nl-NL')} views`}
              {p.comments != null && ` · ${p.comments} comments`}
            </div>
          </div>
        ))}
        {leads?.map((l, i) => (
          <div key={l.id || `${l.leadId}-${i}`} style={regel}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{l.name}</div>
            {(l.at || l.time || l.reason) && (
              <div style={metaStijl}>
                {[l.at || l.time ? new Date(l.at || l.time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : null, l.reason].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const toon = (r, v) => {
  if (v == null) return '—'
  if (r.euro) return `€${Number(v).toLocaleString('nl-NL')}`
  if (r.deel) return `${v}%`
  return Number(v).toLocaleString('nl-NL')
}

// De som van een rij over een stuk weken: percentages over de totalen, de rest per week.
function gemiddelde(r, weken) {
  if (r.deel) {
    const a = weken.reduce((t, w) => t + (w.waarden[r.deel[0]] || 0), 0)
    const b = weken.reduce((t, w) => t + (w.waarden[r.deel[1]] || 0), 0)
    return b > 0 ? (a / b) * 100 : null
  }
  const metWaarde = weken.filter(w => w.waarden[r.key] != null)
  return metWaarde.length ? metWaarde.reduce((t, w) => t + w.waarden[r.key], 0) / metWaarde.length : null
}

// Laatste 3 volle weken tegen de 4 weken daarvoor.
function conclusie(volle) {
  if (volle.length < 5) return null
  const nu = volle.slice(0, 3), toen = volle.slice(3, 7)
  const verschil = (r) => {
    const a = gemiddelde(r, toen), b = gemiddelde(r, nu)
    return a > 0 && b != null ? { r, oud: a, nieuw: b, pct: Math.round(((b - a) / a) * 100) } : null
  }
  const stappen = RIJEN.filter(r => r.stap).map(verschil).filter(Boolean).sort((x, y) => x.pct - y.pct)
  const grootste = stappen[0]
  if (!grootste || grootste.pct >= 0) return { tekst: 'Geen stap in de keten is gedaald tegenover de 4 weken daarvoor.' }
  const rij = (k) => RIJEN.find(r => r.key === k)
  const close = verschil(rij('close'))
  const calls = verschil(rij('gevoerd'))
  const sales = gemiddelde(rij('sales'), nu), order = gemiddelde(rij('order'), nu)
  // Wat de gemiste calls kosten: tegen de close en orderwaarde van nu.
  const extra = calls && calls.pct < 0 && close && sales > 0
    ? Math.round((calls.oud - calls.nieuw) * (close.nieuw / 100) * (order / sales) / 10) * 10
    : null
  return {
    daling: stappen.filter(s => s.pct <= -15).slice(0, 3),
    close,
    extra,
  }
}

export default function GinoKeten({ isMobile }) {
  const kolommen = useMemo(() => {
    const m = maandagVan(new Date())
    return Array.from({ length: WEKEN }, (_, i) => {
      const van = new Date(m); van.setDate(van.getDate() - i * 7)
      return { id: isoLokaal(van), van, label: `WK ${weekNr(van)}`, subKort: kort(van), loopt: i === 0 }
    })
  }, [])
  const [perWeek, setPerWeek] = useState({})
  const [fout, setFout] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let weg = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) throw new Error('Niet ingelogd')
        const svc = new LeadManagementService()
        // Twee weken tegelijk, nieuwste eerst: spaart de database en je ziet meteen iets.
        for (let i = 0; i < kolommen.length && !weg; i += 2) {
          await Promise.all(kolommen.slice(i, i + 2).map(async (k) => {
            const week = await haalWeek(svc, user.id, k.van)
            if (!weg) setPerWeek(o => ({ ...o, [k.id]: week }))
          }))
        }
      } catch (e) {
        if (!weg) setFout(e.message || 'Laden mislukt')
      }
    })()
    return () => { weg = true }
  }, [kolommen])

  const volle = kolommen.filter(k => !k.loopt && perWeek[k.id]).map(k => ({ ...k, waarden: perWeek[k.id].waarden }))
  const klaar = kolommen.every(k => perWeek[k.id])
  const zin = klaar ? conclusie(volle) : null

  const kleurVan = (r, v, gem, loopt) => {
    if (loopt || v == null || !(gem > 0)) return '#fff'
    const d = (v - gem) / gem
    const slechter = Math.max(0, r.omgekeerd ? d : -d)
    return `hsl(${Math.round(GROEN_TINT * (1 - Math.min(1, slechter / ROOD_BIJ)))}, 80%, 52%)`
  }

  const NAAM_B = isMobile ? 150 : 170
  const kolLijn = (i) => (i % 2 === 0 ? { borderLeft: '1.5px solid #fff', borderRight: '1.5px solid #fff' } : {})
  const kop = { padding: '0 8px 6px 10px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 68 }
  const cel = {
    padding: '4px 8px 4px 10px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  }
  const plak = { position: 'sticky', left: 0, zIndex: 1, background: '#000' }

  if (fout) return <div style={{ padding: 16, fontSize: 13, fontWeight: 700, color: '#fff' }}>Kon de keten niet laden: {fout}</div>

  return (
    <>
    <style>{`.gk-klik:hover { background: rgba(255,255,255,0.12) !important }`}</style>
    {detail && <Detail open={detail} onSluit={() => setDetail(null)} isMobile={isMobile} />}
    <div className="gk-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
      {zin && (
        <div style={{ padding: '0 0 14px', fontSize: isMobile ? 13 : 14, fontWeight: 800, color: '#fff', lineHeight: 1.45 }}>
          {zin.tekst || (
            <>
              Laatste 3 weken tegen de 4 ervoor:{' '}
              {zin.daling?.length
                ? zin.daling.map((s, i) => <span key={s.r.key}>{i > 0 ? ', ' : ''}{s.r.label.toLowerCase()} <span style={{ color: ROOD }}>{s.pct}%</span></span>)
                : 'geen grote dalingen'}
              {zin.close && <>. Gevoerd → sale van {Math.round(zin.close.oud)}% naar {Math.round(zin.close.nieuw)}%</>}
              {zin.extra > 0 && <>. Evenveel gevoerde calls als eerder is ongeveer <span style={{ color: GROEN }}>€{zin.extra.toLocaleString('nl-NL')} per week</span> meer</>}.
            </>
          )}
        </div>
      )}
      {/* Zo smal als de cijfers toelaten: over de volle breedte lees je een rij niet meer door. */}
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content' }}>
        <thead>
          <tr>
            <th style={{ ...plak, zIndex: 2, width: NAAM_B, minWidth: NAAM_B }} />
            {kolommen.map((k, ki) => (
              <th key={k.id} style={{ ...kop, ...kolLijn(ki) }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{k.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{k.loopt ? 'loopt nog' : k.subKort}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RIJEN.map((r, ri) => {
            // Om de rij een dikke witte lijn boven en onder: zo volg je een rij zonder te verspringen.
            const lijn = ri % 2 === 0 ? { borderTop: '1.5px solid #fff', borderBottom: '1.5px solid #fff' } : {}
            const gem = gemiddelde(r, volle)
            const Icon = r.Icon
            return (
              <tr key={r.key}>
                <td style={{ ...cel, ...lijn, ...plak, padding: '4px 8px 4px 0', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={15} strokeWidth={2.4} color={r.kleur} style={{ flexShrink: 0 }} />
                    {r.label}
                  </span>
                </td>
                {kolommen.map((k, ki) => {
                  const week = perWeek[k.id]
                  const v = week ? week.waarden[r.key] : undefined
                  const klikbaar = !!week && (r.lijst || r.stage)
                  const actief = detail?.rij.key === r.key && detail?.kolom.id === k.id
                  return (
                    <td key={k.id} style={{ ...cel, ...lijn, ...kolLijn(ki), color: week ? kleurVan(r, v, gem, k.loopt) : 'rgba(255,255,255,0.3)' }}>
                      {klikbaar ? (
                        <button type="button" className="gk-klik" onClick={() => setDetail(actief ? null : { rij: r, kolom: k, week })} style={{
                          background: actief ? 'rgba(255,255,255,0.16)' : 'transparent', border: 'none', borderRadius: 5, padding: '0 4px', margin: '0 -4px',
                          color: 'inherit', font: 'inherit', cursor: 'pointer',
                        }}>{toon(r, v)}</button>
                      ) : week ? toon(r, v) : '…'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
