import React, { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types'; // UserRole no es necesario aquí directamente si solo es para tenant

// Interfaces (duplicadas temporalmente, podrían moverse a un archivo types común si no están ya)
interface PaymentDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

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
const PREDETERMINED_CARD = {
  NUMBER: '1122233',
  EXPIRY_DATE: '12/25',
  CVV: '123',
  HOLDER_NAME: 'Demo User'
};
const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';
const DEFAULT_MONTHLY_AMOUNT = 150.75;
const PAYMENT_DUE_DAY = 15;

// Funciones helper de fecha (duplicadas temporalmente)
const getMonthYearString = (date: Date): string => {
  return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
};

const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getFirstDayOfNextMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

const TenantPayments: React.FC = () => {
  const { user } = useAuth();
  const isInitialMount = useRef(true);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });

  // tenantViewHistory almacenará solo los pagos del inquilino actual para mostrar en la UI
  const [tenantViewHistory, setTenantViewHistory] = useState<PaymentRecord[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(DEFAULT_MONTHLY_AMOUNT);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentPaymentMonth, setCurrentPaymentMonth] = useState<Date>(() => getFirstDayOfMonth(new Date()));

  // Cargar el historial de pagos del inquilino.
  useEffect(() => {
    if (!user) return;
    console.log("[TenantPayments-LoadEffect] Attempting to load payment history for tenant:", user.id);
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    let allPayments: PaymentRecord[] = [];
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          allPayments = parsedHistory;
        } else {
          console.warn("[TenantPayments-LoadEffect] Stored history is not an array.");
        }
      } catch (error) {
        console.error("[TenantPayments-LoadEffect] Failed to parse stored history:", error);
      }
    }
    const tenantSpecificPayments = allPayments.filter(p => p.tenantId === user.id);
    setTenantViewHistory(tenantSpecificPayments);
    console.log("[TenantPayments-LoadEffect] Loaded tenant specific payments:", tenantSpecificPayments);
  }, [user]); // Recargar si el usuario cambia

  // Efecto para manejar el isInitialMount si fuera necesario para el guardado, aunque el guardado es en handleSubmit
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPaymentDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleSubmitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);

    if (!user) {
      setPaymentError("Usuario no autenticado.");
      return;
    }

    if (
      paymentDetails.cardNumber !== PREDETERMINED_CARD.NUMBER ||
      paymentDetails.expiryDate !== PREDETERMINED_CARD.EXPIRY_DATE ||
      paymentDetails.cvv !== PREDETERMINED_CARD.CVV
    ) {
      setPaymentError(
        `Datos de tarjeta incorrectos. Por favor, use: Tarjeta ${PREDETERMINED_CARD.NUMBER}, Vencimiento ${PREDETERMINED_CARD.EXPIRY_DATE}, CVV ${PREDETERMINED_CARD.CVV}`
      );
      return;
    }

    const paymentDate = new Date();
    const newPayment: PaymentRecord = {
      id: paymentDate.toISOString(),
      date: paymentDate.toLocaleDateString('es-ES'),
      amount: DEFAULT_MONTHLY_AMOUNT,
      concept: `Alquiler ${getMonthYearString(currentPaymentMonth)}`,
      status: 'completed',
      tenantId: user.id,
      tenantName: user.username || user.firstName || 'Inquilino Desconocido'
    };

    // Lógica CRUCIAL de guardado: leer todo, añadir, guardar todo
    console.log("[TenantPayments-Save] Attempting to save new payment...");
    let allPayments: PaymentRecord[] = [];
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          allPayments = parsed;
        }
      } catch (e) {
        console.error("[TenantPayments-Save] Error parsing existing history before save:", e);
        // Decidir si continuar con una lista vacía o fallar
      }
    }

    const updatedAllPayments = [newPayment, ...allPayments];
    localStorage.setItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY, JSON.stringify(updatedAllPayments));
    console.log("[TenantPayments-Save] Saved all payments to localStorage:", updatedAllPayments);

    // Actualizar la vista del historial del inquilino
    setTenantViewHistory(prev => [newPayment, ...prev]);
    
    setCurrentPaymentMonth(prevMonth => getFirstDayOfNextMonth(prevMonth));
    setPaymentDetails({ cardNumber: '', cardHolderName: '', expiryDate: '', cvv: '' });
    alert('¡Pago exitoso para ' + newPayment.concept + '!');
  };

  const nextMonthForDisplay = getFirstDayOfNextMonth(currentPaymentMonth);
  const currentPaymentDueDate = new Date(currentPaymentMonth.getFullYear(), currentPaymentMonth.getMonth(), PAYMENT_DUE_DAY);
  const nextPaymentDueDateDisplay = new Date(nextMonthForDisplay.getFullYear(), nextMonthForDisplay.getMonth(), PAYMENT_DUE_DAY);

  return (
    <div className="payments-view-container">
      <h2 className="section-title">💳 Mis Pagos</h2>

      <section className="dashboard-section payment-form-section">
        <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Realizar un Pago</h3>
        <p>
          Saldo pendiente para <strong>Alquiler {getMonthYearString(currentPaymentMonth)}</strong>: 
          <strong style={{ color: 'var(--accent-warning)' }}> ${outstandingBalance.toFixed(2)}</strong>
        </p>
        <p className="text-secondary" style={{fontSize: '0.9em', marginBottom: '1.5rem'}}>
          Fecha de Vencimiento: {currentPaymentDueDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'})}
        </p>
        
        <div 
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-secondary)',
            borderLeft: '5px solid var(--accent-info)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            color: 'var(--text-secondary)'
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', fontSize: '1.1em' }}>
            <span role="img" aria-label="info" style={{ marginRight: '0.75rem', fontSize: '1.3em', color: 'var(--accent-info)' }}>ℹ️</span>
            Utiliza estos datos para el pago de demostración:
          </h4>
          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.95em' }}>
            <li style={{ marginBottom: '0.6rem' }}>
              Número de Tarjeta: 
              <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.3em 0.6em', borderRadius: '4px', color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
                {PREDETERMINED_CARD.NUMBER}
              </code>
            </li>
            <li style={{ marginBottom: '0.6rem' }}>
              Fecha de Expiración (MM/YY): 
              <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.3em 0.6em', borderRadius: '4px', color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
                {PREDETERMINED_CARD.EXPIRY_DATE}
              </code>
            </li>
            <li>
              CVV: 
              <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.3em 0.6em', borderRadius: '4px', color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
                {PREDETERMINED_CARD.CVV}
              </code>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmitPayment} className="payment-form">
          <div className="form-grid form-grid-cols-2">
            <div className="form-group">
              <label htmlFor="cardHolderName" className="form-label">Nombre del Titular:</label>
              <input
                type="text"
                id="cardHolderName"
                name="cardHolderName"
                className="form-input"
                value={paymentDetails.cardHolderName}
                onChange={handleInputChange}
                placeholder={PREDETERMINED_CARD.HOLDER_NAME}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cardNumber" className="form-label">Número de Tarjeta:</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                className="form-input"
                value={paymentDetails.cardNumber}
                onChange={handleInputChange}
                placeholder={PREDETERMINED_CARD.NUMBER}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiryDate" className="form-label">Fecha de Expiración (MM/YY):</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                className="form-input"
                value={paymentDetails.expiryDate}
                onChange={handleInputChange}
                placeholder={PREDETERMINED_CARD.EXPIRY_DATE}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cvv" className="form-label">CVV:</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                className="form-input"
                value={paymentDetails.cvv}
                onChange={handleInputChange}
                placeholder={PREDETERMINED_CARD.CVV}
                required
              />
            </div>
          </div>
          {paymentError && (
            <p className="error-message payment-error" style={{marginTop: '1rem'}}>{paymentError}</p>
          )}
          <button type="submit" className="btn btn-primary pay-submit-btn" style={{ marginTop: '1.5rem' }}>
            Pagar ${outstandingBalance.toFixed(2)}
          </button>
        </form>
      </section>

      <section className="dashboard-section next-payment-info" style={{ marginTop: '2rem'}}>
        <h3 className="section-title" style={{ fontSize: '1.2rem'}}>Próximo Pago Programado</h3>
        <p className="text-secondary"><strong className="text-primary">Concepto:</strong> Alquiler {getMonthYearString(nextMonthForDisplay)}</p>
        <p className="text-secondary"><strong className="text-primary">Monto:</strong> ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)}</p>
        <p className="text-secondary"><strong className="text-primary">Fecha de Vencimiento Estimada:</strong> 
          {nextPaymentDueDateDisplay.toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'})}
        </p>
      </section>

      <section className="dashboard-section payment-history-section" style={{ marginTop: '2rem'}}>
        <h3 className="section-title" style={{ fontSize: '1.2rem' }}>Mi Historial de Pagos</h3>
        {tenantViewHistory.length > 0 ? (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {tenantViewHistory.map((payment: PaymentRecord) => (
                  <tr key={payment.id}>
                    <td data-label="Fecha">{payment.date}</td>
                    <td data-label="Concepto">{payment.concept}</td>
                    <td data-label="Monto">${payment.amount.toFixed(2)}</td>
                    <td data-label="Estado"><span className="status-badge status-completed">{payment.status}</span></td> 
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary no-history-message">Aún no tienes historial de pagos.</p>
        )}
      </section>
    </div>
  );
};

export default TenantPayments; 