// src/modules/progress/ProgressChartsWidget.jsx
// V4: Met mooie Recharts AreaChart + PR markers
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { BarChart3, Search, ChevronDown, Dumbbell, Trophy, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

const ProgressChartsWidget = forwardRef(({ db, clientId }, ref) => {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chartMetric, setChartMetric] = useState('1rm')
  const [period, setPeriod] = useState(30)
  const [stats, setStats] = useState({ avg8Rep: null, oneRepMax: null, maxVolume: null })
  const [chartData, setChartData] = useState([])

  useImperativeHandle(ref, () => ({
    openExercise: (exercise) => {
      setSelectedExercise(exercise)
      setShowDropdown(false)
    }
  }))

  useEffect(() => {
    if (clientId && db) loadExercises()
  }, [clientId, db])

  useEffect(() => {
    if (selectedExercise && clientId && db) {
      calculateStats()
      loadChartData()
    }
  }, [selectedExercise, clientId, db, period])

  const loadExercises = async () => {
    try {
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
        .limit(100)

      if (sessions?.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data: progress } = await db.supabase
          .from('workout_progress')
          .select('exercise_name')
          .in('session_id', sessionIds)

        const uniqueExercises = [...new Set(progress?.map(p => p.exercise_name) || [])]
        setExercises(uniqueExercises.sort())
        
        if (uniqueExercises.length > 0 && !selectedExercise) {
          setSelectedExercise(uniqueExercises[0])
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load exercises:', error)
      setLoading(false)
    }
  }

  const calculateStats = async () => {
    try {
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)

      if (!sessions?.length) return

      const sessionIds = sessions.map(s => s.id)
      const { data: progressData } = await db.supabase
        .from('workout_progress')
        .select('sets')
        .in('session_id', sessionIds)
        .eq('exercise_name', selectedExercise)

      if (!progressData?.length) {
        setStats({ avg8Rep: null, oneRepMax: null, maxVolume: null })
        return
      }

      const allSets = []
      progressData.forEach(record => {
        if (Array.isArray(record.sets)) {
          record.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0
            const reps = parseInt(set.reps) || 0
            if (weight > 0 && reps > 0) allSets.push({ weight, reps })
          })
        }
      })

      if (allSets.length === 0) {
        setStats({ avg8Rep: null, oneRepMax: null, maxVolume: null })
        return
      }

      const oneRepMaxes = allSets.map(set => set.weight * (1 + set.reps / 30))
      const maxOneRepMax = Math.max(...oneRepMaxes)
      const estimated8Reps = oneRepMaxes.map(orm => orm / (1 + 8 / 30))
      const avg8Rep = estimated8Reps.reduce((a, b) => a + b, 0) / estimated8Reps.length
      const volumes = allSets.map(set => set.weight * set.reps)
      const maxVolume = Math.max(...volumes)

      setStats({
        avg8Rep: Math.round(avg8Rep * 10) / 10,
        oneRepMax: Math.round(maxOneRepMax * 10) / 10,
        maxVolume: Math.round(maxVolume)
      })
    } catch (error) {
      console.error('Failed to calculate stats:', error)
    }
  }

  const loadChartData = async () => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - period)

      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id, workout_date')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .order('workout_date', { ascending: true })

      if (!sessions?.length) {
        setChartData([])
        return
      }

      const sessionIds = sessions.map(s => s.id)
      const { data: progressData } = await db.supabase
        .from('workout_progress')
        .select('session_id, sets')
        .in('session_id', sessionIds)
        .eq('exercise_name', selectedExercise)

      if (!progressData?.length) {
        setChartData([])
        return
      }

      const dataByDate = {}
      progressData.forEach(record => {
        const session = sessions.find(s => s.id === record.session_id)
        if (!session) return
        
        const date = session.workout_date
        if (!dataByDate[date]) dataByDate[date] = { sets: [] }
        
        if (Array.isArray(record.sets)) {
          record.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0
            const reps = parseInt(set.reps) || 0
            if (weight > 0 && reps > 0) dataByDate[date].sets.push({ weight, reps })
          })
        }
      })

      const chartPoints = Object.entries(dataByDate).map(([date, data]) => {
        const sets = data.sets
        if (sets.length === 0) return null

        const oneRepMaxes = sets.map(s => s.weight * (1 + s.reps / 30))
        const maxORM = Math.max(...oneRepMaxes)
        const volumes = sets.map(s => s.weight * s.reps)
        const totalVolume = volumes.reduce((a, b) => a + b, 0)
        const est8Rep = maxORM / (1 + 8 / 30)

        return {
          date,
          label: new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
          '1rm': Math.round(maxORM * 10) / 10,
          'volume': Math.round(totalVolume),
          '8rep': Math.round(est8Rep * 10) / 10
        }
      }).filter(Boolean)

      setChartData(chartPoints)
    } catch (error) {
      console.error('Failed to load chart data:', error)
      setChartData([])
    }
  }

  const filteredExercises = exercises.filter(ex =>
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Find PR point for chart
  const prPoint = chartData.length > 0 
    ? chartData.reduce((max, point) => point[chartMetric] > (max?.[chartMetric] || 0) ? point : max, null)
    : null

  const getMetricUnit = () => chartMetric === 'volume' ? 'kg' : 'kg'

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const point = payload[0].payload
    const value = point[chartMetric]
    const isPR = prPoint && point.date === prPoint.date

    return (
      <div style={{
        background: 'rgba(17, 17, 17, 0.98)',
        border: '1px solid rgba(255, 215, 0, 0.35)',
        borderRadius: '10px',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(255, 215, 0, 0.25)'
      }}>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '0.4rem',
          fontWeight: '600'
        }}>
          {point.label}
        </div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: '800',
          color: '#FFD700',
          marginBottom: isPR ? '0.3rem' : 0
        }}>
          {value} {getMetricUnit()}
        </div>
        {isPR && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: '#fbbf24',
            fontWeight: '700'
          }}>
            <Trophy size={10} />
            PERSONAL RECORD
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '2rem 1rem' : '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid rgba(255, 215, 0, 0.2)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (exercises.length === 0) return null

  return (
    <div>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 0 0.75rem 0' : '0 0 1rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={isMobile ? 16 : 18} color="#FFD700" />
          <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Workout Analytics
          </h3>
        </div>

        {/* Exercise Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: isMobile ? '0.45rem 0.7rem' : '0.5rem 0.875rem',
              color: selectedExercise ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              maxWidth: isMobile ? '140px' : '200px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Dumbbell size={isMobile ? 12 : 13} color="#FFD700" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedExercise || 'Kies oefening'}
            </span>
            <ChevronDown size={12} style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} />
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem',
              background: 'rgba(15, 15, 15, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px', zIndex: 30,
              minWidth: isMobile ? '200px' : '250px', maxHeight: '280px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} />
                  <input
                    type="text"
                    placeholder="Zoek oefening..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px', color: '#fff',
                      fontSize: isMobile ? '16px' : '0.75rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {filteredExercises.map(ex => (
                  <button
                    key={ex}
                    onClick={() => { setSelectedExercise(ex); setShowDropdown(false); setSearchQuery('') }}
                    style={{
                      width: '100%', padding: isMobile ? '0.625rem 0.75rem' : '0.5rem 0.75rem',
                      background: selectedExercise === ex ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                      border: 'none', color: selectedExercise === ex ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600',
                      cursor: 'pointer', textAlign: 'left',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECHARTS AREA CHART - BOVENAAN */}
      <div style={{ position: 'relative', padding: isMobile ? '0.75rem 0' : '1rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {chartData.length > 0 ? (
          <>
            {/* PR Badge */}
            {prPoint && (
              <div style={{
                position: 'absolute', top: isMobile ? '8px' : '10px', right: isMobile ? '8px' : '10px', zIndex: 10,
                padding: isMobile ? '0.375rem 0.5rem' : '0.4rem 0.625rem',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.1) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                borderRadius: isMobile ? '6px' : '8px',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.3rem',
                boxShadow: '0 2px 12px rgba(251, 191, 36, 0.15)'
              }}>
                <Trophy size={isMobile ? 11 : 12} color="#fbbf24" />
                <span style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: '#fbbf24',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  PR: {prPoint[chartMetric]}{getMetricUnit()}
                </span>
              </div>
            )}

            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="label"
                  stroke="rgba(255, 255, 255, 0.2)"
                  fontSize={isMobile ? 9 : 10}
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.2)"
                  fontSize={isMobile ? 9 : 10}
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Area 
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="#FFD700"
                  strokeWidth={isMobile ? 2 : 2.5}
                  fill="url(#goldGradient)"
                  animationDuration={800}
                  animationEasing="ease-out"
                />

                {/* PR Marker */}
                {prPoint && (
                  <ReferenceDot
                    x={prPoint.label}
                    y={prPoint[chartMetric]}
                    r={isMobile ? 5 : 6}
                    fill="#fbbf24"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{
            height: isMobile ? '120px' : '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem'
          }}>
            <TrendingUp size={28} color="rgba(255, 255, 255, 0.15)" />
            <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: isMobile ? '0.7rem' : '0.75rem', margin: 0 }}>
              Geen data voor deze periode
            </p>
          </div>
        )}
      </div>

      {/* CHART CONTROLS - NA DE CHART */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '0.75rem 0' : '1rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[{ key: '1rm', label: '1RM' }, { key: 'volume', label: 'Volume' }, { key: '8rep', label: '8 Rep' }].map(m => (
            <button key={m.key} onClick={() => setChartMetric(m.key)} style={{
              background: chartMetric === m.key ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
              border: chartMetric === m.key ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px', padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.6rem',
              color: chartMetric === m.key ? '#FFD700' : 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[{ days: 7, label: '7d' }, { days: 14, label: '14d' }, { days: 30, label: '30d' }].map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)} style={{
              background: period === p.days ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
              border: period === p.days ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px', padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.6rem',
              color: period === p.days ? '#FFD700' : 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* STATS ROW - ONDERAAN */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0.75rem 0' : '1rem 0'
      }}>
        <StatItem label="Gem. 8 Rep" value={stats.avg8Rep !== null ? `${stats.avg8Rep}kg` : '-'} isMobile={isMobile} />
        <StatDivider />
        <StatItem label="1RM" value={stats.oneRepMax !== null ? `${stats.oneRepMax}kg` : '-'} isMobile={isMobile} />
        <StatDivider />
        <StatItem label="Max Volume" value={stats.maxVolume !== null ? `${stats.maxVolume}kg` : '-'} isMobile={isMobile} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
})

export default ProgressChartsWidget

function StatItem({ label, value, isMobile }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255, 255, 255, 0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>{label}</div>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.06)', flexShrink: 0 }} />
}
