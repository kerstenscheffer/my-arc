// src/funnel/90days/components/TestimonialsSection.jsx

import React, { useState } from 'react'

const GOLD = '#ffba09'
const GOLD_BRIGHT = '#ffd44d'

export default function TestimonialsSection() {
  const isMobile = window.innerWidth <= 768
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const pp = "'Poppins', sans-serif"

  const testimonials = [
    {
      name: 'Patrick Hollander',
      date: 'April 12, 2025',
      rating: 5,
      title: 'Gelijk Nieuwe Leden',
      text: 'Je ziet een beloftes in mijn bedrijf levert daadwerkelijk resultaten. Ik kan hem zeker aanraden, dus ik zou zeker een afspraak inplannen als je resultaten wilt.',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick',
      company: 'Personal Trainer',
      result: '-12kg in 90 days',
    },
    {
      name: 'Sharon & Tim',
      date: 'March 15, 2025',
      rating: 5,
      title: 'Couple Transformation',
      text: 'This program completely changed how we approach fitness. Together we lost 18kg and built more muscle than we ever thought possible.',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sharon',
      company: 'Entrepreneurs',
      result: '+8kg muscle added',
    },
    {
      name: 'Mandy Glaudemans',
      date: 'January 13, 2025',
      rating: 5,
      title: 'Can Ze Zeker Aanbevelen!',
      text: 'Afgelopen maand Niels leren kennen. Wat een top kerel! Komt netjes zijn afspraken na, maakt nog meer meters voor je dan er wordt verwacht. Ik vind het super fijn om met hem te werken.',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mandy',
      company: 'Coach',
      result: 'Coach certified',
    },
  ]

  const Testimonial = ({ testimonial, isActive }) => (
    <div
      style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        background: 'rgba(255, 186, 9, 0.04)',
        border: `2px solid ${isActive ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
        borderRadius: isMobile ? '12px' : '16px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        opacity: isActive ? 1 : 0.7,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={() => setActiveTestimonial(testimonials.indexOf(testimonial))}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '0.75rem' : '1rem',
          alignItems: 'flex-start',
        }}
      >
        <img
          src={testimonial.image}
          alt={testimonial.name}
          style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '50%',
            border: '2px solid #10b981',
          }}
        />
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 'bold',
              margin: '0 0 0.25rem 0',
              color: '#fff',
            }}
          >
            {testimonial.name}
          </h4>
          <p
            style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
            }}
          >
            {testimonial.company} • {testimonial.date}
          </p>
        </div>
      </div>

      {/* RATING */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: isMobile ? '0.75rem' : '1rem',
        }}
      >
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <span key={i} style={{ color: GOLD_BRIGHT, fontSize: isMobile ? '0.875rem' : '1rem' }}>
            ★
          </span>
        ))}
      </div>

      {/* TITLE */}
      <h5
        style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: 800,
          color: GOLD,
          margin: '0 0 0.5rem 0',
          fontFamily: pp,
        }}
      >
        {testimonial.title}
      </h5>

      {/* TEXT */}
      <p
        style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.5',
          margin: isMobile ? '0.75rem 0' : '1rem 0',
        }}
      >
        {testimonial.text}
      </p>

      {/* RESULT BADGE */}
      <div
        style={{
          display: 'inline-block',
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
          background: 'rgba(255, 186, 9, 0.1)',
          border: `1px solid rgba(255, 186, 9, 0.3)`,
          borderRadius: isMobile ? '6px' : '8px',
          fontSize: isMobile ? '0.75rem' : '0.825rem',
          fontWeight: 800,
          color: GOLD,
          marginTop: isMobile ? '0.5rem' : '0.75rem',
          fontFamily: pp,
        }}
      >
        {testimonial.result}
      </div>
    </div>
  )

  return (
    <section
      style={{
        marginBottom: isMobile ? '2rem' : '3rem',
      }}
    >
      <h2
        style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 900,
          marginBottom: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffba09 0%, #ffd44d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: pp,
        }}
      >
        Real Results From Real Clients
      </h2>

      {/* TESTIMONIALS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
        }}
      >
        {testimonials.map((testimonial, index) => (
          <Testimonial
            key={index}
            testimonial={testimonial}
            isActive={activeTestimonial === index}
          />
        ))}
      </div>

      {/* MOBILE CAROUSEL DOTS */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
          }}
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              style={{
                width: activeTestimonial === index ? '28px' : '8px',
                height: '8px',
                background: activeTestimonial === index ? GOLD : 'rgba(255, 186, 9, 0.3)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
