// src/pages/EightWeekCheckout.jsx
import { useState, useEffect } from 'react'
import { User, Calendar, MessageCircle, Target, FileText, Phone, Users, Trophy, CheckCircle, Shield } from 'lucide-react'
import GoldenOffersList from './checkout-components/GoldenOffersList'
import GoldenPriceDisplay from './checkout-components/GoldenPriceDisplay'
import GoldenGuarantees from './checkout-components/GoldenGuarantees'
import GoldenCheckoutForm from './checkout-components/GoldenCheckoutForm'

export default function EightWeekCheckout() {
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    // Smooth fade in
    setTimeout(() => setShowContent(true), 100)
  }, [])

  // Data configuration
  const offers = [
    {
      icon: User,
      title: "1-op-1 Begeleiding",
      description: "Geen groepsgedoe. Jij en ik.",
      value: "€497",
      highlight: true
    },
    {
      icon: Calendar,
      title: "8 Weken Persoonlijk Plan", 
      description: "Aangepast op jouw leven, niet andersom",
      value: "€297"
    },
    {
      icon: MessageCircle,
      title: "24/7 Persoonlijke Support",
      description: "Zoom of Whatsapp. Wat voor jou werkt.",
      value: "€197"
    },
    {
      icon: Target,
      title: "Workout Schema",
      description: "Thuis of Gym. Wat voor jou werkt",
      value: "€97"
    },
    {
      icon: FileText,
      title: "Voedings Plan",
      description: "Schema of Richlijnen. Wat voor jou werkt",
      value: "€97"
    },
    {
      icon: Phone,
      title: "MY ARC APP",
      description: "Persoonlijke progressie dashboard en tracking tools",
      value: "€97"
    },
    {
      icon: Users,
      title: "MY ARC LID",
      description: "Toegang tot evenementen, video's, groepsapp en meer",
      value: "€147"
    }
  ]

  const guarantees = [
    {
      icon: Trophy,
      badge: "GARANTIE #1",
      title: "Haal Je Doel",
      subtitle: "= Geld Terug",
      description: "Bereik je realistische 8-weken doel en krijg je volledige investering terug."
    },
    {
      icon: CheckCircle,
      badge: "GARANTIE #2",
      title: "Voldoe Aan Voorwaarden",
      subtitle: "= Geld Terug",
      description: "24 workouts, 45 dagen voeding bijhouden, 8 check-ins. Doe het werk, krijg alles terug."
    },
    {
      icon: Shield,
      badge: "GARANTIE #3",
      title: "4 Weken Garantie",
      subtitle: "Niet Tevreden = Geld Terug",
      description: "Na 4 weken niet overtuigd? Direct je geld terug, geen vragen."
    }
  ]

  const totalValue = offers.reduce((sum, offer) => {
    const value = parseInt(offer.value.replace('€', ''))
    return sum + value
  }, 0)

  const actualPrice = 297

  const handleCheckout = async (formData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: '8-week-program',
          price: actualPrice,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone
        })
      })

      const { sessionId } = await response.json()
      
      // Redirect to Stripe
      const stripe = window.Stripe('pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54')
      await stripe.redirectToCheckout({ sessionId })
      
    } catch (error) {
      console.error('Payment error:', error)
      alert('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      opacity: showContent ? 1 : 0,
      transition: 'opacity 0.8s ease'
    }}>
      {/* Clean container */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem'
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(212, 175, 55, 0.5)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Het systeem
          </p>
          
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '700',
            color: '#D4AF37',
            lineHeight: '1.2',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Wat Je Krijgt
          </h1>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 175, 55, 0.4)',
            fontWeight: '300'
          }}>
            Alles wat je nodig hebt. Zonder bullshit.
          </p>
        </div>

        {/* Offers List */}
        <GoldenOffersList 
          offers={offers}
          isMobile={isMobile}
        />

        {/* Price Display */}
        <GoldenPriceDisplay 
          totalValue={totalValue}
          actualPrice={actualPrice}
          isMobile={isMobile}
        />

        {/* Guarantees Section */}
        <GoldenGuarantees 
          guarantees={guarantees}
          isMobile={isMobile}
        />

        {/* Checkout Form */}
        <GoldenCheckoutForm 
          actualPrice={actualPrice}
          onSubmit={handleCheckout}
          loading={loading}
          isMobile={isMobile}
        />

        {/* Bottom trust signals */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '3rem' : '4rem',
          paddingTop: isMobile ? '2rem' : '2.5rem',
          borderTop: '1px solid rgba(212, 175, 55, 0.1)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(212, 175, 55, 0.3)',
            marginBottom: '0.5rem'
          }}>
            100% Veilig betalen via Stripe
          </p>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(212, 175, 55, 0.2)'
          }}>
            SSL Beveiligd • Geen verplichtingen • Direct starten
          </p>
        </div>

      </div>
    </div>
  )
}
