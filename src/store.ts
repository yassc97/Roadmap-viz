import { useState, useCallback, useRef } from 'react';
import { RoadmapState, Initiative, Project, UndoAction } from './types';
import { PLACEHOLDER_PEOPLE, INITIATIVE_COLORS } from './constants';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'roadmap-viz-data';

function getSeedState(): RoadmapState {
  const people = PLACEHOLDER_PEOPLE.map(p => ({ ...p, avatarUrl: undefined }));

  // CRM Scope
  const crmProjects: Project[] = [
    { id: 'proj-crm-1', initiativeId: 'init-crm', title: 'All CRM properties', startDate: '2025-01-26', endDate: '2025-02-07', assigneeIds: ['p1', 'p2'] },
    { id: 'proj-crm-2', initiativeId: 'init-crm', title: 'Import users views', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p3'] },
    { id: 'proj-crm-3', initiativeId: 'init-crm', title: 'Deal view', startDate: '2025-02-10', endDate: '2025-02-14', assigneeIds: ['p3'] },
    { id: 'proj-crm-4', initiativeId: 'init-crm', title: 'Task view', startDate: '2025-02-10', endDate: '2025-02-14', assigneeIds: ['p3'] },
  ];

  // Summaries Scope
  const summariesProjects: Project[] = [
    { id: 'proj-sum-1', initiativeId: 'init-sum', title: 'New Summaries Layout', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p4'] },
    { id: 'proj-sum-2', initiativeId: 'init-sum', title: 'Summaries Tab', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p4'] },
    { id: 'proj-sum-3', initiativeId: 'init-sum', title: 'Filtering and sorting on Summaries', startDate: '2025-02-10', endDate: '2025-02-14', assigneeIds: ['p4'] },
    { id: 'proj-sum-4', initiativeId: 'init-sum', title: 'Searchable summaries Tab', startDate: '2025-02-10', endDate: '2025-02-14', assigneeIds: ['p5'] },
    { id: 'proj-sum-5', initiativeId: 'init-sum', title: 'Pre-defined Templates', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p6'] },
    { id: 'proj-sum-6', initiativeId: 'init-sum', title: 'Tasks and CRM Update', startDate: '2025-02-17', endDate: '2025-02-28', assigneeIds: ['p6'] },
    { id: 'proj-sum-7', initiativeId: 'init-sum', title: 'Tags on summaries', startDate: '2025-02-17', endDate: '2025-02-21', assigneeIds: ['p6'] },
  ];

  // Calling Experience
  const callingProjects: Project[] = [
    { id: 'proj-call-1', initiativeId: 'init-call', title: 'Power Dialer', startDate: '2025-02-03', endDate: '2025-02-14', assigneeIds: ['p7'] },
    { id: 'proj-call-2', initiativeId: 'init-call', title: 'Call tags', startDate: '2025-02-03', endDate: '2025-02-14', assigneeIds: ['p7'] },
    { id: 'proj-call-3', initiativeId: 'init-call', title: 'PiP outbound calls', startDate: '2025-02-03', endDate: '2025-02-14', assigneeIds: ['p7'] },
  ];

  // General Improvements
  const generalProjects: Project[] = [
    { id: 'proj-gen-1', initiativeId: 'init-gen', title: 'Merged inbox inside Call tab/Inbox', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p4'] },
    { id: 'proj-gen-2', initiativeId: 'init-gen', title: 'Admin right to choose line access', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p5'] },
    { id: 'proj-gen-3', initiativeId: 'init-gen', title: 'Change ownership of a number', startDate: '2025-02-03', endDate: '2025-02-07', assigneeIds: ['p5'] },
  ];

  const initiatives: Initiative[] = [
    { id: 'init-crm', title: 'CRM Scope', color: '#3b82f6', projectIds: crmProjects.map(p => p.id) },
    { id: 'init-sum', title: 'Summaries Scope', color: '#8b5cf6', projectIds: summariesProjects.map(p => p.id) },
    { id: 'init-call', title: 'Calling Experience', color: '#10b981', projectIds: callingProjects.map(p => p.id) },
    { id: 'init-gen', title: 'General Improvements', color: '#f59e0b', projectIds: generalProjects.map(p => p.id) },
  ];

  return {
    initiatives,
    projects: [...crmProjects, ...summariesProjects, ...callingProjects, ...generalProjects],
    people,
  };
}

function getDefaultState(): RoadmapState {
  return getSeedState();
}

function loadState(): RoadmapState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RoadmapState;
      // Ensure people exist
      if (!parsed.people || parsed.people.length === 0) {
        parsed.people = getDefaultState().people;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  // First visit: seed with initial data and save immediately
  const seed = getDefaultState();
  saveState(seed);
  return seed;
}

function saveState(state: RoadmapState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useRoadmapStore() {
  const [state, setStateRaw] = useState<RoadmapState>(loadState);
  const undoStackRef = useRef<UndoAction[]>([]);
  const [undoToast, setUndoToast] = useState<UndoAction | null>(null);

  const setState = useCallback((updater: (prev: RoadmapState) => RoadmapState, description?: string) => {
    setStateRaw(prev => {
      if (description && description.length > 0) {
        const action: UndoAction = { description, previousState: JSON.parse(JSON.stringify(prev)) };
        undoStackRef.current.push(action);
        setUndoToast(action);
        setTimeout(() => setUndoToast(prev => prev === action ? null : prev), 5000);
      }
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const action = undoStackRef.current.pop();
    if (action) {
      setStateRaw(action.previousState);
      saveState(action.previousState);
      setUndoToast(null);
    }
  }, []);

  const addInitiative = useCallback((title: string) => {
    const id = uuid();
    const colorIndex = Math.floor(Math.random() * INITIATIVE_COLORS.length);
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);

    const initiative: Initiative = {
      id,
      title,
      color: INITIATIVE_COLORS[colorIndex],
      projectIds: [],
    };

    // Create a default first project
    const projectId = uuid();
    const project: Project = {
      id: projectId,
      initiativeId: id,
      title: 'New project',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      assigneeIds: [],
    };

    initiative.projectIds.push(projectId);

    setState(prev => ({
      ...prev,
      initiatives: [...prev.initiatives, initiative],
      projects: [...prev.projects, project],
    }), `Added initiative "${title}"`);
  }, [setState]);

  const addProject = useCallback((initiativeId: string) => {
    const projectId = uuid();
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const project: Project = {
      id: projectId,
      initiativeId,
      title: 'New project',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      assigneeIds: [],
    };

    setState(prev => ({
      ...prev,
      initiatives: prev.initiatives.map(i =>
        i.id === initiativeId ? { ...i, projectIds: [...i.projectIds, projectId] } : i
      ),
      projects: [...prev.projects, project],
    }), 'Added project');
  }, [setState]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    }));
  }, [setState]);

  const updateProjectWithUndo = useCallback((projectId: string, updates: Partial<Project>, desc: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    }), desc);
  }, [setState]);

  const updateInitiative = useCallback((initiativeId: string, updates: Partial<Initiative>) => {
    setState(prev => ({
      ...prev,
      initiatives: prev.initiatives.map(i =>
        i.id === initiativeId ? { ...i, ...updates } : i
      ),
    }));
  }, [setState]);

  const deleteProject = useCallback((projectId: string) => {
    setState(prev => {
      const project = prev.projects.find(p => p.id === projectId);
      return {
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        initiatives: prev.initiatives.map(i =>
          i.id === project?.initiativeId
            ? { ...i, projectIds: i.projectIds.filter(pid => pid !== projectId) }
            : i
        ),
      };
    }, 'Deleted project');
  }, [setState]);

  const deleteInitiative = useCallback((initiativeId: string) => {
    setState(prev => ({
      ...prev,
      initiatives: prev.initiatives.filter(i => i.id !== initiativeId),
      projects: prev.projects.filter(p => p.initiativeId !== initiativeId),
    }), 'Deleted initiative');
  }, [setState]);

  // Compute initiative date range from its projects
  const getInitiativeDateRange = useCallback((initiativeId: string) => {
    const projects = state.projects.filter(p => p.initiativeId === initiativeId);
    if (projects.length === 0) return null;
    const starts = projects.map(p => new Date(p.startDate).getTime());
    const ends = projects.map(p => new Date(p.endDate).getTime());
    return {
      startDate: new Date(Math.min(...starts)).toISOString().split('T')[0],
      endDate: new Date(Math.max(...ends)).toISOString().split('T')[0],
    };
  }, [state.projects]);

  // Get all unique assignees for an initiative
  const getInitiativeAssignees = useCallback((initiativeId: string): string[] => {
    const projects = state.projects.filter(p => p.initiativeId === initiativeId);
    const ids = new Set<string>();
    projects.forEach(p => p.assigneeIds.forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [state.projects]);

  // Sort initiatives by their earliest start date
  const sortedInitiatives = [...state.initiatives].sort((a, b) => {
    const aRange = getInitiativeDateRange(a.id);
    const bRange = getInitiativeDateRange(b.id);
    if (!aRange && !bRange) return 0;
    if (!aRange) return 1;
    if (!bRange) return -1;
    return new Date(aRange.startDate).getTime() - new Date(bRange.startDate).getTime();
  });

  return {
    state,
    sortedInitiatives,
    addInitiative,
    addProject,
    updateProject,
    updateProjectWithUndo,
    updateInitiative,
    deleteProject,
    deleteInitiative,
    getInitiativeDateRange,
    getInitiativeAssignees,
    undo,
    undoToast,
  };
}
