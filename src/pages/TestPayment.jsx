// src/pages/TestPayment.jsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54');

function TestPayment() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@myarc.com');
  const [name, setName] = useState('Test User');
  const isMobile = window.innerWidth <= 768;

  const handleTestPayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'test',
          price: 1, // €1 test
          email: email,
          name: name,
          phone: '+31612345678'
        })
      });

      const { sessionId } = await response.json();

      if (sessionId) {
        const stripe = await stripePromise;
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (err) {
      console.error('Test payment error:', err);
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(17, 17, 17, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: isMobile ? '2rem' : '3rem',
        border: '2px solid #f97316',
        boxShadow: '0 20px 40px rgba(249, 115, 22, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🧪
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          color: '#f97316',
          marginBottom: '1rem'
        }}>
          Test Betaling
        </h1>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Test de complete betaalflow met slechts €1. Perfect voor development testing.
        </p>

        <div style={{
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            €1.00
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Test betaling (niet terugstortbaar)
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '0.5rem'
            }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          onClick={handleTestPayment}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading 
              ? 'rgba(107, 114, 128, 0.5)'
              : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1.125rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {loading ? 'Verwerken...' : 'Start €1 Test Betaling'}
        </button>

        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          ⚠️ Dit is een LIVE betaling voor testing
        </div>
      </div>
    </div>
  );
}

export default TestPayment;
