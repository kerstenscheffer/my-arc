// src/modules/lead-management/components/ContentChecklist.jsx
// Dagelijkse content-checklist (reel, foto, stories, magnets) voor het team.
// Ring in de leadbalk loopt vol met wat er vandaag gedaan is; tik opent de
// maandtabel. Kersten en Marcel vullen dezelfde lijst in: alles hangt aan de
// team-eigenaar (content_eigenaar()), RLS regelt de rest.
// Tabellen: content_checklist (dag, soort, aantal) + content_doelen (soort, doel).
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clapperboard, Image, Circle, Magnet, Check } from 'lucide-react'
import { Venster, VensterKop } from '../../../components/arc-ui'

const SOORTEN = [
  { id: 'reel', label: 'Reel', Icon: Clapperboard, kleur: '#ef4444', doel: 1 },
  { id: 'foto', label: 'Foto', Icon: Image, kleur: '#3b82f6', doel: 1 },
  { id: 'story', label: 'Stories', Icon: Circle, kleur: '#E1306C', doel: 3 },
  { id: 'magnet', label: 'Magnets', Icon: Magnet, kleur: '#a855f7', doel: 8 },
]
const GROEN = '#10b981'

const dagStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sleutel = (dag, soort) => `${dag}|${soort}`

// Hoeveel procent van de doelen op één dag gehaald is (teveel telt niet mee).
function dagScore(dag, telling, doelen) {
  let klaar = 0, totaal = 0
  for (const s of SOORTEN) {
    const doel = doelen[s.id] ?? s.doel
    if (!doel) continue
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

  const laad = useCallback(async () => {
    if (!supabase) return
    const van = dagStr(new Date(maand.getFullYear(), maand.getMonth(), 1))
    const tot = dagStr(new Date(maand.getFullYear(), maand.getMonth() + 1, 0))
    const [e, c, d] = await Promise.all([
      supabase.rpc('content_eigenaar'),
      supabase.from('content_checklist').select('dag, soort, aantal').gte('dag', van).lte('dag', tot),
      supabase.from('content_doelen').select('soort, doel'),
    ])
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

  return { eigenaar, telling, doelen, zetAantal, zetDoel, laad }
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
  const score = ditMaand ? dagScore(vandaag, data.telling, data.doelen) : 0

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

function ContentVenster({ telling, doelen, zetAantal, zetDoel, eigenaar, maand, setMaand, vandaag, isMobile, onClose }) {
  const [doelBewerk, setDoelBewerk] = useState(null) // soort-id
  const aantalDagen = new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate()
  const dagen = Array.from({ length: aantalDagen }, (_, i) => dagStr(new Date(maand.getFullYear(), maand.getMonth(), i + 1)))
  // Tot en met vandaag tellen voor het maandpercentage; toekomst telt niet.
  const verstreken = dagen.filter(d => d <= vandaag)
  const maandScore = verstreken.length ? verstreken.reduce((t, d) => t + dagScore(d, telling, doelen), 0) / verstreken.length : 0
  const scoreVandaag = dagScore(vandaag, telling, doelen)
  const cel = isMobile ? 34 : 36

  // Tik = één erbij; bij het doel weer naar nul.
  const tik = (dag, s) => {
    if (!eigenaar) return
    const doel = doelen[s.id] ?? s.doel
    const nu = telling[sleutel(dag, s.id)] || 0
    zetAantal(dag, s.id, nu >= Math.max(doel, 1) ? 0 : nu + 1)
  }

  const maandNaam = maand.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  const pijl = { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex', touchAction: 'manipulation' }

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={1100}>
      <VensterKop isMobile={isMobile} titel="Content" sub="Tik een vakje: één erbij, bij het doel weer leeg" onClose={onClose} />
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
                {SOORTEN.map(s => `${telling[sleutel(vandaag, s.id)] || 0}/${doelen[s.id] ?? s.doel} ${s.label.toLowerCase()}`).join(' · ')}
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
                          <input type="number" inputMode="numeric" min={0} max={50} autoFocus defaultValue={doel}
                            onBlur={(e) => { const v = Math.max(0, Math.min(50, parseInt(e.target.value, 10) || 0)); if (v !== doel) zetDoel(s.id, v); setDoelBewerk(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setDoelBewerk(null) }}
                            style={{ width: 42, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: '0.78rem', fontWeight: 800, padding: '2px 4px', fontFamily: 'inherit', outline: 'none' }} />
                        ) : (
                          <button onClick={() => setDoelBewerk(s.id)} title="Doel per dag aanpassen"
                            style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                            doel {doel}
                          </button>
                        )}
                      </div>
                    </td>
                    {dagen.map(d => {
                      const n = telling[sleutel(d, s.id)] || 0
                      const klaar = doel > 0 && n >= doel
                      const deels = n > 0 && !klaar
                      return (
                        <td key={d} style={{ padding: 0 }}>
                          <button onClick={() => tik(d, s)} disabled={!eigenaar}
                            style={{
                              width: cel, height: cel, borderRadius: 8, padding: 0, fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: klaar ? GROEN : deels ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.04)',
                              border: d === vandaag ? '1.5px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.07)',
                              color: '#fff', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}>
                            {klaar ? <Check size={15} strokeWidth={3.5} /> : deels ? `${n}/${doel}` : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
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
      </div>
    </Venster>
  )
}
