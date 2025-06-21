// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import styles from './LoginPage.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDemoCredentials } from '../services/authService';
import type { User } from '../types';

interface DemoCredential {
  user: User | undefined;
  password?: string;
}

export const LoginPage = () => {
  const [userNameValue, setUserNameValue] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const { login: loginContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Agrega una clase al body cuando el componente se monta
    document.body.classList.add('login-page-active');

    // Limpia la clase cuando el componente se desmonta
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez

  const demoCredentials: DemoCredential[] = getDemoCredentials();

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
      const { redirectTo } = await loginContext({ 
        username: userNameValue, 
        password: passwordValue 
      });
      
      navigate(redirectTo);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (username: string, password?: string) => {
    setUserNameValue(username);
    setPasswordValue(password || '');
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginFormContainer}>
        <h1 className={styles.loginTitle}>Sign In</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username-input" className={styles.label}>Username</label>
            <input
              id="username-input"
              className={styles.inputField}
              type='text'
              value={userNameValue}
              onChange={handleUserNameValue}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password-input" className={styles.label}>Password</label>
            <input
              id="password-input"
              className={styles.inputField}
              type='password'
              value={passwordValue}
              onChange={handlePasswordValue}
              required
            />
          </div>
          
          <button
            type='submit'
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </form>

        <div className={styles.demoSection}>
          <button 
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className={styles.demoButton}
          >
            {showCredentials ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
          </button>

          {showCredentials && (
            <div className={styles.credentialsPanel}>
              <strong className={styles.credentialsTitle}>Demo Credentials:</strong>
              {demoCredentials.map((cred, index) => (
                <div key={index} className={styles.credentialCard}>
                  <div className={`${styles.credentialCardHeader} ${cred.user?.role === 'manager' ? styles.manager : styles.tenant}`}>
                    {cred.user?.role === 'manager' ? '👨‍💼 Manager' : '🏠 Tenant'}: {cred.user?.firstName}
                  </div>
                  <div className={styles.credentialBody}>
                    <span>
                      <strong>User:</strong> {cred.user?.username} | <strong>Pass:</strong> {cred.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => fillCredentials(cred.user?.username || '', cred.password)}
                      className={styles.useCredentialButton}
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};