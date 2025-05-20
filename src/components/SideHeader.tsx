const BellIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
  
  const UserCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="user-icon">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
    </svg>
  );
  
  const LogOutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
  
  const MenuIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
interface HeaderProps {
    currentSectionTitle: string;
    userName: string;
    userRole: string;
    onToggleSidebar: () => void;
  }
  
  export const Header: React.FC<HeaderProps> = ({ currentSectionTitle, userName, userRole, onToggleSidebar }) => {
    return (
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
            <MenuIcon />
          </button>
          <h2 className="header-title">{currentSectionTitle}</h2>
        </div>
        <div className="header-right">
          <div className="notification-bell" title="Notifications">
            <BellIcon />
            <span className="notification-badge">3</span> {/* Example badge */}
          </div>
          <div className="user-profile-container" title={`${userName} (${userRole})`}>
            <div className="user-info">
              {/* Placeholder image, replace with actual user avatar if available */}
              <img src={`https://placehold.co/40x40/79C7E8/0A2540?text=${userName.charAt(0)}`} alt="User Avatar" />
              <div className="user-details">
                <span className="user-name">{userName} | </span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
          </div>
          <button className="logout-button" title="Logout">
            <LogOutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>
    );
  };