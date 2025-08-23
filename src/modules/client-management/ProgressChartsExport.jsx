import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ===== PROGRESS CHARTS COMPONENT =====
export const ProgressCharts = ({ client, db }) => {
  const [chartData, setChartData] = useState({
    weight: [],
    workouts: [],
    meals: [],
    goals: []
  })
  const [activeChart, setActiveChart] = useState('weight')
  const [dateRange, setDateRange] = useState('30') // 7, 30, 90, all
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadChartData()
  }, [client, dateRange])
  
  const loadChartData = async () => {
    setLoading(true)
    try {
      const days = dateRange === 'all' ? 365 : parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // Load weight progress
      const weightData = await db.getClientProgress(client.id)
      const weightChartData = weightData.measurements
        ?.filter(m => new Date(m.date) > startDate)
        .map(m => ({
          date: new Date(m.date).toLocaleDateString(),
          weight: m.weight,
          bodyFat: m.body_fat,
          muscleMass: m.muscle_mass
        }))
        .reverse() || []
      
      // Load workout progress
      const workoutData = await db.getClientWorkoutData(client.id)
      const workoutsByWeek = {}
      workoutData.progress?.forEach(w => {
        const week = getWeekNumber(new Date(w.date))
        workoutsByWeek[week] = (workoutsByWeek[week] || 0) + 1
      })
      
      const workoutChartData = Object.entries(workoutsByWeek)
        .map(([week, count]) => ({
          week: `Week ${week}`,
          workouts: count,
          target: 3 // Assuming 3 workouts per week target
        }))
        .slice(-8) // Last 8 weeks
      
      // Load meal compliance
      const mealCompliance = await db.getMealCompliance(client.id, days)
      const mealChartData = [
        { name: 'Calories', value: mealCompliance?.kcal_compliance || 0, color: '#10b981' },
        { name: 'Protein', value: mealCompliance?.protein_compliance || 0, color: '#3b82f6' },
        { name: 'Carbs', value: mealCompliance?.carbs_compliance || 0, color: '#f59e0b' },
        { name: 'Fat', value: mealCompliance?.fat_compliance || 0, color: '#8b5cf6' }
      ]
      
      // Load goals progress
      const goals = await db.getClientGoals(client.id)
      const goalsChartData = goals.map(g => ({
        name: g.goal_type,
        current: g.current_value || 0,
        target: g.target_value || 100,
        progress: Math.min(100, ((g.current_value || 0) / (g.target_value || 100)) * 100)
      }))
      
      setChartData({
        weight: weightChartData,
        workouts: workoutChartData,
        meals: mealChartData,
        goals: goalsChartData
      })
    } catch (error) {
      console.error('Failed to load chart data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }
  
  const chartConfig = {
    weight: {
      title: '📈 Weight Progress',
      type: 'line',
      color: '#10b981'
    },
    workouts: {
      title: '💪 Workout Consistency',
      type: 'bar',
      color: '#3b82f6'
    },
    meals: {
      title: '🍽️ Nutrition Compliance',
      type: 'pie',
      color: '#f59e0b'
    },
    goals: {
      title: '🎯 Goals Progress',
      type: 'bar',
      color: '#8b5cf6'
    }
  }
  
  const renderChart = () => {
    const config = chartConfig[activeChart]
    const data = chartData[activeChart]
    
    if (loading) {
      return (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-muted)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(16, 185, 129, 0.2)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p>Loading chart data...</p>
          </div>
        </div>
      )
    }
    
    if (!data || data.length === 0) {
      return (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-muted)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</p>
            <p>No data available for this period</p>
          </div>
        </div>
      )
    }
    
    switch(activeChart) {
      case 'weight':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #10b981',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Weight (kg)"
              />
              {data[0]?.bodyFat && (
                <Line 
                  type="monotone" 
                  dataKey="bodyFat" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Body Fat %"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )
        
      case 'workouts':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #3b82f6',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="workouts" fill="#3b82f6" name="Completed" />
              <Bar dataKey="target" fill="rgba(59, 130, 246, 0.3)" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        )
        
      case 'meals':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #f59e0b',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
        
      case 'goals':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" domain={[0, 100]} stroke="#999" />
              <YAxis type="category" dataKey="name" stroke="#999" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #8b5cf6',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="progress" fill="#8b5cf6" name="Progress %" />
            </BarChart>
          </ResponsiveContainer>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      padding: 'var(--s-5)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--s-4)'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-2)'
        }}>
          📊 Progress Analytics
        </h3>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      
      {/* Chart Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--s-2)',
        marginBottom: 'var(--s-4)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        paddingBottom: 'var(--s-2)'
      }}>
        {Object.entries(chartConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveChart(key)}
            style={{
              background: activeChart === key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeChart === key ? '#10b981' : 'var(--c-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeChart === key ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            {config.title}
          </button>
        ))}
      </div>
      
      {/* Chart */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        padding: 'var(--s-4)'
      }}>
        {renderChart()}
      </div>
      
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

// ===== EXPORT FUNCTIONALITY =====
export const ExportManager = ({ clients, db }) => {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState('clients') // clients, workouts, meals, progress
  const [selectedClients, setSelectedClients] = useState([])
  
  const handleExport = async () => {
    if (selectedClients.length === 0) {
      alert('Please select at least one client to export')
      return
    }
    
    setExporting(true)
    try {
      let data = []
      
      switch(exportType) {
        case 'clients':
          // Export client basic info
          data = clients
            .filter(c => selectedClients.includes(c.id))
            .map(c => ({
              'First Name': c.first_name,
              'Last Name': c.last_name,
              'Email': c.email,
              'Phone': c.phone || '',
              'Goal': c.goal || '',
              'Status': c.status || 'active',
              'Created': new Date(c.created_at).toLocaleDateString(),
              'Age': c.age || '',
              'Height': c.height || '',
              'Current Weight': c.current_weight || '',
              'Target Weight': c.target_weight || ''
            }))
          break
          
        case 'workouts':
          // Export workout assignments
          for (const clientId of selectedClients) {
            const client = clients.find(c => c.id === clientId)
            const workoutData = await db.getClientWorkoutData(clientId)
            
            if (workoutData.current_schema) {
              data.push({
                'Client': `${client.first_name} ${client.last_name}`,
                'Email': client.email,
                'Workout Plan': workoutData.current_schema.name,
                'Goal': workoutData.current_schema.primary_goal,
                'Days/Week': workoutData.current_schema.days_per_week,
                'Split': workoutData.current_schema.split_name || workoutData.current_schema.split_type,
                'Compliance %': workoutData.compliance || 0
              })
            }
          }
          break
          
        case 'meals':
          // Export meal plan data
          for (const clientId of selectedClients) {
            const client = clients.find(c => c.id === clientId)
            const mealPlan = await db.getClientMealPlan(clientId)
            const compliance = await db.getMealCompliance(clientId, 30)
            
            data.push({
              'Client': `${client.first_name} ${client.last_name}`,
              'Email': client.email,
              'Has Meal Plan': mealPlan ? 'Yes' : 'No',
              'Calories Target': mealPlan?.targets?.kcal || '',
              'Protein Target': mealPlan?.targets?.protein || '',
              'Carbs Target': mealPlan?.targets?.carbs || '',
              'Fat Target': mealPlan?.targets?.fat || '',
              'Compliance %': compliance?.average || 0,
              'Current Streak': compliance?.current_streak || 0
            })
          }
          break
          
        case 'progress':
          // Export progress data
          for (const clientId of selectedClients) {
            const client = clients.find(c => c.id === clientId)
            const progress = await db.getClientProgress(clientId)
            
            progress.measurements?.forEach(m => {
              data.push({
                'Client': `${client.first_name} ${client.last_name}`,
                'Email': client.email,
                'Date': new Date(m.date).toLocaleDateString(),
                'Weight': m.weight || '',
                'Body Fat %': m.body_fat || '',
                'Muscle Mass': m.muscle_mass || '',
                'Waist': m.waist || '',
                'Chest': m.chest || '',
                'Arms': m.arms || ''
              })
            })
          }
          break
      }
      
      // Convert to CSV
      if (data.length > 0) {
        const csv = convertToCSV(data)
        downloadCSV(csv, `myarc-${exportType}-${new Date().toISOString().split('T')[0]}.csv`)
        alert(`✅ Exported ${data.length} records successfully!`)
      } else {
        alert('No data to export')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('❌ Export failed')
    } finally {
      setExporting(false)
    }
  }
  
  const convertToCSV = (data) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
  }
  
  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      padding: 'var(--s-5)'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-2)',
        marginBottom: 'var(--s-4)'
      }}>
        📁 Export Data
      </h3>
      
      {/* Export Type Selection */}
      <div style={{ marginBottom: 'var(--s-4)' }}>
        <label style={{ 
          color: 'var(--c-muted)', 
          fontSize: 'var(--text-sm)', 
          display: 'block', 
          marginBottom: 'var(--s-2)' 
        }}>
          Select Export Type
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 'var(--s-2)' 
        }}>
          {[
            { id: 'clients', label: '👥 Client Info', color: '#10b981' },
            { id: 'workouts', label: '💪 Workouts', color: '#3b82f6' },
            { id: 'meals', label: '🍽️ Meal Plans', color: '#f59e0b' },
            { id: 'progress', label: '📈 Progress', color: '#8b5cf6' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setExportType(type.id)}
              style={{
                padding: 'var(--s-3)',
                background: exportType === type.id 
                  ? `linear-gradient(135deg, ${type.color}40, ${type.color}20)`
                  : 'rgba(0,0,0,0.3)',
                border: `2px solid ${exportType === type.id ? type.color : 'transparent'}`,
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Client Selection */}
      <div style={{ marginBottom: 'var(--s-4)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--s-2)'
        }}>
          <label style={{ 
            color: 'var(--c-muted)', 
            fontSize: 'var(--text-sm)' 
          }}>
            Select Clients to Export ({selectedClients.length}/{clients.length})
          </label>
          <button
            onClick={() => {
              if (selectedClients.length === clients.length) {
                setSelectedClients([])
              } else {
                setSelectedClients(clients.map(c => c.id))
              }
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              color: '#ef4444',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer'
            }}
          >
            {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {clients.map(client => (
            <label
              key={client.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--s-2)',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedClients([...selectedClients, client.id])
                  } else {
                    setSelectedClients(selectedClients.filter(id => id !== client.id))
                  }
                }}
                style={{ marginRight: 'var(--s-3)' }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', marginBottom: '2px' }}>
                  {client.first_name} {client.last_name}
                </p>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                  {client.email}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting || selectedClients.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          background: selectedClients.length > 0
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'rgba(239, 68, 68, 0.2)',
          border: 'none',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: selectedClients.length > 0 ? 'pointer' : 'not-allowed',
          opacity: selectedClients.length > 0 ? 1 : 0.5,
          transition: 'all 0.3s ease'
        }}
      >
        {exporting ? 'Exporting...' : `📥 Export ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} to CSV`}
      </button>
      
      {selectedClients.length === 0 && (
        <p style={{
          color: 'var(--c-muted)',
          fontSize: 'var(--text-sm)',
          textAlign: 'center',
          marginTop: 'var(--s-2)'
        }}>
          Please select at least one client to export
        </p>
      )}
    </div>
  )
}

// Export all components
export default {
  ProgressCharts,
  ExportManager
}
