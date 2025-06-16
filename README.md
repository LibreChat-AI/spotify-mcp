# Spotify MCP OAuth Server

This is a fork of [Stytch's MCP Consumer TODO List](https://github.com/stytchauth/mcp-stytch-consumer-todo-list) example, adapted to demonstrate Spotify OAuth 2.0 integration with Model Context Protocol (MCP) using Cloudflare Workers.

## Why This Fork?

The original Stytch example provided an excellent foundation for implementing OAuth discovery and Dynamic Client Registration for MCP servers. We forked this project to:

1. **Leverage the OAuth Discovery Pattern**: The original implementation showed how to create OAuth discovery endpoints that work with MCP Inspector
2. **Replace Stytch with Spotify**: Demonstrate how to integrate with a third-party OAuth provider (Spotify) that doesn't natively support Dynamic Client Registration
3. **Focus on the API Layer**: While the original included a full TODO app with frontend components, this fork focuses primarily on the MCP server implementation

## What's Changed

### API Layer Updates
- **New Files Added**:
  - `api/SpotifyMCP.ts` - MCP server implementation for Spotify Web API
  - `api/SpotifyService.ts` - Service layer for Spotify API interactions
  - `api/lib/spotify-auth.ts` - OAuth flow implementation for Spotify
  
- **Modified Files**:
  - `api/index.ts` - Updated to handle Spotify OAuth flow and MCP endpoints
  - Environment variables changed from Stytch to Spotify credentials

### Key Features

This implementation provides:
- **OAuth 2.0 Authorization Code Flow** with PKCE support
- **OAuth Discovery Endpoint** at `/.well-known/oauth-authorization-server`
- **Dynamic Client Registration** for MCP Inspector compatibility
- **Automatic Token Refresh** when access tokens expire
- **Full Spotify Web API Integration** via MCP tools
- **Cloudflare Durable Objects** for MCP server state management

## Architecture

The project uses:
- **Cloudflare Workers** for the backend API
- **Cloudflare Durable Objects** for MCP server instances
- **Spotify Web API** for music data and playback control
- **Model Context Protocol (MCP)** for AI agent integration

## Important: Development Example

**⚠️ This server is primarily designed for development and testing OAuth flows with MCP clients.**

This implementation is optimized for:
- Testing with [LibreChat](https://github.com/danny-avila/LibreChat) - An open-source AI chat platform with MCP support
- Development with [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Official MCP debugging tool
- Learning how to implement OAuth discovery for MCP servers

### Not Production-Ready

Before deploying to production, you should:

1. **Add Authentication Validation**
   - Implement proper client validation in the `/register` endpoint
   - Add rate limiting to prevent abuse
   - Validate redirect URIs against a whitelist

2. **Enhance Security**
   - Implement CSRF protection
   - Add request signing/verification
   - Use secure session management
   - Implement proper error handling that doesn't leak sensitive information

3. **Add Monitoring & Logging**
   - Implement comprehensive logging
   - Add error tracking (e.g., Sentry)
   - Monitor API usage and rate limits
   - Track OAuth flow completion rates

4. **Optimize for Scale**
   - Implement caching strategies
   - Add database for persistent storage (instead of KV for production data)
   - Implement proper connection pooling
   - Add request queuing for rate-limited operations

5. **Handle Edge Cases**
   - Implement proper retry logic with exponential backoff
   - Handle Spotify API maintenance windows
   - Add graceful degradation for non-critical features
   - Implement proper timeout handling

### What's Already Production-Ready

Thanks to the original Stytch implementation, this project already includes:

✅ **Cloudflare Workers Deployment**
- Full Workers configuration with `wrangler.jsonc`
- Durable Objects setup for MCP server instances
- Workers KV integration for data storage
- Proper TypeScript configuration for Workers environment

✅ **Infrastructure Foundation**
- SSE (Server-Sent Events) implementation for real-time MCP communication
- Proper CORS handling
- Environment variable management
- Build and deployment scripts

This means you already have a solid infrastructure foundation - you just need to add the security and monitoring layers mentioned above for production use.

### Production Deployment Checklist

If you plan to use this in production:
- [ ] Review and implement all security considerations
- [ ] Add comprehensive error handling
- [ ] Implement proper logging and monitoring
- [ ] Add automated tests
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables securely
- [ ] Implement backup and recovery procedures
- [ ] Add API versioning strategy
- [ ] Create documentation for your specific implementation
- [ ] Implement user consent and data privacy compliance

## MCP Inspector Compatibility

Following the pattern from [PayPal's MCP server](https://developer.paypal.com/tools/mcp-server/), this implementation provides:

1. **OAuth Discovery** at `/.well-known/oauth-authorization-server`
2. **Dynamic Client Registration** at `/register` endpoint
3. **Authorization Proxy** that redirects to Spotify's OAuth system

This allows MCP Inspector and other MCP clients to automatically discover and register with our server, even though Spotify itself doesn't support Dynamic Client Registration.

## Setup

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your Client ID and Client Secret
4. Add redirect URIs for your application (e.g., `http://localhost:3000/callback`)

### 2. Configure Environment Variables

Create a `.dev.vars` file based on `.dev.vars.template`:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

The MCP server will be available at `http://localhost:3000/sse`

### Environment Variables for Vite

The `vite.config.ts` file supports additional environment variables for development:

- **`VITE_PORT`**: Customize the development server port (default: 3000)
  ```bash
  VITE_PORT=8080 npm run dev
  ```

- **`VITE_ALLOWED_HOSTS`**: Specify allowed hosts for the dev server (useful when using tunneling services)
  ```bash
  VITE_ALLOWED_HOSTS="localhost,your-ngrok-domain.ngrok-free.app" npm run dev
  ```

## HTTPS Requirements

### The Problem

The Spotify Web API requires HTTPS for OAuth callbacks, and modern browsers enforce secure connections between MCP clients and servers to prevent mixed content issues.

### Solutions by Deployment Type

#### Production Deployment (Recommended)

**✅ Cloudflare Workers Solution**
- **MCP Server**: Deploy to Cloudflare Workers - automatic HTTPS included
  - Your deployed server: `https://your-worker.workers.dev`
  - Permanent, stable HTTPS URLs
  - No additional SSL configuration required
  - Global edge network for fast response times

- **MCP Client**: Most production MCP clients already run over HTTPS
- **Spotify App**: Update redirect URIs to use your Workers domain (one-time setup)

```bash
# Deploy to get permanent HTTPS URL
npm run deploy

# Update Spotify app redirect URI to:
# https://your-worker.workers.dev/callback
```

#### Local Development

**🔧 ngrok Solution for Local Testing**

When developing locally, use [ngrok](https://ngrok.com/) to create HTTPS tunnels:

##### 1. Install ngrok
```bash
# Download from https://ngrok.com/download or use package manager
brew install ngrok  # macOS
# or
snap install ngrok  # Linux
```

##### 2. Start Your Local MCP Server
```bash
# Start with allowed hosts configuration
VITE_ALLOWED_HOSTS="localhost,*.ngrok-free.app" npm run dev
```

##### 3. Create HTTPS Tunnels

For local development, you may need tunnels for both server and client:

```bash
# Terminal 1: Tunnel for MCP Server (port 3000)
ngrok http 3000

# Terminal 2: Tunnel for LibreChat if running locally (port 3080)
ngrok http 3080
```

##### 4. Configure for Development Session

After starting ngrok, you'll get temporary HTTPS URLs:
- MCP Server: `https://abc123.ngrok-free.app`
- LibreChat: `https://def456.ngrok-free.app`

Update your Spotify app for this development session:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add the ngrok redirect URI: `https://abc123.ngrok-free.app/callback`
3. Configure MCP client to use: `https://abc123.ngrok-free.app/sse`

### Comparison: Production vs Development

| Aspect | Cloudflare Workers (Production) | ngrok (Development) |
|--------|--------------------------------|---------------------|
| **HTTPS** | ✅ Automatic, permanent | ✅ Temporary tunnels |
| **URLs** | ✅ Stable, persistent | ❌ Change on restart |
| **Setup** | ✅ One-time deployment | ❌ Per-session setup |
| **Cost** | ✅ Free tier available | ✅ Free tier available |
| **Performance** | ✅ Global edge network | ❌ Tunneling overhead |
| **Use Case** | Production, permanent testing | Local development |

### Recommended Workflow

1. **Start with Production**: Deploy to Cloudflare Workers first for stable testing
2. **Use Local When Needed**: Use ngrok only when you need to test local code changes
3. **Hybrid Approach**: Keep production deployment for stable testing, use local for active development

### ngrok Limitations (Development Only)

- **Temporary Domains**: URLs change each restart (requires updating Spotify app)
- **Session Limits**: 2-hour sessions on free plan
- **Request Limits**: 40 requests per minute on free plan
- **Multiple Tunnels**: Need separate ngrok instances for server and client

### Production Considerations

**✅ Cloudflare Workers Benefits:**
- Automatic HTTPS with valid certificates
- Global CDN for low latency
- Built-in DDoS protection
- 99.9% uptime SLA
- Easy custom domain support

**For Enterprise Use:**
- Custom domains: `mcp.yourcompany.com`
- Enhanced security with Cloudflare WAF
- Advanced analytics and monitoring
- Team collaboration features

## OAuth Flow

### How It Works with MCP Inspector

1. **Discovery**: MCP Inspector fetches `/.well-known/oauth-authorization-server`
2. **Registration**: Inspector registers itself at `/register` endpoint
3. **Authorization**: User is redirected to `/authorize`, which redirects to Spotify
4. **User Consent**: User authorizes on Spotify's page
5. **Token Exchange**: Inspector exchanges code at `/token`
6. **Access MCP**: Inspector uses tokens to access MCP endpoints via SSE

## Available MCP Tools

The Spotify MCP server exposes the following tools:

### Search
- `searchTracks` - Search for tracks
- `searchArtists` - Search for artists
- `searchAlbums` - Search for albums
- `searchPlaylists` - Search for playlists

### User Profile
- `getCurrentUserProfile` - Get current user's profile

### Playback Control
- `getCurrentPlayback` - Get current playback state
- `pausePlayback` - Pause playback
- `resumePlayback` - Resume playback
- `skipToNext` - Skip to next track
- `skipToPrevious` - Skip to previous track

### Playlists
- `getUserPlaylists` - Get user's playlists
- `getPlaylistTracks` - Get tracks from a playlist
- `createPlaylist` - Create a new playlist
- `addTracksToPlaylist` - Add tracks to a playlist

### User Data
- `getRecentlyPlayed` - Get recently played tracks
- `getTopTracks` - Get user's top tracks
- `getTopArtists` - Get user's top artists

## Example Usage

### Using MCP Inspector

1. Open MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector@latest
   ```
2. Set Transport Type to `SSE`
3. Enter URL: `http://localhost:3000/sse`
4. Click Connect
5. Follow the OAuth flow when redirected

### Manual Token Usage

If you prefer to bypass the OAuth flow for testing:

1. Get tokens using the manual flow
2. In MCP Inspector, add headers:
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
   - `X-Spotify-Refresh-Token: YOUR_REFRESH_TOKEN`

## Deployment

### Quick Deploy to Cloudflare Workers

**🚀 Automatic HTTPS Solution**

Deploying to Cloudflare Workers automatically solves the HTTPS requirement:

```bash
# 1. Set your Spotify credentials
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET

# 2. Deploy (gets automatic HTTPS)
npm run deploy

# 3. Update Spotify app redirect URI to your new Workers URL
# Example: https://your-worker.workers.dev/callback
```

Your MCP server will be available at: `https://your-worker.workers.dev/sse`

**⚠️ Remember: This is a development example. See the "Important: Development Example" section above for production considerations.**

### Production Deployment

For actual production use:
1. Fork this repository
2. Implement the security enhancements listed above
3. Add proper monitoring and error handling
4. Consider using Cloudflare's paid features:
   - Durable Objects for better state management
   - Workers KV for caching
   - Rate limiting rules
   - Web Application Firewall (WAF)

## Security Considerations

1. **Client Credentials**: Never expose your Spotify Client Secret in client-side code
2. **Token Storage**: Store tokens securely and use HTTPS for all communications
3. **Scopes**: Only request the minimum scopes necessary for your application
4. **PKCE**: The implementation supports PKCE for added security
5. **Client Registration**: In production, consider adding validation to the registration endpoint

## Spotify API Gotchas

### 1. HTTPS Requirement
- Spotify Web API requires HTTPS for OAuth callbacks
- **Solution**: Deploy to Cloudflare Workers for automatic HTTPS
- **Local Development**: Use ngrok for HTTPS tunneling
- Mixed content errors occur when client and server use different protocols

### 2. Active Device Requirement
- Playback control endpoints (`pausePlayback`, `resumePlayback`, etc.) require an active Spotify device
- Users must have Spotify open on at least one device (desktop app, mobile, or web player)
- API returns 404 "No active device found" if no device is available

### 3. Premium Account Limitations
- Many playback control features require a Spotify Premium account
- Free accounts can read data but cannot control playback
- The API returns 403 "Premium required" errors for free accounts

### 4. Rate Limiting
- Spotify implements rate limiting on all endpoints
- Limits vary by endpoint but typically allow 180 requests per minute
- Implement exponential backoff for 429 (Too Many Requests) responses

### 5. Token Expiration
- Access tokens expire after 1 hour
- This implementation handles automatic refresh, but ensure refresh tokens are stored
- Refresh tokens can become invalid if unused for extended periods

### 6. Scope Requirements
- Different endpoints require different OAuth scopes
- Missing scopes result in 403 Forbidden errors
- Common required scopes:
  - `user-read-private` - User profile access
  - `user-read-playback-state` - Current playback info
  - `user-modify-playback-state` - Playback control
  - `playlist-read-private` - Access user playlists
  - `playlist-modify-public` - Create/modify playlists

### 7. Market Restrictions
- Some content is restricted by geographic market
- API may return different results based on user's country
- Use the `market` parameter when searching to get region-appropriate results

## Acknowledgments

This project is based on the excellent [Stytch MCP Consumer TODO List](https://github.com/stytchauth/mcp-stytch-consumer-todo-list) example, which demonstrated how to implement OAuth discovery for MCP servers. We've adapted their pattern to work with Spotify's OAuth system.

## Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [OAuth 2.0 Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Original Stytch Example](https://github.com/stytchauth/mcp-stytch-consumer-todo-list)

