// src/services/authService.ts

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

// Credenciales de demo para diferentes roles
const DEMO_USERS = [
    {
        username: 'manager',
        password: 'manager123',
        userData: {
            id: 'manager-001',
            username: 'manager',
            role: 'manager' as const,
            firstName: 'Admin',
            lastName: 'Manager',
            email: 'manager@demo.com'
        }
    },
    {
        username: 'tenant',
        password: 'tenant123',
        userData: {
            id: 'tenant-001',
            username: 'tenant',
            role: 'tenant' as const,
            firstName: 'John',
            lastName: 'Doe',
            email: 'tenant@demo.com'
        }
    },
    // Credenciales alternativas para mayor flexibilidad
    {
        username: 'test',
        password: 'password123',
        userData: {
            id: 'user-123',
            username: 'test',
            role: 'manager' as const,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@demo.com'
        }
    },
    {
        username: 'inquilino',
        password: 'inquilino123',
        userData: {
            id: 'tenant-002',
            username: 'inquilino',
            role: 'tenant' as const,
            firstName: 'María',
            lastName: 'García',
            email: 'maria.garcia@demo.com'
        }
    }
];

// Función de login (renombrada a minúscula y marcada como async)
export const login = async ({ username, password }: Credentials): Promise<AuthResponse> => {
    console.log("Simulating login attempt for:", { username, password: '[HIDDEN]' });

    // Simulamos una latencia de red de 1 a 2 segundos
    const latency = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, latency));

    // Buscar usuario en las credenciales de demo
    const demoUser = DEMO_USERS.find(user => 
        user.username === username && user.password === password
    );

    if (demoUser) {
        console.log(`Simulated login successful for ${demoUser.userData.role}!`);
        
        // Simulamos una respuesta exitosa
        const simulatedResponse: AuthResponse = {
            token: `fake-jwt-token-for-${demoUser.userData.role}-${demoUser.userData.id}`,
            user: demoUser.userData,
        };
        
        return Promise.resolve(simulatedResponse);
    } else {
        console.log("Simulated login failed: Invalid credentials.");
        
        // Mostrar credenciales disponibles en desarrollo
        console.log("Available demo credentials:");
        DEMO_USERS.forEach(user => {
            console.log(`  ${user.userData.role}: ${user.username} / ${user.password}`);
        });
        
        // Simulamos un error (credenciales incorrectas)
        return Promise.reject(new Error('Invalid username or password'));
    }
};

// Opcional: Función para cerrar sesión
export const logout = async (): Promise<void> => {
    console.log("Simulating logout");
    // En un caso real, aquí harías una llamada a la API de logout si es necesario
    // Limpiarías el token del localStorage
    localStorage.removeItem('authToken');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular latencia
    return Promise.resolve();
};

// Función de utilidad para obtener las credenciales de demo (útil para desarrollo)
export const getDemoCredentials = () => {
    return DEMO_USERS.map(user => ({
        username: user.username,
        password: user.password,
        role: user.userData.role,
        name: `${user.userData.firstName} ${user.userData.lastName}`
    }));
};