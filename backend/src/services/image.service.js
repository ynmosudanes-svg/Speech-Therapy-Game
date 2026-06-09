const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const DEFAULT_FILTER_SUFFIX = 'educational flashcard for kids isolated on white background single object clean background';
const ARABIC_CHARACTERS_REGEX = /[\u0600-\u06FF]/;
const CHILD_FRIENDLY_ENGLISH_TERMS = {
  boy: 'young boy kid',
  girl: 'young girl kid',
  child: 'kid child',
  children: 'kids child',
  kid: 'kid child',
  kids: 'kids child',
  baby: 'baby toddler kid',
};
const ARABIC_IMAGE_DICTIONARY = {
  'تفاحة': 'apple',
  'تفاح': 'apple',
  'موز': 'banana',
  'موزه': 'banana',
  'موزة': 'banana',
  'سمكة': 'fish',
  'سمك': 'fish',
  'قطة': 'cat',
  'قطه': 'cat',
  'قط': 'cat',
  'كلب': 'dog',
  'أرنب': 'rabbit',
  'ارنب': 'rabbit',
  'ملعقة': 'spoon',
  'ملعقه': 'spoon',
  'معلقة': 'spoon',
  'معلقه': 'spoon',
  'سيارة': 'car',
  'سياره': 'car',
  'عربية': 'car',
  'عربيه': 'car',
  'شجرة': 'tree',
  'شجره': 'tree',
  'زهرة': 'flower',
  'زهره': 'flower',
  'وردة': 'flower',
  'ورده': 'flower',
  'كرة': 'ball',
  'كره': 'ball',
  'باب': 'door',
  'كرسي': 'chair',
  'طاولة': 'table',
  'طاوله': 'table',
  'قلم': 'pen',
  'قلم رصاص': 'pencil',
  'رصاص': 'pencil',
};

function normalizeArabicText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function translateArabicQuery(query) {
  const normalized = normalizeArabicText(query);

  if (!ARABIC_CHARACTERS_REGEX.test(normalized)) {
    return String(query || '').trim();
  }

  if (ARABIC_IMAGE_DICTIONARY[normalized]) {
    return ARABIC_IMAGE_DICTIONARY[normalized];
  }

  const translatedWords = normalized
    .split(' ')
    .map((word) => ARABIC_IMAGE_DICTIONARY[word] || word)
    .filter(Boolean);

  return translatedWords.join(' ').trim() || String(query || '').trim();
}

function ensureSearchProviderConfigured(requestedProvider = '') {
  const provider = String(requestedProvider || env.imageSearchProvider || 'pexels').toLowerCase();

  if (!['pexels', 'pixabay'].includes(provider)) {
    throw new ApiError(422, 'Unsupported image search provider.');
  }

  if (provider === 'pexels' && !env.pexelsApiKey) {
    throw new ApiError(500, 'PEXELS_API_KEY is not configured.');
  }

  if (provider === 'pixabay' && !env.pixabayApiKey) {
    throw new ApiError(500, 'PIXABAY_API_KEY is not configured.');
  }

  return provider;
}

function buildSmartQuery(query) {
  const translated = translateArabicQuery(query);
  const normalized = String(translated || '')
    .trim()
    .split(/\s+/)
    .map((word) => CHILD_FRIENDLY_ENGLISH_TERMS[word.toLowerCase()] || word)
    .join(' ');
  if (!normalized) {
    throw new ApiError(422, 'Search query is required.');
  }

  if (normalized.toLowerCase().includes(DEFAULT_FILTER_SUFFIX)) {
    return normalized;
  }

  return `${normalized} ${DEFAULT_FILTER_SUFFIX}`;
}

async function searchPexels(query) {
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '24');
  url.searchParams.set('orientation', 'square');

  const response = await fetch(url, {
    headers: {
      Authorization: env.pexelsApiKey,
    },
  });

  if (!response.ok) {
    throw new ApiError(502, 'Pexels search failed.');
  }

  const data = await response.json();
  return Array.isArray(data?.photos)
    ? data.photos
        .map((photo) => ({
          url: photo?.src?.large2x || photo?.src?.large || photo?.src?.original || '',
          thumbnail: photo?.src?.medium || photo?.src?.small || '',
          source: 'pexels',
        }))
        .filter((item) => item.url && item.thumbnail)
    : [];
}

async function searchPixabay(query) {
  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key', env.pixabayApiKey);
  url.searchParams.set('q', query);
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('per_page', '24');
  url.searchParams.set('safesearch', 'true');
  url.searchParams.set('editors_choice', 'true');
  url.searchParams.set('order', 'popular');

  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(502, 'Pixabay search failed.');
  }

  const data = await response.json();
  return Array.isArray(data?.hits)
    ? data.hits
        .map((item) => ({
          url: item?.largeImageURL || item?.webformatURL || '',
          thumbnail: item?.previewURL || item?.webformatURL || '',
          source: 'pixabay',
        }))
        .filter((item) => item.url && item.thumbnail)
    : [];
}

async function searchImages(rawQuery, requestedProvider = '') {
  const provider = ensureSearchProviderConfigured(requestedProvider);
  const query = buildSmartQuery(rawQuery);

  if (provider === 'pixabay') {
    return searchPixabay(query);
  }

  return searchPexels(query);
}

function normalizeCategory(category) {
  const value = String(category || '').trim().toLowerCase();
  return value || null;
}

async function saveImage(payload) {
  const url = String(payload?.url || '').trim();
  const thumbnail = String(payload?.thumbnail || '').trim();
  const source = String(payload?.source || '').trim().toLowerCase() || null;

  if (!url || !thumbnail) {
    throw new ApiError(422, 'Image url and thumbnail are required.');
  }

  return prisma.imageLibrary.upsert({
    where: { url },
    update: {
      thumbnail,
      category: normalizeCategory(payload?.category),
      source,
    },
    create: {
      url,
      thumbnail,
      category: normalizeCategory(payload?.category),
      source,
    },
  });
}

async function listLibrary({ category, query }) {
  const normalizedCategory = normalizeCategory(category);
  const normalizedQuery = String(query || '').trim();

  return prisma.imageLibrary.findMany({
    where: {
      ...(normalizedCategory ? { category: normalizedCategory } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              { category: { contains: normalizedQuery, mode: 'insensitive' } },
              { url: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });
}

async function deleteImage(id) {
  const normalizedId = String(id || '').trim();

  if (!normalizedId) {
    throw new ApiError(422, 'Image id is required.');
  }

  const existingImage = await prisma.imageLibrary.findUnique({
    where: { id: normalizedId },
  });

  if (!existingImage) {
    throw new ApiError(404, 'Image not found in library.');
  }

  await prisma.imageLibrary.delete({
    where: { id: normalizedId },
  });

  return existingImage;
}

module.exports = {
  searchImages,
  saveImage,
  listLibrary,
  deleteImage,
};
