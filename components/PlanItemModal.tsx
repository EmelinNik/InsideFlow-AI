import React, { useState } from 'react';
import { AuthorProfile, ContentPlanItem, PostArchetype, TargetPlatform, ContentGoal, MediaSuggestion, PlanStatus, LanguageProfile, GeneratedScript } from '../types';
import { generateMediaSuggestion } from '../services/geminiService';
import { X, Save, Trash2, Wand2, Image, Camera, Video, Loader2, Copy, ChevronLeft, FileText, CheckCircle2, Edit2 } from 'lucide-react';
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
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [view, setView] = useState<ModalView>('details');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Content Editing State
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState('');

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
        setEditedItem({ ...item });
        setView('details');
        setIsEditingContent(false);
    }
  }, [item]);

  if (!isOpen || !editedItem) return null;

  const handleChange = (field: keyof ContentPlanItem, value: any) => {
    setEditedItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleGenerateMedia = async () => {
    if (!editedItem) return;
    setIsGeneratingMedia(true);
    try {
      // Pass languageProfile which now contains visualStyle
      const media = await generateMediaSuggestion(editedItem, authorProfile, languageProfile);
      const updated = { ...editedItem, mediaSuggestion: media };
      setEditedItem(updated);
      onSave(updated); // Auto-save on generation
    } catch (e) {
      alert("Ошибка генерации медиа");
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleCopyPrompt = () => {
    if (editedItem.mediaSuggestion?.aiPrompt) {
      navigator.clipboard.writeText(editedItem.mediaSuggestion.aiPrompt);
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

  // --- CONTENT EDITING HANDLERS ---
  const handleStartContentEdit = () => {
      setTempContent(editedItem.generatedContent || '');
      setIsEditingContent(true);
  };

  const handleSaveContentEdit = () => {
      const updated = { ...editedItem, generatedContent: tempContent };
      setEditedItem(updated);
      onSave(updated); // Save to plan
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
      // 1. Notify parent app to save script to DB
      onScriptGenerated(script);
      
      // 2. Update local item state - SAVE CONTENT HERE
      const updatedItem = {
          ...editedItem,
          status: PlanStatus.DONE,
          scriptId: script.id,
          generatedContent: script.content // Store content in the item
      };
      setEditedItem(updatedItem);
      
      // 3. Save updated item to plan
      onSave(updatedItem);
      
      // 4. Return to details view
      setView('details');
  };

  // Adjust width based on view
  const modalWidthClass = view === 'generator' ? 'max-w-7xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`bg-white w-full ${modalWidthClass} max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden transition-all ease-in-out`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            {view === 'generator' && (
                <button 
                    onClick={() => setView('details')}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 mr-2"
                >
                    <ChevronLeft size={20} />
                </button>
            )}
            <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {view === 'generator' ? 'Написание поста' : 'Редактирование поста'}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          
          {view === 'details' ? (
              <div className="p-6 space-y-6">
                {/* Main Fields */}
                <div className="space-y-4">
                    <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Тема</label>
                    <input 
                        className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editedItem.topic}
                        onChange={(e) => handleChange('topic', e.target.value)}
                    />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Платформа</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm"
                            value={editedItem.platform}
                            onChange={(e) => handleChange('platform', e.target.value)}
                        >
                            {Object.values(TargetPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        </div>
                        <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Тип (Архетип)</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm"
                            value={editedItem.archetype}
                            onChange={(e) => handleChange('archetype', e.target.value)}
                        >
                            {Object.values(PostArchetype).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Статус</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm"
                                value={editedItem.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value={PlanStatus.IDEA}>💡 Идея</option>
                                <option value={PlanStatus.DRAFT}>📝 Черновик</option>
                                <option value={PlanStatus.DONE}>✅ Готово</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Зачем сейчас? (Rationale)</label>
                        <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-sm h-20 resize-none"
                        value={editedItem.rationale}
                        onChange={(e) => handleChange('rationale', e.target.value)}
                        />
                    </div>
                </div>

                {/* Media Section */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Image size={18} className="text-indigo-600"/> 
                        Медиа / Визуал
                        </h3>
                        {!editedItem.mediaSuggestion && (
                        <button 
                            onClick={handleGenerateMedia}
                            disabled={isGeneratingMedia}
                            className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1 font-medium"
                        >
                            {isGeneratingMedia ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                            Сгенерировать ТЗ
                        </button>
                        )}
                    </div>

                    {editedItem.mediaSuggestion ? (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                            {editedItem.mediaSuggestion.type === 'video' ? <Video size={14}/> : <Camera size={14}/>}
                            Тип: {editedItem.mediaSuggestion.type === 'ai_image' ? 'AI Генерация' : editedItem.mediaSuggestion.type === 'video' ? 'Видео / Reels' : 'Фото'}
                        </div>
                        
                        <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">
                            {editedItem.mediaSuggestion.description}
                        </p>

                        {editedItem.mediaSuggestion.type === 'ai_image' && editedItem.mediaSuggestion.aiPrompt && (
                            <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Промпт для нейросети</span>
                                <button onClick={handleCopyPrompt} className="text-indigo-600 text-[10px] flex items-center gap-1 hover:underline">
                                    <Copy size={10}/> Копировать
                                </button>
                            </div>
                            <div className="text-xs font-mono text-slate-600 bg-slate-200 p-2 rounded break-all">
                                {editedItem.mediaSuggestion.aiPrompt}
                            </div>
                            </div>
                        )}

                        <button 
                            onClick={handleGenerateMedia}
                            className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-2"
                        >
                            <RefreshCwIcon size={12}/> Перегенерировать визуал
                        </button>
                    </div>
                    ) : (
                    <div className="text-center text-slate-400 text-sm italic py-4">
                        Нажмите кнопку выше, чтобы получить описание фото, видео или промпт для картинки.
                    </div>
                    )}
                </div>

                {/* Generated Content Section (Displayed at Bottom) */}
                {editedItem.generatedContent && (
                    <div className={`rounded-xl p-5 border shadow-sm animate-in fade-in slide-in-from-bottom-2 ${isEditingContent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-600"/>
                                {isEditingContent ? 'Редактирование текста' : 'Готовый текст'}
                            </h3>
                            
                            {!isEditingContent ? (
                                <div className="flex gap-2">
                                     <button 
                                        onClick={handleStartContentEdit}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                        title="Редактировать"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={handleCopyContent}
                                        className={`text-xs flex items-center gap-1 font-medium transition-colors p-1.5 rounded ${copyFeedback ? 'text-green-600 bg-green-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}`}
                                    >
                                        {copyFeedback ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleDeleteContent}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Удалить текст"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {isEditingContent ? (
                            <div className="space-y-3">
                                <textarea
                                    className="w-full h-64 p-3 border border-amber-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none resize-y font-mono text-sm"
                                    value={tempContent}
                                    onChange={(e) => setTempContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setIsEditingContent(false)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded"
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        onClick={handleSaveContentEdit}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1"
                                    >
                                        <Save size={14} /> Сохранить изменения
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800">
                                <ReactMarkdown>{editedItem.generatedContent}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}

              </div>
          ) : (
              <div className="h-full">
                  <ContentGenerator 
                      authorProfile={authorProfile}
                      languageProfile={languageProfile}
                      onScriptGenerated={handleScriptCreated}
                      initialConfig={{
                          topic: editedItem.topic,
                          platform: editedItem.platform,
                          archetype: editedItem.archetype
                      }}
                      className="h-full p-6 flex flex-col gap-6"
                  />
              </div>
          )}

        </div>

        {/* Footer */}
        {view === 'details' && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button 
                    onClick={handleDelete}
                    className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <Trash2 size={16}/> Удалить пост
                </button>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => { onSave(editedItem); onClose(); }}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm"
                    >
                        Сохранить
                    </button>
                    <button 
                        onClick={() => { 
                            if (!languageProfile.isAnalyzed) {
                                alert("Сначала обучите стиль во вкладке 'Тренировка стиля'");
                                return;
                            }
                            onSave(editedItem); 
                            setView('generator'); 
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                    >
                        {editedItem.generatedContent ? <Wand2 size={16}/> : <Wand2 size={16}/>}
                        {editedItem.generatedContent ? 'Переписать с ИИ' : 'Написать с ИИ'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// Internal icon component for cleaner imports in this standalone file
const RefreshCwIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);