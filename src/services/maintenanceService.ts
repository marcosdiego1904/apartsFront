import { MockBackendService } from './MockBackendService';
import type { MaintenanceRequestDisplayItem, MaintenanceRequest } from './MockBackendService';

const mockBackendService = MockBackendService.getInstance();

export const getTenantRequests = (tenantId: string): Promise<MaintenanceRequestDisplayItem[]> => {
  return mockBackendService.getTenantRequests(tenantId);
};

export const submitRequest = (request: MaintenanceRequestDisplayItem): Promise<MaintenanceRequestDisplayItem> => {
  return mockBackendService.submitRequest(request);
};

export const getManagedRequests = (): Promise<MaintenanceRequest[]> => {
  return mockBackendService.getManagedRequests();
};

export const updateManagedRequest = (request: MaintenanceRequest): Promise<MaintenanceRequest> => {
  return mockBackendService.updateManagedRequest(request);
};

export const submitRating = (ratingInfo: { requestId: string; rating: number; comment: string; }): Promise<void> => {
  return mockBackendService.submitRating(ratingInfo);
}; 