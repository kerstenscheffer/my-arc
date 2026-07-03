// src/lib/publicIntakeApi.js
// Client-helper voor /api/public-intake — gebruikt door de publieke
// intake-pagina's in plaats van directe (anon) queries op de clients-tabel.

async function call(action, params = {}) {
  const res = await fetch('/api/public-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `public-intake ${action} failed (${res.status})`)
  return json
}

/** Zoek client op email. Geeft het volledige client-record of null. */
export async function findClient(email) {
  const { client } = await call('find-client', { email })
  return client
}

/** Haal client op via id. Geeft het volledige client-record of null. */
export async function getClient(clientId) {
  const { client } = await call('get-client', { clientId })
  return client
}

/** Update intake-velden van een client (server-side whitelist). */
export async function updateClient(clientId, fields) {
  await call('update-client', { clientId, fields })
  return true
}
