// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WeightColumn.jsx
// Gewicht + statistiekbalk + Metingen + before/after per hoek
// Props: { client, weightData, circumData, photos, coachingPlan, isMobile, onOpenGallery }
// ============================================
import React from 'react'
import { Scale, Target, Ruler, Camera, Download, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import WeightStatsGrid from '../../../weight-tracker/components/WeightStatsGrid'
import BeforeAfterCard from '../../../progress/components/BeforeAfterCard'
import { weightGoalColor } from '../../../weight-tracker/utils/weightGoalColor'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

export default function WeightColumn({ client, weightData, circumData, photos, coachingPlan, isMobile, onOpenGallery }) {
  const history = weightData?.history || []
  // 'dag' = dag-op-dag logs · 'week' = week-op-week gemiddelden + verschil
  const [weightView, setWeightView] = React.useState('dag')
  // Standaard alleen de drie meest recente regels. De volledige lijst stond
  // eerder als scrollvak van 280px in de sectie — dat is veel regels voor iets
  // waar je meestal alleen de laatste paar van wil zien.
  const [alleMetingen, setAlleMetingen] = React.useState(false)
  const ZICHTBAAR = 3

  // Week-op-week: groepeer logs per kalenderweek (maandag-start), gemiddelde
  // per week + verschil t.o.v. de week ervoor. Nieuwste week bovenaan.
  const weeklyAverages = React.useMemo(() => {
    if (!history || history.length === 0) return []
    const mondayOf = (date) => {
      const d = new Date(date); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day
      d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0)
      return d.toISOString().split('T')[0]
    }
    const map = {}
    history.forEach(e => {
      const w = parseFloat(e.weight)
      if (!Number.isFinite(w)) return
      const wk = mondayOf(e.date)
      if (!map[wk]) map[wk] = []
      map[wk].push(w)
    })
    const weeks = Object.keys(map).sort().map(wk => {
      const arr = map[wk]
      const avg = Math.round((arr.reduce((t, v) => t + v, 0) / arr.length) * 10) / 10
      const end = new Date(wk); end.setDate(end.getDate() + 6)
      return { start: wk, end: end.toISOString().split('T')[0], avg, count: arr.length }
    })
    return weeks
      .map((w, i) => ({ ...w, diff: i > 0 ? Math.round((w.avg - weeks[i - 1].avg) * 10) / 10 : null }))
      .reverse()
  }, [history])
  const circumFields = [
    { key: 'waist_cm', label: 'Buik' }, { key: 'bicep_cm', label: 'Arm' },
    { key: 'chest_cm', label: 'Borst' }, { key: 'thigh_cm', label: 'Bovenbeen' }
  ]

  // De grafiek 'Plan vs Werkelijkheid' stond hier: een projectie van het
  // verwachte gewichtsverloop uit het coachingplan tegen de echte metingen.
  // Verwijderd op verzoek — 'Gewicht Verloop' eronder toont dezelfde
  // metingen en de doellijn zit daar ook in.


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Scale size={14} color="#fff" />
        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Gewicht & Body</span>
        {/* Doelgewicht stond in een eigen blok onder de kop, samen met het
            huidige gewicht. Huidig zit nu in de statistiekbalk; het doel is
            één regel en past hier achter de titel. */}
        {client.target_weight && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'baseline', gap: '0.3rem', flexShrink: 0 }}>
            <Target size={12} color="rgba(255,255,255,0.45)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
              {parseFloat(client.target_weight).toFixed(1)} kg
            </span>
            {client.goal_deadline && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                {formatDate(client.goal_deadline)}
              </span>
            )}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {history.length > 0 && <WeightStatsGrid stats={weightData?.stats || {}} client={client} fridayData={{ friday_count: weightData?.fridayCount || 0, total_fridays: 8 }} history={history} isMobile={isMobile} coachingPlan={coachingPlan} volleBreedte toonHuidig />}
        {history.length > 0 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '0.375rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>
                  Gewicht
                </span>
                {client.weekly_weight_goal != null && client.weekly_weight_goal !== '' && Number(client.weekly_weight_goal) !== 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '0.05rem 0.25rem', letterSpacing: '-0.01em' }}>
                    doel {Number(client.weekly_weight_goal) > 0 ? '+' : ''}{Number(client.weekly_weight_goal)}/wk
                  </span>
                )}
              </div>
              {/* Selectie: dag-op-dag of week-op-week */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                {[{ id: 'dag', label: 'Dag' }, { id: 'week', label: 'Week' }].map(opt => {
                  const active = weightView === opt.id
                  return (
                    <button key={opt.id} onClick={(e) => { e.stopPropagation(); setWeightView(opt.id) }}
                      style={{ padding: '0.15rem 0.5rem', background: active ? 'rgba(255,255,255,0.16)' : 'transparent', border: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '-0.01em', cursor: 'pointer', touchAction: 'manipulation' }}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* DAG-OP-DAG — alle metingen scrollbaar */}
            {weightView === 'dag' && (
              <div>
                {(alleMetingen ? history : history.slice(0, ZICHTBAAR)).map((e, idx) => {
                  // history is nieuwste-eerst → vorige meting (chronologisch) = idx+1
                  const prev = history[idx + 1]
                  const delta = prev && Number.isFinite(e.weight) && Number.isFinite(prev.weight)
                    ? Math.round((e.weight - prev.weight) * 10) / 10 : null
                  const deltaColor = delta === null ? 'rgba(255,255,255,0.3)' : weightGoalColor(delta, client)
                  return (
                  <div key={`${e.date}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.275rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{formatDate(e.date)}</span>
                      {e.is_friday_weighin && <span style={{ fontSize: '0.72rem', padding: '0.05rem 0.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', color: '#fff', fontWeight: '700' }}>VR</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontSize: idx === 0 ? '0.85rem' : '0.78rem', fontWeight: idx === 0 ? 900 : 700, color: '#fff', opacity: idx === 0 ? 1 : 0.75 }}>{e.weight.toFixed(1)} kg</span>
                      {delta !== null && delta !== 0 && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: deltaColor, minWidth: 34, textAlign: 'right' }}>{delta > 0 ? '+' : ''}{delta}</span>}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            {/* WEEK-OP-WEEK — gemiddelde per week + verschil t.o.v. vorige week */}
            {weightView === 'week' && (
              <div>
                {weeklyAverages.length === 0 ? (
                  <div style={{ padding: '0.75rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>Onvoldoende data</div>
                ) : (alleMetingen ? weeklyAverages : weeklyAverages.slice(0, ZICHTBAAR)).map((w, idx) => {
                  const diffColor = w.diff === null ? 'rgba(255,255,255,0.3)' : weightGoalColor(w.diff, client)
                  return (
                    <div key={w.start} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{formatDate(w.start)} – {formatDate(w.end)}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{w.count} meting{w.count === 1 ? '' : 'en'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: idx === 0 ? '0.88rem' : '0.8rem', fontWeight: 900, color: '#fff', opacity: idx === 0 ? 1 : 0.75 }}>{w.avg.toFixed(1)} kg</span>
                        {w.diff !== null && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: diffColor, minWidth: 38, textAlign: 'right' }}>{w.diff > 0 ? '+' : ''}{w.diff}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Uitklapper. Toont hoeveel er nog achter zit, zodat je niet hoeft
                te gokken of het de moeite waard is. */}
            {(() => {
              const totaal = weightView === 'week' ? weeklyAverages.length : history.length
              if (totaal <= ZICHTBAAR) return null
              return (
                <button
                  onClick={() => setAlleMetingen(v => !v)}
                  style={{
                    width: '100%', marginTop: '0.4rem', padding: '0.4rem 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '0.78rem', fontWeight: 900, color: '#fff',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                  {alleMetingen ? 'Toon minder' : `Alle ${totaal} tonen`}
                  {alleMetingen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )
            })()}
          </div>
        )}
        {circumData?.latest && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Ruler size={12} color="rgba(255,255,255,0.5)" /><span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>Omtrek</span></div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{formatDate(circumData.latest.measurement_date)}</span>
            </div>
            {circumFields.map(f => {
              const val = circumData.latest[f.key]; const prev = circumData.previous?.[f.key]
              if (!val) return null
              const d = prev ? parseFloat((val - prev).toFixed(1)) : null
              return (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.275rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{f.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>{parseFloat(val).toFixed(1)}<span style={{ fontSize: '0.72rem', fontWeight: '500', opacity: 0.4 }}>cm</span></span>
                    {d !== null && d !== 0 && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: d < 0 ? '#10b981' : '#ef4444' }}>{d > 0 ? '+' : ''}{d}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {photos.length > 0 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Camera size={12} color="rgba(168,85,247,0.5)" /><span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(168,85,247,0.4)', letterSpacing: '-0.01em' }}>Foto's</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{photos.length}</span>
                {onOpenGallery && (
                  <button onClick={onOpenGallery} title="Alle foto's — vergroot overzicht" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 26, padding: '0 0.5rem', borderRadius: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Maximize2 size={11} /> Overzicht
                  </button>
                )}
              </div>
            </div>
            {/* Drie hoeken naast elkaar, elk eerste foto tegen laatste met de
                MA-overlay — hetzelfde beeld als op de trackingpagina. Stond
                eerder als strip miniaturen van 52 bij 52 pixels; daar zie je
                geen verschil op. */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '0.3rem' : '0.5rem',
              // Zonder bovengrens rekken ze mee met het paneel: met één sectie
              // open werd elk vak ruim 400px. Dit is een preview, geen galerij.
              maxWidth: isMobile ? '100%' : 520,
            }}>
              {[
                { hoek: 'front', label: 'Voor' },
                { hoek: 'side',  label: 'Zij' },
                { hoek: 'back',  label: 'Achter' },
              ].map(v => (
                <BeforeAfterCard
                  key={v.hoek}
                  client={client}
                  isMobile={isMobile}
                  bare
                  hoek={v.hoek}
                  bijschrift={v.label}
                  fotos={photos}
                />
              ))}
            </div>

            {/* De losse miniaturen blijven bereikbaar via Overzicht hierboven;
                een aparte strip eronder zou dezelfde foto's dubbel tonen. */}
          </div>
        )}
        {!history.length && !circumData?.latest && photos.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>Geen data</div>
        )}
      </div>
    </div>
  )
}
