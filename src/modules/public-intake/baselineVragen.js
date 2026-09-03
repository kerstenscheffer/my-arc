// src/modules/public-intake/baselineVragen.js
//
// De vijf schaalvragen van de nulmeting, op één plek.
//
// Gedeeld door de intake (die ze stelt) en de coach-modal (die ze terugtoont).
// Eén bron: anders lopen de labels uit elkaar zodra er een vraag bijkomt, en
// dan vergelijk je straks een hermeting met verkeerde koppen.
export const BASELINE_VRAGEN = [
  { veld: 'energie',      kort: 'Energie',   vraag: 'Hoeveel energie heb je door de dag?',                laag: 'Uitgeput',    hoog: 'Vol energie' },
  { veld: 'in_je_vel',    kort: 'In je vel', vraag: 'Hoe goed zit je op dit moment in je vel?',           laag: 'Slecht',      hoog: 'Uitstekend' },
  { veld: 'kracht',       kort: 'Kracht',    vraag: 'Hoe sterk en fit voel je je in je dagelijks leven?', laag: 'Zwak',        hoog: 'Heel sterk' },
  { veld: 'slaap',        kort: 'Slaap',     vraag: 'Hoe is je slaapkwaliteit?',                          laag: 'Heel slecht', hoog: 'Heel goed' },
  { veld: 'voeding_grip', kort: 'Voeding',   vraag: 'Hoeveel grip heb je op je voeding?',                 laag: 'Geen grip',   hoog: 'Volledige grip' },
]
