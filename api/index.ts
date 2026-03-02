import {SpotifyMCP} from "./SpotifyMCP.ts";
import {spotifyBearerTokenAuthMiddleware, getSpotifyAuthEndpoint, exchangeCodeForToken, refreshAccessToken} from "./lib/spotify-auth";
import {requestLogger} from "./lib/request-logger";
import {cors} from "hono/cors";
import {Hono} from "hono";
import type { Env } from "../types";

// Export the SpotifyMCP class so the Worker runtime can find it
export {SpotifyMCP};

// Store registered clients in memory (in production, use a database)
interface RegisteredClient {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    scope?: string;
    token_endpoint_auth_method: string;
    created_at: number;
}
const registeredClients = new Map<string, RegisteredClient>();

// Create the Hono app
const app = new Hono<{ Bindings: Env }>();

// Conditionally apply request logging middleware
app.use('*', async (c, next) => {
    if (c.env.DEBUG_LOGGING === 'true') {
        return requestLogger(c, next);
    }
    return next();
});

// Apply CORS to all routes
app.use(cors());

// OAuth Authorization Server Discovery
app.get('/.well-known/oauth-authorization-server', async (c) => {
    const url = new URL(c.req.url);
    return c.json({
        issuer: url.origin,
        authorization_endpoint: `${url.origin}/authorize`,
        token_endpoint: `${url.origin}/token`,
        registration_endpoint: `${url.origin}/register`,
        response_types_supported: ['code'],
        response_modes_supported: ['query'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['none'],
        code_challenge_methods_supported: ['S256'],
        scopes_supported: [
            'user-read-private', 'user-read-email', 'user-read-playback-state',
            'user-modify-playback-state', 'user-read-currently-playing',
            'user-read-recently-played', 'user-top-read', 'playlist-read-private',
            'playlist-read-collaborative', 'playlist-modify-public',
            'playlist-modify-private', 'user-library-read', 'user-library-modify'
        ],
    })
})

// Dynamic Client Registration endpoint
app.post('/register', async (c) => {
    const body = await c.req.json()
    
    // Generate a client ID
    const clientId = crypto.randomUUID()
    
    // Store the client registration
    registeredClients.set(clientId, {
        client_id: clientId,
        client_name: body.client_name || 'MCP Client',
        redirect_uris: body.redirect_uris || [],
        grant_types: body.grant_types || ['authorization_code', 'refresh_token'],
        response_types: body.response_types || ['code'],
        scope: body.scope,
        token_endpoint_auth_method: 'none',
        created_at: Date.now()
    })
    
    // Return the client registration response
    return c.json({
        client_id: clientId,
        client_name: body.client_name || 'MCP Client',
        redirect_uris: body.redirect_uris || [],
        grant_types: body.grant_types || ['authorization_code', 'refresh_token'],
        response_types: body.response_types || ['code'],
        scope: body.scope,
        token_endpoint_auth_method: 'none'
    }, 201)
})

// Authorization endpoint - redirects to Spotify
app.get('/authorize', async (c) => {
    const url = new URL(c.req.url);
    const spotifyAuthUrl = new URL(getSpotifyAuthEndpoint('authorize'));
    
    // Copy all query parameters except client_id
    url.searchParams.forEach((value, key) => {
        if (key !== 'client_id') {
            spotifyAuthUrl.searchParams.set(key, value);
        }
    });
    
    // Use our Spotify app's client_id
    spotifyAuthUrl.searchParams.set('client_id', c.env.SPOTIFY_CLIENT_ID);
    
    // Redirect to Spotify's authorization page
    return c.redirect(spotifyAuthUrl.toString());
})

// Token exchange endpoint
app.post('/token', async (c) => {
    const body = await c.req.parseBody()
    
    if (body.grant_type === 'authorization_code') {
        const result = await exchangeCodeForToken(
            body.code as string,
            body.redirect_uri as string,
            c.env.SPOTIFY_CLIENT_ID,
            c.env.SPOTIFY_CLIENT_SECRET,
            body.code_verifier as string | undefined
        )
        return c.json(result)
    } else if (body.grant_type === 'refresh_token') {
        const result = await refreshAccessToken(
            body.refresh_token as string,
            c.env.SPOTIFY_CLIENT_ID,
            c.env.SPOTIFY_CLIENT_SECRET
        )
        return c.json(result)
    }
    
    return c.json({ error: 'unsupported_grant_type' }, 400)
})

// Spotify MCP endpoints
app.use('/sse/*', spotifyBearerTokenAuthMiddleware)
app.route('/sse', new Hono().mount('/', SpotifyMCP.serveSSE('/sse', { binding: 'SPOTIFY_MCP_OBJECT' }).fetch))

app.use('/mcp', spotifyBearerTokenAuthMiddleware)
app.route('/mcp', new Hono().mount('/', SpotifyMCP.serve('/mcp', { binding: 'SPOTIFY_MCP_OBJECT' }).fetch))

// Health check endpoint
app.get('/', (c) => c.text('Spotify MCP Server is running'))

export default app
