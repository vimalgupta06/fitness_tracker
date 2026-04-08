import { createContext, useContext, useEffect, useReducer } from 'react';
import { getMe } from '@/api/auth';

const AuthContext = createContext(null);

const initialState = { user: null, loading: true, isAuthenticated: false };

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'CLEAR_USER':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'CLEAR_USER' });
      return;
    }
    getMe()
      .then(({ data }) => dispatch({ type: 'SET_USER', payload: data.data.user }))
      .catch(() => {
        localStorage.clear();
        dispatch({ type: 'CLEAR_USER' });
      });
  }, []);

  const login = (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = () => {
    localStorage.clear();
    dispatch({ type: 'CLEAR_USER' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
