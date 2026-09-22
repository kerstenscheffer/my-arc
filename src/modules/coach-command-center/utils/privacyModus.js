// src/modules/coach-command-center/utils/privacyModus.js
//
// Scherm delen zonder je klanten te verraden.
//
// Bij een screenshare of een opname wil je de cijfers laten zien — gewicht,
// trend, trouw — maar niet wie het is. Deze schakelaar blurt alles wat een
// persoon aanwijst: namen, initialen en foto's. De getallen blijven scherp.
//
// Werkt met één klasse op <body> en één globale stijl, geen context en geen
// props door de hele boom. Dat is hier belangrijk: het insight-scherm en de
// foto-viewer renderen in een portal buiten de kaart, en die moeten mee.
// Markeer een element met className={PRIVE} en het verdwijnt zodra de knop
// aan staat.

export const PRIVE = 'prive-blur'            // naam, initialen, tekst
export const PRIVE_FOTO = 'prive-blur-foto'  // foto's — die hebben meer blur nodig
const KLASSE = 'prive-modus-aan'
const SLEUTEL = 'coach_prive_modus'
const STIJL_ID = 'prive-modus-stijl'

// Eén keer een stylesheet in de head. Moet globaal, want portals hangen naast
// de component-boom.
const zorgVoorStijl = () => {
  if (typeof document === 'undefined' || document.getElementById(STIJL_ID)) return
  const el = document.createElement('style')
  el.id = STIJL_ID
  // Tekst heeft minder blur nodig dan een foto: bij 6px is een naam al niet
  // meer te lezen, terwijl een gezicht op een foto dat bij 6px nog wel is.
  // select-none zodat je een naam ook niet per ongeluk kopieert of markeert
  // terwijl je deelt.
  el.textContent = `
    body.${KLASSE} .${PRIVE} {
      filter: blur(6px);
      user-select: none; -webkit-user-select: none;
    }
    body.${KLASSE} .${PRIVE_FOTO} {
      filter: blur(16px);
      user-select: none; -webkit-user-select: none;
    }
  `
  document.head.appendChild(el)
}

export const privacyAan = () => {
  if (typeof document === 'undefined') return false
  return document.body.classList.contains(KLASSE)
}

export const zetPrivacy = (aan) => {
  zorgVoorStijl()
  document.body.classList.toggle(KLASSE, !!aan)
  try { localStorage.setItem(SLEUTEL, aan ? '1' : '0') } catch { /* privémodus van de browser */ }
}

// De stand van de vorige keer terugzetten. Wie zijn scherm deelt doet dat
// vaker achter elkaar; dan is het vervelend als de knop elke keer uit staat.
export const herstelPrivacy = () => {
  let aan = false
  try { aan = localStorage.getItem(SLEUTEL) === '1' } catch { /* geen opslag */ }
  zetPrivacy(aan)
  return aan
}
