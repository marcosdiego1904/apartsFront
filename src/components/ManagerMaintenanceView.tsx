import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/globalStyles.css'; // Assuming globalStyles.css contains the dark theme
import './ManagerMaintenanceView.css'; // Import the new CSS file

// Interface for data loaded from localStorage (from tenant's form)
interface TenantRequestDisplayItem {
  id: string;
  title: string; // This will become the manager's "description"
  category: 'plumbing' | 'electrical' | 'appliance' | 'general' | '';
  dateSubmitted: string;
  status: 'sent' | 'in-progress' | 'completed' | 'cancelled'; // Tenant status
  description: string; // This will become the manager's "fullDescription"
  urgency: 'low' | 'medium' | 'high' | '';
  tenantRating?: number; // New field
  tenantComment?: string; // New field
  isRatingSubmitted?: boolean; // New field
}

// Interface for manager's view
interface MaintenanceRequest {
  id: string;
  tenantName: string; // Will be placeholder for now
  unit: string; // Will be placeholder for now
  category: string; // Transformed from tenant's category
  description: string; // Brief description (from tenant's title)
  fullDescription: string; // Detailed description (from tenant's description)
  dateSubmitted: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'Rechazado'; // Manager status
  priority: 'Alta' | 'Media' | 'Baja'; // Transformed from tenant's urgency
  assignedTo?: string; // New field
  managerComments?: string; // New field
  tenantRating?: number; // New field
  tenantComment?: string; // New field
  isRatingSubmitted?: boolean; // New field
}

const ITEMS_PER_PAGE = 10;

type SortableKeys = keyof MaintenanceRequest;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
}

// Helper function to transform tenant request to manager request
const transformTenantRequest = (tenantRequest: TenantRequestDisplayItem): MaintenanceRequest => {
  let managerCategory = '';
  switch (tenantRequest.category) {
    case 'plumbing': managerCategory = 'Plomería'; break;
    case 'electrical': managerCategory = 'Electricidad'; break;
    case 'appliance': managerCategory = 'Electrodomésticos'; break;
    case 'general': managerCategory = 'General'; break;
    default: managerCategory = 'Desconocida';
  }

  let managerPriority: MaintenanceRequest['priority'] = 'Baja';
  switch (tenantRequest.urgency) {
    case 'high': managerPriority = 'Alta'; break;
    case 'medium': managerPriority = 'Media'; break;
    case 'low': managerPriority = 'Baja'; break;
  }

  const tenantName = "Inquilino Ejemplo"; // Placeholder
  const unitNumber = `Apt ${(Math.floor(Math.random() * 10) + 1)}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`; // Placeholder

  return {
    id: tenantRequest.id,
    tenantName: tenantName,
    unit: unitNumber,
    category: managerCategory,
    description: tenantRequest.title,
    fullDescription: tenantRequest.description,
    dateSubmitted: tenantRequest.dateSubmitted,
    status: 'Pendiente',
    priority: managerPriority,
    assignedTo: '', // Initialize new field
    managerComments: '', // Initialize new field
    tenantRating: tenantRequest.tenantRating, // Copy rating
    tenantComment: tenantRequest.tenantComment, // Copy comment
    isRatingSubmitted: tenantRequest.isRatingSubmitted, // Copy the flag
  };
};


const ManagerMaintenanceView: React.FC = () => {
  const [allRawRequests, setAllRawRequests] = useState<MaintenanceRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<MaintenanceRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<MaintenanceRequest[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateSubmitted', direction: 'desc' });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  // State for EDIT modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);

  // State for VIEW modal
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [viewingRequest, setViewingRequest] = useState<MaintenanceRequest | null>(null);

  const displayFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load and merge data from localStorage
  useEffect(() => {
    setIsLoading(true);
    console.log("[ManagerMaintenanceView-LoadEffect] Attempting to load requests...");
    try {
      const savedManagedRequestsJSON = localStorage.getItem('managedMaintenanceRequests');
      let managedRequests: MaintenanceRequest[] = savedManagedRequestsJSON ? JSON.parse(savedManagedRequestsJSON) : [];

      const savedTenantRequestsJSON = localStorage.getItem('tenantSubmittedMaintenanceRequests');
      const tenantSubmittedItems: TenantRequestDisplayItem[] = savedTenantRequestsJSON ? JSON.parse(savedTenantRequestsJSON) : [];
      
      const tenantFeedbackMap = new Map<string, { tenantRating?: number; tenantComment?: string; isRatingSubmitted?: boolean }>();
      tenantSubmittedItems.forEach(item => {
        if (item.isRatingSubmitted || item.tenantRating !== undefined || item.tenantComment !== undefined) {
          tenantFeedbackMap.set(item.id, { 
            tenantRating: item.tenantRating, 
            tenantComment: item.tenantComment, 
            isRatingSubmitted: item.isRatingSubmitted 
          });
        }
      });

      managedRequests = managedRequests.map(managedReq => {
        const feedback = tenantFeedbackMap.get(managedReq.id);
        if (feedback && (
            managedReq.tenantRating !== feedback.tenantRating || 
            managedReq.tenantComment !== feedback.tenantComment || 
            managedReq.isRatingSubmitted !== feedback.isRatingSubmitted
        )) {
          return { ...managedReq, ...feedback };
        }
        return managedReq;
      });

      const managedRequestIds = new Set(managedRequests.map(req => req.id));
      const newTransformedRequests = tenantSubmittedItems
        .filter(tenantItem => !managedRequestIds.has(tenantItem.id))
        .map(transformTenantRequest);
      
      const combinedRequests = [...managedRequests, ...newTransformedRequests];
      localStorage.setItem('managedMaintenanceRequests', JSON.stringify(combinedRequests));
      setAllRawRequests(combinedRequests);
      setCurrentPage(1);
      console.log("[ManagerMaintenanceView-LoadEffect] Loaded and merged requests:", combinedRequests);
    } catch (error) {
      console.error("[ManagerMaintenanceView-LoadEffect] Error loading or processing requests:", error);
      displayFeedback('error', 'Error al cargar las solicitudes de mantenimiento.');
      setAllRawRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [displayFeedback]);


  // Effect for filtering and sorting
  useEffect(() => {
    let filtered = [...allRawRequests];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status.toLowerCase().replace(/\s+/g, '') === filterStatus.toLowerCase().replace(/\s+/g, ''));
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(req => req.priority.toLowerCase() === filterPriority.toLowerCase());
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(req =>
        req.tenantName.toLowerCase().includes(lowerSearchTerm) ||
        req.unit.toLowerCase().includes(lowerSearchTerm) ||
        req.description.toLowerCase().includes(lowerSearchTerm) ||
        req.fullDescription.toLowerCase().includes(lowerSearchTerm) ||
        req.category.toLowerCase().includes(lowerSearchTerm) ||
        req.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key) {
      const sortableKey = sortConfig.key;
      const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
      const priorityOrder: { [key in MaintenanceRequest['priority']]: number } = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
      const statusOrder: { [key in MaintenanceRequest['status']]: number } = { 'Pendiente': 1, 'En Progreso': 2, 'Completado': 3, 'Rechazado': 4 };

      filtered.sort((a, b) => {
        let valA: string | number | boolean = a[sortableKey] as string | number | boolean;
        let valB: string | number | boolean = b[sortableKey] as string | number | boolean;

        if (sortableKey === 'priority') {
          valA = priorityOrder[a.priority];
          valB = priorityOrder[b.priority];
        } else if (sortableKey === 'status') {
          valA = statusOrder[a.status];
          valB = statusOrder[b.status];
        } else if (sortableKey === 'dateSubmitted') {
          const dateA = new Date(a.dateSubmitted);
          const dateB = new Date(b.dateSubmitted);
          valA = !isNaN(dateA.getTime()) ? dateA.getTime() : 0;
          valB = !isNaN(dateB.getTime()) ? dateB.getTime() : 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * directionMultiplier;
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * directionMultiplier;
        } else {
          return String(valA).toLowerCase().localeCompare(String(valB).toLowerCase()) * directionMultiplier;
        }
      });
    }
    setProcessedRequests(filtered);
    if (currentPage !== 1 && filtered.length > 0) { // Avoid resetting if already on page 1 or no results
        const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages) {
            setCurrentPage(newTotalPages || 1); // Go to last page if current is out of bounds
        }
    } else if (filtered.length === 0) {
        setCurrentPage(1); // Reset to page 1 if no results
    } else {
        setCurrentPage(1); // Default reset to page 1 for other cases (e.g. initial load)
    }
  }, [allRawRequests, filterStatus, filterPriority, searchTerm, sortConfig, currentPage]);

  // Effect for pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedRequests(processedRequests.slice(startIndex, endIndex));
  }, [processedRequests, currentPage]);

  const totalPages = useMemo(() => Math.ceil(processedRequests.length / ITEMS_PER_PAGE), [processedRequests]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: SortableKeys) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };
  
  const getStatusClass = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'Pendiente': return 'status-badge status-pending-maint';
      case 'En Progreso': return 'status-badge status-in-progress-maint';
      case 'Completado': return 'status-badge status-completed-maint';
      case 'Rechazado': return 'status-badge status-rejected-maint';
      default: return 'status-badge';
    }
  };
  
  const getPriorityClass = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'Alta': return 'status-badge status-high';
      case 'Media': return 'status-badge status-medium';
      case 'Baja': return 'status-badge status-low';
      default: return 'status-badge';
    }
  };

  const handleOpenEditModal = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (request: MaintenanceRequest) => {
    setViewingRequest(request);
    setIsViewModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRequest(null);
  };
  
  const handleSaveEditModal = (updatedRequest: MaintenanceRequest) => {
    const updatedAllRawRequests = allRawRequests.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    );
    setAllRawRequests(updatedAllRawRequests);
    localStorage.setItem('managedMaintenanceRequests', JSON.stringify(updatedAllRawRequests));
    displayFeedback('success', 'Solicitud actualizada exitosamente.');
    handleCloseEditModal();
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--spacing-xl, 24px)', textAlign: 'center', fontSize: '1.1rem', color: 'var(--color-text-secondary, #555)' }}>
        <p>Cargando solicitudes de mantenimiento, por favor espere...</p>
      </div>
    );
  }

  return (
    <div className="manager-maintenance-container" style={{ padding: 'var(--spacing-lg)' }}>
      <h2 className="page-title">Gestión de Solicitudes de Mantenimiento</h2>

      {feedbackMessage && (
        <div 
          className={`alert ${feedbackMessage.type === 'success' ? 'alert-success' : 'alert-error'} toast-notification-custom`} 
          role="alert"
          style={{ position: 'fixed', top: 'var(--spacing-lg)', right: 'var(--spacing-lg)', zIndex: 1050, boxShadow: 'var(--shadow-lg)' }}
        >
          {feedbackMessage.text}
          <button 
            onClick={() => setFeedbackMessage(null)} 
            className="modal-close-btn" 
            style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem', marginLeft: '15px' }}
          >&times;</button>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Filtros y Búsqueda</h3>
        </div>
        <div className="card-content">
          <div className="form-grid form-grid-cols-3"> {/* Usando form-grid para alinear */}
            <div className="form-group">
              <label htmlFor="statusFilter" className="form-label">Estado:</label>
              <select 
                id="statusFilter" 
                className="form-select" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="enprogreso">En Progreso</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priorityFilter" className="form-label">Prioridad:</label>
              <select 
                id="priorityFilter" 
                className="form-select" 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="searchTerm" className="form-label">Buscar:</label>
              <input 
                type="text" 
                id="searchTerm" 
                className="form-input" 
                placeholder="ID, inquilino, descripción..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Listado de Solicitudes ({processedRequests.length} encontradas)</h3>
        </div>
        <div className="card-content">
          {displayedRequests.length > 0 ? (
            <div className="table-container">
              <table className="table table-hover"> {/* Added table-hover for better UX */}
                <thead>
                  <tr>
                    <th onClick={() => requestSort('id')} className="sortable-header">
                      ID Solicitud{getSortIndicator('id')}
                    </th>
                    <th onClick={() => requestSort('dateSubmitted')} className="sortable-header">
                      Fecha Envío{getSortIndicator('dateSubmitted')}
                    </th>
                    <th onClick={() => requestSort('tenantName')} className="sortable-header">
                      Inquilino{getSortIndicator('tenantName')}
                    </th>
                    <th onClick={() => requestSort('unit')} className="sortable-header">
                      Unidad{getSortIndicator('unit')}
                    </th>
                    <th onClick={() => requestSort('category')} className="sortable-header">
                      Categoría{getSortIndicator('category')}
                    </th>
                    <th>Descripción Breve</th>
                    <th onClick={() => requestSort('priority')} className="sortable-header">
                      Prioridad{getSortIndicator('priority')}
                    </th>
                    <th onClick={() => requestSort('status')} className="sortable-header">
                      Estado{getSortIndicator('status')}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRequests.map((req) => (
                    <tr key={req.id} style={{backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)'}}>
                      <td data-label="ID Solicitud" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem'}}>{req.id}</td>
                      <td data-label="Fecha Envío" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem'}}>{new Date(req.dateSubmitted).toLocaleDateString()}</td>
                      <td data-label="Inquilino" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem'}}>{req.tenantName}</td>
                      <td data-label="Unidad" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem'}}>{req.unit}</td>
                      <td data-label="Categoría" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem'}}>{req.category}</td>
                      <td data-label="Descripción Breve" style={{color: 'var(--text-primary)', padding: '0.85rem 1rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={req.description}>{req.description}</td>
                      <td data-label="Prioridad" style={{padding: '0.85rem 1rem'}}>
                        <span className={getPriorityClass(req.priority)}>{req.priority}</span>
                      </td>
                      <td data-label="Estado" style={{padding: '0.85rem 1rem'}}>
                        <span className={getStatusClass(req.status)}>{req.status}</span>
                      </td>
                      <td data-label="Acciones" style={{padding: '0.85rem 1rem', whiteSpace: 'nowrap'}}>
                        <button 
                          className="btn-icon"
                          style={{
                              background: 'var(--accent-info)',
                              color: 'white',
                              marginRight: '0.5rem',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              cursor: 'pointer'
                          }}
                          title={`Ver Detalles: ${req.fullDescription}`}
                          onClick={() => handleOpenViewModal(req)}
                        >
                          <span role="img" aria-label="view">👁️</span>
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{
                              background: 'var(--accent-warning)',
                              color: 'white',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              cursor: 'pointer'
                          }}
                          title="Modificar Estado (Implementar)"
                          onClick={() => handleOpenEditModal(req)}
                        >
                          <span role="img" aria-label="edit">✏️</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted" style={{padding: 'var(--spacing-lg)'}}>
              {allRawRequests.length === 0 && !searchTerm && filterStatus === 'all' && filterPriority === 'all' 
                ? "No hay solicitudes de mantenimiento registradas." 
                : "No se encontraron solicitudes con los filtros aplicados."}
            </p>
          )}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.5rem 0',
              gap: '0.5rem',
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ 
                    minWidth: 'auto', 
                    padding: '0.5rem 0.8rem',
                    backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-hover)',
                    color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                 }}
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  className="btn btn-secondary"
                  style={{
                    minWidth: 'auto',
                    padding: '0.5rem 0.8rem',
                    backgroundColor: currentPage === index + 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: currentPage === index + 1 ? 'white' : 'var(--text-primary)',
                    borderColor: currentPage === index + 1 ? 'var(--accent-primary)' : 'var(--border-primary)',
                    fontWeight: currentPage === index + 1 ? 'bold' : 'normal',
                    cursor: currentPage === index + 1 ? 'default' : 'pointer',
                  }}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ 
                    minWidth: 'auto',
                    padding: '0.5rem 0.8rem',
                    backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-hover)',
                    color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingRequest && (
        <div className="modal-backdrop-custom" onClick={handleCloseEditModal}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2 className="modal-title-custom">
                Editar Solicitud: {editingRequest.id}
              </h2>
              <button onClick={handleCloseEditModal} className="modal-close-btn-custom">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const updatedReq: MaintenanceRequest = {
                ...editingRequest, 
                status: (form.elements.namedItem('status') as HTMLSelectElement).value as MaintenanceRequest['status'],
                priority: (form.elements.namedItem('priority') as HTMLSelectElement).value as MaintenanceRequest['priority'],
                assignedTo: (form.elements.namedItem('assignedTo') as HTMLInputElement).value,
                managerComments: (form.elements.namedItem('managerComments') as HTMLTextAreaElement).value,
                tenantRating: editingRequest.tenantRating, 
                tenantComment: editingRequest.tenantComment,
                isRatingSubmitted: editingRequest.isRatingSubmitted,
              };
              handleSaveEditModal(updatedReq);
            }}>
              <div className="modal-body-custom">
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Estado:</label>
                  <select 
                    id="status" 
                    name="status" 
                    defaultValue={editingRequest.status} 
                    className="form-select" 
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completado">Completado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority" className="form-label">Prioridad:</label>
                  <select 
                    id="priority" 
                    name="priority" 
                    defaultValue={editingRequest.priority} 
                    className="form-select" 
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="assignedTo" className="form-label">Asignado A:</label>
                  <input 
                    type="text" 
                    id="assignedTo" 
                    name="assignedTo"
                    defaultValue={editingRequest.assignedTo || ''} 
                    className="form-input" 
                    placeholder="Ej: José (Plomero)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="managerComments" className="form-label">Comentarios del Gestor:</label>
                  <textarea 
                    id="managerComments" 
                    name="managerComments"
                    defaultValue={editingRequest.managerComments || ''} 
                    className="form-textarea" 
                    rows={5} 
                    placeholder="Añadir notas internas o para el inquilino..."
                  />
                </div>
              </div>

              <div className="modal-footer-custom">
                <button type="button" onClick={handleCloseEditModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingRequest && (
        <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1050
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card, #2c2c3e)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.5))',
            minWidth: '500px',
            maxWidth: '700px',
            border: '1px solid var(--border-primary, #3f3f46)',
            color: 'var(--text-primary, #f0f0f0)',
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-secondary, #555)', paddingBottom: '1rem', flexShrink: 0 }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.5em' }}>
                Detalles Solicitud: {viewingRequest.id}
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary, #aaa)', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem 0.5rem' }}>
                &times;
              </button>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '1rem', marginRight: '-1rem'}}> {/* Scrollable content area */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, auto) 1fr', gap: '0.8rem 1.5rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Inquilino', value: viewingRequest.tenantName },
                  { label: 'Unidad', value: viewingRequest.unit },
                  { label: 'Categoría', value: viewingRequest.category },
                  { label: 'Prioridad', value: <span className={getPriorityClass(viewingRequest.priority)}>{viewingRequest.priority}</span> },
                  { label: 'Fecha Envío', value: new Date(viewingRequest.dateSubmitted).toLocaleDateString() },
                  { label: 'Estado', value: <span className={getStatusClass(viewingRequest.status)}>{viewingRequest.status}</span> },
                  { label: 'Asignado a', value: viewingRequest.assignedTo || 'N/A' },
                ].map(item => (
                  <React.Fragment key={item.label}>
                    <strong style={{ color: 'var(--text-secondary, #aaa)', textAlign: 'right' }}>{item.label}:</strong>
                    <div>{item.value}</div>
                  </React.Fragment>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--text-secondary, #aaa)', display: 'block', marginBottom: '0.5rem' }}>Comentarios del Gestor:</strong>
                <div style={{ background: 'var(--bg-tertiary, #222)', padding: '0.75rem 1rem', borderRadius: '0.5rem', margin: 0, minHeight: '60px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                  {viewingRequest.managerComments || 'N/A'}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--text-secondary, #aaa)', display: 'block', marginBottom: '0.5rem' }}>Descripción Completa (Inquilino):</strong>
                <div style={{ background: 'var(--bg-tertiary, #222)', padding: '0.75rem 1rem', borderRadius: '0.5rem', margin: 0, minHeight: '80px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                  {viewingRequest.fullDescription}
                </div>
              </div>
              
              {viewingRequest.isRatingSubmitted && (
                <div style={{ borderTop: '1px solid var(--border-secondary, #555)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <h3 style={{ color: 'var(--text-primary, #f0f0f0)', marginBottom: '1rem', fontSize: '1.2em' }}>-- Valoración del Inquilino --</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, auto) 1fr', gap: '0.8rem 1.5rem' }}>
                    <strong style={{ color: 'var(--text-secondary, #aaa)', textAlign: 'right' }}>Calificación:</strong>
                    <div>{viewingRequest.tenantRating ? `${viewingRequest.tenantRating} estrellas` : 'No valorado'}</div>
                    
                    <strong style={{ color: 'var(--text-secondary, #aaa)', textAlign: 'right' }}>Comentario:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>{viewingRequest.tenantComment || 'Sin comentarios'}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right', borderTop: '1px solid var(--border-secondary, #555)', paddingTop: '1rem', flexShrink: 0 }}>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="btn" 
                style={{ 
                  backgroundColor: 'var(--accent-secondary, #8b5cf6)', 
                  color: 'white', 
                  padding: '0.7rem 1.3rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMaintenanceView;

/* Basic styling for badges (add to or ensure in globalStyles.css) */
/*
.status-badge, .priority-badge {
  padding: 0.3em 0.7em;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  line-height: 1;
  text-align: center;
}

.status-pending-maint { background-color: var(--accent-warning); color: #000; }
.status-in-progress-maint { background-color: var(--accent-info); color: white; }
.status-completed-maint { background-color: var(--accent-success); color: white; }
.status-rejected-maint { background-color: var(--accent-danger); color: white; }

.priority-high { background-color: #fecaca; color: #b91c1c; border: 1px solid #f87171; }
.priority-medium { background-color: #fed7aa; color: #c2410c; border: 1px solid #fb923c; }
.priority-low { background-color: #d1fae5; color: #047857; border: 1px solid #6ee7b7; }
*/ 