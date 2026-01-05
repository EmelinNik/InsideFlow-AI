
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
            PromptKey.FORMAT_SHORT,
            PromptKey.FORMAT_REFLECTION,
            PromptKey.FORMAT_NOTE,
            PromptKey.FORMAT_PERSONAL_XP,
            PromptKey.FORMAT_DAY_IN_LIFE,
            PromptKey.FORMAT_QUESTION,
            PromptKey.FORMAT_PROVOCATION,
            PromptKey.FORMAT_OBSERVATION,
            PromptKey.FORMAT_ERROR_ANALYSIS,
            PromptKey.FORMAT_SHORT_ADVICE,
            PromptKey.FORMAT_SUMMARY,
            PromptKey.FORMAT_STORY,
            PromptKey.FORMAT_EXPERT,
            PromptKey.FORMAT_POLL,
            PromptKey.FORMAT_LIST,
            PromptKey.FORMAT_CASE_STUDY,
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
- Ниша/ЦА: {{author.targetAudience}}
- Боли ЦА: {{author.audiencePainPoints}}
- Ценности бренда: {{author.values}}
- Табу (о чем не пишем): {{author.taboos}}

СТРАТЕГИЯ:
- Пресет: {{strategy.preset}}
- Фокус недели: {{strategy.weeklyFocus}}
- Платформы: {{strategy.platforms}}
- Период: с {{strategy.startDate}} по {{strategy.endDate}}

ЗАДАЧА:
Сгенерируй JSON-массив из {{totalPosts}} постов. Распредели их по датам равномерно.
Учитывай боли ЦА при выборе тем. Избегай тем из списка Табу.

Для каждого поста выбери:
1. topic: Цепляющий заголовок (учитывай боли ЦА).
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

ДНК АВТОРА:
- Роль: {{author.role}}
- Ценности: {{author.values}}
- Табу (строго соблюдать): {{author.taboos}}

ИНСТРУКЦИИ ПЛАТФОРМЫ:
{{platformRules}}

ИНСТРУКЦИИ ФОРМАТА:
{{formatRules}}

{{contextInstruction}}

СТИЛЬ ПИСЬМА (Tone of Voice):
{{stylePrompt}}

КОНТЕКСТ (Что уже написано):
{{contextSoFar}}

ЗАДАЧА:
Напиши 3 варианта для блока "{{currentUnitName}}".
Варианты должны быть разными по подаче, но строго в рамках стиля автора и без нарушения Табу.

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

СТАНДАРТЫ / KPI (Benchmarks) для площадок:
{{benchmarks}}

СТРАТЕГИЯ:
- Пресет: {{strategy.preset}}
- Фокус: {{strategy.weeklyFocus}}

ДАННЫЕ ПО ПОСТАМ (Фактические результаты):
{{metricsSummary}}

ЗАДАНИЕ:
1. Сравни результаты постов с KPI. Какие темы "пробили" бенчмарки?
2. Какие форматы (archetype) показали лучший ER (Вовлеченность)?
3. Дай 3 конкретных тактических совета: что изменить в следующей неделе.
4. Предложи изменение в темах, исходя из реакции на боли ЦА.

Формат ответа: Markdown.
    `.trim(),

    [PromptKey.VISUAL_DIRECTOR]: `
Ты — арт-директор. Предложи идею для визуализации поста.

ТЕМА: {{topic}}
ПЛАТФОРМА: {{platform}}
ЦЕННОСТИ БРЕНДА: {{author.values}}
КОНТЕКСТ: {{context}}
{{visualContext}}

Верни JSON:
- type: 'photo' | 'ai_image' | 'video'
- description: Описание для человека (ТЗ фотографу или оператору).
- aiPrompt: Промпт для Midjourney (на английском), если type='ai_image'.
    `.trim(),

    [PromptKey.CALENDAR_ANALYSIS]: `
Проанализируй контент-план на соответствие стратегии: {{strategy.preset}}.
Фокус: {{strategy.weeklyFocus}}.
Боли ЦА: {{author.audiencePainPoints}}

План: {{planData}}

Верни JSON:
- status: 'good' | 'normal' | 'bad'
- report: Markdown текст с анализом баланса целей, логики тем и рекомендациями. Закрывает ли план боли ЦА?
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
    [PromptKey.FORMAT_SHORT]: `
Формат Короткий пост:
- Одна сильная мысль = один пост.
- Начинай сразу с сути (без "Привет, сегодня я расскажу").
- Максимальная плотность смысла. Удаляй все лишние слова.
- Цель: чтобы читатель кивнул и сохранил.
    `.trim(),

    [PromptKey.FORMAT_REFLECTION]: `
Формат Размышление:
- Философский, глубокий тон.
- Задай риторический вопрос в начале.
- Свяжи повседневное событие с глобальным выводом.
- Оставь финал открытым, приглашая к дискуссии.
- Не учи жизни, а делись своими сомнениями или инсайтами.
    `.trim(),

    [PromptKey.FORMAT_NOTE]: `
Формат Заметка:
- Пиши так, будто это сообщение в "Избранное" или другу.
- Без сложного форматирования и заголовков.
- Ощущение "здесь и сейчас".
- Можно использовать сленг и небрежность (в меру).
- Искренность > Экспертность.
    `.trim(),

    [PromptKey.FORMAT_PERSONAL_XP]: `
Формат Личный опыт:
- Структура: "Я думал так... А оказалось так...".
- Опиши трансформацию героя (себя).
- Добавь чувственные детали (что видел, что чувствовал).
- Вывод должен быть прожит, а не вычитан в книге.
- Покажи уязвимость.
    `.trim(),

    [PromptKey.FORMAT_DAY_IN_LIFE]: `
Формат День из жизни:
- Хронологическая структура или нарезка моментов.
- Указывай время (09:00, 14:30).
- Покажи закулисье (Backstage) работы или жизни.
- Контраст между "ожиданием" (красивая картинка) и "реальностью" (труд).
    `.trim(),

    [PromptKey.FORMAT_QUESTION]: `
Формат Вопрос к аудитории:
- Цель: получить комментарии.
- Кратко опиши ситуацию/дилемму.
- Дай 2-3 варианта ответа или полярные мнения.
- Задай прямой вопрос в конце.
- Не давай готового ответа, пусть решают люди.
    `.trim(),

    [PromptKey.FORMAT_PROVOCATION]: `
Формат Провокация:
- Выскажи "Непопулярное мнение" (Unpopular Opinion).
- Оспорь миф индустрии или общепринятую истину.
- Будь резок, но аргументирован.
- Цель: разделить аудиторию на два лагеря (Согласны / Не согласны).
- Не бойся хейта, бойся равнодушия.
    `.trim(),

    [PromptKey.FORMAT_OBSERVATION]: `
Формат Наблюдение:
- Начинай с фразы "Я заметил, что..." или "Забавно, но...".
- Подметь деталь в поведении людей или трендах, которую другие игнорируют.
- Проанализируй, почему так происходит.
- Тон исследователя, антрополога.
    `.trim(),

    [PromptKey.FORMAT_ERROR_ANALYSIS]: `
Формат Разбор ошибки (Fuckup):
- Честно расскажи о провале. Без приукрашивания.
- Структура: Контекст -> Что пошло не так -> Последствия -> Главный урок.
- Покажи, как ты это исправил (или не исправил).
- Самоирония обязательна.
    `.trim(),

    [PromptKey.FORMAT_SHORT_ADVICE]: `
Формат Короткий совет:
- Формат "Делай раз, делай два".
- Максимально прикладной характер.
- Проблема -> Быстрое решение.
- Используй глаголы повелительного наклонения (Нажми, Скажи, Сделай).
    `.trim(),

    [PromptKey.FORMAT_SUMMARY]: `
Формат Итоги (Дня/Недели/Месяца):
- Структурируй списком (буллитами).
- Выдели 3 главных события/инсайта.
- Добавь категорию "Фейл недели" и "Победа недели".
- Планы на следующий период.
- Тон отчетный, но с личной оценкой.
    `.trim(),

    [PromptKey.FORMAT_STORY]: `
Формат Сторителлинг:
- Должен быть Герой (автор), Цель и Конфликт (препятствие).
- Используй структуру: Завязка -> Развитие -> Кульминация -> Развязка -> Мораль.
- Правило: Show, don't tell (Показывай, а не рассказывай).
- Включи диалоги и эмоции.
    `.trim(),

    [PromptKey.FORMAT_EXPERT]: `
Формат Экспертный разбор:
- Четкая логическая структура: Проблема -> Почему это важно -> Решение -> Пример.
- Никакой воды. Только факты, цифры и польза.
- Тон уверенный, профессиональный, наставнический.
- Используй списки и визуальное деление текста.
    `.trim(),

    [PromptKey.FORMAT_POLL]: `
Формат Интерактив / Опрос:
- Задай тему, которая волнует аудиторию.
- Актуализируй проблему или интерес.
- В конце предложи 3-4 конкретных варианта ответа для опроса (текст вариантов должен быть коротким и емким).
- Призови проголосовать.
    `.trim(),

    [PromptKey.FORMAT_LIST]: `
Формат Подборка / Чек-лист:
- Полезный список ресурсов, инструментов или шагов.
- Каждый пункт должен быть ценным сам по себе.
- Структура: Вступление (зачем это нужно) -> Нумерованный список -> Заключение (сохрани, чтобы не потерять).
- Высокая виральность (потенциал репоста).
    `.trim(),

    [PromptKey.FORMAT_CASE_STUDY]: `
Формат Кейс-стади:
- Структура: Точка А (Было) -> Точка Б (Стало) -> Что сделали (Инструменты).
- Используй цифры и факты.
- Доказательство экспертности через результат.
- Вывод: почему этот метод сработал.
    `.trim(),

    [PromptKey.FORMAT_GENERIC]: `
Общий формат:
- Пиши интересно и живо.
- Соблюдай логику повествования.
- Учитывай тональность автора.
    `.trim()
};

const GENERATION_VARS = [
    { key: 'topic', description: 'Тема поста' },
    { key: 'platform', description: 'Выбранная соцсеть' },
    { key: 'archetype', description: 'Выбранный формат' },
    { key: 'author.role', description: 'Роль автора' },
    { key: 'author.targetAudience', description: 'ЦА автора' },
    { key: 'author.voice', description: 'Голос (Я/Мы)' },
    { key: 'author.tone', description: 'Тон (прилагательные)' },
    { key: 'author.values', description: 'Ценности бренда' },
    { key: 'author.taboos', description: 'Табу и запреты' },
];

export const PROMPT_VARIABLES: Record<PromptKey, PromptVariable[]> = {
    [PromptKey.PLAN_GENERATION]: [
        { key: 'author.role', description: 'Роль/Профессия автора' },
        { key: 'author.targetAudience', description: 'Описание целевой аудитории' },
        { key: 'author.audiencePainPoints', description: 'Боли и проблемы аудитории' },
        { key: 'author.values', description: 'Ценности бренда' },
        { key: 'author.taboos', description: 'Табу и запреты' },
        { key: 'strategy.preset', description: 'Выбранный пресет стратегии (напр. Рост)' },
        { key: 'strategy.weeklyFocus', description: 'Фокус недели' },
        { key: 'strategy.platforms', description: 'Список выбранных платформ' },
        { key: 'strategy.startDate', description: 'Дата начала' },
        { key: 'strategy.endDate', description: 'Дата конца' },
        { key: 'totalPosts', description: 'Рассчитанное кол-во постов' },
        { key: 'goals', description: 'Массив целей (Awareness, Sales и т.д.)' },
    ],
    [PromptKey.SCRIPT_WRITER]: [
        ...GENERATION_VARS,
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
        { key: 'benchmarks', description: 'KPI (нормы) по площадкам' },
        { key: 'strategy.preset', description: 'Стратегия' },
        { key: 'strategy.weeklyFocus', description: 'Фокус' },
        { key: 'metricsSummary', description: 'JSON со статистикой постов' },
    ],
    [PromptKey.VISUAL_DIRECTOR]: [
        ...GENERATION_VARS,
        { key: 'visualContext', description: 'Инструкции из визуального профиля' },
        { key: 'context', description: 'Контекст и факты от пользователя' },
    ],
    [PromptKey.CALENDAR_ANALYSIS]: [
        { key: 'strategy.preset', description: 'Стратегия' },
        { key: 'strategy.weeklyFocus', description: 'Фокус' },
        { key: 'author.audiencePainPoints', description: 'Боли ЦА' },
        { key: 'planData', description: 'Список тем и дат' },
    ],
    
    // Enabling variables for all Platforms
    [PromptKey.PLATFORM_TELEGRAM]: GENERATION_VARS,
    [PromptKey.PLATFORM_VK]: GENERATION_VARS,
    [PromptKey.PLATFORM_YOUTUBE]: GENERATION_VARS,
    [PromptKey.PLATFORM_INSTAGRAM]: GENERATION_VARS,
    [PromptKey.PLATFORM_THREADS]: GENERATION_VARS,

    // Enabling variables for all Formats
    [PromptKey.FORMAT_SHORT]: GENERATION_VARS,
    [PromptKey.FORMAT_REFLECTION]: GENERATION_VARS,
    [PromptKey.FORMAT_NOTE]: GENERATION_VARS,
    [PromptKey.FORMAT_PERSONAL_XP]: GENERATION_VARS,
    [PromptKey.FORMAT_DAY_IN_LIFE]: GENERATION_VARS,
    [PromptKey.FORMAT_QUESTION]: GENERATION_VARS,
    [PromptKey.FORMAT_PROVOCATION]: GENERATION_VARS,
    [PromptKey.FORMAT_OBSERVATION]: GENERATION_VARS,
    [PromptKey.FORMAT_ERROR_ANALYSIS]: GENERATION_VARS,
    [PromptKey.FORMAT_SHORT_ADVICE]: GENERATION_VARS,
    [PromptKey.FORMAT_SUMMARY]: GENERATION_VARS,
    [PromptKey.FORMAT_STORY]: GENERATION_VARS,
    [PromptKey.FORMAT_EXPERT]: GENERATION_VARS,
    [PromptKey.FORMAT_POLL]: GENERATION_VARS,
    [PromptKey.FORMAT_LIST]: GENERATION_VARS,
    [PromptKey.FORMAT_CASE_STUDY]: GENERATION_VARS,
    [PromptKey.FORMAT_GENERIC]: GENERATION_VARS
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

    [PromptKey.FORMAT_SHORT]: 'Формат: Короткий пост',
    [PromptKey.FORMAT_REFLECTION]: 'Формат: Размышление',
    [PromptKey.FORMAT_NOTE]: 'Формат: Заметка',
    [PromptKey.FORMAT_PERSONAL_XP]: 'Формат: Личный опыт',
    [PromptKey.FORMAT_DAY_IN_LIFE]: 'Формат: День из жизни',
    [PromptKey.FORMAT_QUESTION]: 'Формат: Вопрос к аудитории',
    [PromptKey.FORMAT_PROVOCATION]: 'Формат: Провокация',
    [PromptKey.FORMAT_OBSERVATION]: 'Формат: Наблюдение',
    [PromptKey.FORMAT_ERROR_ANALYSIS]: 'Формат: Разбор ошибки',
    [PromptKey.FORMAT_SHORT_ADVICE]: 'Формат: Короткий совет',
    [PromptKey.FORMAT_SUMMARY]: 'Формат: Итоги',
    [PromptKey.FORMAT_STORY]: 'Формат: Сторителлинг',
    [PromptKey.FORMAT_EXPERT]: 'Формат: Экспертный',
    [PromptKey.FORMAT_POLL]: 'Формат: Опрос / Интерактив',
    [PromptKey.FORMAT_LIST]: 'Формат: Чек-лист / Подборка',
    [PromptKey.FORMAT_CASE_STUDY]: 'Формат: Кейс-стади',
    [PromptKey.FORMAT_GENERIC]: 'Формат: Общий'
};
