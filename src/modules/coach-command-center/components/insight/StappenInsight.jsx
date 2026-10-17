// src/modules/coach-command-center/components/insight/StappenInsight.jsx
//
// Stappen van de klant in de Training-kolom van Coach Insight: het dagdoel dat
// jij zet, en wat hij per week (ma t/m zo) liep. Met de pijlen, of door te
// vegen, kijk je terug naar eerdere weken.
//
// Staat bij cardio en niet bij voeding, want het is hetzelfde gesprek: hoeveel
// beweegt hij buiten de training om.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Footprints, ChevronLeft, ChevronRight } from 'lucide-react'
import StappenService, { STANDAARD_DOEL } from '../../../steps/StappenService'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kortDatum = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

function weekLabel(terug, dagen) {
  if (terug === 0) return 'Deze week'
  if (terug === 1) return 'Vorige week'
  if (!dagen.length) return `${terug} weken terug`
  return `${kortDatum(dagen[0].iso)} – ${kortDatum(dagen[6].iso)}`
}

export default function StappenInsight({ db, client, isMobile, alleenDoel = false }) {
  const [dagen, setDagen] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [bezig, setBezig] = useState(false)
  const [bewaard, setBewaard] = useState(false)
  const [terug, setTerug] = useState(0) // 0 = deze week, 1 = vorige week, ...
  const veegStart = useRef(null)

  useEffect(() => { setTerug(0) }, [client?.id])

  const laad = useCallback(async () => {
    if (!client?.id) return
    const anker = new Date()
    anker.setDate(anker.getDate() - terug * 7)
    const [rijen, d] = await Promise.all([
      StappenService.haalWeek(db, client.id, anker),
      StappenService.haalDoel(db, client.id),
    ])
    setDagen(rijen)
    setDoel(d)
  }, [db, client?.id, terug])

  useEffect(() => { laad() }, [laad])

  const veeg = {
    onTouchStart: (e) => { veegStart.current = e.touches[0].clientX },
    onTouchEnd: (e) => {
      if (veegStart.current == null) return
      const dx = e.changedTouches[0].clientX - veegStart.current
      veegStart.current = null
      if (dx > 40) setTerug(t => Math.min(t + 1, 52))
      else if (dx < -40) setTerug(t => Math.max(t - 1, 0))
    },
  }

  const zet = async (nieuw) => {
    const waarde = Math.max(1000, Math.min(50000, nieuw))
    setDoel(waarde)
    setBezig(true)
    try {
      await StappenService.zetDoel(db, client.id, waarde)
      setBewaard(true)
      setTimeout(() => setBewaard(false), 1400)
    } catch (e) {
      console.error('Stappendoel opslaan mislukt:', e)
    } finally {
      setBezig(false)
    }
  }

  const vandaag = dagen.find(d => d.isVandaag)
  const gelogd = dagen.filter(d => d.steps > 0 && !d.toekomst)
  const totaal = gelogd.reduce((s, d) => s + d.steps, 0)
  const gemiddeld = gelogd.length ? Math.round(totaal / gelogd.length) : 0
  const doelDagen = gelogd.filter(d => doel > 0 && d.steps >= doel).length

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Footprints size={13} color="#fff" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Stappen · doel per dag
          </div>
          {!alleenDoel && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            {totaal ? `Totaal ${nl(totaal)}` : 'Nog niets gelogd'}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {gemiddeld ? ` · gem. ${nl(gemiddeld)} · ${doelDagen}/${gelogd.length} op doel` : ''}
              {terug === 0 && vandaag ? ` · vandaag ${vandaag.steps ? nl(vandaag.steps) : 'nog niets'}` : ''}
            </span>
          </div>}
          {bewaard && (
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginTop: 1 }}>Doel bewaard</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: bezig ? 0.5 : 1 }}>
          <button onClick={() => zet(doel - 1000)} aria-label="Minder" style={knop}>−</button>
          <span style={{
            minWidth: 52, textAlign: 'center',
            fontSize: '0.85rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums',
          }}>
            {nl(doel)}
          </span>
          <button onClick={() => zet(doel + 1000)} aria-label="Meer" style={knop}>+</button>
        </div>
      </div>

      {!alleenDoel && (<>
      {/* Week kiezen: pijlen naast de periode, of vegen over de balkjes. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: '0.45rem' }}>
        <button onClick={() => setTerug(t => Math.min(t + 1, 52))} aria-label="Week terug" style={pijl}>
          <ChevronLeft size={15} strokeWidth={3} />
        </button>
        <span style={{ minWidth: 110, textAlign: 'center', fontSize: '0.74rem', fontWeight: 900, color: '#fff' }}>
          {weekLabel(terug, dagen)}
        </span>
        <button onClick={() => setTerug(t => Math.max(t - 1, 0))} disabled={terug === 0} aria-label="Week vooruit"
          style={{ ...pijl, opacity: terug === 0 ? 0.25 : 1, cursor: terug === 0 ? 'default' : 'pointer' }}>
          <ChevronRight size={15} strokeWidth={3} />
        </button>
      </div>

      <div {...veeg} style={{ display: 'flex', gap: 3, marginTop: '0.35rem', alignItems: 'flex-end', touchAction: 'pan-y' }}>
        {dagen.map((d) => {
          const pct = doel > 0 ? Math.min(100, (d.steps / doel) * 100) : 0
          return (
            <div key={d.iso} style={{ flex: 1, textAlign: 'center' }}>
              <div
                title={`${d.iso}: ${nl(d.steps)} stappen${d.source ? ` (${d.source})` : ''}`}
                style={{
                  height: 26, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)', opacity: d.toekomst ? 0.35 : 1,
                  display: 'flex', alignItems: 'flex-end',
                }}
              >
                <div style={{
                  width: '100%', height: `${pct}%`,
                  background: d.steps >= doel && doel > 0 ? '#10b981' : 'rgba(255,255,255,0.45)',
                }} />
              </div>
              <div style={{
                marginTop: 2, fontSize: '0.52rem', fontWeight: 800,
                color: d.isVandaag ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
              }}>
                {d.dag}
              </div>
            </div>
          )
        })}
      </div>
      </>)}
    </div>
  )
}

const knop = {
  width: 26, height: 26, padding: 0, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 900, lineHeight: 1,
  cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const pijl = {
  width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
