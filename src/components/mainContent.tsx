import { DashboardView } from "./Cards";
import UnitList from "./UnitList";
import './style1.css'
import UserManagement from "./userList";

interface MainContentProps {
    activeSection: string;
  }
  
  export const MainContent: React.FC<MainContentProps> = ({ activeSection }) => {
    const renderSection = () => {
      switch (activeSection) {
        case 'dashboard':
          return <DashboardView />;
        case 'users':
          return <UserManagement/>; // Ahora usa el componente UserList actualizado
        case 'units':
          return <UnitList/>;
        case 'payments':
          return <div><h2 className="page-title">Payment Tracking</h2><p>Content for Payment Tracking goes here...</p></div>;
        case 'maintenance':
          return <div><h2 className="page-title">Maintenance Requests</h2><p>Content for Maintenance Requests goes here...</p></div>;
        default:
          return <DashboardView />;
      }
    };
  
    return (
      <main className="dashboard-main-content">
        {renderSection()}
      </main>
    );
  };