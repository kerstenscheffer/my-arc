// src/contexts/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

// Translations object
const translations = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      workout: 'My Workout Plan',
      mealplan: 'My Meal Plan',
      progress: 'Progress Tracker',
      profile: 'Profile',
      overview: 'Overview',
      clients: 'Clients',
      plans: 'Plans',
      aiGenerator: 'AI Generator',
      schemaLibrary: 'Schema Library',
      analytics: 'Analytics',
      goals: 'Goals'
    },
    
    // Common
    common: {
      welcome: 'Welcome back',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      remove: 'Remove',
      refresh: 'Refresh',
      loading: 'Loading',
      connected: 'Connected',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      view: 'View',
      assign: 'Assign',
      change: 'Change'
    },
    
    // Client Dashboard
    client: {
      welcomeMessage: 'Ready to crush your goals today?',
      personalVideo: 'Your Personal Coaching Video',
      videoComingSoon: 'Video will be added soon',
      viewPlan: 'View your personalized nutrition plan',
      todayTraining: "Today's training & exercises",
      logProgress: 'Log & track your progress',
      settings: 'Settings & personal info',
      progressOverview: 'Your Progress Overview',
      workoutsDone: 'Workouts Done',
      planAdherence: 'Plan Adherence',
      strengthGain: 'Strength Gain',
      currentWeek: 'Current Week'
    },
    
    // Coach Dashboard
    coach: {
      dashboardTitle: 'Personal Trainer Dashboard',
      dashboardOverview: 'Dashboard Overview',
      newClient: 'New Client',
      addClient: 'Add Client',
      clientManagement: 'Client Management',
      manageClients: 'Manage your personal training clients',
      activeClients: 'Active Clients',
      workoutPlans: 'Workout Plans',
      aiGenerated: 'AI Generated',
      thisMonth: 'This Month',
      recentActivity: 'Recent Activity',
      latestUpdates: 'Latest updates from your clients',
      totalClients: 'Total Clients',
      withPlans: 'With Plans',
      training: 'Training'
    },
    
    // Workout
    workout: {
      noWorkoutPlan: 'No Workout Plan Yet',
      trainerWillAssign: 'Your trainer will assign a workout plan soon!',
      workoutExplanation: 'Workout Explanation',
      personalTrainingVideo: 'Personal Training Video',
      yourWeek: 'Your Week',
      restDay: 'Rest Day',
      exercises: 'exercises',
      sets: 'Sets',
      reps: 'Reps',
      rest: 'Rest',
      rpe: 'RPE',
      weekOverview: 'Week Overview',
      workouts: 'Workouts',
      restDays: 'Rest Days',
      minPerWeek: 'Min/Week',
      planWeek: 'Plan Week',
      dragToSchedule: 'Drag to Schedule',
      tapToSelect: 'Tap to Select',
      tapDay: 'Tap a day below',
  dropHere: "Drop here",
  planWeek: "Plan Week",
  save: "Save",
  tapToSelect: "Tap to Select",
  dragToSchedule: "Drag to Schedule",
  sets: "Sets",
  reps: "Reps",
  rest: "Rest",
  rpe: "RPE",
  exerciseLibrary: "Exercise Library",
  startWorkout: "Start Workout",
  alternativeExercises: "Alternative Exercises",
  weekOverview: "Week Overview",
  workouts: "Workouts",
  restDays: "Rest Days",
  minPerWeek: "Min/Week",
      scheduled: 'Scheduled'
    },
    
    // Forms
    forms: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'Phone Number',
      password: 'Password',
      temporaryPassword: 'Temporary Password',
      primaryGoal: 'Primary Goal',
      experienceLevel: 'Experience Level',
      selectGoal: 'Select goal',
      selectExperience: 'Select experience',
      beginner: 'Beginner (0-18 months)',
      intermediate: 'Intermediate (1.5-3 years)',
      advanced: 'Advanced (3+ years)',
      weightLoss: 'Weight Loss',
      muscleGain: 'Muscle Gain',
      strength: 'Strength',
      generalFitness: 'General Fitness',
      athleticPerformance: 'Athletic Performance'
    },
    
    // Errors
    errors: {
      noClientAccount: 'No Client Account Found',
      notRegistered: 'is not registered as a client',
      areYouCoach: 'Are you a coach? You might be trying to access the wrong dashboard.',
      goToCoach: 'Go to Coach Dashboard',
      tryAgain: 'Logout & Try Again',
      noUserFound: 'No user found',
      checkAuth: 'Please check your authentication',
      failedToLoad: 'Failed to load',
      somethingWrong: 'Something went wrong'
    }
  },
  
  nl: {
    // Navigation
    nav: {
      home: 'Home',
      workout: 'Mijn Workout Plan',
      mealplan: 'Mijn Voedingsplan',
      progress: 'Voortgang',
      profile: 'Profiel',
      overview: 'Overzicht',
      clients: 'Klanten',
      plans: 'Plannen',
      aiGenerator: 'AI Generator',
      schemaLibrary: 'Schema Bibliotheek',
      analytics: 'Analyses',
      goals: 'Doelen'
    },
    
    // Common
    common: {
      welcome: 'Welkom terug',
      logout: 'Uitloggen',
      save: 'Opslaan',
      cancel: 'Annuleren',
      edit: 'Bewerken',
      delete: 'Verwijderen',
      add: 'Toevoegen',
      remove: 'Verwijderen',
      refresh: 'Vernieuwen',
      loading: 'Laden',
      connected: 'Verbonden',
      submit: 'Verzenden',
      back: 'Terug',
      next: 'Volgende',
      close: 'Sluiten',
      view: 'Bekijken',
      assign: 'Toewijzen',
      change: 'Wijzigen'
    },
    
    // Client Dashboard
    client: {
      welcomeMessage: 'Klaar om je doelen te verpletteren vandaag?',
      personalVideo: 'Jouw Persoonlijke Coaching Video',
      videoComingSoon: 'Video wordt binnenkort toegevoegd',
      viewPlan: 'Bekijk je persoonlijke voedingsplan',
      todayTraining: 'Training van vandaag & oefeningen',
      logProgress: 'Log & volg je voortgang',
      settings: 'Instellingen & persoonlijke info',
      progressOverview: 'Jouw Voortgangsoverzicht',
      workoutsDone: 'Workouts Gedaan',
      planAdherence: 'Plan Naleving',
      strengthGain: 'Kracht Toename',
      currentWeek: 'Huidige Week'
    },
    
    // Coach Dashboard
    coach: {
      dashboardTitle: 'Personal Trainer Dashboard',
      dashboardOverview: 'Dashboard Overzicht',
      newClient: 'Nieuwe Klant',
      addClient: 'Klant Toevoegen',
      clientManagement: 'Klantenbeheer',
      manageClients: 'Beheer je personal training klanten',
      activeClients: 'Actieve Klanten',
      workoutPlans: 'Workout Plannen',
      aiGenerated: 'AI Gegenereerd',
      thisMonth: 'Deze Maand',
      recentActivity: 'Recente Activiteit',
      latestUpdates: 'Laatste updates van je klanten',
      totalClients: 'Totaal Klanten',
      withPlans: 'Met Plannen',
      training: 'In Training'
    },
    
    // Workout
    workout: {
      noWorkoutPlan: 'Nog Geen Workout Plan',
      trainerWillAssign: 'Je trainer zal binnenkort een workout plan toewijzen!',
      workoutExplanation: 'Workout Uitleg',
      personalTrainingVideo: 'Persoonlijke Training Video',
      yourWeek: 'Jouw Week',
      restDay: 'Rustdag',
      exercises: 'oefeningen',
      sets: 'Sets',
      reps: 'Herhalingen',
      rest: 'Rust',
      rpe: 'RPE',
      weekOverview: 'Week Overzicht',
      workouts: 'Workouts',
      restDays: 'Rustdagen',
      minPerWeek: 'Min/Week',
      planWeek: 'Week Plannen',
      dragToSchedule: 'Sleep om te Plannen',
      tapToSelect: 'Tik om te Selecteren',
      tapDay: 'Tik een dag hieronder',
 yourWeek: "Jouw Week",
  workoutExplanation: "Workout Uitleg",
  personalTrainingVideo: "Persoonlijke Training Video",
  restDay: "Rustdag",
  dropHere: "Sleep hier",
  planWeek: "Plan Week",
  save: "Opslaan",
  tapToSelect: "Tik om te selecteren",
  dragToSchedule: "Sleep om te plannen",
  sets: "Sets",
  reps: "Herhalingen",
  rest: "Rust",
  rpe: "RPE",
  exerciseLibrary: "Oefeningen Bibliotheek",
  startWorkout: "Start Workout",
  alternativeExercises: "Alternatieve Oefeningen",
  weekOverview: "Week Overzicht",
  workouts: "Workouts",
  restDays: "Rustdagen",
  minPerWeek: "Min/Week",
      scheduled: 'Ingepland'
    },
    
    // Forms
    forms: {
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      email: 'E-mailadres',
      phone: 'Telefoonnummer',
      password: 'Wachtwoord',
      temporaryPassword: 'Tijdelijk Wachtwoord',
      primaryGoal: 'Primair Doel',
      experienceLevel: 'Ervaringsniveau',
      selectGoal: 'Selecteer doel',
      selectExperience: 'Selecteer ervaring',
      beginner: 'Beginner (0-18 maanden)',
      intermediate: 'Gemiddeld (1.5-3 jaar)',
      advanced: 'Gevorderd (3+ jaar)',
      weightLoss: 'Gewichtsverlies',
      muscleGain: 'Spiergroei',
      strength: 'Kracht',
      generalFitness: 'Algemene Fitness',
      athleticPerformance: 'Atletische Prestaties'
    },
    
    // Errors
    errors: {
      noClientAccount: 'Geen Klant Account Gevonden',
      notRegistered: 'is niet geregistreerd als klant',
      areYouCoach: 'Ben je een coach? Mogelijk probeer je het verkeerde dashboard te openen.',
      goToCoach: 'Ga naar Coach Dashboard',
      tryAgain: 'Uitloggen & Opnieuw Proberen',
      noUserFound: 'Geen gebruiker gevonden',
      checkAuth: 'Controleer je authenticatie',
      failedToLoad: 'Laden mislukt',
      somethingWrong: 'Er is iets misgegaan'
    }
  }
}

// Create Context
const LanguageContext = createContext()

// Language Provider Component
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to 'nl'
    return localStorage.getItem('appLanguage') || 'nl'
  })

  // Save language preference
  useEffect(() => {
    localStorage.setItem('appLanguage', language)
  }, [language])

  // Translation function
  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key // Return key if translation not found
  }

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'nl' : 'en')
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Icon URLs for navigation
export const iconUrls = {
  home: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/347a061-831e-4cd2-f3b-b6007f0caa2_MIND_17_.png",
  mealplan: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_10_.png",
  workout: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/a3883-e0d0-0da8-deea-8b7e7dce467_MIND_14_.png",
  progress: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/b8015e-0fc-8aaf-b56-a13672c1bab5_MIND_13_.png",
  profile: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/1e1d3f-24b5-b48-37a-1537c7b8f05e_MIND_12_.png"
}
