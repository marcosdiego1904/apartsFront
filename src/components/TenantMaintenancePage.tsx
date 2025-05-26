import React, { useState } from 'react';
import MaintenanceRequestForm from './MaintenanceRequestForm';
import { MaintenanceRequestListItem } from './MaintenanceRequestListItem'; // Asumiendo que la exportación es nombrada
import '../styles/TenantMaintenancePage.css'; // Crearemos este archivo de estilos

// Definimos una interfaz para los datos del formulario que esperamos
interface MaintenanceFormData {
  description: string;
  category: string;
  specificLocation: string;
  urgency: 'Baja' | 'Media' | 'Alta/Emergencia';
  permissionToEnter: boolean;
  preferredEntryTime?: string;
}

// Reutilizamos la interfaz de MaintenanceRequestListItem para la lista de solicitudes
// Asegúrate de que esta interfaz coincida con la que usa MaintenanceRequestListItem
interface DetailedMaintenanceRequest {
  id: string;
  description: string;
  category: string;
  specificLocation: string;
  urgency: 'Baja' | 'Media' | 'Alta/Emergencia';
  permissionToEnter: boolean;
  preferredEntryTime?: string;
  submittedDate: string;
  status: 'Enviada' | 'Recibida' | 'En Progreso' | 'Programada' | 'Resuelta/Pendiente de Valoración' | 'Completada/Cerrada' | 'Cancelada';
  title?: string;
  scheduledDate?: string;
  resolutionDate?: string;
  managerNotes?: string;
  rating?: number;
  ratingComments?: string;
}

const TenantMaintenancePage: React.FC = () => {
  const [requests, setRequests] = useState<DetailedMaintenanceRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleFormSubmit = (formData: MaintenanceFormData) => {
    const newRequest: DetailedMaintenanceRequest = {
      ...formData,
      id: Date.now().toString(), // ID simple basado en timestamp
      submittedDate: new Date().toISOString(),
      status: 'Enviada', // Estado inicial
      title: formData.description.substring(0, 30) + (formData.description.length > 30 ? '...':''), // Título corto
    };
    console.log('Nueva solicitud desde TenantMaintenancePage:', newRequest);
    setRequests(prevRequests => [...prevRequests, newRequest]);
    // Aquí, en una aplicación real, enviarías la newRequest a tu backend/API
  };

  const handleViewDetails = (requestId: string) => {
    console.log("Ver detalles de la solicitud:", requestId);
    setSelectedRequestId(requestId);
    // Aquí podrías implementar la lógica para mostrar detalles, quizás en un modal o una vista separada.
    // Por ahora, solo lo mostraremos en la consola y seleccionaremos la ID.
  };
  
  // Simulación de la función onRateRequest que se pasaría a MaintenanceRequestListItem
  // En una aplicación real, esto interactuaría con tu backend
  const handleRateRequest = async (requestId: string, rating: number, comments: string) => {
    console.log(`Rating for request ${requestId}: ${rating}, Comments: ${comments}`);
    // Simular una llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, rating, ratingComments: comments, status: 'Completada/Cerrada' } // Actualiza el estado de la solicitud
          : req
      )
    );
    // Aquí deberías manejar la respuesta de la API, errores, etc.
    // throw new Error("Simulated API error"); // Descomenta para probar el manejo de errores
  };


  const selectedRequestDetails = requests.find(req => req.id === selectedRequestId);

  return (
    <div className="tenant-maintenance-container">
      <h2>Mis Solicitudes de Mantenimiento</h2>
      
      <div className="maintenance-content">
        <div className="form-section">
          <MaintenanceRequestForm onSubmit={handleFormSubmit} />
        </div>

        <div className="list-section">
          <h3>Solicitudes Enviadas</h3>
          {requests.length === 0 ? (
            <p>No has enviado ninguna solicitud aún.</p>
          ) : (
            <ul className="maintenance-request-list">
              {requests.map(req => (
                <MaintenanceRequestListItem 
                  key={req.id} 
                  request={req} 
                  onViewDetails={handleViewDetails}
                  onRateRequest={handleRateRequest} // Pasamos la nueva prop
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sección para mostrar detalles (opcional, se podría mover a un modal) */}
      {selectedRequestDetails && (
        <div className="request-details-view">
          <h3>Detalles de la Solicitud: {selectedRequestDetails.title}</h3>
          <p><strong>ID:</strong> {selectedRequestDetails.id}</p>
          <p><strong>Descripción Completa:</strong> {selectedRequestDetails.description}</p>
          <p><strong>Categoría:</strong> {selectedRequestDetails.category}</p>
          <p><strong>Ubicación:</strong> {selectedRequestDetails.specificLocation}</p>
          <p><strong>Urgencia:</strong> {selectedRequestDetails.urgency}</p>
          <p><strong>Permiso de Entrada:</strong> {selectedRequestDetails.permissionToEnter ? 'Sí' : 'No'}</p>
          {selectedRequestDetails.permissionToEnter && selectedRequestDetails.preferredEntryTime && (
            <p><strong>Horario Preferido:</strong> {selectedRequestDetails.preferredEntryTime}</p>
          )}
          <p><strong>Fecha Envío:</strong> {new Date(selectedRequestDetails.submittedDate).toLocaleString()}</p>
          <p><strong>Estado:</strong> {selectedRequestDetails.status}</p>
          {selectedRequestDetails.scheduledDate && <p><strong>Fecha Programada:</strong> {new Date(selectedRequestDetails.scheduledDate).toLocaleString()}</p>}
          {selectedRequestDetails.resolutionDate && <p><strong>Fecha Resolución:</strong> {new Date(selectedRequestDetails.resolutionDate).toLocaleString()}</p>}
          {selectedRequestDetails.managerNotes && <p><strong>Notas del Manager:</strong> {selectedRequestDetails.managerNotes}</p>}
           {selectedRequestDetails.rating !== undefined && (
            <>
              <p><strong>Tu Valoración:</strong> {selectedRequestDetails.rating} estrellas</p>
              {selectedRequestDetails.ratingComments && <p><strong>Tus Comentarios:</strong> {selectedRequestDetails.ratingComments}</p>}
            </>
          )}
          <button onClick={() => setSelectedRequestId(null)}>Cerrar Detalles</button>
        </div>
      )}
    </div>
  );
};

export default TenantMaintenancePage;
