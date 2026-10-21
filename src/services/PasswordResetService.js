// src/services/PasswordResetService.js
// Complete Password Reset Service - Fixed Version

import { supabase, resetRedirectUrl } from '../lib/supabase'

class PasswordResetService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Step 1: Send reset email to user
   * Email MUST exist in Supabase Auth (not just clients table)
   */
  async sendResetEmail(email) {
    try {
      console.log('📧 Sending reset email to:', email)
      
      // Build redirect URL based on environment
      const redirectUrl = this.getRedirectUrl()
      console.log('🔗 Redirect URL:', redirectUrl)
      
      // Send the reset email - let Supabase handle email verification
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        return this.handleResetError(error)
      }
      
      console.log('✅ Reset email sent successfully')
      return {
        success: true,
        message: 'Reset email verstuurd! Check je inbox (en spam folder).'
      }
      
    } catch (error) {
      console.error('❌ Send reset email failed:', error)
      return {
        success: false,
        error: error.message || 'Kon geen reset email versturen'
      }
    }
  }

  /**
   * Step 2: Verify reset token from email link
   */
  async verifyResetToken() {
    try {
      console.log('🔑 Verifying reset token...')
      
      // Get session from URL (Supabase handles this)
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Token verification error:', error)
        return { valid: false, error: error.message }
      }
      
      // Check if we have a valid session from reset link
      const isValid = session !== null && session.access_token !== undefined
      
      console.log('🔒 Token valid:', isValid)
      return { 
        valid: isValid,
        session: session 
      }
      
    } catch (error) {
      console.error('❌ Token verification failed:', error)
      return { valid: false, error: error.message }
    }
  }

  /**
   * Step 3: Update password with new one
   */
  async updatePassword(newPassword) {
    try {
      console.log('🔐 Updating password...')
      
      // Validate password strength
      if (!this.validatePassword(newPassword)) {
        throw new Error('Wachtwoord moet minimaal 6 tekens bevatten')
      }
      
      // Update the password
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('❌ Update password error:', error)
        throw error
      }
      
      console.log('✅ Password updated successfully')
      
      // Sign out to force re-login with new password
      await this.supabase.auth.signOut()
      
      return {
        success: true,
        message: 'Wachtwoord succesvol bijgewerkt!'
      }
      
    } catch (error) {
      console.error('❌ Update password failed:', error)
      return {
        success: false,
        error: error.message || 'Kon wachtwoord niet bijwerken'
      }
    }
  }

  /**
   * Helper: Get correct redirect URL
   */
  getRedirectUrl() {
    return resetRedirectUrl()
  }

  /**
   * Helper: Handle specific reset errors
   */
  handleResetError(error) {
    const errorMessage = error.message.toLowerCase()
    
    // User not found
    if (errorMessage.includes('user not found') || errorMessage.includes('not registered')) {
      return {
        success: false,
        error: 'Email adres niet gevonden. Zorg dat je bent geregistreerd.'
      }
    }
    
    // Email not enabled
    if (errorMessage.includes('email not enabled')) {
      return {
        success: false,
        error: 'Email service niet geconfigureerd. Contact support.',
        developerNote: 'Enable email in Supabase Dashboard → Authentication → Settings'
      }
    }
    
    // Domain not verified (Resend)
    if (errorMessage.includes('domain is not verified')) {
      return {
        success: false,
        error: 'Email configuratie probleem. Contact support.',
        developerNote: 'Verify domain in Resend or use onboarding@resend.dev'
      }
    }
    
    // Redirect URL not whitelisted
    if (errorMessage.includes('redirect_to') || errorMessage.includes('not allowed')) {
      const redirectUrl = this.getRedirectUrl()
      return {
        success: false,
        error: 'Reset URL configuratie probleem. Contact support.',
        developerNote: `Add ${redirectUrl} to Supabase Dashboard → Authentication → URL Configuration`
      }
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit')) {
      return {
        success: false,
        error: 'Te veel reset pogingen. Probeer over 1 uur opnieuw.'
      }
    }
    
    // SMTP/Email sending error
    if (errorMessage.includes('sending recovery email') || errorMessage.includes('could not send')) {
      return {
        success: false,
        error: 'Kon email niet versturen. Check je email adres en probeer opnieuw.',
        developerNote: 'Check SMTP settings in Supabase Dashboard'
      }
    }
    
    // Generic error
    return {
      success: false,
      error: 'Er ging iets mis. Probeer het later opnieuw.'
    }
  }

  /**
   * Helper: Validate password strength
   */
  validatePassword(password) {
    return password && password.length >= 6
  }

  /**
   * Development helper: Log Supabase setup instructions
   */
  logSetupInstructions() {
    console.log(`
    📋 SUPABASE SETUP CHECKLIST:
    
    1. Go to Supabase Dashboard
    2. Authentication → Settings:
       ✓ Enable Email Signups = ON
       ✓ Enable email confirmations = OFF (for dev)
    
    3. Authentication → URL Configuration → Redirect URLs:
       Add these URLs:
       ✓ http://localhost:5173/reset-password
       ✓ http://localhost:5173/*
       ✓ ${window.location.origin}/reset-password
    
    4. Authentication → Email Templates:
       ✓ Check "Reset Password" template is active
    
    5. Email provider options:
       
       Option A - Supabase SMTP (quick, limited):
       ✓ Project Settings → Auth → SMTP
       ✓ Toggle "Enable Custom SMTP" OFF
       ✓ Max 3 emails per hour
       
       Option B - Resend (recommended):
       ✓ Create account at resend.com
       ✓ Get API key
       ✓ In SMTP Settings:
         - Enable Custom SMTP = ON
         - Host: smtp.resend.com
         - Port: 465
         - Username: resend
         - Password: [your-api-key]
         - Sender email: onboarding@resend.dev (or verify your domain)
       
       Option C - Custom domain with Resend:
       ✓ Add domain in Resend dashboard
       ✓ Verify DNS records
       ✓ Use: noreply@yourdomain.com
    
    6. IMPORTANT: User MUST exist in Supabase Auth
       ✓ Check Authentication → Users
       ✓ Email must be registered there, not just in clients table
    `)
  }
}

// Export singleton instance
const passwordResetService = new PasswordResetService()
export default passwordResetService
