import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, getTokens, setTokens, clearTokens, setOnSessionExpired, ApiError } from '../utils/api';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [tokensState, setTokensState] = useState(() => getTokens());
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(() => {
    const existingTokens = getTokens();
    return Boolean(existingTokens.access || existingTokens.refresh);
  });

  // Helper to format user object with UI fallback fields
  const formatUser = (userObj) => {
    if (!userObj) return null;
    const fullName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.username || 'User';
    return {
      ...userObj,
      role: userObj.role || 'customer',
      is_superuser: userObj.is_superuser,
      is_staff: userObj.is_staff,
      name: fullName,
      fullName: fullName,
      mobile: userObj.phone_number || '',
    };
  };

  const handleSessionExpired = useCallback(() => {
    clearTokens();
    setTokensState({ access: null, refresh: null });
    setCurrentUser(null);
    setIsResolving(false);
  }, []);

  useEffect(() => {
    setOnSessionExpired(handleSessionExpired);
  }, [handleSessionExpired]);

  // Session rehydration on app mount
  useEffect(() => {
    let isMounted = true;
    async function rehydrateSession() {
      const existingTokens = getTokens();
      if (!existingTokens.access && !existingTokens.refresh) {
        if (isMounted) setIsResolving(false);
        return;
      }

      try {
        const meProfile = await apiRequest('/api/accounts/me/');
        if (isMounted) {
          setCurrentUser(formatUser(meProfile));
          setTokensState(getTokens());
        }
      } catch (err) {
        if (isMounted) {
          clearTokens();
          setTokensState({ access: null, refresh: null });
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsResolving(false);
        }
      }
    }

    rehydrateSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = useCallback(async ({ username, password }) => {
    setIsLoading(true);
    try {
      // 1. Authenticate & get tokens
      const loginRes = await apiRequest('/api/accounts/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      });

      const { access, refresh, user: initialUser } = loginRes;

      setTokens({ access, refresh });
      setTokensState({ access, refresh });

      // 2. Fetch official /me profile
      let meProfile = initialUser;
      try {
        meProfile = await apiRequest('/api/accounts/me/');
      } catch (meErr) {
        // Fall back to initialUser if /me fails temporarily
      }

      const formatted = formatUser(meProfile);
      setCurrentUser(formatted);
      setIsLoading(false);
      return formatted;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Registration handler
  const register = useCallback(async ({ username, email, password, phone_number, name }) => {
    setIsLoading(true);
    try {
      const payload = {
        username,
        email,
        password,
      };
      if (phone_number) payload.phone_number = phone_number;

      // 1. Call register endpoint
      await apiRequest('/api/accounts/register/', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      });

      // 2. Register endpoint returns user object without tokens.
      // Automatically issue follow-up login call to authenticate and set session.
      const loggedInUser = await login({ username, password });
      return loggedInUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [login]);

  // Logout handler
  const logout = useCallback(async () => {
    const currentRefresh = tokensState.refresh;
    setIsLoading(true);

    if (currentRefresh) {
      try {
        await apiRequest('/api/accounts/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: currentRefresh }),
        });
      } catch (err) {
        // Ignore logout network failure, continue clearing local state
      }
    }

    clearTokens();
    setTokensState({ access: null, refresh: null });
    setCurrentUser(null);
    setIsLoading(false);
  }, [tokensState.refresh]);

  // OTP Request handler
  const requestOtp = useCallback(async (identifier) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/api/accounts/otp/login/request/', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
        skipAuth: true,
      });
      setIsLoading(false);
      return res;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, []);

  // OTP Verify handler
  const verifyOtp = useCallback(async ({ identifier, otp_code }) => {
    setIsLoading(true);
    try {
      const loginRes = await apiRequest('/api/accounts/otp/login/verify/', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp_code }),
        skipAuth: true,
      });

      const { access, refresh, user: initialUser } = loginRes;

      setTokens({ access, refresh });
      setTokensState({ access, refresh });

      // Fetch official /me profile
      let meProfile = initialUser;
      try {
        meProfile = await apiRequest('/api/accounts/me/');
      } catch (meErr) {
        // Fall back to initialUser if /me fails temporarily
      }

      const formatted = formatUser(meProfile);
      setCurrentUser(formatted);
      setIsLoading(false);
      return formatted;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    tokens: tokensState,
    isLoggedIn: Boolean(tokensState.access && currentUser),
    isLoading,
    isResolving,
    login,
    register,
    logout,
    requestOtp,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
