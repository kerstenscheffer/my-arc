// src/modules/video-feedback/feedbackOpenen.js
//
// Een melding "Feedback op je techniekvideo" opent direct de feedbackmodal
// van die oefening (28 okt 2026). Twee wegen komen hier samen: een tik op de
// melding in de app (NotificationWidget) en een tik op de push
// (PushNotificationService). Bij een push vanuit een gesloten app is het
// dashboard er nog niet; dan blijft het verzoek liggen tot de opener mount.
//
// De melding draagt in trigger_data: { actie: 'video_feedback', submission_id, oefening }.

export const OPEN_FEEDBACK_EVENT = 'myarc:open-video-feedback'
let wachtend = null

export function openVideoFeedback(info) {
  if (!info?.oefening) return
  wachtend = info
  window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT, { detail: info }))
}

export const pakWachtend = () => { const w = wachtend; wachtend = null; return w }

// trigger_data van een melding of push. Komt via FCM binnen als JSON-tekst.
// Geeft true als het een feedbackmelding was (en die is geopend).
export function openUitMelding(triggerData) {
  let t = triggerData
  if (typeof t === 'string') { try { t = JSON.parse(t) } catch { t = null } }
  if (t?.actie !== 'video_feedback' || !t.oefening) return false
  openVideoFeedback({ oefening: t.oefening, submissionId: t.submission_id || null })
  return true
}
