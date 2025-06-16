/* eslint-disable @typescript-eslint/no-explicit-any */
export class SpotifyService {
    private env: Env
    private accessToken: string
    private refreshToken: string
    private baseUrl = 'https://api.spotify.com/v1'

    constructor(env: Env, accessToken: string, refreshToken: string) {
        this.env = env
        this.accessToken = accessToken
        this.refreshToken = refreshToken
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            })

            if (response.status === 401) {
                // Token expired, try to refresh
                await this.refreshAccessToken()
                
                // Retry the request with new token
                return fetch(url, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        ...options.headers,
                    }
                }).then(res => res.json())
            }

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
            }

            return response.json()
        } catch (error) {
            console.error('Spotify API request failed:', error)
            throw error
        }
    }

    private async refreshAccessToken(): Promise<void> {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(`${this.env.SPOTIFY_CLIENT_ID}:${this.env.SPOTIFY_CLIENT_SECRET}`)}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken
            })
        })

        if (!response.ok) {
            throw new Error('Failed to refresh access token')
        }

        const data = await response.json() as {
            access_token: string
            refresh_token?: string
            expires_in: number
            scope: string
            token_type: string
        }
        this.accessToken = data.access_token
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token
        }
    }

    // Search methods
    async searchTracks(query: string, limit: number = 20): Promise<any> {
        return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`)
    }

    async searchArtists(query: string, limit: number = 20): Promise<any> {
        return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`)
    }

    async searchAlbums(query: string, limit: number = 20): Promise<any> {
        return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`)
    }

    async searchPlaylists(query: string, limit: number = 20): Promise<any> {
        return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}`)
    }

    // User profile
    async getCurrentUserProfile(): Promise<any> {
        return this.makeRequest('/me')
    }

    // Playback control
    async getCurrentPlayback(): Promise<any> {
        return this.makeRequest('/me/player')
    }

    async pausePlayback(): Promise<void> {
        await this.makeRequest('/me/player/pause', { method: 'PUT' })
    }

    async resumePlayback(): Promise<void> {
        await this.makeRequest('/me/player/play', { method: 'PUT' })
    }

    async skipToNext(): Promise<void> {
        await this.makeRequest('/me/player/next', { method: 'POST' })
    }

    async skipToPrevious(): Promise<void> {
        await this.makeRequest('/me/player/previous', { method: 'POST' })
    }

    // Playlists
    async getUserPlaylists(limit: number = 20, offset: number = 0): Promise<any> {
        return this.makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`)
    }

    async getPlaylistTracks(playlistId: string, limit: number = 20, offset: number = 0): Promise<any> {
        return this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`)
    }

    async createPlaylist(name: string, description?: string, isPublic: boolean = true): Promise<any> {
        const userProfile = await this.getCurrentUserProfile()
        return this.makeRequest(`/users/${userProfile.id}/playlists`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description,
                public: isPublic
            })
        })
    }

    async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<any> {
        return this.makeRequest(`/playlists/${playlistId}/tracks`, {
            method: 'POST',
            body: JSON.stringify({
                uris: trackUris
            })
        })
    }

    // Recently played
    async getRecentlyPlayed(limit: number = 20): Promise<any> {
        return this.makeRequest(`/me/player/recently-played?limit=${limit}`)
    }

    // Top items
    async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<any> {
        return this.makeRequest(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
    }

    async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<any> {
        return this.makeRequest(`/me/top/artists?time_range=${timeRange}&limit=${limit}`)
    }
} 