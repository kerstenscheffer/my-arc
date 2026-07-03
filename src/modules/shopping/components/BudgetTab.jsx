// src/modules/shopping/components/BudgetTab.jsx - BUDGET DASHBOARD
import React, { useState, useEffect } from 'react'
import { TrendingDown, Calendar, Settings } from 'lucide-react'
import BudgetService from '../BudgetService'
import BudgetOnboarding from './BudgetOnboarding'

export default function BudgetTab({ client, db, planCost, isMobile }) {
  const [budgetService] = useState(() => new BudgetService(db))
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    loadData()
  }, [client?.id])

  const loadData = async () => {
    setLoading(true)
    const data = await budgetService.getDashboardData(client.id, planCost || 0)
    setDashboardData(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(255, 215, 0, 0.15)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    )
  }

  // No baseline yet — show onboarding
  if (!dashboardData?.hasBaseline || showSetup) {
    return (
      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '0.625rem 0' : '0.75rem 0',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: 800,
            color: '#FFD700',
            letterSpacing: '-0.02em'
          }}>
            {showSetup ? 'Budget Aanpassen' : 'Hoeveel bespaar jij?'}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '0.15rem'
          }}>
            {showSetup ? 'Pas je huidige uitgaven aan' : 'Vul in wat je nu uitgeeft, wij laten zien hoeveel je bespaart'}
          </div>
        </div>

        <BudgetOnboarding
          clientId={client.id}
          budgetService={budgetService}
          onComplete={() => { setShowSetup(false); loadData() }}
          isMobile={isMobile}
        />
      </div>
    )
  }

  const { savings, cumulative, baseline } = dashboardData

  return (
    <div>
      {/* ── HERO: TOTAL SAVED ── */}
      {cumulative.totalSaved > 0 && (
        <div style={{
          padding: isMobile ? '1rem 0.75rem' : '1.25rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.4rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.25rem'
          }}>
            Totaal bespaard in {cumulative.weekCount} {cumulative.weekCount === 1 ? 'week' : 'weken'}
          </div>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: 800,
            color: '#FFD700',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}>
            €{cumulative.totalSaved.toFixed(0)}
          </div>
        </div>
      )}

      {/* ── WEEKLY COMPARISON ── */}
      {savings && (
        <div>
          {/* Before vs After */}
          <div style={{ display: 'flex' }}>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem',
              borderRight: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
                Voorheen
              </div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>
                €{savings.baseline}
                <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.5, marginLeft: '0.05rem' }}>/w</span>
              </div>
            </div>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem',
              borderRight: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
                Nu met MY ARC
              </div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>
                €{savings.planCost}
                <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.5, marginLeft: '0.05rem' }}>/w</span>
              </div>
            </div>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem'
            }}>
              <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
                Besparing
              </div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>
                €{savings.weekly}
                <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.5, marginLeft: '0.05rem' }}>/w</span>
              </div>
            </div>
          </div>

          {/* Lifetime projections */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 215, 0, 0.02)'
          }}>
            {[
              { label: 'Per maand', value: `€${savings.monthly}` },
              { label: 'Per jaar', value: `€${savings.yearly}` },
              { label: '5 jaar', value: `€${savings.fiveYear}` },
              { label: '10 jaar', value: `€${savings.tenYear}` }
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem',
                borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
              }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 800, color: 'rgba(255, 215, 0, 0.7)', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BREAKDOWN ── */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{
          fontSize: '0.4rem',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.5rem'
        }}>
          Waar je op bespaart
        </div>

        {[
          { label: 'Boodschappen', before: `€${baseline.groceries}`, after: `€${Math.round(planCost)}`, saved: baseline.groceries > planCost ? `€${Math.round(baseline.groceries - planCost)}` : '—' },
          ...(baseline.lunchOut > 0 ? [{ label: 'Lunch buiten de deur', before: `€${baseline.lunchOut}`, after: '€0', saved: `€${baseline.lunchOut}` }] : []),
          ...(baseline.delivery > 0 ? [{ label: 'Bezorgdiensten', before: `€${baseline.delivery}`, after: '€0', saved: `€${baseline.delivery}` }] : [])
        ].map((row, idx, arr) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.3rem 0',
            borderBottom: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', flex: 1 }}>{row.label}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.2)', width: '40px', textAlign: 'right', textDecoration: 'line-through' }}>{row.before}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', width: '40px', textAlign: 'right' }}>{row.after}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', width: '50px', textAlign: 'right' }}>+{row.saved}</span>
          </div>
        ))}
      </div>

      {/* ── WEEK HISTORY ── */}
      {cumulative.history.length > 0 && (
        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem'
        }}>
          <div style={{
            fontSize: '0.4rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem'
          }}>
            Week historie
          </div>

          {cumulative.history.slice(-8).map((week, idx, arr) => (
            <div key={week.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.3rem 0',
              borderBottom: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
            }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600 }}>
                {new Date(week.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700' }}>
                +€{parseFloat(week.saved_amount).toFixed(0)}
              </span>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.2)' }}>
                cum. €{parseFloat(week.cumulative_saved).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── EDIT BUTTON ── */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <button
          onClick={() => setShowSetup(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.625rem',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '0.6rem',
            fontWeight: 600,
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none'
          }}
        >
          <Settings size={11} strokeWidth={2} />
          Budget aanpassen
        </button>
      </div>
    </div>
  )
}
