import { SpotifyApi } from '@spotify/web-api-ts-sdk';

// Get environment variables
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

// Scopes needed for our app
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'playlist-read-private',
  'user-top-read',
  'user-read-recently-played',
];

export class SpotifyAuthService {
  private static instance: SpotifyAuthService;
  private client: SpotifyApi | null = null;

  private constructor() {}

  static getInstance(): SpotifyAuthService {
    if (!SpotifyAuthService.instance) {
      SpotifyAuthService.instance = new SpotifyAuthService();
    }
    return SpotifyAuthService.instance;
  }

  /**
   * Create and return Spotify client - the SDK handles all authentication automatically.
   * Can optionally force re-creation of the client instance.
   */
  getClient(forceRecreate: boolean = false): SpotifyApi {
    if (!this.client || forceRecreate) {
      if (this.client && forceRecreate) {
        console.log('🔄 Re-creating Spotify client instance due to forceRecreate flag.');
      } else if (!this.client) {
        console.log('🔄 Creating new Spotify client instance...');
      }
      // The SDK automatically handles token persistence, refresh, and authentication flows
      this.client = SpotifyApi.withUserAuthorization(CLIENT_ID, REDIRECT_URI, SCOPES);
      console.log('✅ Spotify client instance ready.');
    }
    return this.client;
  }
}

export const spotifyAuth = SpotifyAuthService.getInstance();
