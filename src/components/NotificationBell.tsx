import React, { useState } from 'react';
import './NotificationBell.css'; // We'll create this CSS file next

interface NotificationBellProps {
  notificationCount: number;
  onBellClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notificationCount, onBellClick }) => {
  return (
    <div className="notification-bell" onClick={onBellClick}>
      <span className="bell-icon">🔔</span> {/* Basic bell emoji, can be replaced with an icon library */}
      {notificationCount > 0 && (
        <span className="notification-count">{notificationCount}</span>
      )}
    </div>
  );
};

export default NotificationBell; 