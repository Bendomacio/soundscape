# Soundscape

A location-based music discovery app that connects songs to places. Explore a map and discover songs tied to specific locations, or share your own musical memories.

## Features

- **Interactive Map** - Mapbox-powered map showing song markers at their associated locations
- **Music Player** - Spotify-integrated player for playing songs directly in the app
- **Song Discovery** - Browse songs by location with radius-based filtering
- **Song Submission** - Submit new songs with location search and Spotify integration
- **User Authentication** - Sign in with email/password or OAuth (Google, Discord, Facebook)
- **Admin Panel** - Manage songs, verify submissions, update metadata

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS with custom design system
- **Maps**: Mapbox GL JS via react-map-gl
- **Music**: Spotify Web API + Web Playback SDK
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password + OAuth)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Supabase](https://supabase.com) account
- [Mapbox](https://mapbox.com) account
- [Spotify Developer](https://developer.spotify.com) account (optional, for real search)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bendomacio/soundscape.git
   cd soundscape
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_TOKEN=your_mapbox_public_token
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

4. **Set up the database**
   
   Run the SQL migration in your Supabase SQL Editor:
   - Open `supabase-auth-migration.sql`
   - Execute the SQL to create tables, triggers, and RLS policies

5. **Configure authentication (optional)**
   
   For OAuth providers (Google, Discord, Facebook), follow the detailed guide in [`AUTH_SETUP_GUIDE.md`](./AUTH_SETUP_GUIDE.md).

6. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5174](http://localhost:5174) in your browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── MusicMap.tsx         # Main map display
│   ├── MusicPlayer.tsx      # Spotify player UI
│   ├── SubmitSongModal.tsx  # Song submission wizard
│   ├── LocationPicker.tsx   # Map-based location selector
│   ├── AuthModal.tsx        # Login/signup modal
│   ├── Header.tsx           # Navigation header
│   └── ...
├── contexts/            # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   └── SpotifyPlayerContext.tsx
├── lib/                 # API & utility functions
│   ├── songs.ts             # Song CRUD operations
│   ├── spotify.ts           # Spotify API helpers
│   └── supabase.ts          # Supabase client
├── types/               # TypeScript types
├── styles/              # CSS design system
└── scripts/             # Database maintenance scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Database Schema

### Tables

- **songs** - Song entries with location data, Spotify metadata, and user ownership
- **profiles** - User profiles with display name, avatar, and admin status
- **song_comments** - User comments on songs
- **song_photos** - User-uploaded photos with admin approval workflow

### Row Level Security

- Anyone can read songs
- Authenticated users can create songs and edit/delete their own
- Admins can manage all songs

## Authentication

Soundscape supports multiple authentication methods:

- **Email/Password** - Traditional signup with email confirmation
- **Google OAuth** - Sign in with Google
- **Discord OAuth** - Sign in with Discord
- **Facebook OAuth** - Sign in with Facebook

See [`AUTH_SETUP_GUIDE.md`](./AUTH_SETUP_GUIDE.md) for OAuth provider configuration.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `VITE_MAPBOX_TOKEN` | Yes | Mapbox public access token |
| `VITE_SPOTIFY_CLIENT_ID` | No | Spotify app client ID |
| `VITE_SPOTIFY_CLIENT_SECRET` | No | Spotify app client secret |

> **Note**: Without Spotify credentials, the app uses mock search results for song lookup.

## Roadmap

### Completed

| Feature | Description | Status |
|---------|-------------|--------|
| Interactive Map | Mapbox-powered map with song markers | Done |
| Music Player | Spotify embed player for song playback | Done |
| Song Discovery | Browse songs by location with radius filtering | Done |
| Song Submission | 2-step wizard with Spotify search and location picker | Done |
| Location Search | Search addresses/places using Mapbox Geocoding | Done |
| Spotify Search | Search songs by name (with URL fallback) | Done |
| Real Authentication | Email/password + OAuth (Google, Discord, Facebook) | Done |
| User Profiles | Auto-created profiles with avatar and display name | Done |
| Song Ownership | Songs linked to users with RLS policies | Done |
| Admin Panel | Manage songs, verify submissions, approve photos | Done |
| Song Detail Panel | Redesigned with hero album art, dynamic gradients, action bar | Done |
| Comments | Leave comments on song locations | Done |
| Location Photos | Upload photos with admin approval workflow | Done |

### Planned

| Feature | Description | Status | Priority |
|---------|-------------|--------|----------|
| My Submissions | View and manage your submitted songs | Planned | High |
| Profile Editing | Update display name and avatar | Planned | High |
| Drag Marker | Drag-to-reposition in location picker | Planned | Medium |
| Mobile Responsiveness | Optimise UI for mobile devices | Planned | Medium |

### Suggested

| Feature | Description | Notes |
|---------|-------------|-------|
| Favorites | Bookmark songs to a personal collection | Would need new table |
| Song Stories | Add personal stories/memories to songs | Rich content beyond comments |
| Song Verification | Admin workflow to verify/approve submissions | Quality control |
| Search & Filters | Filter songs by artist, title, genre | Better discovery |
| Nearby Notifications | Alert when near a song location | Requires geofencing/PWA |
| Playlists | Create playlists from nearby songs | Spotify playlist integration |
| Share Links | Share individual song locations | Deep linking |
| Multiple Cities | Expand beyond London | Region selection UI |
| PWA Support | Offline mode, install to home screen | Service worker setup |
| User Following | Follow users, see their submissions | Social features |
| Song Stories | Add personal stories/memories to songs | Rich content |
| Heat Map | Visualise song density by area | Data visualisation |
| Genre Tags | Categorise songs by genre | Better organisation |
| Listening History | Track songs you've listened to | Engagement metrics |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private. All rights reserved.

---

Built with React, Supabase, Mapbox, and Spotify.
