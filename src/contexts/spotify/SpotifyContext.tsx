import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { spotifyAuth } from '@/services/spotify/auth';
import { spotifyPlayer, PlayerState } from '@/services/spotify/player';

interface SpotifyContextType {
  client: SpotifyApi | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  playerState: PlayerState;
  connectSpotify: () => Promise<void>;
  logout: () => void;
  updateAuthenticationState: (isAuth: boolean, error?: string | null) => void;
  playTrack: (trackUri: string) => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  togglePlayback: () => Promise<void>;
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
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    isLoading: false,
    deviceId: null,
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    error: null,
    isPremium: false,
  });

  // Initialize player when authenticated
  useEffect(() => {
    if (isAuthenticated && client) {
      const initializePlayer = async () => {
        try {
          await spotifyPlayer.initialize(async () => {
            const token = await client.getAccessToken();
            if (!token) {
              throw new Error('No access token available');
            }
            return token.access_token;
          });

          // Subscribe to player state changes
          const unsubscribe = spotifyPlayer.onStateChange(newState => {
            setPlayerState(newState);
          });

          return unsubscribe;
        } catch (error) {
          console.error('Failed to initialize Spotify player:', error);
        }
      };

      initializePlayer();
    }

    return () => {
      // Cleanup when component unmounts or authentication changes
      if (!isAuthenticated) {
        spotifyPlayer.cleanup();
      }
    };
  }, [isAuthenticated, client]);

  useEffect(() => {
    console.log('🔄 SpotifyContext: Initializing Spotify client...');
    const spotifyClient = spotifyAuth.getClient();
    setClient(spotifyClient);

    const initializeAuth = async () => {
      // Check if we're returning from Spotify auth (has code or access_token in URL)
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthCallback = urlParams.has('code') || urlParams.has('access_token');

      if (hasAuthCallback) {
        setIsConnecting(true);

        try {
          // The SDK should automatically handle the callback
          await spotifyClient.currentUser.profile();
          setIsAuthenticated(true);
          setError(null);

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

        // DEBUG: Log ALL localStorage keys to see what's actually there
        const allKeys = Object.keys(localStorage);

        // DEBUG: Log all Spotify-related keys with their values
        const spotifyKeys = allKeys.filter(key => key.toLowerCase().includes('spotify'));
        console.log('🔍 All Spotify-related keys:', spotifyKeys);

        // Optimistic authentication detection
        // We assume authentication exists if we find reasonable token-like data
        // If tokens are invalid, we'll handle that when they're actually used
        let hasValidTokens = false;

        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        console.log('🔍 Client ID:', clientId);

        // Check for common Spotify SDK patterns with basic validation
        const possibleTokenKeys = [
          `spotify-sdk:${clientId}:token`,
          `spotify-sdk:${clientId}:access_token`,
          `spotifyToken:${clientId}`,
          `spotify_token_${clientId}`,
          'spotify-access-token',
          'spotifyAccessToken',
        ];

        // Check known patterns with basic validation
        for (const tokenKey of possibleTokenKeys) {
          const token = localStorage.getItem(tokenKey);
          if (token && token.trim().length > 20) {
            // Basic validation: token should be reasonably long and not obviously corrupted
            if (!token.includes('undefined') && !token.includes('null') && token.length > 20) {
              console.log(`✅ Found reasonable token with key: ${tokenKey}`);
              hasValidTokens = true;
              break;
            }
          }
        }

        // If no known patterns found, check any spotify keys for token-like content
        if (!hasValidTokens && spotifyKeys.length > 0) {
          console.log('🔍 Checking for token-like patterns in Spotify keys...');
          for (const key of spotifyKeys) {
            const value = localStorage.getItem(key);
            console.log(`🔍 Key: ${key}, Value length: ${value?.length}`);

            // Very basic validation: looks like it could be a token
            if (
              value &&
              value.trim().length > 20 &&
              !value.includes('undefined') &&
              !value.includes('null') &&
              !value.includes('{}') &&
              (value.includes('.') || value.startsWith('BQ') || value.length > 50)
            ) {
              console.log(`✅ Found token-like content with key: ${key}`);
              hasValidTokens = true;
              break;
            }
          }
        }

        if (hasValidTokens) {
          setIsAuthenticated(true);
          setError(null);
          console.log(
            '✅ SpotifyContext: Found authentication tokens, assuming valid until proven otherwise.'
          );
        } else {
          setIsAuthenticated(false);
          setError(null);
          console.log('ℹ️ SpotifyContext: No authentication tokens found.');
        }
      } catch {
        // This is expected for users who haven't authenticated yet
        setIsAuthenticated(false);
        setError(null);
        console.log(
          'ℹ️ SpotifyContext: Error checking authentication, assuming not authenticated.'
        );
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
    } catch (err) {
      console.error('❌ SpotifyContext: Error during authentication:', err);

      // If this fails, it could be because:
      // 1. No tokens exist (expected) - should redirect to auth
      // 2. Tokens are malformed/corrupted - need to clear them first

      // Clear potentially corrupted tokens and recreate client
      console.log(
        '🧹 SpotifyContext: Clearing potentially corrupted tokens and recreating client...'
      );

      // Clear all Spotify-related localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('spotify') || key.includes('Spotify'))) {
          keysToRemove.push(key);
        }
      }

      console.log('🧹 Clearing Spotify-related localStorage keys:', keysToRemove);
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Recreate client with clean state
      const newClient = spotifyAuth.getClient(true);
      setClient(newClient);

      try {
        console.log('🔄 SpotifyContext: Retrying authentication with clean client...');
        // Try again with clean client - this should trigger redirect to Spotify auth
        await newClient.currentUser.profile();

        // If we reach here, authentication worked
        setIsAuthenticated(true);
        setError(null);
        console.log('✅ SpotifyContext: Authentication successful after cleanup.');
      } catch {
        console.log('🔄 SpotifyContext: Auth flow initiated, waiting for redirect callback...');
        // This is expected - the SDK should redirect to Spotify auth
        setError(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    console.log('🔄 Logging out from Spotify...');
    setError(null);
    setIsAuthenticated(false);

    // Cleanup player
    spotifyPlayer.cleanup();

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

  const playTrack = async (trackUri: string) => {
    try {
      await spotifyPlayer.playTrack(trackUri);
    } catch (error) {
      console.error('Error playing track:', error);
      setError(error instanceof Error ? error.message : 'Failed to play track');
    }
  };

  const pausePlayback = async () => {
    try {
      await spotifyPlayer.pause();
    } catch (error) {
      console.error('Error pausing playback:', error);
      setError(error instanceof Error ? error.message : 'Failed to pause playback');
    }
  };

  const resumePlayback = async () => {
    try {
      await spotifyPlayer.resume();
    } catch (error) {
      console.error('Error resuming playback:', error);
      setError(error instanceof Error ? error.message : 'Failed to resume playback');
    }
  };

  const togglePlayback = async () => {
    try {
      await spotifyPlayer.togglePlay();
    } catch (error) {
      console.error('Error toggling playback:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle playback');
    }
  };

  const value: SpotifyContextType = {
    client,
    isConnecting,
    isAuthenticated,
    error,
    playerState,
    connectSpotify,
    logout,
    updateAuthenticationState,
    playTrack,
    pausePlayback,
    resumePlayback,
    togglePlayback,
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};
