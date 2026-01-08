
export enum TargetPlatform {
  YOUTUBE = 'YouTube / Rutube',
  VK_POST = 'ВКонтакте (Текст / Статьи)',
  TELEGRAM = 'Telegram (Канал)',
  INSTAGRAM = 'Instagram (Reels + Текст)',
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
  EXPERT = 'Экспертный разбор'
}

export const PLATFORM_COMPATIBILITY: Record<TargetPlatform, PostArchetype[]> = {
  [TargetPlatform.YOUTUBE]: [PostArchetype.EXPERT, PostArchetype.STORY, PostArchetype.ERROR_ANALYSIS, PostArchetype.OBSERVATION, PostArchetype.PERSONAL_XP],
  [TargetPlatform.TELEGRAM]: Object.values(PostArchetype),
  [TargetPlatform.VK_POST]: [PostArchetype.EXPERT, PostArchetype.SHORT_POST, PostArchetype.STORY, PostArchetype.ERROR_ANALYSIS, PostArchetype.OBSERVATION, PostArchetype.SUMMARY],
  [TargetPlatform.INSTAGRAM]: [PostArchetype.STORY, PostArchetype.PERSONAL_XP, PostArchetype.DAY_IN_LIFE, PostArchetype.PROVOCATION, PostArchetype.OBSERVATION, PostArchetype.SHORT_ADVICE],
  [TargetPlatform.THREADS]: [PostArchetype.SHORT_POST, PostArchetype.REFLECTION, PostArchetype.NOTE, PostArchetype.PROVOCATION, PostArchetype.QUESTION, PostArchetype.OBSERVATION]
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
  description: string; // Russian TZ
  aiPrompt?: string; // English Prompt
  imageUrl?: string; // Generated URL (mock)
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

export interface ContentPlanItem {
  id: string;
  date: string;
  topic: string;
  description?: string;
  rationale: string;
  platform: TargetPlatform;
  archetype: PostArchetype;
  goal: ContentGoal;
  status: PlanStatus;
  scriptId?: string;
  mediaSuggestion?: MediaSuggestion;
  generatedContent?: string;
  metrics?: ContentMetrics;
}

export interface ContentStrategy {
  platforms: TargetPlatform[];
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
