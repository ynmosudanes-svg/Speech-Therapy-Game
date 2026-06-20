/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import BirdHint from './BirdHint';
import { useTherapySounds } from '../../hooks/useTherapySounds';

export const GAME_UI_TOKENS = {
  radius: 'clamp(16px, 1.6vw, 20px)',
  radiusInner: 'clamp(12px, 1.3vw, 16px)',
  sectionPadding: 'clamp(12px, 1.4vw, 18px)',
  cardPadding: 'clamp(6px, 1vw, 9px)',
  cardGap: 'clamp(8px, 1vw, 14px)',
  cardShadow: '0 18px 38px -28px rgba(71, 85, 105, 0.22)',
  maxContentWidth: 'min(100%, clamp(21rem, 58vw, 40rem))',
  boardWidth: 'min(100%, clamp(156px, 24vw, 220px))',
  choiceMinWidth: 'clamp(96px, 17vw, 138px)',
};

export const GAME_ASSISTANT_HINT_CLASS =
  '!border-sky-400 bg-sky-50/75 ring-[3px] ring-sky-300/95 shadow-[0_0_0_5px_rgba(125,211,252,0.32),0_14px_30px_rgba(14,165,233,0.2)] scale-[1.01]';

export const GAME_ASSISTANT_HINT_OVERLAY_CLASS =
  'pointer-events-none absolute inset-[-1px] z-20 rounded-[inherit] ring-[3px] ring-sky-300/90 opacity-95';

const shellClassName =
  'border border-[#dbe7f3] bg-white/82 backdrop-blur-[10px]';

const softCardClassName =
  'border border-[#dbe7f3] bg-white/92';

export function GameContainer({ children, className = '', style }) {
  return (
    <div
      className={`relative isolate mx-auto flex w-full flex-col ${className}`}
      style={{
        maxWidth: GAME_UI_TOKENS.maxContentWidth,
        gap: GAME_UI_TOKENS.sectionPadding,
        ...style,
      }}
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
      className={`grid w-full ${isTwoItemGrid ? 'mt-8 sm:mt-0' : ''} ${className}`}
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
  const { onClick, ...buttonProps } = props;
  const { playTap } = useTherapySounds({ soundEnabled: true });
  const stateClassName =
    state === 'correct'
      ? 'border-emerald-300 bg-emerald-50/90'
      : state === 'wrong'
        ? 'border-rose-300 bg-rose-50/90'
        : state === 'hint'
          ? GAME_ASSISTANT_HINT_CLASS
          : 'border-[#dbe7f3] bg-white/94';

  return (
    <GameCard
      as="button"
      type="button"
      interactive
      className={`relative z-10 flex flex-col items-center justify-center overflow-visible text-center ${stateClassName} ${className}`}
      style={style}
      onClick={(event) => {
        playTap();
        onClick?.(event);
      }}
      {...buttonProps}
    >
      {state === 'hint' && (
        <div
          className={GAME_ASSISTANT_HINT_OVERLAY_CLASS}
          aria-hidden="true"
        />
      )}
      {state === 'hint' && (
        <BirdHint className="absolute -top-12 left-1/2 z-30 h-16 w-16 -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)] md:-top-14 md:h-20 md:w-20" />
      )}
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
