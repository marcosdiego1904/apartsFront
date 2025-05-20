import { useState,useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./SideHeader";
import { MainContent } from "./mainContent";

export const DashboardManager: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Default open on desktop
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  
    const handleNavigate = (section: string) => {
      setActiveSection(section);
      if (isMobile) {
        setIsSidebarOpen(false); // Close sidebar on navigation on mobile
      }
    };
  
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
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
          <Sidebar 
            activeSection={activeSection} 
            onNavigate={handleNavigate} 
            isCollapsed={!isSidebarOpen && isMobile} // Sidebar is "collapsed" if not open AND on mobile
          />
          <div className={`main-wrapper ${!isSidebarOpen && !isMobile ? '' : (isSidebarOpen && !isMobile ? '' : 'sidebar-collapsed')}`}>
            <Header
              currentSectionTitle={sectionTitles[activeSection] || 'Condominium Panel'}
              userName="Admin User" // Example user
              userRole="Manager"    // Example role
              onToggleSidebar={toggleSidebar}
            />
            <MainContent activeSection={activeSection} />
          </div>
        </div>
      </>
    );
  };