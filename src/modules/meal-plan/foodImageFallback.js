// src/modules/meal-plan/foodImageFallback.js
// Trefwoord→foto-map verwijderd (sep 2026): maaltijden zonder image_url tonen
// een neutrale placeholder in plaats van een gok-foto op naam.

export function foodImageFallback(_title, _slot, _size) {
  return null
}

export function resolveFoodImage(item) {
  const url = item?.image_url
  return url && url.trim() !== '' ? url : null
}
