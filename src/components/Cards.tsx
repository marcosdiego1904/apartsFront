import type { DashboardSummary } from "./DashoardManager";
import { FiHome, FiUsers, FiCreditCard, FiSettings, FiArrowRight, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconClass: string;
    details: React.ReactNode;
    onViewDetails?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconClass, details, onViewDetails }) => {
    return (
        <div className="stat-card">
            <div className={`stat-card-icon ${iconClass}`}>
                {icon}
            </div>
            <div className="stat-card-info">
                <h3 className="stat-card-title">{title}</h3>
                <p className="stat-card-value">{value}</p>
                <div className="stat-card-details">
                    {details}
                </div>
                {onViewDetails && (
                    <div className="stat-card-footer">
                        <a onClick={onViewDetails} style={{ cursor: 'pointer' }}>
                            View Details <FiArrowRight style={{ verticalAlign: 'middle' }}/>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
  
  interface DashboardViewProps {
    summaryData: DashboardSummary;
    isLoading: boolean;
    error: string | null;
    onNavigate: (section: string) => void;
  }
  
  export const DashboardView: React.FC<DashboardViewProps> = ({ summaryData, isLoading, error, onNavigate }) => {
    
    if (isLoading) {
      return (
        <div>
          <h2 className="page-title">Dashboard Overview</h2>
          <div className="dashboard-grid">
            {/* Show skeleton loaders */}
            <div className="dashboard-card"><p>Loading...</p></div>
            <div className="dashboard-card"><p>Loading...</p></div>
            <div className="dashboard-card"><p>Loading...</p></div>
            <div className="dashboard-card"><p>Loading...</p></div>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div>
          <h2 className="page-title">Dashboard Overview</h2>
          <div className="error-message">{error}</div>
        </div>
      );
    }

    return (
      <div>
        <div className="dashboard-grid">
          {summaryData.units && (
            <StatCard 
                title="Units Summary" 
                value={summaryData.units.total.toString()}
                icon={<FiHome />} 
                iconClass="icon-units" 
                onViewDetails={() => onNavigate('units')}
                details={
                    <>
                        <span><FiCheckCircle className="text-green"/> {summaryData.units.occupied} Occupied</span>
                        <span><FiTrendingUp className="text-orange"/> {summaryData.units.available} Available</span>
                    </>
                }
            />
          )}

          {summaryData.payments && (
            <StatCard 
                title="Payments Received (Month)" 
                value={`$${summaryData.payments.receivedThisMonth.toFixed(2)}`}
                icon={<FiCreditCard />} 
                iconClass="icon-payments" 
                onViewDetails={() => onNavigate('payments')}
                details={
                    <>
                        <span><FiCheckCircle className="text-green"/> {summaryData.payments.receivedThisMonthCount} payments received</span>
                        {summaryData.payments.pendingCount > 0 ? (
                           <span className="text-red"><FiAlertCircle /> {summaryData.payments.pendingCount} pending ({`$${summaryData.payments.totalPending.toFixed(2)}`})</span>
                        ) : (
                           <span><FiCheckCircle className="text-green"/> No pending payments</span>
                        )}
                    </>
                }
            />
          )}

          {summaryData.maintenance && (
             <StatCard 
                title="Maintenance Requests" 
                value={summaryData.maintenance.pending.toString()}
                icon={<FiSettings />} 
                iconClass="icon-maintenance" 
                onViewDetails={() => onNavigate('maintenance')}
                details={
                    <>
                        <span className="text-orange"><FiAlertCircle /> {summaryData.maintenance.pending} Pending</span>
                        <span><FiTrendingUp /> {summaryData.maintenance.inProgress} In Progress</span>
                        <span className="text-green"><FiCheckCircle /> {summaryData.maintenance.completedThisMonth} Completed (Month)</span>
                    </>
                }
            />
          )}
          
          {summaryData.users && (
            <StatCard 
                title="Active Users" 
                value={summaryData.users.totalActive.toString()}
                icon={<FiUsers />} 
                iconClass="icon-users" 
                onViewDetails={() => onNavigate('users')}
                details={
                    <>
                        <span>{summaryData.users.managers} Managers</span>
                        <span>{summaryData.users.tenants} Tenants</span>
                    </>
                }
            />
          )}
        </div>
      </div>
    );
  };