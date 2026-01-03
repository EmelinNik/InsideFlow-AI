import React, { useState } from 'react';
import { ArrowRight, Bot, PenTool, Sparkles, LayoutDashboard, Calendar, Layers, ToggleLeft, ToggleRight, Settings, Target, CheckCircle2, Image as ImageIcon, BrainCircuit, MousePointerClick, Zap, Star, ChevronRight, PlayCircle, Wand2 } from 'lucide-react';
import { TelegramLogin } from './TelegramLogin';
import { TelegramUser } from '../types';

// ==========================================
// НАСТРОЙКИ TELEGRAM
// ==========================================
const BOT_USERNAME: string = "ScriptFlowAIbot"; 

interface LandingProps {
  onStart: () => void;
  onTelegramAuth: (user: TelegramUser) => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onTelegramAuth }) => {
  const [useDevMode, setUseDevMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 py-4 px-6 flex justify-between items-center max-w-7xl mx-auto w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
             <Bot size={20} strokeWidth={2.5} />
           </div>
           <span className="font-bold text-xl tracking-tight text-slate-900">InsideFlow AI</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
             {/* Dev Mode Toggle (Hidden on Mobile) */}
             <button 
               onClick={() => setUseDevMode(!useDevMode)}
               className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
             >
                {useDevMode ? <ToggleRight className="text-green-500" size={16}/> : <ToggleLeft className="text-slate-300" size={16}/>}
                <span>{useDevMode ? "Dev Mode" : "Live"}</span>
             </button>
             
             <button 
                onClick={onStart}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden md:block"
             >
                Демо
             </button>

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
      <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-32 relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-gradient-to-b from-indigo-50/50 via-white to-white -z-10 pointer-events-none rounded-b-[50%]" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-200/20 blur-[100px] rounded-full -z-10 animate-pulse-slow" />
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-blue-200/20 blur-[100px] rounded-full -z-10 animate-pulse-slow delay-700" />

        <div className="max-w-6xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-700 text-xs font-bold uppercase tracking-wide hover:shadow-md transition-shadow cursor-default mb-4">
            <Sparkles size={12} className="fill-indigo-600 text-indigo-600"/>
            AI Content Engine v2.0
            <span className="w-1 h-1 rounded-full bg-indigo-300 mx-1"></span>
            <span className="text-slate-500 font-medium normal-case">Релиз готов</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            AI, который пишет <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">вашим голосом</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Перестаньте звучать как робот. InsideFlow анализирует ваш стиль, планирует стратегию и генерирует вирусный контент, который невозможно отличить от авторского.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
             <div className="scale-110 shadow-xl shadow-indigo-200/50 rounded-full">
                <TelegramLogin 
                   botName={BOT_USERNAME} 
                   onAuth={onTelegramAuth}
                   useMock={useDevMode} 
                />
             </div>
             <button 
              onClick={onStart}
              className="px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
            >
              <PlayCircle size={18} className="text-slate-400" />
              Посмотреть демо
            </button>
          </div>

          {/* HERO VISUAL MOCKUP */}
          <div className="mt-16 relative max-w-5xl mx-auto perspective-1000">
             {/* Main App Window */}
             <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 rotate-x-12 transform-gpu transition-transform hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] duration-500 group">
                {/* Window Header */}
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="flex-1 text-center text-[10px] text-slate-400 font-medium">InsideFlow AI — Editor</div>
                </div>
                {/* Window Body */}
                <div className="p-6 md:p-12 grid md:grid-cols-2 gap-8 text-left bg-gradient-to-b from-white to-slate-50/50">
                    <div className="space-y-4">
                        <div className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded tracking-wider">Генерация: Шаг 1</div>
                        <h3 className="text-xl font-bold text-slate-800">Блок "Внимание" (Hook)</h3>
                        <p className="text-sm text-slate-500">Выберите лучший вариант начала, который зацепит вашу аудиторию (SaaS Founders).</p>
                        
                        <div className="space-y-3 mt-4">
                            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-400 cursor-pointer transition-colors flex gap-3 group/item">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">1</div>
                                <p className="text-xs text-slate-700 leading-relaxed">"90% стартапов умирают не из-за продукта, а из-за скучного маркетинга..."</p>
                            </div>
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm cursor-pointer relative">
                                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">AI Choice</div>
                                <div className="flex gap-3">
                                     <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                     <p className="text-xs text-slate-800 leading-relaxed font-medium">"Вы сжигаете бюджет на рекламу, потому что ваш контент звучит как Википедия. Исправим это."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block border-l border-slate-100 pl-8 relative">
                        <div className="absolute top-0 right-0 p-2 opacity-50">
                            <PenTool className="text-slate-300" />
                        </div>
                        <div className="space-y-4 font-serif text-slate-800">
                             <div className="text-2xl font-bold font-sans text-slate-900 mb-6">Как перестать сливать бюджет?</div>
                             <p>Вы сжигаете бюджет на рекламу, потому что ваш контент звучит как Википедия. Исправим это.</p>
                             <p className="text-slate-400 italic text-sm">[Здесь будет следующий блок...]</p>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Floating Elements */}
             <div className="absolute -right-12 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 rotate-6 hidden lg:block animate-float">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={16}/></div>
                     <div>
                         <div className="text-xs font-bold text-slate-800">Стиль проанализирован</div>
                         <div className="text-[10px] text-slate-500">Совпадение 98%</div>
                     </div>
                 </div>
                 <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[98%]"></div>
                 </div>
             </div>
             
             <div className="absolute -left-8 bottom-12 bg-white p-4 rounded-xl shadow-xl border border-slate-100 -rotate-3 hidden lg:block animate-float animation-delay-500">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                         <Calendar size={20} />
                     </div>
                     <div>
                         <div className="text-xs font-bold text-slate-800">План готов</div>
                         <div className="text-[10px] text-slate-500">3 поста на эту неделю</div>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- LOGOS / TRUST --- */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Идеально подходит для</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {['SaaS Founders', 'Experts', 'Coaches', 'Agencies', 'Creators'].map((item) => (
                      <span key={item} className="text-xl font-bold text-slate-600 flex items-center gap-2">
                          <Zap size={18} className="fill-slate-400 text-slate-400"/> {item}
                      </span>
                  ))}
              </div>
          </div>
      </section>

      {/* --- HOW IT WORKS (STEPS) --- */}
      <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">От хаоса к системе за 3 шага</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      InsideFlow не просто генерирует текст. Он создает вашу цифровую копию и работает по стратегии.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-12 relative">
                  {/* Connector Line */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 -z-10"></div>

                  {[
                      {
                          icon: BrainCircuit,
                          color: "indigo",
                          title: "1. Анализ Стиля",
                          desc: "Загрузите 3-5 ваших старых постов. AI выделит вашу лексику, тон, структуру предложений и табу."
                      },
                      {
                          icon: Target,
                          color: "purple",
                          title: "2. Стратегия",
                          desc: "Укажите цель (Продажи, Охват, Доверие). Алгоритм создаст контент-план с учетом психологии аудитории."
                      },
                      {
                          icon: Wand2,
                          color: "amber",
                          title: "3. Создание",
                          desc: "Генерируйте посты в режиме «Режиссера», выбирая лучшие варианты для каждого блока текста."
                      }
                  ].map((step, idx) => (
                      <div key={idx} className="relative flex flex-col items-center text-center group">
                          <div className={`w-24 h-24 rounded-2xl bg-white border-4 border-${step.color}-50 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                              <step.icon size={40} className={`text-${step.color}-600`} />
                              <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-${step.color}-600 text-white font-bold flex items-center justify-center border-4 border-white`}>
                                  {idx + 1}
                              </div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                          <p className="text-slate-600 leading-relaxed text-sm px-4">
                              {step.desc}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- DEEP DIVE FEATURES --- */}
      <section className="py-24 bg-slate-50 border-y border-slate-200 overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-32">
             
             {/* Feature 1: Strategy */}
             <div className="flex flex-col md:flex-row items-center gap-16">
                 <div className="flex-1 space-y-8">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                        <Calendar size={12} /> Умный Календарь
                     </div>
                     <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                         Стратегия, основанная на данных, <br/> <span className="text-slate-400">а не на вдохновении.</span>
                     </h2>
                     <p className="text-lg text-slate-600">
                         Забудьте про «творческий кризис». Алгоритм распределяет контент-слоты в зависимости от вашей цели и специфики платформы.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-2xl font-bold text-indigo-600 mb-1">30%</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Охват и Виральность</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-2xl font-bold text-green-600 mb-1">20%</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Продажи и Конверсия</div>
                        </div>
                     </div>

                     <ul className="space-y-4 pt-4">
                         {[
                             "Автоматический баланс целей",
                             "Учет специфики (Reels vs Longreads)",
                             "Поддержка режима '2 поста в день'"
                         ].map((item, i) => (
                             <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                 <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                     <CheckCircle2 size={14} />
                                 </div>
                                 {item}
                             </li>
                         ))}
                     </ul>
                 </div>
                 
                 {/* Visual for Strategy */}
                 <div className="flex-1 w-full relative">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-200/20 blur-[80px] rounded-full -z-10"></div>
                     <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 rotate-2 hover:rotate-0 transition-transform duration-500">
                         <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                             <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
                                 {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                                     <div key={d} className="py-3 text-center text-xs font-bold text-slate-400">{d}</div>
                                 ))}
                             </div>
                             <div className="grid grid-cols-7 h-64 bg-slate-100 gap-px border-b border-slate-200">
                                 {Array.from({length: 14}).map((_, i) => (
                                     <div key={i} className="bg-white p-1 relative group">
                                         {(i === 1 || i === 4 || i === 8 || i === 11) && (
                                             <div className={`mt-2 p-2 rounded-lg text-[10px] font-bold shadow-sm cursor-default transition-all hover:scale-105 ${
                                                 i === 1 ? 'bg-blue-100 text-blue-700' :
                                                 i === 4 ? 'bg-green-100 text-green-700' :
                                                 i === 8 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                             }`}>
                                                 <div className="flex justify-between mb-1 opacity-70">
                                                     <span>{i === 1 ? 'TG' : i === 4 ? 'INST' : 'VK'}</span>
                                                     <span>{i === 4 ? 'SALE' : 'TRUST'}</span>
                                                 </div>
                                                 <div className="w-full h-1 bg-current opacity-20 rounded mb-1"></div>
                                                 <div className="w-2/3 h-1 bg-current opacity-20 rounded"></div>
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Feature 2: Director Mode */}
             <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                 <div className="flex-1 space-y-8">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide">
                        <MousePointerClick size={12} /> Режим Режиссёра
                     </div>
                     <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                         Полный контроль <br/> <span className="text-slate-400">над каждым словом.</span>
                     </h2>
                     <p className="text-lg text-slate-600">
                         AI не пишет за вас — он пишет вместе с вами. Выбирайте лучшие варианты для хука, аргументации и призыва к действию блок за блоком.
                     </p>
                     
                     <div className="bg-white p-6 rounded-xl border-l-4 border-indigo-500 shadow-sm italic text-slate-600">
                         "Это как иметь команду копирайтеров, которые накидывают идеи, а вы, как главред, выбираете золото."
                     </div>

                     <ul className="space-y-4">
                         {[
                             "3 варианта на каждый абзац",
                             "Живое превью в Markdown",
                             "Структурные шаблоны (AIDA, PAS)"
                         ].map((item, i) => (
                             <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                 <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                     <CheckCircle2 size={14} />
                                 </div>
                                 {item}
                             </li>
                         ))}
                     </ul>
                 </div>

                 {/* Visual for Director Mode */}
                 <div className="flex-1 w-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-200/20 blur-[80px] rounded-full -z-10"></div>
                      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500 text-white max-w-md mx-auto">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                              <span className="text-xs font-bold text-slate-400 uppercase">Шаг 3/6: Инсайт</span>
                              <span className="text-xs bg-indigo-600 px-2 py-1 rounded text-white">Выбор</span>
                          </div>
                          
                          <div className="space-y-3">
                              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors opacity-60 hover:opacity-100">
                                  <div className="text-[10px] text-slate-500 mb-2">Вариант А (Логический)</div>
                                  <p className="text-sm text-slate-300">"Клиенты покупают не ваш продукт, а лучшую версию себя..."</p>
                              </div>
                              <div className="p-4 bg-indigo-900/40 border border-indigo-500 rounded-lg cursor-pointer relative shadow-lg shadow-indigo-900/20">
                                  <div className="absolute top-2 right-2 text-indigo-400"><Star size={12} fill="currentColor"/></div>
                                  <div className="text-[10px] text-indigo-300 mb-2 font-bold">Вариант B (Эмоциональный)</div>
                                  <p className="text-sm text-white font-medium">"Перестаньте продавать дрель. Начните продавать чувство гордости за ровную полку..."</p>
                              </div>
                              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors opacity-60 hover:opacity-100">
                                  <div className="text-[10px] text-slate-500 mb-2">Вариант C (Провокация)</div>
                                  <p className="text-sm text-slate-300">"Никому не нужен ваш курс. Им нужен результат, причем вчера..."</p>
                              </div>
                          </div>
                      </div>
                 </div>
             </div>

         </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-slate-900 z-0"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 z-0 opacity-80"></div>
         
         {/* Animated Grid Background */}
         <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
             <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                 Готовы стать <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Голосом своей ниши?</span>
             </h2>
             <p className="text-indigo-200 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                 Начните с бесплатного анализа вашего стиля. Это займет 2 минуты и сэкономит сотни часов в будущем.
             </p>
             
             <div className="flex flex-col items-center gap-6">
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-full pl-8 pr-2 py-2 flex items-center gap-6 border border-white/10 shadow-2xl transition-transform hover:scale-105 duration-300">
                    <span className="text-white font-bold text-sm hidden sm:block">Войти и начать</span>
                    <TelegramLogin 
                        botName={BOT_USERNAME} 
                        onAuth={onTelegramAuth}
                        useMock={useDevMode} 
                    />
                </div>
                <div className="flex items-center gap-4 text-xs text-indigo-300 font-medium opacity-80">
                    <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Без кредитной карты</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Моментальный доступ</span>
                </div>
             </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-12 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-slate-500">
                    <Bot size={14} />
                </div>
                <span className="font-bold text-slate-700">InsideFlow AI</span>
              </div>
              <div className="flex gap-8 text-sm text-slate-500">
                  <a href="#" className="hover:text-indigo-600 transition-colors">О нас</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Тарифы</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Поддержка</a>
              </div>
              <p className="text-slate-400 text-xs">
                  © {new Date().getFullYear()} InsideFlow AI. All rights reserved.
              </p>
          </div>
      </footer>

      {/* Help Modal */}
      {showHelp && !useDevMode && (
         <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-white p-5 rounded-xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
             <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Settings size={16} className="text-indigo-600"/> 
                Настройка
             </h4>
             <p className="text-xs text-slate-600 mb-3 leading-relaxed">
               Telegram требует верификации домена. Для локальной разработки переключитесь в Dev Mode.
             </p>
             <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-slate-300 hover:text-slate-600 p-1">
               &times;
             </button>
         </div>
      )}
    </div>
  );
};