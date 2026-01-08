
import React, { useState } from 'react';
import { Bot, Sparkles, Target, ToggleLeft, ToggleRight, BrainCircuit, Wand2, PlayCircle, Fingerprint, CalendarRange, PenLine } from 'lucide-react';
import { TelegramLogin } from './TelegramLogin';
import { TelegramUser } from '../types';

const BOT_USERNAME: string = "ScriptFlowAIbot"; 

interface LandingProps {
  onStart: () => void;
  onTelegramAuth: (user: TelegramUser) => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onTelegramAuth }) => {
  const [useDevMode, setUseDevMode] = useState(true);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 py-3 px-4 md:px-6 flex justify-between items-center max-w-7xl mx-auto w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
             <Bot size={18} strokeWidth={2.5} />
           </div>
           <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900">Контент.Редактор</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={() => setUseDevMode(!useDevMode)}
               className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 transition-colors hover:border-slate-300"
             >
                {useDevMode ? <ToggleRight className="text-green-500" size={14}/> : <ToggleLeft className="text-slate-300" size={14}/>}
                <span>{useDevMode ? "Dev Mode" : "Production"}</span>
             </button>
             <div className="scale-75 md:scale-90 origin-right">
                <TelegramLogin 
                    botName={BOT_USERNAME} 
                    onAuth={onTelegramAuth}
                    useMock={useDevMode} 
                />
             </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-28 pb-16 px-4 md:pt-44 md:pb-36 relative text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-gradient-to-b from-indigo-50/50 via-white to-white -z-10 rounded-b-[50%] blur-3xl opacity-60" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-purple-100 rounded-full blur-[100px] -z-10 opacity-40 animate-pulse" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] -z-10 opacity-40 animate-pulse delay-700" />

        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-700 text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform cursor-default">
            <Sparkles size={12} className="fill-indigo-600 text-indigo-600"/>
            AI Producer 2.0
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Ваш личный <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI-продюсер</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4 font-medium">
            Превратите хаос в систему. Платформа анализирует ваш стиль, создает контент-стратегию и пишет сценарии, которые приносят деньги, а не просто лайки.
          </p>

          <div className="flex flex-col items-center gap-6 pt-6 w-full max-w-sm mx-auto">
             <div className="w-full shadow-2xl shadow-indigo-300/40 rounded-full hover:shadow-indigo-400/50 transition-shadow">
                <TelegramLogin 
                   botName={BOT_USERNAME} 
                   onAuth={onTelegramAuth} 
                   useMock={useDevMode} 
                />
             </div>
             
             <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-indigo-500"/> Без промптов</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Бесплатный старт</span>
             </div>
          </div>

          {/* MOCKUP (Optimized for Mobile) */}
          <div className="mt-16 px-2 relative perspective-1000">
             <div className="bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden transform md:rotate-x-12 max-w-2xl mx-auto transition-transform hover:rotate-x-0 duration-700">
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ScriptFlow AI</div>
                </div>
                <div className="p-6 md:p-10 text-left grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="inline-block px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold uppercase rounded-md tracking-wide">Результат генерации</div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            Как масштабировать SaaS без бюджета?
                        </h3>
                        <div className="space-y-2">
                             <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs leading-relaxed text-slate-700 font-medium">
                                <span className="text-indigo-600 font-bold block mb-1 uppercase text-[9px]">Хук (Внимание)</span>
                                "90% стартапов умирают не из-за продукта, а из-за скучного маркетинга. Я потратил 0 рублей на рекламу и вот что вышло..."
                            </div>
                            <div className="p-3 bg-white border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-400">
                                <span className="text-slate-400 font-bold block mb-1 uppercase text-[9px]">Тело поста</span>
                                [Сгенерированный контент скрыт...]
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block border-l border-slate-100 pl-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><BrainCircuit size={16}/></div>
                            <div className="text-xs font-bold text-slate-700">Анализ стиля: <span className="text-green-600">Завершен</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Target size={16}/></div>
                            <div className="text-xs font-bold text-slate-700">Цель: <span className="text-purple-600">Продажи (40%)</span></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic leading-relaxed">
                            "ИИ использовал ваши кейсы и добавил провокационный заголовок, как вы любите."
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-20 md:py-32 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Больше, чем просто ChatGPT</h2>
                  <p className="text-slate-500">
                      Мы создали систему, которая понимает контекст вашего бизнеса, а не просто генерирует текст по запросу.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                  {[
                      { 
                          icon: Fingerprint, 
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          title: "Клонирование Стиля", 
                          text: "Загрузите свои лучшие посты, и нейросеть научится писать именно вашим языком. Никто не заметит подмены." 
                      },
                      { 
                          icon: CalendarRange, 
                          color: "text-purple-600",
                          bg: "bg-purple-50",
                          title: "Стратегия 360°", 
                          text: "ИИ не просто пишет посты, а строит контент-план на месяц: прогревы, продажи и вирусный охват." 
                      },
                      { 
                          icon: PenLine, 
                          color: "text-indigo-600",
                          bg: "bg-indigo-50",
                          title: "Конструктор Смыслов", 
                          text: "Собирайте сценарии для Reels и статьи как конструктор. Выбирайте лучшие варианты заголовков и призывов." 
                      }
                  ].map((f, i) => (
                      <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                          <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                              <f.icon size={28} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 px-6 text-center border-t border-slate-100 bg-white">
          <div className="flex items-center justify-center gap-2 mb-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Bot size={14} />
             </div>
             <span className="font-bold text-slate-900">Контент.Редактор</span>
          </div>
          <div className="flex justify-center gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-8">
              <a href="#" className="hover:text-indigo-600 transition-colors">О сервисе</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Тарифы</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Поддержка</a>
          </div>
          <p className="text-[10px] text-slate-300">© 2024 Все права защищены</p>
      </footer>
    </div>
  );
};
    