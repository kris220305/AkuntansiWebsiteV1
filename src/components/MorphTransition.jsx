import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './morph.css';

// Fullscreen morph overlay triggered on route change.
export default function MorphTransition(){
  const location = useLocation();
  const [show, setShow] = useState(false);
  const lastClick = useRef({ x: '50%', y: '50%' });

  useEffect(()=>{
    const handler = (e)=>{
      const x = `${(e.clientX / window.innerWidth) * 100}%`;
      const y = `${(e.clientY / window.innerHeight) * 100}%`;
      lastClick.current = { x, y };
    };
    document.addEventListener('click', handler);
    return ()=> document.removeEventListener('click', handler);
  },[]);

  useEffect(()=>{
    // Trigger morph when path changes
    setShow(true);
    const t = setTimeout(()=> setShow(false), 800);
    return ()=> clearTimeout(t);
  },[location.pathname]);

  const style = {
    '--x': lastClick.current.x,
    '--y': lastClick.current.y,
  };
  return (
    <div className={`morph ${show ? 'show': ''}`} style={style} aria-hidden>
      <div className="bubble" />
      <div className="bubble-2" />
    </div>
  );
}