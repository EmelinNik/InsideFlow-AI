
import React, { useState, useEffect, useRef } from 'react';
import { AuthorProfile, LanguageProfile, TargetPlatform, GeneratedScript, PostArchetype, GeneratedOption, PLATFORM_COMPATIBILITY } from '../types';
import { generateUnitOptions, getArchetypeFormula, getUnitName } from '../services/geminiService';
import { Loader2, Send, Copy, FileText, CheckCircle2, LayoutTemplate, Smartphone, MousePointerClick, ArrowRight, Play, RefreshCw, ChevronRight, Sparkles, Star, ThumbsUp, AlertCircle, Edit2, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ContentGeneratorProps {
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  onScriptGenerated: (script: GeneratedScript) => void;
  initialConfig?: { topic: string; platform: TargetPlatform; archetype: PostArchetype; description?: string } | null;
  className?: string;
}

type GenerationStatus = 'idle' | 'loading' | 'selecting' | 'finished';

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  authorProfile,
  languageProfile,
  onScriptGenerated,
  initialConfig,
  className
}) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<TargetPlatform>(TargetPlatform.TELEGRAM);
  const [archetype, setArchetype] = useState<PostArchetype>(PostArchetype.SHORT_POST);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [unitSequence, setUnitSequence] = useState<string[]>([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<GeneratedOption[]>([]);
  const [assembledUnits, setAssembledUnits] = useState<Record<string, string>>({});
  
  // Editing state
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialConfig) {
        setTopic(initialConfig.topic);
        setPlatform(initialConfig.platform);
        setArchetype(initialConfig.archetype);
        setDescription(initialConfig.description || '');
        setStatus('idle');
        setAssembledUnits({});
        setUnitSequence([]);
    }
  }, [initialConfig]);

  useEffect(() => {
      const allowedArchetypes = PLATFORM_COMPATIBILITY[platform];
      // Safety check: ensure current archetype is valid for new platform
      if (!allowedArchetypes?.includes(archetype)) {
          setArchetype(allowedArchetypes?.[0] || PostArchetype.SHORT_POST);
      }
  }, [platform]);

  const canStart = topic.length > 0 && languageProfile.isAnalyzed;

  useEffect(() => {
    if (!editingUnit) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assembledUnits, editingUnit]);

  const handleStart = () => {
    const sequence = getArchetypeFormula(archetype);
    setUnitSequence(sequence);
    setCurrentUnitIndex(0);
    setAssembledUnits({});
    setStatus('loading');
    fetchOptionsForUnit(sequence[0], {});
  };

  const fetchOptionsForUnit = async (unitKey: string, currentAssembled: Record<string, string>) => {
    try {
      const contextText = Object.values(currentAssembled).join('\n\n');
      // Pass description to service
      const options = await generateUnitOptions(topic, platform, archetype, authorProfile, languageProfile, unitKey, contextText, description);
      setCurrentOptions(options);
      setStatus('selecting');
    } catch (error) {
      alert("Ошибка генерации. Попробуйте еще раз.");
      setStatus('idle');
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
      fetchOptionsForUnit(unitSequence[nextIndex], newAssembled);
    } else {
      finishGeneration(newAssembled);
    }
  };

  const finishGeneration = (finalUnits: Record<string, string>) => {
    setStatus('finished');
    let finalMarkdown = `# ${topic}\n*${platform} | ${archetype}*\n\n`;
    unitSequence.forEach(key => {
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
    const text = unitSequence.map(key => assembledUnits[key]).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Editing Handlers
  const handleStartEdit = (key: string, text: string) => {
    setEditingUnit(key);
    setEditValue(text);
  };

  const handleSaveEdit = () => {
    if (editingUnit) {
        const newAssembled = { ...assembledUnits, [editingUnit]: editValue };
        setAssembledUnits(newAssembled);
        setEditingUnit(null);
        
        // If finished, we might want to update the generated script, 
        // but since we don't have the script ID here easily, we rely on the user to copy the updated text
        // or re-save via the script list if they navigate away.
    }
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setEditValue('');
  };

  const currentUnitKey = unitSequence[currentUnitIndex];
  const progressPercent = unitSequence.length > 0 
    ? Math.round((currentUnitIndex / unitSequence.length) * 100) 
    : 0;

  const allowedArchetypes = PLATFORM_COMPATIBILITY[platform] || [];
  const recommendations = allowedArchetypes.slice(0, 2);

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
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Площадка</label>
                        <select className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs" value={platform} onChange={e => setPlatform(e.target.value as TargetPlatform)}>
                            {Object.values(TargetPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Формат</label>
                        <select className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs" value={archetype} onChange={e => setArchetype(e.target.value as PostArchetype)}>
                            {allowedArchetypes.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={handleStart} disabled={!canStart} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                    <Play size={14} fill="currentColor" /> Старт
                </button>
            </>
         ) : (
             <div className="flex items-center justify-between w-full">
                 <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                     <span className="font-bold text-sm text-slate-900 truncate max-w-[200px]">{topic}</span>
                     <div className="flex gap-2">
                        <span className="bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">{archetype}</span>
                        <span className="bg-slate-100 text-slate-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">{platform.split(' ')[0]}</span>
                     </div>
                 </div>
                 <button onClick={handleReset} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase">
                    <RefreshCw size={12} /> Сброс
                 </button>
             </div>
         )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-full md:w-1/2 flex flex-col h-[500px] md:h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            {status === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <MousePointerClick size={32} className="mb-4 text-slate-200" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2">Режим Режиссёра</h3>
                    <p className="text-xs max-w-xs leading-relaxed">
                        ИИ предложит варианты для каждой части поста, <br className="hidden md:block"/> а вы выберете лучший.
                    </p>
                    {description && (
                        <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-left w-full max-w-sm border border-slate-100">
                             <span className="font-bold block mb-1">Доп. контекст:</span>
                             {description}
                        </div>
                    )}
                    {!languageProfile.isAnalyzed && (
                         <div className="mt-6 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-[10px] font-bold uppercase border border-amber-100">
                            ⚠️ Обучите стиль
                         </div>
                    )}
                </div>
            )}

            {status === 'loading' && (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 p-8">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Генерация...</h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        {getUnitName(currentUnitKey)}
                    </p>
                </div>
            )}

            {status === 'selecting' && (
                <div className="flex-1 flex flex-col h-full">
                    <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                            Блок {currentUnitIndex + 1}/{unitSequence.length}: {getUnitName(currentUnitKey)}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {currentOptions.map((opt, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectOption(opt.text)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${opt.isBest ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/10' : 'bg-white border-slate-200'}`}
                            >
                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{opt.text}</p>
                                </div>
                                {opt.isBest && (
                                    <div className="mt-2 pl-8 flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                                        <Star size={10} fill="currentColor"/> AI Рекомендует
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'finished' && (
                <div className="flex-1 flex flex-col items-center justify-center text-green-600 p-8 text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest mb-4">Готово!</h3>
                    <div className="flex flex-col gap-2 w-full">
                        <button onClick={handleCopy} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">
                            {copied ? 'Скопировано!' : 'Копировать всё'}
                        </button>
                        <button onClick={handleReset} className="w-full text-slate-400 py-2 text-[10px] font-bold uppercase">
                            Создать новый
                        </button>
                    </div>
                </div>
            )}
            
            {status !== 'idle' && (
                <div className="h-1 bg-slate-100 w-full mt-auto">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${status === 'finished' ? 100 : progressPercent}%` }} />
                </div>
            )}
        </div>

        {/* RIGHT PANEL: PREVIEW & EDIT */}
        <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] md:h-full overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <FileText size={14} /> Черновик
                 </div>
                 {editingUnit && (
                     <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
                         Редактирование...
                     </span>
                 )}
             </div>
             <div className="flex-1 overflow-y-auto p-5 md:p-8 font-serif leading-relaxed text-slate-800">
                 {Object.keys(assembledUnits).length === 0 ? (
                     <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         Здесь появится текст...
                     </div>
                 ) : (
                     <div className="space-y-6">
                         {unitSequence.map((key) => {
                             if (!assembledUnits[key]) return null;
                             const isEditing = editingUnit === key;

                             return (
                                 <div key={key} className="animate-in fade-in slide-in-from-bottom-2 group">
                                     <div className="flex items-center justify-between mb-1">
                                        <div className="text-[8px] font-sans font-bold text-slate-300 uppercase tracking-widest">
                                            {getUnitName(key)}
                                        </div>
                                        {!isEditing && (
                                            <button 
                                                onClick={() => handleStartEdit(key, assembledUnits[key])}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 p-1"
                                                title="Редактировать блок"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        )}
                                     </div>
                                     
                                     {isEditing ? (
                                        <div className="space-y-2 bg-slate-50 p-2 rounded-lg -mx-2">
                                            <textarea
                                                className="w-full p-3 border border-indigo-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[120px] shadow-sm font-sans"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleCancelEdit} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Отмена">
                                                    <X size={14}/>
                                                </button>
                                                <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm" title="Сохранить">
                                                    <Check size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                     ) : (
                                         key === 'INSIGHT' ? (
                                             <div 
                                                className="pl-4 border-l-2 border-indigo-400 italic text-slate-700 bg-indigo-50/20 py-1 cursor-pointer hover:bg-indigo-50/40 transition-colors rounded-r"
                                                onClick={() => handleStartEdit(key, assembledUnits[key])}
                                                title="Нажмите, чтобы изменить"
                                             >
                                                 {assembledUnits[key]}
                                             </div>
                                         ) : (
                                             <p 
                                                className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-slate-50 rounded p-1 -m-1 transition-colors"
                                                onClick={() => handleStartEdit(key, assembledUnits[key])}
                                                title="Нажмите, чтобы изменить"
                                             >
                                                 {assembledUnits[key]}
                                             </p>
                                         )
                                     )}
                                 </div>
                             );
                         })}
                         <div ref={messagesEndRef} />
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};
