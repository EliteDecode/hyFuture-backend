# OAuth Setup Guide

This document outlines the environment variables, setup required for OAuth authentication with Google and Facebook, and frontend integration instructions.

## Environment Variables

Add the following variables to your `.env` file:

```env
# OAuth Base URL (for callbacks)
OAUTH_CALLBACK_BASE_URL=http://localhost:4001/api/v1/auth

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:4001/api/v1/auth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (production)
7. Copy the Client ID and Client Secret to your `.env` file

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add authorized redirect URIs:
   - `http://localhost:4001/api/v1/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/v1/auth/facebook/callback` (production)
6. Copy the App ID and App Secret to your `.env` file
7. Make sure to request `email` permission in the OAuth scope

## Backend API Endpoints

### Registration Endpoints

- `GET /api/v1/auth/google/register` - Initiate Google registration
- `GET /api/v1/auth/facebook/register` - Initiate Facebook registration

### Login Endpoints

- `GET /api/v1/auth/google/login` - Initiate Google login
- `GET /api/v1/auth/facebook/login` - Initiate Facebook login

### Callback Endpoints (handled automatically by backend)

- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/facebook/callback`

## Frontend Integration Guide

### Overview

The OAuth flow works as follows:

1. User clicks "Sign up with [Provider]" or "Sign in with [Provider]"
2. Frontend redirects user to backend OAuth endpoint
3. Backend redirects user to provider's OAuth consent screen
4. User authorizes the application
5. Provider redirects back to backend callback endpoint
6. Backend processes authentication and redirects to frontend with tokens

### Implementation Steps

#### 1. Create OAuth Redirect URLs

Create a page/route in your frontend to handle OAuth callbacks. For example:

- `/auth/callback` or `/oauth/callback`

#### 2. Redirect Users to OAuth Endpoints

When user clicks "Sign up with Google" or "Sign in with Google":

```typescript
// For registration
const handleGoogleRegister = () => {
  window.location.href = `${API_BASE_URL}/api/v1/auth/google/register`;
};

// For login
const handleGoogleLogin = () => {
  window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
};

// Same for Facebook
const handleFacebookRegister = () => {
  window.location.href = `${API_BASE_URL}/api/v1/auth/facebook/register`;
};

const handleFacebookLogin = () => {
  window.location.href = `${API_BASE_URL}/api/v1/auth/facebook/login`;
};
```

#### 3. Handle OAuth Callback

The backend callback endpoints will redirect back to your frontend. You need to configure the redirect URL in your backend environment variable or modify the callback handlers.

**Option A: Backend redirects to frontend with tokens in URL (recommended for development)**

Modify the callback handlers in `auth.controller.ts` to redirect to your frontend:

```typescript
// In googleCallback and facebookCallback methods
res.redirect(
  `${FRONTEND_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
);
```

Then handle it in your frontend:

```typescript
// In your callback page component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');

  if (accessToken && refreshToken) {
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    // Refresh token is set as HTTP-only cookie by backend

    // Redirect to dashboard or home
    window.location.href = '/dashboard';
  }
}, []);
```

**Option B: Backend returns JSON (requires CORS and cookie handling)**

If your backend returns JSON instead of redirecting, you'll need to:

1. Ensure CORS is configured on your backend to allow your frontend origin
2. Ensure cookies are sent with requests (credentials: 'include')
3. Handle the response:

```typescript
// Make a request to callback endpoint (this won't work with redirects)
// Instead, use a popup window approach or handle redirects properly
```

#### 4. Recommended: Use Popup Window Approach

For better UX, use a popup window for OAuth:

```typescript
const handleOAuth = (
  provider: 'google' | 'facebook',
  mode: 'register' | 'login',
) => {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    `${API_BASE_URL}/api/v1/auth/${provider}/${mode}`,
    'OAuth',
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  // Listen for messages from popup
  const messageListener = (event: MessageEvent) => {
    if (event.origin !== API_BASE_URL) return;

    if (event.data.type === 'OAUTH_SUCCESS') {
      const { accessToken } = event.data;
      localStorage.setItem('accessToken', accessToken);
      // Refresh token is in HTTP-only cookie
      popup?.close();
      window.removeEventListener('message', messageListener);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else if (event.data.type === 'OAUTH_ERROR') {
      console.error('OAuth error:', event.data.error);
      popup?.close();
      window.removeEventListener('message', messageListener);
    }
  };

  window.addEventListener('message', messageListener);

  // Check if popup was closed manually
  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', messageListener);
    }
  }, 1000);
};
```

**Note:** For popup approach, you'll need to modify backend callbacks to post messages to the opener window instead of redirecting.

#### 5. Store Tokens

- **Access Token**: Store in `localStorage` or memory (for SPA) or secure cookie
- **Refresh Token**: Automatically stored as HTTP-only cookie by backend (more secure)

#### 6. Use Access Token for API Requests

Include the access token in API requests:

```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies (refresh token)
});

// Add access token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/renew-tokens`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('accessToken', response.data.accessToken);
        // Retry original request
        return apiClient.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

### Example React Component

```tsx
import React from 'react';

const OAuthButtons: React.FC = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4001';

  const handleOAuth = (
    provider: 'google' | 'facebook',
    mode: 'register' | 'login',
  ) => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/${provider}/${mode}`;
  };

  return (
    <div className="oauth-buttons">
      <h2>Sign up with</h2>
      <button onClick={() => handleOAuth('google', 'register')}>
        Sign up with Google
      </button>
      <button onClick={() => handleOAuth('facebook', 'register')}>
        Sign up with Facebook
      </button>

      <h2>Sign in with</h2>
      <button onClick={() => handleOAuth('google', 'login')}>
        Sign in with Google
      </button>
      <button onClick={() => handleOAuth('facebook', 'login')}>
        Sign in with Facebook
      </button>
    </div>
  );
};

export default OAuthButtons;
```

## How OAuth Flow Works

1. **Registration Flow:**
   - User clicks "Sign up with [Provider]"
   - Frontend redirects to `/auth/[provider]/register`
   - User is redirected to provider's OAuth page
   - After authorization, provider redirects to `/auth/[provider]/callback?state=register`
   - System creates new user account and returns JWT tokens
   - Backend redirects to frontend with tokens (or returns JSON)

2. **Login Flow:**
   - User clicks "Sign in with [Provider]"
   - Frontend redirects to `/auth/[provider]/login`
   - User is redirected to provider's OAuth page
   - After authorization, provider redirects to `/auth/[provider]/callback?state=login`
   - System authenticates existing user and returns JWT tokens
   - If user doesn't exist, returns error: "Account not found. Please register first."

## Important Notes

- **Email Uniqueness:** Email addresses must be unique across all providers. If a user tries to register with an email that already exists (from any provider), they will receive an error.
- **Separate Registration Required:** Users must register first before they can sign in. Attempting to sign in with a non-existent account will fail.
- **Auto-Verification:** OAuth users' emails are automatically verified (no email verification code needed).
- **Password:** OAuth users don't have passwords (password field is null).
- **CORS Configuration:** Ensure your backend CORS settings allow your frontend origin and credentials.
- **Cookie Settings:** Refresh tokens are stored as HTTP-only cookies for security. Ensure your frontend sends cookies with requests (`withCredentials: true` in axios/fetch).

## Response Format

### Success Response (from callback endpoint)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Refresh token is automatically set as an HTTP-only cookie and won't be in the JSON response.

### Error Responses

- **409 Conflict:** Account already exists (during registration) or email already registered
- **401 Unauthorized:** Account not found (during login)
- **400 Bad Request:** Invalid request parameters

## Database Migration

After updating the Prisma schema, run:

```bash
npm run prisma:migrate
npm run prisma:generate
```

This will:

- Update `AuthProvider` enum (removed TWITTER)
- Ensure `provider`, `providerId`, and `avatar` fields exist on User model
- Ensure `password` field is nullable
- Ensure unique constraint on `(provider, providerId)`

## Frontend Environment Variables

Add these to your frontend `.env`:

```env
REACT_APP_API_URL=http://localhost:4001
# or
VITE_API_URL=http://localhost:4001
# depending on your build tool
```

## Testing OAuth Flow

1. Start your backend server
2. Ensure OAuth credentials are configured in `.env`
3. Navigate to your frontend OAuth buttons
4. Click "Sign up with Google" or "Sign up with Facebook"
5. Complete OAuth flow
6. Verify tokens are stored and user is redirected correctly
