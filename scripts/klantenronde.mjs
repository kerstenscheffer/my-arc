// scripts/klantenronde.mjs
//
// Klanten-ochtendronde (6 nov 2026). Elke ochtend ma t/m za zet Gino in het
// Klanten-paneel (CheckinRonde.jsx) per klant een status (groep), wat er
// speelt, hoe Kersten kan helpen en een voorbereiding voor calls van vandaag.
// Op ma/wo/za ook conceptappjes. Alles landt in checkin_ronde_items, een
// coach-tabel: er gaat NOOIT iets naar een klant. Gino levert de rijen als
// actie { soort: "ronde_vul", items: [...] }; vulRonde() controleert en schrijft.

import { vandaagNL } from './takenronde.mjs'

export const KLANTEN_TITEL = 'Klanten · ochtend'
const GROEPEN = new Set(['aandacht', 'vervolg', 'goed', 'gepauzeerd'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ITEMS = 80

const tekst = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const lijst = (v, max, n) => (Array.isArray(v) ? v.map(x => tekst(x, max)).filter(Boolean).slice(0, n) : [])

// Alleen de velden die het paneel kent, ingekort. Onbekend = weg.
function schoneSuggesties(s) {
  if (!s || typeof s !== 'object') return {}
  const uit = {
    reden: tekst(s.reden, 200),
    actie: tekst(s.actie, 400),
    signalen: lijst(s.signalen, 200, 6),
    compliment: tekst(s.compliment, 300),
    verbeterpunt: tekst(s.verbeterpunt, 300),
  }
  const c = s.call
  if (c && typeof c === 'object') {
    // Blokken van de skill Call-voorbereiding (CallBlad.jsx toont ze).
    uit.call = Object.fromEntries(Object.entries({
      tijd: tekst(c.tijd, 20),
      titel: tekst(c.titel, 120),
      doel: Array.isArray(c.doel) ? lijst(c.doel, 250, 6) : tekst(c.doel, 400),
      gewicht: Array.isArray(c.gewicht) ? lijst(c.gewicht, 250, 6) : tekst(c.gewicht, 500),
      training: Array.isArray(c.training) ? lijst(c.training, 250, 6) : tekst(c.training, 600),
      voeding: Array.isArray(c.voeding) ? lijst(c.voeding, 250, 6) : tekst(c.voeding, 500),
      sinds: Array.isArray(c.sinds) ? lijst(c.sinds, 250, 6) : tekst(c.sinds, 600),
      hoe: lijst(c.hoe, 250, 4),
      goed: lijst(c.goed, 250, 8),
      komende_week: lijst(c.komende_week, 250, 5),
      volgende_call: tekst(c.volgende_call, 200),
      precall: lijst(c.precall, 250, 6),
      struggles: lijst(c.struggles, 250, 6),
      open: lijst(c.open, 200, 6),
      randzaken: lijst(c.randzaken, 150, 5),
      vragen: lijst(c.vragen, 200, 5),
    }).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length)))
  }
  return Object.fromEntries(Object.entries(uit).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length)))
}

// Schrijft de ronde van vandaag. Alleen klanten uit business_os_ronde_data
// (Kerstens eigen, actief). Raakt bewerkt_bericht en verstuurd_at nooit.
export async function vulRonde(sb, coachId, actie) {
  const items = Array.isArray(actie?.items) ? actie.items.slice(0, MAX_ITEMS) : []
  if (!items.length) return { ok: false, fout: 'geen items' }
  const { data, error } = await sb.rpc('business_os_ronde_data')
  if (error) return { ok: false, fout: error.message }
  const bekend = new Set((data?.klanten || []).map(k => k.id))
  const ronde = vandaagNL()
  const rijen = []
  let overgeslagen = 0
  for (const it of items) {
    if (!UUID.test(it?.client_id || '') || !bekend.has(it.client_id) || !GROEPEN.has(it.groep)) { overgeslagen++; continue }
    const rij = { client_id: it.client_id, coach_id: coachId, ronde_datum: ronde, groep: it.groep, suggesties: schoneSuggesties(it.suggesties) }
    const bericht = tekst(it.bericht, 2000)
    if (bericht) rij.bericht = bericht
    rijen.push(rij)
  }
  if (!rijen.length) return { ok: false, fout: 'geen geldige klanten', overgeslagen }
  // Met en zonder bericht apart: een upsert zonder bericht-kolom laat een bestaand bericht staan.
  for (const groep of [rijen.filter(r => r.bericht), rijen.filter(r => !r.bericht)]) {
    if (!groep.length) continue
    const { error: f } = await sb.from('checkin_ronde_items').upsert(groep, { onConflict: 'client_id,ronde_datum' })
    if (f) return { ok: false, fout: f.message }
  }
  return { ok: true, aantal: rijen.length, overgeslagen }
}

const DAG_WERK = {
  1: `Maandag: schrijf alleen een bericht voor klanten die hun check-in NA zaterdag invulden (checkin_date zondag of maandag) en voor wie nog niets invulde sinds vrijdag. Die laatste: een kort, vriendelijk duwtje om hem in te vullen. De rest geen bericht.`,
  3: `Woensdag (check-in bericht): schrijf een bericht voor iedere klant die niet gepauzeerd is, in de vaste opbouw (skill Check-in ronde, stap 4). Er is woensdag geen nieuwe check-in: haal stap 2 van het bericht uit de check-in van vrijdag/zaterdag (hoe gaat dat plan nu?) en het compliment uit de data van deze week.`,
  6: `Zaterdag (diepe check-in): schrijf een bericht voor iedere klant die niet gepauzeerd is, op basis van de check-in van vrijdag/zaterdag (skill Check-in ronde, stap 4). Nog geen check-in: een kort duwtje.`,
}

// Opdracht voor de ronde. dag = getDay() in NL-tijd (0 = zondag).
export function klantenVraag(dag) {
  return `${KLANTEN_TITEL} (automatisch, Kersten kijkt later in het Klanten-paneel). Volg de skill Check-in ronde. Er gaat NIETS naar klanten: geen melding, push, mail of insert in notifications.

1. Data: node scripts/pa-db.mjs lees "select business_os_ronde_data() as d" en per klant wat de skill noemt (check-ins, workouts, gewicht, oefening-opmerkingen).
2. Calls van vandaag: node scripts/pa-db.mjs agenda (vandaag) en node scripts/pa-db.mjs lees "select c.client_id, c.call_title, c.scheduled_date, c.preparation_notes from client_calls c where c.scheduled_date::date = (now() at time zone 'Europe/Amsterdam')::date and c.canceled_at is null". Per klant met een call vandaag: volg de skill Call-voorbereiding (doel bovenaan, gewicht met beslisregels, training, voeding, struggles, randzaken). Lees de vorige call (client_calls coach_summary/meeting_notes, call_insights als die er is), client_action_items die open staan en wat er sindsdien gebeurde.
   Open beloftes en laatste call-verslag (voor stap 3): node scripts/pa-db.mjs lees "select id, title, created_at from productivity_tasks where status='active' and title ilike 'Belofte%' order by created_at" (koppel per klant op titel 'Belofte <voornaam>…') en node scripts/pa-db.mjs lees "select distinct on (client_id) client_id, status, created_at from client_coaching_logs where category='call_summary' order by client_id, created_at desc".
3. Per klant (niet gepauzeerd, niet het testaccount) een item. Kleur = deze vaste regels (dezelfde stip staat in Command), de zwaarste die geldt wint:
   → aandacht (ROOD), actie: Kersten binnen 24 uur. Eén van:
     · 2 weken op rij onder tempo (weektempo < 75% van het weekdoel van de fase) zonder verklaring (ziekte, vakantie, weekend-uitschieter);
     · stil: 0 wegingen én 0 trainingen in de laatste 7 dagen;
     · 2 weken geen check-in;
     · ziek of blessure zonder plan;
     · een open belofte aan deze klant (productivity_tasks status active, titel 'Belofte <naam>…') die meer dan 3 dagen oud is.
   → vervolg (ORANJE), actie: eerstvolgende ronde. Precies één ding mis:
     · 1 week onder tempo;
     · check-in gemist;
     · minder trainingen dan gepland;
     · een hulpvraag;
     · traject eindigt binnen 14 dagen zonder besluit over doorgaan;
     · laatste call-verslag (client_coaching_logs call_summary) off_track of needs_attention en minder dan 7 dagen oud: dan minimaal oranje.
     Twee of meer van deze punten tegelijk = nog steeds oranje, tenzij een rode regel geldt.
   → goed (GROEN), actie: compliment in de ronde. Alles tegelijk: op tempo (weektempo zaterdag-op-zaterdag minstens 75% van het weekdoel van de fase), 5+ wegingen in 7 dagen, trainingen volgens plan, check-in ingevuld, geen open klacht.
   → suggesties.reden: één regel welke regel de kleur bepaalt, met het cijfer (bv. "2 weken onder tempo: -0,1 en 0,0 kg van -0,5 doel"). Gewicht altijd als weektempo zaterdag-op-zaterdag zoals de app (skill Call-voorbereiding, blok 1), nooit een eigen rollend venster.
   → suggesties.actie: bij aandacht "Binnen 24 uur: …" en bij vervolg "Volgende ronde: …", met wat Kersten concreet doet (bv. "5 min bellen: training loopt vast door nachtdiensten, plan 2 vaste momenten"). Bij goed het compliment voor in de ronde.
   → suggesties.signalen: max 5 korte regels voor Kersten. Open beloftes aan deze klant staan hier altijd, als "Belofte: <wat> (<n> dagen open)"; daarna wat er verder opvalt.
   → suggesties.call (alleen bij een call vandaag), blokken uit de skill Call-voorbereiding: { tijd: "HH:MM", titel, doel: [..], hoe: [check-in], gewicht: [..], voeding: [..], training: [..], goed: [ALLES wat goed gaat, met cijfer], komende_week: [voorstel acties], volgende_call: "over 1 of 2 weken + waarom", precall: [max 5 regels die Kersten vóór de call MOET lezen: conclusies, wat opvalt, wat hij niet mag vergeten], struggles: [oude issues als check hoe dat gaat], open: [beloftes vorige call], randzaken: [foto's, check-in, traject], vragen: [max 3 punten die echt besproken moeten worden] }. Elk blok is een LIJST korte regels "Label: waarde", één datapunt per regel, nooit meerdere cijfers achter elkaar in één zin (zie skill, OPMAAK). Gaat iets goed: één regel.
   ${DAG_WERK[dag] || 'Vandaag geen berichten: laat bericht leeg.'}
   → bericht (alleen als hierboven gevraagd): Kerstens vaste opbouw uit de skill Check-in ronde (stap 4), begint letterlijk met "Een hele goede {dagdeel} <voornaam>! Alles goed?". Laat {dagdeel} staan: het paneel vult ochtend/middag/avond in.
4. Lever alles in één actie: { "soort": "ronde_vul", "items": [ { "client_id", "groep", "suggesties": {…}, "bericht"? } ] }. De PA schrijft hem direct in het paneel. Geen wijziging_voorstel.
5. Je tekst: max 4 regels. Hoeveel rood/oranje/groen, de calls van vandaag met tijd, en de 1-2 klanten die vandaag echt voorgaan.`
}
