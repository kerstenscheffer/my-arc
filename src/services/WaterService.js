// Water Tracking Service - Adaptive Version
// Deze versie detecteert automatisch de juiste tabel/kolom structuur
// Plaats dit in een nieuw bestand: src/services/WaterService.js

class WaterService {
  constructor(supabase) {
    this.supabase = supabase
    this.tableConfig = null
    this.initialized = false
  }

  // Initialize by detecting table structure
  async initialize() {
    if (this.initialized) return
    
    console.log('🔍 Detecting water table structure...')
    
    // Try water_intake first
    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .select('*')
        .limit(0) // We just want to check if it exists
      
      if (!error) {
        // Table exists, now check columns
        const { data: sample } = await this.supabase
          .from('water_intake')
          .select('*')
          .limit(1)
          .maybeSingle()
        
        this.tableConfig = {
          tableName: 'water_intake',
          amountColumn: sample && 'amount' in sample ? 'amount' : 
                       sample && 'amount_liters' in sample ? 'amount_liters' : 
                       'amount' // Default
        }
        console.log('✅ Using water_intake table with column:', this.tableConfig.amountColumn)
      }
    } catch (e) {
      console.log('water_intake not accessible')
    }
    
    // If water_intake didn't work, try water_tracking
    if (!this.tableConfig) {
      try {
        const { data, error } = await this.supabase
          .from('water_tracking')
          .select('*')
          .limit(0)
        
        if (!error) {
          const { data: sample } = await this.supabase
            .from('water_tracking')
            .select('*')
            .limit(1)
            .maybeSingle()
          
          this.tableConfig = {
            tableName: 'water_tracking',
            amountColumn: sample && 'amount_liters' in sample ? 'amount_liters' : 
                         sample && 'amount' in sample ? 'amount' : 
                         'amount_liters' // Default for water_tracking
          }
          console.log('✅ Using water_tracking table with column:', this.tableConfig.amountColumn)
        }
      } catch (e) {
        console.log('water_tracking not accessible')
      }
    }
    
    // If neither exists, create water_intake
    if (!this.tableConfig) {
      console.warn('⚠️ No water table found! Please create water_intake table.')
      // Use defaults that match what we're trying to create
      this.tableConfig = {
        tableName: 'water_intake',
        amountColumn: 'amount'
      }
    }
    
    this.initialized = true
  }

  // Save water intake
  async save(clientId, date, amount) {
    await this.initialize()
    
    try {
      console.log(`💧 Saving ${amount}L to ${this.tableConfig.tableName}.${this.tableConfig.amountColumn}`)
      
      const dataToSave = {
        client_id: clientId,
        date: date,
        [this.tableConfig.amountColumn]: amount,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await this.supabase
        .from(this.tableConfig.tableName)
        .upsert(dataToSave, {
          onConflict: 'client_id,date'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Water intake saved successfully')
      return data
    } catch (error) {
      console.error('❌ Save water failed:', error)
      
      // Provide helpful error message
      if (error.code === 'PGRST204') {
        console.error(`
          ⚠️ Database structure issue detected!
          Expected: ${this.tableConfig.tableName}.${this.tableConfig.amountColumn}
          Error: ${error.message}
          
          Please run this SQL in Supabase:
          CREATE TABLE IF NOT EXISTS ${this.tableConfig.tableName} (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL,
            date DATE NOT NULL,
            ${this.tableConfig.amountColumn} DECIMAL(3,2) DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(client_id, date)
          );
        `)
      }
      
      return null
    }
  }

  // Get water intake
  async get(clientId, date) {
    await this.initialize()
    
    try {
      const { data, error } = await this.supabase
        .from(this.tableConfig.tableName)
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        // Return the amount regardless of column name
        const amount = data[this.tableConfig.amountColumn] || 
                      data.amount || 
                      data.amount_liters || 
                      0
        console.log(`💧 Retrieved ${amount}L for ${date}`)
        return amount
      }
      
      return 0
    } catch (error) {
      console.error('❌ Get water failed:', error)
      return 0
    }
  }

  // Get range of water intake
  async getRange(clientId, startDate, endDate) {
    await this.initialize()
    
    try {
      const { data, error } = await this.supabase
        .from(this.tableConfig.tableName)
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
      
      if (error) throw error
      
      // Normalize the data
      return (data || []).map(item => ({
        date: item.date,
        amount: item[this.tableConfig.amountColumn] || item.amount || item.amount_liters || 0,
        ...item
      }))
    } catch (error) {
      console.error('❌ Get water range failed:', error)
      return []
    }
  }
}

// Export wrapper functions that use the adaptive service
let waterService = null

export const initWaterService = (supabase) => {
  waterService = new WaterService(supabase)
  return waterService
}

// These functions match the existing DatabaseService interface
export const saveWaterIntake = async (clientId, date, amount) => {
  if (!waterService) {
    console.error('WaterService not initialized!')
    return null
  }
  return await waterService.save(clientId, date, amount)
}

export const getWaterIntake = async (clientId, date) => {
  if (!waterService) {
    console.error('WaterService not initialized!')
    return 0
  }
  return await waterService.get(clientId, date)
}

export const getWaterIntakeRange = async (clientId, startDate, endDate) => {
  if (!waterService) {
    console.error('WaterService not initialized!')
    return []
  }
  return await waterService.getRange(clientId, startDate, endDate)
}

// Usage in DatabaseService.js:
/*
import { initWaterService, saveWaterIntake, getWaterIntake, getWaterIntakeRange } from './WaterService'

// In constructor or init:
initWaterService(supabase)

// Then use the exported functions directly:
async saveWaterIntake(clientId, date, amount) {
  return saveWaterIntake(clientId, date, amount)
}
*/
