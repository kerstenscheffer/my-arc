// src/modules/client-checkin/checkinVragen.js
//
// De vragen van de wekelijkse check-in, op één plek. Het formulier rendert
// hieruit, en de coachkant (Coach Insight, detailweergave) leest hier de
// letterlijke vraagtekst bij elk antwoord. Zo ziet de coach precies wat de
// klant gevraagd is, en loopt dat nooit uit de pas met wat is opgeslagen.

export const TEVREDEN_OPTIES = ['Heel erg tevreden', 'Een beetje tevreden', 'Niet tevreden']

export const SECTIES = [
  {
    kop: 'Even bijpraten',
    velden: [
      {
        // Bewust zonder cijfers: die komen op het volgende scherm. Eerst hoe
        // iemand erin zit, want dat antwoord kleurt anders zodra je er een
        // gewicht of een aantal trainingen naast legt.
        id: 'hoe_gaat_het', type: 'tekst',
        toonFase: true,
        vraag: 'Hoe gaat het met je?',
        hulp: null,
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
    ],
  },
  {
    // Slide 2: terugkoppeling op vorige week. Komt alleen in het formulier
    // als er toen doelen zijn gezet; zonder doelen is er niets terug te
    // koppelen. Toont wat de klant toen opschreef ("dit ga ik anders doen")
    // en zijn doelen met gehaald/niet, en vraagt waarom.
    kop: 'Je doelen van afgelopen week',
    alleenMetDoelen: true,
    velden: [
      {
        id: 'doelen_vorige_week', type: 'doelen-terugkoppeling', verplicht: true,
        vraag: 'Afgelopen week waren dit je doelen, is het gelukt deze uit te voeren?',
        hulp: null,
        uitlegId: 'doelen_toelichting',
        uitlegLabel: 'Waarom wel/niet?',
        placeholder: 'In je eigen woorden.',
      },
    ],
  },
  {
    kop: 'Je progressie',
    velden: [
      {
        // Geen vraag maar een terugblik: dit is er gebeurd. Hier stonden vijf
        // vragen die de klant uit zijn hoofd moest beantwoorden terwijl de app
        // het precies wist.
        id: 'week_cijfers_scherm', type: 'progressie',
        vraag: 'Je progressie afgelopen week',
        hulp: null,
        // Deze kop hoort bij het blok eronder, niet midden op het scherm als
        // vraag: er valt niets te beantwoorden.
        kopRechts: true,
      },
      {
        // Eerst kiezen, dan uitleggen. De keuze komt verderop terug in de
        // vraag wat de klant komende week anders gaat doen.
        id: 'progressie_tevreden', type: 'keuze-uitleg',
        vraag: 'Ben je tevreden met de progressie die je afgelopen week hebt gemaakt?',
        hulp: null,
        // Zonder keuze en uitleg kun je niet verder: de rest van het formulier
        // bouwt hierop voort.
        verplicht: true,
        opties: TEVREDEN_OPTIES,
        uitlegId: 'cijfers_toelichting',
        uitlegLabel: 'Leg uit waarom',
        placeholder: 'In je eigen woorden.',
      },
    ],
  },
  {
    kop: 'Terugblik',
    velden: [
      {
        // Meerdere regels: elk ding dat goed ging op een eigen lijn. Wordt
        // als één tekst met regeleinden opgeslagen in trots_op.
        id: 'trots_op', type: 'tekst-lijst', verplicht: true,
        vraag: 'Wat ging er goed, waar ben je trots op?',
        hulp: 'Meerdere dingen? Druk op de + voor een extra regel.',
        placeholder: 'In je eigen woorden.',
      },
      {
        id: 'kon_beter', type: 'tekst-lijst', verplicht: true,
        vraag: 'Wat vond je lastig?',
        hulp: 'Meerdere dingen? Druk op de + voor een extra regel.',
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
      {
        // Grijpt terug op de keuze van slide 3. Wie al heel erg tevreden is,
        // hoeft niets "anders" te doen; die vragen we wat hij vasthoudt.
        id: 'volgende_week_beter', type: 'tekst',
        vraag: 'Je gaf aan dat je {tevreden} was over je progressie, wat ga je komende week anders doen om te zorgen dat je wel tevreden bent over je progressie?',
        vraagTevreden: 'Je gaf aan dat je heel erg tevreden was over je progressie, wat ga je komende week doen om dat vast te houden?',
        vraagZonderKeuze: 'Wat ga je komende week anders doen om tevreden te zijn over je progressie?',
        hulp: null,
        placeholder: 'Bijvoorbeeld: zondagavond mijn eten voorbereiden.',
        // Het doelen-blok staat compact onder dit antwoord: wie net heeft
        // opgeschreven wat hij anders gaat doen, kan het meteen meetbaar maken.
        metDoelen: true,
      },
    ],
  },
  {
    kop: 'Focus voor komende week',
    velden: [
      {
        id: 'hulp_van_coach', type: 'tekst',
        vraag: 'Wat kan ik als coach doen om je te helpen je doelen te halen?',
        placeholder: 'Zeg het gerust rechtstreeks.',
      },
      {
        id: 'komende_week', type: 'tekst', optioneel: true,
        vraag: 'Is er komende week iets waardoor je het plan niet kan volgen?',
        hulp: 'Bijvoorbeeld een bruiloft, weekend weg, drukke werkweek of vakantie.',
        placeholder: 'Zo niet, laat leeg.',
      },
    ],
  },
]

// Elke vierde check-in erbij: hoe bevalt de coaching zelf. Niet elke week —
// dan wordt het een formaliteit en krijg je "gaat goed" terug. Eens per vier
// weken heeft iemand genoeg meegemaakt om er iets zinnigs over te zeggen.
//
// Eerst het cijfer voor het hele traject, dan twee open vragen over de
// coaching: een 8 alleen vertelt je niet wat je moet houden of veranderen.
export const COACHING_SECTIE = {
  kop: 'Over de coaching',
  velden: [
    {
      id: 'traject_score', type: 'schaal',
      vraag: 'Hoe voel je je over je hele traject tot nu toe?',
      hulp: '1 is slecht, 10 is uitstekend.',
    },
    {
      id: 'traject_toelichting', type: 'tekst', optioneel: true,
      vraag: 'Wil je dat cijfer toelichten?',
      hulp: 'Alleen als je er iets bij wilt zeggen.',
      placeholder: 'Optioneel.',
    },
    {
      id: 'coaching_fijnste', type: 'tekst',
      vraag: 'Wat vind je tot nu toe het fijnste aan de coaching?',
      hulp: 'Eens per vier weken vraag ik dit even — zo weet ik wat ik moet blijven doen.',
      placeholder: 'Waar heb je het meeste aan gehad?',
    },
    {
      id: 'coaching_verbeterpunt', type: 'tekst',
      vraag: 'En wat kan er beter?',
      hulp: 'Eerlijk mag, daar heb ik het meeste aan.',
      placeholder: 'Wat je mist, wat onduidelijk is, wat anders zou moeten.',
    },
  ],
}

// ── Coachkant ───────────────────────────────────────────────────────────
//
// Alle velden plat, in de volgorde van het formulier (inclusief de
// vierwekelijkse coachingvragen).
export const ALLE_VELDEN = [...SECTIES, COACHING_SECTIE].flatMap(sec => sec.velden)

const leeg = (w) => w == null || (typeof w === 'string' && w.trim() === '')

/**
 * De vraag zoals de klant hem zag, met de aanhef-variabelen ingevuld.
 * `{tevreden}` wordt de gekozen optie; `{naam}` de voornaam als die er is.
 */
export function vraagVoor(veld, checkin, voornaam = '') {
  let tekst = veld.vraag
  if (tekst.includes('{tevreden}')) {
    const keuze = checkin?.progressie_tevreden
    tekst = !keuze ? veld.vraagZonderKeuze
      : keuze === TEVREDEN_OPTIES[0] ? veld.vraagTevreden
      : tekst.replace('{tevreden}', keuze.toLowerCase())
  }
  if (tekst.includes('{naam}')) {
    tekst = voornaam ? tekst.replace('{naam}', voornaam) : tekst.replace(', {naam}', '')
  }
  return tekst
}

/**
 * Vraag-en-antwoordparen voor een ingevulde check-in (formulier versie 4),
 * in de volgorde van het formulier. Doelen zitten er als eigen soort in:
 *   { soort: 'tekst',  vraag, antwoord, feedback? }
 *   { soort: 'doelen-terug', vraag, doelen }   — van vorige week, met behaald
 *   { soort: 'doelen-nieuw', vraag, doelen }   — voor komende week
 * Lege antwoorden vallen weg; een leeg veld is geen informatie.
 */
export function antwoordenVan(checkin, voornaam = '') {
  if (!checkin) return []
  const uit = []
  for (const v of ALLE_VELDEN) {
    const vraag = vraagVoor(v, checkin, voornaam)
    const feedback = v.id === 'coaching_fijnste' || v.id === 'coaching_verbeterpunt'
    switch (v.type) {
      case 'progressie':
        uit.push({ soort: 'progressie', id: v.id, vraag, progressie: checkin.progressie || null })
        break
      case 'keuze-uitleg': {
        if (!leeg(checkin[v.id])) uit.push({ soort: 'tekst', id: v.id, vraag, antwoord: checkin[v.id] })
        if (!leeg(checkin[v.uitlegId])) uit.push({ soort: 'tekst', id: v.uitlegId, vraag: v.uitlegLabel, antwoord: checkin[v.uitlegId] })
        break
      }
      case 'doelen-terugkoppeling': {
        const d = checkin.doelen_vorige_week
        if (Array.isArray(d) && d.length) uit.push({ soort: 'doelen-terug', id: v.id, vraag, doelen: d })
        if (!leeg(checkin[v.uitlegId])) uit.push({ soort: 'tekst', id: v.uitlegId, vraag: v.uitlegLabel, antwoord: checkin[v.uitlegId] })
        break
      }
      default: {
        if (!leeg(checkin[v.id])) uit.push({ soort: 'tekst', id: v.id, vraag, antwoord: String(checkin[v.id]), feedback })
        if (v.metDoelen) {
          const d = checkin.doelen_komende_week
          if (Array.isArray(d) && d.length) uit.push({ soort: 'doelen-nieuw', id: 'doelen_komende_week', vraag: 'Doelen voor komende week', doelen: d })
        }
      }
    }
  }
  return uit
}
