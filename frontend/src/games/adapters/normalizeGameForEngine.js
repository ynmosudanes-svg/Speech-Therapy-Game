import { normalizeActivityTypesForConfig } from './buildActivityPreviewGame';

export const normalizeGameForEngine = (game) => {
  if (!game) {
    return null;
  }

  if (game.config?.version === 2 && Array.isArray(game.config?.levels)) {
    const templateType = game.type || game.config.templateType || 'matching.similar';

    return {
      ...game,
      type: templateType,
      config: normalizeActivityTypesForConfig({
        ...game.config,
        templateType,
      }, templateType),
    };
  }

  return game;
};

export default normalizeGameForEngine;
