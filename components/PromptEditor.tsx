
import React, { useState, useEffect } from 'react';
import { PromptKey } from '../types';
import { DEFAULT_PROMPTS, PROMPT_LABELS, PROMPT_VARIABLES, PROMPT_CATEGORIES } from '../services/prompts';
import { Save, RotateCcw, AlertTriangle, Terminal, Code, Info, ChevronDown, Layers, Box, Globe } from 'lucide-react';

interface PromptEditorProps {
    prompts: Record<string, string>;
    onSave: (prompts: Record<string, string>) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ prompts, onSave }) => {
    const [selectedKey, setSelectedKey] = useState<PromptKey>(PromptKey.PLAN_GENERATION);
    const [currentCode, setCurrentCode] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    
    // Accordion state - all open by default
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        CORE: true,
        PLATFORMS: false,
        FORMATS: false
    });

    useEffect(() => {
        // Load custom prompt or default
        const value = prompts[selectedKey] || DEFAULT_PROMPTS[selectedKey];
        setCurrentCode(value || "");
        setHasChanges(false);
    }, [selectedKey, prompts]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentCode(e.target.value);
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave({
            ...prompts,
            [selectedKey]: currentCode
        });
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm("Вы уверены? Это сбросит промпт к заводским настройкам.")) {
            const newPrompts = { ...prompts };
            delete newPrompts[selectedKey]; // Removing key makes it fall back to default
            onSave(newPrompts);
            setCurrentCode(DEFAULT_PROMPTS[selectedKey]);
            setHasChanges(false);
        }
    };

    const toggleCategory = (key: string) => {
        setOpenCategories(prev => ({...prev, [key]: !prev[key]}));
    };

    const getCategoryIcon = (key: string) => {
        switch(key) {
            case 'CORE': return <Layers size={14}/>;
            case 'PLATFORMS': return <Globe size={14}/>;
            case 'FORMATS': return <Box size={14}/>;
            default: return <Terminal size={14}/>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 h-full flex flex-col">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="text-indigo-600" />
                    Инженер Промптов
                </h2>
                <p className="text-slate-600 mt-1 max-w-3xl text-sm">
                    Настройте логику AI. "Основные" управляют процессами, "Площадки" и "Форматы" встраиваются в генерацию контента.
                </p>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[600px]">
                {/* SIDEBAR: PROMPT LIST */}
                <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto pr-2">
                    {Object.entries(PROMPT_CATEGORIES).map(([catKey, category]) => (
                        <div key={catKey} className="mb-2">
                            <button 
                                onClick={() => toggleCategory(catKey)}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider p-2 hover:bg-slate-100 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {getCategoryIcon(catKey)}
                                    {category.label}
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${openCategories[catKey] ? 'rotate-180' : ''}`}/>
                            </button>
                            
                            {openCategories[catKey] && (
                                <div className="mt-1 space-y-1 pl-2 animate-in slide-in-from-top-1">
                                    {category.keys.map(key => {
                                        const isCustomized = !!prompts[key];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedKey(key)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors border-l-2 ${
                                                    selectedKey === key 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="truncate">{PROMPT_LABELS[key]?.replace(/.*\:\s/, '') || key}</span>
                                                {isCustomized && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" title="Изменен"></span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* MAIN EDITOR */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Code size={16} className="text-slate-500"/>
                            <span className="text-xs font-bold text-slate-700 uppercase">{PROMPT_LABELS[selectedKey]}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleReset}
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                            >
                                <RotateCcw size={14}/> Сброс
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={14}/> Сохранить
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <textarea 
                            className="w-full h-full p-4 font-mono text-sm leading-relaxed outline-none resize-none text-slate-800 bg-[#fbfcfd]"
                            value={currentCode}
                            onChange={handleCodeChange}
                            spellCheck={false}
                            placeholder="Здесь пока пусто. Напишите свои инструкции для ИИ..."
                        />
                    </div>
                </div>

                {/* RIGHT SIDEBAR: VARIABLES */}
                <div className="w-full lg:w-64 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                        <Info size={14} className="text-indigo-600"/>
                        Доступные переменные
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                        {PROMPT_VARIABLES[selectedKey]?.length ? (
                            PROMPT_VARIABLES[selectedKey]?.map(v => (
                                <div key={v.key} className="group">
                                    <code 
                                        className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-600 font-bold cursor-pointer hover:border-indigo-300"
                                        onClick={() => {
                                            // Simple append to end of textarea logic (in real app, insert at cursor)
                                            setCurrentCode(prev => prev + ` {{${v.key}}} `);
                                            setHasChanges(true);
                                        }}
                                        title="Нажмите, чтобы добавить"
                                    >
                                        {`{{${v.key}}}`}
                                    </code>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                        {v.description}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-[10px] text-slate-400 italic">
                                Для этого типа промпта переменные обычно не требуются. Это статичная инструкция, которая вставляется в главный сценарий.
                            </div>
                        )}
                    </div>
                    {PROMPT_VARIABLES[selectedKey]?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex gap-2 items-start bg-amber-50 p-2 rounded text-[10px] text-amber-800 border border-amber-100">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5"/>
                                <p>
                                    Не удаляйте ключевые переменные (JSON формат), иначе ИИ перестанет работать.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
