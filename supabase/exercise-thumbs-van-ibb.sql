-- Oefening-thumbnails weg van i.ibb.co (ImgBB laadt slecht: adblockers, mobiel).
-- NOG NIET UITGEVOERD — eerst goedkeuren.
--
-- Volgorde:
--   1. sh scripts/download-ibb-thumbs.sh   → 34 unieke PNG's in public/exercise-thumbs/
--   2. npm run release                     → staat live op www.myarcfitness.com/exercise-thumbs/
--   3. controleer één url in de browser, bv. https://www.myarcfitness.com/exercise-thumbs/1GsTWxvZ.png
--   4. dit script draaien (raakt alleen de 44 rijen die nog op ibb staan)
--
-- Bestandsnaam = de ImgBB-code uit de url (https://i.ibb.co/<code>/<naam>.png),
-- want "8.png" en "Green-Linked-In-...-7.png" komen meerdere keren voor met
-- verschillende codes. Oude app-versies lezen gewoon de nieuwe url; geen kolom
-- of vorm verandert.

begin;

-- Vooraf: 44 verwacht
select count(*) as nog_op_ibb from exercises where thumbnail_url ilike '%i.ibb.co/%';

update exercises
set thumbnail_url = 'https://www.myarcfitness.com/exercise-thumbs/'
                    || split_part(substring(thumbnail_url from 'i\.ibb\.co/(.*)$'), '/', 1)
                    || '.png'
where thumbnail_url ilike 'https://i.ibb.co/%';

-- Achteraf: 0 verwacht, en 44 op het nieuwe adres
select count(*) filter (where thumbnail_url ilike '%i.ibb.co/%')                        as nog_op_ibb,
       count(*) filter (where thumbnail_url like 'https://www.myarcfitness.com/exercise-thumbs/%') as verhuisd
from exercises;

commit;

-- Terugdraaien kan niet uit de nieuwe url alleen (de oorspronkelijke
-- bestandsnaam zit er niet in). Daarom de lijst van vóór de wijziging
-- (id → oude url, 30 okt 2026) in supabase/exercise-thumbs-ibb-backup.csv.
