import React from 'react';
import type { Person } from '../types';
import { Avatar } from './Avatar';

interface PeoplePickerProps {
  people: Person[];
  selectedIds: string[];
  onToggle: (personId: string) => void;
}

export const PeoplePicker: React.FC<PeoplePickerProps> = ({ people, selectedIds, onToggle }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Assignees
      </div>
      {people.map(person => {
        const selected = selectedIds.includes(person.id);
        return (
          <button
            key={person.id}
            onClick={() => onToggle(person.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 8px',
              borderRadius: 6,
              border: 'none',
              background: selected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              cursor: 'pointer',
              color: '#e5e7eb',
              fontSize: 13,
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = selected ? 'rgba(99, 102, 241, 0.15)' : 'transparent';
            }}
          >
            <Avatar person={person} size={20} />
            <span style={{ flex: 1 }}>{person.name}</span>
            {selected && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};
