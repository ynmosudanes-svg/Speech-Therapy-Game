import React, { useRef, useState } from 'react';
import { Image as ImageIcon, ImagePlus, Link2, Upload, X } from 'lucide-react';
import gameService from '../services/gameService';
import MediaLibraryModal from './admin/MediaLibraryModal';

const ImageAssetField = ({ label, value = '', onSelect, token }) => {
  const inputRef = useRef(null);
  const [manualUrl, setManualUrl] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await gameService.uploadAsset(token, formData);
      const nextUrl = response?.url || response?.data?.url || response?.data?.fileUrl || '';

      if (!nextUrl) {
        throw new Error('لم يتم استلام رابط الصورة.');
      }

      setManualUrl(nextUrl);
      onSelect?.(nextUrl);
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || uploadError?.message || 'تعذر رفع الصورة.');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const applyManualUrl = () => {
    const nextUrl = manualUrl.trim();
    onSelect?.(nextUrl);
  };

  const clearImage = () => {
    setManualUrl('');
    setError('');
    onSelect?.('');
  };

  const handleLibrarySelect = (url) => {
    setManualUrl(url);
    onSelect?.(url);
  };

  return (
    <div className="rounded-[1.4rem] border border-[#dbe7f3] bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="font-black text-slate-800">{label}</label>
        {value && (
          <button
            type="button"
            onClick={clearImage}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
            title="حذف الصورة"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex aspect-square w-24 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-[#F4F7FA]">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-contain p-2" />
          ) : (
            <ImagePlus size={42} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 space-y-3 min-w-[150px]">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[#168FC7] px-2 sm:px-4 py-3 font-black text-white transition hover:bg-[#127aac] disabled:cursor-wait disabled:opacity-70 whitespace-nowrap"
            >
              <Upload size={18} className="shrink-0" />
              <span className="truncate">{uploading ? 'جاري الرفع...' : 'رفع جديد'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-2 sm:px-4 py-3 font-black text-blue-700 transition hover:bg-blue-100 whitespace-nowrap"
            >
              <ImageIcon size={18} className="shrink-0" />
              <span className="truncate">مكتبة الوسائط</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              onBlur={applyManualUrl}
              placeholder="أو ضع رابط الصورة"
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 outline-none transition focus:border-[#168FC7] focus:ring-2 focus:ring-[#168FC7]/20"
              dir="ltr"
            />
            <button
              type="button"
              onClick={applyManualUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-200"
            >
              <Link2 size={18} />
            </button>
          </div>

          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
        </div>
      </div>
      
      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        initialType="image"
      />
    </div>
  );
};
export default ImageAssetField;
