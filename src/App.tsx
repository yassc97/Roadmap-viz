import { useState, useEffect, useCallback } from 'react';
import { useRoadmapStore } from './store';
import { Timeline } from './components/Timeline';
import { UndoToast } from './components/UndoToast';
import './App.css';

function App() {
  const store = useRoadmapStore();
  const [collapsedInitiatives, setCollapsedInitiatives] = useState<Set<string>>(new Set());
  const [addingInitiative, setAddingInitiative] = useState(false);
  const [newInitiativeTitle, setNewInitiativeTitle] = useState('');

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedInitiatives(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddInitiative = () => {
    if (newInitiativeTitle.trim()) {
      store.addInitiative(newInitiativeTitle.trim());
      setNewInitiativeTitle('');
      setAddingInitiative(false);
    }
  };

  // Keyboard shortcut: Cmd+Z for undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        store.undo();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [store.undo]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="#818cf8" />
            <path d="M5 10h10M10 5v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h1 className="app-title">Roadmap</h1>
        </div>
        <div className="app-header-right">
          {!addingInitiative ? (
            <button
              className="add-initiative-btn"
              onClick={() => setAddingInitiative(true)}
            >
              + Initiative
            </button>
          ) : (
            <div className="add-initiative-input-wrap">
              <input
                autoFocus
                value={newInitiativeTitle}
                onChange={e => setNewInitiativeTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddInitiative();
                  if (e.key === 'Escape') { setAddingInitiative(false); setNewInitiativeTitle(''); }
                }}
                placeholder="Initiative name..."
                className="add-initiative-input"
              />
              <button className="add-initiative-confirm" onClick={handleAddInitiative}>
                Add
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Timeline */}
      {store.sortedInitiatives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="14" width="40" height="6" rx="3" fill="#374151" />
              <rect x="8" y="24" width="28" height="4" rx="2" fill="#1f2937" />
              <rect x="8" y="32" width="20" height="4" rx="2" fill="#1f2937" />
            </svg>
          </div>
          <p className="empty-text">No initiatives yet</p>
          <button
            className="empty-cta"
            onClick={() => setAddingInitiative(true)}
          >
            Create your first initiative
          </button>
        </div>
      ) : (
        <Timeline
          initiatives={store.sortedInitiatives}
          projects={store.state.projects}
          people={store.state.people}
          getInitiativeDateRange={store.getInitiativeDateRange}
          getInitiativeAssignees={store.getInitiativeAssignees}
          onUpdateProject={store.updateProjectWithUndo}
          onUpdateInitiative={store.updateInitiative}
          onDeleteProject={store.deleteProject}
          onDeleteInitiative={store.deleteInitiative}
          onAddProject={store.addProject}
          collapsedInitiatives={collapsedInitiatives}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Undo toast */}
      {store.undoToast && (
        <UndoToast action={store.undoToast} onUndo={store.undo} />
      )}
    </div>
  );
}

export default App;
