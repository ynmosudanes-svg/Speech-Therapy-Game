const SUPPORTED_TEMPLATE_TYPES = [
  'matching.similar',
  'matching.different',
  'matching.find',
  'matching.shadow',
  'picture.reveal',
  'image.complete_part',
  'sequence.order',
  'action.drag_to_target',
  'navigation.move_to_target',
  'navigation.maze',
  'text.missing_word',
  'cards.audio_flashcards',
  'memory.cards',
  'memory.grid',
  'puzzle.jigsaw',
  'matching.connect',
  'emotion.faces',
  'eye_tracking.bird',
  'true_false',
  'eye_tracking.choose'
];

function createEmptyLevel(levelNumber) {
  return {
    levelNumber,
    starsToUnlock: levelNumber === 1 ? 0 : 2,
    activities: [],
  };
}

function createBaseTemplateConfig({ name, nameAr, type, introVideo, successSound, failSound }) {
  return {
    version: 2,
    name: name || nameAr || '',
    nameAr: nameAr || name || '',
    templateType: type || 'matching.similar',
    media: {
      introVideo: introVideo || '',
      successSound: successSound || '',
      failSound: failSound || '',
    },
    levels: [createEmptyLevel(1), createEmptyLevel(2), createEmptyLevel(3)],
  };
}

function isTemplateConfig(config) {
  return Boolean(
    config &&
      typeof config === 'object' &&
      config.version === 2 &&
      typeof config.templateType === 'string' &&
      Array.isArray(config.levels)
  );
}

function normalizeOption(option, index) {
  return {
    id: String(option?.id || `option_${index + 1}`),
    image: option?.image || '',
    label: option?.label || option?.textAr || option?.text || '',
    textAr: option?.textAr || option?.label || option?.text || '',
    emoji: option?.emoji || '',
    questionLabelAr: option?.questionLabelAr || '',
    isCorrect: Boolean(option?.isCorrect),
  };
}

function normalizePair(pair, index) {
  return {
    id: String(pair?.id || `pair_${index + 1}`),
    sourceImage: pair?.sourceImage || '',
    sourceLabel: pair?.sourceLabel || '',
    targetImage: pair?.targetImage || '',
    targetLabel: pair?.targetLabel || '',
  };
}

function normalizeStep(step, index) {
  return {
    id: String(step?.id || `step_${index + 1}`),
    image: step?.image || '',
    labelAr: step?.labelAr || step?.textAr || '',
    order: Number(step?.order || index + 1),
  };
}

function normalizeDragItem(item, index) {
  return {
    id: String(item?.id || `drag_${index + 1}`),
    image: item?.image || '',
    labelAr: item?.labelAr || '',
    startPosition: item?.startPosition || 'bottom',
    isCorrect: Boolean(item?.isCorrect),
  };
}

function normalizeNavigationConfig(activity) {
  return {
    interactionMode: activity?.interactionMode || 'buttons',
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
    moveSound: activity?.moveSound || '',
    boundarySound: activity?.boundarySound || '',
  };
}

function normalizeMazeConfig(activity) {
  const sourceGrid = Array.isArray(activity?.maze?.grid) ? activity.maze.grid : activity?.mazeGrid;
  const normalizedGrid = Array.isArray(sourceGrid) && sourceGrid.length
    ? sourceGrid.map((row) => (Array.isArray(row) ? row.map((cell) => (Number(cell) === 1 ? 1 : 0)) : []))
    : [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ];

  return {
    moveSound: activity?.moveSound || '',
    boundarySound: activity?.boundarySound || '',
    maze: {
      grid: normalizedGrid,
      startX: Number(activity?.maze?.startX ?? 2),
      startY: Number(activity?.maze?.startY ?? 2),
      goalX: Number(activity?.maze?.goalX ?? Math.max(normalizedGrid[0]?.length - 1, 2)),
      goalY: Number(activity?.maze?.goalY ?? Math.max(normalizedGrid.length - 1, 2)),
      playerImage: activity?.maze?.playerImage || '',
      goalImage: activity?.maze?.goalImage || '',
    },
  };
}

function normalizeActivity(activity, type, index) {
  const activityType = SUPPORTED_TEMPLATE_TYPES.includes(activity?.type) ? activity.type : type;
  const baseActivity = {
    id: String(activity?.id || `activity_${index + 1}`),
    type: activityType,
    titleAr: activity?.titleAr || '',
    questionAr: activity?.questionAr || activity?.instructionAr || '',
    instructionAudio: activity?.instructionAudio || '',
    difficulty: activity?.difficulty || 'easy',
  };

  if (
    activityType === 'matching.similar' ||
    activityType === 'matching.different' ||
    activityType === 'matching.find' ||
    activityType === 'matching.shadow' ||
    activityType === 'emotion.faces' ||
    activityType === 'eye_tracking.choose' ||
    activityType === 'true_false'
  ) {
    return {
      ...baseActivity,
      heroImage: activity?.heroImage || '',
      options: Array.isArray(activity?.options) ? activity.options.map(normalizeOption) : [],
    };
  }

  if (activityType === 'action.drag_to_target') {
    return {
      ...baseActivity,
      mode: activity?.mode || 'one-to-one',
      sceneImage: activity?.sceneImage || '',
      promptLevel: activity?.promptLevel || '',
      draggables: Array.isArray(activity?.draggables) ? activity.draggables.map(normalizeDragItem) : [],
    };
  }

  if (activityType === 'navigation.move_to_target') {
    return {
      ...baseActivity,
      ...normalizeNavigationConfig(activity),
    };
  }

  if (activityType === 'navigation.maze') {
    return {
      ...baseActivity,
      ...normalizeMazeConfig(activity),
    };
  }

  if (activityType === 'sequence.order') {
    return {
      ...baseActivity,
      steps: Array.isArray(activity?.steps) ? activity.steps.map(normalizeStep) : [],
    };
  }

  if (activityType === 'text.missing_word') {
    return {
      ...baseActivity,
      image: activity?.image || '',
      wordWithBlank: activity?.wordWithBlank || '',
      options: Array.isArray(activity?.options) ? activity.options.map(normalizeOption) : [],
    };
  }

  if (activityType === 'picture.reveal') {
    return {
      ...baseActivity,
      image: activity?.image || '',
      gridSize: Number(activity?.gridSize || 4),
      revealMode: activity?.revealMode || 'manual',
      options: Array.isArray(activity?.options) ? activity.options.map(normalizeOption) : [],
    };
  }

  if (activityType === 'image.complete_part') {
    return {
      ...baseActivity,
      image: activity?.image || '',
      gridRows: Number(activity?.gridRows || 2),
      gridCols: Number(activity?.gridCols || 2),
      missingPartCount: Number(activity?.missingPartCount || 1),
      missingCellIds: Array.isArray(activity?.missingCellIds)
        ? activity.missingCellIds.map((cellId) => String(cellId))
        : ['0'],
      distractorCount: Number(activity?.distractorCount || 3),
    };
  }

  if (activityType === 'cards.audio_flashcards') {
    return {
      ...baseActivity,
      cards: Array.isArray(activity?.cards) ? activity.cards : [],
    };
  }

  if (activityType === 'memory.cards') {
    return {
      ...baseActivity,
      pairCount: Number(activity?.pairCount || activity?.cards?.length || 4),
      cards: Array.isArray(activity?.cards) ? activity.cards : [],
    };
  }

  if (activityType === 'memory.grid') {
    return {
      ...baseActivity,
      gridSize: Number(activity?.gridSize || 3),
      viewSeconds: Number(activity?.viewSeconds || 4),
      cards: Array.isArray(activity?.cards) ? activity.cards : [],
    };
  }

  if (activityType === 'puzzle.jigsaw') {
    return {
      ...baseActivity,
      image: activity?.image || '',
      gridSize: Number(activity?.gridSize || 3),
    };
  }

  if (activityType === 'matching.connect') {
    return {
      ...baseActivity,
      pairs: Array.isArray(activity?.pairs) ? activity.pairs.map(normalizePair) : [],
    };
  }

  return baseActivity;
}

function normalizeLevel(level, type, index) {
  return {
    levelNumber: Number(level?.levelNumber || index + 1),
    starsToUnlock: Number(level?.starsToUnlock ?? (index === 0 ? 0 : 2)),
    activities: Array.isArray(level?.activities)
      ? level.activities.map((activity, activityIndex) => normalizeActivity(activity, type, activityIndex))
      : [],
  };
}

function normalizeTemplateConfig(payload) {
  const type = payload?.type || payload?.config?.templateType || 'matching.similar';
  const baseConfig = createBaseTemplateConfig({
    name: payload?.name || payload?.title,
    nameAr: payload?.nameAr || payload?.titleAr,
    type,
    introVideo: payload?.introVideo || payload?.config?.media?.introVideo,
    successSound: payload?.successSound || payload?.config?.media?.successSound,
    failSound: payload?.failSound || payload?.config?.media?.failSound,
  });

  const sourceLevels = Array.isArray(payload?.config?.levels) ? payload.config.levels : payload?.levels;
  const normalizedLevels = Array.isArray(sourceLevels)
    ? sourceLevels.slice(0, 3).map((level, index) => normalizeLevel(level, type, index))
    : [];

  const levels = [0, 1, 2].map((index) => normalizedLevels[index] || createEmptyLevel(index + 1));

  return {
    ...baseConfig,
    ...payload?.config,
    name: payload?.name || payload?.title || payload?.config?.name || baseConfig.name,
    nameAr: payload?.nameAr || payload?.titleAr || payload?.config?.nameAr || baseConfig.nameAr,
    templateType: type,
    media: {
      introVideo:
        payload?.introVideo ??
        payload?.config?.media?.introVideo ??
        baseConfig.media.introVideo,
      successSound:
        payload?.successSound ??
        payload?.config?.media?.successSound ??
        baseConfig.media.successSound,
      failSound:
        payload?.failSound ??
        payload?.config?.media?.failSound ??
        baseConfig.media.failSound,
    },
    levels,
  };
}

function buildConfigFromLegacyGame(game) {
  if (!game) return null;
  if (isTemplateConfig(game.config)) return normalizeTemplateConfig(game);

  const type = game.type === 'listen_choose' ? 'matching.similar' : game.type;
  const baseConfig = createBaseTemplateConfig({
    name: game.name || game.title,
    nameAr: game.titleAr || game.name,
    type,
    introVideo: game.introVideo || game?.config?.media?.introVideo,
    successSound: game.successSound,
    failSound: game.failSound,
  });

  if (type === 'matching.similar' || type === 'matching.different' || type === 'matching.find' || type === 'matching.shadow') {
    const options = Array.isArray(game.options) ? game.options.map(normalizeOption) : [];
    const correctOption = options.find((option) => option.isCorrect) || options[0] || null;
    baseConfig.levels[0].activities = [
      {
        id: 'activity_1',
        type,
        titleAr: game.titleAr || game.name || '',
        questionAr: game.questionTextAr || game.questionText || '',
        instructionAudio: game.questionAudio || '',
        difficulty: 'easy',
        heroImage: game.targetImage || correctOption?.image || '',
        options,
      },
    ];
    return baseConfig;
  }

  if (type === 'sequence.order') {
    baseConfig.levels[0].activities = [
      {
        id: 'activity_1',
        type,
        titleAr: game.titleAr || game.name || '',
        questionAr: game.instructionTextAr || game.instructionText || '',
        instructionAudio: game.instructionAudio || '',
        difficulty: 'easy',
        steps: Array.isArray(game.items) ? game.items.map(normalizeStep) : [],
      },
    ];
    return baseConfig;
  }

  return baseConfig;
}

function buildConfigFromPayload(payload) {
  const requestedType = payload?.type || payload?.config?.templateType;
  if (SUPPORTED_TEMPLATE_TYPES.includes(requestedType) || isTemplateConfig(payload?.config)) {
    return normalizeTemplateConfig(payload);
  }
  if (payload.config && typeof payload.config === 'object') return payload.config;
  return buildConfigFromLegacyGame(payload);
}

function normalizeGameRecord(game) {
  const config = buildConfigFromLegacyGame(game);
  return {
    ...game,
    type: config?.templateType || game.type,
    level: 1,
    config,
  };
}

module.exports = {
  SUPPORTED_TEMPLATE_TYPES,
  buildConfigFromLegacyGame,
  buildConfigFromPayload,
  isTemplateConfig,
  normalizeGameRecord,
};
