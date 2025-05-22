// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode} from 'react';
import { login as authServiceLogin, logout as authServiceLogout} from '../services/authService';

// 1. Define la interfaz para el valor que proporcionará el contexto
interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<{ redirectTo: string }>; // Retorna la ruta de redirección
  logout: () => Promise<void>;
}

// 2. Define el valor por defecto del contexto
const defaultAuthContextValue: AuthContextValue = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => { throw new Error('AuthContext provider not found'); },
  logout: async () => { throw new Error('AuthContext provider not found'); },
};

// 3. Crea el contexto con el valor por defecto tipado
const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue);

type Props = { children: ReactNode }

// 4. Función para determinar la ruta de redirección basada en el rol
const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'manager':
      return '/manager/dashboard';
    case 'tenant':
      return '/tenant/dashboard';
    default:
      return '/dashboard';
  }
};

export const AuthProvider = ({ children }: Props) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Lógica para verificar sesión al cargar la app ---
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      
      if (storedToken && storedUser) {
        console.log("Checking for existing token...");
        setIsLoading(true);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Latencia simulada

          const parsedUser: User = JSON.parse(storedUser);
          
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("Existing token found and user set:", parsedUser);

        } catch (err) {
          console.error("Token verification failed:", err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // --- Función de login ---
  const login = async (credentials: any): Promise<{ redirectTo: string }> => {
    setError(null);
    
    try {
      setIsLoading(true);
      const authData = await authServiceLogin(credentials);

      // Guardar tanto el token como los datos del usuario
      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('authUser', JSON.stringify(authData.user));
      
      setToken(authData.token);
      setUser(authData.user);
      setIsAuthenticated(true);
      
      console.log("AuthContext updated after login success:", authData.user);

      // Determinar la ruta de redirección basada en el rol
      const redirectTo = getRedirectPath(authData.user.role);
      
      return { redirectTo };

    } catch (err) {
      console.error("AuthContext login failed:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login.');
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- Función de logout ---
  const logout = async () => {
    await authServiceLogout();

    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log("AuthContext logout successful.");
  };

  // --- Define el valor que se pasará a través del contexto ---
  const contextValue: AuthContextValue = {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook personalizado useAuth ---
import { useContext } from 'react';
import type { User} from '../types';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === defaultAuthContextValue) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};