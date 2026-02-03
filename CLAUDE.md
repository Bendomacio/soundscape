# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Self-Maintenance Rule

**IMPORTANT**: When completing significant work on this codebase, update this file with:
- New features added (under "Recent Features")
- New environment variables required
- New patterns or architectural decisions
- New integrations or third-party services
- Gotchas or lessons learned

Keep this file current so future sessions have accurate context.

## Build and Development Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture Overview

Soundscape is a location-based music discovery app built with React 19, TypeScript, Vite, Supabase, Mapbox, and Spotify.

### Core Data Flow

1. **App.tsx** is the main orchestrator - manages songs state, discovery filtering, and coordinates all major features
2. **Songs** are fetched from Supabase on mount via `lib/songs.ts`, with fallback to mock data (`data/londonSongs.ts`) if Supabase is not configured
3. **Discovery filtering** uses radius-based filtering with three modes:
   - **Nearby** - user's GPS location
   - **Explore** - map center or searched location
   - **Trip Mode** - songs within 500m of a route to a destination (uses Mapbox Directions API)
4. **Spotify playback** supports two methods via `SpotifyPlayerContext`:
   - Web Playback SDK for Premium users (full playback control)
   - Embed/IFrame API fallback for non-Premium users (30-second previews)

### Key Contexts

- **AuthContext** (`contexts/AuthContext.tsx`): Supabase auth state, user profile with admin status
- **MusicPlayerContext** (`contexts/MusicPlayerContext.tsx`): Multi-provider player state, OAuth connections for all providers, play/pause/seek controls
  - Tracks connection status for Spotify, YouTube, Apple Music, and SoundCloud
  - `providerConnections` object stores `isConnected`, `isPremium`, `userName` for each
  - Provider auth modules in `lib/providers/auth/` handle OAuth flows

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

Optional (Spotify):
- `VITE_SPOTIFY_CLIENT_SECRET` - Enables real Spotify search (otherwise uses mock results)

Optional (Provider OAuth - for premium playback):
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth for YouTube account linking (enables premium playback)
- `VITE_APPLE_MUSIC_TOKEN` - Apple MusicKit developer token (enables Apple Music subscriber playback)

Note: SoundCloud doesn't have a public API, so it uses a self-reported connection flow.
Note: Apple Music requires paid Apple Developer account ($99/year), so it's hidden in the UI.

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

## Recent Features (Feb 2026)

### Trip Mode (`DiscoveryPanel.tsx`, `App.tsx`)
- Third discovery mode alongside Nearby and Explore
- User enters destination, route fetched from Mapbox Directions API with `overview=full`
- Songs within 500m of any point on the route are shown
- Route visualized with orange line on map
- Uses `pointToSegmentDistance()` for accurate perpendicular distance calculation

### Songs Nearby & Related (`SongDetailPanel.tsx`)
- Desktop sidebar panels appear to the right of song detail modal
- **Songs Nearby**: songs within 5km, sorted by distance
- **Related Songs**: other songs by the same artist (case-insensitive match with trim)
- Clicking a song opens that song's detail panel
- Hidden on mobile (uses `isMobile()` check)

### Map Markers (`MusicMap.tsx`)
- Color-coded rings indicate song validity:
  - Green ring = valid song (has `spotifyUri`)
  - Amber/yellow ring = invalid song (needs Spotify link)
- Invalid songs only visible to admins (`isAdmin` prop)
- Default map pitch: 45° for stylish tilt view

### Song Detail Enhancements (`SongDetailPanel.tsx`)
- Mini-map preview using Mapbox Static Images API
- Embedded Google Maps directions on mobile (no API key needed)
- Get Directions button (Google Maps walking route)
- Street View button
- Native share via Web Share API on mobile, clipboard fallback on desktop

## Git Workflow Notes

- GPG signing fails locally, use: `git -c commit.gpgsign=false commit`
- Always include `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` in commits
- Dev server runs on port 5173 (not 5174 as previously documented)
