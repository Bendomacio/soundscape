/**
 * Database Seeding Script
 * Run this to populate the Supabase database with London songs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default placeholder - will be replaced with real Spotify album art on load
const PLACEHOLDER_ART = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';

const londonSongs = [
  // === CENTRAL LONDON ===
  {
    id: 'london-1',
    title: 'London Calling',
    artist: 'The Clash',
    album: 'London Calling',
    album_art: PLACEHOLDER_ART,
    spotify_uri: 'spotify:track:3vT7AEIyShphXQ3mzE3cWD',
    latitude: 51.5007,
    longitude: -0.1246,
    location_name: 'Big Ben & Westminster',
    location_description: 'The iconic punk anthem about social unrest in late 1970s Britain, calling out from the heart of London.',
    upvotes: 4521,
    verified: true,
    tags: ['punk', 'iconic', '1979']
  },
  {
    id: 'london-2',
    title: 'Waterloo Sunset',
    artist: 'The Kinks',
    album: 'Something Else by The Kinks',
    spotify_uri: 'spotify:track:77GfPS4SIqFpfRqFyKMFrL',
    latitude: 51.5055,
    longitude: -0.1171,
    location_name: 'Waterloo Bridge',
    location_description: 'Ray Davies wrote this masterpiece about watching Terry and Julie meet at Waterloo Station and cross the bridge as the sun sets over the Thames.',
    upvotes: 3892,
    verified: true,
    tags: ['60s', 'classic', 'romantic']
  },
  {
    id: 'london-3',
    title: 'West End Girls',
    artist: 'Pet Shop Boys',
    album: 'Please',
    spotify_uri: 'spotify:track:2cGxRwrMyEAp8dEbuZaVv6',
    latitude: 51.5117,
    longitude: -0.1280,
    location_name: 'Leicester Square',
    location_description: 'An exploration of class and aspiration in 1980s London, set against the backdrop of the West End.',
    upvotes: 2987,
    verified: true,
    tags: ['synth-pop', '80s', 'west end']
  },
  {
    id: 'london-4',
    title: 'A Nightingale Sang in Berkeley Square',
    artist: 'Vera Lynn',
    album: 'We\'ll Meet Again',
    spotify_uri: 'spotify:track:3MjUtNVVq3C8Fn0MP3zhXa',
    latitude: 51.5097,
    longitude: -0.1450,
    location_name: 'Berkeley Square',
    location_description: 'The famous 1940 song romanticizing this elegant Mayfair square, supposedly where nightingales once sang.',
    upvotes: 1876,
    verified: true,
    tags: ['1940s', 'jazz', 'romantic']
  },
  {
    id: 'london-5',
    title: 'Baker Street',
    artist: 'Gerry Rafferty',
    album: 'City to City',
    spotify_uri: 'spotify:track:1qU99DpqhYIfrBSqGBaIEd',
    latitude: 51.5226,
    longitude: -0.1571,
    location_name: 'Baker Street',
    location_description: 'The iconic sax-driven track about the weariness of city life, named after the famous street known for Sherlock Holmes.',
    upvotes: 4123,
    verified: true,
    tags: ['rock', 'saxophone', '1978']
  },
  {
    id: 'london-6',
    title: 'Piccadilly Palare',
    artist: 'Morrissey',
    album: 'Bona Drag',
    spotify_uri: 'spotify:track:6ucCQbvXrFSFQYnPjqOyKr',
    latitude: 51.5100,
    longitude: -0.1347,
    location_name: 'Piccadilly Circus',
    location_description: 'Morrissey\'s tribute to the gay subculture that gathered around Piccadilly, using Polari slang.',
    upvotes: 1234,
    verified: true,
    tags: ['indie', '90s', 'polari']
  },
  {
    id: 'london-7',
    title: 'Warwick Avenue',
    artist: 'Duffy',
    album: 'Rockferry',
    spotify_uri: 'spotify:track:6kLCHFM39lkFMmBpGp7a5S',
    latitude: 51.5233,
    longitude: -0.1839,
    location_name: 'Warwick Avenue Tube Station',
    location_description: 'A heartbreaking ballad about ending a relationship, set at this Little Venice tube station.',
    upvotes: 2341,
    verified: true,
    tags: ['soul', '2008', 'heartbreak']
  },
  {
    id: 'london-8',
    title: 'London Bridge',
    artist: 'Fergie',
    album: 'The Dutchess',
    spotify_uri: 'spotify:track:4MsC0rRr9HkOkOFJJMZjKQ',
    latitude: 51.5079,
    longitude: -0.0877,
    location_name: 'London Bridge',
    location_description: 'The iconic bridge connecting the City to Southwark, referenced in this 2006 hit.',
    upvotes: 1567,
    verified: true,
    tags: ['pop', '2006', 'hip-hop']
  },
  {
    id: 'london-9',
    title: 'Trafalgar Square',
    artist: 'Ronan Keating',
    album: 'Destination',
    spotify_uri: 'spotify:track:0HlFzCAKcuQ2zIQ9bPNmDZ',
    latitude: 51.5081,
    longitude: -0.1281,
    location_name: 'Trafalgar Square',
    location_description: 'London\'s most famous square, with Nelson\'s Column and the National Gallery.',
    upvotes: 987,
    verified: true,
    tags: ['pop', '2002']
  },
  {
    id: 'london-10',
    title: 'Victoria',
    artist: 'The Kinks',
    album: 'Arthur',
    spotify_uri: 'spotify:track:57wBLvOIM5zfJPd9zVOc5V',
    latitude: 51.4952,
    longitude: -0.1439,
    location_name: 'Victoria Station',
    location_description: 'The Kinks\' tribute to the Victorian era, named after this major London terminus.',
    upvotes: 1654,
    verified: true,
    tags: ['60s', 'rock', 'british']
  },
  // === SOHO & WEST END ===
  {
    id: 'london-11',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    spotify_uri: 'spotify:track:1qPbGZqppFwLwcBC1JQ6Vr',
    latitude: 51.5133,
    longitude: -0.1350,
    location_name: 'Berwick Street, Soho',
    location_description: 'The album cover was photographed on this famous Soho street, known for its independent record shops.',
    upvotes: 5234,
    verified: true,
    tags: ['britpop', '1995', 'album cover']
  },
  {
    id: 'london-12',
    title: 'Soho Square',
    artist: 'Kirsty MacColl',
    album: 'Electric Landlady',
    spotify_uri: 'spotify:track:5rwXJMK1x3mY6FVJJKGVNY',
    latitude: 51.5152,
    longitude: -0.1320,
    location_name: 'Soho Square',
    location_description: 'Kirsty MacColl\'s bittersweet song about lost love and this charming central London garden.',
    upvotes: 1432,
    verified: true,
    tags: ['indie', '1991', 'romantic']
  },
  {
    id: 'london-13',
    title: 'Carnaby Street',
    artist: 'The Jam',
    album: 'This Is the Modern World',
    spotify_uri: 'spotify:track:1FPe1uIjdPzDgb0UGf7wMG',
    latitude: 51.5130,
    longitude: -0.1390,
    location_name: 'Carnaby Street',
    location_description: 'The famous fashion street that defined Swinging London in the 1960s.',
    upvotes: 1876,
    verified: true,
    tags: ['mod', 'punk', '1977']
  },
  {
    id: 'london-14',
    title: 'A Foggy Day (In London Town)',
    artist: 'Ella Fitzgerald',
    album: 'Ella Fitzgerald Sings the George and Ira Gershwin Songbook',
    spotify_uri: 'spotify:track:2bFSbHD7YrXTlfdGDjYRtG',
    latitude: 51.5138,
    longitude: -0.1331,
    location_name: 'Shaftesbury Avenue',
    location_description: 'Gershwin\'s classic about London fog lifting when meeting someone special in the West End.',
    upvotes: 2134,
    verified: true,
    tags: ['jazz', 'standard', '1937']
  },
  // === NORTH LONDON ===
  {
    id: 'london-15',
    title: 'Come Together',
    artist: 'The Beatles',
    album: 'Abbey Road',
    spotify_uri: 'spotify:track:2EqlS6tkEnglzr7tkKAAYD',
    latitude: 51.5320,
    longitude: -0.1780,
    location_name: 'Abbey Road Studios',
    location_description: 'The legendary recording studios where The Beatles created their masterpieces, including the famous zebra crossing.',
    upvotes: 6789,
    verified: true,
    tags: ['rock', 'beatles', 'iconic']
  },
  {
    id: 'london-16',
    title: 'Our House',
    artist: 'Madness',
    album: 'The Rise & Fall',
    spotify_uri: 'spotify:track:5ioHFYb3qfLj23xb2J3Xj5',
    latitude: 51.5392,
    longitude: -0.1426,
    location_name: 'Camden Town',
    location_description: 'Madness celebrate their North London roots with this nostalgic ode to family life in Camden.',
    upvotes: 3456,
    verified: true,
    tags: ['ska', 'north london', '1982']
  },
  {
    id: 'london-17',
    title: 'Primrose Hill',
    artist: 'Madness',
    album: 'The Liberty of Norton Folgate',
    spotify_uri: 'spotify:track:2nFrqJ0LjYEP01sYLvSMkV',
    latitude: 51.5393,
    longitude: -0.1605,
    location_name: 'Primrose Hill',
    location_description: 'The famous North London hill with stunning views of the city skyline.',
    upvotes: 1234,
    verified: true,
    tags: ['ska', 'north london', '2009']
  },
  {
    id: 'london-18',
    title: 'Sunny Afternoon',
    artist: 'The Kinks',
    album: 'Face to Face',
    spotify_uri: 'spotify:track:1s3qhnHn0uwCBntCVEqpQa',
    latitude: 51.5890,
    longitude: -0.1440,
    location_name: 'Muswell Hill',
    location_description: 'Ray Davies wrote this about the taxman taking everything, inspired by his life in Muswell Hill.',
    upvotes: 2876,
    verified: true,
    tags: ['60s', 'british invasion', 'satire']
  },
  {
    id: 'london-19',
    title: 'The Streets of London',
    artist: 'Ralph McTell',
    album: 'Streets...',
    spotify_uri: 'spotify:track:0PxABLzuOBHiQUXsMNuEjQ',
    latitude: 51.5505,
    longitude: -0.1081,
    location_name: 'King\'s Cross',
    location_description: 'A poignant folk song about London\'s homeless, particularly around the King\'s Cross area.',
    upvotes: 2345,
    verified: true,
    tags: ['folk', '1969', 'social commentary']
  },
  {
    id: 'london-20',
    title: 'Finsbury Park',
    artist: 'The Libertines',
    album: 'Anthems for Doomed Youth',
    spotify_uri: 'spotify:track:6KrhG4GXMdIwLnPAwOdJJb',
    latitude: 51.5642,
    longitude: -0.1063,
    location_name: 'Finsbury Park',
    location_description: 'The North London park that hosts major concerts and festivals.',
    upvotes: 987,
    verified: true,
    tags: ['indie', '2015', 'north london']
  },
  {
    id: 'london-21',
    title: 'Highgate',
    artist: 'The Pogues',
    album: 'Peace and Love',
    spotify_uri: 'spotify:track:3h1i9bS4xGRqPmSQ3TCXQY',
    latitude: 51.5714,
    longitude: -0.1465,
    location_name: 'Highgate Cemetery',
    location_description: 'The atmospheric Victorian cemetery where Karl Marx is buried.',
    upvotes: 876,
    verified: true,
    tags: ['celtic punk', '1989']
  },
  {
    id: 'london-22',
    title: 'Hampstead Incident',
    artist: 'Donovan',
    album: 'Mellow Yellow',
    spotify_uri: 'spotify:track:63v7puRPqD9UHgS9np3kzI',
    latitude: 51.5569,
    longitude: -0.1781,
    location_name: 'Hampstead Heath',
    location_description: 'The vast ancient heath in North London, beloved by walkers and artists.',
    upvotes: 765,
    verified: true,
    tags: ['folk', '1967', 'psychedelic']
  },
  // === SOUTH LONDON ===
  {
    id: 'london-23',
    title: 'Electric Avenue',
    artist: 'Eddy Grant',
    album: 'Killer on the Rampage',
    spotify_uri: 'spotify:track:4zLJLNpSvdzF0AY0l6apgM',
    latitude: 51.4613,
    longitude: -0.1147,
    location_name: 'Electric Avenue, Brixton',
    location_description: 'The first street in Britain to be lit by electricity, this 1982 hit addresses the Brixton riots.',
    upvotes: 3234,
    verified: true,
    tags: ['reggae', 'brixton', '1982']
  },
  {
    id: 'london-24',
    title: 'The Guns of Brixton',
    artist: 'The Clash',
    album: 'London Calling',
    spotify_uri: 'spotify:track:39b0PdXDCP8xSMiB3FJcJc',
    latitude: 51.4620,
    longitude: -0.1160,
    location_name: 'Brixton',
    location_description: 'Paul Simonon\'s reggae-influenced song about police tension in his home neighborhood of Brixton.',
    upvotes: 2876,
    verified: true,
    tags: ['punk', 'reggae', '1979']
  },
  {
    id: 'london-25',
    title: 'Up the Junction',
    artist: 'Squeeze',
    album: 'Cool for Cats',
    spotify_uri: 'spotify:track:5mfGeCRw4kW3jhFNjhfC3Z',
    latitude: 51.4651,
    longitude: -0.1682,
    location_name: 'Clapham Junction',
    location_description: 'Britain\'s busiest railway station inspired this bittersweet tale of love and loss.',
    upvotes: 2345,
    verified: true,
    tags: ['new wave', '1979', 'storytelling']
  },
  {
    id: 'london-26',
    title: 'South London Forever',
    artist: 'Florence + the Machine',
    album: 'High as Hope',
    spotify_uri: 'spotify:track:6oAFXt9oDhSN5n6zFSJlV3',
    latitude: 51.4740,
    longitude: -0.0660,
    location_name: 'Camberwell',
    location_description: 'Florence Welch\'s ode to growing up in South London, centered on Camberwell.',
    upvotes: 1987,
    verified: true,
    tags: ['indie', '2018', 'south london']
  },
  {
    id: 'london-27',
    title: 'Lambeth Walk',
    artist: 'Original Cast',
    album: 'Me and My Girl',
    spotify_uri: 'spotify:track:2SPq0CJp7PNAB3zrhR4j3a',
    latitude: 51.4942,
    longitude: -0.1172,
    location_name: 'Lambeth Walk',
    location_description: 'The famous cockney song and dance from the 1937 musical, set on this South London street.',
    upvotes: 1234,
    verified: true,
    tags: ['musical', '1937', 'cockney']
  },
  {
    id: 'london-28',
    title: 'Peckham Rye',
    artist: 'Kate Nash',
    album: 'Made of Bricks',
    spotify_uri: 'spotify:track:4O2qjWk0wxyLqNKfqz5J2k',
    latitude: 51.4673,
    longitude: -0.0681,
    location_name: 'Peckham Rye',
    location_description: 'The South London park where William Blake allegedly saw angels in a tree.',
    upvotes: 876,
    verified: true,
    tags: ['indie', '2007', 'south london']
  },
  {
    id: 'london-29',
    title: 'Werewolves of London',
    artist: 'Warren Zevon',
    album: 'Excitable Boy',
    spotify_uri: 'spotify:track:2CWgvyPLuzKGc7PCndKAcf',
    latitude: 51.5081,
    longitude: -0.0759,
    location_name: 'Tower of London',
    location_description: 'This darkly humorous rock classic imagines werewolves roaming London, dining at Lee Ho Fooks.',
    upvotes: 2567,
    verified: true,
    tags: ['rock', '1978', 'humor']
  },
  {
    id: 'london-30',
    title: 'Greenwich Meantime',
    artist: 'Richard Thompson',
    album: 'Mock Tudor',
    spotify_uri: 'spotify:track:3vASvqHrNYcqVtJ6Mjq3TE',
    latitude: 51.4769,
    longitude: -0.0005,
    location_name: 'Royal Observatory Greenwich',
    location_description: 'Home of the Prime Meridian and Greenwich Mean Time.',
    upvotes: 765,
    verified: true,
    tags: ['folk rock', '1999']
  },
  // === EAST LONDON ===
  {
    id: 'london-31',
    title: 'Mile End',
    artist: 'Pulp',
    album: 'Different Class',
    spotify_uri: 'spotify:track:4jujR4f7JB8DrPtP5K6Srm',
    latitude: 51.5252,
    longitude: -0.0343,
    location_name: 'Mile End',
    location_description: 'Jarvis Cocker\'s tale of student life in this East London neighborhood.',
    upvotes: 1876,
    verified: true,
    tags: ['britpop', '1995', 'east london']
  },
  {
    id: 'london-32',
    title: 'Down in the Tube Station at Midnight',
    artist: 'The Jam',
    album: 'All Mod Cons',
    spotify_uri: 'spotify:track:5aETFHDi3sTPFhK9fP4kEU',
    latitude: 51.5145,
    longitude: -0.0717,
    location_name: 'Aldgate East Station',
    location_description: 'Paul Weller\'s harrowing tale of a late-night attack on the Tube.',
    upvotes: 2345,
    verified: true,
    tags: ['punk', '1978', 'tube']
  },
  {
    id: 'london-33',
    title: 'Whitechapel',
    artist: 'Paloma Faith',
    album: 'Do You Want the Truth or Something Beautiful?',
    spotify_uri: 'spotify:track:5W4kiGonQp8SqLBjMZZA3k',
    latitude: 51.5143,
    longitude: -0.0614,
    location_name: 'Whitechapel',
    location_description: 'The historic East End area, once home to Jack the Ripper\'s crimes.',
    upvotes: 654,
    verified: true,
    tags: ['pop', 'east london']
  },
  {
    id: 'london-34',
    title: 'Brick Lane',
    artist: 'Benga',
    album: 'Diary of an Afro Warrior',
    spotify_uri: 'spotify:track:0HfF25jvPxnG1ZPf0nCBRm',
    latitude: 51.5217,
    longitude: -0.0714,
    location_name: 'Brick Lane',
    location_description: 'The famous street known for curry houses, markets, and street art.',
    upvotes: 1123,
    verified: true,
    tags: ['dubstep', 'east london', '2008']
  },
  {
    id: 'london-35',
    title: 'Limehouse Blues',
    artist: 'Django Reinhardt',
    album: 'Djangology',
    spotify_uri: 'spotify:track:1RMmu2GtKynVKyDz6ZfPm5',
    latitude: 51.5120,
    longitude: -0.0394,
    location_name: 'Limehouse Basin',
    location_description: 'The historic docklands area where Limehouse Cut meets the Thames.',
    upvotes: 543,
    verified: true,
    tags: ['jazz', 'east london', '1935']
  },
  {
    id: 'london-36',
    title: 'Itchycoo Park',
    artist: 'Small Faces',
    album: 'Ogdens\' Nut Gone Flake',
    spotify_uri: 'spotify:track:7KSyuJuF5FKYxL9SxAb4be',
    latitude: 51.5562,
    longitude: 0.0373,
    location_name: 'Little Ilford Park',
    location_description: 'The park in Manor Park, East London, where the Small Faces spent time as teenagers.',
    upvotes: 1765,
    verified: true,
    tags: ['psychedelic', '1967', 'mod']
  },
  {
    id: 'london-37',
    title: 'Stepney',
    artist: 'Billy Bragg',
    album: 'Life\'s a Riot with Spy vs Spy',
    spotify_uri: 'spotify:track:3Xt8M1c9zQ7C5qXpMZ6DdV',
    latitude: 51.5180,
    longitude: -0.0470,
    location_name: 'Stepney Green',
    location_description: 'The East End neighborhood that shaped Billy Bragg\'s political consciousness.',
    upvotes: 987,
    verified: true,
    tags: ['folk punk', 'east london', '1983']
  },
  // === WEST LONDON ===
  {
    id: 'london-38',
    title: 'Portobello Road',
    artist: 'Film Soundtrack',
    album: 'Bedknobs and Broomsticks',
    spotify_uri: 'spotify:track:6rUyv1fLnAU0aXBGX9yvkC',
    latitude: 51.5152,
    longitude: -0.2054,
    location_name: 'Portobello Road',
    location_description: 'The famous market street in Notting Hill, celebrated in the Disney musical.',
    upvotes: 2123,
    verified: true,
    tags: ['disney', 'musical', '1971']
  },
  {
    id: 'london-39',
    title: 'Rudie Can\'t Fail',
    artist: 'The Clash',
    album: 'London Calling',
    spotify_uri: 'spotify:track:1bt5UWBwGpMY4ijmhNVb7H',
    latitude: 51.5207,
    longitude: -0.2102,
    location_name: 'Ladbroke Grove',
    location_description: 'The West London neighborhood at the heart of the Notting Hill scene and Caribbean community.',
    upvotes: 1654,
    verified: true,
    tags: ['punk', 'west london', '1979']
  },
  {
    id: 'london-40',
    title: 'White Riot',
    artist: 'The Clash',
    album: 'The Clash',
    spotify_uri: 'spotify:track:0X9xxDvSs9UPrKEJlzYpVn',
    latitude: 51.5143,
    longitude: -0.1987,
    location_name: 'Notting Hill',
    location_description: 'Inspired by the 1976 Notting Hill Carnival riot which Joe Strummer and Paul Simonon witnessed.',
    upvotes: 2345,
    verified: true,
    tags: ['punk', '1977', 'carnival']
  },
  {
    id: 'london-41',
    title: 'Chelsea Hotel',
    artist: 'Leonard Cohen',
    album: 'New Skin for the Old Ceremony',
    spotify_uri: 'spotify:track:3FAQQ0R3FdriVGDmtmVhEn',
    latitude: 51.4878,
    longitude: -0.1681,
    location_name: 'Chelsea',
    location_description: 'While about NYC\'s Chelsea Hotel, this song evokes the bohemian spirit of London\'s Chelsea too.',
    upvotes: 1876,
    verified: true,
    tags: ['folk', 'chelsea', '1974']
  },
  {
    id: 'london-42',
    title: 'Fulham Broadway',
    artist: 'The Bluetones',
    album: 'Expecting to Fly',
    spotify_uri: 'spotify:track:4h2lHLpT8NVqWc2Lw0S7YB',
    latitude: 51.4800,
    longitude: -0.1950,
    location_name: 'Fulham Broadway',
    location_description: 'The tube station and area near Chelsea FC\'s Stamford Bridge.',
    upvotes: 432,
    verified: true,
    tags: ['britpop', 'west london', '1996']
  },
  {
    id: 'london-43',
    title: 'My Generation',
    artist: 'The Who',
    album: 'My Generation',
    spotify_uri: 'spotify:track:4EGkQPCuhWFjLF8VwzyqWi',
    latitude: 51.5045,
    longitude: -0.2215,
    location_name: 'Shepherd\'s Bush',
    location_description: 'The Who formed in Shepherd\'s Bush and this anthem defined mod culture.',
    upvotes: 4567,
    verified: true,
    tags: ['rock', 'mod', '1965']
  },
  {
    id: 'london-44',
    title: 'Hammersmith Palais',
    artist: 'The Clash',
    album: 'The Clash',
    spotify_uri: 'spotify:track:6p0rGx7vXBwBq4pwUknk8H',
    latitude: 51.4927,
    longitude: -0.2228,
    location_name: 'Hammersmith',
    location_description: 'The legendary venue (now demolished) that hosted reggae and punk shows.',
    upvotes: 2134,
    verified: true,
    tags: ['punk', 'reggae', '1978']
  },
  {
    id: 'london-45',
    title: 'Acton Town',
    artist: 'The Members',
    album: 'At the Chelsea Nightclub',
    spotify_uri: 'spotify:track:0Ea3oq8wFQEZz0x1kpQzJd',
    latitude: 51.5028,
    longitude: -0.2803,
    location_name: 'Acton',
    location_description: 'West London suburb with strong punk and rock connections.',
    upvotes: 543,
    verified: true,
    tags: ['punk', 'west london', '1979']
  },
  // === DOCKLANDS & CITY ===
  {
    id: 'london-46',
    title: 'Archangel',
    artist: 'Burial',
    album: 'Untrue',
    spotify_uri: 'spotify:track:6jGMHDVyDpJjJwfjmzEVx4',
    latitude: 51.5054,
    longitude: -0.0235,
    location_name: 'Canary Wharf',
    location_description: 'The gleaming financial district built on the old West India Docks, evoking the ghostly atmosphere of Burial\'s music.',
    upvotes: 1234,
    verified: true,
    tags: ['dubstep', 'docklands', '2007']
  },
  {
    id: 'london-47',
    title: 'The City Never Sleeps',
    artist: 'The Eurythmics',
    album: 'Touch',
    spotify_uri: 'spotify:track:3SQFdhG6Af4x3qPsKHbqMV',
    latitude: 51.5144,
    longitude: -0.0886,
    location_name: 'Bank of England',
    location_description: 'The heart of the City of London, the financial district.',
    upvotes: 654,
    verified: true,
    tags: ['synth-pop', 'city', '1983']
  },
  {
    id: 'london-48',
    title: 'No Distance Left to Run',
    artist: 'Blur',
    album: '13',
    spotify_uri: 'spotify:track:0dA7fmXjfmqlhdvmOzSnea',
    latitude: 51.5030,
    longitude: 0.0032,
    location_name: 'The O2 (Millennium Dome)',
    location_description: 'The dome built for the millennium, now a major entertainment venue on the Greenwich Peninsula.',
    upvotes: 876,
    verified: true,
    tags: ['britpop', 'venue', '1999']
  },
  // === SPECIAL LOCATIONS ===
  {
    id: 'london-49',
    title: 'London Loves',
    artist: 'Blur',
    album: 'Parklife',
    spotify_uri: 'spotify:track:1V1uH0aZcqYGJtjc8D9lx6',
    latitude: 51.5155,
    longitude: -0.1410,
    location_name: 'Oxford Circus',
    location_description: 'The busiest shopping junction in London, where Oxford Street meets Regent Street.',
    upvotes: 1987,
    verified: true,
    tags: ['britpop', '1994', 'london']
  },
  {
    id: 'london-50',
    title: 'Maybe It\'s Because I\'m a Londoner',
    artist: 'Hubert Gregg',
    album: 'Classic',
    spotify_uri: 'spotify:track:5uqzJJmZ2bBmhq9i8Gn4oY',
    latitude: 51.5014,
    longitude: -0.1419,
    location_name: 'Buckingham Palace',
    location_description: 'The ultimate London anthem, celebrating love for the capital city.',
    upvotes: 3456,
    verified: true,
    tags: ['classic', 'anthem', '1947']
  },
  {
    id: 'london-51',
    title: 'LDN',
    artist: 'Lily Allen',
    album: 'Alright, Still',
    spotify_uri: 'spotify:track:5gfVQlsjnlKQiACh3mVokI',
    latitude: 51.5118,
    longitude: -0.1170,
    location_name: 'Covent Garden',
    location_description: 'Lily Allen\'s ironic take on London life, contrasting appearances with reality.',
    upvotes: 2765,
    verified: true,
    tags: ['pop', '2006', 'london']
  },
  {
    id: 'london-52',
    title: 'Parklife',
    artist: 'Blur',
    album: 'Parklife',
    spotify_uri: 'spotify:track:5kf4HxO1GyCE6VCGU7KMM8',
    latitude: 51.5073,
    longitude: -0.1657,
    location_name: 'Hyde Park',
    location_description: 'The ultimate London parks anthem, narrated by Phil Daniels.',
    upvotes: 4321,
    verified: true,
    tags: ['britpop', '1994', 'iconic']
  },
  {
    id: 'london-53',
    title: 'Waterloo',
    artist: 'ABBA',
    album: 'Waterloo',
    spotify_uri: 'spotify:track:1u2H4fH3yWlOHrTBGpMOpS',
    latitude: 51.5031,
    longitude: -0.1132,
    location_name: 'Waterloo Station',
    location_description: 'ABBA\'s Eurovision-winning hit, named after the famous station and battle.',
    upvotes: 3890,
    verified: true,
    tags: ['pop', '1974', 'eurovision']
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...');
  console.log(`📦 Inserting ${londonSongs.length} songs...`);

  // First, clear existing songs (optional)
  const { error: deleteError } = await supabase
    .from('songs')
    .delete()
    .neq('id', 'placeholder'); // Delete all

  if (deleteError) {
    console.log('Note: Could not clear existing songs (table might be empty):', deleteError.message);
  }

  // Insert songs in batches
  const batchSize = 10;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < londonSongs.length; i += batchSize) {
    const batch = londonSongs.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('songs')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(londonSongs.length / batchSize)}`);
    }
  }

  console.log('');
  console.log('🎉 Database seed complete!');
  console.log(`   ✅ ${inserted} songs inserted`);
  if (errors > 0) {
    console.log(`   ❌ ${errors} errors`);
  }
}

// Run the seed
seedDatabase();
