// Maten en knopstijl van de kolomkoppen in Coach Inzicht (zie KolomKop.jsx).

export const KOP_HOOGTE = 40

// Kleine knop voor in de balk, zodat alle kolommen dezelfde knoppen hebben.
// Kaal: geen vlak of rand, alleen icoon en tekst (Kersten, 24 okt 2026).
export const kopKnopStijl = {
  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
  height: 28, padding: '0 0.4rem', borderRadius: 7,
  background: 'transparent', border: 'none',
  color: '#fff', fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit',
  cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Grijze info-tekst in de balk (plannaam, aantal), mag afgekapt worden.
export const kopInfoStijl = {
  minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
}
