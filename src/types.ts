export interface Person {
  id: string;
  name: string;
  avatarUrl?: string; // SVG path or URL, placeholder uses initials
  color: string;
}

export interface Project {
  id: string;
  initiativeId: string;
  title: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  assigneeIds: string[];
}

export interface Initiative {
  id: string;
  title: string;
  color: string;
  projectIds: string[];
}

export interface RoadmapState {
  initiatives: Initiative[];
  projects: Project[];
  people: Person[];
}

export interface UndoAction {
  description: string;
  previousState: RoadmapState;
}
