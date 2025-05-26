import React from 'react';

interface MaintenanceSummaryProps {
  // Define props para los conteos, por ejemplo:
  newRequests: number;
  inProgressRequests: number;
  urgentRequests: number;
  resolvedRequests: number;
  completedRequests: number;
}

const MaintenanceRequestSummary: React.FC<MaintenanceSummaryProps> = ({
  newRequests,
  inProgressRequests,
  urgentRequests,
  resolvedRequests,
  completedRequests,
}) => {
  return (
    <div className="summary-container">
      <h2>Resumen de Solicitudes</h2>
      <div className="summary-item">Nuevas: {newRequests}</div>
      <div className="summary-item">En Progreso: {inProgressRequests}</div>
      <div className="summary-item">Urgentes: {urgentRequests}</div>
      <div className="summary-item">Resueltas/Pendiente de Valoración: {resolvedRequests}</div>
      <div className="summary-item">Completadas: {completedRequests}</div>
      {/* Puedes añadir más detalles o estilos aquí */}
    </div>
  );
};

export default MaintenanceRequestSummary; 