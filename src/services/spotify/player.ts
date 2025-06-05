// Global Spotify Web Playback SDK type declaration
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: SpotifyPlayerConstructor;
    };
  }
}

export interface SpotifyPlayerConstructor {
  new (options: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }): SpotifyPlayer;
}

export interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata?: Record<string, unknown>;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ name: string; uri: string }>;
  album: {
    name: string;
    uri: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
}

export interface SpotifyError {
  message: string;
}

export interface SpotifyPlayer {
  addListener(
    event: 'ready' | 'not_ready',
    callback: (data: { device_id: string }) => void
  ): boolean;

  addListener(event: 'initialization_error', callback: (data: SpotifyError) => void): boolean;
  addListener(event: 'authentication_error', callback: (data: SpotifyError) => void): boolean;
  addListener(event: 'account_error', callback: (data: SpotifyError) => void): boolean;
  addListener(event: 'playback_error', callback: (data: SpotifyError) => void): boolean;

  addListener(
    event: 'player_state_changed',
    callback: (state: SpotifyPlaybackState | null) => void
  ): boolean;

  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  getVolume(): Promise<number>;
  nextTrack(): Promise<void>;
  pause(): Promise<void>;
  previousTrack(): Promise<void>;
  resume(): Promise<void>;
  seek(position: number): Promise<void>;
  setName(name: string): Promise<void>;
  setVolume(volume: number): Promise<void>;
  togglePlay(): Promise<void>;
}

export interface PlayerState {
  isReady: boolean;
  isLoading: boolean;
  deviceId: string | null;
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  error: string | null;
  isPremium: boolean;
}

export interface SpotifyPlayerService {
  initialize: (getAccessToken: () => Promise<string>) => Promise<void>;
  playTrack: (trackUri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getState: () => PlayerState;
  cleanup: () => void;
  onStateChange: (callback: (state: PlayerState) => void) => () => void;
}

class SpotifyPlayerServiceImpl implements SpotifyPlayerService {
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private state: PlayerState = {
    isReady: false,
    isLoading: false,
    deviceId: null,
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    error: null,
    isPremium: false,
  };
  private stateChangeCallbacks: ((state: PlayerState) => void)[] = [];
  private accessTokenGetter: (() => Promise<string>) | null = null;
  private sdkLoadPromise: Promise<void> | null = null;

  private emitStateChange() {
    this.stateChangeCallbacks.forEach(callback => callback({ ...this.state }));
  }

  private async loadSpotifySDK(): Promise<void> {
    if (this.sdkLoadPromise) {
      return this.sdkLoadPromise;
    }

    this.sdkLoadPromise = new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.Spotify?.Player) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="sdk.scdn.co"]');
      if (existingScript) {
        // Script exists, wait for it to load
        window.onSpotifyWebPlaybackSDKReady = () => {
          console.log('✅ Spotify Web Playback SDK loaded');
          resolve();
        };
        return;
      }

      // Load the SDK script
      console.log('🔄 Loading Spotify Web Playback SDK...');
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('📦 Spotify Web Playback SDK script loaded');
      };

      script.onerror = () => {
        reject(new Error('Failed to load Spotify Web Playback SDK'));
      };

      // Set up the ready callback
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify Web Playback SDK ready');
        resolve();
      };

      document.head.appendChild(script);
    });

    return this.sdkLoadPromise;
  }

  async initialize(getAccessToken: () => Promise<string>): Promise<void> {
    if (this.player) {
      console.log('ℹ️ Spotify player already initialized');
      return;
    }

    this.accessTokenGetter = getAccessToken;
    this.state.isLoading = true;
    this.state.error = null;
    this.emitStateChange();

    try {
      // Load the SDK
      await this.loadSpotifySDK();

      // Create player instance
      console.log('🔄 Creating Spotify Web Player...');
      this.player = new window.Spotify.Player({
        name: 'HowUFeel Player',
        getOAuthToken: (cb: (token: string) => void) => {
          if (this.accessTokenGetter) {
            this.accessTokenGetter()
              .then(token => cb(token))
              .catch(error => {
                console.error('❌ Failed to get access token:', error);
                this.state.error = 'Failed to get access token';
                this.emitStateChange();
              });
          } else {
            console.error('❌ No access token getter available');
            this.state.error = 'No access token getter available';
            this.emitStateChange();
          }
        },
        volume: 0.5,
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to the player
      const connected = await this.player.connect();
      if (!connected) {
        throw new Error('Failed to connect to Spotify player');
      }

      console.log('✅ Spotify Web Player connected');
    } catch (error) {
      console.error('❌ Failed to initialize Spotify player:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to initialize player';
      this.state.isLoading = false;
      this.emitStateChange();
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.player) return;

    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      console.log('✅ Spotify player ready with Device ID:', device_id);
      this.deviceId = device_id;
      this.state.deviceId = device_id;
      this.state.isReady = true;
      this.state.isLoading = false;
      this.state.isPremium = true; // If we get here, user has premium
      this.state.error = null;
      this.emitStateChange();
    });

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('❌ Spotify player not ready with Device ID:', device_id);
      this.state.isReady = false;
      this.emitStateChange();
    });

    // Initialization Error
    this.player.addListener('initialization_error', ({ message }) => {
      console.error('❌ Spotify player initialization error:', message);
      this.state.error = `Initialization error: ${message}`;
      this.state.isLoading = false;
      this.emitStateChange();
    });

    // Authentication Error
    this.player.addListener('authentication_error', ({ message }) => {
      console.error('❌ Spotify player authentication error:', message);
      this.state.error = `Authentication error: ${message}`;
      this.state.isLoading = false;
      this.emitStateChange();
    });

    // Account Error (typically means no premium)
    this.player.addListener('account_error', ({ message }) => {
      console.error('❌ Spotify player account error:', message);
      this.state.error = `Account error: ${message}. Premium subscription required.`;
      this.state.isPremium = false;
      this.state.isLoading = false;
      this.emitStateChange();
    });

    // Playback Error
    this.player.addListener('playback_error', ({ message }) => {
      console.error('❌ Spotify player playback error:', message);
      this.state.error = `Playback error: ${message}`;
      this.emitStateChange();
    });

    // Player State Changed
    this.player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
      if (state) {
        console.log('🔄 Player state changed:', state);
        this.state.currentTrack = state.track_window.current_track;
        this.state.isPlaying = !state.paused;
        this.state.position = state.position;
        this.state.duration = state.track_window.current_track?.duration_ms || 0;
        this.state.error = null;
        this.emitStateChange();
      } else {
        console.log('🔄 Player state is null');
        this.state.currentTrack = null;
        this.state.isPlaying = false;
        this.state.position = 0;
        this.state.duration = 0;
        this.emitStateChange();
      }
    });
  }

  async playTrack(trackUri: string): Promise<void> {
    if (!this.deviceId || !this.accessTokenGetter) {
      throw new Error('Player not ready or no access token available');
    }

    try {
      const accessToken = await this.accessTokenGetter();

      // Use Spotify Web API to start playback on our device
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      console.log('✅ Track playback started:', trackUri);
    } catch (error) {
      console.error('❌ Failed to play track:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to play track';
      this.emitStateChange();
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    try {
      await this.player.pause();
      console.log('⏸️ Playback paused');
    } catch (error) {
      console.error('❌ Failed to pause:', error);
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    try {
      await this.player.resume();
      console.log('▶️ Playback resumed');
    } catch (error) {
      console.error('❌ Failed to resume:', error);
      throw error;
    }
  }

  async togglePlay(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    try {
      await this.player.togglePlay();
      console.log('⏯️ Playback toggled');
    } catch (error) {
      console.error('❌ Failed to toggle play:', error);
      throw error;
    }
  }

  async seek(position: number): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    try {
      await this.player.seek(position);
      console.log('⏭️ Seeked to:', position);
    } catch (error) {
      console.error('❌ Failed to seek:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    try {
      await this.player.setVolume(volume);
      console.log('🔊 Volume set to:', volume);
    } catch (error) {
      console.error('❌ Failed to set volume:', error);
      throw error;
    }
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  onStateChange(callback: (state: PlayerState) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  cleanup(): void {
    if (this.player) {
      console.log('🧹 Cleaning up Spotify player...');
      this.player.disconnect();
      this.player = null;
    }

    this.deviceId = null;
    this.accessTokenGetter = null;
    this.stateChangeCallbacks = [];
    this.state = {
      isReady: false,
      isLoading: false,
      deviceId: null,
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      error: null,
      isPremium: false,
    };
  }
}

// Singleton instance
export const spotifyPlayer = new SpotifyPlayerServiceImpl();
