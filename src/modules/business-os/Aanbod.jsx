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
// Vooruitbetalen geeft gratis maanden (24 nov 2026, vervangt de korting): per
// looptijd in gegevens.gratisMaanden, aan te passen achter het tandwiel. De
// maandprijs blijft gelijk, de gratis maanden komen bovenop de looptijd.
//   Laten zien  Vooruit €1.200, in groen +3 maanden gratis.
//               Geen gratis maanden bij die looptijd: alleen het bedrag.
//   Rekenen     kolom Vooruit rekent kosten en uren over betaalde plus gratis
//               maanden, de omzet blijft het vooruitbetaalde bedrag. De rijen
//               Maanden en Uren staan er alleen als er gratis maanden zijn.
// De korting in procent (vooruitPct) bestaat nog en staat op 0: boven 0 werkt de
// oude korting ernaast, bij 0 is er nergens een korting te zien.
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
//   Kop         duur als '3 · 6 · 12' naast een kalender, de stand als twee
//               iconen (rekenmachine, oog). Alleen in Rekenen: info-icoon (de
//               huidige prijzen) en tandwiel (partner %, gratis maanden, korting %, borg) als
//               dropdown. Het groene stipje op het tandwiel = borg staat aan.
//   Tiers       dicht: icoon, naam, prijs per maand, de regel Vooruit en (Rekenen) per
//               uur met klein ernaast per uur bij vooruitbetalen. Tik klapt uit; er
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
//
// Vier rangen met eigen namen (24 nov 2026, later): de pagina toont elke tier uit
// gegevens.tiers, in de volgorde van gegevens.volgorde (tierLijst in aanbodData.js).
// De naam komt uit tier.naam (All-in, Coaching, Op koers, Solo), zonder naam de oude
// (Premium, Midden, Basis). De vierde tier (app) heeft het telefoon-icoon.
//   Rekenen     uitgeklapt: naam bovenaan aan te passen, en per tier de schakelaar
//               Gratis mnd (uit = gratisMaandenUit: bij vooruitbetalen alleen het
//               bedrag, in beide standen). Vier tiers naast elkaar zolang elke ±230 px
//               krijgt, anders twee per rij; smal onder elkaar. De vergelijking heeft
//               een kolom per tier; smal met vier tiers staan de cellen twee aan twee
//               met het tier-icoon ervoor.
//   Laten zien  vier kolommen binnen dezelfde breedte (90% tot 1400 px): smallere
//               tussenruimte, en naam en prijs schalen mee met het scherm. Onder
//               1000 px de smalle weergave (label boven de cellen). Telefoon: de
//               tabel schuift opzij (ruim twee kolommen in beeld); de onderdeelnaam
//               en een opengeklapte zin blijven links staan tijdens het schuiven.
// Drie tiers: alles zoals het was.
//
// Iconen bij de rijen en het prijsblok (24 nov 2026, einde middag):
//   Icoon       vergelijking[].icoon = naam uit de vaste lijst (RIJ_ICONEN in
//               aanbodData.js, het lucide-icoon erbij in RIJ_ICOON hier). Staat links
//               voor de onderdeelnaam, klein en grijs, in beide standen en ook smal.
//               Onbekende of lege naam = geen icoon. Heeft minstens één rij een icoon,
//               dan houden de andere rijen de plek vrij, zodat de namen onder elkaar
//               staan. Rekenen: knopje links van de naam opent de kiezer.
//   Prijsblok   per rang twee regels: groot en dik wit het bedrag per maand met klein
//               'per maand' erachter, en direct daaronder 'Vooruit €1.200' in wit met
//               in groen '+3 maanden gratis' (zonder gratis maanden alleen het
//               bedrag). De losse regel met het totaal en de looptijd bij
//               vooruitbetalen (9 maanden) zijn weg: het totaal staat achter Vooruit.
//               Zelfde regels in de kop van een tier in Rekenen (PrijsPerMaand,
//               VooruitRegel).
//   Uitlijning  de kop van de vergelijking staat per regel in het raster (naam,
//               prijs, borg, vooruit, zin), niet per rang onder elkaar. Zo staan de
//               regels van alle rangen op dezelfde hoogte, ook als er één ontbreekt
//               of afbreekt.

import { Fragment, useState, useEffect, useLayoutEffect, useRef, useId } from 'react'
import {
  CalendarDays, Calculator, Eye, Settings, Info, Crown, Target, Layers, Smartphone, Box, Wallet, Clock, List,
  ChevronDown, Check, Plus, X, CloudOff, Trash2, Quote, Pencil, CircleDashed,
  Dumbbell, Utensils, Activity, MessageCircle, Phone, Video, Camera, Calendar, Users, MapPin, ShieldCheck,
  Gift, Star, Trophy, Pill, Shirt,
} from 'lucide-react'
import { colors } from '../../ui/tokens'
import {
  DUREN, prijzen, reken, euro, leesGetal, normaliseerProduct,
  celSoort, nieuweVergelijkRij, vergelijkRijen, tierZin, gratisBij,
  tierLijst, tierStandaardNaam, RIJ_ICONEN, rijIcoonNaam,
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

// Icoon per tier. Een tier die hier niet staat krijgt het blokje (TIER_ICOON[k] || Box).
const TIER_ICOON = { premium: Crown, midden: Target, basis: Layers, app: Smartphone }
const STANDEN = [['rekenen', 'Rekenen', Calculator], ['tonen', 'Laten zien', Eye]]
// Icoon bij een rij van de vergelijking: [lucide-icoon, naam in de kiezer] per naam
// uit RIJ_ICONEN (aanbodData.js). Een naam die hier niet staat toont niets.
const RIJ_ICOON = {
  Dumbbell: [Dumbbell, 'Training'], Utensils: [Utensils, 'Voeding'], Smartphone: [Smartphone, 'App'],
  Activity: [Activity, 'Monitoring'], MessageCircle: [MessageCircle, 'Berichten'], Phone: [Phone, 'Bellen'],
  Video: [Video, 'Video'], Camera: [Camera, 'Foto'], Calendar: [Calendar, 'Agenda'], Users: [Users, 'Samen'],
  MapPin: [MapPin, 'Op locatie'], ShieldCheck: [ShieldCheck, 'Garantie'], Gift: [Gift, 'Bonus'], Star: [Star, 'Ster'],
  Trophy: [Trophy, 'Resultaat'], Pill: [Pill, 'Supplementen'], Shirt: [Shirt, 'Kleding'],
}
// Ruimte die het icoon met zijn tussenruimte inneemt voor de onderdeelnaam (breed).
const RIJ_ICOON_PLEK = 28

const toonGetal = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))
// Kaal getal in een uitkomstregel (maanden, uren): hoogstens één cijfer achter de komma.
const kaalGetal = (v) => Number(v).toLocaleString('nl-NL', { maximumFractionDigits: 1 })
const maandWoord = (aantal) => (aantal === 1 ? 'maand' : 'maanden')

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

// toon = hoe het getal eruitziet: euro's, of kaalGetal voor maanden en uren.
function Bedrag({ waarde, kleur = C.wit, groot = false, toon = euro }) {
  return (
    <span style={{ ...NUM, textAlign: 'right', whiteSpace: 'nowrap', fontSize: groot ? '1.2rem' : '1rem', fontWeight: 900, color: waarde === null ? C.zacht : kleur }}>
      {waarde === null ? '–' : toon(waarde)}
    </span>
  )
}

// Eén regel in de uitkomsten (drie cellen in het raster): gewoon en
// vooruitbetalen naast elkaar. kleur krijgt het bedrag en geeft de kleur.
function Uitkomst({ label, gewoon, vooruit, kleur, groot = false, toon = euro }) {
  return (
    <>
      <span style={{ minWidth: 0, fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>{label}</span>
      <Bedrag waarde={gewoon} kleur={kleur?.(gewoon)} groot={groot} toon={toon} />
      <Bedrag waarde={vooruit} kleur={kleur?.(vooruit)} groot={groot} toon={toon} />
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

// ── Prijs van één rang: dezelfde regels in Laten zien en Rekenen ──
// Alleen spans: in Rekenen staan de regels binnen de knop die de tier uitklapt.
// p = prijzen(tier, duur, g), of null zonder prijs.

// Groot en dik wit het bedrag per maand (hele euro's), klein erachter 'per maand'.
// Past dat niet naast elkaar, dan zakt 'per maand' onder het bedrag. gestapeld =
// altijd eronder (smalle kolommen in Rekenen, zodat alle tiers gelijk ogen).
function PrijsPerMaand({ p, maat, klein, gat = 8, regel = 1, gestapeld = false }) {
  if (!p) return <span style={{ ...NUM, display: 'block', fontSize: maat, fontWeight: 900, lineHeight: regel, color: C.zacht }}>–</span>
  return (
    <span style={{
      display: 'flex', minWidth: 0, flexDirection: gestapeld ? 'column' : 'row', flexWrap: gestapeld ? 'nowrap' : 'wrap',
      alignItems: gestapeld ? 'flex-start' : 'baseline', gap: gestapeld ? 0 : `0 ${gat}px`,
    }}>
      <span style={{ ...NUM, fontSize: maat, fontWeight: 900, lineHeight: regel, color: C.wit }}>{euro(p.perMaand)}</span>
      <span style={{ fontSize: klein, fontWeight: 700, color: C.zacht, whiteSpace: 'nowrap' }}>per maand</span>
    </span>
  )
}

// Borg verrekend (alleen als de schakelaar aan staat): het totaal, de borg die eraf
// gaat en wat er blijft. Het totaal staat hier omdat Vooruit dan het restbedrag toont.
// los: zie VooruitRegel.
function BorgRegel({ p, maat, los = false }) {
  if (!p || !(p.borg > 0)) return null
  return (
    <span title="Borg verrekend" style={{
      ...NUM, display: 'block', fontSize: maat, fontWeight: 700, lineHeight: 1.35, color: C.zacht,
      ...(los ? { width: 0, minWidth: '100%' } : null),
    }}>
      {euro(p.totaal)} {euro(-p.borg)} borg · blijft {euro(p.teBetalen)}
    </span>
  )
}

// Vooruitbetalen in één regel: 'Vooruit €1.200' in wit, in groen erachter de gratis
// maanden. Geen gratis maanden bij deze duur of deze rang (gratisMaandenUit): alleen
// het bedrag. De korting staat er alleen bij een vooruitPct boven 0. Het groene deel
// is één blok: past het niet achter het bedrag, dan zakt het in zijn geheel een regel.
// los = de regel telt niet mee in de breedte van zijn kolom (width 0 + minWidth 100%,
// zie ZinVak), anders trekt hij de vergelijkingstabel scheef.
function VooruitRegel({ p, maat, los = false }) {
  if (!p) return null
  return (
    <span title="Vooruitbetalen" style={{
      ...NUM, display: 'block', fontSize: maat, fontWeight: 800, lineHeight: 1.35, color: C.wit,
      ...(los ? { width: 0, minWidth: '100%' } : null),
    }}>
      <span style={{ whiteSpace: 'nowrap' }}>Vooruit {euro(p.vooruit)}</span>
      {p.korting > 0 && <> · <span title="Je bespaart" style={{ color: C.groen, whiteSpace: 'nowrap' }}>{euro(-p.korting)}</span></>}
      {p.gratis > 0 && <>{' '}<span style={{ display: 'inline-block', color: C.groen }}>+{p.gratis} {maandWoord(p.gratis)} gratis</span></>}
    </span>
  )
}

// ── Icoon bij een rij van de vergelijking ──
// Het icoon van één rij, klein en grijs. Geen naam of een naam buiten de vaste
// lijst: niets (met plek = een lege plek van dezelfde breedte, zodat de namen van
// alle rijen onder elkaar blijven staan).
function RijIcoon({ rij, size = 18, plek = false, style = null }) {
  const Icoon = RIJ_ICOON[rijIcoonNaam(rij)]?.[0]
  if (!Icoon) return plek ? <span aria-hidden="true" style={{ flexShrink: 0, width: size, ...style }} /> : null
  return <Icoon size={size} strokeWidth={2.2} color={C.zacht} aria-hidden="true" style={{ flexShrink: 0, ...style }} />
}

// Kiezer in Rekenen: het knopje links van de onderdeelnaam toont het icoon van de
// rij (of een leeg rondje) en opent de vaste lijst. Een tik op het gekozen icoon of
// op het kruisje haalt het weg. onKies krijgt de naam of null. De lijst klapt onder
// het knopje open; bij de onderste rijen schuift de pagina mee tot hij in beeld is.
function IcoonKiezer({ rij, label, open, onWissel, onKies }) {
  const huidig = rijIcoonNaam(rij)
  const lijst = useRef(null)
  useEffect(() => { if (open) lijst.current?.scrollIntoView?.({ block: 'nearest' }) }, [open])
  const vak = { ...KAAL, width: 40, height: 40, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  return (
    <span data-vgl-icoon style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} title="Icoon"
        aria-label={`Icoon ${label}: ${huidig ? RIJ_ICOON[huidig][1] : 'geen'}`} onClick={onWissel}
        style={{ ...KAAL, width: 30, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: C.grijs }}>
        {huidig ? <RijIcoon rij={rij} /> : <CircleDashed size={18} strokeWidth={2.2} aria-hidden="true" />}
      </button>
      {open && (
        <span ref={lijst} role="dialog" aria-label={`Icoon kiezen, ${label}`} style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 40px)',
          padding: 8, borderRadius: 14, background: C.vlak, boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
        }}>
          {RIJ_ICONEN.map(n => {
            const [Icoon, naam] = RIJ_ICOON[n] || []
            if (!Icoon) return null
            const aan = n === huidig
            return (
              <button key={n} type="button" aria-pressed={aan} title={naam} aria-label={naam} onClick={() => onKies(aan ? null : n)}
                style={{ ...vak, color: aan ? C.wit : C.zacht, background: aan ? 'rgba(255,255,255,0.14)' : 'transparent' }}>
                <Icoon size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )
          })}
          <button type="button" title="Geen icoon" aria-label="Geen icoon" onClick={() => onKies(null)} style={{ ...vak, color: C.grijs }}>
            <X size={16} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </span>
      )}
    </span>
  )
}

// Kop van één tier: het hele vlak is de knop die uitklapt.
const KOP_KNOP ={ ...KAAL, display: 'block', width: '100%', minWidth: 0, padding: 0, textAlign: 'left', color: C.wit }

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
// smalleKop = de kolom is te smal voor bedrag, 'per maand' en per uur naast elkaar:
// 'per maand' staat dan bij elke tier onder het bedrag.
function TierRekenen({ sleutel, naam, tier, duur, g, open, onWissel, onVeld, onPrijs, onOnderdelen, metLijst = true, smalleKop = false }) {
  const Icoon = TIER_ICOON[sleutel] || Box
  const p = prijzen(tier, duur, g)
  const r = reken(tier, duur, g.partnerPct, p ? p.teBetalen : null)
  // Vooruit: de gratis maanden lever je ook, dus kosten en uren lopen daarover door.
  // Krijgt deze tier ze niet (gratisMaandenUit), dan is vooruit gelijk aan gewoon.
  const vu = reken(tier, duur, g.partnerPct, p ? p.vooruit : null, gratisBij(g, duur, tier))
  const metGratis = vu.maanden !== r.maanden
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
          <PrijsPerMaand p={p} maat="2rem" klein="0.8rem" gat={6} regel={1.15} gestapeld={smalleKop} />
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
        {/* Zelfde regel als in Laten zien: het totaal staat achter Vooruit. */}
        <span style={{ display: 'block', marginTop: 2 }}>
          {p ? <VooruitRegel p={p} maat="0.8rem" /> : <span style={KLEIN}>Nog geen prijs</span>}
        </span>
      </button>

      {open && (
        <div id={id} style={{ marginTop: 20 }}>
          {/* Naam van de tier. Leeg = de standaardnaam (staat er grijs in). */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
            <span role="img" aria-label="Naam" title="Naam" style={{ display: 'flex', flexShrink: 0, paddingTop: 11, color: C.zacht }}>
              <Pencil size={18} strokeWidth={2.4} />
            </span>
            <TekstVeld waarde={tier.naam || ''} onChange={v => onVeld('naam', v)} label={`Naam ${naam}`} placeholder={tierStandaardNaam(sleutel)}
              stijl={{ fontWeight: 900 }} />
          </div>

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
            {/* Uit = deze tier krijgt bij vooruitbetalen geen gratis maanden (gratisMaandenUit). */}
            <Schakelaar aan={!tier.gratisMaandenUit} onChange={aan => onVeld('gratisMaandenUit', !aan)}
              label="Gratis mnd" naam={`Gratis maanden bij vooruitbetalen, ${naam}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', alignItems: 'baseline', gap: '10px 16px', marginTop: 24 }}>
            <span />
            <span style={{ ...LABEL, color: C.zacht, textAlign: 'right' }}>Gewoon</span>
            <span style={{ ...LABEL, color: C.zacht, textAlign: 'right' }}>Vooruit</span>
            {metGratis && <Uitkomst label="Maanden" gewoon={r.maanden} vooruit={vu.maanden} toon={kaalGetal} />}
            {p && p.borg > 0 && <Uitkomst label="Borg verrekend" gewoon={-p.borg} vooruit={-p.borg} />}
            <Uitkomst label="Omzet" gewoon={r.omzet} vooruit={vu.omzet} />
            <Uitkomst label="Partner" gewoon={r.partner === null ? null : -r.partner} vooruit={vu.partner === null ? null : -vu.partner} />
            <Uitkomst label="Kosten" gewoon={r.omzet === null ? null : -r.kosten} vooruit={vu.omzet === null ? null : -vu.kosten} />
            <Uitkomst label="Jij houdt over" gewoon={r.over} vooruit={vu.over} groot kleur={roodOnderNul(C.wit)} />
            {metGratis && <Uitkomst label="Uren" gewoon={r.uren} vooruit={vu.uren} toon={kaalGetal} />}
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

// ── Stand Laten zien. Hier komt niets van kosten, uren of partner in. ──
// Maten van naam en prijs. compact = de koppen naast elkaar op een smal scherm.
// krap = vier of meer tiers naast elkaar (niet compact): naam en prijs schalen mee
// met het scherm, zodat ze op een laptop in hun kolom passen en op een groot
// scherm even groot zijn als bij drie.
const tonenMaat = (compact, krap) => ({
  rij: { display: 'flex', alignItems: 'center', flexWrap: compact ? 'wrap' : 'nowrap', gap: compact ? '4px 6px' : krap ? 8 : 12 },
  icoon: compact ? 18 : krap ? 22 : 24,
  naam: { minWidth: 0, fontSize: compact ? '0.78rem' : krap ? 'clamp(1rem, 1.35vw, 1.25rem)' : '1.25rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', overflowWrap: 'anywhere' },
  prijs: compact ? 'clamp(1.3rem, 6.4vw, 2.2rem)' : krap ? 'clamp(2.2rem, 3.8vw, 3.6rem)' : 'clamp(2.6rem, 5vw, 3.6rem)',
  perMaand: compact ? '0.72rem' : krap ? 'clamp(0.78rem, 1.05vw, 0.95rem)' : '0.95rem',
  gat: compact ? 4 : krap ? 6 : 8,
  klein: compact ? '0.72rem' : '0.85rem',
  vooruit: compact ? '0.78rem' : '1rem',
})

// Naamregel van één rang in de kop van de vergelijking: icoon, naam en het knopje
// voor de zin (alleen met een zin). icoonBoven = het tier-icoon op een eigen regel
// (smal en minstens één tier heeft een zin): icoon, naam en knopje passen niet
// naast elkaar in 100 px, en zo staan de namen van alle rangen op één lijn.
function TierNaam({ sleutel, naam, zin, compact, krap, zinOpen, onZin, zinId, icoonBoven }) {
  const Icoon = TIER_ICOON[sleutel] || Box
  const m = tonenMaat(compact, krap)
  const icoon = <Icoon size={m.icoon} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
  return (
    <div style={m.rij}>
      {icoonBoven ? <span style={{ display: 'flex', flex: '0 0 100%' }}>{icoon}</span> : icoon}
      <span style={{ ...m.naam, flex: zin ? '0 1 auto' : 1 }}>{naam}</span>
      {zin && <ZinKnop naam={naam} open={zinOpen} onClick={onZin} controls={zinId} compact={compact} />}
    </div>
  )
}

// Eén tier met zijn lijstje onderdelen: Laten zien zonder vergelijking. (Met een
// vergelijking staat de kop per regel in de tabel, zie VergelijkingTonen.)
// Zin: onZin = tik op het knopje (zonder onZin of zonder zin geen knopje), zinOpen
// = hij staat open.
// De naamregel en de prijs zijn losse blokken: het zin-knopje mag niet in de knop
// zitten die de onderdelen uitklapt. Een tik op de prijs klapt de lijst nog wel uit.
function TierTonen({ sleutel, naam, tier, duur, g, open, onWissel, krap = false, zinOpen = false, onZin = null }) {
  const Icoon = TIER_ICOON[sleutel] || Box
  const p = prijzen(tier, duur, g)
  const lijst = tier.onderdelen.filter(o => o.trim())
  const m = tonenMaat(false, krap)
  // Zonder onderdelen valt er niets uit te klappen: dan is de naam geen knop.
  const kan = lijst.length > 0
  const id = useId()
  const zinId = useId()
  const zin = onZin ? tierZin(tier) : ''
  const icoon = <Icoon size={m.icoon} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />
  return (
    <div style={{ minWidth: 0 }}>
      <div style={m.rij}>
        {kan ? (
          <button type="button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={onWissel}
            style={{ ...KOP_KNOP, ...m.rij, flex: 1, width: 'auto' }}>
            {icoon}
            <span style={{ ...m.naam, flex: 1 }}>{naam}</span>
            <Pijl open={open} size={20} />
          </button>
        ) : (
          <>
            {icoon}
            <span style={{ ...m.naam, flex: zin ? '0 1 auto' : 1 }}>{naam}</span>
          </>
        )}
        {zin && <ZinKnop naam={naam} open={zinOpen} onClick={onZin} controls={zinId} />}
      </div>
      <div onClick={kan ? onWissel : undefined} style={{ cursor: kan ? 'pointer' : 'default' }}>
        <span style={{ display: 'block', marginTop: 16 }}><PrijsPerMaand p={p} maat={m.prijs} klein={m.perMaand} gat={m.gat} /></span>
        {p && p.borg > 0 && <span style={{ display: 'block', marginTop: 8 }}><BorgRegel p={p} maat={m.klein} /></span>}
        {p && <span style={{ display: 'block', marginTop: 12 }}><VooruitRegel p={p} maat={m.vooruit} /></span>}
      </div>
      {zin && <ZinVak id={zinId} open={zinOpen} zin={zin} perMaand={p ? p.perMaand : null} />}
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

// ── Vergelijking: één tabel voor alle tiers ──
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

// Raster van één rij voor n tiers. Breed: onderdeelnaam als eerste kolom. Smal: n
// kolommen, de naam staat er als label boven (gridColumn 1 / -1). staart = kolom
// voor de prullenbak in de bewerkbare tabel. Vier of meer tiers: minder
// tussenruimte, zodat de kolommen zelf de breedte krijgen.
const vglRaster = (n, smal, ruim, staart = false) => ({
  display: 'grid', alignItems: 'start',
  gridTemplateColumns: smal ? `repeat(${n}, minmax(0, 1fr))` : `minmax(0, 0.75fr) repeat(${n}, minmax(0, 1fr))${staart ? ' 40px' : ''}`,
  columnGap: smal ? 12 : n > 3 ? (ruim && !staart ? 32 : 24) : ruim ? 48 : 24,
})

// Smalste kolom waarin een cel met tekst nog leest (telefoon, vier of meer tiers).
const SCHUIF_MIN = 132

// Stand Laten zien: de tiers met prijs als kolomkop, daaronder de onderdelen.
// Smal: elke rij is zijn eigen raster, de naam staat als label boven de cellen.
// Breed: één raster voor de hele tabel (de rijen zelf doen niet mee: display
// contents, de lijn ertussen is een eigen strook). Zo meet de browser de
// tier-kolommen op hun inhoud: een kolom met lange teksten wordt breder dan een
// kolom met alleen vinkjes, en wat over is gaat gelijk over de kolommen. De naamkolom
// blijft een vijfde van de breedte zoals voorheen, met 196 px als plafond (plus de
// plek van het icoon als de rijen iconen hebben).
// Kop: per regel een rij over alle rangen (naam, prijs per maand, borg als die aan
// staat, vooruitbetalen, zin). Elke regel begint zo bij alle rangen op dezelfde
// hoogte, ook als hij bij één rang ontbreekt of over twee regels loopt.
// Zin per tier (openZin, onZin): breed klapt hij in zijn eigen kolom open, onder
// de prijs. Smal staat hij tussen de koppen en de eerste rij, over de volle
// breedte en met de tiernaam erboven.
// Schuiven (telefoon, vier of meer tiers): passen de kolommen niet met minstens
// SCHUIF_MIN px elk, dan krijgen ze een vaste breedte (ruim twee in beeld, de
// afgesneden derde laat zien dat er meer is) en schuift de tabel opzij. De
// onderdeelnaam en een open zin plakken links (sticky), zodat ze in beeld blijven.
function VergelijkingTonen({ tiers, rijen, g, duur, smal, ruim, breedte, openZin, onZin }) {
  const n = tiers.length
  const raster = vglRaster(n, smal, ruim)
  const zinBasis = useId()
  const zinRegel = smal && tiers.some(([k]) => tierZin(g.tiers[k]))
  const schuif = smal && n > 3 && (breedte - (n - 1) * raster.columnGap) / n < SCHUIF_MIN
  const kolom = Math.round(Math.min(168, Math.max(SCHUIF_MIN, breedte * 0.42)))
  const rijRaster = schuif ? { ...raster, gridTemplateColumns: `repeat(${n}, ${kolom}px)` } : raster
  const plak = schuif ? { position: 'sticky', left: 0, boxSizing: 'border-box' } : null
  // Heeft minstens één rij een icoon, dan houdt elke rij de plek vrij.
  const metIcoon = rijen.some(r => rijIcoonNaam(r))
  const naamBreed = Math.max(0, Math.min(196, Math.round((breedte - n * raster.columnGap) * 0.2))) + (metIcoon ? RIJ_ICOON_PLEK : 0)
  const tabel = smal
    ? (schuif ? { width: n * kolom + (n - 1) * raster.columnGap } : null)
    : { ...raster, gridTemplateColumns: `${naamBreed}px repeat(${n}, minmax(0, auto))` }
  const lijn = `1px solid ${C.rand}`
  const marge = smal ? 28 : 48
  const m = tonenMaat(smal, n > 3)
  const prijs = Object.fromEntries(tiers.map(([k]) => [k, prijzen(g.tiers[k], duur, g)]))
  const metBorg = tiers.some(([k]) => prijs[k] && prijs[k].borg > 0)
  // Eén regel van de kop over alle rangen. Breed zijn de cellen losse vakken in het
  // raster van de tabel (elke rang in zijn eigen kolom), smal is de regel een eigen
  // raster met dezelfde kolommen als de rijen eronder. ruimte = [boven, onder] in px.
  const kopRegel = (rol, [boven, onder], cel) => (
    <div role="row" style={smal ? { ...rijRaster, paddingTop: boven, paddingBottom: onder } : { display: 'contents' }}>
      {!smal && <span role={rol} style={{ gridColumn: 1 }} />}
      {tiers.map(([k, naam], i) => (
        <div key={k} role={rol} style={smal ? { minWidth: 0 } : { gridColumn: i + 2, minWidth: 0, paddingTop: boven, paddingBottom: onder }}>
          {cel(k, naam)}
        </div>
      ))}
    </div>
  )
  const inhoud = (
    <div role="table" aria-label="Vergelijking" style={{ ...tabel, marginTop: schuif ? 0 : marge }}>
      {kopRegel('columnheader', [0, 0], (k, naam) => (
        <TierNaam sleutel={k} naam={naam} zin={tierZin(g.tiers[k])} compact={smal} krap={n > 3}
          zinOpen={!!openZin[k]} onZin={() => onZin(k)} zinId={`${zinBasis}-${k}`} icoonBoven={zinRegel} />
      ))}
      {kopRegel('cell', [smal ? 10 : 16, 0], k => <PrijsPerMaand p={prijs[k]} maat={m.prijs} klein={m.perMaand} gat={m.gat} />)}
      {metBorg && kopRegel('cell', [smal ? 6 : 8, 0], k => <BorgRegel p={prijs[k]} maat={m.klein} los />)}
      {kopRegel('cell', [smal ? 8 : 12, smal ? 24 : 0], k => <VooruitRegel p={prijs[k]} maat={m.vooruit} los />)}
      {!smal && kopRegel('cell', [0, 36], k => {
        const zin = tierZin(g.tiers[k])
        return zin ? <ZinVak id={`${zinBasis}-${k}`} open={!!openZin[k]} zin={zin} perMaand={prijs[k] ? prijs[k].perMaand : null} /> : null
      })}
      {smal && tiers.map(([k, naam]) => {
        const zin = tierZin(g.tiers[k])
        if (!zin) return null
        const Icoon = TIER_ICOON[k] || Box
        return (
          <div key={k} style={plak ? { ...plak, width: breedte } : null}>
            <ZinVak id={`${zinBasis}-${k}`} open={!!openZin[k]} zin={zin} perMaand={prijs[k] ? prijs[k].perMaand : null} klein ruimte={[0, 20]}
              kop={(
                <span style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.68rem', color: C.zacht }}>
                  <Icoon size={14} strokeWidth={2.4} aria-hidden="true" style={{ flexShrink: 0 }} />{naam}
                </span>
              )} />
          </div>
        )
      })}
      {rijen.map((r, i) => (
        <Fragment key={i}>
          {!smal && <span role="presentation" aria-hidden="true" style={{ gridColumn: '1 / -1', borderTop: lijn }} />}
          <div role="row" style={smal ? { ...rijRaster, rowGap: 8, padding: '14px 0', borderTop: lijn } : { display: 'contents' }}>
            {/* Icoon links voor de naam: klein en grijs. Zonder icoon blijft de plek leeg. */}
            <span role="rowheader" style={smal
              ? { ...LABEL, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: '0.68rem', color: C.zacht, ...(plak ? { ...plak, justifySelf: 'start', maxWidth: breedte } : null) }
              : { gridColumn: 1, display: 'flex', alignItems: 'flex-start', gap: RIJ_ICOON_PLEK - 18, minWidth: 0, padding: '16px 0', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, color: C.zacht }}>
              {metIcoon && <RijIcoon rij={r} size={smal ? 14 : 18} plek style={smal ? null : { marginTop: 1 }} />}
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.onderdeel}</span>
            </span>
            {tiers.map(([k]) => (
              <span key={k} role="cell" style={{ display: 'flex', minWidth: 0, padding: smal ? 0 : '16px 0' }}><CelInhoud waarde={r[k]} klein={smal} /></span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
  if (!schuif) return inhoud
  return (
    <div style={{ marginTop: marge, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}>
      {inhoud}
    </div>
  )
}

// Stand Rekenen: dezelfde tabel, bewerkbaar. Tik op een cel om te typen (leeg =
// kruisje); het vinkje ernaast zet de cel op vinkje of haalt het weer weg.
// Zonder rijen staat er alleen de knop om te beginnen.
// blok = smal met vier of meer tiers: de cellen staan twee aan twee onder de
// onderdeelnaam, elk met het tier-icoon ervoor (vier naast elkaar is te smal om
// in te typen). De kop erboven is dan de legenda in dezelfde twee kolommen.
// Icoon per rij: het knopje links van de onderdeelnaam opent de kiezer (één rij
// tegelijk). Die sluit na een keuze, met een tik ernaast of met Escape.
function VergelijkingBewerk({ tiers, rijen, onChange, smal, ruim }) {
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
  // Van welke rij de icoon-kiezer open staat (-1 = geen).
  const [kiest, setKiest] = useState(-1)
  useEffect(() => {
    if (kiest < 0) return undefined
    const buiten = (e) => { if (!e.target.closest?.('[data-vgl-icoon]')) setKiest(-1) }
    const toets = (e) => { if (e.key === 'Escape') setKiest(-1) }
    document.addEventListener('pointerdown', buiten)
    window.addEventListener('keydown', toets)
    return () => { document.removeEventListener('pointerdown', buiten); window.removeEventListener('keydown', toets) }
  }, [kiest])

  const zet = (i, veld, v) => onChange(rijen.map((r, j) => (j === i ? { ...r, [veld]: v } : r)))
  const n = tiers.length
  const blok = smal && n > 3
  const raster = blok
    ? { display: 'grid', alignItems: 'start', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12 }
    : vglRaster(n, smal, ruim, true)
  // Typveld boven het vinkje: alleen in de smalle cellen van drie naast elkaar.
  const gestapeld = smal && !blok
  const kopStijl = { ...LABEL, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, color: C.zacht }
  const prullenbak = (i, r) => (
    <button type="button" title="Rij weghalen" aria-label={`Rij ${r.onderdeel.trim() || i + 1} weghalen`}
      onClick={() => { setActief(null); setNieuw(-1); setKiest(-1); onChange(rijen.filter((_, j) => j !== i)) }}
      style={{ ...KAAL, width: 40, height: 40, flexShrink: 0, color: C.zacht, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
      <Trash2 size={16} strokeWidth={2.4} />
    </button>
  )
  const kiezer = (i, r) => (
    <IcoonKiezer rij={r} label={r.onderdeel.trim() || `rij ${i + 1}`} open={kiest === i}
      onWissel={() => { setActief(null); setNieuw(-1); setKiest(k => (k === i ? -1 : i)) }}
      onKies={naam => { zet(i, 'icoon', naam); setKiest(-1) }} />
  )
  const naamVeld = (i, r) => (
    <TekstVeld waarde={r.onderdeel} autoFocus={i === nieuw} onBlur={() => setNieuw(-1)} label={`Onderdeel ${i + 1}`} placeholder="Onderdeel"
      onChange={v => zet(i, 'onderdeel', v)} stijl={{ borderBottom: 'none', color: C.zacht }} />
  )

  return (
    <div data-vgl-tabel style={{ marginTop: 40 }}>
      {rijen.length > 0 && (
        <div style={{ ...raster, rowGap: 6, paddingBottom: 10 }}>
          {!smal && <span />}
          {tiers.map(([k, naam]) => {
            const Icoon = TIER_ICOON[k] || Box
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
            ? <div onFocus={() => setActief(null)} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 4 }}>{kiezer(i, r)}{naamVeld(i, r)}{prullenbak(i, r)}</div>
            : <div onFocus={() => setActief(null)} style={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>{kiezer(i, r)}{naamVeld(i, r)}</div>}
          {tiers.map(([k, naam]) => {
            const w = r[k]
            const sleutel = `${i}:${k}`
            const label = `${naam}, ${r.onderdeel.trim() || `rij ${i + 1}`}`
            const Icoon = TIER_ICOON[k] || Box
            // Alleen in blok: welk tier deze cel is.
            const merk = blok
              ? <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0, paddingTop: 2, color: C.zacht }}><Icoon size={14} strokeWidth={2.4} /></span>
              : null
            if (actief !== sleutel) {
              return (
                <button key={k} type="button" title={naam} aria-label={`${label}: ${celSoort(w) === 'tekst' ? w.trim() : celSoort(w) === 'vink' ? 'zit erin' : 'zit er niet in'}. Bewerken`}
                  onClick={() => { setNieuw(-1); setActief(sleutel) }}
                  style={{ ...KAAL, display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0, minHeight: 40, padding: '10px 0', textAlign: 'left', color: C.wit }}>
                  {merk}
                  <CelInhoud waarde={w} klein />
                </button>
              )
            }
            return (
              <div key={k} data-vgl-actief style={{ display: 'flex', flexDirection: gestapeld ? 'column' : 'row', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                {merk && <span style={{ display: 'flex', paddingTop: 10, marginRight: 4 }}>{merk}</span>}
                <TekstVeld waarde={typeof w === 'string' ? w : ''} autoFocus label={label} onKlaar={() => setActief(null)}
                  onChange={v => zet(i, k, v === '' ? null : v)}
                  stijl={{ fontWeight: 800, ...(gestapeld ? { flex: 'none', width: '100%' } : null) }} />
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
      <button type="button" onClick={() => { setActief(null); setKiest(-1); setNieuw(rijen.length); onChange([...rijen, nieuweVergelijkRij(tiers.map(([k]) => k))]) }} style={{
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
  // De tiers in de volgorde van het scherm: [[sleutel, naam]].
  const tiers = g ? tierLijst(g) : []
  const n = tiers.length
  const veel = n > 3
  // Vier of meer tiers: de tabellen gaan eerder naar de smalle weergave (label
  // boven de cellen), anders worden de kolommen te smal voor naam en prijs.
  const smalTonen = breedte < (veel ? 1000 : 760)
  const smalBewerk = breedte < (veel ? 900 : 760)
  // Rekenen: alle tiers naast elkaar zolang elke ±230 px krijgt. Passen vier of
  // meer niet, dan twee per rij.
  const gatRekenen = veel ? 32 : 48
  const kolRekenen = smalRekenen ? 1 : !veel || (breedte - (n - 1) * gatRekenen) / n >= 232 ? n : 2
  // Onder ±300 px per tier past 'per maand' niet meer tussen het bedrag en per uur.
  const smalleKop = (breedte - (kolRekenen - 1) * (kolRekenen > 3 ? gatRekenen : 48)) / kolRekenen < 300
  // Laten zien zonder vergelijking (lijstjes per tier): zelfde gedachte.
  const kolTonen = smal ? 1 : veel && breedte < 1000 ? 2 : n
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
              <IcoonKnop icoon={Settings} naam={`Partner, vooruitbetalen en borg${g.borgAan ? ' (borg aan)' : ''}`} smal={smal} aan={popOpen === 'instel'} stip={g.borgAan}
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
          <div ref={paneel} role="dialog" aria-label={popOpen === 'info' ? 'Wat je nu verkoopt' : 'Partner, vooruitbetalen en borg'} style={{
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
                {/* Gratis maanden bij vooruitbetalen, per looptijd: '6 +3' = 6 vooruit, 3 gratis. */}
                <InstelRij label="Gratis mnd" naam="Gratis maanden bij vooruitbetalen, per looptijd">
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    {DUREN.map(d => (
                      <span key={d} title={`${d} maanden vooruit`} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span aria-hidden="true" style={{ ...NUM, ...KLEIN }}>{d}</span>
                        <span aria-hidden="true" style={{ ...KLEIN, fontWeight: 900, color: C.groen }}>+</span>
                        <GetalVeld waarde={g.gratisMaanden?.[d]} label={`Gratis maanden bij ${d} maanden vooruit`} placeholder="0" breedte={26}
                          onChange={v => wijzig(oud => ({ ...oud, gratisMaanden: { ...oud.gratisMaanden, [d]: v === null ? null : Math.max(0, Math.round(v)) } }))} />
                      </span>
                    ))}
                  </span>
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
            display: 'grid', gridTemplateColumns: `repeat(${kolRekenen}, minmax(0, 1fr))`, alignItems: 'start',
            gap: smalRekenen ? 40 : kolRekenen > 3 ? `48px ${gatRekenen}px` : 48, marginTop: onSluit ? 16 : 28,
          }}>
            {tiers.map(([k, naam]) => (
              <TierRekenen key={k} sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g}
                open={!!openTiers[k]} onWissel={() => wisselTier(k)}
                onPrijs={v => zetTier(k, t => ({ ...t, prijs: { ...t.prijs, [duur]: v } }))}
                onVeld={(veld, v) => zetTier(k, t => ({ ...t, [veld]: v }))}
                onOnderdelen={lijst => zetTier(k, t => ({ ...t, onderdelen: lijst }))}
                metLijst={vglRijen.length === 0} smalleKop={smalleKop} />
            ))}
          </div>
          <VergelijkingBewerk tiers={tiers} rijen={vglRijen} smal={smalBewerk} ruim={ruim}
            onChange={lijst => wijzig(oud => ({ ...oud, vergelijking: lijst }))} />
        </>
      )}

      {g && tonen && vglTonen.length > 0 && (
        <VergelijkingTonen tiers={tiers} rijen={vglTonen} g={g} duur={duur} smal={smalTonen} ruim={ruim} breedte={breedte}
          openZin={openZin} onZin={wisselZin} />
      )}

      {g && tonen && vglTonen.length === 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${kolTonen}, minmax(0, 1fr))`, alignItems: 'start',
          gap: smal ? 48 : kolTonen > 3 ? '56px 40px' : 56, marginTop: smal ? 32 : 48,
        }}>
          {tiers.map(([k, naam]) => (
            <TierTonen key={k} sleutel={k} naam={naam} tier={g.tiers[k]} duur={duur} g={g} krap={kolTonen > 3}
              open={!!openTiers[k]} onWissel={() => wisselTier(k)}
              zinOpen={!!openZin[k]} onZin={() => wisselZin(k)} />
          ))}
        </div>
      )}
    </div>
  )
}
