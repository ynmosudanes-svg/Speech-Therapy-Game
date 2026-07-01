const fallbackName = 'لعبة علاجية';
const getDefaultActivityTitle = (index = 0) => `نشاط ${index + 1}`;
const getDefaultInstructionForType = (type) => {
  if (type === 'matching.similar') return 'اختر الصورة المطابقة';
  if (type === 'matching.different') return 'اختيار من متعدد';
  if (type === 'matching.find') return 'أوجد الصورة المطلوبة';
  if (type === 'touch.hand') return 'اسحب اليد والمس الصورة المطلوبة';
  if (type === 'motor.shake_image') return '\u0627\u0645\u0633\u0643 \u0627\u0644\u0635\u0648\u0631\u0629 \u0648\u0647\u0632\u0647\u0627';
  if (type === 'matching.shadow') return 'انظر إلى الظل واختر الصورة المناسبة';
  if (type === 'picture.reveal') return 'اكشف الصورة ثم اختر الإجابة الصحيحة';
  if (type === 'emotion.faces') return 'أين الوجه السعيد؟';
  if (type === 'image.complete_part') return 'اسحب الجزء الصحيح إلى الخانة الناقصة لإكمال الصورة';
  if (type === 'memory.cards') return 'افتح كارتين وابحث عن الصور المتطابقة';
  if (type === 'memory.grid') return 'تذكر أماكن الصور ثم ابحث عن الصورة المطلوبة';
  if (type === 'true_false') return 'استمع وحدد الإجابة الصحيحة';
  if (type === 'eye_tracking.choose') return 'انظر إلى الصورة الصحيحة باستمرار';
  if (type === 'eye_tracking.bird') return 'انظر إلى العصفور ليطير';
  if (type === 'grammar.adjectives') return 'اسحب الكلمة المناسبة لتكوين الجملة';
  if (type === 'spatial.concepts') return 'أين العنصر؟ اختر المفهوم المكاني الصحيح';
  if (type === 'commands.multi_step') return 'اضغط على العناصر بالترتيب الصحيح';
  return 'اكتب السؤال هنا';
};

const createMatchingOption = (id, isCorrect = false) => ({
  id,
  label: '',
  image: '',
  textAr: '',
  isCorrect,
});

const createShadowPreviewOptions = () => [
  { id: 'elephant', label: 'فيل', textAr: 'فيل', image: '', isCorrect: true },
  { id: 'lion', label: 'أسد', textAr: 'أسد', image: '', isCorrect: false },
  { id: 'giraffe', label: 'زرافة', textAr: 'زرافة', image: '', isCorrect: false },
  { id: 'horse', label: 'حصان', textAr: 'حصان', image: '', isCorrect: false },
];

const createRevealPreviewOptions = () => [
  { id: 'apple', label: 'تفاح', textAr: 'تفاح', image: '', isCorrect: true },
  { id: 'ball', label: 'كرة', textAr: 'كرة', image: '', isCorrect: false },
  { id: 'cat', label: 'قطة', textAr: 'قطة', image: '', isCorrect: false },
  { id: 'car', label: 'سيارة', textAr: 'سيارة', image: '', isCorrect: false },
];

const createEmotionPreviewOptions = () => [
  { id: 'happy', label: 'سعيد', textAr: 'سعيد', questionLabelAr: 'السعيد', emoji: '😊', isCorrect: true },
  { id: 'sad', label: 'حزين', textAr: 'حزين', questionLabelAr: 'الحزين', emoji: '😢', isCorrect: false },
  { id: 'angry', label: 'غاضب', textAr: 'غاضب', questionLabelAr: 'الغاضب', emoji: '😡', isCorrect: false },
  { id: 'sleepy', label: 'نعسان', textAr: 'نعسان', questionLabelAr: 'النعسان', emoji: '😴', isCorrect: false },
  { id: 'scared', label: 'خائف', textAr: 'خائف', questionLabelAr: 'الخائف', emoji: '😨', isCorrect: false },
  { id: 'surprised', label: 'مندهش', textAr: 'مندهش', questionLabelAr: 'المندهش', emoji: '😮', isCorrect: false },
];

const createDragItem = (id, startPosition = 'bottom', isCorrect = false) => ({
  id,
  image: '',
  labelAr: '',
  startPosition,
  isCorrect,
});

const createMemoryCards = () => [
  { id: `memory_${Date.now()}_1`, image: '', textAr: 'قطة', audioUrl: '', emoji: '🐱', category: 'animals' },
  { id: `memory_${Date.now()}_2`, image: '', textAr: 'تفاحة', audioUrl: '', emoji: '🍎', category: 'fruits' },
  { id: `memory_${Date.now()}_3`, image: '', textAr: 'سيارة', audioUrl: '', emoji: '🚗', category: 'vehicles' },
  { id: `memory_${Date.now()}_4`, image: '', textAr: 'نجمة', audioUrl: '', emoji: '⭐', category: 'shapes' },
];

const createMemoryGridCards = () => [
  ...createMemoryCards(),
  { id: `memory_grid_${Date.now()}_5`, image: '', textAr: 'كرة', audioUrl: '', emoji: '⚽', category: 'objects' },
  { id: `memory_grid_${Date.now()}_6`, image: '', textAr: 'كتاب', audioUrl: '', emoji: '📘', category: 'household' },
  { id: `memory_grid_${Date.now()}_7`, image: '', textAr: 'موزة', audioUrl: '', emoji: '🍌', category: 'fruits' },
  { id: `memory_grid_${Date.now()}_8`, image: '', textAr: 'كلب', audioUrl: '', emoji: '🐶', category: 'animals' },
  { id: `memory_grid_${Date.now()}_9`, image: '', textAr: 'بيت', audioUrl: '', emoji: '🏠', category: 'household' },
];

export const getDefaultActivityForType = (type, activityIndex = 0) => {
  if (type === 'cards.audio_flashcards') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: 'تعرف على الكلمات',
      instructionAudio: '',
      difficulty: 'easy',
      cards: [
        { id: `card_${Date.now()}_1`, image: '', textAr: '', audioUrl: '' },
        { id: `card_${Date.now()}_2`, image: '', textAr: '', audioUrl: '' },
      ],
    };
  }
  if (type === 'memory.cards') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      pairCount: 4,
      cards: createMemoryCards(),
    };
  }
  if (type === 'memory.grid') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'medium',
      gridSize: 3,
      viewSeconds: 4,
      cards: createMemoryGridCards(),
    };
  }
  if (type === 'matching.similar') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'matching.different') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      useHeroImage: false,
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'matching.find') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }
  if (type === 'touch.hand') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      pointerType: 'hand',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'motor.shake_image') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      image: '',
      requiredShakes: 3,
    };
  }

  if (type === 'true_false') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      correctAnswer: true,
      options: [
        { id: `opt_${Date.now()}_1`, image: '' }
      ],
    };
  }

  if (type === 'eye_tracking.choose') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2', false)],
    };
  }

  if (type === 'grammar.adjectives') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      sentenceText: 'هذا [     ] [     ]',
      adjectives: [
        { id: `adj_${Date.now()}_1`, textAr: 'ناعم', image: '', isCorrect: true },
        { id: `adj_${Date.now()}_2`, textAr: 'صلب', image: '', isCorrect: false }
      ],
      nouns: [
        { id: `noun_${Date.now()}_1`, textAr: 'كرسي', image: '', isCorrect: true },
        { id: `noun_${Date.now()}_2`, textAr: 'سرير', image: '', isCorrect: false }
      ]
    };
  }

  if (type === 'eye_tracking.bird') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      heroImage: '',
      difficulty: 'easy',
    };
  }

  if (type === 'spatial.concepts') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      sceneImage: '',
      gameMode: 'choose_concept',
      conceptType: 'above_below',
      options: [
        { id: `opt_${Date.now()}_1`, textAr: 'فوق', emoji: '⬆️', image: '', isCorrect: true },
        { id: `opt_${Date.now()}_2`, textAr: 'تحت', emoji: '⬇️', image: '', isCorrect: false },
      ],
      dragItem: { id: 'drag_1', image: '', labelAr: '' },
      dropZone: { x: 50, y: 20, width: 20, height: 20 },
    };
  }

  if (type === 'commands.multi_step') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      items: [
        { id: `cmd_${Date.now()}_1`, labelAr: 'المدرب', textAr: 'المدرب', image: '', stepOrder: 1 },
        { id: `cmd_${Date.now()}_2`, labelAr: 'الكرة', textAr: 'الكرة', image: '', stepOrder: 2 },
        { id: `cmd_${Date.now()}_3`, labelAr: 'البنت', textAr: 'البنت', image: '', stepOrder: null },
        { id: `cmd_${Date.now()}_4`, labelAr: 'الكرسي', textAr: 'الكرسي', image: '', stepOrder: null },
      ],
      commandSteps: [],
    };
  }

  if (type === 'matching.shadow') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: createShadowPreviewOptions(),
    };
  }

  if (type === 'picture.reveal') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      image: '',
      gridSize: 4,
      revealMode: 'manual',      options: createRevealPreviewOptions(),
    };
  }

  if (type === 'emotion.faces') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      options: createEmotionPreviewOptions(),
    };
  }

  if (type === 'image.complete_part') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: getDefaultInstructionForType(type),
      instructionAudio: '',
      difficulty: 'easy',
      image: '',
      gridRows: 2,
      gridCols: 2,
      missingPartCount: 1,
      missingCellIds: ['0'],
      distractorCount: 3,
      cropMode: 'grid',
      cropRect: null,
      options: [
        { id: `opt_${Date.now()}_1`, textAr: '', image: '', isCorrect: false },
        { id: `opt_${Date.now()}_2`, textAr: '', image: '', isCorrect: false },
        { id: `opt_${Date.now()}_3`, textAr: '', image: '', isCorrect: false },
      ],
    };
  }

  if (type === 'action.drag_to_target') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      mode: 'one-to-one',
      sceneImage: '',
      promptLevel: '',
      draggables: [createDragItem('drag_1', 'bottom', true), createDragItem('drag_2', 'bottom', false)],
    };
  }

  if (type === 'navigation.move_to_target') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      interactionMode: 'buttons',
      sceneImage: '',
      movable: {
        image: '',
        startX: 1,
        startY: 1,
      },
      target: {
        image: '',
        x: 5,
        y: 3,
        radius: 1,
      },
      grid: {
        cols: 8,
        rows: 6,
      },
      moveSound: '',
      boundarySound: '',
    };
  }

  if (type === 'navigation.maze') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      maze: {
        grid: [
          [1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 1, 1, 1, 0, 1],
          [1, 0, 0, 0, 1, 0, 1],
          [1, 1, 1, 0, 1, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 1, 1, 1, 1, 1, 1],
        ],
        startX: 2,
        startY: 2,
        goalX: 6,
        goalY: 6,
        playerImage: '',
        goalImage: '',
      },
      moveSound: '',
      boundarySound: '',
    };
  }

  if (type === 'puzzle.jigsaw') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: 'ركب الصورة',
      instructionAudio: '',
      difficulty: 'easy',
      image: '',
      gridSize: 3,
      puzzleMode: 'jigsaw',
      missingSlotIndex: 0,
    };
  }

  if (type === 'matching.connect') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: 'قم بتوصيل كل صورة بما يطابقها',
      instructionAudio: '',
      difficulty: 'easy',
      pairs: [
        {
          id: `pair_${Date.now()}_1`,
          sourceImage: '',
          sourceLabel: '',
          targetImage: '',
          targetLabel: '',
        },
        {
          id: `pair_${Date.now()}_2`,
          sourceImage: '',
          sourceLabel: '',
          targetImage: '',
          targetLabel: '',
        },
      ],
    };
  }

  if (type === 'text.missing_word') {
    return {
      type,
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      wordWithBlank: '',
      image: '',
      options: [
        { id: `opt_${Date.now()}_1`, textAr: '', isCorrect: true },
        { id: `opt_${Date.now()}_2`, textAr: '', isCorrect: false },
      ],
    };
  }

  return {
    type,
    id: `activity_${Date.now()}`,
    titleAr: getDefaultActivityTitle(activityIndex),
    questionAr: '',
    instructionAudio: '',
    difficulty: 'easy',
    steps: [
      { id: 'step_1', image: '', labelAr: '', order: 1 },
      { id: 'step_2', image: '', labelAr: '', order: 2 },
      { id: 'step_3', image: '', labelAr: '', order: 3 },
    ],
  };
};

export const createEmptyBuilderConfig = (type = 'matching.similar') => ({
  version: 2,
  name: '',
  nameAr: '',
  templateType: type,
  media: {
    introVideo: '',
    successSound: '',
    failSound: '',
  },
  levels: [1, 2, 3].map((levelNumber) => ({
    levelNumber,
    starsToUnlock: levelNumber === 1 ? 0 : 2,
    activities: levelNumber === 1 ? [getDefaultActivityForType(type, 0)] : [],
  })),
});

export const normalizeActivityTypesForConfig = (config, fallbackType) => {
  const defaultType = fallbackType || config?.templateType || 'matching.similar';

  return {
    ...config,
    templateType: defaultType,
    levels: [1, 2, 3].map((levelNumber, index) => {
      const level = config?.levels?.[index] || {};
      const activities = Array.isArray(level.activities) ? level.activities : [];

      return {
        ...level,
        levelNumber: Number(level.levelNumber ?? levelNumber),
        starsToUnlock: Number(level.starsToUnlock ?? (levelNumber === 1 ? 0 : 2)),
        activities: activities.map((activity) => ({
          ...activity,
          type: activity.type || defaultType,
        })),
      };
    }),
  };
};

export const normalizeBuilderConfig = (game) => {
  const config = game?.config;

  if (config?.version === 2 && Array.isArray(config.levels)) {
    const templateType = game?.type || config.templateType || 'matching.similar';
    return normalizeActivityTypesForConfig({
      ...config,
      templateType,
      name: game?.name || config.name || '',
      nameAr: game?.titleAr || game?.nameAr || config.nameAr || '',
      media: {
        introVideo: config?.media?.introVideo || '',
        successSound: config?.media?.successSound || game?.successSound || '',
        failSound: config?.media?.failSound || game?.failSound || '',
      },
      levels: [1, 2, 3].map((levelNumber, index) => ({
        levelNumber,
        starsToUnlock: Number(config.levels?.[index]?.starsToUnlock ?? (levelNumber === 1 ? 0 : 2)),
        activities: Array.isArray(config.levels?.[index]?.activities)
          ? config.levels[index].activities
          : [],
      })),
    }, templateType);
  }

  return createEmptyBuilderConfig(game?.type || 'matching.similar');
};

export const buildActivityRuntimeGame = ({
  nameAr,
  templateType,
  activity,
  sharedMedia = {},
  gameId = 'preview',
}) => {
  const titleAr = nameAr || activity?.titleAr || fallbackName;

  if (templateType === 'matching.similar' || templateType === 'matching.different' || templateType === 'matching.find' || templateType === 'matching.shadow' || templateType === 'touch.hand') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          hero: { image: templateType === 'matching.different' && activity?.useHeroImage === false ? '' : (activity?.heroImage || '') },
          pointerType: templateType === 'touch.hand' ? (activity?.pointerType === 'finger' ? 'finger' : 'hand') : undefined,
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'eye_tracking.choose') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'motor.shake_image') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          image: activity?.image || activity?.heroImage || '',
          requiredShakes: Math.min(3, Math.max(1, Number(activity?.requiredShakes ?? 3) || 3)),
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'eye_tracking.bird') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          hero: { image: templateType === 'matching.different' && activity?.useHeroImage === false ? '' : (activity?.heroImage || '') },
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'true_false') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          correctAnswer: activity?.correctAnswer ?? true,
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'picture.reveal') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          image: activity?.image || '',
          gridSize: Number(activity?.gridSize ?? 4),
          revealMode: activity?.revealMode || 'manual',
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'emotion.faces') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'image.complete_part') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          image: activity?.image || '',
          gridRows: Number(activity?.gridRows ?? 2),
          gridCols: Number(activity?.gridCols ?? 2),
          missingPartCount: Number(activity?.missingPartCount ?? 1),
          missingCellIds: Array.isArray(activity?.missingCellIds) ? activity.missingCellIds : ['0'],
          distractorCount: Number(activity?.distractorCount ?? 3),
          cropMode: activity?.cropMode || 'grid',
          cropRect: activity?.cropRect || null,
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'action.drag_to_target') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'اكتب التعليمات هنا',
          instructionAudio: activity?.instructionAudio || '',
          sceneImage: activity?.sceneImage || '',
          draggables: Array.isArray(activity?.draggables) ? activity.draggables : [],
          mode: activity?.mode || 'one-to-one',
          promptLevel: activity?.promptLevel || '',
        },
        behavior: {
          snapToTarget: true,
          wrongDropBehavior: 'return',
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'navigation.move_to_target') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'اكتب التعليمات هنا',
          instructionAudio: activity?.instructionAudio || '',
          sceneImage: activity?.sceneImage || '',
          movable: {
            image: activity?.movable?.image || '',
            startX: Number(activity?.movable?.startX ?? 1),
            startY: Number(activity?.movable?.startY ?? 1),
          },
          target: {
            image: activity?.target?.image || '',
            x: Number(activity?.target?.x ?? 5),
            y: Number(activity?.target?.y ?? 3),
            radius: Number(activity?.target?.radius ?? 1),
          },
          grid: {
            cols: Number(activity?.grid?.cols ?? 8),
            rows: Number(activity?.grid?.rows ?? 6),
          },
          interactionMode: activity?.interactionMode || 'buttons',
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
          moveSound: activity?.moveSound || '',
          boundarySound: activity?.boundarySound || '',
        },
      },
    };
  }

  if (templateType === 'navigation.maze') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'حرّك العنصر داخل المتاهة حتى يصل إلى الهدف',
          instructionAudio: activity?.instructionAudio || '',
          maze: {
            grid: Array.isArray(activity?.maze?.grid) ? activity.maze.grid : [],
            startX: Number(activity?.maze?.startX ?? 2),
            startY: Number(activity?.maze?.startY ?? 2),
            goalX: Number(activity?.maze?.goalX ?? 6),
            goalY: Number(activity?.maze?.goalY ?? 6),
            playerImage: activity?.maze?.playerImage || '',
            goalImage: activity?.maze?.goalImage || '',
          },
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
          moveSound: activity?.moveSound || '',
          boundarySound: activity?.boundarySound || '',
        },
      },
    };
  }

  if (templateType === 'text.missing_word') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'أكمل الكلمة الناقصة',
          questionAudio: activity?.instructionAudio || '',
          image: activity?.image || '',
          wordWithBlank: activity?.wordWithBlank || '',
          options: Array.isArray(activity?.options) ? activity.options : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'cards.audio_flashcards') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'استمع للبطاقات وتعلم',
          instructionAudio: activity?.instructionAudio || '',
          cards: Array.isArray(activity?.cards) ? activity.cards : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'memory.cards') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          instructionAudio: activity?.instructionAudio || '',
          pairCount: Number(activity?.pairCount ?? activity?.cards?.length ?? 4),
          maxPairs: Number(activity?.pairCount ?? activity?.cards?.length ?? 4),
          cards: Array.isArray(activity?.cards) ? activity.cards : createMemoryCards(),
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'memory.grid') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          instructionAudio: activity?.instructionAudio || '',
          difficulty: activity?.difficulty || 'medium',
          gridSize: Number(activity?.gridSize ?? 3),
          viewSeconds: Number(activity?.viewSeconds ?? 4),
          cards: Array.isArray(activity?.cards) ? activity.cards : createMemoryGridCards(),
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'puzzle.jigsaw') {
    if (activity?.puzzleMode === 'missing-piece') {
      const gridSize = Number(activity?.gridSize ?? 3);
      const totalCells = Math.max(1, gridSize * gridSize);
      const configuredMissingSlotIndex = Number(activity?.missingSlotIndex ?? 0);
      const missingSlotIndex = Number.isFinite(configuredMissingSlotIndex)
        ? Math.min(Math.max(0, Math.floor(configuredMissingSlotIndex)), totalCells - 1)
        : 0;

      return {
        id: gameId,
        type: 'image.complete_part',
        titleAr,
        config: {
          gameType: 'image.complete_part',
          titleAr,
          content: {
            instructionAr: activity?.questionAr || 'اسحب الجزء الصحيح إلى الخانة الناقصة لإكمال الصورة',
            questionAudio: activity?.instructionAudio || '',
            image: activity?.image || '',
            gridRows: gridSize,
            gridCols: gridSize,
            missingPartCount: 1,
            missingCellIds: [String(missingSlotIndex)],
            distractorCount: 3,
            cropMode: 'grid',
            cropRect: null,
            options: Array.isArray(activity?.options) ? activity.options : [],
          },
          feedback: {
            successSound: sharedMedia?.successSound || '',
            failSound: sharedMedia?.failSound || '',
          },
        },
      };
    }

    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        instructionAr: activity?.questionAr || 'قم بتركيب قطع البازل لتكوين الصورة الصحيحة',
        image: activity?.image || '',
        gridSize: activity?.gridSize || 3,
        puzzleMode: activity?.puzzleMode || 'jigsaw',
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'matching.connect') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'قم بتوصيل كل صورة بما يطابقها',
          instructionAudio: activity?.instructionAudio || '',
          pairs: Array.isArray(activity?.pairs) ? activity.pairs : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'grammar.adjectives') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          heroImage: activity?.heroImage || '',
          sentenceText: activity?.sentenceText || '',
          adjectives: Array.isArray(activity?.adjectives) ? activity.adjectives : [],
          nouns: Array.isArray(activity?.nouns) ? activity.nouns : [],
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'commands.multi_step') {
    const items = Array.isArray(activity?.items)
      ? activity.items
      : Array.isArray(activity?.options)
        ? activity.options
        : [];
    const commandSteps = Array.isArray(activity?.commandSteps) ? activity.commandSteps : [];

    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          difficulty: activity?.difficulty || 'easy',
          items,
          commandSteps,
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  if (templateType === 'spatial.concepts') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || getDefaultInstructionForType(templateType),
          questionAudio: activity?.instructionAudio || '',
          sceneImage: activity?.sceneImage || '',
          gameMode: activity?.gameMode || 'choose_concept',
          conceptType: activity?.conceptType || 'above_below',
          options: Array.isArray(activity?.options) ? activity.options : [],
          dragItem: activity?.dragItem || { id: 'drag_1', image: '', labelAr: '' },
          dropZone: activity?.dropZone || { x: 50, y: 20, width: 20, height: 20 },
        },
        feedback: {
          successSound: sharedMedia?.successSound || '',
          failSound: sharedMedia?.failSound || '',
        },
      },
    };
  }

  return {
    id: gameId,
    type: 'sequence.order',
    titleAr,
    config: {
      gameType: 'sequence.order',
      titleAr,
      content: {
        instructionAr: activity?.questionAr || 'اكتب التعليمات هنا',
        instructionAudio: activity?.instructionAudio || '',
        steps: Array.isArray(activity?.steps) ? activity.steps : [],
      },
      feedback: {
        successSound: sharedMedia?.successSound || '',
        failSound: sharedMedia?.failSound || '',
      },
    },
  };
};
