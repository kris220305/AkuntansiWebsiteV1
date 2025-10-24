import React, { useState } from 'react';
import './animated-card.css';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hover3d = true, 
  glowEffect = true,
  tiltEffect = true,
  ...props 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!tiltEffect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const getTiltStyle = () => {
    if (!tiltEffect || !isHovered) return {};
    
    const { x, y } = mousePosition;
    const rotateX = (y - 150) / 10;
    const rotateY = (x - 150) / 10;
    
    return {
      transform: `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`,
    };
  };

  return (
    <div
      className={`animated-card ${className} ${hover3d ? 'hover-3d' : ''} ${glowEffect ? 'glow-effect' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={getTiltStyle()}
      {...props}
    >
      <div className="card-content">
        {children}
      </div>
      
      {glowEffect && (
        <div className="card-glow" />
      )}
      
      <div className="card-shine" />
    </div>
  );
};

export default AnimatedCard;