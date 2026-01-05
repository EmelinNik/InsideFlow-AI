
import React, { useState } from 'react';
import { Bot, Sparkles, Zap, Star, PlayCircle, Fingerprint, CalendarRange, MessageSquareQuote, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Clapperboard, LineChart, Palette, Smartphone, BrainCircuit, Layout, Layers } from 'lucide-react';
import { TelegramLogin } from './TelegramLogin';
import { TelegramUser } from '../types';

const BOT_USERNAME: string = "ScriptFlowAIbot"; 

interface LandingProps {
  onStart: () => void;
  onTelegramAuth: (user: TelegramUser) => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onTelegramAuth }) => {
  const [useDevMode, setUseDevMode] = useState(false); // Default to Live for production feel
  const [demoMode, setDemoMode] = useState<'generic' | 'personal'>('personal');

  const demoContent = {
    generic: {
      label: "Обычный ChatGPT",
      text: "Сегодня я хочу рассказать про важность планирования. Планирование помогает достигать целей. Нужно ставить задачи и выполнять их вовремя. Это ключ к успеху.",
      color: "bg-slate-100 border-slate-200 text-slate-600",
      icon: <Bot size={20} />
    },
    personal: {
      label: "Ваш AI-Двойник",
      text: "Вчера снова засиделся до 3 ночи, переписывая задачи. Знакомо? 😅 Понял одно: план — это не список дел, а способ не сойти с ума. Делюсь своей схемой, как выжить в хаосе 👇",
      color: "bg-indigo-50 border-indigo-200 text-indigo-800",
      icon: <Fingerprint size={20} />
    }
  };

  const features = [
    {
      icon: BrainCircuit,
      color: "text-indigo-600 bg-indigo-50",
      title: "Обучаемый AI-профиль",
      description: "Забудьте про промпты. Загрузите 5 своих лучших постов, и система проанализирует ваш синтаксис, юмор, слова-паразиты и ритм речи. AI станет вашим цифровым двойником."
    },
    {
      icon: CalendarRange,
      color: "text-purple-600 bg-purple-50",
      title: "Стратегический Планировщик",
      description: "Не просто календарь, а умная стратегия. Выберите цель (Прогрев / Продажи / Охват), и AI сгенерирует сетку тем на месяц вперед с учетом психологии аудитории."
    },
    {
      icon: Clapperboard,
      color: "text-pink-600 bg-pink-50",
      title: "Режим Режиссера",
      description: "Уникальный конструктор сценариев. Вместо генерации всего текста сразу, вы собираете пост по блокам (Хук, Тело, CTA), выбирая лучшие варианты из предложенных."
    },
    {
      icon: LineChart,
      color: "text-blue-600 bg-blue-50",
      title: "Умная Аналитика",
      description: "AI следит за реакцией аудитории. Если посты «на охват» перестают работать, система предложит сменить формат или тему в следующем месяце."
    },
    {
      icon: Palette,
      color: "text-amber-600 bg-amber-50",
      title: "Визуальный Арт-директор",
      description: "Система создает визуальный код вашего бренда и генерирует изображения (или ТЗ фотографу), которые идеально дополняют смысл текста."
    },
    {
      icon: Smartphone,
      color: "text-green-600 bg-green-50",
      title: "Мультиформатность",
      description: "Пишите один раз — публикуйте везде. Автоматическая адаптация глубокого поста Telegram в динамичный сценарий Reels или короткую заметку VK."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 py-4 px-6 flex justify-between items-center max-w-7xl mx-auto w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
             <Bot size={18} strokeWidth={2.5} />
           </div>
           <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:inline">Контент.Редактор</span>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="scale-90 origin-right">
                <TelegramLogin 
                    botName={BOT_USERNAME} 
                    onAuth={onTelegramAuth}
                    useMock={useDevMode} 
                />
             </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-16 px-4 md:pt-48 md:pb-32 relative text-center overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-50/80 to-transparent rounded-full blur-3xl -z-10 opacity-60" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-700 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:shadow-md transition-shadow cursor-default">
            <Sparkles size={12} className="fill-indigo-600 text-indigo-600"/>
            Первый AI, который пишет как ВЫ
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] md:leading-[1.1]">
            Перестаньте писать. <br className="hidden md:block" />
            Начните <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">Режиссировать.</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            Загрузите свои старые посты, и мы создадим вашего <strong>цифрового двойника</strong>. 
            Планируйте стратегию, а AI напишет сценарии вашим голосом, стилем и юмором.
          </p>

          <div className="flex flex-col items-center gap-6 pt-6 w-full max-w-sm mx-auto">
             <div className="w-full transform hover:scale-105 transition-transform duration-200">
                <TelegramLogin 
                   botName={BOT_USERNAME} 
                   onAuth={onTelegramAuth} 
                   useMock={useDevMode} 
                />
             </div>
             <p className="text-[10px] text-slate-400 flex items-center gap-2">
                <ShieldCheck size={12} /> Бесплатно для старта • Данные зашифрованы
             </p>
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE DEMO (THE HOOK) --- */}
      <section className="py-12 px-4 md:px-0 bg-white">
          <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Почувствуйте разницу</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">Почему обычные нейросети не работают для личного бренда</p>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden md:grid md:grid-cols-12 max-w-4xl mx-auto">
                  {/* Controls */}
                  <div className="md:col-span-4 bg-slate-50 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 gap-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Выберите режим:</div>
                      
                      <button 
                        onClick={() => setDemoMode('generic')}
                        className={`p-4 rounded-xl text-left border transition-all duration-300 flex items-center gap-3 ${demoMode === 'generic' ? 'bg-white border-slate-300 shadow-md scale-[1.02]' : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-500'}`}
                      >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${demoMode === 'generic' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-400'}`}>
                              <Bot size={16}/>
                          </div>
                          <div>
                              <div className="font-bold text-sm">Обычный AI</div>
                              <div className="text-[10px] opacity-70">Безликий, как у всех</div>
                          </div>
                      </button>

                      <button 
                        onClick={() => setDemoMode('personal')}
                        className={`p-4 rounded-xl text-left border transition-all duration-300 flex items-center gap-3 ${demoMode === 'personal' ? 'bg-white border-indigo-300 shadow-md scale-[1.02] relative z-10' : 'bg-transparent border-transparent hover:bg-indigo-50 text-slate-500'}`}
                      >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${demoMode === 'personal' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-400'}`}>
                              <Fingerprint size={16}/>
                          </div>
                          <div>
                              <div className="font-bold text-sm">Ваш Двойник</div>
                              <div className="text-[10px] opacity-70">Ваш стиль, ваш вайб</div>
                          </div>
                          {demoMode === 'personal' && <div className="absolute right-2 top-2"><Star size={10} className="text-amber-400 fill-amber-400 animate-spin-slow"/></div>}
                      </button>
                  </div>

                  {/* Preview Area */}
                  <div className="md:col-span-8 p-8 md:p-12 flex items-center justify-center bg-dots-pattern relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-white z-0"></div>
                      
                      <div className={`relative z-10 w-full max-w-md p-6 rounded-2xl border-2 transition-all duration-500 transform ${demoContent[demoMode].color} shadow-lg`}>
                          <div className="flex items-center gap-3 mb-4">
                              <div className={`p-2 rounded-lg bg-white/50 backdrop-blur`}>
                                  {demoContent[demoMode].icon}
                              </div>
                              <div className="font-bold text-sm uppercase tracking-wide opacity-80">
                                  {demoContent[demoMode].label}
                              </div>
                          </div>
                          <div className="text-base md:text-lg leading-relaxed font-medium">
                              "{demoContent[demoMode].text}"
                          </div>
                          <div className="mt-4 flex gap-2">
                               <div className="h-2 w-16 bg-current opacity-10 rounded-full"></div>
                               <div className="h-2 w-8 bg-current opacity-10 rounded-full"></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- NEW: DETAILED FEATURES GRID --- */}
      <section className="py-20 bg-slate-50 px-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Layers size={12} className="text-indigo-500 fill-indigo-500"/>
                    Экосистема возможностей
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Всё для креатора в одном окне
               </h2>
               <p className="text-lg text-slate-600 leading-relaxed">
                  Мы заменили хаос из заметок, Google-таблиц и чатов с GPT на профессиональную систему управления контентом.
               </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {features.map((feature, idx) => (
                   <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 group">
                       <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                           <feature.icon size={28} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                       <p className="text-sm text-slate-500 leading-relaxed">
                           {feature.description}
                       </p>
                   </div>
               ))}
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Simplified) --- */}
      <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">От хаоса к системе за 3 шага</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 -z-10"></div>

                  {[
                      { 
                          title: "1. Обучение", 
                          text: "За 5 минут AI анализирует ваши тексты и создает уникальный языковой профиль.",
                          badge: "Старт"
                      },
                      { 
                          title: "2. Стратегия", 
                          text: "AI формирует контент-план под ваши бизнес-цели на неделю или месяц вперед.",
                          badge: "Планирование"
                      },
                      { 
                          title: "3. Режиссура", 
                          text: "Вы собираете посты из готовых смысловых блоков, а не пишете с нуля.",
                          badge: "Публикация"
                      }
                  ].map((step, i) => (
                      <div key={i} className="text-center relative group">
                          <div className="w-16 h-16 mx-auto bg-slate-50 border-4 border-white shadow-lg rounded-full flex items-center justify-center text-xl font-bold text-slate-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                              {i + 1}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- VALUE PROPS / METRICS --- */}
      <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-50"></div>
              
              <div className="relative z-10">
                  <h2 className="text-2xl md:text-4xl font-bold mb-6">Ваш личный SMM-отдел на AI</h2>
                  <p className="text-indigo-200 mb-10 max-w-xl mx-auto text-sm md:text-base">
                      Наши пользователи тратят на контент 30 минут в неделю вместо 10 часов. 
                      И получают охваты выше, потому что пишут регулярно и со смыслом.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-indigo-800/50">
                      {[
                          { val: "10x", label: "Быстрее" },
                          { val: "100%", label: "Ваш стиль" },
                          { val: "24/7", label: "Идеи" },
                          { val: "TOP", label: "Качество" }
                      ].map((stat, i) => (
                          <div key={i} className="flex flex-col items-center">
                              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.val}</div>
                              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">{stat.label}</div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-12">
                      <div className="inline-block bg-white p-1 rounded-full pr-6">
                         <TelegramLogin 
                            botName={BOT_USERNAME} 
                            onAuth={onTelegramAuth} 
                            useMock={useDevMode} 
                         />
                      </div>
                      <p className="mt-4 text-xs text-indigo-300 opacity-60">
                          Не требуется кредитная карта
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                    <Bot size={14} />
                </div>
                <span className="text-sm font-bold text-slate-900">Контент.Редактор</span>
              </div>
              
              <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider items-center">
                  <a href="https://vk.com/emelin.nikita" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Поддержка</a>
                  <span className="cursor-default text-slate-300">v3.0.0</span>
                  <button 
                    onClick={() => setUseDevMode(!useDevMode)}
                    className="ml-4 px-2 py-1 bg-slate-50 rounded text-[9px] text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {useDevMode ? "Dev Mode: ON" : "Live"}
                  </button>
              </div>
              
              <p className="text-[10px] text-slate-300">
                  © 2026 InsideFlow AI
              </p>
          </div>
      </footer>

      {/* CSS Utility for dots pattern */}
      <style>{`
        .bg-dots-pattern {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
