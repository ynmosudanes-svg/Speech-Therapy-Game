export const CHILD_GAME_SHELL_CLASS = 'max-w-2xl';
export const CHILD_GAME_BOARD_MAX_WIDTH = 260;
export const CHILD_GAME_OPTIONS_MAX_WIDTH = 280;
export const CHILD_GAME_CARD_RADIUS = 'clamp(16px, 1.6vw, 20px)';
export const CHILD_GAME_CARD_INNER_RADIUS = 'clamp(12px, 1.3vw, 16px)';
export const CHILD_GAME_CARD_GAP = 'clamp(6px, 0.9vw, 8px)';
export const CHILD_GAME_CARD_PADDING = 'clamp(6px, 1vw, 9px)';

export const getChildBoardWidth = (ratio = 1, { base = 200, min = 160, max = CHILD_GAME_BOARD_MAX_WIDTH } = {}) => {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return `${Math.max(min, Math.min(max, Math.round(base * safeRatio)))}px`;
};
