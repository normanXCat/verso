import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPublic, LoginInput, RegisterInput } from '@verso/shared';
import { authClient } from '../lib/auth-client.js';
import { clearAllOfflineData } from '../lib/offline-storage.js';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authClient.getMe();
        return response.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => authClient.login(credentials),
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterInput) => authClient.register(credentials),
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authClient.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['auth'] });
      // Cloisonnement des sessions : purge du cache local et du cache Workbox d'API.
      void clearAllOfflineData();
    },
  });

  const user = data ?? null;
  const isAuthenticated = !!user;
  const isEmailVerified = !!user?.emailVerified;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isEmailVerified,
      login: async (creds) => {
        await loginMutation.mutateAsync(creds);
      },
      register: async (creds) => {
        const res = await registerMutation.mutateAsync(creds);
        return { message: res.message };
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refreshUser: async () => {
        await refetch();
      },
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      isEmailVerified,
      loginMutation,
      registerMutation,
      logoutMutation,
      refetch,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
