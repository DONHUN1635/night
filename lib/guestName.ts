// Véletlenszerű, hangulatos vendégnevek generálása a "Hajnali Beszélgetések"-hez.

const ELOTAGOK = [
  'Álmatlan', 'Éjjeli', 'Holdjáró', 'Hajnali', 'Csendes', 'Ébren Lévő',
  'Fáradt', 'Titkos', 'Csillagfényes', 'Éjfél Utáni', 'Nyugtalan', 'Szürkületi',
];

const UTOTAGOK = [
  'Róka', 'Bagoly', 'Utazó', 'Vándor', 'Ábrándozó', 'Álmodozó',
  'Csillag', 'Hold', 'Denevér', 'Macska', 'Költő', 'Gondolkodó',
];

export function generateGuestName(): string {
  const elotag = ELOTAGOK[Math.floor(Math.random() * ELOTAGOK.length)];
  const utotag = UTOTAGOK[Math.floor(Math.random() * UTOTAGOK.length)];
  const szam = Math.floor(Math.random() * 98) + 1;
  return `${elotag}${utotag}${szam}`;
}

export function generateDeviceToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
