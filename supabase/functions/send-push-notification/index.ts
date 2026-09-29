// send-push-notification/index.ts
// Meldingen naar iPhone (APNs) en Android (Firebase Cloud Messaging). De
// Apple-config komt uit apns_config, het Google-serviceaccount uit fcm_config;
// allebei leest de service-role ze. Beveiliging: shared secret (x-push-secret)
// van de DB-trigger.
//
// 18 sep 2026: dit bestand liep achter op wat er live stond (het las de config
// alleen uit env-vars). Opnieuw opgehaald uit de deployment en daarna pas de
// sandbox-fallback toegevoegd — zie sendApns.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
};

async function buildApnsJwt(teamId: string, keyId: string, p8Key: string): Promise<string> {
  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const rawKey = p8Key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, cryptoKey, new TextEncoder().encode(unsigned)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${unsigned}.${sig}`;
}

// Een build die via Xcode op je toestel staat levert een sandbox-token; een
// TestFlight/App Store-build een productie-token. Ze werken alleen op hun eigen
// host, dus bij BadDeviceToken proberen we de andere. Met APNS_HOST
// ("production" of "sandbox") kun je het vastzetten.
const APNS_HOSTS: Record<string, string> = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
};

async function sendApns(
  cfg: { teamId: string; keyId: string; p8: string; bundleId: string },
  token: string, title: string, body: string, data: Record<string, unknown> = {}
): Promise<{ ok: boolean; error?: string }> {
  if (!cfg.teamId || !cfg.keyId || !cfg.p8) {
    return { ok: false, error: "APNs credentials not configured" };
  }
  const jwt = await buildApnsJwt(cfg.teamId, cfg.keyId, cfg.p8);
  const payload = { aps: { alert: { title, body }, sound: "default", badge: 1 }, ...data };

  const forced = Deno.env.get("APNS_HOST");
  const hosts = forced && APNS_HOSTS[forced]
    ? [APNS_HOSTS[forced]]
    : [APNS_HOSTS.production, APNS_HOSTS.sandbox];

  let lastError = "";
  for (const host of hosts) {
    const res = await fetch(`${host}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };

    const text = await res.text();
    const waar = host.includes("sandbox") ? "sandbox" : "production";
    lastError = `APNs ${res.status} (${waar}): ${text}`;
    // Alleen doorgaan naar de andere host als het toestel daar thuishoort.
    if (!text.includes("BadDeviceToken")) break;
  }
  return { ok: false, error: lastError };
}

// ── Android: Firebase Cloud Messaging ─────────────────────────────────────
//
// Apple en Google spreken een ander protocol. Bij Apple onderteken je elk
// verzoek zelf met een JWT; bij Google ruil je een ondertekende JWT eerst in
// voor een toegangstoken en stuur je dáármee. Vandaar twee aparte paden.
//
// Het toegangstoken is een uur geldig. We bewaren het in de isolate, zodat
// tien meldingen achter elkaar niet tien keer een token gaan halen.
let fcmToken: { waarde: string; verlooptOp: number } | null = null;

async function buildGoogleJwt(clientEmail: string, privateKey: string): Promise<string> {
  const nu = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: nu,
    exp: nu + 3600,
  };
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${encode(header)}.${encode(payload)}`;

  // De sleutel komt uit JSON, dus met \n als letterlijke tekens.
  const pem = privateKey
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${unsigned}.${sig}`;
}

async function getFcmAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  if (fcmToken && fcmToken.verlooptOp > Date.now() + 60_000) return fcmToken.waarde;
  const jwt = await buildGoogleJwt(sa.client_email, sa.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`FCM-token halen mislukt: ${res.status} ${JSON.stringify(json)}`);
  }
  fcmToken = { waarde: json.access_token, verlooptOp: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return fcmToken.waarde;
}

async function sendFcm(
  sa: { project_id: string; client_email: string; private_key: string } | null,
  token: string, title: string, body: string, data: Record<string, unknown> = {},
): Promise<{ ok: boolean; error?: string }> {
  if (!sa?.private_key || !sa?.client_email || !sa?.project_id) {
    return { ok: false, error: "FCM niet geconfigureerd (fcm_config leeg)" };
  }
  try {
    const access = await getFcmAccessToken(sa);
    // FCM eist dat alles in `data` tekst is; getallen of objecten worden
    // geweigerd met een vage 400.
    const dataTekst: Record<string, string> = {};
    for (const [k, v] of Object.entries(data ?? {})) {
      dataTekst[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${access}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: dataTekst,
            android: { priority: "high", notification: { sound: "default" } },
          },
        }),
      },
    );
    if (res.ok) return { ok: true };
    const tekst = await res.text();
    return { ok: false, error: `FCM ${res.status}: ${tekst.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: `FCM: ${e instanceof Error ? e.message : String(e)}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Config uit de tabel (fallback op env-vars).
  const { data: row } = await supabaseAdmin.from("apns_config").select("*").eq("id", 1).maybeSingle();
  const cfg = {
    teamId:   row?.team_id   ?? Deno.env.get("APNS_TEAM_ID")   ?? "",
    keyId:    row?.key_id    ?? Deno.env.get("APNS_KEY_ID")    ?? "",
    p8:       row?.auth_key  ?? Deno.env.get("APNS_AUTH_KEY")  ?? "",
    bundleId: row?.bundle_id ?? Deno.env.get("APNS_BUNDLE_ID") ?? "com.myarcfitness.app",
  };
  const hookSecret = row?.hook_secret ?? Deno.env.get("PUSH_HOOK_SECRET") ?? "";

  // Serviceaccount voor Android. Staat in een eigen tabel omdat het een heel
  // ander soort sleutel is dan die van Apple.
  const { data: fcmRow } = await supabaseAdmin
    .from("fcm_config").select("service_account").eq("id", 1).maybeSingle();
  const sa = (fcmRow?.service_account ?? null) as
    { project_id: string; client_email: string; private_key: string } | null;

  if (hookSecret && req.headers.get("x-push-secret") !== hookSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...CORS, "content-type": "application/json" },
    });
  }

  try {
    const { client_id, user_id, title, body, data } = await req.json();
    if (!title || !body || (!client_id && !user_id)) {
      return new Response(JSON.stringify({ error: "title, body, and client_id or user_id are required" }), {
        status: 400, headers: { ...CORS, "content-type": "application/json" },
      });
    }
    let resolvedUserId = user_id;
    if (!resolvedUserId && client_id) {
      const { data: client } = await supabaseAdmin
        .from("clients").select("auth_user_id").eq("id", client_id).single();
      resolvedUserId = client?.auth_user_id;
    }
    if (!resolvedUserId) {
      return new Response(JSON.stringify({ error: "Could not resolve user_id" }), {
        status: 400, headers: { ...CORS, "content-type": "application/json" },
      });
    }
    // Alle toestellen van deze gebruiker, ongeacht platform. Hier stond een
    // filter op "ios", waardoor een Android-klant nooit iets kreeg -- ook niet
    // als zijn toestel keurig geregistreerd stond.
    const { data: rows, error: tokenError } = await supabaseAdmin
      .from("device_push_tokens").select("token, platform").eq("user_id", resolvedUserId);
    if (tokenError) throw tokenError;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, note: "No device tokens registered" }), {
        headers: { ...CORS, "content-type": "application/json" },
      });
    }
    const results = await Promise.all(rows.map((r) =>
      r.platform === "android"
        ? sendFcm(sa, r.token, title, body, data ?? {})
        : sendApns(cfg, r.token, title, body, data ?? {})
    ));
    const sent = results.filter((r) => r.ok).length;
    const errors = results.filter((r) => !r.ok).map((r) => r.error);
    const perPlatform = {
      ios: rows.filter((r) => r.platform !== "android").length,
      android: rows.filter((r) => r.platform === "android").length,
    };
    return new Response(JSON.stringify({ sent, errors, toestellen: perPlatform }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
