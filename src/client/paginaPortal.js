// src/client/paginaPortal.js
//
// createPortal dat weet op welke pagina hij hoort. Klantpagina's blijven
// verborgen staan als je wisselt (ClientDashboard), maar een portal hangt
// direct aan document.body en valt dus buiten de verborgen pagina: de
// log-knop van Voeding of een open blad zou dan over Home blijven zweven.
// Deze versie verbergt de portal-inhoud zolang zijn pagina niet in beeld is.
// Buiten het klantdashboard (geen PaginaZichtbaar) verandert er niets.
import { createContext, createElement, useContext } from 'react'
import { createPortal as reactCreatePortal } from 'react-dom'

export const PaginaZichtbaar = createContext(null)

function AlleenOpEigenPagina({ children }) {
  const zichtbaar = useContext(PaginaZichtbaar)
  if (zichtbaar === null) return children
  // display: contents laat de opmaak ongemoeid (ook position: fixed);
  // none verbergt alles zonder de staat weg te gooien.
  return createElement('div', { 'data-pagina-portal': '', style: { display: zichtbaar ? 'contents' : 'none' } }, children)
}

export function createPortal(children, container, key) {
  return reactCreatePortal(createElement(AlleenOpEigenPagina, null, children), container, key)
}
