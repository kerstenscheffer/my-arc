// src/modules/client-management/modules/ContentModule.jsx
import { useState } from 'react'

export default function ContentModule({ client, data, onAction, viewMode, db }) {
  const [showAddContent, setShowAddContent] = useState(false)
  const [newContent, setNewContent] = useState({
    type: 'video',
    title: '',
    url: '',
    description: '',
    category: 'workout'
  })
  
  // Safe data extraction  
  const content = Array.isArray(data) ? data : []
  const recentlyViewed = content.filter(c => c.last_viewed).slice(0, 3)
  const totalContent = content.length
  const viewedContent = content.filter(c => c.viewed).length
  const completionRate = totalContent > 0 ? Math.round((viewedContent / totalContent) * 100) : 0
  
  const handleAssignContent = async () => {
    if (!newContent.title || !newContent.url) {
      alert('Please fill in title and URL')
      return
    }
    
    try {
      await onAction('assignContent', {
        client_id: client.id,
        ...newContent,
        assigned_at: new Date().toISOString()
      })
      setNewContent({
        type: 'video',
        title: '',
        url: '',
        description: '',
        category: 'workout'
      })
      setShowAddContent(false)
    } catch (error) {
      console.error('Failed to assign content:', error)
    }
  }
  
  const getContentIcon = (type) => {
    switch(type) {
      case 'video': return '📹'
      case 'article': return '📄'
      case 'pdf': return '📑'
      case 'audio': return '🎧'
      case 'image': return '🖼️'
      case 'link': return '🔗'
      default: return '📎'
    }
  }
  
  const getCategoryColor = (category) => {
    switch(category) {
      case 'workout': return '#3b82f6'
      case 'nutrition': return '#10b981'
      case 'mindset': return '#8b5cf6'
      case 'education': return '#f59e0b'
      case 'motivation': return '#ef4444'
      default: return '#6b7280'
    }
  }
  
  const getContentLibrary = () => [
    { title: "Beginner's Guide to Strength Training", type: 'video', category: 'workout', url: '#' },
    { title: "Meal Prep 101", type: 'article', category: 'nutrition', url: '#' },
    { title: "Building Mental Resilience", type: 'audio', category: 'mindset', url: '#' },
    { title: "Understanding Macros", type: 'pdf', category: 'education', url: '#' },
    { title: "Morning Motivation Routine", type: 'video', category: 'motivation', url: '#' }
  ]
  
  // Focus view - detailed content management
  if (viewMode === 'focus') {
    return (
      <div>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>📚 Educational Content</h4>
          <button
            className="myarc-btn myarc-btn-sm myarc-btn-secondary"
            onClick={() => setShowAddContent(!showAddContent)}
          >
            {showAddContent ? '✕' : '➕ Assign Content'}
          </button>
        </div>
        
        {/* Content Stats */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent)',
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--s-3)',
          textAlign: 'center'
        }}>
          <div>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Total Content</p>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {totalContent}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Viewed</p>
            <p style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {viewedContent}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Completion</p>
            <p style={{ color: '#8b5cf6', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {completionRate}%
            </p>
          </div>
        </div>
        
        {/* Assign New Content Form */}
        {showAddContent && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <h5 style={{ color: '#fff', marginBottom: 'var(--s-2)' }}>Assign New Content</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)', marginBottom: 'var(--s-2)' }}>
              <select
                className="myarc-select"
                value={newContent.type}
                onChange={(e) => setNewContent({...newContent, type: e.target.value})}
              >
                <option value="video">📹 Video</option>
                <option value="article">📄 Article</option>
                <option value="pdf">📑 PDF</option>
                <option value="audio">🎧 Audio</option>
                <option value="link">🔗 Link</option>
              </select>
              
              <select
                className="myarc-select"
                value={newContent.category}
                onChange={(e) => setNewContent({...newContent, category: e.target.value})}
              >
                <option value="workout">Workout</option>
                <option value="nutrition">Nutrition</option>
                <option value="mindset">Mindset</option>
                <option value="education">Education</option>
                <option value="motivation">Motivation</option>
              </select>
            </div>
            
            <input
              className="myarc-input"
              placeholder="Content Title"
              value={newContent.title}
              onChange={(e) => setNewContent({...newContent, title: e.target.value})}
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <input
              className="myarc-input"
              placeholder="URL or Link"
              value={newContent.url}
              onChange={(e) => setNewContent({...newContent, url: e.target.value})}
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <textarea
              className="myarc-input"
              placeholder="Description (optional)"
              value={newContent.description}
              onChange={(e) => setNewContent({...newContent, description: e.target.value})}
              rows="3"
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
              <button
                className="myarc-btn myarc-btn-primary"
                onClick={handleAssignContent}
                style={{ flex: 1 }}
              >
                Assign Content
              </button>
              <button
                className="myarc-btn myarc-btn-ghost"
                onClick={() => {
                  setShowAddContent(false)
                  setNewContent({
                    type: 'video',
                    title: '',
                    url: '',
                    description: '',
                    category: 'workout'
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Quick Assign from Library */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)',
          marginBottom: 'var(--s-3)'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
            Quick Assign from Library
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
            {getContentLibrary().slice(0, 3).map((item, idx) => (
              <button
                key={idx}
                className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                onClick={() => {
                  setNewContent({
                    ...item,
                    description: ''
                  })
                  setShowAddContent(true)
                }}
                style={{
                  fontSize: 'var(--text-xs)',
                  borderColor: getCategoryColor(item.category)
                }}
              >
                {getContentIcon(item.type)} {item.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Assigned Content List */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
            Assigned Content ({content.length})
          </p>
          
          {content.length > 0 ? (
            content.map((item, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-2)',
                borderBottom: idx < content.length - 1 ? '1px solid var(--c-border)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                    <span>{getContentIcon(item.type)}</span>
                    <span style={{ 
                      background: `${getCategoryColor(item.category)}20`,
                      color: getCategoryColor(item.category),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: 'var(--text-xs)'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ color: '#fff', marginTop: '4px' }}>{item.title}</p>
                  {item.description && (
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                      {item.description}
                    </p>
                  )}
                  <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                    {item.viewed ? '✅ Viewed' : '⏳ Not viewed'} • 
                    Assigned {new Date(item.assigned_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--s-1)' }}>
                  <button
                    className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    🔗
                  </button>
                  <button
                    className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                    onClick={() => onAction('removeContent', { contentId: item.id })}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--s-4)',
              color: 'var(--c-muted)'
            }}>
              <p style={{ fontSize: '2rem', marginBottom: 'var(--s-2)' }}>📚</p>
              <p>No content assigned yet</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Assign educational content to help {client.first_name} learn and grow!
              </p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div style={{ marginTop: 'var(--s-3)', display: 'flex', gap: 'var(--s-2)' }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={() => onAction('browseLibrary', {})}
            style={{ flex: 1 }}
          >
            Browse Library
          </button>
          <button
            className="myarc-btn myarc-btn-secondary"
            onClick={() => onAction('viewProgress', {})}
            style={{ flex: 1 }}
          >
            View Progress
          </button>
        </div>
      </div>
    )
  }
  
  // Grid/List view - compact display
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Content</p>
        <p style={{ color: '#fff', fontWeight: 'bold' }}>
          {viewedContent}/{totalContent} viewed
        </p>
        {completionRate > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            height: '4px',
            marginTop: 'var(--s-1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#8b5cf6',
              height: '100%',
              width: `${completionRate}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('assignContent', {})}
        style={{ width: '100%' }}
      >
        Manage Content
      </button>
    </div>
  )
}

