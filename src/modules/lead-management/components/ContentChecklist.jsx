// src/modules/lead-management/components/ContentChecklist.jsx
// Dagelijkse content-checklist (reel, foto, stories, magnets) voor het team.
// Ring in de leadbalk loopt vol met wat er vandaag gedaan is; tik opent de
// maandtabel. Kersten en Marcel vullen dezelfde lijst in: alles hangt aan de
// team-eigenaar (content_eigenaar()), RLS regelt de rest.
// Tabellen: content_checklist (dag, soort, aantal) + content_doelen (soort, doel).
// Schakelaar Zelf / Metricool: Metricool vult reels, foto's en stories per dag
// uit content_metricool (plus bereik en nieuwe volgers). Reels worden per post
// gesplitst (content_metricool_posts): staat er Reageer "WOORD" in de caption,
// dan is het een magnet, anders een gewone reel.
// Outreach en follow-ups komen uit het leadbord (RPC content_lead_stats):
// de rij met doel = outreach die dag (campagne-DM en DM-knop), eronder ter
// info de follow-ups (kale +1 op de kaart). Bron: lead_followup_events.soort.
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clapperboard, Image, Circle, Magnet, Check, Youtube, Send } from 'lucide-react'
import { Venster, VensterKop } from '../../../components/arc-ui'

const SOORTEN = [
  { id: 'reel', label: 'Reel', Icon: Clapperboard, kleur: '#ef4444', doel: 1 },
  { id: 'foto', label: 'Foto', Icon: Image, kleur: '#3b82f6', doel: 1 },
  { id: 'story', label: 'Stories', Icon: Circle, kleur: '#E1306C', doel: 3 },
  { id: 'magnet', label: 'Magnets', Icon: Magnet, kleur: '#a855f7', doel: 8 },
  // Weekdoel: je vinkt de dag aan waarop hij online ging; de hele week kleurt
  // mee zodra het doel gehaald is. Telt niet mee in de dagring. Metricool
  // ziet geen verschil tussen shorts en een lange video, dus altijd zelf.
  { id: 'youtube', label: 'YouTube', Icon: Youtube, kleur: '#ff0033', doel: 1, week: true },
  // Automatisch uit het leadbord, niet aan te tikken.
  { id: 'outreach', label: 'Outreach', Icon: Send, kleur: '#f59e0b', doel: 100, auto: true },
]
const maandagVan = (dag) => { const d = new Date(dag + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dagStr(d) }
const weekDagen = (dag) => { const m = new Date(maandagVan(dag) + 'T12:00:00'); return Array.from({ length: 7 }, (_, i) => { const d = new Date(m); d.setDate(m.getDate() + i); return dagStr(d) }) }
const weekSom = (dag, soort, telling) => weekDagen(dag).reduce((t, d) => t + (telling[sleutel(d, soort)] || 0), 0)
const GROEN = '#10b981'

const dagStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sleutel = (dag, soort) => `${dag}|${soort}`
const MC_KOLOM = { reel: 'reels', foto: 'fotos', story: 'stories' }
const kort = (n) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k` : String(n)

// Hoeveel procent van de doelen op één dag gehaald is (teveel telt niet mee).
function dagScore(dag, telling, doelen) {
  let klaar = 0, totaal = 0
  for (const s of SOORTEN) {
    const doel = doelen[s.id] ?? s.doel
    if (!doel || s.week) continue
    totaal += doel
    klaar += Math.min(telling[sleutel(dag, s.id)] || 0, doel)
  }
  return totaal ? klaar / totaal : 0
}

function Ring({ deel, grootte = 26, dikte = 3.5, children }) {
  const r = (grootte - dikte) / 2
  const omtrek = 2 * Math.PI * r
  const vol = deel >= 1
  return (
    <div style={{ position: 'relative', width: grootte, height: grootte, flexShrink: 0 }}>
      <svg width={grootte} height={grootte} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={grootte / 2} cy={grootte / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={dikte} />
        <circle cx={grootte / 2} cy={grootte / 2} r={r} fill="none" stroke={vol ? GROEN : '#fff'} strokeWidth={dikte}
          strokeLinecap="round" strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - Math.min(deel, 1))}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}

function useContent(supabase, maand) {
  const [eigenaar, setEigenaar] = useState(null)
  const [telling, setTelling] = useState({})
  const [doelen, setDoelen] = useState({})
  const [mc, setMc] = useState({}) // dag -> rij uit content_metricool
  const [posts, setPosts] = useState({}) // dag -> reels uit content_metricool_posts
  const [leads, setLeads] = useState({}) // dag -> { outreach, followups, nieuwe_leads }

  const laad = useCallback(async () => {
    if (!supabase) return
    // Hele weken eromheen, zodat een weekdoel over de maandgrens klopt.
    const van = maandagVan(dagStr(new Date(maand.getFullYear(), maand.getMonth(), 1)))
    const tot = weekDagen(dagStr(new Date(maand.getFullYear(), maand.getMonth() + 1, 0)))[6]
    const [e, c, d, m, p, l] = await Promise.all([
      supabase.rpc('content_eigenaar'),
      supabase.from('content_checklist').select('dag, soort, aantal').gte('dag', van).lte('dag', tot),
      supabase.from('content_doelen').select('soort, doel'),
      supabase.from('content_metricool').select('dag, reels, fotos, stories, bereik, nieuwe_volgers, updated_at').gte('dag', van).lte('dag', tot),
      supabase.from('content_metricool_posts').select('tijd, dag, soort, woord, views, tekst').gte('dag', van).lte('dag', tot).order('tijd'),
      supabase.rpc('content_lead_stats', { van, tot }),
    ])
    const ll = {}
    for (const r of l.data || []) ll[r.dag] = r
    setLeads(ll)
    const pp = {}
    for (const r of p.data || []) (pp[r.dag] ||= []).push(r)
    setPosts(pp)
    const mm = {}
    for (const r of m.data || []) mm[r.dag] = r
    setMc(mm)
    if (e.data) setEigenaar(e.data)
    const t = {}
    for (const r of c.data || []) t[sleutel(r.dag, r.soort)] = r.aantal
    setTelling(t)
    const dl = {}
    for (const r of d.data || []) dl[r.soort] = r.doel
    setDoelen(dl)
  }, [supabase, maand])

  useEffect(() => {
    laad()
    const opnieuw = () => { if (document.visibilityState === 'visible') laad() }
    document.addEventListener('visibilitychange', opnieuw)
    const id = setInterval(laad, 120000)
    return () => { document.removeEventListener('visibilitychange', opnieuw); clearInterval(id) }
  }, [laad])

  const zetAantal = async (dag, soort, aantal) => {
    const k = sleutel(dag, soort)
    const oud = telling[k] || 0
    setTelling(t => ({ ...t, [k]: aantal }))
    const q = aantal > 0
      ? supabase.from('content_checklist').upsert({ eigenaar, dag, soort, aantal, updated_at: new Date().toISOString() }, { onConflict: 'eigenaar,dag,soort' })
      : supabase.from('content_checklist').delete().eq('eigenaar', eigenaar).eq('dag', dag).eq('soort', soort)
    const { error } = await q
    if (error) { console.error('content_checklist', error); setTelling(t => ({ ...t, [k]: oud })) }
  }

  const zetDoel = async (soort, doel) => {
    const oud = doelen[soort]
    setDoelen(d => ({ ...d, [soort]: doel }))
    const { error } = await supabase.from('content_doelen')
      .upsert({ eigenaar, soort, doel, updated_at: new Date().toISOString() }, { onConflict: 'eigenaar,soort' })
    if (error) { console.error('content_doelen', error); setDoelen(d => ({ ...d, [soort]: oud })) }
  }

  // Outreach staat in beide standen, uit het leadbord.
  const zelf = { ...telling }
  for (const [dag, r] of Object.entries(leads)) if (r.outreach) zelf[sleutel(dag, 'outreach')] = r.outreach

  // Metricool-telling: reels/foto's/stories uit Metricool, magnets zelf.
  const mcTelling = {}
  for (const [dag, r] of Object.entries(mc)) {
    for (const [soort, kol] of Object.entries(MC_KOLOM)) if (r[kol]) mcTelling[sleutel(dag, soort)] = r[kol]
  }
  // Per post gesplitst: gewone reels en magnets. Dagen zonder postdata houden
  // het dagtotaal als reels en de zelf ingevulde magnets.
  for (const [k, v] of Object.entries(zelf)) if (/\|(magnet|youtube|outreach)$/.test(k)) mcTelling[k] = v
  for (const [dag, lijst] of Object.entries(posts)) {
    mcTelling[sleutel(dag, 'reel')] = lijst.filter(x => x.soort === 'reel').length
    mcTelling[sleutel(dag, 'magnet')] = lijst.filter(x => x.soort === 'magnet').length
  }
  // Voor de ring: per vakje het hoogste van zelf en Metricool.
  const samen = { ...mcTelling }
  for (const [k, v] of Object.entries(zelf)) samen[k] = Math.max(v, samen[k] || 0)

  return { eigenaar, telling: zelf, mcTelling, samen, mc, posts, leads, doelen, zetAantal, zetDoel, laad }
}

// Knop voor in de leadbalk: ring van vandaag, opent de maandtabel.
export default function ContentChecklist({ supabase, isMobile }) {
  const [open, setOpen] = useState(false)
  const [maand, setMaand] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const data = useContent(supabase, maand)
  const vandaag = dagStr(new Date())
  const ditMaand = maand.getMonth() === new Date().getMonth() && maand.getFullYear() === new Date().getFullYear()
  // De ring toont vandaag. Bladert de tabel naar een andere maand, dan staat
  // vandaag niet in de geladen data; openen zet de maand terug.
  const score = ditMaand ? dagScore(vandaag, data.samen, data.doelen) : 0

  return (
    <>
      <button onClick={() => { setMaand(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) }); setOpen(true) }}
        title={`Content vandaag: ${Math.round(score * 100)}%`}
        style={{
          width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
        <Ring deel={score} grootte={24} dikte={3.2}>
          {score >= 1 && <Check size={11} strokeWidth={3.5} color={GROEN} />}
        </Ring>
      </button>
      {open && <ContentVenster {...data} maand={maand} setMaand={setMaand} vandaag={vandaag} isMobile={isMobile} onClose={() => setOpen(false)} />}
    </>
  )
}

function ContentVenster({ telling: zelf, mcTelling, mc, posts, leads, doelen, zetAantal, zetDoel, eigenaar, maand, setMaand, vandaag, isMobile, onClose }) {
  const [doelBewerk, setDoelBewerk] = useState(null) // soort-id
  const [modus, setModus] = useState(() => { try { return localStorage.getItem('content_modus') || 'zelf' } catch { return 'zelf' } })
  const kiesModus = (m) => { setModus(m); try { localStorage.setItem('content_modus', m) } catch { /* geen opslag */ } }
  const isMc = modus === 'mc'
  const [detailDag, setDetailDag] = useState(null)
  const telling = isMc ? mcTelling : zelf
  const laatst = Object.values(mc).reduce((t, r) => (r.updated_at > t ? r.updated_at : t), '')
  const aantalDagen = new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate()
  const dagen = Array.from({ length: aantalDagen }, (_, i) => dagStr(new Date(maand.getFullYear(), maand.getMonth(), i + 1)))
  // Tot en met vandaag tellen voor het maandpercentage; toekomst telt niet.
  const verstreken = dagen.filter(d => d <= vandaag)
  const maandScore = verstreken.length ? verstreken.reduce((t, d) => t + dagScore(d, telling, doelen), 0) / verstreken.length : 0
  const scoreVandaag = dagScore(vandaag, telling, doelen)
  const cel = isMobile ? 34 : 36

  // Tik = één erbij; bij het doel weer naar nul.
  const tik = (dag, s) => {
    if (s.auto) return
    if (isMc && !s.week) { setDetailDag(dag === detailDag ? null : dag); return }
    if (!eigenaar) return
    const doel = doelen[s.id] ?? s.doel
    const nu = zelf[sleutel(dag, s.id)] || 0
    if (s.week) { zetAantal(dag, s.id, nu > 0 ? 0 : 1); return }
    zetAantal(dag, s.id, nu >= Math.max(doel, 1) ? 0 : nu + 1)
  }

  const maandNaam = maand.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  const pijl = { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex', touchAction: 'manipulation' }

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={1100}>
      <VensterKop isMobile={isMobile} titel="Content" onClose={onClose}
        sub={isMc
          ? `Uit Metricool${laatst ? `, bijgewerkt ${new Date(laatst).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''} · tik een dag voor de posts`
          : 'Tik een vakje: één erbij, bij het doel weer leeg'}
        rechts={
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: 2, flexShrink: 0 }}>
            {[{ id: 'zelf', label: 'Zelf' }, { id: 'mc', label: 'Metricool' }].map(o => (
              <button key={o.id} onClick={() => kiesModus(o.id)} style={{
                border: 'none', borderRadius: 7, padding: '0.35rem 0.7rem', fontFamily: 'inherit',
                fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation',
                background: modus === o.id ? '#fff' : 'transparent', color: modus === o.id ? '#000' : 'rgba(255,255,255,0.6)',
              }}>{o.label}</button>
            ))}
          </div>
        } />
      <div style={{ overflowY: 'auto', padding: isMobile ? '1rem' : '1.15rem' }}>
        {/* Vandaag + maand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 18 : 28, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ring deel={scoreVandaag} grootte={52} dikte={5}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{Math.round(scoreVandaag * 100)}%</span>
            </Ring>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>Vandaag</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                {SOORTEN.map(s => s.week
                  ? `${weekSom(vandaag, s.id, telling)}/${doelen[s.id] ?? s.doel} ${s.label} deze week`
                  : `${telling[sleutel(vandaag, s.id)] || 0}/${doelen[s.id] ?? s.doel} ${s.label.toLowerCase()}`).join(' · ')}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
              <button style={pijl} onClick={() => setMaand(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft size={18} strokeWidth={3} /></button>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize', minWidth: isMobile ? 0 : 120, textAlign: 'center' }}>{maandNaam}</span>
              <button style={pijl} onClick={() => setMaand(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight size={18} strokeWidth={3} /></button>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{Math.round(maandScore * 100)}% van de doelen gehaald</div>
            {SOORTEN.filter(s => s.week).map(s => {
              // Weken van deze maand die al begonnen zijn.
              const weken = [...new Set(verstreken.map(maandagVan))]
              const gehaald = weken.filter(m => weekSom(m, s.id, telling) >= (doelen[s.id] ?? s.doel)).length
              return <div key={s.id} style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{s.label}: {gehaald} van {weken.length} weken</div>
            })}
          </div>
        </div>

        {/* Maandtabel: soorten links (vast), dagen horizontaal scrollbaar */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0a0a0a' }} />
                {dagen.map(d => {
                  const n = new Date(d + 'T12:00:00')
                  const isVandaag = d === vandaag
                  return (
                    <th key={d} style={{ width: cel, minWidth: cel, fontSize: '0.62rem', fontWeight: 800, color: isVandaag ? '#fff' : 'rgba(255,255,255,0.4)', textAlign: 'center', paddingBottom: 2 }}>
                      <div>{n.toLocaleDateString('nl-NL', { weekday: 'narrow' })}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 900, ...(isVandaag ? { textDecoration: 'underline', textUnderlineOffset: 3 } : {}) }}>{n.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {SOORTEN.map(s => {
                const doel = doelen[s.id] ?? s.doel
                return (
                  <tr key={s.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0a0a0a', paddingRight: 8, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <s.Icon size={14} strokeWidth={2.6} color={s.kleur} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>{s.label}</span>
                        {doelBewerk === s.id ? (
                          <input type="number" inputMode="numeric" min={0} max={500} autoFocus defaultValue={doel}
                            onBlur={(e) => { const v = Math.max(0, Math.min(500, parseInt(e.target.value, 10) || 0)); if (v !== doel) zetDoel(s.id, v); setDoelBewerk(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setDoelBewerk(null) }}
                            style={{ width: 42, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: '0.78rem', fontWeight: 800, padding: '2px 4px', fontFamily: 'inherit', outline: 'none' }} />
                        ) : (
                          <button onClick={() => setDoelBewerk(s.id)} title="Doel per dag aanpassen"
                            style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                            doel {doel}{s.week ? ' p/w' : ''}
                          </button>
                        )}
                      </div>
                    </td>
                    {dagen.map(d => {
                      const n = telling[sleutel(d, s.id)] || 0
                      const klaar = doel > 0 && n >= doel
                      const deels = n > 0 && !klaar
                      const vast = s.auto || (isMc && !s.week)
                      // Weekdoel: de dag zelf groen, de rest van een gehaalde week licht.
                      const weekKlaar = s.week && doel > 0 && weekSom(d, s.id, telling) >= doel
                      return (
                        <td key={d} style={{ padding: 0 }}>
                          <button onClick={() => tik(d, s)} disabled={s.auto || (!eigenaar && !vast)}
                            style={{
                              width: cel, height: cel, borderRadius: 8, padding: 0, fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: s.week ? (n > 0 ? GROEN : weekKlaar ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)')
                                : klaar ? GROEN : deels ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.04)',
                              border: d === vandaag ? '1.5px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.07)',
                              color: '#fff', fontSize: '0.72rem', fontWeight: 900, cursor: s.auto ? 'default' : 'pointer',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}>
                            {vast ? (n || '') : s.week ? (n > 0 ? <Check size={15} strokeWidth={3.5} /> : '') : klaar ? <Check size={15} strokeWidth={3.5} /> : deels ? `${n}/${doel}` : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {/* Follow-ups uit het leadbord, ter info (geen doel) */}
              <tr>
                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0a0a0a', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', paddingRight: 8 }}>Follow-ups</td>
                {dagen.map(d => {
                  const v = leads[d]?.followups
                  return (
                    <td key={d} style={{ textAlign: 'center', fontSize: '0.66rem', fontWeight: 800, color: v ? '#fff' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums', padding: '4px 0' }}>
                      {v || '·'}
                    </td>
                  )
                })}
              </tr>
              {/* Metricool: bereik en nieuwe volgers per dag */}
              {isMc && [{ k: 'bereik', label: 'Bereik', f: kort }, { k: 'nieuwe_volgers', label: 'Nieuwe volgers', f: (n) => `+${n}` }].map(r => (
                <tr key={r.k}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0a0a0a', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', paddingRight: 8 }}>{r.label}</td>
                  {dagen.map(d => {
                    const v = mc[d]?.[r.k]
                    return (
                      <td key={d} style={{ textAlign: 'center', fontSize: '0.66rem', fontWeight: 800, color: v ? '#fff' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums', padding: '4px 0' }}>
                        {v ? r.f(v) : '·'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Dagscore als klein ringetje onder elke dag */}
              <tr>
                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#0a0a0a', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>Dag</td>
                {dagen.map(d => (
                  <td key={d} style={{ padding: '4px 0 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', opacity: d > vandaag ? 0.3 : 1 }}>
                      <Ring deel={dagScore(d, telling, doelen)} grootte={20} dikte={3} />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {isMc && detailDag && <DagPosts dag={detailDag} lijst={posts[detailDag] || []} />}
        {isMc && <PerWoord posts={posts} />}
      </div>
    </Venster>
  )
}

const tijdVan = (t) => String(t).slice(11, 16)

// De reels van één dag: tijd, magnet-woord of begin van de tekst, views.
function DagPosts({ dag, lijst }) {
  const titel = new Date(dag + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: 6, textTransform: 'capitalize' }}>{titel}</div>
      {lijst.length === 0 && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen reels per post bekend voor deze dag.</div>}
      {lijst.map(p => (
        <div key={p.tijd} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{tijdVan(p.tijd)}</span>
          {p.soort === 'magnet'
            ? <Magnet size={13} strokeWidth={2.6} color="#a855f7" />
            : <Clapperboard size={13} strokeWidth={2.6} color="#ef4444" />}
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.soort === 'magnet' ? p.woord : (p.tekst || 'Reel')}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{kort(p.views || 0)} views</span>
        </div>
      ))}
    </div>
  )
}

// Welke magnet-woorden deze maand draaien: aantal posts en gemiddelde views.
function PerWoord({ posts }) {
  const per = {}
  for (const lijst of Object.values(posts)) for (const p of lijst) {
    if (p.soort !== 'magnet' || !p.woord) continue
    const w = (per[p.woord] ||= { woord: p.woord, n: 0, views: 0 })
    w.n += 1; w.views += p.views || 0
  }
  const rijen = Object.values(per).sort((a, b) => b.views / b.n - a.views / a.n)
  if (!rijen.length) return null
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: 6 }}>Magnets per woord</div>
      {rijen.map(r => (
        <div key={r.woord} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Magnet size={13} strokeWidth={2.6} color="#a855f7" />
          <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{r.woord}</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{r.n} posts</span>
          <span style={{ minWidth: 92, textAlign: 'right', fontSize: '0.84rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{kort(Math.round(r.views / r.n))} gem. views</span>
        </div>
      ))}
    </div>
  )
}
