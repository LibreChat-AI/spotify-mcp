import {createMiddleware} from "hono/factory";
import {HTTPException} from "hono/http-exception";

/**
 * spotifyBearerTokenAuthMiddleware validates that the request has a valid Spotify access token
 * The token is passed in the Authorization header as a Bearer token
 */
export const spotifyBearerTokenAuthMiddleware = createMiddleware<{
    Bindings: Env,
}>(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HTTPException(401, {message: 'Missing or invalid access token'})
    }
    const accessToken = authHeader.substring(7);

    // For Spotify, we don't validate the token here - we'll let the API calls fail if it's invalid
    // and handle token refresh in the SpotifyService
    
    // Extract refresh token from a custom header (if provided)
    const refreshToken = c.req.header('X-Spotify-Refresh-Token') || ''

    // @ts-expect-error Props go brr
    c.executionCtx.props = {
        accessToken,
        refreshToken,
    }

    await next()
})

/**
 * Get Spotify OAuth endpoints
 */
export function getSpotifyAuthEndpoint(endpoint: string): string {
    return `https://accounts.spotify.com/${endpoint}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
    code: string, 
    redirectUri: string,
    clientId: string,
    clientSecret: string,
    codeVerifier?: string
): Promise<{
    access_token: string
    token_type: string
    scope: string
    expires_in: number
    refresh_token: string
}> {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
    })

    // Add code_verifier for PKCE flow
    if (codeVerifier) {
        params.append('code_verifier', codeVerifier)
    }

    const response = await fetch(getSpotifyAuthEndpoint('api/token'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: params
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to exchange code for token: ${error}`)
    }

    return response.json()
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
): Promise<{
    access_token: string
    token_type: string
    scope: string
    expires_in: number
    refresh_token?: string
}> {
    const response = await fetch(getSpotifyAuthEndpoint('api/token'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to refresh token: ${error}`)
    }

    return response.json()
} 