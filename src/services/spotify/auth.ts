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
    const client = this.getClient();

    // This will automatically redirect to Spotify if not authenticated
    await client.currentUser.profile();

    console.log('✅ Spotify authentication completed!');
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
