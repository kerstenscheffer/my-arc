// src/modules/manual-workout-builder/components/PDFExportButton.jsx
import { useState } from 'react'
import { Download, FileText, Loader } from 'lucide-react'
import { getWorkoutPDFService } from '../services/WorkoutPDFService'

export default function PDFExportButton({ workoutPlan, db, isMobile = window.innerWidth <= 768 }) {
  const [exporting, setExporting] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleExport = async () => {
    if (!workoutPlan || !workoutPlan.name || workoutPlan.days.length === 0) {
      alert('Voeg eerst dagen en oefeningen toe voordat je exporteert')
      return
    }

    setExporting(true)
    setShowTooltip(false)

    try {
      const pdfService = getWorkoutPDFService(db)
      
      // Validate first
      const validation = pdfService.validateWorkoutPlan(workoutPlan)
      if (!validation.valid) {
        alert('Workout plan heeft problemen:\n' + validation.errors.join('\n'))
        setExporting(false)
        return
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Warnings:', validation.warnings)
      }

      // Generate PDF
      await pdfService.generatePDF(workoutPlan, {
        clientName: 'Client', // Could be dynamic
        coachName: 'Coach K', // Could be from user profile
        includeNotes: true
      })

    } catch (error) {
      console.error('Export error:', error)
      alert('Fout bij exporteren: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  // Don't show button if no workout plan
  if (!workoutPlan || workoutPlan.days.length === 0) {
    return null
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        onMouseEnter={() => !isMobile && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '30px',
          right: isMobile ? '20px' : '30px',
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '50%',
          background: exporting 
            ? 'rgba(255, 255, 255, 0.1)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: exporting
            ? '0 4px 16px rgba(16, 185, 129, 0.2)'
            : '0 8px 32px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: exporting ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateZ(0)',
          zIndex: 1000,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isMobile && !exporting) {
            e.currentTarget.style.transform = 'scale(1.1) translateZ(0)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'scale(1) translateZ(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile && !exporting) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {exporting ? (
          <Loader 
            size={isMobile ? 24 : 28} 
            color="#10b981"
            style={{
              animation: 'spin 1s linear infinite'
            }}
          />
        ) : (
          <div style={{ position: 'relative' }}>
            <FileText 
              size={isMobile ? 24 : 28} 
              color="#fff"
              strokeWidth={2.5}
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
              }}
            />
            <Download 
              size={isMobile ? 12 : 14} 
              color="#fff"
              strokeWidth={3}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.5))'
              }}
            />
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !exporting && !isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: '110px',
            right: '30px',
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1001,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          Export naar PDF
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
