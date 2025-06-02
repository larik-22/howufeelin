import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { spotifyAuth } from '@/services/spotify/auth';

interface SpotifyContextType {
  client: SpotifyApi | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  connectSpotify: () => Promise<void>;
  logout: () => void;
  updateAuthenticationState: (isAuth: boolean, error?: string | null) => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};

interface SpotifyProviderProps {
  children: ReactNode;
}

export const SpotifyProvider = ({ children }: SpotifyProviderProps) => {
  const [client, setClient] = useState<SpotifyApi | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 SpotifyContext: Initializing and checking existing authentication...');
    const spotifyClient = spotifyAuth.getClient();
    setClient(spotifyClient);

    const checkAuthStatus = async () => {
      try {
        // This API call attempts to use existing tokens (incl. silent refresh by SDK).
        // If successful, user is already authenticated.
        await spotifyClient.currentUser.profile();
        setIsAuthenticated(true);
        setError(null); // Clear any previous errors like "user not authenticated"
        console.log(
          '✅ SpotifyContext: User is ALREADY AUTHENTICATED (valid token found/refreshed).'
        );
      } catch {
        // This error means the SDK couldn't get a profile silently (no valid token or refresh failed).
        // This is expected for new users or if tokens truly expired.
        setIsAuthenticated(false);
        console.log(
          'ℹ️ SpotifyContext: User NOT AUTHENTICATED or token expired (currentUser.profile failed silently).'
        );
        // Do not set a global error here as this is an initial state discovery.
      }
    };

    checkAuthStatus();
  }, []);

  const connectSpotify = async () => {
    if (!client) {
      setError('Spotify client not initialized yet.');
      console.error('Attempted to connect before Spotify client was initialized.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      console.log(
        '🔄 SpotifyContext: connectSpotify called. Attempting profile fetch (will redirect if needed)...'
      );
      // This API call will trigger the SDK's auth flow (redirect) if not already authenticated
      // or if tokens from localStorage were invalid/expired and couldn't be silently refreshed by the initial check.
      await client.currentUser.profile();
      setIsAuthenticated(true); // Success!
      setError(null);
      console.log('✅ SpotifyContext: connectSpotify - Authentication successful.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Spotify.';
      console.error(
        '❌ SpotifyContext: connectSpotify - Error during authentication attempt:',
        err
      );
      setError(errorMessage);
      setIsAuthenticated(false); // Ensure auth state is false if connection attempt fails
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    console.log('🔄 Logging out from Spotify...');
    setError(null);
    setIsAuthenticated(false);

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (clientId) {
      const keysToClear = [
        `spotify-sdk:${clientId}:token`,
        `spotify-sdk:${clientId}:refresh_token`,
        `spotify-sdk:${clientId}:expires_at`,
        `spotify-sdk:${clientId}:code_verifier`,
        `spotify-sdk:${clientId}:state`,
      ];
      console.log('🧹 Clearing known Spotify SDK localStorage keys:', keysToClear);
      keysToClear.forEach(key => localStorage.removeItem(key));

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('spotify-sdk:') && key.includes(clientId)) {
          console.log('🧹 Clearing additional SDK-like key:', key);
          localStorage.removeItem(key);
        }
      }
    } else {
      console.warn('⚠️ Spotify Client ID not found, cannot clear specific SDK tokens.');
    }

    const newClient = spotifyAuth.getClient(true); // forceRecreate = true
    setClient(newClient);

    console.log('🔓 Logged out from Spotify and client has been reset.');
  };

  const updateAuthenticationState = (isAuth: boolean, authError?: string | null) => {
    if (isAuthenticated === isAuth) return; // Avoid redundant updates

    if (isAuth) {
      console.log('ℹ️ SpotifyContext: Authentication confirmed by component.');
      setIsAuthenticated(true);
      setError(null);
    } else {
      console.log('ℹ️ SpotifyContext: Authentication failed or lost, reported by component.');
      setIsAuthenticated(false);
      if (authError) {
        setError(authError);
      }
    }
  };

  const value: SpotifyContextType = {
    client,
    isConnecting,
    isAuthenticated,
    error,
    connectSpotify,
    logout,
    updateAuthenticationState,
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};
