// src/modules/qualification-funnel/FunnelPage.jsx
// Standalone page wrapper - Use this as a route in your app

import QualificationFunnel from './QualificationFunnel'

export default function FunnelPage() {
  const handleComplete = (data) => {
    console.log('Funnel completed:', data)
    // Here you can:
    // - Send to analytics
    // - Store in database
    // - Redirect to thank you page
    // - etc.
  }

  return (
    <QualificationFunnel onComplete={handleComplete} />
  )
}

// Alternative: Export a function to open as modal
export function openQualificationFunnel(container) {
  // This can be used to render the funnel in a specific container
  // Useful for popup/modal implementations
  return QualificationFunnel
}
