
import React, { useState, useEffect } from 'react';
import { AppState, ContentPlanItem, ContentGoal, ContentStrategy, TargetPlatform, PlanStatus, AuthorProfile, PostArchetype, StrategyPreset, LanguageProfile, GeneratedScript, CalendarAnalysis, PromptKey } from '../types';
import { generateContentPlan, calculatePlanDistribution, analyzeContentCalendar } from '../services/geminiService';
import { Calendar as CalendarIcon, Plus, Wand2, RefreshCw, BarChart3, ArrowRight, Loader2, CheckCircle, FileEdit, AlertCircle, Briefcase, MapPin, Target, Layers, Info, Sparkles, X, Microscope, ChevronRight, Check } from 'lucide-react';
import { PlanItemModal } from './PlanItemModal';
import ReactMarkdown from 'react-markdown';

interface ContentCalendarProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  plan: ContentPlanItem[];
  strategy: ContentStrategy;
  prompts: Record<string, string>;
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
  prompts,
  onUpdatePlan,
  onUpdateStrategy,
  onGenerateContent,
  onScriptGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
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
       end.setDate(end.getDate() + 7);
       onUpdateStrategy({
           ...strategy,
           startDate: start.toISOString().split('T')[0],
           endDate: end.toISOString().split('T')[0]
       });
    }
  }, []);

  // --- ACTIONS ---

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const newItems = await generateContentPlan(
          authorProfile, 
          strategy, 
          new Date(), 
          prompts[PromptKey.PLAN_GENERATION]
      );
      const updatedPlan = [...plan, ...newItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      onUpdatePlan(updatedPlan);
    } catch (e) {
      alert("Не удалось сгенерировать план. Попробуйте позже.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzePlan = async () => {
    if (plan.length === 0) {
      alert("Календарь пуст. Сначала добавьте или сгенерируйте посты.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeContentCalendar(strategy, plan, prompts[PromptKey.CALENDAR_ANALYSIS]);
      setAnalysisResult(result);
    } catch (e) {
      setAnalysisResult({
        status: 'normal',
        report: 'Произошла ошибка при анализе. Попробуйте позже.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlatformToggle = (plat: TargetPlatform) => {
    const current = strategy.platforms;
    const isSelected = current.includes(plat);
    const newPlatforms = isSelected 
        ? current.filter(p => p !== plat)
        : [...current, plat];
    
    onUpdateStrategy({ ...strategy, platforms: newPlatforms });
  };

  const handleCreateItem = (dateStr: string) => {
    // Check if date is in the past (yesterday or earlier)
    const clickedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = clickedDate < today;

    const newItem: ContentPlanItem = {
      id: Date.now().toString(),
      date: dateStr,
      topic: isPast ? "Архивный пост" : "Новая тема",
      rationale: isPast ? "Добавлено вручную" : "Ручное создание",
      platform: strategy.platforms[0] || TargetPlatform.TELEGRAM,
      archetype: PostArchetype.SHORT_POST,
      goal: ContentGoal.AWARENESS,
      status: isPast ? PlanStatus.DONE : PlanStatus.IDEA, // Default to DONE if past
      metrics: isPast ? { reach: 0, likes: 0, comments: 0, reposts: 0 } : undefined
    };
    onUpdatePlan([...plan, newItem]);
    setSelectedItem(newItem);
    setIsModalOpen(true);
  };

  const handleCreateArchivedItem = (dateStr: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItem: ContentPlanItem = {
        id: Date.now().toString(),
        date: dateStr,
        topic: "Опубликованный пост",
        rationale: "Сбор статистики",
        platform: strategy.platforms[0] || TargetPlatform.TELEGRAM,
        archetype: PostArchetype.SHORT_POST,
        goal: ContentGoal.AWARENESS,
        status: PlanStatus.DONE,
        metrics: { reach: 0, likes: 0, comments: 0, reposts: 0 },
        // Pre-fill empty structures to enable direct editing in Modal
        generatedContent: '', 
        mediaSuggestion: { type: 'photo', description: '' }
      };
      onUpdatePlan([...plan, newItem]);
      setSelectedItem(newItem);
      setIsModalOpen(true);
  };

  const handleCreateBundle = (dateStr: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (strategy.platforms.length === 0) {
          alert("Выберите хотя бы одну платформу в настройках справа.");
          return;
      }
      
      const newItems = strategy.platforms.map((plat, index) => ({
        id: Date.now().toString() + index,
        date: dateStr,
        topic: "Общая тема дня",
        rationale: "Пакетное создание",
        platform: plat,
        archetype: PostArchetype.SHORT_POST,
        goal: ContentGoal.AWARENESS,
        status: PlanStatus.IDEA
      }));

      onUpdatePlan([...plan, ...newItems]);
  };

  const handleSaveItem = (updatedItem: ContentPlanItem) => {
    // Do not auto-switch status. Metrics can exist on DONE status.
    let finalItem = { ...updatedItem };
    const newPlan = plan.map(p => p.id === finalItem.id ? finalItem : p);
    if (!plan.find(p => p.id === finalItem.id)) {
        newPlan.push(finalItem);
    }
    onUpdatePlan(newPlan);
  };

  const handleDeleteItem = (id: string) => {
      onUpdatePlan(plan.filter(p => p.id !== id));
      setIsModalOpen(false);
  };

  const handleItemClick = (item: ContentPlanItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // --- HELPERS ---

  const getGoalColor = (goal: ContentGoal) => {
    switch (goal) {
      case ContentGoal.AWARENESS: return 'bg-blue-50 text-blue-800 border-blue-100';
      case ContentGoal.TRUST: return 'bg-purple-50 text-purple-800 border-purple-100';
      case ContentGoal.RETENTION: return 'bg-amber-50 text-amber-800 border-amber-100';
      case ContentGoal.CONVERSION: return 'bg-green-50 text-green-800 border-green-100';
      default: return 'bg-slate-50 text-slate-800';
    }
  };

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.DONE: return <span className="bg-green-500 text-white text-[8px] px-1 rounded font-bold uppercase">ГОТОВО</span>;
      case PlanStatus.DRAFT: return <span className="bg-amber-400 text-white text-[8px] px-1 rounded font-bold uppercase">ЧЕРНОВИК</span>;
      case PlanStatus.IDEA: return <span className="bg-slate-300 text-white text-[8px] px-1 rounded font-bold uppercase">ИДЕЯ</span>;
    }
  }
  
  const getAnalysisStatusColor = (status: CalendarAnalysis['status']) => {
    switch(status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'normal': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'bad': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getAnalysisStatusIcon = (status: CalendarAnalysis['status']) => {
    switch(status) {
      case 'good': return <CheckCircle size={18} className="text-green-600"/>;
      case 'normal': return <AlertCircle size={18} className="text-amber-600"/>;
      case 'bad': return <AlertCircle size={18} className="text-red-600"/>;
    }
  };

  const { summary: recipe, total: totalPostsPreview } = (() => {
      if (!strategy.startDate || !strategy.endDate) return { summary: {}, total: 0 };
      const { goals, totalPosts } = calculatePlanDistribution(strategy);
      const summary: Record<string, number> = {};
      goals.forEach(s => { summary[s] = (summary[s] || 0) + 1 });
      return { summary, total: totalPosts };
  })();

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
     const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
     const dateStr = date.toISOString().split('T')[0];
     const items = plan.filter(p => p.date === dateStr);
     return { day: i + 1, dateStr, items };
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 relative">
       
       <PlanItemModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         item={selectedItem}
         authorProfile={authorProfile}
         languageProfile={languageProfile}
         prompts={prompts}
         onSave={handleSaveItem}
         onDelete={handleDeleteItem}
         onScriptGenerated={onScriptGenerated}
       />
       
       {/* ANALYSIS SIDEBAR */}
       <div 
         className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 flex flex-col ${isAnalysisOpen ? 'translate-x-0' : 'translate-x-full'}`}
       >
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-2">
                 <Microscope size={20} className="text-indigo-600"/>
                 <h3 className="font-bold text-slate-900">Анализ сетки</h3>
             </div>
             <button onClick={() => setIsAnalysisOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                 <X size={20}/>
             </button>
         </div>
         <div className="flex-1 overflow-y-auto p-6">
             {isAnalyzing ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                     <Loader2 size={32} className="animate-spin text-indigo-600"/>
                     <p className="text-sm">ИИ-редактор проверяет ваш план...</p>
                 </div>
             ) : analysisResult ? (
                 <div className="space-y-6 animate-in fade-in">
                     <div className={`p-4 rounded-xl border flex items-center gap-3 ${getAnalysisStatusColor(analysisResult.status)}`}>
                         {getAnalysisStatusIcon(analysisResult.status)}
                         <div>
                             <div className="font-bold text-xs uppercase tracking-wider">Вердикт</div>
                             <div className="text-[10px] opacity-90">
                                 {analysisResult.status === 'good' ? 'Сетка сбалансирована' : analysisResult.status === 'normal' ? 'Есть замечания' : 'Требует доработки'}
                             </div>
                         </div>
                     </div>
                     <div className="prose prose-sm prose-slate max-w-none">
                         <ReactMarkdown>{analysisResult.report}</ReactMarkdown>
                     </div>
                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                     <Sparkles size={24} className="mb-4 text-slate-300"/>
                     <p className="text-sm">Нажмите кнопку анализа для проверки плана.</p>
                 </div>
             )}
         </div>
       </div>

       {/* HEADER & STRATEGY */}
       <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
          <div className="flex-1 flex flex-col gap-4">
             <div className="flex justify-between items-start">
                 <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="text-indigo-600" size={24} />
                    Стратегия
                 </h2>
                 <button 
                    onClick={handleAnalyzePlan}
                    className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                 >
                     <Sparkles size={12}/> Анализ
                 </button>
             </div>
             
             {/* Recipe Widget */}
             <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-2">
                            <Layers size={14} className="text-indigo-600"/> Рецепт ({totalPostsPreview})
                        </h4>
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            {strategy.preset.split('(')[0]}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-lg flex flex-col items-center text-center">
                            <span className="text-lg font-bold text-blue-600">{recipe[ContentGoal.AWARENESS] || 0}</span>
                            <span className="text-[8px] font-bold text-blue-800 uppercase">Охват</span>
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100 p-2 rounded-lg flex flex-col items-center text-center">
                            <span className="text-lg font-bold text-purple-600">{recipe[ContentGoal.TRUST] || 0}</span>
                            <span className="text-[8px] font-bold text-purple-800 uppercase">Вес</span>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100 p-2 rounded-lg flex flex-col items-center text-center">
                            <span className="text-lg font-bold text-amber-600">{recipe[ContentGoal.RETENTION] || 0}</span>
                            <span className="text-[8px] font-bold text-amber-800 uppercase">Лоял</span>
                        </div>
                        <div className={`border p-2 rounded-lg flex flex-col items-center text-center ${recipe[ContentGoal.CONVERSION] ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                            <span className={`text-lg font-bold ${recipe[ContentGoal.CONVERSION] ? 'text-green-600' : 'text-slate-400'}`}>{recipe[ContentGoal.CONVERSION] || 0}</span>
                            <span className={`text-[8px] font-bold uppercase ${recipe[ContentGoal.CONVERSION] ? 'text-green-800' : 'text-slate-500'}`}>Sales</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* AI Editor Inline */}
             <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[100px]">
                {isAnalyzing ? (
                     <div className="flex flex-col items-center py-4 text-slate-500">
                         <Loader2 size={24} className="animate-spin text-indigo-600 mb-2"/>
                         <span className="text-[10px] font-bold uppercase">Ревизия...</span>
                     </div>
                ) : analysisResult ? (
                     <div className={`rounded-lg p-3 border ${getAnalysisStatusColor(analysisResult.status)} cursor-pointer`} onClick={() => setIsAnalysisOpen(true)}>
                         <div className="flex items-center gap-3">
                             {getAnalysisStatusIcon(analysisResult.status)}
                             <div>
                                 <div className="font-bold text-xs">
                                     {analysisResult.status === 'good' ? 'План ок!' : 'Есть риск'}
                                 </div>
                                 <div className="text-[10px] opacity-90 mt-0.5 line-clamp-1">Нажмите для рекомендаций</div>
                             </div>
                             <ChevronRight size={14} className="ml-auto opacity-50"/>
                         </div>
                     </div>
                ) : (
                     <button
                        onClick={handleAnalyzePlan}
                        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-2"
                     >
                         <Sparkles size={14}/> Проверить сетку
                     </button>
                )}
             </div>
          </div>

          {/* SETTINGS PANEL */}
          <div className="w-full lg:w-96">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                      <Target size={16} className="text-indigo-600"/>
                      Настройки
                  </h4>

                  {/* PLATFORMS */}
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-2 uppercase tracking-wider">Соцсети</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(TargetPlatform).map(p => {
                            const isSelected = strategy.platforms.includes(p);
                            return (
                                <button 
                                    key={p} 
                                    onClick={() => handlePlatformToggle(p)}
                                    className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase transition-all flex items-center gap-1 ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    {p.split(' ')[0]}
                                    {isSelected && <Check size={10} strokeWidth={3}/>}
                                </button>
                            );
                        })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Начало</label>
                        <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900" value={strategy.startDate || ''} onChange={(e) => onUpdateStrategy({ ...strategy, startDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Конец</label>
                        <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900" value={strategy.endDate || ''} onChange={(e) => onUpdateStrategy({ ...strategy, endDate: e.target.value })} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Постов в плане</label>
                        <input 
                            type="number" 
                            min="1"
                            max="50"
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900" 
                            value={strategy.postsPerWeek} 
                            onChange={(e) => onUpdateStrategy({ ...strategy, postsPerWeek: parseInt(e.target.value) || 1 })} 
                        />
                     </div>
                     <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Стратегия</label>
                        <select value={strategy.preset || StrategyPreset.BALANCED} onChange={(e) => onUpdateStrategy({ ...strategy, preset: e.target.value as StrategyPreset })} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 appearance-none">
                            {Object.values(StrategyPreset).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>
                  
                  {/* TOGGLES */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Персонализировать под соцсеть</span>
                      <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                          <input 
                              type="checkbox" 
                              checked={strategy.personalizePerPlatform} 
                              onChange={(e) => onUpdateStrategy({...strategy, personalizePerPlatform: e.target.checked})}
                              className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-4 checked:border-indigo-600 border-slate-300"
                          />
                          <label className="toggle-label block overflow-hidden h-4 rounded-full bg-slate-300 cursor-pointer checked:bg-indigo-600"></label>
                      </div>
                  </div>

                  <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Фокус плана</label>
                      <textarea value={strategy.weeklyFocus || ""} onChange={(e) => onUpdateStrategy({ ...strategy, weeklyFocus: e.target.value })} placeholder="Напр: Запуск курса..." className="w-full p-2 border border-slate-200 rounded-lg text-xs h-16 resize-none outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900" />
                  </div>

                  <button 
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || strategy.platforms.length === 0}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 uppercase tracking-wide"
                  >
                      {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      Создать план
                  </button>
              </div>
          </div>
       </div>

       {/* CALENDAR GRID (RESPONSIVE) */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           {/* Horizontal Scroll wrapper for mobile */}
           <div className="overflow-x-auto">
               <div className="min-w-[800px] md:min-w-full">
                   <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                       {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                           <div key={day} className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               {day}
                           </div>
                       ))}
                   </div>
                   <div className="grid grid-cols-7 auto-rows-fr min-h-[400px] bg-slate-200 gap-px">
                       {Array.from({ length: offset }).map((_, i) => (
                           <div key={`offset-${i}`} className="bg-slate-50/30"></div>
                       ))}
                       {calendarDays.map(({ day, dateStr, items }) => (
                           <div 
                             key={dateStr} 
                             onClick={() => handleCreateItem(dateStr)}
                             className="bg-white min-h-[120px] p-1.5 md:p-2 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 relative group cursor-pointer"
                           >
                               <div className="flex justify-between items-start">
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button 
                                            title="Создать везде" 
                                            onClick={(e) => handleCreateBundle(dateStr, e)}
                                            className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            <Layers size={12}/>
                                        </button>
                                        <button 
                                            title="Добавить статистику (Архив)" 
                                            onClick={(e) => handleCreateArchivedItem(dateStr, e)}
                                            className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-600 hover:text-white transition-colors"
                                        >
                                            <BarChart3 size={12}/>
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 absolute top-1 right-2 group-hover:text-indigo-600">{day}</span>
                               </div>

                               {items.length === 0 && (
                                  <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <Plus size={16} className="text-slate-200" />
                                  </div>
                               )}
                               {items.map(item => (
                                   <div 
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                                    className={`p-1.5 rounded-lg border text-[9px] cursor-pointer shadow-sm hover:shadow transition-all ${getGoalColor(item.goal)}`}
                                   >
                                       <div className="flex justify-between items-start mb-0.5">
                                           <span className="font-bold truncate opacity-60">{item.platform.split(' ')[0]}</span>
                                           <div className="flex items-center gap-1">
                                               {item.metrics && (item.metrics.reach > 0 || item.metrics.likes > 0) && (
                                                   <BarChart3 size={8} className="text-indigo-600" />
                                               )}
                                               {getStatusBadge(item.status)}
                                           </div>
                                       </div>
                                       <p className="font-bold leading-tight line-clamp-2 text-slate-800">{item.topic}</p>
                                   </div>
                               ))}
                           </div>
                       ))}
                   </div>
               </div>
           </div>
           {/* Swipe Hint for Mobile */}
           <div className="md:hidden p-2 text-center text-[9px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
               <span>Листайте вправо</span> <ArrowRight size={10}/>
           </div>
       </div>
    </div>
  );
};
