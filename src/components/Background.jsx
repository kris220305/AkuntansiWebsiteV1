import React from 'react';
import './background.css';

export default function Background(){
  const visual = import.meta.env?.VITE_VISUAL_EFFECTS || 'on';
  if (visual === 'off') {
    return null;
  }
  return (
    <div className="bg-cosmos" aria-hidden>
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="orb o3" />
      <div className="orb o4" />
      <div className="grid" />
    </div>
  );
}