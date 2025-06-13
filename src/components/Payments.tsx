import React from 'react';
import { useAuth } from '../context/AuthContext';
import TenantPayments from './TenantPayments';
import ManagerPayments from './ManagerPayments';
// Ya no se necesitan las interfaces, constantes y helpers aquí, ya que están en los componentes hijos.

interface PaymentsProps {
  onPaymentSuccess?: () => void;
}

const Payments: React.FC<PaymentsProps> = ({ onPaymentSuccess }) => {
  const { user } = useAuth();

  if (user?.role === 'tenant') {
    return <TenantPayments onPaymentSuccess={onPaymentSuccess} />;
  } else if (user?.role === 'manager') {
    return <ManagerPayments />;
  } else {
    // Fallback por si el usuario no está cargado o el rol no es reconocido
    // Podrías mostrar un loader o un mensaje más específico
    if (!user) {
      return <p className="text-loading">Cargando información del usuario...</p>;
    }
    return (
      <div className="alert alert-error" role="alert">
        Acceso Denegado. Rol de usuario no reconocido (Rol: {user?.role || 'desconocido'}).
      </div>
    );
  }
};

export default Payments;
