
import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, Play } from 'lucide-react';

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  userName: string;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isOpen, onClose, onNavigate, userName }) => {
  const [step, setStep] = useState(0);

  // Reset step when opened
  useEffect(() => {
    if (isOpen) {
        setStep(0);
    }
  }, [isOpen]);

  // Handle navigation side-effects when step changes
  useEffect(() => {
      if (!isOpen) return;
      
      const current = STEPS[step];
      if (current.targetTab) {
          onNavigate(current.targetTab);
      }
  }, [step, isOpen, onNavigate]);

  if (!isOpen) return null;

  const STEPS = [
    {
      id: 'welcome',
      targetTab: 'dashboard',
      title: `Привет, ${userName}! 👋`,
      description: 'Я — ваш AI-продюсер. Давайте я быстро покажу, как превратить хаос в системный блог за 4 шага.',
      actionLabel: 'Поехали!',
      position: 'center'
    },
    {
      id: 'profile',
      targetTab: 'profile',
      title: 'Шаг 1: Фундамент Бренда',
      description: 'Здесь живет "мозг" проекта. Заполните описание и продукты один раз, и ИИ будет использовать эти смыслы во всех постах. Нажмите "Анализ", чтобы ИИ сам нашел боли вашей ЦА.',
      actionLabel: 'Понятно, дальше',
      position: 'bottom-right'
    },
    {
      id: 'style',
      targetTab: 'style',
      title: 'Шаг 2: Ваш Уникальный Голос',
      description: 'Самое важное: загрузите сюда свои старые тексты. ИИ проанализирует их и научится писать так, как пишете ВЫ. Здесь же настраивается визуальный стиль (цвета, эстетика).',
      actionLabel: 'Круто, дальше',
      position: 'bottom-right'
    },
    {
      id: 'plan',
      targetTab: 'calendar',
      title: 'Шаг 3: Стратегия',
      description: 'Забудьте про "о чем писать сегодня". В этом разделе вы выбираете стратегию (например, Продажи), и ИИ генерирует сетку тем на месяц вперед под каждую соцсеть.',
      actionLabel: 'Ясно, дальше',
      position: 'bottom-right'
    },
    {
      id: 'create',
      targetTab: 'create',
      title: 'Шаг 4: Режим Режиссёра',
      description: 'Магия происходит здесь. Вы не пишете с нуля — вы собираете пост как конструктор из лучших вариантов, которые предлагает ИИ. Это в 5 раз быстрее обычного копирайтинга.',
      actionLabel: 'Супер, дальше',
      position: 'bottom-right'
    },
    {
      id: 'analytics',
      targetTab: 'analytics',
      title: 'Финал: Обучение на результатах',
      description: 'Вносите цифры (охваты, лайки) после публикации. ИИ проанализирует, что "залетело", и скорректирует стратегию на следующий месяц. Это замыкает цикл роста.',
      actionLabel: 'Начать работу 🚀',
      position: 'bottom-right'
    }
  ];

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isWelcome = step === 0;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-end md:justify-end">
      
      {/* 
         BACKDROP LOGIC:
         Only show the dimmed/blurred backdrop for the Welcome step (step 0).
         For other steps, remove it completely so the user can clearly see the UI.
      */}
      {isWelcome && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" />
      )}

      {/* Card Container - Positioned logic */}
      <div className={`
          relative z-50 w-full p-4 transition-all duration-500 ease-in-out flex
          ${isWelcome ? 'items-center justify-center h-full' : 'items-end justify-center md:justify-end md:pb-8 md:pr-8'}
      `}>
        
        <div className={`
            bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative animate-in zoom-in-95 duration-300
            ${isWelcome ? 'border-none' : 'border border-indigo-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'}
        `}>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Шаг {step + 1} из {STEPS.length}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                    {currentStep.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {currentStep.description}
                </p>

                <div className="flex gap-3 items-center mt-auto">
                    {step > 0 && (
                         <button 
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Назад
                        </button>
                    )}
                    <button 
                        onClick={handleNext}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                    >
                        {currentStep.actionLabel}
                        {!isLastStep && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        {isLastStep && <Check size={16} />}
                    </button>
                </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-bl-[100px] -z-10 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};
