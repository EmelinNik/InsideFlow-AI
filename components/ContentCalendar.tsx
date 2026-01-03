import React, { useState, useEffect } from 'react';
import { AppState, ContentPlanItem, ContentGoal, ContentStrategy, TargetPlatform, PlanStatus, AuthorProfile, PostArchetype, StrategyPreset, LanguageProfile, GeneratedScript } from '../types';
import { generateContentPlan, calculatePlanDistribution } from '../services/geminiService';
import { Calendar as CalendarIcon, Plus, Wand2, RefreshCw, BarChart3, ArrowRight, Loader2, CheckCircle, FileEdit, AlertCircle, Briefcase, MapPin, Target, Layers, Info } from 'lucide-react';
import { PlanItemModal } from './PlanItemModal';

interface ContentCalendarProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  plan: ContentPlanItem[];
  strategy: ContentStrategy;
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
      const newItems = await generateContentPlan(authorProfile, strategy, new Date());
      // Merge with existing plan (simple append for now, could be smarter about conflicts)
      const updatedPlan = [...plan, ...newItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      onUpdatePlan(updatedPlan);
    } catch (e) {
      alert("Не удалось сгенерировать план. Попробуйте позже.");
    } finally {
      setIsGenerating(false);
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

  // CRUD Operations
  const handleCreateItem = (dateStr: string) => {
    const newItem: ContentPlanItem = {
      id: Date.now().toString(),
      date: dateStr,
      topic: "Новая тема",
      rationale: "Ручное создание",
      platform: strategy.platforms[0] || TargetPlatform.TELEGRAM,
      archetype: PostArchetype.EXPERT,
      goal: ContentGoal.AWARENESS,
      status: PlanStatus.IDEA
    };
    onUpdatePlan([...plan, newItem]);
    setSelectedItem(newItem);
    setIsModalOpen(true);
  };

  const handleSaveItem = (updatedItem: ContentPlanItem) => {
    const newPlan = plan.map(p => p.id === updatedItem.id ? updatedItem : p);
    // Handle case where it's a new item not yet in plan (though CreateItem adds it immediately usually)
    if (!plan.find(p => p.id === updatedItem.id)) {
        newPlan.push(updatedItem);
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
      case ContentGoal.AWARENESS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ContentGoal.TRUST: return 'bg-purple-100 text-purple-800 border-purple-200';
      case ContentGoal.RETENTION: return 'bg-amber-100 text-amber-800 border-amber-200';
      case ContentGoal.CONVERSION: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.DONE: return <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Готово</span>;
      case PlanStatus.DRAFT: return <span className="bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Черновик</span>;
      case PlanStatus.IDEA: return <span className="bg-slate-300 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Идея</span>;
    }
  }

  // --- SLOT CALCULATION FOR UI ---
  const getCurrentRecipe = () => {
      // Use the calculation service if dates are present
      if (!strategy.startDate || !strategy.endDate) return { summary: {}, total: 0 };

      const { goals, totalPosts } = calculatePlanDistribution(strategy);
      
      const summary: Record<string, number> = {};
      goals.forEach(s => { summary[s] = (summary[s] || 0) + 1 });
      
      return { summary, total: totalPosts };
  };

  const { summary: recipe, total: totalPostsPreview } = getCurrentRecipe();

  // --- RENDER ---

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay(); // 0 is Sunday
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Make Monday 0

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
     const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
     const dateStr = date.toISOString().split('T')[0];
     const items = plan.filter(p => p.date === dateStr);
     return { day: i + 1, dateStr, items };
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
       
       <PlanItemModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         item={selectedItem}
         authorProfile={authorProfile}
         languageProfile={languageProfile}
         onSave={handleSaveItem}
         onDelete={handleDeleteItem}
         onScriptGenerated={onScriptGenerated}
       />

       {/* HEADER & STRATEGY */}
       <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="text-indigo-600" />
                Контент-Стратегия
             </h2>
             <p className="text-slate-600">
                AI распределяет слоты, учитывая особенности платформ и ваши цели на выбранный период.
             </p>
             
             {/* Strategy Preset & Balance (NEW SLOT SYSTEM UI) */}
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                
                {/* Visual Recipe View */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <Layers size={16} className="text-indigo-600"/> Рецепт ({totalPostsPreview} слотов)
                        </h4>
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            Стратегия: {strategy.preset.split('(')[0]}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-blue-600">{recipe['AWARENESS'] || 0}</span>
                            <span className="text-xs font-bold text-blue-800 uppercase mt-1">Охват</span>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-purple-600">{recipe['TRUST'] || 0}</span>
                            <span className="text-xs font-bold text-purple-800 uppercase mt-1">Доверие</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-amber-600">{recipe['RETENTION'] || 0}</span>
                            <span className="text-xs font-bold text-amber-800 uppercase mt-1">Удержание</span>
                        </div>
                        <div className={`border p-3 rounded-lg flex flex-col items-center justify-center text-center transition-colors ${recipe['CONVERSION'] ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                            <span className={`text-2xl font-bold ${recipe['CONVERSION'] ? 'text-green-600' : 'text-slate-400'}`}>{recipe['CONVERSION'] || 0}</span>
                            <span className={`text-xs font-bold uppercase mt-1 ${recipe['CONVERSION'] ? 'text-green-800' : 'text-slate-500'}`}>Продажи</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <Info size={14} className="mt-0.5 flex-shrink-0 text-slate-400"/>
                        <p>
                            {strategy.preset === StrategyPreset.GROWTH && "В стратегии РОСТА мы убираем прямые продажи, чтобы максимизировать виральность."}
                            {strategy.preset === StrategyPreset.SALES && "В ПРОДАЖАХ мы чередуем офферы с контентом на доверие, чтобы не выжечь аудиторию."}
                            {strategy.preset === StrategyPreset.BALANCED && "Идеальный микс для поддержания активности без перекосов."}
                            {strategy.preset === StrategyPreset.AUTHORITY && "Фокус на глубоком контенте, подтверждающем вашу экспертность."}
                            {strategy.preset === StrategyPreset.LAUNCH && "Активная фаза запуска: много доверия и Social Proof перед продажей."}
                        </p>
                    </div>
                </div>
             </div>
          </div>

          {/* ACTIONS & SETTINGS */}
          <div className="w-full lg:w-96 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Target size={18} className="text-indigo-600"/>
                      Настройки генерации
                  </h4>
                  
                  <div className="space-y-4">
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="text-xs text-slate-500 font-bold block mb-1 uppercase">С</label>
                            <input 
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={strategy.startDate || ''}
                                onChange={(e) => onUpdateStrategy({ ...strategy, startDate: e.target.value })}
                            />
                         </div>
                         <div>
                            <label className="text-xs text-slate-500 font-bold block mb-1 uppercase">По</label>
                            <input 
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={strategy.endDate || ''}
                                onChange={(e) => onUpdateStrategy({ ...strategy, endDate: e.target.value })}
                            />
                         </div>
                      </div>

                      {/* Strategy Preset Selector */}
                      <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1 uppercase">Стратегия</label>
                          <select
                            value={strategy.preset || StrategyPreset.BALANCED}
                            onChange={(e) => onUpdateStrategy({ ...strategy, preset: e.target.value as StrategyPreset })}
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                             {Object.values(StrategyPreset).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>

                       {/* Weekly Context Input */}
                       <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1 uppercase flex items-center gap-1">
                             <MapPin size={12}/> Контекст периода
                          </label>
                          <textarea
                            value={strategy.weeklyFocus || ""}
                            onChange={(e) => onUpdateStrategy({ ...strategy, weeklyFocus: e.target.value })}
                            placeholder="Напр: Еду на конференцию, запускаю курс, или просто рабочие будни..."
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                          />
                      </div>

                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Частота (постов в неделю): {strategy.postsPerWeek}</label>
                          <input 
                            type="range" min="1" max="7" 
                            value={strategy.postsPerWeek}
                            onChange={(e) => onUpdateStrategy({...strategy, postsPerWeek: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                          </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {[TargetPlatform.TELEGRAM, TargetPlatform.INSTAGRAM, TargetPlatform.VK_POST, TargetPlatform.YOUTUBE_SHORT].map(p => (
                              <button 
                                key={p}
                                onClick={() => handlePlatformToggle(p)}
                                className={`text-[10px] px-2 py-1 rounded border ${strategy.platforms.includes(p) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                              >
                                {p.split(' ')[0]}
                              </button>
                          ))}
                      </div>

                      <div className="space-y-2 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={strategy.personalizePerPlatform} 
                                onChange={(e) => onUpdateStrategy({...strategy, personalizePerPlatform: e.target.checked})}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600 group-hover:text-indigo-600 transition-colors">Персонализировать под платформу?</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={strategy.doublePostPerDay} 
                                onChange={(e) => onUpdateStrategy({...strategy, doublePostPerDay: e.target.checked})}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600 group-hover:text-indigo-600 transition-colors">2 поста в день (считать за 1 слот)</span>
                          </label>
                      </div>

                  </div>
                  <button 
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || strategy.platforms.length === 0}
                    className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                  >
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      Сгенерировать стратегию
                  </button>
              </div>
          </div>
       </div>

       {/* CALENDAR GRID */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {/* Grid Header */}
           <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
               {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                   <div key={day} className="p-3 text-center text-sm font-bold text-slate-500 uppercase">
                       {day}
                   </div>
               ))}
           </div>
           
           {/* Days */}
           <div className="grid grid-cols-7 auto-rows-fr min-h-[600px] bg-slate-200 gap-px border-b border-slate-200">
               {/* Empty cells for offset */}
               {Array.from({ length: offset }).map((_, i) => (
                   <div key={`offset-${i}`} className="bg-slate-50/50 min-h-[120px]"></div>
               ))}

               {/* Actual Days */}
               {calendarDays.map(({ day, dateStr, items }) => (
                   <div 
                     key={dateStr} 
                     onClick={() => handleCreateItem(dateStr)}
                     className="bg-white min-h-[140px] p-2 hover:bg-slate-50 transition-colors flex flex-col gap-2 relative group cursor-pointer"
                   >
                       <span className="text-xs font-bold text-slate-400 absolute top-2 right-2">{day}</span>
                       
                       {items.length === 0 && (
                          <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-slate-300 hover:text-indigo-400">
                                  <Plus size={20} />
                              </div>
                          </div>
                       )}

                       {items.map(item => (
                           <div 
                            key={item.id}
                            onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                            className={`p-2 rounded-lg border text-xs cursor-pointer shadow-sm hover:shadow-md transition-all ${getGoalColor(item.goal)} relative group/item`}
                           >
                               <div className="flex justify-between items-start mb-1">
                                   <span className="font-bold line-clamp-1" title={item.platform}>{item.platform.split(' ')[0]}</span>
                                   {getStatusBadge(item.status)}
                               </div>
                               
                               {/* Enhanced Card Info */}
                               <p className="font-medium mb-1 line-clamp-2 leading-tight">{item.topic}</p>
                               <div className="flex items-center gap-1 mb-1 opacity-70">
                                  <Briefcase size={10} />
                                  <span className="text-[10px]">{item.archetype.split(' ')[0]}</span>
                               </div>
                               <p className="opacity-70 text-[10px] line-clamp-1 mb-2 italic border-t border-black/5 pt-1 mt-1">
                                  {item.rationale}
                               </p>
                               
                               {/* Media Indicator */}
                               {item.mediaSuggestion && (
                                 <div className="mt-1 flex gap-1">
                                   <span className="text-[9px] bg-white/40 px-1 rounded">
                                      {item.mediaSuggestion.type === 'video' ? 'VIDEO' : 'IMG'}
                                   </span>
                                 </div>
                               )}
                           </div>
                       ))}
                   </div>
               ))}
           </div>
       </div>

    </div>
  );
};