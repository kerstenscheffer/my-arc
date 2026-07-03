// src/components/FadeOnScroll.jsx
//
// Wrapper-component die z'n inhoud subtiel uitfaded wanneer'ie ver buiten
// de viewport is en weer infade'd zodra'ie in beeld scrolt. Bedoeld voor
// secties die ver onder de fold staan — ze geven dan een visuele hint
// "scroll naar beneden voor meer" zonder ze helemaal te verbergen.
//
// Werkt via IntersectionObserver met meerdere thresholds. opacity vloeit
// van `minOpacity` (volledig buiten beeld) naar 1 (volledig in beeld).

import { useEffect, useRef, useState } from 'react'

export default function FadeOnScroll({
  children,
  minOpacity = 0.35,
  // Hoeveel pixels boven/onder de viewport meegerekend worden. Negatieve
  // waarde = element is "in beeld" pas wanneer'ie deels binnen die marge zit.
  rootMargin = '0px 0px -10% 0px',
  // Of we ook beweging (translateY) willen toevoegen voor extra parallax-feel.
  withSlide = true,
  style: extraStyle,
}) {
  const ref = useRef(null)
  const [ratio, setRatio] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const thresholds = Array.from({ length: 11 }, (_, i) => i / 10)
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setRatio(entry.intersectionRatio)
        }
      },
      { root: null, rootMargin, threshold: thresholds }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  // Lineaire blend: ratio 0 → minOpacity, ratio 1 → 1.
  const opacity = minOpacity + (1 - minOpacity) * Math.min(1, Math.max(0, ratio))
  const translateY = withSlide ? Math.round((1 - Math.min(1, Math.max(0, ratio))) * 8) : 0

  return (
    <div
      ref={ref}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        willChange: 'opacity, transform',
        ...(extraStyle || {}),
      }}
    >
      {children}
    </div>
  )
}
