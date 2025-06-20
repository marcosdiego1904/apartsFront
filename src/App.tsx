// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardManager } from './components/DashoardManager';
import  TenantDashboard  from './components/tenantDasboard';
import './styles/globalStyles.css'

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>

          {/* Ruta Pública (Login) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas (requieren autenticación y/o rol) */}

          {/* Dashboard del Manager - REQUIERE ROL 'manager' */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute 
                element={<DashboardManager />} 
                requiredRole={'manager'} 
              />
            }
          />

          {/* Dashboard del Inquilino - REQUIERE ROL 'tenant' */}
          <Route
            path="/tenant/dashboard"
            element={
              <ProtectedRoute 
                element={<TenantDashboard />} 
                requiredRole={'tenant'} 
              />
            }
          />

          {/* Página de Gestión de Unidades - REQUIERE ROL 'manager' */}
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

          {/* Página de Gestión de Mantenimiento para Manager - REQUIERE ROL 'manager' */}
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

          {/* Página de Pagos para Inquilino */}
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

          {/* Página de Solicitudes de Mantenimiento para Inquilino */}
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

          {/* Página de Acceso Denegado */}
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

          {/* Ruta Raíz: Redirigir al login por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Manejar rutas no encontradas */}
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
      </ErrorBoundary>
    </Router>
  );
}

export default App;