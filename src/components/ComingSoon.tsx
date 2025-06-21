import React from 'react';
import '../styles/globalStyles.css'; // Asegúrate de que los estilos globales estén disponibles

const ComingSoon: React.FC = () => {
  return (
    <div className="full-page-message-container" style={{ minHeight: 'auto', padding: '40px' }}>
      <div className="message-box">
        <div className="message-box-icon" style={{ fontSize: '3rem' }}>🏗️</div>
        <h1 className="message-box-title" style={{ fontSize: '1.5rem' }}>
          Feature Coming Soon
        </h1>
        <p className="message-box-text" style={{ fontSize: '1rem' }}>
          We're still working on this page.
          <br />
          Please check back later!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon; 