// send-push-notification/index.ts
// APNs push. Config komt uit de apns_config-tabel (service-role leest 'm), met
// fallback op env-vars. Beveiliging: shared secret (x-push-secret) van de DB-trigger.
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
    const { data: rows, error: tokenError } = await supabaseAdmin
      .from("device_push_tokens").select("token").eq("user_id", resolvedUserId).eq("platform", "ios");
    if (tokenError) throw tokenError;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, note: "No device tokens registered" }), {
        headers: { ...CORS, "content-type": "application/json" },
      });
    }
    const results = await Promise.all(rows.map((r) => sendApns(cfg, r.token, title, body, data ?? {})));
    const sent = results.filter((r) => r.ok).length;
    const errors = results.filter((r) => !r.ok).map((r) => r.error);
    return new Response(JSON.stringify({ sent, errors }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
