# Active Context

## Current Branch
`feature/submit-song-map-picker`

## Branch Purpose
Improving the song submission experience with better location selection and Spotify search.

## What's Been Done on This Branch
1. ✅ Auto-populate song info from Spotify URL (commit `61493ba`)
2. ✅ Interactive map picker for location selection (commit `b495874`)
3. ✅ Improved location picker UX - larger map, "Use my location" button (commit `61a6f9c`)
4. ✅ Location search - search by address/place name using Mapbox Geocoding (uncommitted)
5. ✅ Spotify search - search songs by name instead of requiring URL (uncommitted)

## Current State
- Branch has **uncommitted changes** for location search and Spotify search features
- Features are **working** with mock Spotify data
- Using mock Spotify search results (3 sample songs) since real API not configured

## Uncommitted Changes
- `src/components/LocationPicker.tsx` - Added address/place search with Mapbox Geocoding
- `src/components/SubmitSongModal.tsx` - Added Spotify song search with autocomplete

## Next Session TODO
- [ ] Commit and push the location search + Spotify search features
- [ ] Test with real Spotify credentials when available
- [ ] Possible enhancements:
  - Drag marker support (drag to reposition instead of click)
  - Better mobile responsiveness for the modal
  - Form validation improvements

## Files Changed in This Feature
- `src/components/SubmitSongModal.tsx` - 2-step submission wizard with Spotify search
- `src/components/LocationPicker.tsx` - Map-based location picker with address search

## Notes
- GPG signing is configured but may timeout in agent terminal - use `--no-gpg-sign` if needed
- Dev server runs on port 5173 (or 5174 if 5173 is busy)
- **REVIEW LATER**: Spotify App API signup is currently closed - check back to enable real song search
