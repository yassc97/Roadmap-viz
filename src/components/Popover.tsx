import React, { useEffect, useRef, useCallback } from 'react';

interface PopoverProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ x, y, onClose, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', keyHandler);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

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
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'popoverIn 0.15s ease-out',
      }}
    >
      {children}
    </div>
  );
};
