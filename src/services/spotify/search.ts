import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  albumImageUrl: string | null;
  uri: string;
  previewUrl: string | null;
  duration: number;
}

export class SpotifySearchService {
  constructor(private client: SpotifyApi) {}

  /**
   * Search for tracks on Spotify
   */
  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const results = await this.client.search(query, ['track'], 'US', limit as 10);

      return results.tracks.items.map(track => this.mapTrackToSimplified(track));
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      throw new Error('Failed to search tracks');
    }
  }

  /**
   * Get user's recently played tracks
   */
  async getRecentlyPlayed(limit: number = 10): Promise<SpotifyTrack[]> {
    try {
      const results = await this.client.player.getRecentlyPlayedTracks(limit as 10);

      return results.items.map(item => this.mapTrackToSimplified(item.track));
    } catch (error) {
      console.error('Error getting recently played tracks:', error);
      throw new Error('Failed to get recently played tracks');
    }
  }

  /**
   * Get user's top tracks
   */
  async getTopTracks(limit: number = 10): Promise<SpotifyTrack[]> {
    try {
      const results = await this.client.currentUser.topItems('tracks', 'short_term', limit as 10);

      return results.items.map(track => this.mapTrackToSimplified(track as Track));
    } catch (error) {
      console.error('Error getting top tracks:', error);
      throw new Error('Failed to get top tracks');
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
    };
  }
}
