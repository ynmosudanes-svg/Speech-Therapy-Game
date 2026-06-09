const PROMPT_LEVELS = [
  'independent',
  'visual',
  'verbal',
  'gestural',
  'modeling',
  'partial',
  'partial_physical',
  'full',
  'full_physical',
];

const PROMPT_SCORES = {
  independent: 1,
  visual: 0.75,
  verbal: 0.65,
  gestural: 0.55,
  modeling: 0.45,
  partial: 0.35,
  partial_physical: 0.25,
  full: 0.1,
  full_physical: 0,
};

module.exports = {
  PROMPT_LEVELS,
  PROMPT_SCORES,
};
