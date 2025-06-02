import { SpotifyApi, Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  albumImageUrl: string | null;
  uri: string;
  previewUrl: string | null;
  duration: number;
  popularity?: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  trackCount: number;
  uri: string;
}

export interface SearchResults {
  tracks: SpotifyTrack[];
  total: number;
  hasMore: boolean;
  offset: number;
}

export interface PlaylistTracksResult {
  tracks: SpotifyTrack[];
  total: number;
  hasMore: boolean;
  offset: number;
}

export class SpotifySearchService {
  constructor(private client: SpotifyApi) {}

  /**
   * Search for tracks with pagination
   */
  async searchTracks(
    query: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        tracks: [],
        total: 0,
        hasMore: false,
        offset: 0,
      };
    }

    try {
      const results = await this.client.search(query, ['track'], 'US', Math.min(50, limit) as 50);

      return {
        tracks: results.tracks.items.map(track => this.mapTrackToSimplified(track)),
        total: results.tracks.total,
        hasMore: offset + limit < results.tracks.total,
        offset,
      };
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      throw new Error('Failed to search tracks');
    }
  }

  /**
   * Get user's recently played tracks with pagination
   */
  async getRecentlyPlayed(limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const results = await this.client.player.getRecentlyPlayedTracks(Math.min(50, limit) as 50);
      return results.items.map(item => this.mapTrackToSimplified(item.track));
    } catch (error) {
      console.error('Error getting recently played tracks:', error);
      throw new Error('Failed to get recently played tracks');
    }
  }

  /**
   * Get user's top tracks with pagination and time range
   */
  async getTopTracks(
    limit: number = 20,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term'
  ): Promise<SpotifyTrack[]> {
    try {
      const results = await this.client.currentUser.topItems(
        'tracks',
        timeRange,
        Math.min(50, limit) as 50
      );
      return results.items.map(track => this.mapTrackToSimplified(track as Track));
    } catch (error) {
      console.error('Error getting top tracks:', error);
      throw new Error('Failed to get top tracks');
    }
  }

  /**
   * Get user's saved tracks with pagination
   */
  async getSavedTracks(limit: number = 20, offset: number = 0): Promise<SearchResults> {
    try {
      const results = await this.client.currentUser.tracks.savedTracks(
        Math.min(50, limit) as 50,
        offset
      );

      return {
        tracks: results.items.map(item => this.mapTrackToSimplified(item.track)),
        total: results.total,
        hasMore: offset + limit < results.total,
        offset,
      };
    } catch (error) {
      console.error('Error getting saved tracks:', error);
      throw new Error('Failed to get saved tracks');
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ playlists: SpotifyPlaylist[]; total: number; hasMore: boolean }> {
    try {
      const results = await this.client.currentUser.playlists.playlists(
        Math.min(50, limit) as 50,
        offset
      );

      return {
        playlists: results.items.map(playlist => this.mapPlaylistToSimplified(playlist)),
        total: results.total,
        hasMore: offset + limit < results.total,
      };
    } catch (error) {
      console.error('Error getting user playlists:', error);
      throw new Error('Failed to get playlists');
    }
  }

  /**
   * Get tracks from a specific playlist
   */
  async getPlaylistTracks(
    playlistId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PlaylistTracksResult> {
    try {
      const results = await this.client.playlists.getPlaylistItems(
        playlistId,
        'US',
        undefined,
        Math.min(50, limit) as 50,
        offset
      );

      const tracks = results.items
        .filter(item => item.track && item.track.type === 'track')
        .map(item => this.mapTrackToSimplified(item.track as Track));

      return {
        tracks,
        total: results.total,
        hasMore: offset + limit < results.total,
        offset,
      };
    } catch (error) {
      console.error('Error getting playlist tracks:', error);
      throw new Error('Failed to get playlist tracks');
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      // Get quick search results for suggestions
      const results = await this.client.search(query, ['track', 'artist'], 'US', 5);
      const suggestions = new Set<string>();

      // Add artist names
      results.artists?.items.forEach(artist => {
        suggestions.add(artist.name);
      });

      // Add track names
      results.tracks?.items.forEach(track => {
        suggestions.add(track.name);
        track.artists.forEach(artist => suggestions.add(artist.name));
      });

      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Map Spotify track object to simplified format
   */
  private mapTrackToSimplified(track: Track): SpotifyTrack {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      albumImageUrl: track.album.images[0]?.url || null,
      uri: track.uri,
      previewUrl: track.preview_url,
      duration: track.duration_ms,
      popularity: track.popularity,
    };
  }

  /**
   * Map Spotify playlist object to simplified format
   */
  private mapPlaylistToSimplified(playlist: SimplifiedPlaylist): SpotifyPlaylist {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      imageUrl: playlist.images[0]?.url || null,
      trackCount: playlist.tracks?.total || 0,
      uri: playlist.uri,
    };
  }
}
