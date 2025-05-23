import React, { useState, useEffect, type JSX } from 'react'; // Removed useCallback

// Tipos para nuestros datos
interface Debt {
  id: string;
  concept: string;
  amount: number;
  dueDate: Date | string;
  status: 'pending' | 'paid';
  paymentId?: string;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: Date | string;
  simulatedMethod: string;
  conceptPaid: string;
  relatedDebtId?: string | null;
  receiptNumber: string;
}

interface TenantProfile {
  balance: number;
  name?: string;
}

interface ProximoPagoInfo {
  concepto: string;
  monto: number;
  fechaVencimiento?: Date | string;
}

// --- Mock Data ---
const MOCK_USER_ID = "tenant001";

const INITIAL_MOCK_TENANT_PROFILE: TenantProfile = {
  balance: -700, // Adjusted to reflect initial pending debts: 150 (May) + 500 (Paint) + 50 (Water) = 700
};

// Initial state of all debts
const INITIAL_MOCK_DEBTS_DATA: Debt[] = [
  { id: 'debt1', concept: 'Mantenimiento Mayo', amount: 150, dueDate: new Date(2025, 4, 30), status: 'pending' },
  { id: 'debt2', concept: 'Cuota Extraordinaria Pintura', amount: 500, dueDate: new Date(2025, 5, 15), status: 'pending' },
  { id: 'debt3', concept: 'Mantenimiento Abril', amount: 150, dueDate: new Date(2025, 3, 30), status: 'paid', paymentId: 'pay1' },
  { id: 'debt4', concept: 'Servicio Agua Marzo', amount: 50, dueDate: new Date(2025, 2, 20), status: 'pending' },
];

const INITIAL_MOCK_PAYMENTS_DATA: Payment[] = [
  { id: 'pay1', userId: MOCK_USER_ID, amount: 150, date: new Date(2025, 3, 28), simulatedMethod: 'Tarjeta de Crédito/Débito', conceptPaid: 'Mantenimiento Abril', relatedDebtId: 'debt3', receiptNumber: 'SIM-1678886400000' },
];
// --- Fin Mock Data ---

const IconPlaceholder: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) => (
  <span style={{ marginRight: '8px', ...style }}>[{name}]</span>
);

const CreditCardIcon = () => <IconPlaceholder name="Tarjeta" />;
const CalendarIcon = () => <IconPlaceholder name="Calendario" />;
const CheckCircleIcon = () => <IconPlaceholder name="OK" />;
const InformationCircleIcon = () => <IconPlaceholder name="Info" />;


function TenantPayments(): JSX.Element {
  const userId = MOCK_USER_ID; 

  const [allDebtsData, setAllDebtsData] = useState<Debt[]>(INITIAL_MOCK_DEBTS_DATA);
  const [saldo, setSaldo] = useState<number>(INITIAL_MOCK_TENANT_PROFILE.balance);
  const [proximoPago, setProximoPago] = useState<ProximoPagoInfo | null>(null);
  const [historialPagos, setHistorialPagos] = useState<Payment[]>(INITIAL_MOCK_PAYMENTS_DATA);
  const [deudasPendientes, setDeudasPendientes] = useState<Debt[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedDebtToPay, setSelectedDebtToPay] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Tarjeta de Crédito/Débito");

  // Recalculate pending debts and next payment whenever allDebtsData changes
  useEffect(() => {
    const pending = allDebtsData
      .filter(d => d.status === 'pending')
      .sort((a, b) => (new Date(a.dueDate).getTime()) - (new Date(b.dueDate).getTime()));
    setDeudasPendientes(pending);

    if (pending.length > 0) {
      setProximoPago({
        concepto: pending[0].concept,
        monto: pending[0].amount,
        fechaVencimiento: pending[0].dueDate,
      });
    } else {
      setProximoPago(null);
    }
  }, [allDebtsData]);


  // Simulación de carga de datos inicial
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for initial load
        // Data is already initialized in useState, so this effect primarily sets loading to false
        // or could fetch fresh data if MOCK_DATA were from an API
        setIsLoading(false);
      } catch (e: any) {
        console.error("Error simulando carga de datos:", e);
        setError("No se pudieron cargar los datos del inquilino. " + e.message);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  const handleOpenPaymentModal = (debt: Debt | null = null) => {
    if (debt) {
      setSelectedDebtToPay(debt);
      setPaymentAmount(debt.amount);
    } else {
      const totalDebt = deudasPendientes.reduce((sum, d) => sum + d.amount, 0);
      setSelectedDebtToPay(null);
      setPaymentAmount(totalDebt > 0 ? totalDebt : 0);
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (paymentAmount <= 0) {
      window.alert("El monto del pago debe ser mayor a cero."); 
      return;
    }

    setShowPaymentModal(false);
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

      const newPayment: Payment = {
        id: `pay${Date.now()}`,
        userId: userId,
        amount: parseFloat(paymentAmount.toString()),
        date: new Date(),
        simulatedMethod: paymentMethod,
        conceptPaid: selectedDebtToPay ? selectedDebtToPay.concept : "Pago general de deudas",
        relatedDebtId: selectedDebtToPay ? selectedDebtToPay.id : null,
        receiptNumber: `SIM-${Date.now()}`
      };

      setHistorialPagos(prev => 
        [newPayment, ...prev].sort((a, b) => (new Date(b.date).getTime()) - (new Date(a.date).getTime()))
      );
      
      let newBalance = saldo;
      let updatedDebtsList: Debt[];

      if (selectedDebtToPay) {
        updatedDebtsList = allDebtsData.map(d => 
          d.id === selectedDebtToPay!.id ? { ...d, status: 'paid' as 'paid', paymentId: newPayment.id } : d
        );
        newBalance += selectedDebtToPay.amount; // Saldo es negativo, pagar lo acerca a 0
      } else {
        // Pago General: Aplicar a las deudas pendientes más antiguas primero
        newBalance += parseFloat(paymentAmount.toString());
        let amountLeftToApply = parseFloat(paymentAmount.toString());
        
        updatedDebtsList = allDebtsData
          .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) // Procesar más antiguas primero
          .map(d => {
            if (d.status === 'pending' && amountLeftToApply > 0) {
              if (amountLeftToApply >= d.amount) {
                amountLeftToApply -= d.amount;
                return { ...d, status: 'paid' as 'paid', paymentId: newPayment.id };
              } else {
                // Lógica para pago parcial podría ir aquí si se implementa
                // Por ahora, si no cubre completo, no se marca como pagada con este pago general.
                return d;
              }
            }
            return d;
          });
      }
      
      setAllDebtsData(updatedDebtsList);
      setSaldo(newBalance);
      
      window.alert("¡Pago simulado realizado con éxito!"); 

      setPaymentAmount(0);
      setSelectedDebtToPay(null);

    } catch (e: any) {
      console.error("Error al procesar el pago simulado:", e);
      setError("Ocurrió un error al procesar el pago. " + e.message);
      window.alert("Error al procesar el pago: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateInput?: Date | string): string => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const formatCurrency = (amount?: number): string => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' },
    header: { marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: 'bold', color: '#333' },
    userIdText: { fontSize: '12px', color: '#777' },
    section: { marginBottom: '32px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: '#444', marginBottom: '16px' }, // fontWeight: 'semibold' is not standard, changed to 'bold'
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
    card: { padding: '16px', borderRadius: '6px' },
    blueCard: { backgroundColor: '#e0f2fe' },
    orangeCard: { backgroundColor: '#fff3e0' },
    greenCard: { backgroundColor: '#e6fffa' },
    cardTitle: { fontSize: '16px', fontWeight: '500', marginBottom: '4px' },
    cardTextLarge: { fontSize: '24px', fontWeight: 'bold' },
    cardTextRed: { color: '#c53030' },
    cardTextGreen: { color: '#2f855a' },
    button: { backgroundColor: '#3b82f6', color: 'white', fontWeight: '600', padding: '12px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    buttonRed: { backgroundColor: '#ef4444', color: 'white', fontWeight: '500', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer'},
    debtItem: { padding: '16px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #fee2e2', marginBottom: '16px' },
    paymentItem: { padding: '16px', borderBottom: '1px solid #eee' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
    input: { boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }, // Added boxSizing
    select: { boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', backgroundColor: 'white' }, // Added boxSizing
    flexEnd: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    buttonGray: { backgroundColor: '#e5e7eb', color: '#374151', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    disabledButton: { backgroundColor: '#9ca3af', cursor: 'not-allowed' }
  };

  if (isLoading && !historialPagos.length && !deudasPendientes.length && saldo === INITIAL_MOCK_TENANT_PROFILE.balance) { // More robust loading check
    return <div style={styles.container}>Cargando datos del inquilino...</div>;
  }
  if (error) {
    return <div style={{...styles.container, color: 'red'}}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mis Pagos</h1>
        {userId && <p style={styles.userIdText}>Inquilino ID: {userId}</p>}
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Resumen Financiero</h2>
        <div style={styles.grid}>
          <div style={{...styles.card, ...styles.blueCard}}>
            <h3 style={{...styles.cardTitle, color: '#0c4a6e'}}>Saldo Actual</h3>
            <p style={{...styles.cardTextLarge, ...(saldo < 0 ? styles.cardTextRed : styles.cardTextGreen)}}>
              {formatCurrency(saldo)} {saldo < 0 ? "(Deuda)" : saldo > 0 ? "(A favor)" : ""}
            </p>
          </div>
          {proximoPago ? (
            <div style={{...styles.card, ...styles.orangeCard}}>
              <h3 style={{...styles.cardTitle, color: '#7c2d12'}}>Próximo Pago Pendiente</h3>
              <p style={{fontSize: '18px', fontWeight: '600', color: '#9a3412'}}>{proximoPago.concepto}</p>
              <p style={{...styles.cardTextLarge, color: '#c2410c'}}>{formatCurrency(proximoPago.monto)}</p>
              <p style={{fontSize: '14px', color: '#525252'}}>
                <CalendarIcon /> Vence: {formatDate(proximoPago.fechaVencimiento)}
              </p>
            </div>
          ) : (
            <div style={{...styles.card, ...styles.greenCard}}>
              <h3 style={{...styles.cardTitle, color: '#065f46'}}>Estado de Pagos</h3>
              <p style={{fontSize: '18px', fontWeight: '600', color: '#047857'}}>¡Estás al día con tus pagos!</p>
              <CheckCircleIcon />
            </div>
          )}
        </div>
        {deudasPendientes.length > 0 && (
          <button
            onClick={() => handleOpenPaymentModal()}
            style={{...styles.button, marginTop: '24px'}}
          >
            <CreditCardIcon /> <span style={{marginLeft: '8px'}}>Realizar un Pago</span>
          </button>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Deudas Pendientes</h2>
        {deudasPendientes.length > 0 ? (
          <div>
            {deudasPendientes.map((debt) => (
              <div key={debt.id} style={styles.debtItem}>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}> {/* Added flexWrap */}
                  <div style={{flexGrow: 1, marginRight: '10px'}}> {/* Added marginRight */}
                    <h3 style={{fontSize: '18px', fontWeight: '600', color: '#b91c1c'}}>{debt.concept}</h3>
                    <p style={{color: '#4b5563'}}>Monto: <span style={{fontWeight: 'bold'}}>{formatCurrency(debt.amount)}</span></p>
                    <p style={{fontSize: '14px', color: '#6b7280'}}>
                      <CalendarIcon /> Vence: {formatDate(debt.dueDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPaymentModal(debt)}
                    style={{...styles.buttonRed, marginTop: '10px'}} // Added marginTop for smaller screens
                  >
                    Pagar Esta Deuda
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '24px'}}>
            <CheckCircleIcon />
            <p style={{color: '#4b5563'}}>No tienes deudas pendientes en este momento.</p>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Historial de Pagos</h2>
        {historialPagos.length > 0 ? (
          <div style={{backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden'}}>
            <ul>
              {historialPagos.map((pago, index) => (
                <li key={pago.id} style={{...styles.paymentItem, ...(index === historialPagos.length -1 ? {borderBottom: 'none'} : {})}}>
                  <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}}> {/* Added flexWrap */}
                    <div style={{marginRight: '10px'}}> {/* Added marginRight */}
                      <p style={{fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>{pago.conceptPaid}</p>
                      <p style={{fontSize: '14px', color: '#6b7280'}}>Método: {pago.simulatedMethod}</p>
                      <p style={{fontSize: '14px', color: '#6b7280'}}>Recibo: {pago.receiptNumber}</p>
                    </div>
                    <div style={{textAlign: 'right', marginTop: '10px'}}> {/* Added marginTop */}
                      <p style={{fontSize: '18px', fontWeight: 'bold', color: '#16a34a'}}>{formatCurrency(pago.amount)}</p>
                      <p style={{fontSize: '14px', color: '#6b7280'}}><CalendarIcon /> {formatDate(pago.date)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '24px'}}>
            <InformationCircleIcon />
            <p style={{color: '#4b5563'}}>No hay pagos registrados en tu historial.</p>
          </div>
        )}
      </section>

      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>
              {selectedDebtToPay ? `Pagar: ${selectedDebtToPay.concept}` : "Realizar Pago General"}
            </h3>
            <div style={{marginBottom: '16px'}}>
              <label htmlFor="paymentAmount" style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px'}}>Monto a Pagar:</label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                disabled={!!selectedDebtToPay}
                style={styles.input}
              />
            </div>
            <div style={{marginBottom: '24px'}}>
              <label htmlFor="paymentMethod" style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px'}}>Método de Pago (Simulado):</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.select}
              >
                <option>Tarjeta de Crédito/Débito</option>
                <option>Transferencia Bancaria Ficticia</option>
                <option>PayPal Simulado</option>
              </select>
            </div>
            <div style={styles.flexEnd}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={styles.buttonGray}
              >
                Cancelar
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isLoading || paymentAmount <= 0}
                style={isLoading || paymentAmount <= 0 ? {...styles.button, ...styles.disabledButton} : styles.button }
              >
                {isLoading ? "Procesando..." : "Confirmar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantPayments;
