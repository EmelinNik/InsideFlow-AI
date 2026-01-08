
import React, { useState, useEffect } from 'react';
import { AuthorProfile, NarrativeVoice } from '../types';
import { ArrowRight, Check, Sparkles, Loader2, Wand2, X } from 'lucide-react';
import { suggestAudienceProfile, suggestStyleProfile } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: AuthorProfile) => void;
  onCancel?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AuthorProfile>>({
    voice: NarrativeVoice.FIRST_PERSON,
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [styleSuggestions, setStyleSuggestions] = useState<{ tones: string[]; values: string[]; taboos: string[] } | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  useEffect(() => {
    if (step === 2 && formData.role && !aiPrompt) {
      setAiPrompt(formData.role);
    }
  }, [step, formData.role]);

  useEffect(() => {
    if (step === 3 && formData.role && formData.audiencePainPoints && !styleSuggestions && !isSuggestionsLoading) {
      const fetchSuggestions = async () => {
        setIsSuggestionsLoading(true);
        const suggestions = await suggestStyleProfile(formData.role!, formData.audiencePainPoints!);
        setStyleSuggestions(suggestions);
        setIsSuggestionsLoading(false);
      };
      fetchSuggestions();
    }
  }, [step, formData.role, formData.audiencePainPoints]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleChange = (field: keyof AuthorProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAiAutoFill = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const result = await suggestAudienceProfile(aiPrompt);
    if (result.painPoints && result.goals) {
      setFormData(prev => ({
        ...prev,
        audiencePainPoints: result.painPoints,
        contentGoals: result.goals,
        targetAudience: prev.targetAudience || "Люди, интересующиеся темой " + aiPrompt
      }));
    }
    setIsAiLoading(false);
  };

  const finish = () => {
    if (formData.name && formData.role && formData.tone) {
      onComplete(formData as AuthorProfile);
    } else {
        alert("Пожалуйста, заполните основные поля: Имя, Роль и Тон.");
    }
  };

  const handleSuggestionClick = (category: 'tones' | 'values' | 'taboos', value: string, field: keyof AuthorProfile) => {
    const current = formData[field] || '';
    const newValue = current ? `${current}, ${value}` : value;
    handleChange(field, newValue);

    if (styleSuggestions) {
      setStyleSuggestions({
        ...styleSuggestions,
        [category]: styleSuggestions[category].filter(item => item !== value)
      });
    }
  };

  const renderSuggestionChips = (
    suggestions: string[] | undefined, 
    category: 'tones' | 'values' | 'taboos',
    field: keyof AuthorProfile
  ) => {
    if (isSuggestionsLoading) return <div className="text-xs text-indigo-400 flex items-center gap-1 animate-pulse"><Sparkles size={12}/> Подбираем варианты...</div>;
    if (!suggestions || suggestions.length === 0) return <div className="text-xs text-slate-400 italic mt-2">Больше вариантов нет</div>;

    const visibleSuggestions = suggestions.slice(0, 4);

    return (
      <div className="flex flex-wrap gap-2 mt-2 mb-2">
        {visibleSuggestions.map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            onClick={() => handleSuggestionClick(category, item, field)}
            className="text-xs px-2.5 py-1 rounded-full border bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all animate-in fade-in zoom-in duration-200 flex items-center gap-1"
          >
            <span>+</span> {item}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200">
        
        {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-1 hover:bg-white/10 rounded-full"
            >
                <X size={20}/>
            </button>
        )}

        <div className="bg-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Настройка ИИ-профиля</h2>
          <p className="text-indigo-100 text-sm mt-1">Обучите ИИ понимать ваш контекст</p>
        </div>

        <div className="p-8">
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-slate-800">Кто вы?</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ваше имя</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="например, Иван Петров"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Роль / Персона</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="например, Основатель SaaS, Фитнес-тренер"
                  value={formData.role || ''}
                  onChange={(e) => handleChange('role', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Голос повествования</label>
                <select
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  value={formData.voice}
                  onChange={(e) => handleChange('voice', e.target.value as NarrativeVoice)}
                >
                  {Object.values(NarrativeVoice).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-slate-800">Аудитория и цели</h3>
              
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-800 font-medium text-sm">
                  <Sparkles size={16} />
                  <span>AI Помощник</span>
                </div>
                <p className="text-xs text-indigo-600 mb-3">
                  Опишите вашу деятельность, и ИИ заполнит поля за вас.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Например: Психолог для выгоревших IT"
                    className="flex-1 text-sm border border-indigo-200 bg-white text-slate-900 rounded-md px-3 py-2 focus:outline-none focus:border-indigo-400 shadow-sm"
                  />
                  <button 
                    onClick={handleAiAutoFill}
                    disabled={isAiLoading || !aiPrompt}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Целевая Аудитория</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="Кто эти люди?"
                  value={formData.targetAudience || ''}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Боли аудитории</label>
                <textarea
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none h-20 shadow-sm transition-all"
                  placeholder="Что их беспокоит?"
                  value={formData.audiencePainPoints || ''}
                  onChange={(e) => handleChange('audiencePainPoints', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-slate-800">Стиль и Тон</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Желаемый тон</label>
                {renderSuggestionChips(styleSuggestions?.tones, 'tones', 'tone')}
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="например, Остроумный, Прямой"
                  value={formData.tone || ''}
                  onChange={(e) => handleChange('tone', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ценности</label>
                {renderSuggestionChips(styleSuggestions?.values, 'values', 'values')}
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="например, Честность, Энергия"
                  value={formData.values || ''}
                  onChange={(e) => handleChange('values', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Табу (Стоп-слова)</label>
                {renderSuggestionChips(styleSuggestions?.taboos, 'taboos', 'taboos')}
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="например, Никакого мата, без политики"
                  value={formData.taboos || ''}
                  onChange={(e) => handleChange('taboos', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Назад
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                Далее <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                Завершить <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
