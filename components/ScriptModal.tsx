import React, { useState, useEffect } from 'react';
import { GeneratedScript } from '../types';
import { X, Copy, CheckCircle2, Calendar, Edit2, Save, Trash2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ScriptModalProps {
  script: GeneratedScript | null;
  onClose: () => void;
  onUpdate?: (script: GeneratedScript) => void;
  onDelete?: (id: string) => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({ script, onClose, onUpdate, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Sync content when script opens
  useEffect(() => {
    if (script) {
        setEditedContent(script.content);
        setIsEditing(false);
    }
  }, [script]);

  if (!script) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedContent : script.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
      if (onUpdate) {
          onUpdate({
              ...script,
              content: editedContent
          });
      }
      setIsEditing(false);
  };

  const handleDelete = () => {
      if (confirm("Вы уверены, что хотите удалить этот сценарий? Это действие нельзя отменить.")) {
          if (onDelete) onDelete(script.id);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 transition-colors ${isEditing ? 'bg-amber-50' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-start justify-between rounded-t-2xl ${isEditing ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <h2 className="text-xl font-bold text-slate-900 pr-8">{script.topic}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="bg-white/60 border border-black/5 px-2.5 py-0.5 rounded-md font-medium text-slate-700">
                {script.platform}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(script.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {isEditing && (
                  <span className="flex items-center gap-1 text-amber-700 font-bold ml-2 animate-pulse">
                      <Edit2 size={12}/> Режим редактирования
                  </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && onUpdate && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-full transition-colors"
                    title="Редактировать"
                >
                    <Edit2 size={20} />
                </button>
            )}
            {!isEditing && onDelete && (
                 <button 
                    onClick={handleDelete}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                    title="Удалить"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-black/5 rounded-full transition-colors ml-2"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {isEditing ? (
              <textarea 
                className="w-full h-full min-h-[400px] bg-white p-4 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm leading-relaxed text-slate-900 resize-none"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
          ) : (
            <div className="prose prose-indigo max-w-none text-slate-900">
                <ReactMarkdown>{script.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-2xl flex justify-end gap-3 ${isEditing ? 'bg-amber-100 border-amber-200' : 'bg-white border-slate-100'}`}>
          {isEditing ? (
              <>
                <button
                    onClick={() => { setIsEditing(false); setEditedContent(script.content); }}
                    className="px-4 py-2 text-amber-800 font-medium hover:bg-amber-200 rounded-lg transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                >
                    <Save size={18}/> Сохранить
                </button>
              </>
          ) : (
              <>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Закрыть
                </button>
                <button
                    onClick={handleCopy}
                    className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 ${
                    copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    {copied ? (
                    <>
                        <CheckCircle2 size={18} /> Скопировано
                    </>
                    ) : (
                    <>
                        <Copy size={18} /> Копировать текст
                    </>
                    )}
                </button>
              </>
          )}
        </div>
      </div>
    </div>
  );
};