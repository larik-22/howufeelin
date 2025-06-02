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
  updateAuthenticationState: (isAuth: boolean) => void;
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

  // Check if user is actually authenticated by making an API call
  const verifyAuthentication = async (spotifyClient: SpotifyApi): Promise<boolean> => {
    try {
      await spotifyClient.currentUser.profile();
      return true;
    } catch {
      return false;
    }
  };

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log('🔍 Checking for existing Spotify authentication...');

        // Try to get existing client
        const spotifyClient = spotifyAuth.getClient();
        console.log('📱 Spotify client:', spotifyClient);

        // Test if we can make an authenticated API call
        const isAuth = await verifyAuthentication(spotifyClient);

        if (isAuth) {
          // If we get here, authentication is valid
          setClient(spotifyClient);
          setIsAuthenticated(true);
          console.log('✅ Existing Spotify authentication found and restored!');
        } else {
          setClient(null);
          setIsAuthenticated(false);
          console.log('ℹ️ No existing Spotify authentication found');
        }
      } catch (error) {
        console.log('ℹ️ No existing Spotify authentication found:', error);
        // This is normal if user hasn't authenticated yet
        setClient(null);
        setIsAuthenticated(false);
      }
    };

    checkExistingAuth();
  }, []);

  const connectSpotify = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔄 User clicked Connect Spotify...');

      // Get client and prepare for authentication
      const spotifyClient = spotifyAuth.getClient();
      await spotifyAuth.authenticate();

      // Set the client first
      setClient(spotifyClient);

      // The actual authentication (redirect) will happen when components make API calls
      // For now, we'll mark as not authenticated until a successful API call
      setIsAuthenticated(false);
      console.log('✅ Spotify client ready for use!');
    } catch (err) {
      // If there's an error setting up the client
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Spotify';
      setError(errorMessage);
      console.error('❌ Spotify connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    spotifyAuth.logout();
    setClient(null);
    setError(null);
    setIsAuthenticated(false);
    console.log('🔓 Logged out from Spotify');
  };

  const updateAuthenticationState = (isAuth: boolean) => {
    setIsAuthenticated(isAuth);
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
