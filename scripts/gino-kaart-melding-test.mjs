// scripts/gino-kaart-melding-test.mjs
//
// Test van de kaartmelding met een nep-database, zonder iets te versturen:
//   node scripts/gino-kaart-melding-test.mjs
// De nep-builder is net als Supabase alleen thenable en heeft dus geen .catch().

import { maakKaartMelder, MELD_TITEL, MELD_NA_MS, MELD_AFSTAND_MS } from './gino-kaart-melding.mjs'

const NA = 40, AFSTAND = 300
const wacht = (ms) => new Promise(k => setTimeout(k, ms))

function nepDb(meldingen = []) {
  const kaarten = new Map()
  const sb = {
    from(tabel) {
      const b = {
        select: () => b, order: () => b, limit: () => b, contains: () => b,
        eq(k, w) { if (tabel === 'business_os_toestemmingen' && k === 'id') b.id = w; return b },
        maybeSingle: () => b,
        insert(r) { meldingen.push({ ...r, created_at: new Date().toISOString() }); b.isInsert = true; return b },
        then(ok, nee) {
          const uit = b.isInsert ? { error: null }
            : tabel === 'business_os_toestemmingen' ? { data: { status: kaarten.get(b.id) } }
              : { data: [...meldingen].reverse().slice(0, 1) }
          return new Promise(k => setTimeout(k, 2)).then(() => uit).then(ok, nee)
        },
      }
      return b
    },
  }
  return { sb, kaarten, meldingen }
}

const fouten = []
const moet = (ok, tekst) => { console.log(`${ok ? '  ok ' : 'FOUT '} ${tekst}`); if (!ok) fouten.push(tekst) }
const melderVoor = (db) => maakKaartMelder({ sb: db.sb, coachId: () => 'coach', naMs: NA, afstandMs: AFSTAND, fout: (t) => fouten.push(t) })

moet(MELD_NA_MS === 60000 && MELD_AFSTAND_MS === 900000, 'echte waarden: 60 s en 15 min')

{ // Beantwoord binnen de tijd: geen rij.
  const db = nepDb(); const m = melderVoor(db)
  db.kaarten.set('a', 'wacht'); m.kaart('a', 'x')
  moet(db.meldingen.length === 0, 'kaart maakt niet direct een rij')
  db.kaarten.set('a', 'toegestaan')
  await wacht(NA + 30)
  moet(db.meldingen.length === 0, 'beantwoord voor de 60 s: geen rij')
}

{ // Nog op wacht: precies één rij, met dezelfde velden als voorheen.
  const db = nepDb(); const m = melderVoor(db)
  db.kaarten.set('b', 'wacht'); m.kaart('b', 'y'.repeat(200))
  await wacht(NA - 20)
  moet(db.meldingen.length === 0, 'voor de 60 s nog geen rij')
  await wacht(50)
  const r = db.meldingen[0]
  moet(db.meldingen.length === 1, 'na de 60 s één rij')
  moet(r?.title === MELD_TITEL && r.type === 'personal' && !('client_id' in r) && r.message.length === 140
    && r.action_data.soort === 'gino_toestemming' && r.action_data.toestemming_id === 'b', 'velden kloppen (geen client_id, push-soort blijft)')
}

{ // Meerdere open kaarten tegelijk: één rij; open kaart na de afstand: nog één.
  const db = nepDb(); const m = melderVoor(db)
  for (const id of ['c', 'd', 'e']) { db.kaarten.set(id, 'wacht'); m.kaart(id, id) }
  await wacht(NA + 40)
  moet(db.meldingen.length === 1, 'drie open kaarten: één rij')
  db.kaarten.set('d', 'toegestaan'); db.kaarten.set('e', 'verlopen')
  await wacht(AFSTAND + 40)
  moet(db.meldingen.length === 2, 'kaart nog open na de afstand: tweede rij')
  await wacht(AFSTAND / 2)
  moet(db.meldingen.length === 2, 'binnen de nieuwe afstand geen derde rij')
  db.kaarten.set('c', 'toegestaan')
  await wacht(AFSTAND)
  moet(db.meldingen.length === 2, 'beantwoord tijdens de afstand: geen rij meer')
}

{ // Na een herstart telt de rij uit de database mee.
  const db = nepDb([{ title: MELD_TITEL, created_at: new Date().toISOString() }]); const m = melderVoor(db)
  db.kaarten.set('f', 'wacht'); m.kaart('f', 'f')
  await wacht(NA + 30)
  moet(db.meldingen.length === 1, 'rij van vóór de herstart: geen nieuwe binnen de afstand')
}

{ // Mislukte lees- of schrijfactie mag de PA niet raken.
  const kapot = { from: () => { const b = { select: () => b, eq: () => b, maybeSingle: () => b, then: (_, nee) => Promise.reject(new Error('stuk')).then(_, nee) }; return b } }
  const gezien = []
  const m = maakKaartMelder({ sb: kapot, coachId: () => 'coach', naMs: 5, afstandMs: 10, fout: (t) => gezien.push(t) })
  m.kaart('g', 'g')
  await wacht(30)
  moet(gezien.length === 1, 'databasefout wordt gelogd en crasht niet')
}

console.log(fouten.length ? `\n${fouten.length} FOUT` : '\nAlles goed')
process.exit(fouten.length ? 1 : 0)
