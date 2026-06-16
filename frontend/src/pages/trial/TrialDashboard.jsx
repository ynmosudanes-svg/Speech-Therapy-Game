import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Layers3, ListChecks, MousePointer2, Shapes, Sparkles } from 'lucide-react';
import AuthButton from '../../components/auth/AuthButton';
import LockedFeatureCard from '../../components/auth/LockedFeatureCard';
import TrialGameCard from '../../components/auth/TrialGameCard';

const ACCOUNT_USER_KEY = 'registered_user';

const trialGames = [
  {
    title: 'مطابقة الصور',
    description: 'نشاط بسيط لتجربة ربط الصورة بالصورة المناسبة.',
    icon: Shapes,
  },
  {
    title: 'اختيار الشيء المطلوب',
    description: 'يتدرب الطفل على اختيار العنصر الصحيح من بدائل واضحة.',
    icon: MousePointer2,
  },
  {
    title: 'تصنيف الأشياء',
    description: 'تجربة تصنيف العناصر داخل مجموعات سهلة.',
    icon: Layers3,
  },
  {
    title: 'ترتيب الخطوات',
    description: 'نشاط لترتيب خطوات قصيرة بطريقة تفاعلية.',
    icon: ListChecks,
  },
  {
    title: 'تمييز الحجم',
    description: 'تجربة التمييز بين الأحجام بشكل بصري بسيط.',
    icon: Sparkles,
  },
];

const readTrialUser = () => {
  try {
    const stored = localStorage.getItem(ACCOUNT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_error) {
    return null;
  }
};

const TrialDashboard = () => {
  const [trialUser, setTrialUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeDemo, setActiveDemo] = useState('');

  useEffect(() => {
    setTrialUser(readTrialUser());
    setLoaded(true);
  }, []);

  const displayName = useMemo(() => trialUser?.name || 'بك', [trialUser?.name]);

  if (loaded && !trialUser) {
    return <Navigate to="/auth/register" replace />;
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#F8FBFD] px-4 py-5 text-[#0F172A] sm:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[1.75rem] border border-[#D9EAF2] bg-white p-5 shadow-[0_18px_45px_rgba(7,59,92,0.08)] md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-black text-[#1584C3]">أهلاً {displayName}</p>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[#073B5C] md:text-[2rem]">
                تم إنشاء حسابك بنجاح
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-[#64748B] md:text-base">
                بياناتك وصلت للنظام. سيتم مراجعتها من المختص لتفعيل الحساب وإعداد الخطة العلاجية المناسبة.
              </p>
            </div>
            <LockedFeatureCard />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#073B5C]">الألعاب التجريبية</h2>
              <p className="mt-1 text-sm font-bold text-[#64748B]">تظهر الأنشطة الحقيقية بعد تفعيل حسابك من المختص.</p>
            </div>
            <AuthButton to="/" state={{ mode: 'student' }} variant="secondary" className="sm:w-auto">
              دخول المستفيد بالكود
            </AuthButton>
          </div>

          {activeDemo && (
            <div className="mb-4 rounded-2xl border border-[#D9EAF2] bg-white px-4 py-3 text-sm font-bold text-[#0F6FA6]">
              تم اختيار تجربة: {activeDemo}. هذه معاينة تجريبية فقط، وسيتم فتح النشاط الحقيقي بعد التفعيل.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trialGames.map((game) => (
              <TrialGameCard
                key={game.title}
                title={game.title}
                description={game.description}
                icon={game.icon}
                onStart={() => setActiveDemo(game.title)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default TrialDashboard;
