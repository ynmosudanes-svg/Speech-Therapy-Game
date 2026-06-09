function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const normalized = String(role).trim().toUpperCase();

  if (normalized === 'ADMIN' || normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  if (normalized === 'DOCTOR' || normalized === 'THERAPIST') {
    return 'THERAPIST';
  }

  if (normalized === 'STUDENT') {
    return 'STUDENT';
  }

  return normalized;
}

module.exports = {
  normalizeRole,
};
