// Egyszerű, konzervatív jelzőszó-alapú felismerés súlyos veszélyhelyzetre utaló
// üzenetekhez (önkárosítás, öngyilkossági gondolat, közvetlen fenyegetés).
//
// FONTOS: ez NEM diagnosztizál és NEM helyettesíti a moderátori döntést.
// Csak arra szolgál, hogy a felhasználó felé megjelenítsük a segítségkérő
// panelt - a rendszer sosem állítja, hogy pszichológiai vagy orvosi
// szolgáltatást nyújtana.

const VESZELY_KULCSSZAVAK = [
  'nem akarok tovább élni',
  'véget vetnék az életemnek',
  'öngyilkos',
  'bántom magam',
  'nem bírom tovább',
  'nincs értelme semminek',
  'meg akarom ölni magam',
];

export function isPotentialCrisisMessage(content: string): boolean {
  const normalized = content.toLowerCase();
  return VESZELY_KULCSSZAVAK.some((kulcsszo) => normalized.includes(kulcsszo));
}
