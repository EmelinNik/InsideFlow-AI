
import React, { useState, useEffect } from 'react';
import { AuthorProfile, ContentPlanItem, PostArchetype, TargetPlatform, ContentGoal, MediaSuggestion, PlanStatus, LanguageProfile, GeneratedScript, PLATFORM_COMPATIBILITY, ContentMetrics } from '../types';
import { generateMediaSuggestion, translateToEnglish } from '../services/geminiService';
import { X, Save, Trash2, Wand2, Image, Camera, Video, Loader2, Copy, ChevronLeft, FileText, CheckCircle2, Edit2, BarChart3, TrendingUp, MessageSquare, Share2, Eye, Languages, RefreshCcw, Sparkles, PenTool, ArrowDownCircle, ScanText, Palette } from 'lucide-react';
import { ContentGenerator } from './ContentGenerator';
import ReactMarkdown from 'react-markdown';

interface PlanItemModalProps {
  item: ContentPlanItem | null;
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ContentPlanItem) => void;
  onDelete: (id: string) => void;
  onScriptGenerated: (script: GeneratedScript) => void;
}

type ModalTab = 'main' | 'visuals';
type ModalView = 'details' | 'generator';

export const PlanItemModal: React.FC<PlanItemModalProps> = ({
  item,
  authorProfile,
  languageProfile,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onScriptGenerated
}) => {
  const [editedItem, setEditedItem] = useState<ContentPlanItem | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [view, setView] = useState<ModalView>('details');
  
  // Content Edit State
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Visuals State
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSimulatingImage, setIsSimulatingImage] = useState(false);
  const [tempVisualDesc, setTempVisualDesc] = useState('');
  const [tempPrompt, setTempPrompt] = useState('');

  useEffect(() => {
    if (item) {
        setEditedItem({ ...item });
        setView('details');
        setActiveTab('main');
        setIsEditingContent(false);
        setTempVisualDesc(item.mediaSuggestion?.description || '');
        setTempPrompt(item.mediaSuggestion?.aiPrompt || '');
    }
  }, [item]);

  if (!isOpen || !editedItem) return null;

  const handleChange = (field: keyof ContentPlanItem, value: any) => {
    setEditedItem(prev => {
        if (!prev) return null;
        let updated = { ...prev, [field]: value };
        if (field === 'platform') {
            const allowedArchetypes = PLATFORM_COMPATIBILITY[value as TargetPlatform];
            if (!allowedArchetypes.includes(updated.archetype)) {
                updated.archetype = allowedArchetypes[0];
            }
        }
        return updated;
    });
  };

  const handleMetricChange = (field: keyof ContentMetrics, value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setEditedItem(prev => {
          if (!prev) return null;
          return {
              ...prev,
              metrics: {
                  reach: prev.metrics?.reach || 0,
                  likes: prev.metrics?.likes || 0,
                  reposts: prev.metrics?.reposts || 0,
                  comments: prev.metrics?.comments || 0,
                  [field]: numValue
              }
          };
      });
  };

  const handleDelete = () => {
      if (confirm("Вы уверены, что хотите удалить этот пост?")) {
          onDelete(editedItem.id);
      }
  };

  // --- CONTENT ACTIONS ---

  const handleStartContentEdit = () => {
      setTempContent(editedItem.generatedContent || '');
      setIsEditingContent(true);
  };

  const handleWriteManually = () => {
      setTempContent('');
      setIsEditingContent(true);
  };

  const handleSaveContentEdit = () => {
      const updated = { 
          ...editedItem, 
          generatedContent: tempContent,
          // If content is added manually, we can consider it 'done' enough for draft
          status: editedItem.status === PlanStatus.IDEA ? PlanStatus.DRAFT : editedItem.status
      };
      setEditedItem(updated);
      onSave(updated);
      setIsEditingContent(false);
  };

  const handleDeleteContent = () => {
      if (confirm("Удалить сгенерированный текст? Сам пост в календаре останется.")) {
          const updated = { ...editedItem, generatedContent: undefined, scriptId: undefined, status: PlanStatus.DRAFT };
          setEditedItem(updated);
          onSave(updated);
          setIsEditingContent(false);
      }
  };

  const handleCopyContent = () => {
    if (editedItem.generatedContent) {
        navigator.clipboard.writeText(editedItem.generatedContent);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleScriptCreated = (script: GeneratedScript) => {
      onScriptGenerated(script);
      const updatedItem = {
          ...editedItem,
          status: PlanStatus.DONE,
          scriptId: script.id,
          generatedContent: script.content
      };
      setEditedItem(updatedItem);
      onSave(updatedItem);
      setView('details');
  };

  const handleWriteWithAI = () => {
      if (!languageProfile.isAnalyzed) {
          alert("Сначала обучите стиль во вкладке 'Стиль', чтобы ИИ мог писать вашим голосом.");
          return;
      }
      onSave(editedItem);
      setView('generator');
  };

  // --- VISUAL ACTIONS ---

  const handleGenerateMedia = async () => {
    setIsGeneratingMedia(true);
    try {
      const media = await generateMediaSuggestion(editedItem, authorProfile, languageProfile);
      setTempVisualDesc(media.description);
      // We fill prompt too if AI suggests one, but primarily this updates the description for analytics
      if (media.aiPrompt) setTempPrompt(media.aiPrompt);
      
      const updated = { ...editedItem, mediaSuggestion: media };
      setEditedItem(updated);
      onSave(updated);
    } catch (e) {
      alert("Ошибка генерации медиа");
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleTranslatePrompt = async () => {
      if (!tempVisualDesc) return;
      setIsTranslating(true);
      try {
          const engPrompt = await translateToEnglish(tempVisualDesc);
          setTempPrompt(engPrompt);
          
          // Auto-save the prompt to item state but not necessarily strictly "saved" to DB until user actions
          // But good UX to save progress
          const updated = { 
              ...editedItem, 
              mediaSuggestion: { 
                  ...editedItem.mediaSuggestion!, 
                  description: tempVisualDesc,
                  aiPrompt: engPrompt 
              } 
          };
          setEditedItem(updated);
          onSave(updated);
      } catch (e) {
          alert("Ошибка перевода");
      } finally {
          setIsTranslating(false);
      }
  };

  const handleSimulateImageGeneration = () => {
      if (!tempPrompt) {
          alert("Сначала создайте или переведите промпт.");
          return;
      }
      setIsSimulatingImage(true);
      setTimeout(() => {
          const mockUrl = "https://placehold.co/600x600/png?text=AI+Generated+Image";
          const updated = {
              ...editedItem,
              mediaSuggestion: {
                  ...editedItem.mediaSuggestion!,
                  imageUrl: mockUrl,
                  description: tempVisualDesc,
                  aiPrompt: tempPrompt
              }
          };
          setEditedItem(updated);
          onSave(updated);
          setIsSimulatingImage(false);
      }, 2000);
  };

  const handleSaveDescriptionOnly = () => {
      const updated = {
          ...editedItem,
          mediaSuggestion: {
              ...editedItem.mediaSuggestion!,
              description: tempVisualDesc,
              type: editedItem.mediaSuggestion?.type || 'ai_image'
          }
      };
      setEditedItem(updated);
      onSave(updated);
      alert("Описание сохранено для аналитики.");
  };

  const modalWidthClass = view === 'generator' ? 'max-w-7xl' : 'max-w-3xl';
  const allowedArchetypes = PLATFORM_COMPATIBILITY[editedItem.platform] || [];
  
  // ER Calculation
  const metrics = editedItem.metrics || { reach: 0, likes: 0, comments: 0, reposts: 0 };
  const erValue = metrics.reach > 0 
    ? (((metrics.likes + metrics.comments + metrics.reposts) / metrics.reach) * 100).toFixed(2) 
    : "0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      
      <div className={`bg-white w-full ${modalWidthClass} max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden transition-all ease-in-out`}>
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            {view === 'generator' && (
                <button onClick={() => setView('details')} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500">
                    <ChevronLeft size={20} />
                </button>
            )}
            <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {view === 'generator' ? 'Написание поста' : editedItem.topic}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {new Date(editedItem.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {editedItem.platform}
                    </span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TABS (Only visible in 'details' view) */}
        {view === 'details' && (
            <div className="flex border-b border-slate-100 bg-white px-6">
                <button 
                    onClick={() => setActiveTab('main')}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'main' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <FileText size={16}/> Текст и Настройки
                </button>
                <button 
                    onClick={() => setActiveTab('visuals')}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'visuals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <Image size={16}/> Визуал
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {view === 'details' ? (
              <div className="p-6">
                 {/* --- TAB: MAIN (TEXT + SETTINGS) --- */}
                 {activeTab === 'main' && (
                     <div className="space-y-6">
                        {/* Settings Grid (Topic, Status, Format, Context) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Тема</label>
                                <input className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={editedItem.topic} onChange={(e) => handleChange('topic', e.target.value)}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Статус</label>
                                <select className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm" value={editedItem.status} onChange={(e) => handleChange('status', e.target.value)}>
                                    <option value={PlanStatus.IDEA}>💡 Идея</option>
                                    <option value={PlanStatus.DRAFT}>📝 Черновик</option>
                                    <option value={PlanStatus.DONE}>✅ Опубликовано</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Формат</label>
                                <select className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm" value={editedItem.archetype} onChange={(e) => handleChange('archetype', e.target.value)}>
                                    {allowedArchetypes.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Доп. контекст (для AI)</label>
                                 <input className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Факты, цифры..." value={editedItem.description || ''} onChange={(e) => handleChange('description', e.target.value)}/>
                            </div>
                        </div>

                        {/* Text Editor Area */}
                        <div className={`rounded-xl border shadow-sm transition-all overflow-hidden ${isEditingContent ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-50' : 'bg-white border-slate-200'}`}>
                            <div className={`p-4 border-b flex justify-between items-center ${isEditingContent ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-600"/> 
                                    Пост
                                </h3>
                                <div className="flex gap-2">
                                    {!editedItem.generatedContent && !isEditingContent && (
                                        <>
                                            <button onClick={handleWriteManually} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                                <PenTool size={12}/> Написать самому
                                            </button>
                                            <button onClick={handleWriteWithAI} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                                                <Wand2 size={12}/> Создать с AI
                                            </button>
                                        </>
                                    )}
                                    {editedItem.generatedContent && !isEditingContent && (
                                        <>
                                            <button onClick={handleStartContentEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={handleCopyContent} className={`text-xs flex items-center gap-1 font-medium transition-colors p-1.5 rounded ${copyFeedback ? 'text-green-600 bg-green-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}`}>{copyFeedback ? <CheckCircle2 size={14} /> : <Copy size={14} />}</button>
                                            <button onClick={handleDeleteContent} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isEditingContent ? (
                                <div className="p-4 space-y-3">
                                    <textarea 
                                        className="w-full h-80 p-4 border border-amber-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-slate-300" 
                                        placeholder="Напишите текст вашего поста здесь..."
                                        value={tempContent} 
                                        onChange={(e) => setTempContent(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsEditingContent(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Отмена</button>
                                        <button onClick={handleSaveContentEdit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"><Save size={14} /> Сохранить</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 min-h-[150px]">
                                    {editedItem.generatedContent ? (
                                        <div className="prose prose-sm prose-slate max-w-none text-slate-800">
                                            <ReactMarkdown>{editedItem.generatedContent}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 text-slate-400 italic text-sm">
                                            <FileText size={32} className="mb-2 opacity-20"/>
                                            Пост пуст. Выберите способ создания выше.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Metrics (Visible only when DONE) */}
                        {editedItem.status === PlanStatus.DONE && (
                            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={18} className="text-indigo-600"/>
                                        <h4 className="text-sm font-bold text-indigo-900 uppercase">Метрики поста</h4>
                                    </div>
                                    <div className="px-2 py-1 bg-white rounded border border-indigo-200 text-xs font-bold text-indigo-600">
                                        ER: {erValue}%
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider flex items-center gap-1"><Eye size={12}/> Охват</label>
                                        <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={editedItem.metrics?.reach || ''} placeholder="0" onChange={(e) => handleMetricChange('reach', e.target.value)}/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12}/> Лайки</label>
                                        <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={editedItem.metrics?.likes || ''} placeholder="0" onChange={(e) => handleMetricChange('likes', e.target.value)}/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider flex items-center gap-1"><Share2 size={12}/> Репосты</label>
                                        <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={editedItem.metrics?.reposts || ''} placeholder="0" onChange={(e) => handleMetricChange('reposts', e.target.value)}/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12}/> Комм.</label>
                                        <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={editedItem.metrics?.comments || ''} placeholder="0" onChange={(e) => handleMetricChange('comments', e.target.value)}/>
                                    </div>
                                 </div>
                                 <p className="text-[10px] text-indigo-400 italic text-center">
                                     Вносите данные спустя 24-48 часов после публикации для точности аналитики.
                                 </p>
                            </div>
                        )}
                     </div>
                 )}

                 {/* --- TAB: VISUALS --- */}
                 {activeTab === 'visuals' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                         
                         {/* LEFT: SETTINGS (Separated logic) */}
                         <div className="space-y-6">
                             
                             {/* SECTION 1: VISUAL DESCRIPTION (ANALYTICS) */}
                             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group">
                                 <div className="flex items-center justify-between mb-1">
                                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                         <ScanText size={16} className="text-indigo-600"/> Описание визуала
                                     </label>
                                     {editedItem.generatedContent && (
                                         <button 
                                            onClick={handleGenerateMedia} 
                                            disabled={isGeneratingMedia}
                                            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                                            title="AI проанализирует текст поста и составит описание"
                                         >
                                             {isGeneratingMedia ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Авто-описание из поста
                                         </button>
                                     )}
                                 </div>
                                 
                                 <p className="text-[10px] text-slate-400 leading-relaxed">
                                     Опишите, что изображено на картинке. Это используется для AI-аналитики эффективности (например: "посты с котами набирают больше лайков").
                                 </p>

                                 <textarea 
                                     className="w-full h-28 p-3 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                     placeholder={isGeneratingMedia ? "Анализирую текст..." : "Например: Яркое фото девушки с ноутбуком в кофейне..."}
                                     value={tempVisualDesc}
                                     onChange={(e) => setTempVisualDesc(e.target.value)}
                                 />
                                 
                                 <div className="flex justify-end">
                                     <button 
                                        onClick={handleSaveDescriptionOnly}
                                        className="text-xs font-bold bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                                     >
                                         <Save size={14}/> Сохранить для статистики
                                     </button>
                                 </div>
                             </div>

                             {/* SECTION 2: GENERATION (PROMPT) */}
                             <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                                 <div className="flex items-center gap-2 mb-4">
                                     <Palette size={16} className="text-indigo-600"/>
                                     <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">AI Генератор</h4>
                                 </div>

                                 <div className="flex items-center gap-2 mb-3">
                                     <div className="h-px bg-slate-200 flex-1"></div>
                                     <button 
                                        onClick={handleTranslatePrompt}
                                        disabled={isTranslating || !tempVisualDesc}
                                        className="text-[10px] font-bold text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                                        title="Перевести описание выше в английский промпт"
                                     >
                                         {isTranslating ? <Loader2 size={12} className="animate-spin"/> : <ArrowDownCircle size={12}/>} 
                                         Создать промпт из описания
                                     </button>
                                     <div className="h-px bg-slate-200 flex-1"></div>
                                 </div>

                                 <div className="relative mb-3">
                                     <textarea 
                                         className="w-full h-28 p-3 border border-slate-300 rounded-lg text-indigo-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono resize-none shadow-sm"
                                         placeholder="Prompt for Midjourney / DALL-E..."
                                         value={tempPrompt}
                                         onChange={(e) => setTempPrompt(e.target.value)}
                                     />
                                     <button 
                                        onClick={() => navigator.clipboard.writeText(tempPrompt)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-indigo-600 bg-white/50 p-1 rounded"
                                        title="Копировать"
                                     >
                                         <Copy size={14}/>
                                     </button>
                                 </div>

                                 <button 
                                    onClick={handleSimulateImageGeneration}
                                    disabled={isSimulatingImage || !tempPrompt}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                 >
                                     {isSimulatingImage ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                     {editedItem.mediaSuggestion?.imageUrl ? 'Пересоздать изображение' : 'Сгенерировать изображение'}
                                 </button>
                             </div>
                         </div>

                         {/* RIGHT: PREVIEW */}
                         <div className="bg-slate-100 rounded-xl border border-slate-200 flex flex-col overflow-hidden relative group h-full max-h-[600px]">
                             {editedItem.mediaSuggestion?.imageUrl ? (
                                 <div className="relative h-full w-full bg-black flex items-center justify-center">
                                     <img 
                                        src={editedItem.mediaSuggestion.imageUrl} 
                                        alt="Generated Preview" 
                                        className="max-w-full max-h-full object-contain"
                                     />
                                     <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={handleSimulateImageGeneration} className="p-2 text-white hover:bg-white/20 rounded-lg"><RefreshCcw size={20}/></button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                     <Image size={48} className="mb-4 opacity-20"/>
                                     <p className="text-sm font-medium">Изображение не сгенерировано</p>
                                     <p className="text-xs max-w-xs mt-2">
                                         Сформируйте промпт в блоке "AI Генератор" и нажмите кнопку генерации.
                                     </p>
                                 </div>
                             )}
                         </div>

                     </div>
                 )}
              </div>
          ) : (
            <ContentGenerator 
                authorProfile={authorProfile} 
                languageProfile={languageProfile} 
                onScriptGenerated={handleScriptCreated} 
                initialConfig={{ 
                    topic: editedItem.topic, 
                    platform: editedItem.platform, 
                    archetype: editedItem.archetype, 
                    description: editedItem.description 
                }} 
                className="h-full p-6 flex flex-col gap-6" 
            />
          )}
        </div>

        {view === 'details' && activeTab === 'main' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"><Trash2 size={16}/> Удалить</button>
                <div className="flex gap-3">
                    <button onClick={() => { onSave(editedItem); onClose(); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm">Сохранить</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
