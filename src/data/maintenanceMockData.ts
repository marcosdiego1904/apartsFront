import type { MaintenanceRequest } from '../types/maintenance';

// Array de datos de ejemplo para solicitudes de mantenimiento
export const sampleRequests: MaintenanceRequest[] = [
  {
    id: 'REQ001',
    tenantId: 'TEN001',
    propertyId: 'PROP001',
    description: 'Grifo de la cocina gotea',
    status: 'Completed',
    urgency: 'Medium',
    createdAt: new Date('2023-10-01T10:00:00Z'),
    updatedAt: new Date('2023-10-03T11:00:00Z'),
    tenantName: 'Ana Gómez',
    images: ['https://via.placeholder.com/150/FF0000/FFFFFF?Text=Inquilino1', 'https://via.placeholder.com/150/00FF00/FFFFFF?Text=Inquilino2'],
    managerNotes: 'Se reemplazó la goma del grifo y se verificó que no haya fugas. Trabajo completado.',
    completedPhotos: ['https://via.placeholder.com/150/0000FF/FFFFFF?Text=Manager1', 'https://via.placeholder.com/150/00AAFF/FFFFFF?Text=Manager2'],
    rating: 5,
    feedback: '¡Excelente trabajo! El grifo funciona perfectamente ahora. Muy rápido y profesional.',
    scheduledDate: new Date('2023-10-03T09:00:00Z'),
    assignedSpecialist: 'Carlos (Fontanero)'
  },
  {
    id: 'REQ002',
    tenantId: 'TEN002',
    propertyId: 'PROP002',
    description: 'Calefacción no funciona',
    status: 'Resolved/Pending Review',
    urgency: 'High',
    createdAt: new Date('2023-10-02T14:30:00Z'),
    assignedSpecialist: 'Juan Pérez (Fontanero)',
    internalNotes: 'Revisar caldera y termostato.',
    tenantName: 'Luis Fernandez',
    scheduledDate: new Date('2023-10-05T09:00:00Z'),
    managerNotes: 'Caldera revisada, pendiente de pieza.'
  },
  {
    id: 'REQ003',
    tenantId: 'TEN003',
    propertyId: 'PROP003',
    description: 'Luz de escalera parpadea',
    status: 'Resolved/Pending Review',
    urgency: 'Low',
    createdAt: new Date('2023-10-04T11:00:00Z'),
    tenantName: 'Sofía Castro',
    managerNotes: 'Se ajustó la conexión de la luz.',
  }
];

// Simulación de la función para obtener una solicitud por ID
export const fetchRequestById = async (id: string): Promise<MaintenanceRequest | undefined> => {
  return sampleRequests.find(req => req.id === id);
};

// Simulación de la función para actualizar una solicitud
export const updateRequestAPI = async (id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> => {
  console.log('Actualizando solicitud con:', id, updates);
  
  const requestIndex = sampleRequests.findIndex(req => req.id === id);
  
  if (requestIndex !== -1) {
    const currentRequest = sampleRequests[requestIndex];
    
    let newCompletedPhotos = currentRequest.completedPhotos || [];
    if (updates.completedPhotos && updates.completedPhotos.length > 0) {
        newCompletedPhotos = [...newCompletedPhotos, ...updates.completedPhotos];
    }

    const updatedRequestData = { 
        ...currentRequest, 
        ...updates, 
        completedPhotos: newCompletedPhotos,
        updatedAt: new Date() 
    };
    
    sampleRequests[requestIndex] = updatedRequestData;
    return updatedRequestData;
  }
  return undefined;
}; 