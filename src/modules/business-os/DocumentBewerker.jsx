// src/modules/business-os/DocumentBewerker.jsx
//
// Het bewerkvlak van een Business OS-document: typen in de opgemaakte weergave
// (24 nov 2026). Dunne schil om documentOpmaak.js; daar staat alle logica en
// de uitleg waarom opslaan dezelfde markdown blijft.
//
// Niet door React bestuurd: de tekst gaat er bij het openen in (tekst) en komt
// er bij elke wijziging uit (onWijzig). stuur.current krijgt de bewerker zelf,
// voor de opmaakbalk (pas), '+ Onderdeel' en de leesplek na sluiten.
// Lukt openen → opslaan niet teken voor teken, dan roept hij onMislukt aan en
// toont GinoDocument de ruwe vorm.

import { useLayoutEffect, useRef } from 'react'
import { BEWERK_CSS, maakBewerker } from './documentOpmaak'

export default function DocumentBewerker({ tekst, start, stuur, onWijzig, onBlur, onMislukt, isMobile }) {
  const rol = useRef(null)
  const vlak = useRef(null)
  const cb = useRef({})
  cb.current = { onWijzig, onBlur, onMislukt }

  // Eén keer per keer openen; de ouder geeft een nieuwe key bij een ander tabblad.
  useLayoutEffect(() => {
    const b = maakBewerker(vlak.current, {
      md: tekst,
      scroller: rol.current,
      onWijzig: (md) => cb.current.onWijzig?.(md),
      onBlur: () => cb.current.onBlur?.(),
    })
    if (!b.ok) {
      b.sluit()
      cb.current.onMislukt?.()
      return undefined
    }
    stuur.current = b
    b.begin(start || { focus: false })
    return () => {
      if (stuur.current === b) stuur.current = null
      b.sluit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={rol}
      // Tik naast of onder de tekst: cursor aan het eind.
      onMouseDown={(e) => { if (e.target === rol.current) { e.preventDefault(); stuur.current?.focusEind() } }}
      style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', position: 'relative', cursor: 'text', padding: isMobile ? '12px 14px 40vh' : '20px 28px 40vh' }}>
      <style>{BEWERK_CSS}</style>
      <div ref={vlak} className="bd-vlak" contentEditable suppressContentEditableWarning spellCheck={false}
        role="textbox" aria-multiline="true" aria-label="Document bewerken" />
    </div>
  )
}
