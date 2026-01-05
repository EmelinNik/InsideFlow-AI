
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import {
  AuthorProfile,
  ContentGoal,
  ContentPlanItem,
  ContentStrategy,
  GeneratedOption,
  LanguageProfile,
  MediaSuggestion,
  PlanStatus,
  PlatformBenchmark,
  PostArchetype,
  PromptKey,
  StrategyPreset,
  TargetPlatform,
  GeneratedScript,
  CalendarAnalysis,
  PLATFORM_COMPATIBILITY
} from "../types";
import { DEFAULT_PROMPTS } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models configuration
const MODEL_NAME = 'gemini-3-flash-preview'; // For fast text generation
const REASONING_MODEL = 'gemini-3-pro-preview'; // For complex analysis
const IMAGE_MODEL = 'gemini-2.5-flash-image'; // For image generation

// --- DEFAULTS ---
const DEFAULT_STYLE_PROMPT = `
Стиль: Нейтральный, профессиональный, уверенный.
- Используй активный залог.
- Избегай канцеляризма, клише и воды.
- Структура четкая: одна мысль — один абзац.
- Тон уважительный, но не заискивающий.
`;

const DEFAULT_VISUAL_PROMPT = `
Стиль: Минимализм, высокое качество (4k), естественное освещение.
- Композиция: Сбалансированная, с "воздухом".
- Цвета: Гармоничные, естественные, кинематографичные.
- Эстетика: Современная, clean look, professional editorial.
`;

// --- MAPPINGS ---
const PLATFORM_TO_PROMPT_KEY: Record<TargetPlatform, PromptKey> = {
    [TargetPlatform.TELEGRAM]: PromptKey.PLATFORM_TELEGRAM,
    [TargetPlatform.VK_POST]: PromptKey.PLATFORM_VK,
    [TargetPlatform.VK_SHORTS]: PromptKey.PLATFORM_VK, // Use VK general rules or add specific SHORTS rules if needed
    [TargetPlatform.YOUTUBE]: PromptKey.PLATFORM_YOUTUBE,
    [TargetPlatform.INSTAGRAM]: PromptKey.PLATFORM_INSTAGRAM,
    [TargetPlatform.THREADS]: PromptKey.PLATFORM_THREADS
};

const ARCHETYPE_TO_PROMPT_KEY: Record<PostArchetype, PromptKey> = {
    [PostArchetype.SHORT_POST]: PromptKey.FORMAT_SHORT,
    [PostArchetype.REFLECTION]: PromptKey.FORMAT_REFLECTION,
    [PostArchetype.NOTE]: PromptKey.FORMAT_NOTE,
    [PostArchetype.PERSONAL_XP]: PromptKey.FORMAT_PERSONAL_XP,
    [PostArchetype.DAY_IN_LIFE]: PromptKey.FORMAT_DAY_IN_LIFE,
    [PostArchetype.QUESTION]: PromptKey.FORMAT_QUESTION,
    [PostArchetype.PROVOCATION]: PromptKey.FORMAT_PROVOCATION,
    [PostArchetype.OBSERVATION]: PromptKey.FORMAT_OBSERVATION,
    [PostArchetype.ERROR_ANALYSIS]: PromptKey.FORMAT_ERROR_ANALYSIS,
    [PostArchetype.SHORT_ADVICE]: PromptKey.FORMAT_SHORT_ADVICE,
    [PostArchetype.SUMMARY]: PromptKey.FORMAT_SUMMARY,
    [PostArchetype.STORY]: PromptKey.FORMAT_STORY,
    [PostArchetype.EXPERT]: PromptKey.FORMAT_EXPERT,
    [PostArchetype.POLL]: PromptKey.FORMAT_POLL,
    [PostArchetype.LIST]: PromptKey.FORMAT_LIST,
    [PostArchetype.CASE_STUDY]: PromptKey.FORMAT_CASE_STUDY,
};

// --- HELPERS ---

const compilePrompt = (template: string, variables: Record<string, any>): string => {
  let result = template || '';
  for (const [key, value] of Object.entries(variables)) {
    // Replace {{key}} globaly
    // Handle undefined/null values gracefully
    const replacement = value === undefined || value === null ? '' : String(value);
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
  }
  return result;
};

const cleanAndParseJSON = (text: string | undefined): any => {
  if (!text) return null;
  let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  // Try to find valid JSON boundaries
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error", e);
    console.log("Raw text:", text);
    return null;
  }
};

// --- NORMALIZATION HELPERS ---

const normalizePlatform = (raw: string): TargetPlatform => {
    const r = raw.toLowerCase().trim();
    if (r.includes('tube')) return TargetPlatform.YOUTUBE;
    if (r.includes('vk') || r.includes('вконтакте')) {
        if (r.includes('клип') || r.includes('short') || r.includes('video')) return TargetPlatform.VK_SHORTS;
        return TargetPlatform.VK_POST;
    }
    if (r.includes('instagram') || r.includes('инст')) return TargetPlatform.INSTAGRAM;
    if (r.includes('thread')) return TargetPlatform.THREADS;
    return TargetPlatform.TELEGRAM; // Default
};

const normalizeArchetype = (raw: string): PostArchetype => {
    const r = raw.toLowerCase().trim();
    
    // Fuzzy matching against known values
    if (r.includes('коротк') || r.includes('short')) return PostArchetype.SHORT_POST;
    if (r.includes('размыш') || r.includes('мысл')) return PostArchetype.REFLECTION;
    if (r.includes('заметк') || r.includes('note')) return PostArchetype.NOTE;
    if (r.includes('опыт') || r.includes('xp')) return PostArchetype.PERSONAL_XP;
    if (r.includes('день') || r.includes('life')) return PostArchetype.DAY_IN_LIFE;
    if (r.includes('вопрос') || r.includes('ask')) return PostArchetype.QUESTION;
    if (r.includes('провокац') || r.includes('мнение')) return PostArchetype.PROVOCATION;
    if (r.includes('наблюд')) return PostArchetype.OBSERVATION;
    if (r.includes('ошиб') || r.includes('fail') || r.includes('error')) return PostArchetype.ERROR_ANALYSIS;
    if (r.includes('совет') || r.includes('advice')) return PostArchetype.SHORT_ADVICE;
    if (r.includes('итог') || r.includes('summary')) return PostArchetype.SUMMARY;
    if (r.includes('истор') || r.includes('story')) return PostArchetype.STORY;
    if (r.includes('эксперт') || r.includes('разбор')) return PostArchetype.EXPERT;
    if (r.includes('опрос') || r.includes('poll') || r.includes('интерактив')) return PostArchetype.POLL;
    if (r.includes('подбор') || r.includes('список') || r.includes('лист')) return PostArchetype.LIST;
    if (r.includes('кейс') || r.includes('case')) return PostArchetype.CASE_STUDY;

    return PostArchetype.SHORT_POST; // Default fallback
};

// --- CORE FUNCTIONS ---

export const calculatePlanDistribution = (strategy: ContentStrategy): { goals: string[], totalPosts: number } => {
  const { preset } = strategy;
  
  // Base calculation: Explicit number of topics requested
  // Use a fallback of 5 if postsCount is missing (legacy data)
  let totalTopics = strategy.postsCount || 5;
  let totalPosts = totalTopics;

  // Multi-platform logic: If user wants "Generate Per Platform", we need X posts per scheduled day
  if (strategy.generatePerPlatform && strategy.platforms.length > 1) {
      totalPosts = totalTopics * strategy.platforms.length;
  }

  let distribution: Record<ContentGoal, number>;

  switch (preset) {
      case StrategyPreset.GROWTH:
          distribution = {
              [ContentGoal.AWARENESS]: 0.6,
              [ContentGoal.TRUST]: 0.3,
              [ContentGoal.RETENTION]: 0.1,
              [ContentGoal.CONVERSION]: 0.0
          };
          break;
      case StrategyPreset.SALES:
          distribution = {
              [ContentGoal.AWARENESS]: 0.2,
              [ContentGoal.TRUST]: 0.3,
              [ContentGoal.RETENTION]: 0.1,
              [ContentGoal.CONVERSION]: 0.4
          };
          break;
      case StrategyPreset.AUTHORITY:
          distribution = {
              [ContentGoal.AWARENESS]: 0.2,
              [ContentGoal.TRUST]: 0.6,
              [ContentGoal.RETENTION]: 0.2,
              [ContentGoal.CONVERSION]: 0.0
          };
          break;
      case StrategyPreset.LAUNCH:
          distribution = {
              [ContentGoal.AWARENESS]: 0.3,
              [ContentGoal.TRUST]: 0.2,
              [ContentGoal.RETENTION]: 0.2,
              [ContentGoal.CONVERSION]: 0.3
          };
          break;
      case StrategyPreset.BALANCED:
      default:
          distribution = {
              [ContentGoal.AWARENESS]: 0.4,
              [ContentGoal.TRUST]: 0.3,
              [ContentGoal.RETENTION]: 0.2,
              [ContentGoal.CONVERSION]: 0.1
          };
          break;
  }

  const goals: string[] = [];
  
  // Create pool based on distribution
  Object.entries(distribution).forEach(([goal, ratio]) => {
      const count = Math.round(totalPosts * ratio);
      for (let i = 0; i < count; i++) {
          goals.push(goal);
      }
  });

  // Fill or trim to match exact totalPosts
  while (goals.length < totalPosts) {
      goals.push(ContentGoal.AWARENESS);
  }
  while (goals.length > totalPosts) {
      goals.pop();
  }

  // Shuffle array for randomness
  for (let i = goals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [goals[i], goals[j]] = [goals[j], goals[i]];
  }

  return { goals, totalPosts };
};

export const generateContentPlan = async (
    profile: AuthorProfile, 
    strategy: ContentStrategy, 
    startDate: Date,
    templateOverride?: string
): Promise<ContentPlanItem[]> => {
    const { goals, totalPosts } = calculatePlanDistribution(strategy);
    
    // Use override or default
    const template = templateOverride || DEFAULT_PROMPTS[PromptKey.PLAN_GENERATION];
    
    // Construct platform string with explicit instruction if multiposting is on
    let platformsString = strategy.platforms.join(', ');
    if (strategy.generatePerPlatform && strategy.platforms.length > 1) {
        platformsString += ". ВАЖНО: Для каждой даты в плане создай отдельный пост для КАЖДОЙ из выбранных платформ (дублируй тему или адаптируй).";
    }

    // Prepare variables
    const variables = {
        'author.role': profile.role,
        'author.targetAudience': profile.targetAudience,
        'author.audiencePainPoints': profile.audiencePainPoints,
        'author.values': profile.values,
        'author.taboos': profile.taboos,
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        'strategy.platforms': platformsString,
        'strategy.startDate': strategy.startDate,
        'strategy.endDate': strategy.endDate,
        'totalPosts': totalPosts,
        'goals': JSON.stringify(goals)
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Создай контент-план в формате JSON.",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            }
        });

        const rawData = cleanAndParseJSON(response.text);
        if (!Array.isArray(rawData)) throw new Error("AI returned invalid format");

        return rawData.map((item: any, index: number) => {
            // NORMALIZE DATA FROM AI TO PREVENT UI BUGS
            const normalizedPlatform = normalizePlatform(item.platform || '');
            const normalizedArchetype = normalizeArchetype(item.archetype || '');

            return {
                id: Date.now().toString() + index,
                date: item.date,
                topic: item.topic,
                rationale: item.rationale,
                platform: normalizedPlatform,
                archetype: normalizedArchetype,
                goal: item.goal,
                status: PlanStatus.IDEA
            };
        });

    } catch (e) {
        console.error("Plan Generation Error:", e);
        return [];
    }
};

// --- NEW FUNCTIONS ---

export const suggestAudienceProfile = async (niche: string): Promise<{ painPoints: string; goals: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Проанализируй нишу "${niche}". Предложи 5-7 основных болей аудитории и 3 ключевые цели контент-маркетинга для этой ниши.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        painPoints: { type: Type.STRING },
                        goals: { type: Type.STRING }
                    }
                }
            }
        });
        const data = cleanAndParseJSON(response.text);
        return {
            painPoints: data?.painPoints || "",
            goals: data?.goals || ""
        };
    } catch (e) {
        return { painPoints: "", goals: "" };
    }
};

export const suggestStyleProfile = async (role: string, painPoints: string) => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Для роли "${role}" и болей аудитории "${painPoints}" предложи 3 варианта тональности (tone), 3 ценности (values) и 3 табу (taboos).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tones: { type: Type.ARRAY, items: { type: Type.STRING } },
                        values: { type: Type.ARRAY, items: { type: Type.STRING } },
                        taboos: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return cleanAndParseJSON(response.text);
    } catch (e) {
        return null;
    }
};

export const analyzeWritingStyle = async (
    samples: string, 
    currentProfile: LanguageProfile | undefined,
    promptTemplate?: string
): Promise<LanguageProfile> => {
    const template = promptTemplate || DEFAULT_PROMPTS[PromptKey.STYLE_ANALYSIS];
    const variables = { samples };
    const instruction = compilePrompt(template, variables);

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: "Проанализируй стиль текста.",
        config: {
            systemInstruction: instruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    styleDescription: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sentenceStructure: { type: Type.STRING },
                    emotionalResonance: { type: Type.STRING }
                }
            }
        }
    });

    const data = cleanAndParseJSON(response.text);
    
    return {
        isAnalyzed: true,
        styleDescription: data.styleDescription || "",
        keywords: data.keywords || [],
        sentenceStructure: data.sentenceStructure || "",
        emotionalResonance: data.emotionalResonance || "",
        visualStyle: currentProfile?.visualStyle || {
            isDefined: false,
            aesthetic: "",
            colors: "",
            composition: "",
            elements: ""
        }
    };
};

export const analyzeVisualIdentity = async (description: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Проанализируй это описание визуального стиля: "${description}". Структурируй его в JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    aesthetic: { type: Type.STRING },
                    colors: { type: Type.STRING },
                    composition: { type: Type.STRING },
                    elements: { type: Type.STRING }
                }
            }
        }
    });
    const data = cleanAndParseJSON(response.text);
    return {
        isDefined: true,
        ...data
    };
};

export const transformIdentityToVisual = async (rawInput: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Преобразуй этот сырой текст о бренде в профессиональное описание визуальной айдентики (свет, цвета, стиль съемки, композиция): "${rawInput}"`,
    });
    return response.text.trim();
};

export const getArchetypeFormula = (archetype: PostArchetype): string[] => {
    const formulas: Record<PostArchetype, string[]> = {
        [PostArchetype.SHORT_POST]: ['HOOK', 'THESIS', 'CTA'],
        [PostArchetype.REFLECTION]: ['HOOK_QUESTION', 'REFLECTION', 'CONCLUSION', 'QUESTION'],
        [PostArchetype.NOTE]: ['CONTEXT', 'THOUGHT', 'PS'],
        [PostArchetype.PERSONAL_XP]: ['SITUATION', 'STRUGGLE', 'INSIGHT', 'RESULT'],
        [PostArchetype.DAY_IN_LIFE]: ['MORNING', 'WORK_PROCESS', 'EVENING', 'SUMMARY'],
        [PostArchetype.QUESTION]: ['CONTEXT', 'OPTIONS', 'QUESTION'],
        [PostArchetype.PROVOCATION]: ['UNPOPULAR_OPINION', 'ARGUMENT', 'CHALLENGE'],
        [PostArchetype.OBSERVATION]: ['OBSERVATION', 'ANALYSIS', 'CONCLUSION'],
        [PostArchetype.ERROR_ANALYSIS]: ['CONTEXT', 'MISTAKE', 'CONSEQUENCE', 'LESSON'],
        [PostArchetype.SHORT_ADVICE]: ['PROBLEM', 'SOLUTION_STEP_1', 'SOLUTION_STEP_2', 'RESULT'],
        [PostArchetype.SUMMARY]: ['INTRO', 'KEY_EVENTS', 'INSIGHT_OF_WEEK', 'PLANS'],
        [PostArchetype.STORY]: ['HERO_GOAL', 'CONFLICT', 'CLIMAX', 'RESOLUTION'],
        [PostArchetype.EXPERT]: ['PROBLEM', 'WHY_IMPORTANT', 'SOLUTION', 'EXAMPLE'],
        [PostArchetype.POLL]: ['HOOK_QUESTION', 'CONTEXT', 'POLL_OPTIONS', 'CTA_VOTE'],
        [PostArchetype.LIST]: ['HOOK_BENEFIT', 'LIST_ITEMS', 'SAVING_CTA'],
        [PostArchetype.CASE_STUDY]: ['POINT_A', 'POINT_B', 'TOOLS', 'CONCLUSION']
    };
    return formulas[archetype] || ['HOOK', 'BODY', 'CTA'];
};

export const getUnitName = (unitKey: string): string => {
    const names: Record<string, string> = {
        'HOOK': 'Хук / Заголовок',
        'THESIS': 'Главная мысль',
        'CTA': 'Призыв к действию',
        'HOOK_QUESTION': 'Вопрос-крючок',
        'REFLECTION': 'Размышление',
        'CONCLUSION': 'Вывод',
        'QUESTION': 'Вопрос',
        'CONTEXT': 'Контекст ситуации',
        'THOUGHT': 'Мысль / Инсайт',
        'PS': 'P.S.',
        'SITUATION': 'Ситуация "До"',
        'STRUGGLE': 'Проблема / Борьба',
        'INSIGHT': 'Озарение',
        'RESULT': 'Результат "После"',
        'MORNING': 'Утро / Начало',
        'WORK_PROCESS': 'Процесс',
        'EVENING': 'Вечер / Итог',
        'SUMMARY': 'Резюме',
        'OPTIONS': 'Варианты',
        'UNPOPULAR_OPINION': 'Непопулярное мнение',
        'ARGUMENT': 'Аргументация',
        'CHALLENGE': 'Вызов аудитории',
        'OBSERVATION': 'Наблюдение',
        'ANALYSIS': 'Анализ',
        'MISTAKE': 'Ошибка',
        'CONSEQUENCE': 'Последствия',
        'LESSON': 'Урок',
        'PROBLEM': 'Проблема',
        'SOLUTION_STEP_1': 'Шаг 1',
        'SOLUTION_STEP_2': 'Шаг 2',
        'INTRO': 'Вступление',
        'KEY_EVENTS': 'Ключевые события',
        'INSIGHT_OF_WEEK': 'Инсайт недели',
        'PLANS': 'Планы',
        'HERO_GOAL': 'Герой и Цель',
        'CONFLICT': 'Конфликт / Препятствие',
        'CLIMAX': 'Кульминация',
        'RESOLUTION': 'Развязка',
        'WHY_IMPORTANT': 'Почему это важно',
        'SOLUTION': 'Решение',
        'EXAMPLE': 'Пример',
        'BODY': 'Основная часть',
        'POLL_OPTIONS': 'Варианты ответа',
        'CTA_VOTE': 'Призыв голосовать',
        'HOOK_BENEFIT': 'Польза (Зачем читать)',
        'LIST_ITEMS': 'Список пунктов',
        'SAVING_CTA': 'Призыв сохранить',
        'POINT_A': 'Точка А (Было)',
        'POINT_B': 'Точка Б (Стало)',
        'TOOLS': 'Инструменты / Что сделали'
    };
    return names[unitKey] || unitKey;
};

export const generateUnitOptions = async (
    topic: string,
    platform: TargetPlatform,
    archetype: PostArchetype,
    author: AuthorProfile,
    language: LanguageProfile,
    unitKey: string,
    contextSoFar: string,
    description: string = '',
    prompts: Record<string, string>
): Promise<GeneratedOption[]> => {
    const template = prompts[PromptKey.SCRIPT_WRITER] || DEFAULT_PROMPTS[PromptKey.SCRIPT_WRITER];
    
    // Determine which sub-prompts to include based on platform and archetype
    // We use strict mapping now instead of fuzzy matching string keys
    const platformKey = PLATFORM_TO_PROMPT_KEY[platform];
    const platformRules = platformKey ? (prompts[platformKey] || DEFAULT_PROMPTS[platformKey] || '') : '';

    const formatKey = ARCHETYPE_TO_PROMPT_KEY[archetype];
    const formatRules = formatKey ? (prompts[formatKey] || DEFAULT_PROMPTS[formatKey] || '') : '';

    // FALLBACK TO DEFAULT NEUTRAL STYLE IF NOT TRAINED
    const stylePrompt = language.isAnalyzed 
        ? `Стиль автора: ${language.styleDescription}. Ключевые слова: ${language.keywords.join(', ')}`
        : DEFAULT_STYLE_PROMPT;

    const variables = {
        topic,
        platform,
        archetype,
        'author.role': author.role,
        'author.values': author.values,
        'author.taboos': author.taboos,
        platformRules,
        formatRules,
        contextInstruction: description ? `Дополнительный контекст от пользователя: ${description}` : '',
        stylePrompt,
        contextSoFar: contextSoFar ? contextSoFar : 'Это начало поста.',
        currentUnitName: getUnitName(unitKey)
    };

    const instruction = compilePrompt(template, variables);

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: "Предложи 3 варианта текста.",
        config: {
            systemInstruction: instruction,
            responseMimeType: "application/json",
        }
    });

    const data = cleanAndParseJSON(response.text);
    if (Array.isArray(data)) return data;
    return [];
};

export const generateMediaSuggestion = async (
    item: ContentPlanItem,
    author: AuthorProfile,
    language: LanguageProfile,
    promptTemplate?: string
): Promise<MediaSuggestion> => {
    const template = promptTemplate || DEFAULT_PROMPTS[PromptKey.VISUAL_DIRECTOR];
    
    // FALLBACK TO DEFAULT VISUAL STYLE
    const visualContext = language.visualStyle?.isDefined 
        ? `Визуальный стиль бренда: Эстетика - ${language.visualStyle.aesthetic}, Цвета - ${language.visualStyle.colors}.`
        : DEFAULT_VISUAL_PROMPT;
        
    const variables = {
        topic: item.topic,
        platform: item.platform,
        'author.values': author.values,
        visualContext,
        context: item.description || '' // Pass context
    };
    
    const instruction = compilePrompt(template, variables);
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Предложи визуальное оформление.",
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['photo', 'ai_image', 'video'] },
                        description: { type: Type.STRING },
                        aiPrompt: { type: Type.STRING }
                    }
                }
            }
        });
        
        const data = cleanAndParseJSON(response.text);
        if (!data) throw new Error("Empty response");

        return {
            type: data.type || 'photo',
            description: data.description || 'Описание отсутствует',
            aiPrompt: data.aiPrompt
        };
    } catch (e) {
        console.error("Media Gen Error", e);
        // Fallback
        return {
            type: 'photo',
            description: 'Сделайте минималистичное фото по теме поста.',
            aiPrompt: `Minimalist photo representing ${item.topic}`
        }
    }
};

export const generateAiImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: {
                parts: [{ text: prompt }]
            }
        });
        
        // Check for image parts in the response
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
};

export const analyzeAudienceInsights = async (
    author: AuthorProfile,
    strategy: ContentStrategy,
    items: ContentPlanItem[],
    benchmarks: Partial<Record<TargetPlatform, PlatformBenchmark>>,
    promptTemplate?: string
): Promise<string> => {
    const template = promptTemplate || DEFAULT_PROMPTS[PromptKey.AUDIENCE_INSIGHTS];
    
    // Simplify items for prompt
    const metricsSummary = JSON.stringify(items.map(i => ({
        topic: i.topic,
        format: i.archetype,
        platform: i.platform,
        metrics: i.metrics
    })));
    
    const benchmarksStr = JSON.stringify(benchmarks);
    
    const variables = {
        'author.role': author.role,
        'author.targetAudience': author.targetAudience,
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        benchmarks: benchmarksStr,
        metricsSummary
    };
    
    const instruction = compilePrompt(template, variables);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Speed up analysis
        contents: "Проведи анализ эффективности контента.",
        config: {
            systemInstruction: instruction
        }
    });
    
    return response.text;
};

export const analyzeCalendarPlan = async (
    author: AuthorProfile,
    strategy: ContentStrategy,
    plan: ContentPlanItem[],
    promptTemplate?: string
): Promise<CalendarAnalysis> => {
    const template = promptTemplate || DEFAULT_PROMPTS[PromptKey.CALENDAR_ANALYSIS];
    
    const planData = JSON.stringify(plan.map(p => ({ date: p.date, topic: p.topic, goal: p.goal })));
    
    const variables = {
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        'author.audiencePainPoints': author.audiencePainPoints,
        planData
    };
    
    const instruction = compilePrompt(template, variables);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Speed up analysis
        contents: "Проанализируй этот контент-план.",
        config: {
            systemInstruction: instruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    status: { type: Type.STRING, enum: ["good", "normal", "bad"] },
                    report: { type: Type.STRING }
                }
            }
        }
    });
    
    return cleanAndParseJSON(response.text);
};
