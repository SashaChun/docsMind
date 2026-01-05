const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      console.log('uploadFile called with:', {
        endpoint,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        additionalData,
      });

      const formData = new FormData();
      formData.append('file', file);

      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Log FormData contents
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type,
          });
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: this.token ? `Bearer ${this.token}` : '',
        } as HeadersInit,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async uploadMultipleFiles<T>(
    endpoint: string,
    files: File[],
    additionalData: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      console.log('uploadMultipleFiles called with:', {
        endpoint,
        filesCount: files.length,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        additionalData,
      });

      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file);
      });

      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: this.token ? `Bearer ${this.token}` : '',
        } as HeadersInit,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

export const apiClient = new ApiClient(API_URL);

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  getProfile: () => apiClient.get('/auth/profile'),
};

export const companiesApi = {
  create: (data: any) => apiClient.post('/companies', data),

  getAll: (page = 1, limit = 10) =>
    apiClient.get(`/companies?page=${page}&limit=${limit}`),

  getById: (id: number) => apiClient.get(`/companies/${id}`),

  update: (id: number, data: any) => apiClient.put(`/companies/${id}`, data),

  delete: (id: number) => apiClient.delete(`/companies/${id}`),
};

export const documentsApi = {
  upload: (file: File, name: string, category: string, companyId: number) =>
    apiClient.uploadFile('/documents', file, {
      name,
      category,
      companyId: companyId.toString(),
    }),

  uploadMultiple: (files: File[], name: string, category: string, companyId: number) =>
    apiClient.uploadMultipleFiles('/documents/multiple', files, {
      name,
      category,
      companyId: companyId.toString(),
    }),

  getAll: (companyId?: number, category?: string, page = 1, limit = 20) => {
    let query = `/documents?page=${page}&limit=${limit}`;
    if (companyId) query += `&companyId=${companyId}`;
    if (category && category !== 'all') query += `&category=${category}`;
    return apiClient.get(query);
  },

  getFolders: (companyId?: number, category?: string) => {
    let query = '/documents/folders?';
    if (companyId) query += `companyId=${companyId}&`;
    if (category && category !== 'all') query += `category=${category}`;
    return apiClient.get(query);
  },

  getById: (id: number) => apiClient.get(`/documents/${id}`),

  updateContent: (id: number, content: string) =>
    apiClient.put(`/documents/${id}/content`, { content }),

  moveToFolder: (documentId: number, folderId: number | null) =>
    apiClient.put(`/documents/${documentId}/move`, { folderId }),

  createFolder: (name: string, category: string, companyId: number) =>
    apiClient.post('/documents/folders', { name, category, companyId }),

  delete: (id: number) => apiClient.delete(`/documents/${id}`),

  deleteFolder: (id: number) => apiClient.delete(`/documents/folders/${id}`),
};

export const sharesApi = {
  createDocumentShare: (
    documentId: number,
    payload: { visibility: 'public' | 'private'; email?: string; expiresInMinutes?: number }
  ) => apiClient.post(`/shares/document/${documentId}`, payload),

  createFolderShare: (
    folderId: number,
    payload: { visibility: 'public' | 'private'; email?: string; expiresInMinutes?: number }
  ) => apiClient.post(`/shares/folder/${folderId}`, payload),

  createMultipleShare: (
    documentIds: number[],
    payload: { visibility: 'public' | 'private'; email?: string; expiresInMinutes?: number }
  ) => apiClient.post('/shares/multiple', { ...payload, documentIds }),

  getByToken: (token: string) => apiClient.get(`/shares/${token}`),

  getReceived: () => apiClient.get('/shares/received'),
};
