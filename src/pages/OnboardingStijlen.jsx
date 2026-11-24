// src/pages/OnboardingStijlen.jsx
//
// /test (24 nov 2026): de app-onboarding in verschillende stijlen naast elkaar,
// zodat Kersten kan kiezen. Altijd in voorbeeldmodus: er wordt niets opgeslagen.
// De oude mascotte-concepten (21 nov) staan op /test-mascottes.

import { useState } from 'react'
import AppOnboarding from '../modules/app-onboarding/AppOnboarding'
import { THEMAS } from '../modules/app-onboarding/onboardingThemas'

export default function OnboardingStijlen() {
  const [thema, setThema] = useState(() => {
    try { return localStorage.getItem('onboarding_test_stijl') || 'arc' } catch { return 'arc' }
  })
  const kies = (t) => { setThema(t); try { localStorage.setItem('onboarding_test_stijl', t) } catch { /* niets */ } }

  return (
    <>
      <AppOnboarding key={thema} thema={thema} voorbeeld />
      <select
        value={thema}
        onChange={e => kies(e.target.value)}
        style={{
          position: 'fixed', left: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', zIndex: 50,
          minHeight: 44, padding: '0 0.9rem', borderRadius: 12, border: '2px solid #fff',
          background: '#000', color: '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit',
        }}
      >
        {Object.entries(THEMAS).map(([id, t]) => <option key={id} value={id}>Stijl: {t.naam}</option>)}
      </select>
    </>
  )
}
