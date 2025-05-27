export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName?: string;
  propertyId: string;
  title?: string;
  description: string;
  category: string;
  specificLocation: string;
  permissionToEnter: boolean;
  preferredEntryTime?: string;
  status: 'Sent' | 'Received' | 'In Progress' | 'Scheduled' | 'Resolved/Pending Review' | 'Completed' | 'Cancelled';
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  submittedDate: string;
  createdAt: string;
  updatedAt?: string;
  scheduledDate?: string;
  resolutionDate?: string;
  images?: string[];
  assignedSpecialist?: string;
  internalNotes?: string;
  managerNotes?: string;
  completedPhotos?: string[];
  feedbackRating?: number;
  feedbackComments?: string;
}

// Podríamos añadir más estados o campos según sea necesario. 