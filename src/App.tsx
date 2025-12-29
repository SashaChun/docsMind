import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  LoginScreen,
  RegisterScreen,
  SharedView,
  Dashboard,
  AddCompanyModal,
  AddDocumentModal,
  ShareDocumentModal,
  ProfileScreen,
} from './components';
import { EditCompanyModal } from './components/modals/EditCompanyModal.tsx';
import { DocumentView } from './components/DocumentView.tsx';
import { ShareDocumentView } from './components/ShareDocumentView.tsx';
import { DocumentEditor } from './components/DocumentEditor.tsx';
import { companiesApi, documentsApi, apiClient } from './services/api.ts';
import type { Company, Document, CategoryType, SharedData } from './types';

function App() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient.setToken(token);
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const companiesRes = await companiesApi.getAll();
      if (companiesRes.success && companiesRes.data) {
        setCompanies(companiesRes.data.companies);
      }

      const documentsRes = await documentsApi.getAll();
      if (documentsRes.success && documentsRes.data) {
        setDocuments(documentsRes.data.documents);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (newCompanyData: Omit<Company, 'id'>) => {
    try {
      const response = await companiesApi.create(newCompanyData);
      if (response.success && response.data) {
        setCompanies([...companies, response.data]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add company:', error);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditCompany(company);
    setShowEditModal(true);
  };

  const handleUpdateCompany = async (id: number, updatedData: Omit<Company, 'id'>) => {
    try {
      const response = await companiesApi.update(id, updatedData);
      if (response.success && response.data) {
        setCompanies(companies.map(c => c.id === id ? response.data : c));
        setShowEditModal(false);
        setEditCompany(null);
      }
    } catch (error) {
      console.error('Failed to update company:', error);
    }
  };

  const handleAddDocument = async (
    newDocData: Omit<Document, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
    file: File
  ) => {
    if (!selectedCompanyId) return;

    try {
      const response = await documentsApi.upload(
        file,
        newDocData.name,
        newDocData.category,
        selectedCompanyId
      );
      if (response.success && response.data) {
        setDocuments([...documents, response.data]);
        setShowDocModal(false);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleShareFile = (doc: Document) => {
    setShareDocument(doc);
    setShowShareModal(true);
  };

  const handleShareFolder = (company: Company) => {
    const companyDocs = documents.filter((d) => d.companyId === company.id);
    const data: SharedData = {
      type: 'folder',
      items: companyDocs,
      companyName: company.name,
    };
    setSharedData(data);
    alert('Посилання скопійовано! (Зараз відкриється режим перегляду для гостя)');
    navigate('/shared');
  };
  const handleViewDocument = (doc: Document) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleEditDocument = (doc: Document) => {
    navigate(`/documents/${doc.id}/edit`);
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      const response = await documentsApi.delete(doc.id);
      if (response.success) {
        setDocuments(documents.filter(d => d.id !== doc.id));
      } else {
        alert('Помилка при видаленні документа: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Не вдалося видалити документ');
    }
  };

  const isAuthenticated = !!localStorage.getItem('accessToken');

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginScreen
            onLogin={() => {
              loadData();
              navigate('/', { replace: true });
            }}
            onSwitchToRegister={() => navigate('/register')}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterScreen
            onRegister={() => {
              loadData();
              navigate('/', { replace: true });
            }}
            onSwitchToLogin={() => navigate('/login')}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <>
              <Dashboard
                companies={companies}
                documents={documents}
                selectedCompanyId={selectedCompanyId}
                activeCategory={activeCategory}
                onSelectCompany={setSelectedCompanyId}
                onCategoryChange={setActiveCategory}
                onLogout={() => {
                  apiClient.clearToken();
                  setSelectedCompanyId(null);
                  setActiveCategory('all');
                  setCompanies([]);
                  setDocuments([]);
                  navigate('/login');
                }}
                onAddCompany={() => setShowAddModal(true)}
                onEditCompany={handleEditCompany}
                onUploadDoc={() => setShowDocModal(true)}
                onShareDoc={handleShareFile}
                onShareFolder={handleShareFolder}
                onViewDoc={handleViewDocument}
                onEditDoc={handleEditDocument}
                onDeleteDoc={handleDeleteDocument}
              />

              <AddCompanyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddCompany}
              />

              <EditCompanyModal
                isOpen={showEditModal}
                company={editCompany}
                onClose={() => {
                  setShowEditModal(false);
                  setEditCompany(null);
                }}
                onSubmit={handleUpdateCompany}
              />

              <AddDocumentModal
                isOpen={showDocModal}
                onClose={() => setShowDocModal(false)}
                onSubmit={handleAddDocument}
              />
              <ShareDocumentModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                document={shareDocument}
              />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <RequireAuth>
            <DocumentView />
          </RequireAuth>
        }
      />
      <Route
        path="/documents/:id/edit"
        element={
          <RequireAuth>
            <DocumentEditor />
          </RequireAuth>
        }
      />
      <Route path="/share/:token" element={<ShareDocumentView />} />
      <Route
        path="/shared"
        element={
          <SharedView
            sharedData={sharedData}
            onExit={() => {
              setSharedData(null);
              navigate('/');
            }}
          />
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
