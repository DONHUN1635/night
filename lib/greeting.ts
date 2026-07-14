// Az aktuális óra alapján visszaadja a megfelelő éjszakai köszöntést.
export function getNightGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 18 && hour < 22) return 'Jó estét';
  if (hour >= 22 || hour < 2) return 'Csendes éjszakát';
  if (hour >= 2 && hour < 5) return 'Még mindig ébren?';
  return 'Jó hajnalt';
}
