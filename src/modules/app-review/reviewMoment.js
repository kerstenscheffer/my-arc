// src/modules/app-review/reviewMoment.js
// Meld een succesmoment (maaltijd gelogd, training klaar). ReviewPrompt luistert
// en beslist of dit een goed moment is om om een winkelbeoordeling te vragen.
export const SUCCES_EVENT = 'myarc:succes'

export const meldSucces = (bron = '') => {
  try { window.dispatchEvent(new CustomEvent(SUCCES_EVENT, { detail: { bron } })) } catch { /* oude webview */ }
}
