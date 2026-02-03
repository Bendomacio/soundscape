# SoundScape Song Research Prompt

Use this prompt with Gemini, GPT-5, or Claude to research and compile songs for the SoundScape app - a location-based music discovery platform that pins songs to real-world locations.

---

## THE PROMPT

Copy everything below the line and paste it into your AI assistant:

---

# Task: Research Songs with Geographic Connections for SoundScape

I'm building a music discovery app called **SoundScape** that pins songs to real-world locations on a map. Users can explore the world and discover music connected to specific places.

## Your Mission

Research and compile **50+ songs** from around the world that have meaningful connections to specific geographic locations. Be creative and thorough - this should be a global collection spanning different eras, genres, and types of connections.

## Types of Location Connections (Be Creative!)

1. **Recording Studios** - Where iconic albums/songs were recorded
   - Abbey Road Studios (London), Sun Studio (Memphis), Electric Lady (NYC), Muscle Shoals (Alabama)

2. **Music Video Filming Locations** - Specific spots where videos were shot
   - Michael Jackson's "Beat It" alley, Radiohead's "Just" street, etc.

3. **Blue Plaques & Memorials** - Where artists lived, died, or had significant moments
   - John Lennon's childhood home, Freddie Mercury's flat, Mozart's birthplace

4. **Song Lyrics References** - Places explicitly mentioned in songs
   - "Hotel California", "Sweet Home Alabama", "New York, New York"

5. **Movie/TV Soundtrack Locations** - Film locations paired with their iconic music
   - Sound of Music hills (Salzburg), Rocky steps (Philadelphia), Trainspotting locations (Edinburgh)

6. **Concert Venues & Historic Performances** - Sites of legendary shows
   - Woodstock field, Live Aid at Wembley, Altamont Speedway

7. **Album Cover Locations** - Where iconic covers were photographed
   - Abbey Road crossing, The Joshua Tree desert, Born to Run boardwalk

8. **Cultural/Historical Events** - Songs born from specific places/events
   - "Sunday Bloody Sunday" (Derry), "Hurricane" (New Jersey), Fela Kuti's Shrine (Lagos)

9. **Artist Birthplaces/Hometowns** - Signature songs from where artists grew up
   - Springsteen's Asbury Park, Prince's Minneapolis, Bob Marley's Trenchtown

10. **Fictional/Literary Locations** - Songs about real places from fiction
    - Platform 9¾ (Harry Potter), Penny Lane, Strawberry Fields

## Geographic Diversity Required

Include songs from ALL continents and regions:
- **Europe**: UK, France, Germany, Italy, Spain, Scandinavia, Eastern Europe
- **Americas**: USA (diverse regions), Canada, Mexico, Brazil, Argentina, Caribbean
- **Asia**: Japan, South Korea, India, Middle East, Southeast Asia, China
- **Africa**: Nigeria, South Africa, Mali, Egypt, Ethiopia, Congo
- **Oceania**: Australia, New Zealand, Pacific Islands

## Output Format

For EACH song, provide this exact format:

```
### [Song Title] - [Artist]

**Location**: [Specific place name]
**Coordinates**: [Latitude, Longitude] - BE PRECISE! Use Google Maps to verify
**Country**: [Country]
**Connection Type**: [Recording/Music Video/Blue Plaque/Lyrics/Movie/Concert/Album Cover/etc.]

**Spotify URI**: spotify:track:[ID]
  - To find this: Search the song on Spotify web player
  - Click the three dots (...) → Share → Copy Song Link
  - The link will be like: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
  - Convert to URI format: spotify:track:4uLU6hMCjMI75M1A2tKUQC

**YouTube ID**: [11-character video ID from youtube.com/watch?v=XXXXXXXXXXX]

**Location Description** (MINIMUM 150 words - be detailed!):
[Write a rich, engaging description that includes:
- The specific connection between the song and location
- Historical context and background
- Fun facts and lesser-known details
- Why this location matters to music history
- What visitors would see today
- Any changes to the location over time
- Related artists or songs connected to this place
- Cultural significance]

**Tags**: [genre, decade, mood, themes - comma separated]
```

## CRITICAL: Getting Accurate Spotify URIs

**THIS IS ESSENTIAL** - Wrong Spotify URIs break the app!

### Method 1: Use song.link API (RECOMMENDED - Most Reliable)

The song.link (Odesli) API is FREE and requires no authentication. It converts any music URL to Spotify:

```
https://api.song.link/v1-alpha.1/links?url=https://www.youtube.com/watch?v=VIDEO_ID
```

**Workflow:**
1. Find the song on YouTube (search: "Artist - Song Title official")
2. Get the YouTube URL
3. Call the API (you can paste this URL in a browser):
   `https://api.song.link/v1-alpha.1/links?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. In the JSON response, find: `linksByPlatform.spotify.url`
5. Extract the track ID from that URL
6. Format as: `spotify:track:[ID]`

**Example API Response (relevant part):**
```json
{
  "linksByPlatform": {
    "spotify": {
      "url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
      "entityUniqueId": "SPOTIFY_SONG::4uLU6hMCjMI75M1A2tKUQC"
    }
  }
}
```

### Method 2: ISRC Search in Spotify

Every song has an ISRC (International Standard Recording Code). Spotify search supports ISRC:

1. Find the ISRC from MusicBrainz.org (free database)
2. Search in Spotify: `isrc:USRC11700000`
3. Or use URL: `https://open.spotify.com/search/isrc%3AUSRC11700000`

### Method 3: Manual Spotify Search (Fallback)

1. Go to https://open.spotify.com
2. Search for the exact song
3. Click the "..." menu on the song
4. Click "Share" → "Copy Song Link"
5. Extract the track ID from the URL
6. Format as: spotify:track:[ID]

**VERIFY**:
- The track ID is always 22 characters
- Example: `spotify:track:4uLU6hMCjMI75M1A2tKUQC`
- If you can't find it on Spotify, leave blank but note "NOT ON SPOTIFY"

## Example Entry (Use This Quality Level)

```
### Stayin' Alive - Bee Gees

**Location**: 86 Bay 50th Street, Brooklyn, New York
**Coordinates**: 40.5850, -73.9934
**Country**: USA
**Connection Type**: Music Video Filming Location

**Spotify URI**: spotify:track:4uLU6hMCjMI75M1A2tKUQC

**YouTube ID**: I_izvAbhExY

**Location Description**:
The opening sequence of "Saturday Night Fever" (1977) featuring John Travolta's iconic strut was filmed on 86th Street in the Bensonhurst neighborhood of Brooklyn, with the Bee Gees' "Stayin' Alive" providing the unforgettable soundtrack. The scene shows Tony Manero walking down the street carrying a can of paint, perfectly synchronized to the song's driving disco beat.

The filming location at 86 Bay 50th Street (specifically the corner where Travolta walks past Lenny's Pizza) has become a pilgrimage site for film and music fans. Lenny's Pizza still exists today and displays memorabilia from the film. The neighborhood was chosen specifically because it represented authentic working-class Italian-American Brooklyn life.

The Bee Gees wrote "Stayin' Alive" specifically for the film's soundtrack after producer Robert Stigwood approached them. The song's 103 BPM tempo has since become famous for another reason - it's the ideal rhythm for performing CPR chest compressions, and is now taught in first aid classes worldwide.

The film's success transformed both the song and the location into cultural landmarks. The Brooklyn street scene, paired with the Gibbs brothers' falsetto harmonies, defined the disco era and remains one of cinema's most recognizable music moments. Today, fans recreate the walk, though the neighborhood has significantly gentrified since 1977.

**Tags**: disco, 70s, movie-soundtrack, iconic, dance, brooklyn
```

## Existing Songs (Don't Duplicate These)

The database already contains songs for these locations - choose DIFFERENT songs/locations:

- Covent Garden, London (Wouldn't It Be Loverly, LDN)
- Privet Drive/Bracknell (Hedwig's Theme)
- Wimbledon (Tennis Court)
- Trident Studios, London (Space Oddity)
- Battersea Power Station (Pigs Three Different Ones)
- The Ritz, London (Puttin' on the Ritz)
- Waterloo Station (Waterloo - ABBA)
- Hyde Park (Parklife)
- Abbey Road Studios (Come Together)
- Leicester Square (West End Girls)
- Baker Street (Baker Street)
- Westminster/Big Ben (London Calling)
- Waterloo Bridge (Waterloo Sunset)
- And ~40 more London locations...

**Focus on NON-LONDON locations to build global diversity!**

## Quality Checklist

Before submitting each entry, verify:
- [ ] Coordinates are precise (verified on Google Maps)
- [ ] Spotify URI is correct format and verified
- [ ] Description is 150+ words with rich detail
- [ ] Connection type is clear and accurate
- [ ] YouTube ID is correct (11 characters)
- [ ] Location is specific (street address when possible, not just "Paris")

## Bonus Points For

- Lesser-known songs with fascinating location stories
- Non-English language songs
- Underground/indie artists with location connections
- Recent songs (2020s) with identifiable locations
- Historical locations that have changed dramatically
- Locations you can actually visit today
- Multiple songs for the same interesting location
- Connections that tell a bigger cultural story

---

## DELIVERABLES

Provide your research as:
1. A numbered list of 50+ songs in the format above
2. Group by region/continent for easy navigation
3. Include a summary of how many songs per country/region

Start with your research now!

---

## After You Get Results

Once you have the AI output:
1. Verify a sample of Spotify URIs by pasting them into Spotify
2. Spot-check coordinates on Google Maps
3. Review descriptions for accuracy
4. Import to the app using the admin panel or database scripts

---

## Technical Notes for Import

The database schema expects:
- `id`: Auto-generated or use format "user-[timestamp]"
- `title`: Song title
- `artist`: Artist name
- `album`: Album name (optional)
- `spotify_uri`: Format "spotify:track:XXXX"
- `youtube_id`: Just the 11-char ID, not full URL
- `latitude`: Decimal degrees (e.g., 51.5074)
- `longitude`: Decimal degrees (e.g., -0.1278)
- `location_name`: Short name for display
- `location_description`: The rich description text
- `tags`: Array of strings
- `status`: "live" for published songs
