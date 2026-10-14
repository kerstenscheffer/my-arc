// src/pages/PaymentSuccessRedirect.jsx
// Bevestigingspagina na een geslaagde Stripe-betaling (route /success).
//
// Eerder: alleen "Betaling gelukt" + een aftelteller die na 5 s naar de intake
// sprong. Klanten wisten daardoor niet zeker of de betaling goed was
// doorgekomen en wat er nu ging gebeuren. Nu: duidelijke bevestiging met
// vinkje en de volgende stappen; de klant gaat zelf door naar de intake.
import BetalingGelukt from '../components/BetalingGelukt'

const INTAKE_URL = '/myintake'

export default function PaymentSuccessRedirect() {
  return <BetalingGelukt onStart={() => { window.location.href = INTAKE_URL }} />
}
