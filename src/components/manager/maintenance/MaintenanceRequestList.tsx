import React from 'react';
import type { MaintenanceRequest } from '../../../types/maintenance'; // Ajusta la ruta según sea necesario

// Define una interfaz para el tipo de solicitud de mantenimiento si aún no existe
// import { MaintenanceRequest } from '../../../types/maintenance'; // Ajusta la ruta según sea necesario

interface MaintenanceRequestListProps {
  requests: MaintenanceRequest[];
  onViewDetails: (requestId: string) => void; // Nueva prop para manejar clic en "Ver Detalles"
  // Define props para los filtros y funciones de búsqueda
}

const MaintenanceRequestList: React.FC<MaintenanceRequestListProps> = ({ requests, onViewDetails }) => {
  const thStyle = { color: '#212529', backgroundColor: '#f8f9fa', padding: '10px', borderBottom: '2px solid #dee2e6' };
  const tdStyle = { color: '#343a40', padding: '10px', borderBottom: '1px solid #e9ecef' };

  return (
    <div className="list-container">
      <h2 style={{ color: '#1a202c' }}>Lista de Solicitudes de Mantenimiento</h2>
      {/* Aquí irán los filtros y la lógica de búsqueda */}
      {/* Ejemplo de cómo mostrar las solicitudes */}
      {requests.length === 0 ? (
        <p style={{ color: '#495057' }}>No hay solicitudes para mostrar.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th><th style={thStyle}>Inquilino</th><th style={thStyle}>Descripción</th><th style={thStyle}>Estado</th><th style={thStyle}>Urgencia</th><th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ backgroundColor: '#fff' }}>
                <td style={tdStyle}>{req.id}</td>
                <td style={tdStyle}>{req.tenantName || 'N/A'}</td>
                <td style={tdStyle}>{req.description}</td>
                <td style={tdStyle}>{req.status}</td>
                <td style={tdStyle}>{req.urgency}</td>
                <td style={tdStyle}><button onClick={() => onViewDetails(req.id)} style={{ padding: '5px 10px' }}>Ver Detalles</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MaintenanceRequestList; 