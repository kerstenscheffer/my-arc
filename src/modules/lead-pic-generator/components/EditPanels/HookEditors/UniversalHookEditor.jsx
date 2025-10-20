// src/modules/lead-pic-generator/components/EditPanels/HookEditors/UniversalHookEditor.jsx
import React from 'react'
import { Type, Hash, AlertTriangle, TrendingUp, HelpCircle, XCircle } from 'lucide-react'

const TEMPLATE_CONFIG = {
  'statement': {
    icon: Hash,
    color: '#10b981',
    name: 'STATEMENT',
    mainPlaceholder: "5 Regels om\nFitness Bullshit\nte Herkennen",
    subPlaceholder: "DE WAARHEID",
    tips: "Gebruik sterke, declaratieve statements. Splits over meerdere regels met \\n."
  },
  'problem': {
    icon: AlertTriangle,
    color: '#ef4444',
    name: 'PROBLEM',
    mainPlaceholder: "Tegenstrijdige\nFitness Info\nOveral",
    subPlaceholder: "PROBLEEM",
    tips: "Focus op het probleem dat je doelgroep ervaart. Maak het herkenbaar."
  },
  'beforeafter': {
    icon: TrendingUp,
    color: '#3b82f6',
    name: 'BEFORE/AFTER',
    mainPlaceholder: "Van Verward\nNaar Expert\nin 30 Dagen",
    subPlaceholder: "IN 30 DAGEN",
    tips: "Laat de transformatie zien. Van [negatief] naar [positief]."
  },
  'question': {
    icon: HelpCircle,
    color: '#f59e0b',
    name: 'QUESTION',
    mainPlaceholder: "Weet Jij\nWat Echt\nWerkt?",
    subPlaceholder: "VRAAG AAN JOU",
    tips: "Stel een provocerende vraag die de kijker laat nadenken."
  },
  'mistake': {
    icon: XCircle,
    color: '#8b5cf6',
    name: 'MISTAKE',
    mainPlaceholder: "Alles Door\nElkaar\nProberen",
    subPlaceholder: "DE GROOTSTE FOUT",
    tips: "Benoem de grootste fout die mensen maken. Wees specifiek."
  }
}

export default function UniversalHookEditor({ 
  selectedTemplate = 'statement',
  content, 
  updateContent, 
  isMobile 
}) {
  
  const config = TEMPLATE_CONFIG[selectedTemplate] || TEMPLATE_CONFIG.statement
  const Icon = config.icon
  
  const currentContent = {
    mainText: config.mainPlaceholder,
    subheaderText: config.subPlaceholder,
    ...content
  }
  
  // Count lines in main text
  const lineCount = currentContent.mainText.split('\n').length
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '10px',
        borderBottom: `1px solid ${config.color}30`
      }}>
        <Icon size={20} style={{ color: config.color }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: config.color
        }}>
          {config.name} HOOK
        </span>
      </div>
      
      {/* Tips Box */}
      <div style={{
        padding: '12px',
        background: `${config.color}10`,
        borderRadius: '10px',
        border: `1px solid ${config.color}20`,
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>!</span>
        </div>
        <div>{config.tips}</div>
      </div>
      
      {/* Subheader Text (small text above) */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Subheader (kleine tekst boven)
        </label>
        <input
          value={currentContent.subheaderText}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            subheaderText: e.target.value.toUpperCase()
          })}
          placeholder={config.subPlaceholder}
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${config.color}30`,
            borderRadius: '10px',
            color: config.color,
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            outline: 'none',
            textAlign: 'center'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `${config.color}60`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = `${config.color}30`
          }}
        />
      </div>
      
      {/* Main Text */}
      <div>
        <label style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <span>Hoofdtekst (gebruik \n voor nieuwe regel)</span>
          <span style={{
            fontSize: '12px',
            color: `${config.color}`,
            fontWeight: '600'
          }}>
            {lineCount} {lineCount === 1 ? 'regel' : 'regels'}
          </span>
        </label>
        <textarea
          value={currentContent.mainText}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            mainText: e.target.value 
          })}
          placeholder={config.mainPlaceholder}
          rows={5}
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${config.color}30`,
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '700',
            lineHeight: '1.3',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'monospace'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `${config.color}60`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = `${config.color}30`
          }}
        />
        <div style={{
          marginTop: '6px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Tip: Gebruik \n voor line breaks. Voorbeeld: "Eerste regel\nTweede regel\nDerde regel"
        </div>
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: `linear-gradient(135deg, ${config.color}10 0%, ${config.color}05 100%)`,
        borderRadius: '12px',
        border: `1px solid ${config.color}20`
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Live Preview - {config.name}
        </div>
        
        <div style={{
          padding: '30px 20px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95))',
          borderRadius: '8px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Gradient overlay effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: `linear-gradient(180deg, ${config.color}20, transparent)`,
            pointerEvents: 'none'
          }} />
          
          {/* Icon watermark */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            opacity: 0.1
          }}>
            <Icon size={60} style={{ color: config.color }} />
          </div>
          
          {/* Subheader */}
          {currentContent.subheaderText && (
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '3px',
              color: config.color,
              marginBottom: '12px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '30px',
                height: '1px',
                background: config.color,
                opacity: 0.5
              }} />
              {currentContent.subheaderText}
              <div style={{
                width: '30px',
                height: '1px',
                background: config.color,
                opacity: 0.5
              }} />
            </div>
          )}
          
          {/* Main Text */}
          <div style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '900',
            lineHeight: '1.2',
            color: '#fff',
            whiteSpace: 'pre-line',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            {currentContent.mainText}
          </div>
          
          {/* Template type badge */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            padding: '4px 8px',
            background: `${config.color}20`,
            borderRadius: '6px',
            fontSize: '10px',
            color: config.color,
            fontWeight: '700',
            letterSpacing: '1px'
          }}>
            {config.name}
          </div>
        </div>
      </div>
    </div>
  )
}
