// src/modules/coach-command-center/components/formulierStijl.js
//
// De veldstijl die de check-in en de onboarding delen. Los van de
// bouwstenen omdat dit een object is en geen component: een .jsx die naast
// componenten ook een constante exporteert breekt hot reload.

export const veld = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.6rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff', fontSize: '0.8rem', fontWeight: 600,
  fontFamily: 'inherit', outline: 'none', lineHeight: 1.45,
}
