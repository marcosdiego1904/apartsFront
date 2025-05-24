import React, { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User, PaymentRecordProperties, ChargeRecord } from '../types'; // Importar los tipos centralizados

// Interfaces (duplicadas temporalmente, podrían moverse a un archivo types común si no están ya)
interface PaymentDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

// Constantes (duplicadas temporalmente)
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

// Helper para convertir "Alquiler Mes de Año" a un objeto Date para ordenar
const getSortableDateFromConcept = (concept: string): Date | null => {
  const monthNames: { [key: string]: number } = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const parts = concept.toLowerCase().split(' '); // e.g., ["alquiler", "mayo", "de", "2025"]
  if (parts.length < 4 || parts[0] !== 'alquiler') {
    return null; // Formato no esperado
  }
  const monthName = parts[1];
  const yearStr = parts[3];
  
  const month = monthNames[monthName];
  const year = parseInt(yearStr, 10);

  if (month !== undefined && !isNaN(year)) {
    return new Date(year, month, 1);
  }
  return null;
};

// Nueva función para determinar el primer mes pagable
const determineNextPayableMonth = (tenantPayments: PaymentRecordProperties[], initialDate: Date | null): Date | null => {
  if (!initialDate) return null; // Si no hay fecha inicial, no podemos determinar.
  let currentDate = getFirstDayOfMonth(new Date(initialDate)); 

  const completedPaymentsConcepts = tenantPayments
    .filter(p => p.status === 'completed')
    .map(p => p.concept);
  
  let attempts = 0; // Evitar bucles infinitos en casos extraños
  // eslint-disable-next-line no-constant-condition
  while (attempts < 240) { // Buscar hasta 20 años en el futuro
    const conceptOfMonth = `Alquiler ${getMonthYearString(currentDate)}`;
    if (!completedPaymentsConcepts.includes(conceptOfMonth)) {
      return currentDate; 
    }
    currentDate = getFirstDayOfNextMonth(currentDate);
    attempts++;
  }
  return null; // No se encontró un mes pagable (todos los meses futuros están "pagados")
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
    setPaymentDetails(prevDetails => ({ ...prevDetails, [name]: value }));
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
      localStorage.setItem(LOCAL_STORAGE_CHARGES_HISTORY_KEY, JSON.stringify(updatedCharges));
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

  return (
    <div className="payments-view-container">
      <h2 className="section-title">💳 Mis Pagos</h2>

      {user && <p className="welcome-message" style={{textAlign: 'center', marginBottom: '1.5rem'}}>Bienvenido, {user.firstName || user.username}</p>}

      {urgentPaymentContext && (
        <div 
          style={{ 
            backgroundColor: 'var(--accent-danger-light)', // O un color de advertencia adecuado
            border: '1px solid var(--accent-danger)',
            borderLeft: '5px solid var(--accent-danger)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            color: 'var(--accent-danger-dark)' // Texto oscuro para contraste
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', fontSize: '1.1em' }}>
            <span role="img" aria-label="warning" style={{ marginRight: '0.75rem', fontSize: '1.3em' }}>⚠️</span>
            Aviso Importante
          </h4>
          <p style={{ margin: 0 }}>{urgentPaymentContext.message}</p>
        </div>
      )}

      <section className="dashboard-section payment-form-section">
        {currentPaymentMonth && displayCurrentPaymentMonthStr && displayCurrentPaymentDueDateStr ? (
          <>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Realizar un Pago</h3>
            <p>
              Saldo pendiente para <strong>Alquiler {displayCurrentPaymentMonthStr}</strong>: 
              <strong style={{ color: 'var(--accent-warning)' }}> ${totalAmountToPay.toFixed(2)}</strong>
            </p>
            <p className="text-secondary" style={{fontSize: '0.9em', marginBottom: '1.5rem'}}>
              Fecha de Vencimiento: {displayCurrentPaymentDueDateStr}
            </p>
          </>
        ) : (
          <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Realizar un Pago</h3>
        )}
        
        {/* SECCIÓN DE CARGOS ADICIONALES PENDIENTES (integrada antes del resumen si hay algo que pagar) */}
        {pendingTenantChargesForDisplay.length > 0 && (
            <div className="pending-charges-section" style={{marginTop: '1.5rem', marginBottom: '1rem'}}>
              <h4>Cargos Adicionales Pendientes a Pagar</h4>
              <ul className="charges-list" style={{listStyle: 'none', paddingLeft: '0'}}>
                {pendingTenantChargesForDisplay.map(charge => (
                  <li key={charge.id} className="charge-item" style={{marginBottom: '0.5rem'}}>
                    <input 
                      type="checkbox"
                      id={`charge-${charge.id}`}
                      checked={selectedCharges.includes(charge.id)}
                      onChange={() => handleChargeSelectionChange(charge.id)}
                      style={{marginRight: '8px'}}
                    />
                    <label htmlFor={`charge-${charge.id}`}>
                      {charge.concept} - ${charge.amount.toFixed(2)} (Asignado: {charge.dateAssigned})
                    </label>
                  </li>
                ))}
              </ul>
            </div>
        )}

        {showPaymentForm ? (
          <div className="payment-summary-and-form" style={{marginTop: currentPaymentMonth ? '0' : '1.5rem'}}>
             <div className="payment-summary" style={{marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9', color: '#333'}}>
                <h4>Resumen del Pago Actual</h4>
                {currentPaymentMonth && !tenantViewHistory.find(p => p.concept === `Alquiler ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed') && (
                   <p>Alquiler ({getMonthYearString(currentPaymentMonth)}): ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)}</p>
                )}
                {selectedCharges.map(chargeId => {
                  const charge = tenantCharges.find(c => c.id === chargeId);
                  return charge ? <p key={charge.id}>{charge.concept}: ${charge.amount.toFixed(2)}</p> : null;
                })}
                <hr style={{margin: '1rem 0'}}/>
                <p>
                  <strong>Total a Pagar: ${totalAmountToPay.toFixed(2)}</strong>
                </p>
              </div>
              
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
                <h4>Detalles de la Tarjeta</h4>
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
                  <p className="error-message payment-error" style={{marginTop: '1rem', color: 'red'}}>{paymentError}</p>
                )}
                <button type="submit" className="btn btn-primary pay-submit-btn" style={{ marginTop: '1.5rem' }}>
                  Pagar ${totalAmountToPay.toFixed(2)}
                </button>
              </form>
            </div>
          ) : (
            <p style={{marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)'}}>No hay pagos de alquiler pendientes o cargos seleccionados para pagar en este momento.</p>
        )}
      </section>

      <section className="dashboard-section next-payment-info" style={{ marginTop: '2rem'}}>
        <h3 className="section-title" style={{ fontSize: '1.2rem'}}>Próximo Pago Programado</h3>
        <p className="text-secondary"><strong className="text-primary">Concepto:</strong> Alquiler {displayNextScheduledPaymentMonthStr}</p>
        <p className="text-secondary"><strong className="text-primary">Monto Estimado:</strong> ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)} (solo alquiler)</p>
        <p className="text-secondary"><strong className="text-primary">Fecha de Vencimiento Estimada:</strong> 
          {displayNextScheduledPaymentDueDateStr}
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
                {tenantViewHistory.map((payment: PaymentRecordProperties) => (
                  <tr key={payment.id}>
                    <td data-label="Fecha">{payment.date}</td>
                    <td data-label="Concepto">{payment.concept}</td>
                    <td data-label="Monto">${payment.amount.toFixed(2)}</td>
                    <td data-label="Estado"><span className={`status-badge status-${payment.status.toLowerCase()}`}>{payment.status}</span></td> 
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary no-history-message">Aún no tienes historial de pagos.</p>
        )}
      </section>

      {/* Historial de Cargos Adicionales del Inquilino */}
      <section className="dashboard-section charges-history-section" style={{ marginTop: '2rem'}}>
        <h3 className="section-title" style={{ fontSize: '1.2rem' }}>Mi Historial de Cargos Adicionales</h3>
        {tenantCharges.length > 0 ? (
           <div className="table-container">
             <table className="users-table">
               <thead>
                 <tr>
                   <th>Fecha Asignación</th>
                   <th>Concepto</th>
                   <th>Monto</th>
                   <th>Estado</th>
                   <th>Pagado con ID Trans.</th>
                 </tr>
               </thead>
               <tbody>
                {tenantCharges.sort((a,b) => new Date(b.dateAssignedISO).getTime() - new Date(a.dateAssignedISO).getTime()).map((charge: ChargeRecord) => (
                  <tr key={charge.id}>
                    <td data-label="Fecha Asignación">{charge.dateAssigned}</td>
                    <td data-label="Concepto">{charge.concept}</td>
                    <td data-label="Monto">${charge.amount.toFixed(2)}</td>
                    <td data-label="Estado">
                        <span className={`status-badge status-${charge.status === 'pending' ? 'warning' : 'success'}`}>
                            {charge.status}
                        </span>
                    </td>
                    <td data-label="Pagado con ID Trans.">{charge.paymentId || 'N/A'}</td>
                  </tr>
                ))}
               </tbody>
             </table>
           </div>
        ) : (
            <p className="text-secondary no-history-message">No tienes cargos adicionales registrados.</p>
        )}
      </section>
    </div>
  );
};

export default TenantPayments; 