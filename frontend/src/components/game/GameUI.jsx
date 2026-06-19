import React from 'react';

export const GAME_UI_TOKENS = {
  radius: 'clamp(16px, 1.6vw, 20px)',
  radiusInner: 'clamp(12px, 1.3vw, 16px)',
  sectionPadding: 'clamp(9px, 1.2vw, 14px)',
  cardPadding: 'clamp(6px, 1vw, 9px)',
  cardGap: 'clamp(8px, 1vw, 10px)',
  cardShadow: '0 18px 38px -28px rgba(71, 85, 105, 0.22)',
  maxContentWidth: 'min(100%, clamp(21rem, 58vw, 40rem))',
  boardWidth: 'min(100%, clamp(170px, 28vw, 240px))',
  choiceMinWidth: 'clamp(108px, 18vw, 150px)',
};

const shellClassName =
  'border border-[#dbe7f3] bg-white/82 backdrop-blur-[10px]';

const softCardClassName =
  'border border-[#dbe7f3] bg-white/92';

export function GameContainer({ children, className = '' }) {
  return (
    <div
      className={`relative isolate mx-auto flex w-full flex-col ${className}`}
      style={{ maxWidth: GAME_UI_TOKENS.maxContentWidth, gap: GAME_UI_TOKENS.sectionPadding }}
    >
      {children}
    </div>
  );
}

export function GameSection({ children, className = '', contentClassName = '' }) {
  return (
    <section
      className={`${shellClassName} ${className}`}
      style={{
        borderRadius: GAME_UI_TOKENS.radius,
        boxShadow: GAME_UI_TOKENS.cardShadow,
        padding: GAME_UI_TOKENS.sectionPadding,
      }}
    >
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function GameGrid({ children, className = '', minWidth = GAME_UI_TOKENS.choiceMinWidth }) {
  const itemCount = React.Children.count(children);
  const isTwoItemGrid = itemCount === 2;

  return (
    <div
      className={`grid w-full ${isTwoItemGrid ? 'mt-5 sm:mt-0' : ''} ${className}`}
      style={{
        gap: GAME_UI_TOKENS.cardGap,
        gridTemplateColumns: isTwoItemGrid
          ? 'repeat(2, minmax(0, 1fr))'
          : `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
        alignItems: 'stretch',
      }}
    >
      {children}
    </div>
  );
}

export const GameCard = React.forwardRef(function GameCard(
  {
    children,
    as: Component = 'div',
    className = '',
    interactive = false,
    style,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`${softCardClassName} ${interactive ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 active:scale-[0.985]' : ''} ${className}`}
      style={{
        borderRadius: GAME_UI_TOKENS.radius,
        boxShadow: GAME_UI_TOKENS.cardShadow,
        padding: GAME_UI_TOKENS.cardPadding,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

export function GameChoice({
  children,
  className = '',
  state = 'idle',
  style,
  ...props
}) {
  const stateClassName =
    state === 'correct'
      ? 'border-emerald-300 bg-emerald-50/90'
      : state === 'wrong'
        ? 'border-rose-300 bg-rose-50/90'
        : state === 'hint'
          ? 'border-amber-300 bg-amber-50/90'
          : 'border-[#dbe7f3] bg-white/94';

  return (
    <GameCard
      as="button"
      type="button"
      interactive
      className={`flex flex-col items-center justify-center text-center ${stateClassName} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </GameCard>
  );
}

export function GameImage({
  src,
  alt,
  className = '',
  ratio = '1 / 1',
  fit = 'contain',
  imgClassName = '',
  emptyLabel = 'صورة',
}) {
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-white/96 ${className}`}
      style={{
        aspectRatio: ratio,
        borderRadius: GAME_UI_TOKENS.radiusInner,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`h-[88%] w-[88%] object-${fit} ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[inherit] border-2 border-dashed border-slate-200 bg-slate-50 px-3 text-center text-sm font-black text-slate-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function GameQuestion({ children, className = '' }) {
  return (
    <div className={`text-center text-sm font-black text-slate-800 sm:text-base md:text-lg ${className}`}>
      {children}
    </div>
  );
}
