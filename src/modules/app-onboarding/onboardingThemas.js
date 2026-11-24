// src/modules/app-onboarding/onboardingThemas.js
//
// Stijlen voor de app-onboarding (24 nov 2026). Kersten kiest op /test.
// 'speels' = Yazio-achtig; zwartwit, volt en vuur zijn stoerder maar even simpel.

export const THEMAS = {
  // Gekozen 24 nov 2026: de vorm van Volt in MY ARC-kleuren (zwart, wit, goud).
  arc: {
    naam: 'MY ARC (volt + goud)', bg: '#0b0b0c', vak: '#1a1a1c', vakRand: '#000', vakLijn: '#2e2e31',
    primair: '#fff', primairTekst: '#000', primairRand: '#9b9b9b', accent: '#FFD700',
    actief: '#FFD700', actiefTekst: '#000', actiefRand: '#9c8200',
    radius: 10, schaduw: (k) => `0 4px 0 ${k}`, druk: 'translateY(4px)',
    kop: { textTransform: 'uppercase', fontStyle: 'italic', fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '1.85rem', lineHeight: 1.1 },
    font: 'Archivo+Black', rond: false, glow: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.09) 0%, transparent 60%)',
  },
  speels: {
    naam: 'Speels (Yazio)', bg: '#16181a', vak: '#25292c', vakRand: '#0b0c0d', vakLijn: '#353a3d',
    primair: '#fff', primairTekst: '#0a0a0a', primairRand: '#b4babd', accent: '#10b981',
    radius: 18, schaduw: (k) => `0 5px 0 ${k}`, druk: 'translateY(5px)',
    kop: {}, font: null, rond: true, glow: null,
  },
  zwartwit: {
    naam: 'Zwart-wit (strak)', bg: '#000', vak: '#000', vakRand: '#fff', vakLijn: '#fff',
    primair: '#fff', primairTekst: '#000', primairRand: '#fff', accent: '#fff',
    radius: 4, rand: '2px solid #fff', schaduw: () => 'none', druk: 'scale(0.98)',
    kop: { textTransform: 'uppercase', letterSpacing: '0.01em', fontFamily: '"Anton", "Arial Narrow", sans-serif', fontWeight: 400, fontSize: '2.3rem', lineHeight: 1.05 },
    font: 'Anton', rond: false, glow: null,
  },
  volt: {
    naam: 'Volt (gym)', bg: '#0c0d0e', vak: '#1a1c1e', vakRand: '#000', vakLijn: '#2c3033',
    primair: '#c6ff00', primairTekst: '#000', primairRand: '#7a9e00', accent: '#c6ff00',
    radius: 10, schaduw: (k) => `0 4px 0 ${k}`, druk: 'translateY(4px)',
    kop: { textTransform: 'uppercase', fontStyle: 'italic', fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '1.85rem', lineHeight: 1.1 },
    font: 'Archivo+Black', rond: false, glow: 'radial-gradient(ellipse at 50% 30%, rgba(198,255,0,0.10) 0%, transparent 60%)',
  },
  vuur: {
    naam: 'Vuur (oranje)', bg: '#0f0b09', vak: '#1d1714', vakRand: '#050302', vakLijn: '#3a2a20',
    primair: '#ff6a1a', primairTekst: '#fff', primairRand: '#a33b00', accent: '#ff6a1a',
    radius: 14, schaduw: (k) => `0 5px 0 ${k}`, druk: 'translateY(5px)',
    kop: { textTransform: 'uppercase', fontFamily: '"Oswald", "Arial Narrow", sans-serif', fontWeight: 700, letterSpacing: '0.01em', fontSize: '2.1rem', lineHeight: 1.08 },
    font: 'Oswald:wght@700', rond: true, glow: 'radial-gradient(ellipse at 50% 32%, rgba(255,106,26,0.16) 0%, transparent 62%)',
  },
}
