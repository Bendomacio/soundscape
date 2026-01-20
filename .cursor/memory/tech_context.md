# Tech Context

## Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS with design tokens (custom design system in `src/styles/design-system.css`)
- **Maps**: Mapbox GL JS via `react-map-gl`
- **Music**: Spotify Web API + Web Playback SDK
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Key Files & Structure
```
src/
├── components/       # React components
│   ├── MusicMap.tsx       # Main map display
│   ├── MusicPlayer.tsx    # Spotify player UI
│   ├── SubmitSongModal.tsx # Song submission wizard
│   ├── LocationPicker.tsx  # Map-based location selector
│   └── ...
├── contexts/         # React contexts
│   ├── AuthContext.tsx
│   └── SpotifyPlayerContext.tsx
├── lib/              # API & utility functions
│   ├── songs.ts      # Song CRUD operations
│   ├── spotify.ts    # Spotify API helpers
│   └── supabase.ts   # Supabase client
├── types/            # TypeScript types
└── scripts/          # Database maintenance scripts
```

## Environment Variables
See `.env.example` for required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`
- `VITE_SPOTIFY_CLIENT_ID`
- `VITE_SPOTIFY_CLIENT_SECRET`

## Development Commands
- `npm run dev` - Start dev server (http://localhost:5173)
- `npm run build` - Production build
- `npm run lint` - Run ESLint

## Patterns & Conventions
- Components use inline styles with CSS variables from design system
- Modals use `.modal`, `.modal-backdrop`, `.modal-content` CSS classes
- Form inputs use `.input`, `.label`, `.form-group` classes
- Buttons use `.btn`, `.btn-primary`, `.btn-secondary` classes
