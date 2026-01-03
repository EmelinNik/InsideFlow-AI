import React, { useState } from 'react';
import { AuthorProfile, NarrativeVoice } from '../types';
import { UserCircle2, Edit2, Save, X, Sparkles } from 'lucide-react';

interface AuthorProfileViewProps {
  profile: AuthorProfile;
  onUpdate: (profile: AuthorProfile) => void;
  onRetakeOnboarding: () => void;
}

export const AuthorProfileView: React.FC<AuthorProfileViewProps> = ({ profile, onUpdate, onRetakeOnboarding }) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempData, setTempData] = useState<AuthorProfile>(profile);

  const startEdit = (section: string) => {
    setTempData(profile);
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setTempData(profile);
  };

  const saveEdit = () => {
    onUpdate(tempData);
    setEditingSection(null);
  };

  const handleChange = (field: keyof AuthorProfile, value: string) => {
    setTempData(prev => ({ ...prev, [field]: value }));
  };

  const SectionHeader = ({ title, sectionKey }: { title: string, sectionKey: string }) => (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      {editingSection !== sectionKey && (
        <button onClick={() => startEdit(sectionKey)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors">
          <Edit2 size={14} />
        </button>
      )}
    </div>
  );

  const EditActions = ({ sectionKey }: { sectionKey: string }) => (
    editingSection === sectionKey ? (
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Отмена</button>
        <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1">
          <Save size={14} /> Сохранить
        </button>
      </div>
    ) : null
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={40} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                 {editingSection === 'identity' ? (
                     <div className="flex flex-col gap-2">
                        <input 
                           className="text-xl font-bold border border-indigo-200 bg-white text-slate-900 rounded px-2 py-1" 
                           value={tempData.name} 
                           onChange={e => handleChange('name', e.target.value)}
                        />
                        <input 
                           className="text-sm text-slate-500 border border-indigo-200 bg-white text-slate-900 rounded px-2 py-1" 
                           value={tempData.role} 
                           onChange={e => handleChange('role', e.target.value)}
                        />
                         <div className="flex gap-2">
                            <button onClick={saveEdit} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Сохранить</button>
                            <button onClick={cancelEdit} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">Отмена</button>
                         </div>
                     </div>
                 ) : (
                    <div className="group relative pr-8">
                        <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                        <p className="text-slate-500">{profile.role || 'Роль не указана'}</p>
                        <button 
                            onClick={() => startEdit('identity')}
                            className="absolute right-0 top-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Edit2 size={16}/>
                        </button>
                    </div>
                 )}
              </div>
              
              {profile.telegramId && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-2 inline-block font-medium border border-blue-100">
                  Telegram Connected
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={onRetakeOnboarding}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors text-sm border border-slate-200 hover:border-indigo-200 bg-slate-50 hover:bg-white"
          >
            <Sparkles size={16} />
            <span>Пройти опрос заново</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLUMN 1: Persona & Voice */}
          <div className="space-y-6">
            
            {/* Voice & Tone */}
            <div className={`p-5 rounded-xl border transition-all ${editingSection === 'voice' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <SectionHeader title="Голос и Тон" sectionKey="voice" />
              {editingSection === 'voice' ? (
                <div className="space-y-3">
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Голос</label>
                       <select 
                        className="w-full text-sm border border-indigo-300 rounded p-2 bg-white text-slate-900"
                        value={tempData.voice}
                        onChange={e => handleChange('voice', e.target.value)}
                       >
                           {Object.values(NarrativeVoice).map(v => <option key={v} value={v}>{v}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Тон (прилагательные)</label>
                       <input 
                        className="w-full text-sm border border-indigo-300 rounded p-2 text-slate-900"
                        value={tempData.tone}
                        onChange={e => handleChange('tone', e.target.value)}
                       />
                   </div>
                </div>
              ) : (
                <div className="space-y-3">
                   <div>
                       <p className="text-xs text-slate-400">Повествование</p>
                       <p className="font-medium text-slate-800">{profile.voice}</p>
                   </div>
                   <div>
                       <p className="text-xs text-slate-400">Эмоциональная окраска</p>
                       <p className="font-medium text-slate-800">{profile.tone}</p>
                   </div>
                </div>
              )}
              <EditActions sectionKey="voice" />
            </div>

            {/* Values & Taboos */}
             <div className={`p-5 rounded-xl border transition-all ${editingSection === 'values' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-200'}`}>
              <SectionHeader title="Ценности и Табу" sectionKey="values" />
               {editingSection === 'values' ? (
                <div className="space-y-3">
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Ценности</label>
                       <textarea 
                        className="w-full text-sm border border-indigo-300 rounded p-2 h-20 text-slate-900"
                        value={tempData.values}
                        onChange={e => handleChange('values', e.target.value)}
                       />
                   </div>
                   <div>
                       <label className="text-xs text-red-500 block mb-1">Табу (Что запрещено)</label>
                       <textarea 
                        className="w-full text-sm border border-red-200 rounded p-2 h-20 bg-red-50 text-slate-900"
                        value={tempData.taboos}
                        onChange={e => handleChange('taboos', e.target.value)}
                       />
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div>
                       <p className="text-xs text-slate-400 mb-1">Ключевые ценности</p>
                       <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">{profile.values || "Не указано"}</p>
                   </div>
                   <div>
                       <p className="text-xs text-red-400 mb-1">Строгие Табу</p>
                       <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">{profile.taboos || "Нет ограничений"}</p>
                   </div>
                </div>
              )}
              <EditActions sectionKey="values" />
            </div>

          </div>

          {/* COLUMN 2: Audience & Goals */}
          <div className="space-y-6">
             <div className={`p-5 rounded-xl border transition-all ${editingSection === 'audience' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <SectionHeader title="Целевая Аудитория (ЦА)" sectionKey="audience" />
               {editingSection === 'audience' ? (
                <div className="space-y-3">
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Кто ваша ЦА?</label>
                       <input 
                        className="w-full text-sm border border-indigo-300 rounded p-2 bg-white text-slate-900"
                        value={tempData.targetAudience}
                        onChange={e => handleChange('targetAudience', e.target.value)}
                        placeholder="Напр: Предприниматели 30-40 лет..."
                       />
                   </div>
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Их боли и проблемы</label>
                       <textarea 
                        className="w-full text-sm border border-indigo-300 rounded p-2 h-24 text-slate-900"
                        value={tempData.audiencePainPoints}
                        onChange={e => handleChange('audiencePainPoints', e.target.value)}
                       />
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div>
                       <p className="text-xs text-slate-400">Портрет ЦА</p>
                       <p className="font-bold text-slate-800 text-lg">{profile.targetAudience || "Не указана"}</p>
                   </div>
                   <div>
                       <p className="text-xs text-slate-400 mb-1">Боли и триггеры</p>
                       <p className="text-sm text-slate-700 italic">"{profile.audiencePainPoints}"</p>
                   </div>
                </div>
              )}
              <EditActions sectionKey="audience" />
            </div>

            <div className={`p-5 rounded-xl border transition-all ${editingSection === 'goals' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-200'}`}>
              <SectionHeader title="Цель Контента" sectionKey="goals" />
               {editingSection === 'goals' ? (
                <div className="space-y-3">
                   <div>
                       <label className="text-xs text-slate-500 block mb-1">Главная цель</label>
                       <textarea 
                        className="w-full text-sm border border-indigo-300 rounded p-2 h-24 text-slate-900"
                        value={tempData.contentGoals}
                        onChange={e => handleChange('contentGoals', e.target.value)}
                       />
                   </div>
                </div>
              ) : (
                <div>
                   <p className="text-sm text-slate-700 leading-relaxed">{profile.contentGoals}</p>
                </div>
              )}
              <EditActions sectionKey="goals" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};