/**
 * Fix Enrichment Data - Match by song title/artist instead of ID
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Enrichment {
  title: string;
  artist: string;
  locationName: string;
  description: string;
  tags: string[];
}

// Match by title + artist, not ID
const enrichedData: Enrichment[] = [
  {
    title: 'London Calling',
    artist: 'The Clash',
    locationName: 'Big Ben & Westminster',
    description: "The Clash's 1979 punk anthem uses London as a metaphor for societal collapse. Joe Strummer wrote the song after seeing a headline about the Thames flooding. The opening line 'London calling to the faraway towns' became one of rock's most iconic moments, capturing late-70s Britain's sense of crisis.",
    tags: ['punk', 'iconic', '1979', 'political']
  },
  {
    title: 'Waterloo Sunset',
    artist: 'The Kinks',
    locationName: 'Waterloo Bridge',
    description: "Ray Davies' 1967 masterpiece captures a perfect London moment: watching the sunset from Waterloo Bridge. The song describes Terry and Julie meeting 'every Friday night' and gazing at the Thames. Davies wrote it while recovering from illness, watching the view from St Thomas' Hospital. It remains the definitive London love song.",
    tags: ['60s', 'rock', 'romantic', 'iconic', 'kinks']
  },
  {
    title: 'West End Girls',
    artist: 'Pet Shop Boys',
    locationName: 'Leicester Square',
    description: "Pet Shop Boys' 1985 synth-pop masterpiece captures Thatcher-era London's class divide. The lyrics contrast 'East End boys and West End girls' - working-class East London versus fashionable West London. Neil Tennant wrote it after observing late-night encounters around Leicester Square.",
    tags: ['80s', 'synth-pop', 'social-commentary', 'iconic']
  },
  {
    title: 'A Nightingale Sang in Berkeley Square',
    artist: 'Vera Lynn',
    locationName: 'Berkeley Square',
    description: "This 1940 song immortalized the upscale Mayfair square, claiming 'A nightingale sang in Berkeley Square.' Written during the Blitz, the song offered romantic escapism during wartime. While nightingales don't actually sing in central London, the song created a lasting myth.",
    tags: ['40s', 'jazz', 'wartime', 'romantic', 'classic']
  },
  {
    title: 'Baker Street',
    artist: 'Gerry Rafferty',
    locationName: 'Baker Street',
    description: "Gerry Rafferty's 1978 masterpiece, famous for its iconic saxophone riff played by Raphael Ravenscroft. Rafferty wrote the song about the music industry's dark side while living near Baker Street. The street is synonymous with Sherlock Holmes, adding to the song's mysterious atmosphere.",
    tags: ['70s', 'rock', 'saxophone', 'iconic']
  },
  {
    title: 'Piccadilly Palare',
    artist: 'Morrissey',
    locationName: 'Piccadilly Circus',
    description: "Morrissey's 1990 track uses Polari - the secret slang of London's gay subculture - to describe the scene around Piccadilly Circus. In the 1950s-70s, this neon-lit junction was a known cruising area. The song preserves a slice of queer London history.",
    tags: ['90s', 'alternative', 'lgbtq-history', 'cultural']
  },
  {
    title: 'Warwick Avenue',
    artist: 'Duffy',
    locationName: 'Warwick Avenue Tube Station',
    description: "Duffy's 2008 hit is set at this Bakerloo line station in Little Venice. The song describes meeting an ex-lover at the station to end a relationship: 'When I get to Warwick Avenue, meet me by the entrance of the tube.' The area's quiet, canal-side charm contrasts with the emotional turmoil.",
    tags: ['2000s', 'soul', 'heartbreak', 'tube-station']
  },
  {
    title: 'London Bridge',
    artist: 'Fergie',
    locationName: 'Tower Bridge',
    description: "Fergie's 2006 hit uses London Bridge as a metaphor, though the video was filmed at Tower Bridge - a common American confusion. The song's playground-rhyme hook references the nursery rhyme 'London Bridge is Falling Down,' which dates back centuries.",
    tags: ['2000s', 'pop', 'american', 'hip-hop']
  },
  {
    title: 'Trafalgar Square',
    artist: 'Ronan Keating',
    locationName: 'Trafalgar Square',
    description: "Ronan Keating's 2000 hit was filmed in and around Trafalgar Square, with Nelson's Column and the National Gallery providing the backdrop. The square, built to commemorate the Battle of Trafalgar, remains London's most famous public gathering place.",
    tags: ['2000s', 'pop', 'irish']
  },
  {
    title: 'Victoria',
    artist: 'The Kinks',
    locationName: 'Victoria Station',
    description: "The Kinks' 1969 track celebrates Queen Victoria with heavy irony. Ray Davies wrote it as a satirical look at British imperialism and nationalism. Victoria Station, the major railway terminus named after the same queen, connects the song to London's transport history.",
    tags: ['60s', 'rock', 'kinks', 'satirical', 'historical']
  },
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    locationName: 'Berwick Street, Soho',
    description: "While not directly about Berwick Street, Oasis chose this Soho location for the iconic album cover of '(What's the Story) Morning Glory?' The photograph by Michael Spencer Jones shows two men passing on the narrow market street, making it a pilgrimage site for Britpop fans.",
    tags: ['90s', 'britpop', 'album-cover', 'iconic']
  },
  {
    title: 'Soho Square',
    artist: 'Kirsty MacColl',
    locationName: 'Soho Square',
    description: "Kirsty MacColl's tender ballad directly references this small garden square in Soho. The lyrics describe meeting a lover: 'One day we'll walk in Soho Square.' The square's Tudor-style gardener's hut provides an intimate escape from Soho's bustling streets.",
    tags: ['80s', 'folk', 'romantic', 'direct-reference']
  },
  {
    title: 'Carnaby Street',
    artist: 'The Jam',
    locationName: 'Carnaby Street',
    description: "The Jam's 1977 track captures the spirit of this iconic fashion street that defined 1960s Swinging London. Carnaby Street was ground zero for mod culture - the very movement that influenced Paul Weller and The Jam's style and sound.",
    tags: ['70s', 'punk', 'mod', 'cultural']
  },
  {
    title: 'A Foggy Day (In London Town)',
    artist: 'Ella Fitzgerald',
    locationName: 'Shaftesbury Avenue',
    description: "This 1937 Gershwin standard paints a romantic picture of London's West End. The lyrics describe how 'the British Museum had lost its charm' because of love, and how 'a foggy day in London town had me low.' Ella Fitzgerald's definitive version captures pre-war London glamour.",
    tags: ['30s', 'jazz', 'classic', 'romantic']
  },
  {
    title: 'Come Together',
    artist: 'The Beatles',
    locationName: 'Abbey Road Studios',
    description: "The Beatles recorded much of their groundbreaking work at Abbey Road Studios in St John's Wood. 'Come Together' opens their final recorded album, named after the studio and its famous zebra crossing. John Lennon wrote the distinctive bassline and surreal lyrics here.",
    tags: ['60s', 'rock', 'beatles', 'studio-location', 'iconic']
  },
  {
    title: 'Our House',
    artist: 'Madness',
    locationName: 'Camden Town',
    description: "Madness's 1982 anthem became an unofficial anthem for suburban London life. Camden, where Madness formed, embodies the song's celebration of working-class home life. The line 'Our house, in the middle of our street' captures the terraced housing typical of North London.",
    tags: ['80s', 'ska', 'madness', 'nostalgic']
  },
  {
    title: 'Primrose Hill',
    artist: 'Madness',
    locationName: 'Primrose Hill',
    description: "Madness's 2009 track pays tribute to this North London hill with panoramic city views. The lyrics reference the 'London skyline' visible from the summit. Primrose Hill has long been associated with artistic figures, making it fitting for Madness's nostalgic celebration.",
    tags: ['2000s', 'ska', 'madness', 'scenic']
  },
  {
    title: 'Sunny Afternoon',
    artist: 'The Kinks',
    locationName: 'Muswell Hill',
    description: "The Kinks wrote this 1966 track from their home territory in North London. Ray Davies captures a lazy summer afternoon: 'the tax man's taken all my dough.' Muswell Hill's leafy Victorian streets embody the middle-class comfort the song celebrates with gentle irony.",
    tags: ['60s', 'rock', 'kinks', 'nostalgic']
  },
  {
    title: 'The Streets of London',
    artist: 'Ralph McTell',
    locationName: "King's Cross",
    description: "Ralph McTell's 1969 folk classic describes homeless people around central London. The song raised awareness of homelessness, capturing the contrast between London's glittering entertainment and the forgotten people on its streets.",
    tags: ['60s', 'folk', 'social-commentary', 'iconic']
  },
  {
    title: 'Finsbury Park',
    artist: 'The Libertines',
    locationName: 'Finsbury Park',
    description: "The Libertines' track references this North London park, once home to the Rainbow Theatre where legendary shows took place. Pete Doherty grew up nearby, and the band's raw sound captures the area's mix of Victorian grandeur and urban grit.",
    tags: ['2000s', 'indie', 'libertines', 'north-london']
  },
  {
    title: 'Highgate',
    artist: 'The Pogues',
    locationName: 'Highgate Cemetery',
    description: "The Pogues reference this famous Victorian cemetery where Karl Marx is buried. Highgate Cemetery's overgrown Gothic atmosphere - Egyptian catacombs, ivy-covered angels - makes it one of London's most atmospheric locations.",
    tags: ['80s', 'celtic-punk', 'pogues', 'gothic']
  },
  {
    title: 'Hampstead Incident',
    artist: 'Donovan',
    locationName: 'Hampstead Heath',
    description: "Donovan's 1966 folk track references the wild parkland of Hampstead Heath. The heath's ancient woodland, swimming ponds, and hilltop views have inspired artists from Keats to Constable. The song captures its bohemian associations.",
    tags: ['60s', 'folk', 'psychedelic', 'scenic']
  },
  {
    title: 'Electric Avenue',
    artist: 'Eddy Grant',
    locationName: 'Electric Avenue, Brixton',
    description: "Eddy Grant's 1982 hit was inspired by the 1981 Brixton riots. Electric Avenue was the first market street in London lit by electricity. Grant lived in London and witnessed the social tensions that exploded into violence. The song remains a powerful commentary on racial inequality.",
    tags: ['80s', 'reggae', 'political', 'historic-event']
  },
  {
    title: 'The Guns of Brixton',
    artist: 'The Clash',
    locationName: 'Brixton',
    description: "Paul Simonon's reggae-influenced song about police tension in his home neighborhood of Brixton. The Clash captured the simmering conflict that would erupt in the 1981 riots. The song's defiant lyrics remain relevant to discussions of policing.",
    tags: ['70s', 'punk', 'reggae', 'political', 'clash']
  },
  {
    title: 'Up the Junction',
    artist: 'Squeeze',
    locationName: 'Clapham Junction',
    description: "Squeeze's 1979 hit tells the story of young love and unplanned pregnancy in South London. Clapham Junction, 'Britain's busiest railway station,' represents the crossroads where lives intersect. The song follows a couple from meeting to marriage to separation.",
    tags: ['70s', 'new-wave', 'squeeze', 'storytelling']
  },
  {
    title: 'South London Forever',
    artist: 'Florence + the Machine',
    locationName: 'Camberwell',
    description: "Florence Welch's 2018 track is a love letter to her South London home. She sings about running 'down to Brixton' and the River Effra that flows underground beneath the neighborhood. The song captures the deep attachment to place that defines South London identity.",
    tags: ['2010s', 'indie', 'florence', 'south-london']
  },
  {
    title: 'Lambeth Walk',
    artist: 'Original Cast',
    locationName: 'Lambeth Walk',
    description: "This 1937 song from 'Me and My Girl' became a Cockney anthem. The Lambeth Walk is a real street in South London, and the song spawned a dance craze. During WWII, a propaganda film edited Nazi footage to make soldiers appear to do the dance.",
    tags: ['30s', 'musical-theatre', 'cockney', 'historical']
  },
  {
    title: 'Peckham Rye',
    artist: 'Kate Nash',
    locationName: 'Peckham Rye',
    description: "Kate Nash's track references this South London neighborhood that's transformed from working-class to trendy. Peckham Rye park is where William Blake allegedly saw angels in a tree. The area's Caribbean community and art galleries now coexist with traditional pie-and-mash shops.",
    tags: ['2000s', 'indie', 'south-london']
  },
  {
    title: 'Werewolves of London',
    artist: 'Warren Zevon',
    locationName: 'Tower of London',
    description: "Warren Zevon's 1978 rock classic imagines werewolves roaming London. The lyrics mention Soho and dining at Lee Ho Fooks (a real Chinatown restaurant). The song's horror-movie imagery captures London's foggy, gothic atmosphere.",
    tags: ['70s', 'rock', 'american', 'horror', 'humorous']
  },
  {
    title: 'Greenwich Meantime',
    artist: 'Richard Thompson',
    locationName: 'Royal Observatory Greenwich',
    description: "Richard Thompson's track takes its name from Greenwich Mean Time, set at the Royal Observatory on the Prime Meridian. Greenwich has defined global timekeeping since 1884. The observatory sits in Greenwich Park with views across to Canary Wharf.",
    tags: ['90s', 'folk-rock', 'scientific']
  },
  {
    title: 'Mile End',
    artist: 'Pulp',
    locationName: 'Mile End',
    description: "Pulp's 1995 track from 'Trainspotting' describes a failed romance in a grim East London flat. Jarvis Cocker sings about a relationship where 'the living room was soaking' from a leak. Mile End's social housing provides the setting for this brutally honest portrait.",
    tags: ['90s', 'britpop', 'pulp', 'dark']
  },
  {
    title: 'Down in the Tube Station at Midnight',
    artist: 'The Jam',
    locationName: 'Aldgate East Station',
    description: "The Jam's 1978 track is a first-person account of a violent mugging on the Tube. Paul Weller wrote it after witnessing actual violence on London Underground. The claustrophobic terror of being trapped underground remains viscerally relevant.",
    tags: ['70s', 'punk', 'jam', 'tube', 'dark']
  },
  {
    title: 'Whitechapel',
    artist: 'Paloma Faith',
    locationName: 'Whitechapel',
    description: "Paloma Faith's track evokes the East End neighborhood famous for its market and Jack the Ripper history. Whitechapel has been a gateway for immigrants for centuries - Huguenots, Jews, Bangladeshis - giving the area its unique layered character.",
    tags: ['2010s', 'soul', 'east-end']
  },
  {
    title: 'Brick Lane',
    artist: 'Benga',
    locationName: 'Brick Lane',
    description: "Benga's dubstep track takes its name from London's famous curry mile. Brick Lane runs through the heart of the Bangladeshi community in Tower Hamlets, lined with curry houses, vintage shops, and street art. The area has been central to London's underground music scene.",
    tags: ['2000s', 'dubstep', 'east-end']
  },
  {
    title: 'Limehouse Blues',
    artist: 'Django Reinhardt',
    locationName: 'Limehouse Basin',
    description: "Django Reinhardt's jazz standard references this Docklands neighborhood that was once London's original Chinatown. In the early 20th century, Limehouse had a reputation for opium dens and exotic danger. Today it's a peaceful marina.",
    tags: ['30s', 'jazz', 'historical']
  },
  {
    title: 'Itchycoo Park',
    artist: 'Small Faces',
    locationName: 'Little Ilford Park',
    description: "Small Faces' 1967 psychedelic hit describes a dreamy escape to 'Itchycoo Park.' The band grew up in Manor Park, East London, and the 'itchy' likely refers to stinging nettles common in London parks. The song captures innocent 60s optimism.",
    tags: ['60s', 'psychedelic', 'small-faces', 'nostalgic']
  },
  {
    title: 'Stepney',
    artist: 'Billy Bragg',
    locationName: 'Stepney Green',
    description: "Billy Bragg's track references this East End neighborhood that epitomizes working-class London. Stepney was heavily bombed in the Blitz. Bragg, champion of the working class, uses Stepney to represent authentic East End identity.",
    tags: ['80s', 'folk-punk', 'political', 'east-end']
  },
  {
    title: 'Portobello Road',
    artist: 'Film Soundtrack',
    locationName: 'Portobello Road',
    description: "This song from Disney's 'Bedknobs and Broomsticks' (1971) celebrates Notting Hill's famous market street. Every Saturday, the road transforms into one of the world's largest antiques markets. The film's animated sequence captures its eclectic spirit.",
    tags: ['70s', 'disney', 'musical', 'market']
  },
  {
    title: "Rudie Can't Fail",
    artist: 'The Clash',
    locationName: 'Ladbroke Grove',
    description: "The Clash's 1979 track captures the Notting Hill Carnival spirit. Ladbroke Grove was the heart of London's West Indian community. Joe Strummer lived nearby and witnessed the cultural vibrancy and police tensions that defined the area.",
    tags: ['70s', 'punk', 'clash', 'carnival', 'cultural']
  },
  {
    title: 'White Riot',
    artist: 'The Clash',
    locationName: 'Notting Hill',
    description: "The Clash's 1977 debut single captured the tension of Notting Hill Carnival. Written after the 1976 riots between police and Black youth, the song channels the anger of unemployment and racism into punk's raw energy.",
    tags: ['70s', 'punk', 'clash', 'political', 'iconic']
  },
  {
    title: 'Chelsea Hotel',
    artist: 'Leonard Cohen',
    locationName: 'Chelsea',
    description: "While Leonard Cohen's song is about the Chelsea Hotel in New York, it resonates with London's Chelsea - both neighborhoods famous for bohemian artistic heritage. King's Road was the epicenter of 1960s fashion and punk in the 1970s.",
    tags: ['70s', 'folk', 'artistic', 'bohemian']
  },
  {
    title: 'Fulham Broadway',
    artist: 'The Bluetones',
    locationName: 'Fulham Broadway',
    description: "The Bluetones' track references this West London tube station near Chelsea FC's Stamford Bridge stadium. Fulham Broadway represents the intersection of football culture and London's transport network.",
    tags: ['90s', 'britpop', 'football']
  },
  {
    title: 'My Generation',
    artist: 'The Who',
    locationName: "Shepherd's Bush",
    description: "Pete Townshend wrote this 1965 anthem in his Shepherd's Bush flat. The line 'talking about my generation' defined youth rebellion. Shepherd's Bush was The Who's home turf - Roger Daltrey grew up nearby. The song shaped mod culture and British rock.",
    tags: ['60s', 'rock', 'who', 'iconic', 'mod']
  },
  {
    title: 'Hammersmith Palais',
    artist: 'The Clash',
    locationName: 'Hammersmith',
    description: "The Clash's 1978 track describes Joe Strummer's night at this legendary West London venue watching reggae acts. The Palais, demolished in 2012, hosted everyone from The Beatles to the Sex Pistols. The song critiques punk's commercialization while celebrating multicultural nightlife.",
    tags: ['70s', 'punk', 'clash', 'venue', 'cultural']
  },
  {
    title: 'Acton Town',
    artist: 'The Members',
    locationName: 'Acton',
    description: "The Members' late-70s track references this West London tube station on the Piccadilly and District lines. Acton Town's distinctive 1930s Charles Holden architecture represents where suburban London begins.",
    tags: ['70s', 'punk', 'tube']
  },
  {
    title: 'Archangel',
    artist: 'Burial',
    locationName: 'Canary Wharf',
    description: "Burial's atmospheric dubstep evokes night-time South London - 'night buses, taillights, petrol stations, pirate radio.' Canary Wharf's gleaming towers built on old docks capture the ghostly, nocturnal atmosphere of his music.",
    tags: ['2000s', 'dubstep', 'atmospheric', 'nocturnal']
  },
  {
    title: 'The City Never Sleeps',
    artist: 'The Eurythmics',
    locationName: 'Bank of England',
    description: "Eurythmics' track captures the relentless energy of London's financial district. The City of London, centered on the Bank of England, symbolizes 24-hour capitalism. Annie Lennox's lyrics about the city that 'never sleeps' match the always-lit towers.",
    tags: ['80s', 'synth-pop', 'financial-district']
  },
  {
    title: 'No Distance Left to Run',
    artist: 'Blur',
    locationName: 'The O2 (Millennium Dome)',
    description: "Blur's melancholic 1999 track reflects on a relationship ending as the band itself was falling apart. The O2, built for the millennium on the Greenwich Peninsula, represents an era of change and endings.",
    tags: ['90s', 'britpop', 'blur', 'melancholic']
  },
  {
    title: 'London Loves',
    artist: 'Blur',
    locationName: 'Oxford Circus',
    description: "Blur's 1994 track captures aimless wandering through central London. Oxford Circus, the busiest shopping junction where Oxford Street meets Regent Street, represents the consumer culture Damon Albarn observes with detached irony.",
    tags: ['90s', 'britpop', 'blur', 'urban']
  },
  {
    title: "Maybe It's Because I'm a Londoner",
    artist: 'Hubert Gregg',
    locationName: 'Buckingham Palace',
    description: "The ultimate London anthem, written in 1947 by Hubert Gregg. The song celebrates love for the capital city with simple, heartfelt lyrics. Buckingham Palace represents London at its most iconic and ceremonial.",
    tags: ['40s', 'music-hall', 'anthem', 'patriotic']
  },
  {
    title: 'LDN',
    artist: 'Lily Allen',
    locationName: 'Covent Garden',
    description: "Lily Allen's 2006 debut offers a sunny yet ironic view of London. The song contrasts cheerful appearances with darker reality. Covent Garden's street performers and tourist crowds embody this duality of surface charm and hidden grit.",
    tags: ['2000s', 'pop', 'ironic', 'modern-london']
  },
  {
    title: 'Parklife',
    artist: 'Blur',
    locationName: 'Hyde Park',
    description: "Blur's 1994 Britpop anthem became the soundtrack of Cool Britannia. Phil Daniels's Cockney spoken-word section parodies lad culture - feeding pigeons, going to the pub. Hyde Park represents London's public spaces where ordinary people live out their 'parklife.'",
    tags: ['90s', 'britpop', 'blur', 'iconic', 'cultural']
  },
  {
    title: 'Waterloo',
    artist: 'ABBA',
    locationName: 'Waterloo Station',
    description: "ABBA's 1974 Eurovision winner references Napoleon's final defeat. Waterloo Station, built to commemorate Wellington's victory, keeps the historical connection alive. 'My my, at Waterloo Napoleon did surrender' - romantic surrender meeting British military history.",
    tags: ['70s', 'pop', 'eurovision', 'swedish', 'iconic']
  }
];

async function fixEnrichment() {
  console.log('🔧 Fixing enrichment data by matching title + artist...');
  console.log('');
  
  let updated = 0;
  let notFound = 0;
  
  for (const enrichment of enrichedData) {
    // Find song by title and artist
    const { data: songs, error: findError } = await supabase
      .from('songs')
      .select('id, title, artist')
      .ilike('title', enrichment.title)
      .ilike('artist', enrichment.artist)
      .limit(1);
    
    if (findError || !songs || songs.length === 0) {
      console.log(`❌ Not found: ${enrichment.title} - ${enrichment.artist}`);
      notFound++;
      continue;
    }
    
    const song = songs[0];
    
    // Update with correct data
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        location_name: enrichment.locationName,
        location_description: enrichment.description,
        tags: enrichment.tags
      })
      .eq('id', song.id);
    
    if (updateError) {
      console.log(`❌ Update failed: ${enrichment.title} - ${updateError.message}`);
    } else {
      console.log(`✅ ${enrichment.title} → ${enrichment.locationName}`);
      updated++;
    }
  }
  
  console.log('');
  console.log(`🎉 Done! Updated ${updated} songs, ${notFound} not found.`);
}

fixEnrichment();
