-- Trustpilot-reviews voor de homepage (20 nov 2026). Alleen toevoegen, nooit weghalen.
-- Gevuld door de dagelijkse cloud-routine (Gmail-mails van Trustpilot + score van de profielpagina).
create table if not exists public.trustpilot_reviews (
  id text primary key,                 -- Trustpilot review-id (uit de link in de mail)
  naam text not null,
  sterren int not null default 5 check (sterren between 1 and 5),
  tekst text not null,
  highlight text,                      -- korte kern, vet op de kaart
  datum date not null,
  zichtbaar boolean not null default true,  -- false = niet op de site (familie, geen naam)
  bron text not null default 'gmail',
  created_at timestamptz not null default now()
);
create table if not exists public.trustpilot_stand (
  id int primary key default 1 check (id = 1),
  trustscore numeric(2,1) not null,
  aantal int not null,
  bijgewerkt timestamptz not null default now()
);
alter table public.trustpilot_reviews enable row level security;
alter table public.trustpilot_stand enable row level security;
drop policy if exists iedereen_leest_zichtbare_reviews on public.trustpilot_reviews;
create policy iedereen_leest_zichtbare_reviews on public.trustpilot_reviews for select to anon, authenticated using (zichtbaar);
drop policy if exists iedereen_leest_stand on public.trustpilot_stand;
create policy iedereen_leest_stand on public.trustpilot_stand for select to anon, authenticated using (true);
grant select on public.trustpilot_reviews, public.trustpilot_stand to anon, authenticated;

insert into public.trustpilot_stand (id, trustscore, aantal, bijgewerkt) values (1, 4.4, 11, now())
on conflict (id) do update set trustscore = excluded.trustscore, aantal = excluded.aantal, bijgewerkt = now();

insert into public.trustpilot_reviews (id, naam, sterren, tekst, highlight, datum, zichtbaar, bron) values
('6aff0bb7394b4f99498c57d1','Casper',5,'Kersten was een betrokken coach die me goed heeft geholpen om gezonde routines op te bouwen. De app is fijn om alles op een plek te hebben. Ik waardeerde dat Kersten fijne resources had om te delen en open stond voor feedback om de app nog verder te verbeteren.','Heeft me goed geholpen om gezonde routines op te bouwen','2026-11-19',true,'gmail'),
('6af6cd04dea9804791e90338','Michael',5,'Super handige app met duidelijke uitleg over wat je kunt verwachten en hoe alles in zijn werk gaat! Je wordt op een leuke en motiverende manier aangemoedigd, zowel op privégebied als op sportief vlak. Er is oprechte interesse in wie je bent, wat je doet en waar je naartoe wilt werken. Waar nodig krijg je goede begeleiding, tips en bijsturing. Ook de leuke en inspirerende filmpjes via social media maken het extra leuk en motiverend! Kortom: een fijne, betrokken en motiverende online Coach','Oprechte interesse in wie je bent en waar je naartoe wilt werken','2026-11-13',true,'gmail'),
('6ae8ecd46160772daaa43d79','Erwin',5,'Super fijne coaching. Duidelijk en overzichtelijke app. Kan het iedereen aanraden.','Super fijne coaching. Kan het iedereen aanraden.','2026-11-02',true,'gmail'),
('699832265d5794f3b1818ec5','Hessel',5,'Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf. Als jij je aan het plan houd zal Kersten altijd de volle 100% geven!','Van 79,8 naar 74,4 kg in 8 weken','2026-02-20',true,'site'),
('690b3ad3757c4aeacd78784f','Sassus',5,'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal heeft Kersten mij goed geholpen.','Na 100 mislukte pogingen is het eindelijk gelukt','2025-11-05',true,'site'),
('690b5070d178b96da548b114','Toon',5,'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!','Super coach, altijd enthousiast','2025-11-05',true,'site'),
('6908e27fc732584ec7579b7c','Klant via Trustpilot',5,'Alles duidelijk en gestructureerd in een overzichtelijke app. Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten. Een absolute aanrader voor wie op een duurzame manier fitter wil worden!','Volgt je progressie actief op','2025-11-03',true,'site'),
('692dcd4606058aab496acc71','Indi',5,'Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb.',null,'2025-12-01',false,'site'),
('692e92eac06f79d199dd45f9','Me',5,'Als je hulp nodig hebt met sporten raad ik Myarc echt aan.',null,'2025-12-02',false,'site')
on conflict (id) do nothing;
