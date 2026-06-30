import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import CustomSelect from '../../components/CustomSelect';
import ImageAssetField from '../../components/ImageAssetField';
import fingerPointerImage from '../../assets/touch-finger-pointer.png';
import openHandImage from '../../assets/touch-open-hand.png';
import { gameService } from '../../services/gameService';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { SOUND_PRESET_OPTIONS, isPlayableMediaUrl, playAudioUrl } from '../../utils/soundEffects';
import {
  buildActivityRuntimeGame,
  createEmptyBuilderConfig,
  getDefaultActivityForType,
  normalizeActivityTypesForConfig,
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
    value: 'matching.shadow',
    title: 'بازل الظل',
    description: 'ظل كبير وصور اختيارات، الطفل يختار الصورة المطابقة للظل. يمكن رفع ظل جاهز أو استخدام صورة الإجابة الصحيحة كظل تلقائي.',
    accent: 'from-sky-100 to-teal-100',
  },
  {
    value: 'emotion.faces',
    title: 'لعبة المشاعر',
    description: 'تعرض وجوهًا مثل سعيد وحزين وغاضب ونعسان، ويختار الطفل الوجه المطلوب.',
    accent: 'from-amber-100 to-pink-100',
  },
  {
    value: 'picture.reveal',
    title: 'اكشف الصورة',
    description: 'صورة مخفية تحت مربعات. يضغط الطفل على المربعات لكشف أجزاء من الصورة ثم يختار الإجابة الصحيحة.',
    accent: 'from-emerald-100 to-cyan-100',
  },
  {
    value: 'image.complete_part',
    title: 'كمل الجزء الناقص',
    description: 'ترفع صورة وتحدد من الشبكة الجزء أو الجزئين الناقصين، والطفل يختار القطعة الصحيحة لإكمال الصورة.',
    accent: 'from-orange-100 to-amber-100',
  },
  {
    value: 'sequence.order',
    title: 'ترتيب الصور',
    description: 'صور خطوات يعيد الطفل ترتيبها بالسحب.',
    accent: 'from-emerald-100 to-lime-100',
  },
  {
    value: 'commands.multi_step',
    title: 'تنفيذ الأوامر المركبة',
    description: 'يعرض عناصر داخل كروت، والطفل يضغط عليها بالترتيب الصحيح لتنفيذ أمر من خطوة أو أكثر.',
    accent: 'from-cyan-100 to-emerald-100',
  },
  {
    value: 'action.drag_to_target',
    title: 'السحب والإفلات',
    description: 'مشهد ثابت في المنتصف والعناصر تُسحب إلى المكان الصحيح داخل الصورة.',
    accent: 'from-rose-100 to-orange-100',
  },
  {
    value: 'touch.hand',
    title: 'المس باليد',
    description: 'تظهر يد كرتونية في أسفل الشاشة، ويسحبها الطفل حتى تلمس الصورة المطلوبة بدل الضغط المباشر على الإجابة.',
    accent: 'from-amber-100 to-cyan-100',
  },  
  {
    value: 'motor.shake_image',
    title: '\u0647\u0632 \u0627\u0644\u0635\u0648\u0631\u0629',
    description: '\u0635\u0648\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u064a\u0645\u0633\u0643\u0647\u0627 \u0627\u0644\u0637\u0641\u0644 \u0648\u064a\u0647\u0632\u0647\u0627 \u064a\u0645\u064a\u0646 \u0648\u0634\u0645\u0627\u0644 \u062d\u062a\u0649 \u062a\u062a\u062d\u0633\u0628 \u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629.',
    accent: 'from-lime-100 to-cyan-100',
  },  {
    value: 'spatial.concepts',
    title: 'المفاهيم المكانية',
    description: 'صورة تفاعلية لتعليم فوق/تحت، داخل/خارج، أمام/خلف، يمين/يسار، قريب/بعيد مع اختيار أو سحب وإفلات.',
    accent: 'from-cyan-100 to-emerald-100',
  },  {
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
    value: 'cards.audio_flashcards',
    title: 'الكروت الصوتية',
    description: 'كروت تعليمية بالصور والكلمات لتشغيل النطق التلقائي عند الضغط عليها.',
    accent: 'from-fuchsia-100 to-purple-100',
  },
  {
    value: 'memory.cards',
    title: 'لعبة الذاكرة',
    description: 'كروت مقلوبة يظهر كل عنصر مرتين. يتذكر الطفل أماكن الصور ويطابق الأزواج مع نطق اسم كل عنصر.',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    value: 'memory.grid',
    title: 'شبكة الذاكرة',
    description: 'يعرض شبكة صور لثوان قليلة، ثم تختفي الصور ويطلب من الطفل إيجاد صورة محددة من الذاكرة.',
    accent: 'from-cyan-100 to-emerald-100',
  },
  {
    value: 'puzzle.jigsaw',
    title: 'لعبة البازل',
    description: 'يقوم الطفل بتركيب أجزاء الصورة لإكمال الشكل النهائي، لتنمية مهارات التركيز وحل المشكلات.',
    accent: 'from-blue-100 to-indigo-100',
  },
  {
    value: 'matching.connect',
    title: 'لعبة التوصيل',
    description: 'رسم خطوط بين عناصر متطابقة أو مرتبطة (مثل الحيوان وطعامه، أو الكلمة والصورة).',
    accent: 'from-pink-100 to-rose-100',
  },
  {
    value: 'true_false',
    title: 'لعبة الصح والخطأ',
    description: 'يتم عرض صورة واحدة (أو صورتين) مع تشغيل سؤال صوتي، ويقوم الطفل بتحديد ما إذا كانت الإجابة صحيحة أم خاطئة.',
    accent: 'from-teal-100 to-emerald-100',
  },
  {
    value: 'eye_tracking.bird',
    title: 'التتبع بالعين - تتبع العصفور',
    description: 'يظهر عصفور يتحرك من اليمين لليسار فقط عندما ينظر إليه الطفل، لتدريب التركيز المستمر.',
    accent: 'from-yellow-100 to-amber-100',
  },
  {
    value: 'grammar.adjectives',
    title: 'تكوين جملة (صفة واسم)',
    description: 'لعبة لتكوين الجمل. يسحب الطفل الصفة ثم الاسم الصحيح لملء الفراغات وتكوين جملة مفيدة.',
    accent: 'from-orange-100 to-rose-100',
  },
];
const EMPTY_MESSAGE = 'ارفع الملف أو اتركه فارغًا مؤقتًا';
const getActivityAutoTitle = (index) => `نشاط ${index + 1}`;
const getActivitySummary = (activity, index) =>
  activity?.titleAr?.trim() || activity?.questionAr?.trim() || getActivityAutoTitle(index);
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'سهل', helper: 'تعليمات بسيطة واختيارات قليلة', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { value: 'medium', label: 'متوسط', helper: 'خطوات أكثر أو تمييز أدق', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  { value: 'hard', label: 'صعب', helper: 'تحدي أعلى وتركيز أطول', className: 'border-rose-200 bg-rose-50 text-rose-700' },
];
const TOUCH_POINTER_OPTIONS = [
  { value: 'hand', label: '\u064a\u062f', helper: '\u0633\u062d\u0628 \u064a\u062f \u0643\u0631\u062a\u0648\u0646\u064a\u0629', image: openHandImage, className: 'border-sky-200 bg-sky-50 text-sky-700' },
  { value: 'finger', label: '\u0635\u0628\u0627\u0639', helper: '\u0645\u0624\u0634\u0631 \u0644\u0645\u0633 \u0628\u0627\u0644\u0635\u0628\u0627\u0639', image: fingerPointerImage, className: 'border-amber-200 bg-amber-50 text-amber-700' },
];
const getActivityDifficultyButtonClass = (difficulty, isSelected) => {
  const value = difficulty || 'easy';

  if (value === 'hard') {
    return isSelected
      ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm ring-2 ring-rose-100'
      : 'border-rose-200 bg-rose-50/70 text-rose-700 hover:border-rose-400 hover:bg-rose-50';
  }

  if (value === 'medium') {
    return isSelected
      ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-2 ring-amber-100'
      : 'border-amber-200 bg-amber-50/70 text-amber-700 hover:border-amber-400 hover:bg-amber-50';
  }

  return isSelected
    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-100'
    : 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50';
};
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
  const [dialog, setDialog] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadedUrl = await uploadAsset(file);
      onUploaded(uploadedUrl);
    } catch (error) {
      setDialog({
        title: 'تعذر الرفع',
        message: getApiErrorMessage(error, 'تعذر رفع الملف.'),
        confirmText: 'حسناً',
        hideCancelButton: true,
        isDestructive: false,
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const applyManualUrl = () => {
    const nextUrl = String(value || '').trim();
    if (!nextUrl) {
      onUploaded('');
      return;
    }

    if (!isPlayableMediaUrl(nextUrl)) {
      setDialog({
        title: 'رابط غير مدعوم',
        message: 'الروابط المحلية مثل file:// أو مسارات ويندوز المحلية غير مدعومة. استخدم رابطًا مرفوعًا أو http(s).',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
      return;
    }

    onUploaded(nextUrl);
  };

  const handleLibrarySelect = (url) => {
    if (!isPlayableMediaUrl(url)) {
      setDialog({
        title: 'رابط غير مدعوم',
        message: 'الملف المختار غير صالح للتشغيل داخل المتصفح.',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
      return;
    }

    onUploaded(url);
  };

  const canPreview = isPlayableMediaUrl(value);
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
          onBlur={applyManualUrl}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        initialType={mediaType}
      />

      {dialog && (
        <ConfirmModal
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const confirmAction = dialog.onConfirm;
            setDialog(null);
            confirmAction?.();
          }}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          hideCancelButton={dialog.hideCancelButton}
          isDestructive={dialog.isDestructive}
          position={dialog.position || 'top'}
        />
      )}

      {resolvedPreviewType === 'image' && (
        <div
          className={`w-full max-w-md h-40 rounded-2xl border p-3 flex items-center justify-center overflow-hidden ${
            value ? 'border-slate-200 bg-white' : 'border-[#dbe7f3] bg-[#f7fbff]'
          }`}
        >
          {value && canPreview ? (
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
      {value && canPreview && resolvedPreviewType === 'audio' && <audio controls src={value} className="w-full" />}
      {value && canPreview && resolvedPreviewType === 'video' && (
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

const GAME_FORM_DRAFT_VERSION = 1;

const buildGameFormDraftKey = (mode, gameId) => `game-form-draft:${mode}:${gameId || 'new'}`;

const readGameFormDraft = (storageKey) => {
  try {
    const rawDraft = localStorage.getItem(storageKey);
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
};

const writeGameFormDraft = (storageKey, draft) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // Ignore storage failures to avoid blocking editing.
  }
};

const clearGameFormDraft = (storageKey) => {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures to avoid blocking editing.
  }
};

const buildGameFormSnapshot = ({ builderState, selectedLevel, selectedActivity, searchQuery }) =>
  JSON.stringify({
    builderState,
    selectedLevel,
    selectedActivity,
    searchQuery,
  });

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
  const [draggedActivityIndex, setDraggedActivityIndex] = useState(null);
  const [dragOverActivityIndex, setDragOverActivityIndex] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [savedGameId, setSavedGameId] = useState(gameId || '');
  const [formError, setFormError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [mazeDrawTool, setMazeDrawTool] = useState('wall');
  const hasHydratedDraftRef = useRef(false);
  const lastSavedSnapshotRef = useRef('');
  const draftStorageKey = useMemo(() => buildGameFormDraftKey(mode, gameId), [gameId, mode]);

  const [searchQuery, setSearchQuery] = useState('');

  const [allAvailableTags, setAllAvailableTags] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('allGameTags')) || [];
      return Array.from(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ...local])).sort();
    } catch {
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    }
  });
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleToggleGameTag = (tag) => {
    setBuilderState(current => {
      const currentTags = current.config?.tags || [];
      const newTags = currentTags.includes(tag) ? [] : [tag];
      return { ...current, config: { ...current.config, tags: newTags } };
    });
    setTagMenuOpen(false);
  };

  const handleAddNewGameTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    setAllAvailableTags(prev => {
      const updated = Array.from(new Set([...prev, tag])).sort();
      localStorage.setItem('allGameTags', JSON.stringify(updated));
      return updated;
    });
    handleToggleGameTag(tag);
    setNewTagInput('');
  };

  const filteredCards = useMemo(() => {
    return GAME_TYPE_CARDS.filter((card) => {
      return card.title.includes(searchQuery) || card.description.includes(searchQuery);
    });
  }, [searchQuery]);

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
        setDialog({
          title: 'تعذر التحميل',
          message: getApiErrorMessage(error, 'تعذر تحميل اللعبة.'),
          confirmText: 'حسناً',
          hideCancelButton: true,
          isDestructive: false,
        });
        navigate('/admin/games');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [adminSession?.token, gameId, isEdit, navigate]);

  useEffect(() => {
    if (loading || hasHydratedDraftRef.current) {
      return;
    }

    const storedDraft = readGameFormDraft(draftStorageKey);

    if (storedDraft?.version === GAME_FORM_DRAFT_VERSION && storedDraft?.data?.builderState) {
      setBuilderState(storedDraft.data.builderState);
      setSelectedLevel(Math.max(Number(storedDraft.data.selectedLevel) || 0, 0));
      setSelectedActivity(Math.max(Number(storedDraft.data.selectedActivity) || 0, 0));
      setSearchQuery(storedDraft.data.searchQuery || '');
      setSavedGameId(storedDraft.data.savedGameId || gameId || '');
      setDraftNotice('تم استرجاع آخر مسودة بعد التحديث.');
      setHasUnsavedChanges(true);
    } else {
      lastSavedSnapshotRef.current = buildGameFormSnapshot({
        builderState,
        selectedLevel,
        selectedActivity,
        searchQuery,
      });
      setHasUnsavedChanges(false);
    }

    hasHydratedDraftRef.current = true;
  }, [builderState, draftStorageKey, gameId, loading, searchQuery, selectedActivity, selectedLevel]);

  useEffect(() => {
    if (loading || !hasHydratedDraftRef.current) {
      return;
    }

    const snapshot = buildGameFormSnapshot({
      builderState,
      selectedLevel,
      selectedActivity,
      searchQuery,
    });
    const isDirty = snapshot !== lastSavedSnapshotRef.current;

    setHasUnsavedChanges(isDirty);

    if (!isDirty) {
      clearGameFormDraft(draftStorageKey);
      return;
    }

    writeGameFormDraft(draftStorageKey, {
      version: GAME_FORM_DRAFT_VERSION,
      updatedAt: new Date().toISOString(),
      data: {
        builderState,
        selectedLevel,
        selectedActivity,
        searchQuery,
        savedGameId,
      },
    });
  }, [
    builderState,
    draftStorageKey,
    loading,
    savedGameId,
    searchQuery,
    selectedActivity,
    selectedLevel,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const levels = builderState.config?.levels || [];
  const currentLevel = levels[selectedLevel] || levels[0];
  const currentActivities = Array.isArray(currentLevel?.activities) ? currentLevel.activities : [];
  const currentActivity = currentActivities[selectedActivity] || null;

  const currentActivityType = currentActivity?.type || builderState.type;

  useEffect(() => {
    const hasActivityWithoutType = (builderState.config?.levels || []).some((level) =>
      (level.activities || []).some((activity) => !activity?.type)
    );

    if (!hasActivityWithoutType) {
      return;
    }

    updateConfig((currentConfig) => normalizeActivityTypesForConfig(currentConfig, builderState.type));
  }, [builderState.config?.levels, builderState.type]);

  const previewGame = useMemo(() => {
    if (!currentActivityType || !currentActivity) {
      return null;
    }

    return buildActivityRuntimeGame({
      nameAr: builderState.nameAr,
      templateType: currentActivityType,
      activity: currentActivity,
      sharedMedia: builderState.config.media,
    });
  }, [builderState.config.media, builderState.nameAr, currentActivityType, currentActivity]);

  const updateConfig = (updater) => {
    setBuilderState((current) => ({
      ...current,
      config: typeof updater === 'function' ? updater(current.config) : updater,
    }));
  };

  const updateDefaultActivityType = (type) => {
    setBuilderState((current) => ({
      ...current,
      type,
      config: {
        ...normalizeActivityTypesForConfig(current.config, type),
        templateType: type,
        name: current.name || '',
        nameAr: current.nameAr || '',
      },
    }));
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
    const newActivityType = builderState.type || currentActivityType;
    if (!newActivityType) return;

    updateLevel(selectedLevel, (level) => ({
      ...level,
      activities: [
        ...level.activities,
        getDefaultActivityForType(newActivityType, level.activities.length),
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

  const resetActivityDragState = () => {
    setDraggedActivityIndex(null);
    setDragOverActivityIndex(null);
  };

  const reorderActivities = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
      resetActivityDragState();
      return;
    }

    const safeFromIndex = Number(fromIndex);
    const safeToIndex = Number(toIndex);
    if (
      safeFromIndex < 0 ||
      safeToIndex < 0 ||
      safeFromIndex >= currentActivities.length ||
      safeToIndex >= currentActivities.length
    ) {
      resetActivityDragState();
      return;
    }

    updateLevel(selectedLevel, (level) => {
      const activities = [...level.activities];
      const [movedActivity] = activities.splice(safeFromIndex, 1);
      activities.splice(safeToIndex, 0, movedActivity);
      return { ...level, activities };
    });

    setSelectedActivity((current) => {
      if (current === safeFromIndex) return safeToIndex;
      if (safeFromIndex < current && safeToIndex >= current) return current - 1;
      if (safeFromIndex > current && safeToIndex <= current) return current + 1;
      return current;
    });
    resetActivityDragState();
  };

  const createMemoryCardDraft = (index = 0) => ({
    id: 'card_' + Date.now() + '_' + index,
    image: '',
    textAr: '',
    audioUrl: '',
  });

  const syncMemoryCardsToPairCount = (activity, pairCount) => {
    const targetCount = Math.max(2, Math.min(8, Number(pairCount) || 4));
    const currentCards = Array.isArray(activity.cards) ? activity.cards : [];

    if (currentCards.length === targetCount) {
      return activity;
    }

    const nextCards = currentCards.slice(0, targetCount);
    while (nextCards.length < targetCount) {
      nextCards.push(createMemoryCardDraft(nextCards.length));
    }

    return {
      ...activity,
      cards: nextCards,
      pairCount: targetCount,
    };
  };

  const setActivityField = (field, value) => {
    updateCurrentActivity((activity) => {
      if (field === 'pairCount' && currentActivityType === 'memory.cards') {
        return syncMemoryCardsToPairCount(activity, value);
      }

      return { ...activity, [field]: value };
    });
  };

  const setActivityDifficulty = (difficulty) => {
    updateCurrentActivity((activity) => {
      const nextActivity = { ...activity, difficulty };

      if (activity?.type === 'memory.grid') {
        const preset = {
          easy: { gridSize: 2, viewSeconds: 5 },
          medium: { gridSize: 3, viewSeconds: 4 },
          hard: { gridSize: 4, viewSeconds: 3 },
        }[difficulty];

        return preset ? { ...nextActivity, ...preset } : nextActivity;
      }

      return nextActivity;
    });
  };

  const toggleCompletePartCell = (cellId) => {
    updateCurrentActivity((activity) => {
      const maxSelected = Math.max(1, Math.min(2, Number(activity?.missingPartCount || 1)));
      const currentIds = Array.isArray(activity?.missingCellIds) ? activity.missingCellIds.map((id) => String(id)) : [];
      const targetId = String(cellId);

      if (currentIds.includes(targetId)) {
        const nextIds = currentIds.filter((id) => id !== targetId);
        return {
          ...activity,
          missingCellIds: nextIds.length ? nextIds : [targetId],
        };
      }

      if (currentIds.length >= maxSelected) {
        return {
          ...activity,
          missingCellIds: [...currentIds.slice(1), targetId],
        };
      }

      return {
        ...activity,
        missingCellIds: [...currentIds, targetId],
      };
    });
  };

  const changeCurrentActivityType = (newType) => {
    updateCurrentActivity((activity) => {
      const defaults = getDefaultActivityForType(newType, selectedActivity);

      return {
        ...defaults,
        id: activity.id || defaults.id,
        type: newType,
        titleAr: activity.titleAr || defaults.titleAr,
        questionAr: defaults.questionAr,
        instructionAudio: '',
        difficulty: activity.difficulty || defaults.difficulty,
      };
    });

    // Auto-sync the main game type if the user changes the activity type directly
    setBuilderState((current) => {
      if (current.type !== newType) {
        return {
          ...current,
          type: newType,
          config: {
            ...current.config,
            templateType: newType,
          }
        };
      }
      return current;
    });
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
    updateCurrentActivity((activity) => {
      const isEmotionFaces = currentActivityType === 'emotion.faces';
      const emotionPresets = [
        { id: 'confused', textAr: 'محتار', questionLabelAr: 'المحتار', emoji: '😕' },
        { id: 'laughing', textAr: 'يضحك', questionLabelAr: 'الذي يضحك', emoji: '😄' },
        { id: 'crying', textAr: 'يبكي', questionLabelAr: 'الذي يبكي', emoji: '😭' },
        { id: 'worried', textAr: 'قلقان', questionLabelAr: 'القلقان', emoji: '😟' },
        { id: 'calm', textAr: 'هادئ', questionLabelAr: 'الهادئ', emoji: '😌' },
      ];
      const usedIds = new Set((activity.options || []).map((option) => option.id));
      const preset = emotionPresets.find((option) => !usedIds.has(option.id)) || {
        id: `emotion_${Date.now()}`,
        textAr: 'شعور جديد',
        questionLabelAr: 'الجديد',
        emoji: '🙂',
      };

      return {
        ...activity,
        options: [
          ...(activity.options || []),
          isEmotionFaces
            ? { ...preset, id: usedIds.has(preset.id) ? `emotion_${Date.now()}` : preset.id, isCorrect: false }
            : {
              id: `option_${Date.now()}`,
              image: '',
              textAr: '',
              isCorrect: false,
            },
        ],
      };
    });
  };

  // Grammar Adjectives Helpers
  const updateAdjective = (index, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      adjectives: (activity.adjectives || []).map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    }));
  };
  const selectCorrectAdjective = (index) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      adjectives: (activity.adjectives || []).map((opt, i) => ({ ...opt, isCorrect: i === index })),
    }));
  };
  const addAdjective = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      adjectives: [...(activity.adjectives || []), { id: `adj_${Date.now()}`, image: '', textAr: '', isCorrect: false }],
    }));
  };
  const removeAdjective = (index) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      adjectives: (activity.adjectives || []).filter((_, i) => i !== index),
    }));
  };

  const updateNoun = (index, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      nouns: (activity.nouns || []).map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    }));
  };
  const selectCorrectNoun = (index) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      nouns: (activity.nouns || []).map((opt, i) => ({ ...opt, isCorrect: i === index })),
    }));
  };
  const addNoun = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      nouns: [...(activity.nouns || []), { id: `noun_${Date.now()}`, image: '', textAr: '', isCorrect: false }],
    }));
  };
  const removeNoun = (index) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      nouns: (activity.nouns || []).filter((_, i) => i !== index),
    }));
  };

  // Auto-initialize options if empty
  useEffect(() => {
    if (
      ['text.missing_word', 'matching.similar', 'matching.different', 'matching.find', 'matching.shadow', 'touch.hand', 'picture.reveal', 'image.complete_part', 'emotion.faces', 'true_false', 'eye_tracking.bird', 'spatial.concepts'].includes(currentActivityType) &&
      currentActivity
    ) {
      if (!currentActivity.options || currentActivity.options.length === 0) {
        const isImageCompletePart = currentActivityType === 'image.complete_part';
        const isEmotionFaces = currentActivityType === 'emotion.faces';
        updateCurrentActivity((activity) => ({
          ...activity,
          options: isImageCompletePart
            ? [
              { id: `opt_${Date.now()}_1`, textAr: '', image: '', isCorrect: false },
              { id: `opt_${Date.now()}_2`, textAr: '', image: '', isCorrect: false },
              { id: `opt_${Date.now()}_3`, textAr: '', image: '', isCorrect: false },
            ]
            : isEmotionFaces
              ? getDefaultActivityForType('emotion.faces', selectedActivity).options
              : [
                { id: `opt_${Date.now()}_1`, textAr: '', image: '', isCorrect: true },
                { id: `opt_${Date.now()}_2`, textAr: '', image: '', isCorrect: false },
              ],
        }));
      }
    }
  }, [currentActivityType, currentActivity?.id, selectedActivity]); // Only run when activity changes or type changes

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

  const updatePair = (pairIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      pairs: (activity.pairs || []).map((pair, index) => {
        if (index !== pairIndex) return pair;
        return { ...pair, [field]: value };
      }),
    }));
  };

  const addPair = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      pairs: [
        ...(activity.pairs || []),
        {
          id: `pair_${Date.now()}`,
          sourceImage: '',
          sourceLabel: '',
          targetImage: '',
          targetLabel: '',
        },
      ],
    }));
  };

  const removePair = (pairIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      pairs: (activity.pairs || []).filter((_, index) => index !== pairIndex),
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
  const updateSpatialDragItem = (field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      dragItem: {
        id: 'drag_1',
        ...(activity.dragItem || {}),
        [field]: value,
      },
    }));
  };

  const updateSpatialDropZone = (field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      dropZone: {
        x: 50,
        y: 20,
        width: 20,
        height: 20,
        ...(activity.dropZone || {}),
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

  const addCommandItem = () => {
    updateCurrentActivity((activity) => ({
      ...activity,
      items: [
        ...(activity.items || []),
        {
          id: `cmd_${Date.now()}`,
          image: '',
          labelAr: '',
          textAr: '',
          stepOrder: null,
        },
      ],
    }));
  };

  const updateCommandItem = (itemIndex, field, value) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      items: (activity.items || []).map((item, index) => (
        index === itemIndex ? { ...item, [field]: value } : item
      )),
    }));
  };

  const removeCommandItem = (itemIndex) => {
    updateCurrentActivity((activity) => ({
      ...activity,
      items: (activity.items || []).filter((_, index) => index !== itemIndex),
    }));
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
        const activityType = activity.type || builderState.type;

        if (!activity.questionAr?.trim()) {
          return `أدخل نص السؤال في المستوى ${level.levelNumber}.`;
        }

        if (activityType === 'matching.similar') {
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

        if (activityType === 'grammar.adjectives') {
          if (!activity.heroImage?.trim()) {
            return `أضف الصورة الرئيسية في المستوى ${level.levelNumber}.`;
          }
          if ((activity.adjectives || []).length < 2) {
            return `يجب إضافة صفتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.adjectives || []).filter((o) => o.isCorrect).length !== 1) {
            return `حدد صفة صحيحة واحدة في المستوى ${level.levelNumber}.`;
          }
          if ((activity.nouns || []).length < 2) {
            return `يجب إضافة اسمين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.nouns || []).filter((o) => o.isCorrect).length !== 1) {
            return `حدد اسم صحيح واحد في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'matching.find') {
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

        if (activityType === 'matching.shadow') {
          if ((activity.options || []).length < 2) {
            return `لعبة بازل الظل تحتاج صورتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد صورة صحيحة واحدة فقط لبازل الظل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim())) {
            return `كل اختيارات بازل الظل تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'touch.hand') {
          if ((activity.options || []).length < 2) {
            return `لعبة المس باليد تحتاج صورتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد صورة صحيحة واحدة فقط للعبة المس باليد في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim())) {
            return `كل صور لعبة المس باليد يجب أن تكون مرفوعة في المستوى ${level.levelNumber}.`;
          }
        }
        if (activityType === 'emotion.faces') {
          if ((activity.options || []).length < 2) {
            return `لعبة المشاعر تحتاج شعورين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).some((option) => !option.image?.trim() && !option.emoji?.trim() && !option.textAr?.trim())) {
            return `كل اختيارات المشاعر تحتاج شعور (إيموجي) أو صورة في المستوى ${level.levelNumber}.`;
          }
        }


        if (activityType === 'motor.shake_image') {
          if (!activity.image?.trim()) {
            return `\u0623\u0636\u0641 \u0635\u0648\u0631\u0629 \u0644\u0639\u0628\u0629 \u0647\u0632 \u0627\u0644\u0635\u0648\u0631\u0629 \u0641\u064a \u0627\u0644\u0645\u0633\u062a\u0648\u0649 ${level.levelNumber}.`;
          }
        }
        if (activityType === 'spatial.concepts') {
          const spatialMode = activity.gameMode || 'choose_concept';
          if (!activity.sceneImage?.trim()) {
            return `أضف صورة المشهد في لعبة المفاهيم المكانية في المستوى ${level.levelNumber}.`;
          }
          if (spatialMode === 'drag_to_position') {
            if (!activity.dragItem?.image?.trim()) {
              return `أضف صورة العنصر المتحرك في لعبة المفاهيم المكانية في المستوى ${level.levelNumber}.`;
            }
            const zone = activity.dropZone || {};
            if ([zone.x, zone.y, zone.width, zone.height].some((value) => Number(value) <= 0)) {
              return `حدد منطقة إسقاط صالحة في لعبة المفاهيم المكانية في المستوى ${level.levelNumber}.`;
            }
          } else {
            if ((activity.options || []).length < 2) {
              return `لعبة المفاهيم المكانية تحتاج اختيارين على الأقل في المستوى ${level.levelNumber}.`;
            }
            if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
              return `حدد إجابة صحيحة واحدة فقط في لعبة المفاهيم المكانية في المستوى ${level.levelNumber}.`;
            }
            if ((activity.options || []).some((option) => !option.textAr?.trim() && !option.image?.trim())) {
              return `كل اختيارات المفاهيم المكانية تحتاج نصًا أو صورة في المستوى ${level.levelNumber}.`;
            }
            if (spatialMode === 'choose_element' && (activity.options || []).some((option) => !option.image?.trim())) {
              return `اختيار العنصر الصحيح يحتاج صورة لكل اختيار في المستوى ${level.levelNumber}.`;
            }
          }
        }
        if (activityType === 'picture.reveal') {
          if (!activity.image?.trim()) {
            return `أضف الصورة المخفية في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).length < 2) {
            return `لعبة كشف الصورة تحتاج خيارين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.options || []).filter((option) => option.isCorrect).length !== 1) {
            return `حدد إجابة صحيحة واحدة فقط في المستوى ${level.levelNumber}.`;
          }
          if (Number(activity.gridSize || 0) < 2) {
            return `حجم الشبكة يجب أن يكون 2x2 أو أكبر في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'image.complete_part') {
          if (!activity.image?.trim()) {
            return `أضف الصورة الأساسية في المستوى ${level.levelNumber}.`;
          }
          if (Number(activity.gridRows || 0) < 2 || Number(activity.gridCols || 0) < 2) {
            return `حدد شبكة صالحة للعبة إكمال الجزء في المستوى ${level.levelNumber}.`;
          }
          if (!Array.isArray(activity.missingCellIds) || activity.missingCellIds.length < 1) {
            return `حدد الجزء الناقص من الشبكة في المستوى ${level.levelNumber}.`;
          }
          if (activity.missingCellIds.length < Number(activity.missingPartCount || 1)) {
            return `حدد كل الأجزاء الناقصة المطلوبة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'memory.cards') {
          if ((activity.cards || []).length < 2) {
            return `لعبة الذاكرة تحتاج عنصرين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if (
            (activity.cards || []).some(
              (card) => !card.image?.trim() && !card.textAr?.trim()
            )
          ) {
            return `كل كارت في لعبة الذاكرة يحتاج صورة أو كلمة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'memory.grid') {
          const neededCards = Math.max(4, Number(activity.gridSize || 3) * Number(activity.gridSize || 3));
          if ((activity.cards || []).length < neededCards) {
            return `شبكة الذاكرة تحتاج ${neededCards} صور/عناصر في المستوى ${level.levelNumber}.`;
          }
          if (
            (activity.cards || []).some(
              (card) => !card.image?.trim() && !card.textAr?.trim()
            )
          ) {
            return `كل عنصر في شبكة الذاكرة يحتاج صورة أو كلمة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'matching.different') {
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

        if (activityType === 'sequence.order') {
          if ((activity.steps || []).length < 2) {
            return `أضف خطوتين على الأقل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.steps || []).some((step) => !step.image?.trim())) {
            return `كل خطوات الترتيب تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'commands.multi_step') {
          const commandItems = activity.items || [];
          const orderedItems = commandItems.filter((item) => Number(item.stepOrder) > 0);
          if (commandItems.length < 2) {
            return `أضف عنصرين على الأقل في لعبة الأوامر المركبة في المستوى ${level.levelNumber}.`;
          }
          if (orderedItems.length < 1) {
            return `حدد ترتيب خطوة واحدة على الأقل في لعبة الأوامر المركبة في المستوى ${level.levelNumber}.`;
          }
          if (commandItems.some((item) => !item.image?.trim())) {
            return `كل عناصر لعبة الأوامر المركبة تحتاج صورة في المستوى ${level.levelNumber}.`;
          }
          if (orderedItems.some((item) => !item.labelAr?.trim() && !item.textAr?.trim())) {
            return `اكتب اسم كل عنصر مطلوب في لعبة الأوامر المركبة في المستوى ${level.levelNumber}.`;
          }
        }

        if (activityType === 'action.drag_to_target') {
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

        if (activityType === 'navigation.move_to_target') {
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

        if (activityType === 'navigation.maze') {
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
        if (activityType === 'puzzle.jigsaw') {
          if (!activity.image?.trim()) {
            return `أضف صورة البازل في المستوى ${level.levelNumber}.`;
          }
          if ((activity.puzzleMode || 'jigsaw') === 'missing-piece') {
            const gridSize = Math.max(3, Number(activity.gridSize || 0));
            const slotIndex = Number(activity.missingSlotIndex);
            if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= gridSize * gridSize) {
              return `حدد الخانة الناقصة بشكل صحيح في المستوى ${level.levelNumber}.`;
            }
          }
        }

          if (
            activityType === 'navigation.move_to_target' &&
            Number(activity.movable?.startX || 0) > Number(activity.grid?.cols || 0)
          ) {
            return `Start position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            activityType === 'navigation.move_to_target' &&
            Number(activity.movable?.startY || 0) > Number(activity.grid?.rows || 0)
          ) {
            return `Start position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            activityType === 'navigation.move_to_target' &&
            Number(activity.target?.x || 0) > Number(activity.grid?.cols || 0)
          ) {
            return `Target position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            activityType === 'navigation.move_to_target' &&
            Number(activity.target?.y || 0) > Number(activity.grid?.rows || 0)
          ) {
            return `Target position لازم تكون داخل الـ Grid في المستوى ${level.levelNumber}.`;
          }
          if (
            activityType === 'navigation.move_to_target' &&
            Number(activity.target?.radius || 0) < 1
          ) {
            return `Radius لازم تكون 1 أو أكثر في المستوى ${level.levelNumber}.`;
          }
      }
    }

    return '';
  };

  const saveGame = async ({ stayOnPage = false } = {}) => {
    const validationError = validateBuilder();
    if (validationError) {
      setFormError(validationError);
      return false;
    }

    setFormError('');
    setSaveNotice('');
    setSaving(true);

    const configWithActivityTypes = normalizeActivityTypesForConfig(builderState.config, builderState.type);
    const configReadyForSave = {
      ...configWithActivityTypes,
      levels: configWithActivityTypes.levels.map((level) => ({
        ...level,
        activities: (level.activities || []).map((activity) => {
          if (activity?.type !== 'puzzle.jigsaw' || activity?.puzzleMode !== 'missing-piece') {
            return activity;
          }

          const gridSize = Math.max(3, Number(activity.gridSize || 3));
          const totalCells = gridSize * gridSize;
          const rawMissingSlotIndex = Number(activity.missingSlotIndex ?? activity.missingCellIds?.[0] ?? 0);
          const missingSlotIndex = Number.isFinite(rawMissingSlotIndex)
            ? Math.min(Math.max(0, Math.floor(rawMissingSlotIndex)), totalCells - 1)
            : 0;

          return {
            ...activity,
            type: 'image.complete_part',
            gridSize,
            gridRows: gridSize,
            gridCols: gridSize,
            missingPartCount: 1,
            missingSlotIndex,
            missingCellIds: [String(missingSlotIndex)],
          };
        }),
      })),
    };

    const savedActivities = configReadyForSave.levels.flatMap((level) => level.activities || []);
    const allActivitiesAreCompletePart =
      savedActivities.length > 0 && savedActivities.every((activity) => activity?.type === 'image.complete_part');
    const payloadType = allActivitiesAreCompletePart ? 'image.complete_part' : builderState.type;

    const payload = {
      gameCode: builderState.gameCode.trim(),
      name: builderState.name.trim() || builderState.nameAr.trim(),
      nameAr: builderState.nameAr.trim(),
      type: payloadType,
      level: 1,
      isActive: builderState.isActive,
      config: {
        ...configReadyForSave,
        name: builderState.name.trim() || builderState.nameAr.trim(),
        nameAr: builderState.nameAr.trim(),
        templateType: payloadType,
      },
    };

    try {
      const targetGameId = savedGameId || gameId;
      if (isEdit || targetGameId) {
        await gameService.updateGame(adminSession?.token, targetGameId, payload);
      } else {
        const createdGame = await gameService.createGame(adminSession?.token, payload);
        if (createdGame?.id) {
          setSavedGameId(createdGame.id);
        }
      }

      lastSavedSnapshotRef.current = buildGameFormSnapshot({
        builderState,
        selectedLevel,
        selectedActivity,
        searchQuery,
      });
      setHasUnsavedChanges(false);
      setDraftNotice('');
      clearGameFormDraft(draftStorageKey);

      if (stayOnPage) {
        setSaveNotice('تم تحديث آخر الإضافات بنجاح.');
        return true;
      }

      navigate('/admin/games');
      return true;
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'تعذر حفظ اللعبة.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveGame({ stayOnPage: false });
  };

  const handleBackToGames = () => {
    if (!hasUnsavedChanges) {
      navigate('/admin/games');
      return;
    }

    setDialog({
      title: 'تغييرات غير محفوظة',
      message: 'لديك تعديلات لم يتم حفظها بعد. هل تريد الرجوع بدون حفظ؟',
      confirmText: 'الرجوع بدون حفظ',
      cancelText: 'البقاء هنا',
      isDestructive: true,
      position: 'center',
      onConfirm: () => navigate('/admin/games'),
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-bold">جارٍ تحميل بيانات اللعبة...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={handleBackToGames} className="!py-2 !text-sm">
          <ArrowRight size={20} />
          <span>رجوع</span>
        </Button>

        <h2 className="text-3xl font-black text-slate-900">
          {isEdit ? 'تعديل قالب اللعبة' : 'إنشاء قالب لعبة جديد'}
        </h2>

        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8 rounded-[2rem] space-y-6 !overflow-visible">
          <SectionTitle>1. النوع الافتراضي للأنشطة الجديدة</SectionTitle>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm font-bold leading-7 text-slate-600">
            هذا الاختيار يحدد نوع النشاط الجديد عند الضغط على إضافة نشاط. تعديل نشاط موجود يتم من قائمة "نوع اللعبة لهذا النشاط" داخل فورم النشاط.
          </div>

          <div className="flex flex-col gap-4">
            {/* Template Filtering */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition focus-within:ring-[var(--primary)] lg:w-[min(100%,34rem)]">
                  <Search size={20} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن نوع اللعبة (مثال: المطابقة، المتاهة...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none text-slate-800 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => saveGame({ stayOnPage: true })}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#168FC7] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-900/10 transition hover:bg-[#127cae] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
              </div>
              {saveNotice && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                  {saveNotice}
                </div>
              )}
              {draftNotice && (
                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-black text-sky-700">
                  {draftNotice}
                </div>
              )}
              {!draftNotice && hasUnsavedChanges && (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                  توجد تعديلات غير محفوظة على السيرفر، لكن المسودة محفوظة تلقائيًا على هذا الجهاز.
                </div>
              )}
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
                    onClick={() => updateDefaultActivityType(typeCard.value)}
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
                    {builderState.type === typeCard.value && (
                      <div className="mb-2 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black text-blue-700">
                        افتراضي للأنشطة الجديدة
                      </div>
                    )}
                    <div className="text-xs leading-5 text-slate-500 opacity-80 group-hover:opacity-100 transition-opacity">{typeCard.description}</div>
                  </button>

                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 font-bold mb-2">اسم اللعبة (المعروض للطفل)</label>
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
              <label className="block text-slate-700 font-bold mb-2">كود البند (مثال: C11)</label>
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
                placeholder="C11"
              />
            </div>

            <div className="relative w-full sm:max-w-[280px]">
              <label className="block text-slate-700 font-bold mb-2">تصنيفات اللعبة</label>
              <button
                type="button"
                onClick={() => setTagMenuOpen(!tagMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {(builderState.config?.tags || []).length > 0 ? (
                    (builderState.config.tags).map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-100">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 truncate">اختر تصنيفات...</span>
                  )}
                </div>
                <ChevronDown size={18} className="text-slate-400" />
              </button>

              {tagMenuOpen && (
                <div className="absolute z-50 top-full mt-2 right-0 w-full sm:w-[280px] bg-white rounded-xl shadow-xl border border-slate-200 p-2">
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {allAvailableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleGameTag(tag); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-right"
                      >
                        <span className="text-slate-700">{tag}</span>
                        {(builderState.config?.tags || []).includes(tag) && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

          </div>
        </Card>

        {builderState.type && (
          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            <Card className="p-8 rounded-[2rem] space-y-6">
              <SectionTitle>2. الأنشطة</SectionTitle>

              <div className="rounded-[1.8rem] border border-[#dbe7f3] p-5 bg-[#f8fbff] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-900">أنشطة اللعبة</div>
                    <div className="text-sm text-slate-500">يمكنك إضافة عدة أنشطة (أسئلة) داخل اللعبة.</div>
                  </div>

                  <Button type="button" variant="outline" onClick={addActivity} className="!py-2 !px-4">
                    <Plus size={18} />
                    <span>إضافة نشاط</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {currentActivities.map((activity, index) => {
                    const isDragging = draggedActivityIndex === index;
                    const isDragOver = dragOverActivityIndex === index && draggedActivityIndex !== index;

                    return (
                      <button
                        key={activity.id}
                        type="button"
                        draggable
                        onClick={() => setSelectedActivity(index)}
                        onDragStart={(event) => {
                          setDraggedActivityIndex(index);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', String(index));
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDragOverActivityIndex(index);
                        }}
                        onDragLeave={() => {
                          setDragOverActivityIndex((current) => (current === index ? null : current));
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const fromIndex = Number(event.dataTransfer.getData('text/plain'));
                          reorderActivities(Number.isNaN(fromIndex) ? draggedActivityIndex : fromIndex, index);
                        }}
                        onDragEnd={resetActivityDragState}
                        className={[
                          'group relative flex items-center gap-2 rounded-[1.3rem] border px-4 py-3 text-right transition-all cursor-grab active:cursor-grabbing',
                          getActivityDifficultyButtonClass(activity.difficulty, selectedActivity === index),
                          isDragging ? 'opacity-50 scale-[0.98]' : '',
                          isDragOver ? 'ring-4 ring-emerald-200 border-emerald-300 translate-y-[-2px]' : '',
                        ].filter(Boolean).join(' ')}
                        title={'\u0627\u0633\u062d\u0628 \u0644\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062a\u0631\u062a\u064a\u0628'}
                      >
                        <GripVertical size={16} className="shrink-0 opacity-45 transition group-hover:opacity-80" />
                        <span className="min-w-0">
                          <div className="font-black">{getActivityAutoTitle(index)}</div>
                          <div className="text-xs mt-1">{getActivitySummary(activity, index)}</div>
                        </span>
                      </button>
                    );
                  })}
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

                    <div className="grid gap-6 md:grid-cols-2">
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
                        <label className="block text-slate-600 font-bold mb-2">نوع اللعبة لهذا النشاط</label>
                        <CustomSelect
                          value={currentActivityType}
                          onChange={changeCurrentActivityType}
                          options={GAME_TYPE_CARDS.map(card => ({
                            value: card.value,
                            label: card.title
                          }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-600 font-bold mb-2">مستوى النشاط</label>
                        <div className="grid grid-cols-3 gap-2">
                          {DIFFICULTY_OPTIONS.map((option) => {
                            const isSelected = (currentActivity.difficulty || 'easy') === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setActivityDifficulty(option.value)}
                                className={`rounded-2xl border-2 px-3 py-3 text-center transition-all ${
                                  isSelected
                                    ? `${option.className} shadow-sm ring-2 ring-offset-1 ring-blue-100`
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40'
                                }`}
                              >
                                <span className="block text-sm font-black">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {currentActivityType === 'touch.hand' && (
                        <div className="md:col-span-2">
                          <label className="block text-slate-600 font-bold mb-2">{'\u0634\u0643\u0644 \u0627\u0644\u0645\u0624\u0634\u0631'}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {TOUCH_POINTER_OPTIONS.map((option) => {
                              const isSelected = (currentActivity.pointerType || 'hand') === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setActivityField('pointerType', option.value)}
                                  className={`flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center transition-all ${
                                    isSelected
                                      ? `${option.className} shadow-sm ring-2 ring-offset-1 ring-blue-100`
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40'
                                  }`}
                                >
                                  {option.image ? (
                                    <img src={option.image} alt="" className="h-16 w-16 object-contain drop-shadow-sm" draggable="false" />
                                  ) : null}
                                  <span className="text-sm font-black">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                      label={
                        <div className="flex items-center gap-2">
                          <Volume2 size={18} className="text-blue-500" />
                          <span>صوت السؤال أو التعليمات</span>
                        </div>
                      }
                      value={currentActivity.instructionAudio || ''}
                      onUploaded={(value) => setActivityField('instructionAudio', value)}
                      uploadAsset={uploadAsset}
                      accept="audio/*"
                      previewType="audio"
                    />

                    {currentActivityType === 'spatial.concepts' && (
                      <div className="pt-2 space-y-5">
                        <ImageAssetField
                          label="صورة المشهد أو الخلفية"
                          value={currentActivity.sceneImage || ''}
                          onSelect={(value) => setActivityField('sceneImage', value)}
                          token={adminSession?.token}
                          initialQuery="cartoon spatial concepts scene"
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-blue-900 font-bold mb-2">نمط اللعب</label>
                            <select
                              value={currentActivity.gameMode || 'choose_concept'}
                              onChange={(event) => setActivityField('gameMode', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            >
                              <option value="choose_concept">اختيار المفهوم الصحيح</option>
                              <option value="choose_element">اختيار العنصر الصحيح</option>
                              <option value="drag_to_position">السحب والإفلات</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-blue-900 font-bold mb-2">نوع المفهوم</label>
                            <select
                              value={currentActivity.conceptType || 'above_below'}
                              onChange={(event) => setActivityField('conceptType', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            >
                              <option value="above_below">فوق / تحت</option>
                              <option value="inside_outside">داخل / خارج</option>
                              <option value="front_behind">أمام / خلف</option>
                              <option value="right_left">يمين / يسار</option>
                              <option value="near_far">قريب / بعيد</option>
                            </select>
                          </div>
                        </div>

                        {(currentActivity.gameMode || 'choose_concept') === 'drag_to_position' && (
                          <div className="rounded-[1.8rem] border border-blue-100 bg-white/80 p-5 space-y-5">
                            <ImageAssetField
                              label="صورة العنصر المتحرك"
                              value={currentActivity.dragItem?.image || ''}
                              onSelect={(value) => updateSpatialDragItem('image', value)}
                              token={adminSession?.token}
                              initialQuery="cartoon object isolated white background"
                            />

                            <input
                              type="text"
                              value={currentActivity.dragItem?.labelAr || ''}
                              onChange={(event) => updateSpatialDragItem('labelAr', event.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                              placeholder="اسم العنصر المتحرك"
                            />

                            <div className="grid gap-3 sm:grid-cols-4">
                              <input type="number" min={0} max={100} value={currentActivity.dropZone?.x ?? 50} onChange={(event) => updateSpatialDropZone('x', Number(event.target.value))} className="px-4 py-3 rounded-2xl border border-blue-200 outline-none" placeholder="X" />
                              <input type="number" min={0} max={100} value={currentActivity.dropZone?.y ?? 20} onChange={(event) => updateSpatialDropZone('y', Number(event.target.value))} className="px-4 py-3 rounded-2xl border border-blue-200 outline-none" placeholder="Y" />
                              <input type="number" min={5} max={100} value={currentActivity.dropZone?.width ?? 20} onChange={(event) => updateSpatialDropZone('width', Number(event.target.value))} className="px-4 py-3 rounded-2xl border border-blue-200 outline-none" placeholder="العرض" />
                              <input type="number" min={5} max={100} value={currentActivity.dropZone?.height ?? 20} onChange={(event) => updateSpatialDropZone('height', Number(event.target.value))} className="px-4 py-3 rounded-2xl border border-blue-200 outline-none" placeholder="الارتفاع" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentActivityType === 'motor.shake_image' && (
                      <div className="pt-2 space-y-4">
                        <ImageAssetField
                          label={'\u0635\u0648\u0631\u0629 \u0627\u0644\u0647\u0632'}
                          value={currentActivity.image || ''}
                          onSelect={(value) => setActivityField('image', value)}
                          token={adminSession?.token}
                          initialQuery="child object isolated white background"
                        />

                        <div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-4">
                          <label className="block text-sm font-bold text-[#0F6FA6] mb-3">{'\u0639\u062f\u062f \u0627\u0644\u0647\u0632\u0627\u062a \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629'}</label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            value={Math.min(3, Math.max(1, Number(currentActivity.requiredShakes || 3) || 3))}
                            onChange={(event) => setActivityField('requiredShakes', Number(event.target.value))}
                            className="w-full accent-[#0b8fc5]"
                          />
                          <div className="mt-2 text-center text-sm font-black text-slate-700">{Math.min(3, Math.max(1, Number(currentActivity.requiredShakes || 3) || 3))}</div>
                        </div>
                      </div>
                    )}
                    {currentActivityType === 'matching.similar' && (
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

                    {currentActivityType === 'grammar.adjectives' && (
                      <div className="pt-2 space-y-4">
                        <ImageAssetField
                          label="الصورة الرئيسية الكبيرة"
                          value={currentActivity.heroImage || ''}
                          onSelect={(value) => setActivityField('heroImage', value)}
                          token={adminSession?.token}
                          initialQuery="object isolated white background"
                        />
                        <div>
                          <label className="block text-blue-900 font-bold mb-2">جملة اللعبة (استخدم [     ] مكان الفراغ)</label>
                          <input
                            type="text"
                            value={currentActivity.sentenceText || ''}
                            onChange={(event) => setActivityField('sentenceText', event.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                            placeholder="مثال: هذا [     ] [     ]"
                          />
                        </div>
                      </div>
                    )}

                    {currentActivityType === 'matching.different' && (
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

                    {currentActivityType === 'matching.shadow' && (
                      <div className="pt-2 space-y-3">
                        <ImageAssetField
                          label="صورة ظل جاهزة اختيارية"
                          value={currentActivity.heroImage || ''}
                          onSelect={(value) => setActivityField('heroImage', value)}
                          token={adminSession?.token}
                          initialQuery="animal shadow silhouette"
                        />
                        <div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-3 text-sm font-bold text-[#0F6FA6]">
                          لو لم ترفع صورة ظل، سيتم استخدام صورة الإجابة الصحيحة وتحويلها تلقائيًا إلى ظل داخل اللعبة.
                        </div>
                      </div>
                    )}

                    {currentActivityType === 'picture.reveal' && (
                      <div className="pt-2 space-y-4">
                        <ImageAssetField
                          label="الصورة المخفية"
                          value={currentActivity.image || ''}
                          onSelect={(value) => setActivityField('image', value)}
                          token={adminSession?.token}
                          initialQuery="object isolated white background"
                        />

                        <div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-4 space-y-3">
                          <div className="text-sm font-bold text-[#0F6FA6]">حجم شبكة الكشف</div>
                          <div className="grid grid-cols-3 gap-3">
                            {[3, 4, 5].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setActivityField('gridSize', size)}
                                className={`rounded-xl border-2 px-4 py-3 font-black transition-all ${
                                  Number(currentActivity.gridSize || 4) === size
                                    ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                    : 'border-slate-200 bg-white/70 text-slate-500'
                                }`}
                              >
                                {size}x{size}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setActivityField('revealMode', 'manual')}
                              className={`rounded-xl border-2 px-4 py-3 font-black transition-all ${
                                (currentActivity.revealMode || 'manual') === 'manual'
                                  ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                  : 'border-slate-200 bg-white/70 text-slate-500'
                              }`}
                            >
                              كشف يدوي
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivityField('revealMode', 'auto')}
                              className={`rounded-xl border-2 px-4 py-3 font-black transition-all ${
                                currentActivity.revealMode === 'auto'
                                  ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                  : 'border-slate-200 bg-white/70 text-slate-500'
                              }`}
                            >
                              كشف تلقائي
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentActivityType === 'image.complete_part' && (
                      <div className="pt-2 space-y-4">
                        <ImageAssetField
                          label="الصورة الأساسية"
                          value={currentActivity.image || ''}
                          onSelect={(value) => setActivityField('image', value)}
                          token={adminSession?.token}
                          initialQuery="single object white background"
                        />

                        <div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-4 space-y-4">
                          <div className="text-sm font-bold text-[#0F6FA6]">إعداد تقسيم الصورة</div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { rows: 2, cols: 2, label: '2x2' },
                              { rows: 3, cols: 3, label: '3x3' },
                            ].map((gridOption) => {
                              const isActive =
                                Number(currentActivity.gridRows || 2) === gridOption.rows &&
                                Number(currentActivity.gridCols || 2) === gridOption.cols;

                              return (
                                <button
                                  key={gridOption.label}
                                  type="button"
                                  onClick={() =>
                                    updateCurrentActivity((activity) => ({
                                      ...activity,
                                      gridRows: gridOption.rows,
                                      gridCols: gridOption.cols,
                                      missingCellIds: ['0'],
                                    }))
                                  }
                                  className={`rounded-xl border-2 px-4 py-3 font-black transition-all ${
                                    isActive
                                      ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                      : 'border-slate-200 bg-white/70 text-slate-500'
                                  }`}
                                >
                                  {gridOption.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[1, 2].map((count) => (
                              <button
                                key={count}
                                type="button"
                                onClick={() =>
                                  updateCurrentActivity((activity) => ({
                                    ...activity,
                                    missingPartCount: count,
                                    missingCellIds: (Array.isArray(activity?.missingCellIds) ? activity.missingCellIds : ['0']).slice(0, count),
                                  }))
                                }
                                className={`rounded-xl border-2 px-4 py-3 font-black transition-all ${
                                  Number(currentActivity.missingPartCount || 1) === count
                                    ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                    : 'border-slate-200 bg-white/70 text-slate-500'
                                }`}
                              >
                                {count === 1 ? 'جزء واحد ناقص' : 'جزئين ناقصين'}
                              </button>
                            ))}
                          </div>

                          {currentActivity.image ? (
                            <div className="space-y-3">
                              <div className="text-sm font-bold text-slate-700">
                                اسحب القطعة الصحيحة إلى الخانة أو الخانتين اللي عاوزهم يبقوا الجزء الناقص
                              </div>
                              <div
                                dir="ltr"
                                className="relative mx-auto overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_12px_28px_-18px_rgba(15,111,166,0.18)]"
                                style={{
                                  aspectRatio: `${Number(currentActivity.gridCols || 2)} / ${Number(currentActivity.gridRows || 2)}`,
                                  maxWidth: '320px',
                                }}
                              >
                                <img
                                  src={currentActivity.image}
                                  alt="المعاينة"
                                  className="absolute inset-0 h-full w-full object-cover"
                                />

                                <div
                                  className="absolute inset-0 grid"
                                  style={{
                                    gridTemplateColumns: `repeat(${Number(currentActivity.gridCols || 2)}, minmax(0, 1fr))`,
                                    gridTemplateRows: `repeat(${Number(currentActivity.gridRows || 2)}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {Array.from(
                                    {
                                      length:
                                        Number(currentActivity.gridRows || 2) *
                                        Number(currentActivity.gridCols || 2),
                                    },
                                    (_, cellIndex) => {
                                      const cellId = String(cellIndex);
                                      const isSelected = (currentActivity.missingCellIds || []).map((id) => String(id)).includes(cellId);

                                      return (
                                        <button
                                          key={cellId}
                                          type="button"
                                          onClick={() => toggleCompletePartCell(cellId)}
                                          className={`relative border border-white/40 transition-all ${
                                            isSelected
                                              ? 'bg-amber-300/12 ring-4 ring-amber-300/80'
                                              : 'bg-transparent hover:bg-white/8'
                                          }`}
                                        >
                                          {isSelected && (
                                            <div className="absolute inset-0 border-2 border-dashed border-amber-300/90" />
                                          )}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm font-bold text-slate-500">
                              ارفع الصورة أولاً ثم اسحب الجزء الناقص على الشبكة لتحديده.
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-[#D9EAF2] bg-white px-4 py-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-bold text-[#0F6FA6]">صور الاختيارات</div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addOption}
                              className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100"
                            >
                              <Plus size={18} />
                              <span>إضافة اختيار</span>
                            </Button>
                          </div>

                          <div className="text-sm font-bold text-slate-600">
                            الصورة الصحيحة بتتسحب تلقائيًا من الخانة المختارة، وأنت تضيف باقي صور الاختيارات هنا.
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {(currentActivity.options || []).map((option, optionIndex) => (
                              <div key={option.id} className="rounded-[1.6rem] border border-[#dbe7f3] bg-[#f8fbff] p-4 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="font-black text-slate-800">اختيار {optionIndex + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(optionIndex)}
                                    disabled={(currentActivity.options || []).length <= 1}
                                    className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                      (currentActivity.options || []).length <= 1
                                        ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                        : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                    }`}
                                    title={(currentActivity.options || []).length <= 1 ? 'لا يمكن الحذف: يجب وجود اختيار واحد على الأقل' : 'حذف الاختيار'}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  value={option.textAr || ''}
                                  onChange={(event) => updateOption(optionIndex, 'textAr', event.target.value)}
                                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                  placeholder="اسم الاختيار (اختياري)"
                                />

                                <ImageAssetField
                                  label="صورة الاختيار"
                                  value={option.image || ''}
                                  onSelect={(value) => updateOption(optionIndex, 'image', value)}
                                  token={adminSession?.token}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* 3. الإجابات والاختيارات */}
                  {currentActivityType === 'true_false' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">إعدادات الصح والخطأ</h3>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addOption}
                          disabled={(currentActivity.options || []).length >= 2}
                          className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100"
                        >
                          <Plus size={18} />
                          <span>إضافة صورة أخرى</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        قم برفع صورة أو صورتين، ثم حدد ما إذا كانت الإجابة الصحيحة للسؤال هي "صح" أم "خطأ".
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-white p-5 space-y-4">
                          <h4 className="font-black text-slate-800">الإجابة الصحيحة للسؤال</h4>
                          <div className="flex gap-4">
                            <label className="flex flex-1 items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input
                                type="radio"
                                checked={currentActivity.correctAnswer === true}
                                onChange={() => setActivityField('correctAnswer', true)}
                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-bold text-emerald-700 text-lg">صح ✅</span>
                            </label>
                            <label className="flex flex-1 items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input
                                type="radio"
                                checked={currentActivity.correctAnswer === false}
                                onChange={() => setActivityField('correctAnswer', false)}
                                className="w-5 h-5 text-red-600 focus:ring-red-500"
                              />
                              <span className="font-bold text-red-700 text-lg">خطأ ❌</span>
                            </label>
                          </div>
                        </div>

                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">صورة {optionIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeOption(optionIndex)}
                                disabled={(currentActivity.options || []).length <= 1}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.options || []).length <= 1
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title="حذف الصورة"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <ImageAssetField
                              label="الصورة المرفقة"
                              value={option.image || ''}
                              onSelect={(value) => updateOption(optionIndex, 'image', value)}
                              token={adminSession?.token}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentActivityType === 'matching.similar' && (
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

                  {currentActivityType === 'grammar.adjectives' && (
                    <div className="bg-orange-50/40 border border-orange-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-orange-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">خيارات الصفات (المرحلة الأولى)</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addAdjective} className="!py-2 !px-4 !border-orange-200 !text-orange-700 hover:!bg-orange-100">
                          <Plus size={18} />
                          <span>إضافة صفة</span>
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {(currentActivity.adjectives || []).map((option, index) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">صفة {index + 1}</h4>
                              <button type="button" onClick={() => removeAdjective(index)} disabled={(currentActivity.adjectives || []).length <= 2} className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 p-2 rounded-xl">
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <input type="text" value={option.textAr || ''} onChange={(e) => updateAdjective(index, 'textAr', e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none" placeholder="الصفة (مثال: ناعم)" />
                            <ImageAssetField label="صورة الصفة" value={option.image || ''} onSelect={(value) => updateAdjective(index, 'image', value)} token={adminSession?.token} initialQuery={option.textAr} />
                            <label className="flex items-center gap-2 font-bold text-orange-800">
                              <input type="radio" checked={Boolean(option.isCorrect)} onChange={() => selectCorrectAdjective(index)} name={`adj_${selectedActivity}`} />
                              <span>هذه هي الصفة الصحيحة</span>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4 mt-8">
                        <div className="flex items-center gap-2 text-rose-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">خيارات الأسماء (المرحلة الثانية)</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addNoun} className="!py-2 !px-4 !border-rose-200 !text-rose-700 hover:!bg-rose-100">
                          <Plus size={18} />
                          <span>إضافة اسم</span>
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {(currentActivity.nouns || []).map((option, index) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">اسم {index + 1}</h4>
                              <button type="button" onClick={() => removeNoun(index)} disabled={(currentActivity.nouns || []).length <= 2} className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 p-2 rounded-xl">
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <input type="text" value={option.textAr || ''} onChange={(e) => updateNoun(index, 'textAr', e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none" placeholder="الاسم (مثال: كرسي)" />
                            <ImageAssetField label="صورة الاسم" value={option.image || ''} onSelect={(value) => updateNoun(index, 'image', value)} token={adminSession?.token} initialQuery={option.textAr} />
                            <label className="flex items-center gap-2 font-bold text-rose-800">
                              <input type="radio" checked={Boolean(option.isCorrect)} onChange={() => selectCorrectNoun(index)} name={`noun_${selectedActivity}`} />
                              <span>هذا هو الاسم الصحيح</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}




                  {(currentActivityType === 'cards.audio_flashcards' || currentActivityType === 'memory.cards' || currentActivityType === 'memory.grid') && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <ImagePlus size={24} />
                          <h3 className="text-xl font-black">
                            {currentActivityType === 'memory.grid'
                              ? 'صور شبكة الذاكرة'
                              : currentActivityType === 'memory.cards'
                              ? 'كروت لعبة الذاكرة'
                              : 'الكروت الصوتية (الإجابات)'}
                          </h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addCard} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>إضافة كارت</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        {currentActivityType === 'memory.grid'
                          ? 'اكتب السؤال بالأعلى، واجعل أول كارت هو الإجابة المطلوبة. اللعبة تعرض الكروت أولًا ثم تقلبها ليبحث الطفل عن الإجابة.'
                          : currentActivityType === 'memory.cards'
                            ? 'أضف العناصر مرة واحدة فقط، واللعبة ستكرر كل عنصر تلقائيًا لصناعة زوج مطابق. الاسم العربي يُنطق عند فتح الكارت.'
                          : 'قم بإضافة الصورة، الكلمة، وملف النطق الصوتي الذي سيعمل عند قلب الكارت.'}
                      </div>

                      {currentActivityType === 'memory.cards' && (
                        <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
                          <label className="block text-sm font-black text-slate-700 mb-2">عدد الأزواج في اللعبة</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[3, 4, 6, 8].map((pairCount) => (
                              <button
                                key={pairCount}
                                type="button"
                                onClick={() => setActivityField('pairCount', pairCount)}
                                className={`rounded-xl border-2 px-3 py-2 text-sm font-black transition-all ${
                                  Number(currentActivity.pairCount || 4) === pairCount
                                    ? 'border-sky-400 bg-white text-sky-700 shadow-sm'
                                    : 'border-sky-100 bg-white/70 text-slate-500'
                                }`}
                              >
                                {pairCount} أزواج
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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
                              label={
                                <div className="flex items-center gap-2">
                                  <Volume2 size={18} className="text-emerald-600" />
                                  <span>{currentActivityType === 'memory.cards' || currentActivityType === 'memory.grid' ? 'نطق الكلمة اختياريًا' : 'الملف الصوتي للكلمة'}</span>
                                </div>
                              }
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

                  {currentActivityType === 'puzzle.jigsaw' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <ImagePlus size={24} />
                          <h3 className="text-xl font-black">
                            {(currentActivity.puzzleMode || 'jigsaw') === 'missing-piece'
                              ? 'إعدادات الجزء الناقص'
                              : 'إعدادات البازل (الإجابات)'}
                          </h3>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        {(currentActivity.puzzleMode || 'jigsaw') === 'missing-piece'
                          ? 'قم برفع الصورة ثم حدد الخانة الناقصة، وسيُعرض الجزء الناقص كاختيارات منفصلة.'
                          : 'قم برفع الصورة التي سيقوم الطفل بتركيبها، وحدد مستوى الصعوبة (عدد القطع).'}
                      </div>

                      <div className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                        <ImageAssetField
                          label="صورة البازل"
                          value={currentActivity.image || ''}
                          onSelect={(value) =>
                            updateCurrentActivity((activity) => {
                              const gridSize = Math.max(3, Number(activity.gridSize || 3));
                              const currentSlot = Number.isInteger(Number(activity.missingSlotIndex))
                                ? Number(activity.missingSlotIndex)
                                : 0;
                              const missingSlotIndex = Math.min(currentSlot, gridSize * gridSize - 1);

                              return {
                                ...activity,
                                image: value,
                                gridSize,
                                gridRows: gridSize,
                                gridCols: gridSize,
                                missingPartCount: (activity.puzzleMode || 'jigsaw') === 'missing-piece'
                                  ? 1
                                  : activity.missingPartCount ?? 1,
                                missingSlotIndex,
                                missingCellIds: (activity.puzzleMode || 'jigsaw') === 'missing-piece'
                                  ? [String(missingSlotIndex)]
                                  : activity.missingCellIds,
                              };
                            })
                          }
                          token={adminSession?.token}
                          initialQuery="puzzle image"
                        />

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">مستوى الصعوبة (عدد القطع)</label>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                              { value: 'jigsaw', label: 'بازل كامل' },
                              { value: 'missing-piece', label: 'إكمال الجزء الناقص' },
                            ].map((mode) => (
                              <button
                                type="button"
                                key={mode.value}
                                onClick={() =>
                                  updateCurrentActivity((activity) => {
                                    const nextGridSize = Math.max(3, Number(activity.gridSize || 3));
                                    const currentSlot = Number.isInteger(Number(activity.missingSlotIndex))
                                      ? Number(activity.missingSlotIndex)
                                      : 0;
                                    const nextMissingSlotIndex = Math.min(currentSlot, nextGridSize * nextGridSize - 1);

                                    return {
                                      ...activity,
                                      puzzleMode: mode.value,
                                      gridSize: nextGridSize,
                                      gridRows: nextGridSize,
                                      gridCols: nextGridSize,
                                      missingPartCount: mode.value === 'missing-piece' ? 1 : activity.missingPartCount ?? 1,
                                      missingSlotIndex: nextMissingSlotIndex,
                                      missingCellIds: mode.value === 'missing-piece' ? [String(nextMissingSlotIndex)] : activity.missingCellIds,
                                    };
                                  })
                                }
                                className={`py-3 rounded-xl border-2 font-bold transition-all ${
                                  (currentActivity.puzzleMode || 'jigsaw') === mode.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-500'
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[3, 4].map((size) => (
                              <button
                                type="button"
                                key={size}
                                onClick={() =>
                                  updateCurrentActivity((activity) => {
                                    const currentSlot = Number.isInteger(Number(activity.missingSlotIndex))
                                      ? Number(activity.missingSlotIndex)
                                      : 0;

                                    const nextMissingSlotIndex = Math.min(currentSlot, size * size - 1);

                                    return {
                                      ...activity,
                                      gridSize: size,
                                      gridRows: size,
                                      gridCols: size,
                                      missingSlotIndex: nextMissingSlotIndex,
                                      missingCellIds: (activity.puzzleMode || 'jigsaw') === 'missing-piece'
                                        ? [String(nextMissingSlotIndex)]
                                        : activity.missingCellIds,
                                    };
                                  })
                                }
                                className={`py-3 rounded-xl border-2 font-bold transition-all ${Number(currentActivity.gridSize || 3) === size ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500'}`}
                              >
                                {size}x{size}
                              </button>
                            ))}
                          </div>
                          {(currentActivity.puzzleMode || 'jigsaw') === 'missing-piece' && (
                            <div className="space-y-3 pt-1">
                              <div className="text-sm font-bold text-slate-700">
                                اضغط على الخانة التي تريد أن تكون ناقصة
                              </div>

                              {currentActivity.image ? (
                                <div
                                  dir="ltr"
                                  className="relative mx-auto overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_12px_28px_-18px_rgba(15,111,166,0.18)]"
                                  style={{
                                    aspectRatio: '1 / 1',
                                    maxWidth: '320px',
                                  }}
                                >
                                  <img
                                    src={currentActivity.image}
                                    alt="المعاينة"
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />

                                  <div
                                    className="absolute inset-0 grid"
                                    style={{
                                      gridTemplateColumns: `repeat(${Number(currentActivity.gridSize || 3)}, minmax(0, 1fr))`,
                                      gridTemplateRows: `repeat(${Number(currentActivity.gridSize || 3)}, minmax(0, 1fr))`,
                                    }}
                                  >
                                    {Array.from(
                                      {
                                        length:
                                          Number(currentActivity.gridSize || 3) *
                                          Number(currentActivity.gridSize || 3),
                                      },
                                      (_, cellIndex) => {
                                        const isSelected =
                                          Number.isInteger(Number(currentActivity.missingSlotIndex)) &&
                                          Number(currentActivity.missingSlotIndex) === cellIndex;

                                        return (
                                          <button
                                            key={cellIndex}
                                            type="button"
                                            onClick={() =>
                                              updateCurrentActivity((activity) => ({
                                                ...activity,
                                                missingSlotIndex: cellIndex,
                                                missingCellIds: [String(cellIndex)],
                                                missingPartCount: 1,
                                              }))
                                            }
                                            className={`relative border border-white/35 transition-all ${
                                              isSelected
                                                ? 'bg-amber-300/12 ring-4 ring-amber-300/80'
                                                : 'bg-transparent hover:bg-white/8'
                                            }`}
                                          >
                                            {isSelected && (
                                              <div className="absolute inset-0 border-2 border-dashed border-amber-300/90" />
                                            )}
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-center text-sm font-bold text-slate-500">
                                  ارفع صورة البازل أولًا علشان تختار الخانة الناقصة من المعاينة.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentActivityType === 'matching.connect' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">أزواج التوصيل المتطابقة</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addPair} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>إضافة زوج جديد</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        أضف أزواج العناصر التي سيقوم الطفل بتوصيلها (مثل: الكلب والعظمة). سيتم خلط ترتيبها تلقائياً عند اللعب. يجب إضافة زوجين على الأقل.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.pairs || []).map((pair, pairIndex) => (
                          <div key={pair.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">زوج {pairIndex + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removePair(pairIndex)}
                                disabled={(currentActivity.pairs || []).length <= 2}
                                className={`inline-flex items-center justify-center rounded-xl border p-2 transition-colors ${
                                  (currentActivity.pairs || []).length <= 2
                                    ? 'text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed'
                                    : 'text-red-500 border-red-200 bg-red-50 hover:text-red-600 hover:bg-red-100'
                                }`}
                                title={(currentActivity.pairs || []).length <= 2 ? 'لا يمكن الحذف: الحد الأدنى زوجان' : 'حذف الزوج'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              {/* Source Item */}
                              <div className="space-y-4 border-2 border-dashed border-fuchsia-200 rounded-2xl p-4 bg-white">
                                <h5 className="font-bold text-fuchsia-700 text-center border-b pb-2">العنصر الأول (اليمين)</h5>
                                <input
                                  type="text"
                                  value={pair.sourceLabel || ''}
                                  onChange={(event) => updatePair(pairIndex, 'sourceLabel', event.target.value)}
                                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100 outline-none"
                                  placeholder="النص (مثال: كلب)"
                                />
                                <ImageAssetField
                                  label="صورة العنصر"
                                  value={pair.sourceImage || ''}
                                  onSelect={(value) => updatePair(pairIndex, 'sourceImage', value)}
                                  token={adminSession?.token}
                                  initialQuery={pair.sourceLabel || 'dog'}
                                />
                              </div>

                              {/* Target Item */}
                              <div className="space-y-4 border-2 border-dashed border-cyan-200 rounded-2xl p-4 bg-white">
                                <h5 className="font-bold text-cyan-700 text-center border-b pb-2">العنصر المقابل (اليسار)</h5>
                                <input
                                  type="text"
                                  value={pair.targetLabel || ''}
                                  onChange={(event) => updatePair(pairIndex, 'targetLabel', event.target.value)}
                                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none"
                                  placeholder="النص (مثال: عظمة)"
                                />
                                <ImageAssetField
                                  label="صورة العنصر"
                                  value={pair.targetImage || ''}
                                  onSelect={(value) => updatePair(pairIndex, 'targetImage', value)}
                                  token={adminSession?.token}
                                  initialQuery={pair.targetLabel || 'bone'}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(currentActivityType === 'matching.find' || currentActivityType === 'matching.shadow' || currentActivityType === 'touch.hand' || currentActivityType === 'picture.reveal' || currentActivityType === 'emotion.faces' || currentActivityType === 'spatial.concepts') && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الإجابات والاختيارات</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>{currentActivityType === 'emotion.faces' ? 'إضافة شعور' : 'إضافة صورة'}</span>
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">{currentActivityType === 'emotion.faces' ? 'شعور' : 'صورة'} {optionIndex + 1}</h4>
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
                              placeholder={currentActivityType === 'emotion.faces' ? 'اسم الشعور' : 'اسم الصورة اختياري'}
                            />
                            {currentActivityType === 'emotion.faces' ? (
                              <div className="flex flex-col gap-4 mt-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <input
                                    type="text"
                                    value={option.emoji || ''}
                                    onChange={(event) => updateOption(optionIndex, 'emoji', event.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-center text-3xl"
                                    placeholder="😊 إيموجي (اختياري)"
                                    maxLength={4}
                                  />
                                  <input
                                    type="text"
                                    value={option.questionLabelAr || ''}
                                    onChange={(event) => updateOption(optionIndex, 'questionLabelAr', event.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                    placeholder="صيغة السؤال: السعيد / الخائف"
                                  />
                                </div>
                                <div className="border-t pt-3">
                                  <ImageAssetField
                                    label="أو صورة اختيارية بدل الإيموجي"
                                    value={option.image || ''}
                                    onSelect={(value) => updateOption(optionIndex, 'image', value)}
                                    token={adminSession?.token}
                                    initialQuery={option.textAr || 'emotion face isolated'}
                                  />
                                </div>
                              </div>
                            ) : (
                              <ImageAssetField
                                label="صورة الاختيار"
                                value={option.image || ''}
                                onSelect={(value) => updateOption(optionIndex, 'image', value)}
                                token={adminSession?.token}
                                initialQuery={option.textAr || 'cat isolated white background'}
                              />
                            )}
                            {currentActivityType === 'emotion.faces' ? (
                              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
                                هذا الشعور يدخل تلقائيًا في الأسئلة العشوائية.
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 font-bold text-emerald-800">
                                <input
                                  type="radio"
                                  checked={Boolean(option.isCorrect)}
                                  onChange={() => selectCorrectOption(optionIndex)}
                                />
                                <span>
                                  {currentActivityType === 'matching.shadow'
                                    ? 'هذه هي الصورة المطابقة للظل'
                                    : currentActivityType === 'picture.reveal'
                                      ? 'هذه هي الإجابة الصحيحة'
                                      : 'هذه هي الصورة المطلوبة'}
                                </span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentActivityType === 'matching.different' && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6 space-y-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 size={24} />
                          <h3 className="text-xl font-black">الإجابات والاختيارات</h3>
                        </div>
                        <Button type="button" variant="outline" onClick={addOption} className="!py-2 !px-4 !border-emerald-200 !text-emerald-700 hover:!bg-emerald-100">
                          <Plus size={18} />
                          <span>{currentActivityType === 'emotion.faces' ? 'إضافة شعور' : 'إضافة صورة'}</span>
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-amber-50/80 border border-amber-100/80 px-4 py-3 text-sm font-bold text-amber-700/90">
                        الطفل سيرى الصورة الرئيسية أولًا، ثم يختار من الصور أيها المختلفة عنها. مثال مناسب: قطة كبيرة في الوسط، وتحتها قطة وكلب ليختار الطفل الكلب لأنه المختلف.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.options || []).map((option, optionIndex) => (
                          <div key={option.id} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-slate-800">{currentActivityType === 'emotion.faces' ? 'شعور' : 'صورة'} {optionIndex + 1}</h4>
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

                  {currentActivityType === 'text.missing_word' && (
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

                  {currentActivityType === 'action.drag_to_target' && (
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

                  {currentActivityType === 'navigation.move_to_target' && (
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

                  {currentActivityType === 'navigation.maze' && (
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

                  {currentActivityType === 'commands.multi_step' && (
                    <div className="space-y-6">
                      <SectionTitle
                        action={
                          <Button type="button" variant="outline" onClick={addCommandItem} className="!py-2 !px-4">
                            <Plus size={18} />
                            <span>إضافة عنصر</span>
                          </Button>
                        }
                      >
                        عناصر الأمر المركب
                      </SectionTitle>

                      <div className="rounded-[1.8rem] border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm font-bold text-slate-600">
                        اكتب رقم الترتيب للعنصر المطلوب: 1 ثم 2 ثم 3. اتركه فارغاً أو 0 إذا كان العنصر مشتتاً.
                      </div>

                      <div className="grid gap-4">
                        {(currentActivity.items || []).map((item, itemIndex) => (
                          <div key={item.id || itemIndex} className="rounded-[1.8rem] border border-[#dbe7f3] bg-[#f8fbff] p-5 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="font-black text-slate-800">عنصر {itemIndex + 1}</h4>
                              {(currentActivity.items || []).length > 2 && (
                                <button type="button" onClick={() => removeCommandItem(itemIndex)} className="text-red-500">
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={item.labelAr || item.textAr || ''}
                                onChange={(event) => {
                                  updateCommandItem(itemIndex, 'labelAr', event.target.value);
                                  updateCommandItem(itemIndex, 'textAr', event.target.value);
                                }}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                placeholder="اسم العنصر"
                              />

                              <input
                                type="number"
                                min={0}
                                max={3}
                                value={item.stepOrder ?? ''}
                                onChange={(event) => updateCommandItem(itemIndex, 'stepOrder', event.target.value === '' ? null : Number(event.target.value))}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                placeholder="ترتيب الخطوة"
                              />
                            </div>

                            <ImageAssetField
                              label="صورة العنصر"
                              value={item.image || ''}
                              onSelect={(value) => updateCommandItem(itemIndex, 'image', value)}
                              token={adminSession?.token}
                              initialQuery={item.labelAr || item.textAr || 'therapy object white background'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentActivityType === 'sequence.order' && (
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

            <Card className="p-8 rounded-[2rem] space-y-6 sticky top-28 z-10 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                <div
                  key={`${selectedLevel}-${selectedActivity}-${currentActivity?.id || 'activity'}-${currentActivityType}`}
                  className="rounded-[2rem] border border-[#dbe7f3] bg-[#f8fbff] p-4"
                >
                  {renderGameActivity({
                    game: previewGame,
                    onComplete: () => {},
                    previewMode: true,
                  })}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
                  اختر النوع الافتراضي ثم أضف نشاطًا لعرض المعاينة هنا.
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

      {dialog && (
        <ConfirmModal
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const confirmAction = dialog.onConfirm;
            setDialog(null);
            confirmAction?.();
          }}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          hideCancelButton={dialog.hideCancelButton}
          isDestructive={dialog.isDestructive}
          position={dialog.position || 'top'}
        />
      )}
    </div>
  );
};

export default GameForm;
