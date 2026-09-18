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
    // Alles hieronder liep stil stuk: een plugin die niet geladen is of een
    // geweigerde permissie gaf geen enkel spoor. Nu logt elke stap met [push]
    // ervoor, zodat je in de Xcode-console kunt filteren op "push".
    if (!this.isAvailable()) {
      console.log('[push] niet beschikbaar — platform:', Capacitor.getPlatform(), 'native:', Capacitor.isNativePlatform());
      return;
    }
    if (this._listenersAdded) {
      console.log('[push] luisteraars stonden al aan');
      return;
    }

    try {
      this._addListeners(userId, clientId);
      this._listenersAdded = true;

      const huidig = await PushNotifications.checkPermissions();
      console.log('[push] huidige permissie:', huidig.receive);

      const { receive } = huidig.receive === 'prompt' || huidig.receive === 'prompt-with-rationale'
        ? await PushNotifications.requestPermissions()
        : huidig;
      console.log('[push] permissie na vragen:', receive);

      if (receive !== 'granted') {
        console.warn('[push] geen toestemming — zet meldingen aan via Instellingen > MY ARC');
        return;
      }

      await PushNotifications.register();
      console.log('[push] register() aangeroepen, wachten op token…');
    } catch (e) {
      console.error('[push] init mislukt:', e?.message || e, e);
    }
  }

  _addListeners(userId, clientId) {
    PushNotifications.addListener('registration', async ({ value: token }) => {
      console.log('[push] token ontvangen:', String(token).slice(0, 12) + '…');
      await this._saveToken(userId, clientId, token);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] registratie geweigerd door iOS:', JSON.stringify(err));
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
      if (error) console.error('[push] opslaan mislukt:', error.message, error);
      else console.log('[push] token opgeslagen voor gebruiker', userId);
    } catch (e) {
      console.error('[push] opslaan mislukt:', e?.message || e);
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
