/**
 * Reset Database - Delete all and re-insert
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLACEHOLDER_ART = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';

const londonSongs = [
  {
    id: 'london-1',
    title: 'London Calling',
    artist: 'The Clash',
    album: 'London Calling',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5007,
    longitude: -0.1246,
    location_name: 'Big Ben & Westminster',
    location_description: "The Clash's 1979 punk anthem uses London as a metaphor for societal collapse. Joe Strummer wrote the song after seeing a headline about the Thames flooding. The opening line became one of rock's most iconic moments.",
    upvotes: 4521,
    verified: true,
    tags: ['punk', 'iconic', '1979', 'political']
  },
  {
    id: 'london-2',
    title: 'Waterloo Sunset',
    artist: 'The Kinks',
    album: 'Something Else by The Kinks',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5055,
    longitude: -0.1171,
    location_name: 'Waterloo Bridge',
    location_description: "Ray Davies' 1967 masterpiece captures watching the sunset from Waterloo Bridge. Terry and Julie meet 'every Friday night' to gaze at the Thames. Davies wrote it while recovering from illness, watching from St Thomas' Hospital.",
    upvotes: 3892,
    verified: true,
    tags: ['60s', 'rock', 'romantic', 'iconic', 'kinks']
  },
  {
    id: 'london-3',
    title: 'West End Girls',
    artist: 'Pet Shop Boys',
    album: 'Please',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5117,
    longitude: -0.1280,
    location_name: 'Leicester Square',
    location_description: "Pet Shop Boys' 1985 synth-pop masterpiece captures Thatcher-era London's class divide. The lyrics contrast 'East End boys and West End girls.' Neil Tennant wrote it after observing late-night encounters around Leicester Square.",
    upvotes: 2987,
    verified: true,
    tags: ['80s', 'synth-pop', 'social-commentary', 'iconic']
  },
  {
    id: 'london-4',
    title: 'A Nightingale Sang in Berkeley Square',
    artist: 'Vera Lynn',
    album: "We'll Meet Again",
    album_art: PLACEHOLDER_ART,
    latitude: 51.5097,
    longitude: -0.1450,
    location_name: 'Berkeley Square',
    location_description: "This 1940 song immortalized the upscale Mayfair square. Written during the Blitz, it offered romantic escapism during wartime. While nightingales don't actually sing in central London, the song created a lasting myth.",
    upvotes: 1876,
    verified: true,
    tags: ['40s', 'jazz', 'wartime', 'romantic', 'classic']
  },
  {
    id: 'london-5',
    title: 'Baker Street',
    artist: 'Gerry Rafferty',
    album: 'City to City',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5226,
    longitude: -0.1571,
    location_name: 'Baker Street',
    location_description: "Gerry Rafferty's 1978 masterpiece with its iconic saxophone riff by Raphael Ravenscroft. Rafferty wrote about the music industry's dark side while living near Baker Street - the street synonymous with Sherlock Holmes.",
    upvotes: 4123,
    verified: true,
    tags: ['70s', 'rock', 'saxophone', 'iconic']
  },
  {
    id: 'london-6',
    title: 'Piccadilly Palare',
    artist: 'Morrissey',
    album: 'Bona Drag',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5100,
    longitude: -0.1347,
    location_name: 'Piccadilly Circus',
    location_description: "Morrissey's 1990 track uses Polari - the secret slang of London's gay subculture - to describe Piccadilly Circus. In the 1950s-70s, this neon-lit junction was a known cruising area. The song preserves queer London history.",
    upvotes: 1234,
    verified: true,
    tags: ['90s', 'alternative', 'lgbtq-history', 'cultural']
  },
  {
    id: 'london-7',
    title: 'Warwick Avenue',
    artist: 'Duffy',
    album: 'Rockferry',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5233,
    longitude: -0.1839,
    location_name: 'Warwick Avenue Tube Station',
    location_description: "Duffy's 2008 hit is set at this Bakerloo line station in Little Venice. The song describes meeting an ex-lover: 'When I get to Warwick Avenue, meet me by the entrance of the tube.' Heartbreak at a tube station.",
    upvotes: 2341,
    verified: true,
    tags: ['2000s', 'soul', 'heartbreak', 'tube-station']
  },
  {
    id: 'london-8',
    title: 'London Bridge',
    artist: 'Fergie',
    album: 'The Dutchess',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5079,
    longitude: -0.0877,
    location_name: 'London Bridge',
    location_description: "Fergie's 2006 hit uses London Bridge as a metaphor, though the video was filmed at Tower Bridge - a common American confusion. The hook references the nursery rhyme 'London Bridge is Falling Down.'",
    upvotes: 1567,
    verified: true,
    tags: ['2000s', 'pop', 'american', 'hip-hop']
  },
  {
    id: 'london-9',
    title: 'Trafalgar Square',
    artist: 'Ronan Keating',
    album: 'Destination',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5081,
    longitude: -0.1281,
    location_name: 'Trafalgar Square',
    location_description: "Ronan Keating's 2000 hit filmed in Trafalgar Square with Nelson's Column and National Gallery as backdrop. The square, commemorating the Battle of Trafalgar, is London's most famous gathering place.",
    upvotes: 987,
    verified: true,
    tags: ['2000s', 'pop', 'irish']
  },
  {
    id: 'london-10',
    title: 'Victoria',
    artist: 'The Kinks',
    album: 'Arthur',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4952,
    longitude: -0.1439,
    location_name: 'Victoria Station',
    location_description: "The Kinks' 1969 track celebrates Queen Victoria with heavy irony. Ray Davies wrote it as satirical look at British imperialism. Victoria Station, named after the same queen, connects the song to London's transport history.",
    upvotes: 1654,
    verified: true,
    tags: ['60s', 'rock', 'kinks', 'satirical', 'historical']
  },
  {
    id: 'london-11',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    album_art: PLACEHOLDER_ART,
    latitude: 51.5133,
    longitude: -0.1350,
    location_name: 'Berwick Street, Soho',
    location_description: "Oasis chose this Soho location for the iconic album cover of '(What's the Story) Morning Glory?' The photograph by Michael Spencer Jones shows two men passing on the narrow market street, making it a Britpop pilgrimage site.",
    upvotes: 5234,
    verified: true,
    tags: ['90s', 'britpop', 'album-cover', 'iconic']
  },
  {
    id: 'london-12',
    title: 'Soho Square',
    artist: 'Kirsty MacColl',
    album: 'Electric Landlady',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5152,
    longitude: -0.1320,
    location_name: 'Soho Square',
    location_description: "Kirsty MacColl's tender ballad directly references this small garden square: 'One day we'll walk in Soho Square.' The square's Tudor-style gardener's hut provides an intimate escape from Soho's bustling streets.",
    upvotes: 1432,
    verified: true,
    tags: ['80s', 'folk', 'romantic', 'direct-reference']
  },
  {
    id: 'london-13',
    title: 'Carnaby Street',
    artist: 'The Jam',
    album: 'This Is the Modern World',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5130,
    longitude: -0.1390,
    location_name: 'Carnaby Street',
    location_description: "The Jam's 1977 track captures the spirit of this iconic fashion street that defined 1960s Swinging London. Carnaby Street was ground zero for mod culture - the movement that influenced Paul Weller and The Jam.",
    upvotes: 1876,
    verified: true,
    tags: ['70s', 'punk', 'mod', 'cultural']
  },
  {
    id: 'london-14',
    title: 'A Foggy Day (In London Town)',
    artist: 'Ella Fitzgerald',
    album: 'Ella Fitzgerald Sings the George and Ira Gershwin Songbook',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5138,
    longitude: -0.1331,
    location_name: 'Shaftesbury Avenue',
    location_description: "This 1937 Gershwin standard paints a romantic picture of London's West End. 'The British Museum had lost its charm' because of love, and 'a foggy day in London town had me low.' Ella's definitive version captures pre-war glamour.",
    upvotes: 2134,
    verified: true,
    tags: ['30s', 'jazz', 'classic', 'romantic']
  },
  {
    id: 'london-15',
    title: 'Come Together',
    artist: 'The Beatles',
    album: 'Abbey Road',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5320,
    longitude: -0.1780,
    location_name: 'Abbey Road Studios',
    location_description: "The Beatles recorded their masterpieces at Abbey Road Studios in St John's Wood. 'Come Together' opens their final recorded album, named after the studio and its famous zebra crossing. Lennon wrote the surreal lyrics here.",
    upvotes: 6789,
    verified: true,
    tags: ['60s', 'rock', 'beatles', 'studio-location', 'iconic']
  },
  {
    id: 'london-16',
    title: 'Our House',
    artist: 'Madness',
    album: 'The Rise & Fall',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5392,
    longitude: -0.1426,
    location_name: 'Camden Town',
    location_description: "Madness's 1982 anthem became the unofficial anthem for suburban London life. Camden, where Madness formed, embodies the song's celebration of working-class home life. 'Our house, in the middle of our street.'",
    upvotes: 3456,
    verified: true,
    tags: ['80s', 'ska', 'madness', 'nostalgic']
  },
  {
    id: 'london-17',
    title: 'Primrose Hill',
    artist: 'Madness',
    album: 'The Liberty of Norton Folgate',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5393,
    longitude: -0.1605,
    location_name: 'Primrose Hill',
    location_description: "Madness's 2009 track pays tribute to this North London hill with panoramic city views. The 'London skyline' visible from the summit has attracted artistic figures for centuries, making it perfect for Madness's nostalgic celebration.",
    upvotes: 1234,
    verified: true,
    tags: ['2000s', 'ska', 'madness', 'scenic']
  },
  {
    id: 'london-18',
    title: 'Sunny Afternoon',
    artist: 'The Kinks',
    album: 'Face to Face',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5890,
    longitude: -0.1440,
    location_name: 'Muswell Hill',
    location_description: "The Kinks wrote this 1966 track from their North London home territory. Ray Davies captures a lazy summer afternoon: 'the tax man's taken all my dough.' Muswell Hill's leafy Victorian streets embody the middle-class comfort.",
    upvotes: 2876,
    verified: true,
    tags: ['60s', 'rock', 'kinks', 'nostalgic']
  },
  {
    id: 'london-19',
    title: 'The Streets of London',
    artist: 'Ralph McTell',
    album: 'Streets...',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5505,
    longitude: -0.1081,
    location_name: "King's Cross",
    location_description: "Ralph McTell's 1969 folk classic describes homeless people around central London. The song raised awareness of homelessness, capturing the contrast between London's glittering entertainment and the forgotten people on its streets.",
    upvotes: 2345,
    verified: true,
    tags: ['60s', 'folk', 'social-commentary', 'iconic']
  },
  {
    id: 'london-20',
    title: 'Finsbury Park',
    artist: 'The Libertines',
    album: 'Anthems for Doomed Youth',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5642,
    longitude: -0.1063,
    location_name: 'Finsbury Park',
    location_description: "The Libertines' track references this North London park, once home to the Rainbow Theatre where legendary shows took place. Pete Doherty grew up nearby, and the band's raw sound captures the area's Victorian grandeur and urban grit.",
    upvotes: 987,
    verified: true,
    tags: ['2000s', 'indie', 'libertines', 'north-london']
  },
  {
    id: 'london-21',
    title: 'Highgate',
    artist: 'The Pogues',
    album: 'Peace and Love',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5714,
    longitude: -0.1465,
    location_name: 'Highgate Cemetery',
    location_description: "The Pogues reference this famous Victorian cemetery where Karl Marx is buried. Highgate Cemetery's overgrown Gothic atmosphere - Egyptian catacombs, ivy-covered angels - makes it one of London's most atmospheric locations.",
    upvotes: 876,
    verified: true,
    tags: ['80s', 'celtic-punk', 'pogues', 'gothic']
  },
  {
    id: 'london-22',
    title: 'Hampstead Incident',
    artist: 'Donovan',
    album: 'Mellow Yellow',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5569,
    longitude: -0.1781,
    location_name: 'Hampstead Heath',
    location_description: "Donovan's 1966 folk track references the wild parkland of Hampstead Heath. Its ancient woodland, swimming ponds, and hilltop views have inspired artists from Keats to Constable. The song captures its bohemian associations.",
    upvotes: 765,
    verified: true,
    tags: ['60s', 'folk', 'psychedelic', 'scenic']
  },
  {
    id: 'london-23',
    title: 'Electric Avenue',
    artist: 'Eddy Grant',
    album: 'Killer on the Rampage',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4613,
    longitude: -0.1147,
    location_name: 'Electric Avenue, Brixton',
    location_description: "Eddy Grant's 1982 hit was inspired by the 1981 Brixton riots. Electric Avenue was the first market street in London lit by electricity. Grant witnessed the social tensions that exploded into violence. A powerful commentary on racial inequality.",
    upvotes: 3234,
    verified: true,
    tags: ['80s', 'reggae', 'political', 'historic-event']
  },
  {
    id: 'london-24',
    title: 'The Guns of Brixton',
    artist: 'The Clash',
    album: 'London Calling',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4620,
    longitude: -0.1160,
    location_name: 'Brixton',
    location_description: "Paul Simonon's reggae-influenced song about police tension in his home neighborhood of Brixton. The Clash captured the simmering conflict that would erupt in the 1981 riots. The defiant lyrics remain relevant to discussions of policing.",
    upvotes: 2876,
    verified: true,
    tags: ['70s', 'punk', 'reggae', 'political', 'clash']
  },
  {
    id: 'london-25',
    title: 'Up the Junction',
    artist: 'Squeeze',
    album: 'Cool for Cats',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4651,
    longitude: -0.1682,
    location_name: 'Clapham Junction',
    location_description: "Squeeze's 1979 hit tells the story of young love and unplanned pregnancy in South London. Clapham Junction, 'Britain's busiest railway station,' represents the crossroads where lives intersect and separate.",
    upvotes: 2345,
    verified: true,
    tags: ['70s', 'new-wave', 'squeeze', 'storytelling']
  },
  {
    id: 'london-26',
    title: 'South London Forever',
    artist: 'Florence + the Machine',
    album: 'High as Hope',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4740,
    longitude: -0.0660,
    location_name: 'Camberwell',
    location_description: "Florence Welch's 2018 track is a love letter to her South London home. She sings about 'running down to Brixton' and the River Effra that flows underground beneath the neighborhood. Deep attachment to South London identity.",
    upvotes: 1987,
    verified: true,
    tags: ['2010s', 'indie', 'florence', 'south-london']
  },
  {
    id: 'london-27',
    title: 'Lambeth Walk',
    artist: 'Original Cast',
    album: 'Me and My Girl',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4942,
    longitude: -0.1172,
    location_name: 'Lambeth Walk',
    location_description: "This 1937 song from 'Me and My Girl' became a Cockney anthem. The Lambeth Walk is a real street in South London, and the song spawned a dance craze. WWII propaganda edited Nazi footage to make soldiers appear to do the dance!",
    upvotes: 1234,
    verified: true,
    tags: ['30s', 'musical-theatre', 'cockney', 'historical']
  },
  {
    id: 'london-28',
    title: 'Peckham Rye',
    artist: 'Kate Nash',
    album: 'Made of Bricks',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4673,
    longitude: -0.0681,
    location_name: 'Peckham Rye',
    location_description: "Kate Nash's track references this South London neighborhood transformed from working-class to trendy. Peckham Rye park is where William Blake allegedly saw angels in a tree. Caribbean community and art galleries meet pie-and-mash shops.",
    upvotes: 876,
    verified: true,
    tags: ['2000s', 'indie', 'south-london']
  },
  {
    id: 'london-29',
    title: 'Werewolves of London',
    artist: 'Warren Zevon',
    album: 'Excitable Boy',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5081,
    longitude: -0.0759,
    location_name: 'Tower of London',
    location_description: "Warren Zevon's 1978 rock classic imagines werewolves roaming London. The lyrics mention Soho and dining at Lee Ho Fooks (a real Chinatown restaurant). Horror-movie imagery meets London's foggy, gothic atmosphere.",
    upvotes: 2567,
    verified: true,
    tags: ['70s', 'rock', 'american', 'horror', 'humorous']
  },
  {
    id: 'london-30',
    title: 'Greenwich Meantime',
    artist: 'Richard Thompson',
    album: 'Mock Tudor',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4769,
    longitude: -0.0005,
    location_name: 'Royal Observatory Greenwich',
    location_description: "Richard Thompson's track takes its name from Greenwich Mean Time, set at the Royal Observatory on the Prime Meridian. Greenwich has defined global timekeeping since 1884. Views across to Canary Wharf - old London meeting new.",
    upvotes: 765,
    verified: true,
    tags: ['90s', 'folk-rock', 'scientific']
  },
  {
    id: 'london-31',
    title: 'Mile End',
    artist: 'Pulp',
    album: 'Different Class',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5252,
    longitude: -0.0343,
    location_name: 'Mile End',
    location_description: "Pulp's 1995 track from 'Trainspotting' describes failed romance in a grim East London flat. Jarvis Cocker sings about a relationship where 'the living room was soaking' from a leak. Brutally honest portrait of love and poverty.",
    upvotes: 1876,
    verified: true,
    tags: ['90s', 'britpop', 'pulp', 'dark']
  },
  {
    id: 'london-32',
    title: 'Down in the Tube Station at Midnight',
    artist: 'The Jam',
    album: 'All Mod Cons',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5145,
    longitude: -0.0717,
    location_name: 'Aldgate East Station',
    location_description: "The Jam's 1978 track is a first-person account of a violent mugging on the Tube. Paul Weller wrote it after witnessing actual violence on London Underground. Claustrophobic terror of being trapped underground remains viscerally relevant.",
    upvotes: 2345,
    verified: true,
    tags: ['70s', 'punk', 'jam', 'tube', 'dark']
  },
  {
    id: 'london-33',
    title: 'Whitechapel',
    artist: 'Paloma Faith',
    album: 'Do You Want the Truth or Something Beautiful?',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5143,
    longitude: -0.0614,
    location_name: 'Whitechapel',
    location_description: "Paloma Faith's track evokes the East End neighborhood famous for its market and Jack the Ripper history. Whitechapel has been a gateway for immigrants for centuries - Huguenots, Jews, Bangladeshis - giving it unique layered character.",
    upvotes: 654,
    verified: true,
    tags: ['2010s', 'soul', 'east-end']
  },
  {
    id: 'london-34',
    title: 'Brick Lane',
    artist: 'Benga',
    album: 'Diary of an Afro Warrior',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5217,
    longitude: -0.0714,
    location_name: 'Brick Lane',
    location_description: "Benga's dubstep track takes its name from London's famous curry mile. Brick Lane runs through the Bangladeshi community in Tower Hamlets, lined with curry houses, vintage shops, and street art. Central to London's underground music scene.",
    upvotes: 1123,
    verified: true,
    tags: ['2000s', 'dubstep', 'east-end']
  },
  {
    id: 'london-35',
    title: 'Limehouse Blues',
    artist: 'Django Reinhardt',
    album: 'Djangology',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5120,
    longitude: -0.0394,
    location_name: 'Limehouse Basin',
    location_description: "Django Reinhardt's jazz standard references this Docklands neighborhood that was once London's original Chinatown. In the early 20th century, Limehouse had a reputation for opium dens. Today it's a peaceful marina.",
    upvotes: 543,
    verified: true,
    tags: ['30s', 'jazz', 'historical']
  },
  {
    id: 'london-36',
    title: 'Itchycoo Park',
    artist: 'Small Faces',
    album: "Ogdens' Nut Gone Flake",
    album_art: PLACEHOLDER_ART,
    latitude: 51.5562,
    longitude: 0.0373,
    location_name: 'Little Ilford Park',
    location_description: "Small Faces' 1967 psychedelic hit describes a dreamy escape to 'Itchycoo Park.' The band grew up in Manor Park, East London, and the 'itchy' likely refers to stinging nettles common in parks. Captures innocent 60s optimism.",
    upvotes: 1765,
    verified: true,
    tags: ['60s', 'psychedelic', 'small-faces', 'nostalgic']
  },
  {
    id: 'london-37',
    title: 'Stepney',
    artist: 'Billy Bragg',
    album: "Life's a Riot with Spy vs Spy",
    album_art: PLACEHOLDER_ART,
    latitude: 51.5180,
    longitude: -0.0470,
    location_name: 'Stepney Green',
    location_description: "Billy Bragg's track references this East End neighborhood that epitomizes working-class London. Stepney was heavily bombed in the Blitz. Bragg uses Stepney to represent authentic East End identity against gentrification.",
    upvotes: 987,
    verified: true,
    tags: ['80s', 'folk-punk', 'political', 'east-end']
  },
  {
    id: 'london-38',
    title: 'Portobello Road',
    artist: 'Film Soundtrack',
    album: 'Bedknobs and Broomsticks',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5152,
    longitude: -0.2054,
    location_name: 'Portobello Road',
    location_description: "This song from Disney's 'Bedknobs and Broomsticks' (1971) celebrates Notting Hill's famous market street. Every Saturday, the road transforms into one of the world's largest antiques markets. The film captures its eclectic spirit.",
    upvotes: 2123,
    verified: true,
    tags: ['70s', 'disney', 'musical', 'market']
  },
  {
    id: 'london-39',
    title: "Rudie Can't Fail",
    artist: 'The Clash',
    album: 'London Calling',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5207,
    longitude: -0.2102,
    location_name: 'Ladbroke Grove',
    location_description: "The Clash's 1979 track captures Notting Hill Carnival spirit. Ladbroke Grove was the heart of London's West Indian community. Joe Strummer lived nearby and witnessed the cultural vibrancy and police tensions that defined the area.",
    upvotes: 1654,
    verified: true,
    tags: ['70s', 'punk', 'clash', 'carnival', 'cultural']
  },
  {
    id: 'london-40',
    title: 'White Riot',
    artist: 'The Clash',
    album: 'The Clash',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5143,
    longitude: -0.1987,
    location_name: 'Notting Hill',
    location_description: "The Clash's 1977 debut single captured Notting Hill Carnival tension. Written after the 1976 riots between police and Black youth, the song channels the anger of unemployment and racism into punk's raw energy.",
    upvotes: 2345,
    verified: true,
    tags: ['70s', 'punk', 'clash', 'political', 'iconic']
  },
  {
    id: 'london-41',
    title: 'Chelsea Hotel',
    artist: 'Leonard Cohen',
    album: 'New Skin for the Old Ceremony',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4878,
    longitude: -0.1681,
    location_name: 'Chelsea',
    location_description: "While about NYC's Chelsea Hotel, the song resonates with London's Chelsea - both neighborhoods famous for bohemian artistic heritage. King's Road was the epicenter of 1960s fashion and punk in the 1970s.",
    upvotes: 1876,
    verified: true,
    tags: ['70s', 'folk', 'artistic', 'bohemian']
  },
  {
    id: 'london-42',
    title: 'Fulham Broadway',
    artist: 'The Bluetones',
    album: 'Expecting to Fly',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4800,
    longitude: -0.1950,
    location_name: 'Fulham Broadway',
    location_description: "The Bluetones' track references this West London tube station near Chelsea FC's Stamford Bridge stadium. Fulham Broadway represents the intersection of football culture and London's transport network.",
    upvotes: 432,
    verified: true,
    tags: ['90s', 'britpop', 'football']
  },
  {
    id: 'london-43',
    title: 'My Generation',
    artist: 'The Who',
    album: 'My Generation',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5045,
    longitude: -0.2215,
    location_name: "Shepherd's Bush",
    location_description: "Pete Townshend wrote this 1965 anthem in his Shepherd's Bush flat. 'Talking about my generation' defined youth rebellion. Shepherd's Bush was The Who's home turf - Roger Daltrey grew up nearby. The song shaped mod culture.",
    upvotes: 4567,
    verified: true,
    tags: ['60s', 'rock', 'who', 'iconic', 'mod']
  },
  {
    id: 'london-44',
    title: '(White Man) In Hammersmith Palais',
    artist: 'The Clash',
    album: 'The Clash',
    album_art: PLACEHOLDER_ART,
    latitude: 51.4927,
    longitude: -0.2228,
    location_name: 'Hammersmith',
    location_description: "The Clash's 1978 track describes Joe Strummer's night at this legendary venue watching reggae acts. The Palais, demolished in 2012, hosted The Beatles to the Sex Pistols. The song critiques punk's commercialization.",
    upvotes: 2134,
    verified: true,
    tags: ['70s', 'punk', 'clash', 'venue', 'cultural']
  },
  {
    id: 'london-45',
    title: 'Acton Town',
    artist: 'The Members',
    album: 'At the Chelsea Nightclub',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5028,
    longitude: -0.2803,
    location_name: 'Acton',
    location_description: "The Members' late-70s track references this West London tube station on the Piccadilly and District lines. Acton Town's distinctive 1930s Charles Holden architecture represents where suburban London begins.",
    upvotes: 543,
    verified: true,
    tags: ['70s', 'punk', 'tube']
  },
  {
    id: 'london-46',
    title: 'Archangel',
    artist: 'Burial',
    album: 'Untrue',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5054,
    longitude: -0.0235,
    location_name: 'Canary Wharf',
    location_description: "Burial's atmospheric dubstep evokes night-time South London - 'night buses, taillights, petrol stations, pirate radio.' Canary Wharf's gleaming towers built on old docks capture the ghostly, nocturnal atmosphere of his music.",
    upvotes: 1234,
    verified: true,
    tags: ['2000s', 'dubstep', 'atmospheric', 'nocturnal']
  },
  {
    id: 'london-47',
    title: 'The City Never Sleeps',
    artist: 'Eurythmics',
    album: 'Touch',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5144,
    longitude: -0.0886,
    location_name: 'Bank of England',
    location_description: "Eurythmics' track captures the relentless energy of London's financial district. The City of London, centered on the Bank of England, symbolizes 24-hour capitalism. Annie Lennox's lyrics about the city that 'never sleeps.'",
    upvotes: 654,
    verified: true,
    tags: ['80s', 'synth-pop', 'financial-district']
  },
  {
    id: 'london-48',
    title: 'No Distance Left to Run',
    artist: 'Blur',
    album: '13',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5030,
    longitude: 0.0032,
    location_name: 'The O2 (Millennium Dome)',
    location_description: "Blur's melancholic 1999 track reflects on a relationship ending as the band itself was falling apart. The O2, built for the millennium on the Greenwich Peninsula, represents an era of change and endings.",
    upvotes: 876,
    verified: true,
    tags: ['90s', 'britpop', 'blur', 'melancholic']
  },
  {
    id: 'london-49',
    title: 'London Loves',
    artist: 'Blur',
    album: 'Parklife',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5155,
    longitude: -0.1410,
    location_name: 'Oxford Circus',
    location_description: "Blur's 1994 track captures aimless wandering through central London. Oxford Circus, the busiest shopping junction where Oxford Street meets Regent Street, represents the consumer culture Damon Albarn observes with detached irony.",
    upvotes: 1987,
    verified: true,
    tags: ['90s', 'britpop', 'blur', 'urban']
  },
  {
    id: 'london-50',
    title: "Maybe It's Because I'm a Londoner",
    artist: 'Hubert Gregg',
    album: 'Classic',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5014,
    longitude: -0.1419,
    location_name: 'Buckingham Palace',
    location_description: "The ultimate London anthem, written in 1947. The song celebrates love for the capital city with simple, heartfelt lyrics. Buckingham Palace represents London at its most iconic and ceremonial.",
    upvotes: 3456,
    verified: true,
    tags: ['40s', 'music-hall', 'anthem', 'patriotic']
  },
  {
    id: 'london-51',
    title: 'LDN',
    artist: 'Lily Allen',
    album: 'Alright, Still',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5118,
    longitude: -0.1170,
    location_name: 'Covent Garden',
    location_description: "Lily Allen's 2006 debut offers a sunny yet ironic view of London. The song contrasts cheerful appearances with darker reality. Covent Garden's street performers and tourist crowds embody this duality.",
    upvotes: 2765,
    verified: true,
    tags: ['2000s', 'pop', 'ironic', 'modern-london']
  },
  {
    id: 'london-52',
    title: 'Parklife',
    artist: 'Blur',
    album: 'Parklife',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5073,
    longitude: -0.1657,
    location_name: 'Hyde Park',
    location_description: "Blur's 1994 Britpop anthem became the soundtrack of Cool Britannia. Phil Daniels's Cockney spoken-word parodies lad culture - feeding pigeons, going to the pub. Hyde Park represents where ordinary people live their 'parklife.'",
    upvotes: 4321,
    verified: true,
    tags: ['90s', 'britpop', 'blur', 'iconic', 'cultural']
  },
  {
    id: 'london-53',
    title: 'Waterloo',
    artist: 'ABBA',
    album: 'Waterloo',
    album_art: PLACEHOLDER_ART,
    latitude: 51.5031,
    longitude: -0.1132,
    location_name: 'Waterloo Station',
    location_description: "ABBA's 1974 Eurovision winner references Napoleon's final defeat. Waterloo Station, built to commemorate Wellington's victory, keeps the historical connection. 'My my, at Waterloo Napoleon did surrender.'",
    upvotes: 3890,
    verified: true,
    tags: ['70s', 'pop', 'eurovision', 'swedish', 'iconic']
  }
];

async function resetDatabase() {
  console.log('🗑️  Deleting all existing songs...');
  
  // Delete all
  const { error: deleteError } = await supabase
    .from('songs')
    .delete()
    .neq('id', 'never-match');
  
  if (deleteError) {
    console.error('Delete error:', deleteError);
  } else {
    console.log('✅ All songs deleted');
  }
  
  console.log('');
  console.log('📦 Inserting fresh data...');
  
  // Insert in batches
  const batchSize = 10;
  let inserted = 0;
  
  for (let i = 0; i < londonSongs.length; i += batchSize) {
    const batch = londonSongs.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('songs')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Batch ${Math.floor(i/batchSize)+1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${Math.floor(i/batchSize)+1} inserted`);
    }
  }
  
  console.log('');
  console.log(`🎉 Done! Inserted ${inserted} songs.`);
}

resetDatabase();
