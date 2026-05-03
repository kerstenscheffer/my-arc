// src/modules/client-journey/components/calls/IntakeCallSummary.jsx
// Coaching briefing — combineert goal_flow + np + wp + cd
// Toont wat je weet en wat je gaat doen. WhatsApp knop onderaan.
import React, { useState } from 'react'
import { Send, Copy, Check, Target, Utensils, Dumbbell, AlertTriangle, Zap } from 'lucide-react'
import { C } from './IntakeCallHelpers'

const ROUTE_LABELS = {
  afvallen: 'Afvallen', spieren: 'Spieropbouw',
  recomp: 'Body Recomp', fitness: 'Fitter worden'
}

const COOKING_PREF = {
  graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk'
}
const GUIDANCE_LABELS = {
  strict: 'Alles uitgestippeld', flexible: 'Plan met targets', free: 'Alleen richtlijnen'
}
const SPLIT_LABELS = {
  push_pull_legs: 'PPL', upper_lower: 'Upper/Lower',
  full_body: 'Full Body', bro_split: 'Bro Split', no_preference: 'Geen voorkeur'
}
const LOC_LABELS = { gym: 'Sportschool', home: 'Thuis', both: 'Beide' }
const EXP_LABELS = { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }

export default function IntakeCallSummary({ cd, np, wp, stepNotes, stepActions, isMobile, sendWA, copyWA, copied }) {
  const gf = stepNotes?.goal_flow || {}
  const delivery = stepActions?.goal_delivery || ''
  const deliveryLines = delivery.split('\n').filter(Boolean)

  // Detecteer route uit goal_flow keys
  const route = gf.spieren_richting ? 'spieren'
    : gf.recomp_focus ? 'recomp'
    : gf.afvallen_richting ? 'afvallen'
    : gf.fitness_concreet ? 'fitness'
    : null

  // Voeding data uit np
  const wishes = np?.wishes || {}
  const ontbijt = wishes.ontbijt_categories?.slice(0, 2).join(', ')
  const lunch = wishes.lunch_categories?.slice(0, 2).join(', ')
  const diner = wishes.diner_categories?.slice(0, 2).join(', ')
  const nietLekker = wishes.niet_lekker?.join(', ')
  const allergens = np?.allergens?.selected_allergens?.join(', ')
  const guidance = np?.guidance_level?.guidance_level
  const budget = np?.life_context?.weekly_budget
  const numMeals = np?.meal_schedule?.num_meals
  const cookingPref = np?.life_context?.cooking_preference
  const supps = np?.supplement_preferences?.openness
  const cheat = np?.cheat_meals?.frequency

  // Training data uit wp
  const split = wp?.split_preference
  const loc = wp?.training_location
  const exp = wp?.experience_level || wp?.default_experience_level
  const timePerSession = wp?.time_per_session
  const cardioInterest = wp?.cardio_interest
  const cardioFreq = wp?.cardio_frequency
  const injuries = wp?.injuries
  const avoided = wp?.avoided_exercises

  // Flow antwoorden samengevat
  const doelAntwoord = gf.doel
  const voedingWensen = gf[`${route}_voeding_wensen`] || gf.fitness_voeding_wensen
  const trainingSitutatie = gf[`${route}_training`]
  const leefstijl = gf[`${route}_leefstijl`] || gf.fitness_leefstijl
  const blokkades = gf.blokkades
  const overtuiging = gf.zelf_overtuigd

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(255,215,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Zap size={14} color={C.gold} />
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            Coaching Briefing
          </span>
          {route && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, color: C.gold,
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '4px', padding: '0.1rem 0.4rem'
            }}>{ROUTE_LABELS[route] || route}</span>
          )}
        </div>
        <div style={{ fontSize: '0.6rem', color: C.text25 }}>
          {cd?.first_name} {cd?.last_name} · {cd?.current_weight ? `${cd.current_weight} kg` : ''} {cd?.target_weight ? `→ ${cd.target_weight} kg` : ''}
        </div>
      </div>

      {/* DOEL */}
      <Section icon={Target} title="DOEL" color={C.gold}>
        {doelAntwoord && <Row label="Wil" value={doelAntwoord.split(' · ').join(', ')} accent />}
        {cd?.motivation && <Row label="Motivatie" value={cd.motivation} />}
        {cd?.goal_urgency && <Row label="Urgentie" value={`${cd.goal_urgency}/10`} />}
        {cd?.biggest_obstacle && <Row label="Obstakel" value={cd.biggest_obstacle} />}
        {blokkades && <Row label="Eerder mislukt" value={blokkades.split(' · ').join(', ')} />}
        {overtuiging && <Row label="Overtuiging" value={overtuiging.split(' · ')[0]} color={C.green} />}
      </Section>

      {/* VOEDING */}
      <Section icon={Utensils} title="VOEDINGSPLAN" color={C.green}>
        {voedingWensen && <Row label="Wensen plan" value={voedingWensen.split(' · ').join(', ')} accent />}
        {(ontbijt || lunch || diner) && (
          <div style={{ padding: '0.4rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}` }}>
            <div style={{ fontSize: '0.38rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>EETPATROON NU</div>
            {ontbijt && <div style={{ fontSize: '0.65rem', color: C.text50, marginBottom: '0.1rem' }}>🌅 {ontbijt}</div>}
            {lunch && <div style={{ fontSize: '0.65rem', color: C.text50, marginBottom: '0.1rem' }}>☀️ {lunch}</div>}
            {diner && <div style={{ fontSize: '0.65rem', color: C.text50 }}>🌙 {diner}</div>}
          </div>
        )}
        {guidance && <Row label="Stijl" value={GUIDANCE_LABELS[guidance] || guidance} />}
        {numMeals && <Row label="Maaltijden" value={`${numMeals}x per dag`} />}
        {cookingPref && <Row label="Koken" value={COOKING_PREF[cookingPref] || cookingPref} />}
        {cd?.cooking_time && <Row label="Kooktijd" value={`${cd.cooking_time} min`} />}
        {budget && <Row label="Budget" value={`€${budget}/week`} />}
        {nietLekker && <Row label="Niet lekker" value={nietLekker} color="rgba(239,68,68,0.7)" />}
        {allergens && <Row label="Allergie" value={allergens} color="rgba(239,68,68,0.7)" />}
        {supps && <Row label="Supplementen" value={{ ja_graag: 'Ja, graag', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[supps] || supps} />}
        {cheat && <Row label="Cheat" value={{ nooit: 'Geen', '1x_week': '1x/week', weekend: 'Weekend', als_nodig: 'Als nodig' }[cheat] || cheat} />}
      </Section>

      {/* TRAINING */}
      <Section icon={Dumbbell} title="TRAININGSPLAN" color={C.blue}>
        {trainingSitutatie && <Row label="Situatie" value={trainingSitutatie.split(' · ').join(', ')} accent />}
        {exp && <Row label="Niveau" value={EXP_LABELS[exp] || exp} />}
        {split && <Row label="Split" value={SPLIT_LABELS[split] || split} />}
        {loc && <Row label="Locatie" value={LOC_LABELS[loc] || loc} />}
        {timePerSession && <Row label="Tijd/sessie" value={`${timePerSession} min`} />}
        {cd?.workout_days_per_week && <Row label="Sessies" value={`${cd.workout_days_per_week}x/week`} />}
        {cardioInterest && <Row label="Cardio" value={{ yes: 'Wil cardio', maybe: 'Misschien', no: 'Geen cardio' }[cardioInterest] || cardioInterest} />}
        {cardioFreq && <Row label="Cardio freq" value={`${cardioFreq}x/week`} />}
        {injuries && injuries !== 'Nee' && injuries !== 'no' && <Row label="Blessure" value={injuries} color="rgba(239,68,68,0.7)" />}
        {avoided && avoided.length > 0 && <Row label="Vermijden" value={Array.isArray(avoided) ? avoided.join(', ') : avoided} color="rgba(239,68,68,0.7)" />}
        {leefstijl && <Row label="Leefstijl" value={leefstijl.split(' · ').join(', ')} />}
      </Section>

      {/* WAT JIJ GAAT DOEN */}
      {deliveryLines.length > 0 && (
        <Section icon={Check} title="WAT JIJ GAAT DOEN" color={C.green}>
          {deliveryLines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              borderBottom: `1px solid ${C.borderFaint}`
            }}>
              <Check size={10} color={C.green} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.text }}>{line}</span>
            </div>
          ))}
        </Section>
      )}

      {/* WhatsApp */}
      <div style={{ margin: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={sendWA} style={{
          flex: 1, padding: '0.75rem',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '8px', color: C.green,
          fontSize: '0.72rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          minHeight: '46px'
        }}>
          <Send size={13} /> WhatsApp sturen
        </button>
        <button onClick={copyWA} style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: copied ? C.green : C.text25,
          fontSize: '0.72rem', fontWeight: 700,
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          minHeight: '46px'
        }}>
          {copied ? <><Check size={12} /> Gekopieerd</> : <><Copy size={12} /> Kopieer</>}
        </button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 0.75rem 0.25rem',
        borderBottom: `1px solid ${C.borderFaint}`
      }}>
        <Icon size={11} color={color || C.gold} />
        <span style={{
          fontSize: '0.4rem', fontWeight: 700, color: color || C.gold,
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, accent, color }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
      padding: '0.3rem 0.75rem',
      borderBottom: `1px solid ${C.borderFaint}`
    }}>
      <span style={{
        fontSize: '0.38rem', fontWeight: 700, color: C.text25,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        flexShrink: 0, marginTop: '0.15rem', minWidth: '55px'
      }}>{label}</span>
      <span style={{
        fontSize: '0.68rem', fontWeight: accent ? 700 : 600,
        color: color || (accent ? C.text : C.text50),
        lineHeight: 1.4
      }}>{value}</span>
    </div>
  )
}
