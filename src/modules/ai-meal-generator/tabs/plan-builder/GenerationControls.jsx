// src/modules/ai-meal-generator/tabs/plan-builder/GenerationControls.jsx
// Generation controls - Generate button and progress display

import { Brain, Loader, AlertCircle } from 'lucide-react'

export default function GenerationControls({
  generating,
  generationStats,
  aiService,
  currentPlan,
  handleGeneratePlan,
  isMobile
}) {
  // Don't show button if plan already exists
  if (currentPlan) return null
  
  return (
    <>
      {/* Generate Button */}
      <button
        onClick={handleGeneratePlan}
        disabled={generating || !aiService}
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: generating || !aiService
            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          cursor: generating || !aiService ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          minHeight: '56px',
          touchAction: 'manipulation',
          transition: 'all 0.3s ease',
          boxShadow: generating || !aiService
            ? 'none'
            : '0 10px 25px rgba(16, 185, 129, 0.25)'
        }}
      >
        {generating ? (
          <>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            AI Plan Genereren...
          </>
        ) : !aiService ? (
          <>
            <AlertCircle size={24} />
            AI Service Laden...
          </>
        ) : (
          <>
            <Brain size={24} />
            Genereer AI Week Plan
          </>
        )}
      </button>
      
      {/* Generation Progress */}
      {generating && generationStats && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <span style={{
              fontSize: '0.9rem',
              color: generationStats.error ? '#ef4444' : 
                     generationStats.success ? '#10b981' : '#f59e0b',
              fontWeight: '600'
            }}>
              {generationStats.step}
            </span>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {generationStats.progress}%
            </span>
          </div>
          
          <div style={{
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${generationStats.progress}%`,
              background: generationStats.error 
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : generationStats.success
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
              transition: 'width 0.5s ease',
              borderRadius: '4px'
            }} />
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
