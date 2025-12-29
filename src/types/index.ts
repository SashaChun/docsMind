export interface Company {
  id: number;
  name: string;
  edrpou: string;
  director: string;
  accountant: string;
  phone: string;
  email: string;
}

export interface Document {
  id: number;
  companyId: number;
  name: string;
  category: 'statutory' | 'tax' | 'personal';
  createdAt: string;
  updatedAt?: string;
}

export interface SharedData {
  type: 'file' | 'folder';
  item?: Document;
  items?: Document[];
  companyName: string;
}

export type ViewType = 'login' | 'dashboard' | 'shared';
export type CategoryType = 'all' | 'statutory' | 'tax' | 'personal';

export interface SharedDocumentInfo {
  id: number;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
  company?: {
    id: number;
    name: string;
  };
}

export interface ShareMeta {
  token: string;
  type: 'document_public' | 'document_private';
  expiresAt: string;
  accessCount: number;
  targetEmail?: string | null;
}

export interface SharePayload {
  share: ShareMeta;
  document: SharedDocumentInfo;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivedShare {
  id: number;
  token: string;
  type: 'document_public' | 'document_private';
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  from: {
    id: number;
    email: string;
    name: string;
  };
  document: SharedDocumentInfo;
}
