package com.myarcfitness.app;

// Rusttimer op het vergrendelscherm (17 nov 2026, Kersten).
//
// Een vaste, stille melding met een klok die zelf aftelt (Android's eigen
// chronometer): die loopt door met het scherm uit, zonder dat er JavaScript
// draait. De bel op nul komt los daarvan uit rustMelding.js (LocalNotifications,
// kanaal met rustbel.wav).
//
// JS: src/modules/workout/components/todays-workout/rustLive.js

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RustTimer")
public class RustTimerPlugin extends Plugin {

    private static final String KANAAL = "rusttimer_klok";
    private static final int MELDING_ID = 7302; // 7301 is de bel
    private static final long NAIJLEN_MS = 5 * 60 * 1000;

    @PluginMethod
    public void toon(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(ctx,
                    Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                call.resolve(); // geen toestemming: stil overslaan, de klok in de app werkt gewoon
                return;
            }
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) { call.resolve(); return; }

            if (Build.VERSION.SDK_INT >= 26) {
                // Laag = geen geluid en geen pop-up, wel zichtbaar op het vergrendelscherm.
                NotificationChannel kanaal = new NotificationChannel(KANAAL, "Rusttimer (klok)", NotificationManager.IMPORTANCE_LOW);
                kanaal.setDescription("Lopende rusttijd op je vergrendelscherm");
                kanaal.setSound(null, null);
                kanaal.enableVibration(false);
                kanaal.setShowBadge(false);
                kanaal.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(kanaal);
            }

            long eind = call.getLong("eind", 0L);
            String oefening = call.getString("oefening", "");
            boolean pauze = Boolean.TRUE.equals(call.getBoolean("pauze", false));
            String pauzeTekst = call.getString("pauzeTekst", "");
            long nu = System.currentTimeMillis();

            Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            PendingIntent tik = open == null ? null : PendingIntent.getActivity(ctx, MELDING_ID, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, KANAAL)
                    .setSmallIcon(R.drawable.ic_stat_rust)
                    .setOngoing(true)
                    .setOnlyAlertOnce(true)
                    .setSilent(true)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setCategory("stopwatch") // Notification.CATEGORY_STOPWATCH (API 31), als tekst voor oudere SDK's
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setContentText(oefening.isEmpty() ? "MY ARC" : oefening);
            if (tik != null) b.setContentIntent(tik);

            if (pauze) {
                b.setContentTitle("Rust gepauzeerd · " + pauzeTekst).setShowWhen(false);
            } else {
                // Telt af tot de eindtijd en daarna door (-0:12): zo zie je ook
                // hoe lang je al over je rust heen zit, net als in de app.
                b.setContentTitle(eind > nu ? "Rust" : "Rust voorbij")
                        .setWhen(eind)
                        .setShowWhen(true)
                        .setUsesChronometer(true);
                if (Build.VERSION.SDK_INT >= 24) b.setChronometerCountDown(true);
                // Ruimt zichzelf op als de app intussen niet meer open gaat.
                b.setTimeoutAfter(Math.max(1000, eind - nu + NAIJLEN_MS));
            }
            nm.notify(MELDING_ID, b.build());
        } catch (Exception e) {
            // Nooit de app laten struikelen over een melding.
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(MELDING_ID);
        } catch (Exception e) { /* niets */ }
        call.resolve();
    }
}
