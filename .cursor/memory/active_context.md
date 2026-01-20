# Active Context

## Current Branch
`feature/submit-song-map-picker`

## Branch Purpose
Improving the song submission experience with better location selection.

## What's Been Done on This Branch
1. ✅ Auto-populate song info from Spotify URL (commit `61493ba`)
2. ✅ Interactive map picker for location selection (commit `b495874`)
3. ✅ Improved location picker UX - larger map, "Use my location" button (commit `61a6f9c`)

## Current State
- Branch is **pushed and up to date** with remote
- Feature is **working** - tested and confirmed by user
- Branch is **NOT ready to merge yet** - more work planned

## Next Session TODO
- [ ] User mentioned wanting to do "more stuff on this feature area"
- [ ] Possible enhancements to consider:
  - Location search/autocomplete (type address to find location)
  - Drag marker support (drag to reposition instead of click)
  - Better mobile responsiveness for the modal
  - Form validation improvements

## Files Changed in This Feature
- `src/components/SubmitSongModal.tsx` - 2-step submission wizard
- `src/components/LocationPicker.tsx` - Map-based location picker

## Notes
- GPG signing is configured but may timeout in agent terminal - use `--no-gpg-sign` if needed
- Dev server runs on port 5173
