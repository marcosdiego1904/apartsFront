import { MockBackendService } from './MockBackendService';

const mockBackendService = MockBackendService.getInstance();

export const getTenantDashboardData = (tenantId: string): Promise<any> => {
  return mockBackendService.getTenantDashboardData(tenantId);
};

export const getManagerDashboardData = (): Promise<any> => {
  return mockBackendService.getManagerDashboardData();
}; 