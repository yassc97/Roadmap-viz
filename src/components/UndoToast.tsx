import React from 'react';
import type { UndoAction } from '../types';

interface UndoToastProps {
  action: UndoAction;
  onUndo: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ action, onUndo }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 2000,
        animation: 'toastIn 0.2s ease-out',
      }}
    >
      <span style={{ color: '#d1d5db', fontSize: 13 }}>{action.description}</span>
      <button
        onClick={onUndo}
        style={{
          background: 'none',
          border: '1px solid #4b5563',
          borderRadius: 6,
          color: '#818cf8',
          fontSize: 12,
          fontWeight: 600,
          padding: '4px 10px',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        Undo
      </button>
    </div>
  );
};
