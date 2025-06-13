import React from 'react';
import { FiGrid, FiCreditCard, FiSettings, FiFileText, FiMessageSquare, FiUser } from 'react-icons/fi';

type ActiveView = 'dashboard' | 'payments' | 'documents' | 'messages' | 'profile' | 'maintenance';

interface TenantSidebarProps {
    activeSection: string;
    onNavigate: (section: ActiveView) => void;
    isCollapsed: boolean;
  }
  
  export const TenantSidebar: React.FC<TenantSidebarProps> = ({ activeSection, onNavigate, isCollapsed }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
      { id: 'payments', label: 'Pagos', icon: <FiCreditCard /> },
      { id: 'maintenance', label: 'Mantenimiento', icon: <FiSettings /> },
      { id: 'documents', label: 'Documentos', icon: <FiFileText /> },
      { id: 'messages', label: 'Mensajes', icon: <FiMessageSquare /> },
      { id: 'profile', label: 'Mi Perfil', icon: <FiUser /> },
    ];
  
    return (
      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
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