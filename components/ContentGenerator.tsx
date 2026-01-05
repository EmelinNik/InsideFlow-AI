
import React, { useState, useEffect, useRef } from 'react';
import { AuthorProfile, LanguageProfile, TargetPlatform, GeneratedScript, PostArchetype, GeneratedOption, PLATFORM_COMPATIBILITY, PromptKey } from '../types';
import { generateUnitOptions, getArchetypeFormula, getUnitName } from '../services/geminiService';
import { Loader2, Send, Copy, FileText, CheckCircle2, LayoutTemplate, Smartphone, MousePointerClick, ArrowRight, Play, RefreshCw, ChevronRight, Sparkles, Star, ThumbsUp, AlertCircle, AlertTriangle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ContentGeneratorProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  prompts: Record<string, string>;
  onScriptGenerated: (script: GeneratedScript) => void;
  initialConfig?: { topic: string; platform: TargetPlatform; archetype: PostArchetype; description?: string } | null;
  className?: string;
  compact?: boolean;
  onCancel?: () => void;
}

type GenerationStatus = 'idle' | 'loading' | 'selecting' | 'finished' | 'error';

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  authorProfile,
  languageProfile,
  prompts,
  onScriptGenerated,
  initialConfig,
  className,
  compact = false,
  onCancel
}) => {
  // Initialize state directly from props to avoid race conditions
  const [topic, setTopic] = useState(initialConfig?.topic || '');
  const [description, setDescription] = useState(initialConfig?.description || '');
  const [platform, setPlatform] = useState<TargetPlatform>(initialConfig?.platform || TargetPlatform.TELEGRAM);
  const [archetype, setArchetype] = useState<PostArchetype>(initialConfig?.archetype || PostArchetype.SHORT_POST);
  
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [unitSequence, setUnitSequence] = useState<string[]>([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<GeneratedOption[]>([]);
  const [assembledUnits, setAssembledUnits] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-start ref to prevent double firing
  const hasAutoStarted = useRef(false);

  // Platform Compatibility Safety Check
  useEffect(() => {
      // Only run this check if we are NOT in the middle of a generation sequence initiated by initialConfig
      // and if the user manually changed the platform after init.
      if (status === 'idle' && !initialConfig) {
          const allowedArchetypes = PLATFORM_COMPATIBILITY[platform];
          if (!allowedArchetypes?.includes(archetype)) {
              setArchetype(allowedArchetypes?.[0] || PostArchetype.SHORT_POST);
          }
      }
  }, [platform]);

  // Auto-start logic - MOUNT ONLY to guarantee execution
  useEffect(() => {
      if (initialConfig && !hasAutoStarted.current) {
          if (initialConfig.topic) {
             hasAutoStarted.current = true;
             // Use the initial values explicitly to avoid stale closure
             handleStart(initialConfig.archetype, initialConfig.topic);
          }
      }
  }, []);

  const canStart = topic.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assembledUnits, currentOptions]);

  const handleStart = (archetypeOverride?: PostArchetype, topicOverride?: string) => {
    const archToUse = archetypeOverride || archetype;
    const topicToUse = topicOverride || topic;

    if (!topicToUse) return;

    const sequence = getArchetypeFormula(archToUse);
    
    setUnitSequence(sequence);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setStatus('loading');
    
    // Slight delay to allow UI to render loading state
    setTimeout(() => {
        fetchOptionsForUnit(sequence[0], {}, archToUse, topicToUse);
    }, 100);
  };

  const fetchOptionsForUnit = async (
      unitKey: string, 
      currentAssembled: Record<string, string>, 
      archToUse: PostArchetype,
      currentTopic: string = topic
    ) => {
    try {
      const contextText = Object.values(currentAssembled).join('\n\n');
      const options = await generateUnitOptions(
          currentTopic, 
          platform, 
          archToUse, 
          authorProfile, 
          languageProfile, 
          unitKey, 
          contextText, 
          description,
          prompts
      );
      
      if (!options || options.length === 0) {
          throw new Error("No options generated");
      }

      setCurrentOptions(options);
      setStatus('selecting');
    } catch (error) {
      console.error("Gen Error", error);
      setStatus('error');
    }
  };

  const handleSelectOption = (optionText: string) => {
    const currentUnitKey = unitSequence[currentUnitIndex];
    const newAssembled = { ...assembledUnits, [currentUnitKey]: optionText };
    setAssembledUnits(newAssembled);
    const nextIndex = currentUnitIndex + 1;
    
    if (nextIndex < unitSequence.length) {
      setCurrentUnitIndex(nextIndex);
      setStatus('loading');
      fetchOptionsForUnit(unitSequence[nextIndex], newAssembled, archetype);
    } else {
      finishGeneration(newAssembled);
    }
  };

  const finishGeneration = (finalUnits: Record<string, string>) => {
    setStatus('finished');
    let finalMarkdown = `# ${topic}\n*${platform} | ${archetype}*\n\n`;
    
    // Reconstruct in order
    unitSequence.forEach(unitKey => {
        if (finalUnits[unitKey]) {
            finalMarkdown += `${finalUnits[unitKey]}\n\n`;
        }
    });

    onScriptGenerated({
      id: Date.now().toString(),
      topic,
      platform,
      content: finalMarkdown,
      createdAt: new Date().toISOString()
    });
  };

  const handleCopyResult = () => {
      const text = Object.values(assembledUnits).join('\n\n');
      navigator.clipboard.writeText(text);
      alert('Текст скопирован!');
  };

  // Renders the sequence of completed blocks
  const renderHistory = () => (
    <div className="space-y-4">
      {unitSequence.slice(0, currentUnitIndex).map((unitKey, idx) => (
        <div key={unitKey} className="bg-slate-50 border border-slate-200 rounded-lg p-3 animate-in slide-in-from-top-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
             <CheckCircle2 size={12} className="text-green-500"/>
             {getUnitName(unitKey)}
          </div>
          <div className="prose prose-sm prose-slate max-w-none text-slate-800 leading-snug">
             <ReactMarkdown>{assembledUnits[unitKey]}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      
      {/* CONFIG PANEL (Only visible if idle and NOT compact mode) */}
      {status === 'idle' && !compact && (
          <div className="flex-1 overflow-y-auto">
              <div className="max-w-xl mx-auto space-y-6 py-8">
                  <div className="text-center mb-8">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <LayoutTemplate size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Конструктор Сценария</h2>
                      <p className="text-slate-500 mt-2">Соберите идеальный пост блок за блоком.</p>
                  </div>

                  {!languageProfile.isAnalyzed && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3 items-start">
                          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5"/>
                          <div>
                              <h4 className="text-sm font-bold text-amber-800">Стиль не обучен</h4>
                              <p className="text-xs text-amber-700 mt-1">
                                  ИИ будет использовать нейтральный тон. Для лучших результатов добавьте примеры текстов во вкладке "Стиль".
                              </p>
                          </div>
                      </div>
                  )}

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">О чем пишем?</label>
                          <input 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Тема поста..."
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Дополнительные факты (контекст)</label>
                          <textarea 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm resize-none"
                              placeholder="Цифры, детали, имена, которые нужно упомянуть..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Smartphone size={14}/> Платформа</label>
                              <select 
                                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-sm"
                                  value={platform}
                                  onChange={(e) => setPlatform(e.target.value as TargetPlatform)}
                              >
                                  {Object.values(TargetPlatform).map(p => (
                                      <option key={p} value={p}>{p}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><LayoutTemplate size={14}/> Формат</label>
                              <select 
                                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-sm"
                                  value={archetype}
                                  onChange={(e) => setArchetype(e.target.value as PostArchetype)}
                              >
                                  {(PLATFORM_COMPATIBILITY[platform] || []).map(a => (
                                      <option key={a} value={a}>{a}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <button 
                          onClick={() => handleStart()}
                          disabled={!canStart}
                          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                      >
                          <Play size={20} fill="currentColor"/> Начать генерацию
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ACTIVE GENERATION VIEW */}
      {status !== 'idle' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header for Compact Mode */}
              {compact && (
                  <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                          <Sparkles size={16}/> Генерация с ИИ
                      </div>
                      {onCancel && (
                          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                              <X size={16}/>
                          </button>
                      )}
                  </div>
              )}

              {/* Progress Bar */}
              {status !== 'finished' && (
                  <div className="flex items-center gap-2 py-2 border-b border-slate-100 bg-white shrink-0 mb-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                              style={{ width: `${((currentUnitIndex) / unitSequence.length) * 100}%` }}
                          ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {currentUnitIndex + 1} / {unitSequence.length}
                      </span>
                  </div>
              )}

              {/* Chat / History Area */}
              <div className={`flex-1 overflow-y-auto ${compact ? 'max-h-[400px]' : 'p-4 md:p-6'} space-y-4 bg-slate-50/30`}>
                  {renderHistory()}
                  
                  {/* Current Step Loading */}
                  {status === 'loading' && (
                      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                              <Sparkles size={12} className="text-white animate-pulse" />
                          </div>
                          <div className="space-y-1">
                              <div className="text-xs font-medium text-slate-500">
                                  Пишу блок: <span className="text-indigo-600 font-bold">{getUnitName(unitSequence[currentUnitIndex])}</span>...
                              </div>
                              <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Options Selection */}
                  {status === 'selecting' && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <MousePointerClick size={14} className="text-indigo-600"/>
                              Выберите вариант:
                          </div>
                          
                          <div className="grid gap-3">
                              {currentOptions.map((option, idx) => (
                                  <div 
                                      key={idx}
                                      onClick={() => handleSelectOption(option.text)}
                                      className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 cursor-pointer transition-all relative"
                                  >
                                      <div className="prose prose-sm prose-slate max-w-none mb-2 text-slate-800 leading-snug">
                                          <ReactMarkdown>{option.text}</ReactMarkdown>
                                      </div>
                                      
                                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center mt-2">
                                          <p className="text-[10px] text-slate-400 italic">{option.reasoning}</p>
                                          <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                              Выбрать <ArrowRight size={10}/>
                                          </button>
                                      </div>

                                      {option.isBest && (
                                          <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                              <Star size={8} fill="currentColor"/> AI Choice
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                          
                          <div className="flex justify-center pt-2">
                              <button 
                                  onClick={() => fetchOptionsForUnit(unitSequence[currentUnitIndex], assembledUnits, archetype)}
                                  className="text-[10px] text-slate-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                              >
                                  <RefreshCw size={10}/> Еще варианты
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Error State */}
                  {status === 'error' && (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                          <AlertCircle size={20} className="mx-auto text-red-500 mb-2"/>
                          <h4 className="font-bold text-red-800 text-sm">Ошибка генерации</h4>
                          <p className="text-xs text-red-600 mb-3">Не удалось получить ответ.</p>
                          <button 
                              onClick={() => fetchOptionsForUnit(unitSequence[currentUnitIndex], assembledUnits, archetype)}
                              className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50"
                          >
                              Повторить
                          </button>
                      </div>
                  )}

                  <div ref={messagesEndRef} />
              </div>
          </div>
      )}

      {/* FALLBACK FOR COMPACT MODE IF NO TOPIC */}
      {status === 'idle' && compact && !topic && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
               <p className="text-sm text-slate-500 mb-4">Тема поста не указана. Введите тему в настройках выше, чтобы начать.</p>
               <button 
                  onClick={onCancel}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium"
               >
                   Вернуться к настройкам
               </button>
          </div>
      )}
      {/* FALLBACK FOR COMPACT MODE IF HAS TOPIC BUT DID NOT AUTOSTART (Safety) */}
      {status === 'idle' && compact && topic && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
               <button 
                  onClick={() => handleStart()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2"
               >
                   <Play size={16} fill="currentColor"/> Запустить генерацию
               </button>
          </div>
      )}
    </div>
  );
};
