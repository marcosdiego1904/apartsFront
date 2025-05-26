import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceRequestSummary from '../../components/manager/maintenance/MaintenanceRequestSummary';
import MaintenanceRequestList from '../../components/manager/maintenance/MaintenanceRequestList';
import type { MaintenanceRequest } from '../../types/maintenance'; // Importa el tipo
import { sampleRequests as centralizedSampleRequests } from '../../data/maintenanceMockData'; // Importar datos centralizados

// // Datos de ejemplo (simulando una llamada a API) - YA NO SE USA, SE IMPORTA DE ARCHIVO CENTRAL
// const sampleRequests: MaintenanceRequest[] = [ ... ]; // ELIMINADO

// Definir los tipos para los filtros para mayor claridad
type StatusFilter = MaintenanceRequest['status'] | 'All';
type UrgencyFilter = MaintenanceRequest['urgency'] | 'All';

const ManagerMaintenanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('All');
  const [filterByRated, setFilterByRated] = useState<string>('all');

  // Estados para el resumen
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [inProgressRequestsCount, setInProgressRequestsCount] = useState(0);
  const [urgentRequestsCount, setUrgentRequestsCount] = useState(0);
  const [resolvedRequestsCount, setResolvedRequestsCount] = useState(0);
  const [completedRequestsCount, setCompletedRequestsCount] = useState(0);

  useEffect(() => {
    // Simula la carga de datos utilizando los datos centralizados
    setRequests(centralizedSampleRequests);
    // setFilteredRequests(sampleRequests); // La lógica de filtrado se moverá a otro useEffect
  }, []);

  useEffect(() => {
    // Aplicar filtros cuando cambian los datos originales o los criterios de filtrado
    let currentFilteredRequests = requests;

    if (searchTerm) {
      currentFilteredRequests = currentFilteredRequests.filter(
        (req) =>
          req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.tenantName && req.tenantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          req.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      currentFilteredRequests = currentFilteredRequests.filter((req) => req.status === statusFilter);
    }

    if (urgencyFilter !== 'All') {
      currentFilteredRequests = currentFilteredRequests.filter((req) => req.urgency === urgencyFilter);
    }
    
    // Nuevo filtro por valoración
    if (filterByRated === 'rated') {
      currentFilteredRequests = currentFilteredRequests.filter(req => req.rating !== undefined && req.rating !== null);
    } else if (filterByRated === 'unrated_pending_review') {
      currentFilteredRequests = currentFilteredRequests.filter(req => req.status === 'Resolved/Pending Review' && (req.rating === undefined || req.rating === null));
    }
    
    setFilteredRequests(currentFilteredRequests);

    // Calcula los conteos para el resumen basados en las solicitudes *originales* (o filtradas, según se prefiera)
    // Aquí lo haremos sobre las originales para mostrar el total general en el resumen.
    setNewRequestsCount(requests.filter(req => req.status === 'New').length);
    setInProgressRequestsCount(requests.filter(req => req.status === 'In Progress').length);
    // El contador de urgentes ahora considera solo las que son 'Urgent' y no están 'Completed' o 'Cancelled'
    setUrgentRequestsCount(requests.filter(req => req.urgency === 'Urgent' && req.status !== 'Completed' && req.status !== 'Cancelled').length);
    setResolvedRequestsCount(requests.filter(req => req.status === 'Resolved/Pending Review').length);
    setCompletedRequestsCount(requests.filter(req => req.status === 'Completed').length);

  }, [requests, searchTerm, statusFilter, urgencyFilter, filterByRated]);

  const handleViewDetails = (requestId: string) => {
    navigate(`/manager/maintenance-request/${requestId}`);
  };

  return (
    <div style={{ padding: '20px', color: '#212529' }}>
      <h1 style={{ color: '#1a202c' }}>Dashboard de Mantenimiento (Manager)</h1>
      
      <MaintenanceRequestSummary 
        newRequests={newRequestsCount}
        inProgressRequests={inProgressRequestsCount}
        urgentRequests={urgentRequestsCount}
        resolvedRequests={resolvedRequestsCount}
        completedRequests={completedRequestsCount}
      />

      <div className="filters-container" style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Buscar por ID, descripción, inquilino..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', minWidth: '250px', borderColor: '#ced4da' }}
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={{ padding: '8px' }}
        >
          <option value="All">Todos los Estados</option>
          <option value="New">Nuevas</option>
          <option value="In Progress">En Progreso</option>
          <option value="Scheduled">Programadas</option>
          <option value="Resolved/Pending Review">Resueltas/Pendiente Valoración</option>
          <option value="Completed">Completadas</option>
          <option value="Cancelled">Canceladas</option>
        </select>

        <select 
          value={urgencyFilter} 
          onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
          style={{ padding: '8px' }}
        >
          <option value="All">Todas las Urgencias</option>
          <option value="Low">Baja</option>
          <option value="Medium">Media</option>
          <option value="High">Alta</option>
          <option value="Urgent">Urgente</option>
        </select>
        <select 
          value={filterByRated} 
          onChange={(e) => setFilterByRated(e.target.value)}
          style={{ padding: '8px', borderColor: '#ced4da' }}
        >
          <option value="all">Todas (Valoración)</option>
          <option value="rated">Solo Valoradas</option>
          <option value="unrated_pending_review">Pendientes de Valoración (y no valoradas)</option>
        </select>
      </div>

      <MaintenanceRequestList requests={filteredRequests} onViewDetails={handleViewDetails} />
    </div>
  );
};

export default ManagerMaintenanceDashboard; 