export const CHILD_GAME_SHELL_CLASS = 'max-w-2xl';
export const CHILD_GAME_BOARD_MAX_WIDTH = 210;
export const CHILD_GAME_OPTIONS_MAX_WIDTH = 220;
export const CHILD_GAME_CARD_RADIUS = 'clamp(16px, 1.6vw, 20px)';
export const CHILD_GAME_CARD_INNER_RADIUS = 'clamp(12px, 1.3vw, 16px)';
export const CHILD_GAME_CARD_GAP = 'clamp(5px, 0.8vw, 7px)';
export const CHILD_GAME_CARD_PADDING = 'clamp(5px, 0.9vw, 8px)';

export const getChildBoardWidth = (ratio = 1, { base = 176, min = 136, max = CHILD_GAME_BOARD_MAX_WIDTH } = {}) => {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return `${Math.max(min, Math.min(max, Math.round(base * safeRatio)))}px`;
};
