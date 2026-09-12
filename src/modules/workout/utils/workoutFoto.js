// Eén foto-keuze voor de trainingsdag, gedeeld door de kop bovenaan de
// workout-pagina en de kaart eronder. Stond eerder alleen in
// TodaysWorkoutCard; nu twee plekken dezelfde dag tonen moet het ook echt
// dezelfde foto zijn.
const FOTOS = {
  borst: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=900&h=900&fit=crop&q=80&crop=center',
  rug: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=900&h=900&fit=crop&q=80&crop=center',
  benen: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=900&h=900&fit=crop&q=80&crop=center',
  schouders: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=900&h=900&fit=crop&q=80&crop=center',
  armen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&h=900&fit=crop&q=80&crop=center',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=900&h=900&fit=crop&q=80&crop=center',
  fullbody: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=900&fit=crop&q=80&crop=center',
  standaard: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&h=900&fit=crop&q=80&crop=center',
}

export function workoutFoto(workout) {
  if (!workout) return null
  const focus = (workout.focus || workout.name || '').toLowerCase()
  const heeft = (...woorden) => woorden.some(w => focus.includes(w))
  if (heeft('chest', 'push', 'borst')) return FOTOS.borst
  if (heeft('back', 'pull', 'rug')) return FOTOS.rug
  if (heeft('leg', 'squat', 'been')) return FOTOS.benen
  if (heeft('shoulder', 'delt', 'schouder')) return FOTOS.schouders
  if (heeft('arm', 'bicep', 'tricep', 'curl')) return FOTOS.armen
  if (heeft('cardio', 'run', 'fiets')) return FOTOS.cardio
  if (heeft('full body', 'total')) return FOTOS.fullbody
  return FOTOS.standaard
}

export default workoutFoto
