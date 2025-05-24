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
  status: 'pending' | 'paid';
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

const getUniqueTenants = (payments: PaymentRecord[]): TenantInfo[] => {
  const uniqueTenantsMap = new Map<string, string>();
  payments.forEach(payment => {
    if (!uniqueTenantsMap.has(payment.tenantId)) {
      uniqueTenantsMap.set(payment.tenantId, payment.tenantName);
    }
  });
  return Array.from(uniqueTenantsMap, ([id, name]) => ({ id, name }));
};

const ManagerPayments: React.FC = () => {
  // allPaymentsHistory almacenará TODOS los pagos de localStorage para la vista del manager
  const [allPaymentsHistory, setAllPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [allChargesHistory, setAllChargesHistory] = useState<ChargeRecord[]>([]); // Para mostrar cargos asignados

  // Estados para el formulario de asignar cargo
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>(''); // Usar string para el input
  const [chargeConcept, setChargeConcept] = useState<string>('');
  const [assignChargeMessage, setAssignChargeMessage] = useState<string | null>(null);

  const uniqueTenants = getUniqueTenants(allPaymentsHistory);

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
  };

  const handleAssignCharge = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignChargeMessage(null);

    if (!selectedTenantId || !chargeAmount || !chargeConcept) {
      setAssignChargeMessage("Todos los campos son obligatorios.");
      return;
    }

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      setAssignChargeMessage("El monto debe ser un número positivo.");
      return;
    }

    const tenant = uniqueTenants.find(t => t.id === selectedTenantId);
    if (!tenant) {
      setAssignChargeMessage("Inquilino seleccionado no válido."); // No debería ocurrir si el select está bien poblado
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
      setAssignChargeMessage(`¡Cargo de $${amount.toFixed(2)} por "${chargeConcept}" asignado a ${tenant.name} exitosamente!`);
      // Reset form
      setSelectedTenantId('');
      setChargeAmount('');
      setChargeConcept('');
    } catch (error) {
      console.error("[ManagerPayments-AssignCharge] Error saving charge:", error);
      setAssignChargeMessage("Error al guardar el cargo. Intente de nuevo.");
    }
  };

  const totalRecaudado = allPaymentsHistory.reduce((acc, payment) => 
    payment.status === 'completed' ? acc + payment.amount : acc, 0);

  return (
    <div className="manager-payments-view-container">
      <h2 className="section-title">💳 Gestión de Pagos (Admin)</h2>

      <section className="dashboard-section summary-section" style={{ marginBottom: '2rem'}}>
        <h3 className="section-title" style={{fontSize: '1.2rem'}}>Resumen General</h3>
        <p className="text-secondary"><strong className="text-primary">Total Recaudado (Completado):</strong> 
          <span style={{color: 'var(--accent-success)', fontWeight: 'bold'}}>${totalRecaudado.toFixed(2)}</span>
        </p>
        <p className="text-secondary"><strong className="text-primary">Total de Transacciones Registradas:</strong> {allPaymentsHistory.length}</p>
      </section>

      {/* Sección para Asignar Cargos Adicionales */}
      <section className="dashboard-section assign-charge-section" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <h3 className="section-title" style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.5rem' }}>Asignar Cargo Adicional</h3>
        <form onSubmit={handleAssignCharge} className="assign-charge-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="tenantSelect" className="form-label">Seleccionar Inquilino:</label>
            <select 
              id="tenantSelect" 
              value={selectedTenantId} 
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="form-input"
              required
            >
              <option value="">-- Seleccione un inquilino --</option>
              {uniqueTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name} (ID: {tenant.id})</option>
              ))}
            </select>
          </div>
          <div className="form-grid form-grid-cols-2">
            <div className="form-group">
              <label htmlFor="chargeAmount" className="form-label">Monto del Cargo ($):</label>
              <input 
                type="number" 
                id="chargeAmount" 
                value={chargeAmount} 
                onChange={(e) => setChargeAmount(e.target.value)}
                className="form-input"
                placeholder="Ej: 50.25"
                step="0.01"
                min="0.01"
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
                placeholder="Ej: Reparación ventana"
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Asignar Cargo
          </button>
          {assignChargeMessage && (
            <p style={{ marginTop: '1rem', color: assignChargeMessage.startsWith('Error') ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
              {assignChargeMessage}
            </p>
          )}
        </form>
      </section>
      
      {/* Opcional: Sección para mostrar historial de cargos asignados */}
      <section className="dashboard-section all-charges-history-section" style={{ marginBottom: '2rem'}}>
        <h3 className="section-title" style={{fontSize: '1.2rem'}}>Historial de Cargos Asignados</h3>
        {allChargesHistory.length > 0 ? (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Fecha Asig.</th>
                  <th>Inquilino</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {allChargesHistory.map((charge: ChargeRecord) => (
                  <tr key={charge.id}>
                    <td data-label="Fecha Asig.">{charge.dateAssigned}</td>
                    <td data-label="Inquilino">{charge.tenantName} (ID: {charge.tenantId})</td>
                    <td data-label="Concepto">{charge.concept}</td>
                    <td data-label="Monto">${charge.amount.toFixed(2)}</td>
                    <td data-label="Estado">
                      <span className={`status-badge status-${charge.status === 'pending' ? 'warning' : 'success'}`}>
                        {charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary no-history-message">No hay cargos adicionales asignados.</p>
        )}
      </section>

      <section className="dashboard-section all-payments-history-section">
        <h3 className="section-title" style={{fontSize: '1.2rem'}}>Historial de Todos los Pagos</h3>
        {allPaymentsHistory.length > 0 ? (
          <div className="table-container">
            <table className="users-table">
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
                {allPaymentsHistory.map((payment: PaymentRecord) => (
                  <tr key={payment.id}>
                    <td data-label="Fecha">{payment.date}</td>
                    <td data-label="Inquilino">{payment.tenantName} (ID: {payment.tenantId})</td>
                    <td data-label="Concepto">{payment.concept}</td>
                    <td data-label="Monto">${payment.amount.toFixed(2)}</td>
                    <td data-label="Estado"><span className={`status-badge status-${payment.status}`}>{payment.status}</span></td>
                    <td data-label="Acciones">
                      {payment.status === 'completed' && (
                        <button 
                          onClick={() => handleRevertPayment(payment.id)}
                          className="button button-danger button-small" // Asumiendo que tienes clases para botones de peligro
                          title="Desactivar este pago"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary no-history-message">No hay pagos registrados.</p>
        )}
      </section>
    </div>
  );
};

export default ManagerPayments; 