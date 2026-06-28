import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Image as ImageIcon, Music, Video, LoaderCircle, UploadCloud, FolderOpen, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';

const CATEGORY_OPTIONS = [
  { value: '', label: 'كل البنود' },
];

const UPLOAD_ROOT_OPTION = { value: '', label: '\u0628\u062f\u0648\u0646 \u0628\u0646\u062f' };
const HIDDEN_LEGACY_CATEGORIES = new Set(['general', 'az', 'numbers']);
const LEGACY_CODE_CATEGORY_PATTERN = /^c\d+$/i;

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((labels, option) => {
  if (option.value) labels[option.value] = option.label;
  return labels;
}, {});

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category || 'بدون بند';
const normalizeCategoryValue = (category) => String(category || '').trim().toLowerCase();
const isLegacyCodeCategory = (category) => LEGACY_CODE_CATEGORY_PATTERN.test(normalizeCategoryValue(category));
const shouldDisplayCategory = (category) => {
  const normalizedCategory = normalizeCategoryValue(category);
  return Boolean(normalizedCategory && !HIDDEN_LEGACY_CATEGORIES.has(normalizedCategory) && !isLegacyCodeCategory(normalizedCategory));
};
const getDisplayFilename = (file) => shouldDisplayCategory(file?.category) ? `${file.category}/${file.filename}` : file?.filename;

const buildCategoryOptions = (categories, { includeAll = true, hiddenCategories = [] } = {}) => {
  const options = includeAll ? [...CATEGORY_OPTIONS] : CATEGORY_OPTIONS.filter((option) => option.value);
  const hidden = new Set(hiddenCategories.map(normalizeCategoryValue));
  const seen = new Set(options.map((option) => option.value));

  categories
    .map(normalizeCategoryValue)
    .filter((category) => category && !HIDDEN_LEGACY_CATEGORIES.has(category) && !isLegacyCodeCategory(category) && !hidden.has(category))
    .forEach((category) => {
      if (!seen.has(category)) {
        seen.add(category);
        options.push({ value: category, label: getCategoryLabel(category) });
      }
    });

  return options;
};

const readStoredCategories = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('mediaLibraryCategories'));
    return Array.isArray(stored)
      ? stored.map(normalizeCategoryValue).filter((category) => category && !HIDDEN_LEGACY_CATEGORIES.has(category) && !isLegacyCodeCategory(category))
      : [];
  } catch {
    return [];
  }
};

const readHiddenCategories = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('mediaLibraryHiddenCategories'));
    return Array.isArray(stored)
      ? stored.map(normalizeCategoryValue).filter((category) => category && !isLegacyCodeCategory(category))
      : [];
  } catch {
    return [];
  }
};

const CategoryPicker = ({ value, onChange, options, open, setOpen, title, onDelete }) => {
  const activeOption = options.find((option) => option.value === value);

  return (
    <div className="relative min-w-[10rem]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition-all hover:border-blue-200 focus:ring-4 focus:ring-blue-100"
      >
        <span className="truncate">{activeOption?.label || title}</span>
        <ChevronDown size={18} className={`shrink-0 text-blue-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
            {title}
          </div>
          <div className="max-h-64 overflow-y-auto p-2" dir="ltr">
            {options.map((option) => {
              const isActive = option.value === value;
              const canDelete = Boolean(option.value && onDelete);
              return (
                <div
                  key={option.value || 'all'}
                  className={`flex items-center gap-1 rounded-xl transition-colors ${
                    isActive ? 'bg-blue-50 font-black text-blue-700' : 'font-bold text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-2 text-left"
                  >
                    <span className="truncate">{option.label}</span>
                    {isActive && <Check size={16} className="shrink-0 text-blue-600" />}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(option.value);
                      }}
                      className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="حذف البند"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MediaLibraryModal = ({ isOpen, onClose, onSelect, initialType = '' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [customUploadCategory, setCustomUploadCategory] = useState('');
  const [savedCustomCategories, setSavedCustomCategories] = useState(() => readStoredCategories());
  const [hiddenCategories, setHiddenCategories] = useState(() => readHiddenCategories());
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialog, setDialog] = useState(null);
  const fileInputRef = useRef(null);
  const { adminSession } = useTherapyStore();

  const resolvedUploadCategory = useMemo(() => {
    return normalizeCategoryValue(uploadCategory);
  }, [uploadCategory]);

  const categoryFilterOptions = useMemo(() => {
    return buildCategoryOptions([
      selectedCategory,
      uploadCategory,
      ...savedCustomCategories,
      ...files.map((file) => file.category),
    ], { hiddenCategories });
  }, [files, hiddenCategories, savedCustomCategories, selectedCategory, uploadCategory]);

  const uploadCategoryOptions = useMemo(() => {
    const options = buildCategoryOptions([...savedCustomCategories, ...files.map((file) => file.category)], {
      includeAll: false,
      hiddenCategories,
    });
    return [UPLOAD_ROOT_OPTION, ...options];
  }, [files, hiddenCategories, savedCustomCategories]);


  const visibleFiles = useMemo(() => {
    const hidden = new Set(hiddenCategories.map(normalizeCategoryValue));
    return files.filter((file) => {
      const normalizedCategory = normalizeCategoryValue(file.category);
      const matchesType = !selectedType || file.type === selectedType;
      const isHiddenCategory = hidden.has(normalizedCategory) && !isLegacyCodeCategory(normalizedCategory);
      return matchesType && !isHiddenCategory;
    });
  }, [files, hiddenCategories, selectedType]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const fetchFiles = async () => {
      try {
        setLoading(true);
        const res = await gameService.getUploadedFiles(
          adminSession?.token,
          selectedType,
          searchQuery,
          selectedCategory
        );
        setFiles(res?.data || []);
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFiles, 300);
    return () => clearTimeout(debounce);
  }, [isOpen, adminSession?.token, selectedType, searchQuery, selectedCategory, refreshTrigger]);

  if (!isOpen) return null;

  const handleSelect = (url) => {
    onSelect(url);
    onClose();
  };

  const handleDeleteFile = async (file) => {
    const fileKey = file?.key || file?.id || file?.filename;
    if (!fileKey) return;

    try {
      setIsDeletingFile(true);
      await gameService.deleteUploadedFile(adminSession?.token, fileKey);
      setFiles((current) => current.filter((item) => String(item.key || item.id || item.filename) !== String(fileKey)));
    } catch (error) {
      console.error('Failed to delete uploaded file:', error);
      setDialog({
        title: 'تعذر حذف الملف',
        message: 'حدث خطأ أثناء حذف الملف. حاول مرة أخرى.',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
      return;
    } finally {
      setIsDeletingFile(false);
    }

    setDialog(null);
  };

  const requestDeleteFile = (file) => {
    if (!file) return;

    setDialog({
      type: 'deleteFile',
      file,
      title: 'حذف الملف',
      message: 'سيتم حذف هذا الملف نهائيًا من مكتبة الوسائط. لو مستخدم داخل لعبة قد تحتاج لاختيار ملف بديل.',
      confirmText: 'حذف الملف',
      cancelText: 'إلغاء',
      isDestructive: true,
    });
  };

  const handleDeleteCategory = (category) => {
    const normalizedCategory = normalizeCategoryValue(category);
    if (!normalizedCategory) return;

    setSavedCustomCategories((current) => {
      const updated = current.filter((item) => normalizeCategoryValue(item) !== normalizedCategory);
      localStorage.setItem('mediaLibraryCategories', JSON.stringify(updated));
      return updated;
    });

    setHiddenCategories((current) => {
      const updated = Array.from(new Set([...current, normalizedCategory]));
      localStorage.setItem('mediaLibraryHiddenCategories', JSON.stringify(updated));
      return updated;
    });

    setFiles((current) => current.filter((file) => normalizeCategoryValue(file.category) !== normalizedCategory));
    if (selectedCategory === normalizedCategory) setSelectedCategory('');
    if (uploadCategory === normalizedCategory) setUploadCategory('');
    setFilterMenuOpen(false);
    setUploadMenuOpen(false);
  };

  const requestDeleteCategory = (category) => {
    const normalizedCategory = normalizeCategoryValue(category);
    if (!normalizedCategory) return;

    setDialog({
      type: 'deleteCategory',
      category: normalizedCategory,
      title: 'حذف البند',
      message: 'سيتم إخفاء البند من مكتبة الوسائط. الملفات نفسها لن تحذف من السيرفر.',
      confirmText: 'حذف البند',
      cancelText: 'إلغاء',
      isDestructive: true,
    });
  };

  const handleDialogConfirm = async () => {
    if (dialog?.type === 'deleteFile') {
      await handleDeleteFile(dialog.file);
      return;
    }

    if (dialog?.type === 'deleteCategory') {
      handleDeleteCategory(dialog.category);
    }
    setDialog(null);
  };

  const handleAddCustomCategory = () => {
    const nextCategory = normalizeCategoryValue(customUploadCategory);

    if (!nextCategory) {
      setDialog({
        title: 'اكتب اسم البند',
        message: 'اكتب اسم البند قبل إضافته.',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
      return;
    }

    setSavedCustomCategories((current) => {
      const updated = Array.from(new Set([...current, nextCategory]));
      localStorage.setItem('mediaLibraryCategories', JSON.stringify(updated));
      return updated;
    });
    setHiddenCategories((current) => {
      const updated = current.filter((item) => normalizeCategoryValue(item) !== nextCategory);
      localStorage.setItem('mediaLibraryHiddenCategories', JSON.stringify(updated));
      return updated;
    });
    setUploadCategory(nextCategory);
    setSelectedCategory(nextCategory);
    setCustomUploadCategory('');
    setIsAddingCategory(false);
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    try {
      setIsUploading(true);
      let uploadedCount = 0;
      let failedCount = 0;

      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (resolvedUploadCategory) {
            formData.append('category', resolvedUploadCategory);
          }
          await gameService.uploadAsset(adminSession?.token, formData);
          uploadedCount += 1;
        } catch (uploadError) {
          failedCount += 1;
          console.error('Failed to upload file:', file?.name, uploadError);
        }
      }

      if (uploadedCount > 0) {
        setSearchQuery('');
        setSelectedCategory(resolvedUploadCategory ? resolvedUploadCategory.toLowerCase() : '');
        setRefreshTrigger((prev) => prev + 1);
      }

      if (failedCount > 0) {
        setDialog({
          title: uploadedCount > 0 ? '\u062a\u0645 \u0631\u0641\u0639 \u0628\u0639\u0636 \u0627\u0644\u0645\u0644\u0641\u0627\u062a' : '\u062a\u0639\u0630\u0631 \u0627\u0644\u0631\u0641\u0639',
          message: uploadedCount > 0
            ? `\u062a\u0645 \u0631\u0641\u0639 ${uploadedCount} \u0645\u0644\u0641\u060c \u0648\u062a\u0639\u0630\u0631 \u0631\u0641\u0639 ${failedCount} \u0645\u0644\u0641. \u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u062a\u064a \u062a\u0645 \u0631\u0641\u0639\u0647\u0627 \u0627\u0644\u0622\u0646.`
            : '\u062a\u0639\u0630\u0631 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062a. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
          confirmText: '\u062d\u0633\u0646\u064b\u0627',
          hideCancelButton: true,
          isDestructive: false,
        });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={onClose} />
      <div
        style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '65vw', maxHeight: '75vh', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.5)' }}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-800 md:text-2xl">مكتبة الوسائط</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-white p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_auto_auto] xl:items-center">
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن ملف..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border-none bg-slate-100 py-3 pl-4 pr-12 text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex rounded-2xl bg-slate-100 p-1">
              {[
                { value: '', label: 'الكل', icon: null },
                { value: 'image', label: 'صور', icon: ImageIcon },
                { value: 'audio', label: 'صوتيات', icon: Music },
                { value: 'video', label: 'فيديو', icon: Video },
              ].map((typeOption) => {
                const Icon = typeOption.icon;
                return (
                  <button
                    key={typeOption.value || 'all'}
                    type="button"
                    onClick={() => setSelectedType(typeOption.value)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all md:flex-none ${selectedType === typeOption.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {Icon && <Icon size={18} />}
                    {typeOption.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-sm font-black text-slate-600 shadow-sm">
              <FolderOpen size={18} className="text-blue-500" />
              <span className="whitespace-nowrap">فلتر البند</span>
              <CategoryPicker
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryFilterOptions}
                open={filterMenuOpen}
                setOpen={setFilterMenuOpen}
                title="فلتر البند"
                onDelete={requestDeleteCategory}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[1.75rem] border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
              <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                <FolderOpen size={18} className="text-blue-500" />
                ارفع داخل:
              </span>
              <CategoryPicker
                value={uploadCategory}
                onChange={setUploadCategory}
                options={uploadCategoryOptions}
                open={uploadMenuOpen}
                setOpen={setUploadMenuOpen}
                title="ارفع داخل"
                onDelete={requestDeleteCategory}
              />
              <button
                type="button"
                onClick={() => setIsAddingCategory((current) => !current)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-black text-blue-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <Plus size={17} />
                إضافة بند
              </button>
              {isAddingCategory && (
                <div className="flex w-full flex-col gap-2 rounded-2xl border border-blue-100 bg-white/80 p-2 sm:flex-row">
                  <input
                    type="text"
                    value={customUploadCategory}
                    onChange={(event) => setCustomUploadCategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    placeholder="اسم البند"
                    dir="ltr"
                    className="h-12 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition-all focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="h-12 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    حفظ البند
                  </button>
                </div>
              )}
            </div>

            <div className="w-full md:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,audio/*,video/*"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isUploading ? <LoaderCircle size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                {isUploading ? 'جاري الرفع...' : 'رفع ملف جديد'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-blue-500">
              <LoaderCircle size={40} className="animate-spin" />
              <p className="font-bold text-slate-500">جاري تحميل الوسائط...</p>
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <ImageIcon size={60} className="opacity-20" />
              <p className="text-lg font-bold">لا توجد ملفات متطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visibleFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleSelect(file.url)}
                  className="group relative flex aspect-square flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-right transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {shouldDisplayCategory(file.category) && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-1 text-[0.65rem] font-black text-blue-600 shadow-sm" dir="ltr">
                      {getCategoryLabel(file.category)}
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      requestDeleteFile(file);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        requestDeleteFile(file);
                      }
                    }}
                    className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-500 opacity-100 shadow-sm ring-1 ring-red-100 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                    title="حذف الملف"
                  >
                    <Trash2 size={15} />
                  </span>
                  <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-50 p-2">
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.filename} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" loading="lazy" />
                    ) : file.type === 'audio' ? (
                      <Music size={40} className="text-slate-300 transition-colors group-hover:text-blue-500" />
                    ) : file.type === 'video' ? (
                      <Video size={40} className="text-slate-300 transition-colors group-hover:text-blue-500" />
                    ) : (
                      <ImageIcon size={40} className="text-slate-300 transition-colors group-hover:text-blue-500" />
                    )}
                  </div>
                  <div className="border-t border-slate-100 bg-white p-3">
                    <p className="w-full truncate text-xs font-bold text-slate-600" dir="ltr" title={file.key || file.filename}>
                      {getDisplayFilename(file)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <ConfirmModal
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={handleDialogConfirm}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          hideCancelButton={dialog.hideCancelButton}
          isDestructive={dialog.isDestructive}
          position="top"
        />
      )}
    </div>,
    document.body
  );
};

export default MediaLibraryModal;
