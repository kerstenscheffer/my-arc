// src/modules/workout/components/week-schedule/workoutImage.js
// Foto per workout: eigen image_url, anders een vaste keuze uit de pool op
// basis van de naam, zodat dezelfde workout altijd dezelfde foto krijgt.
import { workoutFoto } from '../../utils/workoutFoto'

const STANDAARD = workoutFoto({ name: 'workout' })
const WORKOUT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=70',
  'https://images.unsplash.com/photo-1517963628607-235ccdd5476c?w=400&h=300&fit=crop&q=70',
]
const hashString = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
  return Math.abs(h)
}
export const getWorkoutImage = (workoutData) => {
  if (workoutData?.image_url) return workoutData.image_url
  // Herkenbare spiergroep (push, pull, legs, …) → dezelfde foto als de kop
  // van de workout-pagina. Alleen een onbekende naam valt op de pool terug.
  const perGroep = workoutFoto(workoutData)
  if (perGroep && perGroep !== STANDAARD) return perGroep
  const key = (workoutData?.name || workoutData?.focus || 'workout').toLowerCase().trim()
  if (!key) return WORKOUT_IMAGE_POOL[0]
  return WORKOUT_IMAGE_POOL[hashString(key) % WORKOUT_IMAGE_POOL.length]
}
