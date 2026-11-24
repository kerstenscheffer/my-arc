// src/client/pages/MijnPlanPagina.jsx
//
// Pagina "Mijn plan" (24 nov 2026), alleen voor app-gebruikers
// (clients.app_abonnee). Staat in de balk onderin op de plek van Video, omdat
// een app-gebruiker zonder coach hier zelf zijn doel, schema en abonnement
// regelt. De inhoud is AppMijnPlan.

import AppMijnPlan from '../components/AppMijnPlan'

export default function MijnPlanPagina({ client, user, onClientUpdate, isMobile = true }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 1.25rem) 1rem 2rem' : '1.5rem 1rem 2rem', color: '#fff' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: '1.25rem' }}>
        <img src="/mascottes/kersten-duim.webp" alt="" style={{ height: 96, width: 'auto', flexShrink: 0 }} />
        <div style={{ paddingBottom: 8 }}>
          <div style={{ fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: '1.7rem', lineHeight: 1.05 }}>Mijn plan</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 6 }}>Pas hier zelf je doel, je schema en je abonnement aan.</div>
        </div>
      </div>
      <AppMijnPlan client={client} user={user} onClientUpdate={onClientUpdate} />
    </div>
  )
}
