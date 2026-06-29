function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const normalized = String(role).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  if (normalized === 'DATAENTRY' || normalized === 'DATA_ENTRY') {
    return 'DATA_ENTRY';
  }

  if (normalized === 'DOCTOR' || normalized === 'SPECIALIST' || normalized === 'THERAPIST') {
    return 'THERAPIST';
  }

  if (normalized === 'ADMIN') {
    return 'ADMIN';
  }

  if (normalized === 'STUDENT') {
    return 'STUDENT';
  }

  return normalized;
}

module.exports = {
  normalizeRole,
};