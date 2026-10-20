// src/utils/zichtbaarPollen.js
//
// Periodiek iets opnieuw ophalen, maar alleen terwijl de app in beeld is.
// Op de achtergrond (telefoon op slot, andere app) staat het stil; komt de
// app terug, dan direct één keer bijwerken. Geeft een stop-functie terug.
//
// fn mag `false` teruggeven (of een Promise daarvan): dan stopt het pollen,
// bv. omdat er geen challenge is en er dus niets te verversen valt.

export default function zichtbaarPollen(fn, ms) {
  let id = null
  let gestopt = false
  const draai = async () => {
    if (gestopt || document.hidden) return
    const door = await fn()
    if (door === false) stop()
  }
  const start = () => { if (!id && !gestopt) id = setInterval(draai, ms) }
  const pauze = () => { if (id) { clearInterval(id); id = null } }
  const opZicht = () => {
    if (document.hidden) pauze()
    else { draai(); start() }
  }
  const stop = () => {
    gestopt = true
    pauze()
    document.removeEventListener('visibilitychange', opZicht)
  }
  document.addEventListener('visibilitychange', opZicht)
  if (!document.hidden) start()
  return stop
}
