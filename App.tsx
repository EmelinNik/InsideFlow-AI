
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { OnboardingGuide } from './components/OnboardingGuide';
import { StyleTrainer } from './components/StyleTrainer';
import { ContentGenerator } from './components/ContentGenerator';
import { ScriptModal } from './components/ScriptModal';
import { AuthorProfileView } from './components/AuthorProfileView';
import { ProductsView } from './components/ProductsView';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { ContentCalendar } from './components/ContentCalendar';
import { PricingModal } from './components/PricingModal';
import { Analytics } from './components/Analytics';
import { PromptSettings } from './components/PromptSettings';
import { AppState, AuthorProfile, LanguageProfile, GeneratedScript, TelegramUser, NarrativeVoice, TargetPlatform, ContentPlanItem, ContentStrategy, PostArchetype, PlanStatus, StrategyPreset, SubscriptionPlan, Project, PLAN_LIMITS, PromptKey, PlatformConfig, ArchetypeConfig, GenerationProgress, ContentGoal } from './types';
import { DEFAULT_PLATFORM_CONFIGS, DEFAULT_ARCHETYPE_CONFIGS } from './constants';
import { getSessionUserId, setSessionUserId, clearSession, saveUserData, loadUserData, clearUserData } from './services/storage';
import { History, Eye, Loader2, FolderOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const defaultAuthorProfile: AuthorProfile = {
    name: '',
    role: '',
    voice: NarrativeVoice.FIRST_PERSON,
    tone: '',
    targetAudience: '',
    audiencePainPoints: '',
    contentGoals: '',
    values: '',
    taboos: '',
    products: []
};

const createNewProject = (name: string, baseProfile?: AuthorProfile): Project => ({
    id: Date.now().toString(),
    name: name,
    createdAt: new Date().toISOString(),
    authorProfile: baseProfile ? { ...baseProfile, role: '', targetAudience: '', audiencePainPoints: '', products: [] } : { ...defaultAuthorProfile },
    languageProfile: {
        isAnalyzed: false,
        styleDescription: '',
        keywords: [],
        sentenceStructure: '',
        emotionalResonance: '',
        visualStyle: {
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
        generatePerPlatform: false,
        preset: StrategyPreset.BALANCED,
        weeklyFocus: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    customPrompts: {},
    platformConfigs: [...DEFAULT_PLATFORM_CONFIGS],
    archetypeConfigs: [...DEFAULT_ARCHETYPE_CONFIGS]
});

const initialState: AppState = {
  hasOnboarded: false,
  hasSeenGuide: false,
  isAuthenticated: false,
  authorProfile: null,
  subscriptionPlan: SubscriptionPlan.PRO,
  projects: [],
  currentProjectId: null
};

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<GeneratedScript | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  
  const [generatorConfig, setGeneratorConfig] = useState<{ topic: string; platform: string; archetype: string; description?: string } | null>(null);

  const activeProject = state.projects.find(p => p.id === state.currentProjectId) || state.projects[0];

  useEffect(() => {
    const initApp = async () => {
      const currentUserId = getSessionUserId();
      
      if (currentUserId) {
        const userData = await loadUserData(currentUserId);
        
        if (userData) {
          let projects = userData.projects || [];
          let currentProjectId = userData.currentProjectId;

          // Migration logic for old data structure or empty projects
          if (projects.length === 0 && (userData.contentPlan || userData.languageProfile)) {
              const migratedProject: Project = {
                  ...createNewProject("Мой Проект"),
                  authorProfile: userData.authorProfile || defaultAuthorProfile,
                  languageProfile: userData.languageProfile || createNewProject("Temp").languageProfile,
                  writingSamples: userData.writingSamples || [],
                  scripts: userData.scripts || [],
                  contentPlan: userData.contentPlan || [],
                  strategy: userData.strategy || createNewProject("Temp").strategy,
              };
              projects = [migratedProject];
              currentProjectId = migratedProject.id;
          } else if (projects.length === 0) {
              const defaultProj = createNewProject("Мой Первый Проект", userData.authorProfile);
              projects = [defaultProj];
              currentProjectId = defaultProj.id;
          }
          
          // Ensure configs exist and structure is correct (Object vs String array migration)
          projects = projects.map((p: any) => {
              // Basic ensuring configs exist
              let archetypes = p.archetypeConfigs || [...DEFAULT_ARCHETYPE_CONFIGS];
              
              // DEEP MIGRATION: Check if 'structure' is array of strings and convert if needed
              archetypes = archetypes.map((a: any) => {
                  if (a.structure && a.structure.length > 0 && typeof a.structure[0] === 'string') {
                      return {
                          ...a,
                          structure: a.structure.map((s: string) => ({ id: s, description: 'Инструкция по умолчанию.' }))
                      };
                  }
                  return a;
              });

              return {
                  ...p,
                  platformConfigs: p.platformConfigs || [...DEFAULT_PLATFORM_CONFIGS],
                  archetypeConfigs: archetypes,
                  // Ensure products array exists
                  authorProfile: { ...p.authorProfile, products: p.authorProfile?.products || [] }
              };
          });

          setState({
            ...initialState,
            ...userData,
            isAuthenticated: true,
            authorProfile: {
                ...userData.authorProfile!,
                telegramId: currentUserId
            },
            subscriptionPlan: userData.subscriptionPlan || SubscriptionPlan.PRO,
            projects,
            currentProjectId
          });
        } else {
          clearSession();
        }
      }
      setLoading(false);
    };

    initApp();
  }, []);

  useEffect(() => {
    if (!loading && state.isAuthenticated && state.authorProfile?.telegramId) {
       void saveUserData(state.authorProfile.telegramId, state);
    }
  }, [state, loading]);

  // Handle Guide Display
  useEffect(() => {
      if (!loading && state.isAuthenticated && !state.hasSeenGuide && !showOnboarding) {
          setShowGuide(true);
      }
  }, [loading, state.isAuthenticated, state.hasSeenGuide, showOnboarding]);

  const handleTelegramLogin = async (user: TelegramUser) => {
     setLoading(true);
     setSessionUserId(user.id);

     const existingData = await loadUserData(user.id);

     if (existingData) {
         let projects = existingData.projects || [];
         let currentProjectId = existingData.currentProjectId;
         
         if (!projects.length) {
             const def = createNewProject("Мой Проект", { ...defaultAuthorProfile, name: `${user.first_name} ${user.last_name || ''}`.trim() });
             projects = [def];
             currentProjectId = def.id;
         }
         
         // Ensure configs exist and migrate
         projects = projects.map((p: any) => {
              let archetypes = p.archetypeConfigs || [...DEFAULT_ARCHETYPE_CONFIGS];
              archetypes = archetypes.map((a: any) => {
                  if (a.structure && a.structure.length > 0 && typeof a.structure[0] === 'string') {
                      return {
                          ...a,
                          structure: a.structure.map((s: string) => ({ id: s, description: 'Инструкция по умолчанию.' }))
                      };
                  }
                  return a;
              });
              
              return {
                  ...p,
                  platformConfigs: p.platformConfigs || [...DEFAULT_PLATFORM_CONFIGS],
                  archetypeConfigs: archetypes,
                  authorProfile: { ...p.authorProfile, products: p.authorProfile?.products || [] }
              };
         });

         setState({
             ...initialState,
             ...existingData,
             isAuthenticated: true,
             authorProfile: {
                 ...existingData.authorProfile!,
                 name: existingData.authorProfile?.name || `${user.first_name} ${user.last_name || ''}`.trim(),
                 avatarUrl: user.photo_url || existingData.authorProfile?.avatarUrl,
                 telegramId: user.id
             },
             projects,
             currentProjectId
         });
         setActiveTab('dashboard');
     } else {
         const newProfile: AuthorProfile = {
            ...defaultAuthorProfile,
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            avatarUrl: user.photo_url,
            telegramId: user.id
         };

         const firstProject = createNewProject("Мой Проект", newProfile);
         firstProject.authorProfile = { ...newProfile };

         setState({
             ...initialState,
             hasOnboarded: false,
             hasSeenGuide: false, // New users see guide
             isAuthenticated: true,
             authorProfile: newProfile,
             projects: [firstProject],
             currentProjectId: firstProject.id
         });
         setActiveTab('dashboard');
     }
     setLoading(false);
  };

  const handleLogout = () => {
    clearSession();
    setState(initialState);
  };

  const handleCreateProject = (name: string) => {
      const limit = PLAN_LIMITS[state.subscriptionPlan];
      if (state.projects.length >= limit) {
          alert(`Лимит проектов для тарифа ${state.subscriptionPlan} достигнут (${limit}). Обновите тариф.`);
          return;
      }
      
      const newProj = createNewProject(name, state.authorProfile || undefined);
      
      setState(prev => ({
          ...prev,
          projects: [...prev.projects, newProj],
          currentProjectId: newProj.id
      }));
      setActiveTab('dashboard');
  };

  const handleSwitchProject = (projectId: string) => {
      setState(prev => ({ ...prev, currentProjectId: projectId }));
      setActiveTab('dashboard');
  };
  
  const handleRenameProject = (id: string, newName: string) => {
      setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === id ? { ...p, name: newName } : p)
      }));
  };

  const handleDeleteProject = (id: string) => {
      if (state.projects.length <= 1) {
          alert("Нельзя удалить единственный проект. Переименуйте его или создайте новый перед удалением.");
          return;
      }
      
      if (!confirm("Вы уверены, что хотите удалить проект? Все данные внутри (стиль, контент, календарь) будут потеряны безвозвратно.")) {
          return;
      }

      setState(prev => {
          const remainingProjects = prev.projects.filter(p => p.id !== id);
          let nextProjectId = prev.currentProjectId;

          if (prev.currentProjectId === id) {
              nextProjectId = remainingProjects[0].id;
          }

          return {
              ...prev,
              projects: remainingProjects,
              currentProjectId: nextProjectId
          };
      });
  };

  const updateActiveProject = (updater: (p: Project) => Project) => {
      if (!activeProject) return;
      
      const updatedProject = updater({ ...activeProject });
      setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === activeProject.id ? updatedProject : p)
      }));
  };

  const handleOnboardingComplete = (profile: AuthorProfile) => {
    setState(prev => ({
      ...prev,
      hasOnboarded: true,
      authorProfile: {
        ...prev.authorProfile!,
        ...profile
      }
    }));

    updateActiveProject(p => ({
        ...p,
        authorProfile: { ...p.authorProfile, ...profile }
    }));

    setShowOnboarding(false);
  };

  const handleGuideClose = () => {
      setShowGuide(false);
      setState(prev => ({ ...prev, hasSeenGuide: true }));
  };

  const handleUpdateLanguageProfile = (profile: LanguageProfile) => {
    updateActiveProject(p => ({ ...p, languageProfile: profile }));
  };

  const handleUpdateAuthorProfile = (profile: AuthorProfile) => {
    updateActiveProject(p => ({ ...p, authorProfile: profile }));
  };
  
  const handleUpdateWritingSamples = (samples: string[]) => {
    updateActiveProject(p => ({ ...p, writingSamples: samples }));
  };

  const handleScriptGenerated = (script: GeneratedScript) => {
    updateActiveProject(p => {
        let updatedPlan = p.contentPlan;
        if (updatedPlan.length > 0) {
             updatedPlan = updatedPlan.map(item => {
                if (item.topic === script.topic) {
                    return { ...item, status: PlanStatus.DONE, scriptId: script.id };
                }
                return item;
            });
        }
        return {
            ...p,
            scripts: [script, ...p.scripts],
            contentPlan: updatedPlan,
            generationProgress: undefined // Clear progress on success
        };
    });
  };

  const handleUpgradePlan = (plan: SubscriptionPlan) => {
      setState(prev => ({ ...prev, subscriptionPlan: plan }));
      setShowPricing(false);
      alert(`Тариф успешно изменен на ${plan}`);
  };

  const handleUpdateScript = (updatedScript: GeneratedScript) => {
     updateActiveProject(p => ({
         ...p,
         scripts: p.scripts.map(s => s.id === updatedScript.id ? updatedScript : s)
     }));
  };

  const handleDeleteScript = (id: string) => {
      updateActiveProject(p => ({
          ...p,
          scripts: p.scripts.filter(s => s.id !== id)
      }));
      setSelectedScript(null);
  };

  const handleScheduleScript = (script: GeneratedScript, date: string, time: string) => {
      const newItem: ContentPlanItem = {
          id: Date.now().toString(),
          date,
          time,
          topic: script.topic,
          description: '',
          rationale: 'Добавлено из готовых сценариев',
          platform: script.platform,
          archetype: 'Сценарий',
          goal: ContentGoal.AWARENESS,
          status: PlanStatus.DRAFT, // Already has content
          scriptId: script.id,
          generatedContent: script.content
      };

      updateActiveProject(p => ({
          ...p,
          contentPlan: [...p.contentPlan, newItem]
      }));
      
      setSelectedScript(null);
      alert(`Сценарий добавлен в календарь на ${new Date(date).toLocaleDateString('ru-RU')} в ${time}`);
  };

  const handleUpdatePlan = (newPlan: ContentPlanItem[]) => {
      updateActiveProject(p => ({ ...p, contentPlan: newPlan }));
  };

  const handleUpdateStrategy = (newStrategy: ContentStrategy) => {
      updateActiveProject(p => ({ ...p, strategy: newStrategy }));
  };

  const handleGenerateFromCalendar = (item: ContentPlanItem) => {
      let desc = item.description || "";
      // Inject product context if selected
      if (item.productId) {
          const prod = activeProject.authorProfile.products?.find(p => p.id === item.productId);
          if (prod) {
              desc = `[ПРОДУКТ: ${prod.name} - ${prod.description}]\n\n${desc}`;
          }
      }

      setGeneratorConfig({
          topic: item.topic,
          platform: item.platform,
          archetype: item.archetype,
          description: desc
      });
      setActiveTab('create');
  };

  const handleUpdatePrompts = (prompts: Partial<Record<PromptKey, string>>) => {
      updateActiveProject(p => ({ ...p, customPrompts: prompts }));
  };

  const handleUpdatePlatforms = (platforms: PlatformConfig[]) => {
      updateActiveProject(p => ({ ...p, platformConfigs: platforms }));
  };

  const handleUpdateArchetypes = (archetypes: ArchetypeConfig[]) => {
      updateActiveProject(p => ({ ...p, archetypeConfigs: archetypes }));
  };

  const handleUpdateGenerationProgress = (progress?: GenerationProgress) => {
      updateActiveProject(p => ({ ...p, generationProgress: progress }));
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
          </div>
      );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setShowOnboarding(false)} />;
  }

  if (!state.isAuthenticated) {
    return <Landing onStart={() => setActiveTab('dashboard')} onTelegramAuth={handleTelegramLogin} />;
  }

  const renderContent = () => {
    const projectProfile = activeProject.authorProfile || state.authorProfile || defaultAuthorProfile;

    switch (activeTab) {
      case 'calendar':
        return (
            <ContentCalendar 
                authorProfile={projectProfile}
                languageProfile={activeProject.languageProfile}
                plan={activeProject.contentPlan}
                strategy={activeProject.strategy}
                platformConfigs={activeProject.platformConfigs}
                archetypeConfigs={activeProject.archetypeConfigs}
                onUpdatePlan={handleUpdatePlan}
                onUpdateStrategy={handleUpdateStrategy}
                onGenerateContent={handleGenerateFromCalendar}
                onScriptGenerated={handleScriptGenerated}
            />
        );
      case 'analytics':
        return (
            <Analytics 
                project={activeProject}
                authorProfile={projectProfile}
                onUpdatePlan={handleUpdatePlan}
            />
        );
      case 'create':
        return (
          <ContentGenerator
            authorProfile={projectProfile}
            languageProfile={activeProject.languageProfile}
            onScriptGenerated={handleScriptGenerated}
            platformConfigs={activeProject.platformConfigs}
            archetypeConfigs={activeProject.archetypeConfigs}
            initialConfig={generatorConfig}
            persistence={activeProject.generationProgress}
            onPersistenceUpdate={handleUpdateGenerationProgress}
          />
        );
      case 'style':
        return (
          <StyleTrainer
            currentProfile={activeProject.languageProfile}
            samples={activeProject.writingSamples || []}
            onUpdateSamples={handleUpdateWritingSamples}
            onUpdateProfile={handleUpdateLanguageProfile}
          />
        );
      case 'profile':
        return (
            <AuthorProfileView 
                profile={projectProfile} 
                onUpdate={handleUpdateAuthorProfile}
                onRetakeOnboarding={() => setShowOnboarding(true)}
            />
        );
      case 'products':
        return (
            <ProductsView 
                profile={projectProfile} 
                onUpdate={handleUpdateAuthorProfile}
            />
        );
      case 'settings':
        return (
            <PromptSettings 
                customPrompts={activeProject.customPrompts}
                platformConfigs={activeProject.platformConfigs}
                archetypeConfigs={activeProject.archetypeConfigs}
                onSavePrompts={handleUpdatePrompts}
                onSavePlatforms={handleUpdatePlatforms}
                onSaveArchetypes={handleUpdateArchetypes}
            />
        );
      case 'dashboard':
      default:
        return (
          <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <FolderOpen size={16} className="text-slate-400"/>
                   <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Проект: {activeProject.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  С возвращением, {state.authorProfile?.name.split(' ')[0]}
                </h1>
                <p className="text-slate-600">
                    {activeProject.scripts.length > 0 
                        ? `В этом проекте ${activeProject.scripts.length} сценариев.` 
                        : "Проект готов к работе. Начните с обучения стиля."}
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
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Стиль проекта</h3>
                <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${activeProject.languageProfile.isAnalyzed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="font-bold text-slate-900">
                      {activeProject.languageProfile.isAnalyzed ? 'Стиль настроен' : 'Стиль не задан'}
                   </span>
                </div>
                {!activeProject.languageProfile.isAnalyzed ? (
                  <button onClick={() => setActiveTab('style')} className="text-sm text-indigo-600 font-medium mt-2 hover:underline">
                    Обучить ИИ стилю проекта &rarr;
                  </button>
                ) : (
                   <button onClick={() => setActiveTab('style')} className="text-sm text-slate-500 font-medium mt-2 hover:text-indigo-600 transition-colors">
                    Настроить параметры &rarr;
                  </button>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">План проекта</h3>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-3xl text-slate-900">
                      {activeProject.contentPlan.filter(i => i.status !== PlanStatus.DONE && (!i.metrics || i.metrics.reach === 0)).length}
                   </span>
                   <span className="text-sm text-slate-500">постов запланировано</span>
                </div>
                <button onClick={() => setActiveTab('calendar')} className="text-sm text-indigo-600 font-medium mt-2 hover:underline">
                    Открыть календарь &rarr;
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Результаты</h3>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-3xl text-slate-900">
                      {activeProject.contentPlan.filter(i => i.status === PlanStatus.DONE && i.metrics && i.metrics.reach > 0).length}
                   </span>
                   <span className="text-sm text-slate-500">проанализировано</span>
                </div>
                <button onClick={() => setActiveTab('analytics')} className="text-sm text-indigo-600 font-medium mt-2 hover:underline">
                    Смотреть статистику &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                 <History size={20} className="text-slate-400" />
                 <h3 className="font-bold text-slate-800">Последние сценарии в проекте</h3>
               </div>
               
               {activeProject.scripts.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">
                   <p>В этом проекте пока нет сценариев.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-slate-100">
                   {activeProject.scripts.slice(0, 5).map((script) => (
                     <div 
                        key={script.id} 
                        onClick={() => setSelectedScript(script)}
                        className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                     >
                        <div className="flex justify-between items-start mb-3">
                           <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{script.topic}</h4>
                           <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{script.platform}</span>
                        </div>
                        
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
      <Layout 
        activeTab={activeTab} 
        currentPlan={state.subscriptionPlan}
        projects={state.projects}
        currentProjectId={state.currentProjectId}
        onNavigate={setActiveTab} 
        onLogout={handleLogout}
        onOpenPricing={() => setShowPricing(true)}
        onSelectProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onOpenGuide={() => setShowGuide(true)}
      >
        {renderContent()}
      </Layout>
      
      <OnboardingGuide 
        isOpen={showGuide} 
        onClose={handleGuideClose}
        onNavigate={setActiveTab}
        userName={state.authorProfile?.name.split(' ')[0] || ''} 
      />

      <ScriptModal 
        script={selectedScript} 
        onClose={() => setSelectedScript(null)} 
        onUpdate={handleUpdateScript}
        onDelete={handleDeleteScript}
        onSchedule={handleScheduleScript}
      />

      {showPricing && (
          <PricingModal 
            currentPlan={state.subscriptionPlan}
            onClose={() => setShowPricing(false)}
            onUpgrade={handleUpgradePlan}
          />
      )}
    </>
  );
}

export default App;
