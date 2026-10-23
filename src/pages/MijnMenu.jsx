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
import { ArrowLeft, ArrowRight, Check, Download, Loader2, X, RefreshCw } from 'lucide-react'
import db from '../services/DatabaseService'
import { herkomst, meet } from './challengeTracking'
import { Optie, LeadMagnetPagina } from './leadmagnet/Bouwstenen'
import { CTA_GROEN, WIT, ZWAK, FONT, emailOk, knopWit, invoer } from './leadmagnet/stijl'
import {
  DOELEN, GESLACHT, ACTIVITEIT, MAALTIJDEN, DIEET, LUST_NIET, MOMENT_NAAM, DAGEN,
  berekenDoel, groepeer, maakWeek, wissel, alternatievenVoor, dagTotaal, hoeveel,
} from './mijn-menu/menuRegels'
import { maakMenuPdf, fotoUrl } from './mijn-menu/menuPdf'
import { mailPdf } from './leadmagnet/mailPdf'

// YouTube-id van de uitlegvideo. Leeg = stilstaand beeld zonder afspeelknop.
const VIDEO_ID = ''

const PAGINA = {
  pil: 'Gratis weekmenu',
  kop: 'Wat moet jij eten om je doel te halen?',
  sub: 'Beantwoord 7 korte vragen en krijg een weekmenu op jouw calorieën, uit de gerechten van mijn klanten.',
  videoId: VIDEO_ID, poster: '/mijn-menu/poster.jpg', cta: 'Maak mijn menu',
  stappen: [
    { kop: 'Vragen', sub: '7 korte vragen' },
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
  slotTekst: 'Zeven vragen, dan staat hij voor je klaar.',
}

const STAPPEN = ['doel', 'overjou', 'activiteit', 'maaltijden', 'dieet', 'lustniet', 'gegevens']
const TOTAAL = STAPPEN.length
const TITELS = {
  doel: 'Wat is je doel?',
  overjou: 'Even over jou',
  activiteit: 'Hoe actief ben je?',
  maaltijden: 'Hoeveel keer per dag eet je?',
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
    doel: null, geslacht: 'man', leeftijd: '', lengte: '', gewicht: '', activiteit: null, maaltijden: null,
    dieet: [], lustNiet: [], lust_eigen: '', voornaam: '', email: '',
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
      const w = maakWeek(groepen, c, antw.maaltijden, antw.email.trim().toLowerCase())

      const doelLabel = DOELEN.find(d => d.key === antw.doel)?.label
      const dieet = DIEET.filter(d => antw.dieet.includes(d.key)).map(d => d.label).join(', ')
      const lustNiet = LUST_NIET.filter(l => antw.lustNiet.includes(l.key)).map(l => l.label).join(', ')
      const eigen = antw.lust_eigen.trim()
      const activiteit = ACTIVITEIT.find(a => a.key === antw.activiteit)?.label
      const u = utm.current || {}
      const { data: nieuwId, error } = await db.supabase.rpc('submit_mijn_menu', { p: {
        voornaam: antw.voornaam.trim(),
        email: antw.email.trim(),
        doel: doelLabel,
        samenvatting: `Mijn menu: ${c.kcal} kcal (${doelLabel?.toLowerCase()}), ${antw.maaltijden} maaltijden per dag. ${antw.geslacht === 'vrouw' ? 'Vrouw' : 'Man'}, ${antw.leeftijd} jaar, ${antw.lengte} cm, ${antw.gewicht} kg, ${activiteit?.toLowerCase()}.${dieet ? ` Dieet: ${dieet}.` : ''}${lustNiet ? ` Lust niet: ${lustNiet}.` : ''}${eigen ? ` Anders: ${eigen}` : ''}`,
        antwoorden: [
          { vraag: 'Doel', antwoord: doelLabel },
          { vraag: 'Over jou', antwoord: `${antw.geslacht === 'vrouw' ? 'Vrouw' : 'Man'}, ${antw.leeftijd} jaar, ${antw.lengte} cm, ${antw.gewicht} kg` },
          { vraag: 'Activiteit', antwoord: activiteit },
          { vraag: 'Maaltijden per dag', antwoord: String(antw.maaltijden) },
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
    setWeek(w => wissel(w, groepenRef.current, dag, plek, naam))
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
        <MenuOverzicht m={m} cijfers={cijfers} week={week} groepen={groepenRef.current} onWissel={wisselMaaltijd} onDownload={download} pdfBezig={pdfBezig} />
      </div>
    )
  }

  // ── Vraag ──
  const nummer = stap + 1
  const deel = TOTAAL > 1 ? (nummer - 1) / (TOTAAL - 1) : 1
  const voortgangKleur = `hsl(${Math.round(110 + deel * 32)}, ${Math.round(50 + deel * 30)}%, ${Math.round(64 - deel * 20)}%)`
  const lijst = { doel: DOELEN, activiteit: ACTIVITEIT, maaltijden: MAALTIJDEN }[huidig]
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

          {huidig === 'gegevens' && (
            <>
              <input value={antw.voornaam} onChange={e => setAntw(a => ({ ...a, voornaam: e.target.value }))}
                placeholder="Je voornaam*" autoComplete="given-name" style={invoer(m)} />
              <input value={antw.email} onChange={e => setAntw(a => ({ ...a, email: e.target.value.trim() }))}
                onKeyDown={e => e.key === 'Enter' && verstuur()}
                placeholder="jouw@email.nl*" type="email" inputMode="email" autoComplete="email" style={invoer(m)} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45, textAlign: 'center', marginTop: '0.2rem' }}>
                Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: WIT }}>privacyverklaring</a>.
              </div>
            </>
          )}
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
          <button onClick={verstuur} disabled={!gegevensOk || bezig} style={{ ...knopWit(m, !gegevensOk || bezig), marginTop: '1.4rem' }}>
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
function MenuOverzicht({ m, cijfers, week, groepen, onWissel, onDownload, pdfBezig }) {
  const [dag, setDag] = useState(0)
  const [open, setOpen] = useState(null)
  useEffect(() => { setOpen(null) }, [dag])
  const d = week[dag]
  const t = dagTotaal(d)
  const gemEiwit = Math.round(week.reduce((s, x) => s + dagTotaal(x).eiwit, 0) / 7)
  const klein = { fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ZWAK }

  return (
    <div style={{ marginTop: '1.6rem' }}>
      {/* Je cijfers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[['Per dag', `${cijfers.kcal}`, 'kcal'], ['Eiwit', `${cijfers.eiwit}`, 'g'], ['Koolh.', `${cijfers.kh}`, 'g'], ['Vet', `${cijfers.vet}`, 'g']].map(([l, w, e]) => (
          <div key={l} style={{ padding: '0.7rem 0.6rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', minWidth: 0 }}>
            <div style={klein}>{l}</div>
            <div style={{ fontSize: m ? '1.15rem' : '1.3rem', fontWeight: 900, marginTop: 3 }}>{w}<span style={{ fontSize: '0.75rem', color: ZWAK, marginLeft: 3 }}>{e}</span></div>
          </div>
        ))}
      </div>
      {gemEiwit < cijfers.eiwit * 0.85 && (
        <div style={{ marginTop: 10, padding: '0.7rem 0.9rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
          Met jouw keuzes kom je gemiddeld op {gemEiwit} g eiwit per dag. Een eiwitshake (plantaardig als je geen zuivel eet) brengt je dichter bij {cijfers.eiwit} g.
        </div>
      )}

      {/* Dagen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginTop: '1.1rem' }}>
        {DAGEN.map((n, i) => (
          <button key={n} onClick={() => setDag(i)} style={{
            padding: '0.6rem 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 900,
            border: `1.5px solid ${i === dag ? WIT : 'rgba(255,255,255,0.16)'}`, background: i === dag ? WIT : 'transparent', color: i === dag ? '#000' : WIT,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>{n.slice(0, 2)}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '1rem 0 0.2rem' }}>
        <span style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase' }}>{d.dag}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: ZWAK }}>{t.kcal} kcal · {t.eiwit} g eiwit</span>
      </div>
      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <RefreshCw size={13} strokeWidth={2.6} /> Zin in iets anders? Tik op het pijltje om te wisselen.
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
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ZWAK, marginTop: 3 }}>{g.kcal} kcal · {g.eiwit} g eiwit · {g.kh} g kh · {g.vet} g vet</div>
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

export default function MijnMenu() {
  return <LeadMagnetPagina cfg={PAGINA}>{(m) => <MenuFlow m={m} />}</LeadMagnetPagina>
}
