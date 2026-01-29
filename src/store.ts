import { useState, useCallback, useRef } from 'react';
import { RoadmapState, Initiative, Project, UndoAction } from './types';
import { PLACEHOLDER_PEOPLE, INITIATIVE_COLORS } from './constants';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'roadmap-viz-data';

function getDefaultState(): RoadmapState {
  return {
    initiatives: [],
    projects: [],
    people: PLACEHOLDER_PEOPLE.map(p => ({ ...p, avatarUrl: undefined })),
  };
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
  return getDefaultState();
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
      if (description) {
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
