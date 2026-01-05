
import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { Check, X, Star, Zap, Briefcase, Users, Layout, Shield } from 'lucide-react';

interface PricingModalProps {
  currentPlan: SubscriptionPlan;
  onClose: () => void;
  onUpgrade: (plan: SubscriptionPlan) => void;
}

const PLANS = [
  {
    id: SubscriptionPlan.FREE,
    name: 'FREE',
    title: 'Попробовать мышление',
    price: '0 ₽',
    period: '/ мес',
    description: 'Чтобы понять ценность стратегии, а не просто генерации.',
    features: [
      '1 профиль автора',
      'Онбординг (базовый)',
      '1 стратегия недели (шаблон)',
      'До 3 сценариев в месяц',
    ],
    missing: [
      'Календарь',
      'AI-Editor',
      'Visual Identity',
      'Сохранение стратегий'
    ],
    highlight: false
  },
  {
    id: SubscriptionPlan.START,
    name: 'START',
    title: 'Автор',
    price: '990 ₽',
    period: '/ мес',
    description: 'Для личных брендов и начинающих экспертов.',
    features: [
      '1 профиль автора',
      'StyleTrainer (обучение языку)',
      'До 30 сценариев в месяц',
      'Календарь на 1 неделю',
      'Платформы: Telegram, VK'
    ],
    missing: [
      'Visual Prompt Generator',
      'AI-Editor',
      'Preset-сценарии'
    ],
    highlight: false
  },
  {
    id: SubscriptionPlan.PRO,
    name: 'PRO',
    title: 'Системный контент',
    price: '2 490 ₽',
    period: '/ мес',
    description: 'Ключевой тариф для профессиональной работы.',
    features: [
      '1-2 проекта',
      'Полный IdentityProfile (Текст + Визуал)',
      'Visual Identity Generator',
      'До 120 сценариев в месяц',
      'Умная Стратегия Недели',
      'Все платформы (TG, VK, INST, Threads)',
      'Preset-сценарии (Рост, Продажи)'
    ],
    missing: [
      'AI-Editor (Агент)',
      'Командный доступ'
    ],
    highlight: true
  },
  {
    id: SubscriptionPlan.EXPERT,
    name: 'EXPERT',
    title: 'SMM-специалист',
    price: '4 990 ₽',
    period: '/ мес',
    description: 'Для тех, кто ведет клиентов и нуждается в AI-редакторе.',
    features: [
      'До 5 проектов',
      'До 300 сценариев в месяц',
      'AI-Editor (Редакторский агент)',
      'Авто-предложения публикаций',
      'Экспорт комментариев клиенту',
      'Все видео-платформы (YouTube, Shorts)'
    ],
    missing: [],
    highlight: false
  },
  {
    id: SubscriptionPlan.AGENCY,
    name: 'AGENCY',
    title: 'Поток',
    price: '9 990 ₽',
    period: '/ мес',
    description: 'Для агентств и продюсерских центров.',
    features: [
      'До 15 проектов',
      'Безлимитные стратегии',
      'Неограниченные сценарии',
      'Экспорт в DOC/PDF',
      'Приоритетная генерация'
    ],
    missing: [],
    highlight: false
  }
];

export const PricingModal: React.FC<PricingModalProps> = ({ currentPlan, onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-slate-100 flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Тарифные планы</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Люди платят не за тексты. Они платят за отсутствие хаоса и уверенность в решениях.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-8 bg-slate-50">
           <div className="flex gap-6 min-w-max md:min-w-0 md:justify-center items-stretch">
               {PLANS.map((plan) => {
                   const isCurrent = currentPlan === plan.id;
                   const isPro = plan.highlight;

                   return (
                       <div 
                         key={plan.id}
                         className={`
                            relative w-72 flex flex-col rounded-2xl border transition-all duration-300
                            ${isPro 
                                ? 'border-indigo-500 bg-white shadow-xl scale-105 z-10 ring-4 ring-indigo-500/10' 
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg'
                            }
                            ${isCurrent ? 'ring-2 ring-slate-900' : ''}
                         `}
                       >
                           {isPro && (
                               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-full shadow-lg flex items-center gap-1">
                                   <Star size={12} fill="currentColor"/> Выбор авторов
                               </div>
                           )}

                           <div className="p-6 border-b border-slate-50 flex-shrink-0">
                               <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isPro ? 'text-indigo-600' : 'text-slate-500'}`}>
                                   {plan.name}
                               </h3>
                               <div className="text-xl font-bold text-slate-900 mb-2 h-14 flex items-center">
                                   {plan.title}
                               </div>
                               <div className="flex items-baseline gap-1 mb-4">
                                   <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                                   <span className="text-slate-500 text-sm">{plan.period}</span>
                               </div>
                               <p className="text-xs text-slate-500 h-10 leading-relaxed">
                                   {plan.description}
                               </p>
                           </div>

                           <div className="p-6 flex-1 bg-slate-50/50">
                               <ul className="space-y-3 mb-6">
                                   {plan.features.map((feature, idx) => (
                                       <li key={idx} className="text-sm flex items-start gap-2.5 text-slate-700">
                                           <Check size={16} className={`flex-shrink-0 mt-0.5 ${isPro ? 'text-indigo-600' : 'text-green-600'}`} strokeWidth={3} />
                                           <span className="leading-tight">{feature}</span>
                                       </li>
                                   ))}
                                   {plan.missing.map((feature, idx) => (
                                       <li key={`miss-${idx}`} className="text-sm flex items-start gap-2.5 text-slate-400">
                                           <X size={16} className="flex-shrink-0 mt-0.5 opacity-50" />
                                           <span className="leading-tight line-through opacity-70">{feature}</span>
                                       </li>
                                   ))}
                               </ul>
                           </div>

                           <div className="p-6 mt-auto">
                               <button
                                 onClick={() => !isCurrent && onUpgrade(plan.id)}
                                 disabled={isCurrent}
                                 className={`
                                    w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm
                                    ${isCurrent 
                                        ? 'bg-slate-100 text-slate-500 cursor-default' 
                                        : isPro
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }
                                 `}
                               >
                                   {isCurrent ? 'Текущий план' : 'Перейти'}
                               </button>
                           </div>
                       </div>
                   );
               })}
           </div>
        </div>
        
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-200 rounded-b-2xl">
            Все цены указаны в рублях РФ. Тарифы можно менять в любой момент с перерасчетом остатка.
        </div>
      </div>
    </div>
  );
};
