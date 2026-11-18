// src/modules/steps/StappenInzicht.jsx
//
// Inzicht in je stappen (18 nov 2026, Kersten: "zo'n zelfde modal als
// slaap"). Opent vanaf de stappenpil en de stappenband in de agenda op home.
//  · de gekozen dag (standaard vandaag) met Invullen/Aanpassen
//  · tips bovenaan (stappenTips.js), algemene tips uitklapbaar
//  · de week ma t/m zo met de doellijn, pijlen naar vorige weken
//  · de afgelopen weken onder elkaar, tik om die week te zien
//  · Apple Health / Health Connect koppelen
// Op de telefoon schermvullend. Opslag: client_step_logs via StappenService.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { X, ChevronLeft, ChevronRight, ChevronDown, Pencil, Lightbulb, Footprints, Smartphone, Check } from 'lucide-react'
import { vandaagIso } from './StappenService'
import { isGekoppeld } from './telefoonStappen'
import { stappenTips, ALGEMENE_STAPPEN_TIPS } from './stappenTips'

const WEKEN = 8
const BALK = 92 // px, hoogste staaf
const GROEN = '#10b981'
const GOUD = '#facc15'
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kort = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k` : String(n))
const plusDagen = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return vandaagIso(d) }
const maandagVan = (iso) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return vandaagIso(d) }
const kortDatum = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')
const sub = { fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }
const scheiding = { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, marginTop: 14 }
const kaal = {
  width: 40, height: 40, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const pijl = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 32, height: 40, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none',
  color: '#fff', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const wit = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, padding: '0 0.9rem', borderRadius: 12,
  background: '#fff', color: '#0a0a0a', border: 'none', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 900,
  cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
}
const linkKnop = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

export default function StappenInzicht({ db, client, doel, isMobile, bron, onKoppel, onSluit, onBewaar }) {
  const vandaag = vandaagIso()
  const huidigeMa = maandagVan(vandaag)
  const vroegsteMa = plusDagen(huidigeMa, -7 * (WEKEN - 1))
  const [rijen, setRijen] = useState(null) // { iso: { steps, source } }
  const [versie, setVersie] = useState(0)
  const [week, setWeek] = useState(huidigeMa)
  const [gekozen, setGekozen] = useState(vandaag)
  const [bewerk, setBewerk] = useState(null) // { iso, tekst }
  const [bezig, setBezig] = useState(false)
  const [meerTips, setMeerTips] = useState(false)
  const [alleTips, setAlleTips] = useState(false)
  const [koppelen, setKoppelen] = useState(false)
  const [gekoppeld, setGekoppeld] = useState(() => isGekoppeld())

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase.from('client_step_logs').select('date, steps, source')
      .eq('client_id', client.id).gte('date', vroegsteMa).lte('date', plusDagen(huidigeMa, 6))
      .then(({ data }) => {
        if (weg) return
        const m = {}
        for (const r of data || []) m[String(r.date).slice(0, 10)] = { steps: Number(r.steps) || 0, source: r.source }
        setRijen(m)
      }, () => { if (!weg) setRijen({}) })
    return () => { weg = true }
  }, [db, client?.id, versie, vroegsteMa, huidigeMa])

  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') (bewerk ? setBewerk(null) : onSluit()) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [bewerk, onSluit])

  const stappen = (iso) => rijen?.[iso]?.steps || 0
  const weekCijfers = (ma) => {
    const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(ma, i)).filter(iso => iso <= vandaag)
    const gevuld = dagen.filter(iso => stappen(iso) > 0)
    const totaal = gevuld.reduce((s, iso) => s + stappen(iso), 0)
    return {
      dagen: dagen.length, gevuld: gevuld.length, totaal,
      gemiddeld: gevuld.length ? totaal / gevuld.length : null,
      gehaald: gevuld.filter(iso => doel > 0 && stappen(iso) >= doel).length,
    }
  }

  // Tips uit de laatste 14 afgeronde dagen (vandaag loopt nog).
  const tips = useMemo(() => {
    if (!rijen) return []
    const dagen = Array.from({ length: 14 }, (_, i) => plusDagen(vandaag, -14 + i)).map(iso => ({ iso, steps: rijen[iso]?.steps || 0 }))
    const kg = Number(client?.current_weight) || null
    return stappenTips(dagen, doel, { gewichtKg: kg, gekoppeld })
  }, [rijen, doel, vandaag, client?.current_weight, gekoppeld])

  const telefoon = isMobile || (typeof window !== 'undefined' && window.innerWidth <= 768)

  const bewaar = async () => {
    if (!bewerk || bezig) return
    const n = Math.max(0, Math.min(200000, parseInt(String(bewerk.tekst).replace(/\D/g, ''), 10) || 0))
    setBezig(true)
    try {
      await onBewaar?.(n, bewerk.iso)
      setRijen(r => ({ ...(r || {}), [bewerk.iso]: { steps: n, source: 'handmatig' } }))
      setGekozen(bewerk.iso)
      setBewerk(null)
      setVersie(v => v + 1)
    } finally { setBezig(false) }
  }

  const deze = weekCijfers(week)
  const vorige = weekCijfers(plusDagen(week, -7))
  const zichtbaar = meerTips ? tips : tips.slice(0, 3)
  const gekozenStappen = stappen(gekozen)
  const gekozenPct = doel > 0 ? Math.min(100, (gekozenStappen / doel) * 100) : 0
  const hoogste = Math.max(doel, ...Array.from({ length: 7 }, (_, i) => stappen(plusDagen(week, i))), 1) * 1.08
  const verschil = (nu, toen) => {
    if (nu == null || toen == null) return null
    const d = nu - toen
    if (Math.abs(d) < 50) return null
    return <span style={{ color: d > 0 ? GROEN : '#ef4444', fontWeight: 900 }}>{d > 0 ? '+' : '−'}{nl(Math.abs(d))}</span>
  }
  const dagTitel = (iso) => (iso === vandaag ? 'Vandaag' : iso === plusDagen(vandaag, -1) ? 'Gisteren'
    : new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' }))

  return createPortal(
    <div onClick={onSluit} style={{
      position: 'fixed', inset: 0, zIndex: 2147483100,
      background: telefoon ? '#0a0a0a' : 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: telefoon ? 0 : '1rem',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={telefoon ? {
        width: '100%', height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#0a0a0a', boxSizing: 'border-box',
        padding: 'calc(0.9rem + env(safe-area-inset-top, 0px)) 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px))',
      } : {
        width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Kop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {bewerk
            ? <button onClick={() => setBewerk(null)} aria-label="Terug" style={kaal}><ChevronLeft size={20} strokeWidth={2.8} /></button>
            : <div style={{ width: 40 }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={sub}>{bewerk ? 'Stappen invullen' : 'Inzicht'}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Footprints size={15} strokeWidth={2.6} /> Je stappen
            </div>
          </div>
          <button onClick={onSluit} aria-label="Sluiten" style={kaal}><X size={20} strokeWidth={2.8} /></button>
        </div>

        {bewerk ? (
          <>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 14, textTransform: 'capitalize' }}>
              {dagTitel(bewerk.iso)}
            </div>
            <input
              autoFocus type="text" inputMode="numeric" pattern="[0-9]*"
              value={bewerk.tekst}
              onChange={(e) => setBewerk(b => ({ ...b, tekst: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              onKeyDown={(e) => { if (e.key === 'Enter') bewaar() }}
              placeholder="0"
              style={{
                width: '100%', minHeight: 66, padding: '0 0.9rem', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                color: '#fff', fontFamily: 'inherit', outline: 'none', fontSize: '2rem', fontWeight: 900,
                letterSpacing: '-0.03em', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
              }}
            />
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '8px 0 16px' }}>
              Lees het getal af van je telefoon of horloge. Doel: {nl(doel)}
            </div>
            <button onClick={bewaar} disabled={bezig} style={{ ...wit, width: '100%', height: 52, borderRadius: 14, fontSize: '0.95rem', opacity: bezig ? 0.6 : 1 }}>
              <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : 'Opslaan'}
            </button>
          </>
        ) : rijen === null ? <div style={{ height: 300 }} /> : (
          <>
            {/* Gekozen dag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={sub}>{dagTitel(gekozen)}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {nl(gekozenStappen)}
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>/ {nl(doel)}</span>
                </div>
              </div>
              {gekozen <= vandaag && (
                <button onClick={() => setBewerk({ iso: gekozen, tekst: gekozenStappen ? String(gekozenStappen) : '' })} style={wit}>
                  <Pencil size={14} strokeWidth={2.8} /> {gekozenStappen ? 'Aanpassen' : 'Invullen'}
                </button>
              )}
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: `${gekozenPct}%`, height: '100%', background: gekozenStappen >= doel ? GROEN : '#fff', transition: 'width 0.35s' }} />
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
              {gekozenStappen >= doel && doel > 0 ? 'Doel gehaald' : `Nog ${nl(Math.max(0, doel - gekozenStappen))} tot je doel`}
              {rijen[gekozen]?.source === 'telefoon' ? ' · van je telefoon' : ''}
            </div>

            {/* Tips */}
            <div style={{ ...scheiding, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
              {zichtbaar.map(t => (
                <div key={t.titel}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 900, color: GOUD, letterSpacing: '0.1em' }}>
                      <Lightbulb size={15} strokeWidth={2.6} color={GOUD} /> TIP
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{t.titel}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{t.tekst}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {tips.length > 3
                ? <button onClick={() => setMeerTips(v => !v)} style={linkKnop}>{meerTips ? 'Minder' : `Nog ${tips.length - 3} tip${tips.length - 3 > 1 ? 's' : ''}`}</button>
                : <span />}
              <button onClick={() => setAlleTips(v => !v)} style={linkKnop}>
                Alle stappentips <ChevronDown size={13} strokeWidth={2.6} style={{ transform: alleTips ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
            {alleTips && (
              <ul style={{ margin: '10px 0 0', padding: '0 0 0 1rem', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {ALGEMENE_STAPPEN_TIPS.map(t => <li key={t} style={{ marginBottom: 4 }}>{t}</li>)}
              </ul>
            )}

            {/* Week */}
            <div style={{ ...scheiding, marginBottom: 14 }}>
              <div style={{ position: 'relative', display: 'flex', gap: 6, margin: '0 -4px 8px' }}>
                <button onClick={() => week > vroegsteMa && setWeek(plusDagen(week, -7))} disabled={week <= vroegsteMa} aria-label="Vorige week" style={{ ...pijl, left: -16, opacity: week <= vroegsteMa ? 0.25 : 1 }}>
                  <ChevronLeft size={18} strokeWidth={3} />
                </button>
                {['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'].map((l, i) => {
                  const iso = plusDagen(week, i)
                  const d = new Date(`${iso}T12:00:00`)
                  return (
                    <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.15, color: iso === gekozen ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                      <div style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em' }}>{l}</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{d.getDate()}/{d.getMonth() + 1}</div>
                    </div>
                  )
                })}
                <button onClick={() => week < huidigeMa && setWeek(plusDagen(week, 7))} disabled={week >= huidigeMa} aria-label="Volgende week" style={{ ...pijl, right: -16, opacity: week >= huidigeMa ? 0.25 : 1 }}>
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Staafjes: groen = doel gehaald. De stippellijn is je doel. */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, margin: '0 -4px 14px' }}>
                {doel > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: (doel / hoogste) * BALK,
                    borderTop: '1px dashed rgba(16,185,129,0.55)', pointerEvents: 'none',
                  }} />
                )}
                {Array.from({ length: 7 }, (_, i) => {
                  const iso = plusDagen(week, i)
                  const n = stappen(iso)
                  const toekomst = iso > vandaag
                  const h = n ? Math.max(6, (n / hoogste) * BALK) : 0
                  const aan = iso === gekozen
                  return (
                    <button key={iso} onClick={() => !toekomst && setGekozen(iso)} disabled={toekomst} aria-label={kortDatum(iso)} style={{
                      flex: 1, minWidth: 0, height: '100%', padding: 0, background: 'none', border: 'none', cursor: toekomst ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 7,
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {n > 0 && <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{kort(n)}</span>}
                      <div style={{
                        width: '100%', height: n ? h : 8, borderRadius: 6,
                        background: n ? (doel > 0 && n >= doel ? GROEN : 'rgba(255,255,255,0.35)') : 'transparent',
                        border: n ? 'none' : `1px dashed rgba(255,255,255,${toekomst ? 0.1 : 0.22})`,
                        outline: aan ? '2px solid #fff' : 'none', outlineOffset: 2,
                      }} />
                    </button>
                  )
                })}
              </div>

              {deze.gevuld === 0 ? (
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Geen stappen in deze week.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <Cijfer label="Gem. per dag" waarde={nl(deze.gemiddeld)} extra={verschil(deze.gemiddeld, vorige.gemiddeld)} />
                  <Cijfer label="Doel gehaald" waarde={`${deze.gehaald}/${deze.dagen}`} kleur={deze.gehaald >= Math.max(1, deze.dagen - 1) ? GROEN : '#fff'} />
                  <Cijfer label="Totaal" waarde={kort(deze.totaal)} />
                </div>
              )}
              {deze.gevuld > 0 && vorige.gevuld > 0 && (
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 }}>t.o.v. de week ervoor</div>
              )}
            </div>

            {/* Afgelopen weken */}
            <div style={{ ...sub, marginBottom: 6 }}>Afgelopen weken</div>
            {Array.from({ length: WEKEN }, (_, i) => plusDagen(huidigeMa, -7 * i)).map(ma => ({ ma, c: weekCijfers(ma) })).filter(w => w.c.gevuld > 0).map(w => (
              <button key={w.ma} onClick={() => { setWeek(w.ma); setGekozen(plusDagen(w.ma, 6) <= vandaag ? plusDagen(w.ma, 6) : vandaag) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.2rem',
                background: w.ma === week ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
                borderRadius: w.ma === week ? 8 : 0, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                fontVariantNumeric: 'tabular-nums', touchAction: 'manipulation',
              }}>
                <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 800 }}>
                  {w.ma === huidigeMa ? 'Deze week' : `${kortDatum(w.ma)} – ${kortDatum(plusDagen(w.ma, 6))}`}
                </span>
                <span style={{ width: 60, textAlign: 'right', fontSize: '0.78rem', fontWeight: 900 }}>{nl(w.c.gemiddeld)}</span>
                <span style={{ width: 36, textAlign: 'right', fontSize: '0.78rem', fontWeight: 900, color: w.c.gehaald >= Math.max(1, w.c.dagen - 1) ? GROEN : 'rgba(255,255,255,0.6)' }}>{w.c.gehaald}/{w.c.dagen}</span>
              </button>
            ))}
            <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: 4 }}>gem. per dag · doel gehaald</div>

            {/* Telefoon koppelen: pas hier, niet als popup op home. */}
            {bron && (
              <button
                onClick={async () => {
                  if (gekoppeld) return
                  setKoppelen(true)
                  const ok = await onKoppel?.()
                  setKoppelen(false)
                  setGekoppeld(!!ok)
                  if (ok) setVersie(v => v + 1)
                }}
                disabled={gekoppeld || koppelen}
                style={{
                  width: '100%', minHeight: 44, marginTop: 18, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent',
                  border: `1px solid ${gekoppeld ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  color: gekoppeld ? GROEN : 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit',
                  cursor: gekoppeld ? 'default' : 'pointer', touchAction: 'manipulation',
                }}
              >
                {gekoppeld ? <Check size={14} strokeWidth={3} /> : <Smartphone size={14} strokeWidth={2.8} />}
                {koppelen ? 'Bezig…' : gekoppeld ? 'Je telefoon is gekoppeld' : 'Stappen automatisch van je telefoon'}
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

function Cijfer({ label, waarde, extra, kleur = '#fff' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums' }}>{waarde}</div>
      {extra && <div style={{ fontSize: '0.66rem', fontWeight: 800 }}>{extra}</div>}
    </div>
  )
}
