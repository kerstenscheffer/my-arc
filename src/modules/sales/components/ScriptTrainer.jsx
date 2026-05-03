// src/modules/sales/components/ScriptTrainer.jsx
// Script Trainer - Practice sales scripts met blackout functionaliteit
// Gebaseerd op MY ARC HTML trainer

import { useState, useEffect } from 'react'
import { Play, RotateCcw, Zap, Users } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

export default function ScriptTrainer({ db, isMobile }) {
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(true)
  const [blackedWords, setBlackedWords] = useState(new Set())
  const [blackedLines, setBlackedLines] = useState(new Set())
  const [totalWords, setTotalWords] = useState(0)
  const [totalLines, setTotalLines] = useState(0)

  // Load default script
  useEffect(() => {
    loadDefaultScript()
  }, [])

  const loadDefaultScript = async () => {
    setLoading(true)
    try {
      // Load template script
      const { data, error } = await db.supabase
        .from('sales_scripts')
        .select('*')
        .eq('is_template', true)
        .eq('title', 'MY ARC Sales Call Script')
        .single()

      if (error) throw error
      
      if (data && data.content) {
        setScript(data.content)
        calculateTotals(data.content)
      }
    } catch (error) {
      console.error('Failed to load script:', error)
      // Fallback to empty
      setScript([])
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (content) => {
    let words = 0
    let lines = 0

    content.forEach(item => {
      if (item.type === 'jij' || item.type === 'vraag') {
        const wordCount = item.text.split(' ').length
        words += wordCount
        if (item.type === 'jij') lines++
      }
    })

    setTotalWords(words)
    setTotalLines(lines)
  }

  const toggleWord = (lineIndex, wordIndex) => {
    const key = `${lineIndex}-${wordIndex}`
    setBlackedWords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const toggleLine = (lineIndex) => {
    const line = script[lineIndex]
    if (!line || !line.text) return

    const words = line.text.split(' ')
    const lineKey = `line-${lineIndex}`
    
    // Check if line is fully blacked
    const isFullyBlacked = words.every((_, wordIndex) => 
      blackedWords.has(`${lineIndex}-${wordIndex}`)
    )

    if (isFullyBlacked) {
      // Unblack all words
      setBlackedWords(prev => {
        const newSet = new Set(prev)
        words.forEach((_, wordIndex) => {
          newSet.delete(`${lineIndex}-${wordIndex}`)
        })
        return newSet
      })
      setBlackedLines(prev => {
        const newSet = new Set(prev)
        newSet.delete(lineKey)
        return newSet
      })
    } else {
      // Black all words
      setBlackedWords(prev => {
        const newSet = new Set(prev)
        words.forEach((_, wordIndex) => {
          newSet.add(`${lineIndex}-${wordIndex}`)
        })
        return newSet
      })
      setBlackedLines(prev => new Set(prev).add(lineKey))
    }
  }

  const randomWord = () => {
    if (!script) return
    
    const availableWords = []
    script.forEach((item, lineIndex) => {
      if (item.type === 'jij' || item.type === 'vraag') {
        const words = item.text.split(' ')
        words.forEach((_, wordIndex) => {
          const key = `${lineIndex}-${wordIndex}`
          if (!blackedWords.has(key)) {
            availableWords.push(key)
          }
        })
      }
    })

    if (availableWords.length > 0) {
      const randomKey = availableWords[Math.floor(Math.random() * availableWords.length)]
      setBlackedWords(prev => new Set(prev).add(randomKey))
    }
  }

  const randomLine = () => {
    if (!script) return

    const availableLines = []
    script.forEach((item, index) => {
      if (item.type === 'jij') {
        const words = item.text.split(' ')
        const hasUnblackedWords = words.some((_, wordIndex) => 
          !blackedWords.has(`${index}-${wordIndex}`)
        )
        if (hasUnblackedWords) {
          availableLines.push(index)
        }
      }
    })

    if (availableLines.length > 0) {
      const randomIndex = availableLines[Math.floor(Math.random() * availableLines.length)]
      toggleLine(randomIndex)
    }
  }

  const resetAll = () => {
    setBlackedWords(new Set())
    setBlackedLines(new Set())
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${SALES_THEME.border}`,
            borderTopColor: SALES_THEME.primary,
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Script laden...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!script || script.length === 0) {
    return (
      <div style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Geen script gevonden</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Er is geen default script beschikbaar
        </p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      paddingBottom: isMobile ? '80px' : '40px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: '900',
          background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          Script Trainer
        </h2>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: '500'
        }}>
          Klik op woorden of het icoon voor hele zinnen
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={randomWord}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
            background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.4) 100%)`,
            border: `1px solid ${SALES_THEME.border}`,
            borderRadius: '8px',
            color: SALES_THEME.primary,
            fontWeight: '700',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          <Zap size={isMobile ? 14 : 16} />
          Random Woord
        </button>

        <button
          onClick={randomLine}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
            background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.4) 100%)`,
            border: `1px solid ${SALES_THEME.border}`,
            borderRadius: '8px',
            color: SALES_THEME.primary,
            fontWeight: '700',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          <Users size={isMobile ? 14 : 16} />
          Random Zin
        </button>

        <button
          onClick={resetAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#ef4444',
            fontWeight: '700',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          <RotateCcw size={isMobile ? 14 : 16} />
          Reset
        </button>
      </div>

      {/* Counter */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${SALES_THEME.border}`,
        borderRadius: '10px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            Woorden
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: SALES_THEME.primary,
            fontWeight: '700'
          }}>
            {blackedWords.size} / {totalWords}
          </div>
        </div>

        <div style={{
          width: '1px',
          background: 'rgba(255, 255, 255, 0.1)'
        }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            Zinnen
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: SALES_THEME.primary,
            fontWeight: '700'
          }}>
            {blackedLines.size} / {totalLines}
          </div>
        </div>
      </div>

      {/* Script Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {script.map((item, lineIndex) => {
          if (item.phase) {
            return (
              <div
                key={lineIndex}
                style={{
                  background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
                  color: '#000',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: '900',
                  marginTop: lineIndex === 0 ? 0 : (isMobile ? '2rem' : '3rem'),
                  marginBottom: isMobile ? '1rem' : '1.5rem',
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderRadius: '8px',
                  boxShadow: `0 4px 16px ${SALES_THEME.glow}`
                }}
              >
                {item.phase}
              </div>
            )
          }

          return (
            <ScriptLine
              key={lineIndex}
              item={item}
              lineIndex={lineIndex}
              blackedWords={blackedWords}
              onToggleWord={toggleWord}
              onToggleLine={toggleLine}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}

// Script Line Component
function ScriptLine({ item, lineIndex, blackedWords, onToggleWord, onToggleLine, isMobile }) {
  const getLineStyle = () => {
    const base = {
      marginBottom: '1rem',
      padding: isMobile ? '10px 12px' : '12px 16px',
      borderRadius: '8px',
      borderLeft: '3px solid',
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(23, 23, 23, 0.4) 100%)',
      backdropFilter: 'blur(8px)',
      position: 'relative'
    }

    switch (item.type) {
      case 'jij':
        return {
          ...base,
          borderLeftColor: SALES_THEME.primary,
          background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(212, 160, 6, 0.04) 100%)`,
          paddingRight: isMobile ? '40px' : '50px'
        }
      case 'antwoord':
        return {
          ...base,
          borderLeftColor: 'rgba(255, 255, 255, 0.2)',
          background: 'rgba(23, 23, 23, 0.3)',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.35)',
          fontStyle: 'italic',
          paddingLeft: isMobile ? '1.5rem' : '2rem'
        }
      case 'instructie':
        return {
          ...base,
          borderLeftColor: '#f97316',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
          color: '#fb923c',
          fontStyle: 'italic',
          fontSize: isMobile ? '0.8rem' : '0.875rem'
        }
      case 'vraag':
        return {
          ...base,
          borderLeftColor: '#3b82f6',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
          color: '#60a5fa',
          paddingRight: isMobile ? '40px' : '50px'
        }
      default:
        return base
    }
  }

  if (item.type === 'jij' || item.type === 'vraag') {
    const words = item.text.split(' ')

    return (
      <div style={getLineStyle()}>
        {words.map((word, wordIndex) => {
          const isBlacked = blackedWords.has(`${lineIndex}-${wordIndex}`)
          
          return (
            <span key={wordIndex}>
              <span
                onClick={() => onToggleWord(lineIndex, wordIndex)}
                style={{
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  transition: 'all 0.2s ease',
                  background: isBlacked ? SALES_THEME.background : 'transparent',
                  color: isBlacked ? 'transparent' : 'inherit',
                  userSelect: isBlacked ? 'none' : 'auto'
                }}
              >
                {word}
              </span>
              {wordIndex < words.length - 1 && ' '}
            </span>
          )
        })}

        {/* Line blackout icon */}
        {item.type === 'jij' && (
          <div
            onClick={() => onToggleLine(lineIndex)}
            style={{
              position: 'absolute',
              top: '50%',
              right: isMobile ? '12px' : '16px',
              transform: 'translateY(-50%)',
              width: isMobile ? '20px' : '24px',
              height: isMobile ? '20px' : '24px',
              borderRadius: '50%',
              background: SALES_THEME.background,
              border: `1px solid ${SALES_THEME.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              width: isMobile ? '8px' : '10px',
              height: isMobile ? '8px' : '10px',
              borderRadius: '50%',
              border: `2px solid ${SALES_THEME.primary}`
            }} />
          </div>
        )}
      </div>
    )
  }

  // Simple text lines (antwoord, instructie)
  return (
    <div style={getLineStyle()}>
      {item.text}
    </div>
  )
}
