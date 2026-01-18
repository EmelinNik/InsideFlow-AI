
export enum TargetPlatform {
  YOUTUBE = 'YouTube / Rutube',
  VK_POST = 'ВКонтакте (Текст / Статьи)',
  TELEGRAM = 'Telegram (Канал)',
  INSTAGRAM = 'Instagram (Reels + Текст)',
  THREADS = 'Threads'
}

export type PlatformName = TargetPlatform | (string & {});

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
  EXPERT = 'Экспертный разбор'
}

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
  imageUrl?: string; 
}

export interface ProjectPersona {
  name: string;
  age: string;
  role: string;
  goal: string;
  whyBuy: string;
}

export interface StrategicAnalysis {
  attraction: string;
  sales: string;
  brand: string;
}

export interface ProductService {
  id: string;
  name: string;
  description: string;
  price?: string;
}

export interface ContentPlanItem {
  id: string;
  date: string;
  time?: string;
  topic: string;
  description?: string;
  rationale: string;
  platform: PlatformName;
  archetype: string; 
  goal: ContentGoal;
  status: PlanStatus;
  scriptId?: string;
  mediaSuggestion?: MediaSuggestion;
  generatedContent?: string;
  metrics?: ContentMetrics;
  productId?: string; // Link to specific product
}

export interface ContentStrategy {
  platforms: PlatformName[]; 
  postsPerWeek: number;
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
  personas?: ProjectPersona[];
  strategyAnalysis?: StrategicAnalysis;
  products?: ProductService[];
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
  platform: string;
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

export type PromptKey = 'analyze_identity' | 'generate_plan' | 'generate_unit_options' | 'analyze_calendar' | 'generate_visual';

export interface PlatformConfig {
  id: string;
  name: string;
  rules: string;
  isSystem: boolean;
}

export interface ArchetypeStep {
  id: string;
  description: string;
  type?: 'text' | 'question'; // Support for interactive flows
}

export interface ArchetypeConfig {
  id: string;
  name: string;
  structure: ArchetypeStep[];
  isSystem: boolean;
}

export interface GenerationProgress {
  topic: string;
  description: string;
  platform: string;
  archetype: string;
  status: 'idle' | 'loading' | 'selecting' | 'finished' | 'answering';
  unitSequence: string[];
  currentUnitIndex: number;
  assembledUnits: Record<string, string>;
  activeQuestion?: string; // If the AI asked something
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
  customPrompts?: Partial<Record<PromptKey, string>>;
  platformConfigs: PlatformConfig[];
  archetypeConfigs: ArchetypeConfig[];
  generationProgress?: GenerationProgress;
}

export interface AppState {
  hasOnboarded: boolean;
  hasSeenGuide: boolean;
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

// Added YOUTUBE_FORMATS constant as it was missing and required by Landing.tsx
export const YOUTUBE_FORMATS = [
  {
    id: 'shorts',
    title: 'Shorts / Reels',
    desc: 'Динамичные вертикальные ролики до 60 секунд. Максимальное удержание и охват.',
    iconName: 'Video'
  },
  {
    id: 'expert',
    title: 'Экспертное видео',
    desc: 'Глубокий разбор темы, туториалы или интервью. Работа на лояльность и статус.',
    iconName: 'Zap'
  },
  {
    id: 'story',
    title: 'Сторителлинг',
    desc: 'Личные истории с выводами. Идеально для формирования доверия.',
    iconName: 'Target'
  },
  {
    id: 'error',
    title: 'Разбор ошибок',
    desc: 'Анализ провалов или частых заблуждений в нише. Высокая виральность.',
    iconName: 'AlertTriangle'
  }
];
