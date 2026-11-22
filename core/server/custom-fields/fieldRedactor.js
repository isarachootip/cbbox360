/**
 * fieldRedactor.js — Industry-agnostic Declarative Field Sensitivity & PDPA s.26 Redactor.
 * Replaces hard-coded `medicalAccessPolicy.js` by enforcing `sensitivity` and `acl` metadata
 * defined directly on `field_definitions`.
 */
import { matchPermission } from '../../shared/permissions.js';

const hasNonEmptyValue = (val) => {
  if (val === undefined || val === null || val === '' || val === false) return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

const formatDisplayValue = (val) => (Array.isArray(val) ? val.join(', ') : String(val));

const maskString = (val) => {
  const s = formatDisplayValue(val);
  if (s.length <= 4) return '••••';
  return `${s.slice(0, 2)}••••${s.slice(-2)}`;
};

const matchesAlertBanner = (bannerCfg, val, hasVal) => {
  if (!bannerCfg) return false;
  if (bannerCfg.whenNonEmpty && hasVal) return true;
  if (bannerCfg.whenEquals !== undefined && hasVal) {
    const targets = Array.isArray(bannerCfg.whenEquals)
      ? bannerCfg.whenEquals
      : [bannerCfg.whenEquals];
    const current = Array.isArray(val) ? val.map(String) : [String(val)];
    return targets.some((t) => current.includes(String(t)));
  }
  return false;
};

const resolveBannerText = (def, val, canView) => {
  if (!canView) {
    return def.ui.alertBanner.redactedMessage || `มีข้อมูล ${def.label} ที่จำกัดสิทธิ์การเข้าถึง`;
  }
  if (def.ui.alertBanner.message) return def.ui.alertBanner.message;
  if (Array.isArray(def.options)) {
    const matched = def.options.find((opt) => String(opt.value) === String(val));
    if (matched?.label) return matched.label;
  }
  return formatDisplayValue(val);
};

/**
 * Redacts custom field values for API responses based on caller permissions and emits declarative alert banners.
 */
export const redactCustomFields = async ({
  defs = [],
  values = {},
  grantedPermissions = [],
  onSensitiveAccess,
}) => {
  const safeValues = {};
  const redactedFlags = {};
  const banners = [];
  const accessedSensitiveKeys = [];

  for (const def of defs) {
    const val = values?.[def.key];
    const hasVal = hasNonEmptyValue(val);
    const viewPerm =
      def.acl?.viewPerm ||
      (def.sensitivity === 'pdpa_s26'
        ? 'contact.pdpa_s26:read'
        : def.sensitivity === 'pii'
          ? 'contact.pii:read'
          : null);

    const canView = !viewPerm || matchPermission(grantedPermissions, viewPerm);

    if (canView) {
      if (val !== undefined) safeValues[def.key] = val;
      if (hasVal && def.sensitivity === 'pdpa_s26') {
        accessedSensitiveKeys.push(def.key);
      }
    } else if (hasVal) {
      const mode = def.acl?.redactMode || 'mask';
      if (mode === 'flag_only') {
        redactedFlags[def.key] = { redacted: true, hasValue: true };
      } else if (mode === 'mask') {
        safeValues[def.key] = maskString(val);
      }
      // mode === 'hide' omits the field completely
    }

    if (matchesAlertBanner(def.ui?.alertBanner, val, hasVal)) {
      banners.push({
        fieldKey: def.key,
        severity: def.ui.alertBanner.severity || 'warning',
        prefix: def.ui.alertBanner.prefix || `${def.label}:`,
        text: resolveBannerText(def, val, canView),
        redacted: !canView,
      });
    }
  }

  if (accessedSensitiveKeys.length > 0 && typeof onSensitiveAccess === 'function') {
    await onSensitiveAccess(accessedSensitiveKeys);
  }

  return { values: safeValues, redactedFlags, banners };
};

const valuesEqual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Verifies that any modified custom field is permitted by the caller's granted permissions.
 */
export const verifyCustomFieldWriteAccess = ({
  defs = [],
  beforeValues = {},
  afterValues = {},
  grantedPermissions = [],
}) => {
  const forbiddenFields = [];
  const changedFields = [];

  for (const def of defs) {
    if (valuesEqual(beforeValues?.[def.key], afterValues?.[def.key])) continue;
    changedFields.push(def.key);

    const editPerm =
      def.acl?.editPerm ||
      (def.sensitivity === 'pdpa_s26' ? 'contact.pdpa_s26:write' : 'contact:write');

    const canEdit =
      matchPermission(grantedPermissions, editPerm) ||
      (def.sensitivity === 'pdpa_s26' &&
        matchPermission(grantedPermissions, 'contact.pdpa_s26:write'));

    if (!canEdit) {
      forbiddenFields.push(def.key);
    }
  }

  return {
    ok: forbiddenFields.length === 0,
    changedFields,
    forbiddenFields,
  };
};
