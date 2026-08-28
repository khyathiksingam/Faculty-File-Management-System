import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collegeSettings, setCollegeSettings] = useState(null);

  // Fetch public college settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get('/settings/public');
      if (data && data.settings) {
        setCollegeSettings(data.settings);
      }
    } catch (err) {
      console.warn('Failed to load branding settings:', err.message);
    }
  }, []);

  // Check existing token and fetch profile
  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      if (data && data.user) {
        setUser(data.user);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    checkAuth();
  }, [fetchSettings, checkAuth]);

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    if (data && data.token) {
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Login failed: Invalid server response');
  };

  const loginWithGoogle = async (googlePayload) => {
    const data = await api.post('/auth/google', googlePayload);
    if (data && data.token) {
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Google Sign In failed');
  };

  const signup = async (signupData) => {
    const data = await api.post('/auth/signup', signupData);
    if (data && data.token) {
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // Quick switch role helper for easy testing without manual typing
  const quickSwitchUser = async (username, password) => {
    setLoading(true);
    try {
      await login(username, password);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const refreshSettings = async () => {
    fetchSettings();
  };

  const isAdmin = user?.role_name === 'admin';
  const isHOD = user?.role_name === 'hod';
  const isFaculty = user?.role_name === 'faculty';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        collegeSettings,
        login,
        loginWithGoogle,
        signup,
        logout,
        quickSwitchUser,
        refreshUser,
        refreshSettings,
        isAdmin,
        isHOD,
        isFaculty,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
