// src/components/Header.tsx
import React from 'react';
import { FiLogOut } from 'react-icons/fi';
import { isMobile } from '../utils/isMobile';
import AnimatedMenuIcon from './AnimatedMenuIcon';
import '../styles/Header.css';

interface HeaderProps {
    userType: 'manager' | 'tenant';
    onLogout: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ userType, onLogout, onToggleSidebar, isSidebarOpen }) => {
    return (
        <header className="main-header">
            <div className="header-left">
                {isMobile() && (
                    <button onClick={onToggleSidebar} className="menu-toggle-btn">
                        <AnimatedMenuIcon isOpen={isSidebarOpen} />
                    </button>
                )}
                <div className="logo-container">
                    <img src={isMobile() ? '/favicon.ico' : '/logo-aparts.png'} alt="Aparts Logo" className="logo" />
                </div>
            </div>

            <div className="header-right">
                <span className="user-greeting">
                    {userType === 'manager' ? 'Manager View' : 'Tenant Portal'}
                </span>
                <button onClick={onLogout} className="logout-button">
                    <FiLogOut className="logout-icon" />
                    <span className="logout-text">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;