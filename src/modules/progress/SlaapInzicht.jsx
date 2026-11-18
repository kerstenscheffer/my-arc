// src/modules/progress/SlaapInzicht.jsx
//
// Inzicht in je slaap (18 nov 2026, Kersten): tik je op een nacht die al
// gelogd is, dan kom je hier en niet opnieuw in het logscherm. Hier zie je:
//  · de gelogde nacht, met 'Log aanpassen' (terug naar de stappen)
//  · de week (ma t/m zo, op de ochtend van wakker worden) met pijltjes terug
//  · de afgelopen weken onder elkaar, tik om die week te zien
//  · persoonlijke tips bovenaan (slaapTips.js), algemene tips uitklapbaar
// Wordt getoond in SlaapLogBlad (SlaapKnop.jsx), dus op home en op tracking.

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Lightbulb, ChevronDown, Sparkles } from 'lucide-react'
import { ALGEMENE_TIPS, cijfers, persoonlijkeTips, maandagVan, plusDagen, klokTekst, nl, lokaalIso } from './slaapTips'

const WEKEN = 8
const kleur = (q) => (q == null ? 'rgba(255,255,255,0.3)' : q >= 7 ? '#10b981' : q >= 5 ? '#f59e0b' : '#ef4444')
const kortDatum = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')
const sub = { fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }
const kaart = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.85rem' }
const ikoonKnop = {
  width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0,
}

export default function SlaapInzicht({ db, client, logDatum, versie = 0, onAanpassen }) {
  const [nachten, setNachten] = useState(null) // null = laden
  const [week, setWeek] = useState(() => maandagVan(logDatum))
  const [gekozen, setGekozen] = useState(logDatum)
  const [meerTips, setMeerTips] = useState(false)
  const [alleTips, setAlleTips] = useState(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    const vanaf = plusDagen(maandagVan(logDatum), -7 * (WEKEN - 1))
    db.supabase.from('sleep_logs')
      .select('id, log_date, bedtime, wake_time, hours_slept, quality, struggles')
      .eq('client_id', client.id).gte('log_date', vanaf).lte('log_date', plusDagen(maandagVan(logDatum), 6))
      .order('log_date', { ascending: true })
      .then(({ data }) => { if (!weg) setNachten(data || []) }, () => { if (!weg) setNachten([]) })
    return () => { weg = true }
  }, [db, client?.id, logDatum, versie])

  const perDag = useMemo(() => {
    const m = {}
    for (const n of nachten || []) m[String(n.log_date).slice(0, 10)] = n
    return m
  }, [nachten])

  const nachtenVan = (maandag) => Array.from({ length: 7 }, (_, i) => perDag[plusDagen(maandag, i)]).filter(Boolean)
  const dezeWeek = useMemo(() => cijfers(nachtenVan(week)), [perDag, week]) // eslint-disable-line react-hooks/exhaustive-deps
  const vorigeWeek = useMemo(() => cijfers(nachtenVan(plusDagen(week, -7))), [perDag, week]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tips uit de laatste 14 nachten tot en met de gelogde nacht.
  const tips = useMemo(() => {
    const van = plusDagen(logDatum, -13)
    return persoonlijkeTips((nachten || []).filter(n => n.log_date >= van && n.log_date <= logDatum))
  }, [nachten, logDatum])

  const weken = useMemo(() => Array.from({ length: WEKEN }, (_, i) => plusDagen(maandagVan(logDatum), -7 * i))
    .map(ma => ({ ma, c: cijfers(nachtenVan(ma)) })), [perDag, logDatum]) // eslint-disable-line react-hooks/exhaustive-deps

  if (nachten === null) return <div style={{ height: 260 }} />

  const nacht = perDag[gekozen]
  const huidigeMa = maandagVan(logDatum)
  const vroegsteMa = plusDagen(huidigeMa, -7 * (WEKEN - 1))
  const weekTitel = week === huidigeMa ? 'Deze week'
    : week === plusDagen(huidigeMa, -7) ? 'Vorige week'
    : `${kortDatum(week)} – ${kortDatum(plusDagen(week, 6))}`
  const verschil = (nu, toen, eenheid, dec = 1) => {
    if (nu == null || toen == null) return null
    const d = nu - toen
    if (Math.abs(d) < 0.05) return null
    return <span style={{ color: d > 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>{d > 0 ? '+' : '−'}{nl(Math.abs(d), dec)}{eenheid}</span>
  }
  const vastheid = (s) => (s == null ? '—' : s <= 30 ? 'vast' : s <= 60 ? 'wisselt wat' : 'wisselt veel')
  const zichtbaar = meerTips ? tips : tips.slice(0, 3)

  return (
    <div>
      {/* De gekozen nacht + aanpassen */}
      <div style={{ ...kaart, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={sub}>{gekozen === logDatum ? 'Gelogd' : new Date(`${gekozen}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            {nacht ? (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {nl(Number(nacht.hours_slept))} uur
                  {nacht.quality != null && <span style={{ fontSize: '1rem', color: kleur(nacht.quality), marginLeft: 10 }}>{nacht.quality}/10</span>}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                  {nacht.bedtime ? `${String(nacht.bedtime).slice(0, 5)} → ${String(nacht.wake_time || '').slice(0, 5)}` : ''}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Niet gelogd</div>
            )}
          </div>
          {gekozen <= lokaalIso(new Date()) && (
            <button onClick={() => onAanpassen?.(gekozen)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 0.9rem', borderRadius: 12,
              background: '#fff', color: '#0a0a0a', border: 'none', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 900,
              cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
            }}>
              <Pencil size={14} strokeWidth={2.8} /> {nacht ? 'Aanpassen' : 'Loggen'}
            </button>
          )}
        </div>
        {nacht?.struggles && (
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.4 }}>“{nacht.struggles}”</div>
        )}
      </div>

      {/* Persoonlijke tips */}
      <div style={{ ...sub, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <Sparkles size={12} strokeWidth={2.6} color="#10b981" /> Voor jou
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
        {zichtbaar.map(t => (
          <div key={t.titel} style={{ ...kaart, borderLeft: '3px solid #10b981', padding: '0.7rem 0.8rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginBottom: 3 }}>{t.titel}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45 }}>{t.tekst}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        {tips.length > 3 ? (
          <button onClick={() => setMeerTips(v => !v)} style={linkKnop}>{meerTips ? 'Minder' : `Nog ${tips.length - 3} tip${tips.length - 3 > 1 ? 's' : ''}`}</button>
        ) : <span />}
        <button onClick={() => setAlleTips(v => !v)} style={linkKnop}>
          <Lightbulb size={13} strokeWidth={2.6} color="#facc15" /> Alle slaaptips
          <ChevronDown size={13} strokeWidth={2.6} style={{ transform: alleTips ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>
      {alleTips && (
        <ul style={{ margin: '-6px 0 16px', padding: '0 0 0 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          {ALGEMENE_TIPS.map(t => <li key={t} style={{ marginBottom: 4 }}>{t}</li>)}
        </ul>
      )}

      {/* Week */}
      <div style={{ ...kaart, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={() => week > vroegsteMa && setWeek(plusDagen(week, -7))} disabled={week <= vroegsteMa} aria-label="Vorige week" style={{ ...ikoonKnop, opacity: week <= vroegsteMa ? 0.3 : 1 }}>
            <ChevronLeft size={17} strokeWidth={2.8} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>{weekTitel}</div>
          <button onClick={() => week < huidigeMa && setWeek(plusDagen(week, 7))} disabled={week >= huidigeMa} aria-label="Volgende week" style={{ ...ikoonKnop, opacity: week >= huidigeMa ? 0.3 : 1 }}>
            <ChevronRight size={17} strokeWidth={2.8} />
          </button>
        </div>

        {/* Staafjes ma t/m zo: hoogte = uren, kleur = cijfer. Tik = die nacht bovenaan. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 6 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const iso = plusDagen(week, i)
            const n = perDag[iso]
            const u = Number(n?.hours_slept)
            const h = Number.isFinite(u) ? Math.max(8, Math.min(1, u / 10) * 92) : 0
            const aan = iso === gekozen
            return (
              <button key={iso} onClick={() => setGekozen(iso)} aria-label={kortDatum(iso)} style={{
                flex: 1, height: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 3,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {n && <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{nl(u)}</span>}
                <div style={{
                  width: '100%', height: n ? h : 8, borderRadius: 6,
                  background: n ? kleur(n.quality) : 'transparent',
                  border: n ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                  outline: aan ? '2px solid #fff' : 'none', outlineOffset: 2,
                }} />
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['M', 'D', 'W', 'D', 'V', 'Z', 'Z'].map((l, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', fontWeight: 800, color: plusDagen(week, i) === gekozen ? '#fff' : 'rgba(255,255,255,0.4)' }}>{l}</div>
          ))}
        </div>

        {dezeWeek.aantal === 0 ? (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Geen nachten gelogd in deze week.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Cijfer label="Gem. uren" waarde={nl(dezeWeek.uren)} extra={verschil(dezeWeek.uren, vorigeWeek.uren, 'u')} />
            <Cijfer label="Gem. cijfer" waarde={nl(dezeWeek.kwaliteit)} kleurWaarde={kleur(dezeWeek.kwaliteit)} extra={verschil(dezeWeek.kwaliteit, vorigeWeek.kwaliteit, '')} />
            <Cijfer label="Bedtijd" waarde={klokTekst(dezeWeek.bed)} extra={<span style={{ color: 'rgba(255,255,255,0.45)' }}>{vastheid(dezeWeek.bedSpreiding)}</span>} />
          </div>
        )}
        {dezeWeek.aantal > 0 && vorigeWeek.aantal > 0 && (
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 }}>t.o.v. de week ervoor</div>
        )}
      </div>

      {/* Afgelopen weken */}
      <div style={{ ...sub, marginBottom: 6 }}>Afgelopen weken</div>
      <div>
        {weken.filter(w => w.c.aantal > 0).map(w => (
          <button key={w.ma} onClick={() => { setWeek(w.ma); setGekozen(plusDagen(w.ma, 6) <= logDatum ? plusDagen(w.ma, 6) : logDatum) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.2rem',
            background: w.ma === week ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
            borderRadius: w.ma === week ? 8 : 0, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
            fontVariantNumeric: 'tabular-nums', touchAction: 'manipulation',
          }}>
            <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 800 }}>
              {w.ma === huidigeMa ? 'Deze week' : `${kortDatum(w.ma)} – ${kortDatum(plusDagen(w.ma, 6))}`}
              <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}> · {w.c.aantal}/7</span>
            </span>
            <span style={{ width: 46, textAlign: 'right', fontSize: '0.78rem', fontWeight: 900 }}>{nl(w.c.uren)}u</span>
            <span style={{ width: 30, textAlign: 'right', fontSize: '0.78rem', fontWeight: 900, color: kleur(w.c.kwaliteit) }}>{nl(w.c.kwaliteit)}</span>
            <span style={{ width: 44, textAlign: 'right', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{klokTekst(w.c.bed)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Cijfer({ label, waarde, extra, kleurWaarde = '#fff' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: kleurWaarde, fontVariantNumeric: 'tabular-nums' }}>{waarde}</div>
      {extra && <div style={{ fontSize: '0.66rem', fontWeight: 800 }}>{extra}</div>}
    </div>
  )
}

const linkKnop = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.5)',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
