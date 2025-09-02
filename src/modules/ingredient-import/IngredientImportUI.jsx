// src/modules/ingredient-import/IngredientImportUI.jsx
import { useState } from 'react'
import IngredientImportService from '../../services/IngredientImportService'

export default function IngredientImportUI({ db }) {
  const isMobile = window.innerWidth <= 768
  
  const [csvContent, setCsvContent] = useState('')
  const [sqlOutput, setSqlOutput] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return
    
    setLoading(true)
    try {
      const text = await file.text()
      setCsvContent(text)
      
      // Process CSV to SQL
      const result = await IngredientImportService.processCSVToSQL(text)
      
      if (result.success) {
        setSqlOutput(result.sql)
        setStats(result.stats)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Fout bij uploaden: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFileUpload(file)
    } else {
      alert('Upload alleen CSV bestanden')
    }
  }
  
  // Copy SQL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlOutput)
    alert('SQL gekopieerd naar clipboard!')
  }
  
  // Download SQL file
  const downloadSQL = () => {
    const blob = new Blob([sqlOutput], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ingredients_import_${new Date().toISOString().split('T')[0]}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '700',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        🔄 Product → Ingredient Converter
      </h1>
      
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          minHeight: isMobile ? '120px' : '200px',
          padding: isMobile ? '1.5rem' : '2rem',
          background: isDragging 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
            : 'rgba(17, 17, 17, 0.5)',
          border: isDragging 
            ? '2px dashed #10b981' 
            : '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: isMobile ? '12px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          backdropFilter: 'blur(10px)'
        }}
        onClick={() => document.getElementById('csvInput').click()}
      >
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }}
        />
        
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '0.5rem'
        }}>
          📁
        </div>
        
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          {isDragging ? 'Laat los om te uploaden' : 'Sleep CSV hier of klik om te selecteren'}
        </h3>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Ondersteunt: products.csv export van supermarkt database
        </p>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            marginTop: '1rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Verwerken van CSV data...
          </p>
        </div>
      )}
      
      {/* Statistics */}
      {stats && (
        <div style={{
          marginTop: '2rem',
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(17, 17, 17, 0.5)',
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#10b981'
          }}>
            📊 Conversie Statistieken
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {stats.total}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Totaal Producten
              </div>
            </div>
            
            <div style={{
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#3b82f6'
              }}>
                {Object.keys(stats.byCategory).length}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Categorieën
              </div>
            </div>
            
            <div style={{
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(249, 115, 22, 0.2)'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#f97316'
              }}>
                {Math.round((stats.estimated / stats.total) * 100)}%
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Geschatte Waarden
              </div>
            </div>
          </div>
          
          {/* Category breakdown */}
          <div style={{
            marginTop: '1rem',
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Per Categorie:
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <span
                  key={cat}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '20px',
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    color: '#10b981'
                  }}
                >
                  {cat}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* SQL Output */}
      {sqlOutput && (
        <div style={{
          marginTop: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              fontWeight: '600',
              color: '#fff'
            }}>
              📝 SQL Output
            </h3>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                📋 Kopieer
              </button>
              
              <button
                onClick={downloadSQL}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                💾 Download
              </button>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: isMobile ? '1rem' : '1.5rem',
            borderRadius: isMobile ? '12px' : '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <pre style={{
              margin: 0,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'Monaco, Consolas, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {sqlOutput}
            </pre>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
