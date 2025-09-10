// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// OAuth scopes
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

// Redirect URI (must match what's configured in Google Cloud Console)
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;


export interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

export interface GoogleAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

// Generate Google OAuth URL
export function generateGoogleAuthURL(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  })

  if (state) {
    params.append('state', state)
  }

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  return response.json()
}

// Get user info from Google
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user info from Google')
  }

  return response.json()
}

// Complete OAuth flow
export async function completeGoogleAuth(code: string): Promise<GoogleUser> {
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    
    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    
    return userInfo
  } catch (error) {
    console.error('Google OAuth error:', error)
    throw new Error('Google authentication failed')
  }
}

// Validate Google ID token (for server-side verification)
export async function validateGoogleIdToken(idToken: string): Promise<GoogleUser> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  
  if (!response.ok) {
    throw new Error('Invalid Google ID token')
  }
  
  const tokenInfo = await response.json()
  
  return {
    id: tokenInfo.sub,
    email: tokenInfo.email,
    name: tokenInfo.name,
    picture: tokenInfo.picture,
    verified_email: tokenInfo.email_verified
  }
}
