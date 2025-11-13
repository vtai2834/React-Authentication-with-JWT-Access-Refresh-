# React Authentication with JWT (Access + Refresh)

A modern React single-page application that implements secure authentication using JWT access tokens and refresh tokens.

## Features

- ✅ JWT Access Token Authentication
- ✅ Refresh Token Management
- ✅ Automatic Token Refresh on Expiry
- ✅ Protected Routes
- ✅ React Query for State Management
- ✅ React Hook Form with Validation
- ✅ Axios Interceptors
- ✅ Error Handling
- ✅ Beautiful Modern UI

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query (@tanstack/react-query)** - Server state management
- **React Hook Form** - Form handling and validation
- **Axios** - HTTP client

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Demo Credentials

The application uses a mock API for demonstration purposes. You can use the following credentials to login:

- **Email:** `user@example.com`
- **Password:** `password123`

Or:

- **Email:** `admin@example.com`
- **Password:** `admin123`

## Architecture

### Token Management

- **Access Token**: Stored in memory (session) - expires in 15 minutes
- **Refresh Token**: Stored in localStorage - expires in 7 days
- Automatic refresh when access token expires
- Tokens are cleared on logout

### Mock API

The application includes a mock API service (`src/services/mockApi.ts`) that simulates backend behavior:

- Login endpoint
- Refresh token endpoint
- User data endpoint
- Logout endpoint

In a production environment, replace the mock API with actual API endpoints.

### Protected Routes

Routes are protected using the `ProtectedRoute` component, which:
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading state during authentication check

## Project Structure

```
src/
├── components/
│   ├── ProtectedRoute.tsx      # Protected route wrapper
│   └── ProtectedRoute.css
├── hooks/
│   └── useAuth.ts              # Authentication hooks
├── pages/
│   ├── Login.tsx               # Login page
│   ├── Login.css
│   ├── Dashboard.tsx           # Protected dashboard
│   └── Dashboard.css
├── services/
│   ├── api.ts                  # Axios instance & API service
│   └── mockApi.ts              # Mock backend API
├── App.tsx                     # Main app component
└── main.tsx                    # Entry point
```

## Deployment

### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure redirects: Create `public/_redirects` with:
   ```
   /*    /index.html   200
   ```

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## Public URL

_Add your deployed URL here after hosting_

## License

MIT
