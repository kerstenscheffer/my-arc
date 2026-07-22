// src/modules/plan-wizard/PlanWizardHub.jsx
// Wrapper that adds a SOP tab next to the Plan Wizard

import { useState } from 'react'
import PlanWizard from './PlanWizard'
import PlanSOPWizard from './PlanSOPWizard'

const TABS = [
  { id: 'wizard', label: 'Plan Wizard' },
  { id: 'sop', label: 'SOP Stappenplan' },
]

export default function PlanWizardHub({ db, clients }) {
  const [activeTab, setActiveTab] = useState('wizard')

  const gold = '#FFD700'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)' }}>
      {/* Sub-tab bar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.75rem 1.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0a0a',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isActive ? 'rgba(255,215,0,0.12)' : 'transparent',
                color: isActive ? gold : 'rgba(255,255,255,0.45)',
                fontSize: '0.85rem',
                fontWeight: isActive ? '700' : '400',
                cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${gold}` : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {activeTab === 'wizard' && <PlanWizard db={db} clients={clients} />}
        {activeTab === 'sop' && <PlanSOPWizard db={db} clients={clients} />}
      </div>
    </div>
  )
}
