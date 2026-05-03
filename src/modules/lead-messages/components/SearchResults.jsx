// src/modules/lead-messages/components/SearchResults.jsx
import React from 'react'
import { Search } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function SearchResults({ 
  results, 
  query, 
  copiedId, 
  onCopy, 
  onClearSearch 
}) {
  const isMobile = window.innerWidth <= 768

  if (!query || query.length < 2) {
    return null
  }

  if (results.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Search size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
          Geen resultaten voor "{query}"
        </p>
        <p style={{ fontSize: '0.85rem' }}>
          Probeer andere zoekwoorden zoals: voeding, bulk, cut, call, community
        </p>
        <button
          onClick={onClearSearch}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: '#10b981',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          Terug naar menu
        </button>
      </div>
    )
  }

  // Groepeer resultaten per sectie
  const groupedResults = results.reduce((acc, result) => {
    const section = result.sectionTitle
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(result)
    return acc
  }, {})

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px'
      }}>
        <div>
          <span style={{ color: '#10b981', fontWeight: '700' }}>
            {results.length} resultaten
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '0.5rem' }}>
            voor "{query}"
          </span>
        </div>
        <button
          onClick={onClearSearch}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          Wissen
        </button>
      </div>

      {Object.entries(groupedResults).map(([section, messages]) => (
        <div key={section} style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            📁 {section}
          </div>
          
          {messages.map(msg => (
            <MessageTemplate
              key={msg.id}
              id={msg.id}
              text={msg.text}
              label={msg.label}
              note={msg.note}
              copiedId={copiedId}
              onCopy={onCopy}
              color={msg.sectionColor}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
