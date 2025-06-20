// src/services/api.ts
import axios from 'axios';
import type { UserRole } from '../types';
import { MockBackendService } from './MockBackendService';

// ==================== CONTROL FLAG ====================
// Cambia a 'false' para usar el backend real con Axios.
export const useMockService = true;

// Obtener una instancia del servicio de mock
const mockService = MockBackendService.getInstance();

// La URL base de tu backend.
export const API_BASE_URL = 'http://localhost:3001/api'; // Ajusta el puerto si es necesario

// -------------------- INTERFAZ y PAYLOAD PARA UNIT --------------------
export interface Unit {
    id: string;
    unit_number: string;
    building: string | null;
    floor: number | null;
    square_footage: string | null;
    number_of_bedrooms: number | null;
    number_of_bathrooms: string | null;
    is_occupied: boolean | null;
    tenant_id?: string | null; // Make tenant_id optional
    created_at?: string; // Las fechas suelen venir como strings ISO desde el backend
    updated_at?: string;
}

export interface CreateUnitPayload {
    unit_number: string;
    building?: string;
    floor?: number;
    square_footage?: string;
    number_of_bedrooms?: number;
    number_of_bathrooms?: string;
    is_occupied?: boolean;
    tenant_id?: string | null; // Make tenant_id optional
}

// -------------------- FUNCIONES API PARA UNITS --------------------
export const getAllUnits = async (): Promise<Unit[]> => {
    if (useMockService) {
        return await mockService.getAllUnits();
    }
    const response = await axios.get<Unit[]>(`${API_BASE_URL}/units`);
    return response.data;
};

export const getUnitById = async (id: string): Promise<Unit> => {
    if (useMockService) {
        const mockUnit = await mockService.getAllUnits().then(units => units.find(u => u.id === id));
        if (!mockUnit) throw new Error('Unit not found in mock');
        return mockUnit;
    }
    const response = await axios.get<Unit>(`${API_BASE_URL}/units/${id}`);
    return response.data;
};

export const createNewUnit = async (unitData: CreateUnitPayload): Promise<Unit> => {
    if (useMockService) {
        return await mockService.createNewUnit(unitData);
    }
    const response = await axios.post<Unit>(`${API_BASE_URL}/units`, unitData);
    return response.data;
};

// -------------------- INTERFAZ y PAYLOAD PARA USER --------------------
// Representa los datos de un usuario que RECIBIMOS del backend.
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    unit_id?: string | null;
    // Si tu backend une y devuelve detalles de la unidad, podrías tener:
    // unit?: { id: number; unit_number: string; };
    phone_number?: string | null;
    number_of_family_members?: number;
    is_active?: boolean; // El backend debería convertir 0/1 a booleano
    created_at?: string;
    updated_at?: string;
}

// Representa los datos que ENVIAMOS al backend para crear un usuario.
export type CreateUserPayload = {
    first_name: string;
    last_name: string;
    email: string;
    password: string; // Contraseña en texto plano que el backend hasheará
    role: UserRole;
    unit_id?: string | null;
    phone_number?: string;
    number_of_family_members?: number;
    is_active?: boolean;
};

// Tipo para actualizar un usuario
export type UpdateUserPayload = Partial<{
    first_name: string;
    last_name: string;
    email: string;
    password: string; // Para cambiar la contraseña (opcional)
    role: UserRole;
    unit_id: string | null;
    phone_number: string | null;
    number_of_family_members: number;
    is_active: boolean;
}>;

// -------------------- FUNCIONES API PARA USERS --------------------
export const getAllUsers = async (): Promise<User[]> => {
    if (useMockService) {
        return await mockService.getAllUsers();
    }
    const response = await axios.get<User[]>(`${API_BASE_URL}/users`);
    return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
    if (useMockService) {
        const users = await mockService.getAllUsers();
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found in mock');
        return user;
    }
    const response = await axios.get<User>(`${API_BASE_URL}/users/${id}`);
    return response.data;
};

// Add these functions to your existing src/services/api.ts file

// Additional user functions to create, update, and delete users
export const createNewUser = async (userData: CreateUserPayload): Promise<User> => {
    if (useMockService) {
        return await mockService.createNewUser(userData);
    }
    const response = await axios.post<User>(`${API_BASE_URL}/users`, userData);
    return response.data;
};

export const updateExistingUser = async (id: string, userData: Partial<CreateUserPayload>): Promise<User> => {
    if (useMockService) {
        return await mockService.updateExistingUser(id, userData);
    }
    const response = await axios.put<User>(`${API_BASE_URL}/users/${id}`, userData);
    return response.data;
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<User> => {
    if (useMockService) {
        return await mockService.updateExistingUser(id, { is_active: isActive });
    }
    const response = await axios.patch<User>(`${API_BASE_URL}/users/${id}/status`, { is_active: isActive });
    return response.data;
};
// Additional unit functions
export const updateExistingUnit = async (id: string, unitData: Partial<CreateUnitPayload>): Promise<Unit> => {
    if (useMockService) {
        return await mockService.updateExistingUnit(id, unitData);
    }
    const response = await axios.put<Unit>(`${API_BASE_URL}/units/${id}`, unitData);
    return response.data;
};

export const deleteUnitById = async (id: string): Promise<void> => {
    if (useMockService) {
        return await mockService.deleteUnitById(id);
    }
    await axios.delete(`${API_BASE_URL}/units/${id}`);
};
// Añadir esta función a src/services/api.ts si no existe

export const deleteUserById = async (id: string): Promise<void> => {
    if (useMockService) {
        return await mockService.deleteUserById(id);
    }
    await axios.delete(`${API_BASE_URL}/users/${id}`);
};

// -------------------- FUNCIONES DE SEED PARA DATOS DE EJEMPLO --------------------

// Función para poblar usuarios de ejemplo
export const seedSampleUsers = async (): Promise<{ message: string; usersCreated: number }> => {
    const response = await axios.post<{ message: string; usersCreated: number }>(`${API_BASE_URL}/seed/users`);
    return response.data;
};

// Función para poblar unidades de ejemplo
export const seedSampleUnits = async (): Promise<{ message: string; unitsCreated: number }> => {
    const response = await axios.post<{ message: string; unitsCreated: number }>(`${API_BASE_URL}/seed/units`);
    return response.data;
};

// Función para poblar todo (usuarios y unidades)
export const seedAllSampleData = async (): Promise<{ message: string; usersCreated: number; unitsCreated: number }> => {
    const response = await axios.post<{ message: string; usersCreated: number; unitsCreated: number }>(`${API_BASE_URL}/seed/all`);
    return response.data;
};

// Función para verificar si hay datos en el sistema
export const checkDataStatus = async (): Promise<{ hasUsers: boolean; hasUnits: boolean; userCount: number; unitCount: number }> => {
    const response = await axios.get<{ hasUsers: boolean; hasUnits: boolean; userCount: number; unitCount: number }>(`${API_BASE_URL}/seed/status`);
    return response.data;
};

/* API Service - Ahora usa ApiAdapter para migración gradual
 * Mantiene la misma interfaz pero delega a MockBackendService cuando está habilitado
 */ 
// import { ApiAdapter } from './apiAdapter';

// ==================== UNITS API ====================