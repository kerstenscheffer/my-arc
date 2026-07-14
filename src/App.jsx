// src/App.jsx
import UiDemo from './ui/UiDemo'   // interne controle-pagina (route /ui-demo, niet in menu's)
import InfoPage from './pages/InfoPage'
import SalesInfoPage from './pages/SalesInfoPage'
import SalesSlider from './pages/SalesSlider'
import SalesScrollPage from './pages/SalesScrollPageClean'
import PrivacyPolicy from './pages/PrivacyPolicy'
import SupportPage from './pages/SupportPage'
import CoachingGuidePage from './pages/CoachingGuidePage'
import MyArcInfo from './pages/myarcinfo/MyArcInfo'
import IntakePage from './intake/IntakePage'
import ThankYouPage from './intake/ThankYouPage'
import ClientOnboarding from './client/pages/ClientOnboarding'
import FunnelPage from './funnel/FunnelPage'
import NinetyDaysFunnelPage from './funnel/90days/page'
import FivePillarPage from './funnel/five-pilar/FivePillarPage'
import TillTheGoalPage from './till-the-goal/TillTheGoalPage'

import YourArcFunnel from './modules/funnel-pages/your-arc/YourArcFunnel'
import MyArcFunnel from './modules/funnel-pages/my-arc/MyArcFunnelMain'
import CheckoutPage from './pages/CheckoutPage'
import BackInShapeCheckout from './pages/BackInShapeCheckout'
import BackInShapeMonthlyCheckout from './pages/BackInShapeMonthlyCheckout'
import EightWeekCheckout from './pages/EightWeekCheckout'
import TwelveWeekCheckout from './pages/TwelveWeekCheckout'
import MonthlySubscriptionCheckout from './pages/MonthlySubscriptionCheckout'
import MaandCheckout from './pages/MaandCheckout'
import SixMonthSubscriptionCheckout from './pages/SixMonthSubscriptionCheckout'
import PaymentSuccessRedirect from './pages/PaymentSuccessRedirect'
import Homepage from './pages/Homepage'
import LeadPicGenerator from './modules/lead-pic-generator/LeadPicGenerator'
import LeadMessageFlow from './modules/lead-magnet/LeadMessageFlow'
import QuizPage from './lead-magnet/QuizPage'
import ResultPage from './lead-magnet/ResultPage'
import SevenSecretsFunnel from './lead-magnet/7secretsfunnel/7SecretsFunnel'
import GiveawayPage from './lead-magnet/7secretsfunnel/GiveawayPage'
import SalesCallPage from './sales-call/SalesCallPage'
import BackInShapePage from './sales-call/BackInShapePage'
import VSLLandingPage from './sales-call-vsl/VSLLandingPage'
import SalesCallVSLPage from './sales-call-vsl/SalesCallVSLPage'
import NutritionIntakePage from './modules/nutrition-intake/NutritionIntakePage'
import PublicIntakePage from './modules/public-intake/PublicIntakePage'
import HubRouter from './modules/resource-hub/HubRouter'
import QualificationFunnelPage from './modules/qualification-funnel'
import LinkFunnelPage from './link-funnel/LinkFunnelPage'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import ClientDashboard from './client/ClientDashboard'
import CoachHub from './coach/CoachHub'
import CoachHubV2 from './coach/CoachHubV2'
import FunnelViewer from './pages/FunnelViewer'
import DatabaseService from './services/DatabaseService'
import { LanguageProvider } from './contexts/LanguageContext'
import PWAInstaller from './components/PWAInstaller'
import UpdateModal from './components/UpdateModal'

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
    checkUser()
  }, [])

  useEffect(() => {
    localStorage.setItem('isClientMode', isClientMode)
  }, [isClientMode])

  const checkUser = async () => {
    try {
      const currentUser = await db.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.log('Not authenticated')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isClientMode')
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

  // Sales call booking page
  if (currentPath === '/sales') {
    return <SalesCallPage />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // ==============================================
  // MAIN ROUTE - CLIENT LOGIN AS DEFAULT (/)
  // ==============================================
  if (currentPath === '/' || currentPath === '/client-login') {
    if (!user) {
      // Not logged in → Show client login
      return (
        <LanguageProvider>
          <Login onLogin={() => {
            setIsClientMode(true)
            localStorage.setItem('isClientMode', 'true')
            checkUser()
          }} />
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
        <Login onLogin={() => {
          setIsClientMode(false)
          localStorage.setItem('isClientMode', 'false')
          checkUser()
        }} />
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
