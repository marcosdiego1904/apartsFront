// src/components/TenantDashboard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Iconos SVG básicos
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/>
    <line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);

const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l3.5-3.5a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0l-3.5 3.5Z"/>
    <path d="m18.01 9.01 .01-.01"/>
    <path d="M12 12c-2 2-2 5-2 5s3-1 5-2l6-6L12 2z"/>
    <path d="M2 22l4-4"/>
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  icon, 
  children, 
  bgColor = '#ffffff',
  iconColor = '#4299e1'
}) => {
  return (
    <div style={{
      backgroundColor: bgColor,
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: `${iconColor}20`,
          color: iconColor,
          padding: '12px',
          borderRadius: '50%',
          marginRight: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <h3 style={{
          margin: 0,
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#2d3748'
        }}>
          {title}
        </h3>
      </div>
      <div style={{ color: '#4a5568' }}>
        {children}
      </div>
    </div>
  );
};

export const TenantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon />
          <h1 style={{
            margin: '0 0 0 12px',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2d3748'
          }}>
            Portal del Inquilino
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: '#f7fafc',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer'
          }}>
            <BellIcon />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f7fafc',
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#4299e1',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>
                {user?.firstName} {user?.lastName} ({user?.username})
              </div>
              <div style={{ fontSize: '12px', color: '#718096' }}>
                Inquilino
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <LogOutIcon />
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#2d3748',
              marginBottom: '8px'
            }}>
              ¡Bienvenido, {user?.firstName || user?.username}!
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#718096',
              margin: 0
            }}>
              Aquí puedes gestionar tus pagos, solicitudes de mantenimiento y más.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <DashboardCard
              title="Mis Pagos"
              icon={<CreditCardIcon />}
              iconColor="#38a169"
            >
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#38a169', marginBottom: '8px' }}>
                $1,200
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • Próximo pago: 1 de Junio
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • Estado: Al día
              </div>
              <div style={{ fontSize: '14px' }}>
                • Último pago: 1 de Mayo
              </div>
            </DashboardCard>

            <DashboardCard
              title="Solicitudes de Mantenimiento"
              icon={<WrenchIcon />}
              iconColor="#e53e3e"
            >
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#e53e3e', marginBottom: '8px' }}>
                2
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • 1 Pendiente
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • 1 En proceso
              </div>
              <div style={{ fontSize: '14px' }}>
                • 3 Completadas este mes
              </div>
            </DashboardCard>

            <DashboardCard
              title="Mi Unidad"
              icon={<HomeIcon />}
              iconColor="#4299e1"
            >
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4299e1', marginBottom: '8px' }}>
                Apt 101
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • Edificio: Torre A
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                • Piso: 1
              </div>
              <div style={{ fontSize: '14px' }}>
                • 2 habitaciones, 1 baño
              </div>
            </DashboardCard>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <button style={{
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#3182ce'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#4299e1'}
            >
              <CreditCardIcon />
              Realizar Pago
            </button>

            <button style={{
              backgroundColor: '#38a169',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2f855a'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#38a169'}
            >
              <WrenchIcon />
              Nueva Solicitud de Mantenimiento
            </button>

            <button style={{
              backgroundColor: '#805ad5',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#6b46c1'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#805ad5'}
            >
              <BellIcon />
              Ver Notificaciones
            </button>
          </div>

          {/* Recent Activity */}
          <div style={{
            marginTop: '32px',
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '16px'
            }}>
              Actividad Reciente
            </h3>
            
            <div style={{ color: '#718096' }}>
              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>✅ Pago de Mayo procesado exitosamente</span>
                <span style={{ fontSize: '14px', color: '#a0aec0' }}>Hace 2 días</span>
              </div>
              
              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🔧 Solicitud de reparación de grifo - En proceso</span>
                <span style={{ fontSize: '14px', color: '#a0aec0' }}>Hace 3 días</span>
              </div>
              
              <div style={{
                padding: '12px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>📧 Nuevo aviso: Mantenimiento del edificio programado</span>
                <span style={{ fontSize: '14px', color: '#a0aec0' }}>Hace 1 semana</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};