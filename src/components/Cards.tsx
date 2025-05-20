const BuildingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>
    </svg>
  );
  
  const UsersIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  
  const CreditCardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
  
  const WrenchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l3.5-3.5a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0l-3.5 3.5Z"/><path d="m18.01 9.01.01-.01"/>
      <path d="M12 12c-2 2-2 5-2 5s3-1 5-2l6-6L12 2z"/><path d="M2 22l4-4"/><path d="M12 12l-5.5 5.5"/>
    </svg>
  );
  
interface CardProps {
    title: string;
    icon: React.ReactNode;
    iconClass: string;
    children: React.ReactNode;
    viewMoreLink?: string;
  }
  
  export const DashboardCard: React.FC<CardProps> = ({ title, icon, iconClass, children, viewMoreLink }) => {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <div className={`card-icon ${iconClass}`}>{icon}</div>
          <h3 className="card-title">{title}</h3>
        </div>
        <div className="card-content">
          {children}
        </div>
        {viewMoreLink && (
          <div className="card-footer">
            <a href={viewMoreLink}>View Details &rarr;</a>
          </div>
        )}
      </div>
    );
  };
  
  
  export const DashboardView: React.FC = () => {
    return (
      <div>
        <h2 className="page-title">Dashboard Overview</h2>
        <div className="dashboard-grid">
          <DashboardCard title="Units Summary" icon={<BuildingIcon />} iconClass="icon-units" viewMoreLink="#units">
            <p>150</p>
            <div className="details">
              <span>120 Occupied</span>
              <span>30 Available</span>
            </div>
          </DashboardCard>
          <DashboardCard title="Payments Overview" icon={<CreditCardIcon />} iconClass="icon-payments" viewMoreLink="#payments">
            <p>$5,250</p>
            <div className="details">
              <span>15 Pending Payments</span>
              <span>$12,800 Received this month</span>
            </div>
          </DashboardCard>
          <DashboardCard title="Maintenance Requests" icon={<WrenchIcon />} iconClass="icon-maintenance" viewMoreLink="#maintenance">
            <p>8</p>
            <div className="details">
              <span>5 Pending</span>
              <span>3 In Progress</span>
              <span>12 Completed this month</span>
            </div>
          </DashboardCard>
          <DashboardCard title="Active Users" icon={<UsersIcon />} iconClass="icon-users" viewMoreLink="#users">
            <p>185</p>
            <div className="details">
              <span>2 Managers</span>
              <span>183 Tenants</span>
              <span>5 New this week</span>
            </div>
          </DashboardCard>
        </div>
        {/* Placeholder for future charts or more detailed summaries */}
        <div style={{marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)'}}>
          <h3 style={{color: '#0A2540', marginBottom: '15px'}}>Monthly Revenue (Placeholder)</h3>
          <div style={{height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px dashed #ccc', borderRadius: '4px'}}>
            Chart will be displayed here
          </div>
        </div>
      </div>
    );
  };