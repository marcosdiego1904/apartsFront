import React from 'react';
import { useAuth } from '../context/AuthContext';
import TenantPayments from './TenantPayments';
import ManagerPayments from './ManagerPayments';
// Ya no se necesitan las interfaces, constantes y helpers aquí, ya que están en los componentes hijos.

const Payments: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'tenant') {
    return <TenantPayments />;
  } else if (user?.role === 'manager') {
    return <ManagerPayments />;
  } else {
    // Fallback por si el usuario no está cargado o el rol no es reconocido
    // Podrías mostrar un loader o un mensaje más específico
    if (!user) {
      return <p className="loading-message">Cargando información del usuario...</p>;
    }
    return <p className="error-message">Acceso Denegado. Rol de usuario no reconocido (Rol: {user?.role || 'desconocido'}).</p>;
  }
};

export default Payments;
