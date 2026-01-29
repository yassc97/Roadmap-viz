import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, differenceInDays,
  addMonths, subMonths, isToday, parseISO, isSameMonth,
} from 'date-fns';
import type { Initiative, Project, Person } from '../types';
import { DAY_WIDTH, BAR_HEIGHT, BAR_GAP, INITIATIVE_BAR_HEIGHT } from '../constants';
import { AvatarStack } from './Avatar';
import { ProjectPopover } from './ProjectPopover';
import { InitiativePopover } from './InitiativePopover';

interface TimelineProps {
  initiatives: Initiative[];
  projects: Project[];
  people: Person[];
  getInitiativeDateRange: (id: string) => { startDate: string; endDate: string } | null;
  getInitiativeAssignees: (id: string) => string[];
  onUpdateProject: (id: string, updates: Partial<Project>, desc: string) => void;
  onUpdateInitiative: (id: string, updates: Partial<Initiative>) => void;
  onDeleteProject: (id: string) => void;
  onDeleteInitiative: (id: string) => void;
  onAddProject: (initiativeId: string) => void;
  collapsedInitiatives: Set<string>;
  onToggleCollapse: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  initiatives, projects, people,
  getInitiativeDateRange, getInitiativeAssignees,
  onUpdateProject, onUpdateInitiative, onDeleteProject, onDeleteInitiative,
  onAddProject, collapsedInitiatives, onToggleCollapse,
}) => {
  // Determine initial month from data
  const getInitialMonth = () => {
    if (projects.length > 0) {
      const earliest = projects.reduce((min, p) => p.startDate < min ? p.startDate : min, projects[0].startDate);
      return startOfMonth(parseISO(earliest));
    }
    return startOfMonth(new Date());
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [projectPopover, setProjectPopover] = useState<{ projectId: string; x: number; y: number } | null>(null);
  const [initiativePopover, setInitiativePopover] = useState<{ initiative: Initiative; x: number; y: number } | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Drag state using refs to avoid stale closures
  const dragRef = useRef<{
    projectId?: string;
    initiativeId?: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    startY: number;
    origStart: string;
    origEnd: string;
    hasDragged: boolean;
    // For initiative dragging, store all project dates
    initiativeProjects?: Array<{ id: string; origStart: string; origEnd: string }>;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredInitiative, setHoveredInitiative] = useState<string | null>(null);

  // Keep refs to latest props to avoid stale closures in drag handlers
  const onUpdateProjectRef = useRef(onUpdateProject);
  onUpdateProjectRef.current = onUpdateProject;
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // Show 3 months: prev, current, next for smooth scrolling
  const monthStart = startOfMonth(subMonths(currentMonth, 1));
  const monthEnd = endOfMonth(addMonths(currentMonth, 1));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalWidth = days.length * DAY_WIDTH;

  // Scroll to current month on mount / month change
  useEffect(() => {
    if (scrollRef.current) {
      const currentMonthStart = startOfMonth(currentMonth);
      const offsetDays = differenceInDays(currentMonthStart, monthStart);
      scrollRef.current.scrollLeft = offsetDays * DAY_WIDTH;
    }
  }, [currentMonth]);

  // Detect scroll to update month header
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const centerDay = Math.floor((scrollLeft + window.innerWidth / 2) / DAY_WIDTH);
      if (centerDay >= 0 && centerDay < days.length) {
        const visibleDate = days[centerDay];
        if (!isSameMonth(visibleDate, currentMonth)) {
          setCurrentMonth(startOfMonth(visibleDate));
        }
      }
    }
  }, [days, currentMonth]);

  const dateToX = (dateStr: string): number => {
    const date = parseISO(dateStr);
    const dayOffset = differenceInDays(date, monthStart);
    return dayOffset * DAY_WIDTH;
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, projectId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    dragRef.current = {
      projectId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      origStart: project.startDate,
      origEnd: project.endDate,
      hasDragged: false,
    };
    setIsDragging(true);
  };

  const handleInitiativeMouseDown = (e: React.MouseEvent, initiativeId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();
    const range = getInitiativeDateRange(initiativeId);
    if (!range) return;

    const initProjects = projects.filter(p => p.initiativeId === initiativeId);
    if (initProjects.length === 0) return;

    dragRef.current = {
      initiativeId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      origStart: range.startDate,
      origEnd: range.endDate,
      hasDragged: false,
      initiativeProjects: initProjects.map(p => ({
        id: p.id,
        origStart: p.startDate,
        origEnd: p.endDate,
      })),
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.hasDragged && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      drag.hasDragged = true;

      const daysDelta = Math.round(dx / DAY_WIDTH);

      if (drag.initiativeId && drag.initiativeProjects) {
        // Dragging an initiative - update all its projects
        if (drag.type === 'move') {
          // Move all projects by the same delta
          drag.initiativeProjects.forEach(proj => {
            const origStart = parseISO(proj.origStart);
            const origEnd = parseISO(proj.origEnd);
            const s = new Date(origStart);
            s.setDate(s.getDate() + daysDelta);
            const en = new Date(origEnd);
            en.setDate(en.getDate() + daysDelta);
            const newStart = s.toISOString().split('T')[0];
            const newEnd = en.toISOString().split('T')[0];
            onUpdateProjectRef.current(proj.id, { startDate: newStart, endDate: newEnd }, '');
          });
        } else if (drag.type === 'resize-start') {
          // Find the earliest project and resize it
          const sortedProjects = [...drag.initiativeProjects].sort((a, b) => a.origStart.localeCompare(b.origStart));
          if (sortedProjects.length > 0) {
            const earliestProj = sortedProjects[0];
            const origStart = parseISO(earliestProj.origStart);
            const origEnd = parseISO(earliestProj.origEnd);
            const s = new Date(origStart);
            s.setDate(s.getDate() + daysDelta);
            if (s < origEnd) {
              const newStart = s.toISOString().split('T')[0];
              onUpdateProjectRef.current(earliestProj.id, { startDate: newStart }, '');
            }
          }
        } else if (drag.type === 'resize-end') {
          // Find the latest project and resize it
          const sortedProjects = [...drag.initiativeProjects].sort((a, b) => b.origEnd.localeCompare(a.origEnd));
          if (sortedProjects.length > 0) {
            const latestProj = sortedProjects[0];
            const origStart = parseISO(latestProj.origStart);
            const origEnd = parseISO(latestProj.origEnd);
            const en = new Date(origEnd);
            en.setDate(en.getDate() + daysDelta);
            if (en > origStart) {
              const newEnd = en.toISOString().split('T')[0];
              onUpdateProjectRef.current(latestProj.id, { endDate: newEnd }, '');
            }
          }
        }
      } else if (drag.projectId) {
        // Dragging a project
        const origStart = parseISO(drag.origStart);
        const origEnd = parseISO(drag.origEnd);

        let newStart = drag.origStart;
        let newEnd = drag.origEnd;

        if (drag.type === 'move') {
          const s = new Date(origStart);
          s.setDate(s.getDate() + daysDelta);
          const en = new Date(origEnd);
          en.setDate(en.getDate() + daysDelta);
          newStart = s.toISOString().split('T')[0];
          newEnd = en.toISOString().split('T')[0];
        } else if (drag.type === 'resize-start') {
          const s = new Date(origStart);
          s.setDate(s.getDate() + daysDelta);
          if (s < origEnd) {
            newStart = s.toISOString().split('T')[0];
          }
        } else if (drag.type === 'resize-end') {
          const en = new Date(origEnd);
          en.setDate(en.getDate() + daysDelta);
          if (en > origStart) {
            newEnd = en.toISOString().split('T')[0];
          }
        }

        // Use empty desc to avoid flooding undo stack during drag
        onUpdateProjectRef.current(drag.projectId, { startDate: newStart, endDate: newEnd }, '');
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (drag && !drag.hasDragged && drag.type === 'move') {
        // It was a click, not a drag — open popover
        if (drag.projectId) {
          setProjectPopover({ projectId: drag.projectId, x: e.clientX, y: e.clientY });
        } else if (drag.initiativeId) {
          const initiative = initiatives.find(i => i.id === drag.initiativeId);
          if (initiative) {
            setInitiativePopover({ initiative, x: e.clientX, y: e.clientY });
          }
        }
      }
      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const navigateMonth = (dir: number) => {
    setCurrentMonth(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // Find the current project for popover (always fresh from props)
  const popoverProject = projectPopover ? projects.find(p => p.id === projectPopover.projectId) : null;

  // Render
  let yOffset = 0;
  const rows: React.ReactNode[] = [];

  initiatives.forEach(initiative => {
    const range = getInitiativeDateRange(initiative.id);
    const assigneeIds = getInitiativeAssignees(initiative.id);
    const assignees = assigneeIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[];
    const initProjects = projects.filter(p => p.initiativeId === initiative.id);
    const isCollapsed = collapsedInitiatives.has(initiative.id);

    const initiativeY = yOffset;

    // Initiative bar
    if (range) {
      const x = dateToX(range.startDate);
      const width = Math.max((differenceInDays(parseISO(range.endDate), parseISO(range.startDate)) + 1) * DAY_WIDTH, DAY_WIDTH);
      const isHovered = hoveredInitiative === initiative.id;

      rows.push(
        <g key={`init-${initiative.id}`}
          onMouseEnter={() => setHoveredInitiative(initiative.id)}
          onMouseLeave={() => setHoveredInitiative(null)}
        >
          {/* Background bar */}
          <rect
            x={x}
            y={initiativeY}
            width={width}
            height={INITIATIVE_BAR_HEIGHT}
            rx={8}
            fill={initiative.color}
            opacity={isHovered ? 0.95 : 0.9}
            style={{ transition: 'opacity 0.15s' }}
          />
          {/* Draggable center area - between toggle and right edge */}
          <rect
            x={x + 40}
            y={initiativeY}
            width={Math.max(width - 70, 1)}
            height={INITIATIVE_BAR_HEIGHT}
            fill="transparent"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={(e) => handleInitiativeMouseDown(e, initiative.id, 'move')}
          />
          {/* Title */}
          <text
            x={x + 42}
            y={initiativeY + INITIATIVE_BAR_HEIGHT / 2}
            fill="#fff"
            fontSize={13}
            fontWeight={600}
            dominantBaseline="middle"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {initiative.title}
          </text>
          {/* Avatars */}
          {assignees.length > 0 && (
            <foreignObject
              x={x + width - (Math.min(assignees.length, 5) * 18 + 20)}
              y={initiativeY + 4}
              width={Math.min(assignees.length, 5) * 18 + 30}
              height={INITIATIVE_BAR_HEIGHT - 8}
              style={{ pointerEvents: 'none' }}
            >
              <AvatarStack people={assignees} size={20} />
            </foreignObject>
          )}
          {/* Left resize handle - only covers leftmost 16px, before toggle */}
          <rect
            x={x}
            y={initiativeY}
            width={16}
            height={INITIATIVE_BAR_HEIGHT}
            rx={8}
            fill="transparent"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleInitiativeMouseDown(e, initiative.id, 'resize-start');
            }}
          />
          {isHovered && (
            <rect
              x={x}
              y={initiativeY}
              width={3}
              height={INITIATIVE_BAR_HEIGHT}
              fill="rgba(255,255,255,0.4)"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {/* Right resize handle */}
          <rect
            x={x + width - 16}
            y={initiativeY}
            width={16}
            height={INITIATIVE_BAR_HEIGHT}
            rx={8}
            fill="transparent"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleInitiativeMouseDown(e, initiative.id, 'resize-end');
            }}
          />
          {isHovered && (
            <rect
              x={x + width - 3}
              y={initiativeY}
              width={3}
              height={INITIATIVE_BAR_HEIGHT}
              fill="rgba(255,255,255,0.4)"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {/* Collapse toggle - drawn last so it's on top */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(initiative.id);
            }}
          >
            <rect x={x + 16} y={initiativeY} width={24} height={INITIATIVE_BAR_HEIGHT} fill="transparent" />
            <text
              x={x + 24}
              y={initiativeY + INITIATIVE_BAR_HEIGHT / 2 + 1}
              fill="#fff"
              fontSize={14}
              dominantBaseline="middle"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {isCollapsed ? '▸' : '▾'}
            </text>
          </g>
        </g>
      );
    } else {
      // No projects yet, show a placeholder
      const placeholderX = dateToX(format(currentMonth, 'yyyy-MM-dd'));
      rows.push(
        <g key={`init-${initiative.id}`}>
          <rect
            x={placeholderX}
            y={initiativeY}
            width={DAY_WIDTH * 14}
            height={INITIATIVE_BAR_HEIGHT}
            rx={8}
            fill={initiative.color}
            opacity={0.5}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              setInitiativePopover({ initiative, x: e.clientX, y: e.clientY });
            }}
          />
          <text
            x={placeholderX + 12}
            y={initiativeY + INITIATIVE_BAR_HEIGHT / 2}
            fill="#fff"
            fontSize={13}
            fontWeight={600}
            dominantBaseline="middle"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={(e) => {
              setInitiativePopover({ initiative, x: e.clientX, y: e.clientY });
            }}
          >
            {initiative.title}
          </text>
        </g>
      );
    }

    yOffset += INITIATIVE_BAR_HEIGHT + BAR_GAP;

    // Project bars
    if (!isCollapsed) {
      initProjects.forEach(project => {
        const px = dateToX(project.startDate);
        const pWidth = Math.max((differenceInDays(parseISO(project.endDate), parseISO(project.startDate)) + 1) * DAY_WIDTH, DAY_WIDTH);
        const py = yOffset;
        const isHovered = hoveredProject === project.id;
        const projectAssignees = project.assigneeIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[];
        const barColor = initiative.color;

        rows.push(
          <g key={`proj-${project.id}`}
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            {/* Main bar (background) */}
            <rect
              x={px}
              y={py}
              width={pWidth}
              height={BAR_HEIGHT}
              rx={6}
              fill={barColor}
              opacity={isHovered ? 0.5 : 0.3}
              style={{ transition: 'opacity 0.15s' }}
            />
            {/* Draggable center area */}
            <rect
              x={px + 12}
              y={py}
              width={Math.max(pWidth - 24, 1)}
              height={BAR_HEIGHT}
              fill="transparent"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => handleMouseDown(e, project.id, 'move')}
            />
            {/* Title */}
            <foreignObject x={px + 14} y={py} width={Math.max(pWidth - 70, 30)} height={BAR_HEIGHT}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#e5e7eb',
                  fontSize: 12,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {project.title}
              </div>
            </foreignObject>
            {/* Avatars */}
            {projectAssignees.length > 0 && pWidth > 80 && (
              <foreignObject
                x={px + pWidth - (Math.min(projectAssignees.length, 3) * 16 + 20)}
                y={py + 3}
                width={Math.min(projectAssignees.length, 3) * 16 + 20}
                height={BAR_HEIGHT - 6}
                style={{ pointerEvents: 'none' }}
              >
                <AvatarStack people={projectAssignees} size={18} max={3} />
              </foreignObject>
            )}
            {/* Left resize handle - drawn on top */}
            <rect
              x={px - 2}
              y={py}
              width={14}
              height={BAR_HEIGHT}
              rx={3}
              fill={isHovered ? 'rgba(255,255,255,0.2)' : 'transparent'}
              stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'transparent'}
              strokeWidth={1}
              style={{ cursor: 'ew-resize', transition: 'fill 0.15s, stroke 0.15s' }}
              onMouseDown={(e) => handleMouseDown(e, project.id, 'resize-start')}
            />
            {/* Right resize handle - drawn on top */}
            <rect
              x={px + pWidth - 12}
              y={py}
              width={14}
              height={BAR_HEIGHT}
              rx={3}
              fill={isHovered ? 'rgba(255,255,255,0.2)' : 'transparent'}
              stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'transparent'}
              strokeWidth={1}
              style={{ cursor: 'ew-resize', transition: 'fill 0.15s, stroke 0.15s' }}
              onMouseDown={(e) => handleMouseDown(e, project.id, 'resize-end')}
            />
            {/* Hover tooltip */}
            {isHovered && !isDragging && (
              <foreignObject x={px} y={py - 30} width={220} height={26}>
                <div style={{
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: 5,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: '#9ca3af',
                  whiteSpace: 'nowrap',
                  width: 'fit-content',
                  pointerEvents: 'none',
                }}>
                  {format(parseISO(project.startDate), 'MMM d')} → {format(parseISO(project.endDate), 'MMM d')}
                </div>
              </foreignObject>
            )}
          </g>
        );

        yOffset += BAR_HEIGHT + BAR_GAP;
      });

      // Add project button
      const addBtnX = range ? dateToX(range.startDate) : dateToX(format(currentMonth, 'yyyy-MM-dd'));
      rows.push(
        <g key={`add-proj-${initiative.id}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onAddProject(initiative.id)}
          opacity={0.4}
        >
          <text
            x={addBtnX}
            y={yOffset + 14}
            fill="#9ca3af"
            fontSize={12}
            style={{ userSelect: 'none' }}
          >
            + Add project
          </text>
        </g>
      );
      yOffset += 24;
    }

    yOffset += 12; // gap between initiatives
  });

  const svgHeight = Math.max(yOffset + 100, 400);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Month navigation header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid #1f2937',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigateMonth(-1)}
          style={{
            background: 'none',
            border: '1px solid #374151',
            borderRadius: 6,
            color: '#9ca3af',
            fontSize: 14,
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b7280'; e.currentTarget.style.color = '#e5e7eb'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          ←
        </button>
        <span style={{ color: '#f3f4f6', fontSize: 16, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          style={{
            background: 'none',
            border: '1px solid #374151',
            borderRadius: 6,
            color: '#9ca3af',
            fontSize: 14,
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b7280'; e.currentTarget.style.color = '#e5e7eb'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          →
        </button>
      </div>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <svg width={totalWidth} height={svgHeight} style={{ display: 'block' }}>
          {/* Day columns header */}
          {days.map((day, i) => {
            const x = i * DAY_WIDTH;
            const isCurrentDay = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isFirstOfMonth = day.getDate() === 1;
            return (
              <g key={i}>
                {/* Weekend background */}
                {isWeekend && (
                  <rect x={x} y={0} width={DAY_WIDTH} height={svgHeight} fill="rgba(255,255,255,0.02)" />
                )}
                {/* Month separator */}
                {isFirstOfMonth && (
                  <line x1={x} y1={0} x2={x} y2={svgHeight} stroke="#374151" strokeWidth={1} />
                )}
                {/* Grid line */}
                <line x1={x} y1={44} x2={x} y2={svgHeight} stroke="#1f2937" strokeWidth={0.5} />
                {/* Day header */}
                <text
                  x={x + DAY_WIDTH / 2}
                  y={16}
                  fill={isCurrentDay ? '#818cf8' : '#4b5563'}
                  fontSize={10}
                  fontWeight={isCurrentDay ? 700 : 400}
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {format(day, 'EEE')}
                </text>
                <text
                  x={x + DAY_WIDTH / 2}
                  y={32}
                  fill={isCurrentDay ? '#818cf8' : '#6b7280'}
                  fontSize={12}
                  fontWeight={isCurrentDay ? 700 : 500}
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {format(day, 'd')}
                </text>
                {/* Today marker */}
                {isCurrentDay && (
                  <line
                    x1={x + DAY_WIDTH / 2}
                    y1={40}
                    x2={x + DAY_WIDTH / 2}
                    y2={svgHeight}
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    strokeDasharray="4,4"
                    opacity={0.6}
                  />
                )}
              </g>
            );
          })}

          {/* Content area offset */}
          <g transform={`translate(0, 52)`}>
            {rows}
          </g>
        </svg>
      </div>

      {/* Popovers */}
      {projectPopover && popoverProject && (
        <ProjectPopover
          project={popoverProject}
          people={people}
          x={projectPopover.x}
          y={projectPopover.y}
          onClose={() => setProjectPopover(null)}
          onUpdate={(id, updates, desc) => {
            onUpdateProject(id, updates, desc);
          }}
          onDelete={(id) => {
            onDeleteProject(id);
            setProjectPopover(null);
          }}
        />
      )}
      {initiativePopover && (
        <InitiativePopover
          initiative={initiativePopover.initiative}
          x={initiativePopover.x}
          y={initiativePopover.y}
          onClose={() => setInitiativePopover(null)}
          onUpdate={(id, updates) => {
            onUpdateInitiative(id, updates);
            const updated = { ...initiativePopover.initiative, ...updates };
            setInitiativePopover({ ...initiativePopover, initiative: updated });
          }}
          onDelete={(id) => {
            onDeleteInitiative(id);
            setInitiativePopover(null);
          }}
        />
      )}
    </div>
  );
};
