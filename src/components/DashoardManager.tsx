import { useState,useEffect } from "react";
import { TenantHeader as Header } from "./TenantHeader";
import { MainContent } from "./mainContent";
import ManagerMaintenanceView from "./ManagerMaintenanceView";
import { ManagerSidebar } from "./ManagerSidebar";
import { getAllUnits, getAllUsers } from "../services/api";
import UserManagement from "./userList";
import EnhancedUnitList from "./UnitList";
import type { Unit } from "../services/api";
import type { PaymentRecordProperties, ChargeRecord } from "../types";
import { transformTenantRequest, type MaintenanceRequest, type TenantRequestDisplayItem } from "../utils/maintenanceUtils";

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
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Default open on desktop
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
    const [summaryData, setSummaryData] = useState<DashboardSummary>({ units: null, payments: null, maintenance: null, users: null });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    // Helper function to parse "dd/mm/yyyy" dates
    const parseESDate = (dateString: string): Date | null => {
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return null;
      const parts = dateString.split('/');
      // Note: months are 0-based in JS Date constructor (0 for Jan, 11 for Dec)
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    };
  
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
      // Clear user-related data from localStorage
      localStorage.removeItem('token'); // Assuming a token is stored for the session
      localStorage.removeItem('user'); // Assuming user info is stored
      // Add any other keys that should be cleared on logout
      // Redirect to the login page
      window.location.href = '/login'; // Or your login route
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
      // This function will handle the entire data fetching and processing logic.
      const loadDashboard = async () => {
        setIsLoading(true);
        setError(null);

        // --- Stage 1: Load fast, synchronous data from localStorage ---
        try {
          // Synchronize Maintenance Requests first
          const tenantSubmittedItems: TenantRequestDisplayItem[] = JSON.parse(localStorage.getItem('tenantSubmittedMaintenanceRequests') || '[]');
          let managedRequests: MaintenanceRequest[] = JSON.parse(localStorage.getItem('managedMaintenanceRequests') || '[]');
          
          const managedRequestIds = new Set(managedRequests.map(req => req.id));
          const newTransformedRequests = tenantSubmittedItems
            .filter(tenantItem => !managedRequestIds.has(tenantItem.id))
            .map(transformTenantRequest);

          if (newTransformedRequests.length > 0) {
            managedRequests = [...managedRequests, ...newTransformedRequests];
            localStorage.setItem('managedMaintenanceRequests', JSON.stringify(managedRequests));
          }

          // Process Payments & Maintenance from the synced data
          const allPayments: PaymentRecordProperties[] = JSON.parse(localStorage.getItem('tenantPaymentHistory') || '[]');
          const allCharges: ChargeRecord[] = JSON.parse(localStorage.getItem('tenantChargesHistory') || '[]');
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const pendingCharges = allCharges.filter(c => c.status === 'pending');
          const totalPending = pendingCharges.reduce((sum, charge) => sum + charge.amount, 0);
          const pendingCount = pendingCharges.length;
          const completedPaymentsThisMonth = allPayments.filter(p => {
            const paymentDate = parseESDate(p.date);
            return p.status === 'completed' && paymentDate && paymentDate >= firstDayOfMonth;
          });
          const receivedThisMonth = completedPaymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);
          const receivedThisMonthCount = completedPaymentsThisMonth.length;
          
          const pendingRequests = managedRequests.filter(r => r.status === 'Pendiente').length;
          const inProgressRequests = managedRequests.filter(r => r.status === 'En Progreso').length;
          const completedThisMonth = managedRequests.filter(r => {
            const completedDate = parseESDate(r.dateSubmitted);
            return r.status === 'Completado' && completedDate && completedDate >= firstDayOfMonth;
          }).length;
          
          // Set state with the fast data and turn off loading indicator
          setSummaryData(prev => ({
            ...prev,
            payments: { totalPending, pendingCount, receivedThisMonth, receivedThisMonthCount },
            maintenance: { pending: pendingRequests, inProgress: inProgressRequests, completedThisMonth },
          }));
          setIsLoading(false);

        } catch (storageError) {
          console.error("Error fetching data from localStorage:", storageError);
          setError("Failed to load core dashboard data.");
          setIsLoading(false);
        }

        // --- Stage 2: Load slow, asynchronous data from API in the background ---
        try {
          const [units, users] = await Promise.all([getAllUnits(), getAllUsers()]);

          const unitsSummary = {
            total: units.length,
            occupied: units.filter(u => u.is_occupied).length,
            available: units.length - units.filter(u => u.is_occupied).length,
          };
          
          const activeUsers = users.filter(u => u.is_active);
          const usersSummary = {
            totalActive: activeUsers.length,
            managers: activeUsers.filter(u => u.role === 'manager').length,
            tenants: activeUsers.filter(u => u.role === 'tenant').length,
          };
          
          // Update state with the newly fetched API data
          setSummaryData(prev => ({ ...prev, units: unitsSummary, users: usersSummary }));

        } catch (apiError) {
          console.warn("Could not fetch unit or user data. This is expected if the APIs are not ready. Displaying available data only.");
          // No need to set a page-wide error, just won't show the cards.
        }
      };
      
      if (activeSection === 'dashboard') {
        loadDashboard();
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