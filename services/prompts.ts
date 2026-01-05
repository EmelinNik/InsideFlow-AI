
import { PromptKey, PromptVariable } from "../types";

export const PROMPT_CATEGORIES = {
    CORE: {
        label: 'Основные',
        keys: [
            PromptKey.SCRIPT_WRITER,
            PromptKey.PLAN_GENERATION,
            PromptKey.STYLE_ANALYSIS,
            PromptKey.AUDIENCE_INSIGHTS,
            PromptKey.VISUAL_DIRECTOR,
            PromptKey.CALENDAR_ANALYSIS
        ]
    },
    PLATFORMS: {
        label: 'Площадки',
        keys: [
            PromptKey.PLATFORM_TELEGRAM,
            PromptKey.PLATFORM_VK,
            PromptKey.PLATFORM_YOUTUBE,
            PromptKey.PLATFORM_INSTAGRAM,
            PromptKey.PLATFORM_THREADS
        ]
    },
    FORMATS: {
        label: 'Форматы',
        keys: [
            PromptKey.FORMAT_STORY,
            PromptKey.FORMAT_EXPERT,
            PromptKey.FORMAT_SHORT,
            PromptKey.FORMAT_PROVOCATION,
            PromptKey.FORMAT_GENERIC
        ]
    }
};

export const DEFAULT_PROMPTS: Record<PromptKey, string> = {
    // --- CORE ---
    [PromptKey.PLAN_GENERATION]: `
Ты — стратегический контент-планировщик. Твоя задача — создать расписание постов.

ПРОФИЛЬ АВТОРА:
- Роль: {{author.role}}
- Ниша: {{author.targetAudience}}
- Боли ЦА: {{author.audiencePainPoints}}

СТРАТЕГИЯ:
- Пресет: {{strategy.preset}}
- Фокус недели: {{strategy.weeklyFocus}}
- Платформы: {{strategy.platforms}}
- Период: с {{strategy.startDate}} по {{strategy.endDate}}

ЗАДАЧА:
Сгенерируй JSON-массив из {{totalPosts}} постов. Распредели их по датам равномерно.
Для каждого поста выбери:
1. topic: Цепляющий заголовок.
2. rationale: Краткое обоснование (почему эта тема сейчас).
3. platform: Одну из доступных платформ.
4. archetype: Формат поста.
5. goal: Одну из целей из списка распределения.

ИСПОЛЬЗУЙ ЭТОТ ПУЛ ЦЕЛЕЙ (распредели их по дням):
{{goals}}

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
    `.trim(),

    [PromptKey.SCRIPT_WRITER]: `
Ты — гострайтер-сценарист. Мы пишем пост по частям.

ТЕМА: {{topic}}
ПЛАТФОРМА: {{platform}}
АРХЕТИП: {{archetype}}

ИНСТРУКЦИИ ПЛАТФОРМЫ:
{{platformRules}}

ИНСТРУКЦИИ ФОРМАТА:
{{formatRules}}

{{contextInstruction}}

СТИЛЬ АВТОРА:
{{stylePrompt}}

КОНТЕКСТ (Что уже написано):
{{contextSoFar}}

ЗАДАЧА:
Напиши 3 варианта для блока "{{currentUnitName}}".
Варианты должны быть разными по подаче (один провокационный, один спокойный, один сторителлинг), но все в стиле автора.

Формат JSON:
[
  { "text": "...", "reasoning": "Почему это круто", "isBest": boolean }
]
    `.trim(),

    [PromptKey.STYLE_ANALYSIS]: `
Ты — лингвистический AI-аналитик. Твоя задача — деконструировать стиль письма и создать "слепок" голоса автора.

ВХОДНЫЕ ДАННЫЕ (Примеры текстов):
{{samples}}

ЗАДАЧА:
Верни JSON профиль стиля:
- styleDescription: Описание вайба (например: "Дерзкий, рубленый, с юмором").
- keywords: 5-7 характерных слов или фраз-паразитов, которые использует автор.
- sentenceStructure: Как он строит фразы (коротко/длинно, много ли скобок, эмодзи).
- emotionalResonance: Какие эмоции вызывает текст (доверие, смех, тревога).
    `.trim(),

    [PromptKey.AUDIENCE_INSIGHTS]: `
Ты — Content Data Scientist и Стратег. Твоя задача — проанализировать цифры охвата и вовлеченности автора.

ПРОФИЛЬ АВТОРА:
- Роль: {{author.role}}
- ЦА: {{author.targetAudience}}

СТРАТЕГИЯ:
- Пресет: {{strategy.preset}}
- Фокус: {{strategy.weeklyFocus}}

ДАННЫЕ ПО ПОСТАМ:
{{metricsSummary}}

ЗАДАНИЕ:
1. Сделай вывод: какие темы и форматы вызвали аномальный интерес (или провал).
2. Проверь корреляцию: работают ли посты на свои цели (например, дают ли "Awareness" посты охват).
3. Дай 3 конкретных тактических совета: что изменить в следующей неделе, чтобы вырастить метрики.
4. Предложи изменение в "Позиционировании" или "Голосе", если цифры показывают холодную реакцию.

Формат ответа: Markdown.
    `.trim(),

    [PromptKey.VISUAL_DIRECTOR]: `
Ты — арт-директор. Предложи идею для визуализации поста.

ТЕМА: {{topic}}
ПЛАТФОРМА: {{platform}}
{{visualContext}}

Верни JSON:
- type: 'photo' | 'ai_image' | 'video'
- description: Описание для человека (ТЗ фотографу или оператору).
- aiPrompt: Промпт для Midjourney (на английском), если type='ai_image'.
    `.trim(),

    [PromptKey.CALENDAR_ANALYSIS]: `
Проанализируй контент-план на соответствие стратегии: {{strategy.preset}}.
Фокус: {{strategy.weeklyFocus}}.

План: {{planData}}

Верни JSON:
- status: 'good' | 'normal' | 'bad'
- report: Markdown текст с анализом баланса целей, логики тем и рекомендациями.
    `.trim(),

    // --- PLATFORMS ---
    [PromptKey.PLATFORM_TELEGRAM]: `
Специфика Telegram:
- Личный, доверительный тон. Будто пишешь другу.
- Можно использовать длинные тексты, но разбивать на абзацы.
- Используй жирный шрифт (**текст**) для акцентов.
- Эмодзи уместны, но не переспамливай.
- В конце часто задают вопрос, чтобы вызвать комментарии.
    `.trim(),

    [PromptKey.PLATFORM_VK]: `
Специфика ВКонтакте:
- Текст должен быть визуально чистым.
- Лонгриды работают хорошо, если заголовок цепляет.
- Аудитория ценит искренность и полезность.
- Хэштеги почти не работают, лучше не тратить на них место в начале.
    `.trim(),

    [PromptKey.PLATFORM_YOUTUBE]: `
Специфика YouTube (Сценарий):
- Это сценарий для озвучки голосом.
- Избегай сложных оборотов, пиши разговорным языком.
- Указывай визуальные подсказки в скобках [Кадр: ...].
- Первые 15 секунд критически важны для удержания.
    `.trim(),

    [PromptKey.PLATFORM_INSTAGRAM]: `
Специфика Instagram:
- Визуал первичен, но текст должен цеплять с первой строки (до кнопки "еще").
- Дели текст на короткие абзацы (воздух).
- Call to Action (CTA) обязателен в конце.
- Пиши эмоционально.
    `.trim(),

    [PromptKey.PLATFORM_THREADS]: `
Специфика Threads:
- Максимально коротко и хлестко.
- Провоцируй на дискуссию.
- Формат "одной мысли" или микро-истории.
- Без формальностей и вступлений.
    `.trim(),

    // --- FORMATS ---
    [PromptKey.FORMAT_STORY]: `
Формат Сторителлинг:
- Должен быть Герой (автор) и Конфликт (проблема).
- Используй структуру: Завязка -> Препятствие -> Решение -> Вывод.
- Показывай, а не рассказывай (Show, don't tell).
- Включи эмоции и детали.
    `.trim(),

    [PromptKey.FORMAT_EXPERT]: `
Формат Экспертный разбор:
- Четкая структура: Проблема -> Почему это важно -> Решение.
- Никакой воды. Только факты и польза.
- Тон уверенный, профессиональный.
- Используй списки и буллиты.
    `.trim(),

    [PromptKey.FORMAT_SHORT]: `
Формат Короткий пост:
- Одна мысль = один пост.
- Без вступлений. Сразу к сути.
- Максимальная плотность смысла.
    `.trim(),

    [PromptKey.FORMAT_PROVOCATION]: `
Формат Провокация:
- Выскажи непопулярное мнение.
- Оспорь общепринятый миф индустрии.
- Цель: вызвать полярные реакции (согласие или гнев).
- Будь аргументирован, но резок.
    `.trim(),

    [PromptKey.FORMAT_GENERIC]: `
Общий формат:
- Пиши интересно и живо.
- Соблюдай логику повествования.
    `.trim()
};

const COMMON_VARS = [
    { key: 'topic', description: 'Тема поста' },
    { key: 'platform', description: 'Соцсеть' },
    { key: 'archetype', description: 'Формат' }
];

export const PROMPT_VARIABLES: Record<PromptKey, PromptVariable[]> = {
    [PromptKey.PLAN_GENERATION]: [
        { key: 'author.role', description: 'Роль/Профессия автора' },
        { key: 'author.targetAudience', description: 'Описание целевой аудитории' },
        { key: 'author.audiencePainPoints', description: 'Боли и проблемы аудитории' },
        { key: 'strategy.preset', description: 'Выбранный пресет стратегии (напр. Рост)' },
        { key: 'strategy.weeklyFocus', description: 'Фокус недели' },
        { key: 'strategy.platforms', description: 'Список выбранных платформ' },
        { key: 'strategy.startDate', description: 'Дата начала' },
        { key: 'strategy.endDate', description: 'Дата конца' },
        { key: 'totalPosts', description: 'Рассчитанное кол-во постов' },
        { key: 'goals', description: 'Массив целей (Awareness, Sales и т.д.)' },
    ],
    [PromptKey.SCRIPT_WRITER]: [
        ...COMMON_VARS,
        { key: 'platformRules', description: 'Вставляет правила выбранной площадки' },
        { key: 'formatRules', description: 'Вставляет правила выбранного формата' },
        { key: 'contextInstruction', description: 'Доп. факты от пользователя' },
        { key: 'stylePrompt', description: 'Скомпилированный стиль автора' },
        { key: 'contextSoFar', description: 'Уже написанные части поста' },
        { key: 'currentUnitName', description: 'Название текущего блока (Хук, Тело...)' },
    ],
    [PromptKey.STYLE_ANALYSIS]: [
        { key: 'samples', description: 'Текст примеров постов пользователя' },
    ],
    [PromptKey.AUDIENCE_INSIGHTS]: [
        { key: 'author.role', description: 'Роль автора' },
        { key: 'author.targetAudience', description: 'ЦА' },
        { key: 'strategy.preset', description: 'Стратегия' },
        { key: 'strategy.weeklyFocus', description: 'Фокус' },
        { key: 'metricsSummary', description: 'JSON со статистикой постов' },
    ],
    [PromptKey.VISUAL_DIRECTOR]: [
        ...COMMON_VARS,
        { key: 'visualContext', description: 'Инструкции из визуального профиля' },
    ],
    [PromptKey.CALENDAR_ANALYSIS]: [
        { key: 'strategy.preset', description: 'Стратегия' },
        { key: 'strategy.weeklyFocus', description: 'Фокус' },
        { key: 'planData', description: 'Список тем и дат' },
    ],
    // Platform/Format prompts usually don't need variables as they ARE the injected content, 
    // but we allow common ones just in case.
    [PromptKey.PLATFORM_TELEGRAM]: [],
    [PromptKey.PLATFORM_VK]: [],
    [PromptKey.PLATFORM_YOUTUBE]: [],
    [PromptKey.PLATFORM_INSTAGRAM]: [],
    [PromptKey.PLATFORM_THREADS]: [],
    [PromptKey.FORMAT_STORY]: [],
    [PromptKey.FORMAT_EXPERT]: [],
    [PromptKey.FORMAT_SHORT]: [],
    [PromptKey.FORMAT_PROVOCATION]: [],
    [PromptKey.FORMAT_GENERIC]: []
};

export const PROMPT_LABELS: Record<PromptKey, string> = {
    [PromptKey.PLAN_GENERATION]: 'Генератор Контент-Плана',
    [PromptKey.SCRIPT_WRITER]: 'Сценарный Агент (Мастер)',
    [PromptKey.STYLE_ANALYSIS]: 'Аналитик Стиля',
    [PromptKey.AUDIENCE_INSIGHTS]: 'Аналитик Статистики',
    [PromptKey.VISUAL_DIRECTOR]: 'Визуальный Директор',
    [PromptKey.CALENDAR_ANALYSIS]: 'Аудитор Календаря',
    
    [PromptKey.PLATFORM_TELEGRAM]: 'Правила: Telegram',
    [PromptKey.PLATFORM_VK]: 'Правила: ВКонтакте',
    [PromptKey.PLATFORM_YOUTUBE]: 'Правила: YouTube',
    [PromptKey.PLATFORM_INSTAGRAM]: 'Правила: Instagram',
    [PromptKey.PLATFORM_THREADS]: 'Правила: Threads',

    [PromptKey.FORMAT_STORY]: 'Формат: Сторителлинг',
    [PromptKey.FORMAT_EXPERT]: 'Формат: Экспертный',
    [PromptKey.FORMAT_SHORT]: 'Формат: Короткий пост',
    [PromptKey.FORMAT_PROVOCATION]: 'Формат: Провокация',
    [PromptKey.FORMAT_GENERIC]: 'Формат: Общий'
};
