export const normalizeGameForEngine = (game) => {
  if (!game) {
    return null;
  }

  if (game.config?.version === 2 && Array.isArray(game.config?.levels)) {
    return {
      ...game,
      type: game.type || game.config.templateType,
      config: {
        ...game.config,
        templateType: game.type || game.config.templateType,
      },
    };
  }

  return game;
};

export default normalizeGameForEngine;
