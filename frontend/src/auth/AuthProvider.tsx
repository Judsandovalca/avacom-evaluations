import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AuthContext, type User } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  // Wrap setUser so a logout or user-switch wipes the TanStack Query
  // cache. Without this, evaluations cached for user A leak into user
  // B's session until staleTime expires.
  //
  // Only clear when the previous user was non-null AND the identity
  // changes. Initial mount (null -> first user) must NOT clear so that
  // any in-flight public queries (e.g. /api/courses on the landing)
  // survive the hydration of /auth/me.
  const setUser = useCallback((u: User | null) => {
    const nextId = u?.userId ?? null;
    const prevId = currentUserIdRef.current;
    if (prevId !== null && prevId !== nextId) {
      queryClient.clear();
    }
    currentUserIdRef.current = nextId;
    setUserState(u);
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    // Fetch-on-mount syncs user state with the /auth/me endpoint.
    // The rule flags any setState triggered from an effect; here the
    // setState lives inside refresh() and is the intended sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, isLoading, setUser, refresh }),
    [user, isLoading, setUser, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
