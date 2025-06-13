import React, { useState, useEffect, useCallback } from 'react';
// No necesitamos useAuth aquí si este componente solo es para managers y el enrutamiento ya lo maneja.
// import { useAuth } from '../context/AuthContext'; 
import type { User } from '../types'; // UserRole no es necesario aquí directamente

// Interfaces (duplicadas temporalmente)
interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  concept: string;
  status: 'completed' | 'pending' | 'failed' | 'reverted';
  tenantId: string;
  tenantName: string;
}

// Nueva interfaz para Cargos Adicionales
interface ChargeRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  concept: string;
  dateAssigned: string; // Fecha legible
  dateAssignedISO: string; // Fecha ISO para ordenación/procesamiento
  status: 'pending' | 'paid' | 'deactivated';
  paymentId?: string; // ID del pago que saldó este cargo
}

// Constantes (duplicadas temporalmente)
const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';
const LOCAL_STORAGE_CHARGES_HISTORY_KEY = 'tenantChargesHistory';

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
  // allPaymentsHistory almacenará TODOS los pagos de localStorage para la vista del manager
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

  // Cargar todo el historial de pagos y cargos.
  useEffect(() => {
    setIsLoading(true);
    console.log("[ManagerPayments-LoadEffect] Attempting to load all payment history...");
    const storedPaymentHistory = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    if (storedPaymentHistory) {
      try {
        const parsedHistory = JSON.parse(storedPaymentHistory);
        if (Array.isArray(parsedHistory)) {
          setAllPaymentsHistory(parsedHistory);
          console.log("[ManagerPayments-LoadEffect] Successfully loaded all payments:", parsedHistory);
        } else {
          console.warn("[ManagerPayments-LoadEffect] Stored payment history is not an array.");
          setAllPaymentsHistory([]);
        }
      } catch (error) {
        console.error("[ManagerPayments-LoadEffect] Failed to parse stored payment history:", error);
        setAllPaymentsHistory([]);
        displayFeedback('error', 'Error al cargar el historial de pagos.');
      }
    } else {
        console.log("[ManagerPayments-LoadEffect] No payment history found in localStorage.");
        setAllPaymentsHistory([]);
    }

    console.log("[ManagerPayments-LoadEffect] Attempting to load all charges history...");
    const storedChargesHistory = localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY);
    if (storedChargesHistory) {
      try {
        const parsedCharges = JSON.parse(storedChargesHistory);
        if (Array.isArray(parsedCharges)) {
          setAllChargesHistory(parsedCharges);
          console.log("[ManagerPayments-LoadEffect] Successfully loaded all charges:", parsedCharges);
        } else {
          console.warn("[ManagerPayments-LoadEffect] Stored charges history is not an array.");
          setAllChargesHistory([]);
        }
      } catch (error) {
        console.error("[ManagerPayments-LoadEffect] Failed to parse stored charges history:", error);
        setAllChargesHistory([]);
        displayFeedback('error', 'Error al cargar el historial de cargos.');
      }
    } else {
      console.log("[ManagerPayments-LoadEffect] No charges history found in localStorage.");
      setAllChargesHistory([]);
    }
    setIsLoading(false);
  }, [displayFeedback]);

  const handleRevertPayment = (paymentId: string) => {
    console.log(`[ManagerPayments] Attempting to revert payment with id: ${paymentId}`);
    const updatedHistory = allPaymentsHistory.map(payment => {
      if (payment.id === paymentId) {
        console.log(`[ManagerPayments] Payment found: ${payment.id}, current status: ${payment.status}. Changing to reverted.`);
        return { ...payment, status: 'reverted' as 'reverted' };
      }
      return payment;
    });
    setAllPaymentsHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log("[ManagerPayments] Payment history updated in state and localStorage after reverting.");
    displayFeedback('success', 'Pago revertido exitosamente.');
  };

  const handleReactivatePayment = (paymentId: string) => {
    if (window.confirm("¿Está seguro de que desea reactivar este pago? Se marcará como 'completado'.")) {
      console.log(`[ManagerPayments] Attempting to reactivate payment with id: ${paymentId}`);
      const updatedHistory = allPaymentsHistory.map(payment => {
        if (payment.id === paymentId && payment.status === 'reverted') {
          console.log(`[ManagerPayments] Payment found: ${payment.id}, current status: ${payment.status}. Changing to completed.`);
          return { ...payment, status: 'completed' as 'completed' };
        }
        return payment;
      });
      if (JSON.stringify(updatedHistory) !== JSON.stringify(allPaymentsHistory)) {
        setAllPaymentsHistory(updatedHistory);
        localStorage.setItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY, JSON.stringify(updatedHistory));
        console.log("[ManagerPayments] Payment history updated in state and localStorage after reactivating a payment.");
        displayFeedback('success', 'Pago reactivado a completado exitosamente.');
      } else {
        console.log("[ManagerPayments] No payment was reactivated (either not found or not in 'reverted' state).");
      }
    }
  };

  const handleAssignCharge = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage(null);

    if (!selectedTenantId || !chargeAmount || !chargeConcept.trim()) {
      displayFeedback('error', "Todos los campos para asignar cargo son obligatorios.");
      return;
    }

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      displayFeedback('error', "El monto del cargo debe ser un número positivo.");
      return;
    }

    const tenant = uniqueTenants.find(t => t.id === selectedTenantId);
    if (!tenant) {
      displayFeedback('error', "Inquilino seleccionado no válido.");
      return;
    }

    const currentDate = new Date();
    const newCharge: ChargeRecord = {
      id: `charge-${currentDate.toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: selectedTenantId,
      tenantName: tenant.name,
      amount,
      concept: chargeConcept.trim(),
      dateAssigned: currentDate.toLocaleDateString('es-ES'),
      dateAssignedISO: currentDate.toISOString(),
      status: 'pending',
    };

    try {
      const currentCharges = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY) || '[]') as ChargeRecord[];
      const updatedCharges = [newCharge, ...currentCharges];
      localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(updatedCharges));
      setAllChargesHistory(updatedCharges);
      displayFeedback('success', `Cargo de $${amount.toFixed(2)} por "${chargeConcept}" asignado a ${tenant.name}.`);
      setSelectedTenantId('');
      setChargeAmount('');
      setChargeConcept('');
    } catch (error) {
      console.error("[ManagerPayments-AssignCharge] Error saving charge:", error);
      displayFeedback('error', "Error al guardar el cargo. Intente de nuevo.");
    }
  };

  const handleDeactivateCharge = (chargeId: string) => {
    if (window.confirm("¿Está seguro de que desea desactivar este cargo adicional?")) {
      console.log(`[ManagerPayments] Attempting to deactivate charge with id: ${chargeId}`);
      const updatedCharges = allChargesHistory.map(charge => {
        if (charge.id === chargeId && charge.status === 'pending') {
          console.log(`[ManagerPayments] Charge found: ${charge.id}, current status: ${charge.status}. Changing to deactivated.`);
          return { ...charge, status: 'deactivated' as 'deactivated' };
        }
        return charge;
      });

      if (JSON.stringify(updatedCharges) !== JSON.stringify(allChargesHistory)) {
        setAllChargesHistory(updatedCharges);
        localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(updatedCharges));
        console.log("[ManagerPayments] Charges history updated in state and localStorage after deactivating a charge.");
        displayFeedback('success', "Cargo adicional desactivado exitosamente.");
      } else {
        console.log("[ManagerPayments] No charge was deactivated (either not found or not in 'pending' state).");
        displayFeedback('error', "No se pudo desactivar el cargo (ya está pagado o no se encontró).");
      }
    }
  };

  const handleReactivateCharge = (chargeId: string) => {
    if (window.confirm("¿Está seguro de que desea reactivar este cargo adicional? Se marcará como 'pendiente'.")) {
      console.log(`[ManagerPayments] Attempting to reactivate charge with id: ${chargeId}`);
      const updatedCharges = allChargesHistory.map(charge => {
        if (charge.id === chargeId && charge.status === 'deactivated') {
          console.log(`[ManagerPayments] Charge found: ${charge.id}, current status: ${charge.status}. Changing to pending.`);
          return { ...charge, status: 'pending' as 'pending' };
        }
        return charge;
      });

      if (JSON.stringify(updatedCharges) !== JSON.stringify(allChargesHistory)) {
        setAllChargesHistory(updatedCharges);
        localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(updatedCharges));
        console.log("[ManagerPayments] Charges history updated in state and localStorage after reactivating a charge.");
        displayFeedback('success', "Cargo adicional reactivado a pendiente exitosamente.");
      } else {
        console.log("[ManagerPayments] No charge was reactivated (either not found or not in 'deactivated' state).");
        displayFeedback('error', "No se pudo reactivar el cargo (ya está pagado, pendiente o no se encontró).");
      }
    }
  };

  const totalRecaudado = allPaymentsHistory.reduce((acc, payment) => 
    payment.status === 'completed' ? acc + payment.amount : acc, 0);
  const totalPendienteDeCargos = allChargesHistory.reduce((acc, charge) => 
    charge.status === 'pending' ? acc + charge.amount : acc, 0);

  if (isLoading) {
    return <div className="loading-container"><p>Cargando datos de pagos...</p></div>;
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary, #13131a)',
    padding: '1.5rem 2rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-secondary, #3f3f46)',
    boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.4))',
    marginBottom: '2rem',
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    color: 'var(--text-primary)',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-secondary, #3f3f46)',
    paddingBottom: '0.75rem',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-tertiary, #1a1a24)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-secondary, #3f3f46)',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
  };
  
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };

  return (
    <div className="manager-payments-container" style={{ padding: 'var(--spacing-lg)' }}>
      <h2 className="page-title">Gestión de Pagos y Cargos</h2>

      {/* Mensaje de Feedback Global */}
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

      {/* Sección de Sumarios en Tarjetas */}
      <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="dashboard-card">
          <div className="card-content">
            <h4>Total Recaudado (Pagos Completados)</h4>
            <p className="text-lg font-semibold">${totalRecaudado.toFixed(2)}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-content">
            <h4>Total Pendiente (Cargos por Pagar)</h4>
            <p className="text-lg font-semibold">${totalPendienteDeCargos.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Formulario para Asignar Cargos Adicionales */}
      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Asignar Nuevo Cargo Adicional</h3>
        </div>
        <div className="card-content">
          <form onSubmit={handleAssignCharge} className="form-needs-validation" noValidate>
            <div className="form-grid form-grid-cols-3">
              <div className="form-group">
                <label htmlFor="tenantSelect" className="form-label">Inquilino:</label>
                <select 
                  id="tenantSelect" 
                  value={selectedTenantId} 
                  onChange={(e) => setSelectedTenantId(e.target.value)} 
                  className="form-select"
                  required
                >
                  <option value="">Seleccione un inquilino</option>
                  {uniqueTenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="chargeAmount" className="form-label">Monto del Cargo ($):</label>
                <input 
                  type="number" 
                  id="chargeAmount" 
                  value={chargeAmount} 
                  onChange={(e) => setChargeAmount(e.target.value)} 
                  className="form-input" 
                  placeholder="Ej: 50.00"
                  min="0.01" 
                  step="0.01"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="chargeConcept" className="form-label">Concepto del Cargo:</label>
                <input 
                  type="text" 
                  id="chargeConcept" 
                  value={chargeConcept} 
                  onChange={(e) => setChargeConcept(e.target.value)} 
                  className="form-input" 
                  placeholder="Ej: Reparación de ventana"
                  required 
                />
              </div>
            </div>
            <div className="form-buttons" style={{ marginTop: 'var(--spacing-md)' }}>
              <button type="submit" className="btn btn-primary">Asignar Cargo</button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Historial de Cargos Asignados */}
      <div className="dashboard-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Historial de Cargos Asignados</h3>
        </div>
        <div className="card-content">
          {allChargesHistory.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha Asig.</th>
                    <th>Inquilino</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allChargesHistory.sort((a,b) => new Date(b.dateAssignedISO).getTime() - new Date(a.dateAssignedISO).getTime()).map((charge: ChargeRecord) => (
                    <tr key={charge.id}>
                      <td data-label="Fecha Asig.">{charge.dateAssigned}</td>
                      <td data-label="Inquilino">{charge.tenantName}</td>
                      <td data-label="Concepto">{charge.concept}</td>
                      <td data-label="Monto">${charge.amount.toFixed(2)}</td>
                      <td data-label="Estado">
                        <span className={`badge ${ 
                          charge.status === 'pending' ? 'badge-warning' : 
                          charge.status === 'paid' ? 'badge-success' : 
                          charge.status === 'deactivated' ? 'badge-secondary' : 'badge-light'
                        }`}>
                          {charge.status === 'pending' ? 'Pendiente' : 
                           charge.status === 'paid' ? 'Pagado' : 
                           charge.status === 'deactivated' ? 'Desactivado' : charge.status}
                        </span>
                      </td>
                      <td data-label="Acciones" className="table-actions">
                        {charge.status === 'pending' && (
                          <button
                            onClick={() => handleDeactivateCharge(charge.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Desactivar
                          </button>
                        )}
                        {charge.status === 'deactivated' && (
                          <button
                            onClick={() => handleReactivateCharge(charge.id)}
                            className="btn btn-success btn-sm"
                          >
                            Reactivar
                          </button>
                        )}
                        {charge.status === 'paid' && (
                           <span className="text-muted">N/A (Pagado)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted" style={{padding: 'var(--spacing-lg)'}}>No hay cargos adicionales asignados.</p>
          )}
        </div>
      </div>

      {/* Tabla de Historial de Todos los Pagos */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Historial de Todos los Pagos</h3>
        </div>
        <div className="card-content">
          {allPaymentsHistory.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Inquilino</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
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
                      <td data-label="Fecha">{payment.date}</td>
                      <td data-label="Inquilino">{payment.tenantName}</td>
                      <td data-label="Concepto">{payment.concept}</td>
                      <td data-label="Monto">${payment.amount.toFixed(2)}</td>
                      <td data-label="Estado">
                        <span className={`badge ${ 
                          payment.status === 'completed' ? 'badge-success' : 
                          payment.status === 'pending' ? 'badge-warning' : 
                          payment.status === 'failed' ? 'badge-danger' : 
                          payment.status === 'reverted' ? 'badge-info' : 'badge-light'
                        }`}>
                           {payment.status === 'completed' ? 'Completado' : 
                            payment.status === 'pending' ? 'Pendiente' : 
                            payment.status === 'failed' ? 'Fallido' : 
                            payment.status === 'reverted' ? 'Revertido' : payment.status}
                        </span>
                      </td>
                      <td data-label="Acciones" className="table-actions">
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => handleRevertPayment(payment.id)}
                            className="btn btn-warning btn-sm"
                          >
                            Revertir
                          </button>
                        )}
                        {payment.status === 'reverted' && (
                          <button
                            onClick={() => handleReactivatePayment(payment.id)}
                            className="btn btn-success btn-sm"
                          >
                            Reactivar (a Completado)
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
            <p className="text-center text-muted" style={{padding: 'var(--spacing-lg)'}}>No hay pagos registrados.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ManagerPayments; 