# Hajnali Beszélgetések

Éjszakai közösségi beszélgető platform. **1. fejlesztési szakasz**: projektstruktúra,
Supabase séma, hitelesítés (regisztráció, belépés, vendég belépés), fő irányítópult,
szobalista és egy teljesen működő, valós idejű chatszoba.

Ez a projekt **nem** társkereső és **nem** egészségügyi/pszichológiai szolgáltatás.

## 1. Mappastruktúra

```
hajnali-beszelgetesek/
├── app/
│   ├── layout.tsx              # gyökér layout, betűtípusok, csillag háttér
│   ├── page.tsx                 # kezdőlap
│   ├── globals.css
│   ├── register/page.tsx        # regisztráció
│   ├── login/page.tsx           # belépés
│   ├── guest/page.tsx           # vendég belépés
│   ├── dashboard/page.tsx       # fő irányítópult
│   ├── rooms/page.tsx           # szobák listája
│   ├── rooms/[id]/page.tsx      # működő valós idejű chatszoba
│   ├── szabalyzat/page.tsx      # közösségi szabályok
│   └── api/guest/route.ts       # vendég session API (service role)
├── components/
│   ├── layout/ (Header, MobileNav)
│   ├── chat/ (ChatMessage, MessageInput)
│   └── shared/ (StarField, CrisisSupportPanel)
├── lib/
│   ├── supabase/ (client.ts, server.ts)
│   ├── guestName.ts
│   ├── greeting.ts
│   └── crisisDetection.ts
├── types/database.ts
├── supabase/
│   ├── 001_schema.sql
│   ├── 002_rls.sql
│   ├── 003_seed.sql
│   └── 004_realtime.sql
├── middleware.ts
├── .env.example
└── package.json
```

## 2. Szükséges csomagok

Lásd `package.json`. Fő függőségek: `next`, `react`, `@supabase/supabase-js`,
`@supabase/ssr`, `tailwindcss`, `typescript`, `zod`, `clsx`, `date-fns`.

## 3. Telepítés lépésről lépésre

### 3.1 Node.js telepítése

Telepítsd a Node.js LTS verzióját (18 vagy újabb) a https://nodejs.org oldalról,
vagy `nvm install --lts` paranccsal.

### 3.2 Projekt elindítása helyileg

```bash
cd hajnali-beszelgetesek
npm install
cp .env.example .env.local
```

### 3.3 Supabase projekt létrehozása

1. Regisztrálj a https://supabase.com oldalon, majd hozz létre egy új projektet.
2. A projekt "Settings → API" menüjében másold ki:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` kulcs → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` kulcs → `SUPABASE_SERVICE_ROLE_KEY` (SOHA ne kerüljön kliens kódba vagy git-be)

### 3.4 SQL migrációk futtatása

A Supabase Dashboard "SQL Editor" menüjében, **ebben a sorrendben**, futtasd le:

1. `supabase/001_schema.sql`
2. `supabase/002_rls.sql`
3. `supabase/003_seed.sql`
4. `supabase/004_realtime.sql`

### 3.5 Környezeti változók megadása

Töltsd ki a `.env.local` fájlt a 3.3 lépésben kimásolt értékekkel.

### 3.6 Helyi fejlesztés indítása

```bash
npm run dev
```

Nyisd meg: http://localhost:3000

### 3.7 GitHub feltöltés

```bash
git init
git add .
git commit -m "Hajnali Beszélgetések - 1. fejlesztési szakasz"
git branch -M main
git remote add origin <a te GitHub repód URL-je>
git push -u origin main
```

Fontos: a `.env.local` fájlt SOHA ne commitold (a `.gitignore` alapból kizárja).

### 3.8 Vercel telepítés

1. Jelentkezz be a https://vercel.com oldalon, majd importáld a GitHub repót.
2. A "Environment Variables" alatt add meg ugyanazokat a változókat, mint a `.env.local`-ban
   (a `NEXT_PUBLIC_APP_URL`-t állítsd a végleges Vercel domainre).
3. Kattints a "Deploy" gombra.

### 3.9 Supabase URL-ek beállítása éles környezetben

A Supabase Dashboard "Authentication → URL Configuration" menüjében állítsd be:
- `Site URL`: a Vercel domain (pl. `https://hajnali-beszelgetesek.vercel.app`)
- `Redirect URLs`: ugyanaz a domain, `/auth/callback` végződéssel is felvéve

### 3.10 Hibakeresési lépések

| Hiba | Lehetséges ok | Megoldás |
|---|---|---|
| "Invalid API key" | Rossz vagy hiányzó `.env.local` érték | Ellenőrizd a Supabase Settings → API értékeket |
| Üres szobalista | A `003_seed.sql` nem futott le | Futtasd le a seed scriptet a SQL Editorban |
| Üzenetek nem érkeznek élőben | A `004_realtime.sql` nem futott le | Ellenőrizd a Database → Replication menüben, hogy a táblák be vannak-e kapcsolva |
| Regisztráció után nincs profil | RLS blokkolja a beszúrást | Ellenőrizd, hogy a `002_rls.sql` lefutott, és az `insert` policy aktív |
| Vendég belépés 500-as hibát ad | Hiányzó `SUPABASE_SERVICE_ROLE_KEY` | Add meg a service role kulcsot a környezeti változók között |

## 4. Következő fejlesztési szakaszok

A többi funkció (privát beszélgetések, párosító rendszer, névtelen történetek,
napló, értesítések, moderáció, admin felület) a séma már tartalmazza az ehhez
szükséges táblákat és RLS szabályokat - ezek UI/logika rétegét a következő
szakaszokban építjük tovább, a kérésben megadott sorrend szerint.
