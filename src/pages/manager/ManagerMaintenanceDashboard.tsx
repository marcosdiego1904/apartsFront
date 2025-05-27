import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceRequestSummary from '../../components/manager/maintenance/MaintenanceRequestSummary';
import MaintenanceRequestList from '../../components/manager/maintenance/MaintenanceRequestList';
import { type MaintenanceRequest } from '../../types/maintenance'; // Unified type
import { sampleRequests as centralizedSampleRequests } from '../../data/maintenanceMockData'; // Conformed mock data

const SHARED_LOCAL_STORAGE_KEY = 'allMaintenanceRequests';

// Updated filter types to match the new MaintenanceRequest enums
type StatusFilter = MaintenanceRequest['status'] | 'All';
type UrgencyFilter = MaintenanceRequest['urgency'] | 'All';

const ManagerMaintenanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('All');
  const [filterByRated, setFilterByRated] = useState<string>('all'); // 'all', 'rated', 'unrated_pending_review'

  // Summary counts
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [inProgressRequestsCount, setInProgressRequestsCount] = useState(0);
  const [urgentRequestsCount, setUrgentRequestsCount] = useState(0);
  const [resolvedRequestsCount, setResolvedRequestsCount] = useState(0);
  const [completedRequestsCount, setCompletedRequestsCount] = useState(0);

  useEffect(() => {
    let loadedRequests: MaintenanceRequest[] = [];
    const storedRequestsJSON = localStorage.getItem(SHARED_LOCAL_STORAGE_KEY);

    if (storedRequestsJSON) {
      try {
        const parsedRequests = JSON.parse(storedRequestsJSON) as MaintenanceRequest[];
        if (Array.isArray(parsedRequests)) {
          // Optional: Further validation for each object if necessary
          loadedRequests = parsedRequests;
        }
      } catch (error) {
        console.error("Error parsing localStorage data in ManagerDashboard:", error);
        // Fallback to centralized mock data if localStorage is corrupt
      }
    }

    if (loadedRequests.length === 0) {
      // If no requests loaded from localStorage (empty or corrupt), use centralized mock data
      // And seed localStorage with this mock data
      loadedRequests = centralizedSampleRequests;
      localStorage.setItem(SHARED_LOCAL_STORAGE_KEY, JSON.stringify(loadedRequests));
    }
    
    setRequests(loadedRequests);
  }, []);

  useEffect(() => {
    let currentFilteredRequests = requests;

    if (searchTerm) {
      currentFilteredRequests = currentFilteredRequests.filter(
        (req) =>
          req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.tenantName && req.tenantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.title && req.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'All') {
      currentFilteredRequests = currentFilteredRequests.filter((req) => req.status === statusFilter);
    }

    if (urgencyFilter !== 'All') {
      currentFilteredRequests = currentFilteredRequests.filter((req) => req.urgency === urgencyFilter);
    }
    
    if (filterByRated === 'rated') {
      currentFilteredRequests = currentFilteredRequests.filter(req => req.feedbackRating !== undefined && req.feedbackRating !== null);
    } else if (filterByRated === 'unrated_pending_review') {
      currentFilteredRequests = currentFilteredRequests.filter(req => 
        req.status === 'Resolved/Pending Review' && 
        (req.feedbackRating === undefined || req.feedbackRating === null)
      );
    }
    
    setFilteredRequests(currentFilteredRequests);

    // Update summary counts based on the *original* `requests` array (all requests)
    setNewRequestsCount(requests.filter(req => req.status === 'Sent' || req.status === 'Received').length);
    setInProgressRequestsCount(requests.filter(req => req.status === 'In Progress' || req.status === 'Scheduled').length);
    setUrgentRequestsCount(requests.filter(req => req.urgency === 'Emergency' && req.status !== 'Completed' && req.status !== 'Cancelled').length);
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
          placeholder="Buscar por ID, título, descripción, inquilino..." 
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
          {/* Updated status options based on MaintenanceRequest type */}
          <option value="Sent">Enviada (Sent)</option>
          <option value="Received">Recibida (Received)</option>
          <option value="In Progress">En Progreso (In Progress)</option>
          <option value="Scheduled">Programada (Scheduled)</option>
          <option value="Resolved/Pending Review">Resuelta/Pendiente Valoración</option>
          <option value="Completed">Completada (Completed)</option>
          <option value="Cancelled">Cancelada (Cancelled)</option>
        </select>

        <select 
          value={urgencyFilter} 
          onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
          style={{ padding: '8px' }}
        >
          <option value="All">Todas las Urgencias</option>
          {/* Updated urgency options */}
          <option value="Low">Baja (Low)</option>
          <option value="Medium">Media (Medium)</option>
          <option value="High">Alta (High)</option>
          <option value="Emergency">Emergencia (Emergency)</option>
        </select>
        <select 
          value={filterByRated} 
          onChange={(e) => setFilterByRated(e.target.value)}
          style={{ padding: '8px', borderColor: '#ced4da' }}
        >
          <option value="all">Todas (Valoración)</option>
          <option value="rated">Solo Valoradas</option>
          <option value="unrated_pending_review">Pendientes de Valoración (Resueltas)</option>
        </select>
      </div>

      <MaintenanceRequestList requests={filteredRequests} onViewDetails={handleViewDetails} />
    </div>
  );
};

export default ManagerMaintenanceDashboard; 