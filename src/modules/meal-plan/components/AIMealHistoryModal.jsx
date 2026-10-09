// src/modules/meal-plan/components/AIMealHistoryModal.jsx
//
// Volledige geschiedenis van wat je hebt gegeten, op basis van consumed_meals.
// Opent vanuit het Inzicht-venster. Zelfde taal als Inzicht: dik wit, geen
// goud, geen dozen, kleur alleen voor het oordeel (groen op doel, oranje
// onder, rood boven).
//
// Van boven naar onder:
//   1. Cijfers over de gekozen periode: gem. kcal, gem. eiwit, dagen gelogd,
//      dagen op doel.
//   2. Verloop: staaf per dag (per week bij een lange periode) met de
//      doellijn. Tik een staaf voor het getal.
//   3. Macro's: gemiddelde eiwit/koolh./vet tegen je doel.
//   4. Logboek: elke gelogde dag, nieuwste eerst; tik om de maaltijden te zien.
//   5. Patronen: wat je het vaakst eet, en hoe laat je eet.
//
// Datums zijn lokaal. De vorige versie knipte de datum uit de UTC-tijd,
// waardoor een maaltijd na 22:00 bij de volgende dag telde. Het venster gaat
// via een portal naar de body: binnen de vaste maaltijdlaag viel het onder de
// onderbalk.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Clock } from 'lucide-react'
import { foodImageFallback } from '../foodImageFallback'

const LIJN = 'rgba(255,255,255,0.08)'
const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'

const PERIODES = [
  { id: 7, label: '7 dagen' },
  { id: 30, label: '30 dagen' },
  { id: 90, label: '90 dagen' },
  { id: 365, label: '1 jaar' },
]

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
const sleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vanSleutel = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const kortDatum = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace(/\.$/, '')

const kcalKleur = (waarde, doel) => {
  if (!doel || !waarde) return 'rgba(255,255,255,0.3)'
  const r = waarde / doel
  if (r >= 0.9 && r <= 1.1) return GROEN
  if (r > 1.1) return ROOD
  return ORANJE
}

const kopje = (tekst, extra = null) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '1.6rem 0 0.75rem' }}>
    <span style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tekst}</span>
    {extra && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{extra}</span>}
  </div>
)

const Cijfer = ({ waarde, label, kleur = '#fff' }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: kleur, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{waarde}</div>
    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
  </div>
)

function MacroRegel({ label, waarde, doel }) {
  const pct = doel > 0 ? Math.min(100, (waarde / doel) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(waarde)}g<span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{doel > 0 ? ` / ${fmt(doel)}g` : ''}</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function AIMealHistoryModal({ isOpen, onClose, db, clientId }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [periode, setPeriode] = useState(30)
  const [maaltijden, setMaaltijden] = useState(null)
  const [doel, setDoel] = useState({ kcal: 0, eiwit: 0, koolh: 0, vet: 0 })
  const [openDag, setOpenDag] = useState(null)
  const [staaf, setStaaf] = useState(null) // index van de aangetikte staaf
  const [limiet, setLimiet] = useState(14)

  useEffect(() => {
    if (!isOpen || !db?.supabase || !clientId) return
    let weg = false
    setMaaltijden(null); setStaaf(null); setLimiet(14)
    const van = plusDagen(new Date(new Date().setHours(0, 0, 0, 0)), -(periode - 1))
    Promise.all([
      db.supabase.from('consumed_meals')
        .select('id, meal_name, meal_type, image_url, calories, protein, carbs, fat, consumed_at')
        .eq('client_id', clientId).gte('consumed_at', van.toISOString())
        .order('consumed_at', { ascending: false })
        .then(r => r, () => ({ data: [] })),
      db.supabase.from('clients').select('target_calories, target_protein, target_carbs, target_fat').eq('id', clientId).maybeSingle()
        .then(r => r, () => ({ data: null })),
    ]).then(([m, c]) => {
      if (weg) return
      setMaaltijden(m?.data || [])
      const k = c?.data || {}
      setDoel({ kcal: Number(k.target_calories) || 0, eiwit: Number(k.target_protein) || 0, koolh: Number(k.target_carbs) || 0, vet: Number(k.target_fat) || 0 })
    })
    return () => { weg = true }
  }, [isOpen, db, clientId, periode])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Per lokale dag: maaltijden en totalen, voor elke dag in de periode.
  const dagen = useMemo(() => {
    const per = {}
    ;(maaltijden || []).forEach(m => {
      if (!m.consumed_at) return
      const k = sleutel(new Date(m.consumed_at))
      const d = (per[k] = per[k] || { k, maaltijden: [], kcal: 0, eiwit: 0, koolh: 0, vet: 0 })
      d.maaltijden.push(m)
      d.kcal += Number(m.calories) || 0
      d.eiwit += parseFloat(m.protein) || 0
      d.koolh += parseFloat(m.carbs) || 0
      d.vet += parseFloat(m.fat) || 0
    })
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    return Array.from({ length: periode }, (_, i) => {
      const k = sleutel(plusDagen(vandaag, -(periode - 1 - i)))
      return per[k] || { k, maaltijden: [], kcal: 0, eiwit: 0, koolh: 0, vet: 0 }
    })
  }, [maaltijden, periode])

  if (!isOpen) return null

  const gelogd = dagen.filter(d => d.maaltijden.length > 0)
  const gem = (veld) => gelogd.length ? gelogd.reduce((t, d) => t + d[veld], 0) / gelogd.length : 0
  const opDoel = doel.kcal ? gelogd.filter(d => d.kcal >= doel.kcal * 0.9 && d.kcal <= doel.kcal * 1.1).length : 0

  // Verloop: per dag, of per week bij meer dan 31 dagen (anders worden de
  // staven haarlijntjes). Een week telt het gemiddelde van de gelogde dagen.
  const staven = periode <= 31
    ? dagen.map(d => ({ label: kortDatum(vanSleutel(d.k)), kcal: d.kcal, gelogd: d.maaltijden.length > 0, sub: `${d.maaltijden.length} ${d.maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'}` }))
    : (() => {
      const uit = []
      for (let i = 0; i < dagen.length; i += 7) {
        const blok = dagen.slice(i, i + 7)
        const met = blok.filter(d => d.maaltijden.length)
        uit.push({
          label: `week van ${kortDatum(vanSleutel(blok[0].k))}`,
          kcal: met.length ? met.reduce((t, d) => t + d.kcal, 0) / met.length : 0,
          gelogd: met.length > 0,
          sub: `gemiddeld · ${met.length}/7 dagen gelogd`,
        })
      }
      return uit
    })()
  const staafMax = Math.max(doel.kcal * 1.25, ...staven.map(s => s.kcal), 1)
  const gekozenStaaf = staaf != null ? staven[staaf] : null

  // Patronen.
  const top = (() => {
    const map = new Map()
    ;(maaltijden || []).forEach(m => {
      const k = String(m.meal_name || '').trim().toLowerCase()
      if (!k) return
      const e = map.get(k) || { naam: m.meal_name, type: m.meal_type, foto: m.image_url, aantal: 0, kcal: 0 }
      e.aantal++; e.kcal += Number(m.calories) || 0
      if (!e.foto && m.image_url) e.foto = m.image_url
      map.set(k, e)
    })
    return [...map.values()].sort((a, b) => b.aantal - a.aantal).slice(0, 8)
  })()
  const uren = Array(24).fill(0)
  ;(maaltijden || []).forEach(m => { if (m.consumed_at) uren[new Date(m.consumed_at).getHours()]++ })
  const urenMax = Math.max(...uren, 1)

  const logboek = [...gelogd].reverse()

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147482100,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem', paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isMobile ? '100%' : 560, height: isMobile ? '94vh' : '88vh',
          background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: isMobile ? '20px 20px 0 0' : 20,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Kop: titel, periode als dropdown, sluiten */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '0.9rem 0.85rem 0.8rem 1rem' : '1rem 1rem 0.9rem 1.25rem', borderBottom: `1px solid ${LIJN}` }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Geschiedenis</div>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select value={periode} onChange={e => setPeriode(Number(e.target.value))} style={{ appearance: 'none', WebkitAppearance: 'none', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', padding: '0 18px 0 0', cursor: 'pointer', outline: 'none' }}>
              {PERIODES.map(p => <option key={p.id} value={p.id} style={{ background: '#0a0a0a' }}>{p.label}</option>)}
            </select>
            <ChevronDown size={15} color="#fff" strokeWidth={2.8} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LIJN}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '1rem 1rem 2rem' : '1.2rem 1.25rem 2rem' }}>
          {maaltijden === null ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Laden…</div>
          ) : gelogd.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>In deze periode is niets gelogd.</div>
          ) : (
            <>
              {/* ── 1. Cijfers ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <Cijfer waarde={fmt(gem('kcal'))} label="gem. kcal" kleur={kcalKleur(gem('kcal'), doel.kcal) === 'rgba(255,255,255,0.3)' ? '#fff' : kcalKleur(gem('kcal'), doel.kcal)} />
                <Cijfer waarde={`${fmt(gem('eiwit'))}g`} label="gem. eiwit" />
                <Cijfer waarde={`${gelogd.length}/${periode}`} label="dagen gelogd" />
                <Cijfer waarde={doel.kcal ? `${Math.round((opDoel / gelogd.length) * 100)}%` : '–'} label="op doel" kleur={doel.kcal ? (opDoel / gelogd.length >= 0.7 ? GROEN : opDoel / gelogd.length >= 0.4 ? ORANJE : ROOD) : '#fff'} />
              </div>

              {/* ── 2. Verloop ── */}
              {kopje(periode <= 31 ? 'Verloop per dag' : 'Verloop per week', doel.kcal ? `doel ${fmt(doel.kcal)} kcal` : null)}
              <div style={{ minHeight: 34, marginBottom: 6 }}>
                {gekozenStaaf ? (
                  <>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{fmt(gekozenStaaf.kcal)} kcal <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>· {gekozenStaaf.label}</span></div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{gekozenStaaf.gelogd ? gekozenStaaf.sub : 'niets gelogd'}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Tik een staaf voor het getal.</div>
                )}
              </div>
              <div style={{ position: 'relative', height: 130, display: 'flex', alignItems: 'flex-end', gap: staven.length > 20 ? 2 : 4 }}>
                {doel.kcal > 0 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(doel.kcal / staafMax) * 100}%`, borderTop: '1px dashed rgba(255,255,255,0.35)', pointerEvents: 'none' }} />}
                {staven.map((s, i) => (
                  <button key={i} onClick={() => setStaaf(staaf === i ? null : i)} aria-label={`${s.label} ${fmt(s.kcal)} kcal`} style={{ flex: 1, height: '100%', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'flex-end', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <span style={{ width: '100%', height: `${Math.max(s.gelogd ? 3 : 1.5, (s.kcal / staafMax) * 100)}%`, borderRadius: staven.length > 20 ? 2 : 5, background: s.gelogd ? kcalKleur(s.kcal, doel.kcal) : 'rgba(255,255,255,0.08)', opacity: staaf === null || staaf === i ? 1 : 0.4 }} />
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                <span>{staven[0]?.label.replace('week van ', '')}</span><span>vandaag</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.9rem', marginTop: '0.6rem', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: GROEN }} />op doel (±10%)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ORANJE }} />onder</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ROOD }} />boven</span>
              </div>

              {/* ── 3. Macro's ── */}
              {kopje('Gemiddelde macro\'s per gelogde dag')}
              <MacroRegel label="Eiwit" waarde={gem('eiwit')} doel={doel.eiwit} />
              <MacroRegel label="Koolhydraten" waarde={gem('koolh')} doel={doel.koolh} />
              <MacroRegel label="Vet" waarde={gem('vet')} doel={doel.vet} />

              {/* ── 4. Logboek ── */}
              {kopje('Logboek', `${gelogd.length} ${gelogd.length === 1 ? 'dag' : 'dagen'}`)}
              {logboek.slice(0, limiet).map((d, i) => {
                const open = openDag === d.k
                const datum = vanSleutel(d.k)
                return (
                  <div key={d.k} style={{ borderTop: i ? `1px solid ${LIJN}` : 'none' }}>
                    <button onClick={() => setOpenDag(open ? null : d.k)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.7rem 0', background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: kcalKleur(d.kcal, doel.kcal) }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 900, textTransform: 'capitalize' }}>{datum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' }).replace(/\.$/, '')}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{d.maaltijden.length} {d.maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'} · {fmt(d.eiwit)}g eiwit</span>
                      </span>
                      <span style={{ flexShrink: 0, fontSize: '0.9rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.kcal)}<span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}> kcal</span></span>
                      <ChevronDown size={16} color="rgba(255,255,255,0.45)" strokeWidth={2.6} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {open && (
                      <div style={{ padding: '0 0 0.7rem 18px' }}>
                        {[...d.maaltijden].sort((a, b) => new Date(a.consumed_at) - new Date(b.consumed_at)).map(m => {
                          const naam = m.meal_name || 'Maaltijd'
                          const foto = m.image_url || foodImageFallback(naam, m.meal_type, 120)
                          return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.35rem 0' }}>
                              <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                                <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{new Date(m.consumed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                              <span style={{ flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>{fmt(m.calories)} kcal</span>
                                <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmt(m.protein)}g eiwit</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {logboek.length > limiet && (
                <button onClick={() => setLimiet(l => l + 14)} style={{ marginTop: 6, width: '100%', minHeight: 44, background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 12, color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>Meer dagen</button>
              )}

              {/* ── 5. Patronen ── */}
              {top.length > 0 && kopje('Wat je het vaakst eet')}
              {top.map((p, i) => (
                <div key={p.naam + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0', borderTop: i ? `1px solid ${LIJN}` : 'none' }}>
                  <span style={{ width: 16, flexShrink: 0, fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{i + 1}</span>
                  <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${p.foto || foodImageFallback(p.naam, p.type, 120)})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.naam}</span>
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>gem. {fmt(p.kcal / p.aantal)} kcal</span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{p.aantal}×</span>
                </div>
              ))}

              {kopje('Hoe laat je eet', <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} strokeWidth={2.6} /> per uur</span>)}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
                {uren.map((c, h) => (
                  <div key={h} title={`${h}:00 · ${c}`} style={{ flex: 1, height: `${Math.max(2, (c / urenMax) * 100)}%`, borderRadius: 2, background: c ? '#fff' : 'rgba(255,255,255,0.06)', opacity: c ? 0.35 + (c / urenMax) * 0.65 : 1 }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                <span>0u</span><span>6u</span><span>12u</span><span>18u</span><span>24u</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
