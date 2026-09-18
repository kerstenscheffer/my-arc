// src/client/components/workoutFoto.js
// Eén foto per soort training, op naam gekozen. Gedeeld door de workout-kaart
// op home en de trainingsblokken in de dagagenda, zodat dezelfde training niet
// op twee plekken een andere foto krijgt.

const FOTOS = {
  push: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=1200&h=500&fit=crop&q=85',
  pull: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1200&h=500&fit=crop&q=85',
  legs: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=1200&h=500&fit=crop&q=85',
  default: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=500&fit=crop&q=85',
}

export function workoutFoto(naam) {
  const n = (naam || '').toLowerCase()
  if (/push|duw|borst|chest|press/.test(n)) return FOTOS.push
  if (/pull|trek|rug|back|lat/.test(n)) return FOTOS.pull
  if (/leg|been|quad|squat|hamstring|glute/.test(n)) return FOTOS.legs
  return FOTOS.default
}
