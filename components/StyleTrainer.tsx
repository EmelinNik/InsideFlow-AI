import React, { useState } from 'react';
import { analyzeWritingStyle, analyzeVisualIdentity, transformIdentityToVisual } from '../services/geminiService';
import { LanguageProfile } from '../types';
import { Sparkles, Loader2, Quote, AlertCircle, RefreshCw, Plus, Trash2, FileText, Image, Palette, Layout, Wand2, ArrowDown } from 'lucide-react';

interface StyleTrainerProps {
  currentProfile: LanguageProfile | null;
  samples: string[];
  onUpdateSamples: (samples: string[]) => void;
  onUpdateProfile: (profile: LanguageProfile) => void;
}

export const StyleTrainer: React.FC<StyleTrainerProps> = ({ 
  currentProfile, 
  samples, 
  onUpdateSamples, 
  onUpdateProfile 
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text');
  
  // Text Training State
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visual Training State
  const [visualDescription, setVisualDescription] = useState('');
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  
  // Visual Helper State
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [rawIdentityInput, setRawIdentityInput] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);

  // --- TEXT HANDLERS ---
  const handleAddSample = () => {
    if (!currentInput.trim()) return;
    onUpdateSamples([...samples, currentInput.trim()]);
    setCurrentInput('');
    setError(null);
  };

  const handleDeleteSample = (index: number) => {
    const newSamples = [...samples];
    newSamples.splice(index, 1);
    onUpdateSamples(newSamples);
  };

  const handleAnalyzeText = async () => {
    const fullText = samples.join('\n\n---\n\n');
    if (fullText.length < 50) {
      setError("Добавьте больше примеров. Для качественного анализа нужно минимум 50 символов текста.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const profileToUpdate = currentProfile?.isAnalyzed ? currentProfile : undefined;
      const updatedProfile = await analyzeWritingStyle(fullText, profileToUpdate);
      onUpdateProfile(updatedProfile);
    } catch (err) {
      setError("Не удалось проанализировать стиль. Пожалуйста, проверьте API ключ.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- VISUAL HANDLERS ---
  
  const handleTransformIdentity = async () => {
      if (!rawIdentityInput.trim()) return;
      setIsTransforming(true);
      try {
          const structuredDescription = await transformIdentityToVisual(rawIdentityInput);
          setVisualDescription(structuredDescription);
          setIsHelperOpen(false); // Close helper as job is done
      } catch (e) {
          alert("Ошибка AI помощника. Попробуйте еще раз.");
      } finally {
          setIsTransforming(false);
      }
  };

  const handleAnalyzeVisual = async () => {
    if (!visualDescription.trim()) return;
    
    setIsVisualLoading(true);
    try {
        const visualStyle = await analyzeVisualIdentity(visualDescription);
        if (currentProfile) {
            onUpdateProfile({
                ...currentProfile,
                visualStyle: visualStyle
            });
        }
    } catch (e) {
        alert("Ошибка анализа визуала.");
    } finally {
        setIsVisualLoading(false);
    }
  };

  const isTextUpdating = currentProfile?.isAnalyzed;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Айдентика и Стиль</h2>
            <p className="text-slate-600 mt-1 max-w-2xl">
            Научите AI вашему уникальному голосу и визуальному стилю.
            </p>
        </div>
        
        {/* TABS */}
        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button 
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'text' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={16}/> Текстовый стиль
            </button>
            <button 
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'visual' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Image size={16}/> Визуальная айдентика
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* LEFT COLUMN: Input */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           
           {activeTab === 'text' ? (
               <>
                    {/* Add New Sample Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Plus size={16} className="text-indigo-600"/>
                            Добавить пример текста
                        </label>
                        <textarea
                            className="w-full h-32 p-4 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans text-sm shadow-inner"
                            placeholder="Вставьте текст вашего лучшего поста или сценария здесь..."
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                        />
                        <button
                            onClick={handleAddSample}
                            disabled={!currentInput.trim()}
                            className="mt-3 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Добавить в коллекцию
                        </button>
                    </div>

                    {/* List of Samples */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Ваша коллекция ({samples.length})
                            </h3>
                            {samples.length > 0 && (
                            <span className="text-xs text-slate-400">Готовы к анализу</span>
                            )}
                        </div>

                        {samples.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 bg-slate-50/50">
                                <FileText size={32} className="mx-auto mb-2 opacity-50"/>
                                <p>Здесь появятся ваши примеры</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                            {samples.map((sample, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors relative">
                                    <p className="text-slate-600 text-sm line-clamp-3 pr-8">{sample}</p>
                                    <button 
                                        onClick={() => handleDeleteSample(idx)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Удалить пример"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="text-[10px] text-slate-400 mt-2 font-mono">Пример #{idx + 1} • {sample.length} симв.</div>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyzeText}
                        disabled={isLoading || samples.length === 0}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> 
                            {isTextUpdating ? 'Обновляем профиль...' : 'Анализируем стиль...'}
                        </>
                        ) : (
                        <>
                            {isTextUpdating ? <RefreshCw size={20} /> : <Sparkles size={20} />} 
                            {isTextUpdating ? 'Обновить текстовый профиль' : 'Создать текстовый профиль'}
                        </>
                        )}
                    </button>
               </>
           ) : (
               <div className="flex flex-col h-full animate-in fade-in">
                    
                    {/* AI HELPER BLOCK */}
                    <div className="mb-6">
                        <button 
                            onClick={() => setIsHelperOpen(!isHelperOpen)}
                            className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors w-full"
                        >
                            <Wand2 size={16} />
                            AI Помощник: Описать айдентику за меня
                            <ArrowDown size={14} className={`transition-transform duration-200 ${isHelperOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {isHelperOpen && (
                            <div className="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 animate-in slide-in-from-top-2">
                                <p className="text-xs text-slate-600 mb-3">
                                    Напишите своими словами кто вы, про что ваш бренд и какое ощущение хотите создавать. <br/>
                                    AI-арт-директор структурирует это и составит идеальный промпт.
                                </p>
                                <textarea
                                    className="w-full p-3 border border-indigo-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none h-24 bg-white text-slate-900"
                                    placeholder="Например: Я эксперт по ИИ, хочу выглядеть спокойно и уверенно, без хайпа. Мне важно доверие и ясность."
                                    value={rawIdentityInput}
                                    onChange={(e) => setRawIdentityInput(e.target.value)}
                                />
                                <button
                                    onClick={handleTransformIdentity}
                                    disabled={isTransforming || !rawIdentityInput.trim()}
                                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isTransforming ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                    Преобразовать в профессиональный гайд
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100 shadow-sm flex-1 flex flex-col">
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Palette size={16} className="text-indigo-600"/>
                            Ваш Визуальный Код
                        </label>
                        <p className="text-xs text-slate-500 mb-4">
                            Это описание используется для генерации ТЗ фотографам и картинок в нейросетях.
                            Вы можете редактировать его вручную или использовать кнопку "AI Помощник" выше.
                        </p>
                        <textarea
                            className="w-full flex-1 p-5 border border-indigo-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm shadow-inner min-h-[200px]"
                            placeholder="Опишите эстетику, цвета, освещение..."
                            value={visualDescription}
                            onChange={(e) => setVisualDescription(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleAnalyzeVisual}
                        disabled={isVisualLoading || !visualDescription.trim()}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 mt-6"
                    >
                        {isVisualLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> 
                            Сохраняем визуальный профиль...
                        </>
                        ) : (
                        <>
                            <SaveIcon size={20} /> 
                            Сохранить визуальный профиль
                        </>
                        )}
                    </button>
               </div>
           )}

        </div>

        {/* RIGHT COLUMN: Results Profile */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col sticky top-6">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Quote size={20} className="text-indigo-600" />
              {activeTab === 'text' ? 'Языковой Профиль' : 'Визуальный Гайд'}
            </h3>
            
            {activeTab === 'text' ? (
                /* TEXT PROFILE VIEW */
                !currentProfile?.isAnalyzed ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Sparkles size={24} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-600">Профиль не создан</p>
                        <p className="text-sm mt-2">Добавьте примеры текстов слева и нажмите кнопку анализа.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-500 overflow-y-auto">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Общий Вайб</h4>
                        <p className="text-slate-800 text-sm leading-relaxed">{currentProfile.styleDescription}</p>
                        </div>
                        
                        <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Лексика и Триггеры</h4>
                        <div className="flex flex-wrap gap-2">
                            {currentProfile.keywords.map((kw, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                                {kw}
                            </span>
                            ))}
                        </div>
                        </div>

                        <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Структура предложений</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{currentProfile.sentenceStructure}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Эмоциональный резонанс</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{currentProfile.emotionalResonance}</p>
                        </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-center">
                        <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 size={12}/> Профиль активен
                        </span>
                        </div>
                    </div>
                )
            ) : (
                /* VISUAL PROFILE VIEW */
                !currentProfile?.visualStyle?.isDefined ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Image size={24} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-600">Айдентика не задана</p>
                        <p className="text-sm mt-2">Опишите свой стиль слева и нажмите "Сохранить".</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-500 overflow-y-auto">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">Эстетика (Aesthetic)</h4>
                            <p className="text-slate-800 text-sm leading-relaxed">{currentProfile.visualStyle.aesthetic}</p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Palette size={12}/> Цветовая палитра</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500">{currentProfile.visualStyle.colors}</p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Layout size={12}/> Композиция</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{currentProfile.visualStyle.composition}</p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Ключевые элементы</h4>
                            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                "{currentProfile.visualStyle.elements}"
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400">
                                Этот гайд будет автоматически применяться при генерации ТЗ для фото и AI-картинок.
                            </p>
                        </div>
                    </div>
                )
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon component for success state inside component to avoid import issues if not needed elsewhere
const CheckCircle2 = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const SaveIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);