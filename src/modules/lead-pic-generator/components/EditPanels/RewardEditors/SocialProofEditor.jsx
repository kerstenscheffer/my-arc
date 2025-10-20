// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/SocialProofEditor.jsx
import React from 'react'
import ListEditor from '../shared/ListEditor'
import { TrendingUp, Star, Users } from 'lucide-react'

export default function SocialProofEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: '342 mensen pakten dit al',
    testimonials: [
      { user: '@markd92', text: 'Life changing! 💯' },
      { user: '@sarah_fit', text: 'Waarom gratis?! Dit is goud!' },
      { user: '@peter_gains', text: '3 weken en al resultaat 🔥' }
    ],
    cta: 'DM voor jouw exemplaar',
    stats: '98% geeft 5 sterren',
    ...content
  }
  
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
        borderBottom: '1px solid rgba(14, 165, 233, 0.2)'
      }}>
        <TrendingUp size={20} style={{ color: '#0ea5e9' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#0ea5e9'
        }}>
          SOCIAL PROOF TEMPLATE
        </span>
      </div>
      
      {/* Social Count */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <Users size={14} />
          Social Count Tekst
        </label>
        <input
          value={currentContent.title}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            title: e.target.value 
          })}
          placeholder="342 mensen pakten dit al"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Statistics Badge */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <Star size={14} />
          Statistieken Badge
        </label>
        <input
          value={currentContent.stats}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            stats: e.target.value 
          })}
          placeholder="98% geeft 5 sterren"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(251, 191, 36, 0.03))',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            color: '#f59e0b',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* Testimonials */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          <Star size={14} />
          Testimonials
        </label>
        <ListEditor
          items={currentContent.testimonials}
          onUpdate={(testimonials) => updateContent({ 
            ...currentContent, 
            testimonials 
          })}
          maxItems={5}
          minItems={2}
          itemType="testimonial"
          isMobile={isMobile}
        />
      </div>
      
      {/* CTA */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Call-to-Action
        </label>
        <input
          value={currentContent.cta}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            cta: e.target.value 
          })}
          placeholder="DM voor jouw exemplaar"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* Avatar Preview */}
      <div style={{
        padding: '15px',
        background: 'rgba(14, 165, 233, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(14, 165, 233, 0.2)'
      }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Avatar Preview
        </label>
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          {currentContent.testimonials.map((t, i) => (
            <div key={i} style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: [
                'linear-gradient(135deg, #10b981, #059669)',
                'linear-gradient(135deg, #3b82f6, #2563eb)',
                'linear-gradient(135deg, #f59e0b, #f97316)',
                'linear-gradient(135deg, #ec4899, #db2777)',
                'linear-gradient(135deg, #8b5cf6, #7c3aed)'
              ][i] || 'linear-gradient(135deg, #6b7280, #4b5563)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700',
              fontSize: '18px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}>
              {t.user[1]?.toUpperCase() || '?'}
            </div>
          ))}
        </div>
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(14, 165, 233, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Live Preview
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          position: 'relative'
        }}>
          {/* Stats Badge */}
          {currentContent.stats && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              ⭐ {currentContent.stats}
            </div>
          )}
          
          {/* Social Count */}
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#0ea5e9',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <TrendingUp size={20} />
            {currentContent.title}
          </div>
          
          {/* Testimonials */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
            maxWidth: '300px',
            margin: '0 auto 20px'
          }}>
            {currentContent.testimonials.map((testimonial, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: [
                    'linear-gradient(135deg, #10b981, #059669)',
                    'linear-gradient(135deg, #3b82f6, #2563eb)',
                    'linear-gradient(135deg, #f59e0b, #f97316)',
                    'linear-gradient(135deg, #ec4899, #db2777)',
                    'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  ][i] || '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {testimonial.user[1]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: '#0ea5e9',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}>
                    {testimonial.user}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: '1.4'
                  }}>
                    {testimonial.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '25px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}>
            {currentContent.cta}
          </div>
        </div>
      </div>
    </div>
  )
}
