import React, { useState, useEffect } from 'react';
import '../styles/MaintenanceRequestForm.css'; // Import the new CSS file
import { useAuth } from '../context/AuthContext';

interface FormData {
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'general' | '';
  urgency: 'low' | 'medium' | 'high' | '';
  permissionToEnter: 'yes' | 'no' | '';
  contactMethod: 'email' | 'phone' | '';
  // photo?: File; // For actual file handling later
}

// Interface for displaying existing requests
export interface MaintenanceRequestDisplayItem {
  id: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'general';
  dateSubmitted: string;
  status: 'sent' | 'in-progress' | 'completed' | 'cancelled';
  description: string; // Keep it brief for the list, full details on click maybe
  urgency: 'low' | 'medium' | 'high';
  tenantRating?: number;
  tenantComment?: string;
  isRatingSubmitted?: boolean; // New field
  tenantId?: string;
}

// Simplified interface for data from manager's store
interface ManagedRequestStatusInfo {
  id: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'Rechazado';
  // We could add managerComments or assignedTo here if needed for tenant view
}

interface MaintenanceRequestFormProps {
  onFormSubmit: () => void;
  requests: MaintenanceRequestDisplayItem[]; // Receive requests from parent
}

const MaintenanceRequestForm: React.FC<MaintenanceRequestFormProps> = ({ onFormSubmit, requests }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    urgency: '',
    permissionToEnter: '',
    contactMethod: '',
  });

  const [existingRequests, setExistingRequests] = useState<MaintenanceRequestDisplayItem[]>(requests);

  useEffect(() => {
    setExistingRequests(requests);
  }, [requests]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 2; // You can adjust this value as needed

  // Calculate paginated requests
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = existingRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(existingRequests.length / requestsPerPage);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // State for rating UI - visual only, not persisted yet
  const [draftRatings, setDraftRatings] = useState<{ [key: string]: number }>({});
  const [draftComments, setDraftComments] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
  //   }
  // };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newRequestItem: MaintenanceRequestDisplayItem = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      title: formData.title,
      category: formData.category as MaintenanceRequestDisplayItem['category'],
      dateSubmitted: new Date().toISOString(),
      status: 'sent',
      description: formData.description,
      urgency: formData.urgency as MaintenanceRequestDisplayItem['urgency'],
      isRatingSubmitted: false, // Initialize for new requests
      tenantId: user?.id,
    };

    try {
      const currentTenantSubmittedJSON = localStorage.getItem('tenantSubmittedMaintenanceRequests');
      let allTenantSubmitted: MaintenanceRequestDisplayItem[] = [];
      if (currentTenantSubmittedJSON) {
        allTenantSubmitted = JSON.parse(currentTenantSubmittedJSON);
      }
      allTenantSubmitted.unshift(newRequestItem);
      localStorage.setItem('tenantSubmittedMaintenanceRequests', JSON.stringify(allTenantSubmitted));
    } catch (error) {
      console.error("Error updating tenantSubmittedMaintenanceRequests in localStorage:", error);
    }
    
    onFormSubmit(); // Callback to refresh dashboard data

    // No longer need to manually update local state, will be handled by parent
    // setExistingRequests(prev => [newRequestItem, ...prev].sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()));
    
    setCurrentPage(1);
    alert('Solicitud de mantenimiento enviada.');
    setFormData({ title: '', description: '', category: '', urgency: '', permissionToEnter: '', contactMethod: '' });
  };
  
  // Helper to get status class for styling
  const getStatusClass = (status: MaintenanceRequestDisplayItem['status']) => {
    switch (status) {
      case 'sent': return 'status-badge-sent';
      case 'in-progress': return 'status-badge-in-progress';
      case 'completed': return 'status-badge-completed';
      case 'cancelled': return 'status-badge-cancelled';
      default: return '';
    }
  };

  const handleRatingChange = (requestId: string, rating: number) => {
    setDraftRatings(prev => ({ ...prev, [requestId]: rating }));
  };

  const handleCommentChange = (requestId: string, comment: string) => {
    setDraftComments(prev => ({ ...prev, [requestId]: comment }));
  };

  const handleSubmitRating = (requestId: string) => {
    const ratingValue = draftRatings[requestId];
    const commentValue = draftComments[requestId] || '';
    
    console.log(`Tenant submitting rating for ${requestId}: Rating: ${ratingValue}, Comment: '${commentValue}'`);

    try {
      const savedTenantRequestsJSON = localStorage.getItem('tenantSubmittedMaintenanceRequests');
      let tenantRequests: MaintenanceRequestDisplayItem[] = [];
      if (savedTenantRequestsJSON) {
        tenantRequests = JSON.parse(savedTenantRequestsJSON);
      } else {
        console.warn('No tenantSubmittedMaintenanceRequests found in localStorage to update rating.');
      }

      const requestIndex = tenantRequests.findIndex(req => req.id === requestId);

      if (requestIndex !== -1) {
        const updatedRequest = {
          ...tenantRequests[requestIndex],
          tenantRating: ratingValue,
          tenantComment: commentValue,
          isRatingSubmitted: true, // Set the flag here
        };
        tenantRequests[requestIndex] = updatedRequest;
        localStorage.setItem('tenantSubmittedMaintenanceRequests', JSON.stringify(tenantRequests));
        console.log('Updated tenantSubmittedMaintenanceRequests with rating submitted flag:', tenantRequests);
        
        // Update local state for immediate UI feedback
        setExistingRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId 
              ? { ...req, tenantRating: ratingValue, tenantComment: commentValue, isRatingSubmitted: true } 
              : req
          ).sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
        );

      } else {
        console.warn(`Could not find request with ID ${requestId} to update rating in tenantSubmittedMaintenanceRequests.`);
      }
    } catch (error) {
      console.error("Error updating rating in tenantSubmittedMaintenanceRequests:", error);
    }
    // No need for setSubmittedRatings(prev => ({ ...prev, [requestId]: true })); anymore
  };

  return (
    <>
      <div className="maintenance-form-container">
        <form onSubmit={handleSubmit} className="maintenance-form">
          <h2 className="maintenance-form-title">
            📝 Nueva Solicitud de Mantenimiento
          </h2>

          <div className="form-group">
            <label htmlFor="title" className="form-label">Asunto / Título Breve:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Grifo de la cocina gotea"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">Categoría del Problema:</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Seleccione una categoría...</option>
              <option value="plumbing">Plomería (Agua, Desagües)</option>
              <option value="electrical">Electricidad (Luces, Enchufes)</option>
              <option value="appliance">Electrodomésticos (Nevera, Estufa, AC)</option>
              <option value="general">General (Puertas, Ventanas, Otros)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="form-label">Descripción Detallada:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Por favor, describa el problema con el mayor detalle posible..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="urgency" className="form-label">Nivel de Urgencia:</label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Seleccione la urgencia...</option>
              <option value="low">Baja (No urgente, puede esperar unos días)</option>
              <option value="medium">Media (Importante, pero no una emergencia)</option>
              <option value="high">Alta (Urgente, requiere atención rápida)</option>
            </select>
          </div>
          
          <fieldset className="fieldset-container">
              <legend className="fieldset-legend">Permiso de Entrada:</legend>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="permissionToEnter" value="yes" checked={formData.permissionToEnter === 'yes'} onChange={handleChange} className="radio-input" required/>
                  Sí, pueden entrar si no estoy.
                </label>
                <label className="radio-label">
                  <input type="radio" name="permissionToEnter" value="no" checked={formData.permissionToEnter === 'no'} onChange={handleChange} className="radio-input" />
                  No, prefiero estar presente.
                </label>
              </div>
          </fieldset>

          <fieldset className="fieldset-container">
              <legend className="fieldset-legend">Método de Contacto Preferido:</legend>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="contactMethod" value="email" checked={formData.contactMethod === 'email'} onChange={handleChange} className="radio-input" required />
                  Correo Electrónico
                </label>
                <label className="radio-label">
                  <input type="radio" name="contactMethod" value="phone" checked={formData.contactMethod === 'phone'} onChange={handleChange} className="radio-input" />
                  Teléfono
                </label>
              </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="photo" className="form-label">Adjuntar Foto (Opcional):</label>
            <input
              type="file"
              id="photo"
              name="photo"
              // onChange={handleFileChange} // Uncomment when file handling is implemented
              className="form-input" // Uses general form-input, specific style for type=file added in CSS
              accept="image/*"
            />
             <small className="file-input-description">
               Sube una foto del problema si ayuda a describirlo mejor.
             </small>
          </div>

          <button type="submit" className="submit-button">
            Enviar Solicitud de Mantenimiento
          </button>
        </form>
      </div>

      {/* Section for Existing Requests */}
      <div className="request-list-section">
        <h2 className="request-list-title">📋 Mis Solicitudes Anteriores</h2>
        {existingRequests.length > 0 ? (
          <>
            <div className="request-list">
              {currentRequests.map(req => (
                <div key={req.id} className="request-item-card">
                  <div className="request-item-header">
                    <h3 className="request-item-title">{req.title}</h3>
                    <span className={`request-item-status ${getStatusClass(req.status)}`}>{req.status.replace('-', ' ')}</span>
                  </div>
                  <div className="request-item-body">
                    <p><strong>Categoría:</strong> {req.category}</p>
                    <p><strong>Urgencia:</strong> {req.urgency}</p>
                    <p><strong>Enviada:</strong> {new Date(req.dateSubmitted).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="request-item-description"><strong>Descripción:</strong> {req.description}</p>
                  </div>

                  {req.status === 'completed' && !req.isRatingSubmitted && (
                    <div className="request-rating-area">
                      <h4 className="rating-area-title">Valora este servicio:</h4>
                      <div className="star-rating-input">
                        {[1, 2, 3, 4, 5].map(starValue => (
                          <button
                            key={starValue}
                            type="button"
                            className={`star-btn ${starValue <= (draftRatings[req.id] || 0) ? 'selected' : ''}`}
                            onClick={() => handleRatingChange(req.id, starValue)}
                            aria-label={`Valorar con ${starValue} estrellas`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="rating-comment-input"
                        placeholder="Deja un comentario opcional sobre el servicio..."
                        value={draftComments[req.id] || ''}
                        onChange={(e) => handleCommentChange(req.id, e.target.value)}
                        rows={3}
                        maxLength={250}
                      />
                      <button
                        type="button"
                        className="submit-rating-button"
                        onClick={() => handleSubmitRating(req.id)}
                        disabled={!draftRatings[req.id] || draftRatings[req.id] === 0}
                      >
                        Enviar Valoración
                      </button>
                    </div>
                  )}

                  {req.isRatingSubmitted && (
                    <div className="rating-submitted-message">
                      <p>¡Gracias por tu valoración!</p>
                      {req.tenantRating && <p><strong>Tu calificación:</strong> {req.tenantRating} ★</p>}
                      {req.tenantComment && <p><strong>Tu comentario:</strong> {req.tenantComment}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-requests-message">No tienes solicitudes de mantenimiento anteriores.</p>
        )}
      </div>
    </>
  );
};

export default MaintenanceRequestForm; 