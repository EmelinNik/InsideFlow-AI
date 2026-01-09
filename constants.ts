
import { PromptKey, TargetPlatform, PostArchetype, PlatformConfig, ArchetypeConfig } from "./types";

export const PROMPT_VARIABLES: Record<PromptKey, string[]> = {
  analyze_identity: ['{{description}}', '{{products}}'],
  generate_plan: ['{{role}}', '{{targetAudience}}', '{{painPoints}}', '{{preset}}', '{{focus}}', '{{platforms}}', '{{period}}', '{{batchNote}}', '{{goals}}', '{{count}}'],
  generate_unit_options: ['{{topic}}', '{{platform}}', '{{archetype}}', '{{platformNote}}', '{{contextInstruction}}', '{{stylePrompt}}', '{{contextSoFar}}', '{{unitName}}', '{{stepInstruction}}'],
  analyze_calendar: ['{{preset}}', '{{planJson}}'],
  generate_visual: ['{{topic}}', '{{platform}}', '{{visualContext}}', '{{contentContext}}']
};

export const DEFAULT_PROMPTS: Record<PromptKey, string> = {
  analyze_identity: `
        Ты — ведущий бренд-стратег и эксперт по маркетингу. 
        Твоя задача — провести глубокий анализ проекта и сформировать профиль идеальной аудитории, а также дать стратегические рекомендации по продажам.
        
        ВХОДНЫЕ ДАННЫЕ:
        Проект: {{description}}
        Продукты/Услуги: {{products}}

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
  `,
  generate_plan: `
      Ты — стратегический контент-планировщик. Твоя задача — создать расписание постов.
      
      ПРОФИЛЬ АВТОРА:
      - Роль: {{role}}
      - Ниша: {{targetAudience}}
      - Боли ЦА: {{painPoints}}
      
      СТРАТЕГИЯ:
      - Пресет: {{preset}}
      - Фокус недели: {{focus}}
      - Платформы: {{platforms}}
      - Период: {{period}}
      
      {{batchNote}}

      Сгенерируй JSON-массив из {{count}} элементов.
      Для каждого поста выбери:
      1. topic: Цепляющий заголовок.
      2. rationale: Краткое обоснование.
      3. platform: Конкретная платформа из списка.
      4. archetype: Формат поста.
      5. goal: Одна из целей из пула.
      
      ИСПОЛЬЗУЙ ЭТОТ ПУЛ ЦЕЛЕЙ:
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
  `,
  generate_unit_options: `
        Ты — гострайтер. Мы пишем пост по частям.
        ТЕМА: {{topic}}
        ПЛАТФОРМА: {{platform}}
        АРХЕТИП: {{archetype}}
        
        {{platformNote}}
        {{contextInstruction}}
        
        СТИЛЬ:
        {{stylePrompt}}

        КОНТЕКСТ (Что уже написано):
        {{contextSoFar}}

        ТЕКУЩИЙ БЛОК: "{{unitName}}"
        ЗАДАЧА БЛОКА: {{stepInstruction}}

        Напиши 3 варианта для этого блока.
        Если задача блока — сформулировать ВОПРОС, то напиши 3 варианта глубокого вопроса к автору.
        Формат JSON:
        [
          { "text": "...", "reasoning": "Почему это круто", "isBest": boolean }
        ]
  `,
  analyze_calendar: `
      Анализ контент-плана: {{preset}}. 
      План: {{planJson}}
      
      Верни JSON: { "status": "good" | "normal" | "bad", "report": "Markdown text" }.
  `,
  generate_visual: `
        Ты — креативный арт-директор. Твоя задача — придумать идею для визуального оформления поста.
        
        ВХОДНЫЕ ДАННЫЕ:
        Тема: {{topic}}
        Платформа: {{platform}}
        {{visualContext}}
        {{contentContext}}

        ИНСТРУКЦИЯ:
        Проанализируй тему и (если есть) текст поста. Предложи визуальный образ, который дополнит смысл, привлечет внимание и будет соответствовать платформе.
        
        Верни JSON: 
        {
            "type": "photo" | "ai_image" | "video", 
            "description": "Подробное ТЗ на русском языке для дизайнера или фотографа. Опиши композицию, настроение, объекты.", 
            "aiPrompt": "Готовый промпт на АНГЛИЙСКОМ языке для генерации в Midjourney/DALL-E."
        }
  `
};

export const PROMPT_TITLES: Record<PromptKey, string> = {
    analyze_identity: "Анализ Личности и Бренда",
    generate_plan: "Генерация Контент-плана",
    generate_unit_options: "Генерация Текста (Блоками)",
    analyze_calendar: "Анализ Сетки Календаря",
    generate_visual: "Генерация Визуального ТЗ"
};

export const DEFAULT_PLATFORM_CONFIGS: PlatformConfig[] = [
    {
        id: TargetPlatform.TELEGRAM,
        name: TargetPlatform.TELEGRAM,
        rules: "Telegram: Прямой, вовлекающий стиль. Используй эмодзи как акценты, а не замену словам. Четкие заголовки. Лаконичность. Обязателен призыв к обсуждению или реакции.",
        isSystem: true
    },
    {
        id: TargetPlatform.VK_POST,
        name: TargetPlatform.VK_POST,
        rules: "ВКонтакте (Текст): Более структурированный и подробный текст для чтения. Используй абзацы. Ориентируйся на создание комьюнити. Можно использовать более длинные предложения и детальные списки.",
        isSystem: true
    },
    {
        id: TargetPlatform.INSTAGRAM,
        name: TargetPlatform.INSTAGRAM,
        rules: "Instagram/Reels: Визуальный стиль. Первый абзац — мощный хук (зацепка). Короткие, рубленые фразы. Текст должен дополнять картинку/видео. Много воздуха между строками.",
        isSystem: true
    },
    {
        id: TargetPlatform.YOUTUBE,
        name: TargetPlatform.YOUTUBE,
        rules: "YouTube: Оптимизированное описание. Используй ключевые слова в начале. Четкое резюме видео. Таймкоды и ссылки на другие ресурсы. Призыв к подписке.",
        isSystem: true
    },
    {
        id: TargetPlatform.THREADS,
        name: TargetPlatform.THREADS,
        rules: "Threads: Разговорный, почти «твиттерский» стиль. Короткие мысли, провоцирующие на ответ. Можно использовать структуру треда (1/3, 2/3).",
        isSystem: true
    }
];

export const DEFAULT_ARCHETYPE_CONFIGS: ArchetypeConfig[] = [
    {
        id: PostArchetype.STORY,
        name: PostArchetype.STORY,
        structure: [
            { id: 'HOOK', description: 'Интригующее начало, которое заставляет читать дальше. Не раскрывай всё сразу.' },
            { id: 'CONTEXT', description: 'Где и когда происходит действие? Введи читателя в курс дела.' },
            { id: 'CONFLICT', description: 'В чем проблема? С каким вызовом столкнулся герой?' },
            { id: 'CLIMAX', description: 'Пиковый момент истории. Как разрешилась ситуация?' },
            { id: 'RESOLUTION', description: 'Что произошло после? Каков результат?' },
            { id: 'MORAL', description: 'Какой вывод можно сделать? Чему учит эта история?' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.EXPERT,
        name: PostArchetype.EXPERT,
        structure: [
            { id: 'HOOK', description: 'Обозначь тему и почему это важно прямо сейчас.' },
            { id: 'PROBLEM', description: 'Опиши боль или частую ошибку, с которой сталкивается аудитория.' },
            { id: 'MISTAKE', description: 'Почему старые методы не работают? Развей миф.' },
            { id: 'SOLUTION', description: 'Дай пошаговое решение или свой метод.' },
            { id: 'PROOF', description: 'Приведи пример, кейс или доказательство, что это работает.' },
            { id: 'CTA', description: 'Призыв сохранить, применить или задать вопрос.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.SHORT_POST,
        name: PostArchetype.SHORT_POST,
        structure: [
            { id: 'HOOK', description: 'Яркое заявление или вопрос.' },
            { id: 'VALUE', description: 'Одна главная мысль, инсайт или новость. Кратко и по делу.' },
            { id: 'CTA', description: 'Вопрос к аудитории или призыв.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.PROVOCATION,
        name: PostArchetype.PROVOCATION,
        structure: [
            { id: 'TRIGGER', description: 'Спорное утверждение, идущее вразрез с общепринятым мнением.' },
            { id: 'CONTROVERSIAL_OPINION', description: 'Твоя личная, непопулярная позиция. Почему ты так считаешь?' },
            { id: 'ARGUMENT', description: 'Один железобетонный аргумент в защиту твоей позиции.' },
            { id: 'QUESTION', description: 'Спроси читателей, согласны ли они. Провоцируй обсуждение.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.ERROR_ANALYSIS,
        name: PostArchetype.ERROR_ANALYSIS,
        structure: [
            { id: 'HOOK', description: 'Тизер провала или ошибки. "Как я потерял..."' },
            { id: 'CONTEXT', description: 'Что я хотел сделать и как всё шло по плану.' },
            { id: 'FAILURE_POINT', description: 'Момент, когда всё пошло не так. Опиши эмоции.' },
            { id: 'ANALYSIS', description: 'Почему это произошло? Разбор полетов.' },
            { id: 'LESSON', description: 'Главный урок, который я вынес.' },
            { id: 'CTA', description: 'Вопрос: бывало ли у вас такое?' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.DAY_IN_LIFE,
        name: PostArchetype.DAY_IN_LIFE,
        structure: [
            { id: 'MORNING_CONTEXT', description: 'С чего начался день? Настроение и планы.' },
            { id: 'EVENT', description: 'Ключевое событие дня или наблюдение.' },
            { id: 'REFLECTION', description: 'Мысли в процессе. О чем ты думал?' },
            { id: 'CONCLUSION', description: 'Итог дня. С каким чувством засыпаешь?' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.REFLECTION,
        name: PostArchetype.REFLECTION,
        structure: [
            { id: 'HOOK', description: 'Начни с наблюдения или мысли, которая не дает покоя. Задай тон размышления.' },
            { id: 'THOUGHT_PROCESS', description: 'Раскрой ход своих мыслей. Как ты пришел к этому? Какие сомнения были?' },
            { id: 'INSIGHT', description: 'Глубокий вывод или истина, которую ты осознал.' },
            { id: 'CONCLUSION', description: 'Как это меняет твой взгляд на вещи? Подведи итог.' },
            { id: 'CTA', description: 'Пригласи читателя поделиться своим мнением. Мягкий вопрос.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.NOTE,
        name: PostArchetype.NOTE,
        structure: [
            { id: 'TOPIC', description: 'Заголовок или тема заметки.' },
            { id: 'DETAIL', description: 'Суть заметки, факты, наблюдения.' },
            { id: 'TAKEAWAY', description: 'Что с этим делать? Краткий вывод.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.PERSONAL_XP,
        name: PostArchetype.PERSONAL_XP,
        structure: [
            { id: 'SITUATION', description: 'Ситуация, с которой ты столкнулся.' },
            { id: 'ACTION', description: 'Что ты предпринял?' },
            { id: 'RESULT', description: 'Что из этого вышло? Цифры или эмоции.' },
            { id: 'FEELING', description: 'Как ты себя чувствуешь по этому поводу?' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.QUESTION,
        name: PostArchetype.QUESTION,
        structure: [
            { id: 'CONTEXT', description: 'Коротко обрисуй ситуацию.' },
            { id: 'PROBLEM', description: 'В чем сложность или дилемма?' },
            { id: 'QUESTION', description: 'Сам вопрос к аудитории. Четкий и понятный.' },
            { id: 'OWN_OPINION', description: 'Твое предварительное мнение (опционально).' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.OBSERVATION,
        name: PostArchetype.OBSERVATION,
        structure: [
            { id: 'TRIGGER', description: 'Что ты увидел или услышал?' },
            { id: 'DESCRIPTION', description: 'Детали наблюдения.' },
            { id: 'ANALYSIS', description: 'Почему это интересно? Скрытый смысл.' },
            { id: 'CONCLUSION', description: 'Вывод или прогноз.' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.SHORT_ADVICE,
        name: PostArchetype.SHORT_ADVICE,
        structure: [
            { id: 'PROBLEM', description: 'Частая мелкая проблема.' },
            { id: 'QUICK_FIX', description: 'Быстрое, конкретное решение в 1-2 предложениях.' },
            { id: 'BENEFIT', description: 'Что изменится, если применить совет?' }
        ],
        isSystem: true
    },
    {
        id: PostArchetype.SUMMARY,
        name: PostArchetype.SUMMARY,
        structure: [
            { id: 'INTRO', description: 'Вводная фраза: "Итоги недели/дня".' },
            { id: 'POINT_1', description: 'Главное событие 1.' },
            { id: 'POINT_2', description: 'Главное событие 2.' },
            { id: 'POINT_3', description: 'Главное событие 3.' },
            { id: 'OUTRO', description: 'Планы на будущее или пожелание.' }
        ],
        isSystem: true
    }
];
