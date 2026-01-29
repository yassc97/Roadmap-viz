import React, { useState } from 'react';
import { Initiative } from '../types';
import { ColorPicker } from './ColorPicker';
import { Popover } from './Popover';

interface InitiativePopoverProps {
  initiative: Initiative;
  x: number;
  y: number;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
}

export const InitiativePopover: React.FC<InitiativePopoverProps> = ({
  initiative, x, y, onClose, onUpdate, onDelete,
}) => {
  const [title, setTitle] = useState(initiative.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTitleBlur = () => {
    if (title !== initiative.title) {
      onUpdate(initiative.id, { title });
    }
  };

  return (
    <Popover x={x} y={y} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#f3f4f6',
            fontSize: 15,
            fontWeight: 600,
            padding: '4px 0',
            outline: 'none',
            borderBottom: '1px solid transparent',
            transition: 'border-color 0.15s',
            width: '100%',
          }}
          onFocus={e => e.currentTarget.style.borderBottomColor = '#4b5563'}
          onBlurCapture={e => e.currentTarget.style.borderBottomColor = 'transparent'}
        />

        {/* Color */}
        <ColorPicker
          selected={initiative.color}
          onSelect={color => onUpdate(initiative.id, { color })}
        />

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 0',
              textAlign: 'left',
              opacity: 0.8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
          >
            Delete initiative
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#f87171' }}>Delete all projects too?</span>
            <button
              onClick={() => { onDelete(initiative.id); onClose(); }}
              style={{
                background: '#ef4444',
                border: 'none',
                borderRadius: 5,
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                background: 'none',
                border: '1px solid #4b5563',
                borderRadius: 5,
                color: '#9ca3af',
                fontSize: 11,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              No
            </button>
          </div>
        )}
      </div>
    </Popover>
  );
};
