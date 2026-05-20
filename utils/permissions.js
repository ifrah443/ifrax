// utils/permissions.js
const ROLE_PERMISSIONS = {
  admin: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
    'vehicle:check_status',
    'finance:read', 'finance:update', 'finance:manage',
    'reports:view', 'settings:manage'
  ],
  registrar: [
    'vehicle:create', 'vehicle:read', 'vehicle:update',
    'vehicle:check_status',
    'reports:view'
  ],
  askeri: [
    'vehicle:check_status' // ONLY: lookup plate → view basic info + debt status
  ]
};

module.exports = { ROLE_PERMISSIONS };