import React, { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User, PaymentRecordProperties, ChargeRecord, PaymentDetails } from '../types'; // Importar los tipos centralizados
import { getMonthYearString, getFirstDayOfMonth, getFirstDayOfNextMonth, getSortableDateFromConcept, determineNextPayableMonth } from '../utils/dateUtils';

// Constantes
const PREDETERMINED_CARD = {
  NUMBER: '1122233',
  EXPIRY_DATE: '12/25',
  CVV: '123',
  HOLDER_NAME: 'Demo User'
};
const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'tenantPaymentHistory';
const LOCAL_STORAGE_CHARGES_HISTORY_KEY = 'tenantChargesHistory'; // Nueva constante
const DEFAULT_MONTHLY_AMOUNT = 150.75;
const PAYMENT_DUE_DAY = 15;

interface TenantPaymentsProps {
  onPaymentSuccess?: () => void;
}

const TenantPayments: React.FC<TenantPaymentsProps> = ({ onPaymentSuccess }) => {
  const { user } = useAuth();
  const isInitialMount = useRef(true);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });

  const [tenantViewHistory, setTenantViewHistory] = useState<PaymentRecordProperties[]>([]);
  const [tenantCharges, setTenantCharges] = useState<ChargeRecord[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [totalAmountToPay, setTotalAmountToPay] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentPaymentMonth, setCurrentPaymentMonth] = useState<Date | null>(() => getFirstDayOfMonth(new Date()));
  const [urgentPaymentContext, setUrgentPaymentContext] = useState<{ message: string; concept: string; isReverted: boolean } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  // Cargar historial de pagos y cargos, determinar mes de pago.
  useEffect(() => {
    if (!user) return;
    console.log("[TenantPayments-LoadEffect] Attempting to load payment history for tenant:", user.id);
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    let allPayments: PaymentRecordProperties[] = [];
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
    const tenantSpecificPaymentsUnsorted = allPayments.filter(p => p.tenantId === user.id);
    
    const tenantSpecificPayments = [...tenantSpecificPaymentsUnsorted].sort((a, b) => {
      const dateA = getSortableDateFromConcept(a.concept);
      const dateB = getSortableDateFromConcept(b.concept);

      if (dateA && dateB) {
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB.getTime() - dateA.getTime(); 
        }
        try {
            const originalDateA = new Date(a.id).getTime();
            const originalDateB = new Date(b.id).getTime();
            if (!isNaN(originalDateA) && !isNaN(originalDateB)) {
                return originalDateB - originalDateA; 
            }
        } catch (e) { /* no-op */ }
      }
      return 0; 
    });

    setTenantViewHistory(tenantSpecificPayments);
    console.log("[TenantPayments-LoadEffect] Loaded and sorted tenant specific payments:", tenantSpecificPayments);

    let baseDateForSearchLogic: Date | null = getFirstDayOfMonth(new Date()); 
    if (tenantSpecificPayments.length > 0) {
      const earliestPaymentTimestamp = Math.min(
        ...tenantSpecificPayments.map(p => {
          const dateFromId = new Date(p.id);
          return !isNaN(dateFromId.getTime()) ? dateFromId.getTime() : Infinity;
        })
      );
      if (earliestPaymentTimestamp !== Infinity && earliestPaymentTimestamp > 0) { 
        baseDateForSearchLogic = getFirstDayOfMonth(new Date(earliestPaymentTimestamp));
      }
    }

    const nextPayableMonth = determineNextPayableMonth(tenantSpecificPayments, baseDateForSearchLogic);
    setCurrentPaymentMonth(nextPayableMonth);

    if (nextPayableMonth) {
      const conceptOfNextPayableMonth = `Alquiler ${getMonthYearString(nextPayableMonth)}`;
      const revertedPayment = tenantSpecificPayments.find(
        p => p.concept === conceptOfNextPayableMonth && p.status === 'reverted' && p.tenantId === user.id
      );
      if (revertedPayment) {
        setUrgentPaymentContext({
          message: `Atención: El pago para ${revertedPayment.concept} fue revertido. Por favor, realiza el pago nuevamente.`,
          concept: revertedPayment.concept,
          isReverted: true,
        });
      } else {
        setUrgentPaymentContext(null);
      }
    } else {
      setUrgentPaymentContext(null); // No hay mes de alquiler pagable
    }
    
    const storedChargesHistory = localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY);
    let allCharges: ChargeRecord[] = [];
    if (storedChargesHistory) {
      try {
        allCharges = JSON.parse(storedChargesHistory);
        if (!Array.isArray(allCharges)) allCharges = [];
      } catch (e) { allCharges = []; }
    }
    const currentTenantCharges = allCharges.filter(c => c.tenantId === user.id);
    setTenantCharges(currentTenantCharges);

  }, [user]); 

  // Efecto para recalcular totalAmountToPay
  useEffect(() => {
    if (!user) return;

    let amount = 0;
    let isAlquilerDue = false;
    if (currentPaymentMonth) {
        isAlquilerDue = !tenantViewHistory.find(p => p.concept === `Alquiler ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed');
    }

    if (isAlquilerDue) {
      amount += DEFAULT_MONTHLY_AMOUNT;
    }
    
    const selectedChargesObjects = tenantCharges.filter(c => selectedCharges.includes(c.id) && c.status === 'pending');
    const totalSelectedChargesAmount = selectedChargesObjects.reduce((sum, charge) => sum + charge.amount, 0);
    
    amount += totalSelectedChargesAmount;
    setTotalAmountToPay(amount);

    // Mostrar el formulario de pago si hay algo que pagar (alquiler o cargos seleccionados)
    setShowPaymentForm(isAlquilerDue || selectedChargesObjects.length > 0);

  }, [currentPaymentMonth, tenantCharges, selectedCharges, user, tenantViewHistory]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      // Remove non-digits, allow spaces for formatting if desired (currently just strips non-digits)
      // Limit to 19 characters (e.g., 16 digits + 3 spaces)
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 16);
      // Optional: Add spaces for readability e.g. XXXX XXXX XXXX XXXX
      // formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 19);
    } else if (name === 'expiryDate') {
      // MM/YY format
      formattedValue = value.replace(/[^0-9]/g, '');
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      } else if (value.length === 3 && value.includes('/')) { // Handle backspace from MM/Y to MM
         formattedValue = value.slice(0,2);
      }
      formattedValue = formattedValue.slice(0, 5); // MM/YY
    } else if (name === 'cvv') {
      // Limit to 3 or 4 digits
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    }

    setPaymentDetails((prevDetails: PaymentDetails) => ({ ...prevDetails, [name]: formattedValue }));
  };

  const handleChargeSelectionChange = (chargeId: string) => {
    setSelectedCharges(prevSelected => {
      if (prevSelected.includes(chargeId)) {
        return prevSelected.filter(id => id !== chargeId);
      } else {
        return [...prevSelected, chargeId];
      }
    });
  };

  const handleSubmitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);
    setUrgentPaymentContext(null); // Limpiar contexto de urgencia al intentar un pago

    if (!user) {
      setPaymentError("Error: Usuario no autenticado.");
      return;
    }

    if (totalAmountToPay <= 0) {
      setPaymentError("No hay monto seleccionado para pagar.");
      return;
    }

    // Simulación de validación y procesamiento de pago
    if (
      paymentDetails.cardNumber === PREDETERMINED_CARD.NUMBER &&
      paymentDetails.expiryDate === PREDETERMINED_CARD.EXPIRY_DATE &&
      paymentDetails.cvv === PREDETERMINED_CARD.CVV &&
      paymentDetails.cardHolderName.trim() === PREDETERMINED_CARD.HOLDER_NAME
    ) {
      const paymentId = new Date().toISOString(); // ID único para este pago general
      const paymentDate = new Date().toLocaleDateString('es-ES');
      let paymentConcept = "";
      let rentalPaidThisTransaction = false;

      // Determinar si el alquiler se está pagando en esta transacción
      let isAlquilerCurrentlyDue = false;
      if (currentPaymentMonth) {
        isAlquilerCurrentlyDue = !tenantViewHistory.find(p => p.concept === `Alquiler ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed');
      }

      if (currentPaymentMonth && isAlquilerCurrentlyDue && (totalAmountToPay >= DEFAULT_MONTHLY_AMOUNT || selectedCharges.length === 0) ) {
        // Consideramos que el alquiler se paga si está vencido y el monto total es suficiente o no hay cargos seleccionados (implicando que se paga solo alquiler)
        paymentConcept += `Alquiler ${getMonthYearString(currentPaymentMonth)}`;
        rentalPaidThisTransaction = true;
      }
      
      const paidChargesDetails: string[] = [];
      const updatedCharges = tenantCharges.map(charge => {
        if (selectedCharges.includes(charge.id) && charge.status === 'pending') {
          paidChargesDetails.push(`${charge.concept} ($${charge.amount.toFixed(2)})`);
          return { ...charge, status: 'paid' as 'paid', paymentId: paymentId };
        }
        return charge;
      });

      if (paidChargesDetails.length > 0) {
        if (paymentConcept !== "") {
          paymentConcept += " + ";
        }
        paymentConcept += `Cargos (${paidChargesDetails.join(', ')})`;
      }
      
      if (!paymentConcept) {
         if (paidChargesDetails.length > 0) paymentConcept = "Pago de Cargos Adicionales";
         else {
            setPaymentError("Error al determinar el concepto del pago.");
            return;
         }
      }

      const newPaymentRecord: PaymentRecordProperties = {
        id: paymentId,
        date: paymentDate,
        amount: totalAmountToPay,
        concept: paymentConcept,
        status: 'completed',
        tenantId: user.id,
        tenantName: user.firstName || user.username || 'Inquilino',
      };

      // Actualizar historial de pagos
      const updatedHistory = [newPaymentRecord, ...tenantViewHistory];
      localStorage.setItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY, JSON.stringify(updatedHistory));
      setTenantViewHistory(updatedHistory);

      // Actualizar historial de cargos
      const updatedChargesFromStorage: ChargeRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY) || '[]');
      const otherTenantCharges = updatedChargesFromStorage.filter(c => c.tenantId !== user.id);
      const finalCharges = [...otherTenantCharges, ...updatedCharges.filter(c => c.tenantId === user.id)];
      localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(finalCharges));
      
      setTenantCharges(updatedCharges); // Actualizar estado local de cargos
      setSelectedCharges([]); // Limpiar selección

      // Resetear formulario y recalcular mes de pago si el alquiler fue pagado
      setPaymentDetails({ cardNumber: '', cardHolderName: '', expiryDate: '', cvv: '' });
      
      if (rentalPaidThisTransaction && currentPaymentMonth) {
        const nextPayable = determineNextPayableMonth(updatedHistory, getFirstDayOfNextMonth(currentPaymentMonth));
        setCurrentPaymentMonth(nextPayable);
        setUrgentPaymentContext(null); // Limpiar contexto urgente
      }
      // Si no se pagó alquiler, pero sí cargos, currentPaymentMonth no cambia.
      // El totalAmountToPay se recalculará via useEffect.

      alert('Pago realizado con éxito!');

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } else {
      setPaymentError('Los detalles de la tarjeta son incorrectos. Por favor, usa los datos de demostración proporcionados e intenta de nuevo.');
    }
  };

  // Variables para el JSX, con manejo de nulabilidad para currentPaymentMonth
  let displayCurrentPaymentMonthStr: string | null = null;
  let displayCurrentPaymentDueDateStr: string | null = null;
  let displayNextScheduledPaymentMonthStr: string;
  let displayNextScheduledPaymentDueDateStr: string;

  if (currentPaymentMonth) {
    displayCurrentPaymentMonthStr = getMonthYearString(currentPaymentMonth);
    const currentDueDate = new Date(currentPaymentMonth.getFullYear(), currentPaymentMonth.getMonth(), PAYMENT_DUE_DAY);
    displayCurrentPaymentDueDateStr = currentDueDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'});
    
    const nextScheduledMonthDate = getFirstDayOfNextMonth(currentPaymentMonth);
    displayNextScheduledPaymentMonthStr = getMonthYearString(nextScheduledMonthDate);
    const nextScheduledDueDate = new Date(nextScheduledMonthDate.getFullYear(), nextScheduledMonthDate.getMonth(), PAYMENT_DUE_DAY);
    displayNextScheduledPaymentDueDateStr = nextScheduledDueDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'});
  } else {
    // Caso donde no hay un mes de alquiler actual (ej. todo pagado)
    const today = new Date();
    const nextMonthFromToday = getFirstDayOfNextMonth(today);
    displayNextScheduledPaymentMonthStr = getMonthYearString(nextMonthFromToday);
    const nextScheduledDueDate = new Date(nextMonthFromToday.getFullYear(), nextMonthFromToday.getMonth(), PAYMENT_DUE_DAY);
    displayNextScheduledPaymentDueDateStr = nextScheduledDueDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'});
  }
  
  const pendingTenantChargesForDisplay = tenantCharges.filter(c => c.status === 'pending' && c.tenantId === user?.id);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary, #ffffff)', // Use a theme variable or fallback to white
    padding: '1.5rem 2rem',
    borderRadius: '0.75rem', 
    border: '1px solid var(--border-secondary, #e0e0e0)', // Use theme border or a light gray
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', // More subtle shadow, or remove if not in original theme
    marginBottom: '2rem',
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem', 
    color: 'var(--text-primary)', 
    marginBottom: '1.5rem', 
    borderBottom: '1px solid var(--border-secondary, #e0e0e0)',
    paddingBottom: '0.75rem',
  };

  return (
    <div className="payments-view-container" style={{ padding: '2rem' }}> {/* Removed explicit page background color to allow global styles */}
      <h2 className="section-title" style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '2.5rem', fontSize: '1.8rem' }}>💳 Mis Pagos</h2>

      {user && <p className="welcome-message" style={{textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-secondary)'}}>Bienvenido, {user.firstName || user.username}</p>}

      {urgentPaymentContext && (
        <div 
          style={{ 
            backgroundColor: 'var(--accent-danger-light)',
            border: '1px solid var(--accent-danger)',
            borderLeft: '5px solid var(--accent-danger)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '2.5rem',
            color: 'var(--accent-danger-dark)',
            // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Removed or use theme shadow
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', fontSize: '1.2em', color: 'var(--accent-danger)' }}>
            <span role="img" aria-label="warning" style={{ marginRight: '0.75rem', fontSize: '1.3em' }}>⚠️</span>
            Aviso Importante
          </h4>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{urgentPaymentContext.message}</p>
        </div>
      )}

      {/* Card 1: Current Dues & Payment Actions */}
      <section className="dashboard-section payment-action-card" style={cardStyle}>
        <h3 style={cardTitleStyle}>Estado de Cuenta y Pagos Pendientes</h3>
        
        {currentPaymentMonth && displayCurrentPaymentMonthStr && displayCurrentPaymentDueDateStr ? (
          <div style={{marginBottom: '1.5rem'}}>
            <p style={{color: 'var(--text-primary)', fontSize: '1.05rem'}}>
              Concepto principal: <strong>Alquiler {displayCurrentPaymentMonthStr}</strong>
            </p>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              Vencimiento: {displayCurrentPaymentDueDateStr}
            </p>
          </div>
        ) : (
          !showPaymentForm && <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>No hay alquileres pendientes de pago actualmente.</p>
        )}
        
        {pendingTenantChargesForDisplay.length > 0 && (
            <div className="pending-charges-section" style={{marginTop: '1rem', marginBottom: '2rem'}}>
              <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Cargos Adicionales Pendientes</h4>
              <ul className="charges-list" style={{listStyle: 'none', paddingLeft: '0'}}>
                {pendingTenantChargesForDisplay.map(charge => (
                  <li key={charge.id} className="charge-item" style={{marginBottom: '0.75rem', display: 'flex', alignItems: 'center'}}>
                    <input 
                      type="checkbox"
                      id={`charge-${charge.id}`}
                      checked={selectedCharges.includes(charge.id)}
                      onChange={() => handleChargeSelectionChange(charge.id)}
                      style={{marginRight: '10px', transform: 'scale(1.1)' }}
                    />
                    <label htmlFor={`charge-${charge.id}`} style={{color: 'var(--text-primary)', fontSize: '0.95rem'}}>
                      {charge.concept} - <strong style={{color: 'var(--accent-warning)'}}>${charge.amount.toFixed(2)}</strong> (Asignado: {charge.dateAssigned})
                    </label>
                  </li>
                ))}
              </ul>
            </div>
        )}

        {showPaymentForm && (
          <div className="payment-summary" style={{marginBottom: '2rem', padding: '1.25rem', border: '1px solid var(--border-secondary, #dee2e6)', borderRadius: '0.5rem', background: 'var(--bg-tertiary, #f8f9fa)'}}>
            <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Resumen del Pago Actual</h4>
            {currentPaymentMonth && !tenantViewHistory.find(p => p.concept === `Alquiler ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed') && (
               <p style={{color: 'var(--text-primary)'}}>Alquiler ({getMonthYearString(currentPaymentMonth)}): ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)}</p>
            )}
            {selectedCharges.map(chargeId => {
              const charge = tenantCharges.find(c => c.id === chargeId);
              return charge ? <p key={charge.id} style={{color: 'var(--text-primary)'}}>{charge.concept}: ${charge.amount.toFixed(2)}</p> : null;
            })}
            <hr style={{margin: '1rem 0', borderColor: 'var(--border-secondary, #ced4da)'}}/>
            <p style={{color: 'var(--text-primary)', fontSize: '1.15rem'}}>
              <strong>Total a Pagar: <span style={{color: 'var(--accent-warning)'}}>${totalAmountToPay.toFixed(2)}</span></strong>
            </p>
          </div>
        )}
        
        {!showPaymentForm && !currentPaymentMonth && pendingTenantChargesForDisplay.length === 0 && (
             <p style={{marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1rem'}}>🎉 ¡Estás al día con tus pagos de alquiler y no tienes cargos adicionales pendientes!</p>
        )}
      </section>

      {/* Card 2: Payment Form */}
      {showPaymentForm && (
        <section className="dashboard-section payment-form-card" style={cardStyle}>
            <h3 style={cardTitleStyle}>Realizar Pago</h3>
            <div 
                style={{
                    border: '1px solid var(--border-secondary, #ccc)',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--bg-tertiary, #f9f9f9)',
                }}
            >
                <form onSubmit={handleSubmitPayment}>
                    <div style={{ marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-code-block, #e9ecef)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <p style={{margin: 0, fontWeight: 'bold'}}>Datos de la Tarjeta de Demostración:</p>
                        <p style={{margin: '0.25rem 0'}}>Número: 1122233</p>
                        <p style={{margin: '0.25rem 0'}}>Nombre: Demo User</p>
                        <p style={{margin: '0.25rem 0'}}>Vencimiento: 12/25</p>
                        <p style={{margin: '0.25rem 0'}}>CVV: 123</p>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group" style={{ flex: '1 1 100%'}}>
                            <label htmlFor="cardHolderName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Nombre del Titular</label>
                            <input
                                type="text"
                                id="cardHolderName"
                                name="cardHolderName"
                                value={paymentDetails.cardHolderName}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}
                            />
                        </div>

                        <div className="form-group" style={{ flex: '1 1 60%'}}>
                            <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Número de Tarjeta</label>
                            <input
                                type="text"
                                id="cardNumber"
                                name="cardNumber"
                                value={paymentDetails.cardNumber}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}
                                maxLength={19}
                            />
                        </div>

                        <div className="form-group" style={{ flex: '1 1 20%'}}>
                            <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Vencimiento (MM/AA)</label>
                            <input
                                type="text"
                                id="expiryDate"
                                name="expiryDate"
                                value={paymentDetails.expiryDate}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}
                                placeholder="MM/AA"
                            />
                        </div>

                        <div className="form-group" style={{ flex: '1 1 15%'}}>
                            <label htmlFor="cvv" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>CVV</label>
                            <input
                                type="password"
                                id="cvv"
                                name="cvv"
                                value={paymentDetails.cvv}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}
                                maxLength={4}
                            />
                        </div>
                    </div>
                    
                    {paymentError && <p style={{ color: 'var(--accent-danger)', marginTop: '1.5rem', textAlign: 'center' }}>{paymentError}</p>}

                    <button type="submit" className="submit-payment-button" style={{ 
                        width: '100%', 
                        padding: '1rem', 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold', 
                        color: '#fff', 
                        backgroundColor: 'var(--accent-primary, #007bff)', 
                        border: 'none', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer',
                        marginTop: '2rem',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary-dark, #0056b3)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary, #007bff)'}
                    >
                        Pagar ${totalAmountToPay.toFixed(2)}
                    </button>
                </form>
            </div>
        </section>
      )}

      {/* Card 3: Payment History */}
      <section className="dashboard-section payment-history-card" style={cardStyle}>
        <h3 style={cardTitleStyle}>Historial de Transacciones</h3>
        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="payment-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary, white)' }}>
                    <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Fecha</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Concepto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Monto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Estado</th>
                    </tr>
                </thead>
                <tbody>
                {tenantViewHistory.length > 0 ? (
                    tenantViewHistory.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-secondary, #eee)'}}>
                        <td style={{ padding: '0.75rem' }}>{payment.date}</td>
                        <td style={{ padding: '0.75rem' }}>{payment.concept}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>${payment.amount.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span 
                                className={`status-badge status-${payment.status}`}
                                style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    color: '#fff',
                                    // backgroundColor set by global CSS a .status-<statusname>
                                }}
                            >
                                {payment.status === 'completed' ? 'Completado' : payment.status === 'reverted' ? 'Revertido' : 'Pendiente'}
                            </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay transacciones registradas.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
        {!currentPaymentMonth && (
             <div style={{marginTop: '1.5rem', padding: '1rem', textAlign: 'center', background: 'var(--accent-success-light, #e8f5e9)', borderRadius: '0.5rem', border: '1px solid var(--accent-success, #4caf50)'}}>
                 <p style={{margin: 0, color: 'var(--accent-success-dark, #1b5e20)'}}>Próximo pago programado: <strong>Alquiler {displayNextScheduledPaymentMonthStr}</strong> (Vence el {displayNextScheduledPaymentDueDateStr})</p>
             </div>
        )}
      </section>
    </div>
  );
};

export default TenantPayments; 