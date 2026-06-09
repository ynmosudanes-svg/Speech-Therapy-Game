export const mockPatients = [
  {
    id: 'p-001',
    name: 'آدم محمد',
    accessCode: 'ADAM1234',
    age: 6,
    diagnosis: 'تأخر لغوي',
    group: 'مجموعة أ',
    therapist: 'د. سارة أحمد',
    attendanceRate: 91,
    progress: 68,
    activePlan: true,
    masteredGoals: 5,
    activeBehaviors: ['الاندفاع'],
  },
  {
    id: 'p-002',
    name: 'ليان محمود',
    accessCode: 'LIAN2234',
    age: 7,
    diagnosis: 'اضطراب طيف التوحد',
    group: 'مجموعة ب',
    therapist: 'د. عمر علي',
    attendanceRate: 84,
    progress: 55,
    activePlan: true,
    masteredGoals: 3,
    activeBehaviors: ['تشتت', 'رفض التعليمات'],
  },
  {
    id: 'p-003',
    name: 'يوسف خالد',
    accessCode: 'YUSF8834',
    age: 5,
    diagnosis: 'فرط حركة وتشتت',
    group: 'مجموعة تمهيدي',
    therapist: 'د. سارة أحمد',
    attendanceRate: 95,
    progress: 76,
    activePlan: false,
    masteredGoals: 7,
    activeBehaviors: [],
  },
];

export const mockLibraryItems = [
  { id: 'lib-1', title: 'أوامر من خطوة واحدة', category: 'لغة واستيعاب', level: 'مبتدئ' },
  { id: 'lib-2', title: 'تدريب التواصل البصري', category: 'تفاعل اجتماعي', level: 'مبتدئ' },
  { id: 'lib-3', title: 'التصنيف حسب اللون', category: 'إدراك معرفي', level: 'متوسط' },
  { id: 'lib-4', title: 'تقليل السلوك الاندفاعي', category: 'سلوك', level: 'متقدم' },
];

const mockSessions = [
  { id: 's-1', patientId: 'p-001', date: '2026-05-16', time: '10:00', type: 'تخاطب', attendance: 'حضر', score: 73 },
  { id: 's-2', patientId: 'p-001', date: '2026-05-18', time: '12:00', type: 'سلوك', attendance: 'قادمة', score: null },
  { id: 's-3', patientId: 'p-002', date: '2026-05-16', time: '11:30', type: 'تخاطب', attendance: 'حضر', score: 59 },
  { id: 's-4', patientId: 'p-003', date: '2026-05-17', time: '09:30', type: 'تنمية مهارات', attendance: 'قادمة', score: null },
];

const mockAssessmentSummary = {
  'p-001': { language: 64, behavior: 58, cognitive: 61, attention: 67, updatedAt: '2026-05-14' },
  'p-002': { language: 52, behavior: 47, cognitive: 55, attention: 51, updatedAt: '2026-05-13' },
  'p-003': { language: 71, behavior: 70, cognitive: 74, attention: 76, updatedAt: '2026-05-12' },
};

const mockPlanSummary = {
  'p-001': {
    activePlanName: 'خطة الربع الثاني',
    activeGoals: 4,
    masteredGoals: 5,
    activeTargets: 9,
    masteredTargets: 11,
  },
  'p-002': {
    activePlanName: 'خطة تعديل سلوك',
    activeGoals: 5,
    masteredGoals: 3,
    activeTargets: 12,
    masteredTargets: 6,
  },
  'p-003': {
    activePlanName: 'لا توجد خطة نشطة',
    activeGoals: 0,
    masteredGoals: 7,
    activeTargets: 0,
    masteredTargets: 15,
  },
};

const mockBehaviorSummary = {
  'p-001': [
    { name: 'الاندفاع', frequencyPerWeek: 4, intensity: 'متوسط', trend: 'تحسن بسيط' },
  ],
  'p-002': [
    { name: 'رفض التعليمات', frequencyPerWeek: 6, intensity: 'مرتفع', trend: 'ثابت' },
    { name: 'تشتت', frequencyPerWeek: 5, intensity: 'متوسط', trend: 'تحسن' },
  ],
  'p-003': [],
};

const mockReports = {
  'p-001': [
    { id: 'r-1', type: 'تقرير أسبوعي', date: '2026-05-10', status: 'جاهز' },
    { id: 'r-2', type: 'تقرير تقدم', date: '2026-05-15', status: 'جاهز' },
  ],
  'p-002': [{ id: 'r-3', type: 'تقرير سلوك', date: '2026-05-11', status: 'جاهز' }],
  'p-003': [{ id: 'r-4', type: 'تقرير حضور', date: '2026-05-09', status: 'جاهز' }],
};

export const buildPatientWorkspaceMock = (patientId) => {
  const patient = mockPatients.find((item) => String(item.id) === String(patientId)) || null;

  return {
    patient,
    assessmentSummary: mockAssessmentSummary[patientId] || null,
    planSummary: mockPlanSummary[patientId] || null,
    sessions: mockSessions.filter((session) => session.patientId === patientId),
    behaviors: mockBehaviorSummary[patientId] || [],
    reports: mockReports[patientId] || [],
    libraryItems: mockLibraryItems,
  };
};

export const getDashboardMock = () => {
  const totalPatients = mockPatients.length;
  const today = '2026-05-16';
  const todaySessions = mockSessions.filter((session) => session.date === today).length;
  const activePlans = mockPatients.filter((item) => item.activePlan).length;
  const masteredGoals = mockPatients.reduce((acc, item) => acc + item.masteredGoals, 0);
  const attendanceRate = Math.round(
    mockPatients.reduce((acc, item) => acc + item.attendanceRate, 0) / totalPatients
  );
  const overallProgress = Math.round(
    mockPatients.reduce((acc, item) => acc + item.progress, 0) / totalPatients
  );

  return {
    kpis: { totalPatients, todaySessions, activePlans, masteredGoals, attendanceRate, overallProgress },
    upcomingSessions: mockSessions.filter((session) => session.attendance === 'قادمة').slice(0, 4),
    followUpPatients: mockPatients.filter((item) => item.progress < 60 || item.attendanceRate < 85),
    activeBehaviorAlerts: mockPatients
      .filter((item) => item.activeBehaviors.length > 0)
      .map((item) => ({ patientId: item.id, patientName: item.name, behaviors: item.activeBehaviors })),
    progressTrend: [
      { label: 'يناير', value: 38 },
      { label: 'فبراير', value: 44 },
      { label: 'مارس', value: 52 },
      { label: 'أبريل', value: 59 },
      { label: 'مايو', value: overallProgress },
    ],
  };
};
