import { DashboardView } from "./Cards";
import EnhancedUnitList from '../components/UnitList';
import UserManagement from "../components/userList";
import Payments from "./Payments";
import type { DashboardSummary } from "./DashoardManager";

import './style1.css';

interface MainContentProps {
    activeSection: string;
    summaryData: DashboardSummary;
    isLoading: boolean;
    error: string | null;
    onNavigate: (section: string) => void;
  }
  
  export const MainContent: React.FC<MainContentProps> = ({ activeSection, summaryData, isLoading, error, onNavigate }) => {
    const renderSection = () => {
      switch (activeSection) {
        case 'dashboard':
          return <DashboardView summaryData={summaryData} isLoading={isLoading} error={error} onNavigate={onNavigate} />;
        case 'payments':
          return <Payments />;
        /* case 'maintenance':
          return "hola"; */
        default:
          return <DashboardView summaryData={summaryData} isLoading={isLoading} error={error} onNavigate={onNavigate} />;
      }
    };
  
    return (
      <main className="dashboard-main-content">
        {renderSection()}
      </main>
    );
  };