import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  Volume2,
  Check,
  MoreVertical,
  Search,
  Tag,
  X,
  Settings,
  Image as ImageIcon,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ImageAssetField from '../../components/ImageAssetField';
import { gameService } from '../../services/gameService';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { SOUND_PRESET_OPTIONS, playAudioUrl } from '../../utils/soundEffects';
import {
  buildActivityRuntimeGame,
  createEmptyBuilderConfig,
  getDefaultActivityForType,
  normalizeBuilderConfig,
} from '../../games/adapters/buildActivityPreviewGame';
import renderGameActivity from '../../games/renderGameActivity';

const GAME_TYPE_CARDS = [
  {
    value: 'matching.similar',
    title: 'الصورة المطابقة',
    description: 'صورة رئيسية في السؤال وتحتها اختيارات يختار منها الطفل الصورة المطابقة.',
    accent: 'from-blue-100 to-cyan-100',
  },
  {
    value: 'matching.different',
    title: 'أوجد المختلف',
    description: 'صورة رئيسية في السؤال ومعها اختياران أو أكثر يختار منها الطفل الصورة المختلفة. مثال: قطة كبيرة وفوق الاختيارات قطة وكلب.',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    value: 'matching.find',
    title: 'أوجد الصورة',
    description: 'بدون صورة رئيسية فوق. يسمع الطفل التعليمات مثل: أوجد القطة، ثم يختار من 2 أو 3 أو 4 أو 6 صور.',
    accent: 'from-fuchsia-100 to-pink-100',
  },
  {
    value: 'sequence.order',
    title: 'ترتيب الصور',
    description: 'صور خطوات يعيد الطفل ترتيبها بالسحب.',
    accent: 'from-emerald-100 to-lime-100',
  },
  {
    value: 'action.drag_to_target',
    title: 'السحب والإفلات',
    description: 'مشهد ثابت في المنتصف والعناصر تُسحب إلى المكان الصحيح داخل الصورة.',
    accent: 'from-rose-100 to-orange-100',
  },
  {
    value: 'navigation.move_to_target',
    title: 'التحريك بالأزرار',
    description: 'تحريك عنصر خطوة بخطوة باستخدام الأسهم حتى يصل إلى الهدف.',
    accent: 'from-violet-100 to-sky-100',
  },
  {
    value: 'navigation.maze',
    title: 'لعبة المتاهة',
    description: 'حرّك اللاعب داخل متاهة حقيقية حتى يصل إلى الهدف عبر المسار الصحيح.',
    accent: 'from-indigo-100 to-cyan-100',
  },
  {
    value: 'text.missing_word',
    title: 'أكمل الكلمة الناقصة',
    description: 'عرض كلمة بها حرف ناقص مع خيارات متعددة ليختار الطفل الحرف الصحيح.',
    accent: 'from-teal-100 to-emerald-100',
  },
  {
    value: 'cards.audio_flashcards',
    title: 'الكروت الصوتية',
    description: 'كروت تعليمية بالصور والكلمات لتشغيل النطق التلقائي عند الضغط عليها.',
    accent: 'from-fuchsia-100 to-purple-100',
  },
  {
    value: 'puzzle.jigsaw',
    title: 'لعبة البازل',
    description: 'يقوم الطفل بتركيب أجزاء الصورة لإكمال الشكل النهائي، لتنمية مهارات التركيز وحل المشكلات.',
    accent: 'from-blue-100 to-indigo-100',
  },
];

const EMPTY_MESSAGE = 'ارفع الملف أو اتركه فارغًا مؤقتًا';
const getActivityAutoTitle = (index) => `نشاط ${index + 1}`;
const getActivitySummary = (activity, index) =>
  activity?.titleAr?.trim() || activity?.questionAr?.trim() || getActivityAutoTitle(index);
const getTypeCardTitle = (type) => GAME_TYPE_CARDS.find((card) => card.value === type)?.title || '';
const MAZE_PRESETS = {
  easy: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ],
    startX: 2,
    startY: 2,
    goalX: 6,
    goalY: 6,
  },
  medium: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    startX: 2,
    startY: 2,
    goalX: 8,
    goalY: 8,
  },
  hard: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    startX: 10,
    startY: 2,
    goalX: 2,
    goalY: 10,
  },
};
const serializeMazeGrid = (grid) =>
  Array.isArray(grid)
    ? grid.map((row) => row.map((cell) => (Number(cell) === 1 ? 1 : 0)).join(' ')).join('\n')
    : '';
const parseMazeGrid = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[\s,]+/).map((cell) => (cell === '1' ? 1 : 0)))
    .filter((row) => row.length > 0);
const MAZE_DRAW_TOOLS = [
  { value: 'wall', label: 'جدار' },
  { value: 'path', label: 'مسار' },
  { value: 'start', label: 'بداية' },
  { value: 'goal', label: 'هدف' },
];

const translateApiError = (msg) => {
  if (!msg) return msg;
  const lower = typeof msg === 'string' ? msg.toLowerCase() : String(msg);
  if (lower.includes('unique constraint failed')) {
    if (lower.includes('gamecode')) return 'كود اللعبة هذا مستخدم مسبقاً، يرجى كتابة كود مختلف.';
    if (lower.includes('email')) return 'البريد الإلكتروني مسجل مسبقاً.';
    return 'هذا العنصر موجود بالفعل ولا يمكن تكراره.';
  }
  if (lower.includes('not found')) return 'تعذر العثور على العنصر المطلوب.';
  if (lower.includes('unauthorized')) return 'غير مصرح لك بالقيام بهذه العملية، يرجى تسجيل الدخول.';
  if (lower.includes('forbidden')) return 'ليس لديك الصلاحيات الكافية لإتمام هذا الإجراء.';
  if (lower.includes('validation')) return 'بعض البيانات المدخلة غير صحيحة، يرجى مراجعتها.';
  if (lower.includes('network error')) return 'مشكلة في الاتصال بالإنترنت، يرجى المحاولة لاحقاً.';
  return msg;
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseErrors = error?.response?.data?.details || error?.response?.data?.errors;
  const firstIssueMessage = Array.isArray(responseErrors) ? responseErrors[0]?.message : '';
  if (firstIssueMessage) {
    return translateApiError(firstIssueMessage);
  }

  const responseMessage = error?.response?.data?.message || error?.response?.data?.error;
  if (responseMessage) {
    return translateApiError(responseMessage);
  }
  return translateApiError(error?.message) || fallbackMessage;
};

import MediaLibraryModal from '../../components/admin/MediaLibraryModal';

const FileUploadField = ({
  label,
  value,
  onUploaded,
  uploadAsset,
  accept = 'image/*,audio/*,video/*',
  previewType = 'auto',
  placeholder = EMPTY_MESSAGE,
  mediaType = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadedUrl = await uploadAsset(file);
      onUploaded(uploadedUrl);
    } catch (error) {
      window.alert(getApiErrorMessage(error, 'تعذر رفع الملف.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const resolvedPreviewType =
    previewType === 'auto'
      ? value.match(/\.(mp3|wav|ogg|m4a)$/i)
        ? 'audio'
        : value.match(/\.(mp4|webm|mov)$/i)
          ? 'video'
          : 'image'
      : previewType;

  return (
    <div className="space-y-3">
      <label className="block font-bold text-slate-700">{label}</label>
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe7f3] bg-[#f7fbff] px-4 py-3 font-bold text-slate-700 cursor-pointer hover:bg-white transition-colors whitespace-nowrap">
          {uploading ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}
          <span>{uploading ? 'جارٍ الرفع...' : 'رفع جديد'}</span>
          <input type="file" accept={accept} className="hidden" onChange={handleFileChange} />
        </label>

        <button
          type="button"
          onClick={() => setIsLibraryOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 font-bold text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap"
        >
          <ImageIcon size={18} />
          <span>مكتبة الوسائط</span>
        </button>

        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(event) => onUploaded(event.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(url) => onUploaded(url)}
        initialType={mediaType}
      />

      {resolvedPreviewType === 'image' && (
        <div
          className={`w-full max-w-md h-40 rounded-2xl border p-3 flex items-center justify-center overflow-hidden ${
            value ? 'border-slate-200 bg-white' : 'border-[#dbe7f3] bg-[#f7fbff]'
          }`}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full rounded-[1rem] border-2 border-dashed border-[#b8deec] bg-[linear-gradient(180deg,_#f7fbff,_#eef8fb)] flex items-center justify-center text-[#138fbc]">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-[#cfe3f3] bg-white/90 shadow-sm">
                <ImagePlus size={28} />
              </div>
            </div>
          )}
        </div>
      )}
      {value && resolvedPreviewType === 'audio' && <audio controls src={value} className="w-full" />}
      {value && resolvedPreviewType === 'video' && (
        <div className="w-full max-w-[400px] rounded-2xl overflow-hidden border border-[#dbe7f3] mx-auto md:mx-0 shadow-sm">
          <video controls src={value} className="w-full h-auto rounded-2xl" />
        </div>
      )}
    </div>
  );
};

const SoundPresetField = ({ label, value, options, onChange }) => {
  const presetOptions = options.filter((option) => option.value);
  const hasCustomValue = value && !options.some((option) => option.value === value);
  const colorThemes = [
    {
      idle: 'border-slate-200 bg-white text-slate-700',
      active: 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100 ring-2 ring-emerald-200',
      icon: 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800',
    },
    {
      idle: 'border-slate-200 bg-white text-slate-700',
      active: 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100 ring-2 ring-amber-200',
      icon: 'border-amber-200 text-amber-700 hover:border-amber-300 hover:text-amber-800',
    },
    {
      idle: 'border-slate-200 bg-white text-slate-700',
      active: 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm shadow-sky-100 ring-2 ring-sky-200',
      icon: 'border-sky-200 text-sky-700 hover:border-sky-300 hover:text-sky-800',
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block font-bold text-slate-700">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presetOptions.map((option, index) => {
          const isActive = value === option.value;
          const theme = colorThemes[index % colorThemes.length];

          return (
            <div
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange(option.value);
                }
              }}
              className={`rounded-[1.2rem] border px-4 py-3 transition-all min-h-[7rem] flex flex-col justify-between ${
                isActive ? theme.active : theme.idle
              } cursor-pointer`}
            >
              <div className="w-full text-right">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-base font-black">{option.label}</span>
                  {isActive && (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                      مختار
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    playAudioUrl(option.value);
                  }}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 transition-colors ${theme.icon}`}
                  aria-label={`معاينة ${option.label}`}
                >
                  <Volume2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          className={`!py-3 !px-5 justify-center ${!value ? '!text-blue-700 !border-blue-200 !bg-blue-50' : ''}`}
          onClick={() => onChange('')}
        >
          <span>بدون صوت</span>
        </Button>

        {hasCustomValue && (
          <Button
            type="button"
            variant="outline"
            className="!py-3 !px-4 justify-center"
            onClick={() => playAudioUrl(value)}
          >
            <Volume2 size={18} />
            <span>معاينة الصوت المخصص</span>
          </Button>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({ children, action }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <h3 className="text-2xl font-black text-slate-900">{children}</h3>
    {action}
  </div>
);

const GameForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { adminSession } = useTherapyStore();
  const isEdit = mode === 'edit';

  const [builderState, setBuilderState] = useState({
    gameCode: '',
    name: '',
    nameAr: '',
    type: '',
    isActive: true,
    config: createEmptyBuilderConfig('matching.similar'),
  });
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [mazeDrawTool, setMazeDrawTool] = useState('wall');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [customTags, setCustomTags] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gameCustomTags')) || {};
    } catch {
      return {};
    }
  });
  const [tagMenuOpen, setTagMenuOpen] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleToggleTag = (gameValue, tag) => {
    const updated = { ...customTags };
    if (!updated[gameValue]) updated[gameValue] = [];
    if (updated[gameValue].includes(tag)) {
      updated[gameValue] = updated[gameValue].filter((t) => t !== tag);
    } else {
      updated[gameValue] = [...updated[gameValue], tag];
    }
    setCustomTags(updated);
    localStorage.setItem('gameCustomTags', JSON.stringify(updated));
  };

  const handleAddNewTag = (gameValue) => {
    if (!newTagInput.trim()) return;
    handleToggleTag(gameValue, newTagInput.trim());
    setNewTagInput('');
  };

  const allAvailableTags = useMemo(() => {
    const tags = new Set(Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)));
    Object.values(customTags).forEach(arr => arr.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [customTags]);

  const filteredCards = useMemo(() => {
    return GAME_TYPE_CARDS.filter((card) => {
      const matchesSearch =
        card.title.includes(searchQuery) || card.description.includes(searchQuery);
      if (!matchesSearch) return false;
      
      if (activeTags.length > 0) {
        const cardTags = customTags[card.value] || [];
        const hasAllActiveTags = activeTags.every(tag => cardTags.includes(tag));
        if (!hasAllActiveTags) return false;
      }
      return true;
    });
  }, [searchQuery, activeTags, customTags]);

  const uploadAsset = async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await gameService.uploadAsset(adminSession?.token, form);
    return response.url;
  };

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    const fetchGame = async () => {
      try {
        const game = await gameService.getGame(adminSession?.token, gameId);
        const config = normalizeBuilderConfig(game);
        setBuilderState({
          gameCode: game.gameCode || '',
          name: game.name || config.name || '',
          nameAr: game.titleAr || config.nameAr || '',
          type: game.type || config.templateType,
          isActive: game.isActive ?? true,
          config,
        });
      } catch (error) {
        window.alert(getApiErrorMessage(error, 'تعذر تحميل اللعبة.'));
        navigate('/admin/games');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [adminSession?.token, gameId, isEdit, navigate]);

  const levels = builderState.config?.levels || [];
  const currentLevel = levels[selectedLevel] || levels[0];
  const currentActivities = Array.isArray(currentLevel?.activities) ? currentLevel.activities : [];
  const currentActivity = currentActivities[selectedActivity] || null;

  const previewGame = useMemo(() => {
    if (!builderState.type || !currentActivity) {
      return null;
    }

    return buildActivityRuntimeGame({
      nameAr: builderState.nameAr,
      templateType: builderState.type,
      activity: currentActivity,
      sharedMedia: builderState.config.media,
    });
  }, [builderState.config.media, builderState.nameAr, builderState.type, currentActivity]);

  const updateConfig = (updater) => {
    setBuilderState((current) => ({
      ...current,
      config: typeof updater === 'function' ? updater(current.config) : updater,
    }));
  };

  const updateType = (type) => {
    const selectedTypeCard = GAME_TYPE_CARDS.find((card) => card.value === type);

    setBuilderState((current) => {
      const previousTypeTitle = getTypeCardTitle(current.type);
      const trimmedNameAr = current.nameAr?.trim() || '';
      const trimmedName = current.name?.trim() || '';
      const shouldReplaceAutoName =
        !trimmedNameAr || trimmedNameAr === previousTypeTitle || trimmedNameAr === trimmedName;
      const autoNameAr = shouldReplaceAutoName ? selectedTypeCard?.title || '' : trimmedNameAr;
      const autoName = shouldReplaceAutoName ? autoNameAr : trimmedName || trimmedNameAr;

      return {
        ...current,
        type,
        name: autoName,
        nameAr: autoNameAr,
        config: {
          ...createEmptyBuilderConfig(type),
          name: autoName,
          nameAr: autoNameAr,
        },
      };
    });
    setSelectedLevel(0);
    setSelectedActivity(0);
    setFormError('');
  };

  const updateLevel = (levelIndex, updater) => {
    updateConfig((currentConfig) => ({
      ...currentConfig,
      levels: currentConfig.levels.map((level, index) =>
        index === levelIndex ? (typeof updater === 'function' ? updater(level) : updater) : level
      ),
    }));
  };

  const updateCurrentActivity = (updater) => {
    updateLevel(selectedLevel, (level) => ({
      ...level,
      activities: level.activities.map((activity, index) =>
        index === selectedActivity ? (typeof updater === 'function' ? updater(activity) : updater) : activity
      ),
    }));
  };

  const addActivity = () => {
    if (!builderState.type) return;

    updateLevel(selectedLevel, (level) => ({
      ...level,
      activities: [
        ...level.activities,
        getDefaultActivityForType(builderState.type, level.activities.length),
      ],
    }));
    setSelectedActivity(currentActivities.length);
  };

  const removeActivity = (activityIndex) => {
    updateLevel(selectedLevel, (level) => ({
      ...level,
      activities: level.activities.filter((_, index) => index !== activityIndex),
    }));
    setSelectedActivity((current) => Math.max(Math.min(current, currentActivities.length - 2), 0));
  };

  const setActivityField = (field, value) => {
    updateCurrentActivity((activity) => ({ ...activity, [field]: value }));
  };

  const updateOption = (optionIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      options: activity.options.map((option, index) => {
        if (index !== optionIndex) return option;
        return { ...option, [field]: value };
      }),
    }));
  };

  const selectCorrectOption = (optionIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      options: activity.options.map((option, index) => ({
        ...option,
        isCorrect: index === optionIndex,
      })),
    }));
  };

  const addOption = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      options: [
        ...(activity.options || []),
        {
          id: `option_${Date.now()}`,
          image: '',
          textAr: '',
          isCorrect: false,
        },
      ],
    }));
  };

  // Auto-initialize missing_word options if empty
  useEffect(() => {
    if (builderState.type === 'text.missing_word' && currentActivity) {
      if (!currentActivity.options || currentActivity.options.length === 0) {
        updateCurrentActivity((activity) => ({
          ...activity,
          options: [
            { id: `opt_${Date.now()}_1`, textAr: '', isCorrect: true },
            { id: `opt_${Date.now()}_2`, textAr: '', isCorrect: false },
          ],
        }));
      }
    }
  }, [builderState.type, currentActivity?.id]); // Only run when activity changes or type changes

  const removeOption = (optionIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      options: activity.options.filter((_, index) => index !== optionIndex),
    }));
  };

  const updateCard = (cardIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      cards: activity.cards.map((card, index) => {
        if (index !== cardIndex) return card;
        return { ...card, [field]: value };
      }),
    }));
  };

  const addCard = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      cards: [
        ...(activity.cards || []),
        {
          id: `card_${Date.now()}`,
          image: '',
          textAr: '',
          audioUrl: '',
        },
      ],
    }));
  };

  const removeCard = (cardIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      cards: (activity.cards || []).filter((_, index) => index !== cardIndex),
    }));
  };

  const updateDraggable = (itemIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      draggables: (activity.draggables || []).map((item, index) =>
        index === itemIndex ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addDraggable = () => {
    updateCurrentActivity((activity) => {
      const nextIndex = (activity.draggables?.length || 0) + 1;
      const nextDraggableId = `drag_${nextIndex}`;
      return {
        ...activity,
        draggables: [
          ...(activity.draggables || []),
          {
            id: nextDraggableId,
            image: '',
            labelAr: '',
            startPosition: 'bottom',
            isCorrect: false,
          },
        ],
      };
    });
  };

  const removeDraggable = (itemIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      draggables: (activity.draggables || []).filter((_, index) => index !== itemIndex),
    }));
  };

  const updateStep = (stepIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      steps: activity.steps.map((step, index) =>
        index === stepIndex ? { ...step, [field]: value } : step
      ),
    }));
  };

  const updateNavigationField = (section, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      [section]: {
        ...(activity[section] || {}),
        [field]: value,
      },
    }));
  };

  const updateMazeField = (field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      maze: {
        ...(activity.maze || {}),
        [field]: value,
      },
    }));
  };

  const applyMazePreset = (presetKey) => {
    const preset = MAZE_PRESETS[presetKey];
    if (!preset) return;

    updateCurrentActivity((activity) => ({
      ...activity,
      maze: {
        ...(activity.maze || {}),
        grid: preset.grid,
        startX: preset.startX,
        startY: preset.startY,
        goalX: preset.goalX,
        goalY: preset.goalY,
      },
    }));
  };

  const handleMazeCellClick = (rowIndex, colIndex) => {
    updateCurrentActivity((activity) => {
      const currentMaze = activity.maze || {};
      const currentGrid = Array.isArray(currentMaze.grid) ? currentMaze.grid : [];
      const nextGrid = currentGrid.map((row) => [...row]);

      if (!nextGrid[rowIndex] || typeof nextGrid[rowIndex][colIndex] === 'undefined') {
        return activity;
      }

      if (mazeDrawTool === 'wall') {
        nextGrid[rowIndex][colIndex] = 1;
        return {
          ...activity,
          maze: {
            ...currentMaze,
            grid: nextGrid,
          },
        };
      }

      nextGrid[rowIndex][colIndex] = 0;

      if (mazeDrawTool === 'path') {
        return {
          ...activity,
          maze: {
            ...currentMaze,
            grid: nextGrid,
          },
        };
      }

      if (mazeDrawTool === 'start') {
        return {
          ...activity,
          maze: {
            ...currentMaze,
            grid: nextGrid,
            startX: colIndex + 1,
            startY: rowIndex + 1,
          },
        };
      }

      if (mazeDrawTool === 'goal') {
        return {
          ...activity,
          maze: {
            ...currentMaze,
            grid: nextGrid,
            goalX: colIndex + 1,
            goalY: rowIndex + 1,
          },
        };
      }

      return activity;
    });
  };

  const addStep = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      steps: [
        ...(activity.steps || []),
        {
          id: `step_${Date.now()}`,
          image: '',
          labelAr: '',
          order: (activity.steps?.length || 0) + 1,
        },
      ],
    }));
  };

  const removeStep = (stepIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      steps: activity.steps
        .filter((_, index) => index !== stepIndex)
        .map((step, index) => ({ ...step, order: index + 1 })),
    }));
  };

  const validateBuilder = () => {
    if (!builderState.type) {
      return 'اختر نوع اللعبة أولًا.';
    }

    if (!builderState.nameAr.trim()) {
      return 'أدخل عنوان اللعبة بالعربية.';
    }

    if (!builderState.gameCode.trim()) {
      return 'أدخل كود اللعبة.';
    }

    const allActivities = builderState.config.levels.flatMap((level) => level.activities || []);
    if (!allActivities.length) {
      return 'أضف نشاطًا واحدًا على الأقل.';
    }

    for (const level of builderState.config.levels) {
      for (const activity of level.activities || []) {
        if (!activity.questionAr?.trim()) {
          return `أدخل نص السؤال في المستوى ${level.levelNumber}.`;
        }


        if (builderState.type === 'matching.similar') {
          if (!activity.heroImage?.trim()) {
            return `أضف الصورة الرئيسية في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).length < 2) {
            return `لعبة الصورة المطابقة تحتاج اختيارين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد إجابة صحيحة واحدة فقط في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim())) {
            return `كل اختيارات الصورة المطابقة تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'matching.find') {
          if ((activity.options || []).length < 2) {
            return `لعبة أوجد الصورة تحتاج صورتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد إجابة صحيحة واحدة فقط في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim())) {
            return `كل صور الاختيارات يجب أن تكون مرفوعة في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'matching.different') {
          if (!activity.heroImage?.trim()) {
            return `أضف الصورة الرئيسية في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).length < 2) {
            return `لعبة أوجد المختلف تحتاج صورتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد الصورة المختلفة بشكل صحيح في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim())) {
            return `كل صور أوجد المختلف يجب أن تكون مرفوعة في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'sequence.order') {
          if ((activity.steps || []).length < 2) {
            return `أضف خطوتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.steps || []).some((step) => !step.image?.trim())) {
            return `كل خطوات الترتيب تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'action.drag_to_target') {
          if (!activity.sceneImage?.trim()) {
            return `أضف صورة المشهد في المستوى ${level.levelNumber}.`;
          }
          if ((activity.draggables || []).length < 1) {
            return `أضف عنصرًا واحدًا على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.draggables || []).length > 3) {
            return `هذا النوع يدعم حتى 3 عناصر فقط في المستوى ${level.levelNumber}.`;
          }
          if ((activity.draggables || []).some((item) => !item.image?.trim())) {
            return `كل عناصر السحب تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
          if ((activity.draggables || []).filter((item) => item.isCorrect).length < 1) {
            return `حدد عنصرًا صحيحًا واحدًا على الأقل في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'navigation.move_to_target') {
          if (!activity.movable?.image?.trim()) {
            return `أضف صورة العنصر المتحرك في المستوى ${level.levelNumber}.`;
          }
          if (!activity.target?.image?.trim()) {
            return `أضف صورة الهدف في المستوى ${level.levelNumber}.`;
          }
          if (Number(activity.grid?.cols || 0) < 2 || Number(activity.grid?.rows || 0) < 2) {
            return `حدد Grid صالحًا في المستوى ${level.levelNumber}.`;
          }
          if (Number(activity.movable?.startX || 0) < 1 || Number(activity.movable?.startY || 0) < 1) {
            return `حدد نقطة بداية صحيحة في المستوى ${level.levelNumber}.`;
          }
          if (Number(activity.target?.x || 0) < 1 || Number(activity.target?.y || 0) < 1) {
            return `حدد موقع هدف صحيح في المستوى ${level.levelNumber}.`;
          }
        }

        if (builderState.type === 'navigation.maze') {
          if (!activity.maze?.playerImage?.trim()) {
            return `أضف صورة اللاعب في المستوى ${level.levelNumber}.`;
          }
          if (!activity.maze?.goalImage?.trim()) {
            return `أضف صورة الهدف في المستوى ${level.levelNumber}.`;
          }
          if (!Array.isArray(activity.maze?.grid) || activity.maze.grid.length < 3) {
            return `أدخل شبكة متاهة صحيحة في المستوى ${level.levelNumber}.`;
          }
        }
          if (
            builderState.type === 'navigation.move_to_target' &&
            Number(activity.movable?.startX || 0) > Number(activity.grid?.cols || 0)
          ) {
            return `Start position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            builderState.type === 'navigation.move_to_target' &&
            Number(activity.movable?.startY || 0) > Number(activity.grid?.rows || 0)
          ) {
            return `Start position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            builderState.type === 'navigation.move_to_target' &&
            Number(activity.target?.x || 0) > Number(activity.grid?.cols || 0)
          ) {
            return `Target position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            builderState.type === 'navigation.move_to_target' &&
            Number(activity.target?.y || 0) > Number(activity.grid?.rows || 0)
          ) {
            return `Target position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            builderState.type === 'navigation.move_to_target' &&
            Number(activity.target?.radius || 0) < 1
          ) {
            return `Radius لازم تكون 1 أو أكثر في المستوى ${level.levelNumber}.`;
          }
      }
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateBuilder();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setSaving(true);

    const payload = {
      gameCode: builderState.gameCode.trim(),
      name: builderState.name.trim() || builderState.nameAr.trim(),
      nameAr: builderState.nameAr.trim(),
      type: builderState.type,
      level: 1,
      isActive: builderState.isActive,
      config: {
        ...builderState.config,
        name: builderState.name.trim() || builderState.nameAr.trim(),
        nameAr: builderState.nameAr.trim(),
        templateType: builderState.type,
      },
    };

    try {
      if (isEdit) {
        await gameService.updateGame(adminSession?.token, gameId, payload);
      } else {
        await gameService.createGame(adminSession?.token, payload);
      }

      navigate('/admin/games');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'تعذر حفظ اللعبة.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-bold">جارٍ تحميل بيانات اللعبة...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => navigate('/admin/games')} className="!py-2 !text-sm">
          <ArrowRight size={20} />
          <span>رجوع</span>
        </Button>

        <h2 className="text-3xl font-black text-slate-900">
          {isEdit ? 'تعديل قالب اللعبة' : 'إنشاء قالب لعبة جديد'}
        </h2>

        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8 rounded-[2rem] space-y-6">
          <SectionTitle>1. اختيار نوع اللعبة</SectionTitle>

          <div className="flex flex-col gap-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-[2]">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن اسم لعبة أو وصف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                />
              </div>
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className="w-full px-4 py-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 h-full"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-slate-400" />
                    <span>الفلاتر {activeTags.length > 0 ? `(${activeTags.length})` : ''}</span>
                  </div>
                  <Check size={16} className={`text-blue-600 transition-opacity ${activeTags.length > 0 ? 'opacity-100' : 'opacity-0'}`} />
                </button>
                
                {filterMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-64 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2 px-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-400">اختر الفلاتر</span>
                      {activeTags.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => { setActiveTags([]); setFilterMenuOpen(false); }}
                          className="text-xs text-red-500 hover:text-red-700 font-bold"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {allAvailableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTags.includes(tag) 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex-1 text-right">{tag}</div>
                          {activeTags.includes(tag) && <Check size={16} className="text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Denser Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCards.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 font-bold">لا توجد ألعاب تطابق بحثك</div>
              )}
              {filteredCards.map((typeCard) => (
                <div key={typeCard.value} className="relative group">
                  <button
                    type="button"
                    onClick={() => updateType(typeCard.value)}
                    className={`w-full h-full rounded-[1.5rem] border-2 p-4 text-right transition-all flex flex-col items-start ${
                      builderState.type === typeCard.value
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                        : 'border-[#dbe7f3] bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-[0.8rem] bg-gradient-to-br ${typeCard.accent} mb-3 flex items-center justify-center border border-[#b8deec] shadow-sm shrink-0 ${
                        builderState.type === typeCard.value ? 'ring-2 ring-[#d7ecf7] shadow-md' : ''
                      }`}
                    >
                      <ImagePlus size={18} className="text-slate-700" />
                    </div>
                    <div className="text-base font-black text-slate-900 mb-1 leading-tight">{typeCard.title}</div>
                    <div className="text-xs leading-5 text-slate-500 opacity-80 group-hover:opacity-100 transition-opacity">{typeCard.description}</div>
                  </button>

                  {/* 3 dots menu for tags */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setTagMenuOpen(tagMenuOpen === typeCard.value ? null : typeCard.value); }}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {tagMenuOpen === typeCard.value && (
                      <div className="absolute top-[110%] left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-[60]">
                        <div className="text-xs font-bold text-slate-400 mb-2 px-1">تصنيفات اللعبة</div>
                        <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                          {allAvailableTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleToggleTag(typeCard.value, tag); }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 text-right"
                            >
                              <span className="text-slate-700">{tag}</span>
                              {customTags[typeCard.value]?.includes(tag) && <Check size={14} className="text-blue-600" />}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1 border-t border-slate-100 pt-2">
                          <input 
                            type="text" 
                            placeholder="جديد..." 
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); handleAddNewTag(typeCard.value); } }}
                            className="w-full px-2 py-1 rounded text-xs border border-slate-200 outline-none focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAddNewTag(typeCard.value); }}
                            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 font-bold mb-2">عنوان اللعبة بالعربية</label>
              <input
                type="text"
                value={builderState.nameAr}
                onChange={(event) =>
                  setBuilderState((current) => ({
                    ...current,
                    nameAr: event.target.value,
                    name: event.target.value,
                    config: {
                      ...current.config,
                      nameAr: event.target.value,
                      name: event.target.value,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="مثال: الصورة المطابقة"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-2">كود اللعبة</label>
              <input
                type="text"
                dir="ltr"
                value={builderState.gameCode}
                onChange={(event) =>
                  setBuilderState((current) => ({
                    ...current,
                    gameCode: event.target.value.toUpperCase(),
                  }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="MAT-SIM-001"
              />
            </div>

            <div className="hidden">
              <label className="block text-slate-700 font-bold mb-2">اسم داخلي اختياري</label>
              <input
                type="text"
                dir="ltr"
                value={builderState.name}
                onChange={(event) =>
                  setBuilderState((current) => ({
                    ...current,
                    name: event.target.value,
                    config: { ...current.config, name: event.target.value },
                  }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                placeholder="matching template"
              />
            </div>
          </div>

          <div className="space-y-6">
            <FileUploadField
              label="الفيديو التمهيدي"
              value={builderState.config.media?.introVideo || ''}
              onUploaded={(value) =>
                updateConfig((current) => ({
                  ...current,
                  media: { ...current.media, introVideo: value },
                }))
              }
              uploadAsset={uploadAsset}
              accept="video/*"
              previewType="video"
              placeholder="مثال: intro-video.mp4"
            />

            <div className="grid lg:grid-cols-2 gap-6">
              <SoundPresetField
                label="صوت النجاح"
                value={builderState.config.media?.successSound || ''}
                options={SOUND_PRESET_OPTIONS.success}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    media: { ...current.media, successSound: value },
                  }))
                }
              />

              <SoundPresetField
                label="صوت الخطأ"
                value={builderState.config.media?.failSound || ''}
                options={SOUND_PRESET_OPTIONS.fail}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    media: { ...current.media, failSound: value },
                  }))
                }
              />
            </div>
          </div>
        </Card>

        {builderState.type && (
          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            <Card className="p-8 rounded-[2rem] space-y-6">
              <SectionTitle>2. المستويات والأنشطة</SectionTitle>

              <div className="flex flex-wrap gap-3">
                {levels.map((level, index) => (
                  <button
                    key={level.levelNumber}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(index);
                      setSelectedActivity(0);
                    }}
                    className={`rounded-[1.4rem] px-5 py-3 font-black border transition-all ${
                      selectedLevel === index
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-[#dbe7f3]'
                    }`}
                  >
                    Level {level.levelNumber}
                  </button>
                ))}
              </div>

              <div className="rounded-[1.8rem] border border-[#dbe7f3] p-5 bg-[#f8fbff] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-900">أنشطة المستوى {currentLevel?.levelNumber}</div>
                    <div className="text-sm text-slate-500">يمكنك إضافة عدة Activities داخل كل مستوى.</div>
                  </div>

                  <Button type="button" variant="outline" onClick={addActivity} className="!py-2 !px-4">
                    <Plus size={18} />
                    <span>إضافة نشاط</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {currentActivities.map((activity, index) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelectedActivity(index)}
                      className={`rounded-[1.3rem] border px-4 py-3 text-right transition-all ${
                        selectedActivity === index
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-black">{getActivityAutoTitle(index)}</div>
                      <div className="text-xs mt-1">{getActivitySummary(activity, index)}</div>
                    </button>
                  ))}
                </div>

                {!currentActivities.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-slate-500">
                    لا يوجد Activities في هذا المستوى حتى الآن.
                  </div>
                )}
              </div>

              {currentActivity && (
                <div className="space-y-6">
                  <SectionTitle
                    action={
                      currentActivities.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => removeActivity(selectedActivity)}
                          className="inline-flex items-center gap-2 text-red-600 font-bold"
                        >
                          <Trash2 size={18} />
                          <span>حذف النشاط</span>
                        </button>
                      ) : null
                    }
                  >
                    3. فورم النشاط
                  </SectionTitle>

                  {/* 1. إعدادات النشاط */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                      <Settings size={22} />
                      <h3 className="text-lg font-black">إعدادات النشاط</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">عنوان النشاط</label>
                        <input
                          type="text"
                          value={currentActivity.titleAr || ''}
                          onChange={(event) => setActivityField('titleAr', event.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none placeholder:text-slate-400"
                          placeholder={getActivityAutoTitle(selectedActivity)}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">الصعوبة</label>
                        <select
                          value={currentActivity.difficulty || 'easy'}
                          onChange={(event) => setActivityField('difficulty', event.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                        >
                          <option value="easy">سهل</option>
                          <option value="medium">متوسط</option>
                          <option value="hard">صعب</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. السؤال والتعليمات */}
                  <div className="bg-blue-50/50 border border-blue-200 rounded-[2rem] p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2 text-blue-700">
                      <HelpCircle size={22} />
                      <h3 className="text-lg font-black">السؤال والتعليمات</h3>
                    </div>

                    <div>
                      <label className="block text-blue-900 font-bold mb-2">نص السؤال أو التعليمات</label>
                      <textarea
                        rows={3}
                        value={currentActivity.questionAr || ''}
                        onChange={(event) => setActivityField('questionAr', event.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none placeholder:text-slate-400"
                        placeholder="مثال: اختر الصورة المطابقة"
                      />
                    </div>

                    <FileUploadField
                      label="صوت السؤال أو التعليمات"
                      value={currentActivity.instructionAudio || ''}
                      onUploaded={(value) => setActivityField('instructionAudio', value)}
                      uploadAsset={uploadAsset}
                      accept="audio/*"
                      previewType="audio"
                    />

                    {builderState.type === 'matching.similar' && (
                      <div className="pt-2">
                        <ImageAssetField
                          label="الصورة الرئيسية الكبيرة"
                          value={currentActivity.heroImage || ''}
                          onSelect={(value) => setActivityField('heroImage', value)}
                          token={adminSession?.token}
                          initialQuery="child object flashcard"
                        />
                      </div>
                    )}

                    {builderState.type === 'matching.different' && (
                      <div className="pt-2">
                        <ImageAssetField
                          label="الصورة الرئيسية في السؤال"
                          value={currentActivity.heroImage || ''}
                          onSelect={(value) => setActivityField('heroImage', value)}
                          token={adminSession?.token}
                          initialQuery="single object white background"
                        />
                      </div>
                    )}

                  </div>

                  {/* 3. الإجابات والاختيارات */}
                  {builderState.type === 'matching.similar' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الإجابات والاختيارات</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>إضافة اختيار</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        الطفل سيرى الصورة الرئيسية أولًا، ثم يختار من الاختيارات أيهما مطابق لها.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">اختيار {optionIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeOption(optionIndex)}
                                disabled={(currentActivity.options || []).length <= 2}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.options || []).length <= 2
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title={(currentActivity.options || []).length <= 2 ? 'لا يمكن الحذف: الحد الأدنى اختياران' : 'حذف الاختيار'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={option.textAr || ''}
                              onChange={(event) => updateOption(optionIndex, 'textAr', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              placeholder="اسم الاختيار بالعربية"
                            />

                            <ImageAssetField
                              label="صورة الاختيار"
                              value={option.image || ''}
                              onSelect={(value) => updateOption(optionIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={option.textAr || 'child object flashcard'}
                            />

                            <label className="flex items-center gap-2 font-bold text-emerald-800">
                              <input
                                type="radio"
                                checked={Boolean(option.isCorrect)}
                                onChange={() => selectCorrectOption(optionIndex)}
                              />
                              <span>هذه هي الإجابة الصحيحة</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                  {builderState.type === 'cards.audio_flashcards' && (
                    <div className="bg-fuchsia-50/40 border border-fuchsia-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-fuchsia-700">
                          <ImagePlus size={24} />
                          <h3 className="text-xl font-black">الكروت الصوتية</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addCard} className="!py-2 !px-4 !border-fuchsia-200 !text-fuchsia-700 hover:!bg-fuchsia-100">
                          <Plus size={18} />
                          <span>إضافة كارت</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        قم بإضافة الصورة، الكلمة، وملف النطق الصوتي الذي سيعمل عند قلب الكارت.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.cards || []).map((card, cardIndex) => (
                          <div key={card.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">كارت {cardIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeCard(cardIndex)}
                                disabled={(currentActivity.cards || []).length <= 1}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.cards || []).length <= 1
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title={(currentActivity.cards || []).length <= 1 ? 'يجب أن يكون هناك كارت واحد على الأقل' : 'حذف الكارت'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={card.textAr || ''}
                              onChange={(event) => updateCard(cardIndex, 'textAr', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              placeholder="الكلمة (مثال: تفاحة)"
                            />

                            <ImageAssetField
                              label="صورة الكارت"
                              value={card.image || ''}
                              onSelect={(value) => updateCard(cardIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={card.textAr || 'flashcard'}
                            />

                            <FileUploadField
                              label="الملف الصوتي للكلمة"
                              value={card.audioUrl || ''}
                              onUploaded={(value) => updateCard(cardIndex, 'audioUrl', value)}
                              uploadAsset={uploadAsset}
                              accept="audio/*"
                              previewType="audio"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.type === 'puzzle.jigsaw' && (
                    <div className="bg-blue-50/40 border border-blue-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <ImagePlus size={24} />
                          <h3 className="text-xl font-black">إعدادات البازل</h3>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        قم برفع الصورة التي سيقوم الطفل بتركيبها، وحدد مستوى الصعوبة (عدد القطع).
                      </div>

                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                        <ImageAssetField
                          label="صورة البازل"
                          value={currentActivity.image || ''}
                          onSelect={(value) => setActivityField('image', value)}
                          token={adminSession?.token}
                          initialQuery="puzzle image"
                        />

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">مستوى الصعوبة (عدد القطع)</label>
                          <div className="grid grid-cols-3 gap-3">
                            {[2, 3, 4].map((size) => (
                              <button
                                type="button"
                                key={size} 
                                onClick={() => setActivityField('gridSize', size)}
                                className={`py-3 rounded-xl border-2 font-bold transition-all ${currentActivity.gridSize === size ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500'}`}
                              >
                                {size}x{size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {builderState.type === 'matching.find' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الإجابات والاختيارات</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>إضافة صورة</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-fuchsia-50/80 border border-fuchsia-100/80 px-4 py-3 text-sm font-bold text-fuchsia-700/90">
                        الطفل يسمع أو يقرأ التعليمات مثل: أوجد القطة، ثم يختار الصورة الصحيحة من بين 2 أو 3 أو 4 أو 6 صور.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">صورة {optionIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeOption(optionIndex)}
                                disabled={(currentActivity.options || []).length <= 2}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.options || []).length <= 2
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title={(currentActivity.options || []).length <= 2 ? 'لا يمكن الحذف: الحد الأدنى صورتان' : 'حذف الصورة'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={option.textAr || ''}
                              onChange={(event) => updateOption(optionIndex, 'textAr', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              placeholder="اسم الصورة اختياري"
                            />

                            <ImageAssetField
                              label="صورة الاختيار"
                              value={option.image || ''}
                              onSelect={(value) => updateOption(optionIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={option.textAr || 'cat isolated white background'}
                            />

                            <label className="flex items-center gap-2 font-bold text-emerald-800">
                              <input
                                type="radio"
                                checked={Boolean(option.isCorrect)}
                                onChange={() => selectCorrectOption(optionIndex)}
                              />
                              <span>هذه هي الصورة المطلوبة</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.type === 'matching.different' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الإجابات والاختيارات</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>إضافة صورة</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        الطفل سيرى الصورة الرئيسية أولًا، ثم يختار من الصور أيها المختلفة عنها. مثال مناسب: قطة كبيرة في الوسط، وتحتها قطة وكلب ليختار الطفل الكلب لأنه المختلف.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">صورة {optionIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeOption(optionIndex)}
                                disabled={(currentActivity.options || []).length <= 2}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.options || []).length <= 2
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title={(currentActivity.options || []).length <= 2 ? 'لا يمكن الحذف: الحد الأدنى صورتان' : 'حذف الصورة'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={option.textAr || ''}
                              onChange={(event) => updateOption(optionIndex, 'textAr', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              placeholder="وصف اختياري"
                            />

                            <ImageAssetField
                              label="صورة الاختيار"
                              value={option.image || ''}
                              onSelect={(value) => updateOption(optionIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={option.textAr || 'single object white background'}
                            />

                            <label className="flex items-center gap-2 font-bold text-emerald-800">
                              <input
                                type="radio"
                                checked={Boolean(option.isCorrect)}
                                onChange={() => selectCorrectOption(optionIndex)}
                              />
                              <span>هذه هي الصورة المختلفة</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.type === 'text.missing_word' && (
                    <div className="space-y-6">
                      {/* Section 1: Missing Word Input */}
                      <div className="bg-[#f0fdf4] border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                        <div className="flex items-center gap-2 text-emerald-700 mb-4">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الكلمة أو الجملة الناقصة</h3>
                        </div>

                        <div className="rounded-2xl bg-[#fff7ed] border border-orange-100 px-4 py-3 text-sm font-bold text-orange-700 text-center">
                          اكتب الكلمة وضع علامة (_) مكان الحرف أو الكلمة الناقصة.
                        </div>

                        <div className="space-y-2 text-sm font-semibold text-slate-700">
                          <input
                            type="text"
                            value={currentActivity.wordWithBlank || ''}
                            onChange={(event) => setActivityField('wordWithBlank', event.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-right text-lg"
                            placeholder="مثال: الولد يلعب بالـ _"
                          />
                        </div>
                      </div>

                      {/* Section 2: Options */}
                      <div className="bg-[#f0fdf4] border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 size={24} />
                            <h3 className="text-xl font-black">الاختيارات</h3>
                          </div>
                          <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !rounded-full !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                            <Plus size={18} />
                            <span>إضافة اختيار</span>
                          </Button>
                        </div>

                        <div className="rounded-2xl bg-[#fff7ed] border border-orange-100 px-4 py-3 text-sm font-bold text-orange-700 text-center">
                          اكتب الحروف أو الكلمات التي سيختار منها الطفل لتكملة الكلمة الناقصة.
                        </div>

                        <div className="space-y-4">
                          {(currentActivity.options || []).map((option, optionIndex) => (
                            <div key={option.id} className="rounded-3xl border border-[#e2e8f0] bg-white p-3 flex items-center gap-4">
                              <input
                                type="text"
                                value={option.textAr || ''}
                                onChange={(event) => updateOption(optionIndex, 'textAr', event.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-center font-bold text-xl hover:border-slate-300 transition-colors"
                                placeholder="حرف / كلمة الإجابة"
                              />

                              <label className="flex items-center gap-3 font-bold text-emerald-800 shrink-0 cursor-pointer px-2">
                                <input
                                  type="radio"
                                  checked={Boolean(option.isCorrect)}
                                  onChange={() => selectCorrectOption(optionIndex)}
                                  className="w-5 h-5 accent-emerald-600"
                                />
                                <span>إجابة صحيحة</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => removeOption(optionIndex)}
                                className="text-slate-400 p-3 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 bg-slate-50 shrink-0"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {builderState.type === 'action.drag_to_target' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">عناصر السحب والإسقاط</h3>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addDraggable}
                          className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100"
                        >
                          <Plus size={18} />
                          <span>إضافة عنصر</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        المشهد كله هو منطقة الإسقاط. حدّد فقط العنصر الصحيح أو العناصر الصحيحة.
                      </div>

                      <ImageAssetField
                        label="صورة المشهد الثابت"
                        value={currentActivity.sceneImage || ''}
                        onSelect={(value) => setActivityField('sceneImage', value)}
                        token={adminSession?.token}
                        initialQuery="children room scene"
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="hidden">
                        <ImageAssetField
                          label="صورة المشهد الثابت"
                          value={currentActivity.sceneImage || ''}
                          onSelect={(value) => setActivityField('sceneImage', value)}
                          token={adminSession?.token}
                          initialQuery="children room scene"
                        />
                        </div>

                        <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-2">نمط اللعبة</label>
                            <select
                              value={currentActivity.mode || 'one-to-one'}
                              onChange={(event) => setActivityField('mode', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                            >
                              <option value="one-to-one">عنصر واحد صحيح</option>
                              <option value="one-of-many">اختيار الصحيح من عدة عناصر</option>
                              <option value="multi-match">أكثر من عنصر صحيح</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.draggables || []).map((item, itemIndex) => (
                          <div key={item.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">عنصر {itemIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeDraggable(itemIndex)}
                                disabled={(currentActivity.draggables || []).length <= 1}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.draggables || []).length <= 1
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={item.labelAr || ''}
                                onChange={(event) => updateDraggable(itemIndex, 'labelAr', event.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                placeholder="اسم العنصر بالعربية"
                              />

                              <select
                                value={item.startPosition || 'bottom'}
                                onChange={(event) => updateDraggable(itemIndex, 'startPosition', event.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                              >
                                <option value="left">الجانب الأيسر</option>
                                <option value="right">الجانب الأيمن</option>
                                <option value="bottom">الأسفل</option>
                              </select>
                            </div>

                            <ImageAssetField
                              label="صورة العنصر"
                              value={item.image || ''}
                              onSelect={(value) => updateDraggable(itemIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={item.labelAr || 'single object white background'}
                            />

                            <label className="flex items-center gap-2 font-bold text-emerald-800">
                              <input
                                type={currentActivity.mode === 'multi-match' ? 'checkbox' : 'radio'}
                                name={`drag-correct-${selectedLevel}-${selectedActivity}`}
                                checked={Boolean(item.isCorrect)}
                                onChange={(event) => {
                                  if (currentActivity.mode === 'multi-match') {
                                    updateDraggable(itemIndex, 'isCorrect', event.target.checked);
                                    return;
                                  }

                                  updateCurrentActivity((activity) => ({
                                    ...activity,
                                    draggables: (activity.draggables || []).map((dragItem, index) => ({
                                      ...dragItem,
                                      isCorrect: index === itemIndex,
                                    })),
                                  }));
                                }}
                              />
                              <span>هذا هو العنصر الصحيح</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.type === 'navigation.move_to_target' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center gap-2 mb-4 text-emerald-700">
                        <CheckCircle2 size={24} />
                        <h3 className="text-xl font-black">إعدادات الخريطة والاتجاهات</h3>
                      </div>

                      <div className="rounded-2xl bg-sky-50/80 border border-sky-100/80 px-4 py-3 text-sm font-bold text-sky-700/90">
                        الطفل سيحرك العنصر خطوة بخطوة باستخدام أزرار الاتجاهات حتى يصل إلى الهدف.
                      </div>

                      <ImageAssetField
                        label="صورة المشهد"
                        value={currentActivity.sceneImage || ''}
                        onSelect={(value) => setActivityField('sceneImage', value)}
                        token={adminSession?.token}
                        initialQuery="grid map children scene"
                      />

                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-5">
                        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-5 items-start">
                          <div className="space-y-2">
                            <label className="block text-slate-700 font-bold">طريقة اللعب</label>
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 font-black text-sky-700 text-center">
                              أزرار الاتجاهات
                            </div>
                            <p className="text-sm text-slate-500">الطفل يتحرك خطوة واحدة مع كل ضغطة زر.</p>
                          </div>

                          <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
                              <label className="block text-slate-700 font-bold">عرض المسار</label>
                              <p className="text-xs text-slate-500">عدد الخانات أفقيًا</p>
                              <input
                                type="number"
                                min={2}
                                value={currentActivity.grid?.cols ?? 8}
                                onChange={(event) => updateNavigationField('grid', 'cols', Number(event.target.value))}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              />
                            </div>

                            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
                              <label className="block text-slate-700 font-bold">ارتفاع المسار</label>
                              <p className="text-xs text-slate-500">عدد الخانات رأسيًا</p>
                              <input
                                type="number"
                                min={2}
                                value={currentActivity.grid?.rows ?? 6}
                                onChange={(event) => updateNavigationField('grid', 'rows', Number(event.target.value))}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              />
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-3">
                        <SectionTitle>أصوات الحركة</SectionTitle>
                        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4 text-sm font-bold text-slate-600">
                          النظام يشغل تلقائيًا صوت حركة خفيف مع كل ضغطة وصوت تنبيه عند الاصطدام بالحدود.
                        </div>
                      </div>

                      <SectionTitle>العنصر المتحرك</SectionTitle>
                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-5">
                        <ImageAssetField
                          label="صورة العنصر المتحرك"
                          value={currentActivity.movable?.image || ''}
                          onSelect={(value) => updateNavigationField('movable', 'image', value)}
                          token={adminSession?.token}
                          initialQuery="cartoon child character isolated white background"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-2">بداية العنصر أفقيًا</label>
                            <input
                              type="number"
                              min={1}
                              value={currentActivity.movable?.startX ?? 1}
                              onChange={(event) => updateNavigationField('movable', 'startX', Number(event.target.value))}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-2">بداية العنصر رأسيًا</label>
                            <input
                              type="number"
                              min={1}
                              value={currentActivity.movable?.startY ?? 1}
                              onChange={(event) => updateNavigationField('movable', 'startY', Number(event.target.value))}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <SectionTitle>الهدف</SectionTitle>
                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-5">
                        <ImageAssetField
                          label="صورة الهدف"
                          value={currentActivity.target?.image || ''}
                          onSelect={(value) => updateNavigationField('target', 'image', value)}
                          token={adminSession?.token}
                          initialQuery="single object white background"
                        />

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-2">موضع الهدف أفقيًا</label>
                            <input
                              type="number"
                              min={1}
                              value={currentActivity.target?.x ?? 5}
                              onChange={(event) => updateNavigationField('target', 'x', Number(event.target.value))}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-2">موضع الهدف رأسيًا</label>
                            <input
                              type="number"
                              min={1}
                              value={currentActivity.target?.y ?? 3}
                              onChange={(event) => updateNavigationField('target', 'y', Number(event.target.value))}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-2">نطاق الوصول</label>
                            <input
                              type="number"
                              min={1}
                              value={currentActivity.target?.radius ?? 1}
                              onChange={(event) => updateNavigationField('target', 'radius', Number(event.target.value))}
                              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {builderState.type === 'navigation.maze' && (
                    <div className="space-y-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">إعدادات لعبة المتاهة</h3>
                          <p className="text-sm text-slate-500">
                            اختر الصور وحدد شكل المتاهة ونقطة البداية والنهاية.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(MAZE_PRESETS).map((presetKey) => (
                            <button
                              key={presetKey}
                              type="button"
                              onClick={() => applyMazePreset(presetKey)}
                              className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                            >
                              {presetKey === 'easy' ? 'سهل' : presetKey === 'medium' ? 'متوسط' : 'صعب'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>صورة اللاعب</span>
                          <ImageAssetField
                            label="صورة اللاعب"
                            value={currentActivity.maze?.playerImage || ''}
                            onSelect={(value) => updateMazeField('playerImage', value)}
                            token={adminSession?.token}
                            initialQuery="cartoon child character white background"
                          />
                        </div>

                        <div className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>صورة الهدف</span>
                          <ImageAssetField
                            label="صورة الهدف"
                            value={currentActivity.maze?.goalImage || ''}
                            onSelect={(value) => updateMazeField('goalImage', value)}
                            token={adminSession?.token}
                            initialQuery="goal star treasure white background"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-700">شبكة المتاهة</span>
                          <div className="flex flex-wrap gap-2">
                            {MAZE_DRAW_TOOLS.map((tool) => (
                              <button
                                key={tool.value}
                                type="button"
                                onClick={() => setMazeDrawTool(tool.value)}
                                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                                  mazeDrawTool === tool.value
                                    ? 'border-sky-500 bg-sky-500 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                                }`}
                              >
                                {tool.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm" dir="ltr">
                          <div
                            className="mx-auto grid w-fit gap-1"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(...(currentActivity.maze?.grid || []).map((row) => row.length), 1)}, minmax(0, 1fr))`,
                            }}
                          >
                            {(currentActivity.maze?.grid || []).map((row, rowIndex) =>
                              row.map((cell, colIndex) => {
                                const isWall = Number(cell) === 1;
                                const isStart =
                                  Number(currentActivity.maze?.startX || 1) === colIndex + 1 &&
                                  Number(currentActivity.maze?.startY || 1) === rowIndex + 1;
                                const isGoal =
                                  Number(currentActivity.maze?.goalX || 1) === colIndex + 1 &&
                                  Number(currentActivity.maze?.goalY || 1) === rowIndex + 1;

                                return (
                                  <button
                                    key={`${rowIndex}-${colIndex}`}
                                    type="button"
                                    onClick={() => handleMazeCellClick(rowIndex, colIndex)}
                                    className={`relative w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border transition shrink-0 ${
                                      isWall
                                        ? 'border-slate-700 bg-slate-800'
                                        : 'border-slate-200 bg-slate-50 hover:bg-sky-50'
                                    }`}
                                    title={`(${colIndex + 1}, ${rowIndex + 1})`}
                                  >
                                    {isStart && (
                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-sky-700">
                                        S
                                      </span>
                                    )}
                                    {isGoal && (
                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-emerald-700">
                                        G
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" dir="ltr">
                            البداية: ({currentActivity.maze?.startX ?? 1}, {currentActivity.maze?.startY ?? 1})
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" dir="ltr">
                            الهدف: ({currentActivity.maze?.goalX ?? 5}, {currentActivity.maze?.goalY ?? 5})
                          </div>
                        </div>

                        <p className="text-xs font-normal text-slate-500">
                          اختر نوع الخانة من الأعلى، ثم اضغط على المربعات لتحديد الجدار أو المسار أو نقطة البداية أو الهدف.
                        </p>
                      </div>
                    </div>
                  )}

                  {builderState.type === 'sequence.order' && (
                    <div className="space-y-6">
                      <SectionTitle
                        action={
                          <Button type="button" variant="outline" onClick={addStep} className="!py-2 !px-4">
                            <Plus size={18} />
                            <span>إضافة خطوة</span>
                          </Button>
                        }
                      >
                        خطوات الترتيب
                      </SectionTitle>

                      <div className="grid gap-4">
                        {(currentActivity.steps || []).map((step, stepIndex) => (
                          <div key={step.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">خطوة {stepIndex + 1}</h4>
                              {(currentActivity.steps || []).length > 2 && (
                                <button type="button" onClick={() => removeStep(stepIndex)} className="text-red-500">
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={step.labelAr || ''}
                                onChange={(event) => updateStep(stepIndex, 'labelAr', event.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                placeholder="وصف اختياري"
                              />

                              <input
                                type="number"
                                min={1}
                                value={step.order || stepIndex + 1}
                                onChange={(event) => updateStep(stepIndex, 'order', Number(event.target.value))}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                placeholder="الترتيب"
                              />
                            </div>

                            <ImageAssetField
                              label="صورة الخطوة"
                              value={step.image || ''}
                              onSelect={(value) => updateStep(stepIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={step.labelAr || 'single step object white background'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-8 rounded-[2rem] space-y-6 sticky top-6">
              <SectionTitle
                action={
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-blue-700 font-bold">
                    <Volume2 size={16} />
                    <span>Live Preview</span>
                  </div>
                }
              >
                4. معاينة مباشرة
              </SectionTitle>

              {previewGame ? (
                <div className="rounded-[2rem] border border-[#dbe7f3] bg-[#f8fbff] p-4">
                  {renderGameActivity({
                    game: previewGame,
                    onComplete: () => {},
                    previewMode: true,
                  })}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
                  اختر نوع اللعبة ثم أضف Activity لعرض المعاينة هنا.
                </div>
              )}
            </Card>
          </div>
        )}

        {formError && (
          <div className="rounded-3xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
            {formError}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="primary" type="submit" disabled={saving} className="!py-3 !px-8">
            {saving ? <LoaderCircle size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{saving ? 'جارٍ الحفظ...' : 'حفظ القالب'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GameForm;
