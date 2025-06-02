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
   * Create and return Spotify client - let the SDK handle everything
   */
  getClient(): SpotifyApi {
    if (!this.client) {
      console.log('🔄 Creating Spotify client...');
      this.client = SpotifyApi.withUserAuthorization(CLIENT_ID, REDIRECT_URI, SCOPES);
      console.log('✅ Spotify client created successfully');
    }
    return this.client;
  }

  /**
   * Start authentication flow - this will redirect if needed
   */
  async authenticate(): Promise<void> {
    console.log('🔄 Starting Spotify authentication...');

    // The SDK will handle the authentication flow automatically when API calls are made
    // We don't need to immediately call an API here - let the components do that
    console.log('✅ Spotify client ready for authentication!');
  }

  /**
   * Logs out from Spotify
   */
  logout(): void {
    this.client = null;
    // Clear any Spotify tokens from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('spotify')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🔓 Spotify: Logged out');
  }
}

export const spotifyAuth = SpotifyAuthService.getInstance();
