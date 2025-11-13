import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService, clearTokens } from '../services/api';
import type { LoginResponse, UserData } from '../services/mockApi';

interface LoginCredentials {
  email: string;
  password: string;
}

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: ({ email, password }: LoginCredentials) =>
      apiService.login(email, password),
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.setQueryData<UserData>(['user'], data.user);
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, void>({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      queryClient.clear();
      clearTokens();
      navigate('/login');
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      queryClient.clear();
      clearTokens();
      navigate('/login');
    },
  });
};

// Get user data query
export const useUser = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const hasRefreshToken = !!localStorage.getItem('refreshToken');
  const isEnabled = options?.enabled ?? true;
  
  return useQuery<UserData, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      // First check if we have user data in cache
      const cachedUser = queryClient.getQueryData<UserData>(['user']);
      if (cachedUser) {
        return cachedUser;
      }
      // Otherwise fetch from API
      return await apiService.getUserData();
    },
    enabled: isEnabled && hasRefreshToken, // Only fetch if we have a refresh token
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
};

