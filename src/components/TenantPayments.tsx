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
                  backgroundColor: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-secondary)',
                  borderLeft: '5px solid var(--accent-info)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  marginBottom: '2.5rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', fontSize: '1.15em' }}>
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
                <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem'}}>Detalles de la Tarjeta</h4>
                <div className="form-grid form-grid-cols-2">
                  <div className="form-group">
                    <label htmlFor="cardHolderName" className="form-label" style={{color: 'var(--text-secondary)'}}>Nombre del Titular:</label>
                    <input
                      type="text" id="cardHolderName" name="cardHolderName" className="form-input"
                      value={paymentDetails.cardHolderName} onChange={handleInputChange} placeholder={PREDETERMINED_CARD.HOLDER_NAME} required
                      style={{borderColor: 'var(--border-secondary)', color: 'var(--text-primary)'}}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardNumber" className="form-label" style={{color: 'var(--text-secondary)'}}>Número de Tarjeta:</label>
                    <input
                      type="text" id="cardNumber" name="cardNumber" className="form-input"
                      value={paymentDetails.cardNumber} onChange={handleInputChange} placeholder={PREDETERMINED_CARD.NUMBER} required
                      style={{borderColor: 'var(--border-secondary)', color: 'var(--text-primary)'}}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="expiryDate" className="form-label" style={{color: 'var(--text-secondary)'}}>Fecha de Expiración (MM/YY):</label>
                    <input
                      type="text" id="expiryDate" name="expiryDate" className="form-input"
                      value={paymentDetails.expiryDate} onChange={handleInputChange} placeholder={PREDETERMINED_CARD.EXPIRY_DATE} required
                      style={{borderColor: 'var(--border-secondary)', color: 'var(--text-primary)'}}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cvv" className="form-label" style={{color: 'var(--text-secondary)'}}>CVV:</label>
                    <input
                      type="text" id="cvv" name="cvv" className="form-input"
                      value={paymentDetails.cvv} onChange={handleInputChange} placeholder={PREDETERMINED_CARD.CVV} required
                      style={{borderColor: 'var(--border-secondary)', color: 'var(--text-primary)'}}
                    />
                  </div>
                </div>
                {paymentError && (
                  <p className="error-message payment-error" style={{marginTop: '1.5rem', color: 'var(--accent-danger-dark)', backgroundColor: 'var(--accent-danger-light)', padding: '0.75rem', borderRadius: '0.25rem'}}>{paymentError}</p>
                )}
                <button type="submit" className="btn btn-primary pay-submit-btn" 
                  style={{ 
                    marginTop: '2rem', 
                    // Rely on .btn-primary for colors, or use CSS variables if defined for primary buttons
                    // backgroundColor: 'var(--accent-primary-button, var(--accent-info))', 
                    // borderColor: 'var(--accent-primary-button-border, var(--accent-info))', 
                    // color: 'var(--accent-primary-button-text, #ffffff)', 
                    padding: '0.75rem 1.5rem', 
                    fontSize: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}>
                  Pagar ${totalAmountToPay.toFixed(2)}
                </button>
              </form>
        </section>
      )}

      {/* Card 3: Future Payment Information */}
      <section className="dashboard-section next-payment-info" style={cardStyle}>
        <h3 style={cardTitleStyle}>Próximo Pago Programado</h3>
        <p style={{color: 'var(--text-secondary)'}}><strong style={{color: 'var(--text-primary)'}}>Concepto:</strong> Alquiler {displayNextScheduledPaymentMonthStr}</p>
        <p style={{color: 'var(--text-secondary)'}}><strong style={{color: 'var(--text-primary)'}}>Monto Estimado:</strong> ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)} (solo alquiler)</p>
        <p style={{color: 'var(--text-secondary)'}}><strong style={{color: 'var(--text-primary)'}}>Fecha de Vencimiento Estimada:</strong> {displayNextScheduledPaymentDueDateStr}</p>
      </section>

      {/* Card 4: Transaction History */}
      <section className="dashboard-section transaction-history-card" style={cardStyle}>
        <h3 style={cardTitleStyle}>Historial de Transacciones</h3>
        
        <div className="payment-history-section" style={{marginBottom: '2.5rem'}}>
            <h4 style={{fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Mis Pagos Realizados</h4>
            {tenantViewHistory.length > 0 ? (
              <div className="table-container">
                <table className="users-table" style={{borderColor: 'var(--border-secondary, #dee2e6)'}}>
                  <thead>
                    <tr>
                      <th style={{color: 'var(--text-secondary)'}}>Fecha</th>
                      <th style={{color: 'var(--text-secondary)'}}>Concepto</th>
                      <th style={{color: 'var(--text-secondary)'}}>Monto</th>
                      <th style={{color: 'var(--text-secondary)'}}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantViewHistory.map((payment: PaymentRecordProperties) => (
                      <tr key={payment.id}>
                        <td data-label="Fecha" style={{color: 'var(--text-primary)'}}>{payment.date}</td>
                        <td data-label="Concepto" style={{color: 'var(--text-primary)'}}>{payment.concept}</td>
                        <td data-label="Monto" style={{color: 'var(--text-primary)'}}>${payment.amount.toFixed(2)}</td>
                        <td data-label="Estado"><span className={`status-badge status-${payment.status.toLowerCase()}`}>{payment.status}</span></td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{color: 'var(--text-secondary)'}}>Aún no tienes historial de pagos.</p>
            )}
        </div>

        <div className="charges-history-section">
            <h4 style={{fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Mis Cargos Adicionales</h4>
            {tenantCharges.length > 0 ? (
               <div className="table-container">
                 <table className="users-table" style={{borderColor: 'var(--border-secondary, #dee2e6)'}}>
                   <thead>
                     <tr>
                       <th style={{color: 'var(--text-secondary)'}}>Fecha Asignación</th>
                       <th style={{color: 'var(--text-secondary)'}}>Concepto</th>
                       <th style={{color: 'var(--text-secondary)'}}>Monto</th>
                       <th style={{color: 'var(--text-secondary)'}}>Estado</th>
                       <th style={{color: 'var(--text-secondary)'}}>Pagado con ID Trans.</th>
                     </tr>
                   </thead>
                   <tbody>
                    {tenantCharges.sort((a,b) => new Date(b.dateAssignedISO).getTime() - new Date(a.dateAssignedISO).getTime()).map((charge: ChargeRecord) => (
                      <tr key={charge.id}>
                        <td data-label="Fecha Asignación" style={{color: 'var(--text-primary)'}}>{charge.dateAssigned}</td>
                        <td data-label="Concepto" style={{color: 'var(--text-primary)'}}>{charge.concept}</td>
                        <td data-label="Monto" style={{color: 'var(--text-primary)'}}>${charge.amount.toFixed(2)}</td>
                        <td data-label="Estado">
                            <span className={`status-badge status-${charge.status === 'pending' ? 'warning' : 'success'}`}>
                                {charge.status}
                            </span>
                        </td>
                        <td data-label="Pagado con ID Trans." style={{color: 'var(--text-primary)'}}>{charge.paymentId || 'N/A'}</td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
               </div>
            ) : (
                <p style={{color: 'var(--text-secondary)'}}>No tienes cargos adicionales registrados.</p>
            )}
        </div>
      </section>
    </div>
  );
};

export default TenantPayments; 