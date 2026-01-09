
import { GoogleGenAI, Type } from "@google/genai";
import { AuthorProfile, LanguageProfile, GeneratedOption, ContentPlanItem, ContentGoal, PlanStatus, MediaSuggestion, StrategyPreset, CalendarAnalysis, ProjectPersona, StrategicAnalysis, PromptKey, PlatformConfig, ArchetypeConfig, ContentStrategy } from "../types";
import { DEFAULT_PROMPTS } from "../constants";

// Corrected initialization with named apiKey parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// Upgraded to gemini-3-pro-preview for complex reasoning and planning tasks
const MODEL_NAME = 'gemini-3-pro-preview';

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

const fillTemplate = (template: string, variables: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return variables[key] || `[MISSING: ${key}]`;
    });
};

const getPrompt = (key: PromptKey, customPrompts?: Partial<Record<PromptKey, string>>): string => {
    if (customPrompts && customPrompts[key]) {
        return customPrompts[key]!;
    }
    return DEFAULT_PROMPTS[key];
};

export const analyzeProjectIdentity = async (description: string, products: string, customPrompts?: Partial<Record<PromptKey, string>>): Promise<{
    targetAudience: string;
    pains: string;
    fears: string;
    personas: ProjectPersona[];
    strategy: StrategicAnalysis;
}> => {
    const template = getPrompt('analyze_identity', customPrompts);
    const systemInstruction = fillTemplate(template, {
        description,
        products
    });
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Проект: ${description}\nПродукты/Услуги: ${products}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        // Correct usage of .text property
        return cleanAndParseJSON(response.text);
    } catch (e) {
        if (customPrompts?.analyze_identity) {
             return analyzeProjectIdentity(description, products, {}); 
        }
        throw e;
    }
};

export const calculatePlanDistribution = (strategy: ContentStrategy): { goals: ContentGoal[], totalPosts: number } => {
  const { preset, startDate, endDate, postsPerWeek, generatePerPlatform, platforms } = strategy;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Inclusive date range calculation
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  
  // Calculate exact proportional count based on frequency (percentage based)
  // e.g. 4 posts/week over 8 days = (8/7)*4 = 4.57
  const exactCount = (diffDays / 7) * postsPerWeek;
  
  // Use Math.floor to strictly adhere to "earned" posts over time. 
  // This prevents 8 days @ 4/week (4.57) from jumping to 5.
  // We ensure at least 1 post is generated if the period exists.
  const basePostsCount = Math.max(1, Math.floor(exactCount));
  
  let totalPosts = 0;
  if (generatePerPlatform) {
      // Multi-posting: For every "base post" (topic), we generate one for EACH platform.
      const platformCount = platforms.length > 0 ? platforms.length : 1;
      totalPosts = basePostsCount * platformCount;
  } else {
      // Standard: Total posts are just distributed across the period
      totalPosts = basePostsCount;
  }

  let ratios: Record<ContentGoal, number>;
  switch (preset) {
      case StrategyPreset.GROWTH:
          ratios = { [ContentGoal.AWARENESS]: 0.6, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.1, [ContentGoal.CONVERSION]: 0.0 };
          break;
      case StrategyPreset.SALES:
          ratios = { [ContentGoal.AWARENESS]: 0.1, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.1, [ContentGoal.CONVERSION]: 0.5 };
          break;
      case StrategyPreset.AUTHORITY:
          ratios = { [ContentGoal.AWARENESS]: 0.2, [ContentGoal.TRUST]: 0.6, [ContentGoal.RETENTION]: 0.2, [ContentGoal.CONVERSION]: 0.0 };
          break;
      case StrategyPreset.LAUNCH:
          ratios = { [ContentGoal.AWARENESS]: 0.3, [ContentGoal.TRUST]: 0.2, [ContentGoal.RETENTION]: 0.1, [ContentGoal.CONVERSION]: 0.4 };
          break;
      case StrategyPreset.BALANCED:
      default:
          ratios = { [ContentGoal.AWARENESS]: 0.4, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.2, [ContentGoal.CONVERSION]: 0.1 };
          break;
  }

  const goals: ContentGoal[] = [];
  Object.entries(ratios).forEach(([goal, ratio]) => {
      const count = Math.floor(totalPosts * ratio);
      for (let i = 0; i < count; i++) goals.push(goal as ContentGoal);
  });

  // Fill remaining slots with Awareness (most common)
  while (goals.length < totalPosts) goals.push(ContentGoal.AWARENESS);
  // If we overfilled due to rounding/ratios, pop
  while (goals.length > totalPosts) goals.pop();

  return { goals, totalPosts };
};

export const generateContentPlan = async (
    profile: AuthorProfile, 
    strategy: ContentStrategy, 
    startDate: Date, 
    platformConfigs: PlatformConfig[],
    customPrompts?: Partial<Record<PromptKey, string>>
): Promise<ContentPlanItem[]> => {
    const { goals, totalPosts } = calculatePlanDistribution(strategy);
    
    const activePlatformRules = strategy.platforms.map(pName => {
        const cfg = platformConfigs.find(c => c.name === pName || c.id === pName);
        return cfg ? cfg.rules : `${pName}: Стандартный стиль.`;
    }).join('\n');

    const personalizationNote = strategy.personalizePerPlatform 
        ? "ВАЖНО: Адаптируй ТЕМЫ под специфику площадок:\n" + activePlatformRules
        : "Используй общий тон для всех площадок.";

    // Calculate how many unique "topics" we need. 
    // If generatePerPlatform is true, totalPosts = uniqueTopics * platformCount.
    // So uniqueTopics = totalPosts / platformCount.
    const platformCount = strategy.platforms.length || 1;
    const uniqueTopicsCount = strategy.generatePerPlatform ? Math.ceil(totalPosts / platformCount) : totalPosts;

    const batchNote = strategy.generatePerPlatform 
        ? `РЕЖИМ МУЛЬТИ-ПОСТИНГА: Исходя из частоты ${strategy.postsPerWeek} инфоповодов в неделю, тебе нужно создать ${uniqueTopicsCount} уникальных инфоповодов (тем). Для КАЖДОЙ темы создай ${platformCount} отдельных постов - по одному для каждой из этих сетей: ${strategy.platforms.join(', ')}. ИТОГО в массиве должно быть ровно ${totalPosts} элементов (JSON objects). Даты публикаций одной и той же темы на разных площадках должны совпадать.`
        : `РЕЖИМ ЧЕРЕДОВАНИЯ: Распредели ${totalPosts} постов равномерно по периоду (${strategy.startDate} - ${strategy.endDate}), чередуя платформы.`;
    
    // Explicitly reinforce the weekly focus context
    const focusContext = strategy.weeklyFocus 
        ? `\nГЛАВНЫЙ КОНТЕКСТ (СТРОГО): Все темы постов должны быть посвящены фокусу: "${strategy.weeklyFocus}". Не отклоняйся от этой темы.` 
        : "\nТемы должны быть актуальны для ниши автора.";

    const template = getPrompt('generate_plan', customPrompts);
    const systemInstruction = fillTemplate(template, {
        role: profile.role,
        targetAudience: profile.targetAudience,
        painPoints: profile.audiencePainPoints,
        preset: strategy.preset,
        focus: focusContext,
        platforms: strategy.platforms.join(', '),
        period: `с ${strategy.startDate} по ${strategy.endDate} включительно`,
        batchNote: `${batchNote}\n${personalizationNote}`,
        goals: JSON.stringify(goals),
        count: totalPosts.toString()
    });

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Создай контент-план. Общее количество элементов массива JSON должно быть ровно: ${totalPosts}. Распредели их по времени (поле time). Верни строго JSON массив.`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        // Correct usage of .text property
        const rawData = cleanAndParseJSON(response.text);
        if (!Array.isArray(rawData)) throw new Error("AI returned invalid format");

        return rawData.map((item: any, index: number) => ({
            id: Date.now().toString() + index,
            date: item.date,
            time: item.time || "10:00",
            topic: item.topic,
            description: item.description || "",
            rationale: item.rationale,
            platform: item.platform,
            archetype: item.archetype,
            goal: item.goal as ContentGoal,
            status: PlanStatus.IDEA
        }));
    } catch (e) {
        if (customPrompts?.generate_plan) {
            return generateContentPlan(profile, strategy, startDate, platformConfigs, {});
        }
        return [];
    }
};

export const generateUnitOptions = async (
    topic: string, 
    platformName: string, 
    archetypeName: string, 
    author: AuthorProfile, 
    style: LanguageProfile, 
    currentUnit: string, 
    contextSoFar: string, 
    platformConfigs: PlatformConfig[],
    archetypeConfigs?: ArchetypeConfig[],
    additionalContext?: string,
    customPrompts?: Partial<Record<PromptKey, string>>
): Promise<GeneratedOption[]> => {
    const stylePrompt = style.isAnalyzed 
        ? `Имитируй стиль автора: Тон: ${style.styleDescription}, Ключевые слова: ${style.keywords.join(', ')}`
        : `Тон: ${author.tone}`;

    const platformConfig = platformConfigs.find(p => p.name === platformName || p.id === platformName);
    const platformNote = platformConfig ? platformConfig.rules : "";
    
    let stepInstruction = "";
    if (archetypeConfigs) {
        const archetype = archetypeConfigs.find(a => a.name === archetypeName || a.id === archetypeName);
        if (archetype) {
            const step = archetype.structure.find((s: any) => (typeof s === 'string' ? s === currentUnit : s.id === currentUnit));
            if (step && typeof step !== 'string') {
                stepInstruction = step.description;
            }
        }
    }

    const contextInstruction = additionalContext ? `\nДЕТАЛИ И КОНТЕКСТ: "${additionalContext}"` : "";

    const template = getPrompt('generate_unit_options', customPrompts);
    const systemInstruction = fillTemplate(template, {
        topic,
        platform: platformName,
        archetype: archetypeName,
        platformNote,
        contextInstruction,
        stylePrompt,
        contextSoFar: contextSoFar || "(Начало текста)",
        unitName: currentUnit,
        stepInstruction: stepInstruction || "Напиши текст для этого блока."
    });

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Варианты для ${currentUnit}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        // Correct usage of .text property
        return cleanAndParseJSON(response.text) || [];
    } catch (error) {
        return [];
    }
};

export const analyzeAudienceInsights = async (author: AuthorProfile, strategy: ContentStrategy, itemsWithMetrics: ContentPlanItem[]): Promise<string> => {
    if (itemsWithMetrics.length === 0) return "Недостаточно данных для анализа.";
    const dataForAnalysis = itemsWithMetrics.map(item => ({
        date: item.date,
        topic: item.topic,
        platform: item.platform,
        metrics: item.metrics
    }));
    const systemInstruction = `Ты — аналитик. Проанализируй эффективность постов: ${JSON.stringify(dataForAnalysis)}. Дай краткие выводы в Markdown.`;
    try {
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: "Анализ.", config: { systemInstruction } });
        // Correct usage of .text property
        return response.text || "Ошибка.";
    } catch (e) { return "Ошибка."; }
};

export const analyzeWritingStyle = async (text: string, currentProfile?: LanguageProfile): Promise<LanguageProfile> => { 
    const systemInstruction = `Аналитик стиля. Деконструируй голос автора. Верни JSON: styleDescription, keywords, sentenceStructure, emotionalResonance.`;
    try {
         const response = await ai.models.generateContent({ model: MODEL_NAME, contents: text, config: { systemInstruction, responseMimeType: "application/json" } });
        // Correct usage of .text property
        const data = cleanAndParseJSON(response.text);
        return { ...data, isAnalyzed: true, visualStyle: currentProfile?.visualStyle || { isDefined: false, aesthetic: '', colors: '', composition: '', elements: '' } };
    } catch(e) { throw e; }
};

export const suggestAudienceProfile = async (topic: string, productsContext?: string): Promise<{painPoints: string, goals: string}> => {
    try {
        const context = productsContext 
            ? `Автор продает: ${productsContext}. Тема/Ниша: ${topic}.`
            : `Тема: ${topic}.`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `${context} Опиши боли и цели ЦА, которая покупает эти продукты.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { painPoints: { type: Type.STRING }, goals: { type: Type.STRING } }
                }
            }
        });
        // Correct usage of .text property
        return cleanAndParseJSON(response.text) || { painPoints: '', goals: '' };
    } catch (e) { return { painPoints: '', goals: '' }; }
};

export const suggestStyleProfile = async (role: string, painPoints: string): Promise<{ tones: string[]; values: string[]; taboos: string[] }> => {
    try {
         const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Роль: ${role}. Боли: ${painPoints}. Предложи тона, ценности, табу.`,
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
        // Correct usage of .text property
        return cleanAndParseJSON(response.text) || { tones: [], values: [], taboos: [] };
    } catch (e) { return { tones: [], values: [], taboos: [] }; }
};

export const transformIdentityToVisual = async (rawInput: string): Promise<string> => { 
    try {
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: `Визуальное ТЗ: "${rawInput}".` });
        // Correct usage of .text property
        return response.text || "";
    } catch (e) { return ""; }
};

export const analyzeVisualIdentity = async (description: string): Promise<any> => { 
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Визуальный профиль: ${description}`,
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
        // Correct usage of .text property
        const data = cleanAndParseJSON(response.text);
        return { ...data, isDefined: true };
    } catch(e) { throw e; }
};

export const translateToEnglish = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({ 
            model: MODEL_NAME, 
            contents: `Translate the following image description to English for AI generator: "${text}"` 
        });
        // Correct usage of .text property
        return response.text || "";
    } catch(e) { return ""; }
}

export const generateMediaSuggestion = async (item: ContentPlanItem, author: AuthorProfile, style: LanguageProfile, customPrompts?: Partial<Record<PromptKey, string>>): Promise<MediaSuggestion> => { 
    const visualContext = style.visualStyle?.isDefined ? `Стиль: ${JSON.stringify(style.visualStyle)}` : "Подходящий стиль.";
    const contentContext = item.generatedContent ? `ТЕКСТ: "${item.generatedContent.slice(0, 1000)}"` : `ТЕМА: ${item.topic}`;
    const template = getPrompt('generate_visual', customPrompts);
    const systemInstruction = fillTemplate(template, {
        topic: item.topic,
        platform: item.platform,
        visualContext,
        contentContext
    });
    try {
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: "Придумай визуал.", config: { systemInstruction, responseMimeType: "application/json" } });
        // Correct usage of .text property
        return cleanAndParseJSON(response.text);
    } catch (e) { 
         return { type: 'photo', description: 'Ошибка генерации' }; 
    }
};

export const analyzeContentCalendar = async (strategy: ContentStrategy, plan: ContentPlanItem[], customPrompts?: Partial<Record<PromptKey, string>>): Promise<CalendarAnalysis> => { 
    const template = getPrompt('analyze_calendar', customPrompts);
    const systemInstruction = fillTemplate(template, {
        preset: strategy.preset,
        planJson: JSON.stringify(plan.map(p => ({ date: p.date, topic: p.topic, goal: p.goal })))
    });
    try {
         const response = await ai.models.generateContent({ model: MODEL_NAME, contents: "Анализ плана", config: { systemInstruction, responseMimeType: "application/json" } });
        // Correct usage of .text property
        return cleanAndParseJSON(response.text);
    } catch (e) { 
        return { status: 'normal', report: 'Ошибка анализа' }; 
    }
};

export const getArchetypeFormula = (archetypeName: string, configs: ArchetypeConfig[]): string[] => {
    const config = configs.find(c => c.name === archetypeName || c.id === archetypeName);
    if (!config) return ['HOOK', 'BODY', 'CTA'];
    return config.structure.map(s => s.id);
};

export const getUnitName = (unitKey: string): string => {
    const names: Record<string, string> = {
        HOOK: '🎣 Хук',
        BODY: '📝 Текст',
        CTA: '⚡ Призыв',
        INSIGHT: '💡 Инсайт',
        PROBLEM: '😱 Проблема',
        SOLUTION: '💡 Решение'
    };
    return names[unitKey] || unitKey;
};
