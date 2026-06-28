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
import PictureRevealGame from './PictureRevealGame';
import EmotionFacesGame from './EmotionFacesGame';
import ImageCompletePartGame from './ImageCompletePartGame';
import MemoryCardsGame from './MemoryCardsGame';
import MemoryGridGame from './MemoryGridGame';
import TrueFalseGame from './TrueFalseGame';
import EyeTrackingChooseGame from './EyeTrackingChooseGame';
import EyeTrackingBirdGame from './EyeTrackingBirdGame';
import GrammarAdjectivesGame from './GrammarAdjectivesGame';
import SpatialConceptsGame from './SpatialConceptsGame';
import TouchHandGame from './TouchHandGame';

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

  if (game?.type === 'matching.similar' || game?.type === 'matching.different' || game?.type === 'matching.find' || game?.type === 'matching.shadow') {
    return <MatchingGame {...sharedProps} />;
  }

  if (game?.type === 'action.drag_to_target') {
    return <DragDropGame {...sharedProps} />;
  }

  if (game?.type === 'touch.hand') {
    return <TouchHandGame {...sharedProps} />;
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

  if (game?.type === 'memory.cards') {
    return <MemoryCardsGame {...sharedProps} />;
  }

  if (game?.type === 'memory.grid') {
    return <MemoryGridGame {...sharedProps} />;
  }

  if (game?.type === 'puzzle.jigsaw' && game?.config?.puzzleMode !== 'missing-piece') {
    return <PuzzleGame {...sharedProps} />;
  }

  if (game?.type === 'matching.connect') {
    return <MatchingConnectGame {...sharedProps} />;
  }

  if (game?.type === 'picture.reveal') {
    return <PictureRevealGame {...sharedProps} />;
  }

  if (game?.type === 'emotion.faces') {
    return <EmotionFacesGame {...sharedProps} />;
  }

  if (game?.type === 'puzzle.jigsaw' || game?.type === 'image.complete_part') {
    return <ImageCompletePartGame {...sharedProps} />;
  }

  if (game?.type === 'true_false') {
    return <TrueFalseGame {...sharedProps} />;
  }

  if (game?.type === 'grammar.adjectives') {
    return <GrammarAdjectivesGame {...sharedProps} />;
  }

  if (game?.type === 'eye_tracking.choose') {
    return <EyeTrackingChooseGame {...sharedProps} />;
  }

  if (game?.type === 'eye_tracking.bird') {
    return <EyeTrackingBirdGame {...sharedProps} />;
  }

  if (game?.type === 'spatial.concepts') {
    return <SpatialConceptsGame {...sharedProps} />;
  }

  return null;
};

export default renderGameActivity;
