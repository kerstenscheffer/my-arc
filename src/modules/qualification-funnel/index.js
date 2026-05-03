// src/modules/qualification-funnel/index.js
// Clean exports for the Qualification Funnel module

export { default as QualificationFunnel } from './QualificationFunnel'
export { default as FunnelPage } from './FunnelPage'
export { default as FunnelDashboard } from './FunnelDashboard'
export { funnelTheme, commonStyles } from './funnelTheme'
export { getAnalytics, resetAnalytics, useFunnelAnalytics, initFunnelAnalytics } from './FunnelAnalytics'

// Default export voor makkelijke import
export { default } from './FunnelPage'

// Individual steps (for custom implementations)
export { default as LandingStep } from './components/LandingStep'
export { default as FilterStep } from './components/FilterStep'
export { default as CommitmentStep } from './components/CommitmentStep'
export { default as SocialProofSlider } from './components/SocialProofSlider'
export { default as CalendlyStep } from './components/CalendlyStep'
export { default as ConfirmationStep } from './components/ConfirmationStep'
