// src/modules/business-os/Aanbod.jsx
//
// Aanbod-rekenaar (23 nov 2026): puntjes-menu → Aanbod. Kersten denkt zijn
// vervolgaanbod uit in drie tiers en laat het in de eindcall op zijn scherm zien.
// Twee standen:
//   Rekenen     per tier de totaalprijs bij de gekozen duur, kosten en uren, en
//               daaruit omzet, partner-aandeel, wat overblijft en per uur:
//               gewoon en bij vooruitbetalen naast elkaar.
//   Laten zien  alleen de drie tiers met onderdelen en prijs. Kosten, uren en
//               partner staan dan niet in de pagina, ook niet verborgen.
// Vooruitbetalen geeft korting (procent in de stand Rekenen, standaard 20).
// Borg verrekenen is een losse schakelaar (standaard uit): het bedrag gaat dan
// van het totaal af, de korting rekent over wat er daarna overblijft.
// Sommen in aanbodData.js (reken), opslag in aanbodOpslag.js (één rij per coach
// in business_os_aanbod). Er gaat niets naar klanten of leads.
// De laatst gekozen stand blijft per apparaat staan, zodat hij het scherm voor
// een call alvast op Laten zien kan zetten.

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { DUREN, TIERS, HUIDIGE_PRIJZEN, prijzen, reken, euro, leesGetal } from './aanbodData'
import { laadAanbod, bewaarAanbod } from './aanbodOpslag'

const C = {
  wit: colors.textPrimary,
  zacht: colors.textSecondary,
  rand: colors.borderSubtle,
  lijn: 'rgba(255,255,255,0.18)',
  groen: colors.success,
  rood: colors.danger,
}
const NUM = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }
const LABEL = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }
const STAND_KEY = 'business_os_aanbod_stand'

const leesStand = () => {
  try { return localStorage.getItem(STAND_KEY) === 'tonen' ? 'tonen' : 'rekenen' } catch { return 'rekenen' }
}
const toonGetal = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

// Getalveld: zolang je typt blijft je eigen tekst staan (ook "12,"), de
// waarde gaat als getal of null naar boven.
function GetalVeld({ waarde, onChange, label, placeholder = '', groot = false, breedte = 96 }) {
  const [tekst, setTekst] = useState(null)
  const toon = tekst ?? toonGetal(waarde)
  return (
    <input type="text" inputMode="decimal" aria-label={label} placeholder={placeholder} value={toon}
      onFocus={() => setTekst(toon)}
      onChange={e => { const t = e.target.value.replace(/[^\d.,]/g, ''); setTekst(t); onChange(leesGetal(t)) }}
      onBlur={() => setTekst(null)}
      style={{
        width: groot ? '100%' : breedte, minWidth: 0, boxSizing: 'border-box', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${C.lijn}`, borderRadius: 0, outline: 'none', color: C.wit, fontFamily: 'inherit', ...NUM,
        textAlign: groot ? 'left' : 'right', fontSize: groot ? '1.9rem' : '1rem', fontWeight: groot ? 900 : 800,
        padding: groot ? '4px 0' : '8px 0', minHeight: groot ? 52 : 40,
      }} />
  )
}

// Tekstveld dat meegroeit, zodat een lange regel in een smalle kolom leesbaar blijft.
function TekstVeld({ waarde, onChange, label, autoFocus, onBlur }) {
  const el = useRef(null)
  useLayoutEffect(() => {
    if (!el.current) return
    el.current.style.height = 'auto'
    el.current.style.height = `${el.current.scrollHeight}px`
  })
  return (
    <textarea ref={el} rows={1} aria-label={label} value={waarde} autoFocus={autoFocus} onBlur={onBlur}
      onChange={e => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
      style={{
        flex: 1, minWidth: 0, boxSizing: 'border-box', resize: 'none', overflow: 'hidden', background: 'transparent',
        border: 'none', borderBottom: `1px solid ${C.lijn}`, borderRadius: 0, outline: 'none', color: C.wit,
        fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700, lineHeight: 1.35, padding: '9px 0',
      }} />
  )
}

function Rij({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 44 }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>{label}</span>
      {children}
    </div>
  )
}

function Bedrag({ waarde, kleur = C.wit, groot = false }) {
  return (
    <span style={{ ...NUM, textAlign: 'right', whiteSpace: 'nowrap', fontSize: groot ? '1.2rem' : '1rem', fontWeight: 900, color: waarde === null ? C.zacht : kleur }}>
      {waarde === null ? '–' : euro(waarde)}
    </span>
  )
}

// Eén regel in de uitkomsten (drie cellen in het raster): gewoon en
// vooruitbetalen naast elkaar. kleur krijgt het bedrag en geeft de kleur.
function Uitkomst({ label, gewoon, vooruit, kleur, groot = false }) {
  return (
    <>
      <span style={{ minWidth: 0, fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>{label}</span>
      <Bedrag waarde={gewoon} kleur={kleur?.(gewoon)} groot={groot} />
      <Bedrag waarde={vooruit} kleur={kleur?.(vooruit)} groot={groot} />
    </>
  )
}

function Schakelaar({ aan, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={aan} onClick={() => onChange(!aan)} style={{
      display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: 0, border: 'none', background: 'transparent',
      color: aan ? C.wit : C.zacht, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true" style={{
        position: 'relative', flexShrink: 0, width: 40, height: 24, borderRadius: 12,
        background: aan ? C.groen : 'rgba(255,255,255,0.16)', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: aan ? 19 : 3, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
        }} />
      </span>
      {label}
    </button>
  )
}

// ── Stand Rekenen: één tier ──
function TierRekenen({ naam, tier, duur, g, onVeld, onPrijs, onOnderdelen }) {
  const p = prijzen(tier, duur, g)
  const r = reken(tier, duur, g.partnerPct, p ? p.teBetalen : null)
  const vu = reken(tier, duur, g.partnerPct, p ? p.vooruit : null)
  const roodOnderNul = (goed) => (w) => (w !== null && w < 0 ? C.rood : goed)
  // Alleen een net toegevoegde regel krijgt de cursor.
  const [nieuw, setNieuw] = useState(-1)
  const lijst = tier.onderdelen
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...LABEL, fontSize: '0.85rem', color: C.wit }}>{naam}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: r.omzet === null ? C.zacht : C.wit }}>€</span>
        <GetalVeld groot waarde={tier.prijs[duur]} onChange={onPrijs} placeholder="Totaal" label={`Totaalprijs ${naam}, ${duur} maanden`} />
      </div>
      <div style={{ ...NUM, fontSize: '0.9rem', fontWeight: 800, marginTop: 8, color: r.perMaand === null ? C.zacht : C.groen }}>
        {r.perMaand === null ? 'Nog geen prijs' : `${euro(r.perMaand)} per maand`}
      </div>

      <div style={{ marginTop: 16 }}>
        <Rij label="Kosten per maand"><GetalVeld waarde={tier.kostenMaand} onChange={v => onVeld('kostenMaand', v)} label={`Kosten per maand ${naam}`} placeholder="0" /></Rij>
        <Rij label="Kosten eenmalig"><GetalVeld waarde={tier.kostenEenmalig} onChange={v => onVeld('kostenEenmalig', v)} label={`Eenmalige kosten ${naam}`} placeholder="0" /></Rij>
        <Rij label="Uren per maand"><GetalVeld waarde={tier.urenMaand} onChange={v => onVeld('urenMaand', v)} label={`Uren per maand ${naam}`} placeholder="0" /></Rij>
        <Rij label="Uren eenmalig"><GetalVeld waarde={tier.urenEenmalig} onChange={v => onVeld('urenEenmalig', v)} label={`Eenmalige uren ${naam}`} placeholder="0" /></Rij>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', alignItems: 'baseline', gap: '10px 16px', marginTop: 20 }}>
        <span />
        <span style={{ ...LABEL, color: C.zacht, textAlign: 'right' }}>Gewoon</span>
        <span style={{ ...LABEL, color: C.zacht, textAlign: 'right' }}>Vooruit</span>
        {p && p.borg > 0 && <Uitkomst label="Borg verrekend" gewoon={-p.borg} vooruit={-p.borg} />}
        <Uitkomst label="Omzet" gewoon={r.omzet} vooruit={vu.omzet} />
        <Uitkomst label="Partner" gewoon={r.partner === null ? null : -r.partner} vooruit={vu.partner === null ? null : -vu.partner} />
        <Uitkomst label="Kosten" gewoon={r.omzet === null ? null : -r.kosten} vooruit={vu.omzet === null ? null : -vu.kosten} />
        <Uitkomst label="Jij houdt over" gewoon={r.over} vooruit={vu.over} groot kleur={roodOnderNul(C.wit)} />
        <Uitkomst label="Per uur" gewoon={r.perUur} vooruit={vu.perUur} groot kleur={roodOnderNul(C.groen)} />
      </div>

      <div style={{ ...LABEL, color: C.zacht, marginTop: 24 }}>Onderdelen</div>
      <div style={{ marginTop: 4 }}>
        {lijst.map((tekst, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <TekstVeld waarde={tekst} autoFocus={i === nieuw} onBlur={() => setNieuw(-1)} label={`Onderdeel ${i + 1} ${naam}`}
              onChange={v => onOnderdelen(lijst.map((o, j) => (j === i ? v : o)))} />
            <button type="button" title="Weghalen" aria-label={`Onderdeel ${i + 1} weghalen`}
              onClick={() => { setNieuw(-1); onOnderdelen(lijst.filter((_, j) => j !== i)) }}
              style={{
                width: 40, height: 40, flexShrink: 0, border: 'none', background: 'transparent', color: C.zacht, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
              }}>
              <X size={16} strokeWidth={2.6} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => { setNieuw(lijst.length); onOnderdelen([...lijst, '']) }} style={{
          display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: 0, border: 'none', background: 'transparent',
          color: C.groen, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
        }}>
          <Plus size={16} strokeWidth={3} /> Regel
        </button>
      </div>
    </div>
  )
}

// ── Stand Laten zien: één tier. Hier komt niets van kosten, uren of partner in. ──
function TierTonen({ naam, tier, duur, g }) {
  const p = prijzen(tier, duur, g)
  const lijst = tier.onderdelen.filter(o => o.trim())
  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.wit }}>{naam}</div>
      <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lijst.map((tekst, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, color: C.wit }}>
            <Check size={18} strokeWidth={3.5} color={C.groen} style={{ flexShrink: 0, marginTop: 3 }} />
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{tekst}</span>
          </li>
        ))}
      </ul>
      {p && (
        <div style={{ marginTop: 'auto', paddingTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0 8px' }}>
            <span style={{ ...NUM, fontSize: 'clamp(2.6rem, 5vw, 3.6rem)', fontWeight: 900, lineHeight: 1, color: C.wit }}>{euro(p.perMaand)}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: C.zacht }}>per maand</span>
          </div>
          <div style={{ ...NUM, fontSize: '0.85rem', fontWeight: 700, color: C.zacht, marginTop: 8 }}>{euro(p.totaal)} totaal</div>
          {p.borg > 0 && (
            <div style={{ ...NUM, fontSize: '0.85rem', fontWeight: 700, color: C.zacht, marginTop: 4 }}>
              {euro(-p.borg)} borg verrekend, blijft {euro(p.teBetalen)}
            </div>
          )}
          {p.korting > 0 && (
            <div style={{ ...NUM, fontSize: '1rem', fontWeight: 800, lineHeight: 1.35, color: C.wit, marginTop: 12 }}>
              In één keer {euro(p.vooruit)}, <span style={{ color: C.groen, whiteSpace: 'nowrap' }}>je bespaart {euro(p.korting)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Aanbod() {
  const [g, setG] = useState(null)
  const [laadFout, setLaadFout] = useState(false)
  const [nietBewaard, setNietBewaard] = useState(false)
  const [duur, setDuur] = useState(6)
  const [stand, setStand] = useState(leesStand)
  const [breedte, setBreedte] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const doos = useRef(null)

  // Opslag: de nieuwste stand wacht kort (typen) en gaat dan in één keer weg.
  const gRef = useRef(null)
  const wacht = useRef(null)      // nieuwste gegevens die nog niet in de database staan
  const timer = useRef(null)
  const onderweg = useRef(false)  // er loopt een schrijfactie

  // Eén schrijfactie tegelijk, zodat een oudere nooit over een nieuwere heen
  // komt: wat tijdens het schrijven getypt wordt gaat er direct achteraan.
  const schrijf = useCallback(async () => {
    clearTimeout(timer.current)
    timer.current = null
    if (onderweg.current) return
    while (wacht.current) {
      const wat = wacht.current
      wacht.current = null
      onderweg.current = true
      const ok = await bewaarAanbod(wat)
      onderweg.current = false
      setNietBewaard(!ok)
      if (!ok) {
        // Niets nieuwers getypt: bewaren voor de volgende poging (volgende
        // wijziging, scherm uit beeld of sluiten).
        if (!wacht.current) wacht.current = wat
        break
      }
    }
  }, [])

  const laad = useCallback(async () => {
    // Niet over eigen, nog niet bewaarde wijzigingen heen laden.
    if (wacht.current || onderweg.current) return
    const uit = await laadAanbod()
    if (wacht.current || onderweg.current) return
    if (uit.fout) { if (!gRef.current) setLaadFout(true); return }
    gRef.current = uit.gegevens
    setG(uit.gegevens)
    setLaadFout(false)
  }, [])

  const wijzig = useCallback((maak) => {
    if (!gRef.current) return
    const nieuw = maak(gRef.current)
    gRef.current = nieuw
    wacht.current = nieuw
    setG(nieuw)
    clearTimeout(timer.current)
    timer.current = setTimeout(schrijf, 600)
  }, [schrijf])

  // Laden bij openen en opnieuw als het scherm weer in beeld komt (wijziging
  // op het andere apparaat). Uit beeld of dicht: meteen wegschrijven.
  useEffect(() => {
    laad()
    const zicht = () => { if (document.visibilityState === 'hidden') schrijf(); else laad() }
    document.addEventListener('visibilitychange', zicht)
    return () => { document.removeEventListener('visibilitychange', zicht); schrijf() }
  }, [laad, schrijf])

  // Kolommen naast elkaar zolang de ruimte er is (ook in split screen meten).
  useEffect(() => {
    const el = doos.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setBreedte(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const kiesStand = (s) => {
    setStand(s)
    try { localStorage.setItem(STAND_KEY, s) } catch { /* privé-venster */ }
  }
  const zetTier = (k, maak) => wijzig(oud => ({ ...oud, tiers: { ...oud.tiers, [k]: maak(oud.tiers[k]) } }))

  const smal = breedte < 760
  // Rekenen heeft per tier twee bedragen naast elkaar en dus meer breedte nodig.
  const smalRekenen = breedte < 900
  const tonen = stand === 'tonen'

  return (
    <div ref={doos} style={{ color: C.wit, width: '100%', maxWidth: 1120, margin: '0 auto' }}>
      {/* ── Duur en stand ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flex: smal ? '1 1 100%' : '0 1 auto' }}>
          {DUREN.map(d => {
            const aan = duur === d
            return (
              <button key={d} type="button" aria-pressed={aan} onClick={() => setDuur(d)} style={{
                flex: smal ? 1 : 'none', minHeight: 44, padding: '0 18px', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem',
                fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1px solid ${aan ? C.groen : C.rand}`, background: aan ? `${C.groen}1f` : 'transparent', color: aan ? C.groen : C.wit,
              }}>{d} maanden</button>
            )
          })}
        </div>
        <div role="group" aria-label="Stand" style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 12, border: `1px solid ${C.rand}`, opacity: tonen ? 0.45 : 1 }}>
          {[['rekenen', 'Rekenen'], ['tonen', 'Laten zien']].map(([k, l]) => {
            const aan = stand === k
            return (
              <button key={k} type="button" aria-pressed={aan} onClick={() => kiesStand(k)} style={{
                minHeight: 38, padding: '0 14px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800,
                cursor: 'pointer', whiteSpace: 'nowrap', background: aan ? 'rgba(255,255,255,0.14)' : 'transparent', color: aan ? C.wit : C.zacht,
              }}>{l}</button>
            )
          })}
        </div>
      </div>

      {!g && !laadFout && <div style={{ color: C.zacht, fontWeight: 700, marginTop: 32 }}>Laden…</div>}
      {!g && laadFout && (
        <div style={{ marginTop: 32 }}>
          <div style={{ color: C.zacht, fontWeight: 700 }}>Aanbod laadt niet.</div>
          <button type="button" onClick={() => { setLaadFout(false); laad() }} style={{
            marginTop: 12, minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${C.rand}`, background: 'transparent',
            color: C.wit, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
          }}>Opnieuw</button>
        </div>
      )}

      {g && !tonen && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 24px', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>Partner %</span>
              <GetalVeld waarde={g.partnerPct} onChange={v => wijzig(oud => ({ ...oud, partnerPct: v === null ? null : Math.min(100, v) }))} label="Aandeel partner in procent" placeholder="0" breedte={56} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>Korting vooruitbetalen %</span>
              <GetalVeld waarde={g.vooruitPct} onChange={v => wijzig(oud => ({ ...oud, vooruitPct: v === null ? null : Math.min(100, v) }))} label="Korting bij vooruitbetalen in procent" placeholder="0" breedte={56} />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Schakelaar aan={g.borgAan} onChange={aan => wijzig(oud => ({ ...oud, borgAan: aan }))} label="Borg verrekenen" />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: g.borgAan ? 1 : 0.45 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>€</span>
                <GetalVeld waarde={g.borgBedrag} onChange={v => wijzig(oud => ({ ...oud, borgBedrag: v }))} label="Bedrag borg" placeholder="0" breedte={64} />
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.zacht, lineHeight: 1.5 }}>Nu: {HUIDIGE_PRIJZEN}</span>
            {nietBewaard && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.rood }}>Niet bewaard</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: smalRekenen ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: smalRekenen ? 48 : 40, marginTop: 28 }}>
            {TIERS.map(([k, naam]) => (
              <TierRekenen key={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g}
                onPrijs={v => zetTier(k, t => ({ ...t, prijs: { ...t.prijs, [duur]: v } }))}
                onVeld={(veld, v) => zetTier(k, t => ({ ...t, [veld]: v }))}
                onOnderdelen={lijst => zetTier(k, t => ({ ...t, onderdelen: lijst }))} />
            ))}
          </div>
        </>
      )}

      {g && tonen && (
        <div style={{ display: 'grid', gridTemplateColumns: smal ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: smal ? 44 : 56, marginTop: smal ? 32 : 48 }}>
          {TIERS.map(([k, naam]) => <TierTonen key={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g} />)}
        </div>
      )}
    </div>
  )
}
