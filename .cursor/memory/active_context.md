# Active Context - SoundScape Project

**Last Updated**: 2026-01-22

## Current State

The SoundScape app is fully functional and deployed on Vercel at https://soundscape-self.vercel.app/

### Recent Completions (2026-01-22)
1. **Mobile Optimization** - Comprehensive responsive design
2. **Mobile Modal Scrolling** - Fixed song detail panel scrolling on mobile
3. **Loading Screen Redesign** - Modern centered design with logo
4. **UI Test Enforcement Rule** - Created `.cursor/rules/ui-tests.mdc`

## Key Features Implemented

### Core Functionality
- ✅ Interactive Mapbox map with song markers
- ✅ Spotify Web Playback SDK (full songs for Premium users)
- ✅ Location-based song discovery with radius filtering
- ✅ Discovery Panel (Near Me vs Explore modes)
- ✅ Song submission with Spotify integration
- ✅ User authentication (email/password + OAuth: Google, Discord, Facebook)
- ✅ Admin panel for song management
- ✅ Comments system on songs
- ✅ Location photos (with admin approval)
- ✅ Upvote/like system (one per user)
- ✅ My Submissions page
- ✅ Song review system (live/needs_edit/removed)

### Mobile & UI
- ✅ Fully responsive design (mobile.css)
- ✅ Touch-friendly 44x44px minimum touch targets
- ✅ Safe area insets for notched devices
- ✅ Scrollable modals on mobile
- ✅ Icon-only buttons on small screens
- ✅ Modern loading screen with logo

## Database Schema

### Tables
1. **songs** - Main song data with location, Spotify links, status
2. **profiles** - User profiles (linked to auth.users)
3. **song_comments** - Comments on songs
4. **song_photos** - User-uploaded location photos
5. **song_likes** - Upvote tracking (one per user per song)

### SQL Functions
- `get_song_like_count(song_id)` - Get total likes
- `has_user_liked_song(song_id, user_id)` - Check if user liked
- `increment_upvotes(song_id)` - +1 upvote
- `decrement_upvotes(song_id)` - -1 upvote

### Storage
- **song-photos** bucket (public) - User-uploaded location photos

## Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id (REQUIRED)
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret (optional)
```

## Key Files

### Components
- `App.tsx` - Main app with routing and state
- `MusicMap.tsx` - Mapbox map with markers and radius circle
- `MusicPlayer.tsx` - Spotify player with progress bar (Premium)
- `SongDetailPanel.tsx` - Modal with tabs (Info/Comments/Photos) - **scrollable on mobile**
- `DiscoveryPanel.tsx` - Radius and location search controls
- `Header.tsx` - Nav with responsive buttons (icon-only on mobile)
- `AdminPanel.tsx` - Song review and photo approval
- `MySubmissions.tsx` - User's submitted songs

### Contexts
- `AuthContext.tsx` - Auth state with robust timeout handling
- `SpotifyPlayerContext.tsx` - Spotify playback and connection state

### Styles
- `src/styles/design-system.css` - Design tokens and component styles
- `src/styles/mobile.css` - **Mobile-specific responsive styles**
- `src/index.css` - Global styles and animations

### Rules
- `.cursor/rules/ui-tests.mdc` - **Always check UI tests before committing**

## Database Migrations (Run in Order)

1. `supabase-auth-migration.sql` - Auth, profiles, RLS
2. `supabase-comments-photos-migration.sql` - Comments, photos, storage policies
3. `supabase-songs-review-migration.sql` - Song status, likes, review system

## Known Issues & Fixes

### Auth Loop (FIXED)
- Issue: Login would hang or loop on refresh
- Fix: Robust timeout handling in `AuthContext.tsx` with refs and Promise.race

### Mobile Scrolling (FIXED)
- Issue: Song detail content clipped on mobile
- Fix: Flexbox layout with `overflow-y: auto` on content section

### UI Test Failures (FIXED)
- Issue: Buttons had insufficient padding (< 8px)
- Fix: Explicit inline styles with proper padding values

## Tech Stack

- React 19 + TypeScript
- Vite 5 (build tool)
- Supabase (database, auth, storage)
- Mapbox GL JS + Geocoding API
- Spotify Web API + Web Playback SDK
- Lucide React (icons)
- Deployed on Vercel (free tier)

## Development Commands

```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build
```

## Important Notes

1. **Always run UI tests** before committing (check browser console)
2. **Spotify Premium required** for full playback (Free users get 30s previews)
3. **Mobile-first** - Test on mobile devices regularly
4. **Git branching** - Use feature branches, merge to main when complete
5. **Vercel redeploys** automatically on push to main
