export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  description: string;
  category: string;
  specificLocation: string;
  permissionToEnter: boolean;
  preferredEntryTime?: string;
  status: 'New' | 'In Progress' | 'Scheduled' | 'Resolved/Pending Review' | 'Completed' | 'Cancelled' | 'Enviada' | 'Recibida' | 'En Progreso' | 'Programada' | 'Resuelta/Pendiente de Valoración' | 'Completada/Cerrada';
  urgency: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Baja' | 'Media' | 'Alta/Emergencia';
  createdAt: Date;
  updatedAt?: Date;
  images?: string[];
  assignedSpecialist?: string;
  internalNotes?: string;
  scheduledDate?: Date;
  managerNotes?: string;
  completedPhotos?: string[];
  rating?: number;
  feedback?: string;
  tenantName?: string;
  title?: string;
  resolutionDate?: Date;
}

// Podríamos añadir más estados o campos según sea necesario. 