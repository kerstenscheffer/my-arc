-- business-os-ontkenning.sql (3 nov 2026)
--
-- Vals alarm bij code-opdrachten: de zin "Geen meldingen naar klanten of leads"
-- gaf "kan een melding of bericht naar klanten sturen", terwijl hij het tegenovergestelde zegt.
--
-- Alleen aanvullend: één nieuwe functie, en business_os_opdracht_bewaakt houdt
-- dezelfde naam, invoer en uitvoer. Alleen de eerste regel (meldingen) leest nu de
-- tekst zonder ontkennende zinnen; de andere vier lezen de tekst nog precies als eerst.
-- Die eerste regel wordt tegelijk strenger: "Stuur alle leads een mail" en "Stuur alle
-- klanten de nieuwe prijs" kwamen er eerst doorheen zonder knop (kaal "mail", "appen",
-- "stuur ... klant"). Wat vroeger een echte actie zonder knop was, krijgt nu de knop.
--
-- Veilige kant: er verdwijnt alleen tekst die in zijn geheel een verbod is.
--   "Geen meldingen naar klanten."                 weg
--   "Stuur alle klanten een push, geen mail."      "geen mail" weg, de push blijft staan
--   "Klanten die geen mail kregen, stuur er een."  blijft staan: past niet op het patroon
--   "Geen meldingen naar klanten, behalve Jan."    blijft staan: uitzonderingswoord
--   "Er gaan geen meldingen. Repareer dat."        blijft staan: dan is het een klacht
-- Twijfel = de tekst blijft staan = toestemming vragen.

create or replace function public.business_os_zonder_ontkenning(p_tekst text)
returns text language sql immutable as $$
  select case
    -- Een uitzondering of klacht ergens in de tekst: niets weghalen.
    when p_tekst ~* '\m(behalve|tenzij|uitgezonderd|uitzondering|behoudens|except)\M|\m(repareer|repareren|fix|fixen|herstel|herstellen|los)\s+(dat|dit|het|deze|die)\M|\m(dat|dit|het)\s+moet\s+(wel|weer|anders)\M|\m(komen?|gaan?|werken?|werkt)\s+(nu\s+)?(niet|nog\s+niet)\M|\mkapot\M'
      then p_tekst
    else (
      select string_agg(
        case
          -- Maar, wel, als, tot...: de zin zegt meer dan alleen 'nee', dus hij blijft heel.
          when zin ~* '\m(maar|wel|alleen|alsnog|nog|pas|tot|totdat|als|indien|zodra|wanneer|mits|zonder|missen|mislopen|vergeten|overslaan)\M'
            then zin
          else regexp_replace(zin,
            -- Stuk tussen zinsbegin/komma en zinseinde/komma, helemaal volgens het patroon:
            '(^|,)\s*[-*•→–—]*\s*'
            -- Wie (optioneel): "Deze wijziging stuurt", "Kersten wil", "stuur klanten", "mag"
            || '(?:(?:deze wijziging|dit|hij|gino|de app|kersten|ik)\s+)?'
            || '(?:(?:stuur|stuurt|verstuur|verstuurt|mag|mogen|wil|wilt|maak|maakt|kan|kunnen|sturen|versturen)\s+)?'
            || '(?:(?:er|ook|dus|absoluut|verder|alle|de)\s+)*'
            || '(?:(?:klanten|klant|leads|lead)\s+)?'
            || '(?:'
              -- "geen meldingen" / "nooit een bericht" / "nooit dat Gino een melding, push of mail"
              || '(?:geen(?:\s+(?:enkele|enkel|extra|nieuwe|losse))?|nooit(?:\s+dat\s+[[:alpha:]]+)?(?:\s+(?:een|enkele))?)\s+'
              || '[[:alpha:]-]*(?:melding|notificatie|notification|push|mail|bericht|sms|appje|whatsapp)[[:alpha:]-]*'
              -- Opsomming alleen als hij op "of"/"noch" eindigt, anders kan de komma een nieuwe actie zijn.
              || '(?:(?:\s*,\s*(?:een\s+)?[[:alpha:]-]*(?:melding|notificatie|notification|push|mail|bericht|sms|appje|whatsapp)[[:alpha:]-]*)*'
              || '\s+(?:of|noch)\s+(?:een\s+)?[[:alpha:]-]*(?:melding|notificatie|notification|push|mail|bericht|sms|appje|whatsapp)[[:alpha:]-]*)?'
              -- "niets sturen" / "niets mailen" (hieronder moet dan een ontvanger staan of niet: de rest van de zin past of de zin blijft)
              || '|niets(?:\s+(?:sturen|versturen|mailen|pushen|appen))?'
            || ')'
            -- Werkwoord (optioneel) + ontvanger (optioneel) + werkwoord (optioneel), en dan moet het stuk op zijn.
            || '(?:\s+(?:sturen|versturen|mailen|pushen|appen|stuurt|verstuurt|gestuurd|verstuurd))?'
            || '(?:\s+(?:naar|aan|voor|richting)\s+(?:(?:de|alle|onze|mijn|een|andere)\s+)?(?:klanten|klant|clients|client|leads|lead|gebruikers|gebruiker)'
            || '(?:\s+(?:of|en)\s+(?:(?:de|alle|onze|mijn|een|andere)\s+)?(?:klanten|klant|clients|client|leads|lead|gebruikers|gebruiker))?)?'
            || '(?:\s+(?:sturen|versturen|mailen|pushen|appen|stuurt|verstuurt|gestuurd|verstuurd|worden|wordt|gaan|gaat)){0,2}'
            || '\s*(?=,|$)',
            '', 'gi')
        end,
        '. ' order by nr)
      from regexp_split_to_table(p_tekst, '[.!;:\n]+') with ordinality as t(zin, nr)
    )
  end
$$;

revoke all on function public.business_os_zonder_ontkenning(text) from public, anon;
grant execute on function public.business_os_zonder_ontkenning(text) to authenticated;

-- Code-opdracht: reden als hij een knop moet houden, anders null.
-- Zelfde regels als business-os-wijzigingen.sql, alleen de eerste leest zonder verboden.
create or replace function public.business_os_opdracht_bewaakt(p_tekst text)
returns text language sql immutable as $$
  select case
    when public.business_os_zonder_ontkenning(p_tekst) ~* 'melding|notificati|notification|push|e-?mail|mailtje|mailen|\mmails?\M|\mappen\M|\mapp\s+(alle\s+|mijn\s+|onze\s+)?(klant|lead)|appje|whatsapp|\msms\M|bericht.{0,40}(klant|lead)|(klant|lead).{0,40}bericht|\m(ver)?stu(u)?r(en|t)?\M.{0,40}(klant|lead)'
      then 'kan een melding of bericht naar klanten sturen'
    when p_tekst ~* 'workout_schemas|assigned_schema_id|workout_schedule|client_meal_plans|client_day_overrides|client_plan_proposals|macro|(klant|client).{0,60}(plan|schema|voeding|workout|training)|(plan|schema|voeding|workout|training).{0,60}(klant|client)'
      then 'raakt een klantplan'
    when p_tekst ~* 'instagram.{0,80}(publiceer|publiceren|live|post|plaats|upload)|(publiceer|publiceren|post|plaats|live).{0,80}instagram|autopilot_status'
      then 'plaatst live op Instagram'
    when p_tekst ~* 'npm run release|vercel --prod|live-update'
      then 'zet live (npm run release)'
    when p_tekst ~* 'stripe.{0,80}(afschrijv|charge|incasso|factu|invoice|refund|betaling|payment)|(afschrijv|charge|incasso).{0,80}stripe'
      then 'echte Stripe-afschrijving'
  end
$$;

revoke all on function public.business_os_opdracht_bewaakt(text) from public, anon;
grant execute on function public.business_os_opdracht_bewaakt(text) to authenticated;
