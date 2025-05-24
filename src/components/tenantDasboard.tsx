import React, { useState, useEffect } from 'react';
import Payments from './Payments'; // Import the Payments component

interface NotificationItem {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  time: string;
  unread: boolean;
}

interface ActivityItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

interface MaintenanceRequest {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  date: string;
  priority: 'low' | 'medium' | 'high';
}

// Define a type for the possible views
type ActiveView = 'dashboard' | 'payments' | 'maintenance' | 'documents' | 'messages' | 'profile';

const TenantDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('dashboard'); // State for active view
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const tenant = {
    name: "María García",
    unit: "Torre Sunset - Apt 405",
    address: "Av. Principal 123, Ciudad",
    initials: "MG"
  };

  const paymentInfo = {
    nextPayment: {
      amount: 1250.00,
      dueDate: "15 Jun 2024",
      daysLeft: 5,
      status: "pending"
    },
    history: [
      { month: "Mayo 2024", status: "paid", amount: 1250.00 },
      { month: "Abril 2024", status: "paid", amount: 1250.00 },
      { month: "Marzo 2024", status: "paid", amount: 1250.00 }
    ]
  };

  const maintenanceStats = {
    pending: 1,
    inProgress: 2,
    completed: 8
  };

  const notifications: NotificationItem[] = [
    { id: 1, type: 'info', message: 'Mantenimiento programado del elevador - 20 Jun', time: '2h', unread: true },
    { id: 2, type: 'success', message: 'Tu pago de Mayo fue procesado exitosamente', time: '1d', unread: true },
    { id: 3, type: 'warning', message: 'Recordatorio: Inspección anual próxima semana', time: '3d', unread: false }
  ];

  const recentActivity: ActivityItem[] = [
    { id: 1, icon: '💳', title: 'Pago procesado', description: 'Renta de Mayo - $1,250.00', time: '2 días', color: 'success' },
    { id: 2, icon: '🔧', title: 'Solicitud actualizada', description: 'Reparación de grifo - En progreso', time: '3 días', color: 'info' },
    { id: 3, icon: '📄', title: 'Documento agregado', description: 'Contrato renovado disponible', time: '1 semana', color: 'purple' }
  ];

  const maintenanceRequests: MaintenanceRequest[] = [
    { id: 1, title: 'Fuga en el baño', status: 'pending', date: '10 Jun', priority: 'high' },
    { id: 2, title: 'Aire acondicionado', status: 'in-progress', date: '08 Jun', priority: 'medium' }
  ];

  const formatGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Function to handle view change
  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="dashboard-container">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <span className="logo-text">ResidenceHub</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a href="#" className={`nav-item ${activeView === 'payments' ? 'active' : ''}`} onClick={() => handleNavClick('payments')}>
            <span className="nav-icon">💳</span>
            <span className="nav-text">Pagos</span>
          </a>
          <a href="#" className={`nav-item ${activeView === 'maintenance' ? 'active' : ''}`} onClick={() => handleNavClick('maintenance')}>
            <span className="nav-icon">🔧</span>
            <span className="nav-text">Mantenimiento</span>
          </a>
          <a href="#" className={`nav-item ${activeView === 'documents' ? 'active' : ''}`} onClick={() => handleNavClick('documents')}>
            <span className="nav-icon">📄</span>
            <span className="nav-text">Documentos</span>
          </a>
          <a href="#" className={`nav-item ${activeView === 'messages' ? 'active' : ''}`} onClick={() => handleNavClick('messages')}>
            <span className="nav-icon">💬</span>
            <span className="nav-text">Mensajes</span>
          </a>
          <a href="#" className={`nav-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Mi Perfil</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <div className="emergency-contact">
            <h4>Contacto de Emergencia</h4>
            <p>📞 (123) 456-7890</p>
            <p>✉️ admin@residencehub.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div className="greeting">
              <h1>{formatGreeting()}, {tenant.name}!</h1>
              <p>📍 {tenant.unit} • {tenant.address}</p>
            </div>
          </div>
          
          <div className="header-right">
            <button className="notification-bell">
              <span className="bell-icon">🔔</span>
              <span className="notification-badge">2</span>
            </button>
            
            <div className="user-avatar">
              <span>{tenant.initials}</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper with Scroll */}
        <div className="content-wrapper">
          {activeView === 'dashboard' && (
            <>
              {/* Quick Stats */}
              <div className="quick-stats">
              <div className="stat-card stat-payment">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Próximo Pago</h3>
              <p className="stat-value">${paymentInfo.nextPayment.amount}</p>
              <p className="stat-detail">Vence en {paymentInfo.nextPayment.daysLeft} días</p>
            </div>
          </div>
          
          <div className="stat-card stat-maintenance">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <h3>Solicitudes Activas</h3>
              <p className="stat-value">{maintenanceStats.pending + maintenanceStats.inProgress}</p>
              <p className="stat-detail">{maintenanceStats.pending} pendientes</p>
            </div>
          </div>
          
          <div className="stat-card stat-notifications">
            <div className="stat-icon">📬</div>
            <div className="stat-content">
              <h3>Notificaciones</h3>
              <p className="stat-value">{notifications.filter(n => n.unread).length}</p>
              <p className="stat-detail">Sin leer</p>
            </div>
          </div>
          
          <div className="stat-card stat-unit">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>Mi Unidad</h3>
              <p className="stat-value">Apt 405</p>
              <p className="stat-detail">Torre Sunset</p>
            </div>
          </div>
        </div>

              {/* Quick Actions */}
              <div className="quick-actions">
              <button className="action-btn action-payment">
            <span className="action-icon">💳</span>
            <span>Hacer Pago</span>
          </button>
          <button className="action-btn action-maintenance">
            <span className="action-icon">🔧</span>
            <span>Nueva Solicitud</span>
          </button>
          <button className="action-btn action-documents">
            <span className="action-icon">📄</span>
            <span>Ver Contratos</span>
          </button>
          <button className="action-btn action-contact">
            <span className="action-icon">💬</span>
            <span>Contactar Admin</span>
          </button>
        </div>

              {/* Main Grid */}
              <div className="dashboard-grid">
                {/* Payment Section */}
                <section className="dashboard-section payment-section">
                <h2 className="section-title">💳 Estado de Pagos</h2>
            
            <div className="payment-card">
              <div className="payment-header">
                <h3>Próximo Pago de Renta</h3>
                <span className="payment-status status-pending">Pendiente</span>
              </div>
              
              <div className="payment-amount">
                <span className="currency">$</span>
                <span className="amount">{paymentInfo.nextPayment.amount.toFixed(2)}</span>
              </div>
              
              <div className="payment-details">
                <div className="detail-item">
                  <span className="detail-label">Fecha de vencimiento</span>
                  <span className="detail-value">{paymentInfo.nextPayment.dueDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Días restantes</span>
                  <span className="detail-value highlight">{paymentInfo.nextPayment.daysLeft} días</span>
                </div>
              </div>
              
              <button className="pay-now-btn">
                Pagar Ahora →
              </button>
            </div>

            <div className="payment-history">
              <h4>Historial Reciente</h4>
              {paymentInfo.history.map((payment, index) => (
                <div key={index} className="history-item">
                  <span className="history-month">{payment.month}</span>
                  <span className="history-status status-paid">✓ Pagado</span>
                  <span className="history-amount">${payment.amount}</span>
                </div>
              ))}
            </div>
          </section>

                {/* Maintenance Section */}
                <section className="dashboard-section maintenance-section">
                <h2 className="section-title">🔧 Solicitudes de Mantenimiento</h2>
            
            <div className="maintenance-stats">
              <div className="maint-stat">
                <div className="maint-stat-icon pending">⏳</div>
                <div className="maint-stat-info">
                  <span className="maint-stat-value">{maintenanceStats.pending}</span>
                  <span className="maint-stat-label">Pendientes</span>
                </div>
              </div>
              
              <div className="maint-stat">
                <div className="maint-stat-icon progress">🔄</div>
                <div className="maint-stat-info">
                  <span className="maint-stat-value">{maintenanceStats.inProgress}</span>
                  <span className="maint-stat-label">En Progreso</span>
                </div>
              </div>
              
              <div className="maint-stat">
                <div className="maint-stat-icon completed">✅</div>
                <div className="maint-stat-info">
                  <span className="maint-stat-value">{maintenanceStats.completed}</span>
                  <span className="maint-stat-label">Completadas</span>
                </div>
              </div>
            </div>

            <div className="maintenance-list">
              <h4>Solicitudes Activas</h4>
              {maintenanceRequests.map((request) => (
                <div key={request.id} className={`maintenance-item status-${request.status}`}>
                  <div className="maintenance-info">
                    <h5>{request.title}</h5>
                    <p className="maintenance-date">📅 {request.date}</p>
                  </div>
                  <div className="maintenance-meta">
                    <span className={`priority priority-${request.priority}`}>
                      {request.priority === 'high' ? '🔴' : request.priority === 'medium' ? '🟡' : '🟢'}
                    </span>
                    <span className="maintenance-status">
                      {request.status === 'pending' ? 'Pendiente' : 
                       request.status === 'in-progress' ? 'En Progreso' : 'Completada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="view-all-btn">
              Ver Todas las Solicitudes
            </button>
          </section>

                {/* Notifications & Activity Section */}
                <section className="dashboard-section notifications-section">
                <div className="notifications-container">
              <h2 className="section-title">�� Notificaciones</h2>
              
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''} type-${notif.type}`}>
                    <div className="notif-icon">
                      {notif.type === 'info' ? 'ℹ️' : 
                       notif.type === 'success' ? '✅' : 
                       notif.type === 'warning' ? '⚠️' : '❌'}
                    </div>
                    <div className="notif-content">
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="activity-container">
              <h2 className="section-title">📋 Actividad Reciente</h2>
              
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className={`activity-item color-${activity.color}`}>
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <h5>{activity.title}</h5>
                      <p>{activity.description}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
              </div>
            </>
          )}
          {activeView === 'payments' && <Payments />}
          {activeView === 'maintenance' && (
            <section className="dashboard-section">
              <h2 className="section-title">🔧 Mantenimiento</h2>
              <p>Contenido de la sección de Mantenimiento irá aquí...</p>
              {/* Puedes mover la lógica de "Maintenance Section" aquí si es necesario */}
            </section>
          )}
          {activeView === 'documents' && (
            <section className="dashboard-section">
              <h2 className="section-title">📄 Documentos</h2>
              <p>Contenido de la sección de Documentos irá aquí...</p>
            </section>
          )}
           {activeView === 'messages' && (
            <section className="dashboard-section">
              <h2 className="section-title">💬 Mensajes</h2>
              <p>Contenido de la sección de Mensajes irá aquí...</p>
            </section>
          )}
          {activeView === 'profile' && (
            <section className="dashboard-section">
              <h2 className="section-title">👤 Mi Perfil</h2>
              <p>Contenido de la sección de Mi Perfil irá aquí...</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;