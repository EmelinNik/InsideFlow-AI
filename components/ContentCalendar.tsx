
import React, { useState, useEffect } from 'react';
import { ContentPlanItem, ContentGoal, ContentStrategy, PlanStatus, AuthorProfile, StrategyPreset, LanguageProfile, GeneratedScript, CalendarAnalysis, PlatformConfig, ArchetypeConfig, TargetPlatform, PlatformName, PostArchetype } from '../types';
import { generateContentPlan, calculatePlanDistribution, analyzeContentCalendar } from '../services/geminiService';
import { Calendar as CalendarIcon, Plus, Wand2, RefreshCw, BarChart3, ArrowRight, ArrowLeft, Loader2, CheckCircle, FileEdit, AlertCircle, Target, Sparkles, X, Microscope, Check, LayoutGrid, List, ToggleRight, ToggleLeft, Copy, Share2, Clock, PieChart, Lightbulb } from 'lucide-react';
import { PlanItemModal } from './PlanItemModal';
import ReactMarkdown from 'react-markdown';
import { createId } from '../utils/id';

interface ContentCalendarProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  plan: ContentPlanItem[];
  strategy: ContentStrategy;
  platformConfigs: PlatformConfig[];
  archetypeConfigs: ArchetypeConfig[];
  onUpdatePlan: (newPlan: ContentPlanItem[]) => void;
  onUpdateStrategy: (newStrategy: ContentStrategy) => void;
  onGenerateContent: (item: ContentPlanItem) => void;
  onScriptGenerated: (script: GeneratedScript) => void;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  authorProfile,
  languageProfile,
  plan,
  strategy,
  platformConfigs,
  archetypeConfigs,
  onUpdatePlan,
  onUpdateStrategy,
  onGenerateContent,
  onScriptGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentPlanItem | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CalendarAnalysis | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Initialize dates if missing
  useEffect(() => {
    if (!strategy.startDate || !strategy.endDate) {
       const start = new Date();
       const end = new Date();
       end.setDate(end.getDate() + 14); // Default 2 weeks
       onUpdateStrategy({
           ...strategy,
           startDate: start.toISOString().split('T')[0],
           endDate: end.toISOString().split('T')[0]
       });
    }
  }, []);

  const handleGeneratePlan = async () => {
    if (!strategy.platforms || strategy.platforms.length === 0) {
        alert("Пожалуйста, выберите хотя бы одну платформу.");
        return;
    }

    setIsGenerating(true);
    try {
      const newItems = await generateContentPlan(authorProfile, strategy, new Date(), platformConfigs);
      const updatedPlan = [...plan, ...newItems].sort((a, b) => {
          const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (a.time || "00:00").localeCompare(b.time || "00:00");
      });
      onUpdatePlan(updatedPlan);
    } catch (e) {
      alert("Не удалось сгенерировать план. Проверьте настройки API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzePlan = async () => {
    if (plan.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeContentCalendar(strategy, plan);
      setAnalysisResult(result);
    } catch (e) {
      setAnalysisResult({ status: 'normal', report: 'Ошибка анализа' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateItem = (dateStr: string) => {
    const newItem: ContentPlanItem = {
      id: createId(),
      date: dateStr,
      time: "12:00",
      topic: "Новая тема",
      description: "",
      rationale: "Ручное создание",
      platform: strategy.platforms[0] || TargetPlatform.TELEGRAM,
      archetype: PostArchetype.SHORT_POST,
      goal: ContentGoal.AWARENESS,
      status: PlanStatus.IDEA
    };
    onUpdatePlan([...plan, newItem]);
    setSelectedItem(newItem);
    setIsModalOpen(true);
  };

  const handleSaveItem = (updatedItem: ContentPlanItem) => {
    const newPlan = plan.map(p => p.id === updatedItem.id ? updatedItem : p);
    if (!plan.find(p => p.id === updatedItem.id)) newPlan.push(updatedItem);
    onUpdatePlan(newPlan);
    setSelectedItem(updatedItem); // Sync selected item to avoid stale data in modal
  };

  const handleDeleteItem = (id: string) => {
      onUpdatePlan(plan.filter(p => p.id !== id));
      setIsModalOpen(false);
  };

  const handleItemClick = (item: ContentPlanItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  
  const handleDateNavigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(selectedDate);
      if (viewMode === 'month') {
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      }
      setSelectedDate(newDate);
  };

  const togglePlatform = (platformName: PlatformName) => {
      const current = strategy.platforms;
      let newPlatforms = current.includes(platformName) ? current.filter(p => p !== platformName) : [...current, platformName];
      onUpdateStrategy({ ...strategy, platforms: newPlatforms });
  };

  const updateStrategyToggle = (field: keyof ContentStrategy, value: any) => {
      onUpdateStrategy({ ...strategy, [field]: value });
  };

  const getGoalColor = (goal: ContentGoal) => {
    if (goal.includes('Охват')) return 'bg-blue-50 text-blue-800 border-blue-100';
    if (goal.includes('Доверие')) return 'bg-purple-50 text-purple-800 border-purple-100';
    if (goal.includes('Удержание')) return 'bg-amber-50 text-amber-800 border-amber-100';
    if (goal.includes('Продажа')) return 'bg-green-50 text-green-800 border-green-100';
    return 'bg-slate-50 text-slate-800';
  };

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.DONE: return <span className="bg-green-500 text-white text-[8px] px-1 rounded font-bold uppercase">ГОТОВО</span>;
      case PlanStatus.DRAFT: return <span className="bg-amber-400 text-white text-[8px] px-1 rounded font-bold uppercase">ЧЕРНОВИК</span>;
      case PlanStatus.IDEA: return <span className="bg-slate-300 text-white text-[8px] px-1 rounded font-bold uppercase">ИДЕЯ</span>;
      default: return null;
    }
  }

  // Distribution Preview
  const { goals: goalsPreview, totalPosts: totalPostsPreview } = (() => {
      if (!strategy.startDate || !strategy.endDate) return { goals: [] as ContentGoal[], totalPosts: 0 };
      return calculatePlanDistribution(strategy);
  })();

  const goalCounts = goalsPreview.reduce<Record<string, number>>((acc, goal) => {
      acc[goal] = (acc[goal] || 0) + 1;
      return acc;
  }, {});

  // Calendar Grid Calculation
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
     const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1);
     const dateStr = date.toISOString().split('T')[0];
     const items = plan.filter(p => p.date === dateStr).sort((a,b) => (a.time || "").localeCompare(b.time || ""));
     return { day: i + 1, dateStr, items, dateObj: date, dayName: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()] };
  });

  const weekDays = (() => {
      const dayOfWeek = selectedDate.getDay();
      const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(diff);
      return Array.from({length: 7}, (_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const items = plan.filter(p => p.date === dateStr).sort((a,b) => (a.time || "").localeCompare(b.time || ""));
          return { day: d.getDate(), dateStr, items, dateObj: d, dayName: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()] };
      });
  })();

  const monthName = selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const weekRangeName = `${weekDays[0].dateObj.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})} - ${weekDays[6].dateObj.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}`;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 relative">
       
       <PlanItemModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         item={selectedItem}
         authorProfile={authorProfile}
         languageProfile={languageProfile}
         platformConfigs={platformConfigs}
         archetypeConfigs={archetypeConfigs}
         onSave={handleSaveItem}
         onDelete={handleDeleteItem}
         onScriptGenerated={onScriptGenerated}
       />
       
       {/* ANALYSIS SIDEBAR */}
       <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 flex flex-col ${isAnalysisOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-2">
                 <Microscope size={20} className="text-indigo-600"/>
                 <h3 className="font-bold text-slate-900">Анализ сетки</h3>
             </div>
             <button onClick={() => setIsAnalysisOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
         </div>
         <div className="flex-1 overflow-y-auto p-6">
             {isAnalyzing ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                     <Loader2 size={32} className="animate-spin text-indigo-600"/><p className="text-sm">ИИ проверяет план...</p>
                 </div>
             ) : analysisResult ? (
                 <div className="space-y-6 animate-in fade-in">
                     <div className={`p-4 rounded-xl border flex items-center gap-3 ${analysisResult.status === 'good' ? 'text-green-600 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                         {analysisResult.status === 'good' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                         <div><div className="font-bold text-xs uppercase">Вердикт</div><div className="text-[10px] opacity-90">{analysisResult.status === 'good' ? 'Сетка сбалансирована' : 'Есть замечания'}</div></div>
                     </div>
                     <div className="prose prose-sm prose-slate max-w-none text-slate-700"><ReactMarkdown>{analysisResult.report}</ReactMarkdown></div>
                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                     <Sparkles size={24} className="mb-4 text-slate-300"/><p className="text-sm">Нажмите кнопку анализа для проверки плана.</p>
                 </div>
             )}
         </div>
       </div>

       {/* HEADER & STRATEGY */}
       <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          <div className="flex-1 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 capitalize">
                        <CalendarIcon className="text-indigo-600" size={24} />
                        {viewMode === 'month' ? monthName : weekRangeName}
                    </h2>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => handleDateNavigate('prev')} className="p-1 hover:bg-white rounded-md transition-colors"><ArrowLeft size={16}/></button>
                        <button onClick={() => handleDateNavigate('next')} className="p-1 hover:bg-white rounded-md transition-colors"><ArrowRight size={16}/></button>
                    </div>
                 </div>
                 
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><LayoutGrid size={14}/></button>
                     <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><List size={14}/></button>
                 </div>
             </div>

             {/* CALENDAR GRID */}
             <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] ${viewMode === 'month' ? 'grid grid-cols-7 auto-rows-fr' : 'flex flex-col'}`}>
                 {viewMode === 'month' && ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                     <div key={day} className="p-3 text-center text-[10px] font-bold text-slate-400 bg-slate-50 border-b border-slate-100 uppercase tracking-widest">{day}</div>
                 ))}
                 
                 {viewMode === 'month' && Array.from({length: offset}).map((_, i) => (
                     <div key={`empty-${i}`} className="bg-slate-50/30 border-b border-r border-slate-100"></div>
                 ))}

                 {(viewMode === 'month' ? calendarDays : weekDays).map((dayData) => (
                     <div 
                        key={dayData.dateStr} 
                        className={`group relative p-2 border-b border-r border-slate-100 hover:bg-indigo-50/30 transition-colors flex flex-col gap-2 min-h-[150px] ${viewMode === 'week' ? 'flex-row items-start min-h-[100px] border-r-0' : ''}`}
                        onClick={() => handleCreateItem(dayData.dateStr)}
                     >
                         <div className={`flex justify-between items-center ${viewMode === 'week' ? 'w-24 shrink-0 flex-col items-start' : ''}`}>
                             <span className={`text-xs font-bold ${dayData.dateStr === new Date().toISOString().split('T')[0] ? 'text-white bg-indigo-600 px-2 py-0.5 rounded-full' : 'text-slate-400'}`}>
                                 {viewMode === 'week' && <span className="block text-[10px] opacity-70 font-normal">{dayData.dayName}</span>}
                                 {dayData.day}
                             </span>
                             <button className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity p-1"><Plus size={14}/></button>
                         </div>
                         
                         <div className={`flex-1 flex flex-col gap-1.5 w-full ${viewMode === 'week' ? 'flex-row flex-wrap' : ''}`}>
                             {dayData.items.map(item => (
                                 <div 
                                    key={item.id} 
                                    onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                                    className={`p-2 rounded-xl border text-xs cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden ${getGoalColor(item.goal)} ${viewMode === 'week' ? 'w-56' : ''}`}
                                 >
                                     <div className="flex justify-between items-center mb-1">
                                         <div className="flex items-center gap-1 overflow-hidden">
                                             <span className="font-black text-[7px] uppercase px-1 py-0.5 bg-white/50 rounded border border-black/5 truncate max-w-[50px]">{item.platform}</span>
                                             {item.time && <span className="text-[8px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-0.5"><Clock size={8}/>{item.time}</span>}
                                         </div>
                                         {getStatusBadge(item.status)}
                                     </div>
                                     <div className="font-bold line-clamp-2 leading-tight text-slate-900">{item.topic}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* CONTEXT BLOCK - ADDED HERE */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Lightbulb size={16} className="text-indigo-600"/> Фокус / Тема периода
                      </h3>
                      <textarea
                          className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 placeholder:text-slate-400"
                          placeholder="О чем пишем? (напр. Запуск курса, Ошибки новичков...)"
                          value={strategy.weeklyFocus}
                          onChange={(e) => onUpdateStrategy({ ...strategy, weeklyFocus: e.target.value })}
                      />
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={16} className="text-indigo-600"/> Стратегия</h3>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500" value={strategy.preset} onChange={(e) => onUpdateStrategy({ ...strategy, preset: e.target.value as StrategyPreset })}>
                          {Object.values(StrategyPreset).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CalendarIcon size={16} className="text-indigo-600"/> Период</h3>
                      <div className="grid gap-2">
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">С какого дня</label>
                              <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={strategy.startDate} onChange={(e) => updateStrategyToggle('startDate', e.target.value)}/>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">По какой день</label>
                              <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={strategy.endDate} onChange={(e) => updateStrategyToggle('endDate', e.target.value)}/>
                          </div>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Share2 size={16} className="text-indigo-600"/> Площадки</h3>
                      <div className="grid gap-2">
                          {platformConfigs.map(p => (
                              <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${strategy.platforms.includes(p.name) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                      {strategy.platforms.includes(p.name) && <Check size={12} className="text-white"/>}
                                  </div>
                                  <input type="checkbox" className="hidden" checked={strategy.platforms.includes(p.name)} onChange={() => togglePlatform(p.name)}/>
                                  <span className="text-sm text-slate-700 font-bold">{p.name}</span>
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div onClick={() => updateStrategyToggle('personalizePerPlatform', !strategy.personalizePerPlatform)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                              <Sparkles size={16} className={strategy.personalizePerPlatform ? 'text-indigo-600' : 'text-slate-400'} />
                              <div className="text-xs font-bold">Уникальный контент</div>
                          </div>
                          {strategy.personalizePerPlatform ? <ToggleRight className="text-indigo-600" /> : <ToggleLeft className="text-slate-300" />}
                      </div>

                      <div onClick={() => updateStrategyToggle('generatePerPlatform', !strategy.generatePerPlatform)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                              <Copy size={16} className={strategy.generatePerPlatform ? 'text-indigo-600' : 'text-slate-400'} />
                              <div className="text-xs font-bold">Мульти-постинг</div>
                          </div>
                          {strategy.generatePerPlatform ? <ToggleRight className="text-indigo-600" /> : <ToggleLeft className="text-slate-300" />}
                      </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <span>Частота: {strategy.postsPerWeek} {strategy.generatePerPlatform ? 'инфоповодов' : 'постов'} в неделю</span>
                      </div>
                      <input type="range" min="1" max="14" step="1" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={strategy.postsPerWeek} onChange={(e) => onUpdateStrategy({ ...strategy, postsPerWeek: parseInt(e.target.value) })}/>
                      {strategy.generatePerPlatform && <p className="text-[10px] text-slate-400 mt-2">Каждый инфоповод будет опубликован во <b>всех</b> выбранных соцсетях.</p>}
                  </div>

                  {/* Distribution Preview */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><PieChart size={14}/> Прогноз объема</div>
                      <div className="p-3 bg-indigo-50/50 rounded-xl space-y-2 border border-indigo-100">
                          <div className="flex justify-between text-xs font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-2">
                              <span>Всего постов:</span>
                              <span>{totalPostsPreview}</span>
                          </div>
                          {Object.values(ContentGoal).map(goal => (
                              <div key={goal} className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                                  <span>{goal.split(' (')[0]}</span>
                                  <span>{goalCounts[goal] || 0}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="space-y-3">
                  <button onClick={handleGeneratePlan} disabled={isGenerating} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 group">
                      {isGenerating ? <Loader2 size={20} className="animate-spin"/> : <Wand2 size={20} className="group-hover:rotate-12 transition-transform"/>}
                      {plan.length > 0 ? 'Дополнить План' : 'Сгенерировать План'}
                  </button>
                  <button onClick={() => { handleAnalyzePlan(); setIsAnalysisOpen(true); }} className="w-full bg-white text-slate-700 border border-slate-200 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3"><Microscope size={20} className="text-indigo-600"/> Анализ Сетки</button>
              </div>
          </div>
       </div>
    </div>
  );
};
