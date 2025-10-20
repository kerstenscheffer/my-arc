// src/services/SpotsService.js
import DatabaseService from './DatabaseService'

class SpotsService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  // Get current spots status (original)
  async getCurrentSpots() {
    try {
      const { data, error } = await this.supabase
        .from('client_spots')
        .select('*')
        .single()
      
      if (error && error.code === 'PGRST116') {
        // No record exists, create default
        return await this.initializeSpots()
      }
      
      if (error) throw error
      
      console.log('✅ Client spots loaded:', data)
      return data
    } catch (error) {
      console.error('❌ Get client spots failed:', error)
      return { current_spots: 0, max_spots: 10, is_active: true }
    }
  }

  // Get main offer spots status (new)
  async getMainOfferSpots() {
    try {
      const { data, error } = await this.supabase
        .from('main_offer_spots')
        .select('*')
        .single()
      
      if (error && error.code === 'PGRST116') {
        // No record exists, create default
        return await this.initializeMainOfferSpots()
      }
      
      if (error) throw error
      
      console.log('✅ Main offer spots loaded:', data)
      return data
    } catch (error) {
      console.error('❌ Get main offer spots failed:', error)
      return { current_spots: 0, max_spots: 5, is_active: true }
    }
  }

  // Get affiliate spots status (new)
  async getAffiliateSpots() {
    try {
      const { data, error } = await this.supabase
        .from('affiliate_spots')
        .select('*')
        .single()
      
      if (error && error.code === 'PGRST116') {
        // No record exists, create default
        return await this.initializeAffiliateSpots()
      }
      
      if (error) throw error
      
      console.log('✅ Affiliate spots loaded:', data)
      return data
    } catch (error) {
      console.error('❌ Get affiliate spots failed:', error)
      return { current_spots: 0, max_spots: 20, is_active: true }
    }
  }

  // Initialize client spots if not exists
  async initializeSpots() {
    try {
      const { data, error } = await this.supabase
        .from('client_spots')
        .insert({
          current_spots: 0,
          max_spots: 10,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Client spots initialized')
      return data
    } catch (error) {
      console.error('❌ Initialize client spots failed:', error)
      return { current_spots: 0, max_spots: 10, is_active: true }
    }
  }

  // Initialize main offer spots if not exists
  async initializeMainOfferSpots() {
    try {
      const { data, error } = await this.supabase
        .from('main_offer_spots')
        .insert({
          current_spots: 0,
          max_spots: 5,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Main offer spots initialized')
      return data
    } catch (error) {
      console.error('❌ Initialize main offer spots failed:', error)
      return { current_spots: 0, max_spots: 5, is_active: true }
    }
  }

  // Initialize affiliate spots if not exists
  async initializeAffiliateSpots() {
    try {
      const { data, error } = await this.supabase
        .from('affiliate_spots')
        .insert({
          current_spots: 0,
          max_spots: 20,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Affiliate spots initialized')
      return data
    } catch (error) {
      console.error('❌ Initialize affiliate spots failed:', error)
      return { current_spots: 0, max_spots: 20, is_active: true }
    }
  }

  // Update spots (generic for all types)
  async updateSpots(action, type = 'client') {
    try {
      const table = type === 'affiliate' 
        ? 'affiliate_spots' 
        : type === 'main_offer' 
        ? 'main_offer_spots' 
        : 'client_spots'
      
      const getter = type === 'affiliate'
        ? this.getAffiliateSpots
        : type === 'main_offer' 
        ? this.getMainOfferSpots 
        : this.getCurrentSpots
      
      // Get current
      const current = await getter.call(this)
      
      let newValue = current.current_spots
      
      if (action === 'increment' && newValue < current.max_spots) {
        newValue++
      } else if (action === 'decrement' && newValue > 0) {
        newValue--
      } else {
        console.log('⚠️ Spots limit reached')
        return current
      }
      
      // Update
      const { data, error } = await this.supabase
        .from(table)
        .update({ 
          current_spots: newValue,
          last_updated: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ ${type} spots updated to:`, newValue)
      return data
    } catch (error) {
      console.error(`❌ Update ${type} spots failed:`, error)
      return null
    }
  }

  // Set max spots (generic)
  async setMaxSpots(maxValue, type = 'client') {
    try {
      const table = type === 'affiliate' 
        ? 'affiliate_spots' 
        : type === 'main_offer' 
        ? 'main_offer_spots' 
        : 'client_spots'
      
      const getter = type === 'affiliate'
        ? this.getAffiliateSpots
        : type === 'main_offer' 
        ? this.getMainOfferSpots 
        : this.getCurrentSpots
      
      const current = await getter.call(this)
      
      const { data, error } = await this.supabase
        .from(table)
        .update({ 
          max_spots: maxValue,
          last_updated: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ ${type} max spots set to:`, maxValue)
      return data
    } catch (error) {
      console.error(`❌ Set ${type} max spots failed:`, error)
      return null
    }
  }

  // Toggle active status (generic)
  async toggleActive(type = 'client') {
    try {
      const table = type === 'affiliate' 
        ? 'affiliate_spots' 
        : type === 'main_offer' 
        ? 'main_offer_spots' 
        : 'client_spots'
      
      const getter = type === 'affiliate'
        ? this.getAffiliateSpots
        : type === 'main_offer' 
        ? this.getMainOfferSpots 
        : this.getCurrentSpots
      
      const current = await getter.call(this)
      
      const { data, error } = await this.supabase
        .from(table)
        .update({ 
          is_active: !current.is_active,
          last_updated: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ ${type} active status toggled:`, !current.is_active)
      return data
    } catch (error) {
      console.error(`❌ Toggle ${type} active failed:`, error)
      return null
    }
  }

  // Subscribe to real-time updates for client spots
  subscribeToSpots(callback) {
    const subscription = this.supabase
      .channel('client_spots_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_spots'
      }, (payload) => {
        console.log('📡 Client spots update received:', payload)
        callback(payload.new)
      })
      .subscribe()
    
    return subscription
  }

  // Subscribe to real-time updates for main offer spots
  subscribeToMainOfferSpots(callback) {
    const subscription = this.supabase
      .channel('main_offer_spots_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'main_offer_spots'
      }, (payload) => {
        console.log('📡 Main offer spots update received:', payload)
        callback(payload.new)
      })
      .subscribe()
    
    return subscription
  }

  // Subscribe to real-time updates for affiliate spots
  subscribeToAffiliateSpots(callback) {
    const subscription = this.supabase
      .channel('affiliate_spots_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'affiliate_spots'
      }, (payload) => {
        console.log('📡 Affiliate spots update received:', payload)
        callback(payload.new)
      })
      .subscribe()
    
    return subscription
  }
}

// Extend DatabaseService
DatabaseService.getSpotsService = function() {
  return new SpotsService(this)
}

export default SpotsService
