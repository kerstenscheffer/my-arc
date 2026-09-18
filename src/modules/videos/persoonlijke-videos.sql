-- src/modules/videos/persoonlijke-videos.sql
--
-- coach_videos.is_personal — een video die voor één klant is gemaakt.
--
-- Zonder deze vlag stond het persoonlijke plan van de ene klant in de
-- bibliotheek van alle anderen: de bibliotheek toont immers alles wat de coach
-- actief heeft staan. Nu geldt: persoonlijk blijft uit de algemene lijst en
-- verschijnt bij de klant onder "Voor jou" zodra er een toewijzing ligt
-- (video_assignments).
--
-- Toegepast via migratie `coach_videos_is_personal`.

alter table public.coach_videos
  add column if not exists is_personal boolean not null default false;

comment on column public.coach_videos.is_personal is
  'Video voor één klant (plan, plan-aanpassing, persoonlijke uitleg). Blijft uit de algemene bibliotheek; verschijnt bij de klant onder "Voor jou" zodra hij is toegewezen.';

create index if not exists coach_videos_persoonlijk_idx
  on public.coach_videos (coach_id) where is_personal;

-- Bij het toepassen zijn de bestaande plan-video's gemarkeerd: video's met een
-- toewijzing aan hooguit twee klanten, zonder pagina-koppeling en niet in de
-- slider. Dat waren er twee ("Luc thuis workout plan", "Nieuw thuisworkout
-- plan"); de acht Meal Systeem-video's staan aan zeven klanten en bleven dus
-- algemeen.
