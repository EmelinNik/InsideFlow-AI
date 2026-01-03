import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuthorProfile, LanguageProfile, TargetPlatform, PostArchetype, GeneratedOption, ContentPlanItem, ContentStrategy, ContentGoal, PlanStatus, MediaSuggestion, StrategyPreset } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Helper to safely parse JSON from AI response
 */
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

// ==========================================
// MATHEMATICAL PLANNING LAYER
// ==========================================

// ... (Existing mathematical planning code omitted for brevity as it didn't change, keeping structure)
type StrategyRatios = Record<'AWARENESS' | 'TRUST' | 'RETENTION' | 'CONVERSION', number>;
const STRATEGY_BASE_RATIOS: Record<StrategyPreset, StrategyRatios> = {
  [StrategyPreset.BALANCED]:  { AWARENESS: 30, TRUST: 30, RETENTION: 30, CONVERSION: 10 },
  [StrategyPreset.GROWTH]:    { AWARENESS: 60, TRUST: 20, RETENTION: 20, CONVERSION: 0 },
  [StrategyPreset.SALES]:     { AWARENESS: 10, TRUST: 30, RETENTION: 20, CONVERSION: 40 },
  [StrategyPreset.AUTHORITY]: { AWARENESS: 20, TRUST: 60, RETENTION: 20, CONVERSION: 0 },
  [StrategyPreset.LAUNCH]:    { AWARENESS: 25, TRUST: 35, RETENTION: 20, CONVERSION: 20 },
};
const STRATEGY_PRIORITIES: Record<StrategyPreset, (keyof StrategyRatios)[]> = {
  [StrategyPreset.BALANCED]:  ['TRUST', 'AWARENESS', 'RETENTION', 'CONVERSION'],
  [StrategyPreset.GROWTH]:    ['AWARENESS', 'TRUST', 'RETENTION', 'CONVERSION'],
  [StrategyPreset.SALES]:     ['CONVERSION', 'TRUST', 'RETENTION', 'AWARENESS'],
  [StrategyPreset.AUTHORITY]: ['TRUST', 'RETENTION', 'AWARENESS', 'CONVERSION'],
  [StrategyPreset.LAUNCH]:    ['TRUST', 'CONVERSION', 'AWARENESS', 'RETENTION'],
};
const PLATFORM_BIAS: Record<string, StrategyRatios> = {
  [TargetPlatform.TELEGRAM]:      { AWARENESS: 0.9, TRUST: 1.3, RETENTION: 1.2, CONVERSION: 0.8 },
  [TargetPlatform.VK_POST]:       { AWARENESS: 1.2, TRUST: 1.0, RETENTION: 0.9, CONVERSION: 0.9 },
  [TargetPlatform.YOUTUBE_SHORT]: { AWARENESS: 1.5, TRUST: 0.7, RETENTION: 0.8, CONVERSION: 0.5 },
  [TargetPlatform.YOUTUBE_MID]:   { AWARENESS: 1.3, TRUST: 1.4, RETENTION: 1.1, CONVERSION: 0.7 },
  [TargetPlatform.YOUTUBE_LONG]:  { AWARENESS: 1.0, TRUST: 1.6, RETENTION: 1.2, CONVERSION: 0.6 },
  [TargetPlatform.INSTAGRAM]:     { AWARENESS: 1.4, TRUST: 0.8, RETENTION: 0.9, CONVERSION: 0.6 },
  [TargetPlatform.VK_SHORTS]:     { AWARENESS: 1.5, TRUST: 0.6, RETENTION: 0.7, CONVERSION: 0.4 },
  [TargetPlatform.THREADS]:       { AWARENESS: 1.2, TRUST: 0.9, RETENTION: 0.8, CONVERSION: 0.3 },
};

export const calculatePlanDistribution = (strategy: ContentStrategy): { goals: string[], totalPosts: number } => {
  const { preset, platforms, startDate, endDate, postsPerWeek } = strategy;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  const totalWeeks = diffDays / 7;
  const totalPosts = Math.max(1, Math.round(totalWeeks * postsPerWeek));

  const biasMultiplier: StrategyRatios = { AWARENESS: 0, TRUST: 0, RETENTION: 0, CONVERSION: 0 };
  
  if (platforms.length > 0) {
    platforms.forEach(p => {
      const bias = PLATFORM_BIAS[p] || { AWARENESS: 1, TRUST: 1, RETENTION: 1, CONVERSION: 1 };
      biasMultiplier.AWARENESS += bias.AWARENESS;
      biasMultiplier.TRUST += bias.TRUST;
      biasMultiplier.RETENTION += bias.RETENTION;
      biasMultiplier.CONVERSION += bias.CONVERSION;
    });
    biasMultiplier.AWARENESS /= platforms.length;
    biasMultiplier.TRUST /= platforms.length;
    biasMultiplier.RETENTION /= platforms.length;
    biasMultiplier.CONVERSION /= platforms.length;
  } else {
    biasMultiplier.AWARENESS = 1; biasMultiplier.TRUST = 1; biasMultiplier.RETENTION = 1; biasMultiplier.CONVERSION = 1;
  }

  const base = STRATEGY_BASE_RATIOS[preset];
  let adjusted: StrategyRatios = {
    AWARENESS: base.AWARENESS * biasMultiplier.AWARENESS,
    TRUST: base.TRUST * biasMultiplier.TRUST,
    RETENTION: base.RETENTION * biasMultiplier.RETENTION,
    CONVERSION: base.CONVERSION * biasMultiplier.CONVERSION
  };

  const totalWeight = adjusted.AWARENESS + adjusted.TRUST + adjusted.RETENTION + adjusted.CONVERSION;
  adjusted.AWARENESS = (adjusted.AWARENESS / totalWeight);
  adjusted.TRUST = (adjusted.TRUST / totalWeight);
  adjusted.RETENTION = (adjusted.RETENTION / totalWeight);
  adjusted.CONVERSION = (adjusted.CONVERSION / totalWeight);

  const finalCounts: Record<string, number> = { AWARENESS: 0, TRUST: 0, RETENTION: 0, CONVERSION: 0 };
  let currentSum = 0;

  (Object.keys(adjusted) as (keyof StrategyRatios)[]).forEach(key => {
    const raw = totalPosts * adjusted[key];
    finalCounts[key] = Math.floor(raw);
    currentSum += finalCounts[key];
  });

  let needed = totalPosts - currentSum;
  const priorities = STRATEGY_PRIORITIES[preset];
  
  let pIndex = 0;
  while (needed > 0) {
    const type = priorities[pIndex % priorities.length];
    if (base[type] > 0 || needed > 4) { 
        finalCounts[type]++;
        needed--;
    }
    pIndex++;
  }

  if (totalPosts < 5 && finalCounts.CONVERSION > 1) {
      const excess = finalCounts.CONVERSION - 1;
      finalCounts.CONVERSION = 1;
      finalCounts.TRUST += excess;
  }
  if (preset === StrategyPreset.GROWTH && totalPosts < 10) {
      const sales = finalCounts.CONVERSION;
      finalCounts.CONVERSION = 0;
      finalCounts.AWARENESS += sales;
  }

  const goals: string[] = [];
  Object.entries(finalCounts).forEach(([type, count]) => {
      for(let i=0; i<count; i++) goals.push(type);
  });
  
  return { goals, totalPosts };
};

export const generateContentPlan = async (
  profile: AuthorProfile,
  strategy: ContentStrategy,
  startDate: Date
): Promise<ContentPlanItem[]> => {
  const platformsStr = strategy.platforms.join(', ');
  const { goals, totalPosts } = calculatePlanDistribution(strategy);
  
  const strategyRules = `
    СТРАТЕГИЯ: ${strategy.preset}
    КОЛИЧЕСТВО СЛОТОВ: ${totalPosts} на период с ${strategy.startDate} по ${strategy.endDate}.
    ЦЕЛИ (РАСПРЕДЕЛЕНЫ АЛГОРИТМОМ): ${goals.join(', ')}.
  `;

  const personalizationPrompt = strategy.personalizePerPlatform 
    ? "ВАЖНО: Темы должны быть УНИКАЛЬНЫМИ для каждой платформы." 
    : "Можно использовать схожие темы (Кросс-постинг).";

  const doublePostPrompt = strategy.doublePostPerDay
    ? `АКТИВЕН РЕЖИМ "2 ПОСТА В ДЕНЬ":
       Для каждой выданной цели (Goal) из списка ты должен сгенерировать ДВА разных поста на одну и ту же дату.
       Например: Один пост "Утренний" (более легкий), второй "Вечерний" (более глубокий) или просто разные форматы.
       В итоге в массиве должно быть в 2 раза больше элементов, чем целей.
       Считай, что 1 выданный слот = 1 день активности = 2 поста.`
    : `Один слот = один пост.`;

  const systemInstruction = `
    Ты — Стратег контент-маркетинга. 
    Твоя задача — распределить выданный список целей (Goals) по датам в календаре.
    
    ВХОДНЫЕ ДАННЫЕ:
    1. Автор: ${profile.role}, Тема: ${profile.contentGoals}
    2. ЦА: ${profile.targetAudience}, Боли: ${profile.audiencePainPoints}
    3. Платформы: ${platformsStr}
    4. Период: ${strategy.startDate} — ${strategy.endDate}
    
    ЗАДАНИЕ:
    У тебя есть мешок целей: ${JSON.stringify(goals)}.
    Ты должен раскидать их по датам внутри периода.
    Старайся распределять равномерно.
    
    ПРАВИЛА:
    ${strategyRules}
    ${personalizationPrompt}
    ${doublePostPrompt}
    
    ВЫВОД (JSON):
    Массив объектов ContentPlanItem.
    date должен быть в формате YYYY-MM-DD.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING },
        topic: { type: Type.STRING },
        rationale: { type: Type.STRING },
        platform: { type: Type.STRING },
        archetype: { type: Type.STRING },
        goal: { type: Type.STRING, enum: ["AWARENESS", "TRUST", "RETENTION", "CONVERSION"] }
      },
      required: ["date", "topic", "rationale", "platform", "archetype", "goal"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Составь календарный план, распределив цели.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8, 
      },
    });

    const parsedData = cleanAndParseJSON(response.text);
    if (!Array.isArray(parsedData)) return [];

    return parsedData.map((item: any) => ({
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      date: item.date,
      topic: item.topic,
      rationale: item.rationale,
      platform: item.platform as TargetPlatform,
      archetype: item.archetype as PostArchetype,
      goal: mapGoalString(item.goal),
      status: PlanStatus.IDEA
    }));

  } catch (error) {
    console.error("Planning Error:", error);
    return [];
  }
};

const mapGoalString = (goal: string): ContentGoal => {
  switch (goal) {
    case 'AWARENESS': return ContentGoal.AWARENESS;
    case 'TRUST': return ContentGoal.TRUST;
    case 'RETENTION': return ContentGoal.RETENTION;
    case 'CONVERSION': return ContentGoal.CONVERSION;
    default: return ContentGoal.AWARENESS;
  }
};

// ==========================================
// MEDIA GENERATION LAYER (UPDATED FOR VISUAL STYLE)
// ==========================================

export const generateMediaSuggestion = async (
  item: ContentPlanItem,
  authorProfile: AuthorProfile,
  languageProfile?: LanguageProfile // Now accepting profile to access Visual Style
): Promise<MediaSuggestion> => {
  
  const isVideoPlatform = item.platform.includes('Reels') || item.platform.includes('YouTube') || item.platform.includes('Shorts') || item.platform.includes('TikTok');
  
  // Construct Visual Style instructions if available
  let visualStyleInstruction = "";
  if (languageProfile?.visualStyle?.isDefined) {
      visualStyleInstruction = `
      ВАЖНО! СОБЛЮДАЙ ФИРМЕННЫЙ ВИЗУАЛЬНЫЙ СТИЛЬ (IDENTICS):
      - Общая эстетика: ${languageProfile.visualStyle.aesthetic}
      - Цветовая палитра: ${languageProfile.visualStyle.colors}
      - Композиция: ${languageProfile.visualStyle.composition}
      - Элементы бренда: ${languageProfile.visualStyle.elements}
      
      Все предложенные идеи (описание фото или aiPrompt) ДОЛЖНЫ соответствовать этому стилю.
      Если это aiPrompt, добавь в него ключевые слова стиля на английском (например, "neon lighting", "minimalist", "grainy film" и т.д., в зависимости от стиля).
      `;
  } else {
      visualStyleInstruction = "Стиль не задан. Используй нейтральный, профессиональный стиль, подходящий под тему.";
  }

  const systemInstruction = `
    Ты — Арт-директор и Визуальный продюсер.
    Твоя задача: Придумать визуальное сопровождение (Медиа) для поста.
    
    ВХОДНЫЕ ДАННЫЕ:
    1. Платформа: ${item.platform}
    2. Тема: "${item.topic}"
    3. Тип поста: ${item.archetype}
    4. Цель: ${item.goal}
    
    ПРОФИЛЬ АВТОРА:
    - Роль: ${authorProfile.role}
    - Тон: ${authorProfile.tone}
    
    ${visualStyleInstruction}
    
    ЛОГИКА ВЫБОРА ТИПА (type):
    1. Если платформа ВИДЕО (Reels, Shorts, YouTube) -> type: "video"
    2. Если пост в Telegram/VK/LinkedIn:
       - Если тема абстрактная/технологичная -> type: "ai_image"
       - Если тема личная/экспертная -> type: "photo"
    
    ВЫВОД (JSON):
    {
      "type": "photo" | "ai_image" | "video",
      "description": "Подробное описание того, что должно быть на фото/видео. Композиция, свет, объекты. Опиши так, чтобы соответствовало стилю.",
      "aiPrompt": "Только если type=ai_image. Готовый промпт для Midjourney/DALL-E на АНГЛИЙСКОМ языке. ОБЯЗАТЕЛЬНО включи слова, описывающие визуальный стиль (цвета, эстетику)."
    }
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["photo", "ai_image", "video"] },
      description: { type: Type.STRING },
      aiPrompt: { type: Type.STRING }
    },
    required: ["type", "description"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Предложи визуал для темы: ${item.topic}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      },
    });

    const parsed = cleanAndParseJSON(response.text);
    if (!parsed) throw new Error("Failed to generate media");
    
    return parsed as MediaSuggestion;
  } catch (error) {
    console.error("Media Gen Error:", error);
    return {
      type: isVideoPlatform ? 'video' : 'photo',
      description: "Не удалось сгенерировать описание. Попробуйте загрузить свое фото.",
    };
  }
};

// ==========================================
// VISUAL STYLE ANALYSIS
// ==========================================

export const analyzeVisualIdentity = async (description: string): Promise<LanguageProfile['visualStyle']> => {
  const systemInstruction = `
    Ты — Бренд-Дизайнер и Арт-директор.
    Твоя задача: Проанализировать хаотичное описание визуального стиля пользователя и структурировать его в четкий "Visual Identity Guide".
    
    ВХОДНОЕ ОПИСАНИЕ:
    "${description}"
    
    ЗАДАЧА:
    Выдели ключевые элементы стиля, переведи их на язык дизайна и верни JSON.
    ВСЕ ПОЛЯ (кроме ключей JSON) ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
    
    JSON СТРУКТУРА:
    {
      "aesthetic": "Общее настроение (напр: Киберпанк, Минимализм, Эко-стиль)",
      "colors": "Описание палитры (напр: Неон, пастельные тона, ч/б с красным акцентом)",
      "composition": "Правила композиции (напр: Крупные планы, симметрия, много воздуха)",
      "elements": "Повторяющиеся элементы (напр: Геометрические фигуры, зернистость пленки, эмодзи)"
    }
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      aesthetic: { type: Type.STRING },
      colors: { type: Type.STRING },
      composition: { type: Type.STRING },
      elements: { type: Type.STRING }
    },
    required: ["aesthetic", "colors", "composition", "elements"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Проанализируй визуал.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const parsed = cleanAndParseJSON(response.text);
    if (!parsed) throw new Error("Visual Analysis Failed");
    
    return {
        isDefined: true,
        ...parsed
    };
  } catch (error) {
    console.error("Visual Analysis Error:", error);
    throw error;
  }
};

export const transformIdentityToVisual = async (identityText: string): Promise<string> => {
  const systemInstruction = `
    AI-модуль «Преобразование айдентики в визуальный код»
    Ты — AI-арт-директор и бренд-стратег.

    Пользователь передал тебе текст, в котором он описал свою айдентику своими словами.
    Твоя задача: структурировать айдентику, перевести её в визуальный язык и подготовить промпт.

    ЛОГИКА ОБРАБОТКИ:
    1. Определи тип бренда и характер.
    2. Переведи смысл в визуальные параметры (стиль, цвет, свет).
    3. Избегай абстрактных слов без визуального смысла.

    ВЫХОДНЫЕ ДАННЫЕ (OUTPUT) - верни обычный текст (не JSON), отформатированный Markdown:

    ### Visual Identity Summary
    (Краткое описание, 5-7 предложений на русском)

    ### Visual Identity Parameters
    **Стиль:** ...
    **Настроение:** ...
    **Цветовая палитра:** ...
    **Формы:** ...
    **Свет:** ...
    **Текстуры:** ...
    **Окружение:** ...

    ### AI Prompt (EN)
    (Готовый prompt на английском)
    [subject], [style], [mood], [color palette], [lighting], [textures], [environment], high quality, realistic, professional visual identity

    ПРАВИЛА:
    — Не добавляй ничего, чего нет в тексте пользователя.
    — Если что-то не указано — выбирай нейтрально.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: identityText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Не удалось сгенерировать описание.";
  } catch (error) {
    console.error("Identity Transform Error:", error);
    throw new Error("Failed to transform identity");
  }
};

// ... (Platform Intelligence & Unit Generation logic remains unchanged)
const PLATFORM_PROMPTS: Record<TargetPlatform, string> = {
  [TargetPlatform.YOUTUBE_SHORT]: `
    PROMPT — YouTube / Rutube (3–10 мин)
    Ты создаёшь сценарий для YouTube / Rutube длительностью 3–10 минут.
    Цель: быстро донести ключевую мысль, удержать внимание без воды.
    Алгоритмические требования: хук в первые 5 секунд, быстрый переход к сути, высокая плотность смысла.
  `,
  [TargetPlatform.YOUTUBE_MID]: `
    PROMPT — YouTube / Rutube (10–20 мин)
    Ты создаёшь сценарий для YouTube / Rutube длительностью 10–20 минут.
    Цель: показать экспертность, удержать внимание через структуру.
    Алгоритмические требования: чёткое обещание ценности в начале, логическая подача.
  `,
  [TargetPlatform.YOUTUBE_LONG]: `
    PROMPT — YouTube / Rutube (20+ мин)
    Ты создаёшь сценарий для YouTube / Rutube длительностью 20+ минут.
    Цель: глубокое раскрытие темы, формирование позиции автора.
    Алгоритмические требования: сильный вход, ясная рамка разговора, структурированная глубина.
  `,
  [TargetPlatform.VK_POST]: `
    PROMPT — VK (Text Post)
    Ты создаёшь пост для VK.
    Алгоритмические требования: читабельность, логические абзацы, ценность важнее эмоций.
    Ограничения: абзацы до 4 строк.
  `,
  [TargetPlatform.TELEGRAM]: `
    PROMPT — Telegram
    Ты создаёшь пост для Telegram.
    Алгоритмические требования: ощущение личного сообщения, минимум формальностей, ритм и паузы.
    Стиль: разговорный, от первого лица, как «мысли вслух».
  `,
  [TargetPlatform.INSTAGRAM]: `
    PROMPT — Instagram Reels (Text + Caption)
    Ты создаёшь текст для Instagram Reels.
    Алгоритмические требования: сильный хук в первой строке, короткие фразы, высокая плотность смысла.
  `,
  [TargetPlatform.VK_SHORTS]: `
    PROMPT — VK Shorts / Клипы
    Ты создаёшь сценарий для VK Shorts.
    Алгоритмические требования: хук в первые 1–2 секунды, никакой раскачки, один тезис.
  `,
  [TargetPlatform.THREADS]: `
    PROMPT — Threads
    Ты создаёшь пост для Threads.
    Алгоритмические требования: мысль, которую хочется процитировать, простая формулировка, ощущение диалога.
  `
};

const UNIT_PROMPTS: Record<string, string> = {
  ATTENTION: `
    1. ATTENTION UNIT (ВНИМАНИЕ / ХУК)
    Задача: остановить внимание, заставить читать дальше.
    Требования: 1–2 строки, без объяснений, без воды.
    Допустимые формы: вопрос, резкое утверждение, конфликт, наблюдение.
  `,
  CONTEXT: `
    2. CONTEXT UNIT (УЗНАВАНИЕ / СИТУАЦИЯ)
    Задача: показать читателю: «я понимаю твою ситуацию», создать узнавание.
    Требования: без решений, без советов, 2–3 коротких абзаца.
    Фокус: состояние, ситуация, боль.
  `,
  PROBLEM: `
    3. PROBLEM UNIT (ФОРМУЛИРОВКА ПРОБЛЕМЫ)
    Задача: чётко назвать ключевую проблему, сформулировать то, что читатель чувствует, но не говорит.
    Требования: одна проблема, без обобщений.
  `,
  INSIGHT: `
    4. INSIGHT UNIT (КЛЮЧЕВАЯ МЫСЛЬ)
    Задача: сделать поворот мышления, сформулировать главную мысль поста.
    Требования: ОДНА мысль, чёткая позиция, без объяснений.
  `,
  EXPLANATION: `
    5. EXPLANATION UNIT (ОБЪЯСНЕНИЕ)
    Задача: объяснить инсайт, сделать его понятным.
    Требования: логика важнее эмоций, простые формулировки, без терминов.
  `,
  STORY: `
    6. STORY UNIT (ИСТОРИЯ / ПРИМЕР)
    Задача: заземлить мысль через опыт, показать на примере.
    Структура: ситуация -> что пошло не так -> что стало понятно.
  `,
  ARGUMENT: `
    7. ARGUMENT UNIT (АРГУМЕНТ / УСИЛЕНИЕ)
    Задача: усилить доверие к инсайту, подтвердить его.
    Формы: аргумент, наблюдение, факт, закономерность.
  `,
  EMOTION: `
    8. EMOTION UNIT (ЭМОЦИОНАЛЬНЫЙ КОНТАКТ)
    Задача: усилить эмоциональный контакт.
    Формы: сомнение, страх, облегчение, поддержка.
    Требования: без пафоса, тёплый, человеческий тон.
  `,
  CONCLUSION: `
    9. CONCLUSION UNIT (ФИКСАЦИЯ СМЫСЛА)
    Задача: собрать смысл поста в точку, зафиксировать главный вывод.
    Требования: кратко, без новых мыслей, без CTA.
  `,
  CTA: `
    10. CTA UNIT (ДЕЙСТВИЕ)
    Задача: логично продолжить мысль поста, вызвать действие без давления.
    Типы CTA: мыслительный, практический, диалоговый.
  `
};

const UNIT_NAMES_RU: Record<string, string> = {
  ATTENTION: '🎣 Хук / Внимание',
  CONTEXT: '👀 Контекст',
  PROBLEM: '🔥 Проблема',
  INSIGHT: '💡 Инсайт',
  EXPLANATION: '🧠 Объяснение',
  STORY: '📖 История',
  ARGUMENT: '🛡️ Аргумент',
  EMOTION: '❤️ Эмоция',
  CONCLUSION: '🏁 Вывод',
  CTA: '⚡ Призыв к действию'
};

const ARCHETYPE_FORMULAS: Record<PostArchetype, (keyof typeof UNIT_PROMPTS)[]> = {
  [PostArchetype.EXPERT]: ['ATTENTION', 'PROBLEM', 'INSIGHT', 'EXPLANATION', 'ARGUMENT', 'CONCLUSION', 'CTA'],
  [PostArchetype.SALES]: ['ATTENTION', 'CONTEXT', 'PROBLEM', 'INSIGHT', 'STORY', 'CTA'],
  [PostArchetype.ENGAGEMENT]: ['ATTENTION', 'EMOTION', 'INSIGHT', 'CTA'],
  [PostArchetype.MOTIVATIONAL]: ['ATTENTION', 'CONTEXT', 'EMOTION', 'INSIGHT', 'CONCLUSION', 'CTA'],
  [PostArchetype.STORYTELLING]: ['ATTENTION', 'STORY', 'PROBLEM', 'INSIGHT', 'CONCLUSION'],
  [PostArchetype.REPORT]: ['ATTENTION', 'CONTEXT', 'STORY', 'EMOTION', 'INSIGHT', 'CONCLUSION']
};

export const getArchetypeFormula = (archetype: PostArchetype): string[] => {
  return ARCHETYPE_FORMULAS[archetype] || ARCHETYPE_FORMULAS[PostArchetype.EXPERT];
};

export const getUnitName = (unitKey: string): string => {
  return UNIT_NAMES_RU[unitKey] || unitKey;
};

export const generateUnitOptions = async (
  topic: string,
  platform: TargetPlatform,
  archetype: PostArchetype,
  author: AuthorProfile,
  style: LanguageProfile,
  currentUnit: string,
  contextSoFar: string
): Promise<GeneratedOption[]> => {
  
  const platformRules = PLATFORM_PROMPTS[platform];
  const unitPrompt = UNIT_PROMPTS[currentUnit];

  let styleInstruction = "";
  if (style.isAnalyzed) {
      styleInstruction = `
      ВАЖНО! ПИШИ В СТИЛЕ АВТОРА:
      1. Общий Вайб: ${style.styleDescription}
      2. Используй Лексику/Триггеры: ${style.keywords.join(', ')}. Старайся вплетать их органично.
      3. Структура предложений: ${style.sentenceStructure}
      4. Эмоциональный резонанс: ${style.emotionalResonance}
      `;
  } else {
      styleInstruction = "Пиши живым, человеческим языком, избегая штампов ChatGPT.";
  }

  const systemInstruction = `
    Ты экспертный Контент-Архитектор и Гострайтер (Ghostwriter). 
    Мы пишем пост по частям (Iterative Drafting).
    
    ЯЗЫК ГЕНЕРАЦИИ: СТРОГО РУССКИЙ. Все варианты должны быть на русском языке.

    ==========================================
    1. ПРОФИЛЬ АВТОРА (СТРОГО СОБЛЮДАТЬ)
    - Имя: ${author.name}
    - Роль: ${author.role}
    - Голос повествования: ${author.voice}
    - Тон общения: ${author.tone}
    - ЦЕННОСТИ: ${author.values}
    - ТАБУ (ЧЕГО ИЗБЕГАТЬ): ${author.taboos}
    
    2. ПОРТРЕТ АУДИТОРИИ (ЦА)
    - Кто они: ${author.targetAudience}
    - Их боли: ${author.audiencePainPoints}
    - Цель контента для них: ${author.contentGoals}
    ==========================================

    3. СТИЛИСТИКА (ЯЗЫКОВАЯ МОДЕЛЬ ЛИЧНОСТИ)
    ${styleInstruction}

    ==========================================
    КОНТЕКСТ ЗАДАЧИ:
    - Тема: "${topic}"
    - Платформа: ${platform}
    - Тип поста: ${archetype}
    
    ЧТО УЖЕ НАПИСАНО (Context):
    """
    ${contextSoFar}
    """
    
    ТВОЯ ЗАДАЧА СЕЙЧАС:
    Сгенерировать 3 варианта для СЛЕДУЮЩЕГО блока: **${currentUnit}**.
    
    ИНСТРУКЦИЯ ДЛЯ БЛОКА ${currentUnit}:
    ${unitPrompt}
    
    ТРЕБОВАНИЯ К ВАРИАНТАМ:
    1. ЯЗЫК: ТОЛЬКО РУССКИЙ.
    2. Они должны ЛОГИЧНО продолжать текст из "Context".
    3. Они должны использовать лексику из "Стилистики".
    4. Они должны обращаться к ЦА и учитывать её боли.
    5. Если есть ТАБУ, ни в коем случае их не нарушать.
    
    ОЦЕНКА ЛУЧШЕГО ВАРИАНТА (isBest):
    Пометь как "isBest": true тот вариант, который лучше всего резонирует с "Болями аудитории" и "Ценностями автора".
    Добавь короткое "reasoning" (обоснование), почему этот вариант лучше или хуже.

    Верни массив из 3 объектов: { text, isBest, reasoning }.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        isBest: { type: Type.BOOLEAN },
        reasoning: { type: Type.STRING }
      },
      required: ["text", "isBest", "reasoning"]
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Контекст передан. Предложи 3 варианта для блока ${currentUnit} в стиле автора. ПИШИ НА РУССКОМ.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, 
      },
    });

    const parsed = cleanAndParseJSON(response.text);
    if (!parsed || !Array.isArray(parsed)) {
      return [
        { text: "Ошибка генерации", isBest: false, reasoning: "AI не вернул данные" },
        { text: "Попробуйте снова", isBest: false, reasoning: "Ошибка парсинга" },
        { text: "Нет данных", isBest: false, reasoning: "Сбой сети" }
      ];
    }
    return parsed;
  } catch (error) {
    console.error(`Error generating options for ${currentUnit}:`, error);
    return [
        { text: "Произошла ошибка при генерации.", isBest: false, reasoning: "Сбой API" },
        { text: "Попробуйте обновить страницу.", isBest: false, reasoning: "Сбой API" },
        { text: "Или упростите тему.", isBest: false, reasoning: "Сбой API" }
    ];
  }
};

export const suggestAudienceProfile = async (description: string): Promise<{ painPoints: string; goals: string }> => {
  const prompt = `Действуй как эксперт. Ниша: "${description}". Создай портрет ЦА.
  ВАЖНО: ОТВЕТ ДОЛЖЕН БЫТЬ СТРОГО НА РУССКОМ ЯЗЫКЕ.
  JSON: {painPoints (боли, страхи), goals (чего они хотят от контента)}.`;
  
  const responseSchema: Schema = {
    type: Type.OBJECT, properties: { painPoints: { type: Type.STRING }, goals: { type: Type.STRING } }, required: ["painPoints", "goals"],
  };
  try {
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", responseSchema }});
    return cleanAndParseJSON(response.text) || { painPoints: "", goals: "" };
  } catch (e) { return { painPoints: "", goals: "" }; }
};

export const suggestStyleProfile = async (role: string, painPoints: string): Promise<{ tones: string[]; values: string[]; taboos: string[] }> => {
  const prompt = `Роль: "${role}", Боли: "${painPoints}". Предложи варианты стиля.
  ВАЖНО: ВСЕ ВАРИАНТЫ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
  JSON: {tones[] (прилагательные), values[] (существительные), taboos[] (фразы)} (по 10 шт).`;
  
  const responseSchema: Schema = {
    type: Type.OBJECT, properties: { tones: { type: Type.ARRAY, items: { type: Type.STRING } }, values: { type: Type.ARRAY, items: { type: Type.STRING } }, taboos: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["tones", "values", "taboos"],
  };
  try {
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", responseSchema }});
    return cleanAndParseJSON(response.text) || { tones: [], values: [], taboos: [] };
  } catch (e) { return { tones: [], values: [], taboos: [] }; }
};

export const analyzeWritingStyle = async (textSamples: string, currentProfile?: LanguageProfile): Promise<LanguageProfile> => {
  const prompt = currentProfile?.isAnalyzed 
    ? `Обнови профиль стиля на основе новых текстов: "${textSamples}". Текущий: ${JSON.stringify(currentProfile)}. ВАЖНО: ВЕСЬ ВЫВОД (ОПИСАНИЯ, СТРУКТУРЫ) ДОЛЖЕН БЫТЬ СТРОГО НА РУССКОМ ЯЗЫКЕ.`
    : `Проанализируй стиль текста: "${textSamples}". 
       ТВОЯ ЗАДАЧА: Создать "Language Profile" этого автора.
       ВАЖНО: ВЕСЬ ВЫВОД (styleDescription, sentenceStructure, keywords, emotionalResonance) ДОЛЖЕН БЫТЬ НА РУССКОМ ЯЗЫКЕ.
       Не используй английский в описаниях.
       JSON fields: styleDescription, keywords, sentenceStructure, emotionalResonance.`;
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: { styleDescription: { type: Type.STRING }, keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, sentenceStructure: { type: Type.STRING }, emotionalResonance: { type: Type.STRING } },
    required: ["styleDescription", "keywords", "sentenceStructure", "emotionalResonance"],
  };
  try {
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", responseSchema }});
    const data = cleanAndParseJSON(response.text) || {};
    return { ...currentProfile, isAnalyzed: true, ...data };
  } catch (e) { throw e; }
};