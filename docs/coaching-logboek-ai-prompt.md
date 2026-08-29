# Logboek op de client-card — voor een AI die hierheen wil schrijven

Dit beschrijft het "Logboek"-modal dat opent vanaf een client-card in Coach Command
(`src/modules/coach-command-center/components/CoachingLogModal.jsx`).

## Eén tabel: `client_coaching_logs`

Alles wat je in dat modal ziet — de notities, de statuschips én de paarse
WIJZIGING-regels — komt uit deze ene tabel. Er is geen tweede tabel in het spel.

| Kolom | Type | Verplicht | Default | Betekenis |
|---|---|---|---|---|
| `id` | uuid | — | `gen_random_uuid()` | |
| `client_id` | uuid | **ja** | — | naar `clients.id` |
| `coach_id` | uuid | nee | `null` | auth-user van de coach |
| `status` | text | **ja** | `'on_track'` | zie hieronder |
| `note` | text | **ja** | `''` | de tekst van de regel |
| `category` | text | nee | `'algemeen'` | bepaalt onder welk tabblad hij valt |
| `created_at` | timestamptz | nee | `now()` | tijdlijn sorteert hierop, nieuwste eerst |

De tabel is ~98 rijen groot en actief in gebruik.

### Toegestane waarden

`status` — de vier chips onder de tabbladen:

| Waarde | Label in de UI |
|---|---|
| `on_track` | Op schema |
| `crushing_it` | On fire 🔥 |
| `needs_attention` | Aandacht nodig |
| `off_track` | Off track |

`category` — de tabbladen bovenin:

| Waarde | Label | Wie schrijft het |
|---|---|---|
| `algemeen` | Algemeen | coach, handmatig |
| `status` | Status | coach, handmatig |
| `whatsapp` | WhatsApp | coach, handmatig |
| `call_prep` | Call prep | coach, handmatig |
| `change_log` | Wijziging | **automatisch**, zie onder |

Er staat **geen check-constraint** op deze kolommen. Schrijf je een andere waarde,
dan gaat de insert gewoon door maar valt de regel buiten elk filter en toont de
UI hem verkeerd. Houd je dus aan bovenstaande lijst.

## Schrijven

```sql
insert into client_coaching_logs (client_id, coach_id, status, note, category)
values ('<client-uuid>', '<coach-uuid>', 'on_track', 'Jouw notitie', 'algemeen');
```

RLS staat op `authenticated_all_access` (ALL, `true`/`true`): elke ingelogde
gebruiker mag lezen en schrijven. Er is dus **geen** filter op coach of klant —
zorg zelf dat `client_id` klopt.

`note` mag meerdere regels bevatten; de UI toont ze met behoud van regeleindes.

## De WIJZIGING-regels (`category = 'change_log'`)

Die schrijf je normaal **niet met de hand**. Ze worden gegenereerd door
`src/modules/coach-command-center/utils/clientChangeLogger.js` zodra een coach
een doel of macro van de klant aanpast:

```js
const before = pickTrackedFields(client)
await db.supabase.from('clients').update(payload).eq('id', client.id)
await logClientChanges({ db, clientId: client.id, before, after: payload, source })
```

De note wordt opgebouwd als `Label: oud → nieuw`, één per regel — bijvoorbeeld
`TDEE: 2092 kcal → 1882 kcal`. Getrackte kolommen op `clients`:

`primary_goal`, `goal_deadline`, `start_weight`, `current_weight`,
`target_weight`, `goal_weight`, `current_body_fat`, `target_body_fat`, `tdee`,
`surplus`, `target_calories`, `target_protein`, `target_carbs`, `target_fat`,
`manual_macro_targets`, `manual_tdee`.

Pas je een van die velden op `clients` aan, gebruik dan die helper in plaats van
zelf een `change_log`-regel te schrijven — anders loopt de opmaak uiteen en
verschijnen er dubbele regels.

## Wat de UI met je rij doet

- **Tijdlijn**: laatste 100 rijen van die klant, `created_at` aflopend.
- **Statuschip bovenin**: overgenomen van de **nieuwste** rij. Schrijf je een
  regel met een afwijkende `status`, dan verandert daarmee de status van de klant
  in beeld. Wil je dat niet, neem dan de status van de vorige rij over.
- **Tabbladen**: filteren op `category`; "Alle" toont alles.
