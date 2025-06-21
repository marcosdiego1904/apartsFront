import React from 'react';
import { FiGrid, FiCreditCard, FiFileText, FiMessageSquare, FiUser, FiX, FiTool } from 'react-icons/fi';

type ActiveView = 'dashboard' | 'payments' | 'documents' | 'messages' | 'profile' | 'maintenance';

interface TenantSidebarProps {
    activeSection: string;
    onNavigate: (section: ActiveView) => void;
    isOpen: boolean;
    isMobile: boolean;
    onToggle: () => void;
  }
  
  export const TenantSidebar: React.FC<TenantSidebarProps> = ({ activeSection, onNavigate, isOpen, isMobile, onToggle }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { id: 'payments', label: 'Payments', icon: <FiCreditCard /> },
      { id: 'maintenance', label: 'Maintenance', icon: <FiTool /> },
      { id: 'documents', label: 'Documents', icon: <FiFileText /> },
      { id: 'messages', label: 'Messages', icon: <FiMessageSquare /> },
      { id: 'profile', label: 'My Profile', icon: <FiUser /> },
    ];
  
    const sidebarClasses = `dashboard-sidebar ${!isOpen && !isMobile ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`;

    return (
      <aside className={sidebarClasses}>
        <div className="sidebar-header">
          <button className="sidebar-close-btn" onClick={onToggle} aria-label="Close menu">
            <FiX />
          </button>
          <h1><FiGrid /> ApartsPro</h1>
          <p className="sidebar-role-indicator">Tenant</p>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={activeSection === item.id ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); onNavigate(item.id as ActiveView); }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    );
  }; 