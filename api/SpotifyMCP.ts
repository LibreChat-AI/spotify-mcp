import {McpAgent} from "agents/mcp";
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'
import {SpotifyService} from "./SpotifyService.ts";
import {SpotifyAuthContext} from "../types";

/**
 * The `SpotifyMCP` class exposes the Spotify API via the Model Context Protocol
 * for consumption by API Agents
 */
export class SpotifyMCP extends McpAgent<Env, unknown, SpotifyAuthContext> {
    async init() {
        // Initialize any necessary state
    }

    get spotifyService() {
        return new SpotifyService(this.env, this.props.accessToken, this.props.refreshToken)
    }

    formatResponse = (description: string, data: unknown): {
        content: Array<{ type: 'text', text: string }>
    } => {
        return {
            content: [{
                type: "text",
                text: `Success! ${description}\n\nResult:\n${JSON.stringify(data, null, 2)}`
            }]
        };
    }

    get server() {
        const server = new McpServer({
            name: 'Spotify Service',
            version: '1.0.0',
        })

        // Search functionality
        server.tool('searchTracks', 'Search for tracks on Spotify', {
            query: z.string().describe('Search query for tracks'),
            limit: z.number().optional().default(20).describe('Maximum number of results (1-50)')
        }, async ({query, limit}) => {
            const results = await this.spotifyService.searchTracks(query, limit)
            return this.formatResponse('Track search completed', results)
        })

        server.tool('searchArtists', 'Search for artists on Spotify', {
            query: z.string().describe('Search query for artists'),
            limit: z.number().optional().default(20).describe('Maximum number of results (1-50)')
        }, async ({query, limit}) => {
            const results = await this.spotifyService.searchArtists(query, limit)
            return this.formatResponse('Artist search completed', results)
        })

        server.tool('searchAlbums', 'Search for albums on Spotify', {
            query: z.string().describe('Search query for albums'),
            limit: z.number().optional().default(20).describe('Maximum number of results (1-50)')
        }, async ({query, limit}) => {
            const results = await this.spotifyService.searchAlbums(query, limit)
            return this.formatResponse('Album search completed', results)
        })

        server.tool('searchPlaylists', 'Search for playlists on Spotify', {
            query: z.string().describe('Search query for playlists'),
            limit: z.number().optional().default(20).describe('Maximum number of results (1-50)')
        }, async ({query, limit}) => {
            const results = await this.spotifyService.searchPlaylists(query, limit)
            return this.formatResponse('Playlist search completed', results)
        })

        // User profile
        server.tool('getCurrentUserProfile', 'Get the current user\'s Spotify profile', {}, async () => {
            const profile = await this.spotifyService.getCurrentUserProfile()
            return this.formatResponse('User profile retrieved', profile)
        })

        // Playback control
        server.tool('getCurrentPlayback', 'Get information about the user\'s current playback', {}, async () => {
            const playback = await this.spotifyService.getCurrentPlayback()
            return this.formatResponse('Current playback retrieved', playback)
        })

        server.tool('pausePlayback', 'Pause the user\'s playback', {}, async () => {
            await this.spotifyService.pausePlayback()
            return this.formatResponse('Playback paused', {})
        })

        server.tool('resumePlayback', 'Resume the user\'s playback', {}, async () => {
            await this.spotifyService.resumePlayback()
            return this.formatResponse('Playback resumed', {})
        })

        server.tool('skipToNext', 'Skip to the next track', {}, async () => {
            await this.spotifyService.skipToNext()
            return this.formatResponse('Skipped to next track', {})
        })

        server.tool('skipToPrevious', 'Skip to the previous track', {}, async () => {
            await this.spotifyService.skipToPrevious()
            return this.formatResponse('Skipped to previous track', {})
        })

        // Playlists
        server.tool('getUserPlaylists', 'Get the current user\'s playlists', {
            limit: z.number().optional().default(20).describe('Maximum number of playlists (1-50)'),
            offset: z.number().optional().default(0).describe('Offset for pagination')
        }, async ({limit, offset}) => {
            const playlists = await this.spotifyService.getUserPlaylists(limit, offset)
            return this.formatResponse('User playlists retrieved', playlists)
        })

        server.tool('getPlaylistTracks', 'Get tracks from a playlist', {
            playlistId: z.string().describe('Spotify playlist ID'),
            limit: z.number().optional().default(20).describe('Maximum number of tracks (1-100)'),
            offset: z.number().optional().default(0).describe('Offset for pagination')
        }, async ({playlistId, limit, offset}) => {
            const tracks = await this.spotifyService.getPlaylistTracks(playlistId, limit, offset)
            return this.formatResponse('Playlist tracks retrieved', tracks)
        })

        server.tool('createPlaylist', 'Create a new playlist', {
            name: z.string().describe('Name for the new playlist'),
            description: z.string().optional().describe('Description for the playlist'),
            public: z.boolean().optional().default(true).describe('Whether the playlist should be public')
        }, async ({name, description, public: isPublic}) => {
            const playlist = await this.spotifyService.createPlaylist(name, description, isPublic)
            return this.formatResponse('Playlist created', playlist)
        })

        server.tool('addTracksToPlaylist', 'Add tracks to a playlist', {
            playlistId: z.string().describe('Spotify playlist ID'),
            trackUris: z.array(z.string()).describe('Array of Spotify track URIs (e.g., ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"])')
        }, async ({playlistId, trackUris}) => {
            const result = await this.spotifyService.addTracksToPlaylist(playlistId, trackUris)
            return this.formatResponse('Tracks added to playlist', result)
        })

        // Recently played
        server.tool('getRecentlyPlayed', 'Get the user\'s recently played tracks', {
            limit: z.number().optional().default(20).describe('Maximum number of items (1-50)')
        }, async ({limit}) => {
            const tracks = await this.spotifyService.getRecentlyPlayed(limit)
            return this.formatResponse('Recently played tracks retrieved', tracks)
        })

        // Top items
        server.tool('getTopTracks', 'Get the user\'s top tracks', {
            timeRange: z.enum(['short_term', 'medium_term', 'long_term']).optional().default('medium_term').describe('Time range for top tracks'),
            limit: z.number().optional().default(20).describe('Maximum number of items (1-50)')
        }, async ({timeRange, limit}) => {
            const tracks = await this.spotifyService.getTopTracks(timeRange, limit)
            return this.formatResponse('Top tracks retrieved', tracks)
        })

        server.tool('getTopArtists', 'Get the user\'s top artists', {
            timeRange: z.enum(['short_term', 'medium_term', 'long_term']).optional().default('medium_term').describe('Time range for top artists'),
            limit: z.number().optional().default(20).describe('Maximum number of items (1-50)')
        }, async ({timeRange, limit}) => {
            const artists = await this.spotifyService.getTopArtists(timeRange, limit)
            return this.formatResponse('Top artists retrieved', artists)
        })

        return server
    }
} 