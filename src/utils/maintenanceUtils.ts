// src/utils/maintenanceUtils.ts

// Copied from ManagerMaintenanceView.tsx - represents data from the tenant's form
export interface TenantRequestDisplayItem {
  id: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'general' | '';
  dateSubmitted: string;
  status: 'sent' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  urgency: 'low' | 'medium' | 'high' | '';
  tenantRating?: number;
  tenantComment?: string;
  isRatingSubmitted?: boolean;
}

// Copied from ManagerMaintenanceView.tsx - represents the manager's view of a request
export interface MaintenanceRequest {
  id: string;
  tenantName: string;
  unit: string;
  category: string;
  description: string;
  fullDescription: string;
  dateSubmitted: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'Rechazado';
  priority: 'Alta' | 'Media' | 'Baja';
  lastUpdated: string; // Add lastUpdated field
  assignedTo?: string;
  managerComments?: string;
  tenantRating?: number;
  tenantComment?: string;
  isRatingSubmitted?: boolean;
}

// Helper function to transform tenant request to manager request
export const transformTenantRequest = (tenantRequest: TenantRequestDisplayItem): MaintenanceRequest => {
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

  // In a real app, you'd fetch this from user data based on tenantId
  const tenantName = "Inquilino Ejemplo"; 
  const unitNumber = `Apt ${(Math.floor(Math.random() * 10) + 1)}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`;

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
    lastUpdated: new Date().toISOString(), // Set current date as last updated
    assignedTo: '',
    managerComments: '',
    tenantRating: tenantRequest.tenantRating,
    tenantComment: tenantRequest.tenantComment,
    isRatingSubmitted: tenantRequest.isRatingSubmitted,
  };
}; 