# Progress Log

## Session: 2026-01-22 (Continued - Major Feature Day)

### Summary
Continued from song panel redesign to implement song review system, global discovery, and full Spotify playback integration. 13 commits pushed to main.

### Completed

#### Song Review & User Submissions System
- **Admin Song Review (AdminPanel.tsx)**:
  - New "Review" tab to manage user-submitted songs
  - Songs have `status` field: `live`, `needs_edit`, or `removed`
  - Admin can flag songs for editing with notes
  - Badge shows count of non-live songs
  - Integrated with `fetchAllSongsAdmin()` and `setSongStatus()` functions

- **My Submissions (MySubmissions.tsx)** - New component:
  - Users can view all their submitted songs
  - Shows song status (Live, Needs Edit, Removed)
  - Displays admin notes for "Needs Edit" songs
  - "Edit & Resubmit" button to update `locationDescription` and reset status to live
  - Accessible from Header user dropdown menu

- **Database Migration (supabase-songs-review-migration.sql)**:
  - Added `status` and `admin_notes` columns to `songs` table
  - Updated RLS policies: anyone can read `live` songs, users can read their own (any status), admins can read all
  - Created `song_likes` table with `UNIQUE(song_id, user_id)` constraint
  - SQL functions: `get_song_like_count`, `has_user_liked_song`, `increment_upvotes`, `decrement_upvotes`

#### Proper Upvote/Like System
- **Reddit-Style Likes (SongDetailPanel.tsx)**:
  - Heart icon fills when liked
  - Like count displayed next to icon
  - Only one like per user (enforced by unique constraint)
  - `likeSong()` and `unlikeSong()` functions call RPC to update `upvotes` count
  - `hasUserLikedSong()` checks user's like status on load

- **Backend Functions (lib/songs.ts)**:
  - `likeSong()` - Insert into `song_likes`, call `increment_upvotes` RPC
  - `unlikeSong()` - Delete from `song_likes`, call `decrement_upvotes` RPC
  - `getUserLikedSongIds()` - Fetch all liked songs for a user
  - `getSongLikeCount()` - Get total likes for a song
  - `fetchUserSongs()` - Fetch all songs submitted by a user

#### Global Discovery Panel
- **Discovery Panel (DiscoveryPanel.tsx)** - New component replacing `RadiusSlider`:
  - **Two modes**: "Near Me" (green) and "Map Center" (purple)
  - **Quick presets**: 1km, 5km, 10km, All buttons
  - **Custom slider** for precise radius control
  - **Location search** with Mapbox Geocoding
  - **"Use My Location"** button to recenter
  - Collapsible panel (compact by default, expands for advanced options)
  - Shows song count in range and total song count

- **Map Visualization (MusicMap.tsx)**:
  - **Radius circle** overlay (dashed border, 5% fill opacity) - color-coded by mode
  - **Discovery center marker** shown in explore mode
  - **Dimmed out-of-range markers** (40% opacity, small gray icons)
  - **Full markers for in-range songs** (album art, full interaction)
  - Dynamic filtering based on `discoveryMode` and `exploreCenter`

- **App Integration (App.tsx)**:
  - Added `discoveryMode` (`'nearby' | 'explore'`) state
  - Added `exploreCenter` state for map center exploration
  - Pass `allSongs` and `songsInRadius` separately to map
  - Wired up all Discovery Panel callbacks

#### Full Spotify Web Playback SDK
- **Spotify OAuth with PKCE (lib/spotify.ts)**:
  - `initiateSpotifyLogin()` - PKCE OAuth flow (no client secret in browser)
  - `handleSpotifyCallback()` - Exchange code for tokens
  - `refreshUserToken()` - Auto-refresh expired tokens
  - `getSpotifyUserAuth()` - Get current auth, refresh if needed
  - `clearSpotifyAuth()` - Logout/disconnect
  - `getSpotifyUserProfile()` - Fetch user info including Premium status

- **Web Playback SDK Integration (SpotifyPlayerContext.tsx)**:
  - Load SDK script and initialize `Spotify.Player`
  - **For Premium users**: Full playback via Web Playback SDK
  - **For non-Premium**: Fallback to embed (30s preview)
  - Device management with `deviceIdRef`
  - Playback state tracking (`isPlaying`, `position`, `duration`)
  - `seek()` function for Premium users
  - Connection status: `isConnected`, `isPremium`, `userName`

- **OAuth Callback Handler (App.tsx)**:
  - `SpotifyCallbackHandler` component processes OAuth return
  - Displays loading spinner during token exchange
  - Redirects to home after successful connection
  - Error handling for denied/failed auth

- **UI Updates**:
  - **Header.tsx**: Spotify connect/disconnect in user dropdown menu
    - Shows connection status (Connected/Premium/Free)
    - Green checkmark + badge when connected
    - "Connect Spotify" button when not connected
  - **MusicPlayer.tsx**: Enhanced for Premium users
    - Progress bar (clickable to seek)
    - Time display (position / duration)
    - "FULL" badge indicator for Premium playback
    - Dynamic play/pause button

#### Auth Loop Fixes (Multiple Iterations)
- **Robust Initialization (AuthContext.tsx)**:
  - `isInitialized` ref to prevent double init (React StrictMode/HMR)
  - Hard 5-second timeout for entire auth flow
  - 5-second timeout specifically for `fetchProfile` using `Promise.race`
  - Filter out `INITIAL_SESSION` events from `onAuthStateChange`
  - `isMounted` ref for component lifecycle safety
  - Comprehensive error handling with try-catch blocks

- **Network Timeout Protection (lib/songs.ts)**:
  - 10-second timeout on `fetchSongs()` using `Promise.race`
  - Prevents infinite loading if Supabase connection hangs

#### TypeScript Build Fixes
- **Type Definitions (vite-env.d.ts)** - Created:
  - `/// <reference types="vite/client" />`
  - `ImportMetaEnv` interface for environment variables
  
- **Type Corrections**:
  - Made `albumArt` optional in `SongLocation` interface
  - Changed `JSX.Element` to `ReactNode` in `AuthModal.tsx`
  - Initialized `debounceRef` to `null` in multiple components
  - Added checks for `originalUrl` being defined in `useCachedImage.ts`
  - Wrapped boolean expressions in `Boolean()` for explicit return
  - Handled `profile?.avatar_url ?? undefined` for null safety

### New Files Created
- `src/components/MySubmissions.tsx` - User submission management
- `src/components/DiscoveryPanel.tsx` - Enhanced discovery UI
- `supabase-songs-review-migration.sql` - Review and like system
- `src/vite-env.d.ts` - Vite TypeScript definitions

### Database Changes
- `songs` table: Added `status` (TEXT), `admin_notes` (TEXT)
- `songs` table: Set `upvotes` default to 0
- New table: `song_likes` (song_id, user_id, created_at) with UNIQUE constraint
- RLS policies updated for status-based visibility
- SQL functions for like count and upvote management

### Commits Made (13 total)
1. `0423d57` - feat(songs): redesign song panel with comments and photos
2. `c12774e` - fix(db): use TEXT for song_id to match songs table schema
3. `7a9e04e` - feat(admin): add photo approval UI and improve comment error handling
4. `39a9e28` - fix(comments): use separate queries instead of joins for profile data
5. `80afdb6` - fix(auth): add timeout and cleanup to prevent loading hangs
6. `ff8637c` - docs: update README and memory files for song panel redesign feature
7. `8e9a612` - fix: TypeScript build errors for production deployment
8. `a709848` - fix: add timeouts to prevent infinite loading on network issues
9. `bb1a234` - feat: add song review system, my submissions, and proper upvotes
10. `db260bf` - fix(auth): prevent login loop on redeploy with robust initialization
11. `90684b6` - feat: enhanced Discovery Panel with global exploration
12. `4753978` - fix: show radius circle and update markers in explore mode
13. `9960c06` - feat: implement full Spotify playback with Web Playback SDK

### Environment Variables Added
- `VITE_SPOTIFY_CLIENT_ID` - Required for Spotify Web Playback SDK

### Setup Steps Completed
- Updated `.env.example` with Spotify Client ID
- Added README note about Spotify Premium requirement
- Spotify OAuth redirect URIs configured for local and production

---

## Session: 2026-01-22 (Morning)

### Summary
Redesigned the Song Detail Panel with visual improvements and added comments and photos features.

### Completed
- **Song Detail Panel Redesign (SongDetailPanel.tsx)**:
  - Hero album art with floating play button
  - Dynamic gradient background extracted from album art colors
  - Improved action bar (Like/Share/Spotify) with pill-shaped buttons
  - Tabbed interface: Info, Comments, Photos

- **Comments System**:
  - Users can add/delete comments on songs
  - Comments display user avatar, name, timestamp
  - `song_comments` table with RLS policies

- **Location Photos**:
  - Users can upload photos of locations
  - Admin approval workflow (pending → approved/rejected)
  - "Pending approval" badge for user's own unapproved photos
  - `song_photos` table with RLS policies
  - Supabase Storage bucket `song-photos` with policies

- **Admin Panel Updates (AdminPanel.tsx)**:
  - Added "Photos" tab for managing pending photos
  - Photo approval/rejection with loading states
  - Badge showing pending photo count

- **Auth Fix (AuthContext.tsx)**:
  - Added 10-second timeout to prevent loading hangs
  - Added `isMounted` flag for HMR safety
  - Added `.catch()` blocks for error handling

### New Files
- `src/lib/comments.ts` - API functions for comments and photos
- `supabase-comments-photos-migration.sql` - Database migration

### Commits Made
- `80afdb6` - fix(auth): add timeout and cleanup to prevent loading hangs
- Previous commits on feature branch for panel redesign and comments/photos

### Branch Status
- `feature/song-panel-redesign` merged to `main` and deleted
- All changes pushed to origin

---

## Session: 2026-01-21 (Part 2)

### Summary
Implemented real Supabase authentication with OAuth providers, replacing the demo auth system.

### Completed
- **Real Authentication (AuthContext.tsx)**:
  - Switched from demo mode to real Supabase auth
  - Email/password sign in and sign up
  - OAuth support for Google, Discord, Facebook
  - User profile fetching from `profiles` table
  - Session management with auth state listener

- **Auth Modal (AuthModal.tsx)**:
  - Added social login buttons (Google, Discord, Facebook)
  - Styled provider buttons with brand colors
  - Loading states for OAuth flow
  - Email confirmation message for signups

- **Database Schema (supabase-auth-migration.sql)**:
  - Created `profiles` table with auto-creation trigger
  - Added `user_id` FK to `songs` table
  - Set up RLS policies for user ownership
  - Admin privileges for managing all songs

- **User Experience (Header.tsx)**:
  - Display user avatar from profile
  - Show display name or email
  - Profile-aware UI

- **Song Ownership (App.tsx, songs.ts, types/index.ts)**:
  - Songs now linked to `user_id`
  - `submittedBy` populated from profile

### Commits Made
- `207e844` - feat(auth): implement real Supabase authentication with OAuth providers

### Branch Status
- `feature/real-auth` merged to `main` and deleted
- All changes pushed to origin

### Setup Notes
- User configured Google OAuth in Supabase
- Discord and Facebook OAuth skipped for now
- Dev server port 5174 used for OAuth redirect URIs
- Made user admin via SQL: `UPDATE profiles SET is_admin = true WHERE email = '...'`

---

## Session: 2026-01-21 (Part 1)

### Summary
Added two major features to the song submission flow: location search and Spotify song search.

### Completed
- **Location Search (LocationPicker.tsx)**:
  - Added search box above the map
  - Uses Mapbox Geocoding API for address/place search
  - Debounced search (300ms) with dropdown results
  - Click result to set coordinates and pan map
  - Works alongside existing click-to-select and "Use my location"

- **Spotify Song Search (SubmitSongModal.tsx)**:
  - Replaced URL-only input with search box
  - Can search by song name OR paste Spotify URL (auto-detected)
  - Search results show album art, song name, artist
  - Click to select and auto-fill all fields
  - Falls back to mock results when API not configured
  - **NOTE**: Spotify API signup currently closed - using mock data for now

### Commits Made
- `b2b94c4` - feat(submit): add location search and Spotify song search

### Branch Status
- `feature/submit-song-map-picker` merged to `main` and deleted

### Technical Notes
- Had to use `import type { SpotifyTrack }` to fix Vite module resolution issue
- Dev server may run on port 5174 if 5173 is busy

---

## Session: 2026-01-20

### Summary
Continued work on `feature/submit-song-map-picker` branch. Improved the location picker component based on user feedback.

### Completed
- **LocationPicker UX improvements**:
  - Increased map height from 200px to 320px
  - Added "Use my location" button for quick positioning
  - Added GeolocateControl from Mapbox
  - Larger marker (40px) for better visibility
  - Higher default zoom (15) for precise placement
  - Reorganized controls layout

### Commits Made
- `61a6f9c` - feat(submit): improve location picker UX - larger map, use-my-location button, better controls

### Branch Status
- Pushed to `origin/feature/submit-song-map-picker`
- Ready for more work (not merging yet per user request)

---

## Session: Previous (before memory bank)

### Commits on feature branch
- `b495874` - feat(submit): add interactive map picker for location selection
- `61493ba` - feat(submit): auto-populate from Spotify URL (#1)

### Features Implemented
- SubmitSongModal with 2-step wizard (Song info → Location)
- Spotify URL auto-fetch for track metadata
- LocationPicker component with click-to-select map
