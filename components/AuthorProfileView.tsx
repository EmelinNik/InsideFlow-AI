
import React, { useState, useEffect } from 'react';
import { AuthorProfile, NarrativeVoice, ProjectPersona, StrategicAnalysis, ProductService } from '../types';
import { UserCircle2, Edit2, Save, X, Sparkles, Wand2, Info, ShoppingBag, Target, ShieldAlert, Heart, Users, CheckCircle2, RotateCcw, Magnet, Gem, Crown, Loader2 } from 'lucide-react';
import { analyzeProjectIdentity } from '../services/geminiService';

interface AuthorProfileViewProps {
  profile: AuthorProfile;
  onUpdate: (profile: AuthorProfile) => void;
  onRetakeOnboarding: () => void;
}

export const AuthorProfileView: React.FC<AuthorProfileViewProps> = ({ profile, onUpdate, onRetakeOnboarding }) => {
  // Determine starting screen based on if the profile is already filled
  const hasProfile = profile.targetAudience && profile.contentGoals;
  const [screen, setScreen] = useState<'input' | 'results'>(hasProfile ? 'results' : 'input');
  
  // State for Screen 1 (Input)
  const [projectDesc, setProjectDesc] = useState(profile.contentGoals || '');
  const [products, setProducts] = useState(profile.values || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State for Screen 2 (Inline Editing)
  const [isEditingResults, setIsEditingResults] = useState(false);
  const [tempProfile, setTempProfile] = useState<AuthorProfile>(profile);

  // Sync temp profile when entering edit mode or when profile changes externally
  useEffect(() => {
    setTempProfile(profile);
  }, [profile, isEditingResults]);

  const handleRunAnalysis = async () => {
      if (!projectDesc.trim() || !products.trim()) {
          alert("Пожалуйста, заполните описание и продукты.");
          return;
      }
      setIsAnalyzing(true);
      try {
          const result = await analyzeProjectIdentity(projectDesc, products);
          
          // Update profile with analyzed data
          onUpdate({
              ...profile,
              targetAudience: result.targetAudience,
              audiencePainPoints: result.pains,
              taboos: result.fears, // Storing fears/objections in 'taboos'
              contentGoals: projectDesc,
              values: products,
              personas: result.personas,
              strategyAnalysis: result.strategy,
              // Keep existing products if any
              products: profile.products || []
          });
          
          setScreen('results');
      } catch (e) {
          alert("Ошибка анализа ИИ. Попробуйте еще раз.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleGoToInput = () => {
      setScreen('input');
      setIsEditingResults(false);
  };

  const handleStartEditing = () => {
      setIsEditingResults(true);
  };

  const handleCancelEditing = () => {
      setIsEditingResults(false);
      setTempProfile(profile); // Revert changes
  };

  const handleSaveEditing = () => {
      onUpdate(tempProfile);
      setIsEditingResults(false);
  };

  const handleTempChange = (field: keyof AuthorProfile, value: string) => {
      setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleStrategyChange = (field: keyof StrategicAnalysis, value: string) => {
      setTempProfile(prev => ({
          ...prev,
          strategyAnalysis: {
              ...prev.strategyAnalysis!,
              [field]: value
          }
      }));
  };

  // Screen 1: The Questionnaire
  if (screen === 'input') {
      return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <header className="text-center space-y-2">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-100 mb-4">
                      <Target size={24} />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Профиль проекта</h1>
                  <p className="text-slate-500">Заполните данные, и ИИ создаст стратегическую карту вашего бизнеса</p>
              </header>

              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10 space-y-10">
                  
                  {/* О проекте */}
                  <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                              <Target size={18} className="text-indigo-600"/>
                              Расскажите о проекте / бизнесе
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100">
                              Пример: Онлайн-школа йоги для женщин 35+
                          </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        Опишите миссию, уникальность и то, какую пользу вы несете миру. Чем подробнее, тем точнее будет ИИ.
                      </p>
                      <textarea 
                          className="w-full h-32 p-4 border border-slate-200 bg-slate-50 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed"
                          placeholder="Суть нашего бизнеса в том, что..."
                          value={projectDesc}
                          onChange={(e) => setProjectDesc(e.target.value)}
                      />
                  </div>

                  {/* Продукты / Услуги (Initial input for analysis) */}
                  <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                              <ShoppingBag size={18} className="text-indigo-600"/>
                              Продукты / Услуги (для анализа)
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100">
                              Пример: Курс "Йога с нуля", Индивидуальные сессии
                          </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        Что вы продаете? Перечислите основные позиции и их ценность для первоначального анализа.
                        (Управлять конкретными товарами можно будет в разделе "Товары и услуги").
                      </p>
                      <textarea 
                          className="w-full h-32 p-4 border border-slate-200 bg-slate-50 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed"
                          placeholder="Мы предлагаем следующие продукты..."
                          value={products}
                          onChange={(e) => setProducts(e.target.value)}
                      />
                  </div>

                  {/* Кнопка анализа */}
                  <div className="pt-4 border-t border-slate-50">
                      <button 
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing || !projectDesc.trim() || !products.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                      >
                          {isAnalyzing ? (
                              <>
                                <Loader2 size={24} className="animate-spin" />
                                <span>Анализируем бизнес-модель...</span>
                              </>
                          ) : (
                              <>
                                <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
                                <span>Проанализировать и Настроить</span>
                              </>
                          )}
                      </button>
                      
                      <div className="flex items-center justify-center gap-2 mt-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                         <Sparkles size={12} className="text-indigo-400" />
                         ИИ подберет ЦА, боли и страхи автоматически
                         <Sparkles size={12} className="text-indigo-400" />
                      </div>
                      
                      {hasProfile && (
                           <button 
                             onClick={() => setScreen('results')}
                             className="w-full mt-4 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider py-2"
                           >
                               Отмена (Вернуться к результатам)
                           </button>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // Screen 2: The Analysis Results
  return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Target size={28} />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900">Аналитика Проекта</h1>
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold uppercase tracking-widest mt-0.5">
                          <CheckCircle2 size={12}/> Готово к генерации
                      </div>
                  </div>
              </div>
              <div className="flex gap-3">
                  {isEditingResults ? (
                      <>
                        <button 
                            onClick={handleCancelEditing}
                            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <X size={16}/> Отмена
                        </button>
                        <button 
                            onClick={handleSaveEditing}
                            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Save size={16}/> Сохранить
                        </button>
                      </>
                  ) : (
                      <>
                        <button 
                            onClick={handleGoToInput}
                            className="px-4 py-2.5 text-slate-400 hover:text-indigo-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <RotateCcw size={14}/> Заново
                        </button>
                        <button 
                            onClick={handleStartEditing}
                            className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Edit2 size={16}/> Редактировать вручную
                        </button>
                        <button 
                            onClick={onRetakeOnboarding}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Sparkles size={16}/> Обучить стилю
                        </button>
                      </>
                  )}
              </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Insights Analysis (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                  
                  {/* Target Audience Result */}
                  <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5 relative overflow-hidden group ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                      {!isEditingResults && (
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <Users size={120} />
                        </div>
                      )}
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <Target size={20}/>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Ваша Аудитория (ЦА)</h3>
                      </div>
                      
                      {isEditingResults ? (
                          <textarea 
                             className="w-full h-40 p-4 bg-slate-50 border border-indigo-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                             value={tempProfile.targetAudience}
                             onChange={(e) => handleTempChange('targetAudience', e.target.value)}
                          />
                      ) : (
                        <div className="text-slate-700 leading-relaxed text-sm bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            {profile.targetAudience}
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Pains and Needs */}
                      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5 ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                  <Heart size={20}/>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Боли и потребности</h3>
                          </div>
                          
                          {isEditingResults ? (
                                <div className="space-y-2">
                                    <textarea 
                                        className="w-full h-32 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        value={tempProfile.audiencePainPoints}
                                        onChange={(e) => handleTempChange('audiencePainPoints', e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400">Перечислите через запятую</p>
                                </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.audiencePainPoints.split(',').map((p, i) => (
                                    <span key={i} className="bg-rose-50/50 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold border border-rose-100 shadow-sm transition-transform hover:-translate-y-0.5">
                                        {p.trim()}
                                    </span>
                                ))}
                            </div>
                          )}
                      </div>

                      {/* Fears and Objections */}
                      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5 ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                  <ShieldAlert size={20}/>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Страхи и возражения</h3>
                          </div>
                          
                          {isEditingResults ? (
                                <div className="space-y-2">
                                    <textarea 
                                        className="w-full h-32 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        value={tempProfile.taboos}
                                        onChange={(e) => handleTempChange('taboos', e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400">Перечислите через запятую</p>
                                </div>
                          ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.taboos.split(',').map((f, i) => (
                                        <span key={i} className="bg-amber-50/50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100 shadow-sm transition-transform hover:-translate-y-0.5">
                                            {f.trim()}
                                        </span>
                                    ))}
                                </div>
                          )}
                      </div>

                  </div>
              </div>

              {/* RIGHT COLUMN: Personas (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                  <div className="px-2 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} className="text-indigo-600"/> Портреты ЦА (Персонажи)
                    </h3>
                  </div>
                  
                  {profile.personas && profile.personas.length > 0 ? (
                      profile.personas.map((p, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 hover:border-indigo-300 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -z-10 translate-x-12 -translate-y-12 group-hover:bg-indigo-100 transition-colors"></div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                                    <UserCircle2 size={32}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-none">{p.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{p.age} • {p.role}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wider">Главная цель</span>
                                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{p.goal}</p>
                                </div>
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1.5 tracking-wider">Почему купит у вас?</span>
                                    <p className="text-[11px] text-indigo-900 font-bold leading-relaxed">{p.whyBuy}</p>
                                </div>
                            </div>
                        </div>
                      ))
                  ) : (
                      <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                          <Users size={32} className="mx-auto mb-4 opacity-20"/>
                          <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">Персонажи появятся <br/> после анализа проекта</p>
                      </div>
                  )}
              </div>
          </div>
          
          {/* STRATEGIC ROADMAP SECTION */}
          {(profile.strategyAnalysis || isEditingResults) && (
              <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-2 px-2">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Маркетинговая Стратегия</h3>
                      <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* ATTRACTION */}
                      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4 ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                           <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                  <Magnet size={20}/>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Привлечение (Hooks)</h3>
                           </div>
                           {isEditingResults ? (
                               <textarea 
                                    className="w-full h-48 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={tempProfile.strategyAnalysis?.attraction || ''}
                                    onChange={(e) => handleStrategyChange('attraction', e.target.value)}
                                    placeholder="Какие триггеры и заголовки использовать?"
                               />
                           ) : (
                               <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                   {profile.strategyAnalysis?.attraction || "Нет данных"}
                               </div>
                           )}
                      </div>

                      {/* SALES */}
                      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4 ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                           <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                  <Gem size={20}/>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Продажи</h3>
                           </div>
                           {isEditingResults ? (
                               <textarea 
                                    className="w-full h-48 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={tempProfile.strategyAnalysis?.sales || ''}
                                    onChange={(e) => handleStrategyChange('sales', e.target.value)}
                                    placeholder="Через какие смыслы продавать?"
                               />
                           ) : (
                               <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                   {profile.strategyAnalysis?.sales || "Нет данных"}
                               </div>
                           )}
                      </div>

                      {/* BRANDING */}
                      <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4 ${isEditingResults ? 'ring-2 ring-indigo-500/20' : ''}`}>
                           <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                  <Crown size={20}/>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Бренд & Tone</h3>
                           </div>
                           {isEditingResults ? (
                               <textarea 
                                    className="w-full h-48 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={tempProfile.strategyAnalysis?.brand || ''}
                                    onChange={(e) => handleStrategyChange('brand', e.target.value)}
                                    placeholder="Какое позиционирование выбрать?"
                               />
                           ) : (
                               <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                   {profile.strategyAnalysis?.brand || "Нет данных"}
                               </div>
                           )}
                      </div>

                  </div>
              </div>
          )}
          
          {/* HELP TEXT */}
          <div className="flex items-start gap-4 text-slate-400 text-[10px] px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-4xl mx-auto text-center justify-center uppercase font-bold tracking-[0.1em] leading-relaxed mt-8">
              <Info size={16} className="shrink-0 text-slate-300" />
              <p>
                  Этот профиль — "фундамент" вашего ИИ. На основе этих данных строятся прогревы, 
                  выбираются темы в календаре и пишутся сценарии, которые действительно продают.
              </p>
          </div>
      </div>
  );
};
