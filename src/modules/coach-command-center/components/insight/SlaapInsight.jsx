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
//
// log_date is de ochtend waarop de klant wakker werd; de nacht ervoor hoort
// erbij. Daarom staat elke nacht als "zo 18 → ma 19 okt". Tik een staafje
// voor die nacht; de lijst eronder toont alle gelogde nachten met bedtijd.

import { useCallback, useEffect, useState } from 'react'
import { Moon, ChevronDown } from 'lucide-react'

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

// Lokale datum, niet toISOString (dat is UTC en schuift na middernacht een dag).
const lokaalIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dagKort = (iso) => {
  try { return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }) } catch { return iso }
}
const maandKort = (iso) => {
  try { return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { month: 'short' }) } catch { return '' }
}
// "zo 18 → ma 19 okt": de avond ervoor tot de ochtend van log_date.
const nachtLabel = (iso) => {
  const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() - 1)
  return `${dagKort(lokaalIso(d))} → ${dagKort(iso)} ${maandKort(iso)}`
}
const hhmm = (t) => (t ? String(t).slice(0, 5) : null)
// Gemiddelde klokijd; bedtijden na middernacht tellen als laat, niet als vroeg.
const gemTijd = (tijden, naMiddernachtIsLaat) => {
  const min = tijden.filter(Boolean).map(t => {
    const [h, m] = String(t).split(':').map(Number)
    let v = h * 60 + m
    if (naMiddernachtIsLaat && v < 12 * 60) v += 24 * 60
    return v
  })
  if (!min.length) return null
  const g = Math.round(min.reduce((a, b) => a + b, 0) / min.length) % (24 * 60)
  return `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`
}
const uurTekst = (u) => `${String(u).replace('.', ',')} uur`

export default function SlaapInsight({ db, client, isMobile }) {
  const [nachten, setNachten] = useState([])
  const [laden, setLaden] = useState(true)
  const [gekozen, setGekozen] = useState(null) // iso van de aangetikte nacht
  const [lijstOpen, setLijstOpen] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) { setLaden(false); return }
    const vanaf = new Date()
    vanaf.setDate(vanaf.getDate() - (NACHTEN - 1))
    const vanafIso = lokaalIso(vanaf)
    const { data, error } = await db.supabase
      .from('sleep_logs')
      .select('log_date, hours_slept, quality, struggles, notes, bedtime, wake_time')
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
      const iso = lokaalIso(d)
      const rij = perDag.get(iso)
      lijst.push({
        iso,
        uren: rij?.hours_slept != null ? Number(rij.hours_slept) : null,
        cijfer: rij?.quality != null ? Number(rij.quality) : null,
        tekst: [rij?.struggles, rij?.notes].filter(Boolean).join(' · ') || null,
        bed: hhmm(rij?.bedtime),
        op: hhmm(rij?.wake_time),
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
  const maxUren = Math.max(9, ...gelogd.map(n => n.uren))
  const gemBed = gemTijd(gelogd.map(n => n.bed), true)
  const gemOp = gemTijd(gelogd.map(n => n.op), false)
  const kortste = gelogd.reduce((a, n) => (n.uren < a.uren ? n : a), gelogd[0])
  const onder7 = gelogd.filter(n => n.uren < 7).length
  // Standaard de laatst gelogde nacht in beeld.
  const actief = nachten.find(n => n.iso === gekozen) || [...gelogd].pop()
  const zwak = 'rgba(255,255,255,0.4)'

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Moon size={13} color="rgba(255,255,255,0.5)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Slaap · laatste {NACHTEN} nachten ({nachtLabel(nachten[0].iso).split(' → ')[0]} t/m {dagKort(nachten[nachten.length - 1].iso)} {maandKort(nachten[nachten.length - 1].iso)})
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            Gemiddeld {gemUren} uur
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {gemCijfer != null ? ` · cijfer ${gemCijfer}` : ''}
              {' · '}{gelogd.length} van {NACHTEN} gelogd
            </span>
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: zwak, marginTop: 1 }}>
            {gemBed ? `Naar bed ±${gemBed}` : ''}{gemBed && gemOp ? ' · ' : ''}{gemOp ? `op ±${gemOp}` : ''}
            {(gemBed || gemOp) ? ' · ' : ''}{onder7} {onder7 === 1 ? 'nacht' : 'nachten'} onder 7 uur
            {kortste ? ` · kortst ${uurTekst(kortste.uren)} (${nachtLabel(kortste.iso)})` : ''}
          </div>
        </div>
      </div>

      {/* Hoogte is hoeveel uur, kleur is hoe het voelde. Acht uur slecht slapen
          is een hoge rode balk — precies wat je wilt zien. */}
      <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', alignItems: 'flex-end' }}>
        {nachten.map((n, i) => {
          const pct = n.uren != null ? Math.min(100, (n.uren / maxUren) * 100) : 0
          return (
            <div key={n.iso} style={{ flex: 1, textAlign: 'center', cursor: n.uren != null ? 'pointer' : 'default' }}
              onClick={() => n.uren != null && setGekozen(n.iso)}>
              <div
                title={n.uren != null
                  ? `${nachtLabel(n.iso)}: ${n.uren} uur${n.cijfer != null ? ` · ${n.cijfer}/10` : ''}${n.tekst ? ` — ${n.tekst}` : ''}`
                  : `${nachtLabel(n.iso)}: niets gelogd`}
                style={{
                  height: 30, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  outline: actief?.iso === n.iso ? '1.5px solid #fff' : 'none', outlineOffset: 1,
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
                color: actief?.iso === n.iso ? '#fff' : i === nachten.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              }}>
                {dagLetter(n.iso)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
        Letter = ochtend van wakker worden · tik een staafje
      </div>

      {/* De aangetikte nacht, voluit. */}
      {actief && <NachtRegel n={actief} vet />}

      {/* Alle gelogde nachten, nieuwste boven. Wat de klant schreef staat
          erbij: vaak de enige regel die zegt waar het gesprek over moet gaan. */}
      {gelogd.length > 1 && (
        <button onClick={() => setLijstOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, padding: 0, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.55)', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <ChevronDown size={12} strokeWidth={3} style={{ transform: lijstOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          Alle {gelogd.length} nachten
        </button>
      )}
      {lijstOpen && [...gelogd].reverse().map(n => <NachtRegel key={n.iso} n={n} />)}
    </div>
  )
}

// Eén nacht: "zo 18 → ma 19 okt  23:30 → 06:45  7,3 uur  6/10" + notitie.
function NachtRegel({ n, vet = false }) {
  return (
    <div style={{ marginTop: vet ? 6 : 3, padding: vet ? '6px 8px' : '3px 0', borderRadius: 6, background: vet ? 'rgba(255,255,255,0.05)' : 'none' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px', fontSize: vet ? '0.72rem' : '0.66rem', fontWeight: 800 }}>
        <span style={{ color: '#fff' }}>{nachtLabel(n.iso)}</span>
        {(n.bed || n.op) && <span style={{ color: 'rgba(255,255,255,0.55)' }}>{n.bed || '?'} → {n.op || '?'}</span>}
        <span style={{ color: '#fff' }}>{uurTekst(n.uren)}</span>
        {n.cijfer != null && <span style={{ color: kleurVoorCijfer(n.cijfer) }}>{n.cijfer}/10</span>}
      </div>
      {n.tekst && (
        <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginTop: 1 }}>{n.tekst}</div>
      )}
    </div>
  )
}
