// src/modules/workout/components/todays-workout/components/ExerciseHistory.jsx
import { History, TrendingUp, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

// Eén kerncijfer in het kopblok: kopje, getal, regel eronder. Als component
// zodat beide kolommen dezelfde opbouw hebben en op dezelfde hoogte staan.
function Kerncijfer({ kopje, cijfer, onder }) {
  return (
    <div>
      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {kopje}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, marginTop: 2 }}>
        {cijfer}
      </div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
        {onder}
      </div>
    </div>
  )
}

export default function ExerciseHistory({ exerciseName, previousLog, loading, client, db, defaultExpanded = false, forceLoad = false }) {
  const isMobile = window.innerWidth <= 768
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [fullHistory, setFullHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    if ((expanded || forceLoad) && !historyLoaded && client?.id && db && exerciseName) {
      loadFullHistory()
    }
  }, [expanded, forceLoad])

  const loadFullHistory = async () => {
    if (!client?.id || !db || !exerciseName) return
    setLoadingHistory(true)
    try {
      // Match op ALLE woorden van de naam (AND van ilike's) i.p.v. exact-match,
      // zodat naam-varianten samenvallen ("Pec Deck Machine" ↔ "Machine Pec Deck").
      const tokens = (exerciseName || '').toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(w => w.length >= 2)
      let q = db.supabase
        .from('workout_progress')
        .select(`sets, created_at, exercise_name, workout_sessions!inner(client_id)`)
        .eq('workout_sessions.client_id', client.id)
      if (tokens.length) tokens.forEach(t => { q = q.ilike('exercise_name', `%${t}%`) })
      else q = q.eq('exercise_name', exerciseName)
      const { data, error } = await q
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      setFullHistory(data || [])
      setHistoryLoaded(true)
    } catch (error) {
      console.error('❌ Error loading full history:', error)
      setFullHistory([])
      setHistoryLoaded(true)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getRelativeTime = (dateString) => {
    if (!dateString) return ''
    const diffDays = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
    return `${Math.floor(diffDays / 30)} maanden geleden`
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  const formatSets = (sets) => {
    if (!sets || !Array.isArray(sets)) return 'Geen data'
    return sets.map(s => `${s.weight || 0}kg × ${s.reps || 0}`).join(', ')
  }

  const formatSetsCompact = (sets) => {
    if (!sets || !Array.isArray(sets)) return '-'
    const display = sets.slice(0, 3).map(s => `${s.weight || 0}×${s.reps || 0}`).join('  ')
    return sets.length > 3 ? `${display} +${sets.length - 3}` : display
  }

  const hasImprovement = (sets) => {
    if (!sets || sets.length < 2) return false
    return (sets[sets.length - 1].weight || 0) > (sets[0].weight || 0)
  }

  if (loading) {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.65rem 0' : '0.75rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>Laden...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // forceLoad — de volledige historie zoals hij in het blad staat.
  //
  // Was een tabel met twee kolommen in grijs, en elke rij een tikje
  // doorzichtiger dan de vorige. Je zag wát je deed, maar niet waar het om
  // gaat: word je sterker. Nu de zwaarste set bovenaan, per sessie het
  // verschil met de keer ervoor, en een lijntje van het verloop.
  if (forceLoad) {
    // Eén regel per sessiedag. Er staan soms twee logs van dezelfde dag in
    // (dubbele sessies uit het verleden); die horen bij elkaar.
    const perDag = new Map()
    fullHistory.forEach(log => {
      const dag = (log.created_at || '').slice(0, 10)
      const sets = Array.isArray(log.sets) ? log.sets.filter(x => (x.weight || 0) > 0 || (x.reps || 0) > 0) : []
      if (!dag || sets.length === 0) return          // lege sessies overslaan
      const bestaand = perDag.get(dag) || { dag, sets: [] }
      bestaand.sets = [...bestaand.sets, ...sets]
      perDag.set(dag, bestaand)
    })

    const topsetVan = (sets) => sets.reduce((best, x) =>
      (x.weight || 0) > (best.weight || 0) ||
      ((x.weight || 0) === (best.weight || 0) && (x.reps || 0) > (best.reps || 0)) ? x : best,
      { weight: 0, reps: 0 })

    const sessies = [...perDag.values()]
      .sort((a, b) => b.dag.localeCompare(a.dag))
      .map(s => ({
        ...s,
        top: topsetVan(s.sets),
        volume: s.sets.reduce((n, x) => n + (x.weight || 0) * (x.reps || 0), 0),
      }))

    // Zwaarste set ooit, en wanneer.
    const pr = sessies.reduce((best, s) =>
      !best || s.top.weight > best.top.weight ||
      (s.top.weight === best.top.weight && s.top.reps > best.top.reps) ? s : best, null)

    // Verschil met de sessie ervóór, op set 1 tegen set 1. Dat is de eerlijke
    // vergelijking: je eerste set doe je fris, en die is dus tussen twee
    // trainingen onderling te vergelijken. Vergeleek eerder de zwaarste set,
    // maar dat kon set 1 van de ene week tegen set 3 van de andere zijn.
    //
    // Eerst het gewicht, en bij gelijk gewicht de reps — meer herhalingen op
    // hetzelfde gewicht is ook vooruitgang.
    const verschil = (i) => {
      const nu = sessies[i]?.sets?.[0], vorige = sessies[i + 1]?.sets?.[0]
      if (!nu || !vorige) return null
      const dKg = (nu.weight || 0) - (vorige.weight || 0)
      if (dKg !== 0) return { tekst: `${dKg > 0 ? '+' : ''}${Number(dKg.toFixed(1))} kg`, op: dKg > 0 }
      const dReps = (nu.reps || 0) - (vorige.reps || 0)
      if (dReps !== 0) return { tekst: `${dReps > 0 ? '+' : ''}${dReps} rep${Math.abs(dReps) === 1 ? '' : 's'}`, op: dReps > 0 }
      return { tekst: 'gelijk', op: null }
    }

    // Hoeveel set-kolommen de tabel krijgt. Vier is genoeg; wie er meer doet
    // ziet de rest achter een plusje.
    const maxKolommen = Math.min(4, Math.max(...sessies.map(s => s.sets.length), 1))
    const kolommen = `56px repeat(${maxKolommen}, minmax(0, 1fr)) 66px`

    // Verticale lijnen tussen de kolommen. Via een linkerrand op elke cel
    // behalve de eerste, met de gap op nul — dan lopen de lijnen door de kop
    // en alle rijen op precies dezelfde plek.
    const cel = (k) => ({
      padding: '0 0.45rem',
      borderLeft: k === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
    })

    // Balkjes op volume (kg × reps opgeteld) en niet op het gewicht: bij
    // bankdrukken staat 80kg twintig sessies lang stil en werd de grafiek een
    // zigzag van niets. Volume beweegt wél met wat je erbij doet.
    //
    // Balkjes en geen lijn, omdat elke sessie een los moment is: een lijn
    // suggereert dat er iets tussen die twee punten gebeurde.
    const reeks = [...sessies].reverse()
    const maxVol = Math.max(...reeks.map(s => s.volume || 0), 1)

    return (
      <div>
        {loadingHistory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Laden…</span>
          </div>
        )}

        {!loadingHistory && historyLoaded && sessies.length === 0 && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            Nog geen sessies met deze oefening.
          </div>
        )}

        {!loadingHistory && sessies.length > 0 && (
          <>
            {/* Wat je wilt weten voor je gaat tillen: hoe zwaar ging het ooit,
                en hoe vaak heb je deze oefening gedaan. */}
            {/* Twee kolommen met dezelfde opbouw: kopje, cijfer, regel eronder.
                Stonden eerder op verschillende hoogtes omdat alleen de
                zwaarste set een datum onder zich had. */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '1.6rem',
              paddingBottom: '1rem', marginBottom: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}>
              <Kerncijfer
                kopje="Zwaarste set"
                cijfer={<>
                  {pr.top.weight}<span style={{ fontSize: '0.6em', color: 'rgba(255,255,255,0.4)' }}>kg</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7em' }}> × </span>
                  {pr.top.reps}
                </>}
                onder={formatDate(pr.dag)}
              />
              <Kerncijfer
                kopje="Sessies"
                cijfer={sessies.length}
                onder={`sinds ${formatDate(sessies[sessies.length - 1].dag)}`}
              />

              {reeks.length > 1 && (
                <div style={{ flex: 1, minWidth: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 2, height: 46 }}>
                  {reeks.map((s, i) => {
                    const laatste = i === reeks.length - 1
                    const isPr = s.dag === pr.dag
                    // Minimaal 12% hoog, anders verdwijnt een lichte sessie
                    // helemaal en lijkt het of er niets gebeurd is.
                    const h = Math.max(12, ((s.volume || 0) / maxVol) * 100)
                    return (
                      <div
                        key={s.dag}
                        title={`${formatDate(s.dag)} · ${s.top.weight}kg × ${s.top.reps}`}
                        style={{
                          width: 4, height: `${h}%`, borderRadius: 2, flexShrink: 0,
                          background: laatste ? '#10b981' : isPr ? '#FFD700' : 'rgba(255,255,255,0.22)',
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {/* Elke set een eigen kolom. Zo lees je verticaal wat set 1 door de
                weken heen deed, en horizontaal hoe een sessie verliep. De
                laatste kolom vergelijkt set 1 met set 1 van de vorige keer. */}
            <div style={{
              display: 'grid', gridTemplateColumns: kolommen,
              gap: 0, alignItems: 'center', paddingBottom: '0.35rem',
              fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={cel(0)}>Datum</span>
              {Array.from({ length: maxKolommen }, (_, k) => (
                <span key={k} style={cel(k + 1)}>Set {k + 1}</span>
              ))}
              <span style={{ ...cel(maxKolommen + 1), textAlign: 'right', letterSpacing: '0.04em' }}>Set 1 +/-</span>
            </div>

            <div>
              {sessies.map((s, i) => {
                const v = verschil(i)
                const maand = new Date(`${s.dag}T00:00:00`).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
                const vorigeMaand = i === 0 ? null : new Date(`${sessies[i - 1].dag}T00:00:00`).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
                const nieuweMaand = maand !== vorigeMaand
                return (
                  <div key={s.dag}>
                    {nieuweMaand && (
                      <div style={{
                        fontSize: '0.64rem', fontWeight: 900, color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        padding: i === 0 ? '0.5rem 0 0.25rem' : '0.7rem 0 0.25rem',
                      }}>
                        {maand}
                      </div>
                    )}
                    <div style={{
                      display: 'grid', gridTemplateColumns: kolommen,
                      gap: 0, alignItems: 'stretch', padding: '0.32rem 0',
                      borderTop: nieuweMaand ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ ...cel(0), fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDate(s.dag)}
                      </span>

                      {Array.from({ length: maxKolommen }, (_, k) => {
                        const set = s.sets[k]
                        // Laatste kolom draagt ook de sets die niet meer passen:
                        // "5×8 +2" is duidelijker dan ze stilzwijgend weglaten.
                        const rest = k === maxKolommen - 1 ? s.sets.length - maxKolommen : 0
                        if (!set) return <span key={k} style={{ ...cel(k + 1), color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>–</span>
                        return (
                          <span key={k} style={{
                            ...cel(k + 1),
                            fontSize: '0.85rem', fontWeight: 900, color: '#fff',
                            fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                          }}>
                            {/* "kg" erbij: zonder eenheid lees je 5×9 net zo
                                makkelijk als 9 reps van 5 als andersom. */}
                            {set.weight || 0}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7em', fontWeight: 800 }}>kg</span>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85em' }}>×</span>
                            {set.reps || 0}
                            {rest > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75em', fontWeight: 800 }}> +{rest}</span>}
                          </span>
                        )
                      })}

                      <span style={{
                        ...cel(maxKolommen + 1),
                        textAlign: 'right', fontSize: '0.72rem', fontWeight: 900,
                        color: !v ? 'rgba(255,255,255,0.15)' : v.op === null ? 'rgba(255,255,255,0.28)' : v.op ? '#10b981' : 'rgba(255,255,255,0.45)',
                        whiteSpace: 'nowrap',
                      }}>
                        {v ? v.tekst : '–'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!previousLog) {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.55rem 0' : '0.65rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <History size={isMobile ? 13 : 14} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
            Nog geen eerdere logs
          </span>
        </div>
      </div>
    )
  }

  const improved = hasImprovement(previousLog.sets)

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: isMobile ? '0.65rem 0' : '0.75rem 0', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <History size={isMobile ? 12 : 13} color="rgba(255,215,0,0.5)" />
            <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,215,0,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VORIGE LOG</span>
            {improved && <TrendingUp size={isMobile ? 11 : 12} color="rgba(255,215,0,0.5)" />}
          </div>
          <div style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontFamily: 'monospace', lineHeight: 1.4 }}>{formatSets(previousLog.sets)}</div>
          <div style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginTop: '0.1rem' }}>{getRelativeTime(previousLog.created_at)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Alles</span>
          <ChevronDown size={isMobile ? 14 : 16} color="rgba(255,255,255,0.2)" style={{ transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>
      </div>

      <div style={{ maxHeight: expanded ? '400px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: isMobile ? '0.5rem' : '0.625rem', paddingBottom: isMobile ? '0.5rem' : '0.625rem', maxHeight: '350px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loadingHistory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {!loadingHistory && fullHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.5rem', paddingBottom: '0.3rem', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATUM</span>
                <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SETS</span>
              </div>
              {fullHistory.map((log, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.5rem', padding: '0.3rem 0', borderBottom: i < fullHistory.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', opacity: Math.max(0.45, 1 - i * 0.1) }}>
                  <span style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', color: i === 0 ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.35)', fontWeight: '700' }}>{formatDate(log.created_at)}</span>
                  <span style={{ fontSize: isMobile ? '0.68rem' : '0.73rem', color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontWeight: '700', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatSetsCompact(log.sets)}</span>
                </div>
              ))}
            </div>
          )}
          {!loadingHistory && historyLoaded && fullHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '0.75rem 0', fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
              Geen eerdere logs gevonden
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
