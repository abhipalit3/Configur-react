import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, signIn, signUp, confirmSignUp } from 'aws-amplify/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        await checkAuthState();
      }
      return { isSignedIn };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      setError(null);
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      return { isSignUpComplete, userId, nextStep };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const confirmRegistration = async (email, code) => {
    try {
      setError(null);
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { isSignUpComplete };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    confirmRegistration,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};