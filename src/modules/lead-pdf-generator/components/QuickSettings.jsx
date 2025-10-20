import { useState } from 'react'
import { Settings, Type, Palette, Sparkles, Space, Save, Download, X } from 'lucide-react'

export const DEFAULT_SETTINGS = {
  typography: {
    coverTitleSize: 100,
    coverSubtitleSize: 32,
    truthTitleSize: 56,
    truthTextSize: 38,
    checklistTitleSize: 48,
    checklistItemSize: 32,
    ctaTitleSize: 72,
    ctaTextSize: 40
  },
  colors: {
    gradientStart: '#10b981',
    gradientEnd: '#3b82f6',
    gradientAngle: 135,
    pageBackground: '#000000',
    textColor: '#ffffff',
    accentColor: '#10b981'
  },
  effects: {
    glowIntensity: 50,
    glassmorphismBlur: 20,
    photoOpacity: 10,
    borderGlow: true,
    gradientText: true
  },
  spacing: {
    pageMargin: 60,
    sectionGap: 40,
    lineHeight: 1.4,
    preset: 'comfortable'
  }
}

const PRESETS = {
  tight: {
    pageMargin: 40,
    sectionGap: 30,
    lineHeight: 1.3
  },
  comfortable: {
    pageMargin: 60,
    sectionGap: 40,
    lineHeight: 1.4
  },
  spacious: {
    pageMargin: 80,
    sectionGap: 60,
    lineHeight: 1.6
  }
}

export default function QuickSettings({ settings, setSettings, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('typography')
  const isMobile = window.innerWidth <= 768

  if (!isOpen) return null

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const applyPreset = (presetName) => {
    setSettings(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        ...PRESETS[presetName],
        preset: presetName
      }
    }))
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'myarc-pdf-settings.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importSettings = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        setSettings(imported)
      } catch (err) {
        alert('Invalid settings file')
      }
    }
    reader.readAsText(file)
  }

  const tabs = [
    { id: 'typography', label: 'Fonts', icon: Type },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'spacing', label: 'Spacing', icon: Space }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: isMobile ? '100%' : '400px',
      height: '100vh',
      background: 'linear-gradient(180deg, #111 0%, #000 100%)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      touchAction: 'manipulation'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Settings size={20} />
            Quick Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(settings.typography).map(([key, value]) => (
              <div key={key}>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem'
                }}>
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>{value}px</span>
                </label>
                <input
                  type="range"
                  min={key.includes('Title') ? 32 : 20}
                  max={key.includes('cover') ? 180 : 80}
                  value={value}
                  onChange={(e) => updateSetting('typography', key, parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                    WebkitAppearance: 'none'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(settings.colors).map(([key, value]) => (
              key !== 'gradientAngle' ? (
                <div key={key}>
                  <label style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      background: value,
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }} />
                  </label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateSetting('colors', key, e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ) : (
                <div key={key}>
                  <label style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    <span>Gradient Angle</span>
                    <span>{value}°</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={value}
                    onChange={(e) => updateSetting('colors', key, parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                      WebkitAppearance: 'none'
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(settings.effects).map(([key, value]) => (
              typeof value === 'boolean' ? (
                <label key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSetting('effects', key, e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                </label>
              ) : (
                <div key={key}>
                  <label style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span>{value}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => updateSetting('effects', key, parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                      WebkitAppearance: 'none'
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* Spacing Tab */}
        {activeTab === 'spacing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Preset
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Object.keys(PRESETS).map(preset => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: settings.spacing.preset === preset
                        ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {['pageMargin', 'sectionGap'].map(key => (
              <div key={key}>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem'
                }}>
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>{settings.spacing[key]}px</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={settings.spacing[key]}
                  onChange={(e) => updateSetting('spacing', key, parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                    WebkitAppearance: 'none'
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem'
              }}>
                <span>Line Height</span>
                <span>{settings.spacing.lineHeight}</span>
              </label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={settings.spacing.lineHeight}
                onChange={(e) => updateSetting('spacing', 'lineHeight', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  outline: 'none',
                  WebkitAppearance: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={exportSettings}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px'
          }}
        >
          <Download size={16} />
          Export
        </button>
        <label style={{
          flex: 1,
          padding: '0.75rem',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: '44px'
        }}>
          <Save size={16} />
          Import
          <input
            type="file"
            accept=".json"
            onChange={importSettings}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}
