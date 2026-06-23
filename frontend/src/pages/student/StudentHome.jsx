import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameLibraryService from '../../services/gameLibraryService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import lottie from 'lottie-web';
import 'swiper/css';
import 'swiper/css/pagination';
import welcomeAnimation from '../../assets/Animation/3 Ani.json';
import fourAniAnimation from '../../assets/Animation/4 Ani.json';
import GroupSection from '../../components/levelmap/GroupSection';
import CelebrationOverlay from '../../components/levelmap/CelebrationOverlay';

const StudentHome = () => {
  const navigate = useNavigate();
  const { currentStudent, sessions, studentSession } = useTherapyStore();
  const readingAnimationRef = useRef(null);
  const numberOneAnimationRef = useRef(null);
  const progressSectionRef = useRef(null);
  
  const [libraries, setLibraries] = useState([]);
  const [loadingLibraries, setLoadingLibraries] = useState(true);
  const [celebratingGroupId, setCelebratingGroupId] = useState(null);
  const [celebratedGroups, setCelebratedGroups] = useState(new Set());

  const assignedGames = Array.isArray(currentStudent?.assignedGames) ? currentStudent.assignedGames : [];

  const studentSessions = Array.isArray(sessions)
    ? sessions.filter((session) => String(session.studentId) === String(currentStudent?.id) && session.sessionType !== 'FREE_PLAY')
    : [];

  const completedGameIds = useMemo(() => {
    return new Set(studentSessions.map(s => String(s.gameId)));
  }, [studentSessions]);

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        setLoadingLibraries(true);
        const token = studentSession?.token;
        if (token) {
           const response = await gameLibraryService.getLibraries(token);
           setLibraries(Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []));
        }
      } catch (error) {
        console.error('Failed to fetch libraries', error);
      } finally {
        setLoadingLibraries(false);
      }
    };
    fetchLibraries();
  }, [studentSession?.token]);

  const { groups, progressPercentage, completedCount } = useMemo(() => {
    if (!assignedGames.length) {
      return { groups: [], progressPercentage: 0, completedCount: 0 };
    }

    const unassigned = [];
    const libraryMap = new Map();

    // Initialize map with available libraries
    libraries.forEach(lib => {
      libraryMap.set(String(lib.id), { ...lib, games: [] });
    });

    // Group assigned games into libraries.
    // Since we iterate over assignedGames (which is ordered by the admin's custom assignment order),
    // pushing them sequentially preserves this exact custom order within each library!
    assignedGames.forEach(game => {
      let matchedLibraryId = null;
      for (const lib of libraries) {
        if (lib.gameIds && lib.gameIds.some(id => String(id) === String(game.id))) {
          matchedLibraryId = String(lib.id);
          break;
        }
      }

      const isCompleted = completedGameIds.has(String(game.id));
      const gameNode = { ...game, isCompleted };

      if (matchedLibraryId && libraryMap.has(matchedLibraryId)) {
        libraryMap.get(matchedLibraryId).games.push(gameNode);
      } else {
        unassigned.push(gameNode);
      }
    });

    // Maintain the order of first appearance in assignedGames
    const customOrderedLibraryIds = [];
    assignedGames.forEach(game => {
      for (const lib of libraries) {
        if (lib.gameIds && lib.gameIds.some(id => String(id) === String(game.id))) {
          if (!customOrderedLibraryIds.includes(String(lib.id))) {
            customOrderedLibraryIds.push(String(lib.id));
          }
          break;
        }
      }
    });

    const sortedLibraries = customOrderedLibraryIds
      .map(id => libraryMap.get(id))
      .filter(lib => lib && lib.games.length > 0);

    let firstUnlockedFound = false;
    let count = 0;
    const finalGroups = [];

    // Build grouped structure
    sortedLibraries.forEach(lib => {
      const groupGames = [];

      for (const game of lib.games) {
        let status = game.isCompleted ? 'done' : 'locked';
        if (game.isCompleted) count++;

        if (status === 'locked' && !firstUnlockedFound) {
          status = 'current';
          firstUnlockedFound = true;
        }

        groupGames.push({
          id: game.id,
          data: game,
          status,
        });
      }

      const isCompleted = groupGames.length > 0 && groupGames.every(g => g.status === 'done');

      finalGroups.push({
        id: `lib-${lib.id}`,
        title: lib.name,
        color: lib.color,
        games: groupGames,
        isCompleted,
      });
    });

    // Add unassigned games at the end if any
    if (unassigned.length > 0) {
      const unassignedGames = [];
      for (const game of unassigned) {
        let status = game.isCompleted ? 'done' : 'locked';
        if (game.isCompleted) count++;

        if (status === 'locked' && !firstUnlockedFound) {
          status = 'current';
          firstUnlockedFound = true;
        }

        unassignedGames.push({
          id: game.id,
          data: game,
          status,
        });
      }

      const isCompleted = unassignedGames.length > 0 && unassignedGames.every(g => g.status === 'done');

      finalGroups.push({
        id: 'lib-unassigned',
        title: 'ألعاب إضافية',
        color: '#168FC7',
        games: unassignedGames,
        isCompleted,
      });
    }

    const percentage = assignedGames.length > 0 ? (count / assignedGames.length) * 100 : 0;
    return { groups: finalGroups, progressPercentage: percentage, completedCount: count };
  }, [assignedGames, completedGameIds, libraries]);

  const scrollToProgressSection = useCallback(() => {
    const currentLevelElement = document.getElementById('current-level-node');
    const target = currentLevelElement || progressSectionRef.current;
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  const handleCelebrate = useCallback((groupId) => {
    if (!celebratedGroups.has(groupId)) {
      setCelebratingGroupId(groupId);
      setCelebratedGroups(prev => new Set(prev).add(groupId));
    }
  }, [celebratedGroups]);

  const handleCloseCelebration = useCallback(() => {
    setCelebratingGroupId(null);
  }, []);
  const welcomeAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8.2rem] h-[8.2rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-3';
  const progressAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8rem] h-[8rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-2';
  const heroSlideClass = 'bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] border border-[#a8d7e7] rounded-[2.5rem] p-6 md:p-8 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)] flex h-[22rem] flex-col items-center justify-center gap-8 md:h-auto md:min-h-[240px] md:flex-row';
  
  const getGameTitle = (game) => game.titleAr || game.config?.nameAr || game.title || game.name || 'لعبة علاجية';

  // Find the group title for the celebration overlay
  const celebratingGroup = groups.find(g => g.id === celebratingGroupId);

  useEffect(() => {
    if (!readingAnimationRef.current) return undefined;

    const instance = lottie.loadAnimation({
      container: readingAnimationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: welcomeAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    return () => instance.destroy();
  }, []);

  useEffect(() => {
    if (!numberOneAnimationRef.current) return undefined;

    const instance = lottie.loadAnimation({
      container: numberOneAnimationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: fourAniAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    return () => instance.destroy();
  }, []);

  const showProgressSection = assignedGames.length > 0;

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
                        لقد ختمت {completedCount} ألعاب من أصل {assignedGames.length}. استمر!
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

        {/* Level Map Section */}
        {showProgressSection && (
          <section ref={progressSectionRef} className="mb-14 scroll-mt-28" aria-label="مسار تقدم الألعاب">
            {loadingLibraries ? (
              <div className="flex justify-center p-10"><span className="animate-pulse text-slate-400 font-bold">جاري التحميل...</span></div>
            ) : (
              <div className="mx-auto max-w-2xl px-2 sm:px-4">
                <div className="mb-8 flex justify-start">
                  <h2 className="inline-flex items-center gap-2 text-2xl font-black text-[#0f6f9a]">
                    <Gamepad2 size={28} className="text-[#168FC7]" />
                    رحلة الألعاب
                  </h2>
                </div>
                <div className="flex flex-col gap-8 md:gap-10">
                  {groups.map((group, groupIndex) => (
                    <GroupSection
                      key={group.id}
                      group={group}
                      groupIndex={groupIndex}
                      onLevelClick={(gameId) => navigate(`/student/game/${gameId}`)}
                      onCelebrate={handleCelebrate}
                      getGameTitle={getGameTitle}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Celebration Overlay */}
        <CelebrationOverlay
          isOpen={!!celebratingGroupId}
          groupTitle={celebratingGroup?.title || ''}
          onClose={handleCloseCelebration}
        />

      </div>
    </div>
  );
};

export default StudentHome;
