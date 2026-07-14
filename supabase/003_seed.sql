-- ============================================================
-- KEZDŐ ADATOK
-- Futtasd a 002_rls.sql UTÁN.
-- ============================================================

insert into rooms (slug, name, description, icon, rules, is_default, sort_order) values
  ('nem-tudok-aludni', 'Nem tudok aludni', 'Ha forgolódsz és nem jön álom a szemedre, itt jó társaságra találsz.', '🌙', 'Légy türelmes és figyelmes egymással.', true, 1),
  ('csak-beszelgetnek', 'Csak beszélgetnék', 'Semmi különös téma, csak egy kis emberi szó éjszaka.', '💬', 'Nyitott, laza hangvétel, tisztelettel.', true, 2),
  ('maganysag', 'Magány', 'Egy tér azoknak, akik most egyedül érzik magukat.', '🕯️', 'Ítélkezésmentes figyelem, senkit ne hagyjunk egyedül a szobában.', true, 3),
  ('parkapcsolat', 'Párkapcsolat', 'Kapcsolati gondolatok, kérdések, örömök.', '💞', 'Ne oszd meg mások személyes adatait.', true, 4),
  ('csalad', 'Család', 'Családi témák, éjszakai aggodalmak és örömök.', '🏠', 'Tiszteld mások családi helyzetét.', true, 5),
  ('munka-es-stressz', 'Munka és stressz', 'Amikor a munka nem hagy nyugodni.', '💼', 'Konkrét munkahelyi nevek megosztása kerülendő.', true, 6),
  ('ejszakai-mufszak', 'Éjszakai műszak', 'Azoknak, akik dolgoznak, amíg mások alszanak.', '🏭', 'Fáradtan is legyünk kedvesek egymással.', true, 7),
  ('szulok-ejszakaja', 'Szülők éjszakája', 'Éjszakai szülői gondolatok, tapasztalatok.', '🍼', 'Ne osszatok meg gyermekekről azonosító adatot.', true, 8),
  ('vallalkozok-es-ejszakai-gondolatok', 'Vállalkozók és éjszakai gondolatok', 'Amikor az agyad nem áll le a projektekkel.', '🚀', 'Reklám és promóció nem megengedett.', true, 9),
  ('filmek-es-sorozatok', 'Filmek és sorozatok', 'Mit néztél mostanában?', '🎬', 'Spoiler figyelmeztetés kötelező.', true, 10),
  ('zene', 'Zene', 'Éjszakai zenei ajánlók, hangulatok.', '🎵', 'Oszd meg, mit hallgatsz most.', true, 11),
  ('jatekok', 'Játékok', 'Éjszakai gamer közösség.', '🎮', 'Tisztelettudó verseny, trash talk nélkül.', true, 12),
  ('vicces-tortenetek', 'Vicces történetek', 'Egy kis nevetés éjfél után.', '😄', 'Mások megalázása nélkül vicceljünk.', true, 13),
  ('mely-beszelgetesek', 'Mély beszélgetések', 'Nagy kérdések, amikre nappal nincs idő.', '🌌', 'Adjunk teret az elgondolkodásnak.', true, 14),
  ('nevtelen-vallomasok', 'Névtelen vallomások', 'Amit nehéz nappal kimondani.', '🎭', 'Ítélkezés helyett empátia.', true, 15),
  ('pozitiv-dolgok', 'Pozitív dolgok', 'Mi történt ma jó veled?', '✨', 'Kizárólag támogató hangnem.', true, 16),
  ('hajnali-filozofia', 'Hajnali filozófia', 'Filozofikus gondolatok napkelte előtt.', '🪐', 'Nyitottság más nézőpontokra.', true, 17)
on conflict (slug) do nothing;

insert into daily_questions (question_text, is_active_on) values
  ('Mi jár most a fejedben?', current_date),
  ('Mi volt ma a napod legjobb része?', null),
  ('Mi az, amit éjszaka könnyebb kimondani?', null),
  ('Milyen zenét hallgatsz, amikor nem tudsz aludni?', null),
  ('Mi az a gondolat, amely mindig hajnalban talál meg?', null),
  ('Mit szeretnél holnap másképp csinálni?', null);

-- Magyarországi krízisvonal - a szám adminisztrátori felületről bármikor módosítható
insert into crisis_resources (country_code, name, phone_number, url, description, sort_order) values
  ('HU', 'Lelki Elsősegély Telefonszolgálat', '116-123', 'https://www.116123.hu', 'Ingyenesen hívható, éjjel-nappal elérhető lelki segélyvonal Magyarországon.', 1);

insert into badges (code, name, description, icon) values
  ('jo_hallgato', 'Jó hallgató', 'A közösség szerint figyelmesen és empatikusan hallgat másokat.', '👂'),
  ('segitokesz_tag', 'Segítőkész tag', 'Rendszeresen támogatja a beszélgetéseket és az új tagokat.', '🤝');

insert into system_settings (key, value) values
  ('maintenance_mode', 'false'),
  ('min_age', '18'),
  ('night_push_default', 'false');
