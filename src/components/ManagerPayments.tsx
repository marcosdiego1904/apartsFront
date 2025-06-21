import React, { useState, useEffect, useCallback } from 'react';
// No necesitamos useAuth aquí si este componente solo es para managers y el enrutamiento ya lo maneja.
// import { useAuth } from '../context/AuthContext'; 
import {
  getAllPaymentHistory,
  getAllCharges,
  updatePaymentStatus,
  assignCharge,
  updateChargeStatus
} from '../services/paymentService';
import type { PaymentRecordProperties as PaymentRecord, ChargeRecord } from '../types';

// The local interfaces are no longer needed.
// interface PaymentRecord { ... }
// interface ChargeRecord { ... }

// Constantes
// const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';
// const LOCAL_STORAGE_CHARGES_HISTORY_KEY = 'tenantChargesHistory';

// Helper para obtener inquilinos únicos de los pagos
interface TenantInfo {
  id: string;
  name: string;
}

const getUniqueTenants = (payments: PaymentRecord[], charges: ChargeRecord[]): TenantInfo[] => {
  const uniqueTenantsMap = new Map<string, string>();
  payments.forEach(payment => {
    if (payment.tenantId && !uniqueTenantsMap.has(payment.tenantId)) {
      uniqueTenantsMap.set(payment.tenantId, payment.tenantName);
    }
  });
  charges.forEach(charge => {
    if (charge.tenantId && !uniqueTenantsMap.has(charge.tenantId)) {
      uniqueTenantsMap.set(charge.tenantId, charge.tenantName);
    }
  });
  return Array.from(uniqueTenantsMap, ([id, name]) => ({ id, name })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const ManagerPayments: React.FC = () => {
  // State for payment and charge history
  const [allPaymentsHistory, setAllPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [allChargesHistory, setAllChargesHistory] = useState<ChargeRecord[]>([]); // Para mostrar cargos asignados

  // Estados para el formulario de asignar cargo
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>(''); // Usar string para el input
  const [chargeConcept, setChargeConcept] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carga general

  const uniqueTenants = getUniqueTenants(allPaymentsHistory, allChargesHistory);

  const displayFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [payments, charges] = await Promise.all([
        getAllPaymentHistory(),
        getAllCharges()
      ]);
      setAllPaymentsHistory(payments);
      setAllChargesHistory(charges);
    } catch (error) {
      console.error("[ManagerPayments] Error fetching data:", error);
      displayFeedback('error', 'Error loading data.');
    } finally {
      setIsLoading(false);
    }
  }, [displayFeedback]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRevertPayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'reverted');
      await fetchAllData(); // Refetch to get the latest state
      displayFeedback('success', 'Payment successfully reverted.');
    } catch (error) {
      console.error("[ManagerPayments] Error reverting payment:", error);
      displayFeedback('error', 'Error reverting payment.');
    }
  };

  const handleReactivatePayment = async (paymentId: string) => {
    if (window.confirm("Are you sure you want to reactivate this payment? It will be marked as 'completed'.")) {
      try {
        await updatePaymentStatus(paymentId, 'completed');
        await fetchAllData();
        displayFeedback('success', 'Payment successfully reactivated to completed.');
      } catch (error) {
        console.error("[ManagerPayments] Error reactivating payment:", error);
        displayFeedback('error', 'Error reactivating payment.');
      }
    }
  };

  const handleAssignCharge = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage(null);

    if (!selectedTenantId || !chargeAmount || !chargeConcept.trim()) {
      displayFeedback('error', "All fields to assign a charge are mandatory.");
      return;
    }

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      displayFeedback('error', "The charge amount must be a positive number.");
      return;
    }

    const tenant = uniqueTenants.find(t => t.id === selectedTenantId);
    if (!tenant) {
      displayFeedback('error', "Invalid tenant selected.");
      return;
    }

    const newCharge: ChargeRecord = {
      id: `charge-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: selectedTenantId,
      tenantName: tenant.name,
      amount,
      concept: chargeConcept.trim(),
      dateAssigned: new Date().toLocaleDateString('en-US'),
      dateAssignedISO: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await assignCharge(newCharge);
      await fetchAllData();
      displayFeedback('success', `Charge assigned to ${tenant.name}.`);
      setSelectedTenantId('');
      setChargeAmount('');
      setChargeConcept('');
    } catch (error) {
      console.error("[ManagerPayments] Error assigning charge:", error);
      displayFeedback('error', "Error saving the charge.");
    }
  };

  const handleDeactivateCharge = async (chargeId: string) => {
    if (window.confirm("Are you sure you want to deactivate this additional charge?")) {
      try {
        await updateChargeStatus(chargeId, 'deactivated');
        await fetchAllData();
        displayFeedback('success', "Additional charge successfully deactivated.");
      } catch (error) {
        console.error("[ManagerPayments] Error deactivating charge:", error);
        displayFeedback('error', "Could not deactivate the charge.");
      }
    }
  };

  const handleReactivateCharge = async (chargeId: string) => {
    if (window.confirm("Are you sure you want to reactivate this additional charge? It will be marked as 'pending'.")) {
      try {
        await updateChargeStatus(chargeId, 'pending');
        await fetchAllData();
        displayFeedback('success', "Additional charge successfully reactivated to pending.");
      } catch (error) {
        console.error("[ManagerPayments] Error reactivating charge:", error);
        displayFeedback('error', "Could not reactivate the charge.");
      }
    }
  };

  const totalRecaudado = allPaymentsHistory.reduce((acc, payment) => 
    payment.status === 'completed' ? acc + payment.amount : acc, 0);
  const totalPendienteDeCargos = allChargesHistory.reduce((acc, charge) => 
    charge.status === 'pending' ? acc + charge.amount : acc, 0);

  if (isLoading) {
    return <div className="loading-container"><p>Loading payment data...</p></div>;
  }

  return (
    <div className="manager-payments-container" style={{ padding: 'var(--spacing-lg)' }}>
      <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Payments and Charges Management</h2>

      {/* Global Feedback Message */}
      {feedbackMessage && (
        <div 
          className={`alert ${feedbackMessage.type === 'success' ? 'alert-success' : 'alert-error'} toast-notification-custom`} 
          role="alert"
          style={{ position: 'fixed', top: 'var(--spacing-lg)', right: 'var(--spacing-lg)', zIndex: 1050, boxShadow: 'var(--shadow-lg)' }}
        >
          {feedbackMessage.text}
          <button 
            onClick={() => setFeedbackMessage(null)} 
            className="modal-close-btn" 
            style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem', marginLeft: '15px' }}
          >&times;</button>
        </div>
      )}

      {/* Summary Section in Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="dashboard-card">
          <div className="card-content">
            <h4>Total Collected (Completed Payments)</h4>
            <p className="text-lg font-semibold">${totalRecaudado.toFixed(2)}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-content">
            <h4>Total Pending (Charges to be Paid)</h4>
            <p className="text-lg font-semibold">${totalPendienteDeCargos.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Form to Assign Additional Charges */}
      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Assign New Additional Charge</h3>
        </div>
        <div className="card-content">
          <form onSubmit={handleAssignCharge} className="form-needs-validation" noValidate>
            <div className="form-grid form-grid-cols-3">
              <div className="form-group">
                <label htmlFor="tenantSelect" className="form-label">Tenant:</label>
                <select 
                  id="tenantSelect" 
                  value={selectedTenantId} 
                  onChange={(e) => setSelectedTenantId(e.target.value)} 
                  className="form-select"
                  required
                >
                  <option value="">Select a tenant</option>
                  {uniqueTenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="chargeAmount" className="form-label">Charge Amount ($):</label>
                <input 
                  type="number" 
                  id="chargeAmount" 
                  value={chargeAmount} 
                  onChange={(e) => setChargeAmount(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g.: 50.00"
                  min="0.01" 
                  step="0.01"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="chargeConcept" className="form-label">Charge Concept:</label>
                <input 
                  type="text" 
                  id="chargeConcept" 
                  value={chargeConcept} 
                  onChange={(e) => setChargeConcept(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g.: Window repair"
                  required 
                />
              </div>
            </div>
            <div className="form-buttons" style={{ marginTop: 'var(--spacing-md)' }}>
              <button type="submit" className="btn btn-primary">Assign Charge</button>
            </div>
          </form>
        </div>
      </div>

      {/* Assigned Charges History Table */}
      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Assigned Charges History</h3>
        </div>
        <div className="card-content">
          {allChargesHistory.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Assigned Date</th>
                    <th>Tenant</th>
                    <th>Concept</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allChargesHistory.sort((a,b) => new Date(b.dateAssignedISO).getTime() - new Date(a.dateAssignedISO).getTime()).map((charge: ChargeRecord) => (
                    <tr key={charge.id}>
                      <td data-label="Assigned Date">{charge.dateAssigned}</td>
                      <td data-label="Tenant">{charge.tenantName}</td>
                      <td data-label="Concept">{charge.concept}</td>
                      <td data-label="Amount">${charge.amount.toFixed(2)}</td>
                      <td data-label="Status">
                        <span className={`badge ${ 
                          charge.status === 'pending' ? 'badge-warning' : 
                          charge.status === 'paid' ? 'badge-success' : 
                          charge.status === 'deactivated' ? 'badge-secondary' : 'badge-light'
                        }`}>
                          {charge.status === 'pending' ? 'Pending' : 
                           charge.status === 'paid' ? 'Paid' : 
                           charge.status === 'deactivated' ? 'Deactivated' : charge.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="table-actions">
                        {charge.status === 'pending' && (
                          <button
                            onClick={() => handleDeactivateCharge(charge.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Deactivate
                          </button>
                        )}
                        {charge.status === 'deactivated' && (
                          <button
                            onClick={() => handleReactivateCharge(charge.id)}
                            className="btn btn-success btn-sm"
                          >
                            Reactivate
                          </button>
                        )}
                        {charge.status === 'paid' && (
                           <span className="text-muted">N/A (Paid)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted" style={{padding: 'var(--spacing-lg)'}}>No additional charges assigned.</p>
          )}
        </div>
      </div>

      {/* All Payments History Table */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">All Payments History</h3>
        </div>
        <div className="card-content">
          {allPaymentsHistory.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tenant</th>
                    <th>Concept</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPaymentsHistory
                    .slice() // Crear una copia superficial para no mutar el estado original
                    .sort((a, b) => {
                      const dateA = new Date(a.id).getTime();
                      const dateB = new Date(b.id).getTime();
                      // Si B no es una fecha válida, A va primero. Si A no es válida, B va primero.
                      if (isNaN(dateB)) return -1;
                      if (isNaN(dateA)) return 1;
                      return dateB - dateA;
                    })
                    .map((payment: PaymentRecord) => (
                    <tr key={payment.id}>
                      <td data-label="Date">{payment.date}</td>
                      <td data-label="Tenant">{payment.tenantName}</td>
                      <td data-label="Concept">{payment.concept}</td>
                      <td data-label="Amount">${payment.amount.toFixed(2)}</td>
                      <td data-label="Status">
                        <span className={`badge ${ 
                          payment.status === 'completed' ? 'badge-success' : 
                          payment.status === 'pending' ? 'badge-warning' : 
                          payment.status === 'failed' ? 'badge-danger' : 
                          payment.status === 'reverted' ? 'badge-info' : 'badge-light'
                        }`}>
                           {payment.status === 'completed' ? 'Completed' : 
                            payment.status === 'pending' ? 'Pending' : 
                            payment.status === 'failed' ? 'Failed' : 
                            payment.status === 'reverted' ? 'Reverted' : payment.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="table-actions">
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => handleRevertPayment(payment.id)}
                            className="btn btn-warning btn-sm"
                          >
                            Revert
                          </button>
                        )}
                        {payment.status === 'reverted' && (
                          <button
                            onClick={() => handleReactivatePayment(payment.id)}
                            className="btn btn-success btn-sm"
                          >
                            Reactivate (to Completed)
                          </button>
                        )}
                         {(payment.status === 'pending' || payment.status === 'failed') && (
                           <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted" style={{padding: 'var(--spacing-lg)'}}>No payments recorded.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ManagerPayments; 