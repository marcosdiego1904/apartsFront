import React, { useState, useEffect, useCallback } from 'react';
import Payments from './Payments';
import MaintenanceRequestForm from './MaintenanceRequestForm';
import { TenantSidebar } from './TenantSidebar';
import { TenantHeader } from './TenantHeader';
import '../styles/Pagination.css';
import '../styles/globalStyles.css';
import '../styles/TenantDashboard.css';
import type { PaymentRecordProperties, ChargeRecord } from '../types'; // Assuming types are in a central file
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { FiPlusCircle, FiMessageCircle } from 'react-icons/fi';

type ActiveView = 'dashboard' | 'payments' | 'documents' | 'messages' | 'profile' | 'maintenance';

// Interfaces for dashboard data
interface NextPayment {
  amount: number;
  dueDate: string;
  daysLeft: number;
}

interface MaintenanceSummary {
  id: string;
  title: string;
  status: string;
  dateSubmitted: string;
}

// Re-using ChargeRecord from types for consistency
// interface ChargeSummary { ... }

const PlusCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
);

const MessageCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const TenantDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth(); // Get auth loading state
  const [activeSection, setActiveSection] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // State for dashboard data
  const [nextPayment, setNextPayment] = useState<NextPayment | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceSummary[]>([]);
  const [managerCharges, setManagerCharges] = useState<ChargeRecord[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(() => {
    // Don't run if auth is still loading or if there's no user
    if (isAuthLoading || !user) {
        setIsDashboardLoading(false); // Stop loading if no user
        return;
    }
      setIsDashboardLoading(true);

      // --- Constants ---
      const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';
      const LOCAL_STORAGE_CHARGES_HISTORY_KEY = 'tenantChargesHistory';
      const LOCAL_STORAGE_MAINTENANCE_KEY = 'tenantSubmittedMaintenanceRequests';
      const DEFAULT_MONTHLY_AMOUNT = 150.75;
      const PAYMENT_DUE_DAY = 15;

      // --- Helper functions ---
      const getMonthYearString = (date: Date): string => date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      const getFirstDayOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
      const getFirstDayOfNextMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const determineNextPayableMonth = (tenantPayments: PaymentRecordProperties[], initialDate: Date | null): Date | null => {
        if (!initialDate) return null;
        let currentDate = getFirstDayOfMonth(new Date(initialDate));

        const isRentForMonthPaid = (monthDate: Date): boolean => {
          const targetConceptPrefix = `Alquiler ${getMonthYearString(monthDate)}`;
          return tenantPayments.some(p => p.status === 'completed' && p.concept.startsWith(targetConceptPrefix));
        };
        
        let attempts = 0;
        while (attempts < 240) { // Look up to 20 years
            if (!isRentForMonthPaid(currentDate)) {
                return currentDate;
            }
            currentDate = getFirstDayOfNextMonth(currentDate);
            attempts++;
        }
        return null;
      };
      
      // --- Fetch and Process Data ---
      const allPayments: PaymentRecordProperties[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY) || '[]');
      const tenantPayments = allPayments.filter(p => p.tenantId === user.id);

      const allCharges: ChargeRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY) || '[]');
      const pendingCharges = allCharges.filter(c => c.tenantId === user.id && c.status === 'pending');
      
      // --- Correctly Fetch, Merge, and Sort Maintenance Requests ---
      const tenantSubmittedReqs: any[] = JSON.parse(localStorage.getItem('tenantSubmittedMaintenanceRequests') || '[]');
      const managedReqs: any[] = JSON.parse(localStorage.getItem('managedMaintenanceRequests') || '[]');
      
      const managedStatusMap = new Map(managedReqs.map(req => [req.id, req.status]));
      
      const allTenantRequests = tenantSubmittedReqs
        .filter(req => !req.tenantId || req.tenantId === user.id) // This line might be the issue if tenantId isn't on the object
        .map(req => {
            const managerStatus = managedStatusMap.get(req.id);
            let finalStatus = req.status;
            
            if (managerStatus) {
                switch (managerStatus) {
                    case 'Pendiente': finalStatus = 'sent'; break;
                    case 'En Progreso': finalStatus = 'in-progress'; break;
                    case 'Completado': finalStatus = 'completed'; break;
                    case 'Rechazado': finalStatus = 'cancelled'; break;
                }
            }
            return { ...req, status: finalStatus };
        })
        .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()); // Sort by date DESC

      const recentMaintenance = allTenantRequests
        .slice(0, 3) // Now slice the top 3 AFTER sorting
        .map((req: any) => ({
            id: req.id,
            title: req.title,
            status: req.status,
            dateSubmitted: new Date(req.dateSubmitted).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        }));

      // --- Calculate Next Payment ---
      const baseDateForSearchLogic = user.createdAt ? new Date(user.createdAt) : new Date();

      const nextPayableMonthDate = determineNextPayableMonth(tenantPayments, baseDateForSearchLogic);
      const totalPendingCharges = pendingCharges.reduce((sum, charge) => sum + charge.amount, 0);
      
      if (nextPayableMonthDate) {
        const rentAmount = DEFAULT_MONTHLY_AMOUNT; // Always include rent if a month is payable
        const nextPaymentAmount = rentAmount + totalPendingCharges;

        const dueDate = new Date(nextPayableMonthDate.getFullYear(), nextPayableMonthDate.getMonth(), PAYMENT_DUE_DAY);
        const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
        
        setNextPayment({
          amount: nextPaymentAmount,
          dueDate: dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'}),
          daysLeft: daysLeft,
        });
      } else {
        // If no rent is due, the "next payment" only consists of pending charges
        if (totalPendingCharges > 0) {
            setNextPayment({
                amount: totalPendingCharges,
                dueDate: "Cargos Adicionales Pendientes",
                daysLeft: 0,
            });
        } else {
            setNextPayment(null); // No rent, no charges
        }
      }

      setManagerCharges(pendingCharges);
      setMaintenanceRequests(recentMaintenance);
      setIsDashboardLoading(false);
  }, [isAuthLoading, user]); // Add dependencies here

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Rerun effect when user or auth loading state changes

  const handleNavigate = (section: ActiveView) => {
    setActiveSection(section);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sectionTitles: { [key in ActiveView]: string } = {
    dashboard: 'Dashboard',
    payments: 'Historial de Pagos',
    documents: 'Mis Documentos',
    messages: 'Bandeja de Entrada',
    profile: 'Mi Perfil',
    maintenance: 'Solicitudes de Mantenimiento',
  };
  
  const tenant = {
    name: "Elena Pérez",
    role: "Tenant",
    unit: "Apt 4B"
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        // Centralized loading check
        if (isDashboardLoading || isAuthLoading) {
            return (
                <div className="dashboard-content-grid">
                    <div className="dashboard-card"><p>Cargando...</p></div>
                    <div className="dashboard-card"><p>Cargando...</p></div>
                    <div className="dashboard-card"><p>Cargando...</p></div>
                </div>
            );
        }

        return (
          <div className="dashboard-content-grid">
            {/* Next Payment Card */}
            {nextPayment ? (
              <div className="dashboard-card payment-card-summary">
                <h3 className="card-title">Próximo Pago</h3>
                <p className="payment-amount">${nextPayment.amount.toFixed(2)}</p>
                <p className="payment-due-date">{nextPayment.dueDate.includes("Cargos") ? nextPayment.dueDate : `Vence en ${nextPayment.daysLeft} días (${nextPayment.dueDate})`}</p>
                <button onClick={() => handleNavigate('payments')} className="card-button">Ir a Pagar</button>
              </div>
            ) : (
                <div className="dashboard-card payment-card-summary">
                    <h3 className="card-title">Pagos al Día</h3>
                    <p>No tienes pagos pendientes.</p>
                </div>
            )}

            {/* Maintenance Requests Card */}
            <div className="dashboard-card maintenance-summary">
              <h3 className="card-title">Solicitudes de Mantenimiento</h3>
              {maintenanceRequests.length > 0 ? (
                <ul>
                  {maintenanceRequests.map(req => (
                    <li key={req.id}>
                        <div className="request-info">
                            <span className="request-title">{req.title}</span>
                            <span className="request-date">{req.dateSubmitted}</span>
                        </div>
                        <span className={`status-badge status-${req.status}`}>{req.status.replace('-', ' ')}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>No hay solicitudes recientes.</p>}
              <button onClick={() => handleNavigate('maintenance')} className="card-button">Ver Todas</button>
            </div>

            {/* Manager Charges Card */}
            <div className="dashboard-card charges-summary">
              <h3 className="card-title">Cargos del Administrador</h3>
              {managerCharges.length > 0 ? (
                <ul>
                  {managerCharges.map(charge => (
                    <li key={charge.id}><span>{charge.concept}</span><span className="charge-amount">${charge.amount.toFixed(2)}</span></li>
                  ))}
                </ul>
              ) : <p>No hay cargos pendientes.</p>}
               <button onClick={() => handleNavigate('payments')} className="card-button">Revisar Cargos</button>
            </div>
            
            {/* Quick Actions Card */}
            <div className="dashboard-card quick-actions-summary">
                <h3 className="card-title">Acciones Rápidas</h3>
                <div className="quick-actions-container">
                    <button onClick={() => handleNavigate('maintenance')} className="action-button">
                        <FiPlusCircle />
                        <span>Nueva Solicitud</span>
                    </button>
                    <button onClick={() => handleNavigate('messages')} className="action-button">
                        <FiMessageCircle />
                        <span>Contactar Admin</span>
                    </button>
                </div>
            </div>
          </div>
        );
      case 'payments':
        return <Payments onPaymentSuccess={fetchDashboardData} />;
      case 'documents':
        return <div>Documents Content</div>;
      case 'messages':
        return <div>Messages Content</div>;
      case 'profile':
        return <div>Profile Content</div>;
      case 'maintenance':
        const allTenantRequests = getTenantRequests(user); // Helper function to get all requests
        return <MaintenanceRequestForm onFormSubmit={fetchDashboardData} requests={allTenantRequests} />;
      default:
        return <div>Dashboard Content</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <TenantSidebar 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        isCollapsed={!isSidebarOpen && isMobile}
      />
      <div className={`main-wrapper ${!isSidebarOpen && !isMobile ? '' : (isSidebarOpen && !isMobile ? '' : 'sidebar-collapsed')}`}>
        <TenantHeader
          currentSectionTitle={sectionTitles[activeSection]}
          userName={user ? `${user.firstName} ${user.lastName}` : 'Inquilino'}
          userRole={user?.role || 'Tenant'}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
        <div className="main-content-scroll-area">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

const getTenantRequests = (user: any) => {
    if (!user) return [];

    const tenantSubmittedReqs: any[] = JSON.parse(localStorage.getItem('tenantSubmittedMaintenanceRequests') || '[]');
    const managedReqs: any[] = JSON.parse(localStorage.getItem('managedMaintenanceRequests') || '[]');
    
    const managedStatusMap = new Map(managedReqs.map(req => [req.id, req.status]));
    
    return tenantSubmittedReqs
      .filter(req => !req.tenantId || req.tenantId === user.id) // Filter by tenant ID or if tenantId is missing
      .map(req => {
          const managerStatus = managedStatusMap.get(req.id);
          let finalStatus = req.status;
          
          if (managerStatus) {
              switch (managerStatus) {
                  case 'Pendiente': finalStatus = 'sent'; break;
                  case 'En Progreso': finalStatus = 'in-progress'; break;
                  case 'Completado': finalStatus = 'completed'; break;
                  case 'Rechazado': finalStatus = 'cancelled'; break;
              }
          }
          return { ...req, status: finalStatus };
      })
      .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
};

export default TenantDashboard;