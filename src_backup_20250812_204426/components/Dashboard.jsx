import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'
import AIGenerator from './AIGenerator'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="workapp-container workapp-flex items-center justify-center">
        <div className="workapp-loading">
          <div className="workapp-spinner"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="workapp-container workapp-flex items-center justify-center">
        <div className="workapp-card">
          <h2 className="workapp-card-title">🚫 No user found</h2>
          <p className="workapp-text-muted">Please check your authentication</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workapp-container">
      {/* Header */}
      <header className="workapp-header">
        <div className="workapp-flex workapp-items-center workapp-justify-between">
          <div>
            <h1 className="text-2xl font-bold workapp-text-accent">🏋️ WORKAPP</h1>
            <p className="workapp-text-muted">Personal Trainer Dashboard</p>
          </div>
          <div className="workapp-flex workapp-items-center workapp-gap-md">
            <span className="workapp-badge workapp-badge-success">
              ✅ Connected
            </span>
            <div className="text-sm">
              <div className="workapp-text-primary">{user.profile.email}</div>
              <div className="workapp-text-muted capitalize">{user.profile.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="workapp-main">
        <nav className="workapp-nav workapp-mb-lg">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`workapp-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`workapp-nav-item ${activeTab === 'clients' ? 'active' : ''}`}
          >
            👥 Clients
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`workapp-nav-item ${activeTab === 'plans' ? 'active' : ''}`}
          >
            📋 Plans
          </button>
          <button 
            onClick={() => setActiveTab('ai-generator')}
            className={`workapp-nav-item ${activeTab === 'ai-generator' ? 'active' : ''}`}
          >
            🧠 AI Generator
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`workapp-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            📈 Analytics
          </button>
        </nav>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'clients' && <ClientsTab />}
          {activeTab === 'plans' && <PlansTab />}
          {activeTab === 'ai-generator' && <AIGenerator />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ user }) {
  const stats = [
    { label: 'Active Clients', value: '12', icon: '👥' },
    { label: 'Workout Plans', value: '28', icon: '📋' },
    { label: 'AI Generated', value: '8', icon: '🧠' },
    { label: 'This Month', value: '156', icon: '📈' },
  ]

  return (
    <div>
      <div className="workapp-flex workapp-items-center workapp-justify-between workapp-mb-lg">
        <h2 className="text-xl font-bold workapp-text-primary">Dashboard Overview</h2>
        <button className="workapp-btn workapp-btn-primary">
          ➕ New Client
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <div key={index} className="dashboard-stat-card">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <span className="dashboard-stat-number">{stat.value}</span>
            <div className="dashboard-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="workapp-mt-lg">
        <div className="workapp-card">
          <div className="workapp-card-header">
            <h3 className="workapp-card-title">Recent Activity</h3>
            <p className="workapp-card-subtitle">Latest updates from your clients</p>
          </div>
          
          <div className="space-y-4">
            <div className="workapp-flex workapp-items-center workapp-gap-md">
              <div className="workapp-badge workapp-badge-success">New</div>
              <div className="flex-1">
                <div className="workapp-text-primary">Sarah completed "Push Day A"</div>
                <div className="workapp-text-muted text-sm">2 hours ago</div>
              </div>
            </div>
            
            <div className="workapp-flex workapp-items-center workapp-gap-md">
              <div className="workapp-badge workapp-badge-info">AI</div>
              <div className="flex-1">
                <div className="workapp-text-primary">Generated hypertrophy plan for Mike</div>
                <div className="workapp-text-muted text-sm">4 hours ago</div>
              </div>
            </div>
            
            <div className="workapp-flex workapp-items-center workapp-gap-md">
              <div className="workapp-badge workapp-badge-warning">Update</div>
              <div className="flex-1">
                <div className="workapp-text-primary">Emma requested plan modification</div>
                <div className="workapp-text-muted text-sm">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder Components
function ClientsTab() {
  return (
    <div className="workapp-card">
      <div className="workapp-card-header">
        <h2 className="workapp-card-title">👥 Client Management</h2>
        <p className="workapp-card-subtitle">Manage your personal training clients</p>
      </div>
      <div className="text-center workapp-text-muted">
        <div className="text-4xl mb-4">🚧</div>
        <p>Client management coming soon...</p>
        <button className="workapp-btn workapp-btn-primary workapp-mt-lg">
          ➕ Add First Client
        </button>
      </div>
    </div>
  )
}

function PlansTab() {
  return (
    <div className="workapp-card">
      <div className="workapp-card-header">
        <h2 className="workapp-card-title">📋 Workout Plans</h2>
        <p className="workapp-card-subtitle">Your workout plan library</p>
      </div>
      <div className="text-center workapp-text-muted">
        <div className="text-4xl mb-4">📚</div>
        <p>Plan library coming soon...</p>
        <button className="workapp-btn workapp-btn-secondary workapp-mt-lg">
          🧠 Generate with AI
        </button>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="workapp-card">
      <div className="workapp-card-header">
        <h2 className="workapp-card-title">📈 Analytics</h2>
        <p className="workapp-card-subtitle">Track your coaching performance</p>
      </div>
      <div className="text-center workapp-text-muted">
        <div className="text-4xl mb-4">📊</div>
        <p>Analytics dashboard coming soon...</p>
        <p className="text-sm workapp-mt-lg">Track client progress, plan effectiveness, and business metrics</p>
      </div>
    </div>
  )
}
