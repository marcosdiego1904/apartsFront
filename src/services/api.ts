// src/services/api.ts
import axios from 'axios';

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
    is_occupied?: boolean; // El backend debería convertir 0/1 a booleano para la respuesta JSON
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

// (Aquí podrías añadir updateUnit y deleteUnit en el futuro)
// export const updateExistingUnit = async (id: number, unitData: Partial<CreateUnitPayload>): Promise<Unit> => {
//     const response = await axios.put<Unit>(`${API_BASE_URL}/units/${id}`, unitData);
//     return response.data;
// };
//
// export const deleteUnitById = async (id: number): Promise<void> => {
//     await axios.delete(`${API_BASE_URL}/units/${id}`);
// };

// -------------------- INTERFAZ y PAYLOAD PARA USER --------------------
// Representa los datos de un usuario que RECIBIMOS del backend.
// IMPORTANTE: NUNCA debe incluir password_hash.
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'manager' | 'tenant';
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
    password_raw: string; // Contraseña en texto plano que el backend hasheará
    role: 'manager' | 'tenant';
    unit_id?: number | null;
    phone_number?: string;
    number_of_family_members?: number;
    is_active?: boolean;
};

// -------------------- FUNCIONES API PARA USERS --------------------
// Asegúrate de que tu backend tenga endpoints como /users, /users/:id, etc.

export const getAllUsers = async (): Promise<User[]> => {
    const response = await axios.get<User[]>(`${API_BASE_URL}/users`);
    return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
    const response = await axios.get<User>(`${API_BASE_URL}/users/${id}`);
    return response.data;
};

export const createNewUser = async (userData: CreateUserPayload): Promise<User> => {
    const response = await axios.post<User>(`${API_BASE_URL}/users`, userData);
    return response.data;
};

// (Aquí podrías añadir updateUser y deleteUser en el futuro)
// export const updateExistingUser = async (id: number, userData: Partial<CreateUserPayload>): Promise<User> => {
//     // Para actualizar, no envíes password_raw a menos que estés cambiando la contraseña.
//     // El backend necesitará lógica para manejar esto (actualizar contraseña vs otros datos).
//     const response = await axios.put<User>(`${API_BASE_URL}/users/${id}`, userData);
//     return response.data;
// };
//
// export const deleteUserById = async (id: number): Promise<void> => {
//     await axios.delete(`${API_BASE_URL}/users/${id}`);
// };