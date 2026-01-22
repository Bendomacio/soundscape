# Active Context

## Current Branch
`main`

## Recent Merges
- **2026-01-22**: Major feature day - 13 commits pushed to main
  - Song panel redesign with comments & photos
  - Song review system with My Submissions
  - Discovery Panel with global exploration
  - Full Spotify Web Playback SDK integration

## What's Now in Main
1. ✅ Auto-populate song info from Spotify URL
2. ✅ Interactive map picker for location selection
3. ✅ Improved location picker UX - larger map, "Use my location" button
4. ✅ Location search - search by address/place name using Mapbox Geocoding
5. ✅ Spotify search - search songs by name instead of requiring URL
6. ✅ **Real Supabase authentication** - email/password + OAuth (Google, Discord, Facebook)
7. ✅ User profiles with avatar and display name
8. ✅ Songs linked to users (`user_id` foreign key)
9. ✅ Row Level Security (RLS) for songs - users can edit/delete their own, admins can manage all
10. ✅ **Song Detail Panel Redesign** - hero album art, dynamic gradient backgrounds, improved action bar
11. ✅ **Comments System** - users can leave comments on song locations
12. ✅ **Location Photos** - users can upload photos with admin approval workflow
13. ✅ **Song Review System** - admin can review/edit/remove user submissions
14. ✅ **My Submissions** - users can view their songs and respond to edit requests
15. ✅ **Proper Upvote System** - Reddit-style likes with deduplication (one like per user)
16. ✅ **Discovery Panel** - Near Me vs Map Center modes for global exploration
17. ✅ **Radius Circle Visualization** - subtle transparent circle showing discovery area
18. ✅ **Full Spotify Playback** - Web Playback SDK for Premium users (full songs, not previews)

## Current State
- All features merged to `main` and pushed
- Real auth working with Google OAuth configured
- Discord and Facebook OAuth not yet configured (user opted to skip for now)
- Using mock Spotify search results since real API not configured
- Comments, photos, likes, and review workflow all functional
- **Spotify OAuth configured** - users can connect Spotify for full playback
- Deployed to Vercel at `https://soundscape-self.vercel.app/`

## Database Migrations
- `supabase-auth-migration.sql` - Auth tables and RLS policies
- `supabase-comments-photos-migration.sql` - Comments and photos tables with RLS
- `supabase-songs-review-migration.sql` - Song review, likes, and upvote system

## Environment Variables Required
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id  # Required for full playback
```

## Key Files
- `src/components/SongDetailPanel.tsx` - Redesigned panel with comments/photos tabs, upvote button
- `src/components/AdminPanel.tsx` - Photo approval workflow + Song review tab
- `src/components/MySubmissions.tsx` - User's song list with edit request handling
- `src/components/DiscoveryPanel.tsx` - Enhanced discovery with Near Me / Map Center modes
- `src/components/MusicMap.tsx` - Shows radius circle and filters markers by mode
- `src/lib/comments.ts` - API functions for comments and photos
- `src/lib/songs.ts` - Extended with like/review/user submission functions
- `src/contexts/SpotifyPlayerContext.tsx` - Web Playback SDK for Premium users
- `src/contexts/AuthContext.tsx` - Robust auth with timeout protection

## Recent Fixes
- **Auth Loop Fix**: Prevented infinite loading on login with `isInitialized` ref, hard timeout, and `INITIAL_SESSION` filtering
- **TypeScript Build Errors**: Fixed all production build issues (type imports, optional fields, refs)
- **Comments/Photos PostgREST Errors**: Refactored to use separate queries instead of joins
- **Storage RLS**: Added explicit policies for `song-photos` bucket

## Notes
- GPG signing is configured but may timeout in agent terminal - use `--no-gpg-sign` if needed
- Dev server runs on port 5174 (user configured OAuth redirects for this port)
- **REVIEW LATER**: Spotify App API signup is currently closed - check back to enable real song search
- **Spotify Premium Required**: Full playback (Web Playback SDK) only works for Premium users; Free users get 30s preview embed
