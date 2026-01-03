import React from 'react';
import { UserCircle2, Lock, LogIn, Trash2 } from 'lucide-react';

interface LoginProps {
  userName: string;
  role: string;
  onLogin: () => void;
  onReset: () => void;
}

export const Login: React.FC<LoginProps> = ({ userName, role, onLogin, onReset }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
            <UserCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white">С возвращением!</h2>
          <p className="text-indigo-200 text-sm mt-1">Профиль найден на этом устройстве</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <h3 className="text-xl font-bold text-slate-900">{userName}</h3>
            <p className="text-slate-500 text-sm">{role}</p>
          </div>

          <button
            onClick={onLogin}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            <LogIn size={20} />
            Войти в аккаунт
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400">или</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm("Вы уверены? Это удалит ваш текущий профиль и все сценарии.")) {
                onReset();
              }
            }}
            className="w-full text-slate-500 hover:text-red-600 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Это не я, создать новый профиль
          </button>
        </div>
      </div>
      
      <p className="text-slate-400 text-xs mt-6 flex items-center gap-1">
        <Lock size={12} /> Ваши данные хранятся безопасно в браузере
      </p>
    </div>
  );
};