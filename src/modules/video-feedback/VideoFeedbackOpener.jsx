// src/modules/video-feedback/VideoFeedbackOpener.jsx
//
// Staat altijd in het klantdashboard en opent de feedbackmodal zodra een
// melding daarom vraagt (zie feedbackOpenen.js). Los van de workoutpagina,
// zodat het ook werkt als je op Home of Voeding zit.
import { useEffect, useState } from 'react'
import ClientFeedbackModal from '../workout/components/todays-workout/components/ClientFeedbackModal'
import { OPEN_FEEDBACK_EVENT, pakWachtend } from './feedbackOpenen'

export default function VideoFeedbackOpener({ client, db }) {
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const w = pakWachtend()
    if (w) setOpen(w)
    const luister = () => { const x = pakWachtend(); if (x) setOpen(x) }
    window.addEventListener(OPEN_FEEDBACK_EVENT, luister)
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, luister)
  }, [])

  if (!open || !client?.id) return null
  return (
    <ClientFeedbackModal
      key={`${open.oefening}-${open.submissionId || ''}`}
      exercise={{ name: open.oefening }}
      client={client}
      db={db}
      onClose={() => setOpen(null)}
    />
  )
}
