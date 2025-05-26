import React, { useState } from 'react';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import '../styles/MaintenanceRequestListItem.css'; // Asegúrate que esta ruta sea correcta

// Definición de la interfaz (idealmente en un archivo de tipos compartido)
export interface DetailedMaintenanceRequest {
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
  // Campos para feedback (añadidos para la funcionalidad de valoración)
  feedbackRating?: number;
  feedbackComments?: string;
}

interface MaintenanceRequestListItemProps {
  request: DetailedMaintenanceRequest;
  onViewDetails: (requestId: string) => void;
  // Añadiremos onCancelRequest si implementamos la cancelación
  // onCancelRequest?: (requestId: string) => void; 
}

const MaintenanceRequestListItem: React.FC<MaintenanceRequestListItemProps> = ({ request, onViewDetails }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    return `status-${status.toLowerCase().replace(/[\s/]+/g, '-')}`;
  };

  const getUrgencyClass = (urgency: string) => {
    return `urgency-${urgency.toLowerCase().replace(/[\s/]+/g, '-')}`;
  };

  return (
    <li className={`maintenance-list-item ${getStatusClass(request.status)} ${getUrgencyClass(request.urgency)}`}>
      <div className="item-header">
        <h5 className="item-title">{request.title || request.description.substring(0, 60) + '...'}</h5>
        <span className={`item-status-badge ${getStatusClass(request.status)}`}>{request.status}</span>
      </div>
      <div className="item-body">
        <p><strong>Categoría:</strong> {request.category}</p>
        <p><strong>Ubicación:</strong> {request.specificLocation}</p>
        <p><strong>Enviada:</strong> {formatDate(request.submittedDate)}</p>
        <p><strong>Urgencia:</strong> <span className={getUrgencyClass(request.urgency)}>{request.urgency}</span></p>
        {request.scheduledDate && (
          <p><strong>Programada para:</strong> {formatDate(request.scheduledDate)}</p>
        )}
         {request.status === 'Resuelta/Pendiente de Valoración' && !request.feedbackRating && (
          <p className="pending-feedback-notice"><strong>Estado:</strong> Pendiente de tu valoración</p>
        )}
        {request.feedbackRating && (
          <p><strong>Tu Valoración:</strong> {request.feedbackRating} estrellas</p>
        )}
      </div>
      <div className="item-footer">
        <button onClick={() => onViewDetails(request.id)} className="details-button">
          Ver Detalles / Valorar
        </button>
        {/* {
          request.status === 'Enviada' && onCancelRequest && (
            <button onClick={() => onCancelRequest(request.id)} className="cancel-button">
              Cancelar Solicitud
            </button>
          )
        } */}
      </div>
    </li>
  );
};

export default MaintenanceRequestListItem; 