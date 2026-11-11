// src/App.jsx

// /6weekchallenge draait sinds 15 sep op de checkout-opzet zonder betaaldeel
// (hero, methode/voorwaarden/waarom, garanties, reviewslider). De oude
// sales-call-6week-pagina staat er nog maar wordt niet meer gerenderd.
import { useState, useEffect } from 'react'
import lazy from './lazyMetHerlaad'
import LaadScherm from './components/LaadScherm'
import { kiesPortaal, ROL_SLEUTEL, heeftOpgeslagenSessie } from './portaalKeuze'
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
const MijnSplit = lazy(() => import('./pages/MijnSplit'))
const MijnMenu = lazy(() => import('./pages/MijnMenu'))
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

// De server gaf geen antwoord op wie dit is: nooit gokken, wel opnieuw laten proberen.
function PortaalOnbekend() {
  // Zodra het internet terug is of de app weer in beeld komt: zelf opnieuw.
  useEffect(() => {
    const opnieuw = () => { if (document.visibilityState === 'visible' && navigator.onLine !== false) window.location.reload() }
    window.addEventListener('online', opnieuw)
    document.addEventListener('visibilitychange', opnieuw)
    return () => { window.removeEventListener('online', opnieuw); document.removeEventListener('visibilitychange', opnieuw) }
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Geen verbinding</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 320 }}>We konden je account niet controleren. Check je internet en probeer het opnieuw.</div>
      <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#fff', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Opnieuw proberen</button>
    </div>
  )
}

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
  // Coachportaal alleen na een expliciet 'coach' of 'both' van de server (zie portaalKeuze.js).
  const [magCoach, setMagCoach] = useState(false)

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

  // Na een (her)start blijft het laadscherm staan tot vaststaat wie dit is
  // (11 nov 2026). Lukt dat niet: "Geen verbinding" met opnieuw proberen,
  // nooit het coachportaal en niet het inlogscherm als er een sessie is.
  const [geenVerbinding, setGeenVerbinding] = useState(false)
  const pauze = (ms) => new Promise(r => setTimeout(r, ms))

  const checkUser = async () => {
    try {
      // Geen gebruiker terwijl er wel een sessie op het toestel staat = het
      // netwerk is er (nog) niet, bv. vlak na een herstart in de sportschool.
      // Dan opnieuw proberen in plaats van het inlogscherm te tonen.
      let currentUser = await db.getCurrentUser()
      if (!currentUser?.id && heeftOpgeslagenSessie()) {
        for (const wacht of [1000, 2000, 4000, 6000]) {
          await pauze(wacht)
          currentUser = await db.getCurrentUser()
          if (currentUser?.id || !heeftOpgeslagenSessie()) break
        }
        if (!currentUser?.id && heeftOpgeslagenSessie()) {
          setGeenVerbinding(true)
          setLoading(false)
          return
        }
      }
      setUser(currentUser)

      // Rol-check op de server. Direct na het opstarten of een live-update kan het
      // netwerk nog niet klaar zijn, dus een tijd blijven proberen (laadscherm).
      if (currentUser?.id) {
        let rol = null
        let keuze = null
        let bekend = null
        try { keuze = localStorage.getItem('portalChoice'); bekend = localStorage.getItem(ROL_SLEUTEL) } catch { /* private mode */ }
        // Bekende klant: na ~5 s door naar het klantportaal; anders langer wachten.
        const pogingen = bekend === 'klant' ? [0, 500, 1500, 3000] : [0, 500, 1500, 3000, 5000, 8000]
        for (const wacht of pogingen) {
          if (wacht) await pauze(wacht)
          try {
            const { data, error } = await db.supabase.rpc('get_my_portal_role')
            if (!error && ['coach', 'client', 'both', 'none'].includes(data)) { rol = data; break }
          } catch (e) {
            console.warn('Portal-rol ophalen mislukt:', e?.message)
          }
        }
        const portaal = kiesPortaal({ rol, klantLaatst: storedMode, keuze, bekend })
        setMagCoach(portaal === 'coach')
        setIsClientMode(portaal === 'klant')
        if (rol) {
          localStorage.setItem('isClientMode', portaal === 'klant' ? 'true' : 'false')
          try { localStorage.setItem(ROL_SLEUTEL, portaal) } catch { /* private mode */ }
        }
      }
    } catch {
      console.log('Not authenticated')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isClientMode')
    localStorage.removeItem('portalChoice')
    localStorage.removeItem(ROL_SLEUTEL)
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

  // Lead magnet: vier vragen, naam + e-mail, dan de split uit de MY ARC-
  // bibliotheek als PDF. Lead komt in de bordkolom "🧲 Mijn split".
  if (currentPath === '/mijn-split' || currentPath === '/mijnsplit') {
    return <MijnSplit />
  }
  // Lead magnet: weekmenu op calorieën uit de dagmenu-gerechten, met PDF.
  if (currentPath === '/mijn-menu' || currentPath === '/mijnmenu') {
    return <MijnMenu />
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
  if (geenVerbinding) return <PortaalOnbekend />

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
      if (!isClientMode && !magCoach) return <PortaalOnbekend />
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
  if (!isClientMode && !magCoach) return <PortaalOnbekend />
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
