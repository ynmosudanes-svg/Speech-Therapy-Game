import React from 'react';
import DragDropGame from './DragDropGame';
import MazeGame from './MazeGame';
import MatchingGame from './MatchingGame';
import NavigationGame from './NavigationGame';
import SequenceGame from './SequenceGame';
import MissingWordGame from './MissingWordGame';
import AudioCardsGame from './AudioCardsGame';
import PuzzleGame from './PuzzleGame';
import MatchingConnectGame from './MatchingConnectGame';
import ShadowPuzzleGame from './ShadowPuzzleGame';

const renderGameActivity = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled = false,
}) => {
  const sharedProps = {
    game,
    config: game?.config || {},
    onComplete,
    therapistControlsEnabled,
    therapistPromptLevel,
    previewMode,
    onAssistantInteraction,
    registerAssistantActions,
    helpVoiceEnabled,
  };

  if (game?.type === 'matching.shadow') {
    return <ShadowPuzzleGame {...sharedProps} />;
  }

  if (game?.type === 'matching.similar' || game?.type === 'matching.different' || game?.type === 'matching.find') {
    return <MatchingGame {...sharedProps} />;
  }

  if (game?.type === 'action.drag_to_target') {
    return <DragDropGame {...sharedProps} />;
  }

  if (game?.type === 'navigation.move_to_target') {
    return <NavigationGame {...sharedProps} />;
  }

  if (game?.type === 'navigation.maze') {
    return <MazeGame {...sharedProps} />;
  }

  if (game?.type === 'sequence.order') {
    return <SequenceGame {...sharedProps} />;
  }

  if (game?.type === 'text.missing_word') {
    return <MissingWordGame {...sharedProps} />;
  }

  if (game?.type === 'cards.audio_flashcards') {
    return <AudioCardsGame {...sharedProps} />;
  }

  if (game?.type === 'puzzle.jigsaw') {
    return <PuzzleGame {...sharedProps} />;
  }

  if (game?.type === 'matching.connect') {
    return <MatchingConnectGame {...sharedProps} />;
  }

  return null;
};

export default renderGameActivity;
