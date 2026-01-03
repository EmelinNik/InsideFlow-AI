import React, { useState, useEffect, useRef } from 'react';
import { AuthorProfile, LanguageProfile, TargetPlatform, GeneratedScript, PostArchetype, GeneratedOption } from '../types';
import { generateUnitOptions, getArchetypeFormula, getUnitName } from '../services/geminiService';
import { Loader2, Send, Copy, FileText, CheckCircle2, LayoutTemplate, Smartphone, MousePointerClick, ArrowRight, Play, RefreshCw, ChevronRight, Sparkles, Star, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ContentGeneratorProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  onScriptGenerated: (script: GeneratedScript) => void;
  initialConfig?: { topic: string; platform: TargetPlatform; archetype: PostArchetype } | null;
  className?: string; // New prop for custom styling
}

type GenerationStatus = 'idle' | 'loading' | 'selecting' | 'finished';

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  authorProfile,
  languageProfile,
  onScriptGenerated,
  initialConfig,
  className
}) => {
  // --- CONFIG STATE ---
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<TargetPlatform>(TargetPlatform.TELEGRAM);
  const [archetype, setArchetype] = useState<PostArchetype>(PostArchetype.EXPERT);

  // --- GENERATION FLOW STATE ---
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [unitSequence, setUnitSequence] = useState<string[]>([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  
  // Stores the options generated for the CURRENT step
  const [currentOptions, setCurrentOptions] = useState<GeneratedOption[]>([]);
  
  // Stores the finalized content: { ATTENTION: "...", PROBLEM: "..." }
  const [assembledUnits, setAssembledUnits] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply initial config if provided
  useEffect(() => {
    if (initialConfig) {
        setTopic(initialConfig.topic);
        setPlatform(initialConfig.platform);
        setArchetype(initialConfig.archetype);
        // Reset state to ready
        setStatus('idle');
        setAssembledUnits({});
        setUnitSequence([]);
    }
  }, [initialConfig]);

  const canStart = topic.length > 0 && languageProfile.isAnalyzed;

  // Auto-scroll to bottom of preview when units are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assembledUnits]);

  // --- ACTIONS ---

  const handleStart = () => {
    const sequence = getArchetypeFormula(archetype);
    setUnitSequence(sequence);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setStatus('loading');
    
    // Trigger first unit generation
    fetchOptionsForUnit(sequence[0], {});
  };

  const fetchOptionsForUnit = async (unitKey: string, currentAssembled: Record<string, string>) => {
    try {
      // Create a plain text string of what's been written so far for context
      const contextText = Object.values(currentAssembled).join('\n\n');

      const options = await generateUnitOptions(
        topic,
        platform,
        archetype,
        authorProfile,
        languageProfile,
        unitKey,
        contextText
      );

      setCurrentOptions(options);
      setStatus('selecting');
    } catch (error) {
      alert("Ошибка генерации. Попробуйте еще раз.");
      setStatus('idle');
    }
  };

  const handleSelectOption = (optionText: string) => {
    const currentUnitKey = unitSequence[currentUnitIndex];
    
    // 1. Save selection
    const newAssembled = { ...assembledUnits, [currentUnitKey]: optionText };
    setAssembledUnits(newAssembled);

    // 2. Check if next unit exists
    const nextIndex = currentUnitIndex + 1;
    
    if (nextIndex < unitSequence.length) {
      // Move to next
      setCurrentUnitIndex(nextIndex);
      setStatus('loading');
      fetchOptionsForUnit(unitSequence[nextIndex], newAssembled);
    } else {
      // Finished!
      finishGeneration(newAssembled);
    }
  };

  const finishGeneration = (finalUnits: Record<string, string>) => {
    setStatus('finished');
    
    // Build final markdown
    let finalMarkdown = `# ${topic}\n*${platform} | ${archetype}*\n\n`;
    unitSequence.forEach(key => {
        // Pretty formatting for the final result
        if (key === 'INSIGHT') {
             finalMarkdown += `> **${finalUnits[key]}**\n\n`;
        } else {
             finalMarkdown += `${finalUnits[key]}\n\n`;
        }
    });

    const newScript: GeneratedScript = {
      id: Date.now().toString(),
      topic,
      platform,
      content: finalMarkdown,
      createdAt: new Date().toISOString()
    };
    
    onScriptGenerated(newScript);
  };

  const handleReset = () => {
    setStatus('idle');
    setUnitSequence([]);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setCurrentOptions([]);
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    // Reconstruct full text
    const text = unitSequence.map(key => assembledUnits[key]).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RENDER HELPERS ---

  const currentUnitKey = unitSequence[currentUnitIndex];
  const progressPercent = unitSequence.length > 0 
    ? Math.round((currentUnitIndex / unitSequence.length) * 100) 
    : 0;

  return (
    <div className={`flex flex-col gap-6 ${className || 'max-w-7xl mx-auto p-4 md:p-6 h-[calc(100vh-2rem)]'}`}>
      
      {/* HEADER / CONFIG (Hidden when busy to save space, or summarized) */}
      <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all ${status !== 'idle' ? 'hidden md:flex' : 'flex'} justify-between items-center`}>
         {status === 'idle' ? (
            <div className="w-full flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Тема</label>
                    <input 
                        className="w-full p-2.5 border border-slate-300 bg-white text-slate-900 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        placeholder="О чем пишем сегодня?"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Формат</label>
                    <select 
                        className="w-full p-2.5 border border-slate-300 bg-white text-slate-900 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={archetype}
                        onChange={e => setArchetype(e.target.value as PostArchetype)}
                    >
                         {Object.values(PostArchetype).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-48 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Платформа</label>
                    <select 
                        className="w-full p-2.5 border border-slate-300 bg-white text-slate-900 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={platform}
                        onChange={e => setPlatform(e.target.value as TargetPlatform)}
                    >
                         {Object.values(TargetPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleStart}
                    disabled={!canStart}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors h-[42px] flex items-center gap-2 whitespace-nowrap shadow-sm"
                >
                    <Play size={16} fill="currentColor" /> Старт
                </button>
            </div>
         ) : (
             <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-4">
                     <span className="font-bold text-slate-800">{topic}</span>
                     <div className="flex gap-2 text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded">{archetype}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded">{platform}</span>
                     </div>
                 </div>
                 <button onClick={handleReset} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-sm">
                    <RefreshCw size={14} /> Сброс
                 </button>
             </div>
         )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* LEFT PANEL: INTERACTION AREA */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            
            {status === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MousePointerClick size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Режим Режиссёра</h3>
                    <p className="max-w-sm">
                        Вы будете собирать пост блок за блоком. <br/>
                        ИИ предложит варианты для каждой части, а вы выберете лучший.
                    </p>
                    {!languageProfile.isAnalyzed && (
                         <div className="mt-6 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                            ⚠️ Сначала обучите стиль в соседней вкладке
                         </div>
                    )}
                </div>
            )}

            {status === 'loading' && (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 animate-in fade-in p-8">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <h3 className="text-xl font-bold">Генерирую варианты...</h3>
                    <p className="text-slate-500 mt-2">
                        Блок {currentUnitIndex + 1} из {unitSequence.length}: {getUnitName(currentUnitKey)}
                    </p>
                </div>
            )}

            {status === 'selecting' && (
                <div className="flex-1 flex flex-col h-full">
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Выбор блока {currentUnitIndex + 1}/{unitSequence.length}</span>
                            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                {getUnitName(currentUnitKey)}
                            </h2>
                        </div>
                        <div className="text-xs font-mono text-indigo-600 bg-white/50 px-2 py-1 rounded">
                            Ожидает выбора
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50">
                        {currentOptions.map((opt, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectOption(opt.text)}
                                className={`
                                    relative p-5 rounded-xl cursor-pointer transition-all duration-200 group overflow-hidden
                                    ${opt.isBest 
                                        ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md transform scale-[1.01] z-10' 
                                        : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:scale-[1.005]'
                                    }
                                `}
                            >
                                {/* Best Match Badge */}
                                {opt.isBest && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-bl-xl font-bold flex items-center gap-1.5 shadow-sm z-20">
                                        <Sparkles size={12} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                                        AI Рекомендует
                                    </div>
                                )}

                                <div className={`
                                    absolute top-4 left-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                    ${opt.isBest ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white'}
                                `}>
                                    {idx + 1}
                                </div>
                                
                                <div className="pl-10">
                                    <p className="text-slate-800 leading-relaxed text-sm md:text-base font-medium">{opt.text}</p>
                                    
                                    {/* Reasoning */}
                                    {opt.reasoning && (
                                        <div className={`mt-3 text-xs flex items-start gap-1.5 ${opt.isBest ? 'text-indigo-700' : 'text-slate-400'}`}>
                                            {opt.isBest ? <ThumbsUp size={12} className="mt-0.5" /> : <Star size={12} className="mt-0.5" />}
                                            <span className="italic">{opt.reasoning}</span>
                                        </div>
                                    )}
                                </div>

                                {!opt.isBest && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                                        <ArrowRight size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'finished' && (
                <div className="flex-1 flex flex-col items-center justify-center text-green-600 p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Пост готов!</h3>
                    <p className="text-slate-600 mb-6">
                        Мы собрали отличный материал из {unitSequence.length} блоков.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={handleReset} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                            Создать новый
                        </button>
                        <button onClick={handleCopy} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            {copied ? 'Скопировано!' : 'Копировать всё'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Progress Bar (Bottom of Left Panel) */}
            {status !== 'idle' && (
                <div className="h-1 bg-slate-100 w-full mt-auto">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${status === 'finished' ? 100 : progressPercent}%` }}
                    />
                </div>
            )}
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-slate-500 font-medium text-sm uppercase tracking-wide">
                 <FileText size={16} /> Черновик (Live Preview)
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 md:p-8 font-serif leading-relaxed text-lg text-slate-800">
                 {Object.keys(assembledUnits).length === 0 ? (
                     <div className="h-full flex items-center justify-center opacity-30 italic text-slate-400">
                         Здесь будет появляться текст по мере вашего выбора...
                     </div>
                 ) : (
                     <div className="space-y-6">
                         {unitSequence.map((key) => {
                             if (!assembledUnits[key]) return null;
                             return (
                                 <div key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                     <div className="text-[10px] font-sans font-bold text-slate-300 uppercase mb-1 select-none">
                                        {getUnitName(key)}
                                     </div>
                                     {key === 'INSIGHT' ? (
                                         <div className="pl-4 border-l-4 border-indigo-200 italic text-slate-700">
                                             {assembledUnits[key]}
                                         </div>
                                     ) : (
                                         <p className="whitespace-pre-wrap">{assembledUnits[key]}</p>
                                     )}
                                 </div>
                             );
                         })}
                         {/* Invisible element to scroll to */}
                         <div ref={messagesEndRef} />
                         
                         {status === 'loading' && (
                             <div className="flex gap-1 items-center text-indigo-400 text-sm animate-pulse pt-4">
                                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animation-delay-200"></span>
                                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animation-delay-400"></span>
                             </div>
                         )}
                     </div>
                 )}
             </div>
        </div>

      </div>
    </div>
  );
};