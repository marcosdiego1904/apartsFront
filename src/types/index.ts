// src/types/index.ts o src/types/app.ts

// Tipos para el Rol de Usuario
export type UserRole = 'manager' | 'tenant';

// --- Interfaz para el Usuario ---
// src/types/index.ts (Interfaz User)
export interface User {
    id: string; // o number, consistente con tu simulación/backend
    username: string;
    role: 'manager' | 'tenant';
    firstName?: string; // <-- Hacer opcional
    lastName?: string; // <-- Hacer opcional
    email?: string; // <-- Hacer opcional
    createdAt?: string; // <-- Hacer opcional (o el tipo de fecha correcto)
    updatedAt?: string; // <-- Hacer opcional
    // ... otras propiedades que necesites hacer opcionales
  }

// --- Interfaz para la Unidad (Departamento/Casa) ---
export interface Unit {
  id: number; // Identificador único de la unidad
  unitNumber: string; // Número o identificador de la unidad (ej: "Apt 101", "Casa 5")
  block?: string | null; // Bloque o torre (opcional)
  floor?: number | null; // Piso (opcional)
  tenantId?: number | null; // ID del inquilino asociado a esta unidad (null si está vacía)
  createdAt: string;
  updatedAt: string;
  // Podrías añadir más campos como:
  // surfaceArea?: number; // m²
  // numberOfBedrooms?: number;
  // numberOfBathrooms?: number;
}

// --- Interfaz para el Pago (Simulado) ---
export interface Payment {
  id: number; // Identificador único del pago
  unitId: number; // ID de la unidad asociada al pago
  tenantId: number; // ID del inquilino que realizó el pago
  amount: number; // Monto del pago
  paymentDate: string; // Fecha en que se realizó el pago (ej: "2023-10-27")
  description?: string | null; // Descripción o concepto del pago (ej: "Alquiler Octubre")
  status: 'pending' | 'completed' | 'failed'; // Estado del pago
  createdAt: string;
  updatedAt: string;
}

// --- Interfaz para la Solicitud de Mantenimiento ---
export interface MaintenanceRequest {
  id: number; // Identificador único de la solicitud
  unitId: number; // ID de la unidad de donde proviene la solicitud
  tenantId: number; // ID del inquilino que creó la solicitud
  title: string; // Título breve de la solicitud
  description: string; // Descripción detallada del problema
  status: 'open' | 'in-progress' | 'closed'; // Estado de la solicitud
  priority?: 'low' | 'medium' | 'high' | null; // Prioridad (opcional)
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null; 
}

// Update your interface definitions in src/services/api.ts

// Type for CreateUnitPayload
export type CreateUnitPayload = {
    unit_number: string;
    building?: string;
    // Change these to explicitly allow undefined but not null
    floor?: number | undefined;
    square_footage?: string | number | undefined;
    number_of_bedrooms?: number | undefined;
    number_of_bathrooms?: string | number | undefined;
    is_occupied?: boolean;
};

// Type for CreateUserPayload
export type CreateUserPayload = {
    first_name: string;
    last_name: string;
    email: string;
    // Make password optional for update scenarios
    password?: string;
    role: 'manager' | 'tenant';
    unit_id?: number | null;
    phone_number?: string;
    number_of_family_members?: number;
    is_active?: boolean;
};

// --- Interfaz para Registros de Pago de Alquiler (Historial del Inquilino) ---
export interface PaymentRecordProperties { // Nombre modificado para evitar colisión con Payment existente
  id: string;
  date: string; // Fecha legible del pago
  amount: number;
  concept: string; // Ej: "Alquiler Mayo 2024"
  status: 'completed' | 'pending' | 'failed' | 'reverted';
  tenantId: string;
  tenantName: string;
}

// --- Interfaz para Cargos Adicionales ---
export interface ChargeRecord {
  id: string;
  tenantId: string;
  tenantName: string; 
  amount: number;
  concept: string; // Ej: "Reparación ventana", "Multa por ruido"
  dateAssigned: string; // Fecha legible de asignación
  dateAssignedISO: string; // Fecha ISO para ordenación/procesamiento
  status: 'pending' | 'paid';
  paymentId?: string; // ID del PaymentRecordProperties que saldó este cargo
}

export interface PaymentDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}