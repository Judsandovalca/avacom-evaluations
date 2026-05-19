import { createContext } from 'react';

export interface User {
  userId: string;
  email: string;
  name: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
