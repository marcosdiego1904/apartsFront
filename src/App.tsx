// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardManager } from './components/DashoardManager';
import TenantDashboard from './components/tenantDasboard';
import './styles/globalStyles.css';
import './App.css';

// Un componente de layout para envolver las rutas del dashboard
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="dashboard-container">{children}</div>;
};

// Componente que decide qué layout usar
const AppLayout = () => {
  const location = useLocation();

  // No aplicar el layout del dashboard en la página de login
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  // Aplicar layout del dashboard para todas las otras rutas
  return (
    <DashboardLayout>
      <Routes>
        {/* Rutas Protegidas (requieren autenticación y/o rol) */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute 
              element={<DashboardManager />} 
              requiredRole={'manager'} 
            />
          }
        />
        <Route
          path="/tenant/dashboard"
          element={
            <ProtectedRoute 
              element={<TenantDashboard />} 
              requiredRole={'tenant'} 
            />
          }
        />
        <Route
          path="/manager/units"
          element={
            <ProtectedRoute 
              element={
                <div>
                  <h1>Gestión de Unidades Protegida (Manager)</h1>
                  <p>Aquí iría el componente de gestión de unidades</p>
                </div>
              } 
              requiredRole={'manager'} 
            />
          }
        />
        <Route
          path="/manager/maintenance"
          element={
            <ProtectedRoute
              element={
                <div>
                  <h1>Gestión de Mantenimiento (Manager)</h1>
                  <p>Aquí el manager podrá ver y gestionar las solicitudes de mantenimiento.</p>
                </div>
              }
              requiredRole={'manager'}
            />
          }
        />
        <Route
          path="/tenant/payments"
          element={
            <ProtectedRoute 
              element={
                <div>
                  <h1>Mis Pagos</h1>
                  <p>Vista del inquilino para ver historial de pagos y realizar nuevos pagos</p>
                </div>
              } 
              requiredRole={'tenant'} 
            />
          }
        />
        <Route
          path="/tenant/maintenance"
          element={
            <ProtectedRoute
              element={
                <div>
                  <h1>Solicitudes de Mantenimiento</h1>
                  <p>Aquí el inquilino podrá crear y ver sus solicitudes de mantenimiento.</p>
                </div>
              }
              requiredRole={'tenant'}
            />
          }
        />
        <Route
          path="/unauthorized"
          element={
            <div className="full-page-message-container">
              <div className="message-box">
                <div className="message-box-icon">🚫</div>
                <h1 className="message-box-title error">
                  Acceso Denegado
                </h1>
                <p className="message-box-text">
                  No tienes permisos para acceder a esta página.
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="message-box-button"
                >
                  Ir al Login
                </button>
              </div>
            </div>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={
          <div className="full-page-message-container">
            <div className="message-box">
              <div className="message-box-icon">🚧</div>
              <h1 className="message-box-title">
                Página No Encontrada
              </h1>
              <p className="message-box-text">
                La página que buscas no existe o ha sido movida.
              </p>
              <button
                onClick={() => window.location.href = '/login'}
                className="message-box-button"
              >
                Ir al Login
              </button>
            </div>
          </div>
        } />
      </Routes>
    </DashboardLayout>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    </Router>
  );
}

export default App;