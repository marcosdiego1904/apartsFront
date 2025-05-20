// src/components/Header.tsx (TEMPORAL - SOLO PARA DEPURAR)
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando Header...</div>;
  }

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ccc' }}>
      <span>Mi App de Condominios</span>

      {/* Contenido que SOLO aparece si el usuario está autenticado */}
      {isAuthenticated ? (
        <div>
          {/* TEMPORAL: PONEMOS SOLO UN TEXTO SIMPLE */}
          <span>DEBUG: Autenticado. User existe? {String(!!user)}.</span>
          {/* <button onClick={logout} style={{ marginLeft: '10px' }}> Cerrar Sesión </button> */} {/* Comenta el botón por ahora */}
        </div>
      ) : (
        // Contenido para no autenticados
        <div>
          {/* ... */}
        </div>
      )}
    </header>
  );
};

export default Header;