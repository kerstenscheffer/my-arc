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
//
// Vergelijking (24 nov 2026): gegevens.vergelijking = rijen { onderdeel, basis,
// midden, premium }, cel = true (vinkje), tekst of null (kruisje). Staat er een
// gevulde rij, dan komt er één tabel in plaats van de lijstjes per tier:
//   Laten zien  de drie tiers met prijs als kolomkop, daaronder de rijen.
//   Rekenen     dezelfde tabel onder de tiers, bewerkbaar: tik op een cel om te
//               typen (leeg = kruisje), het vinkje ernaast zet de cel op vinkje.
// Smal scherm: de onderdeelnaam staat als klein label boven de drie cellen.
// Zonder vergelijking: de lijstjes uit tier.onderdelen zoals voorheen. Die
// blijven altijd in de data staan (oudere app-versies lezen ze).
//
// Breder in Laten zien (24 nov 2026): de pagina gebruikt daar 90% van het scherm
// tot 1400 px (was 1120) en de tabel verdeelt de tier-kolommen naar inhoud, zodat
// de lange teksten van Premium en Midden op één regel staan. Telefoon en Rekenen
// zijn niet veranderd.
//
// Aanbod in één zin (24 nov 2026): gegevens.tiers.<tier>.zin (tekst, leeg = geen).
//   Laten zien  knopje (Quote) bij de tiernaam, alleen als er een zin is. Een tik
//               klapt onder de prijs de zin open in dik wit, met de prijs per
//               maand van de gekozen duur in groen erachter. Elke tier los.
//               Telefoon (drie smalle koppen): het tier-icoon staat op een eigen
//               regel en het knopje direct achter de naam eronder (icoon, naam en
//               knopje passen niet naast elkaar in 100 px). De zin klapt over de
//               volle breedte open tussen de koppen en de tabel: in zo'n smalle
//               kolom is een zin niet te lezen.
//   Rekenen     tekstveld in de uitgeklapte tier, bewaard via wijzig zoals de rest.
// Welke zinnen open staan onthoudt alleen dit scherm (openZin).

import { Fragment, useState, useEffect, useLayoutEffect, useRef, useId } from 'react'
import {
  CalendarDays, Calculator, Eye, Settings, Info, Crown, Target, Layers, Wallet, Clock, List,
  ChevronDown, Check, Plus, X, CloudOff, Trash2, Quote,
} from 'lucide-react'
import { colors } from '../../ui/tokens'
import {
  DUREN, TIERS, prijzen, reken, euro, leesGetal, normaliseerProduct,
  celSoort, nieuweVergelijkRij, vergelijkRijen, tierZin,
} from './aanbodData'

const C = {
  wit: colors.textPrimary,
  zacht: colors.textSecondary,
  grijs: colors.textMuted,
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

// Wat Kersten nu verkoopt (24 nov 2026). Hieruit kies je bij verlengen (TrajectModal),
// samen met de tiers die een prijs hebben. Naam, maanden, in één keer en per maand.
function Producten({ lijst, onChange }) {
  const zet = (i, veld, v) => onChange(lijst.map((p, j) => (j === i ? { ...p, [veld]: v } : p)))
  const kolom = { fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.zacht, textAlign: 'right' }
  const raster = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px 64px 56px 28px', alignItems: 'center', gap: 8 }
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ ...LABEL, color: C.zacht, marginBottom: 6 }}>Nu verkopen</div>
      <div style={{ ...raster, marginBottom: 2 }}>
        <span style={{ ...kolom, textAlign: 'left' }}>Naam</span><span style={kolom}>Mnd</span><span style={kolom}>Ineens</span><span style={kolom}>/mnd</span><span />
      </div>
      {lijst.map((p, i) => (
        <div key={p.id} style={raster}>
          <input type="text" value={p.naam} onChange={e => zet(i, 'naam', e.target.value)} aria-label="Naam aanbod" placeholder="Naam"
            style={{ minWidth: 0, background: 'transparent', border: 'none', borderBottom: `1px solid ${C.lijn}`, outline: 'none', color: C.wit, fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 800, padding: '8px 0', minHeight: 40 }} />
          <GetalVeld waarde={p.maanden} onChange={v => zet(i, 'maanden', v === null ? null : Math.round(v))} label={`Maanden ${p.naam}`} placeholder="0" breedte={44} />
          <GetalVeld waarde={p.vooruit} onChange={v => zet(i, 'vooruit', v)} label={`In één keer ${p.naam}`} placeholder="€" breedte={64} />
          <GetalVeld waarde={p.perMaand} onChange={v => zet(i, 'perMaand', v)} label={`Per maand ${p.naam}`} placeholder="€" breedte={56} />
          <button type="button" onClick={() => onChange(lijst.filter((_, j) => j !== i))} title={`${p.naam || 'Aanbod'} weghalen`} aria-label={`${p.naam || 'Aanbod'} weghalen`}
            style={{ ...KAAL, width: 28, height: 40, color: C.zacht, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...lijst, normaliseerProduct({ naam: '' }, lijst.length)])}
        style={{ ...KAAL, display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, marginTop: 6, padding: 0, color: C.wit, fontSize: '0.85rem', fontWeight: 800 }}>
        <Plus size={15} /> Aanbod toevoegen
      </button>
    </div>
  )
}

// Tekstveld dat meegroeit, zodat een lange regel in een smalle kolom leesbaar blijft.
// onKlaar = Enter gedrukt. stijl = afwijkingen voor de vergelijkingstabel. Het
// veld blijft 1rem: kleiner laat de iPhone inzoomen bij het typen.
function TekstVeld({ waarde, onChange, label, autoFocus, onBlur, onKlaar, placeholder, stijl = null }) {
  const el = useRef(null)
  useLayoutEffect(() => {
    if (!el.current) return
    el.current.style.height = 'auto'
    el.current.style.height = `${el.current.scrollHeight}px`
  })
  // Opent het veld met tekst erin (cel in de vergelijking), dan de cursor achteraan.
  useEffect(() => {
    if (!autoFocus || !el.current) return
    const n = el.current.value.length
    try { el.current.setSelectionRange(n, n) } catch { /* veld zonder selectie */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <textarea ref={el} rows={1} aria-label={label} value={waarde} autoFocus={autoFocus} onBlur={onBlur} placeholder={placeholder}
      onChange={e => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); onKlaar?.() } }}
      style={{
        flex: 1, minWidth: 0, boxSizing: 'border-box', resize: 'none', overflow: 'hidden', background: 'transparent',
        border: 'none', borderBottom: `1px solid ${C.lijn}`, borderRadius: 0, outline: 'none', color: C.wit,
        fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700, lineHeight: 1.35, padding: '9px 0', ...stijl,
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

// Knopje bij de tiernaam in Laten zien: klapt het aanbod in één zin open en dicht.
// Het tikvlak is groter dan het icoon; de negatieve marge houdt de regel even
// hoog als bij een tier zonder zin, zodat de prijzen op één lijn blijven, en zet
// het icoon dicht tegen de naam.
function ZinKnop({ naam, open, onClick, controls, compact = false }) {
  const maat = compact ? 30 : 32
  return (
    <button type="button" aria-expanded={open} aria-controls={controls} title={`${naam} in één zin`} aria-label={`${naam} in één zin`}
      onClick={onClick} style={{
        ...KAAL, flexShrink: 0, width: maat, height: maat, padding: 0, borderRadius: '50%',
        margin: compact ? '-8px -6px' : '-4px 0 -4px -4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: open ? C.groen : C.zacht, background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
        transition: 'color 0.2s, background 0.2s',
      }}>
      <Quote size={compact ? 15 : 17} strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}

// Het aanbod van één tier in één zin, met de prijs per maand erachter. Staat in
// de pagina zolang er een zin is, ook dicht: zo schuift open en dicht rustig (de
// rij gaat van 0fr naar 1fr; een browser die dat niet kan animeren klapt gewoon).
// width 0 + minWidth 100%: de zin telt niet mee in de breedte van zijn kolom,
// anders trekt een lange zin de vergelijkingstabel scheef zodra hij opengaat.
// kop = klein label erboven (telefoon: welke tier). ruimte = [boven, onder] in px.
function ZinVak({ id, open, zin, perMaand, kop = null, klein = false, ruimte = [18, 0] }) {
  return (
    <div id={id} aria-hidden={!open} style={{
      display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', width: 0, minWidth: '100%',
      opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden',
      transition: 'grid-template-rows 0.28s ease, opacity 0.28s ease, visibility 0.28s',
    }}>
      <div style={{ minHeight: 0, overflow: 'hidden' }}>
        <div style={{ margin: `${ruimte[0]}px 0 ${ruimte[1]}px`, paddingLeft: klein ? 10 : 14, borderLeft: `2px solid ${C.lijn}` }}>
          {kop}
          <p style={{ margin: 0, fontSize: klein ? '0.95rem' : '1.05rem', fontWeight: 800, lineHeight: 1.4, color: C.wit, overflowWrap: 'anywhere' }}>
            {zin}
            {perMaand !== null && (
              <> <span style={{ ...NUM, fontWeight: 900, color: C.groen, whiteSpace: 'nowrap' }}>{euro(perMaand)} per maand</span></>
            )}
          </p>
        </div>
      </div>
    </div>
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
// metLijst = false: er is een vergelijking, de onderdelen staan in de tabel eronder.
function TierRekenen({ sleutel, naam, tier, duur, g, open, onWissel, onVeld, onPrijs, onOnderdelen, metLijst = true }) {
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

          {/* Het aanbod in één zin: Laten zien toont hem achter het knopje bij de naam. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 20 }}>
            <span role="img" aria-label="In één zin" title="In één zin" style={{ display: 'flex', flexShrink: 0, paddingTop: 11, color: C.zacht }}>
              <Quote size={18} strokeWidth={2.4} />
            </span>
            <TekstVeld waarde={tier.zin || ''} onChange={v => onVeld('zin', v)} label={`${naam} in één zin`} placeholder="In één zin" />
          </div>

          {metLijst && (
            <button type="button" aria-expanded={lijstOpen} title="Onderdelen" aria-label={`Onderdelen ${naam}: ${aantal}`}
              onClick={() => setLijstOpen(o => !o)} style={{
                ...KAAL, display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 16, padding: 0, color: C.wit,
              }}>
              <List size={18} strokeWidth={2.4} color={C.zacht} aria-hidden="true" />
              <span style={{ ...NUM, fontSize: '1rem', fontWeight: 900 }}>{aantal}</span>
              <Pijl open={lijstOpen} size={16} />
            </button>
          )}
          {metLijst && lijstOpen && (
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
// metLijst = false: kolomkop van de vergelijkingstabel, de onderdelen staan in de
// rijen eronder. compact = drie koppen naast elkaar op een smal scherm.
// Zin: onZin = tik op het knopje (zonder onZin of zonder zin geen knopje), zinOpen
// = hij staat open. zinBinnen = false: de zin klapt niet in deze kolom open maar
// eronder over de volle breedte (telefoon, zie VergelijkingTonen); zinId is dan
// het id van dat vak. zinRegel = compact en minstens één tier heeft een zin: het
// tier-icoon staat dan bij alle drie op een eigen regel, zodat het knopje achter
// de naam past en de prijzen op één lijn blijven.
// De naamregel en de prijs zijn losse blokken: het zin-knopje mag niet in de knop
// zitten die de onderdelen uitklapt. Een tik op de prijs klapt de lijst nog wel uit.
function TierTonen({
  sleutel, naam, tier, duur, g, open, onWissel, metLijst = true, compact = false,
  zinOpen = false, onZin = null, zinId = null, zinRegel = false, zinBinnen = true,
}) {
  const Icoon = TIER_ICOON[sleutel]
  const p = prijzen(tier, duur, g)
  const lijst = metLijst ? tier.onderdelen.filter(o => o.trim()) : []
  const prijsMaat = compact ? 'clamp(1.3rem, 6.4vw, 2.2rem)' : 'clamp(2.6rem, 5vw, 3.6rem)'
  const kleinMaat = compact ? '0.72rem' : '0.85rem'
  // Zonder onderdelen valt er niets uit te klappen: dan is de naam geen knop.
  const kan = lijst.length > 0
  const id = useId()
  const eigenZinId = useId()
  const zin = onZin ? tierZin(tier) : ''
  const zId = zinId || eigenZinId
  const rij = { display: 'flex', alignItems: 'center', flexWrap: compact ? 'wrap' : 'nowrap', gap: compact ? '4px 6px' : 12 }
  const icoon = <Icoon size={compact ? 18 : 24} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
  const naamStijl = { minWidth: 0, fontSize: compact ? '0.78rem' : '1.25rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', overflowWrap: 'anywhere' }
  const icoonBoven = compact && zinRegel
  return (
    <div style={{ minWidth: 0 }}>
      <div style={rij}>
        {kan ? (
          <button type="button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={onWissel}
            style={{ ...KOP_KNOP, ...rij, flex: 1, width: 'auto' }}>
            {icoon}
            <span style={{ ...naamStijl, flex: 1 }}>{naam}</span>
            <Pijl open={open} size={20} />
          </button>
        ) : (
          <>
            {icoonBoven ? <span style={{ display: 'flex', flex: '0 0 100%' }}>{icoon}</span> : icoon}
            <span style={{ ...naamStijl, flex: zin ? '0 1 auto' : 1 }}>{naam}</span>
          </>
        )}
        {zin && <ZinKnop naam={naam} open={zinOpen} onClick={onZin} controls={zId} compact={compact} />}
      </div>
      <div onClick={kan ? onWissel : undefined} style={{ cursor: kan ? 'pointer' : 'default' }}>
        {!p && <span style={{ display: 'block', marginTop: compact ? 10 : 16, fontSize: prijsMaat, fontWeight: 900, lineHeight: 1, color: C.zacht }}>–</span>}
        {p && (
          <>
            <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: compact ? '0 4px' : '0 8px', marginTop: compact ? 10 : 16 }}>
              <span style={{ ...NUM, fontSize: prijsMaat, fontWeight: 900, lineHeight: 1 }}>{euro(p.perMaand)}</span>
              <span title="Per maand" style={{ fontSize: compact ? '0.72rem' : '0.95rem', fontWeight: 700, color: C.zacht }}>/mnd</span>
            </span>
            <span style={{ ...NUM, display: 'block', fontSize: kleinMaat, fontWeight: 700, color: C.zacht, marginTop: compact ? 6 : 8 }}>{euro(p.totaal)} totaal</span>
            {p.borg > 0 && (
              <span title="Borg verrekend" style={{ ...NUM, display: 'block', fontSize: kleinMaat, fontWeight: 700, color: C.zacht, marginTop: 4 }}>
                {euro(-p.borg)} borg · blijft {euro(p.teBetalen)}
              </span>
            )}
            {p.korting > 0 && (
              <span title="Vooruitbetalen" style={{ ...NUM, display: 'block', fontSize: compact ? '0.78rem' : '1rem', fontWeight: 800, lineHeight: 1.35, marginTop: compact ? 8 : 12 }}>
                In één keer {euro(p.vooruit)} · <span title="Je bespaart" style={{ color: C.groen, whiteSpace: 'nowrap' }}>{euro(-p.korting)}</span>
              </span>
            )}
          </>
        )}
      </div>
      {zin && zinBinnen && <ZinVak id={zId} open={zinOpen} zin={zin} perMaand={p ? p.perMaand : null} />}
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

// ── Vergelijking: één tabel voor de drie tiers ──
// Eén cel: groen vinkje, de tekst in dik wit, of een grijs kruisje.
function CelInhoud({ waarde, klein = false }) {
  const soort = celSoort(waarde)
  if (soort === 'vink') {
    return (
      <span role="img" aria-label="Zit erin" style={{ display: 'flex' }}>
        <Check size={klein ? 18 : 22} strokeWidth={3.5} color={C.groen} />
      </span>
    )
  }
  if (soort === 'leeg') {
    return (
      <span role="img" aria-label="Zit er niet in" style={{ display: 'flex' }}>
        <X size={klein ? 16 : 20} strokeWidth={3} color={C.grijs} />
      </span>
    )
  }
  return (
    <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: klein ? '0.85rem' : '1.05rem', fontWeight: 800, lineHeight: 1.3, color: C.wit }}>
      {waarde.trim()}
    </span>
  )
}

// Raster van één rij. Breed: onderdeelnaam als eerste kolom. Smal: drie kolommen,
// de naam staat er als label boven (gridColumn 1 / -1). staart = kolom voor de
// prullenbak in de bewerkbare tabel.
const vglRaster = (smal, ruim, staart = false) => ({
  display: 'grid', alignItems: 'start',
  gridTemplateColumns: smal ? 'repeat(3, minmax(0, 1fr))' : `minmax(0, 0.75fr) repeat(3, minmax(0, 1fr))${staart ? ' 40px' : ''}`,
  columnGap: smal ? 12 : ruim ? 48 : 24,
})

// Stand Laten zien: de tiers met prijs als kolomkop, daaronder de onderdelen.
// Smal: elke rij is zijn eigen raster, de naam staat als label boven de cellen.
// Breed: één raster voor de hele tabel (de rijen zelf doen niet mee: display
// contents, de lijn ertussen is een eigen strook). Zo meet de browser de drie
// tier-kolommen op hun inhoud: een kolom met lange teksten wordt breder dan een
// kolom met alleen vinkjes, en wat over is gaat gelijk over de drie. De naamkolom
// blijft een vijfde van de breedte zoals voorheen, met 196 px als plafond.
// Zin per tier (openZin, onZin): breed klapt hij in zijn eigen kolom open, onder
// de prijs. Smal staat hij tussen de koppen en de eerste rij, over de volle
// breedte en met de tiernaam erboven.
function VergelijkingTonen({ rijen, g, duur, smal, ruim, breedte, openZin, onZin }) {
  const raster = vglRaster(smal, ruim)
  const zinBasis = useId()
  const zinRegel = smal && TIERS.some(([k]) => tierZin(g.tiers[k]))
  const naamBreed = Math.max(0, Math.min(196, Math.round((breedte - 3 * raster.columnGap) * 0.2)))
  const tabel = smal ? null : { ...raster, gridTemplateColumns: `${naamBreed}px repeat(3, minmax(0, auto))` }
  const lijn = `1px solid ${C.rand}`
  return (
    <div role="table" aria-label="Vergelijking" style={{ ...tabel, marginTop: smal ? 28 : 48 }}>
      <div role="row" style={smal ? { ...raster, paddingBottom: 24 } : { display: 'contents' }}>
        {!smal && <span role="columnheader" style={{ gridColumn: 1 }} />}
        {TIERS.map(([k, naam]) => (
          <div key={k} role="columnheader" style={{ minWidth: 0, paddingBottom: smal ? 0 : 36 }}>
            <TierTonen sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g} metLijst={false} compact={smal}
              zinOpen={!!openZin[k]} onZin={() => onZin(k)} zinId={`${zinBasis}-${k}`} zinRegel={zinRegel} zinBinnen={!smal} />
          </div>
        ))}
      </div>
      {smal && TIERS.map(([k, naam]) => {
        const zin = tierZin(g.tiers[k])
        if (!zin) return null
        const Icoon = TIER_ICOON[k]
        const p = prijzen(g.tiers[k], duur, g)
        return (
          <ZinVak key={k} id={`${zinBasis}-${k}`} open={!!openZin[k]} zin={zin} perMaand={p ? p.perMaand : null} klein ruimte={[0, 20]}
            kop={(
              <span style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.68rem', color: C.zacht }}>
                <Icoon size={14} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />{naam}
              </span>
            )} />
        )
      })}
      {rijen.map((r, i) => (
        <Fragment key={i}>
          {!smal && <span role="presentation" aria-hidden="true" style={{ gridColumn: '1 / -1', borderTop: lijn }} />}
          <div role="row" style={smal ? { ...raster, rowGap: 8, padding: '14px 0', borderTop: lijn } : { display: 'contents' }}>
            <span role="rowheader" style={smal
              ? { ...LABEL, gridColumn: '1 / -1', fontSize: '0.68rem', color: C.zacht, overflowWrap: 'anywhere' }
              : { gridColumn: 1, minWidth: 0, padding: '16px 0', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, color: C.zacht, overflowWrap: 'anywhere' }}>
              {r.onderdeel}
            </span>
            {TIERS.map(([k]) => (
              <span key={k} role="cell" style={{ display: 'flex', minWidth: 0, padding: smal ? 0 : '16px 0' }}><CelInhoud waarde={r[k]} klein={smal} /></span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

// Stand Rekenen: dezelfde tabel, bewerkbaar. Tik op een cel om te typen (leeg =
// kruisje); het vinkje ernaast zet de cel op vinkje of haalt het weer weg.
// Zonder rijen staat er alleen de knop om te beginnen.
function VergelijkingBewerk({ rijen, onChange, smal, ruim }) {
  // Eén cel tegelijk open ('rij:tier'). Sluit met Enter, het vinkje, een andere
  // cel of een tik buiten de tabel. Binnen de tabel sluit alleen de knop of het
  // veld waar je op tikt: de open cel is op een smal scherm hoger, dus sluiten
  // bij het indrukken zou de rijen eronder verschuiven en de tik laten missen.
  const [actief, setActief] = useState(null)
  // Alleen een net toegevoegde rij krijgt de cursor.
  const [nieuw, setNieuw] = useState(-1)
  useEffect(() => {
    if (!actief) return undefined
    const buiten = (e) => { if (!e.target.closest?.('[data-vgl-tabel]')) setActief(null) }
    document.addEventListener('pointerdown', buiten)
    return () => document.removeEventListener('pointerdown', buiten)
  }, [actief])

  const zet = (i, veld, v) => onChange(rijen.map((r, j) => (j === i ? { ...r, [veld]: v } : r)))
  const raster = vglRaster(smal, ruim, true)
  const kopStijl = { ...LABEL, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, color: C.zacht }
  const prullenbak = (i, r) => (
    <button type="button" title="Rij weghalen" aria-label={`Rij ${r.onderdeel.trim() || i + 1} weghalen`}
      onClick={() => { setActief(null); setNieuw(-1); onChange(rijen.filter((_, j) => j !== i)) }}
      style={{ ...KAAL, width: 40, height: 40, flexShrink: 0, color: C.zacht, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
      <Trash2 size={16} strokeWidth={2.4} />
    </button>
  )
  const naamVeld = (i, r) => (
    <TekstVeld waarde={r.onderdeel} autoFocus={i === nieuw} onBlur={() => setNieuw(-1)} label={`Onderdeel ${i + 1}`} placeholder="Onderdeel"
      onChange={v => zet(i, 'onderdeel', v)} stijl={{ borderBottom: 'none', color: C.zacht }} />
  )

  return (
    <div data-vgl-tabel style={{ marginTop: 40 }}>
      {rijen.length > 0 && (
        <div style={{ ...raster, paddingBottom: 10 }}>
          {!smal && <span />}
          {TIERS.map(([k, naam]) => {
            const Icoon = TIER_ICOON[k]
            return (
              <span key={k} style={kopStijl}>
                <Icoon size={16} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{naam}</span>
              </span>
            )
          })}
          {!smal && <span />}
        </div>
      )}
      {rijen.map((r, i) => (
        <div key={i} style={{ ...raster, padding: '4px 0', borderTop: `1px solid ${C.rand}` }}>
          {smal
            ? <div onFocus={() => setActief(null)} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 4 }}>{naamVeld(i, r)}{prullenbak(i, r)}</div>
            : <div onFocus={() => setActief(null)} style={{ display: 'flex', minWidth: 0 }}>{naamVeld(i, r)}</div>}
          {TIERS.map(([k, naam]) => {
            const w = r[k]
            const sleutel = `${i}:${k}`
            const label = `${naam}, ${r.onderdeel.trim() || `rij ${i + 1}`}`
            if (actief !== sleutel) {
              return (
                <button key={k} type="button" title={naam} aria-label={`${label}: ${celSoort(w) === 'tekst' ? w.trim() : celSoort(w) === 'vink' ? 'zit erin' : 'zit er niet in'}. Bewerken`}
                  onClick={() => { setNieuw(-1); setActief(sleutel) }}
                  style={{ ...KAAL, display: 'flex', alignItems: 'flex-start', minWidth: 0, minHeight: 40, padding: '10px 0', textAlign: 'left', color: C.wit }}>
                  <CelInhoud waarde={w} klein />
                </button>
              )
            }
            return (
              <div key={k} data-vgl-actief style={{ display: 'flex', flexDirection: smal ? 'column' : 'row', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                <TekstVeld waarde={typeof w === 'string' ? w : ''} autoFocus label={label} onKlaar={() => setActief(null)}
                  onChange={v => zet(i, k, v === '' ? null : v)}
                  stijl={{ fontWeight: 800, ...(smal ? { flex: 'none', width: '100%' } : null) }} />
                <button type="button" aria-pressed={w === true} title="Vinkje" aria-label={`Vinkje ${label}`}
                  onClick={() => { zet(i, k, w === true ? null : true); setActief(null) }}
                  style={{ ...KAAL, width: 36, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, color: w === true ? C.groen : C.zacht }}>
                  <Check size={18} strokeWidth={3.5} />
                </button>
              </div>
            )
          })}
          {!smal && prullenbak(i, r)}
        </div>
      ))}
      <button type="button" onClick={() => { setActief(null); setNieuw(rijen.length); onChange([...rijen, nieuweVergelijkRij()]) }} style={{
        ...KAAL, display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, marginTop: rijen.length ? 4 : 0, padding: 0,
        color: C.groen, fontSize: '0.85rem', fontWeight: 800,
      }}>
        <Plus size={16} strokeWidth={3} /> {rijen.length ? 'Rij' : 'Vergelijking'}
      </button>
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
  // Laten zien: van welke tiers de zin open staat. Elke tier los van de andere.
  const [openZin, setOpenZin] = useState({})
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
  const wisselZin = (k) => setOpenZin(o => ({ ...o, [k]: !o[k] }))

  const smal = breedte < 760
  // Rekenen heeft per tier twee bedragen naast elkaar en dus meer breedte nodig.
  const smalRekenen = breedte < 900
  const tonen = stand === 'tonen'
  const rekenen = !!g && !tonen
  const popOpen = rekenen ? pop : null
  // Vergelijking: de rijen zoals bewaard (Rekenen) en de gevulde rijen (Laten zien).
  const vglRijen = g?.vergelijking || []
  const vglTonen = vergelijkRijen(g)
  const ruim = breedte >= 1000
  // Laten zien staat schermvullend: 90% van de breedte tot 1400 px, zodat de
  // celteksten van de vergelijking op één regel passen. De som houdt onder
  // ±1245 px de oude breedte aan (100% tot 1120), dus telefoon, tablet en split
  // screen blijven gelijk. Alleen CSS, niet de gemeten breedte: die zou met smal
  // en ruim heen en weer kunnen springen. Rekenen staat boven de bol en houdt 1120.
  const doosMaat = tonen ? { width: 'min(100%, max(1120px, 90%))', maxWidth: 1400 } : { width: '100%', maxWidth: 1120 }

  return (
    <div ref={doos} style={{ color: C.wit, ...doosMaat, margin: '0 auto' }}>
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
              <IcoonKnop icoon={Info} naam="Wat je nu verkoopt" smal={smal} aan={popOpen === 'info'} data-aanbod-pop aria-haspopup="dialog" aria-expanded={popOpen === 'info'}
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
          <div ref={paneel} role="dialog" aria-label={popOpen === 'info' ? 'Wat je nu verkoopt' : 'Partner, korting en borg'} style={{
            position: 'absolute', top: onSluit ? 'calc(100% - 6px)' : 'calc(100% + 6px)', right: 0, zIndex: 3, boxSizing: 'border-box',
            minWidth: popOpen === 'info' ? Math.min(440, breedte) : 248, maxWidth: '100%', padding: '10px 18px', borderRadius: 16, background: C.vlak, boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
          }}>
            {popOpen === 'info' && (
              <Producten lijst={g.producten || []} onChange={lijst => wijzig(oud => ({ ...oud, producten: lijst }))} />
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
                onOnderdelen={lijst => zetTier(k, t => ({ ...t, onderdelen: lijst }))}
                metLijst={vglRijen.length === 0} />
            ))}
          </div>
          <VergelijkingBewerk rijen={vglRijen} smal={smal} ruim={ruim}
            onChange={lijst => wijzig(oud => ({ ...oud, vergelijking: lijst }))} />
        </>
      )}

      {g && tonen && vglTonen.length > 0 && (
        <VergelijkingTonen rijen={vglTonen} g={g} duur={duur} smal={smal} ruim={ruim} breedte={breedte}
          openZin={openZin} onZin={wisselZin} />
      )}

      {g && tonen && vglTonen.length === 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: smal ? '1fr' : 'repeat(3, minmax(0, 1fr))', alignItems: 'start',
          gap: smal ? 48 : 56, marginTop: smal ? 32 : 48,
        }}>
          {TIERS.map(([k, naam]) => (
            <TierTonen key={k} sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g}
              open={!!openTiers[k]} onWissel={() => wisselTier(k)}
              zinOpen={!!openZin[k]} onZin={() => wisselZin(k)} />
          ))}
        </div>
      )}
    </div>
  )
}
