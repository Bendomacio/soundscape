# Technical Context - SoundScape

## Architecture Overview

### Frontend Stack
- **React 19** with TypeScript
- **Vite 5** for build tooling and HMR
- **CSS** with custom design system (no Tailwind for most styling)
- **Lucide React** for icons

### Backend & Services
- **Supabase** - PostgreSQL database with Row Level Security
- **Supabase Auth** - Email/password + OAuth providers
- **Supabase Storage** - User-uploaded photos
- **Mapbox GL JS** - Interactive maps via react-map-gl
- **Mapbox Geocoding API** - Address/place search
- **Spotify Web API** - Track info, search, metadata
- **Spotify Web Playback SDK** - Full song playback (Premium only)

## Key Patterns & Practices

### State Management
- **React Context API** for global state:
  - `AuthContext` - User auth and profile
  - `SpotifyPlayerContext` - Playback state and connection
- **Local useState** for component state
- **useCallback** for stable function references
- **useMemo** for computed values (e.g., filtered songs)

### Data Flow
1. **Load**: `fetchSongs()` from Supabase on mount
2. **Filter**: Calculate `songsInRadius` based on user location + radius
3. **Display**: Pass filtered songs to `MusicMap` and `MusicPlayer`
4. **Update**: Optimistic UI updates, then persist to Supabase

### File Structure
```
src/
├── components/       # React components
├── contexts/         # Context providers
├── hooks/           # Custom hooks (useCachedImage, etc.)
├── lib/             # API and utility functions
│   ├── songs.ts     # Song CRUD operations
│   ├── spotify.ts   # Spotify API integration
│   ├── supabase.ts  # Supabase client
│   └── imageCache.ts # Image preloading
├── styles/          # CSS files
│   ├── design-system.css  # Design tokens
│   └── mobile.css         # Mobile-specific styles
├── types/           # TypeScript types
└── utils/           # Utilities (UI tests)
```

## Design System

### Colors (CSS Variables)
```css
--color-primary: #10B981       /* Green */
--color-primary-dark: #059669
--color-accent: #F43F5E        /* Pink */
--color-accent-secondary: #FBBF24  /* Yellow */
--color-dark: #0D1117          /* Background */
--color-dark-lighter: #161B22
--color-dark-card: #21262D
--color-text: #F0F6FC
--color-text-muted: #8B949E
```

### Spacing Scale
```css
--space-xs: 4px   (3px on mobile)
--space-sm: 8px   (6px on mobile)
--space-md: 12px  (10px on mobile)
--space-lg: 16px  (12px on mobile)
--space-xl: 24px  (16px on mobile)
--space-2xl: 32px (24px on mobile)
--space-3xl: 48px (32px on mobile)
```

### Component Sizes
- **Buttons**: 44px height (48px on mobile)
- **Inputs**: 44px height (48px on mobile)
- **Touch Targets**: 44x44px minimum (iOS requirement)
- **Icons**: 16px (sm), 20px (md), 24px (lg)

## Supabase Schema

### songs
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
artist TEXT NOT NULL
album TEXT
album_art TEXT
spotify_uri TEXT
latitude DOUBLE PRECISION
longitude DOUBLE PRECISION
location_name TEXT
location_description TEXT
tags TEXT[]
upvotes INTEGER DEFAULT 0
verified BOOLEAN DEFAULT false
user_id UUID REFERENCES auth.users(id)
submitted_by TEXT
submitted_at TIMESTAMPTZ
status TEXT DEFAULT 'live'  -- 'live' | 'needs_edit' | 'removed'
admin_notes TEXT
```

### profiles
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT
display_name TEXT
avatar_url TEXT
is_admin BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### song_comments
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
song_id TEXT REFERENCES songs(id)
user_id UUID REFERENCES auth.users(id)
content TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

### song_photos
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
song_id TEXT REFERENCES songs(id)
user_id UUID REFERENCES auth.users(id)
photo_url TEXT NOT NULL
caption TEXT
approved BOOLEAN DEFAULT false
rejected BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT NOW()
```

### song_likes
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
song_id TEXT REFERENCES songs(id)
user_id UUID REFERENCES auth.users(id)
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(song_id, user_id)  -- One like per user per song
```

## Row Level Security (RLS)

### songs
- **SELECT**: Anyone (public)
- **INSERT**: Authenticated users (must match user_id)
- **UPDATE**: Owner OR admin
- **DELETE**: Owner OR admin

### profiles
- **SELECT**: Anyone
- **UPDATE**: Owner only

### song_comments
- **SELECT**: Anyone
- **INSERT**: Authenticated users
- **DELETE**: Owner OR admin

### song_photos
- **SELECT**: WHERE approved=true (public) OR owner OR admin
- **INSERT**: Authenticated users
- **UPDATE**: Admin only (for approval)
- **DELETE**: Owner OR admin

### song_likes
- **SELECT**: Anyone
- **INSERT**: Authenticated users (must match user_id)
- **DELETE**: Owner only

## Spotify Integration

### Web API (Track Info)
- Endpoint: `https://api.spotify.com/v1/tracks/{id}`
- Used for: Fetching track metadata, album art
- Auth: Client credentials (optional) or OAuth token

### Web Playback SDK (Full Playback)
- Premium users only
- OAuth PKCE flow for user auth
- Scopes: `streaming, user-read-email, user-read-private`
- Token stored in localStorage
- Refresh token for persistent auth

### oEmbed API (Preview Embeds)
- Endpoint: `https://open.spotify.com/oembed`
- Used for: 30-second preview playback (Free users)
- No auth required

## Mobile Responsiveness

### Breakpoints
```css
--breakpoint-sm: 640px   /* Mobile */
--breakpoint-md: 768px   /* Tablet */
--breakpoint-lg: 1024px  /* Desktop */
```

### Mobile-Specific Behavior
- **Header buttons**: Icon-only below 640px
- **Discovery Panel**: Full-width on mobile
- **Modals**: Slide up from bottom, max-height 90vh
- **Music Player**: Smaller album art, hide shuffle on tiny screens
- **Touch Targets**: Minimum 44x44px everywhere
- **Safe Areas**: `env(safe-area-inset-*)` for notched devices

## Performance Optimizations

1. **Image Caching**: Preload album art into browser cache
2. **Rate Limiting**: 2-second delay between Spotify API calls
3. **Optimistic Updates**: Update UI immediately, sync to DB async
4. **Memoization**: `useMemo` for filtered songs, computed values
5. **Lazy Loading**: Components load on-demand (modals)

## Error Handling

### Auth Context
- Robust timeout handling (5-second timeout on init)
- Promise.race for profile fetching
- Skip redundant INITIAL_SESSION events
- Error boundaries for auth failures

### Supabase Queries
- Try-catch blocks around all async operations
- Graceful fallbacks (empty arrays, null values)
- User-facing error messages via alerts

### Spotify API
- 429 rate limit handling with delays
- Fallback to mock data when API unavailable
- Token refresh on expiry

## Testing Strategy

### UI Tests (`src/utils/uiTests.ts`)
- Auto-runs in dev mode
- Checks button padding, input heights, modal accessibility
- Results logged to browser console
- **MUST PASS before committing** (enforced by rule)

### Manual Testing Checklist
1. Mobile devices (iPhone, Android)
2. Different screen sizes (SE, 14, Pixel)
3. Landscape orientation
4. Auth flows (login, signup, OAuth)
5. Song submission and playback
6. Admin features (if admin user)

## Deployment

### Vercel (Production)
- Connected to GitHub repo
- Auto-deploys on push to main
- Environment variables configured in dashboard
- Build command: `npm run build`
- Output directory: `dist`

### Local Development
```bash
npm run dev    # Port 5173 (Vite default)
```

## Common Issues & Solutions

### Issue: Auth Loop
**Symptom**: Login hangs, keeps refreshing
**Solution**: Check AuthContext timeout logic, clear localStorage

### Issue: Spotify Not Playing
**Symptom**: "Spotify Client ID not configured"
**Solution**: Add VITE_SPOTIFY_CLIENT_ID to .env

### Issue: Mobile Content Clipped
**Symptom**: Can't scroll in modals
**Solution**: Ensure flex layout with overflow-y: auto

### Issue: UI Tests Failing
**Symptom**: Button padding too small
**Solution**: Use explicit inline styles with proper padding (8px+ for buttons, 10px+ for badges)

### Issue: Disk Space Full
**Symptom**: Cannot write files, git operations fail
**Solution**: Clear node cache, temp files, browser cache

## Development Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with frequent commits
3. Check UI tests in browser console
4. Test on mobile (Chrome DevTools responsive mode)
5. Commit with descriptive messages
6. Push and merge to main
7. Update README and memory files
8. Vercel auto-deploys
