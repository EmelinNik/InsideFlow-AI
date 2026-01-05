
import React, { useState, useEffect } from 'react';
import { Project, ContentPlanItem, PlanStatus, AuthorProfile, ContentStrategy } from '../types';
import { analyzeAudienceInsights } from '../services/geminiService';
import { BarChart3, TrendingUp, Users, MessageSquare, Share2, Eye, BrainCircuit, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Calculator, RefreshCw, PenTool, HelpCircle, X, Percent, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  project: Project;
  authorProfile: AuthorProfile;
  onUpdatePlan: (newPlan: ContentPlanItem[]) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ project, authorProfile, onUpdatePlan }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Analyzed items are DONE items with at least some metrics
  const analyzedItems = project.contentPlan.filter(item => 
      item.status === PlanStatus.DONE && item.metrics && (item.metrics.reach > 0 || item.metrics.likes > 0)
  );
  
  // Pending items are DONE items without metrics
  const pendingItems = project.contentPlan.filter(item => 
      item.status === PlanStatus.DONE && (!item.metrics || (item.metrics.reach === 0 && item.metrics.likes === 0))
  );

  // Totals
  const totalReach = analyzedItems.reduce((acc, curr) => acc + (curr.metrics?.reach || 0), 0);
  const totalLikes = analyzedItems.reduce((acc, curr) => acc + (curr.metrics?.likes || 0), 0);
  const totalComments = analyzedItems.reduce((acc, curr) => acc + (curr.metrics?.comments || 0), 0);
  const totalReposts = analyzedItems.reduce((acc, curr) => acc + (curr.metrics?.reposts || 0), 0);

  const avgER = totalReach > 0 
    ? (((totalLikes + totalComments + totalReposts) / totalReach) * 100).toFixed(2)
    : "0";

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const report = await analyzeAudienceInsights(authorProfile, project.strategy, analyzedItems);
      setAiReport(report);
    } catch (e) {
      alert("Ошибка AI анализа.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateStatus = (id: string, metrics: any) => {
      const newPlan = project.contentPlan.map(item => {
          if (item.id === id) {
              // Status remains DONE, but metrics are updated, effectively moving it to "analyzed" pile
              return { ...item, status: PlanStatus.DONE, metrics };
          }
          return item;
      });
      onUpdatePlan(newPlan);
  };

  // --- CHART HELPERS ---
  const chartData = analyzedItems.slice(-7).map(i => ({
      label: new Date(i.date).toLocaleDateString('ru-RU', {day: 'numeric'}),
      value: i.metrics?.reach || 0
  }));
  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Аналитика и Метрики
          </h2>
          <p className="text-slate-500 text-sm mt-1">Отслеживайте эффективность и обучайте ИИ на реальных цифрах.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${showHelp ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
                <HelpCircle size={18} />
                <span className="hidden md:inline">Справка и Нормы</span>
            </button>
            {analyzedItems.length > 0 && (
            <button 
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
            >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <BrainCircuit size={18} />}
                AI Анализ
            </button>
            )}
        </div>
      </div>

      {/* METRICS GUIDE PANEL */}
      {showHelp && (
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 relative z-10">
              <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                      <Calculator size={16}/> Памятка по метрикам
                  </h3>
                  <button onClick={() => setShowHelp(false)} className="text-indigo-400 hover:text-indigo-700"><X size={18}/></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-blue-500 w-2 h-2 rounded-full"></span>Telegram</h4>
                        <ul className="text-xs space-y-2 text-slate-600">
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Охват</span><span className="font-medium">Глазик 👁️</span></li>
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Реакции</span><span className="font-medium">Эмодзи ❤️</span></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-blue-600 w-2 h-2 rounded-full"></span>ВКонтакте</h4>
                        <ul className="text-xs space-y-2 text-slate-600">
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Охват</span><span className="font-medium">Счетчик 👁️</span></li>
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Лайки</span><span className="font-medium">Сердечко ❤️</span></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-purple-600 w-2 h-2 rounded-full"></span>Instagram</h4>
                        <ul className="text-xs space-y-2 text-slate-600">
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Охват</span><span className="font-medium">Insights 📊</span></li>
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Лайки</span><span className="font-medium">Сердечко ❤️</span></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-red-600 w-2 h-2 rounded-full"></span>YouTube</h4>
                        <ul className="text-xs space-y-2 text-slate-600">
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Охват</span><span className="font-medium">Views ▶️</span></li>
                            <li className="flex justify-between border-b border-slate-50 pb-1"><span>Лайки</span><span className="font-medium">Палец 👍</span></li>
                        </ul>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Percent size={14}/> Стандартные значения (Норма ER)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-xs text-slate-500 mb-1">Telegram</div>
                             <div className="font-bold text-indigo-600">10% – 20%</div>
                             <div className="text-[10px] text-slate-400">от подписчиков</div>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-xs text-slate-500 mb-1">Instagram</div>
                             <div className="font-bold text-indigo-600">3% – 7%</div>
                             <div className="text-[10px] text-slate-400">от подписчиков</div>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-xs text-slate-500 mb-1">ВКонтакте</div>
                             <div className="font-bold text-indigo-600">1.5% – 3%</div>
                             <div className="text-[10px] text-slate-400">от подписчиков</div>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-xs text-slate-500 mb-1">YouTube</div>
                             <div className="font-bold text-indigo-600">5% – 10%</div>
                             <div className="text-[10px] text-slate-400">от просмотров</div>
                         </div>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Общий Охват', value: totalReach.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Лайки', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Репосты', value: totalReposts.toLocaleString(), icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Комментарии', value: totalComments.toLocaleString(), icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Вовлеченность (ER)', value: `${avgER}%`, icon: Percent, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* SIMPLE CHART */}
      {analyzedItems.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600"/>
                  Динамика охватов (посл. 7 постов)
              </h3>
              <div className="flex items-end justify-between h-40 gap-2">
                  {chartData.map((d, i) => {
                      const heightPercent = Math.round((d.value / maxVal) * 100);
                      return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                              <div className="w-full bg-indigo-50 rounded-t-md relative overflow-hidden h-full flex items-end">
                                  <div 
                                    className="w-full bg-indigo-500 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600"
                                    style={{ height: `${heightPercent}%` }}
                                  ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                              <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {d.value.toLocaleString()}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: PENDING DATA COLLECTION */}
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                        <RefreshCw size={16} className="text-indigo-600"/>
                        Сбор статистики
                    </h3>
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {pendingItems.length} постов
                    </span>
                </div>
                <div className="p-4 space-y-3">
                    {pendingItems.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle2 size={24} className="mx-auto mb-2 opacity-30 text-green-500" />
                            <p className="text-xs">Все посты проанализированы!</p>
                        </div>
                    ) : (
                        pendingItems.map(item => (
                            <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.platform.split(' ')[0]}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-3">{item.topic}</h4>
                                <MetricCollector 
                                    onSave={(metrics) => handleUpdateStatus(item.id, metrics)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-indigo-600"/>
                    <h4 className="text-xs font-bold text-indigo-900 uppercase">Совет</h4>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    Вносите данные через 48 часов после публикации, чтобы AI мог оценить органический рост и сформировать точный профиль вашей аудитории.
                </p>
            </div>
        </div>

        {/* RIGHT: AI ANALYSIS & DETAILED REPORT */}
        <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <BrainCircuit size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Отчет AI-аналитика</h3>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    {isAnalyzing ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                            <p className="text-lg font-medium">AI-директор изучает ваши метрики...</p>
                            <p className="text-sm text-slate-400 mt-1">Это займет около 10-15 секунд.</p>
                        </div>
                    ) : aiReport ? (
                        <div className="prose prose-indigo max-w-none animate-in fade-in duration-500">
                            <ReactMarkdown>{aiReport}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <BarChart3 size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Глубокий анализ аудитории</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                AI проанализирует корреляцию между форматами постов и вовлеченностью, а затем даст рекомендации по улучшению стратегии.
                            </p>
                            
                            {analyzedItems.length > 0 ? (
                                <button 
                                    onClick={handleRunAiAnalysis}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                >
                                    <Sparkles size={18}/> Сформировать отчет
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-2 bg-amber-50 text-amber-800 px-6 py-4 rounded-xl border border-amber-100">
                                    <AlertCircle size={20}/>
                                    <p className="text-sm font-bold">Недостаточно данных</p>
                                    <p className="text-xs">Сначала внесите метрики хотя бы для 1 поста в виджете слева.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Internal mini-component for data entry
const MetricCollector: React.FC<{ onSave: (m: any) => void }> = ({ onSave }) => {
    const [m, setM] = useState({ reach: '', likes: '', comments: '' });

    const handleSave = () => {
        if (!m.reach) return;
        onSave({
            reach: parseInt(m.reach) || 0,
            likes: parseInt(m.likes) || 0,
            comments: parseInt(m.comments) || 0,
            reposts: 0
        });
    };

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Охват</span>
                    <input type="number" className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-900" placeholder="1000" value={m.reach} onChange={e => setM({...m, reach: e.target.value})}/>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Лайки</span>
                    <input type="number" className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-900" placeholder="50" value={m.likes} onChange={e => setM({...m, likes: e.target.value})}/>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Комм.</span>
                    <input type="number" className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-900" placeholder="5" value={m.comments} onChange={e => setM({...m, comments: e.target.value})}/>
                </div>
            </div>
            <button 
                onClick={handleSave}
                disabled={!m.reach}
                className="w-full py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-1"
            >
                Сохранить <CheckCircle2 size={10}/>
            </button>
        </div>
    );
}
