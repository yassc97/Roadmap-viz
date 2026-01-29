import React, { useState } from 'react';
import { Project, Person } from '../types';
import { PeoplePicker } from './PeoplePicker';
import { Popover } from './Popover';

interface ProjectPopoverProps {
  project: Project;
  people: Person[];
  x: number;
  y: number;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Project>, desc: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectPopover: React.FC<ProjectPopoverProps> = ({
  project, people, x, y, onClose, onUpdate, onDelete,
}) => {
  const [title, setTitle] = useState(project.title);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);

  const handleTitleBlur = () => {
    if (title !== project.title) {
      onUpdate(project.id, { title }, `Renamed project to "${title}"`);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    if (val && val <= endDate) {
      onUpdate(project.id, { startDate: val }, 'Changed project start date');
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val);
    if (val && val >= startDate) {
      onUpdate(project.id, { endDate: val }, 'Changed project end date');
    }
  };

  const handleToggleAssignee = (personId: string) => {
    const newIds = project.assigneeIds.includes(personId)
      ? project.assigneeIds.filter(id => id !== personId)
      : [...project.assigneeIds, personId];
    onUpdate(project.id, { assigneeIds: newIds }, 'Updated assignees');
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

        {/* Dates */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Start
            </div>
            <input
              type="date"
              value={startDate}
              onChange={handleStartChange}
              style={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 6,
                color: '#d1d5db',
                fontSize: 12,
                padding: '5px 8px',
                outline: 'none',
                width: '100%',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Due
            </div>
            <input
              type="date"
              value={endDate}
              onChange={handleEndChange}
              style={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 6,
                color: '#d1d5db',
                fontSize: 12,
                padding: '5px 8px',
                outline: 'none',
                width: '100%',
                colorScheme: 'dark',
              }}
            />
          </div>
        </div>

        {/* People */}
        <PeoplePicker
          people={people}
          selectedIds={project.assigneeIds}
          onToggle={handleToggleAssignee}
        />

        {/* Delete */}
        <button
          onClick={() => { onDelete(project.id); onClose(); }}
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
          Delete project
        </button>
      </div>
    </Popover>
  );
};
