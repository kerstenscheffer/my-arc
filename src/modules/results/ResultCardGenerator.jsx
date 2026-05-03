// src/modules/results/ResultCardGenerator.jsx
import React, { useState, useEffect, useRef } from 'react'

const isMobile = window.innerWidth <= 768

export default function ResultCardGenerator({ db, clients = [] }) {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => { loadResults() }, [clients])

  async function loadResults() {
    if (!clients.length) { setLoading(false); return }
    setLoading(true)
    try {
      const all = []
      for (const client of clients) {
        // Weight results
        const { data: wh } = await db.supabase
          .from('weight_history')
          .select('weight, date')
          .eq('client_id', client.id)
          .order('date', { ascending: true })

        if (wh && wh.length >= 2) {
          const first = wh[0]
          const last = wh[wh.length - 1]
          const diff = parseFloat((last.weight - first.weight).toFixed(1))
          const weeks = Math.round((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24 * 7))
          if (Math.abs(diff) >= 3 && weeks >= 2) {
            all.push({
              id: `w-${client.id}`,
              type: 'weight',
              clientName: client.first_name + ' ' + (client.last_name?.[0] || '') + '.',
              before: parseFloat(first.weight),
              after: parseFloat(last.weight),
              unit: 'kg',
              diff,
              weeks,
              label: `${diff < 0 ? '' : '+'}${diff}kg in ${weeks}w`,
              detail: `${first.weight} → ${last.weight}kg · ${weeks} weken`,
            })
          }
        }

        // PR results
        const { data: prs } = await db.supabase
          .from('exercise_prs')
          .select('exercise_name, weight, reps, date')
          .eq('client_id', client.id)
          .order('date', { ascending: false })
          .limit(20)

        if (prs) {
          const byExercise = {}
          prs.forEach(pr => {
            if (!byExercise[pr.exercise_name]) byExercise[pr.exercise_name] = []
            byExercise[pr.exercise_name].push(pr)
          })
          Object.entries(byExercise).forEach(([name, records]) => {
            if (records.length >= 2) {
              const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date))
              const first = sorted[0]
              const best = sorted.reduce((m, r) => r.weight > m.weight ? r : m, sorted[0])
              const diff = parseFloat((best.weight - first.weight).toFixed(1))
              const weeks = Math.round((new Date(best.date) - new Date(first.date)) / (1000 * 60 * 60 * 24 * 7))
              if (diff >= 5 && weeks >= 1) {
                all.push({
                  id: `pr-${client.id}-${name}`,
                  type: 'pr',
                  clientName: client.first_name + ' ' + (client.last_name?.[0] || '') + '.',
                  exercise: name,
                  before: parseFloat(first.weight),
                  after: parseFloat(best.weight),
                  unit: 'kg',
                  diff,
                  weeks,
                  label: `+${diff}kg PR`,
                  detail: `${first.weight} → ${best.weight}kg · ${weeks} weken`,
                })
              }
            }
          })
        }
      }

      // Sort by abs diff desc
      all.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      setResults(all)
      if (all.length) setSelected(all[0])
    } catch (e) {
      console.error('ResultCardGenerator load error:', e)
    }
    setLoading(false)
  }

  function downloadCard() {
    if (!selected) return
    setDownloading(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = 540
    canvas.height = 580

    const cx = 270
    const diff = selected.after - selected.before
    const sign = diff > 0 ? '+' : ''
    const diffStr = sign + parseFloat(diff.toFixed(1)) + selected.unit
    const subtitle = (selected.type === 'pr' ? selected.exercise + ' · ' : '') + 'in ' + selected.weeks + ' weken'

    // transparent background — nothing drawn

    function rr(x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }

    // pill
    ctx.font = 'bold 15px Arial'
    const tw = ctx.measureText('CLIENT RESULTS').width
    ctx.fillStyle = '#FFD700'
    rr(cx - tw / 2 - 16, 28, tw + 32, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.fillText('CLIENT RESULTS', cx, 45)

    // before label
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = 'bold 12px Arial'
    ctx.fillText('BEFORE', cx - 118, 96)

    // before number
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = 'bold 96px Arial'
    ctx.fillText(selected.before, cx - 118, 192)

    // before unit
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '500 16px Arial'
    ctx.fillText(selected.unit, cx - 118, 218)

    // arrow
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.font = '400 26px Arial'
    ctx.fillText('→', cx, 168)

    // after label
    ctx.fillStyle = 'rgba(255,215,0,0.55)'
    ctx.font = 'bold 12px Arial'
    ctx.fillText('AFTER', cx + 118, 96)

    // after number
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 96px Arial'
    ctx.fillText(selected.after, cx + 118, 192)

    // after unit
    ctx.fillStyle = 'rgba(255,215,0,0.35)'
    ctx.font = '500 16px Arial'
    ctx.fillText(selected.unit, cx + 118, 218)

    // diff big
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 80px Arial'
    ctx.fillText(diffStr, cx, 330)

    // subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(subtitle.toUpperCase(), cx, 358)

    // brand
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = 'bold 13px Arial'
    ctx.fillText('MY ARC', cx, 418)

    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'myarc-' + selected.clientName.replace(/\s/g, '-').toLowerCase() + '.png'
    a.click()
    setDownloading(false)
  }

  if (loading) return (
    <div style={{ padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center' }}>
      Resultaten laden...
    </div>
  )

  if (!results.length) return (
    <div style={{ padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center' }}>
      Nog geen postwaardige resultaten gevonden.<br />
      <span style={{ fontSize: '10px', opacity: 0.6 }}>Minimaal 3kg gewichtsverlies of 5kg PR vereist.</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1px', background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Feed */}
      <div style={{ flex: isMobile ? 'none' : '0 0 260px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
            Resultaten · {results.length} postbaar
          </span>
        </div>

        {/* Weight section */}
        {results.filter(r => r.type === 'weight').length > 0 && (
          <>
            <div style={{ padding: '6px 12px 3px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
              Gewichtsverlies
            </div>
            {results.filter(r => r.type === 'weight').map(r => (
              <ResultRow key={r.id} result={r} selected={selected?.id === r.id} onClick={() => setSelected(r)} />
            ))}
          </>
        )}

        {/* PR section */}
        {results.filter(r => r.type === 'pr').length > 0 && (
          <>
            <div style={{ padding: '8px 12px 3px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
              Krachtrecords
            </div>
            {results.filter(r => r.type === 'pr').map(r => (
              <ResultRow key={r.id} result={r} selected={selected?.id === r.id} onClick={() => setSelected(r)} />
            ))}
          </>
        )}
      </div>

      {/* Preview + download */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', gap: '14px' }}>
        {selected && (
          <>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start' }}>
              Preview
            </div>

            {/* Checkerboard = transparant */}
            <div style={{
              backgroundImage: 'linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0,0 5px,5px -5px,-5px 0',
              backgroundColor: '#1c1c1c',
              borderRadius: '8px',
              padding: '28px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
              <CardPreview result={selected} />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <button
              onClick={downloadCard}
              disabled={downloading}
              style={{
                width: '100%',
                background: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                padding: '11px',
                cursor: downloading ? 'not-allowed' : 'pointer',
                opacity: downloading ? 0.6 : 1,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {downloading ? 'Genereren...' : 'Download transparante PNG'}
            </button>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
              Layer over client foto in Instagram story
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ResultRow({ result, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        cursor: 'pointer',
        background: selected ? 'rgba(255,215,0,0.04)' : 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: selected ? '#FFD700' : 'rgba(255,255,255,0.6)' }}>
          {result.clientName}{result.type === 'pr' ? ` · ${result.exercise}` : ''}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', marginTop: '1px' }}>
          {result.detail}
        </div>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#FFD700', flexShrink: 0 }}>
        {result.label}
      </div>
    </div>
  )
}

function CardPreview({ result }) {
  const diff = result.after - result.before
  const sign = diff > 0 ? '+' : ''
  const diffStr = sign + parseFloat(diff.toFixed(1)) + result.unit
  const subtitle = (result.type === 'pr' ? result.exercise + ' · ' : '') + 'in ' + result.weeks + ' weken'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '180px' }}>
      {/* Pill */}
      <div style={{ background: '#FFD700', color: '#000', fontSize: '8px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 12px', borderRadius: '20px' }}>
        CLIENT RESULTS
      </div>

      {/* Before → After */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Before</div>
          <div style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.38)' }}>{result.before}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', marginTop: '1px' }}>{result.unit}</div>
        </div>
        <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.12)', paddingBottom: '12px' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,215,0,0.5)', marginBottom: '2px' }}>After</div>
          <div style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#FFD700' }}>{result.after}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.35)', marginTop: '1px' }}>{result.unit}</div>
        </div>
      </div>

      {/* Diff */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '50px', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>{diffStr}</div>
        <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>{subtitle}</div>
      </div>

      {/* Brand */}
      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>MY ARC</div>
    </div>
  )
}
