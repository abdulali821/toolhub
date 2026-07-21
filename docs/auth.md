# Auth & account data

Account features exist only to improve tool usage (favorites + recent history). This is **not** a SaaS account system.

## Supabase wiring

- `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Server client: `$lib/supabase/server.ts` (cookie SSR via `@supabase/ssr`)
- Browser client: `$lib/supabase/browser.ts`
- Optional admin: `$lib/supabase/admin.server.ts` (needs `SUPABASE_SERVICE_ROLE_KEY`)

## Routes

| Path                 | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `/login`             | Email/password sign-in, sign-up, magic link |
| `/auth/callback`     | OAuth / magic-link code exchange            |
| `/logout`            | Sign out (POST)                             |
| `/account`           | Account overview (auth-gated)               |
| `/account/favorites` | Starred tools                               |
| `/account/history`   | Recent tool visits                          |

## Tables (intentionally small)

`profiles`, `tool_favorites`, `tool_history`, `uploads` — all RLS owner-only.

Storage buckets: `avatars`, `uploads`.

**Not planned:** user-owned bookmarks, user collections, saved sessions, API keys, subscriptions, analytics_events.

**Platform collections** (static curated packs, no accounts) are defined in code—see [architecture.md](./architecture.md#12-platform-collections).

## Behavior

- Visiting a tool while signed in records history.
- Tool pages expose Favorite / Favorited via form action.
- New auth users get a `profiles` row via `handle_new_user` trigger.
