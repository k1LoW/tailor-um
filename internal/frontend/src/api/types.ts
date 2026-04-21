export interface FieldInfo {
  name: string;
  type: string;
  required: boolean;
  array: boolean;
  description?: string;
  allowedValues?: string[];
  fields?: Record<string, FieldInfo>;
}

export interface AppConfig {
  appName: string;
  typeName: string;
  pluralForm: string;
  fields: Record<string, FieldInfo>;
  hasBuiltInIdP: boolean;
  idpConfigName?: string;
  usernameField?: string;
  usernameClaim?: string;
}

export interface UserProfile {
  id: string;
  [key: string]: unknown;
}

export interface IdPUser {
  id: string;
  name: string;
  disabled: boolean;
}

export interface PaginatedResponse<T> {
  collection: T[];
  totalCount: number;
}
