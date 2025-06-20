// src/services/authService.ts
import { MockBackendService } from './MockBackendService';

interface Credentials {
    username: string;
    password: string;
}

// Opcional: Define el tipo de datos que esperas que devuelva el backend al iniciar sesión
interface AuthResponse {
    token: string; // Un token JWT simulado
    user: { // Datos básicos del usuario simulado
        id: string;
        username: string;
        role: 'manager' | 'tenant'; // O los roles que definas
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

const mockBackendService = MockBackendService.getInstance();

// Función de login (renombrada a minúscula y marcada como async)
export const login = async ({ username, password }: Credentials): Promise<AuthResponse> => {
    console.log("Simulating login attempt for:", { username, password: '[HIDDEN]' });
    return mockBackendService.login({ username, password });
};

// Opcional: Función para cerrar sesión
export const logout = async (): Promise<void> => {
    console.log("Simulating logout");
    await mockBackendService.logout();
    return Promise.resolve();
};

export const getDemoCredentials = () => {
    return mockBackendService.getDemoCredentials();
};