import React, { useState, useEffect } from 'react';
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
    if (!uniqueTenantsMap.has(payment.tenantId)) {
      uniqueTenantsMap.set(payment.tenantId, payment.tenantName);
    }
  });
  charges.forEach(charge => {
    if (!uniqueTenantsMap.has(charge.tenantId)) {
      uniqueTenantsMap.set(charge.tenantId, charge.tenantName);
    }
  });
  return Array.from(uniqueTenantsMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
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

  const uniqueTenants = getUniqueTenants(allPaymentsHistory, allChargesHistory);

  // Cargar todo el historial de pagos y cargos.
  useEffect(() => {
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
      }
    } else {
      console.log("[ManagerPayments-LoadEffect] No charges history found in localStorage.");
      setAllChargesHistory([]);
    }
  }, []);

  const displayFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

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

    if (!selectedTenantId || !chargeAmount || !chargeConcept) {
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
      id: `charge-${currentDate.toISOString()}-${Math.random().toString(36).substr(2, 9)}`, // ID más único
      tenantId: selectedTenantId,
      tenantName: tenant.name,
      amount,
      concept: chargeConcept,
      dateAssigned: currentDate.toLocaleDateString('es-ES'),
      dateAssignedISO: currentDate.toISOString(),
      status: 'pending',
    };

    try {
      const currentCharges = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY) || '[]') as ChargeRecord[];
      const updatedCharges = [newCharge, ...currentCharges];
      localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(updatedCharges));
      setAllChargesHistory(updatedCharges); // Actualizar estado para UI si mostramos tabla de cargos
      displayFeedback('success', `Cargo de $${amount.toFixed(2)} por "${chargeConcept}" asignado a ${tenant.name}.`);
      // Reset form
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

      // Check if any charge was actually updated to avoid unnecessary localStorage write
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
    <div className="manager-payments-view-container" style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '2.5rem', fontSize: '1.8rem' }}>
        🛡️ Gestión de Pagos (Admin)
      </h2>

      {feedbackMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          backgroundColor: feedbackMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          textAlign: 'center',
          minWidth: '300px',
        }}>
          {feedbackMessage.text}
        </div>
      )}

      {/* Card 1: Summary */}
      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Resumen General</h3>
        <p style={{color: 'var(--text-secondary)'}}><strong style={{color: 'var(--text-primary)'}}>Total Recaudado (Pagos Completados):</strong>
          <span style={{color: 'var(--accent-success)', fontWeight: 'bold', marginLeft: '0.5rem'}}>${totalRecaudado.toFixed(2)}</span>
        </p>
        <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}><strong style={{color: 'var(--text-primary)'}}>Total de Transacciones de Pago Registradas:</strong> {allPaymentsHistory.length}</p>
        <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}><strong style={{color: 'var(--text-primary)'}}>Total de Cargos Adicionales Registrados:</strong> {allChargesHistory.length}</p>
      </section>

      {/* Card 2: Assign Charge */}
      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Asignar Cargo Adicional</h3>
        <form onSubmit={handleAssignCharge} className="assign-charge-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="tenantSelect" style={labelStyle}>Seleccionar Inquilino:</label>
            <select
              id="tenantSelect"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="form-input" // Keep existing class for potential global styles
              style={inputStyle} // Apply dark theme specific styles
              required
            >
              <option value="" style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)'}}>-- Seleccione un inquilino --</option>
              {uniqueTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id} style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)'}}>
                  {tenant.name} (ID: {tenant.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid form-grid-cols-2" style={{gap: '1rem'}}>
            <div className="form-group">
              <label htmlFor="chargeAmount" style={labelStyle}>Monto del Cargo ($):</label>
              <input
                type="number"
                id="chargeAmount"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                className="form-input"
                style={inputStyle}
                placeholder="Ej: 50.25"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="chargeConcept" style={labelStyle}>Concepto del Cargo:</label>
              <input
                type="text"
                id="chargeConcept"
                value={chargeConcept}
                onChange={(e) => setChargeConcept(e.target.value)}
                className="form-input"
                style={inputStyle}
                placeholder="Ej: Reparación ventana"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', backgroundColor: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
            Asignar Cargo
          </button>
        </form>
      </section>

      {/* Card 3: Assigned Charges History */}
      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Historial de Cargos Asignados</h3>
        {allChargesHistory.length > 0 ? (
          <div className="table-container">
            <table className="users-table" style={{borderColor: 'var(--border-secondary)'}}>
              <thead>
                <tr>
                  <th style={{color: 'var(--text-secondary)'}}>Fecha Asig.</th>
                  <th style={{color: 'var(--text-secondary)'}}>Inquilino</th>
                  <th style={{color: 'var(--text-secondary)'}}>Concepto</th>
                  <th style={{color: 'var(--text-secondary)'}}>Monto</th>
                  <th style={{color: 'var(--text-secondary)'}}>Estado</th>
                  <th style={{color: 'var(--text-secondary)'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allChargesHistory.sort((a,b) => new Date(b.dateAssignedISO).getTime() - new Date(a.dateAssignedISO).getTime()).map((charge: ChargeRecord) => (
                  <tr key={charge.id}>
                    <td data-label="Fecha Asig." style={{color: 'var(--text-primary)'}}>{charge.dateAssigned}</td>
                    <td data-label="Inquilino" style={{color: 'var(--text-primary)'}}>{charge.tenantName} (ID: {charge.tenantId})</td>
                    <td data-label="Concepto" style={{color: 'var(--text-primary)'}}>{charge.concept}</td>
                    <td data-label="Monto" style={{color: 'var(--text-primary)'}}>${charge.amount.toFixed(2)}</td>
                    <td data-label="Estado">
                      <span className={`status-badge status-${
                        charge.status === 'pending' ? 'warning' : 
                        charge.status === 'paid' ? 'success' : 
                        charge.status === 'deactivated' ? 'neutral' : 'default' // Added 'neutral' & 'default'
                      }`}>
                        {charge.status}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      {charge.status === 'pending' && (
                        <button
                          onClick={() => handleDeactivateCharge(charge.id)}
                          className="btn btn-danger btn-small"
                          style={{fontSize: '0.8em', padding: '0.3em 0.6em', marginRight: '5px'}}
                        >
                          Desactivar
                        </button>
                      )}
                      {charge.status === 'deactivated' && (
                        <button
                          onClick={() => handleReactivateCharge(charge.id)}
                          className="btn btn-success btn-small" 
                          style={{fontSize: '0.8em', padding: '0.3em 0.6em'}}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>No hay cargos adicionales asignados.</p>
        )}
      </section>

      {/* Card 4: All Payments History */}
      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Historial de Todos los Pagos</h3>
        {allPaymentsHistory.length > 0 ? (
          <div className="table-container">
            <table className="users-table" style={{borderColor: 'var(--border-secondary)'}}>
              <thead>
                <tr>
                  <th style={{color: 'var(--text-secondary)'}}>Fecha</th>
                  <th style={{color: 'var(--text-secondary)'}}>Inquilino</th>
                  <th style={{color: 'var(--text-secondary)'}}>Concepto</th>
                  <th style={{color: 'var(--text-secondary)'}}>Monto</th>
                  <th style={{color: 'var(--text-secondary)'}}>Estado</th>
                  <th style={{color: 'var(--text-secondary)'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allPaymentsHistory.sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime()).map((payment: PaymentRecord) => (
                  <tr key={payment.id}>
                    <td data-label="Fecha" style={{color: 'var(--text-primary)'}}>{payment.date}</td>
                    <td data-label="Inquilino" style={{color: 'var(--text-primary)'}}>{payment.tenantName} (ID: {payment.tenantId})</td>
                    <td data-label="Concepto" style={{color: 'var(--text-primary)'}}>{payment.concept}</td>
                    <td data-label="Monto" style={{color: 'var(--text-primary)'}}>${payment.amount.toFixed(2)}</td>
                    <td data-label="Estado"><span className={`status-badge status-${payment.status}`}>{payment.status}</span></td>
                    <td data-label="Acciones">
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleRevertPayment(payment.id)}
                          className="btn btn-danger btn-small"
                          style={{fontSize: '0.8em', padding: '0.3em 0.6em', marginRight: '5px'}}
                        >
                          Revertir
                        </button>
                      )}
                      {payment.status === 'reverted' && (
                        <button
                          onClick={() => handleReactivatePayment(payment.id)}
                          className="btn btn-success btn-small"
                          style={{fontSize: '0.8em', padding: '0.3em 0.6em'}}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>No hay pagos registrados.</p>
        )}
      </section>
    </div>
  );
};

export default ManagerPayments; 