import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { User, AuthState } from '../types';
import { authApi } from '../services/api';

type AuthAction =
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('vi_token'),
  isLoading: true,
};

const reducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('vi_token');
    if (token) {
      authApi.me()
        .then(res => dispatch({ type: 'SET_USER', payload: { user: res.data.user, token } }))
        .catch(() => {
          localStorage.removeItem('vi_token');
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('vi_token', token);
    dispatch({ type: 'SET_USER', payload: { user, token } });
    const redirect = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await authApi.register({ name, email, password, role });
    const { token, user } = res.data;
    localStorage.setItem('vi_token', token);
    dispatch({ type: 'SET_USER', payload: { user, token } });
    const redirect = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    const { token, user } = res.data;
    localStorage.setItem('vi_token', token);
    dispatch({ type: 'SET_USER', payload: { user, token } });
    const redirect = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirect;
  };

  const logout = () => {
    localStorage.removeItem('vi_token');
    sessionStorage.removeItem('redirectAfterLogin');
    dispatch({ type: 'LOGOUT' });
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};