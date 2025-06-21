import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { resetDemo } from '../services/demoService';
import { FiRefreshCw } from 'react-icons/fi';

const LogOutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );

const MenuIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

interface ManagerHeaderProps {
    currentSectionTitle: string;
    userName: string;
    userRole: string;
    onToggleSidebar: () => void;
    onLogout: () => void;
  }
  
  export const ManagerHeader: React.FC<ManagerHeaderProps> = ({ currentSectionTitle, userName, userRole, onToggleSidebar, onLogout }) => {
    const avatarPlaceholderBg = "1F2937"; // Darker for manager
    const avatarPlaceholderText = "FFFFFF";
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleReset = async () => {
        const isConfirmed = window.confirm(
            'Are you sure you want to reset all demo data? This action is irreversible.'
        );

        if (isConfirmed) {
            try {
                await resetDemo();
                alert('Demo data has been reset successfully. You will be logged out.');
                logout();
                navigate('/login', { replace: true });
            } catch (error) {
                console.error('Error resetting demo data:', error);
                alert('An error occurred while trying to reset the data.');
            }
        }
    };

    return (
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
            <MenuIcon />
          </button>
          <h2 className="header-title">{currentSectionTitle}</h2>
        </div>
        <div className="header-right">
          <div className="user-profile-container" title={`${userName} (${userRole})`}>
            <div className="user-info">
              <img 
                src={`https://placehold.co/40x40/${avatarPlaceholderBg}/${avatarPlaceholderText}?text=${userName.charAt(0)}`} 
                alt="User Avatar" 
              />
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
          </div>
          <button className="reset-demo-button" title="Reset Demo" onClick={handleReset}>
            <FiRefreshCw />
            <span>Reset Demo</span>
          </button>
          <button className="logout-button" title="Logout" onClick={onLogout}>
            <LogOutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>
    );
  }; 