import React, { useState, useEffect } from 'react';
import Payments from './Payments'; // Import the Payments component
import MaintenanceRequestForm from './MaintenanceRequestForm'; // Importar el formulario
import MaintenanceRequestListItem from './MaintenanceRequestListItem'; // Will update to use new Type
import { type MaintenanceRequest } from '../types/maintenance'; // Adjusted path
import '../styles/MaintenanceRequestListItem.css'; // Importar los estilos para el ítem de lista
import '../styles/Pagination.css'; // Añadiremos este archivo CSS para los estilos de paginación
import '../styles/globalStyles.css'; // Importar los estilos globales
import '../styles/TenantDashboardMaintenance.css'; // Importar los nuevos estilos para la sección de mantenimiento
// import '../styles/TenantDashboard.css'; // Estilos específicos para el dashboard si los tienes - Comentado temporalmente

// Definición de la interfaz para los datos del formulario, que debe coincidir con la que espera MaintenanceRequestForm
interface MaintenanceRequestFormData {
  description: string;
  category: string;
  specificLocation: string;
  urgency: 'Baja' | 'Media' | 'Alta/Emergencia';
  permissionToEnter: boolean;
  preferredEntryTime: string;
}

// Interfaces para otros datos del dashboard (si las necesitas)
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

// Define a type for the possible views
type ActiveView = 'dashboard' | 'payments' | 'maintenance' | 'documents' | 'messages' | 'profile' | 'maintenance-details';

const ITEMS_PER_PAGE = 5; // Constante para items por página
const SHARED_LOCAL_STORAGE_KEY = 'allMaintenanceRequests'; // Clave única para localStorage compartida
const LOGGED_IN_TENANT_ID = 'TEN001';
const LOGGED_IN_TENANT_NAME = "Elena Pérez"; // Added for consistency
const DEFAULT_PROPERTY_ID = 'PROP001'; // Added for consistency

// Updated initialMockData to conform to MaintenanceRequest type fully
const initialMockData: MaintenanceRequest[] = [
  { 
    id: 'mock-req-001', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Fuga en lavabo del baño', 
    description: 'Hay una fuga constante de agua debajo del lavabo en el baño principal, parece venir de la tubería de desagüe.', 
    category: 'Plomería', 
    specificLocation: 'Baño principal, debajo del lavabo', 
    urgency: 'Emergency', 
    permissionToEnter: true, 
    preferredEntryTime: 'Cualquier día por la mañana', 
    submittedDate: '2024-07-20T09:30:00Z', 
    createdAt: '2024-07-20T09:30:00Z', 
    status: 'Sent' 
  },
  { 
    id: 'mock-req-002', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Aire acondicionado no enfría bien', 
    description: 'El aire acondicionado de la sala de estar enciende pero no expulsa aire frío, solo ventila a temperatura ambiente.', 
    category: 'Aire Acondicionado/Calefacción', 
    specificLocation: 'Sala de estar', 
    urgency: 'Medium', 
    permissionToEnter: true, 
    preferredEntryTime: 'Lunes o Miércoles de 2pm a 5pm', 
    submittedDate: '2024-07-18T14:00:00Z', 
    createdAt: '2024-07-18T14:00:00Z', 
    status: 'In Progress', // Example status, manager might set this
    scheduledDate: '2024-07-22T10:00:00Z' 
  },
  { 
    id: 'mock-req-003', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Bombilla principal de cocina quemada', 
    description: 'Una de las bombillas principales del techo de la cocina se quemó y necesito ayuda para reemplazarla ya que está muy alta.', 
    category: 'Electricidad', 
    specificLocation: 'Cocina, luz de techo', 
    urgency: 'Low', 
    permissionToEnter: false, 
    submittedDate: '2024-07-17T11:00:00Z', 
    createdAt: '2024-07-17T11:00:00Z', 
    status: 'Received' // Example status
  },
  { 
    id: 'mock-req-004', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Puerta de entrada no cierra correctamente', 
    description: 'La puerta de entrada roza con el marco y cuesta cerrarla.', 
    category: 'Cerrajería', 
    specificLocation: 'Puerta de entrada principal', 
    urgency: 'Medium', 
    permissionToEnter: true, 
    submittedDate: '2024-07-16T08:00:00Z', 
    createdAt: '2024-07-16T08:00:00Z', 
    status: 'Scheduled', // Example status
    scheduledDate: '2024-07-23T15:00:00Z' 
  },
  { 
    id: 'mock-req-005', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Mancha de humedad en techo del dormitorio', 
    description: 'Ha aparecido una mancha de humedad en el techo del dormitorio principal.', 
    category: 'Pintura', 
    specificLocation: 'Dormitorio principal, techo', 
    urgency: 'Low', 
    permissionToEnter: true, 
    submittedDate: '2024-07-15T16:00:00Z', 
    createdAt: '2024-07-15T16:00:00Z', 
    status: 'Resolved/Pending Review' // Example status
  }, 
  { 
    id: 'mock-req-006', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Cristal de ventana de salón rajado', 
    description: 'El cristal de una de las ventanas del salón tiene una raja.', 
    category: 'Otro', 
    specificLocation: 'Salón, ventana izquierda', 
    urgency: 'Medium', 
    permissionToEnter: true, 
    submittedDate: '2024-07-14T10:00:00Z', 
    createdAt: '2024-07-14T10:00:00Z', 
    status: 'Completed', // Example status
    feedbackRating: 5, 
    feedbackComments: 'Trabajo rápido y muy profesional. El cristal quedó perfecto.' 
  },
  { 
    id: 'mock-req-007', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Grifo de la cocina gotea sin parar', 
    description: 'El grifo de la cocina no para de gotear, incluso estando cerrado.', 
    category: 'Plomería', 
    specificLocation: 'Cocina, grifo fregadero', 
    urgency: 'Medium', 
    permissionToEnter: true, 
    preferredEntryTime: 'Cualquier mañana entre 9am y 1pm', 
    submittedDate: '2024-07-13T17:00:00Z', 
    createdAt: '2024-07-13T17:00:00Z', 
    status: 'Sent' 
  },
  { 
    id: 'mock-req-008', 
    tenantId: LOGGED_IN_TENANT_ID, 
    propertyId: DEFAULT_PROPERTY_ID, 
    tenantName: LOGGED_IN_TENANT_NAME,
    title: 'Persiana del dormitorio pequeño atascada', 
    description: 'La persiana del dormitorio pequeño no sube ni baja, parece atascada.', 
    category: 'Otro', 
    specificLocation: 'Dormitorio pequeño', 
    urgency: 'Low', 
    permissionToEnter: true, 
    submittedDate: '2024-07-12T12:00:00Z', 
    createdAt: '2024-07-12T12:00:00Z', 
    status: 'Received' // Example status
  }
];

const TenantDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('dashboard'); // State for active view
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null); // Para la vista de detalles
  const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual
  
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(() => {
    const storedRequests = localStorage.getItem(SHARED_LOCAL_STORAGE_KEY);
    if (storedRequests) {
      try {
        const parsedRequests = JSON.parse(storedRequests) as MaintenanceRequest[];
        // Filter for this tenant's requests or all if that's the desired view here
        // For now, load all and let UI decide if/how to filter for display
        return Array.isArray(parsedRequests) ? parsedRequests : [];
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
        return [];
      }
    } 
    // If localStorage is empty, seed it with this tenant's specific mock data.
    // The manager dashboard can seed its own if it loads first and finds it empty.
    localStorage.setItem(SHARED_LOCAL_STORAGE_KEY, JSON.stringify(initialMockData.filter(req => req.tenantId === LOGGED_IN_TENANT_ID)));
    return initialMockData.filter(req => req.tenantId === LOGGED_IN_TENANT_ID);
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allStoredRequestsJSON = localStorage.getItem(SHARED_LOCAL_STORAGE_KEY);
    let allRequestsInStorage: MaintenanceRequest[] = [];
    if (allStoredRequestsJSON) {
        try {
            const parsed = JSON.parse(allStoredRequestsJSON);
            if (Array.isArray(parsed)) {
                allRequestsInStorage = parsed;
            }
        } catch (e) {
            console.error("Error parsing allStoredRequests from localStorage during save", e);
        }
    }

    // Merge current state (which includes newly added requests by this tenant)
    // with whatever is already in storage.
    const combinedRequests = [...allRequestsInStorage];
    let newItemsAddedToStorage = false;

    maintenanceRequests.forEach(localRequest => {
        if (!combinedRequests.find(req => req.id === localRequest.id)) {
            combinedRequests.push(localRequest);
            newItemsAddedToStorage = true;
        }
        // Note: This doesn't handle updates to existing requests from this tenant in the shared list.
        // For that, one would need to find and replace, or use a more robust state management.
    });

    if (newItemsAddedToStorage) {
        localStorage.setItem(SHARED_LOCAL_STORAGE_KEY, JSON.stringify(combinedRequests));
    }
    // The `maintenanceRequests` state for TenantDashboard will display all requests from shared storage.
    // Filtering for *this tenant* specifically for display can be done in the rendering logic if needed,
    // or the initial load can filter, but saving should always save all.

  }, [maintenanceRequests]);

  // Mock data for tenant info (can be enhanced)
  const tenant = {
    id: LOGGED_IN_TENANT_ID,
    name: LOGGED_IN_TENANT_NAME,
    unit: "Edificio Sol - Apt 3B",
    address: "Calle Luna 45, Ciudad Jardín",
    initials: LOGGED_IN_TENANT_NAME.split(' ').map(n=>n[0]).join('')
  };

  const paymentInfo = {
    nextPayment: {
      amount: 950.00,
      dueDate: "01 Ago 2024",
      daysLeft: 10,
      status: "pending"
    },
    history: [
      { month: "Julio 2024", status: "paid", amount: 950.00 }
    ]
  };

  const notificationsData: NotificationItem[] = [
    { id: 1, type: 'info', message: 'Reunión de vecinos programada para el 05 de Agosto.', time: 'Hace 1h', unread: true },
    { id: 2, type: 'warning', message: 'Recordatorio: Pago de cuota de comunidad vence pronto.', time: 'Hace 3 días', unread: true}
  ];

  const recentActivityData: ActivityItem[] = [
    { id: 1, icon: '💰', title: 'Pago de Renta Confirmado', description: 'Renta Julio - $950.00', time: 'Hace 2 días', color: 'success' },
    { id: 2, icon: '🔧', title: 'Mantenimiento Actualizado', description: 'AC no enfría (Mock) - Programada', time: 'Hace 5 horas', color: 'info'}
  ];

  const formatGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Function to handle view change
  const handleNavClick = (view: ActiveView, requestId?: string) => {
    setActiveView(view);
    if (requestId) {
      setSelectedRequestId(requestId);
    } else if (view === 'maintenance') {
      setCurrentPage(1); 
      setSelectedRequestId(null); 
    }
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleMaintenanceSubmit = (formData: MaintenanceRequestFormData) => {
    const nowISO = new Date().toISOString();
    const newRequest: MaintenanceRequest = {
      id: 'user-' + nowISO + Math.random().toString(36).substring(2,9),
      tenantId: tenant.id,
      tenantName: tenant.name,
      propertyId: tenant.unit.includes('PROP') ? tenant.unit.split('-')[0].trim() : DEFAULT_PROPERTY_ID, // Basic logic for propertyId
      title: formData.description.substring(0, 50) + (formData.description.length > 50 ? '...' : ''),
      description: formData.description,
      category: formData.category,
      specificLocation: formData.specificLocation,
      urgency: formData.urgency === 'Alta/Emergencia' ? 'Emergency' : formData.urgency === 'Media' ? 'Medium' : 'Low',
      permissionToEnter: formData.permissionToEnter,
      preferredEntryTime: formData.preferredEntryTime,
      submittedDate: nowISO,
      createdAt: nowISO,
      status: 'Sent',
    };
    setMaintenanceRequests(prevRequests => [newRequest, ...prevRequests]);
    setCurrentPage(1); 
  };

  const handleViewMaintenanceDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setActiveView('maintenance-details'); 
  };

  // Lógica de Paginación
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  // Displaying requests for the current tenant from the shared list
  const tenantSpecificRequests = maintenanceRequests.filter(req => req.tenantId === LOGGED_IN_TENANT_ID);
  const currentRequestsToDisplay = tenantSpecificRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tenantSpecificRequests.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages && pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
    }
  };

  // Renderizar el contenido principal basado en activeView
  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        const activeTenantRequests = maintenanceRequests.filter(r => r.tenantId === LOGGED_IN_TENANT_ID && r.status !== 'Completed' && r.status !== 'Cancelled').length;
        const pendingTenantRequests = maintenanceRequests.filter(r => r.tenantId === LOGGED_IN_TENANT_ID && (r.status === 'Sent' || r.status === 'Received')).length;
        const inProgressOrScheduledTenantRequests = maintenanceRequests.filter(r => r.tenantId === LOGGED_IN_TENANT_ID && (r.status === 'In Progress' || r.status === 'Scheduled')).length;
        const resolvedOrPendingReviewTenantRequests = maintenanceRequests.filter(r => r.tenantId === LOGGED_IN_TENANT_ID && (r.status === 'Completed' || r.status === 'Resolved/Pending Review')).length;

        return (
          <>
            <div className="quick-stats">
              <div className="stat-card stat-payment"><div className="stat-icon">💰</div><div className="stat-content"><h3>Próximo Pago</h3><p className="stat-value">${paymentInfo.nextPayment.amount.toFixed(2)}</p><p className="stat-detail">Vence el {paymentInfo.nextPayment.dueDate}</p></div></div>
              <div className="stat-card stat-maintenance"><div className="stat-icon">🔧</div><div className="stat-content"><h3>Solicitudes Activas</h3><p className="stat-value">{activeTenantRequests}</p><p className="stat-detail">{pendingTenantRequests} pendientes</p></div></div>
              <div className="stat-card stat-notifications"><div className="stat-icon">📬</div><div className="stat-content"><h3>Notificaciones</h3><p className="stat-value">{notificationsData.filter(n => n.unread).length}</p><p className="stat-detail">Sin leer</p></div></div>
              <div className="stat-card stat-unit"><div className="stat-icon">🏢</div><div className="stat-content"><h3>Mi Unidad</h3><p className="stat-value">{(tenant.unit.split(' - ')[1] || 'N/A').trim()}</p><p className="stat-detail">{(tenant.unit.split(' - ')[0] || 'N/A').trim()}</p></div></div>
            </div>
            <div className="quick-actions">
                <button className="action-btn action-payment" onClick={() => handleNavClick('payments')}><span className="action-icon">💳</span><span>Hacer Pago</span></button>
                <button className="action-btn action-maintenance" onClick={() => handleNavClick('maintenance')}><span className="action-icon">🔧</span><span>Nueva Solicitud</span></button>
                <button className="action-btn action-documents" onClick={() => handleNavClick('documents')}><span className="action-icon">📄</span><span>Ver Documentos</span></button>
                <button className="action-btn action-contact" onClick={() => handleNavClick('messages')}><span className="action-icon">💬</span><span>Contactar Admin</span></button>
            </div>
            <div className="dashboard-grid">
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

                <section className="dashboard-section maintenance-section">
                    <h2 className="section-title">🔧 Solicitudes de Mantenimiento</h2>
                    <div className="maintenance-stats">
                        <div className="maint-stat"><div className="maint-stat-icon pending">⏳</div><div className="maint-stat-info"><span className="maint-stat-value">{pendingTenantRequests}</span><span className="maint-stat-label">Pendientes</span></div></div>
                        <div className="maint-stat"><div className="maint-stat-icon progress">🔄</div><div className="maint-stat-info"><span className="maint-stat-value">{inProgressOrScheduledTenantRequests}</span><span className="maint-stat-label">En Progreso</span></div></div>
                        <div className="maint-stat"><div className="maint-stat-icon completed">✅</div><div className="maint-stat-info"><span className="maint-stat-value">{resolvedOrPendingReviewTenantRequests}</span><span className="maint-stat-label">Resueltas</span></div></div>
                    </div>
                    <div className="maintenance-list-summary">
                        <h4>Últimas Solicitudes</h4>
                        {tenantSpecificRequests.length > 0 ? (
                            <ul className="maintenance-requests-list">
                                {tenantSpecificRequests.slice(0, Math.min(3, tenantSpecificRequests.length)).map(req => (
                                <MaintenanceRequestListItem key={req.id} request={req} onViewDetails={handleViewMaintenanceDetails} />
                                ))}
                            </ul>
                        ) : <p>No hay solicitudes recientes.</p>}
                    </div>
                    <button className="view-all-btn" onClick={() => handleNavClick('maintenance')}>Ver Todas las Solicitudes</button>
                </section>

                <section className="dashboard-section notifications-section">
                    <h2 className="section-title">📬 Notificaciones</h2>
                     <div className="notifications-list">
                        {notificationsData.length > 0 ? notificationsData.map((notif) => (
                        <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''} type-${notif.type}`}>
                            <div className="notif-icon">
                            {notif.type === 'info' ? 'ℹ️' : notif.type === 'success' ? '✅' : notif.type === 'warning' ? '⚠️' : '❌'}
                            </div>
                            <div className="notif-content"><p className="notif-message">{notif.message}</p><span className="notif-time">{notif.time}</span></div>
                        </div>
                        )) : <p>No hay notificaciones nuevas.</p>}
                    </div>
                </section>
            </div>
          </>
        );
      case 'payments':
        return <Payments />;
      case 'maintenance':
        return (
          <section className="dashboard-section maintenance-view-section">
            <div className="dashboard-section maintenance-form-container">
              <h2 className="section-title">Crear Nueva Solicitud de Mantenimiento</h2>
              <MaintenanceRequestForm onSubmit={handleMaintenanceSubmit} />
            </div>
            
            <div className="dashboard-section existing-requests-container" style={{marginTop: '40px'}}>
              <h3 className="section-title">Mis Solicitudes</h3>
              {tenantSpecificRequests.length > 0 ? (
                <>
                  <ul className="maintenance-requests-list">
                    {currentRequestsToDisplay.map(req => (
                      <MaintenanceRequestListItem key={req.id} request={req} onViewDetails={handleViewMaintenanceDetails} />
                    ))}
                  </ul>
                  {totalPages > 1 && (
                    <div className="pagination-controls-modern">
                      <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1} 
                        aria-label="Página anterior"
                        className="pagination-arrow"
                      >
                        &laquo; Anterior
                      </button>
                      <div className="page-numbers">
                        {[...Array(totalPages).keys()].map(num => (
                          <button 
                            key={num + 1} 
                            onClick={() => paginate(num + 1)} 
                            className={`page-button-modern ${currentPage === num + 1 ? 'active-page-modern' : ''}`}
                            aria-current={currentPage === num + 1 ? 'page' : undefined}
                            aria-label={`Ir a página ${num + 1}`}
                          >
                            {num + 1}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages} 
                        aria-label="Página siguiente"
                        className="pagination-arrow"
                      >
                        Siguiente &raquo;
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <span className="empty-state-icon">🛠️</span>
                  <p className="empty-state-message">No tienes solicitudes de mantenimiento activas.</p>
                  <p className="empty-state-suggestion">¡Crea una nueva usando el formulario de arriba!</p>
                </div>
              )}
            </div>
          </section>
        );
      case 'maintenance-details':
        const request = maintenanceRequests.find(r => r.id === selectedRequestId);
        if (!request) return (
            <section className="dashboard-section">
                 <div className="dashboard-section centered-message">
                    <p>Solicitud no encontrada o ID no seleccionado.</p>
                    <button 
                        onClick={() => handleNavClick('maintenance')} 
                        className="action-btn"
                        style={{marginTop: '20px'}}
                    >
                        ← Volver a la lista
                    </button>
                </div>
            </section>
        );

        const submittedDateDisplay = request.submittedDate ? new Date(request.submittedDate).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const scheduledDateDisplay = request.scheduledDate ? new Date(request.scheduledDate).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const resolutionDateDisplay = request.resolutionDate ? new Date(request.resolutionDate).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

        return (
          <section className="dashboard-section maintenance-detail-view">
            <button 
                onClick={() => handleNavClick('maintenance')} 
                className="action-btn back-to-list-btn"
                style={{marginBottom: '25px'}}
            >
                <span className="icon-arrow-left">←</span> Volver a la lista
            </button>
            
            <div className="dashboard-section request-detail-card">
                <div className="detail-header">
                    <h3 className="section-title">{request.title || 'Detalle de Solicitud'}</h3>
                    <span className={`status-badge status-${request.status.toLowerCase().replace(/[/\\s]+/g, '-')}`}>
                        {request.status}
                    </span>
                </div>

                <div className="detail-grid">
                    <div className="detail-item">
                        <strong className="detail-label">ID de Solicitud:</strong>
                        <span className="detail-value">{request.id}</span>
                    </div>
                    <div className="detail-item">
                        <strong className="detail-label">Inquilino:</strong>
                        <span className="detail-value">{request.tenantName || 'N/A'} (ID: {request.tenantId})</span>
                    </div>
                    <div className="detail-item">
                        <strong className="detail-label">Propiedad:</strong>
                        <span className="detail-value">{request.propertyId}</span>
                    </div>
                     <div className="detail-item">
                        <strong className="detail-label">Categoría:</strong>
                        <span className="detail-value">{request.category}</span>
                    </div>
                    <div className="detail-item">
                        <strong className="detail-label">Ubicación Específica:</strong>
                        <span className="detail-value">{request.specificLocation}</span>
                    </div>
                    <div className="detail-item">
                        <strong className="detail-label">Nivel de Urgencia:</strong>
                        <span className={`urgency-tag urgency-${request.urgency.toLowerCase().replace(/[/\\s]+/g, '-')}`}>
                            {request.urgency}
                        </span>
                    </div>
                    <div className="detail-item full-width">
                        <strong className="detail-label">Descripción Completa:</strong>
                        <p className="detail-value-paragraph">{request.description}</p>
                    </div>
                   
                    <div className="detail-item">
                        <strong className="detail-label">Permiso de Entrada:</strong>
                        <span className="detail-value">{request.permissionToEnter ? 'Sí' : 'No'}</span>
                    </div>
                    {request.permissionToEnter && request.preferredEntryTime && (
                        <div className="detail-item">
                            <strong className="detail-label">Franja Horaria Preferida:</strong>
                            <span className="detail-value">{request.preferredEntryTime}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <strong className="detail-label">Fecha de Envío:</strong>
                        <span className="detail-value">{submittedDateDisplay}</span>
                    </div>
                    {request.status === 'Scheduled' && request.scheduledDate && (
                        <div className="detail-item">
                            <strong className="detail-label">Fecha Programada:</strong>
                            <span className="detail-value">{scheduledDateDisplay}</span>
                        </div>
                    )}
                    {(request.status === 'Completed' || request.status === 'Resolved/Pending Review') && request.resolutionDate && (
                        <div className="detail-item">
                            <strong className="detail-label">Fecha de Resolución:</strong>
                            <span className="detail-value">{resolutionDateDisplay}</span>
                        </div>
                    )}
                </div>

                {request.managerNotes && (
                    <div className="manager-notes-section">
                        <h4 className="section-title">Notas del Administrador:</h4>
                        <p className="notes-content">{request.managerNotes}</p>
                    </div>
                )}

                {request.status === 'Resolved/Pending Review' && (
                    <div className="feedback-section-modern">
                        <h4 className="section-title">Valora este servicio</h4>
                        {request.feedbackRating || request.feedbackComments ? (
                            <div className="feedback-display">
                                {request.feedbackRating && <p><strong>Tu valoración:</strong> <span className="rating-stars">{Array(request.feedbackRating).fill('⭐').join('')}</span> ({request.feedbackRating}/5)</p>}
                                {request.feedbackComments && <p><strong>Tus comentarios:</strong> {request.feedbackComments}</p>}
                                <p className="feedback-submitted-message"><em><small>Valoración ya enviada. ¡Gracias!</small></em></p>
                            </div>
                        ) : (
                            <div className="feedback-form-placeholder">
                                <p><em>(Aquí implementaremos el FeedbackForm para la solicitud con ID: {request.id})</em></p>
                                {/* <FeedbackForm requestId={request.id} onSubmit={handleFeedbackSubmitFunction} /> */}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </section>
        );
      case 'documents':
        return <section className="dashboard-section"><h2 className="section-title">📄 Documentos</h2><p>El contenido de la sección de Documentos irá aquí.</p></section>;
      case 'messages':
        return <section className="dashboard-section"><h2 className="section-title">💬 Mensajes</h2><p>El contenido de la sección de Mensajes irá aquí.</p></section>;
      case 'profile':
        return <section className="dashboard-section"><h2 className="section-title">👤 Mi Perfil</h2><p>El contenido de la sección de Mi Perfil irá aquí.</p></section>;
      default:
        return <p>Vista no encontrada.</p>;
    }
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
          <a href="#" className={`nav-item ${activeView.startsWith('maintenance') ? 'active' : ''}`} onClick={() => handleNavClick('maintenance')}>
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
              {notificationsData.filter(n => n.unread).length > 0 && 
                <span className="notification-badge">{notificationsData.filter(n => n.unread).length}</span>
              }
            </button>
            
            <div className="user-avatar">
              <span>{tenant.initials}</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper with Scroll */}
        <div className="content-wrapper">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;