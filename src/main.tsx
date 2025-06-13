// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // o 'dom' si usas la API vieja
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Importa el Provider
// import { BrowserRouter as Router } from 'react-router-dom'; // Si usas router // Comentado si App.tsx ya tiene Router

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* AuthProvider envuelve App globalmente aquí */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);