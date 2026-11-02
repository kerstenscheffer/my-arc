// src/modules/coach-command-center/klantkaartOpenen.js
//
// Een verjaardagsmelding opent de klantkaart in Command (of alleen Command bij
// meerdere jarigen). Twee wegen komen hier samen: een tik in de meldingenbel en
// een tik op de push (PushNotificationService). Bij een push vanuit een gesloten
// app is Command er nog niet; dan blijft het verzoek liggen tot Command mount.

export const OPEN_KLANTKAART_EVENT = 'myarc:open-klantkaart'
let wachtend = null

export function openKlantkaart(clientId) {
  window.location.hash = 'command'
  if (!clientId) return
  wachtend = clientId
  window.dispatchEvent(new CustomEvent(OPEN_KLANTKAART_EVENT))
}

export const pakWachtendeKlantkaart = () => { const w = wachtend; wachtend = null; return w }
