// src/components/ProtectedRoute.tsx
// src/components/ProtectedRoute.tsx
import type { ReactElement } from 'react';
import { Navigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 // Asegúrate de tener un tipo para los roles si no lo tienes
// Asegúrate de tener un tipo para los roles si no lo tienes
import type { UserRole } from '../types';
// Definimos los posibles roles si no están ya en UserRole en types/index.ts
 // O importar de types/index.ts

interface ProtectedRouteProps {
  element?: ReactElement;
  // Añadimos una prop para el rol requerido
  requiredRole?: UserRole; // Especificamos que espera uno de los roles válidos
}

const ProtectedRoute = ({ element, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth(); // Ahora necesitamos el objeto user

  // 1. Mientras estamos cargando el estado de autenticación, mostramos algo
  if (isLoading) {
    return <div>Cargando...</div>; // Spinner o pantalla de carga inicial
  }

  // 2. Una vez que la carga termina, verificamos si está autenticado
  if (!isAuthenticated) {
    // Si NO está autenticado, redirigimos al usuario a la página de login
    return <Navigate to="/login" replace />;
  }

  // 3. Si SÍ está autenticado, verificamos el rol si requiredRole está especificado
  // user es de tipo User | null, pero ya sabemos que isAuthenticated es true,
  // lo que implica que user NO debería ser null aquí. TypeScript puede necesitar una pequeña ayuda.
  // Podemos usar una guardia (user != null) o confiar en la lógica del AuthProvider.
  if (requiredRole && (!user || user.role !== requiredRole)) {
     console.warn(`Usuario autenticado (${user?.username}) intentó acceder a ruta protegida con rol "${requiredRole}", pero tiene rol "${user?.role}".`);
    // Si se requiere un rol, pero el usuario no existe (no debería pasar si isAuthenticated es true)
    // O si el rol del usuario NO coincide con el rol requerido
    // Redirigir a una página de 'Acceso Denegado' o a su dashboard por defecto
    // Asegúrate de tener una ruta /unauthorized o /dashboard (para su rol)
    return <Navigate to="/unauthorized" replace />; // O redirigir al dashboard por defecto: <Navigate to="/" replace />;
  }

  // 4. Si pasa todas las verificaciones (autenticado Y rol correcto si se requiere), renderizamos el elemento
  return element;
};

export default ProtectedRoute;