// src/modules/progress/fotosOpenen.js
//
// "Foto toevoegen" vanuit een melding: naar Voortgang en meteen de foto-sectie open.
// ProgressMain kan nog niet gemount zijn (pagina's laden pas bij eerste bezoek),
// dus het verzoek blijft staan tot hij het oppakt.
let wacht = false

export function vraagFotosOpen() {
  wacht = true
  window.dispatchEvent(new CustomEvent('myarc:fotos-open'))
}

export function pakFotosVerzoek() {
  const was = wacht
  wacht = false
  return was
}
