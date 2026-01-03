export enum TargetPlatform {
  YOUTUBE_SHORT = 'YouTube / Rutube (3-10 мин)',
  YOUTUBE_MID = 'YouTube / Rutube (10-20 мин)',
  YOUTUBE_LONG = 'YouTube / Rutube (20+ мин)',
  VK_POST = 'ВКонтакте (Пост / Лонгрид)',
  TELEGRAM = 'Telegram (Канал)',
  INSTAGRAM = 'Instagram (Reels + Текст)',
  VK_SHORTS = 'VK Клипы / Shorts (Вертикальные)',
  THREADS = 'Threads'
}

export enum PostArchetype {
  EXPERT = 'Экспертный пост',
  SALES = 'Продающий пост',
  ENGAGEMENT = 'Вовлекающий пост',
  MOTIVATIONAL = 'Мотивационный пост',
  STORYTELLING = 'История / Сторителлинг',
  REPORT = 'Репортаж с мероприятия'
}

export enum ContentGoal {
  AWARENESS = 'Охват / Привлечение (40%)',
  TRUST = 'Доверие / Экспертность (30%)',
  RETENTION = 'Удержание / Лояльность (20%)',
  CONVERSION = 'Продажа / Действие (10%)'
}

export enum PlanStatus {
  IDEA = 'idea',       // AI предложил
  DRAFT = 'draft',     // Сгенерировано, но не опубликовано
  DONE = 'done'        // Опубликовано
}

export enum StrategyPreset {
  BALANCED = 'Баланс (Удержание + Охват)',
  GROWTH = 'Быстрый рост (Охват)',
  SALES = 'Активные продажи (Конверсия)',
  AUTHORITY = 'Личный бренд (Доверие)',
  LAUNCH = 'Запуск продукта (Прогрев)'
}

export interface MediaSuggestion {
  type: 'photo' | 'ai_image' | 'video';
  description: string;
  aiPrompt?: string; // Only for 'ai_image'
}

export interface ContentPlanItem {
  id: string;
  date: string; // ISO Date String (YYYY-MM-DD)
  topic: string;
  rationale: string; // "Why this topic now?"
  platform: TargetPlatform;
  archetype: PostArchetype;
  goal: ContentGoal;
  status: PlanStatus;
  scriptId?: string; // Link to generated script if exists
  mediaSuggestion?: MediaSuggestion; // New: Media brief
  generatedContent?: string; // Store generated text directly in the plan
}

export interface ContentStrategy {
  platforms: TargetPlatform[];
  postsPerWeek: number; // Used to calculate density
  personalizePerPlatform: boolean; 
  doublePostPerDay: boolean; // New: 2 posts per slot
  preset: StrategyPreset;
  weeklyFocus: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  lastGeneratedDate?: string;
}

export enum NarrativeVoice {
  FIRST_PERSON = 'От первого лица (Я)',
  PLURAL = 'От лица команды (Мы)',
  NEUTRAL = 'Нейтральный / Объективный'
}

export interface AuthorProfile {
  name: string;
  role: string; // e.g., "SaaS Founder", "Fitness Coach"
  voice: NarrativeVoice;
  tone: string; // e.g., "Professional but witty"
  targetAudience: string; // New: Explicit Target Audience (ЦА)
  audiencePainPoints: string;
  contentGoals: string;
  values: string;
  taboos: string; // Things NOT to say
  avatarUrl?: string; // New field for Telegram photo
  telegramId?: number; // New field for Telegram ID
}

export interface LanguageProfile {
  // Text Style
  isAnalyzed: boolean;
  styleDescription: string;
  keywords: string[];
  sentenceStructure: string;
  emotionalResonance: string;
  
  // Visual Style (New)
  visualStyle?: {
    isDefined: boolean;
    aesthetic: string; // General vibe (Minimalist, Grunge, Corporate)
    colors: string;    // Palette description
    composition: string; // Rules for framing
    elements: string;  // Recurring objects/symbols
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

export interface AppState {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  authorProfile: AuthorProfile | null;
  languageProfile: LanguageProfile | null;
  writingSamples: string[]; // New field to store raw samples
  scripts: GeneratedScript[];
  contentPlan: ContentPlanItem[]; // New: The Calendar
  strategy: ContentStrategy; // New: User preferences
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