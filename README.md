# Soundscape

A location-based music discovery app that connects songs to places. Explore a map and discover songs tied to specific locations, or share your own musical memories.

## Features

- **Interactive Map** - Mapbox-powered map showing song markers at their associated locations
- **Music Player** - Spotify-integrated player for playing songs directly in the app
- **Song Discovery** - Browse songs by location with radius-based filtering
- **Song Submission** - Submit new songs with location search and Spotify integration
- **User Authentication** - Sign in with email/password or OAuth (Google, Discord, Facebook)
- **Admin Panel** - Manage songs, verify submissions, update metadata
- **Mobile Optimized** - Fully responsive with touch-friendly UI and safe area support

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS with custom design system
- **Maps**: Mapbox GL JS via react-map-gl
- **Geocoding**: Mapbox Geocoding API
- **Music**: Spotify Web API + Web Playback SDK (full playback for Premium users)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth (email/password + OAuth)
- **Storage**: Supabase Storage (for user-uploaded photos)
- **Icons**: Lucide React
- **Deployment**: Vercel (free tier)

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
   
   Run these SQL migrations in order in your Supabase SQL Editor:
   1. `supabase-auth-migration.sql` - Auth tables, profiles, and RLS policies
   2. `supabase-comments-photos-migration.sql` - Comments and photos tables
   3. `supabase-songs-review-migration.sql` - Song review system and likes
   
   Then create the storage bucket:
   - Go to Supabase Storage
   - Create a new bucket named `song-photos`
   - Make it **public**

5. **Configure authentication (optional)**
   
   For OAuth providers (Google, Discord, Facebook), follow the detailed guide in [`AUTH_SETUP_GUIDE.md`](./AUTH_SETUP_GUIDE.md).

6. **Configure Spotify (required for full playback)**
   
   1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   2. Create a new app
   3. Add redirect URIs:
      - `http://localhost:5174/callback` (local dev)
      - `https://your-domain.vercel.app/callback` (production)
   4. Copy the **Client ID** to your `.env` file
   
   > **Note**: Full song playback requires Spotify Premium. Free users get 30-second previews.

7. **Start the development server**
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

- **songs** - Song entries with location data, Spotify metadata, user ownership, status, and upvotes
- **profiles** - User profiles with display name, avatar, and admin status
- **song_comments** - User comments on songs
- **song_photos** - User-uploaded photos with admin approval workflow
- **song_likes** - Upvote tracking (one like per user per song)

### Row Level Security

- Anyone can read `live` songs; users can read their own (any status); admins can read all
- Authenticated users can create songs and edit/delete their own
- Admins can manage all songs and change status
- Users can only delete their own comments
- Photo uploads require authentication; only approved photos are publicly visible

### Database Functions

- `get_song_like_count(song_id)` - Get total likes for a song
- `has_user_liked_song(song_id, user_id)` - Check if user liked a song
- `increment_upvotes(song_id)` - Increment song's upvote count
- `decrement_upvotes(song_id)` - Decrement song's upvote count (min 0)

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
| `VITE_SPOTIFY_CLIENT_ID` | **Yes** | Spotify app client ID (required for full playback) |
| `VITE_SPOTIFY_CLIENT_SECRET` | No | Spotify app client secret (optional, for search) |

> **Notes**: 
> - Without Spotify Client ID, users cannot connect for full playback
> - Without Spotify Client Secret, the app uses mock search results for song lookup
> - **Spotify Premium required** for full song playback (Web Playback SDK); Free users get 30-second previews

## Roadmap

### Completed

| Feature | Description | Status |
|---------|-------------|--------|
| Interactive Map | Mapbox-powered map with song markers | ✅ Done |
| Music Player | Spotify embed + Web Playback SDK for Premium users | ✅ Done |
| Song Discovery | Browse songs by location with radius filtering | ✅ Done |
| Song Submission | 2-step wizard with Spotify search and location picker | ✅ Done |
| Location Search | Search addresses/places using Mapbox Geocoding | ✅ Done |
| Spotify Search | Search songs by name (with URL fallback) | ✅ Done |
| Real Authentication | Email/password + OAuth (Google, Discord, Facebook) | ✅ Done |
| User Profiles | Auto-created profiles with avatar and display name | ✅ Done |
| Song Ownership | Songs linked to users with RLS policies | ✅ Done |
| Admin Panel | Manage songs, review submissions, approve photos | ✅ Done |
| Song Detail Panel | Redesigned with hero album art, dynamic gradients, tabs | ✅ Done |
| Comments | Leave comments on song locations | ✅ Done |
| Location Photos | Upload photos with admin approval workflow | ✅ Done |
| Song Review System | Admin can flag songs for editing with notes | ✅ Done |
| My Submissions | Users can view and edit their submitted songs | ✅ Done |
| Upvote System | Reddit-style likes (one per user) with counter | ✅ Done |
| Discovery Panel | Near Me vs Map Center modes for global exploration | ✅ Done |
| Radius Visualization | Subtle circle overlay showing discovery area | ✅ Done |
| Full Spotify Playback | Web Playback SDK with OAuth (Premium users only) | ✅ Done |
| Mobile Optimization | Responsive design with touch targets, media queries, safe areas | ✅ Done |

### Planned

| Feature | Description | Priority |
|---------|-------------|----------|
| Profile Editing | Update display name and avatar | High |
| Drag Marker | Drag-to-reposition in location picker | Medium |
| Real Spotify Search | Enable when Spotify API signup reopens | Medium |

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
