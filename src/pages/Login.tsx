// src/pages/LoginPage.tsx
import { useState } from 'react';
import styles from './LoginPage.module.css';
import { Input } from '../components/Input';
import { Buttons } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDemoCredentials } from '../services/authService';

export const LoginPage = () => {
  const [userNameValue, setUserNameValue] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const { login: loginContext } = useAuth();
  const navigate = useNavigate();

  // Obtener credenciales de demo para mostrar al usuario
  const demoCredentials = getDemoCredentials();

  const handleUserNameValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserNameValue(e.target.value);
  };

  const handlePasswordValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      // Llama a la función login del contexto que ahora retorna la ruta de redirección
      const { redirectTo } = await loginContext({ 
        username: userNameValue, 
        password: passwordValue 
      });

      console.log('Login successful, redirecting to:', redirectTo);

      // Limpiar el formulario
      setUserNameValue('');
      setPasswordValue('');

      // Redirigir según el rol del usuario
      navigate(redirectTo);

    } catch (err) {
      console.error('Login process failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para autocompletar credenciales de demo
  const fillCredentials = (username: string, password: string) => {
    setUserNameValue(username);
    setPasswordValue(password);
  };

  return (
    <>
      <div className={styles.loginContainer}>
        <div className={styles.elementsContainer}>
          <h1>Sign in</h1>
          
          {/* Botón para mostrar/ocultar credenciales de demo */}
          <button 
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            style={{ 
              marginBottom: '20px', 
              padding: '5px 10px', 
              fontSize: '12px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showCredentials ? 'Ocultar' : 'Mostrar'} Credenciales Demo
          </button>

          {/* Panel de credenciales de demo */}
          {showCredentials && (
            <div style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '20px',
              fontSize: '14px',
              width: '100%'
            }}>
              <strong>Credenciales de Demo:</strong>
              {demoCredentials.map((cred, index) => (
                <div key={index} style={{ 
                  margin: '8px 0', 
                  padding: '8px',
                  backgroundColor: cred.role === 'manager' ? '#e3f2fd' : '#fff3e0',
                  borderRadius: '4px',
                  border: '1px solid ' + (cred.role === 'manager' ? '#bbdefb' : '#ffcc02')
                }}>
                  <div style={{ fontWeight: 'bold', color: cred.role === 'manager' ? '#1976d2' : '#f57c00' }}>
                    {cred.role === 'manager' ? '👨‍💼 Manager' : '🏠 Inquilino'}: {cred.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span>
                      <strong>User:</strong> {cred.username} | <strong>Pass:</strong> {cred.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => fillCredentials(cred.username, cred.password)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Usar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label='Username'
              type='text'
              value={userNameValue}
              onChange={handleUserNameValue}
              id='username-input'
            />
            <Input
              label='Password'
              type='password'
              value={passwordValue}
              onChange={handlePasswordValue}
              id='password-input'
            />
            <Buttons
              text={isLoading ? 'Signing In...' : 'Submit'}
              type='submit'
            />

            {error && (
              <div style={{ 
                color: 'red', 
                marginTop: '10px', 
                textAlign: 'center',
                fontSize: '14px',
                backgroundColor: '#ffebee',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ffcdd2'
              }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};