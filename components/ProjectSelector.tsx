
import React, { useState } from 'react';
import { Project, SubscriptionPlan, PLAN_LIMITS } from '../types';
import { Folder, Check, FolderPlus, Lock, ChevronDown, Edit2, Trash2, X } from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  currentProjectId: string | null;
  subscriptionPlan: SubscriptionPlan;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProjectId,
  subscriptionPlan,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const limit = PLAN_LIMITS[subscriptionPlan];
  const canCreate = projects.length < limit;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const startEditing = (project: Project, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(project.id);
      setEditName(project.name);
  };

  const saveEditing = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingId && editName.trim()) {
          onRenameProject(editingId, editName.trim());
          setEditingId(null);
      }
  };
  
  const cancelEditing = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteProject(id);
  };

  return (
    <div className="border-b border-slate-100 mb-2">
      <div 
        className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
           <span>Проекты ({projects.length}/{limit})</span>
           {!canCreate && <Lock size={10} className="text-amber-500"/>}
        </div>
        <ChevronDown 
            size={14} 
            className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
        />
      </div>

      {!isCollapsed && (
          <div className="px-4 pb-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                  {editingId === project.id ? (
                      <div className="flex items-center gap-1 px-2 py-1.5 bg-white border border-indigo-300 rounded-md shadow-sm">
                          <input 
                              autoFocus
                              className="w-full text-xs outline-none text-slate-700 font-medium bg-transparent"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditing(e as any);
                                  if (e.key === 'Escape') cancelEditing(e as any);
                              }}
                          />
                          <button onClick={saveEditing} className="text-green-600 hover:text-green-700 p-0.5"><Check size={12}/></button>
                          <button onClick={cancelEditing} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={12}/></button>
                      </div>
                  ) : (
                    <button
                        onClick={() => onSelectProject(project.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors group/item ${
                        project.id === currentProjectId
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <Folder size={16} className={project.id === currentProjectId ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="text-sm font-medium truncate">{project.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <div 
                                onClick={(e) => startEditing(project, e)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white"
                                title="Переименовать"
                            >
                                <Edit2 size={12}/>
                            </div>
                            <div 
                                onClick={(e) => handleDelete(project.id, e)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-white"
                                title="Удалить"
                            >
                                <Trash2 size={12}/>
                            </div>
                        </div>
                    </button>
                  )}
              </div>
            ))}

            {isCreating ? (
                <form onSubmit={handleCreateSubmit} className="mt-2 animate-in fade-in slide-in-from-top-1">
                <input
                    autoFocus
                    type="text"
                    placeholder="Название проекта..."
                    className="w-full text-xs px-2 py-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none mb-1 bg-white" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                />
                <div className="flex gap-1">
                    <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                    Создать
                    </button>
                    <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 bg-slate-100 text-slate-500 text-[10px] py-1 rounded hover:bg-slate-200"
                    >
                    Отмена
                    </button>
                </div>
                </form>
            ) : (
                <button
                onClick={() => {
                    if (canCreate) {
                        setIsCreating(true);
                    } else {
                        alert(`Ваш тариф ${subscriptionPlan} позволяет создать до ${limit} проектов. Обновите тариф для увеличения лимита.`);
                    }
                }}
                className={`w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-dashed transition-colors ${
                    canCreate 
                    ? 'border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-600' 
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
                >
                <FolderPlus size={16} />
                <span>Новый проект</span>
                </button>
            )}
          </div>
      )}
    </div>
  );
};
