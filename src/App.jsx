// src/App.jsx

// /6weekchallenge draait sinds 15 sep op de checkout-opzet zonder betaaldeel
// (hero, methode/voorwaarden/waarom, garanties, reviewslider). De oude
// sales-call-6week-pagina staat er nog maar wordt niet meer gerenderd.
import { useState, useEffect } from 'react'
import lazy from './lazyMetHerlaad'
import LaadScherm from './components/LaadScherm'
import Login from './components/Login'
import DatabaseService from './services/DatabaseService'
import { LanguageProvider } from './contexts/LanguageContext'
import PWAInstaller from './components/PWAInstaller'
import UpdateModal from './components/UpdateModal'
import pushNotificationService from './services/PushNotificationService'

// Pagina's als losse stukken (zie main.jsx voor het laadscherm).
const UiDemo = lazy(() => import('./ui/UiDemo'))
const InfoPage = lazy(() => import('./pages/InfoPage'))
const SalesInfoPage = lazy(() => import('./pages/SalesInfoPage'))
const SalesSlider = lazy(() => import('./pages/SalesSlider'))
const SalesScrollPage = lazy(() => import('./pages/SalesScrollPageClean'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const CoachingGuidePage = lazy(() => import('./pages/CoachingGuidePage'))
const MyArcInfo = lazy(() => import('./pages/myarcinfo/MyArcInfo'))
const IntakePage = lazy(() => import('./intake/IntakePage'))
const ThankYouPage = lazy(() => import('./intake/ThankYouPage'))
const ClientOnboarding = lazy(() => import('./client/pages/ClientOnboarding'))
const FunnelPage = lazy(() => import('./funnel/FunnelPage'))
const NinetyDaysFunnelPage = lazy(() => import('./funnel/90days/page'))
const FivePillarPage = lazy(() => import('./funnel/five-pilar/FivePillarPage'))
const TillTheGoalPage = lazy(() => import('./till-the-goal/TillTheGoalPage'))
const YourArcFunnel = lazy(() => import('./modules/funnel-pages/your-arc/YourArcFunnel'))
const MyArcFunnel = lazy(() => import('./modules/funnel-pages/my-arc/MyArcFunnelMain'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const BackInShapeCheckout = lazy(() => import('./pages/BackInShapeCheckout'))
const BackInShapeMonthlyCheckout = lazy(() => import('./pages/BackInShapeMonthlyCheckout'))
const EightWeekCheckout = lazy(() => import('./pages/EightWeekCheckout'))
const TwelveWeekCheckout = lazy(() => import('./pages/TwelveWeekCheckout'))
const CalorieCalculator = lazy(() => import('./pages/CalorieCalculator'))
const SixteenWeekCheckout = lazy(() => import('./pages/SixteenWeekCheckout'))
const SixteenWeekMonthlyCheckout = lazy(() => import('./pages/SixteenWeekMonthlyCheckout'))
const MonthlySubscriptionCheckout = lazy(() => import('./pages/MonthlySubscriptionCheckout'))
const MaandCheckout = lazy(() => import('./pages/MaandCheckout'))
const SixMonthSubscriptionCheckout = lazy(() => import('./pages/SixMonthSubscriptionCheckout'))
const PaymentSuccessRedirect = lazy(() => import('./pages/PaymentSuccessRedirect'))
const Homepage = lazy(() => import('./pages/Homepage'))
const LeadPicGenerator = lazy(() => import('./modules/lead-pic-generator/LeadPicGenerator'))
const LeadMessageFlow = lazy(() => import('./modules/lead-magnet/LeadMessageFlow'))
const QuizPage = lazy(() => import('./lead-magnet/QuizPage'))
const ResultPage = lazy(() => import('./lead-magnet/ResultPage'))
const SevenSecretsFunnel = lazy(() => import('./lead-magnet/7secretsfunnel/7SecretsFunnel'))
const GiveawayPage = lazy(() => import('./lead-magnet/7secretsfunnel/GiveawayPage'))
const SalesCallPage = lazy(() => import('./sales-call/SalesCallPage'))
const SixteenWeekPage = lazy(() => import('./pages/SixteenWeekPage'))
const SixWeekChallengePage = lazy(() => import('./pages/SixWeekChallengePage'))
const ChallengeVslPage = lazy(() => import('./pages/ChallengeVslPage'))
const ChallengePrequalPage = lazy(() => import('./pages/ChallengePrequalPage'))
const SixWeekChallengeCheckout = lazy(() => import('./pages/SixWeekChallengeCheckout'))
const BackInShapePage = lazy(() => import('./sales-call/BackInShapePage'))
const VSLLandingPage = lazy(() => import('./sales-call-vsl/VSLLandingPage'))
const SalesCallVSLPage = lazy(() => import('./sales-call-vsl/SalesCallVSLPage'))
const NutritionIntakePage = lazy(() => import('./modules/nutrition-intake/NutritionIntakePage'))
const PublicIntakePage = lazy(() => import('./modules/public-intake/PublicIntakePage'))
const HubRouter = lazy(() => import('./modules/resource-hub/HubRouter'))
const QualificationFunnelPage = lazy(() => import('./modules/qualification-funnel'))
const LinkFunnelPage = lazy(() => import('./link-funnel/LinkFunnelPage'))
const ResetPassword = lazy(() => import('./components/ResetPassword'))
const ClientDashboard = lazy(() => import('./client/ClientDashboard'))
const CoachHub = lazy(() => import('./coach/CoachHub'))
const CoachHubV2 = lazy(() => import('./coach/CoachHubV2'))
const FunnelViewer = lazy(() => import('./pages/FunnelViewer'))


const db = DatabaseService

function App() {
  const currentPath = window.location.pathname
  const isFunnelRoute = currentPath.startsWith('/funnel/')

  // ==============================================
  // STATE INITIALIZATION (Must be before any returns)
  // ==============================================
  const storedMode = localStorage.getItem('isClientMode') === 'true'
  const useV2CoachHub = false // Toggle between CoachHub versions

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClientMode, setIsClientMode] = useState(storedMode)

  useEffect(() => {
    // Opruimen van het oude portal-switch-lek: die knop bewaarde e-mail +
    // wachtwoord van het andere account in localStorage. De metadata-kant is
    // in de database al leeggemaakt, maar devices die de creds ooit hebben
    // opgehaald hebben ze nog lokaal staan. Dit wist ze bij de eerstvolgende
    // keer dat de app opent.
    try { localStorage.removeItem('portalSwitchCreds') } catch { /* private mode */ }
    checkUser()
  }, [])

  useEffect(() => {
    localStorage.setItem('isClientMode', isClientMode)
  }, [isClientMode])

  useEffect(() => {
    if (user?.id) pushNotificationService.init(user.id)
  }, [user])

  const checkUser = async () => {
    try {
      const currentUser = await db.getCurrentUser()
      setUser(currentUser)

      // Rol-check op de server, niet op localStorage — die vlag zegt niets:
      // de inlog op `/` zet 'm sowieso op true, ongeacht wie je bent.
      //
      // Dit was eerder één check: "heeft dit auth-account een clients-rij? →
      // klant". Voor een account dat BEIDE is ging dat mis. Coach Horstink is
      // teamlid én heeft een oude (inactieve) clients-rij op zijn naam, dus
      // 'klant' won altijd en hij kon nooit meer bij CoachHub. De wissel-knop
      // hielp niet: die logt in op een ánder account, en hij heeft er één.
      //
      // get_my_portal_role() weegt beide kanten:
      //   'coach'  → coach-portaal afdwingen
      //   'client' → client-portaal afdwingen
      //   'both'   → de expliciete keuze van de wissel-knop volgen (default coach)
      if (currentUser?.id) {
        let role = null
        try {
          const { data, error } = await db.supabase.rpc('get_my_portal_role')
          if (!error) role = data
        } catch (e) {
          console.warn('Portal-rol ophalen mislukt:', e?.message)
        }

        if (role === 'client' || role === 'coach' || role === 'both') {
          // Alleen bij 'both' mag de opgeslagen keuze meespelen. Bewust een
          // aparte sleutel en niet `isClientMode`: die staat bij dubbelrol-
          // accounts al op 'true' door de oude bug, en zou ze dus opnieuw
          // vastzetten in het client-portaal.
          const choice = (() => {
            try { return localStorage.getItem('portalChoice') } catch { return null }
          })()
          const asClient = role === 'client' || (role === 'both' && choice === 'client')
          setIsClientMode(asClient)
          localStorage.setItem('isClientMode', asClient ? 'true' : 'false')
        } else {
          // RPC niet beschikbaar (oude DB) of 'none' → oude gedrag als vangnet.
          const { data: clientRow } = await db.supabase
            .from('clients')
            .select('id')
            .eq('auth_user_id', currentUser.id)
            .limit(1)
            .maybeSingle()
          // Expliciet beide kanten zetten. Bleef dit op de opgeslagen waarde
          // staan, dan kon een vers coach-account met een oude 'true' in
          // localStorage alsnog in het klantportaal belanden.
          const alsKlant = !!clientRow
          setIsClientMode(alsKlant)
          localStorage.setItem('isClientMode', alsKlant ? 'true' : 'false')
        }
      }
    } catch (error) {
      console.log('Not authenticated')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isClientMode')
    localStorage.removeItem('portalChoice')
    setIsClientMode(false)
  }

  // ==============================================
  // PUBLIC ROUTES (No Authentication Required)
  // ==============================================

  // Interne UI-controle-pagina (Fase 1 fundament) — niet gelinkt in menu's.
  if (currentPath === '/ui-demo') {
    return <UiDemo />
  }

  // InfoPage moved to /info and /home only (link-in-bio page)
  if (currentPath === '/info' || currentPath === '/home') {
    return <InfoPage />
  }

  // Sales info page for 12-week program
  if (currentPath === '/12-week-info') {
    return <SalesInfoPage />
  }

  // Sales slider presentation
  if (currentPath === '/myarcslide') {
    return <SalesSlider />
  }

  // Sales scroll page
  if (currentPath === '/salepage') {
    return <SalesScrollPage />
  }

  // Programma-pagina (voorheen /sales — alias blijft werken voor oude links)
  if (currentPath === '/programma' || currentPath === '/sales') {
    return <SalesCallPage />
  }

  // Calorie-calculator voor mannen — losse tool onder de 16-weken-video.
  // Beide schrijfwijzen, zodat een gedeelde link met of zonder streepje werkt.
  if (currentPath === '/calorie-calculator' || currentPath === '/caloriecalculator') {
    return <CalorieCalculator />
  }

  // 16-weken offer — zelfde opbouw als de 6-weken challenge: banner met de
  // titel erop, drie vensters (methode, voorwaarden, waarom) en de
  // investering met de reviews. De oude snap-scroll versie staat nog in
  // sales-call-16week/, maar hangt niet meer aan een route.
  if (currentPath === '/16week') {
    return <SixteenWeekPage />
  }

  // Gratis 6 weken 80/20 challenge — zelfde opbouw als /16week, eigen kop en
  // drie eigen slotschermen (systeem, voorwaarden, garantie).
  if (currentPath === '/6weekchallenge') {
    return <SixWeekChallengePage />
  }

  // VSL voor de 6 Weken Challenge: video bovenaan, verhaal eronder, elke knop
  // naar de kennismaking in Calendly. Geen betaling op deze pagina.
  if (currentPath === '/challenge') {
    return <ChallengeVslPage />
  }
  // Prekwalificatie vóór de kennismaking: tien vragen, lead op het bord,
  // daarna Calendly. Zit ook in het blad van /challenge.
  if (currentPath === '/challenge/start') {
    return <ChallengePrequalPage />
  }

  // Sales-pagina-kopie met gratis strategiegesprek-CTA i.p.v. prijzen
  if (currentPath === '/backinshape') {
    return <BackInShapePage />
  }

  // Publieke VSL-landing voor het "5 Uur Per Week Back In Shape" aanbod
  // (Instagram link in bio). Cold traffic ziet hier de video + CTA naar
  // Calendly.
  if (currentPath === '/5-uur-per-week-back-in-shape') {
    return <VSLLandingPage />
  }

  // Fullscreen sales-call presentatie voor hetzelfde aanbod. Bedoeld
  // om tijdens een Zoom-call scherm te delen — geen CTA, alleen visuele
  // ondersteuning bij wat Kersten vertelt.
  if (currentPath === '/5uur-call') {
    return <SalesCallVSLPage />
  }

  // Call booking funnel (moved to /fitworden)
  if (currentPath === '/fitworden') {
    return <Homepage />
  }

  // Checkout pages (public)
  if (currentPath === '/checkout') {
    return <CheckoutPage />
  }

  if (currentPath === '/back-in-shape') {
    return <BackInShapeCheckout />
  }

  if (currentPath === '/back-in-shape-maandelijks') {
    return <BackInShapeMonthlyCheckout />
  }

  if (currentPath === '/8-week-checkout') {
    return <EightWeekCheckout />
  }

  if (currentPath === '/12-week-checkout') {
    return <TwelveWeekCheckout />
  }

  // 16-weken checkout — €497. Beide schrijfwijzen, zodat een gedeelde link
  // met of zonder streepje werkt.
  if (currentPath === '/16-week-checkout' || currentPath === '/16week-checkout') {
    return <SixteenWeekCheckout />
  }

  // 16-weken checkout, nieuwe prijs €750 (sinds 2 okt 2026). Eigen pad (v2):
  // de €497-link hierboven blijft werken voor wie daar nog moet betalen.
  if (currentPath === '/16-week-checkout-v2' || currentPath === '/16week-checkout-v2') {
    return <SixteenWeekCheckout v2 />
  }

  // 6-weken challenge checkout — eenmalig €297, win your money back. Beide
  // schrijfwijzen, zodat een gedeelde link met of zonder streepje werkt.
  if (currentPath === '/6-week-checkout' || currentPath === '/6week-checkout') {
    return <SixWeekChallengeCheckout />
  }

  // Zelfde challenge, nieuwe prijs €497 (sinds 2 okt 2026). Eigen pad (v2): de
  // €297-link hierboven blijft werken voor wie die nog moet betalen.
  if (currentPath === '/6-week-checkout-v2' || currentPath === '/6week-checkout-v2') {
    return <SixWeekChallengeCheckout prijs497 />
  }

  // Zelfde challenge, in twee termijnen: nu €148,50 en over 3 weken nog eens.
  // Zelfde pagina, andere Stripe-prijs.
  if (currentPath === '/6-week-checkout-2x' || currentPath === '/6week-checkout-2x') {
    return <SixWeekChallengeCheckout termijnen />
  }

  // 16-weken checkout, maandelijks — €125/mnd abonnement.
  if (currentPath === '/16-week-monthly-checkout' || currentPath === '/16week-monthly-checkout') {
    return <SixteenWeekMonthlyCheckout />
  }

  // 16-weken maandelijks, nieuwe prijs 4 × €200 (sinds 2 okt 2026). Eigen
  // pad (v2): de €125-link hierboven blijft werken.
  if (currentPath === '/16-week-monthly-checkout-v2' || currentPath === '/16week-monthly-checkout-v2') {
    return <SixteenWeekMonthlyCheckout v2 />
  }

  if (currentPath === '/monthly-checkout') {
    return <MonthlySubscriptionCheckout />
  }

  if (currentPath === '/maand-checkout') {
    return <MaandCheckout />
  }

  if (currentPath === '/6month-checkout') {
    return <SixMonthSubscriptionCheckout />
  }

  // Success page after payment — bevestigt kort en stuurt door naar /myintake
  if (currentPath === '/success') {
    return <PaymentSuccessRedirect />
  }

  // Meal preferences form
  if (currentPath === '/meal-preferences') {
    window.location.href = '/meal-preferences.html'
    return null
  }

  // Post maker / Lead generator
  if (currentPath === '/postmaker') {
    return <LeadPicGenerator />
  }

  // Lead message flow
  if (currentPath === '/leadmessage') {
    return <LeadMessageFlow />
  }

  // Quiz lead magnet
  if (currentPath === '/ontdek-jouw-route') {
    return <QuizPage />
  }

  if (currentPath === '/ontdek-jouw-route/resultaat') {
    return <ResultPage />
  }

  // 7 Secrets funnel
  if (currentPath === '/7secrets') {
    return <SevenSecretsFunnel />
  }

  // Giveaway page
  if (currentPath === '/giveaway') {
    return <GiveawayPage />
  }

  // Nutrition intake form
  if (currentPath === '/nutritionintake') {
    return <NutritionIntakePage />
  }

  // Client intake form
  if (currentPath === '/intake') {
    return <IntakePage />
  }

  // Public intake form (no auth required)
  if (currentPath === '/myintake') {
    return <PublicIntakePage />
  }

  // Thank you page after intake submit
  if (currentPath === '/bedankt') {
    return <ThankYouPage />
  }

  // Klik-funnel voor link-verkeer (5 uur per week in shape programma).
  // Was: QualificationFunnelPage — die blijft als component bestaan en is
  // weer aan /start te koppelen door deze regel terug te zetten.
  if (currentPath === '/start') {
    return <LinkFunnelPage />
  }

  // Client onboarding (public for new clients)
  if (currentPath === '/onboarding') {
    return (
      <LanguageProvider>
        <ClientOnboarding db={db} user={null} />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // Funnel pages
  if (currentPath === '/funnel') {
    return <FunnelPage />
  }

  if (currentPath === '/90days') {
    return <NinetyDaysFunnelPage />
  }

  if (currentPath === '/5pilar') {
    return <FivePillarPage />
  }

  // Resource Hub pages (public - auth optional)
  if (currentPath.startsWith('/hub')) {
    return <HubRouter db={db} />
  }

  if (currentPath === '/your-arc') {
    return <YourArcFunnel />
  }

  // My Arc funnel
  if (currentPath === '/my-arc') {
    return <MyArcFunnel />
  }

  // Till The Goal funnel
  if (currentPath === '/till-the-goal') {
    return <TillTheGoalPage />
  }

  if (isFunnelRoute) {
    const slug = currentPath.replace('/funnel/', '')
    return (
      <LanguageProvider>
        <FunnelViewer slug={slug} />
      </LanguageProvider>
    )
  }

  // Password reset
  if (currentPath === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // Privacy Policy
  if (currentPath === '/privacy') {
    return <PrivacyPolicy />
  }

  // Support
  if (currentPath === '/support') {
    return <SupportPage />
  }

  // Coaching Guide
  if (currentPath === '/coaching-guide') {
    return <CoachingGuidePage />
  }

  // MY ARC Info page
  if (currentPath === '/myarcinfo') {
    return <MyArcInfo />
  }

  // ==============================================
  // AUTHENTICATED ROUTES (Login Required)
  // ==============================================

  if (loading) return <LaadScherm />

  // ==============================================
  // MAIN ROUTE - CLIENT LOGIN AS DEFAULT (/)
  // ==============================================
  if (currentPath === '/' || currentPath === '/client-login') {
    if (!user) {
      // Not logged in → Show client login
      return (
        <LanguageProvider>
          {/* Geen onLogin-callback: LoginMain herlaadt na het inloggen de
              pagina, waarna checkUser() hierboven de rol bij de server
              opvraagt. Hier een portaalvlag zetten deed niets behalve
              verwarren — hij werd meteen weer overschreven. */}
          <Login />
          <PWAInstaller />
          <UpdateModal db={db} />
        </LanguageProvider>
      )
    } else {
      // Already logged in → Route to correct dashboard
      if (isClientMode) {
        return (
          <LanguageProvider>
            <ClientDashboard onLogout={handleLogout} />
            <PWAInstaller />
            <UpdateModal db={db} />
          </LanguageProvider>
        )
      } else {
        return (
          <LanguageProvider>
            {useV2CoachHub ? (
              <>
                <CoachHubV2 onLogout={handleLogout} />
                <PWAInstaller />
                <UpdateModal db={db} />
              </>
            ) : (
              <>
                <CoachHub onLogout={handleLogout} />
                <PWAInstaller />
                <UpdateModal db={db} />
              </>
            )}
          </LanguageProvider>
        )
      }
    }
  }

  // ==============================================
  // FALLBACK - FOR ANY OTHER ROUTE
  // ==============================================
  
  // Show regular login if no user (for coach access via other routes)
  if (!user) {
    return (
      <LanguageProvider>
        <Login />
        <PWAInstaller />
        <UpdateModal db={db} />
      </LanguageProvider>
    )
  }

  // Dashboard routing based on mode (fallback for authenticated users)
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
        <PWAInstaller />
        <UpdateModal db={db} />
      </LanguageProvider>
    )
  } else {
    return (
      <LanguageProvider>
        {useV2CoachHub ? (
          <>
            <CoachHubV2 onLogout={handleLogout} />
            <PWAInstaller />
            <UpdateModal db={db} />
          </>
        ) : (
          <>
            <CoachHub onLogout={handleLogout} />
            <PWAInstaller />
            <UpdateModal db={db} />
          </>
        )}
      </LanguageProvider>
    )
  }
}

export default App
