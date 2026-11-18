// src/modules/client-checkin/DoelIcoon.jsx
//
// Elk soort doel zijn eigen icoon, in de kleur van dat doel (doelen.js). Eén
// plek, zodat de klant in de check-in en de coach in Coach Inzicht hetzelfde
// beeld zien. Ook de smiley bij "gelukt?" en bij "tevreden?".
import { Dumbbell, Scale, Utensils, Footprints, Moon, Target, ChefHat, Smile, Meh, Frown } from 'lucide-react'
import { typeVan, kleurVoorBehaald } from './doelen'

const DOEL_ICOON = { trainen: Dumbbell, wegen: Scale, voeding: Utensils, stappen: Footprints, slaap: Moon, mealprep: ChefHat, eigen: Target }

export default function DoelIcoon({ type, size = 18 }) {
  const Icoon = DOEL_ICOON[type] || Target
  return <Icoon size={size} strokeWidth={2.6} color={typeVan(type)?.kleur || '#fff'} style={{ flexShrink: 0 }} />
}

// 'ja' | 'deels' | 'nee' → lachend, neutraal, sip, in groen, oranje, rood.
export function BehaaldSmiley({ behaald, size = 20, kleur = null }) {
  const Icoon = behaald === 'ja' ? Smile : behaald === 'nee' ? Frown : Meh
  return <Icoon size={size} strokeWidth={2.6} color={kleur || (behaald ? kleurVoorBehaald(behaald) : 'rgba(255,255,255,0.5)')} style={{ flexShrink: 0 }} />
}
