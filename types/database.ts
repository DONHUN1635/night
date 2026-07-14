// Kézzel karbantartott alap típusok a projektben ténylegesen használt táblákhoz.
// Éles projektben cseréld le a Supabase CLI generált teljes sémára:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts

export type MoodStatus =
  | 'nyugodt' | 'faradt' | 'szomorú' | 'aggodo' | 'feszult'
  | 'jo_kedvu' | 'gondolkodo' | 'beszelgetnek';

export type AwakeReason =
  | 'nem_tudok_elaludni' | 'felebredtem' | 'ejszakai_mufszak' | 'gondolkodom'
  | 'stresszes_vagyok' | 'maganyos_vagyok' | 'dolgozom' | 'csak_beszelgetnek'
  | 'jo_kedvem_van' | 'egyeb';

export type UserRole = 'vendeg' | 'regisztralt' | 'megbizhato' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  birth_year: number | null;
  role: UserRole;
  current_mood: MoodStatus | null;
  awake_reason: AwakeReason | null;
  show_status_on_profile: boolean;
  presence: 'elerheto' | 'elfoglalt' | 'nem_zavarhato' | 'lathatatlan';
  hide_online_status: boolean;
  allow_private_messages: 'barki' | 'csak_regisztralt' | 'senki';
  is_banned: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  rules: string | null;
  is_default: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  author_profile_id: string | null;
  author_guest_id: string | null;
  author_display_name: string;
  content: string;
  reply_to_message_id: string | null;
  image_url: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestSession {
  id: string;
  guest_name: string;
  device_token: string;
  current_mood: MoodStatus | null;
  awake_reason: AwakeReason | null;
  created_at: string;
  expires_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      rooms: { Row: Room; Insert: Partial<Room>; Update: Partial<Room> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      guest_sessions: { Row: GuestSession; Insert: Partial<GuestSession>; Update: Partial<GuestSession> };
      [key: string]: { Row: any; Insert: any; Update: any };
    };
  };
}
