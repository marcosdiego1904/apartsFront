import { MockBackendService } from './MockBackendService';
import type { PaymentRecordProperties, ChargeRecord } from '../types';

const mockBackendService = MockBackendService.getInstance();

export const getPaymentHistory = (tenantId: string): Promise<PaymentRecordProperties[]> => {
  return mockBackendService.getPaymentHistory(tenantId);
};

export const getAllPaymentHistory = (): Promise<PaymentRecordProperties[]> => {
  return mockBackendService.getAllPaymentHistory();
};

export const getCharges = (tenantId: string): Promise<ChargeRecord[]> => {
  return mockBackendService.getCharges(tenantId);
};

export const getAllCharges = (): Promise<ChargeRecord[]> => {
  return mockBackendService.getAllCharges();
};

export const makePayment = (paymentData: any): Promise<void> => {
  return mockBackendService.makePayment(paymentData);
};

export const updatePaymentStatus = (paymentId: string, status: 'completed' | 'reverted'): Promise<void> => {
  return mockBackendService.updatePaymentStatus(paymentId, status);
};

export const assignCharge = (charge: ChargeRecord): Promise<ChargeRecord> => {
  return mockBackendService.assignCharge(charge);
};

export const updateChargeStatus = (chargeId: string, status: 'pending' | 'deactivated'): Promise<void> => {
  return mockBackendService.updateChargeStatus(chargeId, status);
}; 