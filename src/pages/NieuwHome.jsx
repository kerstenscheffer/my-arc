// src/pages/NieuwHome.jsx
// Homepage (20 nov 2026). Staat op '/' voor bezoekers van de gewone website
// (zie startPagina.js en App.jsx) en op de proefroute /nieuw. Nabouw van de
// homepage van acquisition.com, blok voor blok in dezelfde volgorde, in zwart-wit en met
// Kerstens inhoud. De maten (hoogte hero, koppen, kaarten, afstanden) komen
// uit een meting van die pagina op 1440 en 390 breed; de screenshots en
// maten staan in ~/Gino/acq-voorbeeld.
//
// Volgorde: 1 meldbalk, 2 menubalk, 3 hero (wit), 4 reviews (cijferstrook weg sinds 20 nov), 5 nieuw-blok,
// 6 kop gratis, 7 vier kaarten, 8 vragen, 9 over Kersten, 10 voet.
// Waar zij paars hebben staat hier wit met zwarte tekst.
//
// Alles op deze pagina linkt naar iets dat bestaat. Geen meting en geen
// database: de pagina leest en schrijft niets.
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import ReviewSlider, { Sterren } from './nieuw-home/ReviewSlider'
import { useTrustpilot } from './nieuw-home/trustpilotData'
import { FONT } from './leadmagnet/stijl'
import { INLOG_PAD } from '../startPagina'

// Titel en omschrijving voor Google, alleen op deze pagina. index.html houdt
// 'MY ARC' voor de app en de klantpagina's.
const TITEL = 'MY ARC | Droger worden zonder je weekend op te geven'
const OMSCHRIJVING = 'Droger worden en je etentjes, borrels en weekend houden. Online coaching voor mannen met de 80/20 methode. Start met de gratis tools of de 6 weken challenge.'

const CHALLENGE_START = '/6week-checkout'
const CHALLENGE_INFO = '/6weekchallenge'
const INSTAGRAM = 'https://www.instagram.com/kerstenscheffer'
const YOUTUBE = 'https://www.youtube.com/@kerstenscheffer'
const PDF_EIWIT = '/gratis/eiwit-ranglijst.pdf'
const PDF_PREP = '/gratis/meal-prep-kookboek.pdf'
// De uitlegvideo's van de twee tools, dezelfde als op /mijn-menu en /mijn-split.
const VIDEO_MENU = 'https://www.youtube.com/watch?v=vhcQgldADCc'
const VIDEO_SPLIT = 'https://www.youtube.com/watch?v=WshSHiHN0Cw'

const buiten = { target: '_blank', rel: 'noopener noreferrer' }
// PrepMyMeal-samenwerking: 10% met de code, de ref-link zet hem al klaar (zelfde
// afspraak als in de app, meal-plan/utils/partner.js).
const PREPMYMEAL = 'https://prepmymeal.nl/?ref=KERSTENSCHEFFER'
const PREPMYMEAL_CODE = 'KERSTENSCHEFFER'

// Uitklapmenu's van de menubalk. Zelfde lijst in het telefoonmenu en de voet.
const GRATIS = [
  { tekst: 'Weekmenu tool', href: '/mijn-menu' },
  { tekst: 'Trainingsschema tool', href: '/mijn-split' },
  { tekst: 'Eiwit ranglijst', href: PDF_EIWIT, nieuwTab: true },
  { tekst: 'Meal prep kookboek', href: PDF_PREP, nieuwTab: true },
  { tekst: 'PrepMyMeal 10% korting', href: PREPMYMEAL, nieuwTab: true },
]
const MEDIA = [
  { tekst: 'Instagram', href: INSTAGRAM, nieuwTab: true },
  { tekst: 'YouTube', href: YOUTUBE, nieuwTab: true },
]

// Reviews: uit de tabel trustpilot_reviews via ReviewSlider (dagelijks
// aangevuld door een cloud-routine uit de Trustpilot-mails). Score en aantal uit
// trustpilot_stand.
const TRUSTPILOT = 'https://nl.trustpilot.com/review/myarcfitness.com'
// Twee transformaties, dezelfde als op de funnel (/6weekchallenge-salespagina).
const TRANSFORMATIES = [
  { src: '/nieuw/transformatie-kersten.jpg', tekst: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/nieuw/transformatie-nitish.jpg', tekst: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

// Vier kaarten met dezelfde opmaak. De vierde heeft één knop.
const KAARTEN = [
  {
    label: 'Nieuw', titel: 'Weekmenu tool', beeld: '/mijn-menu/voorbeeld-1.jpg', alt: 'Voorbeeld van het weekmenu',
    knoppen: [{ tekst: 'Maak mijn menu', href: '/mijn-menu' }, { tekst: 'Kijk de uitleg', href: VIDEO_MENU, nieuwTab: true }],
  },
  {
    label: 'Gratis', titel: 'Trainings­schema tool', beeld: '/mijn-split/voorbeeld-1.jpg', alt: 'Voorbeeld van het trainingsschema',
    knoppen: [{ tekst: 'Maak mijn schema', href: '/mijn-split' }, { tekst: 'Kijk de uitleg', href: VIDEO_SPLIT, nieuwTab: true }],
  },
  {
    label: 'Gratis', titel: 'Gidsen',
    omslagen: [
      { src: '/gratis/eiwit-ranglijst-cover.jpg', alt: 'Omslag van de eiwit ranglijst' },
      { src: '/gratis/meal-prep-kookboek-cover.jpg', alt: 'Omslag van het meal prep kookboek' },
    ],
    knoppen: [{ tekst: 'Eiwit ranglijst', href: PDF_EIWIT, nieuwTab: true }, { tekst: 'Meal prep kookboek', href: PDF_PREP, nieuwTab: true }],
  },
  {
    label: '6 weken', titel: '6 weken challenge', beeld: '/waarom-kersten.jpg', alt: 'Kersten',
    knoppen: [{ tekst: 'Start de challenge', href: CHALLENGE_START }],
  },
]

// Vier vragen, allemaal over de challenge. Feiten: 6 weken, borg 297, terug
// als je de vier acties haalt.
const VRAGEN = [
  {
    vraag: 'Wat is de 6 weken challenge?',
    antwoord: 'Zes weken lang werk je aan droger worden met de 80/20 methode. Je traint, volgt je voedingsplan, weegt je en hebt 3 calls met mij.',
  },
  {
    vraag: 'Hoe doe ik mee?',
    antwoord: 'Je betaalt 297 euro borg en je doet mee.',
    link: { tekst: 'Start de challenge', href: CHALLENGE_START },
  },
  {
    vraag: 'Voor wie is de challenge?',
    antwoord: 'Voor mannen die droger willen worden en hun etentjes, borrels en weekenden willen houden.',
  },
  {
    vraag: 'Hoe krijg ik mijn borg terug?',
    antwoord: 'Haal de vier acties: 2 workouts per week, 75 procent van je voedingsplan, 3 calls en 3 keer per week wegen. Dan krijg je de 297 euro terug.',
  },
]

// Voet: vier kolommen, alleen links die bestaan.
const VOET = [
  { kop: 'Gratis', links: GRATIS },
  {
    kop: 'Challenge',
    links: [{ tekst: 'De 6 weken challenge', href: CHALLENGE_INFO }, { tekst: 'Start de challenge', href: CHALLENGE_START }],
  },
  { kop: 'Media', links: MEDIA },
  {
    kop: 'MY ARC',
    links: [{ tekst: 'Over Kersten', href: '#over-kersten' }, { tekst: 'Inloggen', href: INLOG_PAD }],
  },
]
const JURIDISCH = [
  { tekst: 'Privacy', href: '/privacy' },
  { tekst: 'Support', href: '/support' },
  { tekst: 'Trustpilot', href: TRUSTPILOT, nieuwTab: true },
]

const CSS = `
.nh { background:#fff; color:#000; min-height:100vh; font-family:${FONT}; -webkit-font-smoothing:antialiased; }
:where(.nh) *, :where(.nh) *::before, :where(.nh) *::after { box-sizing:border-box; }
:where(.nh) a { color:inherit; text-decoration:none; }
:where(.nh) img { display:block; max-width:100%; }
:where(.nh) h1, :where(.nh) h2, :where(.nh) h3, :where(.nh) p { margin:0; }
:where(.nh) button { font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.nh-bak { width:100%; max-width:1160px; margin:0 auto; padding:0 15px; }

/* knoppen: wit met zwarte tekst, rond (in zwarte blokken). Op wit vlak zwart, zie .nh-hero/.nh-antwoord. */
.nh-knop { display:inline-flex; align-items:center; justify-content:center; text-align:center; min-height:46px; padding:10px 14px;
  border-radius:100px; border:none; background:#fff; color:#000 !important; font-size:15px; font-weight:800; line-height:1.2; text-wrap:balance; }
.nh-knop.is-tweede { background:#2b2b2b; color:#fff !important; }
.nh-knop.is-groot { width:100%; min-height:56px; padding:14px 22px; font-size:19px; font-weight:900; text-transform:uppercase; letter-spacing:.01em; }

/* 1 meldbalk */
.nh-meld { display:flex; align-items:center; justify-content:center; gap:12px; background:#fff; color:#000 !important; padding:10px 15px; font-size:16px; line-height:1.35; border-bottom:1px solid rgba(0,0,0,.08); }
.nh-meld-gids { position:relative; flex-shrink:0; padding-top:6px; }
/* Label bovenop het gidsfotootje (20 nov, Kersten). */
.nh-meld-label { position:absolute; top:0; left:50%; transform:translateX(-50%); background:#000; color:#fff; border:1.5px solid #fff; border-radius:100px; padding:1px 6px; font-size:9px; font-weight:900; letter-spacing:.05em; line-height:1.3; }
.nh-meld-pdf { display:block; flex-shrink:0; width:34px; height:48px; object-fit:cover; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,.25); transform:rotate(-4deg); }
.nh-meld b { font-weight:900; }
.nh-pil { display:inline-block; background:#000; color:#fff; border-radius:100px; padding:2px 10px; margin-right:8px; font-size:13px; font-weight:900; letter-spacing:.04em; vertical-align:1px; }
.nh-meld svg { display:inline-block; vertical-align:-5px; margin-left:6px; flex-shrink:0; }

/* 2 menubalk */
.nh-nav { position:sticky; top:0; z-index:50; background:#000; }
.nh-nav-rij { display:flex; align-items:center; justify-content:space-between; height:62px; }
.nh-logo { display:inline-flex; align-items:center; gap:9px; color:#fff; white-space:nowrap; }
/* Telefoon: klein logo + woordmerk, zo past Inloggen er nog naast. */
.nh-logo { gap:7px; }
.nh-logo img { height:24px; width:auto; }
.nh-logo-woord { font-size:13px; font-weight:900; letter-spacing:.04em; }
.nh-logo-woord span { font-weight:500; }
.nh-menu, .nh-nav-knop { display:none; }
.nh-nav-rechts { display:flex; align-items:center; gap:6px; margin-left:auto; }
.nh-inlog { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:8px 16px; border:2px solid #fff; border-radius:100px;
  color:#fff; font-size:15px; font-weight:800; line-height:1.2; white-space:nowrap; }
.nh-ham { display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; margin-right:-8px; background:none; border:none; color:#fff; }
.nh-tel { background:#000; padding:4px 15px 24px; border-top:1px solid rgba(255,255,255,.14); max-height:calc(100vh - 62px); overflow-y:auto; }
.nh-tel-kop { padding:18px 0 6px; font-size:13px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.7); }
.nh-tel a.nh-tel-link { display:block; padding:11px 0; font-size:18px; font-weight:800; }
.nh-tel .nh-knop { margin-top:18px; }

/* 3 hero */
/* Eén foto sinds 20 nov (trainingsfoto eruit, Kersten). */
.nh-hero { background:#fff; color:#000; display:grid; grid-template-columns:1fr; grid-template-areas:"tekst" "links"; gap:26px; padding:40px 15px 24px; }
.nh-hero-midden { grid-area:tekst; width:100%; max-width:640px; margin:0 auto; text-align:center; }
.nh-hero h1 { font-size:clamp(34px, 10.4vw, 50px); font-weight:900; line-height:1.13; letter-spacing:-.01em; text-transform:uppercase; text-wrap:balance; }
.nh-hero p { margin-top:22px; font-size:20px; font-weight:500; line-height:1.35; text-wrap:balance; }
/* Telefoon: titel altijd 2 regels; de lettergrootte volgt de schermbreedte zodat de langste regel past. */
.nh-hero h1 span { display:block; white-space:nowrap; }
@media (max-width:899px) { .nh-hero h1 { font-size:min(calc((100vw - 34px) / 15.4), 50px); line-height:1.15; } }
@media (min-width:900px) { .nh-hero h1 span { display:inline; white-space:normal; } }
/* Twee zinnen, elk op een eigen regel; lettergrootte schaalt mee zodat het ook op 360 breed past. */
.nh-hero .nh-hero-sub { font-size:clamp(15px, 4.4vw, 20px); }
.nh-hero-sub span { display:block; white-space:nowrap; }
/* Hero is wit (20 nov 2026, Kersten): de knop wordt daar zwart. */
.nh-hero .nh-knop { margin-top:22px; background:#000; color:#fff !important; }
/* height:auto is nodig: het height-attribuut op de img (tegen verspringen) wint anders van aspect-ratio en maakt de foto 1280 px hoog. */
/* Telefoon: foto schermbreed, van rand tot rand (20 nov, Kersten). */
.nh-hero-foto { width:calc(100% + 30px); max-width:none; margin:0 -15px -24px; height:auto; aspect-ratio:1400/1166; object-fit:cover; border-radius:0; background:#eee; }
.nh-hero-links { grid-area:links; justify-self:center; object-position:52% 30%; }

/* 4b reviews: transformaties + Trustpilot */
.nh-reviews { background:#fff; padding:48px 0 52px; }
.nh-reviews h2 { text-align:center; font-size:28px; font-weight:900; line-height:1.15; text-transform:uppercase; }
.nh-tp { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:8px 12px; width:fit-content; margin:14px auto 0; padding:0 15px; font-size:17px; font-weight:700; }
.nh-tp b { font-weight:900; }
.nh-tp-sterren { display:inline-flex; gap:3px; }
.nh-tp-ster { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#00b67a; }
.nh-trans { display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:720px; margin:28px auto 0; padding:0 15px; }
.nh-trans img { width:100%; height:auto; aspect-ratio:4/5; object-fit:cover; border-radius:14px; background:#eee; }
.nh-trans p { margin-top:8px; font-size:14px; font-weight:700; line-height:1.35; text-align:center; color:rgba(0,0,0,.8); }
/* slider */
.nh-slider { max-width:1160px; margin:28px auto 0; }
.nh-slider-baan { display:flex; align-items:stretch; gap:12px; overflow-x:auto; padding:0 15px 4px; scrollbar-width:none; overscroll-behavior-x:contain; }
.nh-slider-baan::-webkit-scrollbar { display:none; }
.nh-quote { flex:0 0 82%; display:flex; flex-direction:column; gap:6px; background:#0b0b0b; color:#fff; border-radius:18px; padding:16px 18px 12px; }
.nh-quote-kop { display:flex; align-items:center; flex-wrap:wrap; gap:4px 10px; margin-bottom:4px; }
.nh-quote-wie { font-size:13px; font-weight:700; color:rgba(255,255,255,.6); }
.nh-quote-wie b { color:#fff; font-weight:900; }
/* Alle kaarten even hoog: kern max 3 regels, tekst 3 regels, link onderaan. */
.nh-slider-baan.is-open { align-items:flex-start; }
.nh-quote-kern { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font-size:20px; font-weight:900; line-height:1.22; letter-spacing:-.01em; }
.nh-quote-tekst { font-size:15px; font-weight:500; line-height:1.45; color:rgba(255,255,255,.72); }
.nh-quote-tekst.is-kort { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.nh-quote-meer { margin-top:auto; align-self:flex-start; min-height:32px; padding:0; background:none; border:none; color:#fff; font-size:14px; font-weight:800; text-decoration:underline; text-underline-offset:3px; }
.nh-slider-bediening { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:14px; padding:0 15px; }
.nh-slider-pijl { display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; border:2px solid rgba(0,0,0,.25); background:none; color:#000; }

/* 5 nieuw-blok */
.nh-nieuw { background:#fff; padding:20px 10px; }
.nh-nieuw-kaart { position:relative; max-width:880px; margin:0 auto; background:#0b0b0b; color:#fff; border-radius:20px; padding:56px 12px 16px; overflow:hidden; }
.nh-nieuw-label { position:absolute; top:0; right:0; background:#fff; color:#000; padding:7px 16px; border-radius:0 20px 0 14px; font-size:14px; font-weight:900; font-style:italic; letter-spacing:.04em; text-transform:uppercase; }
.nh-waaier { display:flex; align-items:center; justify-content:center; height:150px; perspective:900px; }
.nh-waaier img { height:100%; width:auto; border-radius:8px; box-shadow:0 10px 28px rgba(0,0,0,.6); }
.nh-waaier img:nth-child(1) { transform:rotateY(-34deg) scale(.86); margin-right:-14px; }
.nh-waaier img:nth-child(2) { position:relative; z-index:2; }
.nh-waaier img:nth-child(3) { transform:rotateY(34deg) scale(.86); margin-left:-14px; }
.nh-nieuw h2 { margin:20px 0 16px; text-align:center; font-size:22px; font-weight:900; line-height:1.15; text-transform:uppercase; }
.nh-nieuw .nh-knop { min-height:60px; font-size:16px; }

/* 6 kop gratis */
.nh-gratis { background:#fff; padding:44px 0 56px; }
.nh-gratis-kop { text-align:center; padding:0 10px; }
.nh-gratis-kop h2 { font-size:36px; font-weight:900; line-height:1.14; text-transform:uppercase; text-wrap:balance; }
.nh-gratis-kop h2 span { background:#000; color:#fff; border-radius:10px; padding:0 10px; }
.nh-gratis-kop p { max-width:460px; margin:16px auto 0; font-size:17px; line-height:1.4; }
.nh-lijn { height:1px; max-width:712px; margin:30px auto 34px; background:rgba(0,0,0,.2); border:none; }

/* 7 vier kaarten */
.nh-kaarten { display:grid; grid-template-columns:1fr 1fr; gap:14px 12px; padding:0 10px; max-width:1160px; margin:0 auto; }
.nh-kaart { display:flex; flex-direction:column; min-width:0; background:#0b0b0b; color:#fff; border-radius:20px; padding:10px; }
.nh-kaart-label { align-self:flex-end; background:#fff; color:#000; border-radius:8px; padding:3px 9px; font-size:13px; font-weight:900; }
.nh-kaart h3 { display:flex; align-items:center; justify-content:center; min-height:2.3em; margin:10px 0; text-align:center; font-size:15px; font-weight:900; line-height:1.15; text-transform:uppercase; hyphens:manual; }
/* Verhouding van de posters (620x877): bij 1/1 viel de titel onderaan weg (UPPER / LOWER). */
.nh-kaart-beeld { position:relative; width:100%; aspect-ratio:620/877; border-radius:16px; overflow:hidden; background:#0b0b0b; }
.nh-kaart-beeld > img.is-vol { width:100%; height:100%; object-fit:cover; object-position:center; }
.nh-omslag { position:absolute; top:24%; width:48%; border-radius:6px; box-shadow:0 8px 22px rgba(0,0,0,.65); }
.nh-omslag:nth-child(1) { left:3%; transform:rotate(-6deg); }
.nh-omslag:nth-child(2) { right:3%; top:30%; transform:rotate(6deg); }
.nh-kaart-knoppen { display:flex; flex-direction:column; gap:7px; margin-top:auto; padding-top:12px; }
.nh-kaart-knoppen .nh-knop { width:100%; padding:10px 6px; font-size:14px; white-space:nowrap; }

/* 7b PrepMyMeal-blok: zwart, foto + korting */
.nh-pmm { display:flex; flex-direction:column; max-width:1160px; margin:14px 10px 0; background:#0b0b0b; color:#fff; border-radius:20px; overflow:hidden; }
.nh-pmm-foto img { width:100%; height:auto; aspect-ratio:800/560; object-fit:cover; }
.nh-pmm-tekst { display:flex; flex-direction:column; gap:10px; padding:16px 16px 18px; }
.nh-pmm-tekst .nh-kaart-label { align-self:flex-start; }
.nh-pmm h3 { font-size:24px; font-weight:900; line-height:1.15; text-transform:uppercase; }
.nh-pmm p { font-size:16px; line-height:1.45; color:rgba(255,255,255,.8); }
.nh-pmm-code { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:48px; padding:0 6px 0 16px; border:2px dashed rgba(255,255,255,.5); border-radius:12px; background:none; color:#fff; }
.nh-pmm-code span { font-size:17px; font-weight:900; letter-spacing:.06em; }
.nh-pmm-code b { padding:7px 12px; border-radius:8px; background:#2b2b2b; font-size:13px; font-weight:800; }

/* 8 vragen en 9 over Kersten delen een vlak, net als bij het voorbeeld */
.nh-onder { background:#fff; }
.nh-faq { max-width:1125px; margin:0 auto; padding:52px 25px 20px; }
.nh-faq h2, .nh-over h2 { text-align:center; font-size:28px; font-weight:900; line-height:1.15; text-transform:uppercase; }
.nh-faq h2 { margin-bottom:10px; }
.nh-vraag { border-bottom:1px dashed rgba(0,0,0,.35); }
.nh-vraag button { display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; padding:16px 0; background:none; border:none; color:#000; text-align:left; font-size:20px; font-weight:800; line-height:1.35; }
.nh-vraag button svg { flex-shrink:0; transition:transform .18s ease; }
.nh-vraag.is-open button svg { transform:rotate(180deg); }
.nh-antwoord { padding:0 0 18px; font-size:17px; line-height:1.55; }
.nh-antwoord a { font-weight:800; text-decoration:underline !important; text-underline-offset:3px; }

.nh-over { max-width:1125px; margin:0 auto; padding:40px 15px 64px; scroll-margin-top:70px; }
.nh-over h2 { margin-bottom:24px; }
.nh-over-foto { width:100%; max-width:420px; height:auto; margin:0 auto; aspect-ratio:1/1; object-fit:cover; border-radius:24px; background:#fff; }
.nh-over-tekst { max-width:420px; margin:22px auto 0; padding:0 10px; }
.nh-over-tekst p { font-size:19px; font-weight:600; line-height:1.45; }
.nh-over-tekst p + p { margin-top:16px; }

/* 10 voet: wit vlak, op telefoon uitklapbare kolommen */
.nh-voet { background:#000; color:#fff; padding:35px 0 25px; }
.nh-voet-logo { height:44px; width:auto; margin-left:-6px; }
.nh-voet-kolommen { margin-top:18px; }
.nh-voet-kolom { border-bottom:1px solid rgba(255,255,255,.18); }
.nh-voet-kolom button { display:flex; align-items:center; justify-content:space-between; width:100%; padding:15px 0; background:none; border:none; color:#fff; font-size:16px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
.nh-voet-kolom button svg { transition:transform .18s ease; }
.nh-voet-kolom.is-open button svg { transform:rotate(180deg); }
.nh-voet-links { display:none; padding:0 0 12px; }
.nh-voet-kolom.is-open .nh-voet-links { display:block; }
.nh-voet-links a { display:block; padding:8px 0; font-size:16px; font-weight:500; }
.nh-juridisch { display:flex; flex-wrap:wrap; justify-content:center; gap:0 16px; margin-top:16px; font-size:16px; font-weight:800; }
/* Tikdoel 44 px: Privacy en Support waren 26 px hoog. */
.nh-juridisch a { display:inline-flex; align-items:center; min-height:44px; padding:0 4px; }
.nh-bedrijf { margin-top:10px; text-align:center; font-size:14px; font-weight:600; line-height:1.5; }
.nh-bedrijf a { text-decoration:underline !important; text-underline-offset:2px; }
.nh-copyright { margin-top:6px; text-align:center; font-size:14px; font-weight:500; }

/* Smalle telefoons (360): logo en Inloggen raakten elkaar. */
@media (max-width:379px) {
  .nh-inlog { padding:7px 12px; font-size:14px; }
  .nh-logo-woord { font-size:12px; }
  .nh-logo img { height:22px; }
}

@media (hover:hover) {
  .nh-knop:hover { opacity:.88; }
  .nh-inlog:hover { background:#fff; color:#000; }
  .nh-voet-links a:hover, .nh-juridisch a:hover { text-decoration:underline; }
}

@media (min-width:900px) {
  .nh-meld { padding:21px 15px; font-size:17px; }
  .nh-nieuw { padding:32px 15px; }
  .nh-nieuw-kaart { display:grid; grid-template-columns:54% 1fr; align-items:center; gap:10px; padding:36px 40px 36px 24px; }
  .nh-waaier { height:190px; }
  .nh-nieuw h2 { margin:0 0 18px; font-size:26px; }
  .nh-nieuw .nh-knop { min-height:54px; }
  .nh-gratis-kop h2 { font-size:40px; }
  .nh-reviews { padding:72px 0; }
  .nh-reviews h2 { font-size:32px; }
  .nh-trans { gap:20px; }
  .nh-quote { flex-basis:360px; }
  .nh-slider-pijl:hover { border-color:#000; }
  .nh-faq { padding-top:76px; }
  .nh-faq h2, .nh-over h2 { font-size:32px; }
  .nh-vraag button { font-size:22px; }
  .nh-antwoord { font-size:18px; }
  .nh-over { padding:64px 15px 96px; }
  .nh-over h2 { margin-bottom:40px; }
  .nh-over-rij { display:flex; align-items:center; justify-content:center; gap:44px; }
  .nh-over-foto { width:340px; max-width:none; margin:0; flex-shrink:0; }
  .nh-over-tekst { max-width:560px; margin:0; padding:0; }
  .nh-over-tekst p { font-size:21px; }
  .nh-voet-kolommen { display:grid; grid-template-columns:repeat(4, 1fr); gap:24px; margin-top:26px; }
  .nh-voet-kolom { border-bottom:none; }
  .nh-voet-kolom button { padding:0 0 12px; cursor:default; }
  .nh-voet-kolom button svg { display:none; }
  .nh-voet-links { display:block; }
  .nh-juridisch { margin-top:34px; }
}

@media (min-width:1000px) {
  .nh-nav-rij { height:86px; justify-content:flex-start; gap:34px; }
    .nh-logo { gap:10px; }
  .nh-logo img { height:36px; }
  .nh-logo-woord { font-size:18px; }
  .nh-ham, .nh-tel { display:none; }
  .nh-menu { display:flex; align-items:center; gap:26px; }
  .nh-menu > a, .nh-item > button { display:inline-flex; align-items:center; gap:5px; padding:10px 0; background:none; border:none; color:#fff; font-size:16px; font-weight:600; }
  .nh-item { position:relative; }
  .nh-uitklap { display:none; position:absolute; top:100%; left:-24px; min-width:270px; padding:14px 0; background:#fff; color:#000; border-radius:16px; box-shadow:0 18px 44px rgba(0,0,0,.5); }
  .nh-item:hover .nh-uitklap, .nh-item.is-open .nh-uitklap { display:block; }
  .nh-uitklap a { display:block; padding:9px 32px; font-size:16px; font-weight:500; white-space:nowrap; }
  .nh-uitklap a:hover { text-decoration:underline; }
  .nh-nav-rechts { gap:12px; }
  .nh-inlog { min-height:45px; padding:10px 22px; font-size:16px; }
  .nh-nav-knop { display:inline-flex; min-height:45px; padding:10px 22px; font-size:16px; }
  .nh-kaarten { grid-template-columns:repeat(4, 1fr); gap:28px; padding:0 15px; }
  .nh-kaart { padding:16px; }
  .nh-kaart h3 { font-size:20px; }
  .nh-pmm { flex-direction:row; align-items:stretch; margin:28px auto 0; width:calc(100% - 30px); }
  .nh-pmm-foto { flex:0 0 46%; }
  .nh-pmm-foto img { height:100%; aspect-ratio:auto; }
  .nh-pmm-tekst { justify-content:center; padding:32px 36px; gap:14px; }
  .nh-pmm h3 { font-size:30px; }
  .nh-pmm .nh-knop, .nh-pmm-code { max-width:360px; width:100%; }
  .nh-kaart-knoppen { flex-direction:row; gap:8px; padding-top:16px; }
  .nh-kaart-knoppen .nh-knop { flex:1 1 0; min-width:0; min-height:62px; font-size:15px; white-space:normal; }
  .nh-kaart-knoppen .nh-knop:only-child { font-size:16px; font-weight:900; }
}

@media (min-width:1200px) {
  .nh-hero { grid-template-columns:minmax(0, 1fr) 300px; grid-template-areas:"tekst links"; align-items:center; gap:0 56px; min-height:448px; padding:32px max(24px, calc((100% - 1160px) / 2)); }
  .nh-hero h1 { font-size:46px; }
  .nh-hero p { font-size:19px; }
  .nh-hero .nh-knop { max-width:420px; }
  .nh-hero-foto { width:300px; max-width:none; margin:0; height:400px; aspect-ratio:auto; border-radius:24px; }
}
`

function Link({ item, className, children, onClick }) {
  return (
    <a href={item.href} className={className} onClick={onClick} {...(item.nieuwTab ? buiten : {})}>
      {children ?? item.tekst}
    </a>
  )
}

export default function NieuwHome() {
  const [telefoonMenu, setTelefoonMenu] = useState(false)
  const [uitklap, setUitklap] = useState(null)
  const [vraagOpen, setVraagOpen] = useState(null)
  const [voetOpen, setVoetOpen] = useState(null)
  const tp = useTrustpilot()
  const [codeGekopieerd, setCodeGekopieerd] = useState(false)
  const kopieerCode = () => {
    navigator.clipboard?.writeText(PREPMYMEAL_CODE).then(() => {
      setCodeGekopieerd(true)
      setTimeout(() => setCodeGekopieerd(false), 2000)
    }, () => {})
  }

  useEffect(() => {
    const vorige = document.title
    document.title = TITEL
    // index.html heeft geen omschrijving en geen canonical: hier erbij, en
    // weer weg als de pagina verdwijnt. De canonical wijst naar '/', zodat
    // /nieuw niet als tweede homepage in Google komt.
    const omschrijving = document.createElement('meta')
    omschrijving.name = 'description'
    omschrijving.content = OMSCHRIJVING
    const canoniek = document.createElement('link')
    canoniek.rel = 'canonical'
    canoniek.href = `${window.location.origin}/`
    document.head.append(omschrijving, canoniek)
    return () => { document.title = vorige; omschrijving.remove(); canoniek.remove() }
  }, [])

  const wissel = (naam) => setUitklap((nu) => (nu === naam ? null : naam))

  // Het logo gaat naar de pagina waar je bent: '/' of de proefroute.
  const thuis = window.location.pathname === '/nieuw' ? '/nieuw' : '/'

  // Ankers scrollen zonder de hash in de adresbalk te zetten. Op '/' betekent
  // een hash "app-link" (CoachHub-tabs, Business OS, Supabase): met #over-kersten
  // in de URL zou verversen het inlogscherm tonen. Eerst het telefoonmenu
  // dicht, dan pas scrollen, anders klopt de plek niet.
  const naarAnker = (e) => {
    const id = (e.currentTarget.getAttribute('href') || '').slice(1)
    e.preventDefault()
    setTelefoonMenu(false)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="nh" lang="nl">
      <style>{CSS}</style>

      {/* 1. Meldbalk: één regel met link */}
      <a className="nh-meld" href="/mijn-menu">
        <span className="nh-meld-gids"><img className="nh-meld-pdf" src="/mijn-menu/voorbeeld-1.jpg" alt="" width="34" height="48" /><span className="nh-meld-label">NIEUW</span></span>
        <span><b>Krijg jouw persoonlijke voedingsschema, gratis!</b><ArrowRight size={20} strokeWidth={2.4} aria-hidden="true" /></span>
      </a>

      {/* 2. Menubalk: logo links, uitklapmenu's, rechts één knop */}
      <header className="nh-nav">
        <div className="nh-bak nh-nav-rij">
          <a className="nh-logo" href={thuis} aria-label="MY ARC Coaching"><img src="/ma-logo-header.png" alt="" width="80" height="40" /><span className="nh-logo-woord">MY ARC <span>COACHING</span></span></a>

          <nav className="nh-menu" aria-label="Hoofdmenu">
            <div className={`nh-item${uitklap === 'gratis' ? ' is-open' : ''}`} onMouseLeave={() => setUitklap(null)}>
              <button type="button" aria-expanded={uitklap === 'gratis'} onClick={() => wissel('gratis')}>Gratis <ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" /></button>
              <div className="nh-uitklap">{GRATIS.map((l) => <Link key={l.tekst} item={l} />)}</div>
            </div>
            <a href={CHALLENGE_INFO}>Challenge</a>
            <div className={`nh-item${uitklap === 'media' ? ' is-open' : ''}`} onMouseLeave={() => setUitklap(null)}>
              <button type="button" aria-expanded={uitklap === 'media'} onClick={() => wissel('media')}>Media <ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" /></button>
              <div className="nh-uitklap">{MEDIA.map((l) => <Link key={l.tekst} item={l} />)}</div>
            </div>
            <a href="#over-kersten" onClick={naarAnker}>Over Kersten</a>
          </nav>

          {/* Rechts: Inloggen staat ook op telefoon in de balk, naast het menu */}
          <div className="nh-nav-rechts">
            <a className="nh-inlog" href={INLOG_PAD}>Inloggen</a>
            <a className="nh-knop nh-nav-knop" href={CHALLENGE_START}>Start de challenge</a>
            <button type="button" className="nh-ham" aria-label={telefoonMenu ? 'Menu sluiten' : 'Menu openen'} aria-expanded={telefoonMenu} onClick={() => setTelefoonMenu((o) => !o)}>
              {telefoonMenu ? <X size={30} strokeWidth={2.2} /> : <Menu size={30} strokeWidth={2.2} />}
            </button>
          </div>
        </div>

        {telefoonMenu && (
          <div className="nh-tel">
            <div className="nh-tel-kop">Gratis</div>
            {GRATIS.map((l) => <Link key={l.tekst} item={l} className="nh-tel-link" />)}
            <div className="nh-tel-kop">Challenge</div>
            <a className="nh-tel-link" href={CHALLENGE_INFO}>De 6 weken challenge</a>
            <div className="nh-tel-kop">Media</div>
            {MEDIA.map((l) => <Link key={l.tekst} item={l} className="nh-tel-link" />)}
            <div className="nh-tel-kop">MY ARC</div>
            <a className="nh-tel-link" href="#over-kersten" onClick={naarAnker}>Over Kersten</a>
            <a className="nh-knop is-groot" href={CHALLENGE_START}>Start de challenge</a>
          </div>
        )}
      </header>

      {/* 3. Hero: kop als vraag, één zin, één knop, grote foto's */}
      <section className="nh-hero">
        <img className="nh-hero-foto nh-hero-links" src="/nieuw/kersten-hero.jpg" alt="Kersten" width="1400" height="1166" />
        <div className="nh-hero-midden">
          <h1><span>Top shape bereiken zonder</span> <span>je weekend op te geven?</span></h1>
          <p className="nh-hero-sub"><span>In 6 weken droger met de 80/20 methode.</span> <span>Uit eten en de borrel blijven gewoon.</span></p>
          <a className="nh-knop is-groot" href={CHALLENGE_START}>Start de challenge</a>
        </div>
      </section>

      {/* 4b. Reviews: wat klanten bereikten en wat ze op Trustpilot schreven */}
      <section className="nh-reviews">
        <h2>Wat klanten zeggen</h2>
        <a className="nh-tp" href={TRUSTPILOT} {...buiten}>
          <Sterren score={tp.stand.trustscore} groot />
          <span><b>{String(tp.stand.trustscore).replace('.', ',')}</b> / 5 op Trustpilot</span>
        </a>
        <div className="nh-trans">
          {TRANSFORMATIES.map((t) => (
            <figure key={t.src} style={{ margin: 0 }}>
              <img src={t.src} alt={t.tekst} width="720" height="900" loading="lazy" />
              <p>{t.tekst}</p>
            </figure>
          ))}
        </div>
        <ReviewSlider reviews={tp.reviews} />
      </section>

      {/* 5. Nieuw-blok: label, beeld, titel, één knop */}
      <section className="nh-nieuw">
        <div className="nh-nieuw-kaart">
          <div className="nh-nieuw-label">Nieuw</div>
          <div className="nh-waaier" aria-hidden="true">
            <img src="/mijn-menu/voorbeeld-2.jpg" alt="" loading="lazy" />
            <img src="/mijn-menu/voorbeeld-1.jpg" alt="" loading="lazy" />
            <img src="/mijn-menu/voorbeeld-3.jpg" alt="" loading="lazy" />
          </div>
          <div>
            <h2>De Weekmenu tool</h2>
            <a className="nh-knop is-groot" href="/mijn-menu">Maak mijn weekmenu</a>
          </div>
        </div>
      </section>

      {/* 6. Kop boven de gratis sectie + 7. rij van vier kaarten */}
      <section className="nh-gratis">
        <div className="nh-gratis-kop">
          <h2><span>Gratis</span> hulp om droger te worden</h2>
          <p>Tools en gidsen waar je vandaag mee kunt beginnen:</p>
        </div>
        <hr className="nh-lijn" />

        <div className="nh-kaarten">
          {KAARTEN.map((k) => (
            <article key={k.titel} className="nh-kaart">
              <div className="nh-kaart-label">{k.label}</div>
              <h3>{k.titel}</h3>
              <div className="nh-kaart-beeld">
                {k.omslagen
                  ? k.omslagen.map((o) => <img key={o.src} className="nh-omslag" src={o.src} alt={o.alt} loading="lazy" />)
                  : <img className="is-vol" src={k.beeld} alt={k.alt} loading="lazy" />}
              </div>
              <div className="nh-kaart-knoppen">
                {k.knoppen.map((b, i) => (
                  <Link key={b.tekst} item={b} className={`nh-knop${i === 1 ? ' is-tweede' : ''}`} />
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* PrepMyMeal: kant-en-klare maaltijden met korting */}
        <div className="nh-pmm">
          <a className="nh-pmm-foto" href={PREPMYMEAL} {...buiten} aria-label="Naar PrepMyMeal">
            <img src="/nieuw/prepmymeal.jpg" alt="Maaltijd van PrepMyMeal: kip met groenten en witte kaas" width="800" height="560" loading="lazy" />
          </a>
          <div className="nh-pmm-tekst">
            <div className="nh-kaart-label">10% korting</div>
            <h3>Geen tijd om te koken?</h3>
            <p>Kant-en-klare, eiwitrijke maaltijden van PrepMyMeal. Met mijn code krijg je 10% korting.</p>
            <button type="button" className="nh-pmm-code" onClick={kopieerCode} aria-label={`Kortingscode ${PREPMYMEAL_CODE} kopiëren`}>
              <span>{PREPMYMEAL_CODE}</span><b>{codeGekopieerd ? 'Gekopieerd' : 'Kopieer'}</b>
            </button>
            <a className="nh-knop is-groot" href={PREPMYMEAL} {...buiten}>Bestel met korting</a>
          </div>
        </div>
      </section>

      <div className="nh-onder">
        {/* 8. Vragen: vier vragen over de challenge, uitklapbaar */}
        <section className="nh-faq">
          <h2>Veelgestelde vragen</h2>
          {VRAGEN.map((v, i) => {
            const open = vraagOpen === i
            return (
              <div key={v.vraag} className={`nh-vraag${open ? ' is-open' : ''}`}>
                <button type="button" aria-expanded={open} onClick={() => setVraagOpen(open ? null : i)}>
                  <span>{v.vraag}</span>
                  <ChevronDown size={22} strokeWidth={2.4} aria-hidden="true" />
                </button>
                {open && (
                  <p className="nh-antwoord">
                    {v.antwoord}
                    {v.link && <> <a href={v.link.href}>{v.link.tekst}</a></>}
                  </p>
                )}
              </div>
            )
          })}
        </section>

        {/* 9. Over Kersten: kop, grote foto, drie korte zinnen */}
        <section className="nh-over" id="over-kersten">
          <h2>Over Kersten</h2>
          <div className="nh-over-rij">
            <img className="nh-over-foto" src="/nieuw/over-kersten.jpg" alt="Kersten" width="780" height="780" loading="lazy" />
            <div className="nh-over-tekst">
              <p>Ik ben Kersten en ik help mannen droger worden.</p>
              <p>Dat doe ik met de 80/20 methode: je richt je op de paar gewoontes die het meeste opleveren.</p>
              <p>Zo blijft er ruimte voor uit eten, de borrel en je weekend.</p>
            </div>
          </div>
        </section>
      </div>

      {/* 10. Voet: vier kolommen, juridische links, copyright */}
      <footer className="nh-voet">
        <div className="nh-bak">
          <img className="nh-voet-logo" src="/ma-logo-header.png" alt="MY ARC" width="88" height="44" loading="lazy" />
          <div className="nh-voet-kolommen">
            {VOET.map((k) => (
              <div key={k.kop} className={`nh-voet-kolom${voetOpen === k.kop ? ' is-open' : ''}`}>
                <button type="button" aria-expanded={voetOpen === k.kop} onClick={() => setVoetOpen(voetOpen === k.kop ? null : k.kop)}>
                  {k.kop}
                  <ChevronDown size={20} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <div className="nh-voet-links">{k.links.map((l) => <Link key={l.tekst} item={l} onClick={l.href.startsWith('#') ? naarAnker : undefined} />)}</div>
              </div>
            ))}
          </div>
          <div className="nh-juridisch">{JURIDISCH.map((l) => <Link key={l.tekst} item={l} />)}</div>
          {/* Zelfde gegevens als op /privacy. */}
          <p className="nh-bedrijf">MY ARC Coaching · KvK 92854486 · <a href="mailto:kerstenscheffer@gmail.com">kerstenscheffer@gmail.com</a></p>
          <p className="nh-copyright">Copyright © {new Date().getFullYear()} MY ARC Coaching. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  )
}
