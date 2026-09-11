import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken, clearAuthToken } from '../lib/api';

type User = {
  id: string;
  phone: string;
  role: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Attempt to fetch current user profile
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.log('Failed to load user', error);
      await clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, role: string) => {
    try {
      // Using mock OTP approach: password is the same as role for dev
      const response = await api.post('/auth/login', {
        username: phone, // FastAPI OAuth2PasswordRequestForm expects username/password
        password: 'password', // Demo password
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      await setAuthToken(access_token);
      await loadUser();
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  };

  const logout = async () => {
    await clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
