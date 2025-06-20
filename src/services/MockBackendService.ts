import type { PaymentRecordProperties, ChargeRecord } from '../types';

// Interfaces for Maintenance Requests, co-located for simplicity of the mock service.
// In a real backend, these would be defined by the API contract.
export interface MaintenanceRequestDisplayItem {
  id: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'general';
  dateSubmitted: string;
  status: 'sent' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  urgency: 'low' | 'medium' | 'high';
  tenantRating?: number;
  tenantComment?: string;
  isRatingSubmitted?: boolean;
  tenantId?: string;
}

// Interfaz para el Usuario, alineada con las necesidades del frontend y api.ts
// Reemplaza la importación para evitar conflictos y añadir campos necesarios.
export interface User {
  id: string;
  username: string;
  role: 'manager' | 'tenant';
  firstName: string; // Para compatibilidad con login existente
  lastName: string;  // Para compatibilidad con login existente
  email: string;
  // Propiedades de api.ts (snake_case)
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  unit_id?: number | null;
  number_of_family_members?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interfaz para la Unidad (Departamento/Casa)
// Definida aquí para la simplicidad del mock, consistente con api.ts
export interface Unit {
  id: string; // Usamos string para consistencia en el mock
  unit_number: string;
  building?: string | null;
  floor?: number | null;
  square_footage?: string | number | null;
  number_of_bedrooms?: number | null;
  number_of_bathrooms?: string | number | null;
  is_occupied?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: string;
  tenantName: string;
  unit: string;
  category: string;
  description: string;
  fullDescription: string;
  dateSubmitted: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'Rechazado';
  priority: 'Alta' | 'Media' | 'Baja';
  assignedTo?: string;
  managerComments?: string;
  tenantRating?: number;
  tenantComment?: string;
  isRatingSubmitted?: boolean;
}

export class MockBackendService {
  private static instance: MockBackendService;

  private _users: User[] = [];
  private _units: Unit[] = [];
  private _currentUser: User | null = null;
  private _authToken: string | null = null;
  private _paymentHistory: PaymentRecordProperties[] = [];
  private _chargesHistory: ChargeRecord[] = [];
  private _tenantSubmittedMaintenanceRequests: MaintenanceRequestDisplayItem[] = [];
  private _managedMaintenanceRequests: MaintenanceRequest[] = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): MockBackendService {
    if (!MockBackendService.instance) {
      MockBackendService.instance = new MockBackendService();
    }
    return MockBackendService.instance;
  }

  // Persist state to localStorage
  private _saveState() {
    try {
      const appState = {
        _users: this._users,
        _units: this._units,
        _paymentHistory: this._paymentHistory,
        _chargesHistory: this._chargesHistory,
        _tenantSubmittedMaintenanceRequests: this._tenantSubmittedMaintenanceRequests,
        _managedMaintenanceRequests: this._managedMaintenanceRequests,
        // No guardamos _currentUser o _authToken aquí, eso lo maneja AuthContext.
      };
      localStorage.setItem('mockBackendState', JSON.stringify(appState));
      console.log('Mock backend state saved to localStorage.');
    } catch (error) {
      console.error('Error saving mock backend state to localStorage:', error);
    }
  }

  // Load state from localStorage or seed initial data
  private init() {
    console.log('MockBackendService initializing...');
    try {
      const savedState = localStorage.getItem('mockBackendState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this._users = parsedState._users || [];
        this._units = parsedState._units || [];
        this._paymentHistory = parsedState._paymentHistory || [];
        this._chargesHistory = parsedState._chargesHistory || [];
        this._tenantSubmittedMaintenanceRequests = parsedState._tenantSubmittedMaintenanceRequests || [];
        this._managedMaintenanceRequests = parsedState._managedMaintenanceRequests || [];
        console.log('Mock backend state restored from localStorage.');
      } else {
        console.log('No saved state found. Seeding initial data.');
        this._seedInitialData();
        this._saveState(); // Guardar el estado inicial
      }
    } catch (error) {
      console.error('Error initializing mock backend state:', error);
      // Si hay error, empezar de cero
      this._seedInitialData();
      this._saveState();
    }
  }

  // Resets all data to its initial state
  public resetData(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Resetting mock backend data...');
      localStorage.removeItem('mockBackendState');
      this._seedInitialData();
      this._saveState();
      console.log('Mock backend data has been reset.');
      resolve();
    });
  }

  private _seedInitialData() {
    // This method contains the original initialization logic
    const nowISO = new Date().toISOString();
    this._users = [
      {
        id: '1',
        username: 'manager',
        role: 'manager',
        firstName: 'John',
        lastName: 'Doe',
        email: 'manager@test.com',
        // --- Propiedades extendidas de `api.ts` ---
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '123-456-7890',
        unit_id: null,
        number_of_family_members: 0,
        is_active: true,
        created_at: nowISO,
        updated_at: nowISO,
      },
      {
        id: '2',
        username: 'tenant',
        role: 'tenant',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'tenant@test.com',
        // --- Propiedades extendidas de `api.ts` ---
        first_name: 'Jane',
        last_name: 'Doe',
        phone_number: '098-765-4321',
        unit_id: 101, // Asignada a la unidad 101
        number_of_family_members: 2,
        is_active: true,
        created_at: nowISO,
        updated_at: nowISO,
      },
       {
        id: '3',
        username: 'tenant2',
        role: 'tenant',
        firstName: 'Peter',
        lastName: 'Jones',
        email: 'peter.jones@test.com',
        first_name: 'Peter',
        last_name: 'Jones',
        phone_number: '555-555-5555',
        unit_id: 102, // Asignado a la unidad 102
        number_of_family_members: 1,
        is_active: false, // Inactivo
        created_at: nowISO,
        updated_at: nowISO,
      },
    ];
    this._units = [
      {
        id: '101',
        unit_number: 'A-101',
        building: 'A',
        floor: 1,
        is_occupied: true,
        number_of_bedrooms: 2,
        number_of_bathrooms: 1,
        square_footage: '750 sq ft',
        created_at: nowISO,
        updated_at: nowISO,
      },
      {
        id: '102',
        unit_number: 'A-102',
        building: 'A',
        floor: 1,
        is_occupied: false,
        number_of_bedrooms: 1,
        number_of_bathrooms: 1,
        square_footage: '500 sq ft',
        created_at: nowISO,
        updated_at: nowISO,
      },
      {
        id: '201',
        unit_number: 'B-201',
        building: 'B',
        floor: 2,
        is_occupied: false,
        number_of_bedrooms: 3,
        number_of_bathrooms: 2,
        square_footage: '1100 sq ft',
        created_at: nowISO,
        updated_at: nowISO,
      },
    ];

    // Initialize with some mock payment and charge history
    const tenantId = '2'; // Corresponds to Jane Doe
    const tenantName = 'Jane Doe';
    const now = new Date();
    
    this._paymentHistory = [
      {
        id: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
        date: new Date(now.getFullYear(), now.getMonth() - 2, 15).toLocaleDateString('es-ES'),
        amount: 150.75,
        concept: `Alquiler ${getMonthYearString(new Date(now.getFullYear(), now.getMonth() - 2, 1))}`,
        status: 'completed',
        tenantId,
        tenantName,
      },
      {
        id: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
        date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toLocaleDateString('es-ES'),
        amount: 150.75,
        concept: `Alquiler ${getMonthYearString(new Date(now.getFullYear(), now.getMonth() - 1, 1))}`,
        status: 'completed',
        tenantId,
        tenantName,
      }
    ];

    this._chargesHistory = [
      {
        id: `charge-${new Date().getTime()}`,
        tenantId,
        tenantName,
        amount: 50,
        concept: 'Reparación de ventana',
        dateAssigned: new Date(now.getFullYear(), now.getMonth() - 1, 5).toLocaleDateString('es-ES'),
        dateAssignedISO: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(),
        status: 'pending',
      },
      {
        id: `charge-${new Date().getTime() + 1}`,
        tenantId,
        tenantName,
        amount: 25,
        concept: 'Multa por ruido',
        dateAssigned: new Date(now.getFullYear(), now.getMonth() - 1, 10).toLocaleDateString('es-ES'),
        dateAssignedISO: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
        status: 'paid',
        paymentId: this._paymentHistory[1].id,
      }
    ];

    // Initialize with some mock maintenance requests
    const tenantRequestId = `REQ-${new Date().getTime()}`;
    this._tenantSubmittedMaintenanceRequests = [
      {
        id: tenantRequestId,
        tenantId: tenantId,
        title: 'Grifo de la cocina gotea',
        description: 'El grifo de la cocina ha estado goteando constantemente durante los últimos dos días.',
        category: 'plumbing',
        urgency: 'medium',
        dateSubmitted: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'sent',
        isRatingSubmitted: false,
      }
    ];

    this._managedMaintenanceRequests = []; // Starts empty, will be populated by logic
  }

  public login(credentials: any): Promise<{ user: User; token: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = this._users.find(
          (u) => u.username === credentials.username && 'password' in credentials // Simplified check
        );

        if (user) {
          this._currentUser = user;
          this._authToken = `mock-token-for-${user.id}`;
          console.log(`User ${user.username} logged in.`);
          resolve({ user, token: this._authToken });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }

  public logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`User ${this._currentUser?.username} logged out.`);
        this._currentUser = null;
        this._authToken = null;
        resolve();
      }, 200);
    });
  }

  public getCurrentUser(): User | null {
    return this._currentUser;
  }

  public getAuthToken(): string | null {
    return this._authToken;
  }

  public getDemoCredentials() {
    return [
      { user: this._users.find(u => u.role === 'manager'), password: 'password' },
      { user: this._users.find(u => u.role === 'tenant'), password: 'password' }
    ];
  }

  // --- Payment and Charge Methods ---

  public getPaymentHistory(tenantId: string): Promise<PaymentRecordProperties[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const history = this._paymentHistory.filter((p) => p.tenantId === tenantId);
        resolve(history);
      }, 300);
    });
  }

  public getAllPaymentHistory(): Promise<PaymentRecordProperties[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this._paymentHistory]);
      }, 300);
    });
  }

  public getCharges(tenantId: string): Promise<ChargeRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const charges = this._chargesHistory.filter((c) => c.tenantId === tenantId);
        resolve(charges);
      }, 300);
    });
  }

  public getAllCharges(): Promise<ChargeRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this._chargesHistory]);
      }, 300);
    });
  }

  public makePayment(paymentData: {
    tenantId: string;
    tenantName: string;
    amount: number;
    concept: string;
    rentalPaidThisTransaction: boolean;
    paidChargesDetails: {id: string, concept: string, amount: number}[];
    paymentId: string;
  }): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 1. Add to payment history if rent was paid
        if (paymentData.rentalPaidThisTransaction) {
            const newPayment: PaymentRecordProperties = {
                id: paymentData.paymentId,
                date: new Date().toLocaleDateString('es-ES'),
                amount: paymentData.amount,
                concept: paymentData.concept,
                status: 'completed',
                tenantId: paymentData.tenantId,
                tenantName: paymentData.tenantName,
            };
            this._paymentHistory.push(newPayment);
        }

        // 2. Update charges that were paid
        const paidChargeIds = paymentData.paidChargesDetails.map(d => d.id);
        this._chargesHistory = this._chargesHistory.map(charge => {
            if (paidChargeIds.includes(charge.id)) {
                return { ...charge, status: 'paid', paymentId: paymentData.paymentId };
            }
            return charge;
        });

        console.log('Payment processed by mock backend:', paymentData);
        this._saveState();
        resolve();
      }, 500);
    });
  }

  public updatePaymentStatus(paymentId: string, status: 'completed' | 'reverted'): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const payment = this._paymentHistory.find(p => p.id === paymentId);
        if (payment) {
          payment.status = status;
          this._saveState();
          resolve();
        } else {
          reject(new Error('Payment not found'));
        }
      }, 300);
    });
  }

  public assignCharge(charge: ChargeRecord): Promise<ChargeRecord> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this._chargesHistory.push(charge);
        this._saveState();
        resolve(charge);
      }, 300);
    });
  }
  
  public updateChargeStatus(chargeId: string, status: 'pending' | 'deactivated' | 'paid'): Promise<void> {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const charge = this._chargesHistory.find(c => c.id === chargeId);
              if (charge) {
                  charge.status = status;
                  this._saveState();
                  resolve();
              } else {
                  reject(new Error('Charge not found'));
              }
          }, 300);
      });
  }

  // --- Maintenance Request Methods ---

  public getTenantRequests(tenantId: string): Promise<MaintenanceRequestDisplayItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = this._tenantSubmittedMaintenanceRequests.filter(
          (r) => r.tenantId === tenantId
        );
        resolve(requests);
      }, 300);
    });
  }

  public submitRequest(request: MaintenanceRequestDisplayItem): Promise<MaintenanceRequestDisplayItem> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this._tenantSubmittedMaintenanceRequests.push(request);
        const managedRequest = this.transformTenantRequest(request);
        this._managedMaintenanceRequests.push(managedRequest);
        this._saveState();
        resolve(request);
      }, 500);
    });
  }

  public getManagedRequests(): Promise<MaintenanceRequest[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // This logic is moved from ManagerMaintenanceView.tsx
        let managedRequests = [...this._managedMaintenanceRequests];
        const tenantSubmittedItems = [...this._tenantSubmittedMaintenanceRequests];

        const tenantFeedbackMap = new Map();
        tenantSubmittedItems.forEach(item => {
            if (item.isRatingSubmitted || item.tenantRating !== undefined) {
                tenantFeedbackMap.set(item.id, {
                    tenantRating: item.tenantRating,
                    tenantComment: item.tenantComment,
                    isRatingSubmitted: item.isRatingSubmitted,
                });
            }
        });

        managedRequests = managedRequests.map(managedReq => {
            const feedback = tenantFeedbackMap.get(managedReq.id);
            if (feedback) {
                return { ...managedReq, ...feedback };
            }
            return managedReq;
        });

        const managedRequestIds = new Set(managedRequests.map(req => req.id));
        const newTransformedRequests = tenantSubmittedItems
            .filter(tenantItem => !managedRequestIds.has(tenantItem.id))
            .map(this.transformTenantRequest);

        const combinedRequests = [...managedRequests, ...newTransformedRequests];
        this._managedMaintenanceRequests = combinedRequests; // Persist the merged state
        
        console.log('Mock backend: returning managed requests', combinedRequests);
        this._saveState();
        resolve(combinedRequests);
      }, 500);
    });
  }

  public updateManagedRequest(updatedRequest: MaintenanceRequest): Promise<MaintenanceRequest> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = this._managedMaintenanceRequests.findIndex(r => r.id === updatedRequest.id);
            if (index !== -1) {
                this._managedMaintenanceRequests[index] = updatedRequest;
                this._saveState();
                resolve(updatedRequest);
            } else {
                reject(new Error("Request not found"));
            }
        }, 300);
    });
  }

  public submitRating(ratingInfo: { requestId: string; rating: number; comment: string; }): Promise<void> {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const tenantRequest = this._tenantSubmittedMaintenanceRequests.find(r => r.id === ratingInfo.requestId);
              const managedRequest = this._managedMaintenanceRequests.find(r => r.id === ratingInfo.requestId);

              if (tenantRequest && managedRequest) {
                  tenantRequest.tenantRating = ratingInfo.rating;
                  tenantRequest.tenantComment = ratingInfo.comment;
                  tenantRequest.isRatingSubmitted = true;
                  
                  managedRequest.tenantRating = ratingInfo.rating;
                  managedRequest.tenantComment = ratingInfo.comment;

                  this._saveState();
                  resolve();
              } else {
                  reject(new Error('Request not found for rating submission'));
              }
          }, 500);
      });
  }

  private transformTenantRequest = (tenantRequest: MaintenanceRequestDisplayItem): MaintenanceRequest => {
    // This logic is also from ManagerMaintenanceView.tsx
    let managerCategory = '';
    switch (tenantRequest.category) {
        case 'plumbing': managerCategory = 'Plomería'; break;
        case 'electrical': managerCategory = 'Electricidad'; break;
        case 'appliance': managerCategory = 'Electrodomésticos'; break;
        case 'general': managerCategory = 'General'; break;
        default: managerCategory = 'Desconocida';
    }

    let managerPriority: MaintenanceRequest['priority'] = 'Baja';
    switch (tenantRequest.urgency) {
        case 'high': managerPriority = 'Alta'; break;
        case 'medium': managerPriority = 'Media'; break;
        case 'low': managerPriority = 'Baja'; break;
    }

    const tenantUser = this._users.find(u => u.id === tenantRequest.tenantId);
    const tenantName = tenantUser ? `${tenantUser.firstName} ${tenantUser.lastName}` : "Inquilino Desconocido";
    const unitNumber = `Apt ${(Math.floor(Math.random() * 10) + 1)}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`;

    return {
        id: tenantRequest.id,
        tenantName: tenantName,
        unit: unitNumber,
        category: managerCategory,
        description: tenantRequest.title,
        fullDescription: tenantRequest.description,
        dateSubmitted: tenantRequest.dateSubmitted,
        status: 'Pendiente',
        priority: managerPriority,
        assignedTo: '',
        managerComments: '',
        tenantRating: tenantRequest.tenantRating,
        tenantComment: tenantRequest.tenantComment,
        isRatingSubmitted: tenantRequest.isRatingSubmitted,
    };
  };

  // --- Dashboard-specific Methods ---

  public getTenantDashboardData(tenantId: string): Promise<any> {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const tenantUser = this._users.find(u => u.id === tenantId);
            if (!tenantUser) {
                // In a real app, you'd reject or handle this case
                resolve({ nextPayment: null, maintenanceRequests: [], pendingCharges: [] });
                return;
            }

            // --- Fetch Raw Data using internal methods ---
            const tenantPayments = await this.getPaymentHistory(tenantId);
            const pendingCharges = (await this.getCharges(tenantId)).filter(c => c.status === 'pending');
            const tenantSubmittedReqs = await this.getTenantRequests(tenantId);
            
            // Note: In this mock, getManagedRequests merges and returns ALL requests.
            // For the tenant dashboard, we only need statuses for the tenant's own requests.
            const allManaged = await this.getManagedRequests(); 
            const managedStatusMap = new Map(allManaged.map(req => [req.id, req.status]));

            // --- Process Maintenance Requests ---
            const allTenantRequests = tenantSubmittedReqs
                .map(req => {
                    const managerStatus = managedStatusMap.get(req.id);
                    let finalStatus = req.status;
                    if (managerStatus) {
                        switch (managerStatus) {
                            case 'Pendiente': finalStatus = 'sent'; break;
                            case 'En Progreso': finalStatus = 'in-progress'; break;
                            case 'Completado': finalStatus = 'completed'; break;
                            case 'Rechazado': finalStatus = 'cancelled'; break;
                        }
                    }
                    return { ...req, status: finalStatus };
                })
                .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());

            const recentMaintenanceSummary = allTenantRequests
                .slice(0, 3)
                .map((req: any) => ({
                    id: req.id,
                    title: req.title,
                    status: req.status,
                    dateSubmitted: new Date(req.dateSubmitted).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                }));

            // --- Calculate Next Payment ---
            const getMonthYearString = (date: Date): string => date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            const getFirstDayOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
            const getFirstDayOfNextMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 1);
            
            const determineNextPayableMonth = (payments: PaymentRecordProperties[], initialDate: Date | null): Date | null => {
                if (!initialDate) return null;
                let currentDate = getFirstDayOfMonth(new Date(initialDate));
                const isRentForMonthPaid = (monthDate: Date): boolean => {
                    const targetConceptPrefix = `Alquiler ${getMonthYearString(monthDate)}`;
                    return payments.some(p => p.status === 'completed' && p.concept.startsWith(targetConceptPrefix));
                };
                let attempts = 0;
                while (attempts < 240) {
                    if (!isRentForMonthPaid(currentDate)) return currentDate;
                    currentDate = getFirstDayOfNextMonth(currentDate);
                    attempts++;
                }
                return null;
            };

            const DEFAULT_MONTHLY_AMOUNT = 150.75;
            const PAYMENT_DUE_DAY = 15;
            const baseDateForSearchLogic = tenantUser.created_at ? new Date(tenantUser.created_at) : new Date();
            const nextPayableMonthDate = determineNextPayableMonth(tenantPayments, baseDateForSearchLogic);
            const totalPendingCharges = pendingCharges.reduce((sum, charge) => sum + charge.amount, 0);
            
            let nextPaymentData = null;
            if (nextPayableMonthDate) {
                const dueDate = new Date(nextPayableMonthDate.getFullYear(), nextPayableMonthDate.getMonth(), PAYMENT_DUE_DAY);
                nextPaymentData = {
                    amount: DEFAULT_MONTHLY_AMOUNT + totalPendingCharges,
                    dueDate: dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'}),
                    daysLeft: Math.max(0, Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))),
                };
            } else if (totalPendingCharges > 0) {
                nextPaymentData = {
                    amount: totalPendingCharges,
                    dueDate: "Cargos Adicionales Pendientes",
                    daysLeft: 0,
                };
            }

            resolve({
                nextPayment: nextPaymentData,
                maintenanceRequestSummary: recentMaintenanceSummary,
                pendingCharges: pendingCharges,
                allTenantMaintenanceRequests: allTenantRequests // Pass this to the form
            });
        }, 600);
    });
  }

  public getManagerDashboardData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        // --- Fetch Raw Data ---
        // We call getManagedRequests() first to ensure the internal list is synchronized
        const managedRequests = await this.getManagedRequests();
        const allPayments = await this.getAllPaymentHistory();
        const allCharges = await this.getAllCharges();

        // --- Process Data ---
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const parseDate = (dateString: string): Date | null => {
            if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return null;
            const parts = dateString.split('/');
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        };

        const pendingCharges = allCharges.filter(c => c.status === 'pending');
        const paymentsSummary = {
          totalPending: pendingCharges.reduce((sum, charge) => sum + charge.amount, 0),
          pendingCount: pendingCharges.length,
          receivedThisMonth: allPayments
            .filter(p => {
                const paymentDate = parseDate(p.date);
                return p.status === 'completed' && paymentDate && paymentDate >= firstDayOfMonth;
            })
            .reduce((sum, p) => sum + p.amount, 0),
          receivedThisMonthCount: allPayments.filter(p => {
              const paymentDate = parseDate(p.date);
              return p.status === 'completed' && paymentDate && paymentDate >= firstDayOfMonth;
          }).length,
        };

        const maintenanceSummary = {
          pending: managedRequests.filter(r => r.status === 'Pendiente').length,
          inProgress: managedRequests.filter(r => r.status === 'En Progreso').length,
          completedThisMonth: managedRequests.filter(r => {
            const completedDate = new Date(r.dateSubmitted); // Assuming dateSubmitted is ISO string
            return r.status === 'Completado' && completedDate >= firstDayOfMonth;
          }).length,
        };
        
        resolve({
          payments: paymentsSummary,
          maintenance: maintenanceSummary,
        });

      }, 700);
    });
  }

  // --- User Management Methods (CRUD) ---

  public getAllUsers(): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Devolvemos una copia para no exponer el array interno
        resolve(JSON.parse(JSON.stringify(this._users)));
      }, 300);
    });
  }

  public createNewUser(userData: any): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // --- Validación de Email Duplicado ---
        const emailExists = this._users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
        if (emailExists) {
          return reject(new Error(`A user with the email ${userData.email} already exists.`));
        }

        const newUser: User = {
          id: String(new Date().getTime()), // ID único simple
          username: userData.email.split('@')[0], // username a partir de email
          role: userData.role,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          // Propiedades extendidas
          first_name: userData.first_name,
          last_name: userData.last_name,
          unit_id: userData.unit_id,
          phone_number: userData.phone_number,
          number_of_family_members: userData.number_of_family_members,
          is_active: userData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this._users.push(newUser);
        this._saveState();
        resolve(JSON.parse(JSON.stringify(newUser)));
      }, 500);
    });
  }

  public updateExistingUser(userId: string, userData: Partial<any>): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = this._users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          return reject(new Error('User not found'));
        }
        const updatedUser = { 
            ...this._users[userIndex], 
            ...userData,
            // Sincronizar camelCase y snake_case si es necesario
            ...(userData.first_name && { firstName: userData.first_name }),
            ...(userData.last_name && { lastName: userData.last_name }),
            updated_at: new Date().toISOString()
        };
        this._users[userIndex] = updatedUser;
        this._saveState();
        resolve(JSON.parse(JSON.stringify(updatedUser)));
      }, 500);
    });
  }

  public deleteUserById(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = this._users.length;
        this._users = this._users.filter(u => u.id !== userId);
        if (this._users.length === initialLength) {
          return reject(new Error('User not found to delete'));
        }
        this._saveState();
        resolve();
      }, 500);
    });
  }

  // --- Unit Management Methods (CRUD) ---

  public getAllUnits(): Promise<Unit[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(this._units)));
      }, 300);
    });
  }

  public createNewUnit(unitData: any): Promise<Unit> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUnit: Unit = {
          id: String(new Date().getTime()), // ID único
          ...unitData,
          is_occupied: unitData.is_occupied || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this._units.push(newUnit);
        this._saveState();
        resolve(JSON.parse(JSON.stringify(newUnit)));
      }, 500);
    });
  }

  public updateExistingUnit(unitId: string, unitData: Partial<any>): Promise<Unit> {
     return new Promise((resolve, reject) => {
      setTimeout(() => {
        const unitIndex = this._units.findIndex(u => u.id === unitId);
        if (unitIndex === -1) {
          return reject(new Error('Unit not found'));
        }
        const updatedUnit = { 
            ...this._units[unitIndex], 
            ...unitData,
            updated_at: new Date().toISOString() 
        };
        this._units[unitIndex] = updatedUnit;
        this._saveState();
        resolve(JSON.parse(JSON.stringify(updatedUnit)));
      }, 500);
    });
  }

  public deleteUnitById(unitId: string): Promise<void> {
    return new Promise((resolve, reject) => {
       setTimeout(() => {
        const initialLength = this._units.length;
        this._units = this._units.filter(u => u.id !== unitId);
        if (this._units.length === initialLength) {
          return reject(new Error('Unit not found to delete'));
        }

        // --- Desvincular usuarios de la unidad eliminada ---
        this._users = this._users.map(user => {
          if (user.unit_id === Number(unitId)) {
            console.log(`Unlinking user ${user.username} from deleted unit ${unitId}`);
            return { ...user, unit_id: null };
          }
          return user;
        });

        this._saveState();
        resolve();
      }, 500);
    });
  }
}

// Helper function to get month and year string, assuming it's not exported from dateUtils
function getMonthYearString(date: Date): string {
  const month = date.toLocaleString('es-ES', { month: 'long' });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
} 