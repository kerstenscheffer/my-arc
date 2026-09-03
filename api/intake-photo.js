// api/intake-photo.js
//
// Profielfoto uit de publieke intake opslaan.
//
// De intake draait zonder login, dus de browser mag niet zelf in storage
// schrijven — dan zou de bucket voor iedereen openstaan. In plaats daarvan
// stuurt de pagina de foto hierheen en uploadt deze functie met de service
// key. De bucket client-photos heeft daarom bewust alleen een leespolicy.
//
// Wat er hier gecontroleerd wordt voordat er iets wordt weggeschreven:
//   - e-mailadres hoort bij een bestaande klant (anders geen doel)
//   - het is echt een afbeelding, en van een toegestaan type
//   - de foto is niet groter dan 3 MB
// De bestandsnaam komt uit het klant-id, nooit uit invoer van de gebruiker.
import { createClient } from '@supabase/supabase-js';

const VERSION = 'ip-2026-09-03';

const HARDCODED_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTEzNDUsImV4cCI6MjA3MDU4NzM0NX0.19WRJrOO4Yll95w9j8qa8ZgoXFiwPK39farBuNSyd6c';

const MAX_BYTES = 3 * 1024 * 1024;
const TOEGESTAAN = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function isValidHttpUrl(u) {
  if (!u || typeof u !== 'string') return false;
  try {
    const p = new URL(u.trim());
    return p.protocol === 'https:' || p.protocol === 'http:';
  } catch { return false; }
}

function pickUrl() {
  for (const v of [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]) {
    if (isValidHttpUrl(v)) return v.trim();
  }
  return 'https://xlaycpwpnhjmulfsnynh.supabase.co';
}

// Alleen een service key kan in client-photos schrijven. Zonder die key
// mislukt de upload — dat is beter dan stilletjes de anon-key gebruiken en
// een onduidelijke fout krijgen, dus we melden het expliciet.
function pickKey() {
  for (const [naam, v] of [
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY],
  ]) {
    if (v && v.trim().startsWith('eyJ')) return { naam, val: v.trim(), isService: true };
  }
  for (const [naam, v] of [
    ['SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY],
    ['VITE_SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY],
  ]) {
    if (v && v.trim().startsWith('eyJ')) return { naam, val: v.trim(), isService: false };
  }
  return { naam: 'HARDCODED_ANON', val: HARDCODED_ANON, isService: false };
}

let _client = null;
function getClient() {
  if (!_client) _client = createClient(pickUrl(), pickKey().val);
  return _client;
}

// "data:image/jpeg;base64,AAAA…" → { mime, bytes }
function leesDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return { fout: 'Geen afbeelding meegestuurd' };
  const m = /^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!m) return { fout: 'Onherkenbare afbeelding' };
  const mime = m[1].toLowerCase();
  if (!TOEGESTAAN[mime]) return { fout: `Type ${mime} niet toegestaan (jpg, png of webp)` };
  let bytes;
  try { bytes = Buffer.from(m[2], 'base64'); } catch { return { fout: 'Afbeelding kon niet gelezen worden' }; }
  if (!bytes.length) return { fout: 'Lege afbeelding' };
  if (bytes.length > MAX_BYTES) return { fout: `Te groot (${Math.round(bytes.length / 1024)} kB, max 3 MB)` };
  return { mime, bytes, ext: TOEGESTAAN[mime] };
}

export default async function handler(req, res) {
  if (req.method === 'GET' || req.query?.diag === '1') {
    const k = pickKey();
    return res.status(200).json({
      version: VERSION,
      keySource: k.naam,
      serviceKeyAanwezig: k.isService,
      url: pickUrl(),
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, dataUrl } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'E-mailadres ontbreekt' });

    const foto = leesDataUrl(dataUrl);
    if (foto.fout) return res.status(400).json({ error: foto.fout });

    const key = pickKey();
    if (!key.isService) {
      return res.status(500).json({
        error: 'Serverconfiguratie onvolledig: geen service key. De bucket client-photos staat bewust dicht voor anonieme schrijvers.',
      });
    }

    const supabase = getClient();

    // Klant opzoeken op e-mail. Zonder bestaande klant slaan we niets op:
    // anders kan iedereen de bucket volschrijven met willekeurige adressen.
    const { data: klant, error: zoekFout } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', email.trim())
      .limit(1)
      .maybeSingle();
    if (zoekFout) throw zoekFout;
    if (!klant) return res.status(404).json({ error: 'Geen klant gevonden bij dit e-mailadres' });

    // Pad uit het klant-id, niet uit invoer. Vaste naam per klant zodat een
    // nieuwe foto de oude vervangt in plaats van bestanden op te stapelen.
    const pad = `${klant.id}/profiel.${foto.ext}`;
    const { error: uploadFout } = await supabase.storage
      .from('client-photos')
      .upload(pad, foto.bytes, { contentType: foto.mime, upsert: true });
    if (uploadFout) throw uploadFout;

    const { data: pub } = supabase.storage.from('client-photos').getPublicUrl(pad);
    // Cache-buster: de naam blijft gelijk, dus zonder dit blijft de browser
    // de oude foto tonen na een nieuwe upload.
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: updateFout } = await supabase
      .from('clients')
      .update({ profile_photo_url: url })
      .eq('id', klant.id);
    if (updateFout) throw updateFout;

    return res.status(200).json({ success: true, url });
  } catch (e) {
    console.error('intake-photo failed:', e);
    return res.status(500).json({ error: e.message || 'Upload mislukt' });
  }
}
