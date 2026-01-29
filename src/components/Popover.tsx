import React, { useEffect, useRef } from 'react';

interface PopoverProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ x, y, onClose, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay to avoid immediate close from the click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', keyHandler);
    }, 10);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Adjust position to keep popover in viewport
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.right > window.innerWidth - 16) {
        ref.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight - 16) {
        ref.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: 10,
        padding: 16,
        minWidth: 260,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'popoverIn 0.15s ease-out',
      }}
    >
      {children}
    </div>
  );
};
