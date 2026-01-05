
export enum TargetPlatform {
  YOUTUBE = 'YouTube / Rutube',
  VK_POST = 'ВКонтакте (Пост / Лонгрид)',
  TELEGRAM = 'Telegram (Канал)',
  INSTAGRAM = 'Instagram (Reels + Текст)',
  VK_SHORTS = 'VK Клипы / Shorts (Вертикальные)',
  THREADS = 'Threads'
}

export enum PostArchetype {
  SHORT_POST = 'Короткий пост',
  REFLECTION = 'Размышление',
  NOTE = 'Заметка',
  PERSONAL_XP = 'Личный опыт',
  DAY_IN_LIFE = 'День из жизни',
  QUESTION = 'Вопрос к аудитории',
  PROVOCATION = 'Провокация',
  OBSERVATION = 'Наблюдение',
  ERROR_ANALYSIS = 'Разбор ошибки',
  SHORT_ADVICE = 'Короткий совет',
  SUMMARY = 'Итоги (Дня/Недели)',
  STORY = 'История / Сторителлинг',
  EXPERT = 'Экспертный разбор',
  // New types based on AI generation
  POLL = 'Интерактив / Опрос',
  LIST = 'Подборка / Чек-лист',
  CASE_STUDY = 'Кейс-стади'
}

export const PLATFORM_COMPATIBILITY: Record<TargetPlatform, PostArchetype[]> = {
  [TargetPlatform.YOUTUBE]: [PostArchetype.EXPERT, PostArchetype.STORY, PostArchetype.ERROR_ANALYSIS, PostArchetype.OBSERVATION, PostArchetype.PERSONAL_XP, PostArchetype.CASE_STUDY, PostArchetype.LIST],
  [TargetPlatform.TELEGRAM]: Object.values(PostArchetype),
  [TargetPlatform.VK_POST]: [PostArchetype.EXPERT, PostArchetype.SHORT_POST, PostArchetype.STORY, PostArchetype.ERROR_ANALYSIS, PostArchetype.OBSERVATION, PostArchetype.SUMMARY, PostArchetype.LIST, PostArchetype.CASE_STUDY, PostArchetype.POLL],
  [TargetPlatform.INSTAGRAM]: [PostArchetype.STORY, PostArchetype.PERSONAL_XP, PostArchetype.DAY_IN_LIFE, PostArchetype.PROVOCATION, PostArchetype.OBSERVATION, PostArchetype.SHORT_ADVICE, PostArchetype.LIST],
  [TargetPlatform.VK_SHORTS]: [PostArchetype.STORY, PostArchetype.PERSONAL_XP, PostArchetype.DAY_IN_LIFE, PostArchetype.PROVOCATION, PostArchetype.OBSERVATION, PostArchetype.SHORT_ADVICE],
  [TargetPlatform.THREADS]: [PostArchetype.SHORT_POST, PostArchetype.REFLECTION, PostArchetype.NOTE, PostArchetype.PROVOCATION, PostArchetype.QUESTION, PostArchetype.OBSERVATION, PostArchetype.LIST]
};

export enum ContentGoal {
  AWARENESS = 'Охват / Привлечение (40%)',
  TRUST = 'Доверие / Экспертность (30%)',
  RETENTION = 'Удержание / Лояльность (20%)',
  CONVERSION = 'Продажа / Действие (10%)'
}

export enum PlanStatus {
  IDEA = 'idea',       
  DRAFT = 'draft',     
  DONE = 'done'
}

export interface ContentMetrics {
  reach: number;
  likes: number;
  reposts: number;
  comments: number;
}

export interface PlatformBenchmark {
  reach: number;
  likes: number;
  reposts: number;
  comments: number;
}

// Industry averages for benchmarks (defaults)
export const DEFAULT_BENCHMARKS: Record<TargetPlatform, PlatformBenchmark> = {
  [TargetPlatform.TELEGRAM]: { reach: 500, likes: 25, comments: 5, reposts: 3 }, // ~6.6% ER
  [TargetPlatform.VK_POST]: { reach: 1000, likes: 15, comments: 3, reposts: 2 }, // ~2% ER
  [TargetPlatform.INSTAGRAM]: { reach: 800, likes: 40, comments: 5, reposts: 2 }, // ~5.8% ER
  [TargetPlatform.YOUTUBE]: { reach: 1000, likes: 50, comments: 10, reposts: 0 }, // ~6% ER
  [TargetPlatform.VK_SHORTS]: { reach: 1500, likes: 45, comments: 3, reposts: 5 }, // ~3.5% ER
  [TargetPlatform.THREADS]: { reach: 300, likes: 15, comments: 3, reposts: 1 } // ~6.3% ER
};

export enum StrategyPreset {
  BALANCED = 'Баланс (Удержание + Охват)',
  GROWTH = 'Быстрый рост (Охват)',
  SALES = 'Активные продажи (Конверсия)',
  AUTHORITY = 'Личный бренд (Доверие)',
  LAUNCH = 'Запуск продукта (Прогрев)'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  START = 'START',
  PRO = 'PRO',
  EXPERT = 'EXPERT',
  AGENCY = 'AGENCY'
}

export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE]: 1,
  [SubscriptionPlan.START]: 1,
  [SubscriptionPlan.PRO]: 2,
  [SubscriptionPlan.EXPERT]: 5,
  [SubscriptionPlan.AGENCY]: 15
};

export interface MediaSuggestion {
  type: 'photo' | 'ai_image' | 'video';
  description: string;
  aiPrompt?: string;
  generatedImageUrl?: string;
}

export interface ContentPlanItem {
  id: string;
  date: string;
  topic: string;
  description?: string; // New field for facts/context
  rationale: string;
  platform: TargetPlatform;
  archetype: PostArchetype;
  goal: ContentGoal;
  status: PlanStatus;
  scriptId?: string;
  mediaSuggestion?: MediaSuggestion;
  generatedContent?: string;
  metrics?: ContentMetrics; // New field
}

export interface ContentStrategy {
  platforms: TargetPlatform[];
  postsCount: number; // Changed from postsPerWeek to explicit total count for the period
  personalizePerPlatform: boolean; 
  generatePerPlatform: boolean;
  preset: StrategyPreset;
  weeklyFocus: string;
  startDate: string;
  endDate: string;
}

export enum NarrativeVoice {
  FIRST_PERSON = 'От первого лица (Я)',
  PLURAL = 'От лица команды (Мы)',
  NEUTRAL = 'Нейтральный / Объективный'
}

export interface AuthorProfile {
  name: string;
  role: string;
  voice: NarrativeVoice;
  tone: string;
  targetAudience: string;
  audiencePainPoints: string;
  contentGoals: string;
  values: string;
  taboos: string;
  avatarUrl?: string;
  telegramId?: number;
}

export interface LanguageProfile {
  isAnalyzed: boolean;
  styleDescription: string;
  keywords: string[];
  sentenceStructure: string;
  emotionalResonance: string;
  visualStyle?: {
    isDefined: boolean;
    aesthetic: string;
    colors: string;
    composition: string;
    elements: string;
  }
}

export interface GeneratedScript {
  id: string;
  topic: string;
  platform: TargetPlatform;
  content: string;
  createdAt: string;
}

export interface GeneratedOption {
  text: string;
  isBest: boolean;
  reasoning: string;
}

export interface CalendarAnalysis {
  status: 'good' | 'normal' | 'bad';
  report: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  authorProfile: AuthorProfile; 
  languageProfile: LanguageProfile;
  writingSamples: string[];
  scripts: GeneratedScript[];
  contentPlan: ContentPlanItem[];
  strategy: ContentStrategy;
  prompts?: Record<string, string>; // NEW: Custom prompt overrides
  benchmarks?: Partial<Record<TargetPlatform, PlatformBenchmark>>; // NEW: User defined KPIs
}

export interface AppState {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  authorProfile: AuthorProfile | null; 
  subscriptionPlan: SubscriptionPlan;
  projects: Project[];
  currentProjectId: string | null;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// --- PROMPT MANAGEMENT TYPES ---
export enum PromptKey {
  // Core
  PLAN_GENERATION = 'PLAN_GENERATION',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  STYLE_ANALYSIS = 'STYLE_ANALYSIS',
  AUDIENCE_INSIGHTS = 'AUDIENCE_INSIGHTS',
  VISUAL_DIRECTOR = 'VISUAL_DIRECTOR',
  CALENDAR_ANALYSIS = 'CALENDAR_ANALYSIS',

  // Platforms
  PLATFORM_TELEGRAM = 'PLATFORM_TELEGRAM',
  PLATFORM_VK = 'PLATFORM_VK',
  PLATFORM_YOUTUBE = 'PLATFORM_YOUTUBE',
  PLATFORM_INSTAGRAM = 'PLATFORM_INSTAGRAM',
  PLATFORM_THREADS = 'PLATFORM_THREADS',

  // Formats (Archetypes)
  FORMAT_SHORT = 'FORMAT_SHORT',
  FORMAT_REFLECTION = 'FORMAT_REFLECTION',
  FORMAT_NOTE = 'FORMAT_NOTE',
  FORMAT_PERSONAL_XP = 'FORMAT_PERSONAL_XP',
  FORMAT_DAY_IN_LIFE = 'FORMAT_DAY_IN_LIFE',
  FORMAT_QUESTION = 'FORMAT_QUESTION',
  FORMAT_PROVOCATION = 'FORMAT_PROVOCATION',
  FORMAT_OBSERVATION = 'FORMAT_OBSERVATION',
  FORMAT_ERROR_ANALYSIS = 'FORMAT_ERROR_ANALYSIS',
  FORMAT_SHORT_ADVICE = 'FORMAT_SHORT_ADVICE',
  FORMAT_SUMMARY = 'FORMAT_SUMMARY',
  FORMAT_STORY = 'FORMAT_STORY',
  FORMAT_EXPERT = 'FORMAT_EXPERT',
  
  // New Formats
  FORMAT_POLL = 'FORMAT_POLL',
  FORMAT_LIST = 'FORMAT_LIST',
  FORMAT_CASE_STUDY = 'FORMAT_CASE_STUDY',
  
  FORMAT_GENERIC = 'FORMAT_GENERIC'
}

export interface PromptVariable {
  key: string;
  description: string;
}
