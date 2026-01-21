# Active Context

## Current Branch
`main`

## Recent Merge
Feature branch `feature/submit-song-map-picker` was merged and deleted on 2026-01-21.

## What's Now in Main
1. ✅ Auto-populate song info from Spotify URL
2. ✅ Interactive map picker for location selection
3. ✅ Improved location picker UX - larger map, "Use my location" button
4. ✅ Location search - search by address/place name using Mapbox Geocoding
5. ✅ Spotify search - search songs by name instead of requiring URL

## Current State
- All features merged to `main` and pushed
- Using mock Spotify search results (3 sample songs) since real API not configured

## Next Session TODO
- [ ] Test with real Spotify credentials when API signup reopens
- [ ] Possible enhancements:
  - Drag marker support (drag to reposition instead of click)
  - Better mobile responsiveness for the modal
  - Form validation improvements
  - More mock songs for testing

## Key Files
- `src/components/SubmitSongModal.tsx` - 2-step submission wizard with Spotify search
- `src/components/LocationPicker.tsx` - Map-based location picker with address search

## Notes
- GPG signing is configured but may timeout in agent terminal - use `--no-gpg-sign` if needed
- Dev server runs on port 5173 (or 5174 if 5173 is busy)
- **REVIEW LATER**: Spotify App API signup is currently closed - check back to enable real song search
