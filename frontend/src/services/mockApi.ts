// Mock API service to simulate backend
// In a real app, these would be actual API endpoints

export class MockApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
  }
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

export interface RefreshResponse {
  accessToken: string;
}

interface DecodedToken {
  exp: number;
  userId?: string;
  email?: string;
  type?: string;
  [key: string]: unknown;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock database
const mockUsers = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123', // In real app, this would be hashed
    name: 'John Doe',
    role: 'user',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01',
  },
];

const REFRESH_TOKEN_STORAGE_KEY = 'list_refreshTokens';
const refreshTokens = new Map<string, { userId: string; expiresAt: number }>();

function persistRefreshTokens() {
  const arr: Array<[string, { userId: string; expiresAt: number }]> = Array.from(refreshTokens.entries());
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, JSON.stringify(arr));
}

function hydrateRefreshTokens() {
  const raw = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!raw) return;
  try {
    const arr: Array<[string, { userId: string; expiresAt: number }]> = JSON.parse(raw);
    refreshTokens.clear();
    arr.forEach(([token, payload]) => {
      if (token && payload && typeof payload.userId === 'string' && typeof payload.expiresAt === 'number') {
        refreshTokens.set(token, payload);
      }
    });
  } catch {
    // Nothing, leave the map empty
  }
}

hydrateRefreshTokens();

// Generate a simple JWT-like token (for demo purposes)
const generateToken = (
  payload: Omit<DecodedToken, 'exp'>,
  expiresIn: number = 15 * 60 * 1000,
): string => {
  const expiresAt = Date.now() + expiresIn;
  const tokenData = { ...payload, exp: expiresAt };
  // In real app, this would be a proper JWT signed with a secret
  return btoa(JSON.stringify(tokenData));
};

// Decode token (for demo purposes)
const decodeToken = (token: string): DecodedToken | null => {
  try {
    return JSON.parse(atob(token)) as DecodedToken;
  } catch {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return Date.now() >= decoded.exp;
};

export const mockApi = {
  // Login endpoint
  login: async (email: string, password: string): Promise<LoginResponse> => {
    await delay(800); // Simulate network delay

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new MockApiError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateToken(
      { userId: user.id, email: user.email },
      15 * 60 * 1000 // 15 minutes
    );
    
    const refreshToken = generateToken(
      { userId: user.id, type: 'refresh' },
      7 * 24 * 60 * 60 * 1000 // 7 days
    );

    // Store refresh token
    refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    persistRefreshTokens();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  },

  // Refresh token endpoint
  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    await delay(500);

    // Check if refresh token exists and is valid
    const tokenData = refreshTokens.get(refreshToken);
    
    if (!tokenData) {
      throw new MockApiError('Invalid refresh token', 401);
    }

    if (isTokenExpired(refreshToken) || Date.now() >= tokenData.expiresAt) {
      refreshTokens.delete(refreshToken);
      persistRefreshTokens();
      console.log('Refresh token expired');
      throw new MockApiError('Refresh token expired', 401);
    }

    // Get user data
    const user = mockUsers.find(u => u.id === tokenData.userId);
    if (!user) {
      throw new MockApiError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateToken(
      { userId: user.id, email: user.email },
      15 * 60 * 1000 // 15 minutes
    );

    return { accessToken };
  },

  // Get user data (protected endpoint)
  getUserData: async (accessToken: string): Promise<UserData> => {
    await delay(600);

    if (isTokenExpired(accessToken)) {
      throw new MockApiError('Access token expired', 401);
    }

    const decoded = decodeToken(accessToken);
    if (!decoded || !decoded.userId) {
      throw new MockApiError('Invalid access token', 401);
    }

    const user = mockUsers.find(u => u.id === decoded.userId);
    if (!user) {
      throw new MockApiError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  },

  // Logout endpoint
  logout: async (refreshToken: string): Promise<void> => {
    await delay(300);
    refreshTokens.delete(refreshToken);
    persistRefreshTokens();
  },
};

