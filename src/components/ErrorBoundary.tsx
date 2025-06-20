import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier interfaz de repuesto personalizada
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          padding: '20px'
        }}>
          <h1>Algo salió mal.</h1>
          <p>Lo sentimos, la aplicación ha encontrado un error inesperado.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              color: '#fff',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Recargar la página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 