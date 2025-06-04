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
    console.log('🔄 SpotifyContext: Initializing Spotify client...');
    const spotifyClient = spotifyAuth.getClient();
    setClient(spotifyClient);

    const initializeAuth = async () => {
      // Check if we're returning from Spotify auth (has code or access_token in URL)
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthCallback = urlParams.has('code') || urlParams.has('access_token');

      if (hasAuthCallback) {
        console.log(
          '🔄 SpotifyContext: Detected auth callback, attempting to complete authentication...'
        );
        setIsConnecting(true);

        try {
          // The SDK should automatically handle the callback
          await spotifyClient.currentUser.profile();
          setIsAuthenticated(true);
          setError(null);
          console.log('✅ SpotifyContext: Authentication completed successfully from callback.');

          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (err) {
          console.error('❌ SpotifyContext: Failed to complete authentication from callback:', err);
          setIsAuthenticated(false);
          setError('Failed to complete authentication');
        } finally {
          setIsConnecting(false);
        }
        return;
      }

      // If no callback, check for existing authentication silently
      try {
        console.log('🔄 SpotifyContext: Checking for existing authentication...');

        // Check for existing tokens in localStorage WITHOUT making API calls
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        if (clientId) {
          const tokenKey = `spotify-sdk:${clientId}:token`;
          const expiresAtKey = `spotify-sdk:${clientId}:expires_at`;

          const storedToken = localStorage.getItem(tokenKey);
          const expiresAt = localStorage.getItem(expiresAtKey);

          if (storedToken && expiresAt) {
            const expirationTime = parseInt(expiresAt, 10);
            const currentTime = Date.now();

            // Check if token is not expired (with 5 minute buffer)
            if (expirationTime > currentTime + 5 * 60 * 1000) {
              setIsAuthenticated(true);
              setError(null);
              console.log('✅ SpotifyContext: Found valid stored authentication tokens.');
              return;
            } else {
              console.log('ℹ️ SpotifyContext: Stored tokens expired.');
            }
          } else {
            console.log('ℹ️ SpotifyContext: No stored tokens found.');
          }
        }

        // If we get here, no valid tokens were found
        setIsAuthenticated(false);
        setError(null);
        console.log('ℹ️ SpotifyContext: No existing authentication found.');
      } catch {
        // This is expected for users who haven't authenticated yet
        setIsAuthenticated(false);
        setError(null);
        console.log('ℹ️ SpotifyContext: No existing authentication found.');
      }
    };

    initializeAuth();
  }, []);

  const connectSpotify = async () => {
    if (!client) {
      setError('Spotify client not initialized yet.');
      console.error('Attempted to connect before Spotify client was initialized.');
      return;
    }

    // If already authenticated, no need to do anything
    if (isAuthenticated) {
      console.log('ℹ️ SpotifyContext: Already authenticated, no action needed.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔄 SpotifyContext: Starting authentication flow...');

      // This will either:
      // 1. Work silently if valid tokens exist (shouldn't happen since we checked above)
      // 2. Trigger redirect to Spotify auth for user authorization
      await client.currentUser.profile();

      // If we reach here without redirect, authentication was successful
      setIsAuthenticated(true);
      setError(null);
      console.log('✅ SpotifyContext: Authentication successful.');
    } catch {
      // If this fails, it might be because we're being redirected
      // The actual auth completion will happen when user returns
      console.log('🔄 SpotifyContext: Auth flow initiated, waiting for redirect callback...');
      setError(null);
      setIsAuthenticated(false);
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
