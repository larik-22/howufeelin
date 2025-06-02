import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { spotifyAuth } from '@/services/spotify/auth';

interface SpotifyContextType {
  client: SpotifyApi | null;
  isConnecting: boolean;
  error: string | null;
  connectSpotify: () => Promise<void>;
  logout: () => void;
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
  const [error, setError] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log('🔍 Checking for existing Spotify authentication...');

        // Try to get existing client
        const spotifyClient = spotifyAuth.getClient();
        console.log('📱 Spotify client:', spotifyClient);

        // Test if we can make an authenticated API call
        const profile = await spotifyClient.currentUser.profile();
        console.log('👤 Spotify profile:', profile);

        // If we get here, authentication is valid
        setClient(spotifyClient);
        console.log('✅ Existing Spotify authentication found and restored!');
      } catch (error) {
        console.log('ℹ️ No existing Spotify authentication found:', error);
        // This is normal if user hasn't authenticated yet
        setClient(null);
      }
    };

    checkExistingAuth();
  }, []);

  const connectSpotify = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔄 User clicked Connect Spotify...');

      // Get client and start authentication - this will redirect
      const spotifyClient = spotifyAuth.getClient();
      await spotifyAuth.authenticate();

      // If we reach here, authentication was successful
      setClient(spotifyClient);
      console.log('✅ Spotify connection successful!');
    } catch (err) {
      // If authentication fails or redirects, we'll handle it
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
    console.log('🔓 Logged out from Spotify');
  };

  const value: SpotifyContextType = {
    client,
    isConnecting,
    error,
    connectSpotify,
    logout,
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};
