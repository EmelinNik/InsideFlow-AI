
import React, { useState, useEffect } from 'react';
import { Project, ContentPlanItem, PlanStatus, AuthorProfile, ContentStrategy } from '../types';
import { analyzeAudienceInsights } from '../services/geminiService';
import { BarChart3, TrendingUp, Users, MessageSquare, Share2, Eye, BrainCircuit, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Calculator, RefreshCw, PenTool, HelpCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  project: Project;
  authorProfile: AuthorProfile;
  onUpdatePlan: (newPlan: ContentPlanItem[]) => void;
}

interface MetricCollectorProps {
    onSave: (metrics: { reach: number; likes: number; reposts: number; comments: number }) => void;
}

const MetricCollector: React.FC<MetricCollectorProps> = ({ onSave }) => {
    const [localMetrics, setLocalMetrics] = useState({
        reach: '',
        likes: '',
        reposts: '',
        comments: ''
    });

    const handleSave = () => {
        onSave({
            reach: parseInt(localMetrics.reach) || 0,
            likes: parseInt(localMetrics.likes) || 0,
            reposts: parseInt(localMetrics.reposts) || 0,
            comments: parseInt(localMetrics.comments) || 0,
        });
    };

    return (
        <div className="mt-2 space-y-2 animate-in fade-in">
             <div className="grid grid-cols-2 gap-2">
                <input 
                    type="number" 
                    placeholder="👁️ Охват" 
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-colors"
                    value={localMetrics.reach}
                    onChange={(e) => setLocalMetrics(prev => ({...prev, reach: e.target.value}))}
                />
                <input 
                    type="number" 
                    placeholder="❤️ Лайки" 
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-colors"
                    value={localMetrics.likes}
                    onChange={(e) => setLocalMetrics(prev => ({...prev, likes: e.target.value}))}
                />
                <input 
                    type="number" 
                    placeholder="📢 Репосты" 
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-colors"
                    value={localMetrics.reposts}
                    onChange={(e) => setLocalMetrics(prev => ({...prev, reposts: e.target.value}))}
                />
                <input 
                    type="number" 
                    placeholder="💬 Коммент." 
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-colors"
                    value={localMetrics.comments}
                    onChange={(e) => setLocalMetrics(prev => ({...prev, comments: e.target.value}))}
                />
             </div>
             <button 
                onClick={handleSave}
                disabled={!localMetrics.reach}
                className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-900 disabled:opacity-50 transition-colors"
             >
                 Сохранить метрики
             </button>
        </div>
    );
};

export const Analytics: React.FC<AnalyticsProps> = ({ project, authorProfile, onUpdatePlan }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Filter items that are DONE and have at least some metrics filled (e.g. reach > 0)
  // These valid items are used for dashboard counters (All Time)
  const validItems = project.contentPlan.filter(item => item.status === PlanStatus.DONE && item.metrics && item.metrics.reach > 0);
  
  // Pending items are those that are DONE but have no metrics yet
  const pendingItems = project.contentPlan.filter(item => item.status === PlanStatus.DONE && (!item.metrics || item.metrics.reach === 0));

  // Totals
  const totalReach = validItems.reduce((acc, curr) => acc + (curr.metrics?.reach || 0), 0);
  const totalLikes = validItems.reduce((acc, curr) => acc + (curr.metrics?.likes || 0), 0);
  const totalComments = validItems.reduce((acc, curr) => acc + (curr.metrics?.comments || 0), 0);
  const totalReposts = validItems.reduce((acc, curr) => acc + (curr.metrics?.reposts || 0), 0);

  const avgER = totalReach > 0 
    ? (((totalLikes + totalComments + totalReposts) / totalReach) * 100).toFixed(2)
    : "0";

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // For AI analysis, limit to last 2 months to save tokens and keep relevance
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      const itemsForAi = validItems.filter(item => new Date(item.date) >= twoMonthsAgo);
      
      const report = await analyzeAudienceInsights(authorProfile, project.strategy, itemsForAi);
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
              return { ...item, status: PlanStatus.DONE, metrics };
          }
          return item;
      });
      onUpdatePlan(newPlan);
  };

  // --- CHART HELPERS ---
  const chartData = validItems.slice(-7).map(i => ({
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
                <span className="hidden md:inline">Как считать метрики?</span>
            </button>
            {validItems.length > 0 && (
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
                      <Calculator size={16}/> Где искать цифры?
                  </h3>
                  <button onClick={() => setShowHelp(false)} className="text-indigo-400 hover:text-indigo-700"><X size={18}/></button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-blue-500 w-2 h-2 rounded-full"></span>Telegram</h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Охват</span>
                              <span className="font-medium">Глазик под постом 👁️</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Реакции</span>
                              <span className="font-medium">Сумма всех эмодзи ❤️</span>
                          </li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-blue-600 w-2 h-2 rounded-full"></span>ВКонтакте</h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Охват</span>
                              <span className="font-medium">Счетчик в углу поста 👁️</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Лайки</span>
                              <span className="font-medium">Сердечко внизу ❤️</span>
                          </li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-purple-600 w-2 h-2 rounded-full"></span>Instagram</h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Охват</span>
                              <span className="font-medium">Статистика (Insights) 📊</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Лайки</span>
                              <span className="font-medium">Сердечко под фото ❤️</span>
                          </li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><span className="bg-red-600 w-2 h-2 rounded-full"></span>YouTube</h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Охват</span>
                              <span className="font-medium">Просмотры (Views) ▶️</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-50 pb-1">
                              <span>Лайки</span>
                              <span className="font-medium">Палец вверх 👍</span>
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Общий Охват', value: totalReach.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Лайки', value: totalLikes.toLocaleString(), icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Комментарии', value: totalComments.toLocaleString(), icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Вовлеченность (ER)', value: `${avgER}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
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
      {validItems.length > 0 && (
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
                                AI проанализирует корреляцию между форматами постов и вовлеченностью за последние 2 месяца и даст рекомендации.
                            </p>
                            
                            {validItems.length > 0 ? (
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
