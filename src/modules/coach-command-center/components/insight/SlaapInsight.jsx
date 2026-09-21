// src/modules/coach-command-center/components/insight/SlaapInsight.jsx
//
// Hoe slaapt deze klant? In de gewicht-kolom, want die twee horen bij elkaar:
// een week slecht slapen laat de weegschaal stijgen zonder dat er iets aan het
// eten veranderd is, en dan zoek je in de verkeerde hoek.
//
// Wat hier staat: de laatste veertien nachten als staafjes (hoogte = uren,
// kleur = hoe het voelde), het gemiddelde ernaast, en wat de klant zelf over
// die nachten schreef. Dat laatste is meestal het nuttigste — "kind wakker" of
// "te laat doorgewerkt" vertelt je waar het gesprek over moet gaan.

import { useCallback, useEffect, useState } from 'react'
import { Moon } from 'lucide-react'

const NACHTEN = 14

const kleurVoorCijfer = (q) => {
  if (q == null) return 'rgba(255,255,255,0.35)'
  if (q >= 7) return '#10b981'
  if (q >= 5) return '#f59e0b'
  return '#ef4444'
}

const dagLetter = (iso) => {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 1).toUpperCase()
  } catch { return '' }
}
const datumKort = (iso) => {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

export default function SlaapInsight({ db, client, isMobile }) {
  const [nachten, setNachten] = useState([])
  const [laden, setLaden] = useState(true)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) { setLaden(false); return }
    const vanaf = new Date()
    vanaf.setDate(vanaf.getDate() - (NACHTEN - 1))
    const vanafIso = vanaf.toISOString().split('T')[0]
    const { data, error } = await db.supabase
      .from('sleep_logs')
      .select('log_date, hours_slept, quality, struggles, notes')
      .eq('client_id', client.id)
      .gte('log_date', vanafIso)
      .order('log_date', { ascending: true })
    if (error) { console.error('Slaap laden mislukt:', error); setLaden(false); return }

    // Elke dag een plek, ook de nachten zonder log — een gat is hier
    // informatie: niet loggen is meestal ook niet goed slapen.
    const perDag = new Map((data || []).map(r => [String(r.log_date).slice(0, 10), r]))
    const lijst = []
    for (let i = NACHTEN - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const rij = perDag.get(iso)
      lijst.push({
        iso,
        uren: rij?.hours_slept != null ? Number(rij.hours_slept) : null,
        cijfer: rij?.quality != null ? Number(rij.quality) : null,
        tekst: rij?.struggles || rij?.notes || null,
      })
    }
    setNachten(lijst)
    setLaden(false)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  if (laden) return null

  const gelogd = nachten.filter(n => n.uren != null)
  if (gelogd.length === 0) return null

  const gemUren = Math.round((gelogd.reduce((s, n) => s + n.uren, 0) / gelogd.length) * 10) / 10
  const metCijfer = gelogd.filter(n => n.cijfer != null)
  const gemCijfer = metCijfer.length
    ? Math.round((metCijfer.reduce((s, n) => s + n.cijfer, 0) / metCijfer.length) * 10) / 10
    : null
  const opmerkingen = [...nachten].reverse().filter(n => n.tekst).slice(0, 2)
  const maxUren = Math.max(9, ...gelogd.map(n => n.uren))

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Moon size={13} color="rgba(255,255,255,0.5)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Slaap · laatste {NACHTEN} nachten
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            Gemiddeld {gemUren} uur
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {gemCijfer != null ? ` · cijfer ${gemCijfer}` : ''}
              {' · '}{gelogd.length} van {NACHTEN} gelogd
            </span>
          </div>
        </div>
      </div>

      {/* Hoogte is hoeveel uur, kleur is hoe het voelde. Acht uur slecht slapen
          is een hoge rode balk — precies wat je wilt zien. */}
      <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', alignItems: 'flex-end' }}>
        {nachten.map((n, i) => {
          const pct = n.uren != null ? Math.min(100, (n.uren / maxUren) * 100) : 0
          return (
            <div key={n.iso} style={{ flex: 1, textAlign: 'center' }}>
              <div
                title={n.uren != null
                  ? `${datumKort(n.iso)}: ${n.uren} uur${n.cijfer != null ? ` · ${n.cijfer}/10` : ''}${n.tekst ? ` — ${n.tekst}` : ''}`
                  : `${datumKort(n.iso)}: niets gelogd`}
                style={{
                  height: 30, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'flex-end',
                }}
              >
                <div style={{
                  width: '100%', height: `${pct}%`,
                  background: kleurVoorCijfer(n.cijfer),
                  opacity: n.cijfer == null ? 0.5 : 1,
                }} />
              </div>
              <div style={{
                marginTop: 2, fontSize: '0.5rem', fontWeight: 800,
                color: i === nachten.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              }}>
                {dagLetter(n.iso)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Wat hij er zelf over schreef. Vaak de enige regel die zegt waar het
          gesprek over moet gaan. */}
      {opmerkingen.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {opmerkingen.map(n => (
            <div key={n.iso} style={{
              fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.4, marginTop: 2,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>{datumKort(n.iso)}: </span>
              {n.tekst}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
