import type { MaintenanceRequest } from '../types/maintenance';

// Array de datos de ejemplo para solicitudes de mantenimiento, conformed to new MaintenanceRequest type
export const sampleRequests: MaintenanceRequest[] = [
  {
    id: 'REQ001',
    tenantId: 'TEN001',
    propertyId: 'PROP001',
    tenantName: 'Ana Gómez',
    title: 'Grifo de la cocina gotea',
    description: 'Grifo de la cocina gotea continuadamente.',
    category: 'Plomería',
    specificLocation: 'Cocina, grifo principal',
    permissionToEnter: true,
    status: 'Completed',
    urgency: 'Medium',
    submittedDate: '2023-10-01T10:00:00Z',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-03T11:00:00Z',
    images: ['https://via.placeholder.com/150/FF0000/FFFFFF?Text=Inquilino1', 'https://via.placeholder.com/150/00FF00/FFFFFF?Text=Inquilino2'],
    managerNotes: 'Se reemplazó la goma del grifo y se verificó que no haya fugas. Trabajo completado.',
    completedPhotos: ['https://via.placeholder.com/150/0000FF/FFFFFF?Text=Manager1', 'https://via.placeholder.com/150/00AAFF/FFFFFF?Text=Manager2'],
    feedbackRating: 5,
    feedbackComments: '¡Excelente trabajo! El grifo funciona perfectamente ahora. Muy rápido y profesional.',
    scheduledDate: '2023-10-03T09:00:00Z',
    assignedSpecialist: 'Carlos (Fontanero)'
  },
  {
    id: 'REQ002',
    tenantId: 'TEN002',
    propertyId: 'PROP002',
    tenantName: 'Luis Fernandez',
    title: 'Calefacción no funciona en salón',
    description: 'Calefacción no funciona, no expulsa aire caliente.',
    category: 'Aire Acondicionado/Calefacción',
    specificLocation: 'Sala de Estar, unidad principal',
    permissionToEnter: true,
    status: 'Resolved/Pending Review',
    urgency: 'High',
    submittedDate: '2023-10-02T14:30:00Z',
    createdAt: '2023-10-02T14:30:00Z',
    assignedSpecialist: 'Juan Pérez (Técnico HVAC)',
    internalNotes: 'Revisar caldera y termostato. Posible fallo en sensor.',
    scheduledDate: '2023-10-05T09:00:00Z',
    managerNotes: 'Caldera revisada, pendiente de pieza (sensor T-100). Se espera pieza para el 07/10.'
  },
  {
    id: 'REQ003',
    tenantId: 'TEN003',
    propertyId: 'PROP003',
    tenantName: 'Sofía Castro',
    title: 'Luz de escalera parpadea constantemente',
    description: 'Luz de escalera parpadea, afecta visibilidad.',
    category: 'Electricidad',
    specificLocation: 'Escalera entre Piso 2 y 3',
    permissionToEnter: false,
    status: 'Scheduled',
    urgency: 'Low',
    submittedDate: '2023-10-04T11:00:00Z',
    createdAt: '2023-10-04T11:00:00Z',
    managerNotes: 'Se ajustó la conexión de la luz. Programado electricista para revisión completa el 06/10.',
    scheduledDate: '2023-10-06T14:00:00Z'
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

    const updatedRequestData: MaintenanceRequest = { 
        ...currentRequest, 
        ...updates, 
        completedPhotos: newCompletedPhotos,
        updatedAt: new Date().toISOString()
    };
    
    sampleRequests[requestIndex] = updatedRequestData;
    return updatedRequestData;
  }
  return undefined;
}; 