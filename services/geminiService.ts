
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuthorProfile, LanguageProfile, TargetPlatform, PostArchetype, GeneratedOption, ContentPlanItem, ContentStrategy, ContentGoal, PlanStatus, MediaSuggestion, StrategyPreset, CalendarAnalysis, ProjectPersona, StrategicAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

const PLATFORM_RULES = {
  [TargetPlatform.TELEGRAM]: "Telegram: Прямой, вовлекающий стиль. Используй эмодзи как акценты, а не замену словам. Четкие заголовки. Лаконичность. Обязателен призыв к обсуждению или реакции.",
  [TargetPlatform.VK_POST]: "ВКонтакте (Текст): Более структурированный и подробный текст для чтения. Используй абзацы. Ориентируйся на создание комьюнити. Можно использовать более длинные предложения и детальные списки.",
  [TargetPlatform.INSTAGRAM]: "Instagram/Reels: Визуальный стиль. Первый абзац — мощный хук (зацепка). Короткие, рубленые фразы. Текст должен дополнять картинку/видео. Много воздуха между строками.",
  [TargetPlatform.YOUTUBE]: "YouTube: Оптимизированное описание. Используй ключевые слова в начале. Четкое резюме видео. Таймкоды и ссылки на другие ресурсы. Призыв к подписке.",
  [TargetPlatform.THREADS]: "Threads: Разговорный, почти «твиттерский» стиль. Короткие мысли, провоцирующие на ответ. Можно использовать структуру треда (1/3, 2/3)."
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

export const analyzeProjectIdentity = async (description: string, products: string): Promise<{
    targetAudience: string;
    pains: string;
    fears: string;
    personas: ProjectPersona[];
    strategy: StrategicAnalysis;
}> => {
    const systemInstruction = `
        Ты — ведущий бренд-стратег и эксперт по маркетингу. 
        Твоя задача — провести глубокий анализ проекта и сформировать профиль идеальной аудитории, а также дать стратегические рекомендации по продажам.
        
        ВЕРНИ JSON СЛЕДУЮЩЕЙ СТРУКТУРЫ:
        {
          "targetAudience": "Общее описание ЦА (целевой аудитории)",
          "pains": "Боли и потребности (подробный список через запятую)",
          "fears": "Страхи и возражения (подробный список через запятую)",
          "personas": [
            { "name": "Имя", "age": "Возраст", "role": "Роль/Профессия", "goal": "Главная цель в жизни/бизнесе", "whyBuy": "Почему купит ваш продукт" },
            { "name": "Имя", "age": "Возраст", "role": "Роль/Профессия", "goal": "Главная цель в жизни/бизнесе", "whyBuy": "Почему купит ваш продукт" },
            { "name": "Имя", "age": "Возраст", "role": "Роль/Профессия", "goal": "Главная цель в жизни/бизнесе", "whyBuy": "Почему купит ваш продукт" }
          ],
          "strategy": {
              "attraction": "Приемы и связки для привлечения внимания. Какие хуки (hooks) использовать? Какие триггеры сработают на эту ЦА?",
              "sales": "Как продавать услуги? Через какие смыслы и форматы доносить ценность? (Например: кейсы, демо, разборы).",
              "brand": "Как создавать бренд для этой ЦА? Какой Tone of Voice выбрать? Какую эмоцию должен вызывать бренд (забота, дерзость, уверенность)?"
          }
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Проект: ${description}\nПродукты/Услуги: ${products}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text);
    } catch (e) {
        console.error("Project Analysis Error", e);
        throw e;
    }
};

export const calculatePlanDistribution = (strategy: ContentStrategy): { goals: string[], totalPosts: number } => {
  const { preset, startDate, endDate, postsPerWeek, generatePerPlatform, platforms } = strategy;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  const totalWeeks = Math.max(1, diffDays / 7);
  
  let basePosts = Math.max(1, Math.round(totalWeeks * postsPerWeek));
  const totalPosts = (generatePerPlatform && platforms.length > 0) 
    ? basePosts * platforms.length 
    : basePosts;

  let distribution: Record<ContentGoal, number>;

  switch (preset) {
      case StrategyPreset.GROWTH:
          distribution = { [ContentGoal.AWARENESS]: 0.6, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.1, [ContentGoal.CONVERSION]: 0.0 };
          break;
      case StrategyPreset.SALES:
          distribution = { [ContentGoal.AWARENESS]: 0.2, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.1, [ContentGoal.CONVERSION]: 0.4 };
          break;
      case StrategyPreset.AUTHORITY:
          distribution = { [ContentGoal.AWARENESS]: 0.2, [ContentGoal.TRUST]: 0.6, [ContentGoal.RETENTION]: 0.2, [ContentGoal.CONVERSION]: 0.0 };
          break;
      case StrategyPreset.LAUNCH:
          distribution = { [ContentGoal.AWARENESS]: 0.3, [ContentGoal.TRUST]: 0.2, [ContentGoal.RETENTION]: 0.2, [ContentGoal.CONVERSION]: 0.3 };
          break;
      case StrategyPreset.BALANCED:
      default:
          distribution = { [ContentGoal.AWARENESS]: 0.4, [ContentGoal.TRUST]: 0.3, [ContentGoal.RETENTION]: 0.2, [ContentGoal.CONVERSION]: 0.1 };
          break;
  }

  const goals: string[] = [];
  Object.entries(distribution).forEach(([goal, ratio]) => {
      const count = Math.round(totalPosts * ratio);
      for (let i = 0; i < count; i++) goals.push(goal);
  });

  while (goals.length < totalPosts) goals.push(ContentGoal.AWARENESS);
  while (goals.length > totalPosts) goals.pop();

  for (let i = goals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [goals[i], goals[j]] = [goals[j], goals[i]];
  }

  return { goals, totalPosts };
};

export const generateContentPlan = async (profile: AuthorProfile, strategy: ContentStrategy, startDate: Date): Promise<ContentPlanItem[]> => {
    const { goals, totalPosts } = calculatePlanDistribution(strategy);
    
    const personalizationNote = strategy.personalizePerPlatform 
        ? "ВАЖНО: Применяй специфические правила для каждой платформы:\n" + strategy.platforms.map(p => PLATFORM_RULES[p]).join("\n")
        : "Используй общий тон автора для всех платформ.";

    const batchNote = strategy.generatePerPlatform 
        ? `ЗАДАЧА: Создай ПАКЕТЫ постов. Для каждой выбранной даты в JSON должно быть по одному посту для КАЖДОЙ из платформ: ${strategy.platforms.join(', ')}.`
        : "ЗАДАЧА: Распредели посты по одному в день, чередуя платформы.";

    const systemInstruction = `
      Ты — стратегический контент-планировщик. Твоя задача — создать расписание постов.
      
      ПРОФИЛЬ АВТОРА:
      - Роль: ${profile.role}
      - Ниша: ${profile.targetAudience}
      - Боли ЦА: ${profile.audiencePainPoints}
      
      СТРАТЕГИЯ:
      - Пресет: ${strategy.preset}
      - Фокус недели: ${strategy.weeklyFocus}
      - Платформы: ${strategy.platforms.join(', ')}
      - Период: с ${strategy.startDate} по ${strategy.endDate}
      
      ${batchNote}
      ${personalizationNote}

      Сгенерируй JSON-массив из ${totalPosts} элементов.
      Для каждого поста выбери:
      1. topic: Цепляющий заголовок.
      2. rationale: Краткое обоснование.
      3. platform: Конкретная платформа из списка.
      4. archetype: Формат поста.
      5. goal: Одна из целей из пула.
      
      ИСПОЛЬЗУЙ ЭТОТ ПУЛ ЦЕЛЕЙ:
      ${JSON.stringify(goals)}

      Формат JSON:
      [
        {
          "date": "YYYY-MM-DD",
          "topic": "...",
          "rationale": "...",
          "platform": "...",
          "archetype": "...",
          "goal": "..."
        }
      ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Создай контент-план согласно инструкции.",
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
        case PostArchetype.STORY: return ['HOOK', 'CONTEXT', 'CONFLICT', 'CLIMAX', 'RESOLUTION', 'MORAL'];
        case PostArchetype.EXPERT: return ['HOOK', 'PROBLEM', 'MISTAKE', 'SOLUTION', 'PROOF', 'CTA'];
        case PostArchetype.SHORT_POST: return ['HOOK', 'VALUE', 'CTA'];
        case PostArchetype.PROVOCATION: return ['TRIGGER', 'CONTROVERSIAL_OPINION', 'ARGUMENT', 'QUESTION'];
        case PostArchetype.ERROR_ANALYSIS: return ['HOOK', 'CONTEXT', 'FAILURE_POINT', 'ANALYSIS', 'LESSON', 'CTA'];
        case PostArchetype.DAY_IN_LIFE: return ['MORNING_CONTEXT', 'EVENT', 'REFLECTION', 'CONCLUSION'];
        default: return ['HOOK', 'BODY', 'CTA'];
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

export const generateUnitOptions = async (topic: string, platform: TargetPlatform, archetype: PostArchetype, author: AuthorProfile, style: LanguageProfile, currentUnit: string, contextSoFar: string, additionalContext?: string): Promise<GeneratedOption[]> => {
    const stylePrompt = style.isAnalyzed 
        ? `Имитируй стиль автора: Тон: ${style.styleDescription}, Ключевые слова: ${style.keywords.join(', ')}, Структура: ${style.sentenceStructure}`
        : `Тон: ${author.tone}, Голос: ${author.voice}`;

    const platformNote = PLATFORM_RULES[platform] || "";
    const contextInstruction = additionalContext 
        ? `\nДОПОЛНИТЕЛЬНЫЕ ФАКТЫ/КОНТЕКСТ: "${additionalContext}"` 
        : "";

    const systemInstruction = `
        Ты — гострайтер. Мы пишем пост по частям.
        ТЕМА: ${topic}
        ПЛАТФОРМА: ${platform}
        АРХЕТИП: ${archetype}
        
        ${platformNote}
        ${contextInstruction}
        
        СТИЛЬ:
        ${stylePrompt}

        КОНТЕКСТ:
        ${contextSoFar || "(Это начало)"}

        ЗАДАЧА:
        Напиши 3 варианта для блока "${getUnitName(currentUnit)}".
        Формат JSON:
        [
          { "text": "...", "reasoning": "Почему это круто", "isBest": boolean }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Варианты для блока ${currentUnit}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text) || [];
    } catch (error) {
        console.error("Unit Generation Error", error);
        return [];
    }
};

export const analyzeAudienceInsights = async (author: AuthorProfile, strategy: ContentStrategy, itemsWithMetrics: ContentPlanItem[]): Promise<string> => {
    if (itemsWithMetrics.length === 0) return "Недостаточно данных для анализа.";
    
    // Enrich data with content snippet for qualitative analysis
    const dataForAnalysis = itemsWithMetrics.map(item => ({
        date: item.date,
        topic: item.topic,
        archetype: item.archetype,
        platform: item.platform,
        // Include partial content to understand "why" it worked
        contentSnippet: item.generatedContent ? item.generatedContent.slice(0, 400) + "..." : item.rationale, 
        // Include visual description for context
        visualDescription: item.mediaSuggestion?.description || "Без визуала",
        metrics: item.metrics
    }));

    const systemInstruction = `
        Ты — ведущий контент-аналитик и стратег.
        Твоя задача — проанализировать эффективность постов за последние 2 месяца.
        
        ПРОФИЛЬ АВТОРА:
        - Роль: ${author.role}
        - ЦА: ${author.targetAudience}
        
        ДАННЫЕ О ПОСТАХ (включая контент, описание визуала и метрики):
        ${JSON.stringify(dataForAnalysis)}
        
        ЗАДАЧА:
        1. Выяви закономерности: какие темы, форматы (archetype) и стили (по содержанию) набирают больше охватов/лайков/ER.
        2. СРАВНИ УСПЕШНЫЕ И НЕУСПЕШНЫЕ посты. Почему одни "залетели", а другие нет? 
           ОБЯЗАТЕЛЬНО ПРОАНАЛИЗИРУЙ ВЛИЯНИЕ ВИЗУАЛА (поле visualDescription) на метрики, если оно заполнено.
        3. Дай 3-5 конкретных стратегических рекомендаций на будущее: о чем писать, как менять подачу текста и какой визуал использовать.
        
        Ответ верни в формате Markdown. Будь краток, но содержателен. Используй эмодзи для наглядности.
    `;

    try {
        const response = await ai.models.generateContent({ 
            model: MODEL_NAME, 
            contents: "Проведи глубокий анализ контента и метрик.", 
            config: { systemInstruction } 
        });
        return response.text || "Ошибка анализа.";
    } catch (e) { return "Ошибка связи с AI."; }
};

export const analyzeWritingStyle = async (text: string, currentProfile?: LanguageProfile): Promise<LanguageProfile> => { 
    const systemInstruction = `Аналитик стиля. Деконструируй голос автора. Верни JSON: styleDescription, keywords, sentenceStructure, emotionalResonance.`;
    try {
         const response = await ai.models.generateContent({ model: MODEL_NAME, contents: text, config: { systemInstruction, responseMimeType: "application/json" } });
        const data = cleanAndParseJSON(response.text);
        return { ...data, isAnalyzed: true, visualStyle: currentProfile?.visualStyle || { isDefined: false, aesthetic: '', colors: '', composition: '', elements: '' } };
    } catch(e) { throw e; }
};

export const suggestAudienceProfile = async (topic: string): Promise<{painPoints: string, goals: string}> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Тема: ${topic}. Боли и цели ЦА.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { painPoints: { type: Type.STRING }, goals: { type: Type.STRING } }
                }
            }
        });
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
        return cleanAndParseJSON(response.text) || { tones: [], values: [], taboos: [] };
    } catch (e) { return { tones: [], values: [], taboos: [] }; }
};

export const transformIdentityToVisual = async (rawInput: string): Promise<string> => { 
    try {
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: `Визуальное ТЗ: "${rawInput}".` });
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
        const data = cleanAndParseJSON(response.text);
        return { ...data, isDefined: true };
    } catch(e) { throw e; }
};

export const translateToEnglish = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({ 
            model: MODEL_NAME, 
            contents: `Translate the following image description to English for an AI image generator (Midjourney/DALL-E). Keep it descriptive: "${text}"` 
        });
        return response.text || "";
    } catch(e) { return ""; }
}

export const generateMediaSuggestion = async (item: ContentPlanItem, author: AuthorProfile, style: LanguageProfile): Promise<MediaSuggestion> => { 
    const visualContext = style.visualStyle?.isDefined ? `Стиль: ${JSON.stringify(style.visualStyle)}` : "Подходящий стиль.";
    const contentContext = item.generatedContent 
        ? `ТЕКСТ ПОСТА: "${item.generatedContent.slice(0, 1000)}..."` 
        : `КРАТКОЕ ОПИСАНИЕ: ${item.rationale}`;

    const systemInstruction = `
        Ты — креативный арт-директор. Твоя задача — придумать идею для визуального оформления поста.
        
        ВХОДНЫЕ ДАННЫЕ:
        Тема: ${item.topic}
        Платформа: ${item.platform}
        ${visualContext}
        ${contentContext}

        ИНСТРУКЦИЯ:
        Проанализируй тему и (если есть) текст поста. Предложи визуальный образ, который дополнит смысл, привлечет внимание и будет соответствовать платформе.
        
        Верни JSON: 
        {
            "type": "photo" | "ai_image" | "video", 
            "description": "Подробное ТЗ на русском языке для дизайнера или фотографа. Опиши композицию, настроение, объекты.", 
            "aiPrompt": "Готовый промпт на АНГЛИЙСКОМ языке для генерации в Midjourney/DALL-E."
        }
    `;
    try {
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: "Придумай визуал.", config: { systemInstruction, responseMimeType: "application/json" } });
        return cleanAndParseJSON(response.text);
    } catch (e) { return { type: 'photo', description: 'Ошибка генерации визуала' }; }
};

export const analyzeContentCalendar = async (strategy: ContentStrategy, plan: ContentPlanItem[]): Promise<CalendarAnalysis> => { 
    const systemInstruction = `Анализ контент-плана: ${strategy.preset}. План: ${JSON.stringify(plan.map(p => ({ date: p.date, topic: p.topic, goal: p.goal })))}. Верни JSON: status, report.`;
    try {
         const response = await ai.models.generateContent({ model: MODEL_NAME, contents: "Анализ плана", config: { systemInstruction, responseMimeType: "application/json" } });
        return cleanAndParseJSON(response.text);
    } catch (e) { return { status: 'normal', report: 'Ошибка анализа' }; }
};
