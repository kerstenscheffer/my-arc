// src/modules/workout/cardioSoorten.js
//
// Eén lijst met cardio-soorten voor de hele app: het plannen door de klant
// (Training toevoegen), het plannen door de coach (Workout Builder → Cardio)
// en het loggen. Stond eerder op twee plekken in een andere volgorde, en
// Hyrox en CrossFit ontbraken (8 okt 2026).
//
// Hyrox en CrossFit zijn hier 'cardio-achtig': een training die je als blok
// in de week zet en logt op duur en intensiteit, zonder losse oefeningen.

import { Footprints, Bike, Waves, Timer, Wind, Activity, TrendingUp, Zap, Flame, Dumbbell, Trophy } from 'lucide-react'

export const CARDIO_SOORTEN = [
  { id: 'Wandelen',     icoon: Footprints },
  { id: 'Hardlopen',    icoon: Timer },
  { id: 'Fietsen',      icoon: Bike },
  { id: 'Zwemmen',      icoon: Waves },
  { id: 'Roeien',       icoon: Wind },
  { id: 'Crosstrainer', icoon: Activity },
  { id: 'Stairmaster',  icoon: TrendingUp },
  { id: 'HIIT',         icoon: Zap },
  { id: 'Hyrox',        icoon: Flame },
  { id: 'CrossFit',     icoon: Dumbbell },
  { id: 'Padel',        icoon: Trophy },
]

export const CARDIO_NAMEN = CARDIO_SOORTEN.map(s => s.id)

export const DAGEN_WEEK = [
  { id: 'Monday', kort: 'Ma' }, { id: 'Tuesday', kort: 'Di' }, { id: 'Wednesday', kort: 'Wo' }, { id: 'Thursday', kort: 'Do' },
  { id: 'Friday', kort: 'Vr' }, { id: 'Saturday', kort: 'Za' }, { id: 'Sunday', kort: 'Zo' },
]
