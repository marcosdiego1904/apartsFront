// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resetDemo } from '../services/demoService'; // Importar el servicio
import logo from '../assets/logo.png';
import '../styles/Header.css';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = async () => {
    const isConfirmed = window.confirm(
      '¿Estás seguro de que quieres resetear todos los datos de la demo? Esta acción es irreversible.'
    );

    if (isConfirmed) {
      try {
        const response = await resetDemo();
        alert('Datos de la demo reseteados con éxito.');
        console.log(response.message);
        // Forzar un logout y redirigir al login para un estado limpio.
        logout(); 
        navigate('/login');
      } catch (error) {
        console.error('Error al resetear los datos de la demo:', error);
        alert('Hubo un error al intentar resetear los datos.');
      }
    }
  };

  const handleBellClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    console.log('Notification bell clicked, panel open state:', !isNotificationsOpen);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src={logo} alt="ApartmentsIO Logo" className="header-logo" />
          <span className="logo-text">ApartmentsIO</span>
        </Link>
        
        <nav className="header-nav">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {user.role === 'tenant' && <Link to="/tenant/maintenance" className="nav-link">Mantenimiento</Link>}
              {user.role === 'manager' && <Link to="/manager/dashboard" className="nav-link">Panel de Admin</Link>}
              <NotificationBell notificationCount={3} onBellClick={handleBellClick} />
              <button onClick={handleLogout} className="nav-link logout-button">Cerrar Sesión</button>
              {/* Botón para Resetear la Demo */}
              <button onClick={handleReset} className="nav-link reset-demo-button">Resetear Demo</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link to="/register" className="nav-link">Registrarse</Link>
            </>
          )}
        </nav>
      </div>
      {isNotificationsOpen && (
        <div className="notifications-panel">
          <p>Notificación 1: Su solicitud ha sido actualizada.</p>
          <p>Notificación 2: Mantenimiento programado.</p>
        </div>
      )}
    </header>
  );
};

export default Header;