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
import { ArrowLeft, ArrowRight, Check, Download, Loader2, X, RefreshCw, Flame, Wheat, Egg, Droplet } from 'lucide-react'
import db from '../services/DatabaseService'
import { herkomst, meet } from './challengeTracking'
import { Optie, LeadMagnetPagina, GegevensVelden } from './leadmagnet/Bouwstenen'
import { CTA_GROEN, WIT, ZWAK, FONT, emailOk, knopWit, invoer, bewaardeGegevens, onthoudGegevens } from './leadmagnet/stijl'
import {
  DOELEN, GESLACHT, ACTIVITEIT, MAALTIJDEN, VARIATIE, vasteMomenten, DIEET, LUST_NIET, MOMENT_NAAM, DAGEN,
  berekenDoel, groepeer, maakWeek, wissel, alternatievenVoor, dagTotaal, hoeveel, verwachting, kgTekst, MACRO, aandeel,
} from './mijn-menu/menuRegels'
import { maakMenuPdf, fotoUrl } from './mijn-menu/menuPdf'
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
      doc.save('mijn-weekmenu.pdf')
      if (!mailGestart.current) {
        mailGestart.current = true
        mailPdf({ soort: 'menu', leadId, email: antw.email.trim(), voornaam: antw.voornaam.trim(), doc }).then(ok => ok && setGemaild(true))
      }
      meet('pdf_download', { meta: { kcal: cijfers.kcal } })
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
  const klein = { fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ZWAK }

  return (
    <div style={{ marginTop: '1.6rem' }}>
      <Sectiekop nr={1} titel="Jouw cijfers" sub="Per dag, uitgerekend op jou" />
      <MacroRingen m={m} cijfers={cijfers} />
      <Sectiekop nr={2} titel="Zo werkt jouw dag" sub="Wat je verbrandt tegenover wat je eet" />
      <Verwachting m={m} v={verwachting(cijfers)} />
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
        <RefreshCw size={13} strokeWidth={2.6} /> {vast.length ? 'Wissel je een vaste maaltijd, dan geldt dat voor de hele week.' : 'Zin in iets anders? Tik op het pijltje om te wisselen.'}
      </div>

      {d.maaltijden.map((g, p) => {
        const isOpen = open === p
        if (g.leeg) return <div key={p} style={{ padding: '0.9rem 0', fontSize: '0.86rem', color: ZWAK }}>{MOMENT_NAAM[g.moment]}: met jouw keuzes is hier geen gerecht voor.</div>
        const opties = isOpen ? alternatievenVoor(groepen, g.moment, d).slice(0, 8) : []
        return (
          <div key={p} style={{ marginTop: 10, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e0e', animation: 'vraagIn 0.25s ease' }}>
            <div style={{ display: 'flex', gap: 12, padding: 12 }}>
              <img src={fotoUrl(g, 300)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                style={{ width: m ? 76 : 88, height: m ? 76 : 88, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#1a1a1a' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={klein}>{MOMENT_NAAM[g.moment]}{g.gewisseld ? ' · gewisseld' : ''}</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{g.naam}</div>
                <MacroChips g={g} />
              </div>
              <button onClick={() => setOpen(isOpen ? null : p)} aria-label={`Wissel ${g.naam}`} aria-expanded={isOpen} style={{
                width: 34, height: 34, flexShrink: 0, borderRadius: 9, cursor: 'pointer', alignSelf: 'flex-start',
                border: `1px solid ${isOpen ? WIT : 'rgba(255,255,255,0.16)'}`, background: isOpen ? WIT : 'transparent', color: isOpen ? '#000' : WIT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {isOpen ? <X size={16} strokeWidth={2.8} /> : <RefreshCw size={15} strokeWidth={2.6} />}
              </button>
            </div>
            {isOpen ? (
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {opties.map(o => (
                  <button key={o.naam} onClick={() => { onWissel(dag, p, o.naam); setOpen(null) }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: WIT,
                  }}>
                    <img src={fotoUrl({ ...o.versies[0], moment: g.moment }, 160)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{o.naam}</span>
                  </button>
                ))}
                {!opties.length && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK }}>Geen ander gerecht dat bij je keuzes past.</span>}
              </div>
            ) : (
              <div style={{ padding: '0 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
                {g.ingredienten.map(i => (
                  <div key={i.naam} style={{ fontSize: '0.8rem', lineHeight: 1.35, minWidth: 0 }}>
                    <span style={{ fontWeight: 900 }}>{hoeveel(i)}</span> <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{i.naam}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

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

// Grote kcal-ring met de drie macro's ernaast: elke ring toont welk deel van
// je calorieën uit die macro komt.
function MacroRingen({ m, cijfers }) {
  const a = aandeel(cijfers)
  const klein = m ? 64 : 72
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: m ? 10 : 16, padding: m ? '0.9rem' : '1rem 1.2rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
      <Ring size={m ? 104 : 118} stroke={m ? 10 : 11} deel={1} kleur={MACRO.kcal.kleur}>
        <Flame size={14} color={MACRO.kcal.kleur} />
        <div style={{ fontSize: m ? '1.45rem' : '1.65rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{cijfers.kcal.toLocaleString('nl-NL')}</div>
        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: ZWAK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>kcal / dag</div>
      </Ring>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, minWidth: 0 }}>
        {['eiwit', 'kh', 'vet'].map(k => {
          const I = ICOON[k]
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <Ring size={klein} stroke={m ? 6 : 7} deel={a[k]} kleur={MACRO[k].kleur}>
                <div style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: WIT, lineHeight: 1 }}>{cijfers[k]}<span style={{ fontSize: '0.65em', color: ZWAK }}>g</span></div>
              </Ring>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 900, color: MACRO[k].kleur }}>
                <I size={11} color={MACRO[k].kleur} /> {MACRO[k].label}
              </div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: ZWAK, whiteSpace: 'nowrap' }}>{Math.round(a[k] * 100)}% kcal</div>
            </div>
          )
        })}
      </div>
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

// De macro's van één maaltijd als gekleurde chips.
function MacroChips({ g }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {['kcal', 'eiwit', 'kh', 'vet'].map(k => (
        <span key={k} style={{ fontSize: '0.7rem', fontWeight: 900, padding: '2px 7px', borderRadius: 999, color: MACRO[k].kleur, background: `${MACRO[k].kleur}1f` }}>
          {g[k]}{k === 'kcal' ? ' kcal' : `g ${MACRO[k].label.toLowerCase().replace('.', '')}`}
        </span>
      ))}
    </div>
  )
}

// Wat je verbrandt, wat je eet, het verschil en wat dat oplevert, als één
// rekensom: verbranding − eten = tekort → kilo's.
const duizend = (n) => Math.round(n).toLocaleString('nl-NL')
function Verwachting({ m, v }) {
  if (!v) return null
  const klein = { fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: ZWAK }
  const verschil = v.soort === 'tekort' ? 'Tekort' : v.soort === 'overschot' ? 'Overschot' : 'Verschil'
  const vak = (label, waarde, accent) => (
    <div style={{ flex: 1, minWidth: 0, padding: '0.65rem 0.55rem', borderRadius: 12, border: `1px solid ${accent ? 'rgba(134,239,172,0.45)' : 'rgba(255,255,255,0.1)'}`, background: accent ? 'rgba(134,239,172,0.07)' : 'rgba(255,255,255,0.03)' }}>
      <div style={klein}>{label}</div>
      <div style={{ fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, marginTop: 3, color: accent ? '#86efac' : WIT, whiteSpace: 'nowrap' }}>{waarde}</div>
    </div>
  )
  const teken = (t) => <span style={{ alignSelf: 'center', fontSize: '1rem', fontWeight: 900, color: ZWAK, flexShrink: 0 }}>{t}</span>
  return (
    <div style={{ padding: m ? '0.9rem' : '1rem 1.1rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {vak('Je verbrandt', `${duizend(v.tdee)}`)}
        {teken('−')}
        {vak('Je eet', `${duizend(v.eet)}`)}
        {teken('=')}
        {vak(verschil, `${v.perDag > 0 ? '+' : v.perDag < 0 ? '−' : ''}${duizend(Math.abs(v.perDag))}`, v.soort !== 'onderhoud')}
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        {v.soort === 'onderhoud' ? (
          <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>Gewicht blijft ongeveer gelijk</span>
        ) : (
          <>
            <span style={{ fontSize: m ? '1.6rem' : '1.8rem', fontWeight: 900, color: '#86efac', letterSpacing: '-0.02em' }}>≈ {kgTekst(v.kgPerWeek)} kg</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{v.soort === 'tekort' ? 'vet eraf per week' : 'erbij per week'}</span>
          </>
        )}
      </div>
      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 1.45 }}>
        {v.soort === 'tekort' && `Dat is ${duizend(Math.abs(v.perWeek))} kcal per week, ongeveer ${kgTekst(v.kgIn8)} kg in 8 weken.`}
        {v.soort === 'overschot' && `Dat is ${duizend(v.perWeek)} kcal per week. Train je zwaar, dan gaat het grootste deel naar spier.`}
        {v.soort === 'onderhoud' && 'Je eet rond wat je verbrandt: vet eraf en spier erbij gaat tegelijk, dus kijk vooral naar de spiegel en je kracht.'}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.45 }}>
        Schatting: 7.700 kcal is ongeveer 1 kg vet. De eerste week zie je op de weegschaal vaak meer door vocht.
      </div>
    </div>
  )
}

export default function MijnMenu() {
  return <LeadMagnetPagina cfg={PAGINA}>{(m) => <MenuFlow m={m} />}</LeadMagnetPagina>
}
