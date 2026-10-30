// src/modules/workout/utils/oefeningLabels.js
//
// Nederlandse namen voor spiergroep en materiaal (de exercises-tabel staat in
// het Engels) en de foto voor een rij in het toevoeg- en wisselvenster.
import { fotoUitRij, getFallbackImage } from './oefeningFoto'

export const SPIER_LABELS = {
  chest: 'Borst', back: 'Rug', shoulders: 'Schouders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Benen', core: 'Core', abs: 'Buik',
  calves: 'Kuiten', glutes: 'Billen', traps: 'Trapezius',
}
export const MATERIAAL_LABELS = {
  barbell: 'Barbell', dumbbells: 'Dumbbells', cables: 'Kabels', machine: 'Machine',
  bodyweight: 'Lichaamsgewicht', kettlebell: 'Kettlebell', plates: 'Schijven',
}
export const spierLabel = (v) => SPIER_LABELS[v] || v
export const materiaalLabel = (v) => MATERIAAL_LABELS[v] || v

// De foto voor een rij uit de lijst. YouTube's hqdefault heeft zwarte balken
// boven en onder; in een vierkantje zie je die. mqdefault is 16:9 zonder balken.
export const fotoVoor = (ex) => {
  const url = fotoUitRij(ex)
    || getFallbackImage({ ...ex, primairSpieren: ex?.primair_spieren || ex?.primairSpieren })
  return String(url).replace('/hqdefault.jpg', '/mqdefault.jpg')
}

