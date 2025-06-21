import React, { useState, type ChangeEvent, type FormEvent, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PaymentRecordProperties, ChargeRecord, PaymentDetails } from '../types'; // Importar los tipos centralizados
import { getMonthYearString, getFirstDayOfMonth, getFirstDayOfNextMonth, getSortableDateFromConcept, determineNextPayableMonth } from '../utils/dateUtils';
import { getPaymentHistory, getCharges, makePayment } from '../services/paymentService';

// Constantes
const PREDETERMINED_CARD = {
  NUMBER: '1122233',
  EXPIRY_DATE: '12/25',
  CVV: '123',
  HOLDER_NAME: 'Demo User'
};
const DEFAULT_MONTHLY_AMOUNT = 150.75;
const PAYMENT_DUE_DAY = 15;

interface TenantPaymentsProps {
  onPaymentSuccess?: () => void;
}

const TenantPayments: React.FC<TenantPaymentsProps> = ({ onPaymentSuccess }) => {
  const { user } = useAuth();

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tenantViewHistory, setTenantViewHistory] = useState<PaymentRecordProperties[]>([]);
  const [tenantCharges, setTenantCharges] = useState<ChargeRecord[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [totalAmountToPay, setTotalAmountToPay] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentPaymentMonth, setCurrentPaymentMonth] = useState<Date | null>(() => getFirstDayOfMonth(new Date()));
  const [urgentPaymentContext, setUrgentPaymentContext] = useState<{ message: string; concept: string; isReverted: boolean } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  const loadPaymentData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setPaymentError(null);

    try {
      const [history, charges] = await Promise.all([
        getPaymentHistory(user.id),
        getCharges(user.id),
      ]);

      const sortedHistory = [...history].sort((a, b) => {
          const dateA = getSortableDateFromConcept(a.concept) || new Date(a.id);
          const dateB = getSortableDateFromConcept(b.concept) || new Date(b.id);
          return dateB.getTime() - dateA.getTime();
      });

      setTenantViewHistory(sortedHistory);
      setTenantCharges(charges);

      const nextPayableMonth = determineNextPayableMonth(sortedHistory, getFirstDayOfMonth(new Date()));
      setCurrentPaymentMonth(nextPayableMonth);

      if (nextPayableMonth) {
        const conceptOfNextPayableMonth = `Rent ${getMonthYearString(nextPayableMonth)}`;
        const revertedPayment = sortedHistory.find(
          p => p.concept === conceptOfNextPayableMonth && p.status === 'reverted' && p.tenantId === user.id
        );
        if (revertedPayment) {
          setUrgentPaymentContext({
            message: `Attention: The payment for ${revertedPayment.concept} was reverted. Please make the payment again.`,
            concept: revertedPayment.concept,
            isReverted: true,
          });
        } else {
          setUrgentPaymentContext(null);
        }
      } else {
        setUrgentPaymentContext(null);
      }
    } catch (error) {
      console.error("[TenantPayments] Failed to fetch payment data:", error);
      setPaymentError("Could not load payment information. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // Efecto para recalcular totalAmountToPay
  useEffect(() => {
    if (!user) return;

    let amount = 0;
    let isAlquilerDue = false;
    if (currentPaymentMonth) {
        isAlquilerDue = !tenantViewHistory.find(p => p.concept === `Rent ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed');
    }

    if (isAlquilerDue) {
      amount += DEFAULT_MONTHLY_AMOUNT;
    }
    
    const selectedChargesObjects = tenantCharges.filter(c => selectedCharges.includes(c.id) && c.status === 'pending');
    const totalSelectedChargesAmount = selectedChargesObjects.reduce((sum, charge) => sum + charge.amount, 0);
    
    amount += totalSelectedChargesAmount;
    setTotalAmountToPay(amount);

    setShowPaymentForm(isAlquilerDue || selectedChargesObjects.length > 0);

  }, [currentPaymentMonth, tenantCharges, selectedCharges, user, tenantViewHistory]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 16);
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/[^0-9]/g, '');
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      } else if (value.length === 3 && value.includes('/')) {
         formattedValue = value.slice(0,2);
      }
      formattedValue = formattedValue.slice(0, 5);
    } else if (name === 'cvv') {
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

  const handleSubmitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);
    setUrgentPaymentContext(null);

    if (!user) {
      setPaymentError("Error: User not authenticated.");
      return;
    }

    if (totalAmountToPay <= 0) {
      setPaymentError("No amount selected to pay.");
      return;
    }

    if (
      paymentDetails.cardNumber !== PREDETERMINED_CARD.NUMBER ||
      paymentDetails.expiryDate !== PREDETERMINED_CARD.EXPIRY_DATE ||
      paymentDetails.cvv !== PREDETERMINED_CARD.CVV ||
      paymentDetails.cardHolderName.trim() !== PREDETERMINED_CARD.HOLDER_NAME
    ) {
      setPaymentError("The credit card details are incorrect.");
      return;
    }

    setIsLoading(true);

    try {
      const paymentId = new Date().toISOString();
      let rentalPaidThisTransaction = false;
      let paymentConcept = "";

      if (currentPaymentMonth) {
        const isAlquilerDue = !tenantViewHistory.find(p => p.concept === `Rent ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed');
        if (isAlquilerDue && (totalAmountToPay >= DEFAULT_MONTHLY_AMOUNT || selectedCharges.length === 0)) {
          rentalPaidThisTransaction = true;
          paymentConcept = `Rent ${getMonthYearString(currentPaymentMonth)}`;
        }
      }

      const paidChargesDetails = tenantCharges
        .filter(c => selectedCharges.includes(c.id) && c.status === 'pending')
        .map(c => ({ id: c.id, concept: c.concept, amount: c.amount }));

      const paidChargesConcepts = paidChargesDetails.map(c => c.concept);
      if (paidChargesConcepts.length > 0) {
        if (paymentConcept) {
          paymentConcept += " + ";
        }
        paymentConcept += `Charges (${paidChargesConcepts.join(', ')})`;
      }
      
      if (!paymentConcept) {
         if (paidChargesDetails.length > 0) paymentConcept = "Payment of Additional Charges";
         else {
            setPaymentError("Error determining payment concept.");
            return;
         }
       }
      
      const paymentData = {
        tenantId: user.id,
        tenantName: `${user.firstName} ${user.lastName}`,
        amount: totalAmountToPay,
        concept: paymentConcept,
        rentalPaidThisTransaction,
        paidChargesDetails,
        paymentId,
      };

      await makePayment(paymentData);
      
      console.log("[TenantPayments] Payment successful!");

      setSelectedCharges([]);
      setPaymentDetails({ cardNumber: '', cardHolderName: '', expiryDate: '', cvv: '' });
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      await loadPaymentData();

    } catch (error) {
      console.error("[TenantPayments] Payment failed:", error);
      setPaymentError("An error occurred while processing the payment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading payment information...</div>;
  }

  // Variables para el JSX, con manejo de nulabilidad para currentPaymentMonth
  let displayCurrentPaymentMonthStr: string | null = null;
  let displayCurrentPaymentDueDateStr: string | null = null;
  let displayNextScheduledPaymentMonthStr: string;
  let displayNextScheduledPaymentDueDateStr: string;

  if (currentPaymentMonth) {
    displayCurrentPaymentMonthStr = getMonthYearString(currentPaymentMonth);
    const currentDueDate = new Date(currentPaymentMonth.getFullYear(), currentPaymentMonth.getMonth(), PAYMENT_DUE_DAY);
    displayCurrentPaymentDueDateStr = currentDueDate.toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'});
    
    const nextScheduledMonthDate = getFirstDayOfNextMonth(currentPaymentMonth);
    displayNextScheduledPaymentMonthStr = getMonthYearString(nextScheduledMonthDate);
    const nextScheduledDueDate = new Date(nextScheduledMonthDate.getFullYear(), nextScheduledMonthDate.getMonth(), PAYMENT_DUE_DAY);
    displayNextScheduledPaymentDueDateStr = nextScheduledDueDate.toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'});
  } else {
    // Caso donde no hay un mes de alquiler actual (ej. todo pagado)
    const today = new Date();
    const nextMonthFromToday = getFirstDayOfNextMonth(today);
    displayNextScheduledPaymentMonthStr = getMonthYearString(nextMonthFromToday);
    const nextScheduledDueDate = new Date(nextMonthFromToday.getFullYear(), nextMonthFromToday.getMonth(), PAYMENT_DUE_DAY);
    displayNextScheduledPaymentDueDateStr = nextScheduledDueDate.toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'});
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
      <h2 className="section-title" style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '2.5rem', fontSize: '1.8rem' }}>💳 My Payments</h2>

      {user && <p className="welcome-message" style={{textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-secondary)'}}>Welcome, {user.firstName || user.username}</p>}

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
            Important Notice
          </h4>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{urgentPaymentContext.message}</p>
        </div>
      )}

      {/* Card 1: Current Dues & Payment Actions */}
      <section className="dashboard-section payment-action-card" style={cardStyle}>
        <h3 style={cardTitleStyle}>Account Status and Pending Payments</h3>
        
        {currentPaymentMonth && displayCurrentPaymentMonthStr && displayCurrentPaymentDueDateStr ? (
          <div style={{marginBottom: '1.5rem'}}>
            <p style={{color: 'var(--text-primary)', fontSize: '1.05rem'}}>
              Main concept: <strong>Rent {displayCurrentPaymentMonthStr}</strong>
            </p>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              Due date: {displayCurrentPaymentDueDateStr}
            </p>
          </div>
        ) : (
          !showPaymentForm && <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>There are currently no outstanding rent payments.</p>
        )}
        
        {pendingTenantChargesForDisplay.length > 0 && (
            <div className="pending-charges-section" style={{marginTop: '1rem', marginBottom: '2rem'}}>
              <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Pending Additional Charges</h4>
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
                      {charge.concept} - <strong style={{color: 'var(--accent-warning)'}}>${charge.amount.toFixed(2)}</strong> (Assigned: {charge.dateAssigned})
                    </label>
                  </li>
                ))}
              </ul>
            </div>
        )}

        {showPaymentForm && (
          <div className="payment-summary" style={{marginBottom: '2rem', padding: '1.25rem', border: '1px solid var(--border-secondary, #dee2e6)', borderRadius: '0.5rem', background: 'var(--bg-tertiary, #f8f9fa)'}}>
            <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>Current Payment Summary</h4>
            {currentPaymentMonth && !tenantViewHistory.find(p => p.concept === `Rent ${getMonthYearString(currentPaymentMonth)}` && p.status === 'completed') && (
               <p style={{color: 'var(--text-primary)'}}>Rent ({getMonthYearString(currentPaymentMonth)}): ${DEFAULT_MONTHLY_AMOUNT.toFixed(2)}</p>
            )}
            {selectedCharges.map(chargeId => {
              const charge = tenantCharges.find(c => c.id === chargeId);
              return charge ? <p key={charge.id} style={{color: 'var(--text-primary)'}}>{charge.concept}: ${charge.amount.toFixed(2)}</p> : null;
            })}
            <hr style={{margin: '1rem 0', borderColor: 'var(--border-secondary, #ced4da)'}}/>
            <p style={{color: 'var(--text-primary)', fontSize: '1.15rem'}}>
              <strong>Total to Pay: <span style={{color: 'var(--accent-warning)'}}>${totalAmountToPay.toFixed(2)}</span></strong>
            </p>
          </div>
        )}
        
        {!showPaymentForm && !currentPaymentMonth && pendingTenantChargesForDisplay.length === 0 && (
             <p style={{marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1rem'}}>🎉 You are up to date with your rent payments and have no pending additional charges!</p>
        )}
      </section>

      {/* Card 2: Payment Form */}
      {showPaymentForm && (
        <section className="dashboard-section payment-form-card" style={cardStyle}>
            <h3 style={cardTitleStyle}>Make a Payment</h3>
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
                        <p style={{margin: 0, fontWeight: 'bold'}}>Demo Card Details:</p>
                        <p style={{margin: '0.25rem 0'}}>Number: 1122233</p>
                        <p style={{margin: '0.25rem 0'}}>Name: Demo User</p>
                        <p style={{margin: '0.25rem 0'}}>Expiry: 12/25</p>
                        <p style={{margin: '0.25rem 0'}}>CVV: 123</p>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group" style={{ flex: '1 1 100%'}}>
                            <label htmlFor="cardHolderName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Cardholder Name</label>
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
                            <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Card Number</label>
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
                            <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Expiry (MM/YY)</label>
                            <input
                                type="text"
                                id="expiryDate"
                                name="expiryDate"
                                value={paymentDetails.expiryDate}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}
                                placeholder="MM/YY"
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
                        Pay ${totalAmountToPay.toFixed(2)}
                    </button>
                </form>
            </div>
        </section>
      )}

      {/* Card 3: Payment History */}
      <section className="dashboard-section payment-history-card" style={cardStyle}>
        <h3 style={cardTitleStyle}>Transaction History</h3>
        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="payment-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary, white)' }}>
                    <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Concept</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Amount</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--accent-primary, #007bff)', color: 'var(--text-primary)' }}>Status</th>
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
                                {payment.status === 'completed' ? 'Completed' : payment.status === 'reverted' ? 'Reverted' : 'Pending'}
                            </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions recorded.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
        {!currentPaymentMonth && (
             <div style={{marginTop: '1.5rem', padding: '1rem', textAlign: 'center', background: 'var(--accent-success-light, #e8f5e9)', borderRadius: '0.5rem', border: '1px solid var(--accent-success, #4caf50)'}}>
                 <p style={{margin: 0, color: 'var(--accent-success-dark, #1b5e20)'}}>Next scheduled payment: <strong>Rent {displayNextScheduledPaymentMonthStr}</strong> (Due on {displayNextScheduledPaymentDueDateStr})</p>
             </div>
        )}
      </section>
    </div>
  );
};

export default TenantPayments; 