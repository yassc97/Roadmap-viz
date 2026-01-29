import React from 'react';
import type { Person } from '../types';

interface AvatarProps {
  person: Person;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ person, size = 22 }) => {
  const initials = person.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.name}
        title={person.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #1a1a2e',
        }}
      />
    );
  }

  return (
    <div
      title={person.name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: person.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        color: '#fff',
        border: '2px solid #1a1a2e',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

interface AvatarStackProps {
  people: Person[];
  size?: number;
  max?: number;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ people, size = 22, max = 5 }) => {
  const visible = people.slice(0, max);
  const remaining = people.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {visible.map((person, i) => (
        <div key={person.id} style={{ marginLeft: i > 0 ? -(size * 0.3) : 0, zIndex: visible.length - i }}>
          <Avatar person={person} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          style={{
            marginLeft: -(size * 0.3),
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: '#374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.35,
            fontWeight: 600,
            color: '#9ca3af',
            border: '2px solid #1a1a2e',
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
