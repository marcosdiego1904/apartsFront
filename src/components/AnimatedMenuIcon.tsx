import React from 'react';
import '../styles/AnimatedMenuIcon.css';

interface AnimatedMenuIconProps {
  isOpen: boolean;
}

const AnimatedMenuIcon: React.FC<AnimatedMenuIconProps> = ({ isOpen }) => {
  return (
    <div className={`animated-menu-icon ${isOpen ? 'open' : ''}`}>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default AnimatedMenuIcon; 