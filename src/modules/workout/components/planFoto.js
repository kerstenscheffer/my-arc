// src/modules/workout/components/planFoto.js
// Foto per plan: donkere sportfoto's, thuisplannen een thuis-trainingsfoto en
// gymplannen een vaste keuze uit een kleine donkere pool op basis van de naam.
const FOTO = (id) => `https://images.unsplash.com/${id}?w=800&h=400&fit=crop&q=70`
const THUIS_FOTO = FOTO('photo-1649789248266-ef1c7f744f6f')
const GYM_FOTOS = [FOTO('photo-1623947061710-70c895a9f5bb'), FOTO('photo-1600347054806-ada26c5186b4'), FOTO('photo-1601745398552-debacfca634c')]
const hash = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 } return Math.abs(h) }
export const planFoto = (p) => p?.image_url || (/thuis|home/i.test(p?.name || '') ? THUIS_FOTO : GYM_FOTOS[hash(String(p?.name || 'plan').toLowerCase()) % GYM_FOTOS.length])
