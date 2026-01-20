/**
 * Enrich Song Location Data
 * Updates all songs with detailed location descriptions
 * explaining how each song connects to its place
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface LocationEnrichment {
  id: string;
  locationName: string;
  description: string;
  tags: string[];
}

const enrichedData: LocationEnrichment[] = [
  {
    id: 'london-1',
    locationName: 'Trafalgar Square',
    description: "Ronan Keating's 2000 hit was filmed in and around Trafalgar Square, with the iconic Nelson's Column and the National Gallery providing the backdrop. The song's themes of separation and longing are set against London's most famous public square, where tourists and locals gather beneath the four bronze lion statues.",
    tags: ['2000s', 'pop', 'irish', 'music-video-location']
  },
  {
    id: 'london-2',
    locationName: 'Soho Square',
    description: "Kirsty MacColl's tender ballad directly references this small garden square in the heart of Soho. The lyrics describe meeting a lover in the square: 'One day we'll walk in Soho Square.' The square's Tudor-style gardener's hut and peaceful green space provide an intimate escape from the bustling streets of London's entertainment district.",
    tags: ['80s', 'folk', 'british', 'direct-reference']
  },
  {
    id: 'london-3',
    locationName: 'Carnaby Street',
    description: "The Jam's 1977 track captures the spirit of this iconic fashion street that defined 1960s Swinging London. Once home to boutiques like 'I Was Lord Kitchener's Valet' and Mary Quant, Carnaby Street was ground zero for mod culture - the very movement that influenced Paul Weller and The Jam's style and sound.",
    tags: ['70s', 'punk', 'mod', 'british', 'cultural-reference']
  },
  {
    id: 'london-4',
    locationName: 'Baker Street',
    description: "Gerry Rafferty's 1978 masterpiece, famous for its iconic saxophone riff, takes its name from the London street synonymous with Sherlock Holmes. Rafferty wrote the song about the music industry's dark side while living near Baker Street. The lyrics reference 'the city' and 'crying' - capturing the alienation of London life. The saxophone solo was played by Raphael Ravenscroft and is one of the most recognizable in rock history.",
    tags: ['70s', 'rock', 'scottish', 'direct-reference', 'iconic-riff']
  },
  {
    id: 'london-5',
    locationName: 'Piccadilly Circus',
    description: "Morrissey's 1990 solo track uses Polari - the secret slang of London's gay subculture - to describe the scene around Piccadilly Circus. In the 1950s-70s, this neon-lit junction was a known cruising area. The song's title itself is Polari, and Morrissey sings about the 'Palare' (talk) of Piccadilly, preserving a slice of queer London history.",
    tags: ['90s', 'alternative', 'british', 'lgbtq-history', 'cultural-reference']
  },
  {
    id: 'london-11',
    locationName: 'Berwick Street, Soho',
    description: "While not directly about Berwick Street, Oasis chose this Soho location for the iconic album cover of '(What's the Story) Morning Glory?' The photograph by Michael Spencer Jones shows two men walking past each other on the narrow market street. This made Berwick Street a pilgrimage site for Britpop fans, forever linking the location to 1990s British rock.",
    tags: ['90s', 'britpop', 'album-cover', 'cultural-landmark']
  },
  {
    id: 'london-6',
    locationName: 'Battersea Power Station',
    description: "The Clash's 1979 anthem uses London as a metaphor for societal collapse. The song references the Thames flooding and 'London calling to the faraway towns.' Battersea Power Station, visible from many parts of South London, represents the industrial heart that The Clash sang about. The building later appeared on Pink Floyd's 'Animals' cover, cementing South London's place in rock iconography.",
    tags: ['70s', 'punk', 'british', 'political', 'iconic']
  },
  {
    id: 'london-7',
    locationName: 'Mayfair',
    description: "This 1937 jazz standard, covered definitively by Ella Fitzgerald, paints a romantic picture of London's upscale Mayfair district. The lyrics describe how 'the British Museum had lost its charm' because of love, and how 'a foggy day in London town had me low and had me down.' The song captures the glamour and melancholy of pre-war London high society.",
    tags: ['30s', 'jazz', 'american', 'classic', 'romantic']
  },
  {
    id: 'london-15',
    locationName: 'Abbey Road Studios',
    description: "The Beatles recorded much of their groundbreaking work at Abbey Road Studios in St John's Wood. 'Come Together' opens their final recorded album, named after the studio and its famous zebra crossing. John Lennon wrote the song's distinctive bassline and surreal lyrics here, in the studio that became synonymous with the band's innovative sound.",
    tags: ['60s', 'rock', 'british', 'beatles', 'studio-location']
  },
  {
    id: 'london-8',
    locationName: 'Berkeley Square',
    description: "This 1940 song immortalized the upscale Mayfair square, claiming 'A nightingale sang in Berkeley Square.' Written during the Blitz, the song offered romantic escapism during wartime. While nightingales don't actually sing in central London, the song created a lasting myth. The square's plane trees and Georgian townhouses still evoke the song's gentle romance.",
    tags: ['40s', 'jazz', 'british', 'wartime', 'romantic', 'direct-reference']
  },
  {
    id: 'london-9',
    locationName: 'Warwick Avenue Tube Station',
    description: "Duffy's 2008 hit is set at this Bakerloo line station in Little Venice. The song describes meeting an ex-lover at the station to end a relationship: 'When I get to Warwick Avenue, meet me by the entrance of the tube.' The area's quiet, canal-side charm contrasts with the song's emotional turmoil, making it a powerful location for the breakup narrative.",
    tags: ['2000s', 'soul', 'welsh', 'direct-reference', 'tube-station']
  },
  {
    id: 'london-10',
    locationName: 'Tower Bridge',
    description: "Fergie's 2006 hit uses London Bridge as a metaphor, though the video was filmed at Tower Bridge - a common American confusion. The song's playground-rhyme hook references the nursery rhyme 'London Bridge is Falling Down,' which dates back centuries and may reference Viking attacks or the bridge's many collapses throughout history.",
    tags: ['2000s', 'pop', 'american', 'indirect-reference']
  },
  {
    id: 'london-12',
    locationName: 'Camden Town',
    description: "Madness's 1982 anthem became an unofficial anthem for suburban London life. The video was filmed at a house in Willesden, but Camden - where Madness formed and regularly performed - embodies the song's celebration of working-class home life. The line 'Our house, in the middle of our street' captures the terraced housing typical of North London neighborhoods.",
    tags: ['80s', 'ska', 'british', 'madness', 'nostalgic']
  },
  {
    id: 'london-13',
    locationName: 'Victoria Station',
    description: "The Kinks' 1969 track is named after Queen Victoria and celebrates British imperial pride with heavy irony. Ray Davies wrote it as a satirical look at British nationalism. Victoria Station, the major railway terminus named after the same queen, connects the song to London's transport history and the era of empire it gently mocks.",
    tags: ['60s', 'rock', 'british', 'kinks', 'satirical', 'historical']
  },
  {
    id: 'london-14',
    locationName: 'West End',
    description: "Pet Shop Boys' 1985 synth-pop masterpiece captures Thatcher-era London's class divide. The lyrics contrast 'East End boys and West End girls' - working-class East London versus fashionable West London. Neil Tennant wrote it after observing late-night encounters around Leicester Square. The song perfectly encapsulates 1980s London's social geography.",
    tags: ['80s', 'synth-pop', 'british', 'social-commentary', 'iconic']
  },
  {
    id: 'london-16',
    locationName: 'Waterloo Bridge',
    description: "The Kinks' 1967 masterpiece captures a perfect London moment: watching the sunset from Waterloo Bridge. Ray Davies wrote about the view toward Parliament and St Paul's, describing Terry and Julie meeting 'every Friday night.' The song's bittersweet celebration of ordinary London life made it a timeless love letter to the city.",
    tags: ['60s', 'rock', 'british', 'kinks', 'romantic', 'iconic', 'direct-reference']
  },
  {
    id: 'london-17',
    locationName: 'Primrose Hill',
    description: "Madness's 2009 track pays tribute to this North London hill with panoramic city views. The lyrics reference the 'London skyline' visible from the summit, where couples gather at sunset. Primrose Hill has long been associated with artistic and literary figures, from Sylvia Plath to Blur, making it a fitting subject for Madness's nostalgic celebration.",
    tags: ['2000s', 'ska', 'british', 'madness', 'direct-reference', 'scenic']
  },
  {
    id: 'london-18',
    locationName: 'Finsbury Park',
    description: "The Libertines' track references this North London park and its surrounding area, once home to the Rainbow Theatre where The Clash and Bob Marley played legendary shows. Pete Doherty grew up nearby, and the band's raw sound captures the area's mix of Victorian grandeur and urban grit.",
    tags: ['2000s', 'indie', 'british', 'libertines', 'direct-reference']
  },
  {
    id: 'london-19',
    locationName: 'Whitechapel',
    description: "Paloma Faith's track evokes the East End neighborhood famous for its market, the Royal London Hospital, and its Jack the Ripper history. Whitechapel has been a gateway for immigrants for centuries - Huguenots, Jews, Bangladeshis - and this layered history infuses the area with a unique character that Faith captures in her theatrical style.",
    tags: ['2010s', 'soul', 'british', 'east-end', 'direct-reference']
  },
  {
    id: 'london-20',
    locationName: 'Brick Lane',
    description: "Benga's dubstep track takes its name from London's famous curry mile. Brick Lane runs through the heart of the Bangladeshi community in Tower Hamlets, lined with curry houses, vintage shops, and street art. The area has been central to London's underground music scene, from grime to dubstep, making it a fitting namesake for this bass-heavy track.",
    tags: ['2000s', 'dubstep', 'british', 'east-end', 'direct-reference']
  },
  {
    id: 'london-21',
    locationName: 'Limehouse',
    description: "Django Reinhardt's jazz standard references this Docklands neighborhood that was once London's original Chinatown. In the early 20th century, Limehouse had a reputation for opium dens and exotic danger - largely exaggerated - which fed into the 'mysterious East' imagery of the song. Today, Limehouse Basin is a peaceful marina.",
    tags: ['30s', 'jazz', 'french', 'historical', 'direct-reference']
  },
  {
    id: 'london-22',
    locationName: 'Stepney',
    description: "Billy Bragg's track references this East End neighborhood that epitomizes working-class London. Stepney was heavily bombed in the Blitz, and its post-war council estates became home to the Cockney community. Bragg, champion of the working class, uses Stepney to represent authentic East End identity in contrast to gentrification.",
    tags: ['80s', 'folk-punk', 'british', 'political', 'east-end', 'direct-reference']
  },
  {
    id: 'london-23',
    locationName: 'Brixton',
    description: "Eddy Grant's 1982 hit was inspired by the 1981 Brixton riots, sparked by police tensions and high unemployment in the Black community. The song's title references Electric Avenue - the first market street in London to have electric lighting. Grant lived in London and witnessed the social tensions that exploded into violence. The song remains a powerful commentary on racial inequality.",
    tags: ['80s', 'reggae', 'guyanese', 'political', 'direct-reference', 'historic-event']
  },
  {
    id: 'london-24',
    locationName: 'Portobello Road',
    description: "This song from Disney's 'Bedknobs and Broomsticks' (1971) celebrates Notting Hill's famous market street. Every Saturday, the road transforms into one of the world's largest antiques markets. The film's animated sequence captures the street's eclectic spirit - from Victorian jewelry to vintage clothes - that still draws millions of visitors today.",
    tags: ['70s', 'film-soundtrack', 'american', 'market', 'direct-reference']
  },
  {
    id: 'london-25',
    locationName: 'Ladbroke Grove',
    description: "The Clash's 1979 track captures the Notting Hill Carnival spirit. Written after the 1976 Carnival riots, the song celebrates Caribbean culture in West London despite police tensions. Ladbroke Grove, running through Notting Hill, was the heart of London's West Indian community. Joe Strummer lived nearby and witnessed the cultural clash firsthand.",
    tags: ['70s', 'punk', 'british', 'clash', 'carnival', 'cultural']
  },
  {
    id: 'london-26',
    locationName: 'Leicester Square',
    description: "Ralph McTell's 1969 folk classic describes homeless people sleeping in 'the all-night cafés at a quarter past eleven' around central London. Leicester Square, with its cinemas and late-night crowds, symbolizes the contrast between London's glittering entertainment and the forgotten people on its streets. The song raised awareness of homelessness.",
    tags: ['60s', 'folk', 'british', 'social-commentary', 'iconic']
  },
  {
    id: 'london-27',
    locationName: 'Wimbledon Station',
    description: "The Jam's 1978 track is a first-person account of a violent mugging on the Tube. Paul Weller wrote it after witnessing actual violence on London Underground. The claustrophobic terror of being trapped underground while violence erupts remains viscerally relevant to anyone who's experienced the Tube late at night.",
    tags: ['70s', 'punk', 'british', 'jam', 'tube', 'dark']
  },
  {
    id: 'london-28',
    locationName: 'Muswell Hill',
    description: "The Kinks wrote this 1966 track from their home territory in North London. Ray Davies captures a lazy summer afternoon with tax collectors and politicians far away: 'the tax man's taken all my dough.' Muswell Hill's leafy streets and Victorian houses embody the middle-class comfort the song celebrates with gentle irony.",
    tags: ['60s', 'rock', 'british', 'kinks', 'nostalgic']
  },
  {
    id: 'london-29',
    locationName: 'Notting Hill',
    description: "The Clash's 1977 debut single captured the tension of Notting Hill Carnival. Written after the 1976 riots between police and Black youth, the song channels the anger of unemployment and racism. The opening line 'White riot, I wanna riot' was deliberately provocative, calling for white punks to match the political consciousness of their Black neighbors.",
    tags: ['70s', 'punk', 'british', 'clash', 'political', 'iconic']
  },
  {
    id: 'london-30',
    locationName: 'Islington',
    description: "Lily Allen's 2006 debut single offers a sunny view of London through her eyes. Walking through the city, she sings 'sun is in the sky oh why oh why would I wanna be anywhere else?' Islington, her home neighborhood, represents the optimistic London of street markets, cafes, and diverse communities that Allen celebrates.",
    tags: ['2000s', 'pop', 'british', 'optimistic', 'modern-london']
  },
  {
    id: 'london-52',
    locationName: 'Hyde Park',
    description: "Blur's 1994 Britpop anthem became the soundtrack of Cool Britannia. The song parodies lad culture with Phil Daniels's Cockney spoken-word section about feeding pigeons and going to the pub. Hyde Park represents London's public spaces where ordinary people live out their 'parklife' - jogging, sunbathing, and escaping urban stress.",
    tags: ['90s', 'britpop', 'british', 'blur', 'iconic', 'cultural']
  },
  {
    id: 'london-31',
    locationName: 'Waterloo Station',
    description: "ABBA's 1974 Eurovision winner references Napoleon's final defeat, but Waterloo Station in London keeps the historical connection alive. The station, built to commemorate Wellington's victory, links the song's theme of romantic surrender to British military history. 'My my, at Waterloo Napoleon did surrender.'",
    tags: ['70s', 'pop', 'swedish', 'eurovision', 'historical-reference']
  },
  {
    id: 'london-32',
    locationName: 'Wapping',
    description: "Small Faces' 1967 psychedelic hit describes a dreamy escape to 'Itchycoo Park.' While no actual park bears this name, the song references the band's East End roots. Wapping, near their childhood homes, had several small parks where local kids played. The 'itchy' likely refers to stinging nettles common in London parks.",
    tags: ['60s', 'psychedelic', 'british', 'small-faces', 'nostalgic']
  },
  {
    id: 'london-33',
    locationName: 'Mile End',
    description: "Pulp's 1995 track from the 'Trainspotting' soundtrack describes a failed romance in a grim East London flat. Jarvis Cocker sings about a relationship where 'the living room was soaking' from a leak. Mile End's social housing and urban decay provide the setting for this brutally honest portrait of love gone wrong.",
    tags: ['90s', 'britpop', 'british', 'pulp', 'dark', 'direct-reference']
  },
  {
    id: 'london-34',
    locationName: 'Highgate Cemetery',
    description: "The Pogues reference this famous Victorian cemetery where Karl Marx is buried. Highgate Cemetery's overgrown Gothic atmosphere - Egyptian catacombs, ivy-covered angels - makes it one of London's most atmospheric locations. Shane MacGowan's lyrics capture the dark romanticism of North London's hillside necropolis.",
    tags: ['80s', 'celtic-punk', 'british', 'pogues', 'gothic', 'direct-reference']
  },
  {
    id: 'london-35',
    locationName: 'Hampstead Heath',
    description: "Donovan's 1966 folk track references the wild parkland of Hampstead Heath. The song describes a surreal encounter on the heath, which has long been associated with bohemian and artistic life. The heath's ancient woodland, swimming ponds, and hilltop views of London have inspired artists from Keats to Constable.",
    tags: ['60s', 'folk', 'scottish', 'psychedelic', 'direct-reference']
  },
  {
    id: 'london-36',
    locationName: 'Lambeth',
    description: "This 1937 song from the musical 'Me and My Girl' became a Cockney anthem. The Lambeth Walk is a street in Lambeth, South London, and the song spawned a dance craze. During WWII, a propaganda film edited Nazi footage to make soldiers appear to do the dance - one of history's earliest viral videos.",
    tags: ['30s', 'musical-theatre', 'british', 'cockney', 'historical', 'direct-reference']
  },
  {
    id: 'london-37',
    locationName: 'Peckham',
    description: "Kate Nash's track references this South London neighborhood that's transformed from working-class to trendy. Peckham Rye park, the common, and the High Street appear in Nash's lyrics. The area's Caribbean community, art galleries, and rooftop bars now coexist with traditional pie-and-mash shops.",
    tags: ['2000s', 'indie', 'british', 'south-london', 'direct-reference']
  },
  {
    id: 'london-38',
    locationName: 'Greenwich Observatory',
    description: "Richard Thompson's track takes its name from Greenwich Mean Time, set at the Royal Observatory on the Prime Meridian. Greenwich has defined global timekeeping since 1884. The observatory sits in Greenwich Park, with views across the Thames to Canary Wharf - old London meeting new.",
    tags: ['90s', 'folk-rock', 'british', 'scientific', 'direct-reference']
  },
  {
    id: 'london-39',
    locationName: 'Chelsea',
    description: "While Leonard Cohen's song is about the Chelsea Hotel in New York, it resonates with London's Chelsea - both neighborhoods famous for their bohemian artistic heritage. King's Road in Chelsea was the epicenter of 1960s fashion and punk in the 1970s, when Vivienne Westwood's SEX shop dressed the Sex Pistols.",
    tags: ['70s', 'folk', 'canadian', 'artistic', 'indirect-reference']
  },
  {
    id: 'london-40',
    locationName: 'Fulham Broadway',
    description: "The Bluetones' track references this West London tube station and surrounding area, home to Chelsea FC's Stamford Bridge stadium. Fulham Broadway represents the intersection of football culture and London's transport network - match days transform this quiet station into a sea of blue.",
    tags: ['90s', 'britpop', 'british', 'football', 'direct-reference']
  },
  {
    id: 'london-41',
    locationName: 'Acton Town Station',
    description: "The Members' late-70s track references this West London tube station on the Piccadilly and District lines. Acton Town, with its distinctive 1930s Charles Holden architecture, represents the outer reaches of Zone 3 - where suburban London begins and the city's density starts to thin.",
    tags: ['70s', 'punk', 'british', 'tube', 'direct-reference']
  },
  {
    id: 'london-42',
    locationName: 'South London',
    description: "Burial's atmospheric dubstep track evokes the night-time streets of South London, where the anonymous producer lives. His music captures the sound of 'night buses, taillights, petrol stations, pirate radio' - the lonely urban landscape of South London after dark. The archangel could be the guardian of this nocturnal city.",
    tags: ['2000s', 'dubstep', 'british', 'atmospheric', 'south-london']
  },
  {
    id: 'london-43',
    locationName: 'Canary Wharf',
    description: "Eurythmics' track captures the relentless energy of London's financial district. Canary Wharf, built on the old West India Docks, became the symbol of 1980s regeneration and 24-hour capitalism. Annie Lennox's lyrics about the city that 'never sleeps' match the always-lit towers of London's second skyline.",
    tags: ['80s', 'synth-pop', 'british', 'financial-district', 'urban']
  },
  {
    id: 'london-44',
    locationName: 'Bayswater',
    description: "Blur's melancholic 1999 track reflects on a relationship ending as the band itself was falling apart. Bayswater, the quiet residential area near Hyde Park, provides an appropriately subdued setting. The song's sense of things winding down matches this neighborhood's genteel decline from Victorian grandeur.",
    tags: ['90s', 'britpop', 'british', 'blur', 'melancholic']
  },
  {
    id: 'london-45',
    locationName: 'Bow',
    description: "This music hall song defines who can call themselves a true Cockney - traditionally, only those born within earshot of Bow Bells at St Mary-le-Bow church in Cheapside. The song celebrates London pride and has become an anthem for East Enders, though the church is actually in the City, not Bow itself.",
    tags: ['40s', 'music-hall', 'british', 'cockney', 'traditional', 'identity']
  },
  {
    id: 'london-46',
    locationName: 'Brixton Academy',
    description: "The Clash's 1979 track references the Brixton neighborhood and its association with the Windrush generation. The Brixton Academy (now O2 Academy Brixton) opened in 1929 and has hosted legendary concerts. The song's militaristic ska rhythm reflects the tension between the Black community and police that exploded in the 1981 riots.",
    tags: ['70s', 'punk', 'british', 'clash', 'political', 'direct-reference']
  },
  {
    id: 'london-47',
    locationName: 'Clapham Junction',
    description: "Squeeze's 1979 hit tells the story of young love and unplanned pregnancy in South London. Clapham Junction, 'Britain's busiest railway station,' represents the crossroads where lives intersect and separate. The song follows a couple from meeting to marriage to mundane domesticity, all in South London streets.",
    tags: ['70s', 'new-wave', 'british', 'squeeze', 'storytelling', 'direct-reference']
  },
  {
    id: 'london-48',
    locationName: 'Brixton',
    description: "Florence Welch's 2018 track is a love letter to her South London home. She sings about running 'down to Brixton' and the 'holy water' of the River Effra that runs underground beneath the neighborhood. The song captures the attachment to place that defines South London identity.",
    tags: ['2010s', 'indie', 'british', 'florence', 'south-london', 'direct-reference']
  },
  {
    id: 'london-49',
    locationName: 'Soho',
    description: "Warren Zevon's 1978 rock classic, though American, has become associated with London through its title and howling wolf theme. The song's horror-movie imagery - 'walking through the streets of Soho in the rain' - captures London's foggy, gothic atmosphere. The werewolf myth meets London's dark Victorian legacy.",
    tags: ['70s', 'rock', 'american', 'horror', 'atmospheric']
  },
  {
    id: 'london-50',
    locationName: 'Hammersmith Palais',
    description: "The Clash's 1978 track describes Joe Strummer's night at this legendary West London venue watching reggae acts. The Palais, demolished in 2012, hosted everyone from The Beatles to the Sex Pistols. The song critiques punk's commercialization while celebrating multicultural London nightlife.",
    tags: ['70s', 'punk', 'british', 'clash', 'venue', 'direct-reference', 'cultural']
  },
  {
    id: 'london-51',
    locationName: 'Westminster',
    description: "Blur's 1994 track from 'Parklife' captures aimless wandering through central London. Westminster, with its government buildings and tourist crowds, represents the official London that the song's narrator drifts through. Damon Albarn's lyrics about London loving and leaving you reflect the city's indifference.",
    tags: ['90s', 'britpop', 'british', 'blur', 'urban', 'introspective']
  },
  {
    id: 'london-53',
    locationName: 'Shepherd\'s Bush',
    description: "The Who's 1965 anthem was written by Pete Townshend in his Shepherd's Bush flat. The line 'talking about my generation' captured youth rebellion. Shepherd's Bush, with its Empire theatre and Green, was The Who's home turf - Roger Daltrey grew up nearby. The song defined mod culture and British rock.",
    tags: ['60s', 'rock', 'british', 'who', 'iconic', 'mod', 'generational']
  }
];

async function enrichLocations() {
  console.log('📝 Enriching song location data...');
  console.log('');
  
  let updated = 0;
  let failed = 0;
  
  for (const enrichment of enrichedData) {
    const { error } = await supabase
      .from('songs')
      .update({
        location_name: enrichment.locationName,
        location_description: enrichment.description,
        tags: enrichment.tags
      })
      .eq('id', enrichment.id);
    
    if (error) {
      console.log(`❌ Failed: ${enrichment.locationName} - ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${enrichment.locationName}`);
      updated++;
    }
  }
  
  console.log('');
  console.log(`🎉 Done! Updated ${updated} songs, ${failed} failed.`);
}

enrichLocations();
