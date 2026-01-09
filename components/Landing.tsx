
import React, { useState } from 'react';
import { Bot, Sparkles, ToggleLeft, ToggleRight, PlayCircle, Zap, Video, Target, AlertTriangle, ChevronDown, Check, LayoutGrid, Wand2, Calendar, FileText, Fingerprint, Layers, BarChart3 } from 'lucide-react';
import { TelegramLogin } from './TelegramLogin';
import { TelegramUser, YOUTUBE_FORMATS } from '../types';

const BOT_USERNAME: string = "ScriptFlowAIbot"; 

interface LandingProps {
  onStart: () => void;
  onTelegramAuth: (user: TelegramUser) => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onTelegramAuth }) => {
  const [useDevMode, setUseDevMode] = useState(true);

  // Helper to map string icon names from types to components
  const getIcon = (name: string) => {
    switch (name) {
      case 'Zap': return <Zap size={24} />;
      case 'Video': return <Video size={24} />;
      case 'Target': return <Target size={24} />;
      case 'AlertTriangle': return <AlertTriangle size={24} />;
      default: return <Sparkles size={24} />;
    }
  };

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
      <section className="pt-28 pb-16 px-4 md:pt-44 md:pb-24 relative text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-gradient-to-b from-indigo-50/50 via-white to-white -z-10 rounded-b-[50%] blur-3xl opacity-60" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-purple-100 rounded-full blur-[100px] -z-10 opacity-40 animate-pulse" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] -z-10 opacity-40 animate-pulse delay-700" />

        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-700 text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform cursor-default">
            <Sparkles size={12} className="fill-indigo-600 text-indigo-600"/>
            AI Producer 2.0
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Ваш AI-продюсер: <br/>
            От идеи до сценария для <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">YouTube, VK и Telegram</span>
            <br/> за 5 минут
          </h1>
          
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4 font-medium">
            Персонализированный движок, который знает 15+ форматов видеоконтента и пишет вашим голосом. Забудьте о страхе чистого листа.
          </p>

          <div className="flex flex-col items-center gap-6 pt-6 w-full max-w-xs mx-auto">
             <div className="w-full">
                <TelegramLogin 
                   botName={BOT_USERNAME} 
                   onAuth={onTelegramAuth} 
                   useMock={useDevMode}
                   className="w-full py-4 text-base"
                />
             </div>
             
             <div className="flex items-center gap-6 text-xs font-semibold text-slate-400 mt-2">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-indigo-500"/> Без промптов</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Бесплатный старт</span>
             </div>
          </div>

          {/* MOCKUP */}
          <div className="mt-16 px-2 relative perspective-1000">
             <div className="bg-white rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden transform md:rotate-x-12 max-w-2xl mx-auto transition-transform hover:rotate-x-0 duration-700">
                
                {/* Mockup Header */}
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Формат:</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                            YouTube Shorts <ChevronDown size={10}/>
                        </div>
                    </div>
                    <div className="w-8"></div>
                </div>

                {/* Mockup Body */}
                <div className="p-6 md:p-10 text-left bg-gradient-to-b from-white to-slate-50/50">
                     <div className="space-y-6">
                        {/* Generated Result Mock */}
                        <div className="space-y-2">
                             <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Как масштабировать SaaS без бюджета?
                                </h3>
                                <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Готово</span>
                             </div>

                             <div className="p-4 bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-xl space-y-2">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">00:00 - 00:15 • Хук (Внимание)</span>
                                <p className="text-sm text-slate-800 font-medium">
                                    "90% стартапов умирают не из-за продукта, а из-за скучного маркетинга. Я потратил 0 рублей на рекламу и вот что вышло..."
                                </p>
                             </div>

                             <div className="p-4 bg-white border border-slate-200 rounded-xl opacity-70">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">00:15 - 00:45 • Контент</span>
                                <p className="text-sm text-slate-500">
                                    [Сценарий основной части с таймкодами и визуальными подсказками...]
                                </p>
                             </div>
                        </div>
                     </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FORMAT LIBRARY --- */}
      <section className="py-20 bg-slate-50 border-y border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Библиотека форматов</h2>
                  <p className="text-slate-500 max-w-xl mx-auto">
                      ИИ обучен на тысячах вирусных роликов и статей. Выберите формат, и система сама подберет идеальную структуру.
                  </p>
              </div>

              {/* Grid for desktop, horizontal scroll for mobile */}
              <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-8 md:pb-0 px-2 -mx-2 md:mx-0 snap-x">
                  {YOUTUBE_FORMATS.map((fmt) => (
                      <div key={fmt.id} className="min-w-[260px] md:min-w-0 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-center group">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {getIcon(fmt.iconName)}
                          </div>
                          <h3 className="font-bold text-slate-900 mb-2">{fmt.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{fmt.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- DIRECTOR MODE --- */}
      <section className="py-20 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl relative z-10">
                      <div className="space-y-2 opacity-50">
                          <div className="h-2 w-16 bg-slate-200 rounded"></div>
                          <div className="h-16 w-full bg-white border border-slate-200 rounded-xl"></div>
                      </div>
                      
                      <div className="space-y-3 relative">
                          <div className="flex justify-between">
                             <div className="h-3 w-24 bg-indigo-100 rounded"></div>
                             <div className="h-3 w-8 bg-indigo-100 rounded"></div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                              <div className="p-3 bg-white border border-indigo-200 rounded-xl shadow-sm ring-2 ring-indigo-500/10 flex gap-3">
                                  <div className="w-4 h-4 rounded-full border border-indigo-500 bg-indigo-50 flex items-center justify-center text-[8px] font-bold text-indigo-600">1</div>
                                  <div className="space-y-1 w-full">
                                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                                      <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                                  </div>
                              </div>
                              <div className="p-3 bg-white border border-slate-100 rounded-xl opacity-60">
                                   <div className="flex gap-3">
                                      <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center text-[8px]">2</div>
                                      <div className="space-y-1 w-full">
                                          <div className="h-2 w-11/12 bg-slate-100 rounded"></div>
                                          <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                                      </div>
                                   </div>
                              </div>
                          </div>
                          
                          <div className="absolute top-1/2 -right-8 text-indigo-600 animate-bounce hidden md:block">
                              <LayoutGrid size={24} />
                          </div>
                      </div>

                      <div className="space-y-2 opacity-50">
                          <div className="h-2 w-20 bg-slate-200 rounded"></div>
                          <div className="h-12 w-full bg-white border border-slate-200 rounded-xl"></div>
                      </div>
                  </div>
                  
                  <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[2rem] -z-10 blur-xl opacity-50"></div>
              </div>

              <div className="order-1 md:order-2 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Layers size={14} /> Конструктор смыслов
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                      Не выбирайте из одного варианта — <br className="hidden md:block"/>
                      <span className="text-indigo-600">собирайте лучшее</span>
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                      Вы не получаете «простыню» текста. Вы управляете процессом: ИИ предлагает по 3 варианта для каждой части (Хук, Тело, Призыв).
                  </p>
                  
                  <ul className="space-y-4 pt-4">
                      {[
                          'Блочная генерация: Собирайте сценарий как Lego',
                          'Ручная правка: Редактируйте любой блок "на лету"',
                          'Адаптация: YouTube-сценарий → Telegram-пост в 1 клик'
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                              <Check className="text-green-500 shrink-0" size={20} />
                              {item}
                          </li>
                      ))}
                  </ul>

                  <div className="pt-6">
                      <div className="w-fit">
                        <TelegramLogin botName={BOT_USERNAME} onAuth={onTelegramAuth} useMock={useDevMode} />
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- CALENDAR STRATEGY --- */}
      <section className="py-20 md:py-32 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Calendar size={14} /> Стратегия и Календарь
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                      Больше никаких <br/>
                      <span className="text-purple-600">«О чем писать сегодня?»</span>
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                      Умный календарь сам расставит темы на месяц вперед, учитывая ваши цели: продажи, охват или прогрев аудитории.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <Wand2 className="text-purple-600 mb-2" size={24} />
                          <h4 className="font-bold text-slate-900 mb-1">Авто-планирование</h4>
                          <p className="text-xs text-slate-500">Генерация сетки тем на месяц за 10 секунд</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <BarChart3 className="text-green-600 mb-2" size={24} />
                          <h4 className="font-bold text-slate-900 mb-1">Анализ баланса</h4>
                          <p className="text-xs text-slate-500">AI проверит, не слишком ли много продаж</p>
                      </div>
                  </div>
              </div>

              <div className="relative">
                   <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 md:p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
                       <div className="flex justify-between items-center mb-6 px-2">
                           <div className="font-bold text-lg text-slate-900">Сентябрь 2024</div>
                           <div className="flex gap-2">
                               <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">Охват</div>
                               <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase">Продажи</div>
                           </div>
                       </div>
                       <div className="grid grid-cols-4 gap-3">
                           {[...Array(8)].map((_, i) => (
                               <div key={i} className="aspect-square bg-slate-50 rounded-xl border border-slate-100 p-2 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                                   <div className="text-[10px] font-bold text-slate-300">{i + 12}</div>
                                   {i % 3 === 0 ? (
                                       <div className="h-1.5 w-full bg-green-200 rounded-full"></div>
                                   ) : i % 2 === 0 ? (
                                       <div className="h-1.5 w-2/3 bg-blue-200 rounded-full"></div>
                                   ) : (
                                       <div className="h-1.5 w-1/2 bg-slate-200 rounded-full"></div>
                                   )}
                               </div>
                           ))}
                       </div>
                       
                       <div className="absolute -bottom-4 -left-4 bg-white border border-slate-100 shadow-lg px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce-slow">
                           <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                               <Check size={16} strokeWidth={3} />
                           </div>
                           <div>
                               <div className="text-xs font-bold text-slate-900">План утвержден</div>
                               <div className="text-[10px] text-slate-500">Стратегия: Быстрый рост</div>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </section>

      {/* --- STYLE IDENTITY --- */}
      <section className="py-20 md:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider mx-auto">
                  <Fingerprint size={14} /> Style Identity
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                  Клонирование вашего стиля
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  «ИИ пишет как робот» — это миф. Загрузите 3 своих лучших поста, и алгоритм деконструирует ваш синтаксис, лексику и эмоциональные триггеры.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-8 opacity-90">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-48">
                      <FileText className="mx-auto text-slate-400 mb-2" size={24} />
                      <div className="text-xs font-bold text-slate-700">Ваши тексты</div>
                  </div>
                  <div className="text-indigo-300">
                      <Wand2 size={24} className="animate-pulse" />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-md ring-4 ring-indigo-50 w-48">
                      <Fingerprint className="mx-auto text-indigo-600 mb-2" size={24} />
                      <div className="text-xs font-bold text-indigo-700">Цифровой профиль</div>
                  </div>
              </div>

              <div className="pt-8">
                <div className="w-fit mx-auto">
                    <TelegramLogin botName={BOT_USERNAME} onAuth={onTelegramAuth} useMock={useDevMode} className="px-10" />
                </div>
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
