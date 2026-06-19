import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Lock, Medal, Gamepad2, Check, RotateCcw, Sparkles, Trophy, Lightbulb } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import lottie from 'lottie-web';
import 'swiper/css';
import 'swiper/css/pagination';
import welcomeAnimation from '../../assets/Animation/3 Ani.json';
import fourAniAnimation from '../../assets/Animation/4 Ani.json';

const StudentHome = () => {
  const navigate = useNavigate();
  const { currentStudent, sessions } = useTherapyStore();
  const readingAnimationRef = useRef(null);
  const numberOneAnimationRef = useRef(null);

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

  const planName = currentStudent?.planName || 'رحلة الأبطال! 🦸‍♂️';
  const progressPercentage = assignedGames.length > 0 ? (completedGames.length / assignedGames.length) * 100 : 0;
  const welcomeAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8.2rem] h-[8.2rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-3';
  const progressAnimationFrameClass = 'relative shrink-0 flex items-center justify-center w-[8rem] h-[8rem] md:w-40 md:h-40 lg:w-44 lg:h-44 translate-y-1 md:translate-y-2';

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
          <div className="mb-14">
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
                <div className="bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] border border-[#a8d7e7] rounded-[2.5rem] p-6 md:p-8 pb-12 md:pb-12 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)] flex flex-col md:flex-row items-center gap-8 min-h-[240px]">
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
                  </div>
                </div>
              </SwiperSlide>

              {/* Slide 2: Progress */}
              {progressPercentage >= 100 ? (
                <SwiperSlide>
                  <div className="bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] border border-[#a8d7e7] rounded-[2.5rem] p-6 md:p-8 pb-12 md:pb-12 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)] flex flex-col md:flex-row items-center gap-8 min-h-[240px]">
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
                  <div className="bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] border border-[#a8d7e7] rounded-[2.5rem] p-6 md:p-8 pb-12 md:pb-12 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)] flex flex-col md:flex-row items-center gap-8 min-h-[240px]">
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

        {/* Unplayed Games Section */}
        {(unlockedGame || lockedGames.length > 0) && (
          <div className="mb-14">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
              <Gamepad2 className="text-blue-500" size={32} />
              ألعاب بانتظارك!
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Unlocked Game (Current) */}
              {unlockedGame && (
                <div 
                  className="relative overflow-hidden rounded-[2rem] border-2 p-6 bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border-blue-400 shadow-lg shadow-blue-200/50 cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                  onClick={() => navigate(`/student/game/${unlockedGame.id}`)}
                >
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-sm">اللعبة الحالية</div>
                  
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Play className="text-blue-600 w-6 h-6 ml-1" fill="currentColor" />
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-xl mb-2">
                    {unlockedGame.titleAr || unlockedGame.config?.nameAr || unlockedGame.title || unlockedGame.name || 'لعبة علاجية'}
                  </h3>
                  <p className="text-sm font-bold text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                    {unlockedGame.descriptionAr || unlockedGame.description || 'هذه هي مهمتك الجديدة! العبها وانجح فيها لفتح باقي الألعاب.'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-blue-200/50">
                    <span className="font-black text-xs text-blue-700 bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200">متاحة للعب</span>
                    <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:-translate-x-1 transition-transform">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Locked Games */}
              {lockedGames.map((game, index) => (
                <div key={`${game.id}-${index}-locked-grid`} className="relative overflow-hidden bg-slate-50 border-2 border-slate-200 border-dashed rounded-[2rem] p-6 flex flex-col opacity-70 grayscale-[30%]">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mb-5">
                    <Lock className="text-slate-400 w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-700 text-xl mb-2">
                    {game.titleAr || game.config?.nameAr || game.title || game.name || 'لعبة مقفلة'}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                    أنهِ المهام السابقة لكي تفتح هذه اللعبة.
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-200">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 font-black text-xs text-slate-500">
                      <Lock size={12} /> مقفلة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Title */}
        {completedGames.length > 0 && (
          <>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
              <Medal className="text-emerald-500" size={32} />
              ألعاب ختمتها بنجاح!
            </h2>
              
            {/* Completed Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {completedGames.map((game, index) => (
                <div 
                  key={`${game.id}-${index}-completed`} 
                  className={`relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer bg-gradient-to-br from-[#f8fffd] via-white to-[#e0f2fe] border-cyan-100 hover:shadow-cyan-200/50`}
                  onClick={() => navigate(`/student/game/${game.id}`)}
                >
                  <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  
                  <div className="relative z-10 text-right">
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm border border-white/50 flex items-center justify-center backdrop-blur-sm">
                        <Gamepad2 className={`w-7 h-7 text-emerald-500`} />
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full shadow-sm">
                        <Check size={20} strokeWidth={3} />
                      </div>
                    </div>
                    
                    <h3 className="font-black text-slate-800 text-xl mb-2">
                      {game.titleAr || game.config?.nameAr || game.title || game.name || 'لعبة علاجية'}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                      {game.descriptionAr || game.description || 'لعبة تفاعلية لتنمية المهارات بصورة ممتعة ومحفزة.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 font-black text-xs text-slate-600 backdrop-blur-sm border border-white/50">
                        مكتملة بنجاح
                      </span>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-transform active:scale-95 group-hover:-translate-x-1 bg-emerald-700 shadow-emerald-200`}>
                        <RotateCcw size={16} /> العب تاني
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default StudentHome;
