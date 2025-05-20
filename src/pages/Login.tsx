// src/pages/LoginPage.tsx
import { useState } from 'react';
import styles from './LoginPage.module.css';
import { Input } from '../components/Input';
import { Buttons } from '../components/Buttons';
// import { login } from '../services/authService'; // Ya no se llama directamente aquí
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // <-- ¡Importa useNavigate!

export const LoginPage = () => {
  const [userNameValue, setUserNameValue] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login: loginContext } = useAuth();
  const navigate = useNavigate(); // <-- ¡Obtén la función navigate!

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
      // Llama a la función login del contexto
      await loginContext({ username: userNameValue, password: passwordValue });

      console.log('Login process initiated via AuthContext.');

      // Limpiar el formulario (opcional)
      setUserNameValue('');
      setPasswordValue('');

      // <-- ¡AQUÍ AÑADIMOS LA REDIRECCIÓN! -->
      // Redirige al dashboard del manager (o la ruta que corresponda)
      // Puedes ajustar la ruta según la URL que configuraste para el dashboard del manager en App.tsx
      navigate('/manager/dashboard'); // <-- Llama a navigate a la ruta de destino

    } catch (err) {
      console.error('Login process failed via AuthContext:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.loginContainer}>
        <div className={styles.elementsContainer}>
          <h1>Sign in</h1>
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

            {error && <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</div>}
          </form>
        </div>
      </div>
    </>
  );
};