// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanActionsBar.jsx
// Plan Actions — PDF download + WhatsApp — werkt met planMeta.id uit DB

import React, { useState } from 'react'
import { Download, MessageSquare, Loader } from 'lucide-react'
import { openMealPlanForPrint } from '../../mealplanhtmlgenerator'

export default function PlanActionsBar({ db, planMeta, clientRecord, isMobile }) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const m = isMobile

  if (!planMeta?.id) return null

  const handlePDF = async () => {
    setLoadingPdf(true)
    try {
      // Laad het volledige plan uit de DB — week_structure staat er al correct in
      const { data, error } = await db.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('id', planMeta.id)
        .single()

      if (error || !data) throw new Error('Plan laden mislukt')

      const clientName = clientRecord?.first_name || 'Client'
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekRange = `${today.toLocaleDateString('nl-NL')} - ${nextWeek.toLocaleDateString('nl-NL')}`

      await openMealPlanForPrint(data, clientName, weekRange)
    } catch (err) {
      console.error('❌ PDF fout:', err)
      alert('PDF maken mislukt. Probeer opnieuw.')
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleWhatsApp = () => {
    const name = clientRecord?.first_name || 'je'
    const phone = clientRecord?.phone || ''
    const planName = planMeta?.name || 'je nieuwe weekplan'

    const message = `Hey ${name}! Je nieuwe voedingsplan staat klaar in de MY ARC app: "${planName}". Open de app om het te bekijken. Vragen? Stuur me een berichtje! 💪`
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div style={{
      display: 'flex', gap: '0.25rem',
      padding: m ? '0.3rem 0.75rem' : '0.35rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(255,215,0,0.02)'
    }}>
      {/* PDF */}
      <button
        onClick={handlePDF}
        disabled={loadingPdf}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          padding: m ? '0.35rem 0.5rem' : '0.4rem 0.75rem',
          background: loadingPdf ? 'rgba(255,255,255,0.03)' : 'rgba(255,215,0,0.06)',
          border: `1px solid ${loadingPdf ? 'rgba(255,255,255,0.06)' : 'rgba(255,215,0,0.2)'}`,
          borderRadius: '4px', cursor: loadingPdf ? 'not-allowed' : 'pointer',
          color: loadingPdf ? 'rgba(255,255,255,0.2)' : '#FFD700',
          fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 700,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '32px', transition: 'all 0.15s ease',
          fontFamily: 'inherit'
        }}
      >
        {loadingPdf
          ? <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> PDF laden...</>
          : <><Download size={11} /> Download PDF</>
        }
      </button>

      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          padding: m ? '0.35rem 0.5rem' : '0.4rem 0.75rem',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '4px', cursor: 'pointer',
          color: '#10b981',
          fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 700,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '32px', transition: 'all 0.15s ease',
          fontFamily: 'inherit'
        }}
      >
        <MessageSquare size={11} /> WhatsApp
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
