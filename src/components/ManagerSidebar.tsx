import React from 'react';
import { FiGrid, FiUsers, FiHome, FiCreditCard, FiTool } from 'react-icons/fi';

type ActiveView = 'dashboard' | 'users' | 'units' | 'payments' | 'maintenance' | 'profile';

interface ManagerSidebarProps {
    activeSection: string;
    onNavigate: (section: ActiveView) => void;
    isCollapsed: boolean;
  }
  
  export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ activeSection, onNavigate, isCollapsed }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { id: 'users', label: 'Usuarios', icon: <FiUsers /> },
      { id: 'units', label: 'Unidades', icon: <FiHome /> },
      { id: 'payments', label: 'Pagos', icon: <FiCreditCard /> },
      { id: 'maintenance', label: 'Mantenimiento', icon: <FiTool /> },
    ];
  
    return (
      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
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