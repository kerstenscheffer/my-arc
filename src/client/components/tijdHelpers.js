// src/client/components/tijdHelpers.js
//
// Minuten sinds middernacht is de munt van de agenda; dit zijn de twee dingen
// die je er overal omheen nodig hebt. Apart bestand omdat een component-bestand
// alleen componenten mag exporteren (fast refresh).

// Minuten per regel van het tijdwiel.
export const STAP = 5

export const tijdTekst = (min) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
