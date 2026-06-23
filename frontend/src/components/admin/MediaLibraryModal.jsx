import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Image as ImageIcon, Music, Video, LoaderCircle, UploadCloud, FolderOpen } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';

const CATEGORY_OPTIONS = [
  { value: '', label: 'كل البنود' },
  { value: 'general', label: 'عام' },
  { value: 'az', label: 'A-Z' },
  { value: 'c1', label: 'C1' },
  { value: 'c2', label: 'C2' },
  { value: 'c3', label: 'C3' },
  { value: 'c4', label: 'C4' },
  { value: 'numbers', label: 'أرقام' },
];

const UPLOAD_CATEGORY_OPTIONS = [
  ...CATEGORY_OPTIONS.filter((option) => option.value),
  { value: 'custom', label: 'بند مخصص' },
];

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((labels, option) => {
  if (option.value) labels[option.value] = option.label;
  return labels;
}, {});

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category || 'بدون بند';

const MediaLibraryModal = ({ isOpen, onClose, onSelect, initialType = '' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const [customUploadCategory, setCustomUploadCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialog, setDialog] = useState(null);
  const fileInputRef = useRef(null);
  const { adminSession } = useTherapyStore();

  const resolvedUploadCategory = useMemo(() => {
    return uploadCategory === 'custom' ? customUploadCategory.trim() : uploadCategory;
  }, [customUploadCategory, uploadCategory]);

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

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    if (!resolvedUploadCategory) {
      setDialog({
        title: 'اختار البند',
        message: 'اختار بند للرفع أو اكتب اسم بند مخصص قبل رفع الملفات.',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', resolvedUploadCategory);
        await gameService.uploadAsset(adminSession?.token, formData);
      }
      setSelectedCategory(resolvedUploadCategory.toLowerCase());
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to upload files:', error);
      setDialog({
        title: 'تعذر الرفع',
        message: 'حدث خطأ أثناء رفع بعض الملفات، يرجى المحاولة مرة أخرى.',
        confirmText: 'حسنًا',
        hideCancelButton: true,
        isDestructive: false,
      });
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

            <label className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
              <FolderOpen size={18} className="text-blue-500" />
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="min-w-[8rem] bg-transparent text-slate-700 outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <span className="text-sm font-black text-slate-700">ارفع داخل:</span>
              <select
                value={uploadCategory}
                onChange={(event) => setUploadCategory(event.target.value)}
                className="rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
              >
                {UPLOAD_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {uploadCategory === 'custom' && (
                <input
                  type="text"
                  value={customUploadCategory}
                  onChange={(event) => setCustomUploadCategory(event.target.value)}
                  placeholder="مثال: c5 أو animals"
                  dir="ltr"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
                />
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
          ) : files.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <ImageIcon size={60} className="opacity-20" />
              <p className="text-lg font-bold">لا توجد ملفات متطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleSelect(file.url)}
                  className="group relative flex aspect-square flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-right transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {file.category && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-1 text-[0.65rem] font-black text-blue-600 shadow-sm" dir="ltr">
                      {getCategoryLabel(file.category)}
                    </span>
                  )}
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
                      {file.category ? `${file.category}/${file.filename}` : file.filename}
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
          onConfirm={() => setDialog(null)}
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
