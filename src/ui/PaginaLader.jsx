// src/ui/PaginaLader.jsx
//
// Laad-icoon per pagina in plaats van een draaiend rondje: een vork en mes
// op Voeding, een halter op Workout, enzovoort. Het icoon ademt (schaal +
// helderheid) zodat je ziet dat er iets gebeurt.

import { House, UtensilsCrossed, Dumbbell, ShoppingCart, TrendingUp, Phone, User, CalendarDays, Loader } from 'lucide-react'

const ICONEN = {
  home: House,
  meal: UtensilsCrossed,
  workout: Dumbbell,
  boodschappen: ShoppingCart,
  tracking: TrendingUp,
  calls: Phone,
  profile: User,
  agenda: CalendarDays,
}

export default function PaginaLader({ pagina, hoogte = '50vh' }) {
  const Icoon = ICONEN[pagina] || Loader
  return (
    <div role="status" aria-label="Laden" style={{ minHeight: hoogte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icoon size={34} strokeWidth={2.2} color="#fff" style={{ animation: 'paginaLaderAdem 1.1s ease-in-out infinite' }} />
      <style>{'@keyframes paginaLaderAdem { 0%, 100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.06); } }'}</style>
    </div>
  )
}
