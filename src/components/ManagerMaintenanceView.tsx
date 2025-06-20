import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiEye, FiEdit, FiX, FiInfo, FiUser, FiHome, FiTool, FiHash, FiStar, FiMessageSquare, FiPaperclip } from 'react-icons/fi';
import './ManagerMaintenanceView.css'; // Import the new CSS file
import { getManagedRequests, updateManagedRequest } from '../services/maintenanceService';
import type { MaintenanceRequest } from '../services/MockBackendService';

const ITEMS_PER_PAGE = 10;

type SortableKeys = keyof MaintenanceRequest;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
}

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

  const fetchAndSetRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const requests = await getManagedRequests();
      setAllRawRequests(requests);
    } catch (error) {
      console.error("[ManagerMaintenanceView] Error fetching requests:", error);
      displayFeedback('error', 'Error al cargar las solicitudes de mantenimiento.');
      setAllRawRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [displayFeedback]);

  // Load data on component mount
  useEffect(() => {
    fetchAndSetRequests();
  }, [fetchAndSetRequests]);


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
    if (currentPage !== 1 && filtered.length > 0) {
        const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages) {
            setCurrentPage(newTotalPages || 1);
        }
    } else if (filtered.length === 0) {
        setCurrentPage(1);
    } else {
        setCurrentPage(1);
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
  
  const handleSaveEditModal = async (updatedRequest: MaintenanceRequest) => {
    setIsLoading(true);
    try {
      await updateManagedRequest(updatedRequest);
      await fetchAndSetRequests();
      displayFeedback('success', `Solicitud ${updatedRequest.id} actualizada con éxito.`);
    } catch (error) {
      console.error("Error updating request:", error);
      displayFeedback('error', `Error al actualizar la solicitud ${updatedRequest.id}.`);
    } finally {
      setIsLoading(false);
      setIsEditModalOpen(false);
      setEditingRequest(null);
    }
  };

  if (isLoading && !allRawRequests.length) {
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

      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Filtros y Búsqueda</h3>
        </div>
        <div className="card-content">
          <div className="form-grid form-grid-cols-3">
            <div className="form-group">
              <label htmlFor="statusFilter" className="form-label">Estado:</label>
              <select id="statusFilter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control">
                <option value="all">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priorityFilter" className="form-label">Prioridad:</label>
              <select id="priorityFilter" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="form-control">
                <option value="all">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="searchTerm" className="form-label">Buscar:</label>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                placeholder="Buscar por inquilino, unidad, etc."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Lista de Solicitudes</h3>
        </div>
        <div className="card-content">
          <div className="table-wrapper">
            {isLoading && <div className="loading-overlay"><p>Actualizando datos...</p></div>}
            <div className="table-responsive">
              {processedRequests.length === 0 && !isLoading ? (
                <div className="empty-state">
                  <p>No hay solicitudes que coincidan con los filtros actuales.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th onClick={() => requestSort('id')}>ID {getSortIndicator('id')}</th>
                        <th onClick={() => requestSort('tenantName')}>Inquilino {getSortIndicator('tenantName')}</th>
                        <th onClick={() => requestSort('unit')}>Unidad {getSortIndicator('unit')}</th>
                        <th onClick={() => requestSort('category')}>Categoría {getSortIndicator('category')}</th>
                        <th onClick={() => requestSort('priority')}>Prioridad {getSortIndicator('priority')}</th>
                        <th onClick={() => requestSort('status')}>Estado {getSortIndicator('status')}</th>
                        <th onClick={() => requestSort('dateSubmitted')}>Fecha {getSortIndicator('dateSubmitted')}</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRequests.map(request => (
                        <tr key={request.id}>
                          <td data-label="ID">{request.id}</td>
                          <td data-label="Inquilino">{request.tenantName}</td>
                          <td data-label="Unidad">{request.unit}</td>
                          <td data-label="Categoría">{request.category}</td>
                          <td data-label="Prioridad"><span className={getPriorityClass(request.priority)}>{request.priority}</span></td>
                          <td data-label="Estado"><span className={getStatusClass(request.status)}>{request.status}</span></td>
                          <td data-label="Fecha">{new Date(request.dateSubmitted).toLocaleDateString()}</td>
                          <td data-label="Acciones" className="actions-cell">
                            <button onClick={() => handleOpenViewModal(request)} className="btn-icon" title="Ver Detalles">
                              <FiEye />
                            </button>
                            <button onClick={() => handleOpenEditModal(request)} className="btn-icon btn-edit" title="Editar Solicitud">
                              <FiEdit />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="pagination-container">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">
                Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && editingRequest && (
        <div className="modal-backdrop active">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEditModal(editingRequest); }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  <FiEdit /> Editar Solicitud de Mantenimiento
                </h3>
                <button type="button" onClick={handleCloseEditModal} className="modal-close-btn">
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="edit-status" className="form-label">Estado:</label>
                    <select
                      id="edit-status"
                      className="form-control"
                      value={editingRequest.status}
                      onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value as MaintenanceRequest['status'] })}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Completado">Completado</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-priority" className="form-label">Prioridad:</label>
                    <select
                      id="edit-priority"
                      className="form-control"
                      value={editingRequest.priority}
                      onChange={(e) => setEditingRequest({ ...editingRequest, priority: e.target.value as MaintenanceRequest['priority'] })}
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="edit-assigned" className="form-label">Asignado a:</label>
                    <input
                      type="text"
                      id="edit-assigned"
                      className="form-control"
                      value={editingRequest.assignedTo || ''}
                      onChange={(e) => setEditingRequest({ ...editingRequest, assignedTo: e.target.value })}
                      placeholder="Ej: Equipo de fontanería"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="edit-comments" className="form-label">Comentarios del Administrador:</label>
                    <textarea
                      id="edit-comments"
                      className="form-control"
                      rows={4}
                      value={editingRequest.managerComments || ''}
                      onChange={(e) => setEditingRequest({ ...editingRequest, managerComments: e.target.value })}
                      placeholder="Añadir notas internas sobre el progreso o la resolución..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseEditModal} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewingRequest && (
        <div className="modal-backdrop active">
          <div className="modal-content" style={{ maxWidth: '650px' }}>

            <div className="modal-header">
              <h3 className="modal-title">
                <FiInfo /> Detalles de la Solicitud
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="modal-close-btn">
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="view-request-grid">

                <div className="detail-card">
                  <div className="detail-card-header">
                    <FiUser />
                    <h4>Información del Inquilino</h4>
                  </div>
                  <div className="detail-card-body">
                    <p><strong>ID de Solicitud:</strong> <span>{viewingRequest.id}</span></p>
                    <p><strong>Inquilino:</strong> <span>{viewingRequest.tenantName}</span></p>
                    <p><strong>Unidad:</strong> <span>{viewingRequest.unit}</span></p>
                    <p><strong>Fecha de Envío:</strong> <span>{new Date(viewingRequest.dateSubmitted).toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-header">
                    <FiTool />
                    <h4>Detalles de la Solicitud</h4>
                  </div>
                  <div className="detail-card-body">
                    <p><strong>Categoría:</strong> <span>{viewingRequest.category}</span></p>
                    <p><strong>Prioridad:</strong> <span className={getPriorityClass(viewingRequest.priority)}>{viewingRequest.priority}</span></p>
                    <p><strong>Estado:</strong> <span className={getStatusClass(viewingRequest.status)}>{viewingRequest.status}</span></p>
                    <p><strong>Asignado a:</strong> <span>{viewingRequest.assignedTo || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="detail-card full-span">
                   <div className="detail-card-header">
                    <FiMessageSquare />
                    <h4>Descripción</h4>
                  </div>
                  <div className="detail-card-body">
                    <p>{viewingRequest.fullDescription}</p>
                  </div>
                </div>

                <div className="detail-card full-span">
                   <div className="detail-card-header">
                    <FiMessageSquare />
                    <h4>Comentarios del Administrador</h4>
                  </div>
                  <div className="detail-card-body">
                    <p>{viewingRequest.managerComments || 'Sin comentarios.'}</p>
                  </div>
                </div>

                 <div className="detail-card full-span">
                   <div className="detail-card-header">
                    <FiStar />
                    <h4>Feedback del Inquilino</h4>
                  </div>
                  <div className="detail-card-body">
                     <p><strong>Rating:</strong> <span>{viewingRequest.tenantRating ? `${'★'.repeat(viewingRequest.tenantRating)}${'☆'.repeat(5 - viewingRequest.tenantRating)}` : 'No calificado'}</span></p>
                     <p><strong>Comentarios:</strong> <span>{viewingRequest.tenantComment || 'Sin comentarios.'}</span></p>
                  </div>
                </div>
              </div>
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