import React, { ReactNode } from 'react';
import { BookOpen, PenTool, User, Zap, LayoutDashboard, LogOut, Calendar } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'create', label: 'Создать контент', icon: PenTool },
    { id: 'style', label: 'Тренировка стиля', icon: Zap },
    { id: 'profile', label: 'Профиль автора', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-900">InsideFlow AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
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
        
        <div className="p-4 border-t border-slate-100 space-y-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Выйти
          </button>

          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Текущий план</p>
            <p className="text-sm font-semibold text-slate-800">Pro Архитектор</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
};