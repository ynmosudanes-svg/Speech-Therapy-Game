const HELP_LABELS = {
  bird: 'مساعدة',
  visual: 'مساعدة',
  gesture: 'مساعدة',
  verbal: 'مساعدة',
  physical: 'مساعدة',
};

const PROMPT_LABELS = {
  none: 'بدون مساعدة',
  assisted: 'مساعدة',
  visual: 'بصري',
  verbal: 'لفظي',
  gestural: 'إيمائي',
  modeling: 'نمذجة',
  partial_physical: 'جسدي جزئي',
  full_physical: 'جسدي كامل',
  physical: 'مساعدة جسدية',
};

export const buildHelpSummary = (helpsUsed = []) => {
  const uniqueHelps = [...new Set(Array.isArray(helpsUsed) ? helpsUsed : [])];
  if (!uniqueHelps.length) {
    return ['بدون مساعدة'];
  }
  return ['مساعدة'];
};

export const computeSessionMetrics = (stats = {}) => {
  const attempts = Array.isArray(stats.attempts) ? stats.attempts : [];
  const activityCount = Math.max(attempts.length, 1);
  const correctAnswers = Number(stats.correctAnswers || 0);
  const helpsPerActivity = Array.isArray(stats.helpsPerActivity) ? stats.helpsPerActivity : [];
  const helpsUsed = Array.isArray(stats.helpsUsed) ? stats.helpsUsed : [];

  const firstTryCount = attempts.filter((value) => Number(value) === 1).length;
  const accuracyScore = Math.round((firstTryCount / activityCount) * 100);
  const completionScore = correctAnswers >= activityCount ? 100 : Math.round((correctAnswers / activityCount) * 100);

  const trackedHelpActivities = helpsPerActivity.length > 0
    ? helpsPerActivity
    : Array.from({ length: activityCount }, () => helpsUsed);

  const independentActivities = trackedHelpActivities.filter(
    (activityHelps) => !Array.isArray(activityHelps) || activityHelps.length === 0
  ).length;

  const independenceRate = Math.round((independentActivities / activityCount) * 100);
  const totalAttempts = attempts.reduce((sum, value) => sum + Number(value || 0), 0);

  const helps = helpsUsed.length ? helpsUsed : trackedHelpActivities.flat();
  let computedPrompt = 'none';
  if (helps.length) {
    computedPrompt = 'assisted';
  }

  const promptHistory = Array.isArray(stats.prompts) ? stats.prompts : [];
  const promptSummary = helps.length
    ? buildHelpSummary(helps)
    : promptHistory.map((prompt) => PROMPT_LABELS[prompt] || prompt);

  return {
    activityCount,
    accuracyScore,
    completionScore,
    score: accuracyScore,
    independenceRate,
    totalAttempts,
    promptSummary,
    computedPrompt,
    helpsUsed: helps,
  };
};
