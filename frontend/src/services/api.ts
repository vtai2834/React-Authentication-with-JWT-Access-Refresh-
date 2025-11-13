import axios, { AxiosError, AxiosHeaders } from 'axios';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  mockApi,
  type LoginResponse,
  type RefreshResponse,
  type UserData,
} from './mockApi';

const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() !== 'false';

let accessToken: string | null = null;
let refreshTokenPromise: Promise<string> | null = null;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  timeout: 10000,
});

const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');

const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const clearTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
};

export const getAccessTokenValue = () => accessToken;
export const getRefreshTokenValue = (): string | null => getRefreshToken();

if (!USE_MOCK_API) {
  apiClient.interceptors.request.use(
    async (config) => {
      let headers: AxiosHeaders;
      if (config.headers instanceof AxiosHeaders) {
        headers = config.headers;
      } else {
        headers = AxiosHeaders.from(config.headers ?? {});
        config.headers = headers;
      }

      const isAuthLogin = config.url?.includes('/auth/login');
      const isAuthRefresh = config.url?.includes('/auth/refresh');

      // If no access token but we have a refresh token, proactively refresh before request
      if (!isAuthLogin && !isAuthRefresh && !accessToken) {
        const storedRefreshToken = getRefreshToken();
        if (storedRefreshToken) {
          try {
            await refreshAccessToken();
          } catch {
            // ignore here; request may still fail and be handled by response interceptor
          }
        }
      }

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      if (!originalRequest) {
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (error.response?.status !== HTTP_STATUS.UNAUTHORIZED) {
        return Promise.reject(error);
      }

      if ((originalRequest as typeof originalRequest & { _retry?: boolean })._retry) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      (originalRequest as typeof originalRequest & { _retry?: boolean })._retry = true;

      if (refreshTokenPromise) {
        try {
          const newAccessToken = await refreshTokenPromise;
          const headers = AxiosHeaders.from(originalRequest.headers ?? {});
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          originalRequest.headers = headers;
          return apiClient(originalRequest);
        } catch {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      refreshTokenPromise = refreshAccessToken();
      try {
        const newAccessToken = await refreshTokenPromise;
        refreshTokenPromise = null;
        const headers = AxiosHeaders.from(originalRequest.headers ?? {});
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        originalRequest.headers = headers;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshTokenPromise = null;
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    },
  );
}

const loginWithBackend = async (email: string, password: string) => {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

const refreshTokenWithBackend = async (refreshToken: string) => {
  const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

const logoutFromBackend = async (refreshToken: string) => {
  await apiClient.post('/auth/logout', { refreshToken });
};

const getUserFromBackend = async () => {
  const response = await apiClient.get<UserData>('/user/me');
  return response.data;
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  try {
    const result = USE_MOCK_API
      ? await mockApi.refreshToken(refreshToken)
      : await refreshTokenWithBackend(refreshToken);
    setAccessToken(result.accessToken);
    return result.accessToken;
  } catch (error) {
    console.log('Error in refreshAccessToken:', error);
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes('expired') ||
        error.message.toLowerCase().includes('invalid'))
    ) {
      clearTokens();
    }
    throw error;
  }
};

export const ensureAccessToken = async (): Promise<string> => {
  if (accessToken) {
    return accessToken;
  }

  return await refreshAccessToken();
};

//API để gọi qua MocKAPI SERVER

export const apiService = {
  login: async (email: string, password: string) => {
    const result = USE_MOCK_API
      ? await mockApi.login(email, password)
      : await loginWithBackend(email, password);

    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    return result;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        if (USE_MOCK_API) {
          await mockApi.logout(refreshToken);
        } else {
          await logoutFromBackend(refreshToken);
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearTokens();
  },

  getUserData: async () => {
    if (!accessToken) {
      throw new Error('No access token');
    }

    return USE_MOCK_API
      ? await mockApi.getUserData(accessToken)
      : await getUserFromBackend();
  },
};

