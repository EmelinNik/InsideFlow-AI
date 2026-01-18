
import React, { useState, useEffect } from 'react';
import { AuthorProfile, NarrativeVoice, ProductService } from '../types';
import { ArrowRight, Check, Sparkles, Loader2, Wand2, X, Package, Plus, Trash2 } from 'lucide-react';
import { suggestAudienceProfile, suggestStyleProfile } from '../services/geminiService';
import { createId } from '../utils/id';

interface OnboardingProps {
  onComplete: (profile: AuthorProfile) => void;
  onCancel?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AuthorProfile>>({
    voice: NarrativeVoice.FIRST_PERSON,
    products: []
  });
  
  // Product Input State
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [styleSuggestions, setStyleSuggestions] = useState<{ tones: string[]; values: string[]; taboos: string[] } | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Auto-fill prompt based on role or products
  useEffect(() => {
    if (step === 3 && !aiPrompt) {
        if (formData.products && formData.products.length > 0) {
            setAiPrompt(`Продаю: ${formData.products.map(p => p.name).join(', ')}`);
        } else if (formData.role) {
            setAiPrompt(formData.role);
        }
    }
  }, [step, formData.role, formData.products]);

  useEffect(() => {
    if (step === 4 && formData.role && formData.audiencePainPoints && !styleSuggestions && !isSuggestionsLoading) {
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

  const handleAddProduct = () => {
      if (!prodName || !prodDesc) return;
      const newProd: ProductService = {
          id: createId(),
          name: prodName,
          description: prodDesc,
          price: prodPrice
      };
      setFormData(prev => ({
          ...prev,
          products: [...(prev.products || []), newProd]
      }));
      setProdName('');
      setProdDesc('');
      setProdPrice('');
  };

  const handleRemoveProduct = (id: string) => {
      setFormData(prev => ({
          ...prev,
          products: (prev.products || []).filter(p => p.id !== id)
      }));
  };

  const handleAiAutoFill = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    // Construct a context string from products if available
    const productContext = formData.products?.map(p => `${p.name} (${p.description})`).join('; ');
    
    const result = await suggestAudienceProfile(aiPrompt, productContext);
    if (result.painPoints && result.goals) {
      setFormData(prev => ({
        ...prev,
        audiencePainPoints: result.painPoints,
        contentGoals: result.goals,
        targetAudience: prev.targetAudience || "Люди, которым интересны " + (productContext ? "ваши продукты" : aiPrompt)
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
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200 flex flex-col max-h-[90vh]">
        
        {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-1 hover:bg-white/10 rounded-full"
            >
                <X size={20}/>
            </button>
        )}

        <div className="bg-indigo-600 p-6 text-white text-center shrink-0">
          <h2 className="text-2xl font-bold">Настройка Профиля</h2>
          <p className="text-indigo-100 text-sm mt-1">Шаг {step} из 4</p>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="mb-6 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: IDENTITY */}
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

          {/* STEP 2: PRODUCTS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Package size={20} className="text-indigo-600"/>
                        Что вы продаете?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Добавьте ваши товары или услуги. ИИ будет использовать их при создании контента.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <input 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                        placeholder="Название (напр. Консультация)"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                    />
                    <textarea 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white h-20 resize-none"
                        placeholder="Краткое описание пользы..."
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input 
                            className="w-1/2 p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                            placeholder="Цена (необяз.)"
                            value={prodPrice}
                            onChange={(e) => setProdPrice(e.target.value)}
                        />
                        <button 
                            onClick={handleAddProduct}
                            disabled={!prodName || !prodDesc}
                            className="w-1/2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus size={14}/> Добавить
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ваш список:</label>
                    {formData.products && formData.products.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {formData.products.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm group">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{p.name}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                                    </div>
                                    <button onClick={() => handleRemoveProduct(p.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-lg">
                            Список пуст. Вы можете пропустить этот шаг, но с продуктами контент будет лучше.
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* STEP 3: AUDIENCE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-slate-800">Аудитория и цели</h3>
              
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-800 font-medium text-sm">
                  <Sparkles size={16} />
                  <span>AI Помощник</span>
                </div>
                <p className="text-xs text-indigo-600 mb-3">
                  {formData.products && formData.products.length > 0 
                    ? "Я вижу ваши продукты. Нажмите кнопку, чтобы я подобрал идеальную аудиторию под них."
                    : "Опишите вашу деятельность, и ИИ заполнит поля за вас."}
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ваша ниша или продукты..."
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

          {/* STEP 4: STYLE */}
          {step === 4 && (
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

          <div className="mt-8 flex justify-between pt-4 border-t border-slate-100">
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
            
            {step < 4 ? (
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
