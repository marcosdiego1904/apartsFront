import { useState,useEffect } from "react";
import { TenantHeader as Header } from "./TenantHeader";
import { MainContent } from "./mainContent";
import ManagerMaintenanceView from "./ManagerMaintenanceView";
import { ManagerSidebar } from "./ManagerSidebar";
import UserManagement from "./userList";
import EnhancedUnitList from "./UnitList";
import { getManagerDashboardData } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

export interface DashboardSummary {
  units: {
    total: number;
    occupied: number;
    available: number;
  } | null;
  payments: {
    totalPending: number;
    pendingCount: number;
    receivedThisMonth: number;
    receivedThisMonthCount: number;
  } | null;
  maintenance: {
    pending: number;
    inProgress: number;
    completedThisMonth: number;
  } | null;
  users: {
    totalActive: number;
    managers: number;
    tenants: number;
  } | null;
}

export const DashboardManager: React.FC = () => {
    const { logout } = useAuth();
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Default open on desktop
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
    const [summaryData, setSummaryData] = useState<DashboardSummary>({ units: null, payments: null, maintenance: null, users: null });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    const handleNavigate = (section: string) => {
      setActiveSection(section);
      if (isMobile) {
        setIsSidebarOpen(false); // Close sidebar on navigation on mobile
      }
    };
  
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
    
    const handleLogout = () => {
      logout();
    };
    
    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        if (!mobile) { // If screen is larger than mobile
          setIsSidebarOpen(true); // Keep sidebar open
        } else {
          setIsSidebarOpen(false); // Keep sidebar closed
        }
      };
  
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial check
  
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    useEffect(() => {
      const loadDashboard = async () => {
        setIsLoading(true);
        setError(null);

        try {
          // Fetch data from our new service
          const serviceData = await getManagerDashboardData();

          // Combine all data into the summary state
          setSummaryData({
            payments: serviceData.payments,
            maintenance: serviceData.maintenance,
            units: serviceData.units,
            users: serviceData.users
          });

        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Failed to load dashboard data. Some information may be missing.");
        } finally {
          setIsLoading(false);
        }
      };
      
      if (activeSection === 'dashboard') {
        loadDashboard();
      } else {
        setIsLoading(false); // Make sure loading is false if not on dashboard
      }
    }, [activeSection]);
  
    const sectionTitles: { [key: string]: string } = {
      dashboard: 'Dashboard Overview',
      users: 'User Management',
      units: 'Unit Management',
      payments: 'Payment Tracking',
      maintenance: 'Maintenance Requests',
    };
  
    return (
      <>
        {/* Injecting global styles. In a real app, import styles.css */}
        <div className="dashboard-container">
          <ManagerSidebar
            activeSection={activeSection} 
            onNavigate={handleNavigate} 
            isCollapsed={!isSidebarOpen && isMobile} // Sidebar is "collapsed" if not open AND on mobile
          />
          <div className={`main-wrapper ${!isSidebarOpen && !isMobile ? '' : (isSidebarOpen && !isMobile ? '' : 'sidebar-collapsed')}`}>
            <Header
              currentSectionTitle={sectionTitles[activeSection] || 'ApartsPro Panel'}
              userName="Admin User" // Example user
              userRole="Manager"    // Example role
              onToggleSidebar={toggleSidebar}
              onLogout={handleLogout}
            />
            
            <div className="main-content-scroll-area">
              {activeSection === 'maintenance' && <ManagerMaintenanceView />}
              {activeSection === 'users' && <UserManagement />}
              {activeSection === 'units' && <EnhancedUnitList />}
              {(activeSection === 'dashboard' || activeSection === 'payments') && (
                <MainContent 
                  activeSection={activeSection} 
                  summaryData={summaryData} 
                  isLoading={isLoading}
                  error={error}
                  onNavigate={handleNavigate}
                />
              )}
            </div>

          </div>
        </div>
      </>
    );
  };