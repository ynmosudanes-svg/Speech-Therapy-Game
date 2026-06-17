import React from 'react';
import MatchingGame from './MatchingGame';

const ShadowPuzzleGame = ({ game, config, ...props }) => (
  <MatchingGame
    {...props}
    game={{
      ...game,
      type: 'matching.shadow',
    }}
    config={{
      ...config,
      gameType: 'matching.shadow',
    }}
  />
);

export default ShadowPuzzleGame;
