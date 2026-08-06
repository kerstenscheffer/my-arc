// PushNotificationService.js
// Handles APNs device token registration and storage for native iOS push notifications.
// Requires: @capacitor/push-notifications installed, Push Notifications capability enabled in Xcode,
// and APNs credentials configured in the send-push-notification Edge Function.

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase.js';

class PushNotificationService {
  constructor() {
    this._listenersAdded = false;
  }

  isAvailable() {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  }

  async init(userId, clientId = null) {
    if (!this.isAvailable()) return;
    if (this._listenersAdded) return;

    this._addListeners(userId, clientId);
    this._listenersAdded = true;

    const { receive } = await PushNotifications.requestPermissions();
    if (receive === 'granted') {
      await PushNotifications.register();
    }
  }

  _addListeners(userId, clientId) {
    PushNotifications.addListener('registration', async ({ value: token }) => {
      await this._saveToken(userId, clientId, token);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    // Foreground notification — you can dispatch a custom event here if needed
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification.title);
    });
  }

  async _saveToken(userId, clientId, token) {
    try {
      const { error } = await supabase
        .from('device_push_tokens')
        .upsert(
          { user_id: userId, client_id: clientId, token, platform: 'ios', updated_at: new Date().toISOString() },
          { onConflict: 'user_id,token' }
        );
      if (error) console.error('Failed to save push token:', error);
    } catch (e) {
      console.error('Failed to save push token:', e);
    }
  }

  async removeToken(userId) {
    if (!this.isAvailable()) return;
    try {
      const { error } = await supabase
        .from('device_push_tokens')
        .delete()
        .eq('user_id', userId);
      if (error) console.error('Failed to remove push token:', error);
    } catch (e) {
      console.error('Failed to remove push token:', e);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
