// send-push-notification/index.ts
// Supabase Edge Function for sending APNs push notifications.
// Required env vars (set via: supabase secrets set KEY=value):
//   APNS_AUTH_KEY   — full content of the .p8 file (Apple Developer portal → Keys)
//   APNS_KEY_ID     — 10-char key ID shown in Apple Developer portal
//   APNS_TEAM_ID    — 10-char Team ID from Apple Developer account
//   APNS_BUNDLE_ID  — "com.myarcfitness.app"
//   SUPABASE_URL    — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Build APNs JWT — valid for 1 hour
async function buildApnsJwt(teamId: string, keyId: string, p8Key: string): Promise<string> {
  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const unsigned = `${headerB64}.${payloadB64}`;

  // Strip PEM wrapper and decode raw key bytes
  const rawKey = p8Key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${unsigned}.${sig}`;
}

async function sendApns(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ ok: boolean; error?: string }> {
  const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";
  const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
  const p8Key = Deno.env.get("APNS_AUTH_KEY") ?? "";
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "com.myarcfitness.app";

  if (!teamId || !keyId || !p8Key) {
    return { ok: false, error: "APNs credentials not configured (APNS_TEAM_ID / APNS_KEY_ID / APNS_AUTH_KEY)" };
  }

  const jwt = await buildApnsJwt(teamId, keyId, p8Key);
  const url = `https://api.push.apple.com/3/device/${token}`;

  const payload = {
    aps: { alert: { title, body }, sound: "default", badge: 1 },
    ...data,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `APNs ${res.status}: ${text}` };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { client_id, user_id, title, body, data } = await req.json();

    if (!title || !body || (!client_id && !user_id)) {
      return new Response(JSON.stringify({ error: "title, body, and client_id or user_id are required" }), {
        status: 400,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Resolve user_id from client_id if needed
    let resolvedUserId = user_id;
    if (!resolvedUserId && client_id) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("user_id")
        .eq("id", client_id)
        .single();
      resolvedUserId = client?.user_id;
    }

    if (!resolvedUserId) {
      return new Response(JSON.stringify({ error: "Could not resolve user_id" }), {
        status: 400,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }

    // Get all tokens for this user
    const { data: rows, error: tokenError } = await supabaseAdmin
      .from("device_push_tokens")
      .select("token")
      .eq("user_id", resolvedUserId)
      .eq("platform", "ios");

    if (tokenError) throw tokenError;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, note: "No device tokens registered" }), {
        headers: { ...CORS, "content-type": "application/json" },
      });
    }

    const results = await Promise.all(
      rows.map((r) => sendApns(r.token, title, body, data ?? {}))
    );

    const sent = results.filter((r) => r.ok).length;
    const errors = results.filter((r) => !r.ok).map((r) => r.error);

    return new Response(JSON.stringify({ sent, errors }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
