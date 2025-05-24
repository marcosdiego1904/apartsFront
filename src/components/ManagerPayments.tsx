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

// Constantes (duplicadas temporalmente)
const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';

const ManagerPayments: React.FC = () => {
  // allPaymentsHistory almacenará TODOS los pagos de localStorage para la vista del manager
  const [allPaymentsHistory, setAllPaymentsHistory] = useState<PaymentRecord[]>([]);

  // Cargar todo el historial de pagos.
  useEffect(() => {
    console.log("[ManagerPayments-LoadEffect] Attempting to load all payment history...");
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setAllPaymentsHistory(parsedHistory);
          console.log("[ManagerPayments-LoadEffect] Successfully loaded all payments:", parsedHistory);
        } else {
          console.warn("[ManagerPayments-LoadEffect] Stored history is not an array.");
          setAllPaymentsHistory([]);
        }
      } catch (error) {
        console.error("[ManagerPayments-LoadEffect] Failed to parse stored history:", error);
        setAllPaymentsHistory([]);
      }
    } else {
        console.log("[ManagerPayments-LoadEffect] No payment history found in localStorage.");
        setAllPaymentsHistory([]);
    }
    // No necesita dependencias si solo carga al montar. 
    // Si quisiéramos que se actualice si otro admin hace un cambio en otra pestaña, necesitaríamos un listener de storage o similar.
  }, []);

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