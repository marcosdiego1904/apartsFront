// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // <-- Asegúrate de importar Navigate
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/Login'; // Tu página de Login
// Importa tus otras páginas (cuando las tengas)
// import DashboardPage from './pages/DashboardPage';
// import UnitsPage from './pages/UnitsPage';
// import TenantDashboardPage from './pages/TenantDashboardPage';
// import UnauthorizedPage from './pages/UnauthorizedPage';

import ProtectedRoute from './components/ProtectedRoute';
import  {DashboardManager}  from './components/DashoardManager';
import './styles/globalStyles.css'
// Importa tu tipo de roles

function App() {
  return (
    <Router>
      {/* AuthProvider envuelve todo lo que necesita acceso al contexto */}
      <AuthProvider>

        <Routes>

          {/* Ruta Pública (Login) */}
          {/* LoginPage debería redirigir al dashboard si el usuario ya está autenticado */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas (requieren autenticación y/o rol) */}

          {/* Dashboard del Manager - REQUIERE ROL 'manager' */}
          <Route
            path="/manager/dashboard"
            element={
              // <-- ¡ENVOLVER EN FRAGMENT! -->
              <ProtectedRoute element={
                <>
                    <DashboardManager/> {/* El comentario está dentro del fragment */}
                  
                </>
              } requiredRole={'manager'} />
            }
          />

          {/* Dashboard del Inquilino - REQUIERE ROL 'tenant' */}
           <Route
             path="/tenant/dashboard"
             element={
               // <-- ¡ENVOLVER EN FRAGMENT! -->
               <ProtectedRoute element={
                 <>
                   {/* <TenantDashboardPage /> */}
                   <div>Dashboard Inquilino Protegido</div>
                 </>
               } requiredRole={'tenant'} />
             }
           />

          {/* Página de Gestión de Unidades - REQUIERE ROL 'manager' */}
          <Route
            path="/manager/units"
            element={
              // <-- ¡ENVOLVER EN FRAGMENT! -->
              <ProtectedRoute element={
                <>
                  {/* <UnitsPage /> */}
                  <div>Gestión de Unidades Protegida (Manager)</div>
                </>
              } requiredRole={'manager'} />
            }
          />

          {/* Página de Solicitudes de Mantenimiento - Podría ser para cualquier rol autenticado */}
           <Route
             path="/maintenance"
             element={
               // <-- ¡ENVOLVER EN FRAGMENT! -->
               <ProtectedRoute element={
                 <>
                   {/* <MaintenanceRequestsPage /> */}
                   <div>Solicitudes Mantenimiento (Ambos)</div>
                 </>
                }
                // No requiredRole significa que cualquier autenticado puede acceder
               />
             }
           />

          {/* Página de Acceso Denegado (Pública o Protegida, tú decides) */}
           {/* Si la proteges, solo autenticados que fallaron el rol pueden verla */}
           <Route
             path="/unauthorized"
             element={
               // <-- ¡ENVOLVER EN FRAGMENT! -->
               <>
                 {/* <UnauthorizedPage /> */}
                 <div>Acceso Denegado</div>
               </>
             }
           />

          {/* Ruta Raíz: Redirigir basado en si está logueado Y cuál es su rol */}
           {/* Esto es un poco más avanzado. Por ahora, simplemente redirige al login. */}
           {/* Asegúrate de importar Navigate de 'react-router-dom' si no lo has hecho */}
           <Route path="/" element={<Navigate to="/login" replace />} />


           {/* Opcional: Manejar rutas no encontradas */}
           {/* <Route path="*" element={<div>Página No Encontrada (404)</div>} /> */}

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;