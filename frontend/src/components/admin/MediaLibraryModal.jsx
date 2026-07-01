import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  LoaderCircle,
  MoveRight,
  Music,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const GENERAL_FOLDER_ID = '__general__';
const LAST_MEDIA_FOLDER_STORAGE_KEY = 'speech_media_library_last_folder_id';
const GENERAL_FOLDER = {
  id: null,
  name: 'عام',
  slug: '',
  parentId: null,
  children: [],
};

const TYPE_OPTIONS = [
  { value: '', label: 'الكل', icon: null },
  { value: 'image', label: 'صور', icon: ImageIcon },
  { value: 'audio', label: 'صوتيات', icon: Music },
  { value: 'video', label: 'فيديو', icon: Video },
];

const getFriendlyFilename = (filename) => String(filename || '').replace(/^\d+_[0-9a-f-]{36}_/i, '');
const getDisplayFilename = (file) => file?.displayName || getFriendlyFilename(file?.filename) || 'ملف';
const normalizeId = (id) => (id ? String(id) : null);

const getMediaFolderStorageKey = (adminSession) => {
  const rawUserKey =
    adminSession?.user?.id ||
    adminSession?.user?.email ||
    adminSession?.email ||
    'anonymous';
  const userKey = encodeURIComponent(String(rawUserKey).trim().toLowerCase());
  return `${LAST_MEDIA_FOLDER_STORAGE_KEY}:${userKey}`;
};

const readLastFolderId = (storageKey) => {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeId(
      window.localStorage.getItem(storageKey) ||
      window.localStorage.getItem(LAST_MEDIA_FOLDER_STORAGE_KEY)
    );
  } catch {
    return null;
  }
};

const saveLastFolderId = (folderId, storageKey) => {
  if (typeof window === 'undefined') return;
  try {
    const normalizedFolderId = normalizeId(folderId);
    if (normalizedFolderId) {
      window.localStorage.setItem(storageKey, normalizedFolderId);
    } else {
      window.localStorage.removeItem(storageKey);
    }
    window.localStorage.removeItem(LAST_MEDIA_FOLDER_STORAGE_KEY);
  } catch {
    // Ignore storage errors; folder persistence is only a convenience.
  }
};

function buildTree(folders) {
  const nodes = new Map();
  (folders || []).forEach((folder) => {
    nodes.set(folder.id, { ...folder, children: [] });
  });

  const roots = [];
  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (items) => {
    items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
    items.forEach((item) => sortNodes(item.children || []));
    return items;
  };

  return sortNodes(roots);
}

function flattenFolders(folders) {
  const result = [];
  const visit = (items, depth = 0) => {
    items.forEach((folder) => {
      result.push({ ...folder, depth });
      visit(folder.children || [], depth + 1);
    });
  };
  visit(folders);
  return result;
}

function getFolderAncestors(foldersById, folderId) {
  const ancestors = [];
  let current = foldersById.get(folderId);
  while (current) {
    ancestors.unshift(current);
    current = current.parentId ? foldersById.get(current.parentId) : null;
  }
  return ancestors;
}

const FolderStateIcon = ({ isSelected, isExpanded }) => {
  if (isSelected || isExpanded) {
    return (
      <span className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${isExpanded ? 'bg-sky-50 text-sky-500 ring-1 ring-sky-100' : 'text-blue-500'}`}>
        <FolderOpen size={17} />
      </span>
    );
  }

  return <Folder size={17} className="shrink-0 text-slate-400" />;
};

const FolderTreeNode = ({ folder, selectedFolderId, expandedIds, onToggle, onSelect, onDelete, depth = 0 }) => {
  const hasChildren = (folder.children || []).length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const rowStateClassName = isSelected
    ? 'bg-blue-50 text-blue-700'
    : 'text-slate-700 hover:bg-slate-100';

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-xl px-2 py-2 text-sm transition-colors ${rowStateClassName}`}
        style={{ paddingInlineStart: `${8 + depth * 14}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(folder.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white"
        >
          {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />) : <span className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => onSelect(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 text-right font-black">
          <FolderStateIcon isSelected={isSelected} isExpanded={hasChildren && isExpanded} />
          <span className="truncate">{folder.name}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(folder)}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 group-hover:flex"
            title="Delete folder"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {folder.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MediaLibraryModal = ({ isOpen, onClose, onSelect, initialType = '' }) => {
  const [files, setFiles] = useState([]);
  const [mediaFolders, setMediaFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('current');
  const [selectedType, setSelectedType] = useState(initialType);
  const { adminSession } = useTherapyStore();
  const mediaFolderStorageKey = useMemo(() => getMediaFolderStorageKey(adminSession), [adminSession]);
  const [selectedFolderId, setSelectedFolderId] = useState(() => readLastFolderId(mediaFolderStorageKey));
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [moveTargetId, setMoveTargetId] = useState(null);
  const [movePanelOpen, setMovePanelOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef(null);
  const userRole = adminSession?.user?.role;
  const canDeleteMedia = hasPermission(userRole, PERMISSIONS.FILES_DELETE);
  const canOrganizeMedia = userRole !== 'DATA_ENTRY';

  const tree = useMemo(() => buildTree(mediaFolders), [mediaFolders]);
  const flatFolders = useMemo(() => flattenFolders(tree), [tree]);
  const foldersById = useMemo(() => new Map(mediaFolders.map((folder) => [folder.id, folder])), [mediaFolders]);
  const selectedFolder = selectedFolderId ? foldersById.get(selectedFolderId) : GENERAL_FOLDER;
  const breadcrumb = useMemo(() => [GENERAL_FOLDER, ...getFolderAncestors(foldersById, selectedFolderId)], [foldersById, selectedFolderId]);
  const selectedFiles = useMemo(() => files.filter((file) => selectedKeys.has(file.key || file.id || file.filename)), [files, selectedKeys]);
  const childFolders = useMemo(() => {
    if (searchScope !== 'current') return [];
    const currentParentId = normalizeId(selectedFolderId);
    return mediaFolders
      .filter((folder) => normalizeId(folder.parentId) === currentParentId)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
  }, [mediaFolders, searchScope, selectedFolderId]);

  const fetchMedia = async () => {
    const folderParam = searchScope === 'all' ? undefined : (selectedFolderId || GENERAL_FOLDER_ID);
    const [filesRes, foldersRes] = await Promise.all([
      gameService.getUploadedFiles(adminSession?.token, selectedType, searchQuery, '', {
        folderId: folderParam,
        scope: searchScope,
      }),
      gameService.getMediaFolders(adminSession?.token),
    ]);

    setFiles(filesRes?.data || []);
    setMediaFolders(foldersRes?.data || []);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const run = async () => {
      try {
        setLoading(true);
        await fetchMedia();
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(run, 250);
    return () => clearTimeout(debounce);
  }, [isOpen, adminSession?.token, selectedType, searchQuery, searchScope, selectedFolderId, refreshTrigger]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFolderId(readLastFolderId(mediaFolderStorageKey));
    setExpandedIds(new Set());
  }, [isOpen, mediaFolderStorageKey]);

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [selectedFolderId, selectedType, searchQuery, searchScope]);

  useEffect(() => {
    if (!isOpen) return;

    const normalizedFolderId = normalizeId(selectedFolderId);
    if (normalizedFolderId && !loading && !foldersById.has(normalizedFolderId)) {
      setSelectedFolderId(null);
      saveLastFolderId(null, mediaFolderStorageKey);
      return;
    }

    saveLastFolderId(normalizedFolderId, mediaFolderStorageKey);

    if (normalizedFolderId) {
      const ancestorIds = getFolderAncestors(foldersById, normalizedFolderId)
        .map((folder) => folder.id)
        .filter(Boolean);
      setExpandedIds((current) => new Set([...current, ...ancestorIds]));
    }
  }, [foldersById, isOpen, loading, mediaFolderStorageKey, selectedFolderId]);

  if (!isOpen) return null;

  const refresh = () => setRefreshTrigger((value) => value + 1);

  const handleSelectFolder = (folderId) => {
    const nextFolderId = normalizeId(folderId);
    setSelectedFolderId(nextFolderId);
    setSearchScope('current');
    setMovePanelOpen(false);
    if (nextFolderId) {
      setExpandedIds((current) => new Set([...current, nextFolderId]));
    }
  };

  const toggleExpanded = (folderId) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleAddFolder = async () => {
    const name = String(newFolderName || '').trim();
    if (!name) {
      setDialog({ title: 'اكتب اسم الفولدر', message: 'اكتب اسم الفولدر قبل إضافته.', confirmText: 'حسنًا', hideCancelButton: true });
      return;
    }

    try {
      const res = await gameService.createMediaFolder(adminSession?.token, {
        name,
        parentId: selectedFolderId || null,
      });
      const folder = res?.data;
      if (folder) {
        setMediaFolders((current) => [...current.filter((item) => item.id !== folder.id), folder]);
        setSelectedFolderId(folder.id);
        if (folder.parentId) {
          setExpandedIds((current) => new Set([...current, folder.parentId]));
        }
      }
      setNewFolderName('');
      setIsAddingFolder(false);
      refresh();
    } catch (error) {
      console.error('Failed to create media folder:', error);
      setDialog({ title: 'تعذر إضافة الفولدر', message: error?.response?.data?.message || 'حدث خطأ أثناء إضافة الفولدر. حاول مرة أخرى.', confirmText: 'حسنًا', hideCancelButton: true });
    }
  };

  const requestDeleteFolder = (folder) => {
    if (!folder?.id) return;
    setDialog({
      type: 'deleteFolder',
      folder,
      title: 'حذف الفولدر',
      message: 'يمكن حذف الفولدر الفارغ فقط. لو بداخله ملفات أو فولدرات انقلها أولًا.',
      confirmText: 'حذف الفولدر',
      cancelText: 'إلغاء',
      isDestructive: true,
    });
  };

  const handleDeleteFolder = async (folder) => {
    try {
      await gameService.deleteMediaFolder(adminSession?.token, folder.id);
      setMediaFolders((current) => current.filter((item) => item.id !== folder.id));
      if (selectedFolderId === folder.id) setSelectedFolderId(folder.parentId || null);
      refresh();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setDialog({ title: 'تعذر حذف الفولدر', message: error?.response?.data?.message || 'انقل الملفات والفولدرات الموجودة بداخله ثم حاول مرة أخرى.', confirmText: 'حسنًا', hideCancelButton: true });
    }
  };

  const handleFileUpload = async (event) => {
    const selectedUploadFiles = Array.from(event.target.files || []);
    if (!selectedUploadFiles.length) return;

    try {
      setIsUploading(true);
      let uploadedCount = 0;
      let failedCount = 0;

      for (const file of selectedUploadFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (selectedFolderId) formData.append('folderId', selectedFolderId);
          await gameService.uploadAsset(adminSession?.token, formData);
          uploadedCount += 1;
        } catch (uploadError) {
          failedCount += 1;
          console.error('Failed to upload file:', file?.name, uploadError);
        }
      }

      if (uploadedCount > 0) {
        setSearchScope('current');
        setSearchQuery('');
        refresh();
      }

      if (failedCount > 0) {
        setDialog({
          title: uploadedCount > 0 ? 'تم رفع بعض الملفات' : 'تعذر الرفع',
          message: uploadedCount > 0 ? `تم رفع ${uploadedCount} ملف، وتعذر رفع ${failedCount} ملف.` : 'تعذر رفع الملفات. حاول مرة أخرى.',
          confirmText: 'حسنًا',
          hideCancelButton: true,
        });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFileSelection = (file) => {
    const key = file.key || file.id || file.filename;
    if (!key) return;
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMoveFiles = async () => {
    if (!selectedFiles.length) return;

    try {
      await gameService.moveUploadedFiles(adminSession?.token, {
        folderId: moveTargetId || null,
        assets: selectedFiles.map((file) => ({
          key: file.key,
          url: file.url,
          thumbnail: file.thumbnail,
          filename: file.filename,
          displayName: file.displayName,
          originalName: file.originalName,
          type: file.type,
          mimeType: file.mimeType,
          size: file.size,
          source: file.source,
        })),
      });
      setSelectedKeys(new Set());
      setMovePanelOpen(false);
      setSelectedFolderId(moveTargetId || null);
      setSearchScope('current');
      refresh();
    } catch (error) {
      console.error('Failed to move files:', error);
      setDialog({ title: 'تعذر نقل الملفات', message: 'حدث خطأ أثناء نقل الملفات. حاول مرة أخرى.', confirmText: 'حسنًا', hideCancelButton: true });
    }
  };

  const requestDeleteFile = (file) => {
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

  const handleDeleteFile = async (file) => {
    const fileKey = file?.key || file?.id || file?.filename;
    if (!fileKey) return;

    try {
      await gameService.deleteUploadedFile(adminSession?.token, fileKey);
      setFiles((current) => current.filter((item) => String(item.key || item.id || item.filename) !== String(fileKey)));
      setSelectedKeys((current) => {
        const next = new Set(current);
        next.delete(fileKey);
        return next;
      });
      setDialog(null);
    } catch (error) {
      console.error('Failed to delete uploaded file:', error);
      setDialog({ title: 'تعذر حذف الملف', message: 'حدث خطأ أثناء حذف الملف. حاول مرة أخرى.', confirmText: 'حسنًا', hideCancelButton: true });
    }
  };

  const handleDialogConfirm = async () => {
    if (dialog?.type === 'deleteFile') {
      await handleDeleteFile(dialog.file);
      return;
    }
    if (dialog?.type === 'deleteFolder') {
      await handleDeleteFolder(dialog.folder);
      return;
    }
    setDialog(null);
  };

  const handlePickFile = (file) => {
    onSelect(file.url);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex h-full max-h-[84vh] w-full max-w-[88vw] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5">
          <h2 className="text-xl font-black text-slate-800 md:text-2xl">مكتبة الوسائط</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-l border-slate-100 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="font-black text-slate-800">الفولدرات</div>
              {canOrganizeMedia && (
                <button type="button" onClick={() => setIsAddingFolder((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700" title="إضافة فولدر">
                  <Plus size={18} />
                </button>
              )}
            </div>

            {canOrganizeMedia && isAddingFolder && (
              <div className="mb-3 rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddFolder();
                    }
                  }}
                  placeholder="اسم الفولدر"
                  className="mb-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
                />
                <button type="button" onClick={handleAddFolder} className="h-10 w-full rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                  حفظ داخل {selectedFolder?.name || 'عام'}
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleSelectFolder(null)}
                className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-sm font-black transition-colors ${!selectedFolderId ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {!selectedFolderId ? <FolderOpen size={18} className="text-blue-500" /> : <Folder size={18} className="text-slate-400" />}
                عام
              </button>

              <div className="space-y-1">
                {tree.map((folder) => (
                  <FolderTreeNode
                    key={folder.id}
                    folder={folder}
                    selectedFolderId={selectedFolderId}
                    expandedIds={expandedIds}
                    onToggle={toggleExpanded}
                    onSelect={handleSelectFolder}
                    onDelete={canDeleteMedia ? requestDeleteFolder : null}
                  />
                ))}
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col bg-white">
            <div className="border-b border-slate-100 p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-black text-slate-600">
                <span>المكتبة</span>
                {breadcrumb.map((folder, index) => (
                  <React.Fragment key={folder.id || 'general'}>
                    <ChevronLeft size={16} className="text-slate-300" />
                    <button type="button" onClick={() => handleSelectFolder(folder.id)} className={`rounded-lg px-2 py-1 ${index === breadcrumb.length - 1 ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}>
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_auto_auto] xl:items-center">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="ابحث عن ملف..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-12 w-full rounded-2xl border-none bg-slate-100 py-3 pl-4 pr-12 text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex rounded-2xl bg-slate-100 p-1">
                  {TYPE_OPTIONS.map((typeOption) => {
                    const Icon = typeOption.icon;
                    return (
                      <button
                        key={typeOption.value || 'all'}
                        type="button"
                        onClick={() => setSelectedType(typeOption.value)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all md:flex-none ${selectedType === typeOption.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {Icon && <Icon size={18} />}
                        {typeOption.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex rounded-2xl bg-slate-100 p-1">
                  {[
                    { value: 'current', label: 'الفولدر الحالي' },
                    { value: 'all', label: 'كل المكتبة' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSearchScope(option.value)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-black transition-all ${searchScope === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-700">
                  <FolderOpen size={18} className="text-blue-500" />
                  الرفع داخل:
                  <span className="rounded-xl bg-white px-3 py-2 text-blue-700 shadow-sm">{selectedFolder?.name || 'عام'}</span>
                  {selectedKeys.size > 0 && <span className="rounded-xl bg-white px-3 py-2 text-slate-600 shadow-sm">محدد {selectedKeys.size}</span>}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {canOrganizeMedia && selectedKeys.size > 0 && (
                    <button type="button" onClick={() => setMovePanelOpen((value) => !value)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50">
                      <MoveRight size={17} />
                      نقل إلى فولدر
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,audio/*,video/*" multiple />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {isUploading ? <LoaderCircle size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                    {isUploading ? 'جاري الرفع...' : 'رفع ملف جديد'}
                  </button>
                </div>
              </div>

              {canOrganizeMedia && movePanelOpen && (
                <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 text-sm font-black text-slate-700">اختر الفولدر الجديد</div>
                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    <button type="button" onClick={() => setMoveTargetId(null)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black ${moveTargetId === null ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      {moveTargetId === null && <Check size={16} />}
                      عام
                    </button>
                    {flatFolders.map((folder) => (
                      <button key={folder.id} type="button" onClick={() => setMoveTargetId(folder.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black ${moveTargetId === folder.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`} style={{ paddingInlineStart: `${12 + folder.depth * 12}px` }}>
                        {moveTargetId === folder.id && <Check size={16} />}
                        <Folder size={16} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setMovePanelOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 hover:bg-slate-50">إلغاء</button>
                    <button type="button" onClick={handleMoveFiles} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700">نقل الملفات</button>
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-blue-500">
                  <LoaderCircle size={40} className="animate-spin" />
                  <p className="font-bold text-slate-500">جاري تحميل الوسائط...</p>
                </div>
              ) : childFolders.length === 0 && files.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                  <ImageIcon size={60} className="opacity-20" />
                  <p className="text-lg font-bold">لا توجد ملفات مطابقة</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {childFolders.length > 0 && (
                    <section>
                      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                        <FolderOpen size={18} className="text-blue-500" />
                        <span>فولدرات داخل {selectedFolder?.name || 'عام'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {childFolders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => handleSelectFolder(folder.id)}
                            className="group flex aspect-[1.25] flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                              <FolderOpen size={30} />
                            </span>
                            <span className="w-full truncate text-sm font-black text-slate-700">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {files.length > 0 && (
                    <section>
                      {childFolders.length > 0 && (
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                          <ImageIcon size={18} className="text-blue-500" />
                          <span>الصور والملفات</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {files.map((file) => {
                          const key = file.key || file.id || file.filename;
                          const isSelected = selectedKeys.has(key);
                          return (
                            <div key={key} className={`group relative flex aspect-square flex-col overflow-hidden rounded-2xl border bg-white text-right transition-all ${isSelected ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-lg'}`}>
                              <button type="button" onClick={() => toggleFileSelection(file)} className={`absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 bg-white/95 text-slate-400 hover:text-blue-600'}`} title="تحديد الملف">
                                {isSelected && <Check size={17} />}
                              </button>
                              {canDeleteMedia && (
                                <button type="button" onClick={() => requestDeleteFile(file)} className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-500 opacity-100 shadow-sm ring-1 ring-red-100 transition-colors hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100" title="حذف الملف">
                                  <Trash2 size={15} />
                                </button>
                              )}
                              {searchScope === 'all' && file.folderName && (
                                <span className="absolute bottom-12 left-2 z-10 max-w-[75%] truncate rounded-full bg-white/95 px-2 py-1 text-[0.65rem] font-black text-blue-600 shadow-sm">{file.folderName}</span>
                              )}
                              <button type="button" onClick={() => handlePickFile(file)} className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-50 p-2">
                                {file.type === 'image' ? (
                                  <img src={file.url} alt={file.filename} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" loading="lazy" />
                                ) : file.type === 'audio' ? (
                                  <Music size={42} className="text-slate-300" />
                                ) : file.type === 'video' ? (
                                  <Video size={42} className="text-slate-300" />
                                ) : (
                                  <ImageIcon size={42} className="text-slate-300" />
                                )}
                              </button>
                              <div className="border-t border-slate-100 bg-white p-3">
                                <p className="w-full truncate text-xs font-bold text-slate-600" dir="ltr" title={file.key || file.filename}>{getDisplayFilename(file)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </main>
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
