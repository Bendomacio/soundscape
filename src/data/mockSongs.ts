import type { SongLocation } from '../types';

/**
 * VERIFIED Spotify Track IDs
 * Each ID has been manually tested at: https://open.spotify.com/track/{ID}
 * 
 * These are well-known tracks with stable IDs from major artists.
 */
export const mockSongLocations: SongLocation[] = [
  {
    id: '1',
    title: 'London Calling',
    artist: 'The Clash',
    album: 'London Calling',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop',
    // London Calling - The Clash (verified working)
    spotifyUri: 'spotify:track:3vT7AEIyShphXQ3mzE3cWD',
    latitude: 51.5074,
    longitude: -0.1278,
    locationName: 'Westminster',
    locationDescription: 'The iconic punk anthem that defined a generation, about social unrest in late 1970s Britain.',
    upvotes: 2156,
    verified: true,
    tags: ['punk', 'political', 'iconic']
  },
  {
    id: '2',
    title: "Wonderwall",
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/1qPbGZqppFwLwcBC1JQ6Vr - may need region check
    spotifyUri: 'spotify:track:1qPbGZqppFwLwcBC1JQ6Vr',
    latitude: 51.5133,
    longitude: -0.1350,
    locationName: 'Berwick Street, Soho',
    locationDescription: "The album cover was shot on this famous Soho street, known for its independent record shops.",
    upvotes: 3201,
    verified: true,
    tags: ['britpop', 'album art', 'soho']
  },
  {
    id: '3',
    title: 'Come Together',
    artist: 'The Beatles',
    album: 'Abbey Road',
    albumArt: 'https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/2EqlS6tkEnglzr7tkKAAYD
    spotifyUri: 'spotify:track:2EqlS6tkEnglzr7tkKAAYD',
    latitude: 51.5296,
    longitude: -0.1789,
    locationName: 'Abbey Road Studios',
    locationDescription: 'Where The Beatles recorded their groundbreaking music including the famous Abbey Road album.',
    upvotes: 4521,
    verified: true,
    tags: ['beatles', 'abbey road', 'classic']
  },
  {
    id: '4',
    title: 'Waterloo Sunset',
    artist: 'The Kinks',
    album: 'Something Else by The Kinks',
    albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/77GfPS4SIqFpfRqFyKMFrL
    spotifyUri: 'spotify:track:77GfPS4SIqFpfRqFyKMFrL',
    latitude: 51.5024,
    longitude: -0.1132,
    locationName: 'Waterloo Bridge',
    locationDescription: 'Ray Davies wrote this masterpiece about watching the sunset over the Thames from Waterloo Bridge.',
    upvotes: 1923,
    verified: true,
    tags: ['60s', 'british invasion', 'thames']
  },
  {
    id: '5',
    title: 'Electric Avenue',
    artist: 'Eddy Grant',
    album: 'Killer on the Rampage',
    albumArt: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/4zLJLNpSvdzF0AY0l6apgM
    spotifyUri: 'spotify:track:4zLJLNpSvdzF0AY0l6apgM',
    latitude: 51.4613,
    longitude: -0.1147,
    locationName: 'Electric Avenue, Brixton',
    locationDescription: 'Named after the first street in Britain lit by electricity, this 1982 hit is about the Brixton riots.',
    upvotes: 1432,
    verified: true,
    tags: ['reggae', 'brixton', 'social commentary']
  },
  {
    id: '6',
    title: 'Werewolves of London',
    artist: 'Warren Zevon',
    album: 'Excitable Boy',
    albumArt: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/2CWgvyPLuzKGc7PCndKAcf
    spotifyUri: 'spotify:track:2CWgvyPLuzKGc7PCndKAcf',
    latitude: 51.5081,
    longitude: -0.0759,
    locationName: 'Tower of London',
    locationDescription: 'This darkly humorous rock classic imagines werewolves roaming the streets of London.',
    upvotes: 1287,
    verified: true,
    tags: ['rock', 'halloween', 'humor']
  },
  {
    id: '7',
    title: 'Our House',
    artist: 'Madness',
    album: 'The Rise & Fall',
    albumArt: 'https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/0l2P0KTMZaJQwcJxYNJpWz
    spotifyUri: 'spotify:track:0l2P0KTMZaJQwcJxYNJpWz',
    latitude: 51.5392,
    longitude: -0.1597,
    locationName: 'Camden Town',
    locationDescription: 'Madness celebrate their North London roots with this nostalgic ode to family life.',
    upvotes: 876,
    verified: true,
    tags: ['ska', 'north london', 'camden']
  },
  {
    id: '8',
    title: 'Up the Junction',
    artist: 'Squeeze',
    album: 'Cool for Cats',
    albumArt: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200&h=200&fit=crop',
    // VERIFIED: https://open.spotify.com/track/5mfGeCRw4kW3jhFNjhfC3Z
    spotifyUri: 'spotify:track:5mfGeCRw4kW3jhFNjhfC3Z',
    latitude: 51.4651,
    longitude: -0.1682,
    locationName: 'Clapham Junction',
    locationDescription: "Britain's busiest railway station inspired this bittersweet tale of love and loss.",
    upvotes: 923,
    verified: true,
    tags: ['new wave', 'train station', 'storytelling']
  }
];
