
import React, { useState } from 'react';
import { AuthorProfile, ContentPlanItem, ContentStrategy, LanguageProfile, PlanStatus, GeneratedScript, TargetPlatform, ContentGoal, StrategyPreset, PromptKey } from '../types';
import { generateContentPlan, analyzeCalendarPlan } from '../services/geminiService';
import { Calendar as CalIcon, RefreshCw, Wand2, Loader2, Plus, Filter, ChevronRight, ChevronLeft, LayoutGrid, List, Check, PieChart, Layers, CalendarRange, Calculator, BrainCircuit, X, Sparkles, AlertCircle } from 'lucide-react';
import { PlanItemModal } from './PlanItemModal';
import ReactMarkdown from 'react-markdown';

interface ContentCalendarProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  plan: ContentPlanItem[];
  strategy: ContentStrategy;
  prompts: Record<string, string>;
  onUpdatePlan: (newPlan: ContentPlanItem[]) => void;
  onUpdateStrategy: (strategy: ContentStrategy) => void;
  onGenerateContent: (item: ContentPlanItem) => void;
  onScriptGenerated: (script: GeneratedScript) => void;
}

// Preset distributions hardcoded for preview (sync with service logic)
const PRESET_DISTRIBUTIONS = {
    [StrategyPreset.GROWTH]: {
        [ContentGoal.AWARENESS]: 0.6,
        [ContentGoal.TRUST]: 0.3,
        [ContentGoal.RETENTION]: 0.1,
        [ContentGoal.CONVERSION]: 0.0
    },
    [StrategyPreset.SALES]: {
        [ContentGoal.AWARENESS]: 0.2,
        [ContentGoal.TRUST]: 0.3,
        [ContentGoal.RETENTION]: 0.1,
        [ContentGoal.CONVERSION]: 0.4
    },
    [StrategyPreset.AUTHORITY]: {
        [ContentGoal.AWARENESS]: 0.2,
        [ContentGoal.TRUST]: 0.6,
        [ContentGoal.RETENTION]: 0.2,
        [ContentGoal.CONVERSION]: 0.0
    },
    [StrategyPreset.LAUNCH]: {
        [ContentGoal.AWARENESS]: 0.3,
        [ContentGoal.TRUST]: 0.2,
        [ContentGoal.RETENTION]: 0.2,
        [ContentGoal.CONVERSION]: 0.3
    },
    [StrategyPreset.BALANCED]: {
        [ContentGoal.AWARENESS]: 0.4,
        [ContentGoal.TRUST]: 0.3,
        [ContentGoal.RETENTION]: 0.2,
        [ContentGoal.CONVERSION]: 0.1
    }
};

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
  const [selectedItem, setSelectedItem] = useState<ContentPlanItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); 
  
  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setAuditReport(null); // Clear previous audit
    try {
      const newItems = await generateContentPlan(
          authorProfile, 
          strategy, 
          new Date(strategy.startDate),
          prompts[PromptKey.PLAN_GENERATION]
      );
      // Merge with existing DONE items to preserve history
      const doneItems = plan.filter(p => p.status === PlanStatus.DONE);
      onUpdatePlan([...doneItems, ...newItems]);
    } catch (e) {
      alert("Ошибка при генерации плана");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuditPlan = async () => {
      if (plan.length === 0) return;
      setIsAuditing(true);
      try {
          const result = await analyzeCalendarPlan(authorProfile, strategy, plan, prompts[PromptKey.CALENDAR_ANALYSIS]);
          setAuditReport(result.report);
      } catch (e) {
          alert("Ошибка анализа");
      } finally {
          setIsAuditing(false);
      }
  };

  const handleUpdateItem = (updated: ContentPlanItem) => {
    const newPlan = plan.map(p => p.id === updated.id ? updated : p);
    onUpdatePlan(newPlan);
    setSelectedItem(updated); // Keep selected to show updates
  };

  const handleDeleteItem = (id: string) => {
    onUpdatePlan(plan.filter(p => p.id !== id));
    setSelectedItem(null);
  };

  const handleAddNewItem = (dateOverride?: string) => {
     const dateToUse = dateOverride || new Date().toISOString().split('T')[0];
     
     // Determine platforms to create for
     // Create for ALL selected platforms in strategy
     let platformsToCreate = strategy.platforms.length > 0 
        ? strategy.platforms 
        : [TargetPlatform.TELEGRAM];

     const newItems: ContentPlanItem[] = platformsToCreate.map((plat, idx) => ({
         id: Date.now().toString() + idx,
         date: dateToUse,
         topic: 'Новая тема',
         rationale: '',
         platform: plat,
         archetype: 'Короткий пост' as any,
         goal: ContentGoal.AWARENESS,
         status: PlanStatus.IDEA
     }));

     onUpdatePlan([...plan, ...newItems]);
     
     // Select the first created item
     if (newItems.length > 0) {
        setSelectedItem(newItems[0]);
     }
  };

  const togglePlatform = (p: TargetPlatform) => {
      const current = strategy.platforms;
      const exists = current.includes(p);
      let newPlatforms;
      
      if (exists) {
          newPlatforms = current.filter(pl => pl !== p);
      } else {
          newPlatforms = [...current, p];
      }
      
      // Prevent empty selection
      if (newPlatforms.length === 0) return;

      onUpdateStrategy({ ...strategy, platforms: newPlatforms });
  };

  // --- NAVIGATION HELPERS ---

  const prev = () => {
      const d = new Date(currentDate);
      if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
  };

  const next = () => {
      const d = new Date(currentDate);
      if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
  };

  const jumpToToday = () => {
      setCurrentDate(new Date());
  };

  // --- DATA PREP ---

  // Group by date
  const groupedPlan: Record<string, ContentPlanItem[]> = {};
  plan.forEach(item => {
      if (!groupedPlan[item.date]) groupedPlan[item.date] = [];
      groupedPlan[item.date].push(item);
  });

  // Calculate Days Difference
  const startD = new Date(strategy.startDate);
  const endD = new Date(strategy.endDate);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

  // Stats Calculation (Real or Predicted)
  const totalPosts = plan.length;
  let displayStats: Record<string, number> = {};
  let isPredicted = false;

  if (totalPosts > 0) {
      displayStats = plan.reduce((acc, item) => {
          const goalKey = item.goal || ContentGoal.AWARENESS;
          acc[goalKey] = (acc[goalKey] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
  } else {
      isPredicted = true;
      const distribution = PRESET_DISTRIBUTIONS[strategy.preset] || PRESET_DISTRIBUTIONS[StrategyPreset.BALANCED];
      Object.entries(distribution).forEach(([goal, ratio]) => {
          // Keep as ratio (0.6, 0.3 etc) or normalized to 100 for display
          if (ratio > 0) {
              displayStats[goal] = ratio * 100;
          }
      });
  }

  const getGoalColor = (goal: string) => {
      if (goal.includes('Охват')) return 'bg-blue-500';
      if (goal.includes('Доверие')) return 'bg-indigo-500';
      if (goal.includes('Продажа')) return 'bg-rose-500';
      if (goal.includes('Удержание')) return 'bg-emerald-500';
      return 'bg-slate-400';
  };

  // Get dates for List View (1 Week)
  const getListViewDates = (start: Date) => {
      const days = [];
      const curr = new Date(start);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      const monday = new Date(curr.setDate(diff));
      
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          days.push(d.toISOString().split('T')[0]);
      }
      return days;
  };

  // Get dates for Month View with padding (Fixed 6 rows / 42 days)
  const getMonthData = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      const daysInMonth = lastDayOfMonth.getDate();
      
      // 0 = Sun, ... 6 = Sat. We want 0 = Mon.
      const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
      
      const days: { date: string, isCurrentMonth: boolean }[] = [];
      
      // Previous month padding
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
          const d = new Date(year, month - 1, prevMonthLastDay - i);
          const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          days.push({ date: localIso, isCurrentMonth: false });
      }
      
      // Current month
      for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(year, month, i);
          const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          days.push({ date: localIso, isCurrentMonth: true });
      }

      // Next month padding to fill exactly 42 slots (6 rows)
      const totalSlots = 42;
      const currentLen = days.length;
      const needed = totalSlots - currentLen;
      
      for (let i = 1; i <= needed; i++) {
          const d = new Date(year, month + 1, i);
          const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          days.push({ date: localIso, isCurrentMonth: false });
      }

      return days;
  };

  const listDays = getListViewDates(currentDate);
  const monthDays = getMonthData(currentDate);
  const todayStr = new Date().toISOString().split('T')[0];

  const getPlatformIcon = (p: TargetPlatform) => {
      return p.substring(0, 2);
  };

  // Calculations for display
  const totalTopics = strategy.postsCount || diffDays; // Default to 1 per day if not set
  const isMultiposting = strategy.generatePerPlatform && strategy.platforms.length > 1;
  const totalItemsToGenerate = isMultiposting ? totalTopics * strategy.platforms.length : totalTopics;

  // Ensure slider value doesn't exceed days (logic requested: max 1 topic per day)
  // Actually, user said "max should be 7 for 7 days".
  const maxTopics = diffDays; 
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateStrategy({ ...strategy, postsCount: parseInt(e.target.value) });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      
      {/* SIDEBAR: STRATEGY */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-indigo-600"/> 
                  Стратегия
              </h3>
              
              <div className="space-y-5">
                  {/* DATE RANGE */}
                  <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-2 uppercase tracking-wider flex items-center gap-1">
                          <CalendarRange size={12}/> Период стратегии
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <span className="text-[9px] text-slate-400 block mb-0.5">Начало</span>
                              <input 
                                  type="date" 
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={strategy.startDate}
                                  onChange={(e) => onUpdateStrategy({ ...strategy, startDate: e.target.value })}
                              />
                          </div>
                          <div>
                              <span className="text-[9px] text-slate-400 block mb-0.5">Конец</span>
                              <input 
                                  type="date" 
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={strategy.endDate}
                                  onChange={(e) => onUpdateStrategy({ ...strategy, endDate: e.target.value })}
                              />
                          </div>
                      </div>
                  </div>

                  {/* FREQUENCY (UPDATED TO TOTAL COUNT) */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Calculator size={12}/> Количество постов
                          </label>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                              {totalTopics} тем(ы)
                          </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="1" 
                            max={maxTopics} 
                            step="1"
                            value={Math.min(totalTopics, maxTopics)}
                            onChange={handleSliderChange}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <span className="text-xs font-bold w-6 text-center">{Math.min(totalTopics, maxTopics)}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">
                          Распределить {Math.min(totalTopics, maxTopics)} уникальных тем на {diffDays} дней.
                      </p>
                      
                      {isMultiposting && (
                          <div className="mt-2 text-[10px] bg-indigo-50/50 p-2 rounded border border-indigo-100 flex items-center gap-2">
                             <Layers size={12} className="text-indigo-500"/>
                             <span className="text-slate-600">
                                 × {strategy.platforms.length} площадок = <strong>{totalItemsToGenerate} постов</strong>
                             </span>
                          </div>
                      )}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                      <label className="text-[10px] text-slate-400 font-bold block mb-2 uppercase tracking-wider">Пресет</label>
                      <select 
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-indigo-500"
                        value={strategy.preset}
                        onChange={(e) => onUpdateStrategy({ ...strategy, preset: e.target.value as any })}
                      >
                          <option value="Баланс (Удержание + Охват)">Баланс</option>
                          <option value="Быстрый рост (Охват)">Быстрый Рост</option>
                          <option value="Активные продажи (Конверсия)">Продажи</option>
                          <option value="Личный бренд (Доверие)">Личный Бренд</option>
                      </select>
                  </div>

                  {/* PLATFORMS SELECTOR */}
                  <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-2 uppercase tracking-wider">Площадки ({strategy.platforms.length})</label>
                      <div className="grid grid-cols-2 gap-2">
                          {Object.values(TargetPlatform).map(p => {
                              const isActive = strategy.platforms.includes(p);
                              return (
                                  <button
                                    key={p}
                                    onClick={() => togglePlatform(p)}
                                    className={`
                                        text-[10px] px-2 py-1.5 rounded border flex items-center gap-1.5 transition-all
                                        ${isActive 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }
                                    `}
                                  >
                                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isActive ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                          {isActive && <Check size={8} className="text-white"/>}
                                      </div>
                                      <span className="truncate">{p.split(' ')[0]}</span>
                                  </button>
                              )
                          })}
                      </div>
                  </div>
                  
                  {/* TOGGLES */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between p-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Персонализировать</span>
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

                      <div className="flex items-center justify-between p-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Мульти-постинг</span>
                            <span className="text-[8px] text-slate-400">Генерировать для всех в один день</span>
                          </div>
                          <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                              <input 
                                  type="checkbox" 
                                  checked={strategy.generatePerPlatform} 
                                  disabled={strategy.platforms.length < 2}
                                  onChange={(e) => onUpdateStrategy({...strategy, generatePerPlatform: e.target.checked})}
                                  className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-4 checked:border-indigo-600 border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <label className={`toggle-label block overflow-hidden h-4 rounded-full bg-slate-300 cursor-pointer checked:bg-indigo-600 ${strategy.platforms.length < 2 ? 'opacity-50' : ''}`}></label>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Фокус плана</label>
                      <textarea 
                        value={strategy.weeklyFocus || ""} 
                        onChange={(e) => onUpdateStrategy({ ...strategy, weeklyFocus: e.target.value })} 
                        placeholder="Напр: Запуск курса..." 
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs h-16 resize-none outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900" 
                      />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGenerating || strategy.platforms.length === 0}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 uppercase tracking-wide"
                    >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        Сгенерировать план
                    </button>
                    
                    <button 
                        onClick={() => handleAddNewItem()}
                        className="w-full bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] hover:bg-slate-50 flex items-center justify-center gap-2 uppercase tracking-wide transition-colors"
                    >
                        <Plus size={14} />
                        Добавить быстрый черновик
                    </button>
                  </div>
              </div>
          </div>

          {/* VISUAL STATS BREAKDOWN - SEPARATE CARD */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <PieChart size={16} className="text-indigo-600"/> 
                  Баланс смыслов
              </h3>
              
              {/* PREDICTED OR REAL DISTRIBUTION BAR */}
              <div className={`h-4 w-full flex rounded-full overflow-hidden bg-slate-100 mb-4 ring-1 ring-slate-100 ${isPredicted ? 'opacity-50' : ''}`}>
                  {Object.entries(displayStats).map(([goal, val], idx) => {
                      // If predicted, val is just a ratio or similar (we normalized to ~100 in logic above if using % for predicted)
                      // If real, val is count. We need percentage of total for width.
                      const totalForCalc = isPredicted ? 100 : totalPosts;
                      const width = isPredicted ? val : (val / totalForCalc) * 100;
                      
                      return (
                        <div 
                            key={idx} 
                            className={`h-full ${getGoalColor(goal)}`} 
                            style={{ width: `${width}%` }}
                            title={`${goal}`}
                        ></div>
                      )
                  })}
              </div>

              {isPredicted && (
                  <div className="text-center py-1 mb-2">
                      <p className="text-[10px] text-slate-400 italic">Примерное распределение для стратегии "{strategy.preset}"</p>
                  </div>
              )}

              {/* LIST / LEGEND - Always visible now to act as legend */}
              <div className="space-y-2">
                {Object.entries(displayStats).map(([goal, count], idx) => {
                    const percentage = isPredicted ? Math.round(count) : Math.round((count/totalPosts)*100);
                    return (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getGoalColor(goal)} flex-shrink-0`}></div>
                                <span className="truncate max-w-[140px]">{goal.split(' ')[0]}</span>
                            </div>
                            <span className="font-bold tabular-nums">
                                {percentage}% 
                                {!isPredicted && <span className="text-slate-400 font-normal ml-1">({count})</span>}
                            </span>
                        </div>
                    );
                })}
              </div>
          </div>

          {/* AI AUDIT CARD - ALWAYS VISIBLE */}
          <div className={`bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group transition-all ${plan.length === 0 ? 'border-slate-200 opacity-80' : 'border-indigo-100'}`}>
              {plan.length > 0 && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>}
              
              {!auditReport ? (
                  <div className="text-center">
                      <h3 className={`font-bold mb-2 flex items-center justify-center gap-2 text-xs uppercase tracking-wider ${plan.length === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                          <BrainCircuit size={16} className={plan.length === 0 ? 'text-slate-400' : 'text-purple-600'}/> 
                          AI Аудит Плана
                      </h3>
                      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                          {plan.length === 0 
                            ? "Сначала создайте или сгенерируйте план, чтобы AI мог проверить его на ошибки."
                            : "Проверить баланс тем, логику и соответствие болям вашей ЦА."
                          }
                      </p>
                      <button 
                          onClick={handleAuditPlan}
                          disabled={isAuditing || plan.length === 0}
                          className={`
                            w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border
                            ${plan.length === 0 
                                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            }
                          `}
                      >
                          {isAuditing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                          {plan.length === 0 ? 'План пуст' : 'Анализировать'}
                      </button>
                  </div>
              ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-purple-700 text-xs uppercase tracking-wider flex items-center gap-2">
                              <Check size={14}/> Анализ готов
                          </h3>
                          <button onClick={() => setAuditReport(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto text-[10px] text-slate-600 leading-relaxed prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown>{auditReport}</ReactMarkdown>
                      </div>
                  </div>
              )}
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-800">
              <p className="font-bold mb-1">💡 Подсказка</p>
              Контент-план генерируется на основе вашего профиля автора. Если темы кажутся нерелевантными, уточните "Боли аудитории" в профиле.
          </div>
      </div>

      {/* MAIN: CALENDAR */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50 gap-4">
              <div className="flex items-center gap-2">
                 <CalIcon size={20} className="text-slate-500"/>
                 <h2 className="font-bold text-slate-700">Календарь Публикаций</h2>
              </div>
              
              <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1">
                      <button onClick={prev} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                          <ChevronLeft size={16}/>
                      </button>
                      <span className="text-sm font-medium w-36 text-center tabular-nums">
                          {viewMode === 'week' 
                            ? `${new Date(listDays[0]).toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'})} - ${new Date(listDays[listDays.length-1]).toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'})}`
                            : currentDate.toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})
                          }
                      </span>
                      <button onClick={next} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                          <ChevronRight size={16}/>
                      </button>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <button onClick={jumpToToday} className="text-xs font-bold text-indigo-600 px-2 hover:bg-indigo-50 rounded py-1">
                      Сегодня
                  </button>
              </div>

              <div className="flex items-center gap-2">
                  <div className="flex bg-slate-200 p-0.5 rounded-lg">
                      <button 
                        onClick={() => setViewMode('week')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Список"
                      >
                          <List size={16}/>
                      </button>
                      <button 
                        onClick={() => setViewMode('month')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Месяц (Сетка)"
                      >
                          <LayoutGrid size={16}/>
                      </button>
                  </div>
                  <button onClick={() => handleAddNewItem()} className="ml-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-700 shadow-md">
                      <Plus size={14}/> Пост
                  </button>
              </div>
          </div>

          {/* Calendar Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4">
              
              {/* LIST VIEW (formerly Week View) */}
              {viewMode === 'week' && (
                  <div className="flex flex-col min-h-full justify-between gap-4">
                      {listDays.map(dateStr => {
                          const date = new Date(dateStr);
                          const items = groupedPlan[dateStr] || [];
                          const isToday = todayStr === dateStr;

                          return (
                              <div key={dateStr} className={`flex-1 flex flex-col md:flex-row gap-4 ${isToday ? 'bg-indigo-50/40 -mx-4 px-4 py-3 border-y border-indigo-100 rounded-lg' : ''}`}>
                                  {/* Date Column */}
                                  <div className="w-full md:w-32 flex-shrink-0 pt-2 flex md:flex-col items-center md:items-start gap-2 md:gap-0">
                                      <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                          {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                                      </span>
                                      <div className={`text-2xl font-light ${isToday ? 'text-indigo-900' : 'text-slate-800'}`}>
                                          {date.getDate()}
                                          {isToday && <span className="ml-2 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded align-middle font-bold tracking-wide">СЕГОДНЯ</span>}
                                      </div>
                                  </div>

                                  {/* Items Column */}
                                  <div className="flex-1 flex flex-col space-y-3 pb-4 md:pb-0 border-b md:border-b-0 border-slate-100 last:border-0">
                                      {items.length === 0 ? (
                                          <div 
                                            onClick={() => handleAddNewItem(dateStr)}
                                            className="flex-1 min-h-[100px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-sm text-slate-400 cursor-pointer hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all gap-2"
                                          >
                                              <Plus size={20} /> 
                                              <span className="font-medium">Добавить план</span>
                                          </div>
                                      ) : (
                                          items.map(item => (
                                              <div 
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={`
                                                    group relative bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                                    ${item.status === PlanStatus.DONE 
                                                        ? 'border-green-200 bg-green-50/30' 
                                                        : item.status === PlanStatus.DRAFT 
                                                            ? 'border-amber-200 bg-amber-50/30'
                                                            : 'border-slate-200 hover:border-indigo-300'
                                                    }
                                                `}
                                              >
                                                  <div className="flex justify-between items-start mb-2">
                                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.status === PlanStatus.DONE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                          {item.platform}
                                                      </span>
                                                      <div className="flex gap-2 items-center">
                                                          <div className={`w-2 h-2 rounded-full ${getGoalColor(item.goal)}`} title={item.goal}></div>
                                                          <span className="text-[10px] text-slate-400">{item.archetype}</span>
                                                      </div>
                                                  </div>
                                                  <h4 className="font-medium text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">
                                                      {item.topic}
                                                  </h4>
                                                  <p className="text-xs text-slate-500 line-clamp-2">
                                                      {item.rationale}
                                                  </p>

                                                  {item.status !== PlanStatus.DONE && (
                                                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onGenerateContent(item); }}
                                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-1"
                                                        >
                                                            <Wand2 size={12}/> Создать
                                                        </button>
                                                    </div>
                                                  )}
                                              </div>
                                          ))
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}

              {/* MONTH VIEW */}
              {viewMode === 'month' && (
                  <div className="h-full flex flex-col">
                      <div className="grid grid-cols-7 mb-2">
                          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase">
                                  {day}
                              </div>
                          ))}
                      </div>
                      <div className="grid grid-cols-7 auto-rows-fr gap-2 h-full">
                          {monthDays.map((dayObj, idx) => {
                              const dateStr = dayObj.date;
                              const items = groupedPlan[dateStr] || [];
                              const isToday = todayStr === dateStr;
                              const dateObj = new Date(dateStr);

                              return (
                                  <div 
                                    key={dateStr} 
                                    onClick={() => handleAddNewItem(dateStr)}
                                    className={`
                                        min-h-[100px] rounded-lg border p-2 relative group cursor-pointer transition-all
                                        ${dayObj.isCurrentMonth ? 'bg-white hover:shadow-md' : 'bg-slate-50/50 hover:bg-slate-50'}
                                        ${isToday ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-300'}
                                    `}
                                  >
                                      <span className={`text-xs font-bold absolute top-2 right-2 ${isToday ? 'text-indigo-600 bg-indigo-100 px-1.5 rounded' : dayObj.isCurrentMonth ? 'text-slate-400' : 'text-slate-300'}`}>
                                          {dateObj.getDate()}
                                      </span>
                                      
                                      <div className="mt-6 space-y-1">
                                          {items.map(item => (
                                              <div 
                                                key={item.id}
                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                                className={`
                                                    text-[9px] px-1.5 py-1 rounded truncate border flex items-center gap-1
                                                    ${item.status === PlanStatus.DONE 
                                                        ? 'bg-green-50 border-green-100 text-green-700' 
                                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-200'
                                                    }
                                                `}
                                                title={`${item.platform}: ${item.topic}`}
                                              >
                                                  <div className={`w-1.5 h-1.5 rounded-full ${getGoalColor(item.goal)} shrink-0`}></div>
                                                  <span className="font-bold opacity-70">{getPlatformIcon(item.platform)}</span>
                                                  <span className="truncate">{item.topic}</span>
                                              </div>
                                          ))}
                                          {items.length === 0 && (
                                              <div className="opacity-0 group-hover:opacity-100 flex justify-center pt-4">
                                                  <Plus size={16} className="text-slate-300"/>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

          </div>
      </div>

      {selectedItem && (
          <PlanItemModal 
              item={selectedItem}
              authorProfile={authorProfile}
              languageProfile={languageProfile}
              prompts={prompts}
              isOpen={!!selectedItem}
              onClose={() => setSelectedItem(null)}
              onSave={handleUpdateItem}
              onDelete={handleDeleteItem}
              onScriptGenerated={onScriptGenerated}
          />
      )}
    </div>
  );
};
