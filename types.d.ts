// Environment variables and bindings
interface Env {
    SPOTIFY_CLIENT_ID: string
    SPOTIFY_CLIENT_SECRET: string
    SPOTIFY_MCP_OBJECT: DurableObjectNamespace
}

export type Todo = {
    id: string;
    text: string;
    completed: boolean;
}

// Context from the auth process, extracted from the Stytch auth token JWT
// and provided to the MCP Server as this.props
type AuthenticationContext = {
    claims: {
        "iss": string,
        "scope": string,
        "sub": string,
        "aud": string[],
        "client_id": string,
        "exp": number,
        "iat": number,
        "nbf": number,
        "jti": string,
    },
    accessToken: string
}

// Context from the Spotify OAuth process
export type SpotifyAuthContext = {
    accessToken: string
    refreshToken: string
    expiresIn?: number
    tokenType?: string
    scope?: string
}
