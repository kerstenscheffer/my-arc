import { supabase } from '../../../lib/supabase'

class QuickMessageService {
  
  /**
   * Send quick message to client (creates notification)
   */
  static async sendMessage(clientId, coachId, message, title = 'Message from Coach') {
    console.log('💬 [QuickMessage] Sending message to client:', clientId)
    console.log('  Message:', message.substring(0, 50) + '...')
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          client_id: clientId,
          coach_id: coachId,
          type: 'coach_message',
          title: title,
          message: message,
          priority: 'high',
          status: 'active',
          read: false,
          source: 'command_center',
          page_context: 'quick_message',
          created_at: new Date().toISOString(),
          show_from: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ [QuickMessage] Error sending message:', error)
        throw error
      }
      
      console.log('✅ [QuickMessage] Message sent successfully:', data?.id)
      return { success: true, data }
      
    } catch (error) {
      console.error('❌ [QuickMessage] Exception in sendMessage:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Get recent messages sent to client (last 5)
   */
  static async getRecentMessages(clientId, limit = 5) {
    console.log('📜 [QuickMessage] Fetching recent messages for client:', clientId)
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, message, title, created_at, read, read_at')
        .eq('client_id', clientId)
        .eq('type', 'coach_message')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      console.log('✅ [QuickMessage] Found', data?.length || 0, 'recent messages')
      return data || []
      
    } catch (error) {
      console.error('❌ [QuickMessage] Error fetching messages:', error)
      return []
    }
  }
  
  /**
   * Mark message as read
   */
  static async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
      
      if (error) throw error
      console.log('✅ [QuickMessage] Message marked as read:', notificationId)
      return true
      
    } catch (error) {
      console.error('❌ [QuickMessage] Error marking message as read:', error)
      return false
    }
  }
  
  /**
   * Get unread message count for client
   */
  static async getUnreadCount(clientId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('type', 'coach_message')
        .eq('read', false)
      
      if (error) throw error
      return count || 0
      
    } catch (error) {
      console.error('❌ [QuickMessage] Error getting unread count:', error)
      return 0
    }
  }
  
  /**
   * Validate message before sending
   */
  static validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' }
    }
    
    if (message.length > 500) {
      return { valid: false, error: 'Message too long (max 500 characters)' }
    }
    
    return { valid: true }
  }
}

export default QuickMessageService
