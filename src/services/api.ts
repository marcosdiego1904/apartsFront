// src/services/api.ts
import axios from 'axios';
import type { UserRole } from '../types';

// La URL base de tu backend.
const API_BASE_URL = 'http://localhost:3001/api'; // Ajusta el puerto si es necesario

// -------------------- INTERFAZ y PAYLOAD PARA UNIT --------------------
export interface Unit {
    id: number;
    unit_number: string;
    building?: string | null;
    floor?: number | null;
    square_footage?: string | number | null; // DECIMAL puede venir como string
    number_of_bedrooms?: number | null;
    number_of_bathrooms?: string | number | null; // DECIMAL puede venir como string
    is_occupied?: boolean; // El backend debería convertir 0/1 a booleano (false/true) para la respuesta JSON
    created_at?: string; // Las fechas suelen venir como strings ISO desde el backend
    updated_at?: string;
}

export type CreateUnitPayload = {
    unit_number: string;
    building?: string;
    floor?: number;
    square_footage?: string | number;
    number_of_bedrooms?: number;
    number_of_bathrooms?: string | number;
    is_occupied?: boolean;
};

// -------------------- FUNCIONES API PARA UNITS --------------------
export const getAllUnits = async (): Promise<Unit[]> => {
    const response = await axios.get<Unit[]>(`${API_BASE_URL}/units`);
    return response.data;
};

export const getUnitById = async (id: number): Promise<Unit> => {
    const response = await axios.get<Unit>(`${API_BASE_URL}/units/${id}`);
    return response.data;
};

export const createNewUnit = async (unitData: CreateUnitPayload): Promise<Unit> => {
    const response = await axios.post<Unit>(`${API_BASE_URL}/units`, unitData);
    return response.data;
};

// -------------------- INTERFAZ y PAYLOAD PARA USER --------------------
// Representa los datos de un usuario que RECIBIMOS del backend.
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    unit_id?: number | null;
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
    unit_id?: number | null;
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
    unit_id: number | null;
    phone_number: string | null;
    number_of_family_members: number;
    is_active: boolean;
}>;

// -------------------- FUNCIONES API PARA USERS --------------------
export const getAllUsers = async (): Promise<User[]> => {
    const response = await axios.get<User[]>(`${API_BASE_URL}/users`);
    return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
    const response = await axios.get<User>(`${API_BASE_URL}/users/${id}`);
    return response.data;
};

// Add these functions to your existing src/services/api.ts file

// Additional user functions to create, update, and delete users
export const createNewUser = async (userData: CreateUserPayload): Promise<User> => {
    const response = await axios.post<User>(`${API_BASE_URL}/users`, userData);
    return response.data;
};

export const updateExistingUser = async (id: number, userData: Partial<CreateUserPayload>): Promise<User> => {
    const response = await axios.put<User>(`${API_BASE_URL}/users/${id}`, userData);
    return response.data;
};

export const updateUserStatus = async (id: number, isActive: boolean): Promise<User> => {
    const response = await axios.patch<User>(`${API_BASE_URL}/users/${id}/status`, { is_active: isActive });
    return response.data;
};

export const deleteUserById = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/users/${id}`);
};

// Additional unit functions
export const updateExistingUnit = async (id: number, unitData: Partial<CreateUnitPayload>): Promise<Unit> => {
    const response = await axios.put<Unit>(`${API_BASE_URL}/units/${id}`, unitData);
    return response.data;
};

export const deleteUnitById = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/units/${id}`);
};
