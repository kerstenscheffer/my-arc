// src/components/Dashboard.jsx
// MY ARC Coach Dashboard - MET PROGRESS TAB
import CoachMealPlannerDashboard from '../coach/pages/CoachMealPlannerDashboard'
import CoachProgressDashboard from '../coach/pages/CoachProgressDashboard'

import { signOut } from '../lib/supabase'
import SchemaLibrary from './SchemaLibrary'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'
import AIGenerator from './AIGenerator'
import Goals from './Goals'
import ClientManager from './ClientManager'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      localStorage.removeItem('isClientMode')
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
    }
    setLoading(false)
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'plans', label: 'Plans', icon: '📋' },
    { id: 'ai-generator', label: 'AI Generator', icon: '🧠' },
    { id: 'schema-library', label: 'Schema Library', icon: '📚' },
    { id: 'meal-planner', label: 'Meal Planner PRO', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'goals', label: 'Goals', icon: '🎯' }
  ]

  if (loading) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{minHeight: '100vh'}}>
        <div className="myarc-loading">
          <div className="myarc-spinner"></div>
          <div className="myarc-text-white">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{minHeight: '100vh'}}>
        <div className="myarc-card">
          <h2 className="myarc-card-title">🚫 No user found</h2>
          <p className="myarc-text-gray">Please check your authentication</p>
        </div>
      </div>
    )
  }

  return (
    <div className="myarc-app">
      {/* Header */}
      <header className="myarc-header">
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
            {/* Mobile Menu Toggle */}
            <button 
              className="myarc-hamburger mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div>
              <h1 className="myarc-logo">MY ARC</h1>
              <p className="myarc-text-gray desktop-only">Personal Trainer Dashboard</p>
            </div>

            <div className="myarc-flex myarc-items-center myarc-gap-md">
              <div className="myarc-status-badge desktop-only">
                <span className="myarc-status-dot"></span>
                <span>Connected</span>
              </div>
              <div className="myarc-user-info desktop-only">
                <div className="myarc-user-email">{user.profile?.email || user.email}</div>
                <div className="myarc-user-role">{user.profile?.role || 'Coach'}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="myarc-btn myarc-btn-secondary myarc-btn-sm"
              >
                <span className="desktop-only">🚪 Logout</span>
                <span className="mobile-only">🚪</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="myarc-mobile-menu">
              <div className="myarc-flex myarc-flex-col myarc-gap-sm">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`myarc-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="myarc-main">
        <div className="myarc-container">
          <nav className="myarc-nav desktop-only">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`myarc-nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="dashboard-content">
            {activeTab === 'overview' && <OverviewTab user={user} />}
            {activeTab === 'clients' && <ClientManager />}
            {activeTab === 'progress' && <CoachProgressDashboard user={user} />}
            {activeTab === 'plans' && <PlansTab />}
            {activeTab === 'ai-generator' && <AIGenerator />}
            {activeTab === 'schema-library' && <SchemaLibrary />}
            {activeTab === 'meal-planner' && <CoachMealPlannerDashboard />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'goals' && <Goals user={user} />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="myarc-mobile-nav mobile-only">
        <div className="myarc-mobile-nav-items">
          {navigationItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`myarc-mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ user }) {
  const stats = [
    { label: 'Active Clients', value: '12', icon: '👥', color: 'green' },
    { label: 'Workout Plans', value: '28', icon: '📋', color: 'blue' },
    { label: 'AI Generated', value: '8', icon: '🧠', color: 'purple' },
    { label: 'This Month', value: '156', icon: '📈', color: 'yellow' }
  ]

  const recentActivities = [
    { icon: '✅', badge: 'New', title: 'Sarah completed "Push Day A"', time: '2 hours ago' },
    { icon: '🧠', badge: 'AI', title: 'Generated hypertrophy plan for Mike', time: '4 hours ago' },
    { icon: '🔄', badge: 'Update', title: 'Emma requested plan modification', time: '1 day ago' }
  ]

  return (
    <div className="myarc-animate-in">
      <div className="myarc-flex myarc-items-center myarc-justify-between myarc-mb-xl">
        <h2 className="myarc-card-title">Dashboard Overview</h2>
        <button className="myarc-btn myarc-btn-primary">
          ➕ New Client
        </button>
      </div>

      {/* Stats Grid */}
      <div className="myarc-grid myarc-grid-4 myarc-mb-xl">
        {stats.map((stat, index) => (
          <div key={index} className="myarc-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{stat.icon}</div>
            <div className="myarc-text-green" style={{fontSize: '1.8rem', fontWeight: 'bold'}}>
              {stat.value}
            </div>
            <div className="myarc-text-gray">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="myarc-card">
        <div className="myarc-card-header">
          <h3 className="myarc-card-title">Recent Activity</h3>
          <p className="myarc-card-subtitle">Latest updates from your clients</p>
        </div>
        
        <div className="myarc-flex myarc-flex-col myarc-gap-lg">
          {recentActivities.map((activity, index) => (
            <div key={index} className="myarc-flex myarc-items-center myarc-gap-md" style={{
              padding: '1rem',
              background: 'rgba(17, 17, 17, 0.5)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{fontSize: '1.5rem'}}>{activity.icon}</div>
              <div style={{flex: 1}}>
                <div className="myarc-text-white">{activity.title}</div>
                <div className="myarc-text-gray" style={{fontSize: '0.875rem'}}>{activity.time}</div>
              </div>
              <span className={`myarc-badge myarc-badge-${
                activity.badge === 'New' ? 'success' : 
                activity.badge === 'AI' ? 'info' : 'warning'
              }`}>
                {activity.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Plans Tab Component
function PlansTab() {
  return (
    <div className="myarc-card myarc-animate-in">
      <div className="myarc-card-header">
        <h2 className="myarc-card-title">📋 Workout Plans</h2>
        <p className="myarc-card-subtitle">Your workout plan library</p>
      </div>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-6)'}}>📚</div>
        <p className="myarc-text-gray myarc-mb-lg">Plan library coming soon...</p>
        <button className="myarc-btn myarc-btn-secondary">
          🧠 Generate with AI
        </button>
      </div>
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab() {
  return (
    <div className="myarc-card myarc-animate-in">
      <div className="myarc-card-header">
        <h2 className="myarc-card-title">📈 Analytics</h2>
        <p className="myarc-card-subtitle">Track your coaching performance</p>
      </div>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-6)'}}>📊</div>
        <p className="myarc-text-gray myarc-mb-lg">Analytics dashboard coming soon...</p>
        <p className="myarc-text-gray" style={{fontSize: 'var(--text-sm)'}}>Track client progress, plan effectiveness, and business metrics</p>
      </div>
    </div>
  )
}
