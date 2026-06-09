export const CURRICULUM_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
};

export const curriculumTreeMock = [
  {
    id: 'cur-1',
    name: 'المنهج المصري الجديد في التعامل مع صعوبات التعلم',
    itemType: 'CURRICULUM',
    status: CURRICULUM_STATUS.APPROVED,
    level: 'متقدم',
    stage: 'البداية',
    children: [
      {
        id: 'asp-1',
        name: 'الجوانب المعرفية',
        itemType: 'ASPECT',
        status: CURRICULUM_STATUS.PENDING_APPROVAL,
        level: 'متوسط',
        stage: 'ما بعد البداية',
        children: [
          {
            id: 'lg-1',
            name: 'تنمية الانتباه السمعي',
            itemType: 'LONG_GOAL',
            status: CURRICULUM_STATUS.APPROVED,
            level: 'مبتدئ',
            stage: 'البداية',
            children: [
              {
                id: 'sg-1',
                name: 'ينفذ أمر من خطوة واحدة بدقة 80%',
                itemType: 'SHORT_GOAL',
                status: CURRICULUM_STATUS.DRAFT,
                level: 'مبتدئ',
                stage: 'البداية',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'asp-2',
        name: 'الجوانب اللغوية',
        itemType: 'ASPECT',
        status: CURRICULUM_STATUS.REJECTED,
        level: 'متوسط',
        stage: 'النهاية',
        children: [],
      },
    ],
  },
];
