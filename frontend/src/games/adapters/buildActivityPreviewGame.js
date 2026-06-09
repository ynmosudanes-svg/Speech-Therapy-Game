const fallbackName = 'لعبة علاجية';
const getDefaultActivityTitle = (index = 0) => `نشاط ${index + 1}`;

const createMatchingOption = (id, isCorrect = false) => ({
  id,
  image: '',
  textAr: '',
  isCorrect,
});

const createDragItem = (id, startPosition = 'bottom', isCorrect = false) => ({
  id,
  image: '',
  labelAr: '',
  startPosition,
  isCorrect,
});

export const getDefaultActivityForType = (type, activityIndex = 0) => {
  if (type === 'cards.audio_flashcards') {
    return {
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
  if (type === 'matching.similar') {
    return {
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'matching.different') {
    return {
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'matching.find') {
    return {
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: '',
      instructionAudio: '',
      difficulty: 'easy',
      heroImage: '',
      options: [createMatchingOption('option_1', true), createMatchingOption('option_2')],
    };
  }

  if (type === 'action.drag_to_target') {
    return {
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
      id: `activity_${Date.now()}`,
      titleAr: getDefaultActivityTitle(activityIndex),
      questionAr: 'ركب الصورة',
      instructionAudio: '',
      difficulty: 'easy',
      image: '',
      gridSize: 3,
    };
  }

  if (type === 'text.missing_word') {
    return {
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

export const normalizeBuilderConfig = (game) => {
  const config = game?.config;

  if (config?.version === 2 && Array.isArray(config.levels)) {
    return {
      ...config,
      templateType: game?.type || config.templateType,
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
    };
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

  if (templateType === 'matching.similar' || templateType === 'matching.different' || templateType === 'matching.find') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        content: {
          instructionAr: activity?.questionAr || 'اكتب السؤال هنا',
          questionAudio: activity?.instructionAudio || '',
          hero: { image: activity?.heroImage || '' },
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

  if (templateType === 'puzzle.jigsaw') {
    return {
      id: gameId,
      type: templateType,
      titleAr,
      config: {
        gameType: templateType,
        titleAr,
        image: activity?.image || '',
        gridSize: activity?.gridSize || 3,
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
