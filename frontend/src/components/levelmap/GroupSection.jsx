import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import LevelNode from './LevelNode';
import ProgressPath from './ProgressPath';

// Pastel palette for group backgrounds (used when library has no color)
const GROUP_PALETTES = [
  { bg: 'from-sky-50/80 to-blue-50/60', border: 'border-sky-200/60', accent: '#0ea5e9' },
  { bg: 'from-emerald-50/80 to-teal-50/60', border: 'border-emerald-200/60', accent: '#10b981' },
  { bg: 'from-violet-50/80 to-purple-50/60', border: 'border-violet-200/60', accent: '#8b5cf6' },
  { bg: 'from-amber-50/80 to-orange-50/60', border: 'border-amber-200/60', accent: '#f59e0b' },
  { bg: 'from-rose-50/80 to-pink-50/60', border: 'border-rose-200/60', accent: '#f43f5e' },
  { bg: 'from-cyan-50/80 to-sky-50/60', border: 'border-cyan-200/60', accent: '#06b6d4' },
];

/**
 * A visual section for a group of levels (one library).
 *
 * Props:
 *  - group: { id, title, color, games: [{ id, data, status, displayIndex }], isCompleted }
 *  - groupIndex: index of this group in the overall list (for palette)
 *  - onLevelClick: (gameId) => void
 *  - onCelebrate: (groupId) => void — called when the group is first seen as completed
 *  - getGameTitle: function to get game title from game data
 */
const GroupSection = ({ group, groupIndex, onLevelClick, onCelebrate, getGameTitle }) => {
  const containerRef = useRef(null);
  const hasCelebratedRef = useRef(false);

  const palette = GROUP_PALETTES[groupIndex % GROUP_PALETTES.length];
  const completedCount = group.games.filter((g) => g.status === 'done').length;
  const totalCount = group.games.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Create refs for each node
  const nodeRefs = useMemo(
    () => group.games.map(() => ({ current: null })),
    [group.games.length]
  );

  const gameStatuses = useMemo(
    () => group.games.map((g) => g.status),
    [group.games]
  );

  // Check if group just completed and trigger celebration
  if (group.isCompleted && !hasCelebratedRef.current && onCelebrate) {
    hasCelebratedRef.current = true;
    
    try {
      const storedStr = localStorage.getItem('celebrated_groups_v1');
      const celebrated = storedStr ? JSON.parse(storedStr) : [];
      
      if (!celebrated.includes(group.id)) {
        celebrated.push(group.id);
        localStorage.setItem('celebrated_groups_v1', JSON.stringify(celebrated));
        
        // Defer to avoid setState during render
        setTimeout(() => onCelebrate(group.id), 100);
      }
    } catch (e) {
      // Fallback if localStorage fails (e.g., incognito)
      setTimeout(() => onCelebrate(group.id), 100);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative py-4 sm:py-8"
    >
      {/* Group title card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 flex flex-col items-center gap-2 sm:mb-8"
      >
        <div className="inline-flex items-center gap-2">
          <span className="text-lg sm:text-xl" aria-hidden="true">⭐</span>
          <h3 className="text-base font-black text-[#073B5C] sm:text-lg md:text-xl">
            {group.title}
          </h3>
          <span className="text-lg sm:text-xl" aria-hidden="true">⭐</span>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200/70 sm:w-24">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPercent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: group.isCompleted
                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                  : `linear-gradient(90deg, ${palette.accent}, ${palette.accent}cc)`,
              }}
            />
          </div>
          <span className="text-[0.65rem] font-bold text-slate-500 sm:text-xs">
            {completedCount}/{totalCount}
          </span>
          {group.isCompleted && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Trophy size={14} className="text-amber-500" fill="currentColor" />
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Levels container with paths */}
      <div ref={containerRef} className="relative mx-auto max-w-md">
        {/* SVG paths connecting nodes within this group */}
        <ProgressPath
          containerRef={containerRef}
          nodeRefs={nodeRefs}
          gameStatuses={gameStatuses}
        />

        {/* Level nodes */}
        <div className="relative z-10 flex flex-col gap-5 sm:gap-6 md:gap-7">
          {group.games.map((game, index) => (
            <LevelNode
              key={`level-${game.id}`}
              data={game.data}
              status={game.status}
              displayIndex={index}
              levelNumber={index + 1}
              nodeRef={(node) => {
                if (nodeRefs[index]) nodeRefs[index].current = node;
              }}
              onClick={() => onLevelClick(game.id)}
              getGameTitle={getGameTitle}
            />
          ))}
        </div>
      </div>

      {/* Completed group decoration */}
      {group.isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-center sm:mt-8"
        >
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm sm:text-sm">
            <Trophy size={16} className="text-amber-500" fill="currentColor" />
            مكتملة! أحسنت 🎉
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default GroupSection;
