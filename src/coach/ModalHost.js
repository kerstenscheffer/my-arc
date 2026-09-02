// src/coach/ModalHost.jsx
//
// Waar mag een modal landen?
//
// Veel modals renderen met createPortal naar document.body. Dat is normaal
// gesproken juist goed: zo ontsnappen ze aan overflow:hidden en aan de
// stacking-context van hun ouder. Maar in split screen betekent het dat een
// modal uit de linkerhelft het hele scherm afdekt, inclusief de rechterhelft
// waar je juist naast wilde werken.
//
// Deze context geeft de dichtstbijzijnde "gastheer" door. In split screen zet
// CoachHub daar de helft neer waar de tab in staat; overal anders is het
// gewoon document.body en verandert er niets.
//
// Gebruik in een component dat portalt:
//   const host = useModalHost()
//   return createPortal(<Modal … />, host)
//
// Voorwaarde aan de kant van de gastheer: die moet een positioneringskader
// zijn (transform of position) zodat een position:fixed modal tegen de helft
// rekent en niet alsnog tegen het scherm.

import { createContext, useContext } from 'react'

const ModalHostContext = createContext(null)

export const ModalHostProvider = ModalHostContext.Provider

export function useModalHost() {
  const host = useContext(ModalHostContext)
  if (host) return host
  return typeof document !== 'undefined' ? document.body : null
}

export default ModalHostContext
