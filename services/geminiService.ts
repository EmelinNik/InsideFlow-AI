
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuthorProfile, LanguageProfile, TargetPlatform, PostArchetype, GeneratedOption, ContentPlanItem, ContentStrategy, ContentGoal, PlanStatus, MediaSuggestion, StrategyPreset, CalendarAnalysis, PromptKey } from "../types";
import { DEFAULT_PROMPTS } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

// --- TEMPLATE ENGINE HELPER ---
const compilePrompt = (template: string, variables: Record<string, string | number>): string => {
    return template.replace(/{{([\w.]+)}}/g, (_, key) => {
        // Handle nested keys e.g. "author.role" -> variables["author.role"]
        // In our case we will flatten the object passed to this function
        return variables[key] !== undefined ? String(variables[key]) : `[MISSING: ${key}]`;
    });
};

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text, e);
    throw new Error("Invalid JSON format from AI");
  }
};

export const calculatePlanDistribution = (strategy: ContentStrategy): { goals: string[], totalPosts: number } => {
  const { preset, startDate, endDate, postsPerWeek } = strategy;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  const totalWeeks = Math.max(1, diffDays / 7);
  const totalPosts = Math.max(1, Math.round(totalWeeks * postsPerWeek));

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
    
    // Prepare variables
    const variables = {
        'author.role': profile.role,
        'author.targetAudience': profile.targetAudience,
        'author.audiencePainPoints': profile.audiencePainPoints,
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        'strategy.platforms': strategy.platforms.join(', '),
        'strategy.startDate': strategy.startDate,
        'strategy.endDate': strategy.endDate,
        'totalPosts': totalPosts,
        'goals': JSON.stringify(goals)
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Создай контент-план.",
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        const rawData = cleanAndParseJSON(response.text);
        if (!Array.isArray(rawData)) throw new Error("AI returned invalid format");

        return rawData.map((item: any, index: number) => ({
            id: Date.now().toString() + index,
            date: item.date,
            topic: item.topic,
            rationale: item.rationale,
            platform: item.platform,
            archetype: item.archetype,
            goal: item.goal,
            status: PlanStatus.IDEA
        }));

    } catch (e) {
        console.error("Plan Generation Error:", e);
        return [];
    }
};

export const getArchetypeFormula = (archetype: PostArchetype): string[] => {
    switch (archetype) {
        case PostArchetype.STORY:
            return ['HOOK', 'CONTEXT', 'CONFLICT', 'CLIMAX', 'RESOLUTION', 'MORAL'];
        case PostArchetype.EXPERT:
            return ['HOOK', 'PROBLEM', 'MISTAKE', 'SOLUTION', 'PROOF', 'CTA'];
        case PostArchetype.SHORT_POST:
            return ['HOOK', 'VALUE', 'CTA'];
        case PostArchetype.PROVOCATION:
            return ['TRIGGER', 'CONTROVERSIAL_OPINION', 'ARGUMENT', 'QUESTION'];
        case PostArchetype.ERROR_ANALYSIS:
            return ['HOOK', 'CONTEXT', 'FAILURE_POINT', 'ANALYSIS', 'LESSON', 'CTA'];
        case PostArchetype.DAY_IN_LIFE:
            return ['MORNING_CONTEXT', 'EVENT', 'REFLECTION', 'CONCLUSION'];
        default:
            return ['HOOK', 'BODY', 'CTA'];
    }
};

export const getUnitName = (unitKey: string): string => {
    const names: Record<string, string> = {
        HOOK: '🎣 Хук (Зацепка)',
        CONTEXT: '📍 Контекст',
        CONFLICT: '⚔️ Конфликт / Проблема',
        CLIMAX: '🔥 Кульминация',
        RESOLUTION: '✅ Решение',
        MORAL: '🧠 Вывод',
        PROBLEM: '😱 Проблема',
        MISTAKE: '❌ Ошибка',
        SOLUTION: '💡 Решение',
        PROOF: '📊 Доказательство',
        CTA: '⚡ Призыв к действию',
        VALUE: '💎 Ценность',
        TRIGGER: '⚠️ Триггер',
        CONTROVERSIAL_OPINION: '🗣️ Спорное мнение',
        ARGUMENT: '🛡️ Аргумент',
        QUESTION: '❓ Вопрос',
        FAILURE_POINT: '💥 Точка провала',
        ANALYSIS: '🔍 Анализ',
        LESSON: '🎓 Урок',
        MORNING_CONTEXT: '🌅 Утро / Начало',
        EVENT: '📅 Событие',
        REFLECTION: '🤔 Рефлексия',
        CONCLUSION: '🏁 Итог',
        BODY: '📝 Основная часть'
    };
    return names[unitKey] || unitKey;
};

// Helper to find the PromptKey for a specific platform string
const getPlatformPromptKey = (platform: TargetPlatform): PromptKey | null => {
    if (platform === TargetPlatform.TELEGRAM) return PromptKey.PLATFORM_TELEGRAM;
    if (platform === TargetPlatform.VK_POST) return PromptKey.PLATFORM_VK;
    if (platform === TargetPlatform.VK_SHORTS) return PromptKey.PLATFORM_VK;
    if (platform === TargetPlatform.YOUTUBE) return PromptKey.PLATFORM_YOUTUBE;
    if (platform === TargetPlatform.INSTAGRAM) return PromptKey.PLATFORM_INSTAGRAM;
    if (platform === TargetPlatform.THREADS) return PromptKey.PLATFORM_THREADS;
    return null;
};

// Helper to find the PromptKey for a specific archetype string
const getFormatPromptKey = (archetype: PostArchetype): PromptKey => {
    switch (archetype) {
        case PostArchetype.STORY: return PromptKey.FORMAT_STORY;
        case PostArchetype.EXPERT: return PromptKey.FORMAT_EXPERT;
        case PostArchetype.SHORT_POST: return PromptKey.FORMAT_SHORT;
        case PostArchetype.PROVOCATION: return PromptKey.FORMAT_PROVOCATION;
        default: return PromptKey.FORMAT_GENERIC;
    }
};

export const generateUnitOptions = async (
    topic: string, 
    platform: TargetPlatform, 
    archetype: PostArchetype, 
    author: AuthorProfile, 
    style: LanguageProfile, 
    currentUnit: string, 
    contextSoFar: string, 
    additionalContext?: string,
    allPrompts: Record<string, string> = {}
): Promise<GeneratedOption[]> => {
    
    // 1. Resolve Style
    const stylePrompt = style.isAnalyzed 
        ? `
           Имитируй стиль автора:
           - Тон: ${style.styleDescription}
           - Ключевые слова: ${style.keywords.join(', ')}
           - Структура фраз: ${style.sentenceStructure}
          `
        : `Тон: ${author.tone}, Голос: ${author.voice}`;

    const contextInstruction = additionalContext 
        ? `\nДОПОЛНИТЕЛЬНЫЕ ФАКТЫ/КОНТЕКСТ, КОТОРЫЕ ОБЯЗАТЕЛЬНО НУЖНО УЧЕСТЬ В ПОСТЕ: "${additionalContext}"` 
        : "";

    // 2. Resolve Platform Prompt (Custom or Default)
    const platformKey = getPlatformPromptKey(platform);
    const platformRules = platformKey 
        ? (allPrompts[platformKey] || DEFAULT_PROMPTS[platformKey] || "")
        : "";

    // 3. Resolve Format Prompt (Custom or Default)
    const formatKey = getFormatPromptKey(archetype);
    const formatRules = allPrompts[formatKey] || DEFAULT_PROMPTS[formatKey] || DEFAULT_PROMPTS[PromptKey.FORMAT_GENERIC];

    // 4. Resolve Master Prompt (Custom or Default)
    const masterTemplate = allPrompts[PromptKey.SCRIPT_WRITER] || DEFAULT_PROMPTS[PromptKey.SCRIPT_WRITER];

    const variables = {
        topic,
        platform,
        archetype,
        contextInstruction,
        stylePrompt,
        contextSoFar: contextSoFar || "(Это начало поста)",
        currentUnitName: getUnitName(currentUnit),
        platformRules,
        formatRules
    };

    const systemInstruction = compilePrompt(masterTemplate, variables);

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Напиши варианты для блока ${currentUnit}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        return cleanAndParseJSON(response.text) || [];
    } catch (e) {
        console.error("Unit Generation Error", e);
        return [];
    }
};

export const analyzeAudienceInsights = async (
    author: AuthorProfile,
    strategy: ContentStrategy,
    itemsWithMetrics: ContentPlanItem[],
    templateOverride?: string
): Promise<string> => {
    if (itemsWithMetrics.length === 0) return "Недостаточно данных для анализа.";

    const metricsSummary = itemsWithMetrics.map(item => ({
        topic: item.topic,
        platform: item.platform,
        goal: item.goal,
        metrics: item.metrics
    }));

    const template = templateOverride || DEFAULT_PROMPTS[PromptKey.AUDIENCE_INSIGHTS];
    
    const variables = {
        'author.role': author.role,
        'author.targetAudience': author.targetAudience,
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        'metricsSummary': JSON.stringify(metricsSummary, null, 2)
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Проанализируй статистику и дай рекомендации по контенту.",
            config: { systemInstruction }
        });
        return response.text || "Ошибка генерации анализа.";
    } catch (e) {
        console.error("Analysis AI Error:", e);
        return "Не удалось связаться с AI-аналитиком.";
    }
};

export const analyzeWritingStyle = async (text: string, currentProfile?: LanguageProfile, templateOverride?: string): Promise<LanguageProfile> => { 
    const template = templateOverride || DEFAULT_PROMPTS[PromptKey.STYLE_ANALYSIS];
    
    const variables = {
        'samples': text
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Проанализируй стиль",
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });
        
        const data = cleanAndParseJSON(response.text);
        return {
            ...data,
            isAnalyzed: true,
            visualStyle: currentProfile?.visualStyle || { isDefined: false, aesthetic: '', colors: '', composition: '', elements: '' }
        };
    } catch(e) {
        console.error("Style Analysis Error", e);
        throw e;
    }
};

// ... existing helper functions (suggestAudienceProfile, suggestStyleProfile, transformIdentityToVisual, analyzeVisualIdentity) remain unchanged ...

export const suggestAudienceProfile = async (topic: string): Promise<{painPoints: string, goals: string}> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Тема блога: ${topic}. Опиши боли аудитории и цели контента одним предложением каждую.`,
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
        return cleanAndParseJSON(response.text) || { painPoints: '', goals: '' };
    } catch (e) {
        return { painPoints: '', goals: '' };
    }
};

export const suggestStyleProfile = async (role: string, painPoints: string): Promise<{ tones: string[]; values: string[]; taboos: string[] }> => {
    try {
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Роль: ${role}. Боли ЦА: ${painPoints}. Предложи варианты тона (tone), ценностей (values) и табу (taboos) для контента.`,
            config: {
                responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tones: { type: Type.ARRAY, items: { type: Type.STRING } },
                        values: { type: Type.ARRAY, items: { type: Type.STRING } },
                        taboos: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                }
            }
        });
        return cleanAndParseJSON(response.text) || { tones: [], values: [], taboos: [] };
    } catch (e) {
        return { tones: [], values: [], taboos: [] };
    }
};

export const transformIdentityToVisual = async (rawInput: string): Promise<string> => { 
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Преобразуй это описание бренда в четкое визуальное ТЗ: "${rawInput}".`,
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
};

export const analyzeVisualIdentity = async (description: string): Promise<any> => { 
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Проанализируй описание и создай визуальный профиль: ${description}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        aesthetic: { type: Type.STRING },
                        colors: { type: Type.STRING },
                        composition: { type: Type.STRING },
                        elements: { type: Type.STRING },
                    }
                }
            }
        });
        const data = cleanAndParseJSON(response.text);
        return { ...data, isDefined: true };
    } catch(e) {
        console.error("Visual Analysis Error", e);
        throw e;
    }
};

export const generateMediaSuggestion = async (
    item: ContentPlanItem, 
    author: AuthorProfile, 
    style: LanguageProfile,
    templateOverride?: string
): Promise<MediaSuggestion> => { 
    const visualContext = style.visualStyle?.isDefined 
        ? `Используй визуальный стиль: ${JSON.stringify(style.visualStyle)}`
        : "Предложи стиль, подходящий под тему.";

    const template = templateOverride || DEFAULT_PROMPTS[PromptKey.VISUAL_DIRECTOR];

    const variables = {
        topic: item.topic,
        platform: item.platform,
        visualContext
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Предложи визуал.",
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });
        return cleanAndParseJSON(response.text);
    } catch (e) {
        return { type: 'photo', description: 'Ошибка генерации визуала' };
    }
};

export const generateAiImage = async (prompt: string): Promise<string | null> => {
    try {
        // Enforce Russian text in generated images
        const promptWithRussianInstruction = `${prompt}. Important: Any text visible in the image must be in Russian language (Cyrillic).`;

        const response = await ai.models.generateContent({
          model: IMAGE_MODEL_NAME,
          contents: { parts: [{ text: promptWithRussianInstruction }] },
          config: {
              // Note: responseMimeType is not supported for gemini-2.5-flash-image
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image Generation Error:", e);
        throw e;
    }
};

export const analyzeContentCalendar = async (strategy: ContentStrategy, plan: ContentPlanItem[], templateOverride?: string): Promise<CalendarAnalysis> => { 
    const template = templateOverride || DEFAULT_PROMPTS[PromptKey.CALENDAR_ANALYSIS];
    
    const variables = {
        'strategy.preset': strategy.preset,
        'strategy.weeklyFocus': strategy.weeklyFocus,
        'planData': JSON.stringify(plan.map(p => ({ date: p.date, topic: p.topic, goal: p.goal })))
    };

    const systemInstruction = compilePrompt(template, variables);

    try {
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Анализ плана",
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });
        return cleanAndParseJSON(response.text);
    } catch (e) {
        return { status: 'normal', report: 'Ошибка анализа' };
    }
};
