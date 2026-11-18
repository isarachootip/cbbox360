export declare const CORE_PERMISSIONS: {
  readonly WILDCARD: '*';
  readonly CONTACT_READ: 'contact:read';
  readonly CONTACT_WRITE: 'contact:write';
  readonly CONTACT_PII_READ: 'contact.pii:read';
  readonly CONTACT_SENSITIVE_READ: 'contact.pdpa_s26:read';
  readonly CONTACT_SENSITIVE_WRITE: 'contact.pdpa_s26:write';
  readonly CASE_READ: 'case:read';
  readonly CASE_WRITE: 'case:write';
  readonly INBOX_READ: 'inbox:read';
  readonly INBOX_WRITE: 'inbox:write';
  readonly ADMIN_SETTINGS: 'admin:settings';
  readonly ADMIN_USERS: 'admin:users';
  readonly ADMIN_TEMPLATES: 'admin:templates';
};

export declare const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]>;
export declare function registerDefaultRolePreset(roleKey: string, permissions: string[]): void;
export declare function matchPermission(granted: string[], required: string): boolean;
