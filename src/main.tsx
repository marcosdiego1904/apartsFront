// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // o 'dom' si usas la API vieja
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Importa el Provider
// import { BrowserRouter as Router } from 'react-router-dom'; // Si usas router

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Envuelve tu aplicación con el AuthProvider */}
      {/* <Router> */}
         <App />
      {/* </Router> */}
    </AuthProvider>
  </React.StrictMode>,
);