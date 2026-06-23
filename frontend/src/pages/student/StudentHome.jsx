import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Lock, Gamepad2, Check, Sparkles } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import lottie from 'lottie-web';
import 'swiper/css';
import 'swiper/css/pagination';
import welcomeAnimation from '../../assets/Animation/3 Ani.json';
import fourAniAnimation from '../../assets/Animation/4 Ani.json';
import chickAnimation from '../../assets/Animation/Reading (1).json';

const StudentHome = () => {
  const navigate = useNavigate();
  const { currentStudent, sessions } = useTherapyStore();
  const readingAnimationRef = useRef(null);
  const numberOneAnimationRef = useRef(null);
  const progressMapRef = useRef(null);
  const progressSectionRef = useRef(null);
  const progressPathSvgRef = useRef(null);
  const currentLevelRef = useRef(null);
  const stageNodeRefs = useRef([]);
  const revealedStageNodesRef = useRef(new Set());
  const [pathSegments, setPathSegments] = useState([]);

  const assignedGames = Array.isArray(currentStudent?.assignedGames) ? currentStudent.assignedGames : [];

  const studentSessions = Array.isArray(sessions)
    ? sessions.filter((session) => String(session.studentId) === String(currentStudent?.id) && session.sessionType !== 'FREE_PLAY')
    : [];

  const completedGameIds = useMemo(() => {
    return new Set(studentSessions.map(s => String(s.gameId)));
  }, [studentSessions]);

  const { unlockedGame, completedGames, lockedGames } = useMemo(() => {
    const completed = [];
    const locked = [];
    let unlocked = null;

    assignedGames.forEach((game) => {
      if (completedGameIds.has(String(game.id))) {
        completed.push(game);
      } else if (!unlocked) {
        unlocked = game;
      } else {
        locked.push(game);
      }
    });

    return { unlockedGame: unlocked, completedGames: completed, lockedGames: locked };
  }, [assignedGames, completedGameIds]);

  const progressPercentage = assignedGames.length > 0 ? (completedGames.length / assignedGames.length) * 100 : 0;
  const scrollToProgressSection = () => {
    const target = currentLevelRef.current || progressMapRef.current || progressSectionRef.current;
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };
  const welcomeAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8.2rem] h-[8.2rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-3';
  const progressAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8rem] h-[8rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-2';
  const heroSlideClass = 'bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] border border-[#a8d7e7] rounded-[2.5rem] p-6 md:p-8 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)] flex h-[22rem] flex-col items-center justify-center gap-8 md:h-auto md:min-h-[240px] md:flex-row';
  const getGameTitle = (game) => game.titleAr || game.config?.nameAr || game.title || game.name || 'لعبة علاجية';
  const progressMapItems = [
    ...completedGames.map((game) => ({ game, status: 'done' })),
    ...(unlockedGame ? [{ game: unlockedGame, status: 'current' }] : []),
    ...lockedGames.map((game) => ({ game, status: 'locked' })),
  ];

  useEffect(() => {
    const container = progressMapRef.current;
    const svg = progressPathSvgRef.current;
    if (!container || !svg || progressMapItems.length < 2) {
      setPathSegments([]);
      return undefined;
    }

    let frameId = 0;

    const calculatePaths = () => {
      const svgRect = svg.getBoundingClientRect();
      const nextSegments = [];

      const getNodeGeometry = (node) => {
        const rect = node.getBoundingClientRect();

        return {
          x: rect.left - svgRect.left + rect.width / 2,
          y: rect.top - svgRect.top + rect.height / 2,
          radius: Math.min(rect.width, rect.height) / 2,
        };
      };

      const activeItems = [];
      for (const item of progressMapItems) {
        if (item?.status === 'locked') break;
        activeItems.push(item);
        if (item?.status === 'current') break;
      }

      if (activeItems.length < 2) {
        setPathSegments([]);
        return;
      }

      let pathData = '';

      for (let index = 0; index < activeItems.length - 1; index += 1) {
        const fromItem = activeItems[index];
        const toItem = activeItems[index + 1];

        const fromNode = stageNodeRefs.current[progressMapItems.indexOf(fromItem)];
        const toNode = stageNodeRefs.current[progressMapItems.indexOf(toItem)];
        if (!fromNode || !toNode) continue;

        const fromNodeGeometry = getNodeGeometry(fromNode);
        const toNodeGeometry = getNodeGeometry(toNode);
        const dx = toNodeGeometry.x - fromNodeGeometry.x;
        const dy = toNodeGeometry.y - fromNodeGeometry.y;
        const angle = Math.atan2(dy, dx);
        const connectionInset = index === 0 ? 12 : 5;
        const startRadius = Math.max(fromNodeGeometry.radius - connectionInset, 0);
        const endRadius = Math.max(toNodeGeometry.radius - connectionInset, 0);
        const startX = fromNodeGeometry.x + Math.cos(angle) * startRadius;
        const startY = fromNodeGeometry.y + Math.sin(angle) * startRadius;
        const endX = toNodeGeometry.x - Math.cos(angle) * endRadius;
        const endY = toNodeGeometry.y - Math.sin(angle) * endRadius;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const curveOffset = Math.min(Math.max(Math.abs(dx) * 0.4, 110), 220);
        const controlX = midX + (index % 2 === 0 ? curveOffset : -curveOffset);
        const controlY = midY;
        const segment = `${index === 0 ? `M ${startX.toFixed(1)} ${startY.toFixed(1)}` : ''} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
        pathData += segment;
      }

      setPathSegments(pathData ? [{ key: 'progress-path', d: pathData.trim() }] : []);

    };

    const scheduleCalculation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = window.requestAnimationFrame(calculatePaths);
      });
    };

    scheduleCalculation();
    const observer = new ResizeObserver(scheduleCalculation);
    observer.observe(container);
    observer.observe(svg);
    stageNodeRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    window.addEventListener('resize', scheduleCalculation);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleCalculation);
    };
  }, [completedGames.length, lockedGames.length, progressMapItems.length, unlockedGame?.id]);

  const BirdMascot = () => {
    const mascotRef = useRef(null);

    useEffect(() => {
      if (!mascotRef.current) {
        return undefined;
      }

      const instance = lottie.loadAnimation({
        container: mascotRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: chickAnimation,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        },
      });

      return () => {
        instance.destroy();
      };
    }, []);

    return (
      <motion.div
        initial={{ scale: 1 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-16 top-1/2 z-20 h-14 w-14 -translate-y-1/2 sm:-right-[4.75rem] sm:h-[4.5rem] sm:w-[4.5rem] md:-right-20 md:h-20 md:w-20"
        aria-hidden="true"
      >
        <div className="absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-[#b9d6df]/55 blur-md md:h-4 md:w-14" />
        <div ref={mascotRef} className="relative z-10 h-full w-full drop-shadow-[0_12px_16px_rgba(15,111,166,0.18)]" />
      </motion.div>
    );
  };
  const ProgressStageNode = ({ game, status, index, nodeRef, levelRef, onPlay }) => {
    const isCurrent = status === 'current';
    const isDone = status === 'done';
    const isLocked = status === 'locked';
    const offsetClass = [
      'justify-start pr-2 sm:pr-[8%] md:pr-[10%]',
      'justify-end pl-2 sm:pl-[10%] md:pl-[14%]',
      'justify-center md:pr-[12%]',
      'justify-end pl-4 sm:pl-[18%] md:pl-[22%]',
    ][index % 4];
    const title = getGameTitle(game);
    const revealKey = `${game?.id || index}-${status}`;
    const hasRevealed = revealedStageNodesRef.current.has(revealKey);

    return (
      <motion.div
        initial={hasRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        onViewportEnter={() => {
          revealedStageNodesRef.current.add(revealKey);
        }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
        ref={levelRef}
        className={`relative flex min-h-[6.2rem] w-full ${offsetClass}`}
      >

        <motion.button
          type="button"
          disabled={isLocked}
          onClick={isLocked ? undefined : onPlay}
          whileHover={isLocked ? undefined : { scale: isCurrent ? 1.04 : 1.025, y: -2 }}
          whileTap={isLocked ? undefined : { scale: 0.97 }}
          className="group relative z-10 flex items-center gap-3 text-right outline-none disabled:cursor-not-allowed"
          aria-label={isLocked ? `${title} مقفلة` : `ابدأ ${title}`}
        >
          <span
            ref={nodeRef}
            className={`relative grid rounded-full transition-all duration-300 ${
              isCurrent
                ? 'h-[5.65rem] w-[5.65rem] animate-pulse place-items-center bg-[#def7ff] shadow-[0_0_0_9px_rgba(22,143,199,0.1),0_0_28px_rgba(34,199,232,0.28),0_6px_0_#b9e2ef,0_18px_26px_-20px_rgba(15,111,166,0.52)]'
                : 'h-[4.35rem] w-[4.35rem] place-items-center bg-[#eef4f7] shadow-[0_4px_0_#d2e0e6,0_10px_18px_-18px_rgba(15,111,166,0.26)]'
            } ${isDone ? '!bg-[#e8fff6] !shadow-[0_0_0_6px_rgba(20,184,129,0.07),0_4px_0_#b8ead7,0_10px_18px_-18px_rgba(20,184,129,0.28)]' : ''}`}
          >
            {isCurrent && (
              <span className="absolute -top-9 right-1/2 z-20 translate-x-1/2 animate-pulse rounded-xl border border-[#b8deec] bg-white px-4 py-1 text-xs font-black text-[#168FC7] shadow-[0_10px_18px_-16px_rgba(15,111,166,0.42)] after:absolute after:-bottom-1.5 after:right-1/2 after:h-2.5 after:w-2.5 after:translate-x-1/2 after:rotate-45 after:border-b after:border-r after:border-[#b8deec] after:bg-white">
                ابدأ
              </span>
            )}
            {isCurrent && (
              <>
                <Sparkles size={16} className="pointer-events-none absolute -left-4 top-0 text-amber-400" fill="currentColor" />
                <Sparkles size={11} className="pointer-events-none absolute -right-4 top-4 text-cyan-400" fill="currentColor" />
                <Sparkles size={13} className="pointer-events-none absolute -bottom-1 left-1 text-cyan-400" fill="currentColor" />
                <Sparkles size={10} className="pointer-events-none absolute bottom-4 -right-3 text-amber-400" fill="currentColor" />
                <Sparkles size={9} className="pointer-events-none absolute -top-5 left-8 text-amber-300" fill="currentColor" />
              </>
            )}


            <span
              className={`grid rounded-full border-[4px] transition-all duration-300 ${
                isCurrent
                  ? 'h-[4.35rem] w-[4.35rem] place-items-center border-[#a7e9fb] bg-[linear-gradient(180deg,#22c7e8,#168FC7)] text-white shadow-[inset_0_-5px_0_rgba(15,111,166,0.38),0_0_18px_rgba(34,199,232,0.34)]'
                  : isDone
                    ? 'h-[3.35rem] w-[3.35rem] place-items-center border-[#b9f3dc] bg-[linear-gradient(180deg,#20d39a,#14b881)] text-white shadow-[inset_0_-4px_0_rgba(9,120,83,0.3),0_0_8px_rgba(20,184,129,0.15)]'
                    : 'h-[3.35rem] w-[3.35rem] place-items-center border-[#d6e3e9] bg-[linear-gradient(180deg,#c8d7de,#9fb2bc)] text-[#eef6f9] shadow-[inset_0_-4px_0_rgba(80,105,116,0.22)]'
              }`}
            >
              {isCurrent ? <Play size={26} fill="currentColor" /> : isDone ? <Check size={25} strokeWidth={4} /> : <Lock size={20} />}
            </span>
          </span>

          {!isCurrent && (<span className={`pointer-events-none absolute bottom-[calc(100%+0.65rem)] right-1/2 hidden translate-x-1/2 scale-95 rounded-xl border border-[#dbe7f3] bg-white/95 px-4 py-2 opacity-0 shadow-[0_14px_24px_-20px_rgba(15,111,166,0.34)] transition-all duration-200 after:absolute after:-bottom-1.5 after:right-1/2 after:h-2.5 after:w-2.5 after:translate-x-1/2 after:rotate-45 after:border-b after:border-r after:border-[#dbe7f3] after:bg-white/95 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:block`}>
            <span className="block text-xs font-black text-[#168FC7]">
              {isDone ? 'اكتملت' : 'مقفلة'}
            </span>
          </span>)}
          {isCurrent && <BirdMascot />}
        </motion.button>

      </motion.div>
    );
  };
  useEffect(() => {
    if (!readingAnimationRef.current) {
      return undefined;
    }

    const instance = lottie.loadAnimation({
      container: readingAnimationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: welcomeAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    if (!numberOneAnimationRef.current) {
      return undefined;
    }

    const instance = lottie.loadAnimation({
      container: numberOneAnimationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: fourAniAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      instance.destroy();
    };
  }, []);

  return (
    <div dir="rtl" className="w-full pb-10 text-slate-800 flex justify-center">
      <div className="w-full max-w-5xl">

        {/* Custom Swiper Styles */}
        <style>{`
          .student-home-swiper .swiper-pagination {
            bottom: 20px !important;
          }
          .student-home-swiper .swiper-pagination-bullet {
            background: rgba(255, 255, 255, 0.5) !important;
            opacity: 1;
          }
          .student-home-swiper .swiper-pagination-bullet-active {
            background: #ffffff !important;
            box-shadow: 0 0 10px rgba(255,255,255,0.8);
          }
        `}</style>

        {/* Swiper Banner */}
        {assignedGames.length > 0 ? (
          <div className="mb-8 md:mb-14">
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              pagination={{ clickable: true, dynamicBullets: true }}
              autoplay={{ delay: 6000, disableOnInteraction: true }}
              className="rounded-[2.8rem] student-home-swiper"
            >
              {/* Slide 1: Welcome Slide */}
              <SwiperSlide>
                <div className={heroSlideClass}>
                  <div className={welcomeAnimationFrameClass}>
                    <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.38)_0%,_rgba(255,255,255,0.14)_45%,_rgba(255,255,255,0)_75%)] blur-xl" />
                    <div className="absolute inset-[22%] rounded-full bg-cyan-200/25 blur-2xl" />
                    <div
                      ref={readingAnimationRef}
                      className="relative z-10 w-full h-full drop-shadow-[0_18px_26px_rgba(7,59,92,0.18)]"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-right">
                    <h3 className="text-3xl font-extrabold mb-3 text-white drop-shadow-sm">
                      أهلاً بك يا بطل، {currentStudent?.name ? currentStudent.name.split(' ')[0] : 'يا مبدع'}!
                    </h3>
                    <p className="text-blue-50 text-xl font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                      مستعد لمغامرة جديدة اليوم؟ دعنا نلعب ونتعلم معاً!
                    </p>
                    <button
                      type="button"
                      onClick={scrollToProgressSection}
                      className="mt-3 inline-flex md:mt-5 items-center justify-center rounded-full border border-white/40 bg-white px-5 py-2.5 text-sm font-extrabold text-[#168FC7] shadow-[0_10px_24px_rgba(7,59,92,0.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(7,59,92,0.22)] active:translate-y-0"
                    >
                      ابدأ الآن
                    </button>
                </div>
                </div>
              </SwiperSlide>

              {/* Slide 2: Progress */}
              {progressPercentage >= 100 ? (
                <SwiperSlide>
                  <div className={heroSlideClass}>
                    <div className={progressAnimationFrameClass}>
                      <div className="absolute inset-[10%] rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute inset-[18%] rounded-full bg-cyan-200/20 blur-3xl" />
                      <div ref={numberOneAnimationRef} className="relative z-10 w-full h-full" />
                    </div>
                    <div className="flex-1 text-center md:text-right">
                      <h3 className="text-4xl font-extrabold mb-3 text-white drop-shadow-sm">أنت بطل رائع!</h3>
                      <p className="text-blue-50 text-xl font-medium max-w-lg mx-auto md:mx-0">لقد أكملت جميع الألعاب في خطتك العلاجية بنجاح.</p>
                    </div>
                  </div>
                </SwiperSlide>
              ) : (
                <SwiperSlide>
                  <div className={heroSlideClass}>
                    <div className={progressAnimationFrameClass}>
                      <div className="absolute inset-[10%] rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute inset-[18%] rounded-full bg-cyan-200/20 blur-3xl" />
                      <div ref={numberOneAnimationRef} className="relative z-10 w-full h-full" />
                    </div>
                    <div className="flex-1 text-center md:text-right">
                      <h3 className="text-3xl font-extrabold mb-3 text-white drop-shadow-sm">تقدمك مذهل!</h3>
                      <p className="text-blue-50 text-lg mb-6 font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                        لقد ختمت {completedGames.length} ألعاب من أصل {assignedGames.length}. استمر!
                      </p>
                      <div className="w-full max-w-md mx-auto md:mx-0 bg-black/10 h-5 rounded-full overflow-hidden border border-white/20">
                        <div className="bg-white h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              )}

            </Swiper>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-white/60 bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100 p-12 md:p-16 text-center mb-14 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-500 transform hover:-translate-y-1">
            {/* Decorative background blobs */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-white/50 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-blue-300/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-28 h-28 mb-6 rounded-[2rem] bg-white shadow-sm border border-blue-50 rotate-3 hover:rotate-6 transition-transform duration-300">
                <Gamepad2 size={58} className="text-sky-500 drop-shadow-sm" strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">لا توجد ألعاب مخصصة الآن</h3>
              <p className="text-slate-600 text-xl font-bold max-w-md mx-auto leading-relaxed">
                خذ قسطاً من الراحة! سيعطيك الأخصائي ألعاباً وتحديات جديدة قريباً جداً 🚀
              </p>
            </div>
          </div>
        )}

        {/* Game Progress Section */}
        {(unlockedGame || lockedGames.length > 0 || completedGames.length > 0) && (
          <section ref={progressSectionRef} className="mb-14 scroll-mt-28" aria-label="مسار تقدم الألعاب">
            <h2 className="mb-5 flex items-center gap-3 text-2xl font-extrabold text-slate-800 md:mb-10">
              <Gamepad2 className="text-[#168FC7]" size={32} />
              ألعاب بانتظارك!
            </h2>

            <div ref={progressMapRef} className="relative mx-auto max-w-5xl px-4 py-10 sm:px-8 md:px-12">
              <Sparkles className="pointer-events-none absolute left-[13%] top-20 z-0 text-amber-300/80" size={28} fill="currentColor" aria-hidden="true" />
              <Sparkles className="pointer-events-none absolute right-[18%] bottom-16 z-0 text-cyan-300/70" size={22} fill="currentColor" aria-hidden="true" />
              <div className="pointer-events-none absolute left-[8%] bottom-8 h-10 w-20 rounded-full bg-white/70 shadow-[24px_-8px_0_-6px_rgba(255,255,255,0.76),-20px_-4px_0_-8px_rgba(255,255,255,0.78)]" aria-hidden="true" />
              <svg ref={progressPathSvgRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" aria-hidden="true">
                {pathSegments.map((segment) => (
                  <g key={segment.key}>
                    <path d={segment.d} fill="none" stroke="rgba(34,199,232,0.06)" strokeWidth="18" strokeLinecap="round" />
                    <path d={segment.d} fill="none" stroke="rgba(34,199,232,0.16)" strokeWidth="10" strokeLinecap="round" />
                    <path d={segment.d} fill="none" stroke="#34c6df" strokeWidth="6" strokeLinecap="round" strokeDasharray="9 12" opacity="0.34" />
                  </g>
                ))}
              </svg>
              <div className="relative z-10 mx-auto flex w-full max-w-[58rem] flex-col items-stretch gap-1 md:gap-2">
                {progressMapItems.map((item, index) => (

                  <ProgressStageNode
                    key={`${item.game?.id || index}-${item.status}-${index}`}
                    game={item.game}
                    status={item.status}
                    index={index}
                    nodeRef={(node) => {
                      stageNodeRefs.current[index] = node;
                    }}
                    levelRef={item.status === 'current' ? currentLevelRef : undefined}
                    onPlay={() => navigate(`/student/game/${item.game.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default StudentHome;
