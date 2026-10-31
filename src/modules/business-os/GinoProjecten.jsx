// src/modules/business-os/GinoProjecten.jsx
//
// Projecten van Gino (31 okt 2026), in het paneel boven de bol. Gino maakt een
// project aan (pa-db project-nieuw), onderzoekt in een aparte Slim-ronde op de
// Mac (eigen data + web) en schrijft een plan: fases met stappen per dag en
// KPI's met nulmeting (business_os_projecten). Hier:
//   lijst  → kaarten met voortgangsring en volgende stap
//   detail → KPI's, fases als tijdlijn met afvinkbare stappen, onderzoek lezen
//   "Plan goedkeuren & inplannen" → content-stappen als content_items
//     (planned), de rest als productivity_tasks; status uitvoering.

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Check, Film, CheckCircle2, Phone, BookOpen, Sparkles, FileText, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const STATUS = { onderzoek: 'Gino onderzoekt', plan: 'Plan klaar', uitvoering: 'Loopt', klaar: 'Klaar', gestopt: 'Gestopt' }
const SOORT_ICOON = { content: Film, taak: CheckCircle2, call: Phone, leren: BookOpen }
const vandaagIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const kortDag = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : '')
const stappenVan = (p) => (p?.plan?.fases || []).flatMap(f => f.stappen || [])

function Ring({ deel, grootte = 40, dikte = 3, kind }) {
  const r = grootte / 2 - dikte, omtrek = 2 * Math.PI * r, c = grootte / 2
  const vol = Math.max(0, Math.min(1, deel || 0))
  return (
    <div style={{ position: 'relative', width: grootte, height: grootte, flexShrink: 0 }}>
      <svg width={grootte} height={grootte} style={{ overflow: 'visible' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={dikte} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={G} strokeWidth={dikte} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
          strokeDasharray={omtrek} style={{ '--gp-tot': omtrek * (1 - vol), strokeDashoffset: omtrek * (1 - vol), animation: 'gp-ring 1s ease-out both', filter: vol > 0 ? `drop-shadow(0 0 4px ${G})` : 'none' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kind}</div>
    </div>
  )
}

// Onderzoek in markdown → eenvoudige opmaak (kopjes, pijltjes, vet).
function Onderzoek({ tekst }) {
  return (
    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
      {String(tekst || '').split('\n').map((r, i) => {
        const kop = r.match(/^#{1,4}\s*(.*)/)
        if (kop) return <div key={i} style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '14px 0 4px' }}>{kop[1]}</div>
        if (!r.trim()) return <div key={i} style={{ height: 6 }} />
        const delen = r.replace(/^\s*[-*]\s+/, '→ ').split(/\*\*(.+?)\*\*/g)
        return <div key={i}>{delen.map((d, j) => (j % 2 ? <b key={j} style={{ color: '#fff' }}>{d}</b> : d))}</div>
      })}
    </div>
  )
}

export default function GinoProjecten({ projectId = null, onKies, onVraag, isMobile = false }) {
  const [lijst, setLijst] = useState(null)
  const [leest, setLeest] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)

  const laad = useCallback(async () => {
    const { data } = await supabase.from('business_os_projecten').select('*').order('updated_at', { ascending: false }).limit(30)
      .then(r => r, () => ({ data: null }))
    if (data) setLijst(data)
  }, [])
  useEffect(() => { laad() }, [laad])
  // Loopt er onderzoek, dan elke 15 s kijken of het plan er al is.
  const wacht = (lijst || []).some(p => p.status === 'onderzoek')
  useEffect(() => {
    if (!wacht) return
    const t = setInterval(laad, 15000)
    return () => clearInterval(t)
  }, [wacht, laad])

  const p = projectId ? (lijst || []).find(x => x.id === projectId) : null
  const vandaag = vandaagIso()

  const zetStap = async (stapId, klaar) => {
    if (!p) return
    const plan = JSON.parse(JSON.stringify(p.plan || {}))
    for (const f of plan.fases || []) for (const s of f.stappen || []) if (s.id === stapId) s.klaar = klaar
    setLijst(l => l.map(x => (x.id === p.id ? { ...x, plan } : x)))
    await supabase.from('business_os_projecten').update({ plan, updated_at: new Date().toISOString() }).eq('id', p.id).then(r => r, () => null)
  }

  const inplannen = async () => {
    if (!p) return
    setBezig(true)
    setMelding(null)
    const { data: { user } } = await supabase.auth.getUser()
    const plan = JSON.parse(JSON.stringify(p.plan || {}))
    let gepland = 0, mis = 0
    for (const f of plan.fases || []) {
      for (const s of f.stappen || []) {
        if (s.gepland_id || s.klaar || !/^\d{4}-\d{2}-\d{2}$/.test(s.dag || '')) continue
        const res = s.soort === 'content'
          ? await supabase.from('content_items').insert({
            coach_id: user.id, title: String(s.titel).slice(0, 200), hook: s.hook || null,
            type: ['reel', 'story', 'post', 'carousel', 'video'].includes(s.type) ? s.type : 'reel',
            status: 'planned', planned_date: s.dag, notes: `Project: ${p.titel}`,
          }).select('id').single().then(r => r, e => ({ error: e }))
          : await supabase.from('productivity_tasks').insert({
            coach_id: user.id, title: String(s.titel).slice(0, 200), description: s.uitleg || `Project: ${p.titel}`,
            scheduled_date: s.dag, category: 'project', status: 'active',
          }).select('id').single().then(r => r, e => ({ error: e }))
        if (res.error) { mis++; continue }
        s.gepland_id = res.data.id
        gepland++
      }
    }
    const { error } = await supabase.from('business_os_projecten')
      .update({ plan, status: 'uitvoering', updated_at: new Date().toISOString() }).eq('id', p.id).then(r => r, e => ({ error: e }))
    setBezig(false)
    setMelding(error ? 'Opslaan mislukt' : `${gepland} stappen ingepland${mis ? `, ${mis} mislukt` : ''}`)
    laad()
  }

  const animaties = (
    <style>{`
      @keyframes gp-ring { from { stroke-dashoffset: 200 } to { stroke-dashoffset: var(--gp-tot) } }
      @keyframes gp-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
      @keyframes gp-radar { to { transform: rotate(360deg) } }
      @keyframes gp-puls { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
      .gp-stap { transition: background .15s }
      .gp-stap:hover { background: rgba(255,255,255,0.04) }
      .gp-kaart { transition: box-shadow .2s, transform .2s }
      .gp-kaart:hover { box-shadow: 0 0 0 1px ${G}, 0 0 24px ${G}44; transform: translateY(-2px) }
    `}</style>
  )

  if (lijst === null) return null

  // ── Lijst ──
  if (!p) {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }} className="gk-scroll">
        {animaties}
        {!lijst.length && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)', padding: '24px 0' }}>
            Nog geen projecten. Vraag Gino bijvoorbeeld: "maak een contentstrategie om naar 10k te gaan".
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : 300}px, 1fr))`, gap: 16 }}>
          {lijst.map((x, i) => {
            const st = stappenVan(x)
            const klaar = st.filter(s => s.klaar).length
            const volgende = st.filter(s => !s.klaar && s.dag).sort((a, b) => a.dag.localeCompare(b.dag))[0]
            return (
              <button key={x.id} type="button" className="gp-kaart" onClick={() => onKies?.(x.id)} style={{
                textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', color: '#fff', padding: 16, borderRadius: 14,
                border: `1px solid ${G}33`, background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 14, alignItems: 'center',
                animation: `gp-in .35s ease-out ${i * 60}ms both`, opacity: x.status === 'gestopt' ? 0.5 : 1,
              }}>
                {x.status === 'onderzoek'
                  ? <span style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gp-radar 2.4s linear infinite', flexShrink: 0 }} />
                  : <Ring deel={st.length ? klaar / st.length : 0} kind={<span style={{ fontSize: 10.5, fontWeight: 900 }}>{st.length ? Math.round((klaar / st.length) * 100) : 0}%</span>} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>{x.titel}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: x.status === 'onderzoek' ? G : 'rgba(255,255,255,0.55)', marginTop: 3, animation: x.status === 'onderzoek' ? 'gp-puls 1.6s ease-in-out infinite' : 'none' }}>
                    {STATUS[x.status]}{volgende && x.status === 'uitvoering' ? ` · volgende: ${kortDag(volgende.dag)} ${volgende.titel}` : ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Detail ──
  const fases = p.plan?.fases || []
  const st = stappenVan(p)
  const klaar = st.filter(s => s.klaar).length
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {animaties}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingBottom: 12 }}>
        <button type="button" onClick={() => { setLeest(false); onKies?.(null) }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px 0 8px', borderRadius: 999,
          border: `1px solid ${G}66`, background: `${G}14`, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, flexShrink: 0,
        }}><ChevronLeft size={16} strokeWidth={2.6} /> Projecten</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{p.titel}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.doel}</div>
        </div>
        {st.length > 0 && <Ring deel={klaar / st.length} grootte={44} kind={<span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{klaar}/{st.length}</span>} />}
      </div>

      {p.status === 'onderzoek' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${G}55` }} />
            <span style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: `1px dashed ${G}88`, animation: 'gp-radar 6s linear infinite reverse' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, ${G}55, transparent 25%)`, animation: 'gp-radar 2.4s linear infinite' }} />
            <span style={{ position: 'absolute', inset: 52, borderRadius: '50%', background: G, boxShadow: `0 0 18px ${G}` }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', animation: 'gp-puls 1.8s ease-in-out infinite' }}>Gino onderzoekt je data en het web en schrijft het plan…</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Meestal 5–15 minuten. Je mag dit sluiten.</div>
        </div>
      ) : (
        <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {p.plan?.samenvatting && (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 14, maxWidth: 900 }}>{p.plan.samenvatting}</div>
          )}
          {/* KPI's */}
          {(p.kpis || []).length > 0 && (
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 16 }}>
              {p.kpis.map((k, i) => {
                const nu = Number(k.nu) || 0, doel = Number(k.doel) || 0
                return (
                  <div key={i} title={k.meet || undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `gp-in .35s ease-out ${i * 70}ms both` }}>
                    <Ring deel={doel ? nu / doel : 0} grootte={36} kind={null} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>{k.naam}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                        {nu.toLocaleString('nl-NL')} → <span style={{ color: G }}>{doel.toLocaleString('nl-NL')}</span> {k.eenheid || ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Fases als tijdlijn */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.max(1, fases.length)}, minmax(0, 1fr))`, gap: 14, position: 'relative' }}>
            {!isMobile && <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 1, background: `linear-gradient(90deg, ${G}00, ${G}77, ${G}00)` }} />}
            {fases.map((f, fi) => {
              const nu = f.van && f.tot && vandaag >= f.van && vandaag <= f.tot
              const fk = (f.stappen || []).filter(s => s.klaar).length
              return (
                <div key={fi} style={{ minWidth: 0, animation: `gp-in .4s ease-out ${fi * 90}ms both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${G}`, background: nu ? G : '#000', boxShadow: nu ? `0 0 12px ${G}` : 'none', flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: nu ? G : 'rgba(255,255,255,0.5)' }}>{kortDag(f.van)} – {kortDag(f.tot)}</span>
                  </div>
                  <div style={{
                    borderRadius: 14, padding: 12, border: `1px solid ${nu ? G : `${G}26`}`, background: nu ? `${G}0c` : 'rgba(255,255,255,0.015)',
                    boxShadow: nu ? `0 0 24px ${G}22` : 'none',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{f.naam}</div>
                    {f.doel && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: '2px 0 8px' }}>{f.doel}</div>}
                    <div style={{ fontSize: 11, fontWeight: 800, color: G, marginBottom: 6 }}>{fk}/{(f.stappen || []).length} klaar</div>
                    {(f.stappen || []).map(s => {
                      const Icoon = SOORT_ICOON[s.soort] || CheckCircle2
                      const isNu = s.dag === vandaag
                      const achter = !s.klaar && s.dag && s.dag < vandaag
                      return (
                        <div key={s.id} className="gp-stap" title={[s.hook && `"${s.hook}"`, s.uitleg].filter(Boolean).join('\n') || undefined}
                          style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 4px', borderRadius: 8, background: isNu ? `${G}14` : 'transparent' }}>
                          <button type="button" onClick={() => zetStap(s.id, !s.klaar)} aria-label={s.klaar ? 'Niet klaar' : 'Klaar'} style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, cursor: 'pointer', padding: 0,
                            border: `1.5px solid ${s.klaar ? G : 'rgba(255,255,255,0.35)'}`, background: s.klaar ? G : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
                          }}>{s.klaar && <Check size={12} strokeWidth={3.5} />}</button>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: s.klaar ? 'rgba(255,255,255,0.45)' : '#fff', textDecoration: s.klaar ? 'line-through' : 'none', lineHeight: 1.3 }}>{s.titel}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: achter ? '#f59e0b' : isNu ? G : 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                              <Icoon size={11} strokeWidth={2.6} /> {isNu ? 'vandaag' : kortDag(s.dag)}{s.gepland_id ? ' · ingepland' : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Acties */}
      {p.status !== 'onderzoek' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          {p.status === 'plan' && (
            <button type="button" disabled={bezig} onClick={inplannen} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', borderRadius: 999, border: 'none',
              background: G, color: '#000', fontFamily: 'inherit', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 0 18px ${G}66`,
            }}><Check size={15} strokeWidth={3} /> {bezig ? 'Bezig…' : 'Plan goedkeuren & inplannen'}</button>
          )}
          {p.onderzoek && (
            <button type="button" className="gk-link" onClick={() => setLeest(true)} style={linkStijl}><FileText size={13} /> Onderzoek lezen</button>
          )}
          <button type="button" className="gk-link" style={{ ...linkStijl, color: G, opacity: 1 }}
            onClick={() => onVraag?.(`Laten we het project "${p.titel}" bijsturen. Kijk naar de voortgang en de KPI's en zeg wat je zou veranderen.`)}>
            <Sparkles size={13} /> Bijsturen met Gino
          </button>
          {melding && <span style={{ fontSize: 12.5, fontWeight: 800, color: G }}>{melding}</span>}
        </div>
      )}

      {/* Onderzoek lezen */}
      {leest && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.96)', border: `1px solid ${G}33`, borderRadius: 16,
          padding: isMobile ? 14 : 22, display: 'flex', flexDirection: 'column', animation: 'gp-in .25s ease-out both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#fff' }}>Onderzoek · {p.titel}</div>
            <button type="button" onClick={() => setLeest(false)} aria-label="Sluiten" style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </div>
          <div className="gk-scroll" style={{ flex: 1, overflowY: 'auto', maxWidth: 860 }}><Onderzoek tekst={p.onderzoek} /></div>
        </div>
      )}
    </div>
  )
}

const linkStijl = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 0', border: 'none', background: 'none',
  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'inherit', color: '#fff', opacity: 0.75,
}
