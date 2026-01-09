
import React, { useState } from 'react';
import { PromptKey, PlatformConfig, ArchetypeConfig, ArchetypeStep } from '../types';
import { DEFAULT_PROMPTS, PROMPT_VARIABLES, PROMPT_TITLES } from '../constants';
import { Terminal, Save, RotateCcw, AlertTriangle, Check, Info, Settings, Layout, Plus, Trash2, Edit, ArrowUp, ArrowDown, Lock } from 'lucide-react';

interface PromptSettingsProps {
  customPrompts: Partial<Record<PromptKey, string>> | undefined;
  platformConfigs: PlatformConfig[];
  archetypeConfigs: ArchetypeConfig[];
  onSavePrompts: (prompts: Partial<Record<PromptKey, string>>) => void;
  onSavePlatforms: (platforms: PlatformConfig[]) => void;
  onSaveArchetypes: (archetypes: ArchetypeConfig[]) => void;
}

type SettingsTab = 'prompts' | 'platforms' | 'archetypes';

// Extended type for internal state to track "new" items
interface EditableArchetypeStep extends ArchetypeStep {
    _isNew?: boolean;
}

interface EditableArchetypeConfig extends Omit<ArchetypeConfig, 'structure'> {
    structure: EditableArchetypeStep[];
}

export const PromptSettings: React.FC<PromptSettingsProps> = ({ 
    customPrompts, 
    platformConfigs, 
    archetypeConfigs,
    onSavePrompts,
    onSavePlatforms,
    onSaveArchetypes
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('prompts');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // -- PROMPT STATE --
  const [selectedPromptKey, setSelectedPromptKey] = useState<PromptKey>('generate_unit_options');
  const [promptCode, setPromptCode] = useState(customPrompts?.[selectedPromptKey] || DEFAULT_PROMPTS[selectedPromptKey]);

  // -- PLATFORM STATE --
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(platformConfigs[0]?.id || null);
  const [platformData, setPlatformData] = useState<PlatformConfig | null>(platformConfigs[0] ? { ...platformConfigs[0] } : null);

  // -- ARCHETYPE STATE --
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(archetypeConfigs[0]?.id || null);
  const [archetypeData, setArchetypeData] = useState<EditableArchetypeConfig | null>(null);

  // Initialize archetype data handling migration and locking existing IDs
  React.useEffect(() => {
      if (selectedArchetypeId) {
          const original = archetypeConfigs.find(a => a.id === selectedArchetypeId);
          if (original) {
              // Deep copy, migrate structure if needed, and mark existing as NOT new (locked ID)
              const structure = original.structure.map((s: any) => {
                  const base = typeof s === 'string' ? { id: s, description: 'Инструкция не задана.' } : { ...s };
                  return { ...base, _isNew: false };
              });
              setArchetypeData({ ...original, structure });
          }
      }
  }, [selectedArchetypeId, archetypeConfigs]);


  // HANDLERS FOR PROMPTS
  const handleSelectPrompt = (key: PromptKey) => {
      if (unsavedChanges && !confirm("У вас есть несохраненные изменения. Перейти?")) return;
      setSelectedPromptKey(key);
      setPromptCode(customPrompts?.[key] || DEFAULT_PROMPTS[key]);
      setUnsavedChanges(false);
  };

  const handleSavePrompt = () => {
      const requiredVars = PROMPT_VARIABLES[selectedPromptKey];
      const missing = requiredVars.filter(v => !promptCode.includes(v));
      if (missing.length > 0) {
          alert(`Ошибка валидации! Отсутствуют переменные: ${missing.join(', ')}`);
          return;
      }
      onSavePrompts({ ...customPrompts, [selectedPromptKey]: promptCode });
      setUnsavedChanges(false);
  };

  // HANDLERS FOR PLATFORMS
  const handleSelectPlatform = (id: string) => {
      if (unsavedChanges && !confirm("Перейти без сохранения?")) return;
      const original = platformConfigs.find(p => p.id === id);
      if (original) {
          setSelectedPlatformId(id);
          setPlatformData({ ...original });
          setUnsavedChanges(false);
      }
  };

  const handleSavePlatform = () => {
      if (!platformData) return;
      const updatedList = platformConfigs.map(p => p.id === platformData.id ? platformData : p);
      onSavePlatforms(updatedList);
      setUnsavedChanges(false);
  };
  
  const handleAddPlatform = () => {
      const name = prompt("Название новой платформы:");
      if (!name) return;
      const id = name.toLowerCase().replace(/\s+/g, '_');
      if (platformConfigs.find(p => p.id === id)) {
          alert("Платформа с таким ID уже существует");
          return;
      }
      const newPlatform: PlatformConfig = {
          id,
          name,
          rules: "Опишите стиль и правила для этой платформы...",
          isSystem: false
      };
      onSavePlatforms([...platformConfigs, newPlatform]);
      handleSelectPlatform(id); // Select new
  };

  const handleDeletePlatform = (id: string) => {
      if (!confirm("Удалить платформу?")) return;
      onSavePlatforms(platformConfigs.filter(p => p.id !== id));
      if (selectedPlatformId === id) {
          setSelectedPlatformId(null);
          setPlatformData(null);
      }
  };

  // HANDLERS FOR ARCHETYPES
  const handleSelectArchetype = (id: string) => {
      if (unsavedChanges && !confirm("Перейти без сохранения?")) return;
      setSelectedArchetypeId(id);
      setUnsavedChanges(false);
  };

  const handleSaveArchetype = () => {
      if (!archetypeData) return;
      
      // Clean up internal flags before saving
      const cleanStructure = archetypeData.structure.map(({ id, description }) => ({ id, description }));
      const cleanData: ArchetypeConfig = { ...archetypeData, structure: cleanStructure };

      const updatedList = archetypeConfigs.map(a => a.id === cleanData.id ? cleanData : a);
      onSaveArchetypes(updatedList);
      
      // Update local state to lock newly saved items
      setArchetypeData({
          ...cleanData,
          structure: cleanData.structure.map(s => ({ ...s, _isNew: false }))
      });
      setUnsavedChanges(false);
  };

  const handleAddArchetype = () => {
      const name = prompt("Название нового формата:");
      if (!name) return;
      const id = name.toLowerCase().replace(/\s+/g, '_');
      const newArchetype: ArchetypeConfig = {
          id,
          name,
          structure: [{ id: 'HOOK', description: 'Зацепи читателя' }, { id: 'BODY', description: 'Основная мысль' }],
          isSystem: false
      };
      onSaveArchetypes([...archetypeConfigs, newArchetype]);
      handleSelectArchetype(id);
  };

  const handleDeleteArchetype = (id: string) => {
      if (!confirm("Удалить формат?")) return;
      onSaveArchetypes(archetypeConfigs.filter(a => a.id !== id));
      if (selectedArchetypeId === id) {
          setSelectedArchetypeId(null);
          setArchetypeData(null);
      }
  };

  // Archetype Step Editing
  const updateStep = (index: number, field: keyof EditableArchetypeStep, value: string) => {
      if (!archetypeData) return;
      const newStructure = [...archetypeData.structure];
      newStructure[index] = { ...newStructure[index], [field]: value };
      setArchetypeData({ ...archetypeData, structure: newStructure });
      setUnsavedChanges(true);
  };

  const addStep = () => {
      if (!archetypeData) return;
      setArchetypeData({
          ...archetypeData,
          structure: [...archetypeData.structure, { id: 'NEW_STEP', description: 'Инструкция для AI...', _isNew: true }]
      });
      setUnsavedChanges(true);
  };

  const removeStep = (index: number) => {
      if (!archetypeData) return;
      const newStructure = [...archetypeData.structure];
      newStructure.splice(index, 1);
      setArchetypeData({ ...archetypeData, structure: newStructure });
      setUnsavedChanges(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
      if (!archetypeData) return;
      const newStructure = [...archetypeData.structure];
      if (direction === 'up' && index > 0) {
          [newStructure[index], newStructure[index - 1]] = [newStructure[index - 1], newStructure[index]];
      } else if (direction === 'down' && index < newStructure.length - 1) {
          [newStructure[index], newStructure[index + 1]] = [newStructure[index + 1], newStructure[index]];
      }
      setArchetypeData({ ...archetypeData, structure: newStructure });
      setUnsavedChanges(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col">
       <div className="mb-6">
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Settings className="text-indigo-600" />
               Центр Управления AI
           </h2>
           <p className="text-slate-500 mt-1">
               Настраивайте промпты, правила для соцсетей и структуры постов.
           </p>
       </div>

       {/* TABS */}
       <div className="flex border-b border-slate-200 mb-6">
           <button 
             onClick={() => setActiveTab('prompts')}
             className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'prompts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
               <Terminal size={16}/> Системные Промпты
           </button>
           <button 
             onClick={() => setActiveTab('platforms')}
             className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'platforms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
               <Layout size={16}/> Платформы
           </button>
           <button 
             onClick={() => setActiveTab('archetypes')}
             className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'archetypes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
               <Settings size={16}/> Форматы (Архетипы)
           </button>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
           
           {/* --- TAB: PROMPTS --- */}
           {activeTab === 'prompts' && (
             <>
                <div className="w-64 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-shrink-0">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Доступные Агенты
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {(Object.keys(DEFAULT_PROMPTS) as PromptKey[]).map(key => (
                            <button
                                key={key}
                                onClick={() => handleSelectPrompt(key)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedPromptKey === key ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {PROMPT_TITLES[key]}
                                {customPrompts?.[key] && <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-1 rounded">Edited</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-bold text-slate-800">{PROMPT_TITLES[selectedPromptKey]}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedPromptKey}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => { if(confirm("Сбросить?")) { setPromptCode(DEFAULT_PROMPTS[selectedPromptKey]); setUnsavedChanges(true); } }} className="text-slate-400 hover:text-slate-600 p-2"><RotateCcw size={16}/></button>
                             <button onClick={handleSavePrompt} disabled={!unsavedChanges} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-indigo-700 disabled:opacity-50">{unsavedChanges ? 'Сохранить' : 'Сохранено'}</button>
                        </div>
                    </div>
                    <textarea 
                        className="flex-1 w-full p-6 font-mono text-sm leading-relaxed outline-none resize-none text-slate-800 bg-[#fafafa]"
                        value={promptCode}
                        onChange={(e) => { setPromptCode(e.target.value); setUnsavedChanges(true); }}
                        spellCheck={false}
                    />
                    <div className="bg-white border-t border-slate-200 p-4">
                        <div className="flex flex-wrap gap-2">
                            {PROMPT_VARIABLES[selectedPromptKey].map(v => (
                                <span key={v} className={`px-2 py-1 rounded border text-[10px] font-mono cursor-pointer ${promptCode.includes(v) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200 font-bold'}`} onClick={() => { setPromptCode(prev => prev + ` ${v}`); setUnsavedChanges(true); }}>{v}</span>
                            ))}
                        </div>
                    </div>
                </div>
             </>
           )}

           {/* --- TAB: PLATFORMS --- */}
           {activeTab === 'platforms' && (
               <>
                <div className="w-64 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-shrink-0">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Платформы</span>
                        <button onClick={handleAddPlatform} className="text-indigo-600 hover:bg-indigo-50 rounded p-1"><Plus size={14}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {platformConfigs.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                                <button
                                    onClick={() => handleSelectPlatform(p.id)}
                                    className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedPlatformId === p.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {p.name}
                                </button>
                                {!p.isSystem && (
                                    <button onClick={() => handleDeletePlatform(p.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {platformData ? (
                        <>
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <input 
                                    className="font-bold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                                    value={platformData.name}
                                    onChange={(e) => { setPlatformData({...platformData, name: e.target.value}); setUnsavedChanges(true); }}
                                    disabled={platformData.isSystem} 
                                />
                                <button onClick={handleSavePlatform} disabled={!unsavedChanges} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-indigo-700 disabled:opacity-50">{unsavedChanges ? 'Сохранить' : 'Сохранено'}</button>
                            </div>
                            <div className="flex-1 flex flex-col p-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Правила и стиль для AI</label>
                                <textarea 
                                    className="flex-1 w-full p-4 border border-slate-200 rounded-lg text-sm leading-relaxed outline-none resize-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                    value={platformData.rules}
                                    onChange={(e) => { setPlatformData({...platformData, rules: e.target.value}); setUnsavedChanges(true); }}
                                />
                                <p className="text-xs text-slate-400">
                                    Эти правила добавляются в промпт при генерации контента для данной платформы.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">Выберите платформу</div>
                    )}
                </div>
               </>
           )}

           {/* --- TAB: ARCHETYPES --- */}
           {activeTab === 'archetypes' && (
               <>
                <div className="w-64 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-shrink-0">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Форматы</span>
                        <button onClick={handleAddArchetype} className="text-indigo-600 hover:bg-indigo-50 rounded p-1"><Plus size={14}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {archetypeConfigs.map(a => (
                            <div key={a.id} className="flex items-center gap-1">
                                <button
                                    onClick={() => handleSelectArchetype(a.id)}
                                    className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedArchetypeId === a.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {a.name}
                                </button>
                                {!a.isSystem && (
                                    <button onClick={() => handleDeleteArchetype(a.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {archetypeData ? (
                        <>
                             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <input 
                                    className="font-bold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                                    value={archetypeData.name}
                                    onChange={(e) => { setArchetypeData({...archetypeData, name: e.target.value}); setUnsavedChanges(true); }}
                                    disabled={archetypeData.isSystem}
                                />
                                <button onClick={handleSaveArchetype} disabled={!unsavedChanges} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-indigo-700 disabled:opacity-50">{unsavedChanges ? 'Сохранить' : 'Сохранено'}</button>
                            </div>
                            
                            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 overflow-y-auto">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Структура (Блоки)</label>
                                    <button onClick={addStep} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1">
                                        <Plus size={12}/> Добавить шаг
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">
                                    Настройте структуру поста. ИИ генерирует текст последовательно для каждого блока.
                                    <br/>
                                    <span className="flex items-center gap-1 mt-1"><Lock size={10}/> ID старых блоков нельзя менять, чтобы не сломать историю генераций.</span>
                                </p>
                                
                                <div className="space-y-2">
                                    {archetypeData.structure.map((step, i) => (
                                        <div key={i} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                                            <div className="flex flex-col gap-1 mt-1">
                                                <button onClick={() => moveStep(i, 'up')} disabled={i === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-30"><ArrowUp size={12}/></button>
                                                <button onClick={() => moveStep(i, 'down')} disabled={i === archetypeData.structure.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-30"><ArrowDown size={12}/></button>
                                            </div>
                                            
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div className="md:col-span-1 relative">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ID (Код)</label>
                                                    <input 
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-indigo-900 outline-none uppercase disabled:text-slate-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        value={step.id}
                                                        onChange={(e) => updateStep(i, 'id', e.target.value.toUpperCase())}
                                                        placeholder="HOOK"
                                                        disabled={!step._isNew}
                                                        title={!step._isNew ? "ID нельзя изменить после сохранения" : "Введите уникальный ID"}
                                                    />
                                                    {!step._isNew && <Lock size={10} className="absolute top-8 right-2 text-slate-400"/>}
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Инструкция для AI</label>
                                                    <textarea 
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 outline-none resize-none h-16"
                                                        value={step.description}
                                                        onChange={(e) => updateStep(i, 'description', e.target.value)}
                                                        placeholder="Опишите, что ИИ должен написать в этом блоке..."
                                                    />
                                                </div>
                                            </div>

                                            <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-500 p-1 mt-1"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">Выберите формат</div>
                    )}
                </div>
               </>
           )}

       </div>
    </div>
  );
};
