// Eén foto-keuze voor de trainingsdag, gedeeld door de kop bovenaan de
// workout-pagina en de kaart eronder. Stond eerder alleen in
// TodaysWorkoutCard; nu twee plekken dezelfde dag tonen moet het ook echt
// dezelfde foto zijn.
const FOTOS = {
  borst: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=900&h=900&fit=crop&q=80&crop=center',
  rug: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=900&h=900&fit=crop&q=80&crop=center',
  benen: 'https://images.unsplash.com/photo-1630415187908-39d6d209b15c?w=900&h=900&fit=crop&q=80&crop=center',
  schouders: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=900&h=900&fit=crop&q=80&crop=center',
  armen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&h=900&fit=crop&q=80&crop=center',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=900&h=900&fit=crop&q=80&crop=center',
  fullbody: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=900&fit=crop&q=80&crop=center',
  standaard: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&h=900&fit=crop&q=80&crop=center',
}

// Kop van de cardio-sectie. Zelfde bron als de trainingsfoto's zodat de twee
// koppen op de pagina bij elkaar horen.
// Foto per cardio-soort, op naam gekozen (Unsplash). Zonder naam de
// algemene cardio-foto, zoals de kop van de cardio-sectie die gebruikt.
const U = (id) => `https://images.unsplash.com/${id}?w=900&h=500&fit=crop&q=80&crop=entropy`
const CARDIO_FOTOS = {
  hardlopen:    U('photo-1486739985386-d4fae04ca6f7'),
  fietsen:      U('photo-1534787238916-9ba6764efd4f'),
  zwemmen:      U('photo-1530549387789-4c1017266635'),
  wandelen:     U('photo-1663524963924-4d84fd7204b5'),
  roeien:       U('photo-1467818488384-3a21f2b79959'),
  crosstrainer: U('photo-1649068618811-9f3547ef98fc'),
  stairmaster:  U('photo-1651804279587-3c3d11496439'),
  hiit:         U('photo-1599058917212-d750089bc07e'),
  padel:        U('photo-1657704358775-ed705c7388d2'),
  hyrox:        U('photo-1517963879433-6ad2b056d712'),
  crossfit:     U('photo-1517836357463-d25dfeac3438'),
}
export function cardioFoto(soort) {
  const n = String(soort || '').toLowerCase()
  if (!n) return FOTOS.cardio
  if (/hardl|run|jog/.test(n)) return CARDIO_FOTOS.hardlopen
  if (/fiets|cycl|bike|spinning/.test(n)) return CARDIO_FOTOS.fietsen
  if (/zwem|swim/.test(n)) return CARDIO_FOTOS.zwemmen
  if (/wandel|walk|hike|lopen/.test(n)) return CARDIO_FOTOS.wandelen
  if (/roei|row/.test(n)) return CARDIO_FOTOS.roeien
  if (/cross|ellip/.test(n)) return CARDIO_FOTOS.crosstrainer
  if (/stair|trap/.test(n)) return CARDIO_FOTOS.stairmaster
  if (/hiit|interval|circuit/.test(n)) return CARDIO_FOTOS.hiit
  if (/padel|tennis|squash/.test(n)) return CARDIO_FOTOS.padel
  if (/hyrox/.test(n)) return CARDIO_FOTOS.hyrox
  if (/crossfit|wod/.test(n)) return CARDIO_FOTOS.crossfit
  return FOTOS.cardio
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
