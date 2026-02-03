# Soundscape 🎵📍

> **Discover the music hidden in the world around you.**

Soundscape is a location-based music discovery app that connects songs to the places that inspired them. Walk through London and hear the songs that were written about the streets you're standing on. Discover that your favourite café was immortalised in a classic track. Share your own musical memories tied to meaningful places.

![Soundscape Preview](https://via.placeholder.com/800x400?text=Soundscape+Preview)

## ✨ Key Features

### 🗺️ Explore Music on a Map
An interactive Mapbox-powered map displays songs as album art markers at their real-world locations. The map features a stylish 45° tilt for an immersive experience.

### 🎧 Integrated Spotify Playback
Connect your Spotify account for seamless playback. Premium users get full tracks via the Web Playback SDK; free users enjoy 30-second previews.

### 📍 Three Discovery Modes
- **Nearby** - Find songs around your current GPS location
- **Explore** - Drop a pin anywhere in the world to discover songs
- **Trip Mode** - Plan a journey and discover all the songs along your route

### 🎯 Trip Mode
Going somewhere? Enter your destination and Soundscape will show you every song along your route. Perfect for road trips or exploring a new city on foot.

### 📱 Song Details & Navigation
Tap any song to see its story, location details, mini-map preview, and get walking directions via Google Maps. On mobile, see your route embedded right in the app.

### 🔗 Songs Nearby & Related
When viewing a song, see sidebar panels showing other songs within 5km and more tracks by the same artist—making it easy to discover connected music.

### 📝 Community Features
- **Comments** - Share your thoughts and memories about song locations
- **Photos** - Upload photos from song locations (with admin approval)
- **Likes** - Upvote your favourite song spots

### 🛡️ Admin Panel
Full admin dashboard to manage songs, review submissions, approve photos, and maintain quality.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite 5 |
| **Maps** | Mapbox GL JS via react-map-gl |
| **Music** | Spotify Web API + Web Playback SDK |
| **Database** | Supabase (PostgreSQL) with Row Level Security |
| **Auth** | Supabase Auth (Email + Google, Discord, Facebook OAuth) |
| **Storage** | Supabase Storage |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account
- [Mapbox](https://mapbox.com) account
- [Spotify Developer](https://developer.spotify.com) account

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Bendomacio/soundscape.git
cd soundscape

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret  # Optional
```

### Database Setup

Run these SQL migrations in your Supabase SQL Editor:
1. `supabase-auth-migration.sql` - Auth tables and RLS policies
2. `supabase-comments-photos-migration.sql` - Comments and photos
3. `supabase-songs-review-migration.sql` - Review system and likes

Then create a public storage bucket named `song-photos`.

See [`AUTH_SETUP_GUIDE.md`](./AUTH_SETUP_GUIDE.md) for OAuth configuration.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── MusicMap.tsx         # Main map with song markers
│   ├── MusicPlayer.tsx      # Spotify player controls
│   ├── SongDetailPanel.tsx  # Song info modal with tabs
│   ├── DiscoveryPanel.tsx   # Nearby/Explore/Trip modes
│   ├── SubmitSongModal.tsx  # Song submission wizard
│   └── AdminPanel.tsx       # Admin management UI
├── contexts/            # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   └── SpotifyPlayerContext.tsx
├── lib/                 # API & utilities
│   ├── songs.ts             # Song CRUD operations
│   ├── spotify.ts           # Spotify API helpers
│   └── supabase.ts          # Supabase client
├── types/               # TypeScript definitions
└── scripts/             # Database scripts
```

## 📜 Changelog

### February 2026

#### 2026-02-03
- **Songs Nearby & Related Panels** - Sidebar panels showing songs within 5km and tracks by the same artist
- **Trip Mode** - Discover songs along your planned route to any destination
- **Improved Map Markers** - Color-coded rings (green = valid, amber = needs Spotify link)
- **45° Map Tilt** - Stylish default pitch for immersive exploration
- **Enhanced Song Detail** - Mini-map preview, embedded directions, Street View link, native sharing

#### 2026-02-02
- **Code Quality Refactor** - Shared UI components, improved TypeScript types, better logging
- **Map Controls Fix** - Controls no longer clip the music player bar

### January 2026

#### 2026-01-22
- **Full Spotify Playback** - Web Playback SDK integration for Premium users
- **Discovery Panel Redesign** - Nearby vs Explore modes with radius visualization
- **Song Review System** - Admin can flag songs for editing with notes
- **My Submissions** - Users can view and edit their submitted songs
- **Upvote System** - Reddit-style likes with one vote per user
- **Mobile Optimization** - Responsive design, touch targets, safe areas
- **Loading Screen Redesign** - Logo, smooth animations, better centering
- **Comments & Photos** - Community features with admin approval workflow

#### 2026-01-21
- **Real Authentication** - Supabase Auth with Google, Discord, Facebook OAuth
- **Song Submission Wizard** - Two-step process with Spotify search and location picker
- **Location Search** - Mapbox Geocoding for address lookup

#### 2026-01-20
- **Interactive Location Picker** - Map-based location selection with "Use My Location"
- **Spotify URL Import** - Auto-populate song details from Spotify links
- **Initial Release** - Core map, markers, and basic playback

## 🗺️ Roadmap

### In Progress
- [ ] Profile editing (display name, avatar)
- [ ] Drag-to-reposition markers in location picker

### Planned
- [ ] Search & filters (by artist, title, genre)
- [ ] Favourites/bookmarks
- [ ] Share links for individual songs
- [ ] PWA support (offline mode, install to home screen)
- [ ] Multiple cities (expand beyond London)

### Ideas
- [ ] Nearby notifications (alert when near a song)
- [ ] Spotify playlist generation from nearby songs
- [ ] Heat map visualization of song density
- [ ] User following and social features
- [ ] Song stories (rich personal narratives)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private. All rights reserved.

---

<p align="center">
  Built with ❤️ using React, Supabase, Mapbox, and Spotify
</p>
