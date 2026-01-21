# Progress Log

## Session: 2026-01-21

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
- None yet - changes uncommitted, ready to commit when user confirms

### Branch Status
- Has uncommitted changes ready for testing
- Mock Spotify search working (3 sample songs)

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
