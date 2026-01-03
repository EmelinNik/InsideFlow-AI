import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { StyleTrainer } from './components/StyleTrainer';
import { ContentGenerator } from './components/ContentGenerator';
import { ScriptModal } from './components/ScriptModal';
import { AuthorProfileView } from './components/AuthorProfileView';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { ContentCalendar } from './components/ContentCalendar';
import { AppState, AuthorProfile, LanguageProfile, GeneratedScript, TelegramUser, NarrativeVoice, TargetPlatform, ContentPlanItem, ContentStrategy, PostArchetype, PlanStatus, StrategyPreset } from './types';
import { getSessionUserId, setSessionUserId, clearSession, saveUserData, loadUserData, clearUserData } from './services/storage';
import { History, Eye, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const initialState: AppState = {
  hasOnboarded: false,
  isAuthenticated: false,
  authorProfile: null,
  languageProfile: {
    isAnalyzed: false,
    styleDescription: '',
    keywords: [],
    sentenceStructure: '',
    emotionalResonance: '',
    visualStyle: { // Initialize as empty/undefined, handled by optional check in UI
        isDefined: false,
        aesthetic: '',
        colors: '',
        composition: '',
        elements: ''
    }
  },
  writingSamples: [],
  scripts: [],
  contentPlan: [],
  strategy: {
    platforms: [TargetPlatform.TELEGRAM],
    postsPerWeek: 3,
    personalizePerPlatform: false,
    doublePostPerDay: false,
    preset: StrategyPreset.BALANCED,
    weeklyFocus: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
};

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<GeneratedScript | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // State for passing data from Calendar to Generator
  const [generatorConfig, setGeneratorConfig] = useState<{ topic: string; platform: TargetPlatform; archetype: PostArchetype } | null>(null);

  // --- INITIALIZATION ---
  // Check if a user is already logged in (Session check)
  useEffect(() => {
    const initApp = async () => {
      const currentUserId = getSessionUserId();
      
      if (currentUserId) {
        // User has an active session, load their specific data
        const userData = loadUserData(currentUserId);
        
        if (userData) {
          // Merge with initial state to ensure new fields (like strategy) exist even if old DB
          setState({
            ...initialState,
            ...userData,
            isAuthenticated: true, // Session exists implies authenticated
            authorProfile: {
                ...userData.authorProfile!,
                telegramId: currentUserId // Ensure ID consistency
            },
            // Fallback for new features if old DB data is missing
            strategy: userData.strategy ? { ...initialState.strategy, ...userData.strategy } : initialState.strategy,
            contentPlan: userData.contentPlan || [],
            languageProfile: {
                ...initialState.languageProfile,
                ...userData.languageProfile
            }
          });
        } else {
          // Edge case: Session exists but data is gone (cleared cache manually)
          clearSession();
        }
      }
      setLoading(false);
    };

    initApp();
  }, []);

  // --- PERSISTENCE ---
  // Whenever state changes (and user is logged in), save to their specific DB slot
  useEffect(() => {
    if (!loading && state.isAuthenticated && state.authorProfile?.telegramId) {
       saveUserData(state.authorProfile.telegramId, state);
    }
  }, [state, loading]);


  // --- AUTH HANDLERS ---

  const handleTelegramLogin = (user: TelegramUser) => {
     setLoading(true);
     
     // 1. Set Session
     setSessionUserId(user.id);

     // 2. Check if we have data for this user in DB
     const existingData = loadUserData(user.id);

     if (existingData) {
         // RESTORE EXISTING USER
         setState({
             ...initialState,
             ...existingData,
             isAuthenticated: true,
             // Update avatar/name in case they changed in Telegram
             authorProfile: {
                 ...existingData.authorProfile!,
                 name: existingData.authorProfile?.name || `${user.first_name} ${user.last_name || ''}`.trim(),
                 avatarUrl: user.photo_url || existingData.authorProfile?.avatarUrl,
                 telegramId: user.id
             }
         });
         setActiveTab('dashboard');
     } else {
         // CREATE NEW USER
         const newProfile: AuthorProfile = {
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            role: '', 
            voice: NarrativeVoice.FIRST_PERSON,
            tone: 'Дружелюбный, Профессиональный',
            targetAudience: '',
            audiencePainPoints: '',
            contentGoals: '',
            values: '',
            taboos: '',
            avatarUrl: user.photo_url,
            telegramId: user.id
         };

         setState({
             ...initialState,
             hasOnboarded: false, // Force onboarding for new users
             isAuthenticated: true,
             authorProfile: newProfile
         });
         setShowOnboarding(true); // Direct to onboarding
     }
     setLoading(false);
  };

  const handleLogout = () => {
    clearSession(); // Remove session cookie/key
    setState(initialState); // Clear local memory
    // Note: Data remains in `localStorage` under `scriptflow_db_{id}`
  };

  // Completely wipe data for the current user
  const handleResetProfile = () => {
    if (state.authorProfile?.telegramId) {
        clearUserData(state.authorProfile.telegramId);
        clearSession();
    }
    setState(initialState);
    setShowOnboarding(true);
  };

  // --- APP LOGIC HANDLERS ---

  const handleOnboardingComplete = (profile: AuthorProfile) => {
    setState(prev => ({
      ...prev,
      hasOnboarded: true,
      authorProfile: {
        ...prev.authorProfile!,
        ...profile
      }
    }));
    setShowOnboarding(false);
    setActiveTab('style');
  };

  const handleUpdateLanguageProfile = (profile: LanguageProfile) => {
    setState(prev => ({ ...prev, languageProfile: profile }));
  };

  const handleUpdateAuthorProfile = (profile: AuthorProfile) => {
    setState(prev => ({ ...prev, authorProfile: profile }));
  };
  
  const handleUpdateWritingSamples = (samples: string[]) => {
      setState(prev => ({ ...prev, writingSamples: samples }));
  };

  const handleScriptGenerated = (script: GeneratedScript) => {
    setState(prev => ({ ...prev, scripts: [script, ...prev.scripts] }));
    
    // Update plan item if this script was generated from the calendar
    // (This matches simply by Topic for now, ideally use IDs if we passed Plan ID)
    if (state.contentPlan.length > 0) {
        const updatedPlan = state.contentPlan.map(item => {
            if (item.topic === script.topic) {
                return { ...item, status: PlanStatus.DONE, scriptId: script.id };
            }
            return item;
        });
        setState(prev => ({ ...prev, contentPlan: updatedPlan }));
    }
  };

  // --- SCRIPT CRUD ---
  
  const handleUpdateScript = (updatedScript: GeneratedScript) => {
     setState(prev => ({
         ...prev,
         scripts: prev.scripts.map(s => s.id === updatedScript.id ? updatedScript : s)
     }));
     // Also update in calendar if linked? For now, we keep them separate entities once generated
  };

  const handleDeleteScript = (id: string) => {
      setState(prev => ({
          ...prev,
          scripts: prev.scripts.filter(s => s.id !== id)
      }));
      setSelectedScript(null);
  };

  // --- CALENDAR HANDLERS ---

  const handleUpdatePlan = (newPlan: ContentPlanItem[]) => {
      setState(prev => ({ ...prev, contentPlan: newPlan }));
  };

  const handleUpdateStrategy = (newStrategy: ContentStrategy) => {
      setState(prev => ({ ...prev, strategy: newStrategy }));
  };

  const handleGenerateFromCalendar = (item: ContentPlanItem) => {
      setGeneratorConfig({
          topic: item.topic,
          platform: item.platform,
          archetype: item.archetype
      });
      setActiveTab('create');
  };


  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
          </div>
      );
  }

  // ROUTING LOGIC

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!state.isAuthenticated) {
    // If we have a stored profile in memory but not auth (shouldn't happen with new logic, but safe fallback)
    // or simply standard landing page
    return <Landing onStart={() => setShowOnboarding(true)} onTelegramAuth={handleTelegramLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
            <ContentCalendar 
                authorProfile={state.authorProfile!}
                languageProfile={state.languageProfile!}
                plan={state.contentPlan}
                strategy={state.strategy}
                onUpdatePlan={handleUpdatePlan}
                onUpdateStrategy={handleUpdateStrategy}
                onGenerateContent={handleGenerateFromCalendar}
                onScriptGenerated={handleScriptGenerated}
            />
        );
      case 'create':
        return (
          <ContentGenerator
            authorProfile={state.authorProfile!}
            languageProfile={state.languageProfile!}
            onScriptGenerated={handleScriptGenerated}
            initialConfig={generatorConfig}
          />
        );
      case 'style':
        return (
          <StyleTrainer
            currentProfile={state.languageProfile}
            samples={state.writingSamples || []}
            onUpdateSamples={handleUpdateWritingSamples}
            onUpdateProfile={handleUpdateLanguageProfile}
          />
        );
      case 'profile':
        return (
            <AuthorProfileView 
                profile={state.authorProfile!} 
                onUpdate={handleUpdateAuthorProfile}
                onRetakeOnboarding={() => setShowOnboarding(true)}
            />
        );
      case 'dashboard':
      default:
        return (
          <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  С возвращением, {state.authorProfile?.name.split(' ')[0]}
                </h1>
                <p className="text-slate-600">
                    {state.scripts.length > 0 
                        ? `В вашей базе ${state.scripts.length} сценариев.` 
                        : "Давайте создадим ваш первый вирусный пост."}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                + Новый сценарий
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Статус стиля</h3>
                <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${state.languageProfile?.isAnalyzed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="font-bold text-slate-900">
                      {state.languageProfile?.isAnalyzed ? 'Профиль активен' : 'Требует обучения'}
                   </span>
                </div>
                {!state.languageProfile?.isAnalyzed ? (
                  <button onClick={() => setActiveTab('style')} className="text-sm text-indigo-600 font-medium mt-2 hover:underline">
                    Обучить сейчас &rarr;
                  </button>
                ) : (
                   <button onClick={() => setActiveTab('style')} className="text-sm text-slate-500 font-medium mt-2 hover:text-indigo-600 transition-colors">
                    Уточнить профиль &rarr;
                  </button>
                )}
              </div>
              
              {/* Plan Status Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Контент-План</h3>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-3xl text-slate-900">
                      {state.contentPlan.filter(i => i.status !== PlanStatus.DONE).length}
                   </span>
                   <span className="text-sm text-slate-500">постов запланировано</span>
                </div>
                <button onClick={() => setActiveTab('calendar')} className="text-sm text-indigo-600 font-medium mt-2 hover:underline">
                    Открыть календарь &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                 <History size={20} className="text-slate-400" />
                 <h3 className="font-bold text-slate-800">Последние сценарии</h3>
               </div>
               
               {state.scripts.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">
                   <p>Пока нет созданных сценариев.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-slate-100">
                   {state.scripts.map((script) => (
                     <div 
                        key={script.id} 
                        onClick={() => setSelectedScript(script)}
                        className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                     >
                        <div className="flex justify-between items-start mb-3">
                           <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{script.topic}</h4>
                           <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{script.platform}</span>
                        </div>
                        
                        {/* Markdown Preview with formatting */}
                        <div className="relative h-24 overflow-hidden mb-3">
                           <div className="prose prose-sm prose-slate max-w-none opacity-70 group-hover:opacity-100 transition-opacity">
                              <ReactMarkdown>{script.content}</ReactMarkdown>
                           </div>
                           <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white group-hover:from-slate-50 to-transparent"></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                           <span>{new Date(script.createdAt).toLocaleDateString('ru-RU')}</span>
                           <span className="flex items-center gap-1 text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={14} /> Открыть
                           </span>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout}>
        {renderContent()}
      </Layout>
      <ScriptModal 
        script={selectedScript} 
        onClose={() => setSelectedScript(null)} 
        onUpdate={handleUpdateScript}
        onDelete={handleDeleteScript}
      />
    </>
  );
}

export default App;