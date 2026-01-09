
import React, { ReactNode } from 'react';
import { BookOpen, PenTool, User, Zap, LayoutDashboard, LogOut, Calendar, ChevronRight, BarChart3, HelpCircle, Settings, Package } from 'lucide-react';
import { Project, SubscriptionPlan } from '../types';
import { ProjectSelector } from './ProjectSelector';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  currentPlan: SubscriptionPlan;
  projects: Project[];
  currentProjectId: string | null;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  onOpenPricing: () => void;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenGuide: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  currentPlan, 
  projects,
  currentProjectId,
  onNavigate, 
  onLogout, 
  onOpenPricing,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onOpenGuide
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'calendar', label: 'План', icon: Calendar },
    { id: 'create', label: 'Создать', icon: PenTool },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'style', label: 'Стиль проекта', icon: Zap },
    { id: 'profile', label: 'Профиль проекта', icon: User },
    { id: 'products', label: 'Товары и услуги', icon: Package },
    { id: 'settings', label: 'Настройки AI', icon: Settings },
  ];

  const activeProject = projects.find(p => p.id === currentProjectId);

  const getPlanLabel = (plan: SubscriptionPlan) => {
      switch (plan) {
          case SubscriptionPlan.FREE: return 'Free';
          case SubscriptionPlan.START: return 'Start';
          case SubscriptionPlan.PRO: return 'Pro';
          case SubscriptionPlan.EXPERT: return 'Expert';
          case SubscriptionPlan.AGENCY: return 'Agency';
          default: return 'Free';
      }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
      if (plan === SubscriptionPlan.PRO) return 'bg-indigo-600 text-white';
      if (plan === SubscriptionPlan.EXPERT) return 'bg-purple-600 text-white';
      if (plan === SubscriptionPlan.AGENCY) return 'bg-slate-900 text-white';
      return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-900">Контент.Редактор</span>
        </div>

        <ProjectSelector 
            projects={projects}
            currentProjectId={currentProjectId}
            subscriptionPlan={currentPlan}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
        />
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={onOpenGuide}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <HelpCircle size={18} />
            Как это работает?
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Выйти
          </button>

          <div 
            onClick={onOpenPricing}
            className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group mt-2"
          >
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-medium uppercase">Тариф</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500" />
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${getPlanColor(currentPlan)}`}>
               {getPlanLabel(currentPlan)}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <BookOpen size={14} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-indigo-900 leading-none">Контент.Редактор</h1>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]">
                    {activeProject?.name || 'Проект не выбран'}
                </p>
              </div>
          </div>
          <div className="flex gap-2">
             <button onClick={onOpenGuide} className="p-1.5 text-slate-400">
                <HelpCircle size={18} />
             </button>
             <button onClick={onOpenPricing} className={`text-[9px] font-bold px-2 py-1 rounded ${getPlanColor(currentPlan)}`}>
                {getPlanLabel(currentPlan)}
             </button>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around pb-safe">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
      </nav>
    </div>
  );
};
