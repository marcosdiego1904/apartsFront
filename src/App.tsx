// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardManager } from './components/DashoardManager';
import { TenantDashboard } from './components/tenantDasboard';
import './styles/globalStyles.css'

function App() {
  return (
    <Router>
      {/* AuthProvider envuelve todo lo que necesita acceso al contexto */}
      <AuthProvider>
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

          {/* Página de Solicitudes de Mantenimiento para Manager */}
          <Route
            path="/manager/maintenance"
            element={
              <ProtectedRoute 
                element={
                  <div>
                    <h1>Gestión de Mantenimiento (Manager)</h1>
                    <p>Vista del manager para gestionar solicitudes de mantenimiento</p>
                  </div>
                } 
                requiredRole={'manager'} 
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
                    <h1>Mis Solicitudes de Mantenimiento</h1>
                    <p>Vista del inquilino para ver y crear solicitudes de mantenimiento</p>
                  </div>
                } 
                requiredRole={'tenant'} 
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

          {/* Página genérica de mantenimiento - para cualquier usuario autenticado */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute 
                element={
                  <div>
                    <h1>Solicitudes de Mantenimiento</h1>
                    <p>Vista genérica de mantenimiento</p>
                  </div>
                }
                // No requiredRole significa que cualquier autenticado puede acceder
              />
            }
          />

          {/* Página de Acceso Denegado */}
          <Route
            path="/unauthorized"
            element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f7fafc',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '40px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  maxWidth: '500px'
                }}>
                  <div style={{
                    fontSize: '4rem',
                    marginBottom: '16px'
                  }}>
                    🚫
                  </div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#e53e3e',
                    marginBottom: '16px'
                  }}>
                    Acceso Denegado
                  </h1>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#718096',
                    marginBottom: '24px'
                  }}>
                    No tienes permisos para acceder a esta página.
                  </p>
                  <button
                    onClick={() => window.location.href = '/login'}
                    style={{
                      backgroundColor: '#4299e1',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              backgroundColor: '#f7fafc',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                maxWidth: '500px'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '16px'
                }}>
                  404
                </div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#2d3748',
                  marginBottom: '16px'
                }}>
                  Página No Encontrada
                </h1>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#718096',
                  marginBottom: '24px'
                }}>
                  La página que buscas no existe o ha sido movida.
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    backgroundColor: '#4299e1',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Ir al Login
                </button>
              </div>
            </div>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;