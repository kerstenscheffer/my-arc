// src/accountWissel.js
//
// Snel wisselen tussen Kerstens twee accounts (20 nov 2026): het coach-account
// en zijn klant-testaccount. Alleen deze twee account-ID's, verder niemand.
//
// Eerder (tot aug 2026) bewaarde de wisselknop het WACHTWOORD, in platte tekst en
// zelfs in user_metadata. Daarmee konden klanten in de coach-hub komen. Daarom:
//   - Nergens een wachtwoord. Per account staat alleen de sessie (tokens) op DIT
//     toestel, in localStorage. Niets gaat naar de server of naar een account.
//   - Alleen voor de twee ID's hieronder. Voor elk ander account doet dit niets en
//     is de knop er niet.
//   - Na elke wissel vraagt de app de server welk account er echt ingelogd is. Klopt
//     het ID niet: alles wissen en uitloggen. Welk portaal je krijgt beslist daarna
//     nog steeds get_my_portal_role (portaalKeuze.js), dat nooit op coach gokt.
//   - Uitloggen (db.signOut) wist alle bewaarde sessies van dit toestel.
//   - Wisselen logt NIET uit: signOut trekt de sessie op de server in, en die
//     sessie bewaren we juist om terug te kunnen.

import { supabase } from './lib/supabase'
import { ROL_SLEUTEL } from './portaalKeuze'

export const EIGEN_ACCOUNTS = {
  '5a0135ac-3188-499d-8682-ed6a179e5541': { rol: 'coach', naam: 'Coach', email: 'kerstenscheffer@gmail.com' },
  '3614db87-06bd-4198-838a-4a54019051df': { rol: 'klant', naam: 'Klant', email: 'ks10k@gmail.com' },
}
const SLEUTEL = 'myarc_account_wissel'

export const isEigenAccount = (id) => !!(id && EIGEN_ACCOUNTS[id])
export const anderAccount = (id) => (isEigenAccount(id) ? Object.keys(EIGEN_ACCOUNTS).find(k => k !== id) : null)

const lees = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SLEUTEL) || '{}')
    // Alleen rijen van de eigen accounts, al het andere negeren.
    return Object.fromEntries(Object.entries(v || {}).filter(([id, s]) => isEigenAccount(id) && s?.refresh_token))
  } catch { return {} }
}
const schrijf = (v) => { try { localStorage.setItem(SLEUTEL, JSON.stringify(v)) } catch { /* geen opslag */ } }

export function wisAlleWisselSessies() {
  try { localStorage.removeItem(SLEUTEL) } catch { /* geen opslag */ }
}

export const heeftWisselSessie = (id) => !!lees()[id]

// De huidige sessie bewaren, alleen als het een eigen account is.
function bewaar(sessie) {
  const id = sessie?.user?.id
  if (!isEigenAccount(id) || !sessie.refresh_token) return
  schrijf({ ...lees(), [id]: { access_token: sessie.access_token, refresh_token: sessie.refresh_token } })
}

function zetPortaal(id) {
  const klant = EIGEN_ACCOUNTS[id].rol === 'klant'
  try {
    localStorage.setItem('isClientMode', klant ? 'true' : 'false')
    localStorage.setItem('portalChoice', klant ? 'client' : 'coach')
    // De serverrol wordt na het herladen opnieuw vastgesteld.
    localStorage.removeItem(ROL_SLEUTEL)
  } catch { /* geen opslag */ }
}

// Na de wissel: de server moet precies het verwachte account teruggeven.
async function controleer(doelId) {
  const { data, error } = await supabase.auth.getUser().then(r => r, e => ({ error: e }))
  if (!error && data?.user?.id === doelId) return true
  wisAlleWisselSessies()
  await supabase.auth.signOut({ scope: 'local' }).then(() => {}, () => {})
  return false
}

// Uitkomst: 'ok' (pagina herlaadt) | 'inloggen' (geen geldige sessie, vraag om wachtwoord) | 'fout'
export async function wissel() {
  const { data } = await supabase.auth.getSession()
  const nu = data?.session
  const doelId = anderAccount(nu?.user?.id)
  if (!doelId) return 'fout'
  const doel = lees()[doelId]
  if (!doel) return 'inloggen'

  supabase.auth.stopAutoRefresh()
  bewaar(nu)
  const { error } = await supabase.auth.setSession(doel).then(r => r, e => ({ error: e }))
  if (error) {
    // Verlopen of ingetrokken: die sessie weg, terug naar het account van net.
    const rest = lees(); delete rest[doelId]; schrijf(rest)
    await supabase.auth.setSession({ access_token: nu.access_token, refresh_token: nu.refresh_token }).then(() => {}, () => {})
    supabase.auth.startAutoRefresh()
    return 'inloggen'
  }
  if (!(await controleer(doelId))) { window.location.href = '/'; return 'fout' }
  zetPortaal(doelId)
  window.location.href = '/'
  return 'ok'
}

// Eerste keer op dit toestel (of sessie verlopen): inloggen op het andere account
// zonder het huidige uit te loggen. Alleen het andere eigen account wordt geaccepteerd.
export async function koppelEnWissel(email, wachtwoord) {
  const { data } = await supabase.auth.getSession()
  const nu = data?.session
  const doelId = anderAccount(nu?.user?.id)
  if (!doelId) return { fout: 'Niet beschikbaar voor dit account' }
  if (email.trim().toLowerCase() !== EIGEN_ACCOUNTS[doelId].email) return { fout: `Dit is niet ${EIGEN_ACCOUNTS[doelId].email}` }

  supabase.auth.stopAutoRefresh()
  bewaar(nu)
  const { data: res, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: wachtwoord })
    .then(r => r, e => ({ error: e }))
  if (error || res?.user?.id !== doelId) {
    // Mislukt: terug naar de sessie van net.
    if (!error) await supabase.auth.signOut({ scope: 'local' }).then(() => {}, () => {})
    await supabase.auth.setSession({ access_token: nu.access_token, refresh_token: nu.refresh_token }).then(() => {}, () => {})
    supabase.auth.startAutoRefresh()
    return { fout: error?.message || 'Inloggen mislukt' }
  }
  bewaar(res.session)
  if (!(await controleer(doelId))) { window.location.href = '/'; return { fout: 'Controle mislukt' } }
  zetPortaal(doelId)
  window.location.href = '/'
  return { ok: true }
}
