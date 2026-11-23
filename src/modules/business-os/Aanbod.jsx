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
// Waar hij staat (BusinessOS, 23 nov 2026): Rekenen boven de bol, zodat de
// chatbalk en de bol van Gino bruikbaar blijven; Laten zien schermvullend zwart
// zonder chat (Blad vol). De gegevens wonen daarom in useAanbod (aanbodOpslag.js)
// en komen hier binnen als a: wisselen van stand verliest niets, en Gino ziet
// dezelfde waarden in zijn context.
// onSluit = kruisje in de eigen kop (boven de bol); schermvullend heeft het Blad
// zijn eigen kruisje.
//
// Rustige weergave (23 nov 2026, later op de dag): zelfde inhoud, minder tekst.
//   Kop         duur als '4 · 6 · 12' naast een kalender, de stand als twee
//               iconen (rekenmachine, oog). Alleen in Rekenen: info-icoon (de
//               huidige prijzen) en tandwiel (partner %, korting %, borg) als
//               dropdown. Het groene stipje op het tandwiel = borg staat aan.
//   Tiers       dicht: icoon, naam, prijs per maand, totaal en (Rekenen) per uur
//               met klein ernaast per uur bij vooruitbetalen. Tik klapt uit; er
//               mogen er meer tegelijk open. Onderdelen in Rekenen nog een keer
//               dicht achter een lijst-icoon met het aantal.
// Elk veld houdt zijn volledige naam als title en aria-label. Welke tiers open
// staan onthoudt alleen dit scherm: wisselen van stand begint weer dicht.

import { Fragment, useState, useEffect, useLayoutEffect, useRef, useId } from 'react'
import {
  CalendarDays, Calculator, Eye, Settings, Info, Crown, Target, Layers, Wallet, Clock, List,
  ChevronDown, Check, Plus, X, CloudOff,
} from 'lucide-react'
import { colors } from '../../ui/tokens'
import { DUREN, TIERS, HUIDIGE_PRIJZEN, prijzen, reken, euro, leesGetal } from './aanbodData'

const C = {
  wit: colors.textPrimary,
  zacht: colors.textSecondary,
  rand: colors.borderSubtle,
  lijn: 'rgba(255,255,255,0.18)',
  vlak: colors.surface,
  groen: colors.success,
  rood: colors.danger,
}
const NUM = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }
const LABEL = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }
const KLEIN = { fontSize: '0.8rem', fontWeight: 700, color: C.zacht }
const KAAL = { border: 'none', background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }

const TIER_ICOON = { premium: Crown, midden: Target, basis: Layers }
const STANDEN = [['rekenen', 'Rekenen', Calculator], ['tonen', 'Laten zien', Eye]]

const toonGetal = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

// Getalveld: zolang je typt blijft je eigen tekst staan (ook "12,"), de
// waarde gaat als getal of null naar boven.
function GetalVeld({ waarde, onChange, label, title = label, placeholder = '', groot = false, breedte = 96 }) {
  const [tekst, setTekst] = useState(null)
  const toon = tekst ?? toonGetal(waarde)
  return (
    <input type="text" inputMode="decimal" aria-label={label} title={title} placeholder={placeholder} value={toon}
      onFocus={() => setTekst(toon)}
      onChange={e => { const t = e.target.value.replace(/[^\d.,]/g, ''); setTekst(t); onChange(leesGetal(t)) }}
      onBlur={() => setTekst(null)}
      style={{
        width: groot ? '100%' : breedte, minWidth: 0, boxSizing: 'border-box', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${C.lijn}`, borderRadius: 0, outline: 'none', color: C.wit, fontFamily: 'inherit', ...NUM,
        textAlign: groot ? 'left' : 'right', fontSize: groot ? '1.5rem' : '1rem', fontWeight: groot ? 900 : 800,
        padding: groot ? '4px 0' : '8px 0', minHeight: groot ? 48 : 40,
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

// label = wat er kort naast staat, naam = de volledige naam (title en aria-label).
function Schakelaar({ aan, onChange, label, naam = label }) {
  return (
    <button type="button" role="switch" aria-checked={aan} aria-label={naam} title={naam} onClick={() => onChange(!aan)} style={{
      ...KAAL, display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: 0,
      color: aan ? C.wit : C.zacht, fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap',
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

// Icoon in de kop. stip = klein groen puntje (er staat iets aan dat je zonder
// openklappen niet ziet). smal = telefoon: iets smaller, zodat de kop op één
// rij blijft.
function IcoonKnop({ icoon, naam, aan = false, vlak = false, stip = false, smal = false, ...rest }) {
  const Icoon = icoon
  return (
    <button type="button" title={naam} aria-label={naam} {...rest} style={{
      ...KAAL, position: 'relative', width: smal ? 34 : 38, height: 40, flexShrink: 0, padding: 0, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: aan ? C.wit : C.zacht, background: aan && vlak ? 'rgba(255,255,255,0.14)' : 'transparent',
    }}>
      <Icoon size={19} strokeWidth={2.4} />
      {stip && <span aria-hidden="true" style={{ position: 'absolute', top: 8, right: 6, width: 7, height: 7, borderRadius: '50%', background: C.groen }} />}
    </button>
  )
}

function Pijl({ open, size = 18 }) {
  return (
    <ChevronDown size={size} strokeWidth={2.6} color={C.zacht} aria-hidden="true"
      style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
  )
}

// Kop van één tier: het hele vlak is de knop die uitklapt.
const KOP_KNOP = { ...KAAL, display: 'block', width: '100%', minWidth: 0, padding: 0, textAlign: 'left', color: C.wit }

// Kort veld in de rij kosten/uren: getal met eenheid ('/mnd', '1x') erachter.
function KortVeld({ waarde, onChange, label, naam, eenheid }) {
  return (
    <span title={naam} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <GetalVeld waarde={waarde} onChange={onChange} label={label} title={naam} placeholder="0" breedte={52} />
      <span aria-hidden="true" style={{ ...KLEIN, whiteSpace: 'nowrap' }}>{eenheid}</span>
    </span>
  )
}

function VeldGroep({ icoon, naam, children }) {
  const Icoon = icoon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span role="img" aria-label={naam} title={naam} style={{ display: 'flex', color: C.zacht }}>
        <Icoon size={18} strokeWidth={2.4} />
      </span>
      {children}
    </div>
  )
}

// ── Stand Rekenen: één tier ──
function TierRekenen({ sleutel, naam, tier, duur, g, open, onWissel, onVeld, onPrijs, onOnderdelen }) {
  const Icoon = TIER_ICOON[sleutel]
  const p = prijzen(tier, duur, g)
  const r = reken(tier, duur, g.partnerPct, p ? p.teBetalen : null)
  const vu = reken(tier, duur, g.partnerPct, p ? p.vooruit : null)
  const roodOnderNul = (goed) => (w) => (w !== null && w < 0 ? C.rood : goed)
  const uurKleur = (w) => (w === null ? C.zacht : roodOnderNul(C.groen)(w))
  // Alleen een net toegevoegde regel krijgt de cursor.
  const [nieuw, setNieuw] = useState(-1)
  const [lijstOpen, setLijstOpen] = useState(false)
  const lijst = tier.onderdelen
  const aantal = lijst.filter(o => o.trim()).length
  const id = useId()
  return (
    <div style={{ minWidth: 0 }}>
      <button type="button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={onWissel} style={KOP_KNOP}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
          <Icoon size={20} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span style={{ ...LABEL, fontSize: '0.85rem', flex: 1, minWidth: 0 }}>{naam}</span>
          <Pijl open={open} />
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '0 12px', marginTop: 6 }}>
          <span title="Per maand" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ ...NUM, fontSize: '2rem', fontWeight: 900, lineHeight: 1.15, color: r.perMaand === null ? C.zacht : C.wit }}>
              {r.perMaand === null ? '–' : euro(r.perMaand)}
            </span>
            {r.perMaand !== null && <span style={KLEIN}>/mnd</span>}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
            <span title="Per uur" style={{ ...NUM, fontSize: '1.1rem', fontWeight: 900, color: uurKleur(r.perUur) }}>
              {r.perUur === null ? '–' : euro(r.perUur)}
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}> /uur</span>
            </span>
            <span title="Per uur bij vooruitbetalen" aria-label={`Per uur bij vooruitbetalen ${vu.perUur === null ? 'onbekend' : euro(vu.perUur)}`}
              style={{ ...NUM, fontSize: '0.8rem', fontWeight: 800, color: vu.perUur !== null && vu.perUur < 0 ? C.rood : C.zacht }}>
              {vu.perUur === null ? '–' : euro(vu.perUur)}
            </span>
          </span>
        </span>
        <span title="Totaal" style={{ ...NUM, ...KLEIN, display: 'block', marginTop: 2 }}>
          {p ? euro(p.totaal) : 'Nog geen prijs'}
        </span>
      </button>

      {open && (
        <div id={id} style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: r.omzet === null ? C.zacht : C.wit }}>€</span>
            <GetalVeld groot waarde={tier.prijs[duur]} onChange={onPrijs} placeholder="Totaal" label={`Totaalprijs ${naam}, ${duur} maanden`} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 28px', marginTop: 16 }}>
            <VeldGroep icoon={Wallet} naam="Kosten">
              <KortVeld waarde={tier.kostenMaand} onChange={v => onVeld('kostenMaand', v)} label={`Kosten per maand ${naam}`} naam="Kosten per maand" eenheid="/mnd" />
              <KortVeld waarde={tier.kostenEenmalig} onChange={v => onVeld('kostenEenmalig', v)} label={`Eenmalige kosten ${naam}`} naam="Kosten eenmalig" eenheid="1x" />
            </VeldGroep>
            <VeldGroep icoon={Clock} naam="Uren">
              <KortVeld waarde={tier.urenMaand} onChange={v => onVeld('urenMaand', v)} label={`Uren per maand ${naam}`} naam="Uren per maand" eenheid="/mnd" />
              <KortVeld waarde={tier.urenEenmalig} onChange={v => onVeld('urenEenmalig', v)} label={`Eenmalige uren ${naam}`} naam="Uren eenmalig" eenheid="1x" />
            </VeldGroep>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', alignItems: 'baseline', gap: '10px 16px', marginTop: 24 }}>
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

          <button type="button" aria-expanded={lijstOpen} title="Onderdelen" aria-label={`Onderdelen ${naam}: ${aantal}`}
            onClick={() => setLijstOpen(o => !o)} style={{
              ...KAAL, display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 16, padding: 0, color: C.wit,
            }}>
            <List size={18} strokeWidth={2.4} color={C.zacht} aria-hidden="true" />
            <span style={{ ...NUM, fontSize: '1rem', fontWeight: 900 }}>{aantal}</span>
            <Pijl open={lijstOpen} size={16} />
          </button>
          {lijstOpen && (
            <div>
              {lijst.map((tekst, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <TekstVeld waarde={tekst} autoFocus={i === nieuw} onBlur={() => setNieuw(-1)} label={`Onderdeel ${i + 1} ${naam}`}
                    onChange={v => onOnderdelen(lijst.map((o, j) => (j === i ? v : o)))} />
                  <button type="button" title="Weghalen" aria-label={`Onderdeel ${i + 1} weghalen`}
                    onClick={() => { setNieuw(-1); onOnderdelen(lijst.filter((_, j) => j !== i)) }}
                    style={{
                      ...KAAL, width: 40, height: 40, flexShrink: 0, color: C.zacht,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                    }}>
                    <X size={16} strokeWidth={2.6} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => { setNieuw(lijst.length); onOnderdelen([...lijst, '']) }} style={{
                ...KAAL, display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: 0,
                color: C.groen, fontSize: '0.85rem', fontWeight: 800,
              }}>
                <Plus size={16} strokeWidth={3} /> Regel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stand Laten zien: één tier. Hier komt niets van kosten, uren of partner in. ──
function TierTonen({ sleutel, naam, tier, duur, g, open, onWissel }) {
  const Icoon = TIER_ICOON[sleutel]
  const p = prijzen(tier, duur, g)
  const lijst = tier.onderdelen.filter(o => o.trim())
  // Zonder onderdelen valt er niets uit te klappen: dan is de kop geen knop.
  const kan = lijst.length > 0
  const id = useId()
  const Kop = kan ? 'button' : 'div'
  const kopProps = kan ? { type: 'button', 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: onWissel } : {}
  return (
    <div style={{ minWidth: 0 }}>
      <Kop {...kopProps} style={{ ...KOP_KNOP, cursor: kan ? 'pointer' : 'default' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icoon size={24} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{naam}</span>
          {kan && <Pijl open={open} size={20} />}
        </span>
        {!p && <span style={{ display: 'block', marginTop: 16, fontSize: 'clamp(2.6rem, 5vw, 3.6rem)', fontWeight: 900, lineHeight: 1, color: C.zacht }}>–</span>}
        {p && (
          <>
            <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0 8px', marginTop: 16 }}>
              <span style={{ ...NUM, fontSize: 'clamp(2.6rem, 5vw, 3.6rem)', fontWeight: 900, lineHeight: 1 }}>{euro(p.perMaand)}</span>
              <span title="Per maand" style={{ fontSize: '0.95rem', fontWeight: 700, color: C.zacht }}>/mnd</span>
            </span>
            <span style={{ ...NUM, display: 'block', fontSize: '0.85rem', fontWeight: 700, color: C.zacht, marginTop: 8 }}>{euro(p.totaal)} totaal</span>
            {p.borg > 0 && (
              <span title="Borg verrekend" style={{ ...NUM, display: 'block', fontSize: '0.85rem', fontWeight: 700, color: C.zacht, marginTop: 4 }}>
                {euro(-p.borg)} borg · blijft {euro(p.teBetalen)}
              </span>
            )}
            {p.korting > 0 && (
              <span title="Vooruitbetalen" style={{ ...NUM, display: 'block', fontSize: '1rem', fontWeight: 800, lineHeight: 1.35, marginTop: 12 }}>
                In één keer {euro(p.vooruit)} · <span title="Je bespaart" style={{ color: C.groen, whiteSpace: 'nowrap' }}>{euro(-p.korting)}</span>
              </span>
            )}
          </>
        )}
      </Kop>
      {kan && open && (
        <ul id={id} style={{ listStyle: 'none', margin: '24px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lijst.map((tekst, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, color: C.wit }}>
              <Check size={18} strokeWidth={3.5} color={C.groen} style={{ flexShrink: 0, marginTop: 3 }} />
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{tekst}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Regel in de dropdown achter het tandwiel.
function InstelRij({ label, naam, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 44 }}>
      <span title={naam} style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht, whiteSpace: 'nowrap' }}>{label}</span>
      {children}
    </div>
  )
}

export default function Aanbod({ a, onSluit = null }) {
  const { g, laadFout, setLaadFout, nietBewaard, duur, setDuur, stand, kiesStand, wijzig, laad } = a
  const [breedte, setBreedte] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const doos = useRef(null)
  // Welke tiers open staan (er mogen er meer tegelijk open) en welke dropdown
  // in de kop: 'info', 'instel' of niets.
  const [openTiers, setOpenTiers] = useState({})
  const [pop, setPop] = useState(null)
  const paneel = useRef(null)

  // Kolommen naast elkaar zolang de ruimte er is (ook in split screen meten).
  useEffect(() => {
    const el = doos.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setBreedte(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Dropdown sluit met een tik ernaast of Escape.
  useEffect(() => {
    if (!pop) return undefined
    const buiten = (e) => {
      if (paneel.current?.contains(e.target) || e.target.closest?.('[data-aanbod-pop]')) return
      setPop(null)
    }
    const toets = (e) => { if (e.key === 'Escape') setPop(null) }
    document.addEventListener('pointerdown', buiten)
    window.addEventListener('keydown', toets)
    return () => { document.removeEventListener('pointerdown', buiten); window.removeEventListener('keydown', toets) }
  }, [pop])

  const zetTier = (k, maak) => wijzig(oud => ({ ...oud, tiers: { ...oud.tiers, [k]: maak(oud.tiers[k]) } }))
  const wisselTier = (k) => setOpenTiers(o => ({ ...o, [k]: !o[k] }))

  const smal = breedte < 760
  // Rekenen heeft per tier twee bedragen naast elkaar en dus meer breedte nodig.
  const smalRekenen = breedte < 900
  const tonen = stand === 'tonen'
  const rekenen = !!g && !tonen
  const popOpen = rekenen ? pop : null

  return (
    <div ref={doos} style={{ color: C.wit, width: '100%', maxWidth: 1120, margin: '0 auto' }}>
      {/* ── Duur en stand. Boven de bol blijft deze rij staan tijdens het scrollen. ── */}
      <div style={{
        position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '4px 12px',
        ...(onSluit ? { position: 'sticky', top: 0, zIndex: 2, background: colors.bg, paddingBottom: 12 } : null),
      }}>
        <div role="group" aria-label="Duur in maanden" title="Duur in maanden" style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarDays size={18} strokeWidth={2.4} color={C.zacht} aria-hidden="true" style={{ marginRight: 4 }} />
          {DUREN.map((d, i) => {
            const aan = duur === d
            return (
              <Fragment key={d}>
                {i > 0 && <span aria-hidden="true" style={{ color: C.zacht, fontWeight: 900 }}>·</span>}
                <button type="button" aria-pressed={aan} title={`${d} maanden`} aria-label={`${d} maanden`} onClick={() => setDuur(d)} style={{
                  ...KAAL, ...NUM, minWidth: smal ? 32 : 38, minHeight: 44, padding: '0 6px', fontSize: '1.15rem', fontWeight: 900,
                  color: aan ? C.groen : C.zacht,
                }}>{d}</button>
              </Fragment>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          {rekenen && (
            <>
              <IcoonKnop icoon={Info} naam="Huidige prijzen" smal={smal} aan={popOpen === 'info'} data-aanbod-pop aria-haspopup="dialog" aria-expanded={popOpen === 'info'}
                onClick={() => setPop(v => (v === 'info' ? null : 'info'))} />
              <IcoonKnop icoon={Settings} naam={`Partner, korting en borg${g.borgAan ? ' (borg aan)' : ''}`} smal={smal} aan={popOpen === 'instel'} stip={g.borgAan}
                data-aanbod-pop aria-haspopup="dialog" aria-expanded={popOpen === 'instel'}
                onClick={() => setPop(v => (v === 'instel' ? null : 'instel'))} />
            </>
          )}
          <div role="group" aria-label="Stand" style={{ display: 'flex', gap: 2, marginLeft: 6, opacity: tonen ? 0.45 : 1 }}>
            {STANDEN.map(([k, l, Icoon]) => (
              <IcoonKnop key={k} icoon={Icoon} naam={l} smal={smal} aan={stand === k} vlak aria-pressed={stand === k} onClick={() => kiesStand(k)} />
            ))}
          </div>
          {onSluit && (
            <button type="button" onClick={onSluit} title="Sluiten" aria-label="Aanbod sluiten" style={{
              ...KAAL, width: smal ? 36 : 40, height: 40, flexShrink: 0, borderRadius: '50%', color: C.wit,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={20} />
            </button>
          )}
        </div>

        {popOpen && (
          <div ref={paneel} role="dialog" aria-label={popOpen === 'info' ? 'Huidige prijzen' : 'Partner, korting en borg'} style={{
            position: 'absolute', top: onSluit ? 'calc(100% - 6px)' : 'calc(100% + 6px)', right: 0, zIndex: 3, boxSizing: 'border-box',
            minWidth: 248, maxWidth: '100%', padding: '10px 18px', borderRadius: 16, background: C.vlak, boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
          }}>
            {popOpen === 'info' && (
              <div style={{ padding: '6px 0' }}>
                <div style={{ ...LABEL, color: C.zacht }}>Nu</div>
                {HUIDIGE_PRIJZEN.split(' · ').map(regel => (
                  <div key={regel} style={{ ...NUM, fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.3, color: C.wit, marginTop: 10 }}>{regel}</div>
                ))}
              </div>
            )}
            {popOpen === 'instel' && (
              <>
                <InstelRij label="Partner %" naam="Aandeel partner in procent">
                  <GetalVeld waarde={g.partnerPct} onChange={v => wijzig(oud => ({ ...oud, partnerPct: v === null ? null : Math.min(100, v) }))} label="Aandeel partner in procent" placeholder="0" breedte={64} />
                </InstelRij>
                <InstelRij label="Korting %" naam="Korting bij vooruitbetalen in procent">
                  <GetalVeld waarde={g.vooruitPct} onChange={v => wijzig(oud => ({ ...oud, vooruitPct: v === null ? null : Math.min(100, v) }))} label="Korting bij vooruitbetalen in procent" placeholder="0" breedte={64} />
                </InstelRij>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 44 }}>
                  <Schakelaar aan={g.borgAan} onChange={aan => wijzig(oud => ({ ...oud, borgAan: aan }))} label="Borg" naam="Borg verrekenen" />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: g.borgAan ? 1 : 0.45 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>€</span>
                    <GetalVeld waarde={g.borgBedrag} onChange={v => wijzig(oud => ({ ...oud, borgBedrag: v }))} label="Bedrag borg" placeholder="0" breedte={64} />
                  </span>
                </div>
              </>
            )}
          </div>
        )}
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

      {rekenen && (
        <>
          {nietBewaard && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: onSluit ? 0 : 12, fontSize: '0.75rem', fontWeight: 800, color: C.rood }}>
              <CloudOff size={14} strokeWidth={2.6} aria-hidden="true" /> Niet bewaard
            </div>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: smalRekenen ? '1fr' : 'repeat(3, minmax(0, 1fr))', alignItems: 'start',
            gap: smalRekenen ? 40 : 48, marginTop: onSluit ? 16 : 28,
          }}>
            {TIERS.map(([k, naam]) => (
              <TierRekenen key={k} sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g}
                open={!!openTiers[k]} onWissel={() => wisselTier(k)}
                onPrijs={v => zetTier(k, t => ({ ...t, prijs: { ...t.prijs, [duur]: v } }))}
                onVeld={(veld, v) => zetTier(k, t => ({ ...t, [veld]: v }))}
                onOnderdelen={lijst => zetTier(k, t => ({ ...t, onderdelen: lijst }))} />
            ))}
          </div>
        </>
      )}

      {g && tonen && (
        <div style={{
          display: 'grid', gridTemplateColumns: smal ? '1fr' : 'repeat(3, minmax(0, 1fr))', alignItems: 'start',
          gap: smal ? 48 : 56, marginTop: smal ? 32 : 48,
        }}>
          {TIERS.map(([k, naam]) => (
            <TierTonen key={k} sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g}
              open={!!openTiers[k]} onWissel={() => wisselTier(k)} />
          ))}
        </div>
      )}
    </div>
  )
}
