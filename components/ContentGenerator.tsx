
import React, { useState, useEffect, useRef } from 'react';
import { AuthorProfile, LanguageProfile, GeneratedScript, GeneratedOption, PlatformConfig, ArchetypeConfig, GenerationProgress, ArchetypeStep, TargetPlatform, PostArchetype } from '../types';
import { generateUnitOptions, getArchetypeFormula, getUnitName } from '../services/geminiService';
import { Loader2, Play, RefreshCw, MousePointerClick, Star, CheckCircle2, FileText, Edit2, X, Check, Trash2, MessageSquare, Send } from 'lucide-react';
import { createId } from '../utils/id';

interface ContentGeneratorProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  onScriptGenerated: (script: GeneratedScript) => void;
  platformConfigs?: PlatformConfig[]; 
  archetypeConfigs?: ArchetypeConfig[];
  initialConfig?: { topic: string; platform: string; archetype: string; description?: string } | null;
  persistence?: GenerationProgress;
  onPersistenceUpdate?: (progress?: GenerationProgress) => void;
  className?: string;
}

type GenerationStatus = 'idle' | 'loading' | 'selecting' | 'finished' | 'answering';

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  authorProfile,
  languageProfile,
  onScriptGenerated,
  platformConfigs = [],
  archetypeConfigs = [],
  initialConfig,
  persistence,
  onPersistenceUpdate,
  className
}) => {
  const defaultPlatform = platformConfigs[0]?.name || TargetPlatform.TELEGRAM;
  const defaultArchetype = archetypeConfigs[0]?.name || PostArchetype.SHORT_POST;

  // --- STATE ---
  const [topic, setTopic] = useState(persistence?.topic || '');
  const [description, setDescription] = useState(persistence?.description || '');
  const [platform, setPlatform] = useState<string>(persistence?.platform || defaultPlatform);
  const [archetype, setArchetype] = useState<string>(persistence?.archetype || defaultArchetype);
  const [status, setStatus] = useState<GenerationStatus>(persistence?.status || 'idle');
  const [unitSequence, setUnitSequence] = useState<string[]>(persistence?.unitSequence || []);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(persistence?.currentUnitIndex || 0);
  const [assembledUnits, setAssembledUnits] = useState<Record<string, string>>(persistence?.assembledUnits || {});
  const [activeQuestion, setActiveQuestion] = useState(persistence?.activeQuestion || '');
  
  // Input for answering questions
  const [userAnswer, setUserAnswer] = useState('');
  
  // Local volatile state
  const [currentOptions, setCurrentOptions] = useState<GeneratedOption[]>([]);
  const lastConfigRef = useRef<string>("");

  useEffect(() => {
    if (persistence) {
        setTopic(persistence.topic);
        setDescription(persistence.description);
        setPlatform(persistence.platform);
        setArchetype(persistence.archetype);
        setStatus(persistence.status);
        setUnitSequence(persistence.unitSequence);
        setCurrentUnitIndex(persistence.currentUnitIndex);
        setAssembledUnits(persistence.assembledUnits);
        setActiveQuestion(persistence.activeQuestion || '');
        
        if (persistence.status === 'loading' && persistence.unitSequence.length > 0) {
            fetchOptionsForUnit(persistence.unitSequence[persistence.currentUnitIndex], persistence.assembledUnits);
        }
    }
  }, [persistence]);

  // FIX: Deep compare initialConfig to prevent resets on every render
  useEffect(() => {
    if (initialConfig) {
        const configKey = `${initialConfig.topic}-${initialConfig.platform}-${initialConfig.archetype}-${initialConfig.description}`;
        if (lastConfigRef.current !== configKey) {
            lastConfigRef.current = configKey;
            setTopic(initialConfig.topic);
            setPlatform(initialConfig.platform);
            setArchetype(initialConfig.archetype);
            setDescription(initialConfig.description || '');
            setStatus('idle');
            setAssembledUnits({});
            setUnitSequence([]);
            // Don't notify update here, wait for manual start or first action
        }
    }
  }, [initialConfig]);

  const notifyUpdate = (updates: Partial<GenerationProgress>) => {
      if (onPersistenceUpdate) {
          const current: GenerationProgress = {
              topic, description, platform, archetype, status, unitSequence, currentUnitIndex, assembledUnits, activeQuestion,
              ...updates
          };
          onPersistenceUpdate(current);
      }
  };

  const getCurrentStepConfig = (): ArchetypeStep | undefined => {
      const config = archetypeConfigs.find(a => a.name === archetype || a.id === archetype);
      if (!config) return undefined;
      const unitKey = unitSequence[currentUnitIndex];
      return config.structure.find(s => s.id === unitKey);
  };

  const handleStart = () => {
    const sequence = getArchetypeFormula(archetype, archetypeConfigs);
    setUnitSequence(sequence);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setStatus('loading');
    notifyUpdate({ unitSequence: sequence, currentUnitIndex: 0, assembledUnits: {}, status: 'loading' });
    fetchOptionsForUnit(sequence[0], {});
  };

  const fetchOptionsForUnit = async (unitKey: string, currentAssembled: Record<string, string>) => {
    try {
      const contextText = Object.values(currentAssembled).join('\n\n');
      const options = await generateUnitOptions(
          topic, platform, archetype, authorProfile, languageProfile, unitKey, contextText, 
          platformConfigs, archetypeConfigs, description
      );
      
      const stepConfig = getCurrentStepConfig();
      if (stepConfig?.type === 'question') {
          const bestQ = options.find(o => o.isBest) || options[0];
          setActiveQuestion(bestQ.text);
          setStatus('answering');
          notifyUpdate({ status: 'answering', activeQuestion: bestQ.text });
      } else {
          setCurrentOptions(options);
          setStatus('selecting');
          notifyUpdate({ status: 'selecting' });
      }
    } catch (error) {
      alert("Ошибка генерации. Попробуйте еще раз.");
      setStatus('idle');
      notifyUpdate({ status: 'idle' });
    }
  };

  const handleSelectOption = (optionText: string) => {
    const currentUnitKey = unitSequence[currentUnitIndex];
    const newAssembled = { ...assembledUnits, [currentUnitKey]: optionText };
    advanceSequence(newAssembled);
  };

  const handleAnswerSubmit = () => {
    if (!userAnswer.trim()) return;
    const currentUnitKey = unitSequence[currentUnitIndex];
    const newAssembled = { ...assembledUnits, [currentUnitKey]: userAnswer.trim() };
    setUserAnswer('');
    setActiveQuestion('');
    advanceSequence(newAssembled);
  };

  const advanceSequence = (newAssembled: Record<string, string>) => {
    setAssembledUnits(newAssembled);
    const nextIndex = currentUnitIndex + 1;
    
    if (nextIndex < unitSequence.length) {
      setCurrentUnitIndex(nextIndex);
      setStatus('loading');
      notifyUpdate({ assembledUnits: newAssembled, currentUnitIndex: nextIndex, status: 'loading', activeQuestion: '' });
      fetchOptionsForUnit(unitSequence[nextIndex], newAssembled);
    } else {
      finishGeneration(newAssembled);
    }
  };

  const finishGeneration = (finalUnits: Record<string, string>) => {
    setStatus('finished');
    notifyUpdate({ status: 'finished', assembledUnits: finalUnits });
    
    const config = archetypeConfigs.find(a => a.name === archetype || a.id === archetype);
    let finalMarkdown = `# ${topic}\n*${platform} | ${archetype}*\n\n`;
    
    unitSequence.forEach(key => {
        const step = config?.structure.find(s => s.id === key);
        if (step?.type !== 'question') {
             finalMarkdown += `${finalUnits[key]}\n\n`;
        }
    });
    
    onScriptGenerated({
      id: createId(),
      topic, platform,
      content: finalMarkdown,
      createdAt: new Date().toISOString()
    });
  };

  const handleReset = () => {
    if (status !== 'idle' && status !== 'finished' && !confirm("Сбросить текущий прогресс?")) return;
    setStatus('idle');
    setUnitSequence([]);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setCurrentOptions([]);
    setActiveQuestion('');
    setTopic('');
    setDescription('');
    lastConfigRef.current = "";
    if (onPersistenceUpdate) onPersistenceUpdate(undefined);
  };

  const progressPercent = unitSequence.length > 0 ? Math.round((currentUnitIndex / unitSequence.length) * 100) : 0;

  return (
    <div className={`flex flex-col gap-4 md:gap-6 ${className || 'max-w-7xl mx-auto p-4 md:p-6 h-full'}`}>
      
      {/* HEADER CONFIG */}
      <div className={`bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm transition-all ${status !== 'idle' ? 'hidden md:flex' : 'flex'} flex-col md:flex-row gap-4 items-stretch md:items-end`}>
         {status === 'idle' ? (
            <>
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">О чем пишем?</label>
                    <input className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Тема поста..." value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 md:flex gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Площадка</label><select className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs" value={platform} onChange={e => setPlatform(e.target.value)}>{platformConfigs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Формат</label><select className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs" value={archetype} onChange={e => setArchetype(e.target.value)}>{archetypeConfigs.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
                </div>
                <button onClick={handleStart} disabled={!topic.length || !languageProfile.isAnalyzed} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"><Play size={14} fill="currentColor" /> Старт</button>
            </>
         ) : (
             <div className="flex items-center justify-between w-full">
                 <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4"><span className="font-bold text-sm text-slate-900 truncate max-w-[200px]">{topic}</span><div className="flex gap-2"><span className="bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">{archetype}</span><span className="bg-slate-100 text-slate-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">{platform}</span></div></div>
                 <button onClick={handleReset} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase"><Trash2 size={12} /> Сброс</button>
             </div>
         )}
      </div>

      <div className="flex-1 flex-col md:flex-row flex gap-6 overflow-hidden min-h-0">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            {status === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <MousePointerClick size={32} className="mb-4 text-slate-200" /><h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2">Режим Режиссёра</h3>
                    <p className="text-xs max-w-xs leading-relaxed">ИИ предложит варианты или задаст вопросы, <br/> а вы выберете лучший путь.</p>
                </div>
            )}

            {(status === 'loading') && (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 p-8">
                    <Loader2 size={32} className="animate-spin mb-4" /><h3 className="text-xs font-bold uppercase tracking-widest">Генерация...</h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">{getUnitName(unitSequence[currentUnitIndex])}</p>
                </div>
            )}

            {status === 'selecting' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Блок {currentUnitIndex + 1}/{unitSequence.length}: {getUnitName(unitSequence[currentUnitIndex])}</span></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {currentOptions.map((opt, idx) => (
                            <div key={idx} onClick={() => handleSelectOption(opt.text)} className={`p-4 rounded-xl cursor-pointer transition-all border ${opt.isBest ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/10' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                <div className="flex gap-3"><span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span><p className="text-sm text-slate-800 leading-relaxed font-medium">{opt.text}</p></div>
                                {opt.isBest && <div className="mt-2 pl-8 flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase tracking-wider"><Star size={10} fill="currentColor"/> AI Рекомендует</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'answering' && (
                <div className="flex-1 flex flex-col h-full animate-in fade-in">
                    <div className="p-3 bg-amber-50 border-b border-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14}/> Блок {currentUnitIndex + 1}: Диалог с ИИ
                    </div>
                    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50/30">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                            <div className="absolute -top-3 left-6 px-2 bg-indigo-600 text-white text-[8px] font-black uppercase rounded">Вопрос от ИИ</div>
                            <p className="text-base text-slate-900 font-bold leading-relaxed">{activeQuestion}</p>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <textarea 
                                className="flex-1 w-full p-5 bg-white border border-slate-200 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm leading-relaxed text-slate-800 resize-none"
                                placeholder="Ваши мысли по этому поводу..."
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                            />
                            <button 
                                onClick={handleAnswerSubmit}
                                disabled={!userAnswer.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                <Send size={16}/> Ответить ИИ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {status === 'finished' && (
                <div className="flex-1 flex flex-col items-center justify-center text-green-600 p-8 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} /></div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest mb-4">Готово!</h3>
                    <button onClick={handleReset} className="text-slate-400 py-2 text-[10px] font-bold uppercase hover:text-indigo-600 transition-colors">Создать новый</button>
                </div>
            )}
            
            {status !== 'idle' && (
                <div className="h-1 bg-slate-100 w-full mt-auto">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${status === 'finished' ? 100 : progressPercent}%` }} />
                </div>
            )}
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><FileText size={14} /> Результат сборки</div>
             </div>
             <div className="flex-1 overflow-y-auto p-5 md:p-8 font-serif leading-relaxed text-slate-800">
                 {Object.keys(assembledUnits).length === 0 ? (
                     <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Текст появится здесь...</div>
                 ) : (
                     <div className="space-y-6">
                         {unitSequence.map((key) => {
                             if (!assembledUnits[key]) return null;
                             const stepConfig = archetypeConfigs.find(a => a.name === archetype || a.id === archetype)?.structure.find(s => s.id === key);
                             return (
                                 <div key={key} className="animate-in fade-in slide-in-from-bottom-2 group">
                                     <div className="text-[8px] font-sans font-bold text-slate-300 uppercase tracking-widest mb-1">{getUnitName(key)}</div>
                                     {stepConfig?.type === 'question' ? (
                                         <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-amber-400 italic text-slate-500 text-xs">Контекст (ответ автора): {assembledUnits[key]}</div>
                                     ) : (
                                         <p className="text-sm whitespace-pre-wrap">{assembledUnits[key]}</p>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};
