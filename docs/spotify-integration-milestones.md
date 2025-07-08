# Spotify Integration Milestones

## Overview

Adding Spotify integration to allow users to select an optional "song of the day" alongside their mood rating.

## Milestone 1: Spotify Authorization Flow Configuration ✅

**Status: COMPLETED**

### What was implemented:

1. **Spotify SDK Installation**: Added `@spotify/web-api-ts-sdk` package
2. **Authentication Service**: Created `SpotifyAuthService` with PKCE flow
3. **React Context**: Created `SpotifyProvider` and `useSpotify` hook for state management
4. **OAuth Callback**: Added `/spotify/callback` route and `SpotifyCallback` component
5. **UI Component**: Created `SpotifyAuthButton` for testing authentication
6. **Integration**: Added SpotifyProvider to app and test button to MoodInput

### Files created/modified:

- `src/services/spotify/auth.ts` - Authentication service
- `src/contexts/spotify/SpotifyContext.tsx` - React context for Spotify state
- `src/pages/SpotifyCallback.tsx` - OAuth callback page
- `src/components/spotify/SpotifyAuthButton.tsx` - Test auth button
- `src/router.tsx` - Added callback route
- `src/layouts/RootLayout.tsx` - Added SpotifyProvider
- `src/components/mood/MoodInput.tsx` - Added test button

### Environment Variables Required:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify/callback
```

### Testing:

- Run `npm run dev`
- Navigate to mood input page
- Click "Connect Spotify" button
- Should redirect to Spotify authorization
- After authorization, should redirect back and show "Connected to Spotify"

---

## Milestone 2: Spotify API Integration & Song Search

**Status: PLANNED**

### Goals:

1. Create song search functionality
2. Add song selection UI component
3. Implement recently played tracks
4. Add user's top tracks suggestions

### Components to create:

- `SongSearchInput` - Search and select songs
- `SongCard` - Display song with preview
- `SpotifyTrackList` - List of suggested tracks

---

## Milestone 3: Database Schema Updates for Song Storage

**Status: PLANNED**

### Goals:

1. Update ratings collection to include Spotify track data
2. Add song metadata fields
3. Update types and interfaces

### Schema changes:

```typescript
interface Rating {
  // ... existing fields
  songOfTheDay?: {
    spotifyId: string;
    name: string;
    artists: string[];
    album: string;
    albumImageUrl?: string;
    uri: string;
    previewUrl?: string;
  };
}
```

---

## Milestone 4: UI Integration with MoodInput Component

**Status: PLANNED**

### Goals:

1. Replace test button with full song selection UI
2. Update mood submission to include song data
3. Add song display in ratings history

---

## Milestone 5: Enhanced Features

**Status: PLANNED**

### Goals:

1. Song preview playback
2. Analytics with music data
3. Group playlist generation from daily songs
4. Music-based mood insights
