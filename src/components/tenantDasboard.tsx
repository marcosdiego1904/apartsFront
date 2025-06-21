import React, { useState, useEffect, useCallback } from 'react';
import Payments from './Payments';
import MaintenanceRequestForm from './MaintenanceRequestForm';
import { TenantSidebar } from './TenantSidebar';
import { TenantHeader } from './TenantHeader';
import '../styles/Pagination.css';
import '../styles/globalStyles.css';
import '../styles/TenantDashboard.css';
import type { ChargeRecord } from '../types'; // Assuming types are in a central file
import type { MaintenanceRequestDisplayItem } from '../services/MockBackendService';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { getTenantDashboardData } from '../services/dashboardService';
import { FiPlusCircle, FiMessageCircle } from 'react-icons/fi';
import ComingSoon from './ComingSoon'; // Importar el nuevo componente

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

const TenantDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // State for dashboard data
  const [nextPayment, setNextPayment] = useState<NextPayment | null>(null);
  const [maintenanceSummary, setMaintenanceSummary] = useState<MaintenanceSummary[]>([]);
  const [pendingCharges, setPendingCharges] = useState<ChargeRecord[]>([]);
  const [allTenantRequests, setAllTenantRequests] = useState<MaintenanceRequestDisplayItem[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    if (isAuthLoading || !user) {
      setIsDashboardLoading(false);
      return;
    }
    setIsDashboardLoading(true);
    try {
      const data = await getTenantDashboardData(user.id);
      setNextPayment(data.nextPayment);
      setMaintenanceSummary(data.maintenanceRequestSummary);
      setPendingCharges(data.pendingCharges);
      setAllTenantRequests(data.allTenantMaintenanceRequests);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFormSubmit = () => {
    // After a new maintenance request is submitted, refetch all data
    fetchDashboardData();
    // Navigate back to the dashboard to see the summary
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    logout();
    // The AuthProvider will handle redirecting to /login
  };

  const handleNavigate = (section: ActiveView) => {
    setActiveSection(section);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
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
    payments: 'Payments',
    documents: 'Documents',
    messages: 'Messages',
    profile: 'Profile',
    maintenance: 'Maintenance',
  };
  
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
                <h3 className="card-title">Next Payment</h3>
                <p className="payment-amount">${nextPayment.amount.toFixed(2)}</p>
                <p className="payment-due-date">{nextPayment.dueDate.includes("Charges") ? nextPayment.dueDate : `Due in ${nextPayment.daysLeft} days (${nextPayment.dueDate})`}</p>
                <button onClick={() => handleNavigate('payments')} className="card-button">View History</button>
              </div>
            ) : (
                <div className="dashboard-card payment-card-summary">
                    <h3 className="card-title">No Pending Payments</h3>
                    <p>You are all caught up.</p>
                </div>
            )}

            {/* Maintenance Requests Card */}
            <div className="dashboard-card maintenance-summary">
              <h3 className="card-title">Maintenance Requests</h3>
              {maintenanceSummary.length > 0 ? (
                <ul>
                  {maintenanceSummary.map(req => (
                    <li key={req.id}>
                        <div className="request-info">
                            <span className="request-title">{req.title}</span>
                            <span className="request-date">{req.dateSubmitted}</span>
                        </div>
                        <span className={`status-badge status-${req.status}`}>{req.status.replace('-', ' ')}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>No recent requests found.</p>}
              <button onClick={() => handleNavigate('maintenance')} className="card-button">View All</button>
            </div>

            {/* Manager Charges Card */}
            <div className="dashboard-card charges-summary">
              <h3 className="card-title">Additional Charges</h3>
              {pendingCharges.length > 0 ? (
                <ul>
                  {pendingCharges.map(charge => (
                    <li key={charge.id}><span>{charge.concept}</span><span className="charge-amount">${charge.amount.toFixed(2)}</span></li>
                  ))}
                </ul>
              ) : <p>No pending charges.</p>}
               <button onClick={() => handleNavigate('payments')} className="card-button">View Details</button>
            </div>
            
            {/* Quick Actions Card */}
            <div className="dashboard-card quick-actions-summary">
                <h3 className="card-title">Quick Actions</h3>
                <div className="quick-actions-container">
                    <button onClick={() => handleNavigate('maintenance')} className="action-button">
                        <FiPlusCircle />
                        <span>New Request</span>
                    </button>
                    <button onClick={() => handleNavigate('messages')} className="action-button">
                        <FiMessageCircle />
                        <span>Contact Manager</span>
                    </button>
                </div>
            </div>
          </div>
        );
      case 'payments':
        return <Payments onPaymentSuccess={fetchDashboardData} />;
      case 'documents':
        return <ComingSoon />;
      case 'messages':
        return <ComingSoon />;
      case 'profile':
        return <ComingSoon />;
      case 'maintenance':
        return <MaintenanceRequestForm onFormSubmit={handleFormSubmit} requests={allTenantRequests} />;
      default:
        return <div>Dashboard Content</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div 
        className={`sidebar-overlay ${isSidebarOpen && isMobile ? 'active' : ''}`}
        onClick={toggleSidebar}
      ></div>
      <TenantSidebar 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />
      <div className={`main-wrapper ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
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

export default TenantDashboard;