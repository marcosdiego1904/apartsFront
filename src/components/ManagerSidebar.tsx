import React from 'react';
import { FiGrid, FiUsers, FiHome, FiCreditCard, FiTool, FiX } from 'react-icons/fi';

type ActiveView = 'dashboard' | 'users' | 'units' | 'payments' | 'maintenance' | 'profile';

interface ManagerSidebarProps {
    activeSection: string;
    onNavigate: (section: ActiveView) => void;
    isOpen: boolean;
    isMobile: boolean;
    onToggle: () => void;
  }
  
  export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ activeSection, onNavigate, isOpen, isMobile, onToggle }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { id: 'users', label: 'Users', icon: <FiUsers /> },
      { id: 'units', label: 'Units', icon: <FiHome /> },
      { id: 'payments', label: 'Payments', icon: <FiCreditCard /> },
      { id: 'maintenance', label: 'Maintenance', icon: <FiTool /> },
    ];
  
    // Lógica de clases corregida:
    // - En escritorio, solo importa si está colapsado (!isOpen).
    // - En móvil, la clase 'open' lo hace visible.
    const sidebarClasses = `dashboard-sidebar ${!isOpen && !isMobile ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`;

    return (
      <aside className={sidebarClasses}>
        <div className="sidebar-header">
          <button className="sidebar-close-btn" onClick={onToggle} aria-label="Close menu">
            <FiX />
          </button>
          <h1><FiGrid /> ApartsPro</h1>
          <p className="sidebar-role-indicator">Manager</p>
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