// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode} from 'react';
import { login as authServiceLogin, logout as authServiceLogout} from '../services/authService'; // Importa el servicio real


// 1. Define la interfaz para el valor que proporcionará el contexto
interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean; // Renombrado a isLoading para claridad
  error: string | null; // Para manejar errores a nivel de contexto si aplica
  login: (credentials: any) => Promise<void>; // Función para iniciar sesión (recibe credenciales)
  logout: () => Promise<void>; // Función para cerrar sesión
  // Opcional: Función para establecer el usuario si ya tienes un token (ej. desde localStorage)
  // checkAuthStatus: () => Promise<void>;
}

// 2. Define el valor por defecto del contexto (debe coincidir con la interfaz)
// Este valor solo se usa si no hay un Provider arriba en el árbol.
// Ponemos valores que arrojen errores al intentar usarlos para debugging.
const defaultAuthContextValue: AuthContextValue = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => { throw new Error('AuthContext provider not found'); },
  logout: async () => { throw new Error('AuthContext provider not found'); },
  // checkAuthStatus: async () => { throw new Error('AuthContext provider not found'); },
};

// 3. Crea el contexto con el valor por defecto tipado
const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue);

type Props = { children: ReactNode }
// 4. Crea el componente Provider (este es el importante)

export const AuthProvider = ({ children }: Props) => {
  // Aquí mantienes el estado real de la autenticación
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Empezamos cargando para checkAuthStatus
  const [error, setError] = useState<string | null>(null); // Para errores globales de auth

  // --- Lógica para verificar sesión al cargar la app (usando useEffect) ---
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // TODO: Aquí deberías tener una función en authService para
        // validar el token o obtener el usuario usando el token.
        // Por ahora, simularemos que si hay un token, el usuario está autenticado
        // En un caso real, llamarías a una API /me o similar.
        console.log("Checking for existing token...");
        setIsLoading(true);
        try {
            // Simulamos la verificación del token
            await new Promise(resolve => setTimeout(resolve, 500)); // Latencia

            // TODO: Reemplazar con llamada a authService.verifyToken(storedToken) o getUserWithToken(storedToken)
            // Simulamos un usuario si hay un token
             const simulatedUser: User = {
                 id: 'user-from-storage',
                 username: 'logged_in_user',
                 role: 'tenant' // O el rol que necesites simular
             };

            setToken(storedToken);
            setUser(simulatedUser);
            setIsAuthenticated(true);
            console.log("Existing token found and user set.");

        } catch (err) {
            console.error("Token verification failed:", err);
            localStorage.removeItem('authToken'); // Limpiar token inválido
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
             // No setting error state here usually, just log out
        } finally {
            setIsLoading(false);
        }

      } else {
        setIsLoading(false); // No hay token, terminamos la carga
      }
    };

    checkAuthStatus();
  }, []); // El array vacío asegura que esto solo se ejecute una vez al montar

  // --- Funciones login y logout que actualizarán este estado ---

  // Esta función será llamada desde LoginPage (a través del hook useAuth)
  const login = async (credentials: any) => { // Usar la interfaz Credentials si la importas
     setError(null); // Limpiar errores previos de login
    try {
      setIsLoading(true); // Poner loading mientras se llama al servicio
      const authData = await authServiceLogin(credentials); // Llama al servicio real

      localStorage.setItem('authToken', authData.token); // Guarda el token (si aplica)
      setToken(authData.token);
      setUser(authData.user);
      setIsAuthenticated(true);
      console.log("AuthContext updated after login success.");

    } catch (err) {
      console.error("AuthContext login failed:", err);
       // Pasa el error para que LoginPage lo muestre si es necesario,
       // o maneja el error globalmente aquí si prefieres
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login.');
       setIsAuthenticated(false); // Asegurar que el estado sea falso en caso de error
       setUser(null);
       setToken(null);
       localStorage.removeItem('authToken'); // Limpiar cualquier token residual
       throw err; // Re-lanza el error para que el componente que llamó (LoginPage) pueda manejarlo también
    } finally {
        setIsLoading(false); // Quitar loading
    }
  };

  // Esta función será llamada desde cualquier parte de la app (a través del hook useAuth)
  const logout = async () => {
    //TODO: Si tu backend tiene un endpoint de logout, llámalo aquí
     await authServiceLogout(); // Llama al servicio real (si implementaste logout)

    localStorage.removeItem('authToken'); // Limpia el token del storage
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null); // Limpia cualquier error
     console.log("AuthContext logout successful.");

     // TODO: Redirigir al usuario a la página de login después del logout
     // Esto lo harás típicamente en un useEffect que reaccione a isAuthenticated === false
  };


  // --- Define el valor que se pasará a través del contexto ---
  const contextValue: AuthContextValue = {
    isAuthenticated,
    user,
    token,
    isLoading,
    error, // Incluye el error en el valor del contexto
    login, // Pasa la función login definida en este Provider
    logout, // Pasa la función logout definida en este Provider
  };

  // 5. Retorna el Provider, envolviendo a los hijos y pasando el valor
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Ahora creamos el hook personalizado useAuth ---
// src/hooks/useAuth.ts
import { useContext } from 'react'; // Importa el contexto creado
import type { User} from '../types';

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Opcional: Verifica si el hook se usa dentro del Provider
  if (context === defaultAuthContextValue) { // Compara con el valor por defecto
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context; // Retorna el valor del contexto
};