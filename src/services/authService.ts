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
      // Otros campos...
    };
  }
  
  // Función de login (renombrada a minúscula y marcada como async)
  export const login = async ({ username, password }: Credentials): Promise<AuthResponse> => {
    console.log("Simulating login attempt for:", { username, password });
  
    // Simulamos una latencia de red de 1 a 2 segundos
    const latency = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, latency));
  
    // Simulación de la lógica de autenticación
    // Por ejemplo: si el usuario es 'test' y la contraseña es 'password123', tiene éxito
    if (username === 'test' && password === 'password123') {
      console.log("Simulated login successful!");
      // Simulamos una respuesta exitosa
      const simulatedResponse: AuthResponse = {
        token: 'fake-jwt-token-for-test-user',
        user: {
          id: 'user-123',
          username: 'test',
          role: 'manager', // O 'tenant' si quieres simular otro rol
        },
      };
      return Promise.resolve(simulatedResponse);
    } else {
      console.log("Simulated login failed: Invalid credentials.");
      // Simulamos un error (por ejemplo, credenciales incorrectas)
      return Promise.reject(new Error('Invalid username or password'));
      // O un mensaje de error más específico: return Promise.reject({ message: 'Credenciales incorrectas', status: 401 });
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