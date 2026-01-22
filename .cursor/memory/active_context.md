# Active Context

## Current Branch
`main`

## Recent Merges
- `feature/song-panel-redesign` merged and deleted on 2026-01-22
- `feature/real-auth` merged and deleted on 2026-01-21
- `feature/submit-song-map-picker` merged and deleted on 2026-01-21

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

## Current State
- All features merged to `main` and pushed
- Real auth working with Google OAuth configured
- Discord and Facebook OAuth not yet configured (user opted to skip for now)
- Using mock Spotify search results since real API not configured
- Comments and photos tables created in Supabase
- Storage bucket `song-photos` configured with RLS policies

## Database Migrations
- `supabase-auth-migration.sql` - Auth tables and RLS policies
- `supabase-comments-photos-migration.sql` - Comments and photos tables with RLS

## Next Session TODO
- [ ] Test with real Spotify credentials when API signup reopens
- [ ] Optionally configure Discord and Facebook OAuth
- [ ] Possible enhancements:
  - Drag marker support for location picker
  - Better mobile responsiveness
  - User profile editing page
  - "My submissions" page

## Key Files
- `src/components/SongDetailPanel.tsx` - Redesigned panel with comments/photos tabs
- `src/components/AdminPanel.tsx` - Photo approval workflow in "Photos" tab
- `src/lib/comments.ts` - API functions for comments and photos
- `src/components/SubmitSongModal.tsx` - 2-step submission wizard with Spotify search
- `src/components/LocationPicker.tsx` - Map-based location picker with address search
- `src/contexts/AuthContext.tsx` - Real Supabase auth with OAuth support

## Notes
- GPG signing is configured but may timeout in agent terminal - use `--no-gpg-sign` if needed
- Dev server runs on port 5174 (user configured OAuth redirects for this port)
- **REVIEW LATER**: Spotify App API signup is currently closed - check back to enable real song search
