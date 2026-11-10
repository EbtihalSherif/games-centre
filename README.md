# Games Centre

A little centre for party games. The shell is a host app; each game is a separate
package, built and deployed on its own and loaded by the shell at runtime over
Module Federation.

```
.env                      secrets for every package (gitignored)
.env.example              copy this to .env
supabase/storage.sql      shared Supabase setup (the photos bucket)
packages/
  core/                   @games/core - theme, background, router, images, Supabase client
  games-centre/           @games/games-centre - the host shell
  two-truths/             Two Truths & a Lie
    supabase/schema.sql   tables owned by this game
```

## Set up

1. Create a project at https://supabase.com.
2. **SQL Editor > New query**: run `supabase/storage.sql`, then
   `packages/two-truths/supabase/schema.sql`. Both are safe to re-run.
3. **Project Settings > API**: copy the **Project URL** and the **anon public** key.

```bash
npm install
cp .env.example .env      # paste the two values from step 3
npm run dev
```

Without Supabase keys everything runs in **demo mode**, saved in your browser only —
handy for trying it out.

## Scripts

| Command                  | What it does                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `npm run dev`            | Builds the games, serves them, and runs the centre on :5173       |
| `npm run dev:centre`     | Runs just the games centre (games must already be served)         |
| `npm run dev:two-truths` | Runs that game standalone on :5174 (fastest loop for game work)   |
| `npm run build`          | Builds every game, then the games centre                          |
| `npm run typecheck`      | `tsc` across all packages                                         |

The shell loads each game from a URL, so a game must be built and served before the
shell can show it. `npm run dev` handles that; `dev:two-truths` skips the shell entirely.

## Deploy

One Vercel project per package, each with its **Root Directory** set:

| Project     | Root directory           | Environment variables                           |
| ----------- | ------------------------ | ----------------------------------------------- |
| two-truths  | `packages/two-truths`    | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`    |
| games-centre| `packages/games-centre`  | `VITE_GAME_TWO_TRUTHS_URL` = the two-truths URL  |

Deploy the games first, then point the shell at them. After that a game can be
redeployed on its own without touching the shell. Each game's `vercel.json` already
sends `Access-Control-Allow-Origin: *` for `/assets/*` so the shell can load it.

## Adding a game

1. `packages/<game>/` with its own `vite.config.ts` exposing `./Game` as a federated remote.
2. Add the remote to `packages/games-centre/vite.config.ts` and `packages/games-centre/src/remotes.d.ts`.
3. Add one entry to `packages/games-centre/src/games.ts`.
4. Give it its own tables in `packages/<game>/supabase/schema.sql`.

A game receives a `basePath` prop and owns every URL beneath it.

## Good to know

- **Spoilers:** the lie flag is stored with each submission and the anon key is public, so a
  determined player could read it from the browser's network tab. Fine for a party game; if you
  need it airtight, move the answers behind a Supabase Edge Function.
- **Moderation:** the app can't edit or delete entries. Do that in Supabase under
  **Table Editor** (and the image in **Storage > photos**).
- **Accessibility:** labelled form fields, keyboard-operable game, screen-reader announcements
  for the reveal, visible focus, and reduced-motion support throughout.
