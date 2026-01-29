import React from 'react';
import { INITIATIVE_COLORS } from '../constants';

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selected, onSelect }) => {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Color
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {INITIATIVE_COLORS.map(color => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: color,
              border: selected === color ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              transition: 'border-color 0.15s, transform 0.15s',
              transform: selected === color ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
