// src/modules/client-agenda/werkbalkStijl.js
//
// Eén maatvoering voor de werkbalk boven de agenda.
//
// Die balk groeide aan met losse knoppen die elk hun eigen hoogte, rand en
// tekstgrootte meebrachten. Naast elkaar op één regel viel dat op als een
// rommeltje. Alles hieronder deelt dezelfde hoogte, dezelfde rand en
// dezelfde letter, zodat de rij als één ding leest.
//
// De klantkiezer staat in CoachAgendaTab en de rest in ClientAgendaView;
// daarom staan deze stijlen apart en niet in één van die twee bestanden.

export const BALK_HOOGTE = 30
export const BALK_HOOGTE_MOBIEL = 28

export const balkHoogte = (isMobile) => (isMobile ? BALK_HOOGTE_MOBIEL : BALK_HOOGTE)

const RAND = 'rgba(255,255,255,0.10)'
const VULLING = 'rgba(255,255,255,0.04)'

/**
 * Basisvorm voor elk element in de balk: knop, keuzelijst of label.
 * Hoekjes bewust vierkant — dat is de vorm die de agenda eronder ook heeft.
 */
export const balkVak = (isMobile, extra = {}) => ({
  height: balkHoogte(isMobile),
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '0 0.55rem',
  background: VULLING,
  borderTop: `1px solid ${RAND}`,
  borderBottom: `1px solid ${RAND}`,
  borderLeft: `1px solid ${RAND}`,
  borderRight: `1px solid ${RAND}`,
  borderRadius: 0,
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'inherit',
  fontSize: isMobile ? '0.72rem' : '0.74rem',
  fontWeight: 800,
  whiteSpace: 'nowrap',
  outline: 'none',
  boxSizing: 'border-box',
  ...extra,
})

/** Actief: wit vlak met zwarte letter. Dat is de aan-staat door de hele app. */
export const balkVakActief = (isMobile, extra = {}) => balkVak(isMobile, {
  background: '#fff',
  borderTopColor: '#fff', borderBottomColor: '#fff',
  borderLeftColor: '#fff', borderRightColor: '#fff',
  color: '#0a0a0a',
  ...extra,
})

/** Vierkant knopje van dezelfde hoogte — voor de pijltjes van de week. */
export const balkIconKnop = (isMobile) => balkVak(isMobile, {
  width: balkHoogte(isMobile),
  padding: 0,
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.55)',
})

/**
 * Dun streepje tussen twee groepen. Scheidt "welke klant / welke week" van
 * "wat doe ik" zonder er een kader omheen te zetten.
 */
export const balkScheiding = (isMobile) => ({
  width: 1,
  height: balkHoogte(isMobile) - 10,
  background: 'rgba(255,255,255,0.12)',
  flexShrink: 0,
  margin: '0 2px',
})
