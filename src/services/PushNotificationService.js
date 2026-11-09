// PushNotificationService.js
// Handles APNs device token registration and storage for native iOS push notifications.
// Requires: @capacitor/push-notifications installed, Push Notifications capability enabled in Xcode,
// and APNs credentials configured in the send-push-notification Edge Function.

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase.js';
import { openUitMelding } from '../modules/video-feedback/feedbackOpenen';
import { openKlantkaart } from '../modules/coach-command-center/klantkaartOpenen';

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

  // Elke push zet badge 1 op het icoon en iOS haalt die nooit zelf weg.
  // removeAllDeliveredNotifications zet hem op 0, maar de plugin weigert dat tot
  // iOS de registratie heeft gemeld. Vandaar: wissen bij 'registration' (de
  // opstart) en bij terugkeer. Een weigering is onschuldig, de volgende keer lukt het.
  async wisBadge() {
    if (!this.isAvailable()) return;
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (e) {
      console.log('[push] badge niet gewist:', e?.message || e);
    }
  }

  async _wisBadgeBijTerugkeer() {
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) this.wisBadge();
      });
    } catch (e) {
      console.warn('[push] terugkeer-luisteraar niet geïnstalleerd:', e?.message || e);
    }
  }

  _addListeners(userId, clientId) {
    this._wisBadgeBijTerugkeer();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      console.log('[push] token ontvangen:', String(token).slice(0, 12) + '…');
      this.wisBadge();
      await this._saveToken(userId, clientId, token);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] registratie geweigerd door iOS:', JSON.stringify(err));
      this.wisBadge();
    });

    // Foreground notification — you can dispatch a custom event here if needed
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification.title);
    });

    // Tik op een push: naar de juiste plek in de app. trigger_data komt mee
    // vanuit de trigger op notifications (bv. feedback op een techniekvideo).
    PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const data = notification?.data || {};
      // Gino-herinnering (alleen naar de coach): open Business OS in CoachHub.
      if (data.soort === 'gino_herinnering' || data.soort === 'gino_toestemming') {
        window.location.hash = 'business-os';
        return;
      }
      // Verjaardag (alleen naar de coach): klantkaart, of Command bij meerdere.
      if (data.soort === 'verjaardag') {
        openKlantkaart(data.client_id);
        return;
      }
      openUitMelding(data.trigger_data);
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
