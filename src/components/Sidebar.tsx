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
  
  
  
  const LayoutDashboardIcon: React.FC = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
  );
  interface SidebarProps {
    activeSection: string;
    onNavigate: (section: string) => void;
    isCollapsed: boolean;
  }
  
  export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate, isCollapsed }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon /> },
      { id: 'users', label: 'Users', icon: <UsersIcon /> },
      { id: 'units', label: 'Units', icon: <BuildingIcon /> },
      { id: 'payments', label: 'Payments', icon: <CreditCardIcon /> },
      { id: 'maintenance', label: 'Maintenance', icon: <WrenchIcon /> },
    ];
  
    return (
      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1><LayoutDashboardIcon /> CondoPanel</h1>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={activeSection === item.id ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/** <div className="sidebar-footer">
         
        </div>*/}
      </aside>
    );
  };  