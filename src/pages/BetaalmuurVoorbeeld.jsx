// src/pages/BetaalmuurVoorbeeld.jsx
//
// /test-betaalmuur (24 nov 2026): de echte betaalmuur met vaste voorbeeldprijzen,
// voor de review-screenshot van de abonnementen in App Store Connect. Kopen kan
// hier niet (geen winkel); niet gelinkt in menu's.

import AppBetaalmuur from '../client/components/AppBetaalmuur'

const AANBOD = [
  { id: '$rc_annual', maanden: 12, prijs: '€ 294,99', prijsGetal: 294.99, perMaand: '€ 24,58', proef: true, proefDuur: '1 maand', pkg: null },
  { id: '$rc_monthly', maanden: 1, prijs: '€ 29,99', prijsGetal: 29.99, perMaand: '€ 29,99', proef: true, proefDuur: '1 maand', pkg: null },
]

export default function BetaalmuurVoorbeeld() {
  return <AppBetaalmuur voornaam="Kersten" voorbeeldAanbod={AANBOD} onGelukt={() => null} />
}
