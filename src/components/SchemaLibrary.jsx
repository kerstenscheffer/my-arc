import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService
import { getUserWorkoutSchemas, convertDbSchemaToApp } from '../lib/schemaDatabase'

export default function SchemaLibrary() {
  const [schemas, setSchemas] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  // Test function to load schemas from database
  const testLoadSchemas = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Getting current user...')
      const currentUser = await db.getCurrentUser()
      console.log('✅ User found:', currentUser)
      setUser(currentUser)
      
      if (currentUser) {
        console.log('📚 Loading schemas for user:', currentUser.id)
        const dbSchemas = await getUserWorkoutSchemas(currentUser.id)
        console.log('🗃️ Raw database schemas:', dbSchemas)
        
        const appSchemas = dbSchemas.map(convertDbSchemaToApp)
        console.log('✨ Converted app schemas:', appSchemas)
        
        setSchemas(appSchemas)
      } else {
        setError('No user found - please log in')
      }
    } catch (error) {
      console.error('❌ Error loading schemas:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto load on component mount
  useEffect(() => {
    testLoadSchemas()
  }, [])

  return (
    <div className="workapp-container">
      <div className="workapp-animate-in">
        <h1 className="text-2xl font-bold workapp-text-accent workapp-mb-lg">
          📚 Schema Library Test
        </h1>
        <p className="workapp-text-muted workapp-mb-lg">
          Testing database schema retrieval functionality
        </p>

        {/* Control Panel */}
        <div className="workapp-card workapp-mb-lg">
          <div className="workapp-card-header">
            <h3 className="workapp-card-title">🧪 Database Test Controls</h3>
          </div>
          
          <div className="workapp-flex workapp-gap-md workapp-mb-lg">
            <button 
              onClick={testLoadSchemas} 
              disabled={loading}
              className="workapp-btn workapp-btn-primary"
            >
              {loading ? (
                <>
                  <div className="workapp-spinner"></div>
                  Loading...
                </>
              ) : (
                '🔍 Reload Schemas from Database'
              )}
            </button>
            
            <button 
              onClick={() => {
                setSchemas([])
                setError(null)
              }}
              className="workapp-btn workapp-btn-secondary"
            >
              🗑️ Clear Results
            </button>
          </div>

          {/* Status Display */}
          <div className="workapp-flex workapp-flex-col workapp-gap-sm">
            <div className="workapp-flex workapp-items-center workapp-gap-md">
              <span className="workapp-text-muted">User Status:</span>
              <span className={user ? "workapp-badge workapp-badge-success" : "workapp-badge workapp-badge-warning"}>
                {user ? `✅ ${user.profile?.email}` : '❌ Not logged in'}
              </span>
            </div>
            
            <div className="workapp-flex workapp-items-center workapp-gap-md">
              <span className="workapp-text-muted">Schemas Found:</span>
              <span className="workapp-badge workapp-badge-info">
                📊 {schemas.length} schemas
              </span>
            </div>

            {user && (
              <div className="workapp-flex workapp-items-center workapp-gap-md">
                <span className="workapp-text-muted">User ID:</span>
                <span className="workapp-text-primary workapp-font-mono text-xs">
                  {user.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="workapp-card workapp-mb-lg" style={{borderColor: '#ef4444'}}>
            <div className="workapp-card-header">
              <h3 className="workapp-card-title text-red-400">❌ Error</h3>
            </div>
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Schema Results */}
        <div className="workapp-card">
          <div className="workapp-card-header">
            <h3 className="workapp-card-title">📋 Retrieved Schemas</h3>
            <p className="workapp-card-subtitle">
              {schemas.length > 0 
                ? `Found ${schemas.length} workout schema${schemas.length !== 1 ? 's' : ''}`
                : 'No schemas found yet'
              }
            </p>
          </div>

          {schemas.length === 0 && !loading && !error && (
            <div className="text-center workapp-text-muted workapp-py-lg">
              <div className="text-4xl workapp-mb-md">📭</div>
              <p>No schemas found in database</p>
              <p className="text-sm workapp-mt-sm">
                Try generating and saving a schema first using the AI Generator
              </p>
            </div>
          )}

          {schemas.length > 0 && (
            <div className="workapp-flex workapp-flex-col workapp-gap-md">
              {schemas.map((schema, index) => (
                <div 
                  key={schema.id || index} 
                  className="workapp-p-md" 
                  style={{
                    background: 'var(--c-bg-dark)', 
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="workapp-flex workapp-items-start workapp-justify-between workapp-mb-sm">
                    <div style={{flex: 1}}>
                      <h4 className="workapp-text-primary workapp-mb-sm" style={{fontWeight: 'bold'}}>
                        {schema.name || 'Unnamed Schema'}
                      </h4>
                      
                      {schema.description && (
                        <p className="workapp-text-muted workapp-mb-sm text-sm">
                          {schema.description}
                        </p>
                      )}
                      
                      <div className="workapp-flex workapp-flex-wrap workapp-gap-sm workapp-mb-sm">
                        {schema.conditions?.goal && (
                          <span className="workapp-badge workapp-badge-primary">
                            🎯 {schema.conditions.goal}
                          </span>
                        )}
                        {schema.conditions?.experience && (
                          <span className="workapp-badge workapp-badge-info">
                            📈 {schema.conditions.experience}
                          </span>
                        )}
                        {schema.conditions?.daysPerWeek && (
                          <span className="workapp-badge workapp-badge-success">
                            📅 {schema.conditions.daysPerWeek} days/week
                          </span>
                        )}
                        {schema.mode && (
                          <span className="workapp-badge workapp-badge-warning">
                            🧠 {schema.mode}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="workapp-flex workapp-gap-sm">
                      <button className="workapp-btn workapp-btn-secondary workapp-btn-sm">
                        👁️ View
                      </button>
                      <button className="workapp-btn workapp-btn-primary workapp-btn-sm">
                        📝 Edit
                      </button>
                    </div>
                  </div>

                  {/* Schema Metadata */}
                  <div className="workapp-grid workapp-grid-3 workapp-gap-md text-xs workapp-text-muted">
                    <div>
                      <span className="workapp-text-primary">Created:</span><br/>
                      {schema.createdAt ? new Date(schema.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div>
                      <span className="workapp-text-primary">Modified:</span><br/>
                      {schema.updatedAt ? new Date(schema.updatedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div>
                      <span className="workapp-text-primary">Days:</span><br/>
                      {schema.weekStructure ? Object.keys(schema.weekStructure).length : 0} training days
                    </div>
                  </div>

                  {/* Volume Preview */}
                  {schema.volumeAnalysis?.weeklyVolume && (
                    <div className="workapp-mt-sm workapp-pt-sm" style={{borderTop: '1px solid var(--c-border)'}}>
                      <div className="text-xs workapp-text-muted workapp-mb-sm">Weekly Volume:</div>
                      <div className="workapp-flex workapp-flex-wrap workapp-gap-sm">
                        {Object.entries(schema.volumeAnalysis.weeklyVolume).map(([muscle, sets]) => (
                          <span 
                            key={muscle} 
                            className="text-xs workapp-px-sm workapp-py-xs" 
                            style={{
                              background: 'var(--c-bg-card)',
                              borderRadius: '4px',
                              color: sets > 16 ? '#fbbf24' : sets < 8 ? '#ef4444' : '#10b981'
                            }}
                          >
                            {muscle}: {sets}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Debug Info (collapsed by default) */}
                  <details className="workapp-mt-sm">
                    <summary className="text-xs workapp-text-muted cursor-pointer">
                      🔧 Debug Info
                    </summary>
                    <pre className="text-xs workapp-mt-sm workapp-p-sm" style={{
                      background: 'var(--c-bg)',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(schema, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database Connection Test */}
        <div className="workapp-card workapp-mt-lg">
          <div className="workapp-card-header">
            <h3 className="workapp-card-title">🔗 Connection Status</h3>
          </div>
          <div className="workapp-flex workapp-items-center workapp-gap-md">
            <span className={loading ? "workapp-badge workapp-badge-warning" : "workapp-badge workapp-badge-success"}>
              {loading ? "🟡 Loading..." : "🟢 Connected"}
            </span>
            <span className="workapp-text-muted text-sm">
              Database functions imported and ready
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
