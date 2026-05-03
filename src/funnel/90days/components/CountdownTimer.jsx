// src/funnel/90days/components/CountdownTimer.jsx

import React, { useState, useEffect } from 'react'

const GOLD = '#ffba09'
const GOLD_BRIGHT = '#ffd44d'

export default function CountdownTimer() {
  const isMobile = window.innerWidth <= 768
  const [time, setTime] = useState({
    days: 3,
    hours: 10,
    minutes: 44,
    seconds: 6,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        let { days, hours, minutes, seconds } = prevTime

        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else if (days > 0) {
          days--
          hours = 23
          minutes = 59
          seconds = 59
        }

        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const TimeUnit = ({ value, label }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '0.25rem' : '0.5rem',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 186, 9, 0.06)',
          border: `1.5px solid rgba(255, 186, 9, 0.2)`,
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem' : '1rem',
          minWidth: isMobile ? '52px' : '70px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ffba09 0%, #ffd44d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '1px',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <p
        style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0,
          fontWeight: 600,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {label}
      </p>
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'rgba(255, 186, 9, 0.04)',
        border: `1px solid rgba(255, 186, 9, 0.15)`,
        borderRadius: isMobile ? '12px' : '16px',
        backdropFilter: 'blur(10px)',
        margin: '0 auto',
        maxWidth: '500px',
        width: '100%',
      }}
    >
      <TimeUnit value={time.days} label="Days" />
      <TimeUnit value={time.hours} label="Hours" />
      <TimeUnit value={time.minutes} label="Minutes" />
      <TimeUnit value={time.seconds} label="Seconds" />
    </div>
  )
}
