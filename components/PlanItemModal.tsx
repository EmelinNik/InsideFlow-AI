
import React, { useState, useEffect } from 'react';
import { AuthorProfile, ContentPlanItem, ContentGoal, PlanStatus, LanguageProfile, GeneratedScript, PlatformConfig, ArchetypeConfig, ContentMetrics } from '../types';
import { generateMediaSuggestion, translateToEnglish } from '../services/geminiService';
import { X, Save, Trash2, Wand2, Image, Loader2, Copy, ChevronLeft, FileText, CheckCircle2, Edit2, BarChart3, Share2, Languages, RefreshCcw, Sparkles, PenTool, Palette, Calendar as CalendarIcon, Clock, Type as TypeIcon, AlignLeft, Archive, CheckCircle, Keyboard, ShoppingBag } from 'lucide-react';
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
  platformConfigs?: PlatformConfig[];
  archetypeConfigs?: ArchetypeConfig[];
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
  onScriptGenerated,
  platformConfigs = [],
  archetypeConfigs = []
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
  }, [item?.id]);

  if (!isOpen || !editedItem) return null;

  const handleChange = (field: keyof ContentPlanItem, value: any) => {
    setEditedItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleMetricChange = (field: keyof ContentMetrics, value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setEditedItem(prev => prev ? {
          ...prev,
          metrics: { ...prev.metrics!, [field]: numValue }
      } : null);
  };

  const handleDelete = () => {
      if (confirm("Вы уверены, что хотите удалить этот пост?")) onDelete(editedItem.id);
  };

  const handleArchive = () => {
      if (!editedItem.generatedContent && !isEditingContent) {
          if (!confirm("В посте нет текста. Вы уверены, что хотите отправить пустой пост в архив?")) return;
      }
      const updated = { ...editedItem, status: PlanStatus.DONE };
      setEditedItem(updated);
      onSave(updated);
  };

  const handleStartContentEdit = () => {
      setTempContent(editedItem.generatedContent || '');
      setIsEditingContent(true);
  };

  const handleSaveContentEdit = () => {
      const updated = { 
          ...editedItem, 
          generatedContent: tempContent, 
          status: editedItem.status === PlanStatus.IDEA ? PlanStatus.DRAFT : editedItem.status 
      };
      setEditedItem(updated);
      onSave(updated);
      setIsEditingContent(false);
  };

  const handleCopyContent = () => {
    if (editedItem.generatedContent) {
        navigator.clipboard.writeText(editedItem.generatedContent);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleScriptCreated = (script: GeneratedScript) => {
      const updatedItem = { ...editedItem, status: PlanStatus.DRAFT, scriptId: script.id, generatedContent: script.content };
      setEditedItem(updatedItem);
      onSave(updatedItem);
      onScriptGenerated(script);
      setView('details');
  };

  const handleWriteWithAI = () => {
      if (!languageProfile.isAnalyzed) {
          alert("Обучите стиль во вкладке 'Стиль' перед генерацией.");
          return;
      }
      onSave(editedItem);
      setView('generator');
  };

  const handleGenerateMedia = async () => {
    setIsGeneratingMedia(true);
    try {
      const media = await generateMediaSuggestion(editedItem, authorProfile, languageProfile);
      setTempVisualDesc(media.description);
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
          const updated = { ...editedItem, mediaSuggestion: { ...editedItem.mediaSuggestion!, description: tempVisualDesc, aiPrompt: engPrompt } };
          setEditedItem(updated);
          onSave(updated);
      } catch (e) { alert("Ошибка перевода"); } finally { setIsTranslating(false); }
  };

  const handleSimulateImageGeneration = () => {
      if (!tempPrompt) return;
      setIsSimulatingImage(true);
      setTimeout(() => {
          const mockUrl = `https://placehold.co/600x600/png?text=${encodeURIComponent(editedItem.topic.slice(0, 20))}`;
          const updated = { ...editedItem, mediaSuggestion: { ...editedItem.mediaSuggestion!, imageUrl: mockUrl, description: tempVisualDesc, aiPrompt: tempPrompt } };
          setEditedItem(updated);
          onSave(updated);
          setIsSimulatingImage(false);
      }, 1500);
  };

  const modalWidthClass = view === 'generator' ? 'max-w-7xl' : 'max-w-4xl';
  const metrics = editedItem.metrics || { reach: 0, likes: 0, comments: 0, reposts: 0 };
  const erValue = metrics.reach > 0 ? (((metrics.likes + metrics.comments + metrics.reposts) / metrics.reach) * 100).toFixed(2) : "0.00";

  const getStatusLabel = (status: PlanStatus) => {
      switch(status) {
          case PlanStatus.IDEA: return 'Идея';
          case PlanStatus.DRAFT: return 'Черновик';
          case PlanStatus.DONE: return 'Опубликовано';
          default: return status;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className={`bg-white w-full ${modalWidthClass} max-h-[92vh] rounded-3xl shadow-2xl flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden transition-all ease-in-out`}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            {view === 'generator' && (
                <button onClick={() => setView('details')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ChevronLeft size={24} /></button>
            )}
            <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{view === 'generator' ? 'Режим Режиссёра' : 'Параметры поста'}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <CalendarIcon size={12} className="text-indigo-600"/> {new Date(editedItem.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        {editedItem.time && <span className="ml-1 text-slate-900 font-black flex items-center gap-0.5"><Clock size={10}/>{editedItem.time}</span>}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase"><Share2 size={12}/>{editedItem.platform}</div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${editedItem.status === PlanStatus.DONE ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {editedItem.status === PlanStatus.DONE ? <CheckCircle size={10}/> : <Edit2 size={10}/>}
                        {getStatusLabel(editedItem.status)}
                    </div>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
        </div>

        {/* TABS */}
        {view === 'details' && (
            <div className="flex border-b border-slate-100 bg-white px-8">
                <button onClick={() => setActiveTab('main')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2.5 ${activeTab === 'main' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><FileText size={18}/> Детали</button>
                <button onClick={() => setActiveTab('visuals')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2.5 ${activeTab === 'visuals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Image size={18}/> Визуал</button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50/20">
          {view === 'details' ? (
              <div className="p-8 space-y-8">
                 {activeTab === 'main' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* INPUTS BLOCK */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TypeIcon size={14} className="text-indigo-600"/> Тема (Заголовок)</label>
                                    <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none" value={editedItem.topic} onChange={(e) => handleChange('topic', e.target.value)}/>
                                </div>
                                
                                {/* PRODUCT SELECTION */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14} className="text-indigo-600"/> Продукт / Услуга</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                        value={editedItem.productId || ''}
                                        onChange={(e) => handleChange('productId', e.target.value || undefined)}
                                    >
                                        <option value="">-- Без привязки к продукту --</option>
                                        {authorProfile.products?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400">Выберите продукт, чтобы ИИ учитывал его особенности при генерации текста.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><AlignLeft size={14} className="text-indigo-600"/> Описание и контекст (Для AI)</label>
                                    <textarea className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none" placeholder="Добавьте факты, ссылки или детали, которые ИИ должен использовать в тексте..." value={editedItem.description || ""} onChange={(e) => handleChange('description', e.target.value)}/>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Статус поста</label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        {[PlanStatus.IDEA, PlanStatus.DRAFT, PlanStatus.DONE].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => handleChange('status', s)}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${editedItem.status === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {getStatusLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CalendarIcon size={14} className="text-indigo-600"/> Дата</label>
                                        <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={editedItem.date} onChange={(e) => handleChange('date', e.target.value)}/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-indigo-600"/> Время</label>
                                        <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={editedItem.time || "10:00"} onChange={(e) => handleChange('time', e.target.value)}/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Площадка</label>
                                    <div className="flex flex-wrap gap-2">
                                        {platformConfigs.map(p => (
                                            <button key={p.id} onClick={() => handleChange('platform', p.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${editedItem.platform === p.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{p.name}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Цель</label>
                                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" value={editedItem.goal} onChange={(e) => handleChange('goal', e.target.value as ContentGoal)}>
                                            {Object.values(ContentGoal).map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Формат</label>
                                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" value={editedItem.archetype} onChange={(e) => handleChange('archetype', e.target.value)}>
                                            {archetypeConfigs.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTENT PREVIEW */}
                        <div className={`rounded-3xl border shadow-sm transition-all overflow-hidden ${isEditingContent ? 'bg-amber-50 border-amber-300 ring-8 ring-amber-50' : 'bg-white border-slate-200'}`}>
                            <div className={`p-5 border-b flex justify-between items-center ${isEditingContent ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                                <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-widest flex items-center gap-2"><PenTool size={18} className="text-indigo-600"/> Сценарий поста</h3>
                                <div className="flex gap-2">
                                    {!editedItem.generatedContent && !isEditingContent ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleStartContentEdit} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"><Keyboard size={12}/> Написать самому</button>
                                            <button onClick={handleWriteWithAI} className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 group"><Wand2 size={12} className="group-hover:rotate-12 transition-transform"/> Создать с AI</button>
                                        </div>
                                    ) : editedItem.generatedContent && !isEditingContent ? (
                                        <>
                                            <button onClick={handleStartContentEdit} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={handleCopyContent} className={`p-2 rounded-lg ${copyFeedback ? 'text-green-600' : 'text-indigo-600'}`}>{copyFeedback ? <CheckCircle2 size={18} /> : <Copy size={18} />}</button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            <div className="p-8">
                                {isEditingContent ? (
                                    <div className="space-y-4">
                                        <textarea className="w-full h-80 p-5 border border-amber-200 rounded-2xl bg-white text-slate-900 focus:ring-4 focus:ring-amber-200 outline-none resize-none font-sans text-sm leading-relaxed" placeholder="Вставьте ваш готовый пост здесь или начните писать..." value={tempContent} onChange={(e) => setTempContent(e.target.value)} autoFocus/>
                                        <div className="flex justify-end gap-3"><button onClick={() => setIsEditingContent(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500">Отмена</button><button onClick={handleSaveContentEdit} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black flex items-center gap-2"><Save size={16} /> Сохранить</button></div>
                                    </div>
                                ) : editedItem.generatedContent ? (
                                    <div className="prose prose-slate max-w-none text-slate-800 prose-headings:font-black prose-p:leading-relaxed"><ReactMarkdown>{editedItem.generatedContent}</ReactMarkdown></div>
                                ) : (
                                    <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                                        <div className="text-slate-300 font-black uppercase tracking-widest text-[10px] italic">Текст еще не добавлен</div>
                                        <div className="flex gap-3">
                                            <button onClick={handleStartContentEdit} className="px-4 py-2 border-2 border-slate-100 text-slate-400 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-colors flex items-center gap-2"><Keyboard size={14}/> Вставить свой текст</button>
                                            <button onClick={handleWriteWithAI} className="px-4 py-2 border-2 border-indigo-100 text-indigo-600 rounded-xl text-xs font-black uppercase hover:bg-indigo-50 transition-colors flex items-center gap-2"><Wand2 size={14}/> Сгенерировать AI</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* METRICS */}
                        {editedItem.status === PlanStatus.DONE && (
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-6 animate-in slide-in-from-top-4">
                                 <div className="flex items-center justify-between border-b border-slate-50 pb-4"><div className="flex items-center gap-2"><BarChart3 size={20} className="text-indigo-600"/><h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Аналитика по факту</h4></div><div className="px-3 py-1 bg-green-50 rounded-full border border-green-200 text-[10px] font-black text-green-700 uppercase">ER: {erValue}%</div></div>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {['reach', 'likes', 'reposts', 'comments'].map((f) => (
                                        <div key={f} className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{f === 'reach' ? 'Охват 👁️' : f === 'likes' ? 'Лайки ❤️' : f === 'reposts' ? 'Репосты 📢' : 'Коммент 💬'}</label><input type="number" className="w-full p-2.5 text-xs font-black border border-slate-100 rounded-xl outline-none focus:border-indigo-500" value={editedItem.metrics?.[f as keyof ContentMetrics] || ''} placeholder="0" onChange={(e) => handleMetricChange(f as keyof ContentMetrics, e.target.value)}/></div>
                                    ))}
                                 </div>
                            </div>
                        )}
                     </div>
                 )}

                 {activeTab === 'visuals' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full animate-in fade-in">
                         <div className="space-y-6">
                             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                 <div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Palette size={18} className="text-indigo-600"/> Описание визуала</label><button onClick={handleGenerateMedia} disabled={isGeneratingMedia} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 disabled:opacity-50">{isGeneratingMedia ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Идея</button></div>
                                 <textarea className="w-full h-32 p-4 border border-slate-100 rounded-2xl text-slate-900 bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 outline-none text-xs resize-none" placeholder="Опишите желаемую картинку..." value={tempVisualDesc} onChange={(e) => setTempVisualDesc(e.target.value)}/>
                             </div>
                             <div className="bg-indigo-900 p-6 rounded-3xl space-y-5 shadow-2xl">
                                 <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2"><Languages size={18} className="text-white"/> AI Промпт (EN)</h4>
                                 <textarea className="w-full h-24 p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-white focus:ring-2 focus:ring-white outline-none text-[10px] font-mono resize-none" placeholder="AI prompt..." value={tempPrompt} onChange={(e) => setTempPrompt(e.target.value)}/>
                                 <div className="flex gap-2"><button onClick={handleTranslatePrompt} disabled={isTranslating || !tempVisualDesc} className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Перевести</button><button onClick={handleSimulateImageGeneration} disabled={isSimulatingImage || !tempPrompt} className="flex-[2] bg-white text-indigo-900 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">{isSimulatingImage ? 'Генерация...' : 'Показать превью'}</button></div>
                             </div>
                         </div>
                         <div className="bg-slate-200 rounded-3xl border-4 border-white shadow-inner flex flex-col overflow-hidden relative min-h-[400px]">
                             {editedItem.mediaSuggestion?.imageUrl ? (
                                 <div className="relative h-full w-full bg-slate-900 flex items-center justify-center group"><img src={editedItem.mediaSuggestion.imageUrl} className="max-w-full max-h-full object-contain" alt="Preview"/><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={handleSimulateImageGeneration} className="p-4 bg-white rounded-full text-slate-900 shadow-xl"><RefreshCcw size={24}/></button></div></div>
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400"><Image size={64} className="mb-6 opacity-10 text-indigo-600"/><p className="text-[10px] font-black uppercase tracking-widest opacity-40">Превью отсутствует</p></div>
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
                platformConfigs={platformConfigs}
                archetypeConfigs={archetypeConfigs}
                initialConfig={{ 
                    topic: editedItem.topic, 
                    platform: editedItem.platform, 
                    archetype: editedItem.archetype, 
                    description: editedItem.description 
                }} 
                className="h-full p-8 flex flex-col gap-8" 
            />
          )}
        </div>

        {view === 'details' && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
                <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold"><Trash2 size={18}/> Удалить</button>
                
                <div className="flex gap-3">
                    {editedItem.status !== PlanStatus.DONE && (
                        <button 
                            onClick={handleArchive}
                            className="px-6 py-3 bg-white border border-indigo-200 text-indigo-600 font-bold text-sm rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                            <Archive size={18}/> В архив для анализа
                        </button>
                    )}
                    <button onClick={() => { onSave(editedItem); onClose(); }} className="px-8 py-3 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2"><CheckCircle2 size={18}/> Сохранить изменения</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
