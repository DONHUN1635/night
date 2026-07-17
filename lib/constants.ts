import type { AwakeReason, MoodStatus } from '@/types/database';

export const AWAKE_REASONS: { value: AwakeReason; label: string }[] = [
  { value: 'nem_tudok_elaludni', label: 'Nem tudok elaludni' },
  { value: 'felebredtem', label: 'Felébredtem' },
  { value: 'ejszakai_mufszak', label: 'Éjszakai műszakban vagyok' },
  { value: 'gondolkodom', label: 'Gondolkodom valamin' },
  { value: 'stresszes_vagyok', label: 'Stresszes vagyok' },
  { value: 'maganyos_vagyok', label: 'Magányos vagyok' },
  { value: 'dolgozom', label: 'Dolgozom' },
  { value: 'csak_beszelgetnek', label: 'Csak beszélgetnék' },
  { value: 'jo_kedvem_van', label: 'Jó kedvem van' },
  { value: 'egyeb', label: 'Egyéb' },
];

export const MOODS: { value: MoodStatus; label: string }[] = [
  { value: 'nyugodt', label: 'Nyugodt' },
  { value: 'faradt', label: 'Fáradt' },
  { value: 'szomorú', label: 'Szomorú' },
  { value: 'aggodo', label: 'Aggódó' },
  { value: 'feszult', label: 'Feszült' },
  { value: 'jo_kedvu', label: 'Jó kedvű' },
  { value: 'gondolkodo', label: 'Gondolkodó' },
  { value: 'beszelgetnek', label: 'Beszélgetnék' },
];

export const STORY_CATEGORIES = [
  'Nem tudok aludni', 'Magány', 'Párkapcsolat', 'Család', 'Munka és stressz',
  'Éjszakai műszak', 'Mély gondolatok', 'Pozitív dolgok', 'Egyéb',
];

export const STORY_EXPIRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'egy_ora', label: '1 óra múlva' },
  { value: 'reggel_8', label: 'Reggel 8 órakor' },
  { value: 'huszonnegy_ora', label: '24 óra múlva' },
  { value: 'het_nap', label: '7 nap múlva' },
  { value: 'soha', label: 'Ne törlődjön automatikusan' },
];
