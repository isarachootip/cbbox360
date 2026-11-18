export interface TenantBranding {
  appName: string;
  logoUrl: string;
  iconUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor?: string;
}

export interface TenantFieldDefinition {
  id: string;
  entityType: string;
  key: string;
  label: string;
  type:
    | 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'datetime'
    | 'boolean' | 'select' | 'multiselect' | 'tags' | 'phone' | 'email' | 'object_list';
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    unique?: boolean;
    regex?: string;
    regexError?: string;
    min?: number;
    max?: number;
  };
  sensitivity?: 'normal' | 'pii' | 'pdpa_s26';
  acl?: {
    viewPerm?: string;
    editPerm?: string;
    redactMode?: 'hide' | 'mask' | 'flag_only';
  };
  ui?: {
    group?: string;
    order?: number;
    showInList?: boolean;
    variableKey?: string;
    alertBanner?: {
      whenNonEmpty: boolean;
      severity: 'info' | 'warning' | 'danger';
      prefix: string;
      redactedMessage?: string;
    };
  };
}

export interface TenantCaseCategory {
  slug: string;
  name: string;
  defaultQueue?: string;
}

export interface TenantRuntimeState {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  templateId: string | null;
  isControlPlane: boolean;
  branding: TenantBranding;
  entitlements: Record<string, boolean>;
  labels: Record<string, string>;
  permissions: string[];
  contactFieldDefs: TenantFieldDefinition[];
  caseCategories: TenantCaseCategory[];
  isLoaded: boolean;
}
