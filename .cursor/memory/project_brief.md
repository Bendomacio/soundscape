# Project Brief - SoundScape

## What is SoundScape?

SoundScape is a location-based music discovery app that connects songs to physical places. Users can explore a map to discover songs tied to specific locations, or share their own musical memories by submitting songs with location context.

**Live App**: https://soundscape-self.vercel.app/

## The Vision

Create a crowdsourced musical map of the world where:
- Songs are anchored to meaningful locations
- Users discover music through place-based exploration
- Communities build shared musical memories
- Every location has its soundtrack

## Core User Experience

### Discovery Flow
1. User opens app and sees map centered on their location
2. Song markers appear showing nearby songs
3. User adjusts radius to explore more/less area
4. Click a marker to see song details and play preview
5. Full Spotify integration for seamless playback

### Submission Flow
1. User clicks "Submit Song" 
2. Search for location via map or address search
3. Enter song details or paste Spotify URL
4. Add context: why this song, this place?
5. Submit for community (with admin review)

### Social Features
- **Comments**: Discuss songs and share memories
- **Photos**: Upload pictures from the location
- **Upvotes**: Community-curated quality
- **My Submissions**: Track your contributions

## Key Design Principles

### 1. Mobile-First
- Designed for exploration on-the-go
- Touch-friendly interface (44px minimum)
- Works great on phones, tablets, desktops

### 2. Clean & Modern
- Dark theme with vibrant accents (green/pink)
- Smooth animations and transitions
- No clutter, focus on content

### 3. Fast & Responsive
- Optimistic UI updates
- Cached album art
- Smooth map interactions

### 4. Community-Driven
- User submissions
- Admin curation
- Collaborative mapping

## Target Audience

### Primary Users
- Music lovers aged 18-35
- Urban explorers and travelers
- People who associate songs with memories/places
- Festival-goers, concert attendees
- Location-based social media users

### Use Cases
1. **Tourist**: Discover songs about places they're visiting
2. **Local**: Share songs connected to their neighborhood
3. **Music Nerd**: Curate musical geography (album covers shot here, songs written about this place)
4. **Nostalgic**: Mark places where they first heard a song
5. **Event-goer**: Document concerts, festivals, moments

## Technical Highlights

- **React 19** + TypeScript for modern frontend
- **Mapbox** for beautiful, interactive maps
- **Spotify** for music metadata and playback
- **Supabase** for realtime database, auth, and storage
- **Vercel** for fast, global deployment

## Current Status: MVP Complete ✅

### Implemented Features (20+)
- Interactive map with song markers
- Location-based discovery with radius control
- Spotify integration (search, metadata, full playback)
- User authentication (email + Google/Discord/Facebook)
- Song submission with location picker
- Comments and photos on songs
- Upvote/like system
- Admin panel for curation
- My Submissions page
- Song review workflow
- Mobile optimization
- Discovery modes (Near Me vs Explore)

### Quality of Life
- Smooth loading screen
- Scrollable modals on mobile
- UI test enforcement
- Safe area support for notched phones
- Responsive design across devices

## Roadmap Priorities

### High Priority
1. **Profile Editing** - Let users customize name/avatar
2. **Social Sharing** - Share specific songs/locations
3. **Playlists** - Create location-based playlists

### Medium Priority
1. **Search & Filter** - Find songs by artist, genre, tags
2. **Drag Marker** - Easier location positioning
3. **Notifications** - Comments, likes, admin feedback
4. **Export** - Download your submissions

### Future Ideas
- Collaborative playlists for neighborhoods
- Event integration (concerts, festivals)
- Historical songs (show songs from specific eras)
- Heatmap view (popular music areas)
- AR mode (point phone to see nearby songs)
- Spotify playlist sync
- Public profiles
- Follow users

## Project Values

### For Users
- **Authenticity**: Real stories, real places
- **Discovery**: Find music you wouldn't otherwise
- **Memory**: Preserve musical moments
- **Community**: Shared experiences

### For Development
- **Quality**: UI tests, clean code, documentation
- **Simplicity**: Don't over-engineer
- **Speed**: Fast load times, smooth interactions
- **Maintainability**: Clear architecture, good docs

## Success Metrics (Future)

- Number of songs submitted
- Geographic coverage (cities, countries)
- User engagement (daily active users)
- Songs played per session
- Comments and likes per song
- Return visitor rate

## Team & Development

**Solo Developer**: Ben
**Development Start**: January 2026
**Current Version**: MVP (v1.0)
**Deployment**: Continuous (Vercel auto-deploy)

## Contact & Links

- **Live App**: https://soundscape-self.vercel.app/
- **GitHub**: https://github.com/Bendomacio/soundscape
- **Supabase**: tairuapqunhrpzkvoxor.supabase.co

## Notes for Future Developers

1. **Read the memory files first** - They contain critical context
2. **Check UI tests** before every commit (rule enforced)
3. **Test on mobile** - Most users will be on phones
4. **Preserve the vibe** - Clean, modern, music-focused
5. **Database migrations** - Run SQL in order, never skip
6. **Environment variables** - Copy from .env.example
7. **Git workflow** - Feature branches, merge to main
8. **Ask questions** - Ben wants quality over speed

## Project Philosophy

> "Every place has a soundtrack. SoundScape makes it visible."

We're not just building a music app or a map app. We're building a new way to experience both music and place, together. Every feature should serve that core idea: connecting songs to spaces, memories to maps, people to places through music.
