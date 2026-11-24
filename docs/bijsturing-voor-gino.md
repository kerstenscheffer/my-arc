# Bijsturing schrijven (voor Gino, na een call-transcript)

Eén rij per klant per call in `client_coaching_logs`. De nieuwste rij verschijnt
als label rechtsboven de klantkaart in Command (kleur = status).

```sql
insert into client_coaching_logs (client_id, coach_id, status, category, note, data)
values (
  '<client_id>', '5a0135ac-3188-499d-8682-ed6a179e5541',
  'on_track',                      -- crushing_it | on_track | needs_attention | off_track
  'bijsturing',
  '<punt> → <bijsturing>',         -- leesbaar in het logboek
  jsonb_build_object(
    'punt', '<laatste punt, max ~8 woorden>',
    'bijsturing', '<wat er deze week anders gaat, max ~8 woorden>',
    'details', '<optioneel: 1-3 zinnen context>',
    'bron', 'gino'
  )
);
```

- Kort houden: het label toont `punt → bijsturing` op één regel; details pas bij hover.
- Kleur: groen = crushing_it/on_track, oranje = needs_attention, rood = off_track.
- Niet dubbel: is er vandaag al een bijsturing van Gino voor deze klant, dan niet nog een.
