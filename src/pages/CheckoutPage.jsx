// src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe met LIVE key
const stripePromise = loadStripe('pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54');

function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const isMobile = window.innerWidth <= 768;

  // Pricing plans
  const plans = {
    trial: {
      name: 'Trial',
      price: 49,
      features: [
        '2 weken begeleiding',
        'Basis meal plan',
        'Email support',
        'Workout schema'
      ],
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    },
    standard: {
      name: 'Standard',
      price: 299,
      popular: true,
      features: [
        '12 weken transformatie',
        'Gepersonaliseerd meal plan',
        'Wekelijkse check-ins',
        'WhatsApp support',
        'Custom workouts',
        'Progress tracking'
      ],
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    premium: {
      name: 'Premium',
      price: 599,
      features: [
        '24 weken complete transformatie',
        'AI-powered meal planning',
        'Dagelijkse coaching',
        '24/7 WhatsApp support',
        'Video check-ins',
        'Supplement advies',
        'Shopping lists',
        'Geld-terug garantie*'
      ],
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!email || !name) {
        setError('Vul alle verplichte velden in');
        setLoading(false);
        return;
      }

      // Call API om checkout session te maken
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          price: plans[selectedPlan].price,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      if (data.sessionId) {
        // Redirect naar Stripe Checkout
        const stripe = await stripePromise;
        const { error: stripeError } = await stripe.redirectToCheckout({ 
          sessionId: data.sessionId 
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      } else {
        throw new Error('Geen sessie ID ontvangen');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Verbindingsfout. Probeer opnieuw.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '1rem' : '2rem',
      paddingBottom: '4rem'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem'
        }}>
          Start Jouw Transformatie
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Kies het plan dat bij jouw doelen past
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          maxWidth: '500px',
          margin: '0 auto 2rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          color: '#ef4444',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '3rem'
      }}>
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            onClick={() => setSelectedPlan(key)}
            style={{
              background: selectedPlan === key 
                ? `linear-gradient(135deg, ${plan.color}22 0%, ${plan.color}11 100%)`
                : 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(10px)',
              border: selectedPlan === key 
                ? `2px solid ${plan.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: isMobile ? '1.5rem' : '2rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: selectedPlan === key ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selectedPlan === key 
                ? `0 20px 40px ${plan.color}33`
                : '0 10px 30px rgba(0, 0, 0, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: plan.gradient,
                padding: '0.25rem 1rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Meest Gekozen
              </div>
            )}

            {/* Plan name */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: plan.color,
              marginBottom: '0.5rem'
            }}>
              {plan.name}
            </h3>

            {/* Price */}
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '1.5rem'
            }}>
              €{plan.price}
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginLeft: '0.5rem'
              }}>
                eenmalig
              </span>
            </div>

            {/* Features */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {plan.features.map((feature, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  <span style={{
                    color: plan.color,
                    fontSize: '1.25rem',
                    lineHeight: '1'
                  }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Selected indicator */}
            {selectedPlan === key && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: plan.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checkout Form */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Jouw Gegevens
        </h3>

        {/* Name field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Naam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Email field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Phone field */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Telefoon (optioneel)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+31 6 12345678"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={loading || !email || !name}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: loading || !email || !name
              ? 'rgba(107, 114, 128, 0.5)'
              : plans[selectedPlan].gradient,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            cursor: loading || !email || !name ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)',
            boxShadow: `0 10px 30px ${plans[selectedPlan].color}44`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            if (!loading && email && name) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 15px 40px ${plans[selectedPlan].color}66`;
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 10px 30px ${plans[selectedPlan].color}44`;
          }}
        >
          {loading ? 'Verwerken...' : `Start met ${plans[selectedPlan].name} - €${plans[selectedPlan].price}`}
        </button>

        {/* Trust badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '0.5rem' : '1rem',
          marginTop: '1.5rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          flexWrap: 'wrap'
        }}>
          <span>🔒 Veilig betalen</span>
          <span>✓ Direct toegang</span>
          <span>↩️ 14 dagen garantie</span>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
