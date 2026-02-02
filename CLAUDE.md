# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (http://localhost:5174)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture Overview

Soundscape is a location-based music discovery app built with React 19, TypeScript, Vite, Supabase, Mapbox, and Spotify.

### Core Data Flow

1. **App.tsx** is the main orchestrator - manages songs state, discovery filtering, and coordinates all major features
2. **Songs** are fetched from Supabase on mount via `lib/songs.ts`, with fallback to mock data (`data/londonSongs.ts`) if Supabase is not configured
3. **Discovery filtering** uses radius-based filtering with two modes: "nearby" (user's GPS location) or "explore" (map center or searched location)
4. **Spotify playback** supports two methods via `SpotifyPlayerContext`:
   - Web Playback SDK for Premium users (full playback control)
   - Embed/IFrame API fallback for non-Premium users (30-second previews)

### Key Contexts

- **AuthContext** (`contexts/AuthContext.tsx`): Supabase auth state, user profile with admin status
- **SpotifyPlayerContext** (`contexts/SpotifyPlayerContext.tsx`): Player state, OAuth connection, play/pause/seek controls

### Database Layer

- `lib/supabase.ts`: Supabase client initialization
- `lib/songs.ts`: CRUD operations with `dbToSong`/`songToDb` converters for snake_case DB columns to camelCase TypeScript
- `lib/comments.ts`: Comment operations
- Database uses snake_case (`album_art`, `spotify_uri`), TypeScript uses camelCase (`albumArt`, `spotifyUri`)

### Spotify Integration

- OAuth PKCE flow for user authentication (no client secret in browser)
- `lib/spotify.ts` handles token management, track info fetching via oEmbed (no auth required), and search
- Track playback requires Premium for full songs; Free users get 30-second previews via embed

## UI Testing Requirements

**IMPORTANT**: Automated UI tests run on every dev server load. Check browser console for "🧪 SOUNDSCAPE UI TESTS" output before committing.

Tests are in `src/utils/uiTests.ts` and check:
- Button padding (min 8px horizontal)
- Badge/pill padding (min 10px horizontal)
- No text clipping
- Input height (min 40px)
- Modal z-index and pointer-events
- No backdrop-blur on modals

If tests fail, fix the issues before committing. Use explicit inline padding styles when needed:
```tsx
// ✅ GOOD - Explicit padding
<button style={{ padding: '10px 14px' }}>Submit</button>

// ❌ BAD - May not compute correctly
<button className="px-2">Submit</button>
```

## Environment Variables

Required:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_MAPBOX_TOKEN` - Mapbox public token (starts with `pk.`)
- `VITE_SPOTIFY_CLIENT_ID` - Required for Spotify OAuth/playback

Optional:
- `VITE_SPOTIFY_CLIENT_SECRET` - Enables real Spotify search (otherwise uses mock results)

## Database Scripts

Scripts in `src/scripts/` are run with `npx tsx`:
```bash
npx tsx src/scripts/seedDatabase.ts   # Seed initial data
npx tsx src/scripts/listSongs.ts      # List all songs
```

## Key Types

```typescript
// Main song type (src/types/index.ts)
interface SongLocation {
  id: string;
  title: string;
  artist: string;
  spotifyUri?: string;  // Format: spotify:track:XXXXX
  latitude: number;
  longitude: number;
  locationName: string;
  status?: 'live' | 'needs_edit' | 'removed';
  // ... more fields
}
```

## Important Patterns

- Songs without `spotifyUri` cannot be played
- Album art URLs containing `i.scdn.co` are cached Spotify images; others trigger re-fetch
- Rate limiting on Spotify oEmbed: requests are batched with 2-second delays
- Row Level Security enforces that users can only edit their own songs; admins can edit all
