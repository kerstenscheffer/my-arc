// src/pages/MijnMenu.jsx
// Lead magnet /mijn-menu (23 okt 2026): zeven vragen (doel, over jou,
// activiteit, maaltijden per dag, dieet, wat je niet lust, naam + e-mail), dan
// een weekmenu op jouw calorieën uit de dagmenu- en wisselgerechten van
// Kersten, met wisselknop per maaltijd en een PDF (recepten + boodschappen).
// De lead komt op het bord in "🧲 Mijn menu" (RPC submit_mijn_menu).
//
// Opbouw van de pagina: LeadMagnetPagina (zelfde als /mijn-split). Rekenen:
// mijn-menu/menuRegels.js. PDF: mijn-menu/menuPdf.js. Meting: meet() met pad
// /mijn-menu, in het Ads-scherm als eigen pagina.
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Loader2, RefreshCw, Flame, Wheat, Egg, Droplet, List } from 'lucide-react'
import MealCard from '../modules/meal-plan/components/day-schedule/MealCard'
import db from '../services/DatabaseService'
import { herkomst, meet } from './challengeTracking'
import { Optie, LeadMagnetPagina, GegevensVelden } from './leadmagnet/Bouwstenen'
import { CTA_GROEN, WIT, ZWAK, FONT, emailOk, knopWit, invoer, bewaardeGegevens, onthoudGegevens } from './leadmagnet/stijl'
import {
  DOELEN, GESLACHT, ACTIVITEIT, MAALTIJDEN, VARIATIE, vasteMomenten, DIEET, LUST_NIET, MOMENT_NAAM, DAGEN,
  berekenDoel, groepeer, maakWeek, wissel, alternatievenVoor, dagTotaal, hoeveel, verwachting, kgTekst, MACRO, aandeel,
} from './mijn-menu/menuRegels'
import { maakMenuPdf } from './mijn-menu/menuPdf'
import { mailPdf } from './leadmagnet/mailPdf'

// YouTube-id van de uitlegvideo. Leeg = stilstaand beeld zonder afspeelknop.
const VIDEO_ID = ''

const PAGINA = {
  pil: 'Gratis weekmenu',
  kop: 'Wat moet jij eten om je doel te halen?',
  sub: 'Beantwoord 8 korte vragen en krijg een weekmenu op jouw calorieën, uit de gerechten van mijn klanten.',
  videoId: VIDEO_ID, poster: '/mijn-menu/poster.jpg', cta: 'Maak mijn menu',
  stappen: [
    { kop: 'Vragen', sub: '8 korte vragen' },
    { kop: 'Menu', sub: 'op jouw calorieën' },
    { kop: 'Boodschappen', sub: 'lijst erbij' },
  ],
  inhoud: [
    'Zeven dagen eten, op de gram uitgerekend op jouw calorieën.',
    'Rekening gehouden met allergieën en wat je niet lust.',
    'Bij elk gerecht hoe je het maakt.',
    'Een boodschappenlijst voor de hele week.',
  ],
  voorbeeldTekst: "Een PDF van zo'n 16 pagina's, gemaakt op jouw antwoorden.",
  voorbeelden: [
    { src: '/mijn-menu/voorbeeld-1.jpg', label: 'Jouw menu' },
    { src: '/mijn-menu/voorbeeld-2.jpg', label: 'Jouw cijfers' },
    { src: '/mijn-menu/voorbeeld-3.jpg', label: 'Elke dag uitgeschreven' },
    { src: '/mijn-menu/voorbeeld-4.jpg', label: 'Boodschappenlijst' },
  ],
  coachKort: 'En dit is hoe mijn klanten eten.',
  coachSlot: 'Deze gerechten zijn dezelfde waar mijn klanten mee werken. Zo zie je hoe ik het aanpak, en kun je er vandaag mee beginnen.',
  slotKop: 'Klaar voor je menu?',
  slotTekst: 'Acht vragen, dan staat hij voor je klaar.',
}

const STAPPEN = ['doel', 'overjou', 'activiteit', 'maaltijden', 'variatie', 'dieet', 'lustniet', 'gegevens']
const TOTAAL = STAPPEN.length
const TITELS = {
  doel: 'Wat is je doel?',
  overjou: 'Even over jou',
  activiteit: 'Hoe actief ben je?',
  maaltijden: 'Hoeveel keer per dag eet je?',
  variatie: 'Hoeveel afwisseling wil je?',
  dieet: 'Moet je ergens rekening mee houden?',
  lustniet: 'Wat lust je echt niet?',
  gegevens: 'Waar mag je menu heen?',
}

const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n }
const overJouOk = (a) => {
  const l = num(a.leeftijd), h = num(a.lengte), w = num(a.gewicht)
  return !!a.geslacht && l >= 15 && l <= 90 && h >= 130 && h <= 230 && w >= 40 && w <= 250
}

function MenuFlow({ m }) {
  const [stap, setStap] = useState(0)
  const [antw, setAntw] = useState({
    doel: null, geslacht: 'man', leeftijd: '', lengte: '', gewicht: '', activiteit: null, maaltijden: null, variatie: null,
    dieet: [], lustNiet: [], lust_eigen: '', ...bewaardeGegevens(),
  })
  const [gerechten, setGerechten] = useState(null)
  const [cijfers, setCijfers] = useState(null)
  const [week, setWeek] = useState(null)
  const groepenRef = useRef(null)
  const [bezig, setBezig] = useState(false)
  const [pdfBezig, setPdfBezig] = useState(false)
  const [fout, setFout] = useState('')
  // Lead-id voor de PDF-mail; bij de eerste download gaat dezelfde PDF ook naar de mail.
  const [leadId, setLeadId] = useState(null)
  const [gemaild, setGemaild] = useState(false)
  const mailGestart = useRef(false)
  const utm = useRef(herkomst())
  const doorTimer = useRef(null)
  const bovenRef = useRef(null)
  const gezien = useRef(new Set())
  const laden = useRef(null)

  useEffect(() => () => clearTimeout(doorTimer.current), [])
  useEffect(() => { bovenRef.current?.scrollIntoView?.({ block: 'start' }) }, [stap])
  useEffect(() => {
    const vraag = STAPPEN[stap]
    if (!vraag || gezien.current.has(vraag)) return
    gezien.current.add(vraag)
    meet('form_vraag', { meta: { stap: stap + 1, vraag } })
  }, [stap])

  // De gerechten pas ophalen als iemand aan de vragen begint (± 0,8 MB).
  const haalGerechten = () => {
    if (!laden.current) {
      laden.current = db.supabase.rpc('get_mijn_menu_maaltijden').then(({ data, error }) => {
        if (error || !Array.isArray(data)) { laden.current = null; throw error || new Error('geen gerechten') }
        setGerechten(data)
        return data
      })
    }
    return laden.current
  }
  useEffect(() => { if (stap >= 1) haalGerechten().catch(() => null) }, [stap])

  const huidig = STAPPEN[stap]
  const gegevensOk = antw.voornaam.trim().length > 0 && emailOk(antw.email)
  const volgende = (vraag) => { meet('form_stap', { meta: { stap: stap + 1, vraag } }); setStap(s => s + 1) }
  const kies = (veld, waarde) => {
    meet('form_stap', { meta: { stap: stap + 1, vraag: veld } })
    setAntw(a => ({ ...a, [veld]: waarde }))
    clearTimeout(doorTimer.current)
    doorTimer.current = setTimeout(() => setStap(s => s + 1), 220)
  }
  const wisselLijst = (veld, key) => setAntw(a => ({ ...a, [veld]: a[veld].includes(key) ? a[veld].filter(k => k !== key) : [...a[veld], key] }))
  const terug = () => { clearTimeout(doorTimer.current); if (stap > 0) setStap(stap - 1) }

  const verstuur = async () => {
    if (!gegevensOk || bezig) return
    setBezig(true); setFout('')
    try {
      const data = gerechten || await haalGerechten()
      const c = berekenDoel(antw)
      if (!c) throw new Error('cijfers ontbreken')
      const groepen = groepeer(data, { dieet: antw.dieet, lustNiet: antw.lustNiet })
      groepenRef.current = groepen
      const w = maakWeek(groepen, c, antw.maaltijden, antw.email.trim().toLowerCase(), antw.variatie)

      const doelLabel = DOELEN.find(d => d.key === antw.doel)?.label
      const dieet = DIEET.filter(d => antw.dieet.includes(d.key)).map(d => d.label).join(', ')
      const lustNiet = LUST_NIET.filter(l => antw.lustNiet.includes(l.key)).map(l => l.label).join(', ')
      const eigen = antw.lust_eigen.trim()
      const activiteit = ACTIVITEIT.find(a => a.key === antw.activiteit)?.label
      const variatie = VARIATIE.find(v => v.key === antw.variatie)?.label
      const u = utm.current || {}
      const { data: nieuwId, error } = await db.supabase.rpc('submit_mijn_menu', { p: {
        voornaam: antw.voornaam.trim(),
        email: antw.email.trim(),
        doel: doelLabel,
        samenvatting: `Mijn menu: ${c.kcal} kcal (${doelLabel?.toLowerCase()}), ${antw.maaltijden} maaltijden per dag, ${variatie?.toLowerCase()}. ${antw.geslacht === 'vrouw' ? 'Vrouw' : 'Man'}, ${antw.leeftijd} jaar, ${antw.lengte} cm, ${antw.gewicht} kg, ${activiteit?.toLowerCase()}.${dieet ? ` Dieet: ${dieet}.` : ''}${lustNiet ? ` Lust niet: ${lustNiet}.` : ''}${eigen ? ` Anders: ${eigen}` : ''}`,
        antwoorden: [
          { vraag: 'Doel', antwoord: doelLabel },
          { vraag: 'Over jou', antwoord: `${antw.geslacht === 'vrouw' ? 'Vrouw' : 'Man'}, ${antw.leeftijd} jaar, ${antw.lengte} cm, ${antw.gewicht} kg` },
          { vraag: 'Activiteit', antwoord: activiteit },
          { vraag: 'Maaltijden per dag', antwoord: String(antw.maaltijden) },
          { vraag: 'Afwisseling', antwoord: variatie },
          { vraag: 'Dieet', antwoord: dieet || 'Geen' },
          { vraag: 'Lust niet', antwoord: lustNiet || 'Alles' },
          ...(eigen ? [{ vraag: 'Iets anders', antwoord: eigen }] : []),
          { vraag: 'Caloriedoel', antwoord: `${c.kcal} kcal · ${c.eiwit} g eiwit · ${c.kh} g kh · ${c.vet} g vet` },
        ],
        utm_source: u.utm_source, utm_medium: u.utm_medium, utm_campaign: u.utm_campaign,
        utm_content: u.utm_content, referrer: u.referrer,
      } })
      if (error) throw error
      meet('form_stap', { meta: { stap: TOTAAL, vraag: 'gegevens' } })
      meet('form_klaar', { meta: { uitkomst: 'A', vraag: 'gegevens' }, lead_id: nieuwId || null })
      setLeadId(nieuwId || null)
      onthoudGegevens(antw)
      setCijfers(c); setWeek(w)
      setStap(TOTAAL)
    } catch (e) {
      console.error('mijn-menu opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Controleer je e-mail en probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const download = async () => {
    if (pdfBezig || !week) return
    setPdfBezig(true); setFout('')
    try {
      const doc = await maakMenuPdf({ voornaam: antw.voornaam.trim(), doel: antw.doel, cijfers, week, aantal: antw.maaltijden })
      // Eerst meten: op een iPhone kan opslaan de pagina verlaten voor het verzoek weg is.
      meet('pdf_download', { meta: { kcal: cijfers.kcal } })
      doc.save('mijn-weekmenu.pdf')
      if (!mailGestart.current) {
        mailGestart.current = true
        mailPdf({ soort: 'menu', leadId, email: antw.email.trim(), voornaam: antw.voornaam.trim(), doc }).then(ok => ok && setGemaild(true))
      }
    } catch (e) {
      console.error('PDF mislukt:', e)
      setFout('Downloaden lukte niet. Probeer het nog een keer.')
    } finally { setPdfBezig(false) }
  }

  const wisselMaaltijd = (dag, plek, naam) => {
    meet('maaltijd_wissel', { meta: { van: week[dag].maaltijden[plek].naam, naar: naam } })
    setWeek(w => wissel(w, groepenRef.current, dag, plek, naam, antw.variatie))
  }

  const kop = (tekst) => (
    <h2 style={{ margin: 0, fontSize: m ? '1.6rem' : '2rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', color: WIT, textAlign: 'center' }}>{tekst}</h2>
  )
  const buitenkant = {
    maxWidth: 560, margin: '0 auto', width: '100%', boxSizing: 'border-box',
    padding: m ? '4.4rem 1.1rem 1.3rem' : '5.2rem 1.6rem 1.6rem', color: WIT, fontFamily: FONT,
  }

  // ── Klaar ──
  if (stap >= TOTAAL && week) {
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} style={{ scrollMarginTop: m ? 64 : 80 }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
          <Check size={34} strokeWidth={3.2} color="#000" />
        </div>
        {kop(`${antw.voornaam.trim()}, je weekmenu staat klaar.`)}
        <button onClick={download} disabled={pdfBezig} style={{ ...knopWit(m, pdfBezig), marginTop: '1.4rem', background: CTA_GROEN, color: WIT }}>
          {pdfBezig ? <Loader2 size={22} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={22} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download en mail je menu'}
        </button>
        {gemaild && <div style={{ marginTop: '0.8rem', fontSize: '0.86rem', fontWeight: 800, color: '#86efac', textAlign: 'center' }}>Ook naar {antw.email.trim()} gestuurd.</div>}
        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
        <MenuOverzicht m={m} cijfers={cijfers} week={week} vast={vasteMomenten(antw.variatie)} groepen={groepenRef.current} onWissel={wisselMaaltijd} onDownload={download} pdfBezig={pdfBezig} />
      </div>
    )
  }

  // ── Vraag ──
  const nummer = stap + 1
  const deel = TOTAAL > 1 ? (nummer - 1) / (TOTAAL - 1) : 1
  const voortgangKleur = `hsl(${Math.round(110 + deel * 32)}, ${Math.round(50 + deel * 30)}%, ${Math.round(64 - deel * 20)}%)`
  const lijst = { doel: DOELEN, activiteit: ACTIVITEIT, maaltijden: MAALTIJDEN, variatie: VARIATIE }[huidig]
  const veldLabel = { fontSize: '0.8rem', fontWeight: 800, color: ZWAK, margin: '0.2rem 0 -0.2rem' }

  return (
    <div style={buitenkant}>
      <div ref={bovenRef} style={{ scrollMarginTop: m ? 64 : 80 }} />
      <div style={{ marginBottom: m ? '1.4rem' : '1.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <button onClick={terug} aria-label="Vorige vraag" style={{ display: stap === 0 ? 'none' : 'inline-flex', alignItems: 'center', padding: '4px 4px 4px 0', background: 'none', border: 'none', color: WIT, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <ArrowLeft size={17} strokeWidth={2.8} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap' }}>Gratis weekmenu</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: voortgangKleur, fontVariantNumeric: 'tabular-nums', transition: 'color 0.35s ease' }}>
            Stap {nummer} van {TOTAAL}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ width: `${(nummer / TOTAAL) * 100}%`, height: '100%', background: voortgangKleur, borderRadius: 4, transition: 'width 0.35s ease, background-color 0.35s ease' }} />
        </div>
      </div>

      <div key={huidig} style={{ animation: 'vraagIn 0.25s ease' }}>
        {kop(TITELS[huidig])}
        <div style={{ marginTop: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {lijst && lijst.map(o => (
            <Optie key={o.key} label={o.label} m={m} aan={antw[huidig] === o.key} onClick={() => kies(huidig, o.key)} />
          ))}

          {huidig === 'overjou' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                {GESLACHT.map(g => <Optie key={g.key} label={g.label} m={m} aan={antw.geslacht === g.key} onClick={() => setAntw(a => ({ ...a, geslacht: g.key }))} />)}
              </div>
              {[['leeftijd', 'Leeftijd', 'jaar'], ['lengte', 'Lengte', 'cm'], ['gewicht', 'Gewicht', 'kg']].map(([veld, label, eenheid]) => (
                <label key={veld} style={{ display: 'block' }}>
                  <div style={veldLabel}>{label}</div>
                  <div style={{ position: 'relative', marginTop: 6 }}>
                    <input value={antw[veld]} inputMode="decimal" onChange={e => setAntw(a => ({ ...a, [veld]: e.target.value }))}
                      placeholder={veld === 'leeftijd' ? '30' : veld === 'lengte' ? '180' : '80'} style={{ ...invoer(m), paddingRight: '3.2rem' }} />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: 800, color: ZWAK }}>{eenheid}</span>
                  </div>
                </label>
              ))}
            </>
          )}

          {huidig === 'dieet' && (
            <>
              <Optie label="Nee, ik eet alles" m={m} aan={false} onClick={() => { setAntw(a => ({ ...a, dieet: [] })); volgende('dieet') }} />
              {DIEET.map(d => <Optie key={d.key} label={d.label} m={m} meer aan={antw.dieet.includes(d.key)} onClick={() => wisselLijst('dieet', d.key)} />)}
            </>
          )}

          {huidig === 'lustniet' && (
            <>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: ZWAK, textAlign: 'center', marginTop: '-0.4rem' }}>Tik aan wat je niet wilt. Die gerechten slaan we over.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {LUST_NIET.map(l => {
                  const aan = antw.lustNiet.includes(l.key)
                  return (
                    <button key={l.key} onClick={() => wisselLijst('lustNiet', l.key)} style={{
                      padding: '0.6rem 0.95rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 900,
                      border: `1.5px solid ${aan ? WIT : 'rgba(255,255,255,0.18)'}`, background: aan ? WIT : 'rgba(255,255,255,0.04)', color: aan ? '#000' : WIT,
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>{l.label}</button>
                  )
                })}
              </div>
              <input value={antw.lust_eigen} onChange={e => setAntw(a => ({ ...a, lust_eigen: e.target.value }))}
                placeholder="Iets anders? (mag leeg)" style={{ ...invoer(m), minHeight: m ? 54 : 58, borderRadius: 14, marginTop: '0.4rem' }} />
            </>
          )}

          {huidig === 'gegevens' && <GegevensVelden m={m} formId="menu-gegevens" antw={antw} setAntw={setAntw} onVerstuur={verstuur} />}
        </div>

        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}

        {huidig === 'overjou' && (
          <button onClick={() => volgende('overjou')} disabled={!overJouOk(antw)} style={{ ...knopWit(m, !overJouOk(antw)), marginTop: '1.4rem' }}>
            Volgende <ArrowRight size={22} strokeWidth={2.6} />
          </button>
        )}
        {(huidig === 'dieet' || huidig === 'lustniet') && (
          <button onClick={() => volgende(huidig)} style={{ ...knopWit(m), marginTop: '1.4rem' }}>
            Volgende <ArrowRight size={22} strokeWidth={2.6} />
          </button>
        )}
        {huidig === 'gegevens' && (
          <button type="submit" form="menu-gegevens" disabled={!gegevensOk || bezig} style={{ ...knopWit(m, !gegevensOk || bezig), marginTop: '1.4rem' }}>
            {bezig ? 'Menu maken…' : 'Laat mijn menu zien'}
            {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
          </button>
        )}
      </div>
    </div>
  )
}

// Het menu onder de downloadknop: je cijfers, de dagen als knoppen en per dag
// de maaltijden met foto, hoeveelheden en een wisselknop.
function MenuOverzicht({ m, cijfers, week, vast = [], groepen, onWissel, onDownload, pdfBezig }) {
  const [dag, setDag] = useState(0)
  const [open, setOpen] = useState(null)
  useEffect(() => { setOpen(null) }, [dag])
  const d = week[dag]
  const t = dagTotaal(d)
  const gemEiwit = Math.round(week.reduce((s, x) => s + dagTotaal(x).eiwit, 0) / 7)
  return (
    <div style={{ marginTop: '1.6rem' }}>
      <Sectiekop nr={1} titel="Jouw cijfers" sub="Per dag, uitgerekend op jou" />
      <MacroRingen m={m} cijfers={cijfers} />
      <Sectiekop nr={2} titel="Zo kom je op jouw doel" sub="Wat je verbrandt, en wat je dus eet" />
      <DoelSom m={m} cijfers={cijfers} />
      {gemEiwit < cijfers.eiwit * 0.85 && (
        <div style={{ marginTop: 10, padding: '0.7rem 0.9rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
          Met jouw keuzes kom je gemiddeld op {gemEiwit} g eiwit per dag. Een eiwitshake (plantaardig als je geen zuivel eet) brengt je dichter bij {cijfers.eiwit} g.
        </div>
      )}

      <Sectiekop nr={3} titel="Jouw week" sub="Kies een dag; elke maaltijd met de hoeveelheden" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {DAGEN.map((n, i) => (
          <button key={n} onClick={() => setDag(i)} style={{
            padding: '0.6rem 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 900,
            border: `1.5px solid ${i === dag ? WIT : 'rgba(255,255,255,0.16)'}`, background: i === dag ? WIT : 'transparent', color: i === dag ? '#000' : WIT,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>{n.slice(0, 2)}</button>
        ))}
      </div>
      <div style={{ margin: '1rem 0 0.4rem' }}>
        <span style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase' }}>{d.dag}</span>
      </div>
      <DagBalken t={t} cijfers={cijfers} />
      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <List size={13} strokeWidth={2.6} /> {vast.length ? 'Tik op een maaltijd voor de hoeveelheden. Wissel je een vaste maaltijd, dan geldt dat voor de hele week.' : 'Tik op een maaltijd voor de hoeveelheden, op de pijltjes om te wisselen.'}
      </div>

      {/* Dezelfde maaltijdkaart als in de app (MealCard). Tik op de kaart of
          het lijstje: hoeveelheden. Pijltjes: wisselen, met de alternatieven
          ook als app-kaartjes. */}
      <div style={{ margin: m ? '0 -0.9rem' : '0 -1.25rem' }}>
        {d.maaltijden.map((g, p) => {
          if (g.leeg) return <div key={p} style={{ padding: m ? '0.9rem' : '0.9rem 1.25rem', fontSize: '0.86rem', color: ZWAK }}>{MOMENT_NAAM[g.moment]}: met jouw keuzes is hier geen gerecht voor.</div>
          const ingr = open?.p === p && open.soort === 'ingr'
          const wisselOpen = open?.p === p && open.soort === 'wissel'
          const zet = (soort) => setOpen(o => (o?.p === p && o.soort === soort ? null : { p, soort }))
          const opties = wisselOpen ? alternatievenVoor(groepen, g.moment, d).slice(0, 8) : []
          const paneel = { margin: m ? '-0.3rem 0.9rem 0.55rem' : '-0.4rem 1.25rem 0.7rem', padding: m ? '0.7rem 0.75rem' : '0.8rem 0.95rem', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', animation: 'vraagIn 0.2s ease' }
          return (
            <div key={`${p}-${g.naam}`}>
              <MealCard
                meal={{ name: g.naam, calories: g.kcal, protein: g.eiwit, carbs: g.kh, fat: g.vet, image_url: g.foto }}
                isMobile={m} momentLabel={MOMENT_NAAM[g.moment]} onTik={() => zet('ingr')}
                label={g.gewisseld ? <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#86efac' }}>Gewisseld</span> : null}
                acties={[
                  { icon: <List size={m ? 12 : 13} strokeWidth={2.6} />, label: 'Hoeveelheden', onClick: () => zet('ingr'), kleur: ingr ? WIT : undefined },
                  { icon: <RefreshCw size={m ? 11 : 12} />, label: 'Wissel', onClick: () => zet('wissel'), kleur: wisselOpen ? WIT : undefined },
                ]}
              />
              {ingr && (
                <div style={{ ...paneel, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
                  {g.ingredienten.map(x => (
                    <div key={x.naam} style={{ fontSize: '0.8rem', lineHeight: 1.35, minWidth: 0 }}>
                      <span style={{ fontWeight: 900 }}>{hoeveel(x)}</span> <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{x.naam}</span>
                    </div>
                  ))}
                </div>
              )}
              {wisselOpen && (
                <div style={{ margin: m ? '-0.2rem 0 0.4rem' : '-0.3rem 0 0.5rem', animation: 'vraagIn 0.2s ease' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: ZWAK, padding: m ? '0 0.9rem 0.4rem' : '0 1.25rem 0.45rem' }}>Kies een ander gerecht</div>
                  {opties.map(o => {
                    const v = o.versies[0]
                    return (
                      <MealCard key={o.naam} compact isMobile={m} acties={[]} momentLabel={MOMENT_NAAM[g.moment]}
                        meal={{ name: o.naam, calories: v.kcal, protein: v.eiwit, carbs: v.kh, fat: v.vet, image_url: v.foto }}
                        onTik={() => { onWissel(dag, p, o.naam); setOpen(null) }} />
                    )
                  })}
                  {!opties.length && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK, padding: m ? '0 0.9rem' : '0 1.25rem' }}>Geen ander gerecht dat bij je keuzes past.</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1.2rem', padding: m ? '1rem' : '1.1rem 1.2rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: '0.98rem', fontWeight: 900 }}>In de PDF staat ook</div>
        {['Bij elk gerecht hoe je het maakt', 'Een boodschappenlijst voor de hele week', 'Hoe je calorieën zijn berekend'].map(x => (
          <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} /> {x}
          </div>
        ))}
        <button onClick={onDownload} disabled={pdfBezig} style={{ ...knopWit(m, pdfBezig), marginTop: '1rem', minHeight: m ? 52 : 56, fontSize: '1rem' }}>
          {pdfBezig ? <Loader2 size={20} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={20} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download de PDF'}
        </button>
      </div>
    </div>
  )
}

// ── Kleur en ringen, zelfde taal als de macro's in de app ──────────────────
const ICOON = { kcal: Flame, kh: Wheat, eiwit: Egg, vet: Droplet }

function Ring({ size, stroke, deel, kleur, children }) {
  const r = (size - stroke) / 2
  const omtrek = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={kleur} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - Math.max(0, Math.min(1, deel)))}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

// Kopje met nummer, zodat je ziet waar je bent: 1 cijfers, 2 je dag, 3 je week.
function Sectiekop({ nr, titel, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.6rem 0 0.75rem' }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: WIT, color: '#000', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{nr}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.02rem', fontWeight: 900, letterSpacing: '-0.01em' }}>{titel}</div>
        {sub && <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

// Vier ringen even groot, zonder kader: kcal (vol) en per macro welk deel
// van je calorieën eruit komt.
function MacroRingen({ m, cijfers }) {
  const a = aandeel(cijfers)
  const maat = m ? 70 : 80
  const items = [['kcal', cijfers.kcal.toLocaleString('nl-NL'), '', 1], ['eiwit', cijfers.eiwit, 'g', a.eiwit], ['kh', cijfers.kh, 'g', a.kh], ['vet', cijfers.vet, 'g', a.vet]]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
      {items.map(([k, waarde, eenheid, deel]) => {
        const I = ICOON[k]
        return (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Ring size={maat} stroke={m ? 6 : 7} deel={deel} kleur={MACRO[k].kleur}>
              <div style={{ fontSize: m ? (k === 'kcal' ? '0.92rem' : '1rem') : '1.08rem', fontWeight: 900, color: WIT, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {waarde}<span style={{ fontSize: '0.62em', color: ZWAK }}>{eenheid}</span>
              </div>
            </Ring>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 900, color: MACRO[k].kleur, whiteSpace: 'nowrap' }}>
              <I size={11} color={MACRO[k].kleur} /> {MACRO[k].label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Per dag: vier dunne balken, wat de dag oplevert tegenover je doel.
function DagBalken({ t, cijfers }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
      {['kcal', 'eiwit', 'kh', 'vet'].map(k => {
        const doel = cijfers[k] || 1
        return (
          <div key={k} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 900, color: MACRO[k].kleur }}>{t[k]}{k === 'kcal' ? '' : 'g'}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ZWAK }}>{MACRO[k].label.toLowerCase()}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (t[k] / doel) * 100)}%`, height: '100%', borderRadius: 3, background: MACRO[k].kleur }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Zo kom je op je doel, als simpele som: geschatte verbranding, het tekort
// (of overschot) en wat je dus per dag eet (Kersten, 23 okt 2026).
const duizend = (n) => Math.round(n).toLocaleString('nl-NL')
function DoelSom({ m, cijfers }) {
  const v = verwachting(cijfers)
  if (!v) return null
  const regel = (teken, waarde, uitleg, sterk) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0.55rem 0', borderTop: sterk ? '1.5px solid rgba(255,255,255,0.25)' : 'none' }}>
      <span style={{ width: 16, fontSize: '1.1rem', fontWeight: 900, color: ZWAK, flexShrink: 0, textAlign: 'center' }}>{teken}</span>
      <span style={{ fontSize: sterk ? (m ? '1.5rem' : '1.7rem') : '1.15rem', fontWeight: 900, color: sterk ? MACRO.kcal.kleur : WIT, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{waarde}</span>
      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>{uitleg}</span>
    </div>
  )
  const tussen = v.soort === 'tekort'
    ? regel('−', `${duizend(Math.abs(v.perDag))}`, `tekort voor ± ${kgTekst(v.kgPerWeek)} kg vet per week`)
    : v.soort === 'overschot'
      ? regel('+', `${duizend(v.perDag)}`, 'extra voor spieropbouw')
      : regel('±', '0', 'rond onderhoud: vet eraf en spier erbij tegelijk')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Ring size={m ? 92 : 104} stroke={m ? 7 : 8} deel={1} kleur="rgba(255,255,255,0.85)">
          <Flame size={13} color={WIT} />
          <div style={{ fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900, lineHeight: 1.05 }}>{duizend(v.tdee)}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: ZWAK }}>kcal</div>
        </Ring>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.2 }}>Geschatte<br />verbranding</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {regel('', duizend(v.tdee), 'wat je per dag verbrandt')}
        {tussen}
        {regel('=', duizend(v.eet), 'kcal per dag: jouw doel', true)}
      </div>
    </div>
  )
}

export default function MijnMenu() {
  return <LeadMagnetPagina cfg={PAGINA}>{(m) => <MenuFlow m={m} />}</LeadMagnetPagina>
}
