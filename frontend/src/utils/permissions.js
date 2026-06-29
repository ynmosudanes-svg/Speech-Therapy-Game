export const PERMISSIONS = {
  GAMES_CREATE: 'games:create',
  GAMES_UPDATE_OWN_DRAFT: 'games:update_own_draft',
  GAMES_UPDATE_ANY: 'games:update_any',
  GAMES_SUBMIT_REVIEW: 'games:submit_review',
  GAMES_EDUCATIONAL_REVIEW: 'games:educational_review',
  GAMES_APPROVE_CONTENT: 'games:approve_content',
  GAMES_PUBLISH: 'games:publish',
  GAMES_ARCHIVE: 'games:archive',
  GAMES_RESTORE: 'games:restore',
  GAMES_PERMANENT_DELETE: 'games:permanent_delete',
  FILES_UPLOAD: 'files:upload',
  FILES_DELETE: 'files:delete',
  AUDIT_VIEW: 'audit:view',
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.GAMES_CREATE,
    PERMISSIONS.GAMES_UPDATE_ANY,
    PERMISSIONS.GAMES_PUBLISH,
    PERMISSIONS.GAMES_ARCHIVE,
    PERMISSIONS.GAMES_RESTORE,
    PERMISSIONS.FILES_UPLOAD,
  ],
  DATA_ENTRY: [
    PERMISSIONS.GAMES_CREATE,
    PERMISSIONS.GAMES_UPDATE_OWN_DRAFT,
    PERMISSIONS.GAMES_SUBMIT_REVIEW,
    PERMISSIONS.FILES_UPLOAD,
  ],
  THERAPIST: [
    PERMISSIONS.GAMES_EDUCATIONAL_REVIEW,
    PERMISSIONS.GAMES_APPROVE_CONTENT,
    PERMISSIONS.GAMES_UPDATE_OWN_DRAFT,
    PERMISSIONS.FILES_UPLOAD,
  ],
  PARENT: [],
  STUDENT: [],
};

export function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}