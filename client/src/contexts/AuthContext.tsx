import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../lib/api';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await authAPI.getProfile();
          const userData = response.data.data.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await authAPI.register({ email, password, name });
      const { user: userData, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create account';
      toast.error(message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Welcome back!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to sign in';
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Signed out successfully');
    }
  };

  const updateProfile = async (name: string) => {
    try {
      const response = await authAPI.updateProfile({ name });
      const userData = response.data.data.user;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};