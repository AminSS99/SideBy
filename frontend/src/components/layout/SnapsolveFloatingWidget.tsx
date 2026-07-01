import React, { useState, useEffect, useRef } from 'react';
import { StardustButton } from '../ui/stardust-button';

export const SnapsolveFloatingWidget = () => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  
  // Ref to keep track of the latest position for resize boundaries and event handlers
  const posRef = useRef({ x: 0, y: 0 });
  posRef.current = position;

  const buttonSize = 48; // Diameter of the circle StardustButton
  const margin = 20;

  const clampPosition = (x: number, y: number) => {
    const maxX = window.innerWidth - buttonSize - margin;
    const maxY = window.innerHeight - buttonSize - margin;
    return {
      x: Math.max(margin, Math.min(x, maxX)),
      y: Math.max(margin, Math.min(y, maxY)),
    };
  };

  useEffect(() => {
    setMounted(true);
    // Position it in bottom-right corner by default
    let initialX = window.innerWidth - buttonSize - margin - 10;
    let initialY = window.innerHeight - buttonSize - margin - 10;

    try {
      const saved = localStorage.getItem('snapsolve-widget-pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          initialX = parsed.x;
          initialY = parsed.y;
        }
      }
    } catch (e) {
      console.error('Failed to parse snapsolve widget position:', e);
    }

    setPosition(clampPosition(initialX, initialY));

    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    
    isDraggingRef.current = true;
    wasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { x: posRef.current.x, y: posRef.current.y };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    wasDraggedRef.current = distance >= 5;
    
    setPosition(
      clampPosition(
        positionStartRef.current.x + dx,
        positionStartRef.current.y + dy
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Persist latest coordinates
    try {
      localStorage.setItem('snapsolve-widget-pos', JSON.stringify(posRef.current));
    } catch (err) {
      console.error('Failed to save snapsolve widget position:', err);
    }

    // Determine if it was a drag or a click
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    wasDraggedRef.current = distance >= 5;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      wasDraggedRef.current = false;
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none', // Critical for preventing gesture scrolling when dragging on touch devices
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="select-none active:scale-95 transition-transform duration-100"
    >
      <div className="relative group cursor-grab active:cursor-grabbing">
        {/* Deep red ambient glow behind the button */}
        <div className="absolute -inset-2 rounded-full bg-red-600/30 opacity-40 blur-xl group-hover:bg-red-500/50 group-hover:opacity-75 transition-all duration-300 pointer-events-none" />
        
        {/* Red Stardust Button */}
        <StardustButton
          variant="red"
          shape="circle"
          href="https://snapsolve.ink"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Snapsolve"
          onClick={handleClick}
        >
          {""}
        </StardustButton>

        {/* Beautiful floating tooltip */}
        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 bg-[#1e0505]/95 text-red-200 border border-red-500/20 text-[10px] uppercase tracking-wider font-semibold font-sans px-2.5 py-1 rounded shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
          Snapsolve
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e0505]/95" />
        </div>
      </div>
    </div>
  );
};
