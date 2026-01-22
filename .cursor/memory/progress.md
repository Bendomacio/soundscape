# Progress Log

## Session: 2026-01-22

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
