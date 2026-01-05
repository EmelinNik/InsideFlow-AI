
import React, { useState, useEffect } from 'react';
import { AuthorProfile, ContentPlanItem, PostArchetype, TargetPlatform, ContentGoal, MediaSuggestion, PlanStatus, LanguageProfile, GeneratedScript, PLATFORM_COMPATIBILITY, ContentMetrics, PromptKey } from '../types';
import { generateMediaSuggestion, generateAiImage } from '../services/geminiService';
import { X, Save, Trash2, Wand2, Image, Camera, Video, Loader2, Copy, ChevronLeft, FileText, CheckCircle2, Edit2, BarChart3, TrendingUp, MessageSquare, Share2, Eye, Sparkles, Download, RefreshCw } from 'lucide-react';
import { ContentGenerator } from './ContentGenerator';
import ReactMarkdown from 'react-markdown';

interface PlanItemModalProps {
  item: ContentPlanItem | null;
  authorProfile: AuthorProfile;
  languageProfile: LanguageProfile;
  prompts: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ContentPlanItem) => void;
  onDelete: (id: string) => void;
  onScriptGenerated: (script: GeneratedScript) => void;
}

type ModalView = 'details' | 'generator';

export const PlanItemModal: React.FC<PlanItemModalProps> = ({
  item,
  authorProfile,
  languageProfile,
  prompts,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onScriptGenerated
}) => {
  const [editedItem, setEditedItem] = useState<ContentPlanItem | null>(null);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [view, setView] = useState<ModalView>('details');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState('');

  // Editable prompt state
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (item) {
        setEditedItem({ ...item });
        setView('details');
        setIsEditingContent(false);
        setPromptText(item.mediaSuggestion?.aiPrompt || '');
    }
  }, [item]);

  // Update promptText if mediaSuggestion changes (e.g. after generation)
  useEffect(() => {
      if (editedItem?.mediaSuggestion?.aiPrompt) {
          setPromptText(editedItem.mediaSuggestion.aiPrompt);
      }
  }, [editedItem?.mediaSuggestion]);

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
  
  const handleMediaDescriptionChange = (desc: string) => {
      setEditedItem(prev => {
          if (!prev) return null;
          return {
              ...prev,
              mediaSuggestion: {
                  ...(prev.mediaSuggestion || { type: 'photo' }),
                  description: desc,
                  type: prev.mediaSuggestion?.type || 'photo'
              }
          };
      });
  };
  
  const handleGeneratedContentChange = (content: string) => {
      setEditedItem(prev => ({
          ...prev!,
          generatedContent: content
      }));
  };

  const handleGenerateMedia = async () => {
    if (!editedItem) return;
    setIsGeneratingMedia(true);
    try {
      const media = await generateMediaSuggestion(
          editedItem, 
          authorProfile, 
          languageProfile,
          prompts[PromptKey.VISUAL_DIRECTOR]
      );
      const updated = { ...editedItem, mediaSuggestion: media };
      setEditedItem(updated);
      setPromptText(media.aiPrompt || '');
      onSave(updated);
    } catch (e) {
      alert("Ошибка генерации медиа");
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleGenerateImage = async () => {
      if (!promptText.trim()) return;
      setIsGeneratingImage(true);
      try {
          const base64Image = await generateAiImage(promptText);
          if (base64Image && editedItem.mediaSuggestion) {
              const updated = {
                  ...editedItem,
                  mediaSuggestion: {
                      ...editedItem.mediaSuggestion,
                      aiPrompt: promptText, // Save the edited prompt
                      generatedImageUrl: base64Image
                  }
              };
              setEditedItem(updated);
              onSave(updated);
          }
      } catch (e) {
          alert("Ошибка генерации изображения. Попробуйте еще раз.");
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleDownloadImage = () => {
      const url = editedItem?.mediaSuggestion?.generatedImageUrl;
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
      alert("Промпт скопирован!");
    }
  };
  
  const handleCopyContent = () => {
    if (editedItem.generatedContent) {
        navigator.clipboard.writeText(editedItem.generatedContent);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleDelete = () => {
      if (confirm("Вы уверены, что хотите удалить этот пост?")) {
          onDelete(editedItem.id);
      }
  };

  const handleStartContentEdit = () => {
      setTempContent(editedItem.generatedContent || '');
      setIsEditingContent(true);
  };

  const handleSaveContentEdit = () => {
      const updated = { ...editedItem, generatedContent: tempContent };
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
      // Save changes before switching, ensure description is saved
      onSave(editedItem);
      setView('generator');
  };

  const modalWidthClass = view === 'generator' ? 'max-w-7xl' : 'max-w-2xl';
  const allowedArchetypes = PLATFORM_COMPATIBILITY[editedItem.platform] || [];
  const showMetrics = editedItem.status === PlanStatus.DONE;
  // If post is DONE, we allow manual editing of content for archival purposes
  const isArchived = editedItem.status === PlanStatus.DONE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      
      <div className={`bg-white w-full ${modalWidthClass} max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden transition-all ease-in-out`}>
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            {view === 'generator' && (
                <button onClick={() => setView('details')} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 mr-2">
                    <ChevronLeft size={20} />
                </button>
            )}
            <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {view === 'generator' ? 'Написание поста' : isArchived ? 'Создание поста для аналитики' : 'Редактирование поста'}
                </h2>
                <p className="text-sm text-slate-500">
                    {new Date(editedItem.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {view === 'details' ? (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Тема</label>
                    <input className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editedItem.topic} onChange={(e) => handleChange('topic', e.target.value)}/>
                    </div>
                    
                    <div className={`grid ${isArchived ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                        <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Платформа</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm" value={editedItem.platform} onChange={(e) => handleChange('platform', e.target.value)}>
                            {Object.values(TargetPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        </div>
                        
                        {!isArchived && (
                            <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Тип (Архетип)</label>
                            <select className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm" value={editedItem.archetype} onChange={(e) => handleChange('archetype', e.target.value)}>
                                {allowedArchetypes.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            </div>
                        )}
                    </div>

                    {!isArchived && (
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Контекст / Факты (для AI)</label>
                             <textarea 
                                 className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm resize-none" 
                                 placeholder="Добавьте факты, цифры или детали, которые нужно упомянуть в посте..."
                                 value={editedItem.description || ''} 
                                 onChange={(e) => handleChange('description', e.target.value)}
                             />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Статус</label>
                            <select className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm" value={editedItem.status} onChange={(e) => handleChange('status', e.target.value)}>
                                <option value={PlanStatus.IDEA}>💡 Идея</option>
                                <option value={PlanStatus.DRAFT}>📝 Черновик</option>
                                <option value={PlanStatus.DONE}>✅ Опубликовано / Архив</option>
                            </select>
                        </div>
                    </div>

                    {/* METRICS SECTION - Visible for DONE */}
                    {showMetrics && (
                        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 space-y-4 animate-in slide-in-from-top-2 shadow-sm">
                             <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                                <BarChart3 size={18} className="text-indigo-600"/>
                                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">Статистика публикации</h4>
                                <span className="ml-auto text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Авто-сохранение</span>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1"><Eye size={12}/> Охват</label>
                                    <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-medium" placeholder="0" value={editedItem.metrics?.reach || ''} onChange={(e) => handleMetricChange('reach', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12}/> Лайки</label>
                                    <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-medium" placeholder="0" value={editedItem.metrics?.likes || ''} onChange={(e) => handleMetricChange('likes', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1"><Share2 size={12}/> Репосты</label>
                                    <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-medium" placeholder="0" value={editedItem.metrics?.reposts || ''} onChange={(e) => handleMetricChange('reposts', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12}/> Комм.</label>
                                    <input type="number" className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-medium" placeholder="0" value={editedItem.metrics?.comments || ''} onChange={(e) => handleMetricChange('comments', e.target.value)}/>
                                </div>
                             </div>
                             <p className="text-[10px] text-indigo-700 opacity-70 italic">
                                * Введите данные, чтобы они попали в аналитику и обучили ИИ.
                             </p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Image size={18} className="text-indigo-600"/> Медиа / Визуал</h3>
                        {/* Only show Generate button if NOT archived/done */}
                        {!isArchived && !editedItem.mediaSuggestion && (
                            <button onClick={handleGenerateMedia} disabled={isGeneratingMedia} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1 font-medium">
                                {isGeneratingMedia ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} Сгенерировать ТЗ
                            </button>
                        )}
                    </div>
                    
                    {isArchived ? (
                         <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Описание визуала (для обучения ИИ)</label>
                             <textarea 
                                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                placeholder="Опишите, что было на картинке или в видео..."
                                rows={3}
                                value={editedItem.mediaSuggestion?.description || ''}
                                onChange={(e) => handleMediaDescriptionChange(e.target.value)}
                             />
                             <p className="text-[10px] text-slate-500 italic">Это описание поможет ИИ понять ваш визуальный стиль.</p>
                         </div>
                    ) : (
                        editedItem.mediaSuggestion ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    {editedItem.mediaSuggestion.type === 'video' ? <Video size={14}/> : <Camera size={14}/>}
                                    Тип: {editedItem.mediaSuggestion.type === 'ai_image' ? 'AI Генерация' : editedItem.mediaSuggestion.type === 'video' ? 'Видео / Reels' : 'Фото'}
                                </div>
                                <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">{editedItem.mediaSuggestion.description}</p>
                                
                                {/* AI IMAGE SECTION */}
                                {editedItem.mediaSuggestion.type === 'ai_image' && (
                                    <div className="space-y-3">
                                        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Промпт для нейросети</span>
                                                <button onClick={handleCopyPrompt} className="text-indigo-600 text-[10px] flex items-center gap-1 hover:underline"><Copy size={10}/> Копировать</button>
                                            </div>
                                            <textarea 
                                                className="w-full text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-300 resize-y min-h-[60px] outline-none focus:border-indigo-400"
                                                value={promptText}
                                                onChange={(e) => setPromptText(e.target.value)}
                                                placeholder="Промпт для генерации..."
                                            />
                                            <div className="mt-2 flex justify-end">
                                                <button 
                                                    onClick={handleGenerateImage} 
                                                    disabled={isGeneratingImage || !promptText}
                                                    className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {isGeneratingImage ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} 
                                                    {editedItem.mediaSuggestion.generatedImageUrl ? 'Перегенерировать' : 'Сгенерировать изображение'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Generated Image Preview */}
                                        {editedItem.mediaSuggestion.generatedImageUrl && (
                                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-md">
                                                <img 
                                                    src={editedItem.mediaSuggestion.generatedImageUrl} 
                                                    alt="Generated" 
                                                    className="w-full h-auto object-cover max-h-[400px]"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button 
                                                        onClick={handleDownloadImage}
                                                        className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-100"
                                                    >
                                                        <Download size={14}/> Скачать
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : <div className="text-center text-slate-400 text-sm italic py-4">Нажмите кнопку выше для получения визуала.</div>
                    )}
                </div>

                {/* CONTENT SECTION */}
                <div className={`rounded-xl p-5 border shadow-sm animate-in fade-in slide-in-from-bottom-2 ${isEditingContent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                    {isArchived ? (
                         // ARCHIVE MODE: Simple text area for pasting content
                         <div className="space-y-3">
                             <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Текст поста</h3>
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase font-bold">Для обучения</span>
                             </div>
                             <textarea 
                                className="w-full p-4 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm focus:ring-2 focus:ring-indigo-400 outline-none min-h-[200px]"
                                placeholder="Вставьте сюда текст опубликованного поста..."
                                value={editedItem.generatedContent || ''}
                                onChange={(e) => handleGeneratedContentChange(e.target.value)}
                             />
                         </div>
                    ) : (
                        editedItem.generatedContent && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> {isEditingContent ? 'Редактирование' : 'Текст'}</h3>
                                    {!isEditingContent ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleStartContentEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={handleCopyContent} className={`text-xs flex items-center gap-1 font-medium transition-colors p-1.5 rounded ${copyFeedback ? 'text-green-600 bg-green-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}`}>{copyFeedback ? <CheckCircle2 size={14} /> : <Copy size={14} />}</button>
                                        </div>
                                    ) : <button onClick={handleDeleteContent} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>}
                                </div>
                                {isEditingContent ? (
                                    <div className="space-y-3">
                                        <textarea className="w-full h-64 p-3 border border-amber-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none resize-y font-mono text-sm" value={tempContent} onChange={(e) => setTempContent(e.target.value)}/>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsEditingContent(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded">Отмена</button>
                                            <button onClick={handleSaveContentEdit} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1"><Save size={14} /> Сохранить</button>
                                        </div>
                                    </div>
                                ) : <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800"><ReactMarkdown>{editedItem.generatedContent}</ReactMarkdown></div>}
                            </>
                        )
                    )}
                </div>

              </div>
          ) : (
            <ContentGenerator 
                authorProfile={authorProfile} 
                languageProfile={languageProfile} 
                prompts={prompts}
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

        {view === 'details' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"><Trash2 size={16}/> Удалить</button>
                <div className="flex gap-3">
                    <button onClick={() => { onSave(editedItem); onClose(); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm">Сохранить</button>
                    {!isArchived && (
                        <button onClick={handleWriteWithAI} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 text-sm"><Wand2 size={16}/> Написать с ИИ</button>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
